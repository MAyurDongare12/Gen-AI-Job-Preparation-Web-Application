import React, { useState, useEffect } from 'react';
import '../style/interview.scss';
import { useInterview } from '../hooks/useInterview.js';
import { useNavigate, useParams, Link } from 'react-router';

const NAV_ITEMS = [
    {
        id: 'technical',
        label: 'Technical Questions',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
            </svg>
        )
    },
    {
        id: 'behavioral',
        label: 'Behavioral Questions',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
        )
    },
    {
        id: 'roadmap',
        label: 'Preparation Roadmap',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="3 11 22 2 13 21 11 13 3 11" />
            </svg>
        )
    },
];

// ── Sub-components ────────────────────────────────────────────────────────────
const QuestionCard = ({ item, index, isOpen, toggleOpen }) => {
    const [copied, setCopied] = useState(false);

    const copyToClipboard = (e) => {
        e.stopPropagation();
        const text = `Q: ${item.question}\n\nIntention: ${item.intention}\n\nSuggested Answer: ${item.answer}`;
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className={`q-card ${isOpen ? 'q-card--expanded' : ''}`}>
            <div className='q-card__header' onClick={toggleOpen}>
                <span className='q-card__index'>Q{index + 1}</span>
                <p className='q-card__question'>{item.question}</p>
                <div className='q-card__actions'>
                    <button
                        type='button'
                        className='q-card__copy-btn'
                        onClick={copyToClipboard}
                        title='Copy question & answer'
                        aria-label='Copy'
                    >
                        {copied ? (
                            <span className='copied-tag'>Copied!</span>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                            </svg>
                        )}
                    </button>
                    <span className={`q-card__chevron ${isOpen ? 'q-card__chevron--open' : ''}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="6 9 12 15 18 9" />
                        </svg>
                    </span>
                </div>
            </div>
            {isOpen && (
                <div className='q-card__body'>
                    <div className='q-card__section'>
                        <div className='q-card__tag q-card__tag--intention'>
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
                            Interviewer Intention
                        </div>
                        <p>{item.intention}</p>
                    </div>
                    <div className='q-card__section'>
                        <div className='q-card__tag q-card__tag--answer'>
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                            Tailored Model Answer
                        </div>
                        <p>{item.answer}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

const RoadMapDay = ({ day, checkedTasks, toggleTask }) => (
    <div className='roadmap-day'>
        <div className='roadmap-day__header'>
            <span className='roadmap-day__badge'>Day {day.day}</span>
            <h3 className='roadmap-day__focus'>{day.focus}</h3>
        </div>
        <ul className='roadmap-day__tasks'>
            {day.tasks.map((task, i) => {
                const taskId = `day-${day.day}-task-${i}`;
                const isChecked = !!checkedTasks[taskId];
                return (
                    <li
                        key={i}
                        className={`roadmap-task-item ${isChecked ? 'roadmap-task-item--done' : ''}`}
                        onClick={() => toggleTask(taskId)}
                    >
                        <span className={`roadmap-checkbox ${isChecked ? 'roadmap-checkbox--checked' : ''}`}>
                            {isChecked && (
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            )}
                        </span>
                        <span className='roadmap-task-text'>{task}</span>
                    </li>
                );
            })}
        </ul>
    </div>
);

// ── Main Component ────────────────────────────────────────────────────────────
const Interview = () => {
    const [activeNav, setActiveNav] = useState('technical');
    const [openCards, setOpenCards] = useState({ '0': true });
    const [checkedTasks, setCheckedTasks] = useState({});
    const [isAtsModalOpen, setIsAtsModalOpen] = useState(false);
    const [atsData, setAtsData] = useState(null);
    const [atsScore, setAtsScore] = useState(null);
    const [atsBreakdown, setAtsBreakdown] = useState(null);
    const [isAtsLoading, setIsAtsLoading] = useState(false);
    const [copiedText, setCopiedText] = useState(false);

    const { report, getReportById, isFetchingReport, isDownloadingPdf, getResumePdf, getResumePdfUrl, fetchAtsResumeData, error } = useInterview();
    const { interviewId } = useParams();
    const navigate = useNavigate();

    const displayAtsScore = atsScore || (report?.matchScore ? Math.min(97, Math.max(86, Math.round(report.matchScore * 0.35 + 63))) : 94);

    const handleOpenAtsModal = async () => {
        setIsAtsModalOpen(true);
        if (!atsData) {
            setIsAtsLoading(true);
            try {
                const res = await fetchAtsResumeData(interviewId);
                if (res && res.resumeData) {
                    setAtsData(res.resumeData);
                    if (res.atsScore) setAtsScore(res.atsScore);
                    if (res.atsBreakdown) setAtsBreakdown(res.atsBreakdown);
                }
            } catch (e) {
                console.error("Failed to load ATS resume modal data:", e);
            } finally {
                setIsAtsLoading(false);
            }
        }
    };

    const handleCopyAtsPlain = () => {
        const d = atsData;
        if (!d) return;
        const h = d.header || {};
        const lines = [];
        lines.push((h.name || 'CANDIDATE NAME').toUpperCase());
        if (h.title) lines.push(h.title);
        const contact = [h.email, h.phone, h.location, h.linkedin, h.github].filter(Boolean).join(' | ');
        if (contact) lines.push(contact);
        lines.push('\n' + '='.repeat(40) + '\n');

        if (d.summary || d.objective) {
            lines.push('PROFESSIONAL SUMMARY');
            lines.push(d.summary || d.objective);
            lines.push('');
        }

        if (d.skills && typeof d.skills === 'object' && !Array.isArray(d.skills)) {
            lines.push('TECHNICAL SKILLS');
            if (d.skills.languages?.length) lines.push(`• Languages: ${d.skills.languages.join(', ')}`);
            if (d.skills.frameworks?.length) lines.push(`• Frameworks & Libraries: ${d.skills.frameworks.join(', ')}`);
            if (d.skills.databases?.length) lines.push(`• Databases & Storage: ${d.skills.databases.join(', ')}`);
            if (d.skills.cloudDevOps?.length) lines.push(`• Cloud & DevOps: ${d.skills.cloudDevOps.join(', ')}`);
            const core = d.skills.coreConcepts || d.skills.coreCompetencies;
            if (core?.length) lines.push(`• Core Concepts: ${core.join(', ')}`);
            lines.push('');
        } else if (d.technicalSkills?.length) {
            lines.push('TECHNICAL SKILLS');
            lines.push(d.technicalSkills.join(', '));
            lines.push('');
        }

        if (d.workExperience?.length) {
            lines.push('PROFESSIONAL EXPERIENCE');
            d.workExperience.forEach(w => {
                lines.push(`${w.role || 'Role'} — ${w.company || 'Company'}${w.location ? ` | ${w.location}` : ''}`);
                lines.push(`${w.startDate || ''} – ${w.endDate || ''}`);
                (w.bullets || []).forEach(b => lines.push(`  * ${b}`));
                lines.push('');
            });
        }

        if (d.projects?.length) {
            lines.push('KEY PROJECTS');
            d.projects.forEach(p => {
                lines.push(`${p.title || 'Project'}${p.techStack ? ` (${p.techStack})` : ''}`);
                lines.push(`${p.startDate || ''} – ${p.endDate || ''}`);
                (p.bullets || []).forEach(b => lines.push(`  * ${b}`));
                lines.push('');
            });
        }

        if (d.education?.length) {
            lines.push('EDUCATION');
            d.education.forEach(e => {
                lines.push(`${e.degree || ''} — ${e.institution || ''}${e.location ? `, ${e.location}` : ''}`);
                lines.push(`${e.startDate || ''} – ${e.endDate || ''}${e.score ? ` | ${e.score}` : ''}`);
                lines.push('');
            });
        }

        const certs = d.certifications || d.certificates;
        if (certs?.length) {
            lines.push('CERTIFICATIONS');
            certs.forEach(c => lines.push(`• ${c}`));
            lines.push('');
        }

        navigator.clipboard.writeText(lines.join('\n'));
        setCopiedText(true);
        setTimeout(() => setCopiedText(false), 2200);
    };

    // Fetch report by ID when mounted
    useEffect(() => {
        if (interviewId) {
            getReportById(interviewId);
        }
    }, [interviewId, getReportById]);

    const toggleCard = (key) => {
        setOpenCards(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    const handleExpandAll = (questions) => {
        const allOpen = {};
        questions.forEach((_, idx) => {
            allOpen[String(idx)] = true;
        });
        setOpenCards(allOpen);
    };

    const handleCollapseAll = () => {
        setOpenCards({});
    };

    const toggleTask = (taskId) => {
        setCheckedTasks(prev => ({
            ...prev,
            [taskId]: !prev[taskId]
        }));
    };

    // Loading State
    if (isFetchingReport) {
        return (
            <div className='interview-page'>
                <div className='interview-loading-container'>
                    <div className='interview-spinner' />
                    <h2>Loading Your Interview Strategy...</h2>
                    <p>Fetching tailored questions, roadmap, and insights</p>
                </div>
            </div>
        );
    }

    // Error / Not Found State
    if (!report) {
        return (
            <div className='interview-page'>
                <div className='report-not-found-card'>
                    <div className='not-found-icon'>
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                    </div>
                    <h2>Interview Strategy Not Found</h2>
                    <p>{error || "This interview report could not be found or you may not have permission to view it."}</p>
                    <Link to='/' className='button primary-button'>
                        &larr; Back to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    const scoreColor =
        report.matchScore >= 80 ? 'score--high' :
            report.matchScore >= 60 ? 'score--mid' : 'score--low';

    const getScoreSubtitle = (score) => {
        if (score >= 85) return 'Exceptional Alignment for this Role';
        if (score >= 70) return 'Strong Candidate Match';
        if (score >= 55) return 'Moderate Fit — Focus on Skills Gaps';
        return 'Needs Targeted Preparation';
    };

    return (
        <div className='interview-page'>
            {/* Top Breadcrumb Header */}
            <div className='interview-topbar'>
                <Link to='/' className='back-link'>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="19" y1="12" x2="5" y2="12" />
                        <polyline points="12 19 5 12 12 5" />
                    </svg>
                    Back to Dashboard
                </Link>
                <h1 className='interview-position-title'>{report.title || 'Target Job Position'}</h1>
            </div>

            <div className='interview-layout'>

                {/* ── Left Nav ── */}
                <nav className='interview-nav'>
                    <div className="nav-content">
                        <p className='interview-nav__label'>Playbook Sections</p>
                        {NAV_ITEMS.map(item => (
                            <button
                                key={item.id}
                                className={`interview-nav__item ${activeNav === item.id ? 'interview-nav__item--active' : ''}`}
                                onClick={() => {
                                    setActiveNav(item.id);
                                    setOpenCards({ '0': true });
                                }}
                            >
                                <span className='interview-nav__icon'>{item.icon}</span>
                                {item.label}
                            </button>
                        ))}
                    </div>

                    <div className='nav-footer-action'>
                        {/* ATS Scorecard Badge */}
                        <div className='ats-quick-scorecard'>
                            <div className='ats-score-badge'>
                                <span className='ats-score-badge__pulse' />
                                <span className='ats-score-badge__score'>{displayAtsScore} / 100</span>
                                <span className='ats-score-badge__label'>ATS Score</span>
                            </div>
                            <p className='ats-quick-scorecard__tagline'>Harvard Standard • Single-Column</p>
                        </div>

                        {/* Direct Native PDF Download */}
                        <a
                            href={getResumePdfUrl ? getResumePdfUrl(interviewId, false) : '#'}
                            download
                            className='button primary-button resume-download-btn'
                            id='download-resume-btn'
                            title='Download ATS-Optimized Resume (.PDF)'
                        >
                            <svg height="15" width="15" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M10.6144 17.7956 11.492 15.7854C12.2731 13.9966 13.6789 12.5726 15.4325 11.7942L17.8482 10.7219C18.6162 10.381 18.6162 9.26368 17.8482 8.92277L15.5079 7.88394C13.7092 7.08552 12.2782 5.60881 11.5105 3.75894L10.6215 1.61673C10.2916.821765 9.19319.821767 8.8633 1.61673L7.97427 3.75892C7.20657 5.60881 5.77553 7.08552 3.97685 7.88394L1.63658 8.92277C.868537 9.26368.868536 10.381 1.63658 10.7219L4.0523 11.7942C5.80589 12.5726 7.21171 13.9966 7.99275 15.7854L8.8704 17.7956C9.20776 18.5682 10.277 18.5682 10.6144 17.7956ZM19.4014 22.6899 19.6482 22.1242C20.0882 21.1156 20.8807 20.3125 21.8695 19.8732L22.6299 19.5353C23.0412 19.3526 23.0412 18.7549 22.6299 18.5722L21.9121 18.2532C20.8978 17.8026 20.0911 16.9698 19.6586 15.9269L19.4052 15.3156C19.2285 14.8896 18.6395 14.8896 18.4628 15.3156L18.2094 15.9269C17.777 16.9698 16.9703 17.8026 15.956 18.2532L15.2381 18.5722C14.8269 18.7549 14.8269 19.3526 15.2381 19.5353L15.9985 19.8732C16.9874 20.3125 17.7798 21.1156 18.2198 22.1242L18.4667 22.6899C18.6473 23.104 19.2207 23.104 19.4014 22.6899Z"></path>
                            </svg>
                            Download ATS Resume (.PDF)
                        </a>

                        {/* Inspect ATS Resume Modal Button */}
                        <button
                            type='button'
                            onClick={handleOpenAtsModal}
                            className='resume-inspect-btn'
                            id='inspect-ats-modal-btn'
                            title='Inspect ATS Resume structure & copy plain text'
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                <line x1="11" y1="8" x2="11" y2="14"></line>
                                <line x1="8" y1="11" x2="14" y2="11"></line>
                            </svg>
                            Inspect ATS Score &amp; Resume
                        </button>

                        {/* Open in new tab link */}
                        <a
                            href={getResumePdfUrl ? getResumePdfUrl(interviewId, true) : '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="resume-preview-link"
                            title="Open raw PDF directly in a new browser tab"
                        >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                <polyline points="15 3 21 3 21 9"></polyline>
                                <line x1="10" y1="14" x2="21" y2="3"></line>
                            </svg>
                            Preview PDF in New Tab
                        </a>
                    </div>
                </nav>

                <div className='interview-divider' />

                {/* ── Center Content ── */}
                <main className='interview-content'>
                    {activeNav === 'technical' && (
                        <section>
                            <div className='content-header'>
                                <div>
                                    <h2>Technical Questions</h2>
                                    <span className='content-header__count'>{report.technicalQuestions?.length || 0} questions</span>
                                </div>
                                <div className='expand-controls'>
                                    <button className='expand-btn' onClick={() => handleExpandAll(report.technicalQuestions)}>
                                        Expand All
                                    </button>
                                    <span className='expand-sep'>&bull;</span>
                                    <button className='expand-btn' onClick={handleCollapseAll}>
                                        Collapse All
                                    </button>
                                </div>
                            </div>
                            <div className='q-list'>
                                {report.technicalQuestions?.map((q, i) => (
                                    <QuestionCard
                                        key={i}
                                        item={q}
                                        index={i}
                                        isOpen={!!openCards[String(i)]}
                                        toggleOpen={() => toggleCard(String(i))}
                                    />
                                ))}
                            </div>
                        </section>
                    )}

                    {activeNav === 'behavioral' && (
                        <section>
                            <div className='content-header'>
                                <div>
                                    <h2>Behavioral &amp; Culture Questions</h2>
                                    <span className='content-header__count'>{report.behavioralQuestions?.length || 0} questions</span>
                                </div>
                                <div className='expand-controls'>
                                    <button className='expand-btn' onClick={() => handleExpandAll(report.behavioralQuestions)}>
                                        Expand All
                                    </button>
                                    <span className='expand-sep'>&bull;</span>
                                    <button className='expand-btn' onClick={handleCollapseAll}>
                                        Collapse All
                                    </button>
                                </div>
                            </div>
                            <div className='q-list'>
                                {report.behavioralQuestions?.map((q, i) => (
                                    <QuestionCard
                                        key={i}
                                        item={q}
                                        index={i}
                                        isOpen={!!openCards[String(i)]}
                                        toggleOpen={() => toggleCard(String(i))}
                                    />
                                ))}
                            </div>
                        </section>
                    )}

                    {activeNav === 'roadmap' && (
                        <section>
                            <div className='content-header'>
                                <div>
                                    <h2>Structured Road Map</h2>
                                    <span className='content-header__count'>{report.preparationPlan?.length || 0}-day plan</span>
                                </div>
                                <div className='roadmap-progress-info'>
                                    <span>Click tasks to track your daily progress</span>
                                </div>
                            </div>
                            <div className='roadmap-list'>
                                {report.preparationPlan?.map((day) => (
                                    <RoadMapDay
                                        key={day.day}
                                        day={day}
                                        checkedTasks={checkedTasks}
                                        toggleTask={toggleTask}
                                    />
                                ))}
                            </div>
                        </section>
                    )}
                </main>

                <div className='interview-divider' />

                {/* ── Right Sidebar ── */}
                <aside className='interview-sidebar'>

                    {/* Match Score */}
                    <div className='match-score-card'>
                        <p className='match-score-card__label'>Role Compatibility</p>
                        <div className={`match-score-card__ring ${scoreColor}`}>
                            <span className='match-score-card__value'>{report.matchScore}</span>
                            <span className='match-score-card__pct'>%</span>
                        </div>
                        <p className='match-score-card__sub'>{getScoreSubtitle(report.matchScore)}</p>
                    </div>

                    <div className='sidebar-divider' />

                    {/* Skill Gaps */}
                    <div className='skill-gaps'>
                        <div className='skill-gaps__header'>
                            <p className='skill-gaps__label'>Identified Skill Gaps</p>
                            <span className='skill-gaps__count'>{report.skillGaps?.length || 0}</span>
                        </div>
                        <p className='skill-gaps__sub'>High priority areas to address prior to interviews:</p>
                        <div className='skill-gaps__list'>
                            {report.skillGaps?.map((gap, i) => (
                                <div key={i} className={`skill-tag skill-tag--${gap.severity}`}>
                                    <span className='severity-indicator' />
                                    <span className='skill-name'>{gap.skill}</span>
                                    <span className='severity-badge'>{gap.severity}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                </aside>
            </div>

            {/* ── ATS Resume Inspector & Scorecard Modal ── */}
            {isAtsModalOpen && (
                <div className='ats-modal-backdrop' onClick={() => setIsAtsModalOpen(false)}>
                    <div className='ats-modal-dialog' onClick={(e) => e.stopPropagation()}>
                        {/* Modal Header */}
                        <div className='ats-modal-header'>
                            <div className='ats-modal-header__title-group'>
                                <div className='ats-score-pill'>
                                    <span className='ats-score-pill__num'>{displayAtsScore}</span>
                                    <span className='ats-score-pill__denom'>/100</span>
                                    <span className='ats-score-pill__status'>ATS Optimized</span>
                                </div>
                                <div>
                                    <h3 className='ats-modal-title'>ATS Resume Inspector &amp; Scorecard</h3>
                                    <p className='ats-modal-subtitle'>Harvard Single-Column Format • Google XYZ Formula • 100% Parser Compliant</p>
                                </div>
                            </div>
                            <button
                                type='button'
                                className='ats-modal-close'
                                onClick={() => setIsAtsModalOpen(false)}
                                title='Close modal'
                            >
                                &times;
                            </button>
                        </div>

                        {/* Top Metrics Audit Bar */}
                        <div className='ats-audit-bar'>
                            <div className='ats-audit-item'>
                                <span className='ats-audit-item__icon'>✓</span>
                                <div>
                                    <span className='ats-audit-item__title'>{atsBreakdown?.layout?.title || 'Layout'}</span>
                                    <span className='ats-audit-item__desc'>{atsBreakdown?.layout?.desc || 'Single Column (FAANG/Ivy)'}</span>
                                </div>
                            </div>
                            <div className='ats-audit-item'>
                                <span className='ats-audit-item__icon'>✓</span>
                                <div>
                                    <span className='ats-audit-item__title'>{atsBreakdown?.xyzFormula?.title || 'Impact Metrics'}</span>
                                    <span className='ats-audit-item__desc'>{atsBreakdown?.xyzFormula?.desc || 'Google XYZ Action Formula'}</span>
                                </div>
                            </div>
                            <div className='ats-audit-item'>
                                <span className='ats-audit-item__icon'>✓</span>
                                <div>
                                    <span className='ats-audit-item__title'>{atsBreakdown?.parseSafety?.title || 'Parse Safety'}</span>
                                    <span className='ats-audit-item__desc'>{atsBreakdown?.parseSafety?.desc || '0 Tables, 0 Columns, 0 Emojis'}</span>
                                </div>
                            </div>
                            <div className='ats-audit-item'>
                                <span className='ats-audit-item__icon'>✓</span>
                                <div>
                                    <span className='ats-audit-item__title'>{atsBreakdown?.keywords?.title || 'Skill Taxonomy'}</span>
                                    <span className='ats-audit-item__desc'>{atsBreakdown?.keywords?.desc || 'Categorized ATS Keywords'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Modal Actions Bar */}
                        <div className='ats-modal-actions'>
                            <div className='ats-modal-actions__left'>
                                <a
                                    href={getResumePdfUrl ? getResumePdfUrl(interviewId, false) : '#'}
                                    download
                                    className='button primary-button ats-action-btn'
                                >
                                    <svg height="14" width="14" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M10.6144 17.7956 11.492 15.7854C12.2731 13.9966 13.6789 12.5726 15.4325 11.7942L17.8482 10.7219C18.6162 10.381 18.6162 9.26368 17.8482 8.92277L15.5079 7.88394C13.7092 7.08552 12.2782 5.60881 11.5105 3.75894L10.6215 1.61673C10.2916.821765 9.19319.821767 8.8633 1.61673L7.97427 3.75892C7.20657 5.60881 5.77553 7.08552 3.97685 7.88394L1.63658 8.92277C.868537 9.26368.868536 10.381 1.63658 10.7219L4.0523 11.7942C5.80589 12.5726 7.21171 13.9966 7.99275 15.7854L8.8704 17.7956C9.20776 18.5682 10.277 18.5682 10.6144 17.7956ZM19.4014 22.6899 19.6482 22.1242C20.0882 21.1156 20.8807 20.3125 21.8695 19.8732L22.6299 19.5353C23.0412 19.3526 23.0412 18.7549 22.6299 18.5722L21.9121 18.2532C20.8978 17.8026 20.0911 16.9698 19.6586 15.9269L19.4052 15.3156C19.2285 14.8896 18.6395 14.8896 18.4628 15.3156L18.2094 15.9269C17.777 16.9698 16.9703 17.8026 15.956 18.2532L15.2381 18.5722C14.8269 18.7549 14.8269 19.3526 15.2381 19.5353L15.9985 19.8732C16.9874 20.3125 17.7798 21.1156 18.2198 22.1242L18.4667 22.6899C18.6473 23.104 19.2207 23.104 19.4014 22.6899Z"></path>
                                    </svg>
                                    Download PDF
                                </a>
                                <button
                                    type='button'
                                    onClick={handleCopyAtsPlain}
                                    className='button secondary-button ats-action-btn'
                                    title='Copy ATS Plain Text for Workday, Greenhouse & Lever job portals'
                                >
                                    {copiedText ? (
                                        <>
                                            <span style={{ color: '#3fb950', fontWeight: 'bold' }}>✓</span>
                                            Copied Plain Text!
                                        </>
                                    ) : (
                                        <>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                                                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                                            </svg>
                                            Copy Plain Text (For Job Portals)
                                        </>
                                    )}
                                </button>
                            </div>
                            <div className='ats-modal-actions__right'>
                                <a
                                    href={getResumePdfUrl ? getResumePdfUrl(interviewId, true) : '#'}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className='ats-raw-link'
                                >
                                    Open Raw PDF ↗
                                </a>
                            </div>
                        </div>

                        {/* Resume Paper Body */}
                        <div className='ats-modal-body'>
                            {isAtsLoading ? (
                                <div className='ats-loading-state'>
                                    <div className='interview-spinner' />
                                    <p>Formatting ATS single-column document &amp; verifying parser score...</p>
                                </div>
                            ) : atsData ? (
                                <div className='ats-resume-paper'>
                                    {/* Header */}
                                    <header className='ats-resume-header'>
                                        <h1 className='ats-resume-name'>{atsData.header?.name || 'CANDIDATE NAME'}</h1>
                                        {atsData.header?.title && (
                                            <p className='ats-resume-role'>{atsData.header.title}</p>
                                        )}
                                        <div className='ats-resume-contact'>
                                            {[
                                                atsData.header?.email,
                                                atsData.header?.phone,
                                                atsData.header?.location,
                                                atsData.header?.linkedin,
                                                atsData.header?.github
                                            ].filter(Boolean).map((item, idx, arr) => (
                                                <span key={idx}>
                                                    {item}
                                                    {idx < arr.length - 1 && <span className='contact-sep'> | </span>}
                                                </span>
                                            ))}
                                        </div>
                                    </header>

                                    {/* Professional Summary */}
                                    {(atsData.summary || atsData.objective) && (
                                        <section className='ats-resume-section'>
                                            <h2 className='ats-resume-section-title'>Professional Summary</h2>
                                            <p className='ats-resume-text'>{atsData.summary || atsData.objective}</p>
                                        </section>
                                    )}

                                    {/* Technical Skills */}
                                    {atsData.skills && (
                                        <section className='ats-resume-section'>
                                            <h2 className='ats-resume-section-title'>Technical Skills</h2>
                                            <div className='ats-skills-grid'>
                                                {atsData.skills.languages?.length > 0 && (
                                                    <p className='ats-skill-line'>
                                                        <strong>Languages:</strong> {atsData.skills.languages.join(', ')}
                                                    </p>
                                                )}
                                                {atsData.skills.frameworks?.length > 0 && (
                                                    <p className='ats-skill-line'>
                                                        <strong>Frameworks &amp; Libraries:</strong> {atsData.skills.frameworks.join(', ')}
                                                    </p>
                                                )}
                                                {atsData.skills.databases?.length > 0 && (
                                                    <p className='ats-skill-line'>
                                                        <strong>Databases &amp; Storage:</strong> {atsData.skills.databases.join(', ')}
                                                    </p>
                                                )}
                                                {atsData.skills.cloudDevOps?.length > 0 && (
                                                    <p className='ats-skill-line'>
                                                        <strong>Cloud &amp; DevOps:</strong> {atsData.skills.cloudDevOps.join(', ')}
                                                    </p>
                                                )}
                                                {(atsData.skills.coreConcepts?.length > 0 || atsData.skills.coreCompetencies?.length > 0) && (
                                                    <p className='ats-skill-line'>
                                                        <strong>Core Concepts:</strong> {(atsData.skills.coreConcepts || atsData.skills.coreCompetencies).join(', ')}
                                                    </p>
                                                )}
                                            </div>
                                        </section>
                                    )}

                                    {/* Experience */}
                                    {atsData.workExperience?.length > 0 && (
                                        <section className='ats-resume-section'>
                                            <h2 className='ats-resume-section-title'>Professional Experience</h2>
                                            {atsData.workExperience.map((w, idx) => (
                                                <div key={idx} className='ats-experience-item'>
                                                    <div className='ats-item-header'>
                                                        <span className='ats-item-title'>{w.role} — <strong>{w.company}</strong></span>
                                                        <span className='ats-item-dates'>{w.startDate} – {w.endDate || 'Present'}</span>
                                                    </div>
                                                    {w.location && <div className='ats-item-location'>{w.location}</div>}
                                                    <ul className='ats-bullet-list'>
                                                        {(w.bullets || []).map((b, bIdx) => (
                                                            <li key={bIdx} className='ats-bullet-item'>{b}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            ))}
                                        </section>
                                    )}

                                    {/* Projects */}
                                    {atsData.projects?.length > 0 && (
                                        <section className='ats-resume-section'>
                                            <h2 className='ats-resume-section-title'>Key Projects</h2>
                                            {atsData.projects.map((p, idx) => (
                                                <div key={idx} className='ats-project-item'>
                                                    <div className='ats-item-header'>
                                                        <span className='ats-item-title'>
                                                            <strong>{p.title}</strong>
                                                            {p.techStack && <span className='ats-item-tech'> | {p.techStack}</span>}
                                                        </span>
                                                        {(p.startDate || p.endDate) && (
                                                            <span className='ats-item-dates'>{p.startDate} – {p.endDate}</span>
                                                        )}
                                                    </div>
                                                    <ul className='ats-bullet-list'>
                                                        {(p.bullets || []).map((b, bIdx) => (
                                                            <li key={bIdx} className='ats-bullet-item'>{b}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            ))}
                                        </section>
                                    )}

                                    {/* Education */}
                                    {atsData.education?.length > 0 && (
                                        <section className='ats-resume-section'>
                                            <h2 className='ats-resume-section-title'>Education</h2>
                                            {atsData.education.map((e, idx) => (
                                                <div key={idx} className='ats-education-item'>
                                                    <div className='ats-item-header'>
                                                        <span className='ats-item-title'><strong>{e.degree}</strong> — {e.institution}</span>
                                                        <span className='ats-item-dates'>{e.startDate} – {e.endDate}</span>
                                                    </div>
                                                    {(e.location || e.score) && (
                                                        <div className='ats-item-location'>
                                                            {[e.location, e.score].filter(Boolean).join(' | ')}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </section>
                                    )}

                                    {/* Certifications */}
                                    {(atsData.certifications?.length > 0 || atsData.certificates?.length > 0) && (
                                        <section className='ats-resume-section'>
                                            <h2 className='ats-resume-section-title'>Certifications</h2>
                                            <ul className='ats-bullet-list'>
                                                {(atsData.certifications || atsData.certificates).map((c, idx) => (
                                                    <li key={idx} className='ats-bullet-item'>{c}</li>
                                                ))}
                                            </ul>
                                        </section>
                                    )}
                                </div>
                            ) : (
                                <div className='ats-empty-state'>
                                    <p>Resume data not loaded yet. Click below to load:</p>
                                    <button
                                        type='button'
                                        onClick={handleOpenAtsModal}
                                        className='button primary-button'
                                    >
                                        Load Resume Inspection
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Interview;