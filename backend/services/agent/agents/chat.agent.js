// import { AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages'
// import { getModel } from '../config/llmModels.js'
// import { getMemory } from '../config/memory.js'

// export const chatAgent = async (state) => {
//   console.log('===== CHAT AGENT CALLED =====')
//   const llm = await getModel('chat')

//   const history = await getMemory(JSON.stringify(state.conversationId))

   
//   const searchContext = state.searchResults? `web search result : ${state.searchResults}
//   Answer the user using only the above search result
//   `
//   :" "



//  const systemPrompt = `you are AuraMind AI , an intelligent Ai assistant

//   ${searchContext}
//   if searchContext exits 
//   -Use search result to answer
//   -Do not mention internal tools.

//  Rules:

// - For simple questions, greetings, and short queries, respond naturally in plain text.
// - For technical, educational, coding, or detailed topics, use clean Markdown.

//   Formatting:

// - Use # for titles and ## for sections.
// - Leave a blank line after headings.
// - Use bullet points for lists.
// - Use numbered lists for steps.
// - Use fenced code blocks with language tags for code.
// - Keep paragraphs short and readable.
// - Never write headings and content on the same line.
// - Never generate large walls of text.
//  `


//   const messages = [
//       new SystemMessage(systemPrompt)
//   ];
 
//   (history ?? []).forEach((msg) => {
//   console.log(msg);

//   if (msg.role === "user") {
//     messages.push(new HumanMessage(msg.content));
//   } else {
//     messages.push(new AIMessage(msg.content));
//   }
// });

//   messages.push(new HumanMessage(state.prompt))
//   console.log(messages)

//   const response = await llm.invoke(messages)

//   return {
//     ...state,
//     aiResponse: response.content
//   }
// }


import {
  AIMessage,
  HumanMessage,
  SystemMessage,
} from "@langchain/core/messages";

import { getModel } from "../config/llmModels.js";
import { getMemory } from "../config/memory.js";
import { deductCredits } from "../utils/deductCredit.js";
import { checkAgentLimit } from "../config/agentLimit.js";

export const chatAgent = async (state) => {
  console.log("===== CHAT AGENT CALLED =====");
  console.log("USER ID:", state.userId);

  try {
    if (state.userId) {
      try {
        await checkAgentLimit(state.userId, "chat");
      } catch (limitErr) {
        console.warn("Agent limit check skipped:", limitErr?.message);
      }
    }

    const llm = await getModel("chat");
    const history = await getMemory(state.conversationId);

    let searchContext = "";

    if (state.searchResults?.results?.length) {
      searchContext = state.searchResults.results
        .map(
          (item, index) => `
Result ${index + 1}

Title:
${item.title}

Content:
${item.content}

Source:
${item.url}
`
        )
        .join("\n\n");
    }

    const systemPrompt = `
You are AuraMind AI, an intelligent AI assistant.

${
  searchContext
    ? `Web Search Results:

${searchContext}`
    : ""
}

Instructions:

- If web search results are available, answer using them.
- If no search results exist, answer using your own knowledge.
- Never mention internal tools or implementation details.
- Be clear, accurate, and concise.
- Use clean Markdown formatting.
`;

    const messages = [new SystemMessage(systemPrompt)];

    const recentHistory = (history ?? []).slice(-6);

    recentHistory.forEach((msg) => {
      let contentStr = String(msg.content || '').trim();
      if (contentStr.length > 600) {
        contentStr = contentStr.substring(0, 600) + '...';
      }
      if (contentStr) {
        if (msg.role === "user") {
          messages.push(new HumanMessage(contentStr));
        } else if (msg.role === "assistant") {
          messages.push(new AIMessage(contentStr));
        }
      }
    });

    messages.push(new HumanMessage(state.prompt));

    const response = await llm.invoke(messages);

    if (state.userId) {
      try {
        await deductCredits(state.userId, "chat");
      } catch (creditErr) {
        console.warn("Credit deduction skipped:", creditErr?.message);
      }
    }

    return {
      ...state,
      aiResponse: response.content,
    };
  } catch (error) {
    console.error("Chat agent error:", error);

    return {
      ...state,
      aiResponse: error?.data?.message || error?.message || "❌ An error occurred while processing your request.",
    };
  }
};