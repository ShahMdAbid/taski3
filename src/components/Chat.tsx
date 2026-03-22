import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Sparkles, X, Plus, Trash2, Edit2, Check, BookOpen, Save, RotateCcw, Loader2 } from 'lucide-react';
import { Task, Message, Notebook } from '../types';
import { cn } from '../lib/utils';
import { processChat } from '../services/ai';

interface Props {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  notebooks: Notebook[];
  setNotebooks: React.Dispatch<React.SetStateAction<Notebook[]>>;
  activeNotebookId: string | null;
  selectedDate: string | null;
  activeApiKey?: string;
  activeGroqKey?: string;
  aiProvider: 'gemini' | 'groq';
  chatPresets: string[];
  setChatPresets: React.Dispatch<React.SetStateAction<string[]>>;
  knowledgeBank: string;
  setKnowledgeBank: (val: string) => void;
  expenses: any[];
  setExpenses: React.Dispatch<React.SetStateAction<any[]>>;
  onClose?: () => void;
}

const MarkdownText = ({ content, role }: { content: string, role: 'user' | 'model' }) => {
  const lines = content.split('\n');
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        const isBullet = line.trim().startsWith('* ');
        const cleanLine = isBullet ? line.trim().substring(2) : line;

        // Process bold text using regex: **text** -> <strong>text</strong>
        // We handle the case where ** might be nested or multiple times in a line
        const parts = cleanLine.split(/(\*\*.*?\*\*)/g);
        const renderedLine = parts.map((part, j) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return (
              <strong key={j} className={cn("font-bold", role === 'user' ? "text-white" : "text-gray-900 dark:text-gray-100")}>
                {part.slice(2, -2)}
              </strong>
            );
          }
          return <span key={j}>{part}</span>;
        });

        if (isBullet) {
          return (
            <div key={i} className="flex gap-2 ml-1">
              <span className={cn("mt-1", role === 'user' ? "text-blue-100" : "text-blue-500 dark:text-blue-400")}>•</span>
              <span className="flex-1">{renderedLine}</span>
            </div>
          );
        }

        return <p key={i} className="min-h-[1em]">{renderedLine}</p>;
      })}
    </div>
  );
};

