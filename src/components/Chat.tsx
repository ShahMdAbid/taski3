import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, X } from 'lucide-react';
import { Task, Message, Notebook } from '../types';
import { cn } from '../lib/utils';
import { processChat } from '../services/ai';

interface ChatProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  notebooks: Notebook[];
  setNotebooks: React.Dispatch<React.SetStateAction<Notebook[]>>;
  activeNotebookId: string | null;
  selectedDate: string | null;
  activeApiKey?: string;
  activeGroqKey?: string;
  aiProvider?: 'gemini' | 'groq';
  onClose?: () => void;
}

export default function Chat({ tasks, setTasks, notebooks, setNotebooks, activeNotebookId, selectedDate, activeApiKey, activeGroqKey, aiProvider = 'gemini', onClose }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'model', content: 'Hi! I am your AI assistant. I can help you schedule tasks or manage your academic notebooks. What would you like to do today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
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
        aiProvider
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
        {onClose && (
          <button 
            onClick={onClose}
            className="lg:hidden p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full text-gray-500 dark:text-gray-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
      
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
        <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full px-4 py-2 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Ask me to schedule something..."
            className="flex-1 bg-transparent outline-none text-sm text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
            disabled={isLoading}
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/50 rounded-full disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
