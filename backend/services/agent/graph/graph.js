// console.log("GRAPH FILE LOADED");
// import { StateGraph } from "@langchain/langgraph";
// import { agentState } from "./state.js";
// import { router } from "./router.js";

// import { chatAgent } from "../agents/chat.agent.js";
// import { searchAgent } from "../agents/search.agent.js";
// import { codingAgent } from "../agents/coding.agent.js";
// import { pdfAgent } from "../agents/pdf.agent.js";
// import { pptAgent } from "../agents/ppt.agent.js";
// import { imageGenAgent } from "../agents/imageGen.agent.js";

// const workflow = new StateGraph(agentState);

// // ===================== NODES =====================

// workflow.addNode("router", router);

// workflow.addNode("chat", async (state) => {
//   console.log("===== CHAT NODE =====");
//   return await chatAgent(state);
// });

// workflow.addNode("search", async (state) => {
//   console.log("===== SEARCH NODE =====");
//   return await searchAgent(state);
// });

// workflow.addNode("coding", async (state) => {
//   console.log("===== CODING NODE =====");
//   return await codingAgent(state);
// });

// workflow.addNode("pdf", async (state) => {
//   console.log("===== PDF NODE =====");
//   return await pdfAgent(state);
// });

// workflow.addNode("ppt", async (state) => {
//   console.log("===== PPT NODE =====");
//   return await pptAgent(state);
// });

// workflow.addNode("vision", async (state) => {
//   console.log("===== VISION NODE =====");
//   return await imageGenAgent(state);
// });

// // ===================== START =====================

// workflow.addEdge("__start__", "router");

// // ===================== ROUTER =====================

// workflow.addConditionalEdges(
//   "router",
//   (state) => {
//     console.log("===== CONDITIONAL =====");
//     console.log("Full State:", state);
//     console.log("Agent:", JSON.stringify(state.agent));

//     return state.agent;
//   },
//   {
//     chat: "chat",
//     search: "search",
//     coding: "coding",
//     pdf: "pdf",
//     ppt: "ppt",
//     vision: "vision",
//   }
// );

// // ===================== EDGES =====================

// workflow.addEdge("search", "chat");
// workflow.addEdge("chat", "__end__");
// workflow.addEdge("coding", "__end__");
// workflow.addEdge("pdf", "__end__");
// workflow.addEdge("ppt", "__end__");
// workflow.addEdge("vision", "__end__");

// // ===================== COMPILE =====================

// export const graph = workflow.compile();

import { StateGraph } from "@langchain/langgraph";
import { agentState } from "./state.js";
import { router } from "./router.js";
import { chatAgent } from "../agents/chat.agent.js";
import { searchAgent } from "../agents/search.agent.js";
import { codingAgent } from "../agents/coding.agent.js";
import { pdfAgent } from "../agents/pdf.agent.js";
import { pptAgent } from "../agents/ppt.agent.js";
import { visionAgent } from "../agents/vision.agent.js";
import { pdfRag } from "../agents/pdfRag.agent.js";
import { imageAnalyzer } from "../agents/imageAnalyzer.agent.js";

const workfLow = new StateGraph(agentState)
workfLow.addNode("router",router)
workfLow.addNode("chat",chatAgent)
workfLow.addNode("search",searchAgent)
workfLow.addNode("coding",codingAgent)
workfLow.addNode("pdf",pdfAgent)
workfLow.addNode("ppt",pptAgent)
workfLow.addNode("vision",visionAgent)
workfLow.addNode("pdfRag",pdfRag)
workfLow.addNode("imageAnalyzer",imageAnalyzer)


workfLow.addEdge("__start__","router")
workfLow.addConditionalEdges("router", (state)=>{
    switch(state.agent){
        case "chat":
            return "chat"
        case "search":
            return "search"
        case "coding":
            return "coding"
        case "pdf":
            return "pdf"
        case "ppt":
            return "ppt"
        case "vision":
            return "vision"
        case "pdfRag":
            return "pdfRag"
        case "imageAnalyzer":
            return "imageAnalyzer"        
        default:
            return "chat"
    }
},{
    chat:"chat",
    search:"search",
    coding:"coding",
    pdf:"pdf",
    ppt:"ppt",
    vision:"vision",
    pdfRag:"pdfRag",
    imageAnalyzer:"imageAnalyzer"
}) 


workfLow.addEdge("search","chat")
workfLow.addEdge("chat","__end__")
workfLow.addEdge("coding", "__end__")
workfLow.addEdge("pdf", "__end__")
workfLow.addEdge("ppt", "__end__")
workfLow.addEdge("vision", "__end__")
workfLow.addEdge("pdfRag","__end__")
workfLow.addEdge("imageAnalyzer","__end__")

console.log("reach graph")
export const graph = workfLow.compile();
