import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router';
import { useAuth } from '../features/auth/hooks/useAuth';
import './Navbar.scss';

const Navbar = () => {
    const { user, handleLogout } = useAuth();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const onLogout = async () => {
        setDropdownOpen(false);
        await handleLogout();
        navigate('/login');
    };

    const initial = user?.username ? user.username.charAt(0).toUpperCase() : 'U';

    const isLandingPage = location.pathname === '/';

    return (
        <header className="app-navbar">
            <div className="navbar-container">
                <Link to={user ? "/dashboard" : "/"} className="navbar-brand">
                    <div className="brand-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                        </svg>
                    </div>
                    <div className="brand-text">
                        <span className="brand-name">Career<span className="brand-accent">AI</span></span>
                        <span className="brand-badge">PRO</span>
                    </div>
                </Link>

                {/* Only display workspace tool links when inside the application, NOT on the public landing page */}
                {!isLandingPage && (
                    <nav className="navbar-links">
                        <Link
                            to="/dashboard"
                            className={`nav-link ${location.pathname === '/dashboard' ? 'nav-link--active' : ''}`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect width="7" height="9" x="3" y="3" rx="1" />
                                <rect width="7" height="5" x="14" y="3" rx="1" />
                                <rect width="7" height="9" x="14" y="12" rx="1" />
                                <rect width="7" height="5" x="3" y="16" rx="1" />
                            </svg>
                            Dashboard
                        </Link>

                        <Link
                            to="/salary-war-room"
                            className={`nav-link ${location.pathname === '/salary-war-room' ? 'nav-link--active' : ''}`}
                        >
                            <span style={{ fontSize: '0.9rem' }}>💰</span>
                            Salary War Room
                        </Link>

                        <Link
                            to="/company-intelligence"
                            className={`nav-link ${location.pathname === '/company-intelligence' ? 'nav-link--active' : ''}`}
                        >
                            <span style={{ fontSize: '0.9rem' }}>🏢</span>
                            Company Intel
                        </Link>

                        <Link
                            to="/portfolio-auditor"
                            className={`nav-link ${location.pathname === '/portfolio-auditor' ? 'nav-link--active' : ''}`}
                        >
                            <span style={{ fontSize: '0.9rem' }}>🔬</span>
                            Code Auditor
                        </Link>

                        <Link
                            to="/referral-engine"
                            className={`nav-link ${location.pathname === '/referral-engine' ? 'nav-link--active' : ''}`}
                        >
                            <span style={{ fontSize: '0.9rem' }}>🚀</span>
                            Referral Engine
                        </Link>
                    </nav>
                )}

                <div className="navbar-actions">
                    {user ? (
                        <div className="user-menu-container" ref={dropdownRef}>
                            <button
                                className="user-avatar-btn"
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                                title={user.username}
                                aria-label="User profile menu"
                            >
                                <span className="avatar-circle">{initial}</span>
                                <span className="avatar-username">{user.username}</span>
                                <svg
                                    className={`avatar-chevron ${dropdownOpen ? 'avatar-chevron--open' : ''}`}
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <polyline points="6 9 12 15 18 9" />
                                </svg>
                            </button>

                            {dropdownOpen && (
                                <div className="user-dropdown">
                                    <div className="dropdown-header">
                                        <p className="dropdown-user-name">{user.username}</p>
                                        <p className="dropdown-user-email">{user.email}</p>
                                    </div>
                                    <div className="dropdown-divider" />
                                    <Link
                                        to="/dashboard"
                                        className="dropdown-item"
                                        onClick={() => setDropdownOpen(false)}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M12 20h9" />
                                            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                                        </svg>
                                        New Interview Prep
                                    </Link>
                                    <div className="dropdown-divider" />
                                    <button className="dropdown-item dropdown-item--danger" onClick={onLogout}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                            <polyline points="16 17 21 12 16 7" />
                                            <line x1="21" x2="9" y1="12" y2="12" />
                                        </svg>
                                        Sign Out
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="auth-buttons">
                            <Link to="/login" className="nav-btn nav-btn--ghost">Sign In</Link>
                            <Link to="/register" className="nav-btn nav-btn--primary">Get Started</Link>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Navbar;
