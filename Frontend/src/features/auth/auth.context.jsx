import { createContext, useState, useEffect } from "react";

export const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Initialize auth state - check if user is already logged in
        const initializeAuth = async () => {
            try {
                // Check localStorage for user data
                const storedUser = localStorage.getItem('user')
                if (storedUser && storedUser !== "undefined") {
                    setUser(JSON.parse(storedUser))
                }
            } catch (error) {
                console.error('Auth initialization error:', error)
            } finally {
                // Always stop loading after checking
                setLoading(false)
            }
        }
        
        initializeAuth()
    }, [])

    return (
        <AuthContext.Provider value={{ user, setUser, loading, setLoading }}>
            {children}
        </AuthContext.Provider>
    )
}
