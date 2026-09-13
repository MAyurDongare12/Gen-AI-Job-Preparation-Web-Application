import React, { useState, useRef, useEffect } from 'react';
import '../style/home.scss';
import { useInterview } from '../hooks/useInterview.js';
import { useNavigate } from 'react-router';

const GENERATION_STEPS = [
    { title: "Analyzing Profile & Resume", detail: "Extracting skills, experience, and domain strengths..." },
    { title: "Deconstructing Job Description", detail: "Identifying required competencies and expectations..." },
    { title: "Synthesizing AI Interview Questions", detail: "Formulating technical & behavioral questions with model answers..." },
    { title: "Formulating Strategy & Roadmap", detail: "Building day-by-day roadmap and calculating match score..." }
];

const Home = () => {
    const { isGenerating, isFetchingReports, generateReport, reports, getReports, deleteReport, error, setError } = useInterview();
    const [jobDescription, setJobDescription] = useState("");
    const [selfDescription, setSelfDescription] = useState("");
    const [selectedFile, setSelectedFile] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [progressStep, setProgressStep] = useState(0);

    const resumeInputRef = useRef(null);
    const navigate = useNavigate();

    // Fetch reports on mount
    useEffect(() => {
        getReports();
    }, [getReports]);

    // Animate progress steps during generation
    useEffect(() => {
        let timer;
        if (isGenerating) {
            setProgressStep(0);
            timer = setInterval(() => {
                setProgressStep(prev => (prev < GENERATION_STEPS.length - 1 ? prev + 1 : prev));
            }, 5500);
        } else {
            setProgressStep(0);
        }
        return () => clearInterval(timer);
    }, [isGenerating]);

    const handleFileChange = (file) => {
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            setError("Resume file size exceeds 5MB limit. Please upload a smaller PDF or DOCX.");
            return;
        }
        const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];
        if (!validTypes.includes(file.type) && !file.name.endsWith('.pdf') && !file.name.endsWith('.docx')) {
            setError("Invalid file format. Please upload a PDF or DOCX file.");
            return;
        }
        setError(null);
        setSelectedFile(file);
    };

    const handleRemoveFile = (e) => {
        e.stopPropagation();
        e.preventDefault();
        setSelectedFile(null);
        if (resumeInputRef.current) {
            resumeInputRef.current.value = "";
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileChange(e.dataTransfer.files[0]);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleGenerateReport = async () => {
        setError(null);

        const jd = jobDescription.trim();
        const sd = selfDescription.trim();

        if (!jd) {
            setError("Please paste the target job description. It is required to tailor the interview plan.");
            return;
        }

        if (!selectedFile && !sd) {
            setError("Please upload your resume or write a quick self-description so the AI can evaluate your fit.");
            return;
        }

        try {
            const data = await generateReport({
                jobDescription: jd,
                selfDescription: sd,
                resumeFile: selectedFile
            });

            if (data && data._id) {
                navigate(`/interview/${data._id}`);
            }
        } catch (err) {
            // Error is already populated in context
        }
    };

    const handleDeleteReport = async (e, id) => {
        e.stopPropagation();
        if (!window.confirm("Are you sure you want to delete this interview plan?")) {
            return;
        }
        try {
            setDeletingId(id);
            await deleteReport(id);
        } catch (err) {
            // error set in context
        } finally {
            setDeletingId(null);
        }
    };

    const formatFileSize = (bytes) => {
        if (!bytes) return '';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const charCount = jobDescription.length;

    return (
        <div className='home-page'>
            {/* AI Generation Loading Modal */}
            {isGenerating && (
                <div className='generation-overlay'>
                    <div className='generation-modal'>
                        <div className='generation-spinner-glow'>
                            <div className='generation-spinner' />
                        </div>
                        <h2>Crafting Your Personalized Strategy</h2>
                        <p className='generation-subtitle'>Our Gemini 2.5 AI is synthesizing your tailored interview playbook...</p>

                        <div className='generation-steps'>
                            {GENERATION_STEPS.map((step, idx) => (
                                <div
                                    key={idx}
                                    className={`generation-step ${idx === progressStep ? 'generation-step--active' : idx < progressStep ? 'generation-step--completed' : ''}`}
                                >
                                    <div className='step-indicator'>
                                        {idx < progressStep ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                        ) : (
                                            <span>{idx + 1}</span>
                                        )}
                                    </div>
                                    <div className='step-info'>
                                        <h4>{step.title}</h4>
                                        <p>{step.detail}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className='generation-bar'>
                            <div
                                className='generation-bar__fill'
                                style={{ width: `${((progressStep + 1) / GENERATION_STEPS.length) * 100}%` }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Page Header */}
            <header className='page-header'>
                <div className='hero-pill'>
                    <span className='pill-dot' />
                    Powered by Google Gemini 2.5 Flash
                </div>
                <h1>Create Your Custom <span className='highlight'>Interview Plan</span></h1>
                <p>Let our AI analyze the job requirements and your unique profile to build an unbeatable, targeted interview strategy.</p>
            </header>

            {error && (
                <div className="error-alert">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <span>{error}</span>
                    <button className="error-close" onClick={() => setError(null)}>&times;</button>
                </div>
            )}

            {/* Main Interactive Card */}
            <div className='interview-card'>
                <div className='interview-card__body'>

                    {/* Left Panel - Job Description */}
                    <div className='panel panel--left'>
                        <div className='panel__header'>
                            <span className='panel__icon'>
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                                </svg>
                            </span>
                            <h2>Target Job Description</h2>
                            <span className='badge badge--required'>Required</span>
                        </div>
                        <textarea
                            value={jobDescription}
                            onChange={(e) => setJobDescription(e.target.value)}
                            className='panel__textarea'
                            placeholder={`Paste the full job description here...\ne.g. 'Senior Frontend Engineer at Stripe requires deep React expertise, system design, and API integration...'`}
                            maxLength={5000}
                        />
                        <div className={`char-counter ${charCount > 4500 ? 'char-counter--warning' : ''}`}>
                            {charCount} / 5000 chars
                        </div>
                    </div>

                    {/* Vertical Divider */}
                    <div className='panel-divider' />

                    {/* Right Panel - Profile */}
                    <div className='panel panel--right'>
                        <div className='panel__header'>
                            <span className='panel__icon'>
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                    <circle cx="12" cy="7" r="4" />
                                </svg>
                            </span>
                            <h2>Your Profile</h2>
                        </div>

                        {/* Upload Resume */}
                        <div className='upload-section'>
                            <label className='section-label'>
                                Upload Resume
                                <span className='badge badge--best'>Best Results</span>
                            </label>

                            {selectedFile ? (
                                <div className='file-selected-box'>
                                    <div className='file-icon'>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                            <polyline points="14 2 14 8 20 8" />
                                            <line x1="16" y1="13" x2="8" y2="13" />
                                            <line x1="16" y1="17" x2="8" y2="17" />
                                            <polyline points="10 9 9 9 8 9" />
                                        </svg>
                                    </div>
                                    <div className='file-details'>
                                        <p className='file-name'>{selectedFile.name}</p>
                                        <p className='file-size'>{formatFileSize(selectedFile.size)} &bull; Attached</p>
                                    </div>
                                    <button
                                        type='button'
                                        onClick={handleRemoveFile}
                                        className='file-remove-btn'
                                        title='Remove file'
                                        aria-label='Remove resume'
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="18" y1="6" x2="6" y2="18" />
                                            <line x1="6" y1="6" x2="18" y2="18" />
                                        </svg>
                                    </button>
                                </div>
                            ) : (
                                <label
                                    className={`dropzone ${isDragging ? 'dropzone--dragging' : ''}`}
                                    htmlFor='resume'
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                >
                                    <span className='dropzone__icon'>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="16 16 12 12 8 16" />
                                            <line x1="12" y1="12" x2="12" y2="21" />
                                            <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
                                        </svg>
                                    </span>
                                    <p className='dropzone__title'>Click to upload or drag &amp; drop</p>
                                    <p className='dropzone__subtitle'>PDF or DOCX (Max 5MB)</p>
                                    <input
                                        ref={resumeInputRef}
                                        hidden
                                        type='file'
                                        id='resume'
                                        name='resume'
                                        accept='.pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                                        onChange={(e) => {
                                            if (e.target.files && e.target.files[0]) {
                                                handleFileChange(e.target.files[0]);
                                            }
                                        }}
                                    />
                                </label>
                            )}
                        </div>

                        {/* OR Divider */}
                        <div className='or-divider'><span>OR</span></div>

                        {/* Quick Self-Description */}
                        <div className='self-description'>
                            <label className='section-label' htmlFor='selfDescription'>Quick Self-Description</label>
                            <textarea
                                value={selfDescription}
                                onChange={(e) => setSelfDescription(e.target.value)}
                                id='selfDescription'
                                name='selfDescription'
                                className='panel__textarea panel__textarea--short'
                                placeholder="Briefly describe your background, core skills, years of experience, and key accomplishments..."
                            />
                        </div>

                        {/* Info Box */}
                        <div className='info-box'>
                            <span className='info-box__icon'>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="12" y1="8" x2="12" y2="12" stroke="#1a1f27" strokeWidth="2" />
                                    <line x1="12" y1="16" x2="12.01" y2="16" stroke="#1a1f27" strokeWidth="2" />
                                </svg>
                            </span>
                            <p>Either a <strong>Resume</strong> or a <strong>Self Description</strong> is required to generate a personalized plan.</p>
                        </div>
                    </div>
                </div>

                {/* Card Footer */}
                <div className='interview-card__footer'>
                    <span className='footer-info'>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle', marginRight: '4px' }}>
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                        </svg>
                        Tailored Strategy Generation &bull; Approx 15-25 seconds
                    </span>
                    <button
                        onClick={handleGenerateReport}
                        disabled={isGenerating}
                        className={`generate-btn ${isGenerating ? 'generate-btn--loading' : ''}`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
                        </svg>
                        Generate My Interview Strategy
                    </button>
                </div>
            </div>

            {/* Recent Reports List */}
            <section className='recent-reports'>
                <div className='recent-reports__header'>
                    <h2>My Interview Roadmaps</h2>
                    <span className='recent-count'>{reports.length} {reports.length === 1 ? 'plan' : 'plans'}</span>
                </div>

                {isFetchingReports ? (
                    <div className='reports-loading-skeleton'>
                        <div className='skeleton-card' />
                        <div className='skeleton-card' />
                    </div>
                ) : reports.length > 0 ? (
                    <div className='reports-list'>
                        {reports.map((item) => (
                            <div
                                key={item._id}
                                className='report-item'
                                onClick={() => navigate(`/interview/${item._id}`)}
                            >
                                <div className='report-item__top'>
                                    <span className={`match-score-badge ${item.matchScore >= 80 ? 'badge--high' : item.matchScore >= 60 ? 'badge--mid' : 'badge--low'}`}>
                                        {item.matchScore}% Match
                                    </span>
                                    <button
                                        type='button'
                                        className='report-delete-btn'
                                        onClick={(e) => handleDeleteReport(e, item._id)}
                                        title='Delete roadmap'
                                        disabled={deletingId === item._id}
                                    >
                                        {deletingId === item._id ? (
                                            <span className='spinner-tiny' />
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="3 6 5 6 21 6" />
                                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                            </svg>
                                        )}
                                    </button>
                                </div>

                                <h3 className='report-title'>{item.title || 'Target Job Position'}</h3>
                                <p className='report-meta'>
                                    Created on {new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                </p>

                                <div className='report-action'>
                                    <span>View Playbook</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="9 18 15 12 9 6" />
                                    </svg>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className='reports-empty-state'>
                        <div className='empty-icon'>
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <rect width="18" height="18" x="3" y="3" rx="2" />
                                <path d="M3 9h18" />
                                <path d="M9 21V9" />
                            </svg>
                        </div>
                        <h3>No Interview Strategies Yet</h3>
                        <p>Paste a job description above and upload your resume to generate your first tailored interview plan.</p>
                    </div>
                )}
            </section>

            {/* Page Footer */}
            <footer className='page-footer'>
                <p>&copy; {new Date().getFullYear()} CareerAI. All rights reserved.</p>
                <div className='footer-links'>
                    <a href='#privacy'>Privacy Policy</a>
                    <a href='#terms'>Terms of Service</a>
                    <a href='#help'>Help &amp; Support</a>
                </div>
            </footer>
        </div>
    );
};

export default Home;