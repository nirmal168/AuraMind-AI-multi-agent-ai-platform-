import { api } from "../../utils/axios"

export const getConversations = async (retries = 2) => {
    try {
        const { data } = await api.get('/api/chat/get-conversations')
        return Array.isArray(data) ? data : []
    } catch (error) {
        console.error("getConversations error:", error)
        const status = error.response?.status
        if (retries > 0 && (status === 502 || status === 504 || !error.response)) {
            await new Promise(res => setTimeout(res, 2500))
            return getConversations(retries - 1)
        }
        return []
    }
}