import { checkAgentLimit } from "../config/agentLimit.js"
import { searchTool } from "../config/tavily.js"
import { deductCredits } from "../utils/deductCredit.js"

export const searchAgent = async (state) => {
  try {
    await checkAgentLimit(state.userId,"search")
    const results = await searchTool.invoke({
        query: state.prompt

    })
    console.log(results)
    await deductCredits(state.userId,"search")
    return{
        ...state,
        searchResults: results,
        images:results.images
    }
  } catch (error) {
    console.log(error)
    return{
        ...state,
        searchResults: [],
        images:[],
        aiResponse: error?.data?.message || error?.message || "Failed to search"
    }
  }
}