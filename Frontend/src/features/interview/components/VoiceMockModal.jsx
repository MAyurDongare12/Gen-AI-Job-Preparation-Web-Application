import React, { useState, useEffect, useRef } from 'react';
import { evaluateMockAnswerApi } from '../services/interview.api';
import './VoiceMockModal.scss';

const PERSONAS = [
    {
        id: 'bar_raiser',
        name: 'FAANG Bar Raiser',
        title: 'Principal Engineer / Director',
        badge: 'Rigorous & Technical',
        desc: 'Demands system scale, edge cases, trade-offs, and quantified business impact.',
        avatarBg: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)',
        voiceRate: 1.0,
        voicePitch: 0.95
    },
    {
        id: 'startup_founder',
        name: 'YC Startup Founder',
        title: 'CEO & Head of Product',
        badge: 'High Velocity',
        desc: 'Evaluates bias for action, extreme ownership, speed, and 0-to-1 versatility.',
        avatarBg: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        voiceRate: 1.08,
        voicePitch: 1.05
    },
    {
        id: 'fintech_director',
        name: 'FinTech Managing Director',
        title: 'VP of Infrastructure',
        badge: 'Zero-Tolerance',
        desc: 'Scrutinizes data consistency, fault tolerance, transaction idempotency, and SLA risk.',
        avatarBg: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
        voiceRate: 0.98,
        voicePitch: 0.9
    }
];

const COMMON_FILLERS = ['um', 'uh', 'like', 'basically', 'you know', 'actually', 'literally', 'sort of', 'kind of', 'i mean'];

