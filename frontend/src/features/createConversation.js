import { api } from "../../utils/axios"

export const createConversation = async (payload = {}, retries = 3) => {
  try {
    const { data } = await api.post('/api/chat/create-conversation', payload)
    return data
  } catch (error) {
    console.error("createConversation error:", error.response?.data || error.message)
    const status = error.response?.status
    if (status === 401 || (status === 400 && error.response?.data?.message?.toLowerCase().includes('session'))) {
      window.dispatchEvent(new CustomEvent('session-expired'))
      return null
    }
    if (retries > 0 && (status === 502 || status === 504 || !error.response)) {
      const delay = (4 - retries) * 2000
      console.log(`Retrying createConversation in ${delay}ms (${retries} attempts left)...`)
      await new Promise(res => setTimeout(res, delay))
      return createConversation(payload, retries - 1)
    }
    if (retries > 0 && status === 429) {
      console.warn("Rate limited on chat creation, waiting 3s before retry...")
      await new Promise(res => setTimeout(res, 3000))
      return createConversation(payload, retries - 1)
    }
    return null
  }
}