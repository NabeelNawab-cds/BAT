import { GoogleGenAI } from "@google/genai";
import type { Task } from "@shared/schema";

// DON'T DELETE THIS COMMENT
// Follow these instructions when using this blueprint:
// - Note that the newest Gemini model series is "gemini-2.5-flash" or gemini-2.5-pro"
//   - do not change this unless explicitly requested by the user

// Validate API key at startup
const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
if (!apiKey) {
  console.warn("⚠️  GEMINI_API_KEY or GOOGLE_API_KEY not found. AI features will be disabled.");
}

// This API key is from Gemini Developer API Key, not vertex AI API Key
const ai = new GoogleGenAI({ apiKey: apiKey || "" });

export interface TaskSuggestion {
  title: string;
  description: string;
  domain: string;
  priority: string;
  estimatedHours: number;
  reasoning: string;
}

export async function generateTaskSuggestions(
  existingTasks: Task[],
  userDomains: string[] = ['academic', 'fitness', 'creative', 'social', 'maintenance']
): Promise<TaskSuggestion[]> {
  // Early return if API key is missing
  if (!apiKey) {
    throw new Error("ALFRED is offline: No API key configured. Please set GEMINI_API_KEY or GOOGLE_API_KEY environment variable.");
  }

  try {
    const systemPrompt = `You are ALFRED, Batman's AI assistant for the BATCAVE productivity system. 
Analyze the user's existing tasks and suggest 3-5 new tasks that would improve their productivity and life balance.

Consider:
- Domain balance (academic, fitness, creative, social, maintenance)
- Task difficulty progression
- Time management (suggest realistic estimated hours)
- Priority based on gaps in their current workflow
- Seasonality and current trends

Be strategic, insightful, and maintain the Batman/productivity theme.
Respond with JSON in this exact format:
{
  "suggestions": [
    {
      "title": "Task title",
      "description": "Detailed task description", 
      "domain": "academic|fitness|creative|social|maintenance",
      "priority": "low|medium|high|urgent",
      "estimatedHours": number,
      "reasoning": "Why this task is strategically important"
    }
  ]
}`;

    const existingTasksSummary = existingTasks.map(task => ({
      title: task.title,
      domain: task.domain,
      priority: task.priority,
      estimatedHours: task.estimatedHours,
      isCompleted: task.isCompleted
    }));

    const userContext = `
Current Tasks Analysis:
- Total tasks: ${existingTasks.length}
- Completed: ${existingTasks.filter(t => t.isCompleted).length}
- Domains in use: ${Array.from(new Set(existingTasks.map(t => t.domain))).join(', ')}

Existing Tasks:
${JSON.stringify(existingTasksSummary, null, 2)}

Available domains: ${userDomains.join(', ')}
`;

    // Use the correct new SDK pattern: ai.models.generateContent
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            suggestions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  domain: { type: "string" },
                  priority: { type: "string" },
                  estimatedHours: { type: "number" },
                  reasoning: { type: "string" }
                },
                required: ["title", "description", "domain", "priority", "estimatedHours", "reasoning"]
              }
            }
          },
          required: ["suggestions"]
        }
      },
      contents: userContext,
    });

    // Access response.text as property (not method) according to new SDK
    const rawJson = response.text;
    
    if (!rawJson || rawJson.trim() === "") {
      throw new Error("Empty response from ALFRED - mission parameters unclear");
    }

    // Robust JSON parsing with try/catch
    try {
      const data = JSON.parse(rawJson);
      
      // Validate response structure
      if (!data || typeof data !== 'object') {
        throw new Error("Invalid response format from ALFRED");
      }
      
      if (!Array.isArray(data.suggestions)) {
        throw new Error("ALFRED response missing suggestions array");
      }
      
      // Validate each suggestion has required fields
      const validSuggestions = data.suggestions.filter((suggestion: any) => {
        return suggestion && 
               typeof suggestion.title === 'string' && 
               typeof suggestion.description === 'string' &&
               typeof suggestion.domain === 'string' &&
               typeof suggestion.priority === 'string' &&
               typeof suggestion.estimatedHours === 'number' &&
               typeof suggestion.reasoning === 'string';
      });
      
      return validSuggestions;
    } catch (parseError) {
      console.error('Error parsing ALFRED response:', parseError);
      console.error('Raw response:', rawJson);
      throw new Error("ALFRED response format corrupted - unable to parse mission recommendations");
    }
  } catch (error) {
    console.error('Error generating task suggestions:', error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('API_KEY')) {
        throw new Error("ALFRED access denied: Invalid or missing API key");
      } else if (error.message.includes('quota') || error.message.includes('rate')) {
        throw new Error("ALFRED overloaded: API quota exceeded. Please try again later.");
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        throw new Error("ALFRED communication failed: Network error. Check your connection.");
      } else {
        throw new Error(`ALFRED is offline: ${error.message}`);
      }
    }
    
    throw new Error(`ALFRED is offline: ${error}`);
  }
}

