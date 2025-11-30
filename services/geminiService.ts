import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { ChatMessage, MessageRole } from "../types";

// Initialize Gemini Client
// Note: In a real production app, you might want to handle key validation more gracefully.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const sendCodeMessage = async (
  messages: ChatMessage[],
  activeFileContent: string | null,
  activeFileName: string | null
): Promise<string> => {
  try {
    if (!process.env.API_KEY) {
      return "Error: API Key is missing. Please check your environment configuration.";
    }

    const modelId = 'gemini-2.5-flash'; 
    
    // Construct the history for the chat model
    // We only send the last few messages to save context, plus the current context
    const recentMessages = messages.slice(-10); // Keep last 10 messages context

    let systemContext = `You are an expert senior software engineer and code reviewer. 
    You are helpful, concise, and precise. 
    User is asking questions about a codebase they have imported.
    `;

    if (activeFileContent && activeFileName) {
      systemContext += `
      \n--- ACTIVE FILE CONTEXT ---\n
      Filename: ${activeFileName}
      \n
      Content:
      \`\`\`
      ${activeFileContent.slice(0, 30000)} 
      \`\`\`
      (Note: File content may be truncated if too large)
      \n--- END FILE CONTEXT ---\n
      The user is currently looking at this file. Answer questions relative to this file if applicable.
      `;
    } else {
      systemContext += "\nNo specific file is currently open.";
    }

    const contents = [
      { role: 'user', parts: [{ text: systemContext }] }, // Prime the context as the first user message for simple chat simulation or use systemInstruction if using chat model
      ...recentMessages.map(msg => ({
        role: msg.role === MessageRole.USER ? 'user' : 'model',
        parts: [{ text: msg.text }]
      }))
    ];

    // Using generateContent for a single turn interaction based on history manually constructed
    // This allows us to inject dynamic file context easily into the "history" or current prompt
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: modelId,
      contents: contents,
      config: {
        // systemInstruction: systemContext, // Alternatively use systemInstruction
        temperature: 0.2, // Lower temperature for more precise code answers
      }
    });

    return response.text || "I couldn't generate a response.";

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return `Error communicating with AI: ${error.message || 'Unknown error'}`;
  }
};