import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, X, Sparkles, BookOpen } from 'lucide-react';
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
  onClose?: () => void;
}

export default function Chat({ 
  tasks, setTasks, notebooks, setNotebooks, 
  activeNotebookId, selectedDate, 
  activeApiKey, activeGroqKey, aiProvider,
  chatPresets, setChatPresets,
  knowledgeBank, setKnowledgeBank,
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
      const { reply, updatedTasks, updatedNotebooks } = await processChat(
        [...messages, userMsg], 
        tasks, 
        notebooks, 
        activeNotebookId, 
        selectedDate, 
        activeApiKey,
        activeGroqKey,
        aiProvider,
        knowledgeBank
      );
      
      if (updatedTasks) {
        setTasks(updatedTasks);
      }
      if (updatedNotebooks) {
        setNotebooks(updatedNotebooks);
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
            value={knowledgeBank}
            onChange={(e) => setKnowledgeBank(e.target.value)}
            placeholder="Tell the AI how to behave (e.g., 'Always be concise', 'Focus on my academic hub goals', 'Use a helpful tone')..."
            className="w-full h-24 bg-white dark:bg-gray-800 border border-purple-200 dark:border-purple-900/50 rounded-xl p-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all dark:text-gray-200 resize-none"
          />
          <p className="mt-2 text-[10px] text-purple-600/70 dark:text-purple-400/50 italic">
            Instructions saved automatically. AI will follow these for all future messages.
          </p>
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
              {msg.content}
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

        <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full px-4 py-2 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Ask me to schedule something..."
            className="flex-1 bg-transparent outline-none text-sm text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
            disabled={isLoading || isManagingPresets}
          />
          <button 
            onClick={() => handleSend()}
            aria-label="Send message"
            disabled={!input.trim() || isLoading || isManagingPresets}
            className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/50 rounded-full disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
