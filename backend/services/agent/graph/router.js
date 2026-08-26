import { getModel } from "../config/llmModels.js"

export const router = async (state) => {
  if (state.agent && state.agent !== "auto") {
    return {
      ...state,
      agent: state.agent
    }
  }

  const file = state.file

  if (file && state.file?.mimetype === "application/pdf") {
    return {
      ...state,
      agent: "pdfRag"
    }
  }

  if (file && state.file?.mimetype?.startsWith("image/")) {
    return {
      ...state,
      agent: "imageAnalyzer"
    }
  }

  const promptText = (state.prompt || '').toLowerCase()

  // Fast keyword routing heuristics
  if (promptText.match(/\b(ppt|presentation|slides?|powerpoint|deck)\b/i)) {
    return { ...state, agent: "ppt" }
  }
  if (promptText.match(/\b(pdf|report document|generate pdf)\b/i)) {
    return { ...state, agent: "pdf" }
  }
  if (promptText.match(/\b(image|photo|picture|wallpaper|draw|render|portrait|banana|illustration)\b/i)) {
    return { ...state, agent: "vision" }
  }
  if (promptText.match(/\b(code|coding|function|react|javascript|python|html|css|bug|debug|api|component)\b/i)) {
    return { ...state, agent: "coding" }
  }

  try {
    const llm = await getModel("router")
    const prompt = `You are an AI router.
Classify the user query into exactly ONE agent name:
- chat (general conversation, greetings, explanations, questions)
- search (real-time current news, live web info)
- coding (writing code, debugging, architecture)
- pdf (generating a PDF document)
- ppt (generating a PowerPoint presentation or slide deck)
- vision (generating an AI image, photo, or drawing)

Query: "${state.prompt}"

Return ONLY the single word (chat, search, coding, pdf, ppt, or vision):`

    const response = await llm.invoke(prompt)
    const rawChoice = response.content.trim().toLowerCase().replace(/[^a-z]/g, '')
    const validAgents = ['chat', 'search', 'coding', 'pdf', 'ppt', 'vision']
    const matchedAgent = validAgents.find(a => rawChoice.includes(a)) || 'chat'

    return {
      ...state,
      agent: matchedAgent
    }
  } catch (err) {
    console.warn('Router LLM fallback to chat:', err?.message)
    return {
      ...state,
      agent: 'chat'
    }
  }
}