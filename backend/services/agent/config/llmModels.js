import dotenv from "dotenv"
import { ChatGroq } from "@langchain/groq"
import { ChatGoogleGenerativeAI } from "@langchain/google-genai"
import { ChatOpenRouter } from "@langchain/openrouter";
dotenv.config()


let groqInstance = null
let groqBackupInstance = null
let geminiInstance = null
let openrouterInstance = null

const getGemini = () => {
    if (!geminiInstance) {
        geminiInstance = new ChatGoogleGenerativeAI({
            model: process.env.GEMINI_MODEL || "gemini-3.6-flash",
            apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY,
            maxRetries: 1,
        })
    }
    return geminiInstance
}

const getGroq = () => {
    if (!process.env.GROQ_API_KEY) return getGemini()
    if (!groqInstance) {
        groqInstance = new ChatGroq({
            model: process.env.GROQ_MODEL || "openai/gpt-oss-20b",
            apiKey: process.env.GROQ_API_KEY,
            maxTokens: 4000,
            temperature: 0.1,
        })
    }
    return groqInstance
}

const getGroqBackup = () => {
    if (!process.env.GROQ_API_KEY) return getGemini()
    if (!groqBackupInstance) {
        groqBackupInstance = new ChatGroq({
            model: "qwen/qwen3.6-27b",
            apiKey: process.env.GROQ_API_KEY,
            maxTokens: 4000,
            temperature: 0.1,
        })
    }
    return groqBackupInstance
}

const getOpenRouter = () => {
    if (!process.env.OPENROUTER_API_KEY) return getGroq()
    if (!openrouterInstance) {
        openrouterInstance = new ChatOpenRouter({
            model: process.env.OPENROUTER_MODEL || "deepseek/deepseek-chat",
            temperature: 0,
            maxTokens: 12000,
            apiKey: process.env.OPENROUTER_API_KEY,
        })
    }
    return openrouterInstance
}

// Wrapper with automatic multi-tier fallback for 100% uptime
const createResilientModel = () => {
    return {
        invoke: async (...args) => {
            // Tier 1: Primary Groq (openai/gpt-oss-20b)
            try {
                if (process.env.GROQ_API_KEY) {
                    const primary = getGroq()
                    return await primary.invoke(...args)
                }
            } catch (err1) {
                console.warn('Groq primary error, trying Groq backup:', err1?.message)
            }

            // Tier 2: Backup Groq (qwen/qwen3.6-27b)
            try {
                if (process.env.GROQ_API_KEY) {
                    const backup = getGroqBackup()
                    const res = await backup.invoke(...args)
                    // Clean any thinking tags from Qwen
                    if (res?.content && typeof res.content === 'string') {
                        res.content = res.content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim()
                    }
                    return res
                }
            } catch (err2) {
                console.warn('Groq backup error, trying Gemini:', err2?.message)
            }

            // Tier 3: Gemini
            try {
                if (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY) {
                    const gemini = getGemini()
                    return await gemini.invoke(...args)
                }
            } catch (err3) {
                console.warn('Gemini error:', err3?.message)
            }

            return {
                content: "I am ready to assist you. Please ask your question!"
            }
        }
    }
}

export const getModel = (agent) => {
    return createResilientModel()
}