export default function Chat({ 
  tasks, setTasks, notebooks, setNotebooks, 
  activeNotebookId, selectedDate, 
  activeApiKey, activeGroqKey, aiProvider,
  chatPresets, setChatPresets,
  knowledgeBank, setKnowledgeBank,
  expenses, setExpenses,
  onClose 
}: Props) {
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: '1', 
      role: 'model', 
      content: "Hello! I'm your academic assistant. I can help you schedule tasks, manage your goals, or answer questions about your notebooks. What's on your mind?" 
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isManagingPresets, setIsManagingPresets] = useState(false);
  const [isKnowledgeBankOpen, setIsKnowledgeBankOpen] = useState(false);
  const [draftKnowledgeBank, setDraftKnowledgeBank] = useState(knowledgeBank);

  // Sync draft when global knowledgeBank changes (e.g., on mount)
  useEffect(() => {
    setDraftKnowledgeBank(knowledgeBank);
  }, [knowledgeBank]);

  const handleSaveKnowledgeBank = () => {
    setKnowledgeBank(draftKnowledgeBank);
    setIsKnowledgeBankOpen(false);
  };

  const handleResetKnowledgeBank = () => {
    setDraftKnowledgeBank('');
    setKnowledgeBank('');
  };
  const [newPreset, setNewPreset] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (customContent?: string) => {
    const textToSend = customContent || input;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: textToSend.trim() };
    setMessages(prev => [...prev, userMsg]);
    if (!customContent) setInput('');
    setIsLoading(true);

    try {
      const result = await processChat(
        [...messages, userMsg], 
        tasks, 
        notebooks, 
        expenses,
        activeNotebookId, 
        selectedDate, 
        activeApiKey,
        activeGroqKey,
        aiProvider,
        knowledgeBank
      );
      
      const { reply, updatedTasks, updatedNotebooks, updatedExpenses } = result;

      if (updatedTasks) {
        setTasks(updatedTasks);
      }
      if (updatedNotebooks) {
        setNotebooks(updatedNotebooks);
      }
      if (updatedExpenses) {
        setExpenses(updatedExpenses);
      }

      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', content: reply }]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', content: error instanceof Error ? error.message : "Sorry, I encountered an error processing your request.", isError: true }]);
    } finally {
      setIsLoading(false);
    }
  };

  const addPreset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPreset.trim()) return;
    setChatPresets(prev => [...prev, newPreset.trim()]);
    setNewPreset('');
  };

  const removePreset = (index: number) => {
    setChatPresets(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 transition-colors duration-200">
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 flex items-center justify-between transition-colors duration-200">
        <div className="flex items-center gap-3">
          <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", aiProvider === 'groq' ? "bg-orange-100 text-orange-600 dark:bg-orange-900/50 dark:text-orange-400" : "bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400")}>
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-800 dark:text-white">AI Assistant</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Powered by {aiProvider === 'groq' ? 'Groq' : 'Gemini'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsKnowledgeBankOpen(!isKnowledgeBankOpen)}
            className={cn(
              "p-2 rounded-lg transition-colors flex items-center gap-2 text-xs font-medium",
              isKnowledgeBankOpen 
                ? "bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400" 
                : "text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            )}
            title="Knowledge Bank (Custom Instructions)"
          >
            <BookOpen className="w-4 h-4" />
            <span className="hidden sm:inline">Knowledge Bank</span>
          </button>
          {onClose && (
            <button 
              onClick={onClose}
              aria-label="Close chat"
              className="lg:hidden p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full text-gray-500 dark:text-gray-400 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {isKnowledgeBankOpen && (
        <div className="p-4 border-b border-purple-100 dark:border-purple-900/30 bg-purple-50/50 dark:bg-purple-900/10 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-purple-700 dark:text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" />
              Custom AI Instructions
            </h3>
            <button 
              onClick={() => setIsKnowledgeBankOpen(false)}
              className="text-purple-400 hover:text-purple-600 transition-colors"
              title="Close knowledge bank"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <textarea
            value={draftKnowledgeBank}
            onChange={(e) => setDraftKnowledgeBank(e.target.value)}
            placeholder="Tell the AI how to behave (e.g., 'Always be concise', 'Focus on my academic goals')..."
            className="w-full h-28 bg-white/80 dark:bg-gray-900/50 border border-purple-200/60 dark:border-purple-800/60 rounded-xl p-3.5 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all text-gray-800 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 resize-none shadow-sm backdrop-blur-sm"
          />
          <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveKnowledgeBank}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm hover:shadow transition-all flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                Save Instructions
              </button>
              <button
                onClick={handleResetKnowledgeBank}
                className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </button>
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium leading-tight">
              💡 AI uses this context for <span className="text-purple-600 dark:text-purple-400">all future messages.</span>
            </p>
          </div>
        </div>
      )}
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(msg => (
          <div key={msg.id} className={cn("flex gap-3", msg.role === 'user' ? "flex-row-reverse" : "")}>
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
              msg.role === 'user' ? "bg-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-400" : (aiProvider === 'groq' ? "bg-orange-100 text-orange-600 dark:bg-orange-900/50 dark:text-orange-400" : "bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400")
            )}>
              {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
            </div>
            <div className={cn(
              "px-4 py-2 rounded-2xl max-w-[80%] text-sm",
              msg.role === 'user' ? "bg-blue-600 text-white rounded-tr-none dark:bg-blue-700" : "bg-gray-100 text-gray-800 rounded-tl-none dark:bg-gray-800 dark:text-gray-200",
              msg.isError && "bg-red-50 text-red-600 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800"
            )}>
              <MarkdownText content={msg.content} role={msg.role} />
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3">
            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0", aiProvider === 'groq' ? "bg-orange-100 text-orange-600 dark:bg-orange-900/50 dark:text-orange-400" : "bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400")}>
              <Bot className="w-5 h-5" />
            </div>
            <div className="px-4 py-3 rounded-2xl bg-gray-100 dark:bg-gray-800 rounded-tl-none flex items-center gap-1">
              <Loader2 className="w-4 h-4 animate-spin text-gray-500 dark:text-gray-400" />
              <span className="text-xs text-gray-500 dark:text-gray-400">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 transition-colors duration-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex flex-wrap gap-2">
            {chatPresets.map((preset, i) => (
              <div key={i} className="group relative">
                <button
                  onClick={() => handleSend(preset)}
                  disabled={isLoading || isManagingPresets}
                  className="text-[10px] sm:text-xs px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 transition-all border border-gray-200 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800 whitespace-nowrap"
                >
                  {preset}
                </button>
                {isManagingPresets && (
                  <button 
                    onClick={() => removePreset(i)}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[8px] hover:bg-red-600 shadow-sm"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
          <button 
            onClick={() => setIsManagingPresets(!isManagingPresets)}
            className={cn(
              "p-1.5 rounded-lg transition-colors ml-2",
              isManagingPresets ? "bg-blue-100 text-blue-600 dark:bg-blue-900/50" : "text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            )}
            title={isManagingPresets ? "Done managing" : "Manage presets"}
          >
            {isManagingPresets ? <X className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
          </button>
        </div>

        {isManagingPresets && (
          <form onSubmit={addPreset} className="flex gap-2 mb-4 animate-in slide-in-from-bottom-2 duration-200">
            <input
              type="text"
              value={newPreset}
              onChange={e => setNewPreset(e.target.value)}
              placeholder="New preset message..."
              className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-blue-500 transition-all"
            />
            <button 
              type="submit"
              disabled={!newPreset.trim()}
              className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              Add
            </button>
          </form>
        )}

        <div className="flex items-end gap-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-[24px] px-4 py-3 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask me to schedule something..."
            rows={1}
            className="flex-1 bg-transparent outline-none text-sm text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 resize-none max-h-32 overflow-y-auto pt-0.5"
            disabled={isLoading || isManagingPresets}
            ref={(el) => {
              if (el) {
                el.style.height = 'auto'; // Reset height
                el.style.height = `${el.scrollHeight}px`; // Set to scrollHeight
              }
            }}
          />
          <button 
            onClick={() => handleSend()}
            aria-label="Send message"
            disabled={!input.trim() || isLoading || isManagingPresets}
            className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/50 rounded-full disabled:opacity-50 disabled:hover:bg-transparent transition-colors mb-0.5"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
