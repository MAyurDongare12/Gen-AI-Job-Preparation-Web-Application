import React, { useState } from "react";
import { useNavigate, Link } from "react-router";
import { useAuth } from "../hooks/useAuth";
import "../auth.form.scss";

function Register() {
    const navigate = useNavigate()
    const [username, setUsername] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [error, setError] = useState("")

    const { loading, handleRegister } = useAuth()

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("")

        if (password !== confirmPassword) {
            setError("Passwords do not match")
            return
        }

        try {
            await handleRegister({ username, email, password })
            navigate("/")
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.')
        }
    }

    if (loading) {
        return (<main><h1>Loading...</h1></main>)
    }
    return (
        <main>
            <div className="form-container">
                <h1>Register</h1>

                {error && <div style={{ color: 'red', marginBottom: '10px', padding: '8px', backgroundColor: '#ffeeee', borderRadius: '4px' }}>{error}</div>}

                <form onSubmit={handleSubmit}>

                    <div className="input-group">
                        <label htmlFor="email">Email</label>
                        <input
                            onChange={(e) => { setEmail(e.target.value) }}
                            type="email" id="email" name="email" placeholder='Enter the email address' required />
                    </div>

                    <div className="input-group">
                        <label htmlFor="username">Username</label>
                        <input
                            onChange={(e) => { setUsername(e.target.value) }}
                            type="text" id="username" name="username" placeholder='Enter the username' required />
                    </div>

                    <div className="input-group">
                        <label htmlFor="password">Password</label>
                        <input
                            onChange={(e) => { setPassword(e.target.value) }}
                            type="password" id="password" name="password" placeholder='Enter the password' required />
                    </div>

                    <div className="input-group">
                        <label htmlFor="confirmPassword">Confirm Password</label>
                        <input
                            onChange={(e) => { setConfirmPassword(e.target.value) }}
                            type="password" id="confirmPassword" name="confirmPassword" placeholder='Confirm the password' required />
                    </div>

                    <button className="button primary-button">Register</button>
                </form>
                <p>Already have an account? <Link to="/login">Login</Link></p>
            </div>
        </main>
    )
}
export default Register