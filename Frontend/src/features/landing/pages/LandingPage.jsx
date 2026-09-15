import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../../auth/hooks/useAuth';
import CinematicCanvasBackground from '../components/CinematicCanvasBackground';
import '../style/LandingPage.scss';

const RemotionHeroPlayer = lazy(() => import('../components/RemotionHeroPlayer'));

const FEATURES = [
    {
        icon: '🎙️',
        title: 'AI Voice Mock Studio',
        desc: 'Realistic oral mock interview practice with live Web Speech dictation, audio playback, filler-word telemetry, and 3 tough FAANG interviewer personas.',
        path: '/dashboard',
        accent: '#c084fc',
        tag: 'Web Speech API'
    },
    {
        icon: '⚡',
        title: 'STAR Method Teleprompter',
        desc: 'Interactive teleprompter grading behavioral responses on the fly. Automatically transforms rambling stories into crisp Google XYZ formula bullet points.',
        path: '/dashboard',
        accent: '#38bdf8',
        tag: 'Google XYZ Grader'
    },
    {
        icon: '💰',
        title: 'Salary Negotiation War Room',
        desc: 'Total comp simulator with real-time P25-P90 market percentiles. Gemini roleplays recruiter counter-offers and drafts high-leverage counter-offer letters.',
        path: '/salary-war-room',
        accent: '#fbbf24',
        tag: 'Recruiter Simulator'
    },
    {
        icon: '🏢',
        title: 'Company Insider & Culture DNA',
        desc: 'Declassified interview loop breakdown for Tier-1 companies. Reveals round duration, pass criteria, engineering challenges, and killer reverse questions.',
        path: '/company-intelligence',
        accent: '#34d399',
        tag: 'Loop Declassified'
    },
    {
        icon: '🔬',
        title: 'Staff Engineer Code Auditor',
        desc: 'Scrutinizes repositories and architectures like an L6+ Tech Lead. Spot race conditions, memory bottlenecks, and simulate high-pressure grilling defense sessions.',
        path: '/portfolio-auditor',
        accent: '#a855f7',
        tag: 'Interviewer Lens'
    },
    {
        icon: '🚀',
        title: '1-Click Networking Engine',
        desc: 'Generates 3 psychologically calibrated cold outreach campaigns (Peer Curiosity, Manager ROI, Recruiter Signal) strictly under 100 words with follow-up nudges.',
        path: '/referral-engine',
        accent: '#f43f5e',
        tag: '3-Tier Outreach'
    }
];

const PLAYGROUND_PREVIEWS = [
    {
        id: 'voice',
        tabName: '🎙️ Voice Mock',
        title: 'Real-Time Voice Dictation & Bar Raiser Personas',
        desc: 'Practice speaking aloud under pressure. Our engine listens via Web Speech API, analyzes your cadence and speech patterns, and speaks back with audio synthesis.',
        pill: 'Oral Telemetry Enabled',
        actionText: 'Launch Voice Studio',
        actionPath: '/dashboard'
    },
    {
        id: 'star',
        tabName: '⚡ STAR Grader',
        title: 'Situation • Task • Action • Result Analyzer',
        desc: 'Get graded on quantifiable business metrics. Our Gemini engine takes your rough draft and rewrites it into Google XYZ format with 1-click clipboard copy.',
        pill: 'Rubric Score: 94/100',
        actionText: 'Test STAR Grader',
        actionPath: '/dashboard'
    },
    {
        id: 'salary',
        tabName: '💰 Salary War Room',
        title: 'Market Percentile Benchmarking & Recruiter Roleplay',
        desc: 'Calculate Total Comp ($ Base + Bonus % + Equity + Sign-on). Simulate recruiter pushback on equity vs base salary, and generate proven counter-offer letters.',
        pill: 'Avg. Uplift: +$34,200',
        actionText: 'Open War Room',
        actionPath: '/salary-war-room'
    },
    {
        id: 'portfolio',
        tabName: '🔬 Code Auditor',
        title: 'Staff Engineer Code & Architecture Scrutiny',
        desc: 'Tear down your GitHub repo or architecture snippet before interview day. Identify split-brain traps, non-atomic pipelines, and practice tactical defense scripts.',
        pill: 'FAANG L6 Scrutiny',
        actionText: 'Audit Your Code',
        actionPath: '/portfolio-auditor'
    },
    {
        id: 'referral',
        tabName: '🚀 Referral Engine',
        title: 'High-Converting 3-Tier Outreach Generator',
        desc: 'Stop sending generic InMails that get ignored. Craft concise, high-converting messages tailored specifically for Peer Engineers, Engineering Managers, or Recruiters.',
        pill: '74% Response Projection',
        actionText: 'Generate Campaign',
        actionPath: '/referral-engine'
    }
];

