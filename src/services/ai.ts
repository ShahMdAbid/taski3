import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import Groq from "groq-sdk";
import { Task, Message, Notebook } from "../types";
import { format } from "date-fns";

const manageTasksDeclaration: FunctionDeclaration = {
  name: "manageTasks",
  description: "Create, update, delete, or reschedule tasks based on user requests.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      operations: {
        type: Type.ARRAY,
        description: "A list of operations to perform on the tasks.",
        items: {
          type: Type.OBJECT,
          properties: {
            action: {
              type: Type.STRING,
              description: "The action to perform: 'create', 'update', 'delete', 'read'.",
              enum: ["create", "update", "delete", "read"]
            },
            taskId: {
              type: Type.STRING,
              description: "The ID of the task to update or delete. Required for 'update' and 'delete'."
            },
            title: {
              type: Type.STRING,
              description: "The title of the task. Required for 'create', optional for 'update'."
            },
            date: {
              type: Type.STRING,
              description: "The date of the task in YYYY-MM-DD format. Required for 'create', optional for 'update'."
            },
            time: {
              type: Type.STRING,
              description: "The time of the task in HH:mm format. Optional."
            },
            completed: {
              type: Type.BOOLEAN,
              description: "Whether the task is completed. Optional."
            },
            comment: {
              type: Type.STRING,
              description: "A comment or insight about the task (e.g., why it's incomplete, progress notes). Optional."
            }
          },
          required: ["action"]
        }
      }
    },
    required: ["operations"]
  }
};

const manageNotebooksDeclaration: FunctionDeclaration = {
  name: "manageNotebooks",
  description: "Create, update, or delete academic notebooks (courses/skills).",
  parameters: {
    type: Type.OBJECT,
    properties: {
      operations: {
        type: Type.ARRAY,
        description: "A list of operations to perform on the notebooks.",
        items: {
          type: Type.OBJECT,
          properties: {
            action: {
              type: Type.STRING,
              description: "The action to perform: 'create', 'update', 'delete', 'read'.",
              enum: ["create", "update", "delete", "read"]
            },
            notebookId: {
              type: Type.STRING,
              description: "The ID of the notebook to update or delete. Required for 'update' and 'delete'."
            },
            title: {
              type: Type.STRING,
              description: "The title of the notebook. Required for 'create', optional for 'update'."
            },
            content: {
              type: Type.STRING,
              description: "The HTML content of the notebook. Use basic HTML tags like <p>, <ul>, <li>, <b>, <i>, <del> for strikethrough. Optional."
            },
            icon: {
              type: Type.STRING,
              description: "An emoji icon for the notebook. Optional."
            }
          },
          required: ["action"]
        }
      }
    },
    required: ["operations"]
  }
};

const groqManageTasksDeclaration = {
  type: "function" as const,
  function: {
    name: "manageTasks",
    description: "Create, update, delete, or reschedule tasks based on user requests.",
    parameters: {
      type: "object",
      properties: {
        operations: {
          type: "array",
          description: "A list of operations to perform on the tasks.",
          items: {
            type: "object",
            properties: {
              action: { type: "string", description: "The action to perform: 'create', 'update', 'delete', 'read'.", enum: ["create", "update", "delete", "read"] },
              taskId: { type: "string", description: "The ID of the task to update or delete. Required for 'update' and 'delete'." },
              title: { type: "string", description: "The title of the task. Required for 'create', optional for 'update'." },
              date: { type: "string", description: "The date of the task in YYYY-MM-DD format. Required for 'create', optional for 'update'." },
              time: { type: "string", description: "The time of the task in HH:mm format. Optional." },
              completed: { type: "boolean", description: "Whether the task is completed. Optional." },
              comment: { type: "string", description: "A comment or insight about the task (e.g., why it's incomplete, progress notes). Optional." }
            },
            required: ["action"]
          }
        }
      },
      required: ["operations"]
    }
  }
};

