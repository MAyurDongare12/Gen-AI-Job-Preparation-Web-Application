import React, { useState } from 'react';
import { generateReferralOutreachApi } from '../../interview/services/interview.api';
import '../style/ReferralEngine.scss';

const PRESETS = [
    {
        name: 'Senior Backend @ Stripe',
        company: 'Stripe',
        role: 'Senior Backend Engineer',
        background: '5 years building distributed microservices in Go & PostgreSQL. Spearheaded API architecture cutting p99 latency by 42% and processing $15M daily volume.',
        hook: 'Followed their recent engineering blog post on distributed consensus and zero-downtime ledger migration.'
    },
    {
        name: 'Staff Frontend @ Airbnb',
        company: 'Airbnb',
        role: 'Staff Frontend Engineer',
        background: '7 years scaling React, TypeScript, and design systems. Led core performance overhaul reducing First Contentful Paint by 35% across 12M monthly active users.',
        hook: 'Enthusiastic admirer of Airbnb UI design system and open-source contributions to component architecture.'
    },
    {
        name: 'ML Infrastructure @ OpenAI',
        company: 'OpenAI',
        role: 'Machine Learning Systems Engineer',
        background: '4 years scaling distributed GPU clusters, PyTorch training pipelines, and low-latency LLM inference caching in Kubernetes.',
        hook: 'Deeply inspired by recent breakthroughs in inference quantization and speculative decoding.'
    }
];

