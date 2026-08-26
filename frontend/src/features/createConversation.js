import { api } from "../../utils/axios"

export const createConversation = async (payload = {}) =>{
    try {
        const {data} = await api.post('/api/chat/create-conversation', payload)
        return data
    } catch (error) {
        try {
            const {data} = await api.get('/api/chat/create-conversation')
            return data
        } catch (err) {
            console.log(err)
            return null
        }
    }
}