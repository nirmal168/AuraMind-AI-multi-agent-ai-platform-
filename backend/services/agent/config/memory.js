import redis from '../shared/redis/redis.js'
import { getMessages } from '../utils/getMessages.js'

export const getMemory = async (conversationId) => {
    if (!conversationId || conversationId === 'undefined' || conversationId === 'null') {
        return [];
    }
    const key = `messages-${conversationId}`
    try {
        const cached = await redis.get(key)
        if (cached && cached !== "undefined" && cached !== "null") {
            const parsed = JSON.parse(cached)
            if (Array.isArray(parsed)) {
                return parsed
            }
        }
    } catch (err) {
        console.error('Error parsing cached memory:', err)
    }

    const messages = (await getMessages(conversationId)) || []
    try {
        await redis.set(key, JSON.stringify(messages), 'EX', 60 * 60 * 24)
    } catch (err) {
        console.error('Error caching memory in redis:', err)
    }

    return messages;
}

export const addMessage = async (conversationId, role, content) => {
    const key = `messages-${conversationId}`
    let messages = []
    try {
        const rawMessages = await redis.get(key)
        if (rawMessages && rawMessages !== "undefined" && rawMessages !== "null") {
            const parsed = JSON.parse(rawMessages)
            if (Array.isArray(parsed)) {
                messages = parsed
            } else {
                messages = (await getMessages(conversationId)) || []
            }
        } else {
            messages = (await getMessages(conversationId)) || []
        }
    } catch (err) {
        console.error('Error reading memory before addMessage:', err)
        messages = (await getMessages(conversationId)) || []
    }

    if (!Array.isArray(messages)) {
        messages = []
    }

    messages.push({ role, content: content || "" })

    if (messages.length > 20) {
        messages.shift()
    }
    
    try {
        await redis.set(key, JSON.stringify(messages), 'EX', 60 * 60 * 24)
    } catch (err) {
        console.error('Error saving updated memory to redis:', err)
    }
}