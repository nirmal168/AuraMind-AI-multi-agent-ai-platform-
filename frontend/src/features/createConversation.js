import { api } from "../../utils/axios"

export const createConversation = async (payload = {}) => {
  try {
    const { data } = await api.post('/api/chat/create-conversation', payload)
    return data
  } catch (error) {
    console.error("createConversation error:", error.response?.data || error.message)
    return null
  }
}