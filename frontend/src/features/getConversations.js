import { api } from "../../utils/axios"

let inFlightPromise = null

const getCachedConversations = () => {
    try {
        const cached = localStorage.getItem('auramind_cached_conversations')
        const parsed = cached ? JSON.parse(cached) : []
        return Array.isArray(parsed) ? parsed : []
    } catch (e) {
        return []
    }
}

export const getConversations = async (retries = 3) => {
    if (inFlightPromise) {
        return inFlightPromise
    }

    inFlightPromise = (async () => {
        try {
            const { data } = await api.get('/api/chat/get-conversations')
            if (Array.isArray(data) && data.length > 0) {
                try {
                    localStorage.setItem('auramind_cached_conversations', JSON.stringify(data))
                } catch (e) {}
                return data
            }
            // If empty array returned from server, but we have cache, keep cache
            const cached = getCachedConversations()
            return (Array.isArray(data) && data.length === 0 && cached.length > 0) ? cached : (data || [])
        } catch (error) {
            console.warn("getConversations error/status:", error.response?.status || error.message)
            const status = error.response?.status
            if (status === 401 || (status === 400 && error.response?.data?.message?.toLowerCase().includes('session'))) {
                window.dispatchEvent(new CustomEvent('session-expired'))
                return getCachedConversations()
            }
            if (retries > 0 && (status === 429 || status === 500 || status === 502 || status === 503 || status === 504 || !error.response)) {
                const delay = status === 429 ? 3500 : (4 - retries) * 2000
                console.log(`Warming up/retrying getConversations in ${delay}ms (${retries} retries left)...`)
                await new Promise(res => setTimeout(res, delay))
                inFlightPromise = null
                return getConversations(retries - 1)
            }
            return getCachedConversations()
        } finally {
            inFlightPromise = null
        }
    })()

    return inFlightPromise
}