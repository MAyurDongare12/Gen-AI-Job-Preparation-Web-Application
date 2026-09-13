import { useContext, useEffect } from "react";
import { AuthContext } from "../auth.context.jsx";
import { login, register, logout, getMe } from "../services/auth.api";

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    const { user, setUser, token, setToken, loading, setLoading } = context;

    const handleLogin = async ({ email, password }) => {
        setLoading(true);
        try {
            const data = await login({ email, password });
            if (data?.user) {
                setUser(data.user);
                localStorage.setItem('user', JSON.stringify(data.user));
            }
            if (data?.token) {
                setToken(data.token);
                localStorage.setItem('token', data.token);
            }
            return data;
        } catch (err) {
            setUser(null);
            setToken(null);
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async ({ username, email, password }) => {
        setLoading(true);
        try {
            const data = await register({ username, email, password });
            if (data?.user) {
                setUser(data.user);
                localStorage.setItem('user', JSON.stringify(data.user));
            }
            if (data?.token) {
                setToken(data.token);
                localStorage.setItem('token', data.token);
            }
            return data;
        } catch (err) {
            setUser(null);
            setToken(null);
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        setLoading(true);
        try {
            await logout();
        } catch (err) {
            console.error('Logout error:', err);
        } finally {
            setUser(null);
            setToken(null);
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            setLoading(false);
        }
    };

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const storedToken = localStorage.getItem('token');
        if (storedUser && storedUser !== "undefined" && storedToken) {
            getMe()
                .then((data) => {
                    if (data && data.user) {
                        setUser(data.user);
                    }
                })
                .catch((err) => {
                    console.warn('Session verification failed, user must re-login:', err.message);
                    setUser(null);
                    setToken(null);
                    localStorage.removeItem('user');
                    localStorage.removeItem('token');
                });
        }
    }, []);

    return { user, token, loading, handleLogin, handleRegister, handleLogout };
};