import { getModel } from '../config/llmModels.js'
import { deductCredits } from '../utils/deductCredit.js'
import { generatePPt } from '../utils/generatePPT.js'
import { getFromS3 } from '../utils/getFromS3.js'
import { uploadToS3 } from '../utils/uploadToS3.js'
import { checkAgentLimit } from '../config/agentLimit.js'

export const pptAgent = async state => {
  try {
    const llm = await getModel('ppt')
    if (state.userId) {
      try {
        await checkAgentLimit(state.userId, 'ppt')
      } catch (err) {
        console.warn('Agent limit check skipped:', err?.message)
      }
    }

    const prompt = `You are a world-class presentation strategist (equivalent to ChatGPT Plus / Gamma App).
Create an executive-level, comprehensive, masterclass slide presentation on the requested topic.

Topic: "${state.prompt}"

Structure Rules:
1. Generate 6 to 8 content slides covering:
   - Slide 1: Executive Overview & Background
   - Slide 2: Core Concepts & Foundational Principles
   - Slide 3: Detailed Breakdown & Key Mechanics
   - Slide 4: Real-World Applications / Exam Case Studies
   - Slide 5: Strategic Insights, Pro-Tips & Common Pitfalls
   - Slide 6: Key Takeaways & Actionable Summary
2. Each slide must contain 3 to 4 high-value bullet points.
3. Start each bullet point with a bold lead-in keyword (e.g. "**Origin & Governance**: ...", "**Exam Critical**: ...").
4. Keep bullets informative, professional, and impactful.

Respond with ONLY valid JSON:
{
  "title": "Compelling Main Presentation Title",
  "subtitle": "Informative Subtitle Describing the Scope",
  "slides": [
    {
      "title": "1. Executive Overview & Fundamentals",
      "points": [
        "**Core Definition**: Clear and concise explanation of the subject.",
        "**Historical Context**: Key milestones and foundational background.",
        "**Significance**: Why this topic is essential for mastery."
      ]
    }
  ]
}`

    const res = await llm.invoke(prompt)
    let cleanJson = res.content.trim()
    const jsonMatch = cleanJson.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      cleanJson = jsonMatch[0]
    }

    const data = JSON.parse(cleanJson)
    
    if (state.userId) {
      try {
        await deductCredits(state.userId, 'ppt')
      } catch (creditErr) {
        console.warn('Credit deduction skipped:', creditErr?.message)
      }
    }

    let downloadUrl = null

    try {
      const { filename } = await generatePPt(data)
      const gatewayUrl = process.env.GATEWAY_URL || 'http://localhost:5000'
      downloadUrl = `${gatewayUrl}/api/agent/download/${filename}`
    } catch (pptErr) {
      console.warn('PPT file generation failed:', pptErr?.message)
    }

    // Build structured presentation view
    let slidesMarkdown = `## 📊 ${data.title}\n*${data.subtitle || ''}*\n\n`
    
    if (downloadUrl) {
      slidesMarkdown += `[📥 Download PowerPoint File (.pptx)](${downloadUrl})\n\n---\n\n`
    }

    data.slides?.forEach((slide, idx) => {
      slidesMarkdown += `### 📑 Slide ${idx + 1}: ${slide.title}\n`
      slide.points?.forEach(pt => {
        slidesMarkdown += `- ${pt}\n`
      })
      slidesMarkdown += `\n---\n\n`
    })

    return {
      ...state,
      aiResponse: slidesMarkdown
    }
  } catch (error) {
    console.error('PPT agent error:', error)
    return {
      ...state,
      aiResponse: error?.data?.message || error?.message || '❌ Failed to generate presentation. Please try again.'
    }
  }
}