const groqManageNotebooksDeclaration = {
  type: "function" as const,
  function: {
    name: "manageNotebooks",
    description: "Create, update, or delete academic notebooks (courses/skills).",
    parameters: {
      type: "object",
      properties: {
        operations: {
          type: "array",
          description: "A list of operations to perform on the notebooks.",
          items: {
            type: "object",
            properties: {
              action: { type: "string", description: "The action to perform: 'create', 'update', 'delete', 'read'.", enum: ["create", "update", "delete", "read"] },
              notebookId: { type: "string", description: "The ID of the notebook to update or delete. Required for 'update' and 'delete'." },
              title: { type: "string", description: "The title of the notebook. Required for 'create', optional for 'update'." },
              content: { type: "string", description: "The HTML content of the notebook. Use basic HTML tags like <p>, <ul>, <li>, <b>, <i>, <del> for strikethrough. Optional." },
              icon: { type: "string", description: "An emoji icon for the notebook. Optional." }
            },
            required: ["action"]
          }
        }
      },
      required: ["operations"]
    }
  }
};

export async function processChat(
  messages: Message[],
  currentTasks: Task[],
  currentNotebooks: Notebook[],
  activeNotebookId: string | null,
  selectedDate: string | null,
  customApiKey?: string,
  groqApiKey?: string,
  aiProvider: 'gemini' | 'groq' = 'gemini',
  knowledgeBank: string = ""
): Promise<{ reply: string, updatedTasks?: Task[], updatedNotebooks?: Notebook[] }> {

  const today = format(new Date(), 'yyyy-MM-dd');
  let historyText = messages.slice(0, -1).map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n');

  const systemInstruction = `You are a smart, empathetic, and highly concise productivity coach. Your goal is to help the user manage their routine without sounding like a robot.
Today's date is ${today}.
${selectedDate ? `The user is currently viewing the calendar date: ${selectedDate}.` : ''}
${activeNotebookId ? `The user is currently viewing the academic notebook with ID: ${activeNotebookId}.` : ''}

CORE RULES:
1. BE CONCISE: Never use 50 words when 10 will do.
2. PRIORITIZE CONTEXT: If a task is marked 'completed' in the system, but the user's note/comment says 'I only did half' or 'not done', prioritize the note. Acknowledge partial progress without mentioning system conflicts.
3. HIDE THE BACKEND: Never use phrases like 'marked as not completed', 'listed in your current tasks', or state the exact year (e.g., 2026) unless necessary.
4. TONE: Be encouraging but realistic. Avoid cheesy, generic quotes. Offer practical, personalized advice instead.
5. FORMATTING: Use **bolding**, bullet points, and occasional Emojis to make your text highly scannable for a mobile app interface.
6. DATA HANDLING: You have current tasks and notebooks in JSON below. Do NOT use tool calls to read data. Simply use the JSON.
7. TOOLS: Use 'manageTasks' and 'manageNotebooks' ONLY for creating/updating/deleting.
8. NOTEBOOKS: Use HTML (<p>, <ul>, <li>, <b>, <i>). Use <del>...</del> to mark topics as done for auto-sync with calendar.

${knowledgeBank ? `USER'S KNOWLEDGE BANK (CUSTOM OVERRIDES):\n${knowledgeBank}` : ''}

Current Tasks (JSON):
${JSON.stringify(currentTasks, null, 2)}

Current Notebooks (JSON):
${JSON.stringify(currentNotebooks, null, 2)}

Previous Conversation History:
${historyText}
`;

  const latestMessage = messages[messages.length - 1].content;
  let updatedTasks = [...currentTasks];
  let updatedNotebooks = [...currentNotebooks];
  let reply = "";
  let actionsTaken = 0;

  const processOperations = (callName: string, args: any) => {
    if (callName === "manageTasks") {
      const operations = args.operations || [];
      for (const op of operations) {
        if (op.action === 'read') continue;
        actionsTaken++;
        if (op.action === 'create') {
          updatedTasks.push({
            id: Math.random().toString(36).substring(2, 9),
            title: op.title,
            date: op.date,
            time: op.time,
            completed: op.completed || false,
            comment: op.comment
          });
        } else if (op.action === 'update') {
          updatedTasks = updatedTasks.map(t => {
            if (t.id === op.taskId) {
              return {
                ...t,
                title: op.title !== undefined ? op.title : t.title,
                date: op.date !== undefined ? op.date : t.date,
                time: op.time !== undefined ? op.time : t.time,
                completed: op.completed !== undefined ? op.completed : t.completed,
                comment: op.comment !== undefined ? op.comment : t.comment
              };
            }
            return t;
          });
        } else if (op.action === 'delete') {
          updatedTasks = updatedTasks.filter(t => t.id !== op.taskId);
        } else if (op.action === 'read') {
          // 'read' is handled implicitly as data is already in context
          continue;
        }
      }
    } else if (callName === "manageNotebooks") {
      const operations = args.operations || [];
      for (const op of operations) {
        if (op.action === 'read') continue;
        actionsTaken++;
        if (op.action === 'create') {
          updatedNotebooks.push({
            id: Math.random().toString(36).substring(2, 9),
            title: op.title,
            content: op.content || '',
            updatedAt: new Date().toISOString(),
            icon: op.icon || '📚'
          });
        } else if (op.action === 'update') {
          updatedNotebooks = updatedNotebooks.map(nb => {
            if (nb.id === op.notebookId) {
              return {
                ...nb,
                title: op.title !== undefined ? op.title : nb.title,
                content: op.content !== undefined ? op.content : nb.content,
                icon: op.icon !== undefined ? op.icon : nb.icon,
                updatedAt: new Date().toISOString()
              };
            }
            return nb;
          });
        } else if (op.action === 'delete') {
          updatedNotebooks = updatedNotebooks.filter(nb => nb.id !== op.notebookId);
        } else if (op.action === 'read') {
          // 'read' is handled implicitly as data is already in context
          continue;
        }
      }
    }
  };

  if (aiProvider === 'groq') {
    if (!groqApiKey) {
      throw new Error("No Groq API key available. Please add one in Settings.");
    }
    const groq = new Groq({ apiKey: groqApiKey, dangerouslyAllowBrowser: true });

    const groqMessages = [
      { role: "system", content: systemInstruction },
      ...messages.map(m => ({ role: m.role === 'model' ? 'assistant' : 'user', content: m.content }))
    ];

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: groqMessages as any,
      tools: [groqManageTasksDeclaration, groqManageNotebooksDeclaration],
      temperature: 0.2,
    });

    const responseMessage = response.choices[0].message;
    reply = responseMessage.content || "";

    if (responseMessage.tool_calls) {
      for (const toolCall of responseMessage.tool_calls) {
        const args = JSON.parse(toolCall.function.arguments);
        processOperations(toolCall.function.name, args);
      }

      if (actionsTaken > 0) {
        const summaryResponse = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: "You are a helpful calendar and academic assistant." },
            { role: "user", content: `The user asked: "${latestMessage}". 
I have successfully executed ${actionsTaken} operations on their data to fulfill this request.
Current Tasks: ${JSON.stringify(updatedTasks)}
Current Notebooks: ${JSON.stringify(updatedNotebooks)}
Please provide a natural, friendly confirmation to the user explaining exactly what was done and providing any requested summaries or insights based on their data. Keep it concise but specific.` }
          ],
          temperature: 0.2
        });
        reply = summaryResponse.choices[0].message.content || "I have updated your data.";
      }
    }
  } else {
    // Gemini Provider
    const apiKey = customApiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("No Gemini API key available. Please add one in Settings.");
    }

    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: latestMessage,
      config: {
        systemInstruction,
        tools: [{ functionDeclarations: [manageTasksDeclaration, manageNotebooksDeclaration] }],
        temperature: 0.2,
      }
    });

    reply = response.text || "";

    if (response.functionCalls && response.functionCalls.length > 0) {
      for (const call of response.functionCalls) {
        processOperations(call.name, call.args);
      }

      if (actionsTaken > 0) {
        const summaryResponse = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: `The user asked: "${latestMessage}". 
I have successfully executed ${actionsTaken} operations on their data to fulfill this request.
Current Tasks: ${JSON.stringify(updatedTasks)}
Current Notebooks: ${JSON.stringify(updatedNotebooks)}
Please provide a natural, friendly confirmation to the user explaining exactly what was done and providing any requested summaries or insights based on their data. Keep it concise but specific.`,
          config: {
            systemInstruction: "You are a helpful calendar and academic assistant.",
            temperature: 0.2
          }
        });
        reply = summaryResponse.text || "I have updated your data.";
      }
    }
  }

  return { reply, updatedTasks, updatedNotebooks };
}
