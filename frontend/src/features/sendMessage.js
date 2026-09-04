import { api } from '../../utils/axios'

async function sendMessage (payload, retries = 3) {
  try {
    const { data } = await api.post('/api/agent/chat', payload)
    return data
  } catch (error) {
    const status = error.response?.status
    console.warn("sendMessage error status:", status || error.message)

    if (retries > 0 && (status === 429 || status === 500 || status === 502 || status === 503 || status === 504 || !error.response)) {
      const delay = status === 429 ? 4000 : (4 - retries) * 2500
      console.log(`Agent service waking up/retrying in ${delay}ms (${retries} attempts left)...`)
      await new Promise(res => setTimeout(res, delay))
      return sendMessage(payload, retries - 1)
    }
    throw error
  }
}

export default sendMessage