const ReferralEngine = () => {
    const [targetCompany, setTargetCompany] = useState('Stripe');
    const [targetRole, setTargetRole] = useState('Senior Backend Engineer');
    const [candidateBackground, setCandidateBackground] = useState(
        '5 years building distributed microservices in Go & PostgreSQL. Spearheaded API architecture cutting p99 latency by 42%.'
    );
    const [hookDetails, setHookDetails] = useState(
        'Followed their recent engineering blog post on distributed consensus.'
    );
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [campaignData, setCampaignData] = useState(null);
    const [copiedIndex, setCopiedIndex] = useState(null);

    const handleApplyPreset = (p) => {
        setTargetCompany(p.company);
        setTargetRole(p.role);
        setCandidateBackground(p.background);
        setHookDetails(p.hook);
    };

    const handleGenerateCampaign = async (e) => {
        if (e) e.preventDefault();
        if (!targetCompany.trim() || !targetRole.trim()) {
            setError('Please provide at least a Target Company and Target Role.');
            return;
        }

        setError(null);
        setLoading(true);

        try {
            const res = await generateReferralOutreachApi({
                candidateBackground,
                targetCompany,
                targetRole,
                recipientType: 'all',
                hookDetails
            });
            if (res && res.data) {
                setCampaignData(res.data);
            }
        } catch (err) {
            console.error('Outreach generation failed:', err);
            setError(err.response?.data?.message || 'Failed to generate outreach scripts. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = (text, idx) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(idx);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    return (
        <div className="referral-engine-page">
            <div className="engine-header">
                <div className="engine-pill">
                    <span>🚀</span> 3-TIER OUTREACH & REFERRAL ENGINE
                </div>
                <h1>1-Click High-Converting Networking Engine</h1>
                <p>
                    Cold messaging engineers and hiring managers without a hook gets a 2% reply rate. This engine crafts 3 psychologically calibrated outreach tiers—Peer Curiosity, Manager ROI, and Recruiter Signal—designed to get responses in under 100 words.
                </p>
            </div>

            {/* Quick Presets */}
            <div className="preset-pills-container">
                <span className="preset-label">Quick Load Roles & Profiles:</span>
                <div className="preset-pills">
                    {PRESETS.map((p, idx) => (
                        <button
                            key={idx}
                            type="button"
                            className="preset-btn"
                            onClick={() => handleApplyPreset(p)}
                        >
                            ⚡ {p.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Input Form */}
            <div className="engine-form-card">
                <form onSubmit={handleGenerateCampaign}>
                    <div className="form-row">
                        <div className="form-group">
                            <label>
                                Target Company <span className="required">*</span>
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. Stripe, Airbnb, Datadog"
                                value={targetCompany}
                                onChange={(e) => setTargetCompany(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>
                                Target Role <span className="required">*</span>
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. Senior Backend Engineer, Staff ML Engineer"
                                value={targetRole}
                                onChange={(e) => setTargetRole(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>
                            Your Core Value Proposition & Metrics <span className="optional-tag">(skills, quantifiable wins, years of experience)</span>
                        </label>
                        <textarea
                            rows={3}
                            placeholder="e.g. 4 years scaling distributed systems in Go/PostgreSQL. Reduced p99 query latency by 45% and mentored 3 junior engineers..."
                            value={candidateBackground}
                            onChange={(e) => setCandidateBackground(e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label>
                            Connection Hook / Common Ground <span className="optional-tag">(blog post, shared tech stack, alumni, open source)</span>
                        </label>
                        <input
                            type="text"
                            placeholder="e.g. Followed their talk on Kafka stream processing, fellow Purdue alumni, shared contributor to Fastify"
                            value={hookDetails}
                            onChange={(e) => setHookDetails(e.target.value)}
                        />
                    </div>

                    {error && (
                        <div style={{ color: '#f85149', marginBottom: '1rem', fontSize: '0.9rem' }}>
                            ⚠️ {error}
                        </div>
                    )}

                    <div className="form-actions">
                        <button
                            type="submit"
                            className="generate-outreach-btn"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <div className="spinner" />
                                    Synthesizing 3-Tier Hooks...
                                </>
                            ) : (
                                <>
                                    <span>🎯</span> Generate 3-Tier Referral Campaign
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>

            {/* Campaign Results */}
            {campaignData && (
                <div className="outreach-results-container">
                    {/* Cadence Banner */}
                    <div className="cadence-banner">
                        <div className="cadence-left">
                            <h3><span>⏰</span> Optimal Outreach Timing & Rhythm</h3>
                            <p>{campaignData.strategyOverview?.recommendedCadence}</p>
                        </div>
                        <div className="cadence-metric">
                            <div className="metric-rate">
                                {campaignData.strategyOverview?.responseRateProjection || '70%'}
                            </div>
                            <div className="metric-label">Projected Response Rate</div>
                        </div>
                    </div>

                    {/* 3-Tier Cards Grid */}
                    {campaignData.tiers && (
                        <div className="tier-cards-grid">
                            {campaignData.tiers.map((tier, idx) => (
                                <div className="tier-card" key={idx}>
                                    <div className="tier-header">
                                        <span className={`tier-badge tier-${tier.tierId}`}>
                                            {tier.tierName}
                                        </span>
                                        <h4>{tier.subtitle}</h4>
                                    </div>

                                    <div className="trigger-box">
                                        <strong>🧠 Psychological Trigger:</strong> {tier.psychologicalTrigger}
                                    </div>

                                    <div className="subject-line-box">
                                        <span className="sub-label">Subject Line</span>
                                        <span className="sub-text">{tier.subject}</span>
                                    </div>

                                    <div className="message-body-box">
                                        <div className="body-top">
                                            <span style={{ fontSize: '0.75rem', color: '#8b949e', fontWeight: 600 }}>Message Body</span>
                                            <span className="word-pill">{tier.wordCount || 80} words</span>
                                        </div>
                                        <p className="body-text">{tier.messageBody}</p>
                                    </div>

                                    {tier.followUpNudge && (
                                        <div className="follow-up-box">
                                            <span className="nudge-label">4-Day Follow-Up Nudge:</span>
                                            <p>{tier.followUpNudge}</p>
                                        </div>
                                    )}

                                    <div className="card-actions">
                                        <button
                                            type="button"
                                            className="copy-outreach-btn"
                                            onClick={() => handleCopy(`Subject: ${tier.subject}\n\n${tier.messageBody}`, idx)}
                                        >
                                            {copiedIndex === idx ? '✓ Copied to Clipboard' : '📋 Copy Message'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Do's & Don'ts */}
                    {campaignData.dosAndDonts && (
                        <div className="rules-card">
                            <h4>Referral Outreaching Best Practices</h4>
                            <div className="rules-grid">
                                <div className="dos-column">
                                    <h5 style={{ color: '#7ee787', margin: '0 0 0.5rem' }}>✅ What Wins Referrals</h5>
                                    <ul>
                                        {campaignData.dosAndDonts.dos?.map((d, i) => (
                                            <li key={i}>✓ {d}</li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="donts-column">
                                    <h5 style={{ color: '#f85149', margin: '0 0 0.5rem' }}>❌ Instant Rejections</h5>
                                    <ul>
                                        {campaignData.dosAndDonts.donts?.map((d, i) => (
                                            <li key={i}>✕ {d}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ReferralEngine;
