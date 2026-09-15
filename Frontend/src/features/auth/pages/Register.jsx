import React, { useState } from "react";
import { useNavigate, Link } from "react-router";
import { useAuth } from "../hooks/useAuth";
import "../auth.form.scss";

function Register() {
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const { handleRegister } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (username.trim().length < 3) {
            setError("Username must be at least 3 characters long");
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters long");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setSubmitting(true);
        try {
            await handleRegister({
                username: username.trim(),
                email: email.trim().toLowerCase(),
                password
            });
            navigate("/dashboard");
        } catch (err) {
            setError(err.message || 'Registration failed. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <main className="auth-page">
            <div className="auth-card">
                <div className="auth-header">
                    <div className="auth-logo-badge">
                        <img src="/logo.png" alt="CareerAI Logo" className="auth-logo-img" />
                    </div>
                    <h1>Create Your Account</h1>
                    <p className="auth-subtitle">Join CareerAI and start preparing tailored strategies for your dream career</p>
                </div>

                {error && (
                    <div className="auth-error-banner">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="input-group">
                        <label htmlFor="username">Full Name or Handle</label>
                        <div className="input-wrapper">
                            <svg className="input-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                            </svg>
                            <input
                                value={username}
                                onChange={(e) => { setUsername(e.target.value); setError(""); }}
                                type="text"
                                id="username"
                                name="username"
                                placeholder="e.g. Mayur Dongare"
                                required
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label htmlFor="email">Email Address</label>
                        <div className="input-wrapper">
                            <svg className="input-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                <polyline points="22,6 12,13 2,6" />
                            </svg>
                            <input
                                value={email}
                                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                                type="email"
                                id="email"
                                name="email"
                                placeholder="name@company.com"
                                required
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label htmlFor="password">Password (min 6 characters)</label>
                        <div className="input-wrapper">
                            <svg className="input-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                            <input
                                value={password}
                                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                                type={showPassword ? "text" : "password"}
                                id="password"
                                name="password"
                                placeholder="Create a strong password"
                                required
                            />
                            <button
                                type="button"
                                className="password-toggle-btn"
                                onClick={() => setShowPassword(!showPassword)}
                                aria-label="Toggle password visibility"
                            >
                                {showPassword ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 crystalline 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="input-group">
                        <label htmlFor="confirmPassword">Confirm Password</label>
                        <div className="input-wrapper">
                            <svg className="input-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                            <input
                                value={confirmPassword}
                                onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
                                type={showPassword ? "text" : "password"}
                                id="confirmPassword"
                                name="confirmPassword"
                                placeholder="Re-enter your password"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className={`button primary-button auth-submit-btn ${submitting ? 'auth-submit-btn--loading' : ''}`}
                    >
                        {submitting ? (
                            <>
                                <span className="auth-btn-spinner" />
                                Creating Account...
                            </>
                        ) : (
                            "Create Free Account"
                        )}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>Already have an account? <Link to="/login">Sign in</Link></p>
                </div>
            </div>
        </main>
    );
}

export default Register;