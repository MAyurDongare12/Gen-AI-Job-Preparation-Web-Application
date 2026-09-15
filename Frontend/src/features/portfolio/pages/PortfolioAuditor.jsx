import React, { useState } from 'react';
import { auditPortfolioApi } from '../../interview/services/interview.api';
import '../style/PortfolioAuditor.scss';

const PRESETS = [
    {
        name: 'Distributed Rate Limiter',
        role: 'Staff Distributed Systems Engineer',
        repoUrl: 'https://github.com/alex-chen/distributed-rate-limiter',
        desc: 'High-throughput distributed token-bucket and sliding window rate limiter designed in Node.js and Redis, capable of handling 50k req/sec across geographically distributed clusters.',
        codeSnippet: `const redis = require('ioredis');

// Sliding Window Log Rate Limiter
async function checkSlidingWindow(userId, limit, windowSec) {
    const now = Date.now();
    const clearBefore = now - (windowSec * 1000);
    const key = \`ratelimit:\${userId}\`;

    const multi = redis.multi();
    multi.zremrangebyscore(key, 0, clearBefore);
    multi.zadd(key, now, now);
    multi.zcard(key);
    multi.expire(key, windowSec);

    const results = await multi.exec();
    const count = results[2][1];
    return count <= limit;
}`
    },
    {
        name: 'E-Commerce Checkout & Outbox',
        role: 'Senior Backend Engineer',
        repoUrl: 'https://github.com/jordan-dev/payment-outbox-service',
        desc: 'Event-driven microservice using PostgreSQL and Kafka with the Transactional Outbox pattern to guarantee at-least-once message delivery during payment processing.',
        codeSnippet: `async function processCheckout(orderId, amount, client) {
    await client.query('BEGIN');
    try {
        const order = await client.query(
            'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
            ['PROCESSING', orderId]
        );
        // Write to Outbox table within same ACID transaction
        await client.query(
            'INSERT INTO outbox_events (aggregate_id, event_type, payload) VALUES ($1, $2, $3)',
            [orderId, 'ORDER_SUBMITTED', JSON.stringify({ orderId, amount })]
        );
        await client.query('COMMIT');
        return order.rows[0];
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    }
}`
    },
    {
        name: 'Real-Time Collaborative Canvas',
        role: 'Senior Frontend & Systems Architect',
        repoUrl: 'https://github.com/sarah-ux/collaborative-canvas',
        desc: 'Real-time multi-user drawing and whiteboard canvas leveraging CRDTs (Yjs) over WebSockets with optimistic client-side updates and canvas rendering optimizations.',
        codeSnippet: `import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

const ydoc = new Y.Doc();
const provider = new WebsocketProvider('wss://canvas.example.com', 'room-101', ydoc);
const yShapes = ydoc.getArray('shapes');

yShapes.observe(event => {
    event.changes.added.forEach(item => {
        item.content.getContent().forEach(shape => renderToOffscreenCanvas(shape));
    });
    requestAnimationFrame(flushCanvasBuffer);
});`
    }
];

