import axios from "axios"

// Live cloud backend URL
const LIVE_URL = "https://auramind-ai-multi-agent-ai-platform-1.onrender.com"

// In production (Vercel), use VITE_SERVER_URL or fall back to the live Render gateway.
// In local dev, Vite proxy handles /api calls to local gateway (port 5050).
const baseURL =
  import.meta.env.VITE_SERVER_URL ||
  import.meta.env.VITE_SEVER_URL ||
  (import.meta.env.DEV ? "" : LIVE_URL)

export const api = axios.create({
    baseURL,
    withCredentials: true,
    timeout: 30000
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
    (response) => {
        try {
            const refreshedToken =
                response?.headers?.['x-refreshed-token'] ||
                (typeof response?.headers?.get === 'function' && response.headers.get('x-refreshed-token'))
            if (refreshedToken) {
                localStorage.setItem('auramind_session_id', refreshedToken)
            }
        } catch (e) {}
        return response
    },
    async (error) => {
        const config = error.config

        // If local backend is down or returned gateway proxy error (502/504 or no response) in dev, auto-fallback to live cloud server!
        if (
            import.meta.env.DEV &&
            config &&
            !config._fallbackTried &&
            (!error.response || error.response.status === 502 || error.response.status === 504 || error.code === 'ERR_NETWORK')
        ) {
            config._fallbackTried = true
            config.baseURL = LIVE_URL
            console.warn(`Local backend on port 5050 not responding. Connecting via live cloud gateway: ${LIVE_URL}`)
            return api(config)
        }

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