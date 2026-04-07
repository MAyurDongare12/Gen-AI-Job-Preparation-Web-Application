import axios from "axios";

const api=axios.create({
    baseURL: (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
        ? "http://localhost:3000"
        : "https://gen-ai-job-preparation-web-application.onrender.com",
    withCredentials: true
})

export async function register({username, email, password}) {
    try{
    const response = await api.post('/api/auth/register', {
        username, email, password
    })

        return response.data;

    } catch(err) {
        console.log(err)
    }
}

export async function login({email, password}) {
    try{
        const response = await api.post('/api/auth/login',{
            email, password
        })
        return response.data;
    } catch(err) {
        console.log(err)
    }
}

export async function logout() {
    try{
        const response = await api.get('/api/auth/logout', {
        })
        return response.data;
    } catch(err) {
        console.log(err)
    }
}

export async function getMe() {
    try{
        const response = await api.get('/api/auth/get-me', {
        })
        return response.data;
    } catch(err) {
        console.log(err)
    }
}