const PortfolioAuditor = () => {
    const [repoUrl, setRepoUrl] = useState('');
    const [targetRole, setTargetRole] = useState('Senior Full Stack Engineer');
    const [projectDescription, setProjectDescription] = useState('');
    const [codeSnippet, setCodeSnippet] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [auditData, setAuditData] = useState(null);
    const [copiedId, setCopiedId] = useState(null);

    const handleApplyPreset = (preset) => {
        setRepoUrl(preset.repoUrl);
        setTargetRole(preset.role);
        setProjectDescription(preset.desc);
        setCodeSnippet(preset.codeSnippet);
    };

    const handleSubmitAudit = async (e) => {
        if (e) e.preventDefault();
        if (!projectDescription.trim() && !codeSnippet.trim() && !repoUrl.trim()) {
            setError('Please provide at least a project description, code snippet, or repository URL.');
            return;
        }

        setError(null);
        setLoading(true);

        try {
            const res = await auditPortfolioApi({
                repoUrl,
                codeSnippet,
                projectDescription,
                targetRole
            });
            if (res && res.data) {
                setAuditData(res.data);
            }
        } catch (err) {
            console.error('Audit failed:', err);
            setError(err.response?.data?.message || 'Failed to analyze portfolio. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleCopyDefense = (text, id) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const getScoreColor = (score) => {
        if (score >= 85) return '#56d364';
        if (score >= 70) return '#e3b341';
        return '#f85149';
    };

    return (
        <div className="portfolio-auditor-page">
            <div className="auditor-header">
                <div className="auditor-pill">
                    <span>🔬</span> STAFF & PRINCIPAL INTERVIEWER LENS
                </div>
                <h1>GitHub & Architecture Deep Auditor</h1>
                <p>
                    Tear down your code, repository, and design through the ruthless scrutiny of FAANG L6+ Tech Leads. Uncover hidden architectural red flags, identify race conditions, and practice tactical defense scripts for tough technical grill sessions.
                </p>
            </div>

            {/* Quick Presets */}
            <div className="preset-pills-container">
                <span className="preset-label">Quick Load Sample Architectures:</span>
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

            {/* Input Form Card */}
            <div className="auditor-form-card">
                <form onSubmit={handleSubmitAudit}>
                    <div className="form-row">
                        <div className="form-group">
                            <label>
                                GitHub / Project URL <span className="optional-tag">(optional)</span>
                            </label>
                            <input
                                type="url"
                                placeholder="https://github.com/username/project"
                                value={repoUrl}
                                onChange={(e) => setRepoUrl(e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label>
                                Target Role <span className="required">*</span>
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. Senior Full Stack Engineer, Staff Backend Architect"
                                value={targetRole}
                                onChange={(e) => setTargetRole(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>
                            System Architecture & Design Overview
                        </label>
                        <textarea
                            rows={3}
                            placeholder="Explain the problem your project solves, data flow, distributed components, database choices, and key technical decisions..."
                            value={projectDescription}
                            onChange={(e) => setProjectDescription(e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label>
                            Core Code Snippet / Module <span className="optional-tag">(paste key business logic, query, or middleware)</span>
                        </label>
                        <textarea
                            className="code-snippet-input"
                            rows={6}
                            placeholder="// Paste your critical algorithm, database query, or state handler here..."
                            value={codeSnippet}
                            onChange={(e) => setCodeSnippet(e.target.value)}
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
                            className="submit-audit-btn"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <div className="spinner" />
                                    Scrutinizing Architecture...
                                </>
                            ) : (
                                <>
                                    <span>🔍</span> Audit Through Interviewer Lens
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>

            {/* Audit Results */}
            {auditData && (
                <div className="audit-results-container">
                    {/* Hero Verdict Card */}
                    <div className="verdict-hero-card">
                        <div className="score-circle-wrapper">
                            <div
                                className="score-circle"
                                style={{ borderColor: getScoreColor(auditData.repoSummary?.overallScore || 75) }}
                            >
                                <span className="score-num">{auditData.repoSummary?.overallScore || 80}</span>
                                <span className="score-max">/ 100</span>
                            </div>
                        </div>
                        <div className="verdict-details">
                            <div className="verdict-badges">
                                <span className="badge-role">{auditData.repoSummary?.projectType || 'Distributed Application'}</span>
                                <span className="badge-seniority">Evaluated Level: {auditData.repoSummary?.seniorityImpression || 'Senior'}</span>
                            </div>
                            <h2>Staff Engineer Verdict</h2>
                            <p className="verdict-text">{auditData.repoSummary?.summaryVerdict}</p>
                        </div>
                    </div>

                    {/* Production Readiness Metrics */}
                    {auditData.staffEngineerAudit?.productionReadiness && (
                        <div className="metrics-bar-grid">
                            {Object.entries(auditData.staffEngineerAudit.productionReadiness).map(([key, val]) => (
                                <div className="metric-bar-card" key={key}>
                                    <div className="metric-info">
                                        <span style={{ textTransform: 'capitalize' }}>{key}</span>
                                        <span>{val}%</span>
                                    </div>
                                    <div className="progress-track">
                                        <div
                                            className="progress-fill"
                                            style={{
                                                width: `${val}%`,
                                                backgroundColor: getScoreColor(val)
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Red Flags & Architectural Vulnerabilities */}
                    {auditData.staffEngineerAudit?.redFlags && (
                        <div className="red-flags-section">
                            <div className="section-heading">
                                <span>⚠️</span>
                                <h3>Staff Scrutiny: Architectural Red Flags ({auditData.staffEngineerAudit.redFlags.length})</h3>
                            </div>
                            <div className="red-flags-list">
                                {auditData.staffEngineerAudit.redFlags.map((flag, idx) => (
                                    <div className="red-flag-card" key={idx}>
                                        <div className="flag-header">
                                            <span className={`severity-badge severity-${flag.severity || 'HIGH'}`}>
                                                {flag.severity || 'HIGH'}
                                            </span>
                                            <h4>{flag.issue}</h4>
                                        </div>
                                        <div className="flag-quote">
                                            "{flag.interviewerThought}"
                                            <span className="quote-author">— Staff Engineer Interviewer</span>
                                        </div>
                                        <div className="flag-fix">
                                            <strong>🛠️ Fix / Refactor:</strong> {flag.recommendedFix}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* High-Pressure Grilling Defense Simulator */}
                    {auditData.grillingDefenseQuestions && (
                        <div className="grilling-section">
                            <div className="section-heading">
                                <span>🎯</span>
                                <h3>Grilling Defense Simulator: High-Pressure Interview Questions</h3>
                            </div>
                            <div className="grill-cards">
                                {auditData.grillingDefenseQuestions.map((q, idx) => (
                                    <div className="grill-card" key={idx}>
                                        <div className="grill-question-bar">
                                            <span className="q-badge">Q{idx + 1}</span>
                                            <h4>{q.interviewerQuestion}</h4>
                                        </div>
                                        <div className="trap-box">
                                            <strong>🪤 The Trap:</strong> {q.trapBehindQuestion}
                                        </div>
                                        <div className="defense-box">
                                            <div className="defense-top">
                                                <span>Recommended Staff-Level Defense Script</span>
                                                <button
                                                    type="button"
                                                    className="copy-btn"
                                                    onClick={() => handleCopyDefense(q.idealDefense, idx)}
                                                >
                                                    {copiedId === idx ? '✓ Copied' : '📋 Copy Script'}
                                                </button>
                                            </div>
                                            <p>{q.idealDefense}</p>
                                        </div>
                                        {q.proTip && (
                                            <div className="pro-tip">
                                                <strong>💡 Tactical Tip:</strong> {q.proTip}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default PortfolioAuditor;
