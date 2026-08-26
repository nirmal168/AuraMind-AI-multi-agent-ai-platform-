import { checkAgentLimit } from "../config/agentLimit.js";
import { getModel } from "../config/llmModels.js";
import { deductCredits } from "../utils/deductCredit.js";

export const codingAgent = async (state) => {
  try {
    const intentLlm = await getModel("intent");
    const llm = await getModel("coding");

    await checkAgentLimit(state.userId, "coding");

    const intentRes = await intentLlm.invoke(`
You are an intent classifier.

Classify the user request into ONE of these exact values:

PROJECT_GENERATION
CODE_SNIPPET
CODE_REVIEW
CODE_EXPLANATION
DEBUGGING
OPTIMIZATION
CONVERSION
DOCUMENTATION

Guidelines:
- Use PROJECT_GENERATION ONLY when the user explicitly asks to build, create, or generate a complete full application, website, game, UI component, or multi-file project (e.g., "build a todo app", "create a landing page", "make a weather dashboard").
- Use CODE_SNIPPET / CODE_EXPLANATION for simple code requests, hello world programs, single functions, algorithms, syntax questions, or questions about a specific language (e.g., "tell me helloWorld code in cpp", "binary search in python", "how to use map in js").

Do not return anything else. Return ONLY the category name.

User Request:
${state.prompt}
`);

    const intent = String(intentRes.content).trim();

    console.log("Detected Intent:", intent);

    if (intent.includes("PROJECT_GENERATION")) {
      const prompt = `
You are AuraMind AI Coding Agent.

Generate the requested project.

Default stack:

- HTML
- CSS
- JavaScript

Use React / Next.js / Vue ONLY if explicitly requested.

Rules:

- Responsive
- Modern UI
- CSS Variables
- Flexbox/Grid
- Smooth Scroll
- Hover Effects
- Beautiful spacing
- Single page unless user asks otherwise

IMAGES:

- Always use real Unsplash images
- Never use placeholder images

OUTPUT FORMAT:

Return ONLY valid JSON.

The response MUST follow this exact structure:

{
  "files": [
    {
      "name": "index.html",
      "content": "..."
    },
    {
      "name": "style.css",
      "content": "..."
    },
    {
      "name": "script.js",
      "content": "..."
    }
  ]
}

IMPORTANT:

- Start directly with {
- End directly with }
- No markdown
- No \`\`\`
- No \`\`\`json
- No explanation
- No extra text
- Do not mention the intent
- Make sure JSON is COMPLETE
- Properly escape quotes inside file content
- Properly escape newlines inside JSON strings

User Request:
${state.prompt}
`;

      const res = await llm.invoke(prompt);
      const rawContent = String(res.content);

      console.log("========== AI RESPONSE ==========");
      console.log(rawContent);
      console.log("==================================");

      let data;

      try {
        let cleaned = rawContent.trim();
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          cleaned = jsonMatch[0];
        } else {
          if (cleaned.startsWith("```json")) cleaned = cleaned.substring(7);
          else if (cleaned.startsWith("```")) cleaned = cleaned.substring(3);
          if (cleaned.endsWith("```")) cleaned = cleaned.substring(0, cleaned.length - 3);
        }

        data = JSON.parse(cleaned.trim());
      } catch (error) {
        console.warn("JSON parse failed, attempting markdown extraction fallback:", error.message);
        
        // Fallback: extract code blocks from markdown
        const htmlMatch = rawContent.match(/```(?:html)?\s*([\s\S]*?)```/i);
        const cssMatch = rawContent.match(/```(?:css)?\s*([\s\S]*?)```/i);
        const jsMatch = rawContent.match(/```(?:javascript|js)?\s*([\s\S]*?)```/i);

        const extractedFiles = [];
        if (htmlMatch && htmlMatch[1].trim()) extractedFiles.push({ name: 'index.html', content: htmlMatch[1].trim() });
        if (cssMatch && cssMatch[1].trim() && cssMatch[0] !== htmlMatch?.[0]) extractedFiles.push({ name: 'style.css', content: cssMatch[1].trim() });
        if (jsMatch && jsMatch[1].trim() && jsMatch[0] !== htmlMatch?.[0] && jsMatch[0] !== cssMatch?.[0]) extractedFiles.push({ name: 'script.js', content: jsMatch[1].trim() });

        if (extractedFiles.length > 0) {
          data = { files: extractedFiles };
        } else {
          // If pure markdown, treat as markdown response
          return {
            ...state,
            aiResponse: rawContent,
            artifacts: []
          };
        }
      }

      if (!data || !Array.isArray(data.files) || data.files.length === 0) {
        return {
          ...state,
          aiResponse: rawContent,
          artifacts: []
        };
      }

      console.log(
        "Generated files:",
        data.files.map((file) => file.name)
      );

      await deductCredits(state.userId, "coding");

      return {
        ...state,
        aiResponse: "Code Generated Successfully.",
        artifacts: [
          {
            id: Date.now(),
            type: "Project",
            files: data.files,
            title: state.prompt
          }
        ]
      };
    }

    const res = await llm.invoke(`
The user's request is:

${state.prompt}

Detected intent:

${intent}

Return Markdown only.

Never generate project files.

Use headings like:

# Overview

## Explanation

## Problems

## Improvements

## Best Practices

## Optimized Code (if needed)

User Request:

${state.prompt}
`);

    const data = res.content;

    await deductCredits(state.userId, "coding");

    return {
      ...state,
      aiResponse: data,
      artifacts: []
    };
  } catch (error) {
    console.error("Coding Agent Error:", error);

    return {
      ...state,
      aiResponse: error?.data?.message || error?.message || "Something went wrong while processing your coding request.",
      artifacts: []
    };
  }
};