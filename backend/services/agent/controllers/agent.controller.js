import axios from 'axios'
import { graph } from '../graph/graph.js'
import { addMessage } from '../config/memory.js'
export const agent = async (req, res,next) => {
  try {
    const { prompt, conversationId, agent } = req.body
    const userId = req.headers['x-user-id'] || req.body.userId || req.user?.id || req.user?._id
    const file = req.file
   
    if (conversationId) {
      try {
        await axios.post(`${process.env.CHAT_SERVICE}/save-message`, {
          conversationId,
          role: 'user',
          content: prompt
        })
      } catch (err) {
        console.warn('Save user message skipped:', err?.message)
      }
    }

    console.log('userId', userId)
    console.log('GRAPH INPUT:', {
      prompt,
      conversationId,
      agent,
      userId
    })

    const result = await graph.invoke({
      prompt,
      conversationId,
      agent,
      userId,
      file
    })

    await axios.post(`${process.env.CHAT_SERVICE}/save-message`, {
      conversationId,
      role: 'assistant',
      content: result?.aiResponse,
      images: result?.images,
      artifacts: result?.artifacts
    })
    await addMessage(conversationId, 'user', prompt)
    await addMessage(conversationId, 'assistant', result.aiResponse)

    return res.status(200).json({
      answer: result.aiResponse,
      images: result.images,
      artifacts: result.artifacts
    })
  } catch (error) {
    next(error)
  }
}
