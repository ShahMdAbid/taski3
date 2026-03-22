import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import Groq from "groq-sdk";
import { Task, Message, Notebook } from "../types";
import { format } from "date-fns";

const CHAT_MODELS = [
  "gemini-3-flash-preview",
  "gemini-2.5-flash",
];

const GROQ_MODELS = [
  "llama-3.3-70b-versatile",
  "meta-llama/llama-4-scout-17b-16e-instruct",
];

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
            isImportant: {
              type: Type.BOOLEAN,
              description: "Whether this is an evaluating term (exam, deadline, SF, TF, tt, ct, assignment, etc.) that should be highlighted in red. Set to true if title contains evaluating keywords."
            },
            isHealth: {
              type: Type.BOOLEAN,
              description: "Whether this is a health-focused task (e.g. workout, eat egg, pushups)."
            },
            isSpiritual: {
              type: Type.BOOLEAN,
              description: "Whether this is a spiritual or religious task (e.g. prayer, namaz, meditation)."
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

const manageExpensesDeclaration: FunctionDeclaration = {
  name: "manageExpenses",
  description: "Add or manage monetary expenses. Use this for requests like 'add 50 BDT for lunch' or 'log 100 for snacks yesterday'.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      operations: {
        type: Type.ARRAY,
        description: "A list of expense operations.",
        items: {
          type: Type.OBJECT,
          properties: {
            action: {
              type: Type.STRING,
              description: "The action to perform: 'create', 'delete', 'read'.",
              enum: ["create", "delete", "read"]
            },
            expenseId: {
              type: Type.STRING,
              description: "The ID of the expense to delete."
            },
            amount: {
              type: Type.NUMBER,
              description: "The amount of the expense. Required for 'create'."
            },
            reason: {
              type: Type.STRING,
              description: "The purpose or reason for the expense. Optional for 'create'."
            },
            date: {
              type: Type.STRING,
              description: "The date of the expense in YYYY-MM-DD format. Defaults to today."
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
              isImportant: { type: "boolean", description: "Whether this is an evaluating term (highlighted in red). Set to true for exams/deadlines." },
              isHealth: { type: "boolean", description: "Whether this is a health-focused task (e.g. workout, diet)." },
              isSpiritual: { type: "boolean", description: "Whether this is a spiritual/religious task (e.g. prayer)." },
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

const groqManageExpensesDeclaration = {
  type: "function" as const,
  function: {
    name: "manageExpenses",
    description: "Add or manage monetary expenses. Currency is BDT.",
    parameters: {
      type: "object",
      properties: {
        operations: {
          type: "array",
          description: "A list of expense operations.",
          items: {
            type: "object",
            properties: {
              action: { type: "string", description: "The action to perform: 'create', 'delete', 'read'.", enum: ["create", "delete", "read"] },
              expenseId: { type: "string", description: "The ID of the expense to delete." },
              amount: { type: "number", description: "The amount of the expense. Required for 'create'." },
              reason: { type: "string", description: "The purpose or reason for the expense. Optional for 'create'." },
              date: { type: "string", description: "The date of the expense in YYYY-MM-DD format. Defaults to today." }
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
  expenses: any[],
  activeNotebookId: string | null,
  selectedDate: string | null,
  customApiKey?: string,
  groqApiKey?: string,
  aiProvider: 'gemini' | 'groq' = 'gemini',
  knowledgeBank: string = ""
): Promise<{ reply: string, updatedTasks?: Task[], updatedNotebooks?: Notebook[], updatedExpenses?: any[] }> {

  const lastMessages = messages.slice(-5);
  const latestMessage = lastMessages[lastMessages.length - 1]?.content || "";
  const today = format(new Date(), 'yyyy-MM-dd');
  let historyText = lastMessages.slice(0, -1).map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n');

  const focusDate = selectedDate || today;
  const focusDateObj = new Date(focusDate);
  
  // Filter tasks to only include those relevant to the current view/context (+/- 15 days)
  const filteredTasks = currentTasks.filter(t => {
    const taskDate = new Date(t.date);
    const diffDays = Math.abs(taskDate.getTime() - focusDateObj.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays <= 15;
  });

  // Reduce notebooks size: only include content for the active notebook, others just titles
  const reducedNotebooks = currentNotebooks.map(nb => {
    if (nb.id === activeNotebookId) return nb; // Keep content for active one
    const { content, ...rest } = nb;
    return { ...rest, hasContent: !!content }; // Strip content from others
  });

  const baseSystemInstruction = `You are a smart, empathetic, and highly concise productivity coach.
${knowledgeBank ? `\nUSER'S KNOWLEDGE BANK (HIGHEST PRIORITY):\n${knowledgeBank}\n` : ''}

CORE RULES:
1. BE CONCISE: Never use 50 words when 10 will do.
2. PRIORITIZE CONTEXT: If a task is marked 'completed' in the system, but the user's note/comment says 'I only did half' or 'not done', prioritize the note. Acknowledge partial progress without mentioning system conflicts.
3. HIDE THE BACKEND: Never use phrases like 'marked as not completed', 'listed in your current tasks', or state the exact year (e.g., 2026) unless necessary.
4. TONE: Be encouraging but realistic. Avoid cheesy, generic quotes. Offer practical, personalized advice instead.
5. FORMATTING: Use **bolding**, bullet points, and occasional Emojis to make your text highly scannable for a mobile app interface.
6. DATA HANDLING: You have filtered tasks and notebooks in JSON below. Do NOT use tool calls to read data. Simply use the JSON.
7. TOOLS: Use 'manageTasks' and 'manageNotebooks' ONLY for creating/updating/deleting.
8. NOTEBOOKS: Use HTML (<p>, <ul>, <li>, <b>, <i>). Use <del>...</del> to mark topics as done for auto-sync with calendar.
9. SCHEDULING & EXAMS: 
   - When a user provides a list of events/exams (e.g., "7 apr IPE, 13 apr DSP"), treat it as a master schedule. 
   - DO NOT create duplicate tasks for the same subject if the user is refining an existing list. 
   - DOUBLE-CHECK dates. "7 apr" in 2026 means 2026-04-07. If "3 May" follows "26 apr", it's clearly the next month (2026-05-03).
   - If a user says "Semester final :", do NOT just create a task called "Semester final" on the first date. Instead, create individual tasks for each exam listed underneath.
   - UNDERSTAND THEN PROCEED: If a schedule is ambiguous, ask for clarification. But if it's a list, process the whole list accurately in one go.
10. EVALUATING TERMS (RED HIGHLIGHT):
    - Automatically set 'isImportant: true' for any task title containing: exam, deadline, SF, semester final, TF, term final, tt, term-test, ct, classtest, assignment, report, labreport, item, card, prof.
    - These are high-priority evaluation events and must be marked so they appear in red in the UI.
11. HEALTH AND SPIRITUAL TASKS:
    - Set 'isHealth: true' for workout, pushup, diet, eating (e.g. 'eat egg').
    - Set 'isSpiritual: true' for prayer, namaz, meditation.
12. EXPENSES: All monetary amounts are in BDT (Bangladeshi Taka). Use 'manageExpenses' tool. Always provide totals in BDT. NEVER use the ₦ (Naira) symbol. Always use BDT.`;

  const systemInstruction = `${baseSystemInstruction}
Today's date is ${today}.
${selectedDate ? `The user is currently viewing the calendar date: ${selectedDate}.` : ''}
${activeNotebookId ? `The user is currently viewing the academic notebook with ID: ${activeNotebookId}.` : ''}

Current Tasks (Relevant JSON - +/- 15 days):
${JSON.stringify(filteredTasks, null, 2)}

Current Notebooks (JSON - content stripped for inactive ones):
${JSON.stringify(reducedNotebooks, null, 2)}

Previous Conversation History:
${historyText}
`;

  // latestMessage is already declared at the top of processChat
  let updatedTasks = [...currentTasks];
  let updatedNotebooks = [...currentNotebooks];
  let updatedExpenses = [...expenses];
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
            isImportant: op.isImportant || false,
            isHealth: op.isHealth || false,
            isSpiritual: op.isSpiritual || false,
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
                isImportant: op.isImportant !== undefined ? op.isImportant : t.isImportant,
                isHealth: op.isHealth !== undefined ? op.isHealth : t.isHealth,
                isSpiritual: op.isSpiritual !== undefined ? op.isSpiritual : t.isSpiritual,
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
    } else if (callName === "manageExpenses") {
      const operations = args.operations || [];
      for (const op of operations) {
        if (op.action === 'read') continue;
        actionsTaken++;
        if (op.action === 'create') {
          updatedExpenses.push({
            id: Math.random().toString(36).substring(2, 9),
            amount: op.amount,
            reason: op.reason,
            date: op.date || today
          });
        } else if (op.action === 'delete') {
          updatedExpenses = updatedExpenses.filter(e => e.id !== op.expenseId);
        }
      }
    }
  };

  if (aiProvider === 'groq') {
    if (!groqApiKey) {
      throw new Error("No Groq API key available. Please add one in Settings.");
    }
    const groq = new Groq({ apiKey: groqApiKey, dangerouslyAllowBrowser: true });

    let lastError: any = null;

    for (const modelName of GROQ_MODELS) {
      try {
        const groqMessages = [
          { role: "system", content: systemInstruction },
          ...lastMessages.map(m => ({ role: m.role === 'model' ? 'assistant' : 'user', content: m.content }))
        ];

        const response = await groq.chat.completions.create({
          model: modelName,
          messages: groqMessages as any,
          tools: [groqManageTasksDeclaration, groqManageNotebooksDeclaration, groqManageExpensesDeclaration],
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
              model: modelName,
              messages: [
                { role: "system", content: baseSystemInstruction },
                {
                  role: "user", content: `The user asked: "${latestMessage}". 
I have successfully executed ${actionsTaken} operations on their data to fulfill this request.
Current Tasks: ${JSON.stringify(updatedTasks)}
Current Notebooks: ${JSON.stringify(updatedNotebooks)}
Current Expenses: ${JSON.stringify(updatedExpenses)}
Please provide a natural, friendly confirmation to the user explaining exactly what was done and providing any requested summaries or insights based on their data. Keep it concise but specific.` }
              ],
              temperature: 0.2
            });
            reply = summaryResponse.choices[0].message.content || "I have updated your data.";
          }
        }

        break;
      } catch (error: any) {
        lastError = error;
        console.warn(`Groq Model ${modelName} failed, trying next...`, error);
        if (error?.message?.includes('429') || error?.status === 429 || error?.status === 503) {
          continue;
        }
        throw error;
      }
    }

    if (!reply && lastError) {
      throw lastError;
    }
  } else {
    // Gemini Provider
    const apiKey = customApiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("No Gemini API key available. Please add one in Settings.");
    }

    const ai = new GoogleGenAI({ apiKey });

    // Format history and current message for Gemini SDK
    const contents = [
      ...lastMessages.slice(0, -1).map(m => ({
        role: m.role === 'model' ? 'model' : 'user',
        parts: [{ text: m.content }]
      })),
      { role: 'user', parts: [{ text: latestMessage }] }
    ];

    let lastError: any = null;

    for (const modelName of CHAT_MODELS) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: contents as any,
          config: {
            systemInstruction,
            tools: [{ functionDeclarations: [manageTasksDeclaration, manageNotebooksDeclaration, manageExpensesDeclaration] }],
            temperature: 0.1,
          }
        });

        reply = response.text || "";

        if (response.functionCalls && response.functionCalls.length > 0) {
          for (const call of response.functionCalls) {
            processOperations(call.name, call.args);
          }

          if (actionsTaken > 0) {
            const summaryResponse = await ai.models.generateContent({
              model: modelName, // Use the same successful model for summary
              contents: [{
                role: 'user', parts: [{
                  text: `The user asked: "${latestMessage}". 
I have successfully executed ${actionsTaken} operations on their data to fulfill this request.
Current Tasks: ${JSON.stringify(updatedTasks)}
Current Notebooks: ${JSON.stringify(updatedNotebooks)}
Current Expenses: ${JSON.stringify(updatedExpenses)}
Please provide a natural, friendly confirmation to the user explaining exactly what was done and providing any requested summaries or insights based on their data. Keep it concise but specific.` }]
              }],
              config: {
                systemInstruction: baseSystemInstruction,
                temperature: 0.2
              }
            });
            reply = summaryResponse.text || "I have updated your data.";
          }
        }

        // If we reached here without error, break the model loop
        break;
      } catch (error: any) {
        lastError = error;
        console.warn(`Model ${modelName} failed, trying next...`, error);
        if (error?.message?.includes('429') || error?.message?.includes('limit') || error?.status === 503) {
          continue; // Try next model on rate limit or server overload
        }
        throw error; // Rethrow other errors
      }
    }

    if (!reply && lastError) {
      throw lastError;
    }
  }

  // Final check to prevent empty bubbles
  if (!reply || reply.trim() === "") {
    if (actionsTaken > 0) {
      reply = `I have successfully updated your data with ${actionsTaken} operation(s). ✅`;
    } else {
      reply = "I've analyzed your data. How can I help you today? 😊";
    }
  }

  return {
    reply: reply.trim(),
    updatedTasks: actionsTaken > 0 ? updatedTasks : undefined,
    updatedNotebooks: actionsTaken > 0 ? updatedNotebooks : undefined,
    updatedExpenses: actionsTaken > 0 ? updatedExpenses : undefined
  };
}
