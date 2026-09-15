import React, { useState, useEffect, useRef } from 'react';
import { gradeStarAnswerApi } from '../services/interview.api';
import './StarTeleprompterModal.scss';

export default function StarTeleprompterModal({ isOpen, onClose, questionItem, targetRole }) {
    const [answerText, setAnswerText] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [isEvaluating, setIsEvaluating] = useState(false);
    const [evaluation, setEvaluation] = useState(null);
    const [copiedXyz, setCopiedXyz] = useState(false);
    const [activeTab, setActiveTab] = useState('type'); // 'type' or 'voice'

    const recognitionRef = useRef(null);

    // Reset or initialize when modal opens with a question
    useEffect(() => {
        if (isOpen) {
            setAnswerText('');
            setEvaluation(null);
            setIsListening(false);
            setCopiedXyz(false);
        }
    }, [isOpen, questionItem]);

    // Speech recognition setup
    const toggleSpeech = () => {
        if (isListening) {
            if (recognitionRef.current) {
                try { recognitionRef.current.stop(); } catch (_) {}
            }
            setIsListening(false);
        } else {
            const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SpeechRec) {
                alert("Speech recognition is not supported in this browser. Please type your response.");
                return;
            }

            try {
                const recognition = new SpeechRec();
                recognition.continuous = true;
                recognition.interimResults = true;
                recognition.lang = 'en-US';

                recognition.onstart = () => setIsListening(true);
                recognition.onresult = (event) => {
                    let fullText = '';
                    for (let i = 0; i < event.results.length; i++) {
                        fullText += event.results[i][0].transcript + ' ';
                    }
                    setAnswerText(fullText.trim());
                };
                recognition.onerror = () => setIsListening(false);
                recognition.onend = () => setIsListening(false);

                recognitionRef.current = recognition;
                recognition.start();
            } catch (err) {
                console.error("Speech error:", err);
            }
        }
    };

    // Cleanup audio on close
    useEffect(() => {
        if (!isOpen && recognitionRef.current) {
            try { recognitionRef.current.stop(); } catch (_) {}
            setIsListening(false);
        }
    }, [isOpen]);

    const handleAnalyze = async () => {
        if (!answerText.trim()) return;
        if (isListening && recognitionRef.current) {
            try { recognitionRef.current.stop(); } catch (_) {}
            setIsListening(false);
        }

        setIsEvaluating(true);
        try {
            const res = await gradeStarAnswerApi({
                question: questionItem?.question || "Tell me about a challenging situation you handled.",
                answer: answerText,
                targetRole: targetRole || 'Software Engineer'
            });

            if (res && res.evaluation) {
                setEvaluation(res.evaluation);
            }
        } catch (err) {
            console.error("STAR evaluation error:", err);
            alert("Could not evaluate STAR answer. Please check your connection.");
        } finally {
            setIsEvaluating(false);
        }
    };

    const handleCopyXyz = () => {
        if (!evaluation?.googleXyzFormula) return;
        navigator.clipboard.writeText(evaluation.googleXyzFormula);
        setCopiedXyz(true);
        setTimeout(() => setCopiedXyz(false), 2200);
    };

    if (!isOpen) return null;

    const wordCount = answerText.trim() ? answerText.trim().split(/\s+/).length : 0;
    const star = evaluation?.starBreakdown;

    return (
        <div className="star-modal-overlay" onClick={onClose}>
            <div className="star-modal" onClick={e => e.stopPropagation()}>
                
                {/* ── Modal Header ── */}
                <div className="star-modal-header">
                    <div className="header-left">
                        <div className="star-badge">
                            <span className="star-icon">⚡</span>
                            <span>STAR METHOD TELEPROMPTER &amp; ANSWER GRADER</span>
                        </div>
                        <h2 className="modal-title">Behavioral Mastery Studio</h2>
                        <p className="modal-subtitle">Situation (15%) &bull; Task (15%) &bull; Action (50%) &bull; Result (20%)</p>
                    </div>

                    <button type="button" className="star-close-btn" onClick={onClose} aria-label="Close modal">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                </div>

                <div className="star-modal-body">
                    {/* ── Question Card ── */}
                    <div className="star-question-prompt">
                        <span className="q-label">BEHAVIORAL QUESTION</span>
                        <p className="q-text">"{questionItem?.question || 'Describe a high-stakes engineering project you led.'}"</p>
                        {questionItem?.intention && (
                            <div className="q-intent">
                                <strong>Interviewer Intention:</strong> {questionItem.intention}
                            </div>
                        )}
                    </div>

                    {/* ── Teleprompter Studio Input ── */}
                    <div className="teleprompter-studio">
                        <div className="studio-topbar">
                            <div className="tab-buttons">
                                <button
                                    type="button"
                                    className={`tab-btn ${activeTab === 'type' ? 'tab-btn--active' : ''}`}
                                    onClick={() => setActiveTab('type')}
                                >
                                    ✍️ Type Response
                                </button>
                                <button
                                    type="button"
                                    className={`tab-btn ${activeTab === 'voice' ? 'tab-btn--active' : ''}`}
                                    onClick={() => setActiveTab('voice')}
                                >
                                    🎙️ Voice Teleprompter
                                </button>
                            </div>

                            <div className="word-count-badge">
                                <span>{wordCount} words</span>
                                {wordCount > 0 && wordCount < 60 && <span className="warning-pill">Too brief</span>}
                                {wordCount >= 60 && wordCount <= 220 && <span className="success-pill">Optimal length</span>}
                                {wordCount > 220 && <span className="warning-pill">Risk of rambling</span>}
                            </div>
                        </div>

                        {activeTab === 'voice' && (
                            <div className="voice-record-bar">
                                <button
                                    type="button"
                                    className={`voice-mic-trigger ${isListening ? 'voice-mic-trigger--recording' : ''}`}
                                    onClick={toggleSpeech}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
                                    {isListening ? 'Stop Dictating' : 'Start Voice Dictation'}
                                </button>
                                <span className="voice-tip">
                                    {isListening ? 'Listening... Speak your Situation, Task, Action, and Result.' : 'Click to speak out loud — speech transforms into text automatically.'}
                                </span>
                            </div>
                        )}

                        <textarea
                            className="teleprompter-textarea"
                            rows="6"
                            placeholder="Structure your answer using STAR:&#10;1. Situation (15%): Set the context, team environment, and business stakes.&#10;2. Task (15%): What was the specific engineering goal or obstacle you owned?&#10;3. Action (50%): What specific technical steps, architectural decisions, and leadership did YOU take?&#10;4. Result (20%): What was the quantifiable outcome (e.g. latency, revenue, uptime, SLA)?"
                            value={answerText}
                            onChange={e => setAnswerText(e.target.value)}
                        />

                        <div className="studio-actions">
                            <button
                                type="button"
                                className="btn-clear"
                                onClick={() => { setAnswerText(''); setEvaluation(null); }}
                                disabled={!answerText || isEvaluating}
                            >
                                Clear
                            </button>

                            <button
                                type="button"
                                className="btn-grade"
                                onClick={handleAnalyze}
                                disabled={!answerText.trim() || isEvaluating}
                            >
                                {isEvaluating ? (
                                    <>
                                        <span className="spinner-star" />
                                        Dissecting STAR Anatomy...
                                    </>
                                ) : (
                                    <>
                                        Analyze with STAR Grader
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* ── Evaluation Results ── */}
                    {evaluation && (
                        <div className="star-evaluation-results">
                            
                            {/* Score & Ownership Header */}
                            <div className="eval-summary-header">
                                <div className="score-box">
                                    <span className="score-value">{evaluation.totalScore}</span>
                                    <span className="score-label">STAR Score / 100</span>
                                </div>

                                <div className="ownership-box">
                                    <div className="ownership-headline">
                                        <span className="ownership-icon">👑</span>
                                        <strong>Personal Ownership: {evaluation.ownershipAnalysis?.ownershipRating}</strong>
                                    </div>
                                    <p className="ownership-tip">{evaluation.ownershipAnalysis?.tip}</p>
                                    <div className="pronoun-ratio">
                                        <span>Personal "I": <strong>{evaluation.ownershipAnalysis?.iCount || 0}</strong></span>
                                        <span>Team "We": <strong>{evaluation.ownershipAnalysis?.weCount || 0}</strong></span>
                                    </div>
                                </div>
                            </div>

                            {/* 4 STAR Progress Meters */}
                            <div className="star-breakdown-grid">
                                
                                {/* Situation */}
                                <div className="star-pillar-card pillar--situation">
                                    <div className="pillar-header">
                                        <span className="pillar-title">🟡 SITUATION</span>
                                        <span className="pillar-pct">{star?.situation?.percentage || 0}% (Target: 15%)</span>
                                    </div>
                                    <div className="pillar-progress-track">
                                        <div className="pillar-bar" style={{ width: `${Math.min(100, (star?.situation?.percentage || 0) * 2)}%` }} />
                                    </div>
                                    <p className="pillar-text">"{star?.situation?.text || 'Not clearly detected'}"</p>
                                    <p className="pillar-feedback">{star?.situation?.assessment}</p>
                                </div>

                                {/* Task */}
                                <div className="star-pillar-card pillar--task">
                                    <div className="pillar-header">
                                        <span className="pillar-title">🔵 TASK</span>
                                        <span className="pillar-pct">{star?.task?.percentage || 0}% (Target: 15%)</span>
                                    </div>
                                    <div className="pillar-progress-track">
                                        <div className="pillar-bar" style={{ width: `${Math.min(100, (star?.task?.percentage || 0) * 2)}%` }} />
                                    </div>
                                    <p className="pillar-text">"{star?.task?.text || 'Not clearly detected'}"</p>
                                    <p className="pillar-feedback">{star?.task?.assessment}</p>
                                </div>

                                {/* Action */}
                                <div className="star-pillar-card pillar--action">
                                    <div className="pillar-header">
                                        <span className="pillar-title">🟢 ACTION</span>
                                        <span className="pillar-pct">{star?.action?.percentage || 0}% (Target: 50%)</span>
                                    </div>
                                    <div className="pillar-progress-track">
                                        <div className="pillar-bar" style={{ width: `${Math.min(100, (star?.action?.percentage || 0) * 2)}%` }} />
                                    </div>
                                    <p className="pillar-text">"{star?.action?.text || 'Not clearly detected'}"</p>
                                    <p className="pillar-feedback">{star?.action?.assessment}</p>
                                </div>

                                {/* Result */}
                                <div className="star-pillar-card pillar--result">
                                    <div className="pillar-header">
                                        <span className="pillar-title">🟣 RESULT</span>
                                        <span className="pillar-pct">{star?.result?.percentage || 0}% (Target: 20%)</span>
                                    </div>
                                    <div className="pillar-progress-track">
                                        <div className="pillar-bar" style={{ width: `${Math.min(100, (star?.result?.percentage || 0) * 2)}%` }} />
                                    </div>
                                    <p className="pillar-text">"{star?.result?.text || 'Not clearly detected'}"</p>
                                    <p className="pillar-feedback">{star?.result?.assessment}</p>
                                </div>
                            </div>

                            {/* Google XYZ Formula Transformation Card */}
                            {evaluation.googleXyzFormula && (
                                <div className="google-xyz-card">
                                    <div className="xyz-top">
                                        <div className="xyz-badge">
                                            <span>✨ GOOGLE XYZ FORMULA REWRITE</span>
                                        </div>
                                        <button
                                            type="button"
                                            className="copy-xyz-btn"
                                            onClick={handleCopyXyz}
                                        >
                                            {copiedXyz ? (
                                                <span className="copied-text">✓ Copied to Clipboard</span>
                                            ) : (
                                                <>
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                                                    Copy Bullet Point
                                                </>
                                            )}
                                        </button>
                                    </div>
                                    <p className="xyz-formula-text">"{evaluation.googleXyzFormula}"</p>
                                    <p className="xyz-legend">
                                        Format: Accomplished <strong>[X]</strong>, as measured by <strong>[Y]</strong>, by doing <strong>[Z]</strong>.
                                    </p>
                                </div>
                            )}

                            {/* Coaching Tips */}
                            {evaluation.coachingTips?.length > 0 && (
                                <div className="coaching-tips-card">
                                    <h4>🎯 Bar Raiser Delivery Coaching</h4>
                                    <ul>
                                        {evaluation.coachingTips.map((tip, i) => (
                                            <li key={i}>{tip}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
