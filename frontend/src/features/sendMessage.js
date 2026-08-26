import { api } from '../../utils/axios'

async function sendMessage (payload) {
      console.log("Payload:", payload);
  try {
    const { data } = await api.post('/api/agent/chat', payload)
    console.log(data)
    return data
  } catch (error) {
    console.log(error)
    console.log(error.response?.status)
    console.log(error.response?.data)
    return null
  }
}

export default sendMessage