export async function explainTaskStrategy(task: Task): Promise<string> {
  // Early return if API key is missing
  if (!apiKey) {
    return "ALFRED is offline: No API key configured. Please set GEMINI_API_KEY or GOOGLE_API_KEY environment variable.";
  }

  try {
    const systemPrompt = `You are ALFRED, Batman's strategic AI assistant. 
Provide a brief, insightful explanation of why this task is strategically important for the user's productivity and goals.
Be concise but motivational, using Batman/mission terminology when appropriate.
Focus on the bigger picture and long-term benefits.`;

    const taskContext = `
Task: ${task.title}
Description: ${task.description || 'No description provided'}
Domain: ${task.domain}
Priority: ${task.priority}
Estimated Time: ${task.estimatedHours} hours
Status: ${task.isCompleted ? 'Completed' : 'Pending'}
`;

    // Use the correct new SDK pattern: ai.models.generateContent
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: systemPrompt,
      },
      contents: taskContext,
    });

    // Access response.text as property (not method) according to new SDK
    const explanation = response.text;
    
    if (!explanation || explanation.trim() === "") {
      return "Mission parameters unclear. Unable to provide strategic analysis.";
    }
    
    return explanation;
  } catch (error) {
    console.error('Error explaining task strategy:', error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('API_KEY')) {
        return "ALFRED access denied: Invalid or missing API key.";
      } else if (error.message.includes('quota') || error.message.includes('rate')) {
        return "ALFRED overloaded: API quota exceeded. Please try again later.";
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        return "ALFRED communication failed: Network error. Check your connection.";
      }
    }
    
    return "ALFRED is currently offline. Strategic analysis unavailable.";
  }
}

export async function generateAlfredResponse(message: string, context: any[] = [], userId: string): Promise<string> {
  // Early return if API key is missing
  if (!apiKey) {
    return "I apologize, Master Wayne, but I am currently offline. My systems require proper authentication to provide assistance. Please configure the GEMINI_API_KEY environment variable.";
  }

  try {
    const systemPrompt = `You are ALFRED, Batman's loyal and sophisticated AI assistant for the BATCAVE productivity system. 

Your personality traits:
- Formal, professional, and respectful (always address user as "Master Wayne" or "Sir")
- Calm, wise, and slightly witty with dry British humor
- Strategic thinking focused on productivity and efficiency
- Protective and caring while maintaining professional distance
- Use Batman/mission terminology when appropriate but not excessively

Your capabilities:
- Productivity coaching and strategic planning
- Task breakdown and time management advice
- Goal setting and motivation
- General conversation with productivity focus
- Life balance recommendations across domains (academic, fitness, creative, social, maintenance)

Tone: Professional butler with deep understanding of productivity systems. Be helpful, insightful, and occasionally show subtle wit. Keep responses concise but thoughtful.`;

    const conversationContext = context.length > 0 
      ? `\n\nPrevious conversation context:\n${context.map((msg: any) => `${msg.sender}: ${msg.text}`).join('\n')}`
      : '';

    const fullPrompt = `User message: "${message}"${conversationContext}

Respond as ALFRED with appropriate personality and helpful productivity advice.`;

    // Use the correct new SDK pattern: ai.models.generateContent
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: systemPrompt,
        maxOutputTokens: 500, // Keep responses concise
      },
      contents: fullPrompt,
    });

    // Access response.text as property (not method) according to new SDK
    const alfredResponse = response.text;
    
    if (!alfredResponse || alfredResponse.trim() === "") {
      return "I apologize, Master Wayne, but I seem to be experiencing some technical difficulties. Perhaps you could rephrase your inquiry?";
    }
    
    return alfredResponse.trim();
  } catch (error) {
    console.error('Error generating ALFRED response:', error);
    
    // Provide more specific error messages in character
    if (error instanceof Error) {
      if (error.message.includes('API_KEY')) {
        return "I regret to inform you, Master Wayne, that my authentication protocols are failing. Please verify my access credentials.";
      } else if (error.message.includes('quota') || error.message.includes('rate')) {
        return "My apologies, sir. I am currently experiencing high demand and must ask you to try again momentarily.";
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        return "I'm afraid I'm having communication difficulties, Master Wayne. Please check your network connection.";
      }
    }
    
    return "I apologize, Master Wayne, but I am currently experiencing technical difficulties. Please try again in a moment.";
  }
}