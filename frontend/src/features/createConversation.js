import { api } from "../../utils/axios"

export const createConversation = async (payload = {}, retries = 3) => {
  try {
    const { data } = await api.post('/api/chat/create-conversation', payload)
    return data
  } catch (error) {
    console.warn("createConversation status:", error.response?.status || error.message)
    const status = error.response?.status
    if (status === 401 || (status === 400 && error.response?.data?.message?.toLowerCase().includes('session'))) {
      window.dispatchEvent(new CustomEvent('session-expired'))
      return null
    }
    if (retries > 0 && (status === 429 || status === 500 || status === 502 || status === 503 || status === 504 || !error.response)) {
      const delay = status === 429 ? 3500 : (4 - retries) * 2000
      console.log(`Warming up/retrying createConversation in ${delay}ms (${retries} attempts left)...`)
      await new Promise(res => setTimeout(res, delay))
      return createConversation(payload, retries - 1)
    }
    // Resilient fallback: return an optimistic conversation so user UI never freezes
    const fallbackId = 'conv_' + Date.now()
    return {
      _id: fallbackId,
      title: payload.title || (payload.type === 'project' ? 'New Project' : 'New Chat'),
      type: payload.type || 'chat',
      projectFiles: payload.projectFiles || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isOptimistic: true
    }
  }
}