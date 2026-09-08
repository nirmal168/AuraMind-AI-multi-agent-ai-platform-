import { api } from "../../utils/axios"

let inFlightUserPromise = null

export const decodeSessionUser = () => {
    try {
        const sessionId = localStorage.getItem('auramind_session_id')
        if (!sessionId || typeof sessionId !== 'string') return null
        const parts = sessionId.split('.')
        if (parts.length === 3) {
            const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
            const jsonStr = decodeURIComponent(
                atob(base64)
                    .split('')
                    .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                    .join('')
            )
            const payload = JSON.parse(jsonStr)
            if (payload && (payload._id || payload.userId || payload.email)) {
                return payload
            }
        }
        return null
    } catch (e) {
        return null
    }
}

const getCachedUser = () => {
    try {
        const cached = localStorage.getItem('auramind_cached_user')
        return cached ? JSON.parse(cached) : decodeSessionUser()
    } catch (e) {
        return decodeSessionUser()
    }
}

export const getCurrentUser = async (retries = 2) => {
    const sessionId = localStorage.getItem('auramind_session_id')
    if (!sessionId) {
        return null
    }

    const fallbackUser = decodeSessionUser() || getCachedUser()

    if (inFlightUserPromise) {
        return inFlightUserPromise
    }

    inFlightUserPromise = (async () => {
        try {
            const { data } = await api.get("/api/me")
            if (data && (data._id || data.userId || data.email)) {
                try {
                    localStorage.setItem('auramind_cached_user', JSON.stringify(data))
                } catch (e) {}
                return data
            }
            return data || fallbackUser
        } catch (error) {
            const status = error.response?.status
            // Only genuinely trigger session expired if the token is completely rejected as invalid
            if (status === 401 && error.response?.data?.message?.toLowerCase().includes('invalid')) {
                window.dispatchEvent(new CustomEvent('session-expired'))
                return null
            }

            if (retries > 0 && (status === 429 || status === 500 || status === 502 || status === 503 || status === 504 || !error.response)) {
                const delay = status === 429 ? 3500 : 2500
                await new Promise(res => setTimeout(res, delay))
                inFlightUserPromise = null
                return getCurrentUser(retries - 1)
            }

            // Return fallback user so temporary backend wake-up lag or transient Redis error NEVER logs out an active user
            return fallbackUser
        } finally {
            inFlightUserPromise = null
        }
    })()

    return inFlightUserPromise
}