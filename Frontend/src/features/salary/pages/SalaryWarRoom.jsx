import React, { useState } from 'react';
import { simulateSalaryNegotiationApi } from '../../interview/services/interview.api';
import '../style/SalaryWarRoom.scss';

// Quick counter presets
const PRESETS = [
    "Ask for a $15,000 higher base salary to reflect SF market median.",
    "Propose trading a lower base salary for 25% higher equity grant.",
    "Request a $20,000 sign-on bonus to bridge the gap without affecting base band.",
    "Politely state you have competing final-round interviews to create urgency."
];

export default function SalaryWarRoom() {
    const [role, setRole] = useState('Senior Full Stack Engineer');
    const [location, setLocation] = useState('San Francisco, CA / Remote');
    const [yoe, setYoe] = useState(5);
    const [base, setBase] = useState(155000);
    const [bonus, setBonus] = useState(10);
    const [equity, setEquity] = useState(35000);
    const [signon, setSignon] = useState(15000);

    const [userCounter, setUserCounter] = useState('');
    const [isSimulating, setIsSimulating] = useState(false);
    const [simulationData, setSimulationData] = useState(null);
    const [copiedEmail, setCopiedEmail] = useState(false);
    const [chatHistory, setChatHistory] = useState([]);

    const currentTotalComp = Number(base) + (Number(base) * (Number(bonus) / 100)) + Number(equity) + Number(signon);

    const handleRunSimulation = async (customMessage) => {
        const messageToSend = customMessage || userCounter || "I would love to explore if we can bridge the gap on base salary and sign-on bonus to reflect current market rates.";
        setIsSimulating(true);

        try {
            const res = await simulateSalaryNegotiationApi({
                role,
                location,
                yoe: Number(yoe),
                currentOffer: {
                    base: Number(base),
                    bonus: Number(bonus),
                    equity: Number(equity),
                    signon: Number(signon)
                },
                userMessage: messageToSend,
                history: chatHistory
            });

            if (res && res.data) {
                setSimulationData(res.data);
                setChatHistory(prev => [
                    ...prev,
                    {
                        candidate: messageToSend,
                        recruiter: res.data.recruiterResponse
                    }
                ]);
            }
        } catch (err) {
            console.error("Salary simulation error:", err);
            alert("Could not run salary simulation. Please check your connection.");
        } finally {
            setIsSimulating(false);
        }
    };

    const handleCopyEmail = () => {
        if (!simulationData?.counterOfferEmailDraft?.body) return;
        const text = `Subject: ${simulationData.counterOfferEmailDraft.subject}\n\n${simulationData.counterOfferEmailDraft.body}`;
        navigator.clipboard.writeText(text);
        setCopiedEmail(true);
        setTimeout(() => setCopiedEmail(false), 2200);
    };

    const mb = simulationData?.marketBenchmark;
    const tactics = simulationData?.negotiationTactics;

    return (
        <div className="salary-war-room-page">
            
            {/* ── Page Hero ── */}
            <div className="war-room-hero">
                <div className="hero-tag">
                    <span className="dollar-icon">💰</span>
                    <span>EXECUTIVE COMPENSATION STUDIO</span>
                </div>
                <h1 className="hero-title">Salary Negotiation &amp; Counter-Offer War Room</h1>
                <p className="hero-desc">
                    Simulate real-time recruiter pushback, benchmark total compensation against P25–P90 market bands, and generate airtight counter-offer scripts.
                </p>
            </div>

            <div className="war-room-grid">
                
                {/* ── Left Column: Offer Configurator ── */}
                <div className="config-card">
                    <h3 className="card-heading">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                        Current Offer &amp; Role Details
                    </h3>

                    <div className="form-group">
                        <label>Target Role Title</label>
                        <input
                            type="text"
                            value={role}
                            onChange={e => setRole(e.target.value)}
                            placeholder="e.g. Senior Full Stack Engineer"
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Location / Tier</label>
                            <input
                                type="text"
                                value={location}
                                onChange={e => setLocation(e.target.value)}
                                placeholder="e.g. SF, NYC, Remote"
                            />
                        </div>

                        <div className="form-group">
                            <label>Years of Exp (YOE)</label>
                            <input
                                type="number"
                                value={yoe}
                                onChange={e => setYoe(e.target.value)}
                                min="0"
                                max="30"
                            />
                        </div>
                    </div>

                    <div className="form-divider" />

                    <h4 className="sub-heading">Compensation Breakdown ($ USD)</h4>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Base Salary ($/yr)</label>
                            <input
                                type="number"
                                value={base}
                                onChange={e => setBase(e.target.value)}
                                step="5000"
                            />
                        </div>

                        <div className="form-group">
                            <label>Annual Bonus (%)</label>
                            <input
                                type="number"
                                value={bonus}
                                onChange={e => setBonus(e.target.value)}
                                step="1"
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Equity / RSUs ($/yr)</label>
                            <input
                                type="number"
                                value={equity}
                                onChange={e => setEquity(e.target.value)}
                                step="5000"
                            />
                        </div>

                        <div className="form-group">
                            <label>Sign-on Bonus ($)</label>
                            <input
                                type="number"
                                value={signon}
                                onChange={e => setSignon(e.target.value)}
                                step="2500"
                            />
                        </div>
                    </div>

                    {/* Live Total Comp Badge */}
                    <div className="total-comp-banner">
                        <span className="tc-label">ANNUALIZED TOTAL COMP (TC)</span>
                        <span className="tc-value">${Math.round(currentTotalComp).toLocaleString()}</span>
                    </div>

                    {/* Pre-Baked Negotiation Levers */}
                    <div className="quick-presets-section">
                        <label className="presets-label">QUICK COUNTER PROPOSALS</label>
                        <div className="presets-list">
                            {PRESETS.map((preset, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    className="preset-btn"
                                    onClick={() => {
                                        setUserCounter(preset);
                                        handleRunSimulation(preset);
                                    }}
                                >
                                    <span>👉</span> {preset}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="custom-counter-input">
                        <label>Or type your custom counter pitch to the recruiter:</label>
                        <textarea
                            rows="3"
                            value={userCounter}
                            onChange={e => setUserCounter(e.target.value)}
                            placeholder="e.g. Given my leadership in Kafka streaming and other competitive offers, could we discuss bringing base to $175k?"
                        />
                        <button
                            type="button"
                            className="btn-simulate"
                            onClick={() => handleRunSimulation()}
                            disabled={isSimulating}
                        >
                            {isSimulating ? (
                                <>
                                    <span className="spinner-salary" />
                                    Simulating Recruiter &amp; Market...
                                </>
                            ) : (
                                <>
                                    Simulate Counter &amp; Benchmark
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* ── Right Column: War Room Intelligence & Simulator ── */}
                <div className="results-column">
                    {simulationData ? (
                        <>
                            {/* Market Percentile Benchmark Card */}
                            <div className="benchmark-card">
                                <div className="benchmark-header">
                                    <div className="bench-title-group">
                                        <span className="bench-pill">MARKET BENCHMARK DATA</span>
                                        <h3>{role} Compensation Bands</h3>
                                    </div>
                                    <span className="rank-badge">{mb?.percentileRank}</span>
                                </div>

                                <div className="percentile-bar-container">
                                    <div className="percentile-track">
                                        <div className="p-milestone p25">
                                            <span className="p-tag">P25</span>
                                            <span className="p-val">${(mb?.p25 / 1000).toFixed(0)}k</span>
                                        </div>
                                        <div className="p-milestone p50">
                                            <span className="p-tag">P50 (Median)</span>
                                            <span className="p-val">${(mb?.p50 / 1000).toFixed(0)}k</span>
                                        </div>
                                        <div className="p-milestone p75">
                                            <span className="p-tag">P75</span>
                                            <span className="p-val">${(mb?.p75 / 1000).toFixed(0)}k</span>
                                        </div>
                                        <div className="p-milestone p90">
                                            <span className="p-tag">P90</span>
                                            <span className="p-val">${(mb?.p90 / 1000).toFixed(0)}k</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Recruiter Response Simulation Card */}
                            <div className="recruiter-simulation-card">
                                <div className="recruiter-header">
                                    <div className="recruiter-avatar">💼</div>
                                    <div>
                                        <h4>Head of Talent / Principal Tech Recruiter</h4>
                                        <p className="recruiter-status">Active Negotiation Round</p>
                                    </div>
                                </div>

                                <div className="recruiter-quote-box">
                                    <p className="recruiter-quote">"{simulationData.recruiterResponse}"</p>
                                </div>

                                {/* Tactical Metrics */}
                                <div className="tactics-metric-grid">
                                    <div className="tactic-card">
                                        <span className="tactic-label">Firmness Score</span>
                                        <span className="tactic-value">{tactics?.firmnessScore}/100</span>
                                    </div>
                                    <div className="tactic-card">
                                        <span className="tactic-label">Goodwill &amp; Tone</span>
                                        <span className="tactic-value">{tactics?.goodwillScore}/100</span>
                                    </div>
                                    <div className="tactic-card">
                                        <span className="tactic-label">Willingness to Budge</span>
                                        <span className={`tactic-value willingness-${tactics?.recruiterWillingness?.toLowerCase()}`}>
                                            {tactics?.recruiterWillingness}
                                        </span>
                                    </div>
                                </div>

                                <p className="tactic-critique">
                                    <strong>Tactical Analysis: </strong> {tactics?.critique}
                                </p>
                            </div>

                            {/* Counter-Offer Email Draft Generator */}
                            {simulationData.counterOfferEmailDraft && (
                                <div className="email-draft-card">
                                    <div className="email-header">
                                        <div>
                                            <span className="email-pill">EXECUTIVE EMAIL TEMPLATE</span>
                                            <h4>High-Leverage Counter-Offer Letter</h4>
                                        </div>
                                        <button
                                            type="button"
                                            className="btn-copy-email"
                                            onClick={handleCopyEmail}
                                        >
                                            {copiedEmail ? (
                                                <span>✓ Copied to Clipboard</span>
                                            ) : (
                                                <>
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                                                    Copy Complete Email
                                                </>
                                            )}
                                        </button>
                                    </div>

                                    <div className="email-preview-box">
                                        <div className="email-subject-line">
                                            <strong>Subject: </strong> {simulationData.counterOfferEmailDraft.subject}
                                        </div>
                                        <pre className="email-body-text">{simulationData.counterOfferEmailDraft.body}</pre>
                                    </div>
                                </div>
                            )}

                            {/* Strategic Next Moves */}
                            {simulationData.recommendedNextMoves?.length > 0 && (
                                <div className="next-moves-card">
                                    <h4>💡 Strategic Next Moves &amp; Levers</h4>
                                    <ul>
                                        {simulationData.recommendedNextMoves.map((move, i) => (
                                            <li key={i}>{move}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </>
                    ) : (
                        /* Empty State */
                        <div className="empty-war-room-state">
                            <div className="empty-icon">📊</div>
                            <h3>Configure Your Offer &amp; Run the Simulator</h3>
                            <p>
                                Enter your current offer components on the left and test counter-proposals against our AI recruiter simulator to discover your exact leverage and market bands.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
