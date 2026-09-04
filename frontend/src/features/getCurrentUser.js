import { api } from "../../utils/axios"

let inFlightUserPromise = null

const getCachedUser = () => {
    try {
        const cached = localStorage.getItem('auramind_cached_user')
        return cached ? JSON.parse(cached) : null
    } catch (e) {
        return null
    }
}

export const getCurrentUser = async (retries = 3) => {
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
            return data || getCachedUser()
        } catch (error) {
            const status = error.response?.status
            const hasSession = !!localStorage.getItem('auramind_session_id')

            if (status === 401 || (status === 400 && error.response?.data?.message?.toLowerCase().includes('session'))) {
                window.dispatchEvent(new CustomEvent('session-expired'))
                return null
            }

            if (hasSession && retries > 0 && (status === 429 || status === 500 || status === 502 || status === 503 || status === 504 || !error.response)) {
                const delay = status === 429 ? 3500 : (4 - retries) * 2000
                await new Promise(res => setTimeout(res, delay))
                inFlightUserPromise = null
                return getCurrentUser(retries - 1)
            }

            // Return cached user if available so temporary wake-up glitch never logs out active user
            return getCachedUser()
        } finally {
            inFlightUserPromise = null
        }
    })()

    return inFlightUserPromise
}