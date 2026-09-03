import { api } from "../../utils/axios"

export const createConversation = async (payload = {}, retries = 2) => {
  try {
    const { data } = await api.post('/api/chat/create-conversation', payload)
    return data
  } catch (error) {
    console.error("createConversation error:", error.response?.data || error.message)
    const status = error.response?.status
    if (retries > 0 && (status === 502 || status === 504 || !error.response)) {
      console.log(`Retrying createConversation (${retries} attempts left)...`)
      await new Promise(res => setTimeout(res, 2500))
      return createConversation(payload, retries - 1)
    }
    return null
  }
}