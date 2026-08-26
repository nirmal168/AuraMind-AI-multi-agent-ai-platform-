import fs from 'fs/promises'
import { PDFParse } from 'pdf-parse'
import { getModel } from '../config/llmModels.js'
import { HumanMessage, SystemMessage } from '@langchain/core/messages'
import { deductCredits } from '../utils/deductCredit.js'
import { checkAgentLimit } from '../config/agentLimit.js'

export const pdfRag = async (state) => {
  try {
    let extractedText = ''

    if (state.file?.path) {
      try {
        const buffer = await fs.readFile(state.file.path)
        
        if (state.file.mimetype === 'application/pdf' || state.file.originalname?.endsWith('.pdf')) {
          const pdf = new PDFParse({ data: buffer })
          const result = await pdf.getText()
          extractedText = (typeof result === 'string' ? result : result?.text) || ''
        } else {
          extractedText = buffer.toString('utf-8')
        }
      } catch (readErr) {
        console.warn('Direct PDF/file read error:', readErr?.message)
      }
    }

    const llm = await getModel('chat')
    
    if (state.userId) {
      try {
        await checkAgentLimit(state.userId, 'pdf-rag')
      } catch (err) {
        console.warn('Agent limit check skipped:', err?.message)
      }
    }

    const contextSnippet = extractedText.length > 50000 
      ? extractedText.slice(0, 50000) + '\n...[Content truncated for length]'
      : extractedText

    const messages = [
      new SystemMessage(`You are AuraMind AI Document & Project Expert.
Your task is to analyze the provided document/project context and give a clear, comprehensive, and highly detailed explanation.

Structure your response with:
1. 📌 **Overview & Purpose**: High-level summary of the document/project.
2. 🔍 **Key Components & Topics**: Detailed explanation of concepts, modules, or sections found in the file.
3. 💡 **Deep Dive / Specific Details**: Explaining any relevant code, methods, configurations, or important data.
4. 🚀 **Key Takeaways & Recommendations**: Useful insights or next steps.

Format everything in clean GitHub Flavored Markdown with code blocks and bullet points.`),

      new HumanMessage(`
Document/Project Context:
${contextSnippet || 'No direct text extracted, please analyze based on query.'}

User Question / Directive:
${state.prompt || 'Please explain the complete details of this document/project.'}
`)
    ]

    const response = await llm.invoke(messages)
    
    if (state.userId) {
      try {
        await deductCredits(state.userId, 'pdf')
      } catch (creditErr) {
        console.warn('Credit deduction skipped:', creditErr?.message)
      }
    }

    return {
      ...state,
      aiResponse: response.content
    }
  } catch (error) {
    console.error('PDF Analysis Error:', error)
    return {
      ...state,
      aiResponse: error?.data?.message || error?.message || '❌ Failed to analyze document. Please try again.'
    }
  } finally {
    if (state.file?.path) {
      await fs.unlink(state.file.path).catch(() => {})
    }
  }
}
