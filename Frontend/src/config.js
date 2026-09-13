const getApiUrl = () => {
    if (import.meta.env.VITE_API_BASE_URL) {
        return import.meta.env.VITE_API_BASE_URL;
    }
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
        return "http://localhost:3000";
    }
    return "https://gen-ai-job-preparation-web-application.onrender.com";
};

export const API_URL = getApiUrl();