export default function VoiceMockModal({ isOpen, onClose, report, interviewId }) {
    const [selectedPersona, setSelectedPersona] = useState('bar_raiser');
    const [currentQuestion, setCurrentQuestion] = useState('');
    const [questionIndex, setQuestionIndex] = useState(0);
    const [allQuestions, setAllQuestions] = useState([]);
    const [isListening, setIsListening] = useState(false);
    const [speechSupported, setSpeechSupported] = useState(true);
    const [transcript, setTranscript] = useState('');
    const [manualAnswer, setManualAnswer] = useState('');
    const [useManualInput, setUseManualInput] = useState(false);
    const [isSpeakingAi, setIsSpeakingAi] = useState(false);
    const [isEvaluating, setIsEvaluating] = useState(false);
    const [currentEvaluation, setCurrentEvaluation] = useState(null);
    const [sessionHistory, setSessionHistory] = useState([]);
    const [isFinished, setIsFinished] = useState(false);
    const [soundEnabled, setSoundEnabled] = useState(true);

    // Live analytics state
    const [startTime, setStartTime] = useState(null);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [detectedFillers, setDetectedFillers] = useState({});
    const [totalFillerCount, setTotalFillerCount] = useState(0);
    const [wpm, setWpm] = useState(0);

    const recognitionRef = useRef(null);
    const timerRef = useRef(null);

    // Initialize question queue from report
    useEffect(() => {
        if (report) {
            const tech = (report.technicalQuestions || []).map(q => ({
                question: q.question,
                category: 'Technical',
                intention: q.intention
            }));
            const beh = (report.behavioralQuestions || []).map(q => ({
                question: q.question,
                category: 'Behavioral',
                intention: q.intention
            }));
            const merged = [...tech, ...beh];
            if (merged.length > 0) {
                setAllQuestions(merged);
                setCurrentQuestion(merged[0].question);
            } else {
                const fallbackQ = "Can you walk me through an architectural challenge you solved recently and the trade-offs you considered?";
                setAllQuestions([{ question: fallbackQ, category: 'Technical' }]);
                setCurrentQuestion(fallbackQ);
            }
        }
    }, [report]);

    // Check Speech Recognition support
    useEffect(() => {
        const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRec) {
            setSpeechSupported(false);
            setUseManualInput(true);
        }
    }, []);

    // Timer & Live analytics tracking
    useEffect(() => {
        if (isListening) {
            if (!startTime) setStartTime(Date.now());
            timerRef.current = setInterval(() => {
                setElapsedSeconds(prev => prev + 1);
            }, 1000);
        } else {
            clearInterval(timerRef.current);
        }
        return () => clearInterval(timerRef.current);
    }, [isListening, startTime]);

    // Analyze words, fillers, and WPM dynamically
    const activeText = useManualInput ? manualAnswer : transcript;

    useEffect(() => {
        if (!activeText.trim()) {
            setTotalFillerCount(0);
            setDetectedFillers({});
            setWpm(0);
            return;
        }

        const words = activeText.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '').split(/\s+/).filter(Boolean);
        const wordCount = words.length;

        // WPM calculation
        if (elapsedSeconds > 3) {
            const calculatedWpm = Math.round((wordCount / elapsedSeconds) * 60);
            setWpm(calculatedWpm);
        }

        // Filler detection
        const counts = {};
        let total = 0;
        COMMON_FILLERS.forEach(filler => {
            const regex = new RegExp(`\\b${filler}\\b`, 'gi');
            const matches = activeText.match(regex);
            if (matches && matches.length > 0) {
                counts[filler] = matches.length;
                total += matches.length;
            }
        });

        setDetectedFillers(counts);
        setTotalFillerCount(total);
    }, [activeText, elapsedSeconds]);

    // Speech Synthesis for Question Speaking
    const speakText = (text) => {
        if (!soundEnabled || !window.speechSynthesis) return;

        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        const persona = PERSONAS.find(p => p.id === selectedPersona) || PERSONAS[0];

        utterance.rate = persona.voiceRate || 1.0;
        utterance.pitch = persona.voicePitch || 1.0;

        const voices = window.speechSynthesis.getVoices();
        const englishVoices = voices.filter(v => v.lang.startsWith('en'));
        if (englishVoices.length > 0) {
            utterance.voice = englishVoices.find(v => v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Daniel') || v.name.includes('Samantha')) || englishVoices[0];
        }

        utterance.onstart = () => setIsSpeakingAi(true);
        utterance.onend = () => setIsSpeakingAi(false);
        utterance.onerror = () => setIsSpeakingAi(false);

        window.speechSynthesis.speak(utterance);
    };

    // Trigger AI speech when new question appears
    useEffect(() => {
        if (isOpen && currentQuestion && soundEnabled && !currentEvaluation) {
            const timer = setTimeout(() => {
                speakText(currentQuestion);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [currentQuestion, isOpen, soundEnabled]);

    // Cleanup audio on close
    useEffect(() => {
        if (!isOpen) {
            if (window.speechSynthesis) window.speechSynthesis.cancel();
            if (recognitionRef.current) {
                try { recognitionRef.current.stop(); } catch (_) {}
            }
            setIsListening(false);
            setIsSpeakingAi(false);
        }
    }, [isOpen]);

    // Toggle Microphone / Speech Recognition
    const toggleListening = () => {
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    };

    const startListening = () => {
        const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRec) {
            alert("Speech recognition is not supported in this browser. Please use the text input mode.");
            setUseManualInput(true);
            return;
        }

        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
            setIsSpeakingAi(false);
        }

        try {
            const recognition = new SpeechRec();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-US';

            recognition.onstart = () => {
                setIsListening(true);
                if (!startTime) setStartTime(Date.now());
            };

            recognition.onresult = (event) => {
                let interim = '';
                let final = '';
                for (let i = 0; i < event.results.length; i++) {
                    const trans = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        final += trans + ' ';
                    } else {
                        interim += trans;
                    }
                }
                setTranscript((final + interim).trim());
            };

            recognition.onerror = (event) => {
                console.warn("Speech recognition error:", event.error);
                if (event.error === 'not-allowed') {
                    alert("Microphone permission was denied. You can still type your answers using manual input mode.");
                    setUseManualInput(true);
                }
                setIsListening(false);
            };

            recognition.onend = () => {
                setIsListening(false);
            };

            recognitionRef.current = recognition;
            recognition.start();
        } catch (err) {
            console.error("Failed to start speech recognition:", err);
            setUseManualInput(true);
        }
    };

    const stopListening = () => {
        if (recognitionRef.current) {
            try {
                recognitionRef.current.stop();
            } catch (_) {}
        }
        setIsListening(false);
    };

    const handleResetAnswer = () => {
        stopListening();
        setTranscript('');
        setManualAnswer('');
        setElapsedSeconds(0);
        setStartTime(null);
        setWpm(0);
        setTotalFillerCount(0);
        setDetectedFillers({});
    };

    // Submit Answer for AI Persona Evaluation
    const handleSubmitAnswer = async () => {
        const finalAnswer = (useManualInput ? manualAnswer : transcript).trim();
        if (!finalAnswer) return;

        stopListening();
        setIsEvaluating(true);

        try {
            const res = await evaluateMockAnswerApi({
                interviewReportId: interviewId,
                persona: selectedPersona,
                question: currentQuestion,
                answer: finalAnswer,
                history: sessionHistory.map(h => ({ question: h.question, answer: h.answer })),
                targetRole: report?.title || 'Software Engineer'
            });

            if (res && res.evaluation) {
                const evalData = res.evaluation;
                setCurrentEvaluation(evalData);

                // Add to turn history
                setSessionHistory(prev => [
                    ...prev,
                    {
                        question: currentQuestion,
                        answer: finalAnswer,
                        evaluation: evalData,
                        wpm,
                        fillers: totalFillerCount
                    }
                ]);

                // Voice feedback from interviewer
                if (soundEnabled && evalData.interviewerReaction) {
                    speakText(evalData.interviewerReaction);
                }
            }
        } catch (err) {
            console.error("Evaluation failed:", err);
            alert("Could not evaluate answer. Please verify your connection and try again.");
        } finally {
            setIsEvaluating(false);
        }
    };

    // Proceed to Follow-Up Question
    const handleNextFollowUp = () => {
        if (!currentEvaluation) return;

        const nextQ = currentEvaluation.followUpQuestion;
        setCurrentQuestion(nextQ);
        setCurrentEvaluation(null);
        handleResetAnswer();
        setQuestionIndex(prev => prev + 1);
    };

    // Complete Mock Interview Session
    const handleFinishSession = () => {
        stopListening();
        if (window.speechSynthesis) window.speechSynthesis.cancel();
        setIsFinished(true);
    };

    // Restart fresh session
    const handleRestartSession = () => {
        setIsFinished(false);
        setCurrentEvaluation(null);
        setSessionHistory([]);
        setQuestionIndex(0);
        if (allQuestions.length > 0) {
            setCurrentQuestion(allQuestions[0].question);
        }
        handleResetAnswer();
    };

    if (!isOpen) return null;

    const currentPersonaObj = PERSONAS.find(p => p.id === selectedPersona) || PERSONAS[0];

    // Calculate session averages
    const avgScore = sessionHistory.length > 0
        ? Math.round(sessionHistory.reduce((acc, h) => acc + (h.evaluation?.score || 0), 0) / sessionHistory.length)
        : 0;

    return (
        <div className="voice-mock-overlay" onClick={onClose}>
            <div className="voice-mock-modal" onClick={e => e.stopPropagation()}>
                
                {/* ── Studio Header ── */}
                <div className="voice-mock-header">
                    <div className="header-left">
                        <div className="live-badge">
                            <span className="live-dot" />
                            <span>AI VOICE SIMULATION STUDIO</span>
                        </div>
                        <h2 className="studio-title">Interactive Mock Interview</h2>
                    </div>

                    <div className="header-actions">
                        <button
                            type="button"
                            className={`sound-toggle-btn ${soundEnabled ? 'sound-toggle-btn--on' : ''}`}
                            onClick={() => {
                                if (soundEnabled && window.speechSynthesis) window.speechSynthesis.cancel();
                                setSoundEnabled(!soundEnabled);
                            }}
                            title={soundEnabled ? "Mute AI Speech" : "Unmute AI Speech"}
                            aria-label="Toggle Sound"
                        >
                            {soundEnabled ? (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                            ) : (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
                            )}
                        </button>

                        <button type="button" className="close-btn" onClick={onClose} aria-label="Close modal">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                    </div>
                </div>

                {/* ── Persona Switcher ── */}
                <div className="persona-selection-bar">
                    <span className="persona-label">SELECT INTERVIEWER PERSONA:</span>
                    <div className="persona-chips">
                        {PERSONAS.map(p => (
                            <button
                                key={p.id}
                                type="button"
                                className={`persona-chip ${selectedPersona === p.id ? 'persona-chip--active' : ''}`}
                                onClick={() => {
                                    setSelectedPersona(p.id);
                                    if (soundEnabled && currentQuestion) speakText(currentQuestion);
                                }}
                            >
                                <span className="persona-chip-badge">{p.badge}</span>
                                <span className="persona-chip-name">{p.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {!isFinished ? (
                    <div className="voice-mock-body">
                        
                        {/* ── Question & AI Persona Stage ── */}
                        <div className="interviewer-stage">
                            <div className="interviewer-profile">
                                <div
                                    className={`interviewer-avatar ${isSpeakingAi ? 'interviewer-avatar--speaking' : ''}`}
                                    style={{ background: currentPersonaObj.avatarBg }}
                                >
                                    <span className="avatar-initials">{currentPersonaObj.name.charAt(0)}</span>
                                    {isSpeakingAi && (
                                        <div className="sound-pulse-rings">
                                            <span /><span /><span />
                                        </div>
                                    )}
                                </div>
                                <div className="interviewer-meta">
                                    <h4 className="interviewer-name">{currentPersonaObj.name}</h4>
                                    <p className="interviewer-role">{currentPersonaObj.title} &bull; {currentPersonaObj.badge}</p>
                                    <p className="interviewer-style-desc">{currentPersonaObj.desc}</p>
                                </div>
                            </div>

                            <div className="active-question-card">
                                <div className="question-card-top">
                                    <span className="question-tag">
                                        Turn #{questionIndex + 1} &bull; {report?.title || 'Target Role'}
                                    </span>
                                    <button
                                        type="button"
                                        className="repeat-audio-btn"
                                        onClick={() => speakText(currentQuestion)}
                                        title="Replay Spoken Question"
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                                        Replay Audio
                                    </button>
                                </div>
                                <p className="question-text">"{currentQuestion}"</p>
                            </div>
                        </div>

                        {/* ── Candidate Studio / Answer Interface ── */}
                        {!currentEvaluation ? (
                            <div className="candidate-studio">
                                <div className="studio-mode-toggle">
                                    <span className="mode-title">Your Response</span>
                                    <div className="toggle-group">
                                        <button
                                            type="button"
                                            className={`toggle-btn ${!useManualInput ? 'toggle-btn--active' : ''}`}
                                            onClick={() => {
                                                if (!speechSupported) {
                                                    alert("Speech recognition is not available in your browser. Please use text mode.");
                                                    return;
                                                }
                                                setUseManualInput(false);
                                            }}
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
                                            Voice Studio
                                        </button>
                                        <button
                                            type="button"
                                            className={`toggle-btn ${useManualInput ? 'toggle-btn--active' : ''}`}
                                            onClick={() => {
                                                stopListening();
                                                setUseManualInput(true);
                                            }}
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>
                                            Type Answer
                                        </button>
                                    </div>
                                </div>

                                {/* Voice Mode UI */}
                                {!useManualInput ? (
                                    <div className="voice-input-container">
                                        <div className="mic-action-hub">
                                            <button
                                                type="button"
                                                className={`primary-mic-btn ${isListening ? 'primary-mic-btn--listening' : ''}`}
                                                onClick={toggleListening}
                                            >
                                                <div className="mic-icon-wrap">
                                                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                                                        <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                                                        <line x1="12" y1="19" x2="12" y2="23"/>
                                                        <line x1="8" y1="23" x2="16" y2="23"/>
                                                    </svg>
                                                </div>
                                                <span className="mic-status-label">
                                                    {isListening ? 'Tap to Pause Speaking' : 'Click to Speak Answer'}
                                                </span>
                                            </button>

                                            {isListening && (
                                                <div className="live-waveform-bars">
                                                    <span className="wave-bar" />
                                                    <span className="wave-bar" />
                                                    <span className="wave-bar" />
                                                    <span className="wave-bar" />
                                                    <span className="wave-bar" />
                                                </div>
                                            )}
                                        </div>

                                        <div className="live-transcript-box">
                                            <div className="transcript-label">Live Spoken Transcript</div>
                                            <div className="transcript-content">
                                                {transcript ? (
                                                    <p className="transcript-text">{transcript}</p>
                                                ) : (
                                                    <p className="transcript-placeholder">
                                                        {isListening
                                                            ? "Listening to your microphone... Start speaking your technical response."
                                                            : "Click the microphone button above to record your spoken answer in real time."}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    /* Manual Type Mode UI */
                                    <div className="manual-input-container">
                                        <textarea
                                            className="manual-textarea"
                                            rows="5"
                                            placeholder="Type your technical or behavioral answer here... Provide architecture details, scale numbers, and trade-offs."
                                            value={manualAnswer}
                                            onChange={e => setManualAnswer(e.target.value)}
                                        />
                                    </div>
                                )}

                                {/* Real-time Metrics Dashboard */}
                                <div className="live-metrics-row">
                                    <div className="metric-chip">
                                        <span className="metric-label">Speaking Time</span>
                                        <span className="metric-value">
                                            {Math.floor(elapsedSeconds / 60)}:{(elapsedSeconds % 60).toString().padStart(2, '0')}
                                        </span>
                                    </div>

                                    <div className={`metric-chip ${wpm > 170 ? 'metric-chip--warning' : wpm >= 120 && wpm <= 165 ? 'metric-chip--success' : ''}`}>
                                        <span className="metric-label">Cadence (WPM)</span>
                                        <span className="metric-value">
                                            {wpm > 0 ? `${wpm} wpm` : '--'}
                                        </span>
                                    </div>

                                    <div className={`metric-chip ${totalFillerCount > 3 ? 'metric-chip--danger' : ''}`}>
                                        <span className="metric-label">Filler Words</span>
                                        <span className="metric-value">
                                            {totalFillerCount} detected
                                        </span>
                                    </div>

                                    {totalFillerCount > 0 && (
                                        <div className="filler-pills">
                                            {Object.entries(detectedFillers).map(([word, count]) => (
                                                <span key={word} className="filler-pill">"{word}" &times; {count}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Controls */}
                                <div className="studio-footer-actions">
                                    <button
                                        type="button"
                                        className="btn-secondary"
                                        onClick={handleResetAnswer}
                                        disabled={!activeText.trim() || isEvaluating}
                                    >
                                        Clear / Retake
                                    </button>

                                    <div className="action-right-group">
                                        {sessionHistory.length > 0 && (
                                            <button
                                                type="button"
                                                className="btn-finish"
                                                onClick={handleFinishSession}
                                            >
                                                Complete Session ({sessionHistory.length} turns)
                                            </button>
                                        )}

                                        <button
                                            type="button"
                                            className="btn-primary"
                                            onClick={handleSubmitAnswer}
                                            disabled={!activeText.trim() || isEvaluating}
                                        >
                                            {isEvaluating ? (
                                                <>
                                                    <span className="spinner-inline" />
                                                    Evaluating with {currentPersonaObj.name}...
                                                </>
                                            ) : (
                                                <>
                                                    Submit Answer &amp; Get Graded
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* ── Live AI Evaluation Card ── */
                            <div className="evaluation-stage">
                                <div className="eval-card-header">
                                    <div className="score-badge-circle">
                                        <span className="score-num">{currentEvaluation.score}</span>
                                        <span className="score-denom">/100</span>
                                    </div>
                                    <div className="eval-meta">
                                        <h3 className="eval-verdict">{currentEvaluation.verdict}</h3>
                                        <p className="eval-reaction">"{currentEvaluation.interviewerReaction}"</p>
                                    </div>
                                </div>

                                <div className="eval-grid">
                                    <div className="eval-box eval-box--strengths">
                                        <h4>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                                            Key Strengths Demonstrated
                                        </h4>
                                        <ul>
                                            {currentEvaluation.strengths?.map((s, i) => (
                                                <li key={i}>{s}</li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="eval-box eval-box--improvements">
                                        <h4>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                                            Critical Areas for Improvement
                                        </h4>
                                        <ul>
                                            {currentEvaluation.improvements?.map((imp, i) => (
                                                <li key={i}>{imp}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>

                                <div className="delivery-insight-banner">
                                    <span className="delivery-icon">🎙️</span>
                                    <div>
                                        <strong>Delivery &amp; Speech Insight: </strong>
                                        <span>{currentEvaluation.deliveryInsight}</span>
                                    </div>
                                </div>

                                {/* Dynamic Follow-up Prompt */}
                                <div className="follow-up-banner">
                                    <div className="follow-up-lead">
                                        <span className="badge-next">DYNAMIC FOLLOW-UP</span>
                                        <p className="follow-up-q">"{currentEvaluation.followUpQuestion}"</p>
                                    </div>
                                    <div className="follow-up-actions">
                                        <button type="button" className="btn-secondary" onClick={handleFinishSession}>
                                            End Session
                                        </button>
                                        <button type="button" className="btn-primary" onClick={handleNextFollowUp}>
                                            Answer Follow-Up Question
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    /* ── Final Session Scorecard Summary ── */
                    <div className="session-summary-view">
                        <div className="summary-hero">
                            <div className="summary-trophy">🏆</div>
                            <h3>Mock Interview Simulation Complete!</h3>
                            <p>You completed a live multi-turn session with <strong>{currentPersonaObj.name}</strong>.</p>
                        </div>

                        <div className="summary-stats-grid">
                            <div className="summary-stat-card">
                                <span className="stat-label">Average Score</span>
                                <span className="stat-value">{avgScore}/100</span>
                            </div>
                            <div className="summary-stat-card">
                                <span className="stat-label">Questions Handled</span>
                                <span className="stat-value">{sessionHistory.length}</span>
                            </div>
                            <div className="summary-stat-card">
                                <span className="stat-label">Persona Evaluator</span>
                                <span className="stat-value">{currentPersonaObj.name}</span>
                            </div>
                        </div>

                        <div className="summary-turn-list">
                            <h4>Turn Breakdown &amp; Performance</h4>
                            {sessionHistory.map((h, i) => (
                                <div key={i} className="summary-turn-item">
                                    <div className="turn-top">
                                        <span className="turn-badge">Question #{i + 1}</span>
                                        <span className="turn-score">{h.evaluation?.score}/100</span>
                                    </div>
                                    <p className="turn-q"><strong>Q:</strong> {h.question}</p>
                                    <p className="turn-verdict"><strong>Verdict:</strong> {h.evaluation?.verdict}</p>
                                </div>
                            ))}
                        </div>

                        <div className="summary-actions">
                            <button type="button" className="btn-secondary" onClick={handleRestartSession}>
                                Restart New Simulation
                            </button>
                            <button type="button" className="btn-primary" onClick={onClose}>
                                Return to Report
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
