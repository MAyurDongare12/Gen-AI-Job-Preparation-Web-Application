import { createContext, useState, useEffect } from "react";

export const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [token, setToken] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const initializeAuth = () => {
            try {
                const storedUser = localStorage.getItem('user')
                const storedToken = localStorage.getItem('token')
                if (storedUser && storedUser !== "undefined") {
                    setUser(JSON.parse(storedUser))
                }
                if (storedToken) {
                    setToken(storedToken)
                }
            } catch (error) {
                console.error('Auth initialization error:', error)
            } finally {
                setLoading(false)
            }
        }
        
        initializeAuth()
    }, [])

    return (
        <AuthContext.Provider value={{ user, setUser, token, setToken, loading, setLoading }}>
            {children}
        </AuthContext.Provider>
    )
}
