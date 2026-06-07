import React, { useState } from 'react'
import "../auth.form.scss"
import { useNavigate, Link } from "react-router";
import { useAuth } from "../hooks/useAuth";

const Login = () => {
    const { loading, handleLogin } = useAuth()
    const navigate = useNavigate()

    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("")
        try {
            await handleLogin({ email, password });
            navigate("/")
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please try again.')
        }
    }
    if (loading) {
        return (<main><h1>Loading...</h1></main>)
    }

    return (
        <main>
            <div className="form-container">
                <h1>Login</h1>

                {error && <div style={{ color: 'red', marginBottom: '10px', padding: '8px', backgroundColor: '#ffeeee', borderRadius: '4px' }}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label htmlFor="email">Email</label>
                        <input
                            onChange={(e) => { setEmail(e.target.value) }}
                            type="email" id="email" name="email" placeholder='Enter the email address' required />
                    </div>

                    <div className="input-group">
                        <label htmlFor="password">Password</label>
                        <input
                            onChange={(e) => { setPassword(e.target.value) }}
                            type="password" id="password" name="password" placeholder='Enter the password' required />
                    </div>

                    <button className="button primary-button">Login</button>
                </form>
                <p>Don't have an account? <Link to="/register">Register</Link></p>
            </div>
        </main>
    )
}

export default Login