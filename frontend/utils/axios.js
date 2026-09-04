import axios from "axios"

// In production (Vercel), use VITE_SERVER_URL or fall back to the live Render gateway.
// In local dev, Vite proxy handles /api calls so baseURL can be empty (relative path).
const baseURL =
  import.meta.env.VITE_SERVER_URL ||
  import.meta.env.VITE_SEVER_URL ||
  (import.meta.env.DEV ? "" : "https://auramind-ai-multi-agent-ai-platform-1.onrender.com")

export const api = axios.create({
    baseURL,
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

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (
            error.response?.status === 401 ||
            (error.response?.status === 400 && error.response?.data?.message?.toLowerCase().includes('session'))
        ) {
            try {
                localStorage.removeItem('auramind_session_id')
                window.dispatchEvent(new CustomEvent('session-expired'))
            } catch (e) {}
        }
        return Promise.reject(error)
    }
)