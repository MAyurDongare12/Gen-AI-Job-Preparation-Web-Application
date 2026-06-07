import { useContext, useEffect } from "react";
import { AuthContext } from "../auth.context.jsx";
import { login, register, logout, getMe } from "../services/auth.api";

export const useAuth = () => {
    const context = useContext(AuthContext)
    const { user, setUser, loading, setLoading } = context


    const handleLogin = async ({ email, password }) => {
        setLoading(true)
        try {
            const data = await login({ email, password })
            setUser(data.user)
            localStorage.setItem('user', JSON.stringify(data.user))
            return data
        } catch (err) {
            setUser(null)
            localStorage.removeItem('user')
            throw err
        } finally {
            setLoading(false)
        }
    }

    const handleRegister = async ({ username, email, password }) => {
        setLoading(true)
        try {
            const data = await register({ username, email, password })
            setUser(data.user)
            localStorage.setItem('user', JSON.stringify(data.user))
            return data
        } catch (err) {
            setUser(null)
            localStorage.removeItem('user')
            throw err
        } finally {
            setLoading(false)
        }
    }

    const handleLogout = async () => {
        setLoading(true)
        try {
            await logout()
            setUser(null)
            localStorage.removeItem('user')
        } catch (err) {
            console.error('Logout error:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        // Only check with server if user was already in localStorage
        // This prevents the 401 errors on initial load when there's no token
        const storedUser = localStorage.getItem('user')
        if (storedUser && storedUser !== "undefined") {
            const getAndSetUser = async () => {
                try {
                    const data = await getMe()
                    if (data && data.user) {
                        setUser(data.user)
                    } else {
                        setUser(null)
                        localStorage.removeItem('user')
                    }
                } catch (err) {
                    // Token might be invalid, clear it
                    setUser(null)
                    localStorage.removeItem('user')
                } finally {
                    setLoading(false)
                }
            }
            getAndSetUser()
        } else {
            setLoading(false)
        }
    }, [])

    return { user, loading, handleLogin, handleRegister, handleLogout }
}