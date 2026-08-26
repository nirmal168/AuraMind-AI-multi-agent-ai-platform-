import { api } from '../../utils/axios'

export const deleteConversation = async (conversationId) => {
  try {
    const { data } = await api.delete(`/api/chat/delete-conversation/${conversationId}`)
    return data
  } catch (error) {
    console.error('delete conversation error:', error)
    return null
  }
}
