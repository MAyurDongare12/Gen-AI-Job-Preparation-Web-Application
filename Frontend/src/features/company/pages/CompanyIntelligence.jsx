import React, { useState, useEffect } from 'react';
import { getCompanyIntelligenceApi } from '../../interview/services/interview.api';
import '../style/CompanyIntelligence.scss';

const POPULAR_COMPANIES = [
    { name: 'Stripe', logo: '💳', tag: 'FinTech Infrastructure' },
    { name: 'Google', logo: '🌐', tag: 'Hyper-Scale Systems' },
    { name: 'Netflix', logo: '🎬', tag: 'High-Throughput Streaming' },
    { name: 'Amazon', logo: '📦', tag: 'Leadership Principles' },
    { name: 'Meta', logo: '👥', tag: 'Move Fast Architecture' },
    { name: 'Uber', logo: '🚗', tag: 'Real-Time Geo & Dispatch' }
];

export default function CompanyIntelligence() {
    const [companyInput, setCompanyInput] = useState('Stripe');
    const [roleInput, setRoleInput] = useState('Senior Full Stack Engineer');
    const [isLoading, setIsLoading] = useState(false);
    const [dossier, setDossier] = useState(null);
    const [copiedIndex, setCopiedIndex] = useState(null);

    const handleFetchDossier = async (companyNameOverride) => {
        const targetCompany = companyNameOverride || companyInput;
        if (!targetCompany.trim()) return;

        setIsLoading(true);
        try {
            const res = await getCompanyIntelligenceApi({
                companyName: targetCompany,
                role: roleInput
            });

            if (res && res.data) {
                setDossier(res.data);
            }
        } catch (err) {
            console.error("Failed to fetch company dossier:", err);
            alert("Could not load company intelligence. Please verify your connection.");
        } finally {
            setIsLoading(false);
        }
    };

    // Auto-fetch default company on mount
    useEffect(() => {
        handleFetchDossier('Stripe');
    }, []);

    const handleCopyQuestion = (text, idx) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(idx);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    return (
        <div className="company-intel-page">
            
            {/* ── Page Hero ── */}
            <div className="intel-hero">
                <div className="hero-badge">
                    <span className="badge-dot" />
                    <span>REVERSE RECRUITER &bull; COMPANY INTELLIGENCE</span>
                </div>
                <h1 className="hero-title">Company Insider &amp; Culture DNA Dossier</h1>
                <p className="hero-desc">
                    Uncover exact interview loop architectures, engineering tech stack DNA, and hyper-tailored reverse questions that leave senior engineering directors thoroughly impressed.
                </p>
            </div>

            {/* ── Search & Company Selector Bar ── */}
            <div className="intel-search-container">
                <form
                    className="intel-search-form"
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleFetchDossier();
                    }}
                >
                    <div className="input-group company-input-wrap">
                        <label>Target Company</label>
                        <input
                            type="text"
                            value={companyInput}
                            onChange={e => setCompanyInput(e.target.value)}
                            placeholder="Enter any tech company or startup (e.g. Stripe, OpenAI, Airbnb)"
                        />
                    </div>

                    <div className="input-group role-input-wrap">
                        <label>Target Engineering Role</label>
                        <input
                            type="text"
                            value={roleInput}
                            onChange={e => setRoleInput(e.target.value)}
                            placeholder="e.g. Senior Software Engineer"
                        />
                    </div>

                    <button type="submit" className="btn-generate-dossier" disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <span className="spinner-intel" />
                                Compiling Dossier...
                            </>
                        ) : (
                            <>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                                Generate Dossier
                            </>
                        )}
                    </button>
                </form>

                {/* Popular Company Fast Chips */}
                <div className="popular-companies-row">
                    <span className="popular-label">POPULAR INTEL TARGETS:</span>
                    <div className="popular-chips">
                        {POPULAR_COMPANIES.map(comp => (
                            <button
                                key={comp.name}
                                type="button"
                                className={`popular-chip ${companyInput.toLowerCase() === comp.name.toLowerCase() ? 'popular-chip--active' : ''}`}
                                onClick={() => {
                                    setCompanyInput(comp.name);
                                    handleFetchDossier(comp.name);
                                }}
                            >
                                <span>{comp.logo}</span>
                                <strong>{comp.name}</strong>
                                <span className="chip-tag">{comp.tag}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Intelligence Dossier Output ── */}
            {dossier && (
                <div className="dossier-layout">
                    
                    {/* Top Overview Banner */}
                    <div className="dossier-overview-banner">
                        <div className="overview-header">
                            <div className="company-branding">
                                <div className="company-logo-avatar">
                                    {dossier.companyName.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h2 className="company-name">{dossier.companyName}</h2>
                                    <p className="role-target">Intelligence Profile for <strong>{dossier.role}</strong></p>
                                </div>
                            </div>
                            <span className="verified-badge">✓ Verified Loop Architecture</span>
                        </div>
                        <p className="overview-narrative">{dossier.overview}</p>
                    </div>

                    {/* ── Section 1: Exact Interview Loop Architecture ── */}
                    <div className="dossier-section">
                        <div className="section-header">
                            <span className="section-num">01</span>
                            <div>
                                <h3 className="section-title">Interview Loop Architecture</h3>
                                <p className="section-subtitle">Verified stage-by-stage evaluation pipeline and focus criteria</p>
                            </div>
                        </div>

                        <div className="loop-stages-timeline">
                            {dossier.interviewLoop?.map((stage, idx) => (
                                <div key={idx} className="stage-card">
                                    <div className="stage-top">
                                        <span className="stage-round-pill">Stage {stage.round || idx + 1}</span>
                                        <span className="stage-duration">{stage.duration}</span>
                                    </div>
                                    <h4 className="stage-title">{stage.title}</h4>
                                    <p className="stage-focus">{stage.focus}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ── Section 2: Engineering Culture DNA ── */}
                    <div className="dossier-section">
                        <div className="section-header">
                            <span className="section-num">02</span>
                            <div>
                                <h3 className="section-title">Engineering Culture &amp; Stack DNA</h3>
                                <p className="section-subtitle">Production technologies, scaling principles, and architectural style</p>
                            </div>
                        </div>

                        <div className="culture-dna-grid">
                            <div className="dna-card">
                                <h4>🛠️ Known Core Tech Stack</h4>
                                <div className="tech-stack-pills">
                                    {dossier.engineeringDna?.techStack?.map((tech, i) => (
                                        <span key={i} className="tech-pill">{tech}</span>
                                    ))}
                                </div>
                            </div>

                            <div className="dna-card">
                                <h4>🏛️ Architectural Philosophy</h4>
                                <p>{dossier.engineeringDna?.architecturalCulture}</p>
                            </div>

                            <div className="dna-card dna-card--full">
                                <h4>⚡ Recent Engineering &amp; Scaling Challenges</h4>
                                <p>{dossier.engineeringDna?.recentChallenges}</p>
                            </div>
                        </div>
                    </div>

                    {/* ── Section 3: Killer Reverse Questions ── */}
                    <div className="dossier-section">
                        <div className="section-header">
                            <span className="section-num">03</span>
                            <div>
                                <h3 className="section-title">"Killer Reverse Questions" to Ask Them</h3>
                                <p className="section-subtitle">
                                    Ask these high-impact questions when the interviewer says: <em>"Do you have any questions for me?"</em>
                                </p>
                            </div>
                        </div>

                        <div className="reverse-questions-list">
                            {dossier.killerReverseQuestions?.map((qItem, idx) => (
                                <div key={idx} className="reverse-question-card">
                                    <div className="rq-top">
                                        <span className="rq-badge">RECOMMENDED QUESTION #{idx + 1}</span>
                                        <button
                                            type="button"
                                            className="btn-copy-question"
                                            onClick={() => handleCopyQuestion(qItem.question, idx)}
                                        >
                                            {copiedIndex === idx ? (
                                                <span className="copied-text">✓ Copied</span>
                                            ) : (
                                                <>
                                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                                                    Copy Question
                                                </>
                                            )}
                                        </button>
                                    </div>
                                    <p className="rq-text">"{qItem.question}"</p>
                                    <div className="rq-why">
                                        <strong>Why this wows them: </strong> {qItem.whyItImpresses}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ── Section 4: Insider Tips ── */}
                    {dossier.insiderTips?.length > 0 && (
                        <div className="dossier-section">
                            <div className="section-header">
                                <span className="section-num">04</span>
                                <div>
                                    <h3 className="section-title">Insider Preparation Playbook</h3>
                                    <p className="section-subtitle">Tactical tips to clear their specific bar</p>
                                </div>
                            </div>

                            <div className="insider-tips-box">
                                <ul>
                                    {dossier.insiderTips.map((tip, i) => (
                                        <li key={i}>{tip}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
