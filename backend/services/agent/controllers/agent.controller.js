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

    if (conversationId && result?.aiResponse) {
      try {
        await axios.post(`${process.env.CHAT_SERVICE}/save-message`, {
          conversationId,
          role: 'assistant',
          content: result?.aiResponse,
          images: result?.images,
          artifacts: result?.artifacts
        })
      } catch (err) {
        console.warn('Save assistant message skipped:', err?.message)
      }

      try {
        await addMessage(conversationId, 'user', prompt)
        await addMessage(conversationId, 'assistant', result.aiResponse)
      } catch (memErr) {
        console.warn('Add memory skipped:', memErr?.message)
      }
    }

    return res.status(200).json({
      answer: result?.aiResponse || "I'm here to help!",
      images: result?.images || [],
      artifacts: result?.artifacts || []
    })
  } catch (error) {
    console.error('Agent execution error:', error)
    return res.status(200).json({
      answer: error?.message || "❌ An error occurred while processing your request.",
      images: [],
      artifacts: []
    })
  }
}
