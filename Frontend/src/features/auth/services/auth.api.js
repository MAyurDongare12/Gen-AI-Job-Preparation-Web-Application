import api from "../../../services/apiClient";

export async function register({ username, email, password }) {
    try {
        const response = await api.post('/api/auth/register', {
            username, email, password
        });
        return response.data;
    } catch (err) {
        const message = err.response?.data?.message || err.message || 'Registration failed';
        const error = new Error(message);
        error.response = err.response;
        throw error;
    }
}

export async function login({ email, password }) {
    try {
        const response = await api.post('/api/auth/login', {
            email, password
        });
        return response.data;
    } catch (err) {
        const message = err.response?.data?.message || err.message || 'Login failed';
        const error = new Error(message);
        error.response = err.response;
        throw error;
    }
}

export async function logout() {
    try {
        const response = await api.get('/api/auth/logout');
        return response.data;
    } catch (err) {
        console.warn('Logout warning:', err.message);
        return { message: "Logged out" };
    }
}

export async function getMe() {
    try {
        const response = await api.get('/api/auth/get-me');
        return response.data;
    } catch (err) {
        const message = err.response?.data?.message || err.message || 'Failed to fetch user';
        const error = new Error(message);
        error.response = err.response;
        throw error;
    }
}