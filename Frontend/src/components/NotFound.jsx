import React from 'react';
import { Link } from 'react-router';

const NotFound = () => {
    return (
        <div style={{
            minHeight: '80vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '2rem',
            color: '#e6edf3'
        }}>
            <h1 style={{ fontSize: '4rem', fontWeight: '800', margin: '0', color: '#ff2d78' }}>404</h1>
            <h2 style={{ fontSize: '1.5rem', margin: '0.5rem 0 1rem' }}>Page Not Found</h2>
            <p style={{ color: '#7d8590', maxWidth: '400px', marginBottom: '1.5rem' }}>
                The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
            </p>
            <Link to="/" style={{
                background: 'linear-gradient(135deg, #ff2d78 0%, #ff6b9d 100%)',
                color: '#ffffff',
                padding: '0.65rem 1.25rem',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: '600',
                boxShadow: '0 4px 12px rgba(255, 45, 120, 0.3)'
            }}>
                Return to Dashboard
            </Link>
        </div>
    );
};

export default NotFound;
