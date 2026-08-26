import axios from "axios"

export const api = axios.create({
    baseURL: import.meta.env.VITE_SERVER_URL || import.meta.env.VITE_SEVER_URL || "http://localhost:5000",
    withCredentials: true
})

api.interceptors.request.use((config) => {
    try {
        const sessionId = localStorage.getItem('auramind_session_id')
        if (sessionId) {
            config.headers['x-session-id'] = sessionId
            config.headers['Authorization'] = `Bearer ${sessionId}`
        }
    } catch (e) {}
    return config
})