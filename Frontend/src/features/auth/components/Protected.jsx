import { useAuth } from "../hooks/useAuth";
import { Navigate } from "react-router";
import React from "react";

const Protected = ({ children }) => {
    const { loading, user } = useAuth()

    if (loading) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#0d1117',
                color: '#e6edf3',
                gap: '1rem'
            }}>
                <div style={{
                    width: '40px',
                    height: '40px',
                    border: '3px solid rgba(255, 45, 120, 0.2)',
                    borderTopColor: '#ff2d78',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite'
                }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                <p style={{ color: '#7d8590', fontSize: '0.9rem' }}>Authenticating session...</p>
            </div>
        );
    }

    if (!user) {
        return <Navigate to={'/login'} replace />;
    }

    return children;

}

export default Protected