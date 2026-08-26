import { TavilySearch } from "@langchain/tavily";
import axios from 'axios';
import dotenv from 'dotenv'
dotenv.config()

let instance = null

async function searchWebFallback(query) {
  try {
    const wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srlimit=4&format=json`
    const res = await axios.get(wikiUrl, { headers: { 'User-Agent': 'AuraMindAI/1.0 (contact@auramind.ai)' }, timeout: 3500 })
    const results = (res.data.query?.search || []).map(item => ({
      title: item.title,
      content: item.snippet?.replace(/<\/?[^>]+(>|$)/g, ""),
      url: `https://en.wikipedia.org/wiki/${encodeURIComponent(item.title)}`
    }))
    return { results, images: [] }
  } catch (e) {
    return { results: [], images: [] }
  }
}

export const searchTool = {
  invoke: async (input) => {
    const query = typeof input === 'string' ? input : (input?.query || input?.prompt || '')
    if (!process.env.TAVILY_API_KEY) {
      return await searchWebFallback(query)
    }
    if (!instance) {
      instance = new TavilySearch({
        maxResults: 5,
        topic: "general",
        includeImages: true,
        apiKey: process.env.TAVILY_API_KEY
      })
    }
    try {
      return await instance.invoke(input)
    } catch (e) {
      return await searchWebFallback(query)
    }
  }
}