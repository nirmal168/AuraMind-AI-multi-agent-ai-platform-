import { api } from "../../utils/axios"

export const getConversations = async (retries = 3) => {
    try {
        const { data } = await api.get('/api/chat/get-conversations')
        return Array.isArray(data) ? data : []
    } catch (error) {
        console.error("getConversations error:", error)
        const status = error.response?.status
        if (status === 401 || (status === 400 && error.response?.data?.message?.toLowerCase().includes('session'))) {
            window.dispatchEvent(new CustomEvent('session-expired'))
            return []
        }
        if (retries > 0 && (status === 502 || status === 504 || !error.response)) {
            const delay = (4 - retries) * 2000
            await new Promise(res => setTimeout(res, delay))
            return getConversations(retries - 1)
        }
        return []
    }
}