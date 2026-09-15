import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';

export const RemotionHeroComposition = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    // Loop cycle: 300 frames (10 seconds @ 30fps)
    // 0-75: Voice Studio
    // 75-150: STAR Method Teleprompter
    // 150-225: Salary Negotiation War Room
    // 225-300: Code & Architecture Auditor

    const cycle = frame % 300;
    const stage = Math.floor(cycle / 75); // 0, 1, 2, 3
    const stageFrame = cycle % 75;

    // Smooth stage opacity transition
    const fadeIn = interpolate(stageFrame, [0, 10], [0, 1], { extrapolateRight: 'clamp' });
    const fadeOut = interpolate(stageFrame, [65, 75], [1, 0], { extrapolateLeft: 'clamp' });
    const stageOpacity = Math.min(fadeIn, fadeOut);

    // Audio bar heights for stage 0
    const waveHeights = [24, 48, 64, 32, 56, 80, 42, 60, 36, 70, 50, 30].map((base, idx) => {
        const offset = Math.sin((frame * 0.25) + idx) * 20;
        return Math.max(12, Math.min(85, base + offset));
    });

    // Score spring for stage 1
    const starScore = Math.floor(interpolate(stageFrame, [5, 45], [45, 94], { extrapolateRight: 'clamp' }));

    // Salary counter for stage 2
    const salaryVal = Math.floor(interpolate(stageFrame, [5, 45], [155000, 224500], { extrapolateRight: 'clamp' }));

    // Audit progress for stage 3
    const auditWidth = Math.min(100, Math.floor(interpolate(stageFrame, [5, 45], [20, 96], { extrapolateRight: 'clamp' })));

    return (
        <div style={{
            width: '100%',
            height: '100%',
            backgroundColor: '#0d1117',
            backgroundImage: 'radial-gradient(ellipse 80% 80% at 50% -20%, rgba(99, 102, 241, 0.25), rgba(13, 17, 23, 0.95))',
            color: '#f0f6fc',
            fontFamily: 'Inter, system-ui, sans-serif',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '24px 28px',
            boxSizing: 'border-box',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '0 24px 60px rgba(0, 0, 0, 0.7), 0 0 40px rgba(99, 102, 241, 0.15)',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Top Chrome / Window Titlebar */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                paddingBottom: '14px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '11px', height: '11px', borderRadius: '50%', background: '#f85149' }} />
                    <div style={{ width: '11px', height: '11px', borderRadius: '50%', background: '#d29922' }} />
                    <div style={{ width: '11px', height: '11px', borderRadius: '50%', background: '#3fb950' }} />
                    <span style={{ marginLeft: '8px', fontSize: '12px', color: '#8b949e', fontWeight: 600 }}>
                        CareerAI Cockpit • Live Engine Telemetry
                    </span>
                </div>

                {/* Live Pill Indicator */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 10px',
                    borderRadius: '999px',
                    background: 'rgba(56, 189, 248, 0.12)',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#38bdf8',
                    letterSpacing: '0.04em'
                }}>
                    <span style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: '#38bdf8',
                        boxShadow: '0 0 8px #38bdf8'
                    }} />
                    <span>ENGINE {stage + 1}/4: {
                        stage === 0 ? 'VOICE INTERVIEW' :
                            stage === 1 ? 'STAR TELEPROMPTER' :
                                stage === 2 ? 'SALARY WAR ROOM' : 'STAFF CODE AUDITOR'
                    }</span>
                </div>
            </div>

            {/* Dynamic Stage Canvas Content */}
            <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                opacity: stageOpacity,
                padding: '12px 0'
            }}>
                {/* STAGE 0: AI Voice Mock Interviewer */}
                {stage === 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#c084fc', fontWeight: 700, letterSpacing: '0.06em' }}>
                                    Persona: Tough Bar Raiser
                                </span>
                                <h3 style={{ margin: '4px 0 0', fontSize: '18px', fontWeight: 700, color: '#ffffff' }}>
                                    "Explain how your system avoids data corruption during split-brain."
                                </h3>
                            </div>
                            <div style={{
                                padding: '6px 12px',
                                borderRadius: '8px',
                                background: 'rgba(248, 81, 73, 0.15)',
                                border: '1px solid rgba(248, 81, 73, 0.3)',
                                color: '#f85149',
                                fontSize: '12px',
                                fontWeight: 700
                            }}>
                                🎙️ REC • 138 WPM
                            </div>
                        </div>

                        {/* Live Audio Waveform */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            height: '90px',
                            background: 'rgba(0, 0, 0, 0.35)',
                            borderRadius: '12px',
                            border: '1px solid rgba(255, 255, 255, 0.06)'
                        }}>
                            {waveHeights.map((h, i) => (
                                <div key={i} style={{
                                    width: '8px',
                                    height: `${h}px`,
                                    borderRadius: '4px',
                                    background: 'linear-gradient(180deg, #c084fc 0%, #6366f1 100%)',
                                    boxShadow: '0 0 8px rgba(168, 85, 247, 0.4)'
                                }} />
                            ))}
                        </div>

                        <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#8b949e' }}>
                            <span style={{ color: '#56d364' }}>✓ 0 Crutch Words Detected</span>
                            <span>•</span>
                            <span style={{ color: '#38bdf8' }}>Gemini Speech Feedback: 92% Seniority Confidence</span>
                        </div>
                    </div>
                )}

                {/* STAGE 1: STAR Method Teleprompter & Grader */}
                {stage === 1 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#38bdf8', fontWeight: 700, letterSpacing: '0.06em' }}>
                                    Behavioral Response Analyzer
                                </span>
                                <h3 style={{ margin: '4px 0 0', fontSize: '18px', fontWeight: 700, color: '#ffffff' }}>
                                    Google XYZ Formula Transformer
                                </h3>
                            </div>
                            <div style={{
                                width: '56px',
                                height: '56px',
                                borderRadius: '50%',
                                border: '3px solid #38bdf8',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: 'rgba(56, 189, 248, 0.15)',
                                boxShadow: '0 0 16px rgba(56, 189, 248, 0.3)'
                            }}>
                                <span style={{ fontSize: '18px', fontWeight: 800, color: '#fff', lineHeight: 1 }}>{starScore}</span>
                                <span style={{ fontSize: '9px', color: '#8b949e' }}>/ 100</span>
                            </div>
                        </div>

                        <div style={{
                            padding: '12px 16px',
                            borderRadius: '10px',
                            background: 'rgba(0, 0, 0, 0.4)',
                            border: '1px solid rgba(56, 189, 248, 0.25)',
                            fontSize: '13px',
                            lineHeight: 1.5,
                            color: '#e6edf3'
                        }}>
                            <div style={{ color: '#8b949e', fontSize: '11px', marginBottom: '4px' }}>Raw Candidate Draft → Polished Google Standard:</div>
                            <span style={{ color: '#56d364', fontWeight: 600 }}>"Accomplished 42% latency cut</span> as measured by <span style={{ color: '#38bdf8', fontWeight: 600 }}>p99 Grafana telemetry</span>, by redesigning the Redis cache invalidation layer."
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                            {['Situation: OK', 'Task: OK', 'Action: OK', 'Result: Quantified'].map((s, i) => (
                                <span key={i} style={{
                                    fontSize: '11px',
                                    padding: '3px 8px',
                                    borderRadius: '6px',
                                    background: 'rgba(86, 211, 100, 0.12)',
                                    color: '#56d364',
                                    border: '1px solid rgba(86, 211, 100, 0.25)'
                                }}>{s}</span>
                            ))}
                        </div>
                    </div>
                )}

                {/* STAGE 2: Salary Negotiation War Room */}
                {stage === 2 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#fbbf24', fontWeight: 700, letterSpacing: '0.06em' }}>
                                    Recruiter Counter-Offer Simulator
                                </span>
                                <h3 style={{ margin: '4px 0 0', fontSize: '18px', fontWeight: 700, color: '#ffffff' }}>
                                    SF Bay Area • Senior Full Stack Band
                                </h3>
                            </div>
                            <div style={{
                                padding: '6px 14px',
                                borderRadius: '10px',
                                background: 'rgba(251, 191, 36, 0.15)',
                                border: '1px solid rgba(251, 191, 36, 0.3)',
                                textAlign: 'right'
                            }}>
                                <div style={{ fontSize: '9px', color: '#fbbf24', textTransform: 'uppercase', fontWeight: 700 }}>Simulated Total Comp</div>
                                <div style={{ fontSize: '17px', fontWeight: 800, color: '#fff' }}>${salaryVal.toLocaleString()}</div>
                            </div>
                        </div>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(4, 1fr)',
                            gap: '8px',
                            background: 'rgba(0, 0, 0, 0.3)',
                            padding: '12px',
                            borderRadius: '10px',
                            border: '1px solid rgba(255, 255, 255, 0.08)'
                        }}>
                            <div>
                                <div style={{ fontSize: '10px', color: '#8b949e' }}>P25 MIN</div>
                                <div style={{ fontSize: '13px', fontWeight: 700, color: '#c9d1d9' }}>$172,000</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '10px', color: '#8b949e' }}>P50 MEDIAN</div>
                                <div style={{ fontSize: '13px', fontWeight: 700, color: '#c9d1d9' }}>$205,000</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '10px', color: '#56d364' }}>TARGET (P75)</div>
                                <div style={{ fontSize: '13px', fontWeight: 800, color: '#56d364' }}>$225,000</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '10px', color: '#8b949e' }}>P90 TOP</div>
                                <div style={{ fontSize: '13px', fontWeight: 700, color: '#c9d1d9' }}>$255,000</div>
                            </div>
                        </div>

                        <div style={{ fontSize: '12px', color: '#e6edf3', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ padding: '2px 6px', borderRadius: '4px', background: '#238636', color: '#fff', fontSize: '10px', fontWeight: 700 }}>RECRUITER MOOD</span>
                            <span>"We have leeway on signing bonus; let's bridge the $15k delta."</span>
                        </div>
                    </div>
                )}

                {/* STAGE 3: GitHub & Portfolio Interviewer Lens Auditor */}
                {stage === 3 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#a855f7', fontWeight: 700, letterSpacing: '0.06em' }}>
                                    Staff Engineer Lens Scrutiny
                                </span>
                                <h3 style={{ margin: '4px 0 0', fontSize: '18px', fontWeight: 700, color: '#ffffff' }}>
                                    Distributed Rate Limiter Audit
                                </h3>
                            </div>
                            <div style={{
                                padding: '6px 12px',
                                borderRadius: '8px',
                                background: 'rgba(168, 85, 247, 0.15)',
                                border: '1px solid rgba(168, 85, 247, 0.3)',
                                color: '#c084fc',
                                fontSize: '12px',
                                fontWeight: 700
                            }}>
                                88/100 PRODUCTION READY
                            </div>
                        </div>

                        <div style={{
                            padding: '12px 14px',
                            background: '#090d12',
                            borderRadius: '10px',
                            border: '1px solid #30363d',
                            fontFamily: 'monospace',
                            fontSize: '12px',
                            color: '#7ee787'
                        }}>
                            <div>⚡ Auditing non-atomic Redis incr + expire pipeline...</div>
                            <div style={{ color: '#f85149', marginTop: '4px' }}>⚠️ Flag: Transient split-brain leak under worker crash</div>
                            <div style={{ color: '#38bdf8', marginTop: '4px' }}>✓ Defense Script: Lua script transactional encapsulation generated</div>
                        </div>

                        {/* Progress Bar */}
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#8b949e', marginBottom: '4px' }}>
                                <span>Concurrency & Observability Audit</span>
                                <span>{auditWidth}%</span>
                            </div>
                            <div style={{ width: '100%', height: '6px', borderRadius: '3px', background: '#21262d' }}>
                                <div style={{
                                    width: `${auditWidth}%`,
                                    height: '100%',
                                    borderRadius: '3px',
                                    background: 'linear-gradient(90deg, #a855f7, #38bdf8)'
                                }} />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Timeline Indicator */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '8px',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                paddingTop: '12px'
            }}>
                {['Voice Studio', 'STAR Grader', 'Salary War Room', 'Code Auditor'].map((label, idx) => {
                    const isActive = stage === idx;
                    return (
                        <div key={idx} style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px'
                        }}>
                            <div style={{
                                height: '3px',
                                borderRadius: '2px',
                                background: isActive ? 'linear-gradient(90deg, #38bdf8, #a855f7)' : 'rgba(255, 255, 255, 0.1)'
                            }} />
                            <span style={{
                                fontSize: '11px',
                                color: isActive ? '#ffffff' : '#8b949e',
                                fontWeight: isActive ? 700 : 500
                            }}>
                                {label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default React.memo(RemotionHeroComposition);
