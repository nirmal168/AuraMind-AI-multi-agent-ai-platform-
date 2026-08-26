import axios from 'axios'

export const getMessages = async (conversationId) => {
    if (!conversationId || conversationId === 'undefined' || conversationId === 'null') {
        return [];
    }
    try {
        const response = await axios.get(`${process.env.CHAT_SERVICE}/get-messages/${conversationId}`);
        const data = response.data;
        return Array.isArray(data) ? data : (data?.messages || []);
    } catch (error) {
        return [];
    }
}