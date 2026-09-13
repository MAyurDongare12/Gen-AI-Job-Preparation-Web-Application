import axios from "axios";
import { API_URL } from "../config";

export const api = axios.create({
    baseURL: API_URL,
    withCredentials: true
});

api.interceptors.request.use((config) => {
    try {
        const token = localStorage.getItem("token");
        if (token && !config.headers.Authorization) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    } catch (e) {
        // ignore storage access errors
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default api;
