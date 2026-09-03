import { api } from "../../utils/axios"

export const getCurrentUser = async (retries = 2) => {
    try {
        const { data } = await api.get("/api/me")
        return data
    } catch (error) {
        const status = error.response?.status
        const hasSession = !!localStorage.getItem('auramind_session_id')
        if (hasSession && retries > 0 && (status === 502 || status === 504 || !error.response)) {
            await new Promise(res => setTimeout(res, 2500))
            return getCurrentUser(retries - 1)
        }
        return null
    }
}