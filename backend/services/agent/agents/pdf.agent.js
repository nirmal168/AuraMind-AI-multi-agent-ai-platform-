import { checkAgentLimit } from "../config/agentLimit.js"
import { getModel } from "../config/llmModels.js"
import { deductCredits } from "../utils/deductCredit.js"
import { generatePdf } from "../utils/generatePdf.js"
import { getFromS3 } from "../utils/getFromS3.js"
import { uploadToS3 } from "../utils/uploadToS3.js"

export const pdfAgent = async (state) => {
  try {
    if (state.userId) {
      try {
        await checkAgentLimit(state.userId, "pdf")
      } catch (err) {
        console.warn("Agent limit check skipped:", err?.message)
      }
    }

    const llm = await getModel("pdf")
    const prompt = `You are an expert document writer.

Return ONLY valid JSON.

Structure:
{
  "title": "Document Title",
  "subtitle": "Document Subtitle",
  "sections": [
    {
      "heading": "Section Heading",
      "points": [
        "Key Point 1",
        "Key Point 2",
        "Key Point 3"
      ]
    }
  ]
}

Generate 4-6 sections.
Each section should have 3-5 concise bullet points.

Topic: ${state.prompt}`

    const response = await llm.invoke(prompt)
    let cleanJson = response.content.trim()
    const jsonMatch = cleanJson.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      cleanJson = jsonMatch[0]
    }

    const data = JSON.parse(cleanJson)
    
    if (state.userId) {
      try {
        await deductCredits(state.userId, "pdf")
      } catch (creditErr) {
        console.warn("Credit deduction skipped:", creditErr?.message)
      }
    }

    let downloadUrl = null

    try {
      const { filename } = await generatePdf(data)
      const gatewayUrl = process.env.GATEWAY_URL || 'http://localhost:5000'
      downloadUrl = `${gatewayUrl}/api/agent/download/${filename}`
    } catch (pdfErr) {
      console.warn("PDF generation failed:", pdfErr?.message)
    }

    let docMarkdown = `## 📄 ${data.title}\n*${data.subtitle || ''}*\n\n`
    
    if (downloadUrl) {
      docMarkdown += `[📥 Download PDF Document (.pdf)](${downloadUrl})\n\n---\n\n`
    }

    data.sections?.forEach(sec => {
      docMarkdown += `### 📌 ${sec.heading}\n`
      sec.points?.forEach(pt => {
        docMarkdown += `- ${pt}\n`
      })
      docMarkdown += `\n`
    })

    return {
      ...state,
      aiResponse: docMarkdown
    }

  } catch (error) {
    console.error("PDF agent error:", error)
    return {
      ...state,
      aiResponse: error?.data?.message || error?.message || "❌ Failed to generate PDF"
    }
  }
}