const TESTIMONIALS = [
    {
        name: 'Arjun M.',
        title: 'Staff Software Engineer @ Google',
        initials: 'AM',
        quote: 'The Staff Code Auditor caught the exact concurrency race condition my Google interviewer grilled me on in the Systems round. Practicing the defense script made me look like an L6 veteran.'
    },
    {
        name: 'Elena R.',
        title: 'Senior Backend Engineer @ Stripe',
        initials: 'ER',
        quote: 'Using the Salary War Room counter-offer draft, I negotiated an additional $35,000 in equity and a $15,000 sign-on bump without burning any goodwill. Best career tool on the market.'
    },
    {
        name: 'David K.',
        title: 'Full Stack Engineer @ Meta',
        initials: 'DK',
        quote: 'The Voice Mock studio with the Tough Bar Raiser persona felt eerily real. It broke my crutch word habits in 3 sessions and helped me nail the behavioral round.'
    }
];

const LandingPage = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState(0);

    // Idle prefetching for sub-routes so transitions feel 0ms instantaneous
    useEffect(() => {
        const scheduleIdle = window.requestIdleCallback || ((cb) => setTimeout(cb, 1200));
        const handle = scheduleIdle(() => {
            import('../../interview/pages/Home');
            import('../../salary/pages/SalaryWarRoom');
            import('../../company/pages/CompanyIntelligence');
            import('../../portfolio/pages/PortfolioAuditor');
            import('../../networking/pages/ReferralEngine');
            import('../../auth/pages/Login');
            import('../../auth/pages/Register');
        });

        return () => {
            if (window.cancelIdleCallback && handle) {
                window.cancelIdleCallback(handle);
            }
        };
    }, []);

    const activePreview = PLAYGROUND_PREVIEWS[activeTab];

    return (
        <div className="landing-page-root">
            {/* Interactive Particle Starfield */}
            <CinematicCanvasBackground />

            <div className="landing-content">
                {/* HERO SECTION */}
                <section className="hero-section">
                    <div className="hero-badge">
                        <span className="sparkle">✦</span> NEXT-GENERATION AI CAREER INTELLIGENCE PLATFORM <span className="sparkle">✦</span>
                    </div>

                    <h1 className="hero-title">
                        Land Tier-1 Tech Offers With <br />
                        <span className="gradient-text">Zero Guesswork.</span>
                    </h1>

                    <p className="hero-subtitle">
                        The unified AI preparation engine designed for modern engineers. Voice mock interviews with FAANG bar raisers, real-time STAR teleprompter, salary negotiation war room, and staff engineer code audits.
                    </p>

                    <div className="hero-cta-group">
                        <Link to={user ? "/dashboard" : "/register"} className="cta-primary">
                            <span>🚀</span> {user ? "Enter Studio Dashboard" : "Launch Free Studio Pass"}
                        </Link>
                        <Link to="/salary-war-room" className="cta-secondary">
                            <span>💰</span> Explore Salary War Room
                        </Link>
                    </div>
                </section>

                {/* REMOTION CINEMATIC VIDEO / COCKPIT FRAME */}
                <Suspense fallback={
                    <div className="remotion-hero-player-wrapper" style={{ minHeight: '380px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ color: '#38bdf8', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '18px', height: '18px', border: '2px solid rgba(56, 189, 248, 0.2)', borderTopColor: '#38bdf8', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                            <span>Hydrating 60 FPS Remotion Video Cockpit...</span>
                        </div>
                    </div>
                }>
                    <RemotionHeroPlayer />
                </Suspense>

                {/* STATS STRIP */}
                <div className="stats-strip">
                    <div className="stat-item">
                        <div className="stat-number">12,400+</div>
                        <div className="stat-label">Tier-1 Offers Landed</div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-number">+$34.2k</div>
                        <div className="stat-label">Average Salary Uplift</div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-number">94.8%</div>
                        <div className="stat-label">First-Round Pass Rate</div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-number">60 FPS</div>
                        <div className="stat-label">Live Remotion Telemetry</div>
                    </div>
                </div>

                {/* INTERACTIVE PLAYGROUND TEASER */}
                <section className="interactive-playground-section">
                    <div className="playground-header">
                        <h2>Experience The 6 Engines Live</h2>
                        <p>Select an engine below to preview its real-time AI capabilities</p>
                    </div>

                    <div className="playground-tabs">
                        {PLAYGROUND_PREVIEWS.map((tab, idx) => (
                            <button
                                key={tab.id}
                                type="button"
                                className={`tab-btn ${activeTab === idx ? 'active' : ''}`}
                                onClick={() => setActiveTab(idx)}
                            >
                                {tab.tabName}
                            </button>
                        ))}
                    </div>

                    <div className="playground-preview-box" key={activePreview.id}>
                        <div className="box-title">
                            <span>⚡</span> {activePreview.title}
                        </div>
                        <p className="box-desc">{activePreview.desc}</p>
                        <div className="box-action-row">
                            <span className="pill-tag">{activePreview.pill}</span>
                            <Link to={activePreview.actionPath} className="open-engine-btn">
                                {activePreview.actionText} →
                            </Link>
                        </div>
                    </div>
                </section>

                {/* ALL 6 FEATURES MATRIX */}
                <section className="features-section">
                    <div className="section-header">
                        <span className="section-badge">Comprehensive Career Armor</span>
                        <h2>Engineered For Senior & High-Earning Talent</h2>
                        <p>Every tool is designed with technical rigor, zero fluff, and instant tactical utility.</p>
                    </div>

                    <div className="features-grid">
                        {FEATURES.map((f, idx) => (
                            <div
                                key={idx}
                                className="feature-card"
                                style={{ '--card-accent': f.accent }}
                            >
                                <div className="card-icon">{f.icon}</div>
                                <h3>{f.title}</h3>
                                <p>{f.desc}</p>
                                <Link to={f.path} className="card-link">
                                    Launch Tool →
                                </Link>
                            </div>
                        ))}
                    </div>
                </section>

                {/* TESTIMONIALS */}
                <section className="testimonials-section">
                    <div className="section-header">
                        <h2>Trusted By Engineers At Top Tech Giants</h2>
                        <p>See how candidates accelerated their careers and broke through compensation ceilings.</p>
                    </div>

                    <div className="testimonials-grid">
                        {TESTIMONIALS.map((t, idx) => (
                            <div key={idx} className="testimonial-card">
                                <p className="quote-text">"{t.quote}"</p>
                                <div className="author-info">
                                    <div className="author-avatar">{t.initials}</div>
                                    <div className="author-details">
                                        <div className="name">{t.name}</div>
                                        <div className="title">{t.title}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* FOOTER */}
                <footer className="landing-footer">
                    <div className="footer-brand">
                        <span>Career<span className="brand-accent">AI</span></span>
                        <span style={{ fontSize: '0.75rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>PRO</span>
                    </div>
                    <div className="footer-links">
                        <Link to="/dashboard">Dashboard</Link>
                        <Link to="/salary-war-room">Salary War Room</Link>
                        <Link to="/portfolio-auditor">Code Auditor</Link>
                        <Link to="/referral-engine">Referral Engine</Link>
                    </div>
                    <div>
                        © 2026 CareerAI Inc. All rights reserved.
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default LandingPage;
