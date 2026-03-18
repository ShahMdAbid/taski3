import React, { useState, useEffect } from 'react';
import Calendar from './components/Calendar';
import Chat from './components/Chat';
import DayView from './components/DayView';
import SettingsView from './components/Settings';
import AcademicDashboard from './components/AcademicDashboard';
import NotebookEditor from './components/NotebookEditor';
import ExpenseTracker from './components/ExpenseTracker';
import { Task, Notebook, Expense } from './types';
import { format } from 'date-fns';
import { Menu, X, Calendar as CalendarIcon, Settings, CheckSquare, BookOpen, MessageSquare, Wallet } from 'lucide-react';
import { cn } from './lib/utils';

export default function App() {
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('tasks');
    return saved ? JSON.parse(saved) : [];
  });
  const [notebooks, setNotebooks] = useState<Notebook[]>(() => {
    const saved = localStorage.getItem('notebooks');
    return saved ? JSON.parse(saved) : [];
  });
  const [apiKeys, setApiKeys] = useState<string[]>(() => {
    const saved = localStorage.getItem('apiKeys');
    return saved ? JSON.parse(saved) : [];
  });
  const [activeKeyIndex, setActiveKeyIndex] = useState<number>(() => {
    const saved = localStorage.getItem('activeKeyIndex');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [groqApiKeys, setGroqApiKeys] = useState<string[]>(() => {
    const saved = localStorage.getItem('groqApiKeys');
    return saved ? JSON.parse(saved) : [];
  });
  const [activeGroqKeyIndex, setActiveGroqKeyIndex] = useState<number>(() => {
    const saved = localStorage.getItem('activeGroqKeyIndex');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem('expenses');
    return saved ? JSON.parse(saved) : [];
  });
  const [aiProvider, setAiProvider] = useState<'gemini' | 'groq'>(() => {
    const saved = localStorage.getItem('aiProvider');
    return (saved as 'gemini' | 'groq') || 'gemini';
  });
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('isDarkMode');
    return saved ? JSON.parse(saved) : false;
  });
  const [chatPresets, setChatPresets] = useState<string[]>(() => {
    const saved = localStorage.getItem('chatPresets');
    return saved ? JSON.parse(saved) : [
      "Schedule a task for tomorrow",
      "Summarize my goals",
      "What's on my schedule today?"
    ];
  });
  const [knowledgeBank, setKnowledgeBank] = useState<string>(() => {
    const saved = localStorage.getItem('knowledgeBank');
    return saved || "";
  });

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'calendar' | 'settings' | 'academic' | 'expenses'>('calendar');
  const [activeNotebookId, setActiveNotebookId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('notebooks', JSON.stringify(notebooks));
  }, [notebooks]);

  useEffect(() => {
    localStorage.setItem('expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('apiKeys', JSON.stringify(apiKeys));
  }, [apiKeys]);

  useEffect(() => {
    localStorage.setItem('activeKeyIndex', activeKeyIndex.toString());
  }, [activeKeyIndex]);

  useEffect(() => {
    localStorage.setItem('groqApiKeys', JSON.stringify(groqApiKeys));
  }, [groqApiKeys]);

  useEffect(() => {
    localStorage.setItem('activeGroqKeyIndex', activeGroqKeyIndex.toString());
  }, [activeGroqKeyIndex]);

  useEffect(() => {
    localStorage.setItem('aiProvider', aiProvider);
  }, [aiProvider]);

  useEffect(() => {
    localStorage.setItem('chatPresets', JSON.stringify(chatPresets));
  }, [chatPresets]);

  useEffect(() => {
    localStorage.setItem('knowledgeBank', knowledgeBank);
  }, [knowledgeBank]);

  useEffect(() => {
    localStorage.setItem('isDarkMode', JSON.stringify(isDarkMode));
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Sync logic: Notebook strikethrough -> Task completion
  useEffect(() => {
    if (notebooks.length === 0) return;
    
    const allStruckTexts = new Set<string>();
    const allNormalTexts = new Set<string>();

    notebooks.forEach(nb => {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = nb.content;
      
      const walk = document.createTreeWalker(tempDiv, NodeFilter.SHOW_TEXT, null);
      let node;
      while (node = walk.nextNode()) {
        const text = node.textContent?.trim();
        if (!text) continue;
        
        let isStruck = false;
        let parent = node.parentElement;
        while (parent && parent !== tempDiv) {
          const tagName = parent.tagName.toLowerCase();
          const style = parent.getAttribute('style') || '';
          if (['strike', 'del', 's'].includes(tagName) || style.includes('line-through')) {
            isStruck = true;
            break;
          }
          parent = parent.parentElement;
        }
        
        if (isStruck) {
          allStruckTexts.add(text);
        } else {
          allNormalTexts.add(text);
        }
      }
    });

    setTasks(prev => {
      let changed = false;
      const newTasks = prev.map(task => {
        const title = task.title.trim();
        if (!title) return task;

        const isStruck = Array.from(allStruckTexts).some(t => t.includes(title));
        const isNormal = Array.from(allNormalTexts).some(t => t.includes(title));

        if (isStruck && !task.completed) {
          changed = true;
          return { ...task, completed: true };
        } else if (isNormal && !isStruck && task.completed) {
          changed = true;
          return { ...task, completed: false };
        }
        return task;
      });
      return changed ? newTasks : prev;
    });
  }, [notebooks]);

  const handleToggleTask = (id: string) => {
    setTasks(prev => {
      const newTasks = prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
      const toggledTask = newTasks.find(t => t.id === id);
      
      if (toggledTask) {
        setNotebooks(nbs => nbs.map(nb => {
          let newContent = nb.content;
          const title = toggledTask.title.trim();
          if (!title) return nb;
          
          const escapedTitle = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          
          // 1. Unstrike everywhere first to normalize
          const unstrikeRegex = new RegExp(`<(strike|del|s)[^>]*>\\s*(${escapedTitle})\\s*<\\/\\1>`, 'gi');
          newContent = newContent.replace(unstrikeRegex, '$2');
          
          const unstrikeSpanRegex = new RegExp(`<span[^>]*style="[^"]*text-decoration:\\s*line-through[^"]*"[^>]*>\\s*(${escapedTitle})\\s*<\\/span>`, 'gi');
          newContent = newContent.replace(unstrikeSpanRegex, '$1');

          if (toggledTask.completed) {
            // 2. Strike through text outside of HTML tags
            newContent = newContent.replace(/(<[^>]+>)|([^<]+)/g, (match, tag, text) => {
              if (tag) return tag;
              return text.replace(new RegExp(escapedTitle, 'gi'), `<s>$&</s>`);
            });
          }
          
          return { ...nb, content: newContent };
        }));
      }
      return newTasks;
    });
  };

  const handleCreateNotebook = () => {
    const newNotebook: Notebook = {
      id: Math.random().toString(36).substring(2, 9),
      title: 'New Notebook',
      content: '',
      updatedAt: new Date().toISOString(),
      icon: '📚'
    };
    setNotebooks(prev => [newNotebook, ...prev]);
    setActiveNotebookId(newNotebook.id);
  };

  const handleUpdateNotebook = (id: string, updates: Partial<Notebook>) => {
    setNotebooks(prev => prev.map(nb => nb.id === id ? { ...nb, ...updates } : nb));
  };

  const handleDeleteNotebook = (id: string) => {
    setNotebooks(prev => prev.filter(nb => nb.id !== id));
  };

  const activeNotebook = notebooks.find(nb => nb.id === activeNotebookId);

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-950 overflow-hidden font-sans transition-colors duration-200">
      {/* Left Sidebar */}
      {isSidebarOpen && (
        <div className="w-64 bg-gray-900 dark:bg-gray-900 text-white flex flex-col h-full shrink-0 shadow-2xl z-20">
          <div className="p-4 flex items-center justify-between border-b border-gray-800">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-blue-400" />
              TaskAI
            </h2>
            <button 
              onClick={() => setIsSidebarOpen(false)}
              aria-label="Close sidebar"
              className="p-1.5 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-3 flex-1 overflow-y-auto space-y-1">
            <button 
              onClick={() => { setCurrentView('calendar'); setSelectedDate(null); setActiveNotebookId(null); setIsSidebarOpen(false); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium text-left"
            >
              <CalendarIcon className="w-4 h-4 text-gray-400" />
              Calendar View
            </button>
            <button 
              onClick={() => { setCurrentView('academic'); setSelectedDate(null); setActiveNotebookId(null); setIsSidebarOpen(false); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium text-left"
            >
              <BookOpen className="w-4 h-4 text-gray-400" />
              Academic Hub
            </button>
            <button 
              onClick={() => { setCurrentView('expenses'); setSelectedDate(null); setActiveNotebookId(null); setIsSidebarOpen(false); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium text-left"
            >
              <Wallet className="w-4 h-4 text-gray-400" />
              Expense Tracker
            </button>
            <button 
              onClick={() => { setCurrentView('settings'); setSelectedDate(null); setActiveNotebookId(null); setIsSidebarOpen(false); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium text-left"
            >
              <Settings className="w-4 h-4 text-gray-400" />
              Settings
            </button>
          </div>
          <div className="p-4 border-t border-gray-800 text-xs text-gray-500">
            Local Storage Active
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col h-full overflow-hidden border-r border-gray-200 dark:border-gray-800">
        <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center justify-between shrink-0 transition-colors duration-200">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              aria-label="Toggle sidebar"
              className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-600 dark:text-gray-300"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold text-gray-800 dark:text-white">
              {currentView === 'settings' ? 'Settings' : 
               currentView === 'academic' ? (activeNotebookId ? 'Notebook Editor' : 'Academic Hub') :
               selectedDate ? 'Day Details' : 'Calendar'}
            </h1>
          </div>
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-4 py-1.5 rounded-full transition-colors duration-200">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6">
          {currentView === 'settings' ? (
            <SettingsView 
              apiKeys={apiKeys} 
              setApiKeys={setApiKeys} 
              activeKeyIndex={activeKeyIndex} 
              setActiveKeyIndex={setActiveKeyIndex} 
              groqApiKeys={groqApiKeys}
              setGroqApiKeys={setGroqApiKeys}
              activeGroqKeyIndex={activeGroqKeyIndex}
              setActiveGroqKeyIndex={setActiveGroqKeyIndex}
              aiProvider={aiProvider}
              setAiProvider={setAiProvider}
              isDarkMode={isDarkMode}
              setIsDarkMode={setIsDarkMode}
              onBack={() => setCurrentView('calendar')} 
            />
          ) : currentView === 'academic' ? (
            activeNotebook ? (
              <NotebookEditor 
                notebook={activeNotebook} 
                onUpdate={handleUpdateNotebook} 
                onBack={() => setActiveNotebookId(null)} 
              />
            ) : (
              <AcademicDashboard 
                notebooks={notebooks} 
                onOpenNotebook={setActiveNotebookId} 
                onCreateNotebook={handleCreateNotebook} 
                onDeleteNotebook={handleDeleteNotebook} 
              />
            )
          ) : currentView === 'expenses' ? (
            <ExpenseTracker 
              expenses={expenses}
              onBack={() => setCurrentView('calendar')}
              onAddExpense={(newExp) => setExpenses(prev => [{ ...newExp, id: Math.random().toString(36).substring(2, 9) }, ...prev])}
              onDeleteExpense={(id) => setExpenses(prev => prev.filter(e => e.id !== id))}
            />
          ) : selectedDate ? (
            <DayView 
              date={selectedDate} 
              tasks={tasks} 
              setTasks={setTasks} 
              onBack={() => setSelectedDate(null)} 
            />
          ) : (
            <Calendar 
              tasks={tasks} 
              onToggleTask={handleToggleTask} 
              onDateClick={setSelectedDate} 
            />
          )}
        </main>

        {/* Mobile Chat Toggle Button */}
        {!isChatOpen && (
          <button
            onClick={() => setIsChatOpen(true)}
            aria-label="Open chat"
            className="lg:hidden fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 transition-colors z-40"
          >
            <MessageSquare className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Mobile Chat Overlay */}
      {isChatOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/20 dark:bg-black/40 z-40 backdrop-blur-sm"
          onClick={() => setIsChatOpen(false)}
        />
      )}

      {/* Chat Sidebar */}
      <div className={cn(
        "fixed inset-y-0 right-0 z-50 w-full sm:w-[400px] flex flex-col h-full bg-white dark:bg-gray-900 shadow-2xl shrink-0 transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0",
        isChatOpen ? "translate-x-0" : "translate-x-full"
      )}>
        <Chat 
          tasks={tasks} 
          setTasks={setTasks} 
          notebooks={notebooks}
          setNotebooks={setNotebooks}
          activeNotebookId={activeNotebookId}
          selectedDate={selectedDate} 
          activeApiKey={apiKeys[activeKeyIndex]} 
          activeGroqKey={groqApiKeys[activeGroqKeyIndex]}
          aiProvider={aiProvider}
          chatPresets={chatPresets}
          setChatPresets={setChatPresets}
          knowledgeBank={knowledgeBank}
          setKnowledgeBank={setKnowledgeBank}
          expenses={expenses}
          setExpenses={setExpenses}
          onClose={() => setIsChatOpen(false)}
        />
      </div>
    </div>
  );
}
