import React, { useState } from 'react';
import { Key, Trash2, CheckCircle2, Circle, ArrowLeft, Moon, Sun, Cpu } from 'lucide-react';
import { cn } from '../lib/utils';

interface SettingsProps {
  apiKeys: string[];
  setApiKeys: React.Dispatch<React.SetStateAction<string[]>>;
  activeKeyIndex: number;
  setActiveKeyIndex: React.Dispatch<React.SetStateAction<number>>;
  groqApiKeys: string[];
  setGroqApiKeys: React.Dispatch<React.SetStateAction<string[]>>;
  activeGroqKeyIndex: number;
  setActiveGroqKeyIndex: React.Dispatch<React.SetStateAction<number>>;
  aiProvider: 'gemini' | 'groq';
  setAiProvider: React.Dispatch<React.SetStateAction<'gemini' | 'groq'>>;
  isDarkMode: boolean;
  setIsDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
  onBack: () => void;
}

export default function Settings({ 
  apiKeys, setApiKeys, activeKeyIndex, setActiveKeyIndex, 
  groqApiKeys, setGroqApiKeys, activeGroqKeyIndex, setActiveGroqKeyIndex,
  aiProvider, setAiProvider,
  isDarkMode, setIsDarkMode,
  onBack 
}: SettingsProps) {
  const [newKey, setNewKey] = useState('');
  const [newGroqKey, setNewGroqKey] = useState('');

  const handleAddKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim()) return;
    setApiKeys(prev => [...prev, newKey.trim()]);
    if (apiKeys.length === 0) setActiveKeyIndex(0);
    setNewKey('');
  };

  const removeKey = (index: number) => {
    setApiKeys(prev => prev.filter((_, i) => i !== index));
    if (activeKeyIndex === index) {
      setActiveKeyIndex(0);
    } else if (activeKeyIndex > index) {
      setActiveKeyIndex(prev => prev - 1);
    }
  };

  const handleAddGroqKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroqKey.trim()) return;
    setGroqApiKeys(prev => [...prev, newGroqKey.trim()]);
    if (groqApiKeys.length === 0) setActiveGroqKeyIndex(0);
    setNewGroqKey('');
  };

  const removeGroqKey = (index: number) => {
    setGroqApiKeys(prev => prev.filter((_, i) => i !== index));
    if (activeGroqKeyIndex === index) {
      setActiveGroqKeyIndex(0);
    } else if (activeGroqKeyIndex > index) {
      setActiveGroqKeyIndex(prev => prev - 1);
    }
  };

  const maskKey = (key: string) => {
    if (key.length <= 8) return '********';
    return `${key.slice(0, 4)}...${key.slice(-4)}`;
  };

  return (
    <div className="max-w-4xl mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col h-full transition-colors duration-200">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex items-center gap-4 sticky top-0 z-10 shrink-0 transition-colors duration-200">
        <button onClick={onBack} aria-label="Go back" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold text-gray-800 dark:text-white tracking-tight">Settings</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50 dark:bg-gray-950/50 space-y-6 transition-colors duration-200">
        
        {/* Appearance Settings */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm transition-colors duration-200">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            {isDarkMode ? <Moon className="w-5 h-5 text-indigo-400" /> : <Sun className="w-5 h-5 text-amber-500" />}
            Appearance
          </h3>
          <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <div>
              <p className="font-medium text-gray-800 dark:text-white">Dark Mode</p>
            </div>
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              aria-label="Toggle dark mode"
              className={cn("w-12 h-6 rounded-full transition-colors relative", isDarkMode ? "bg-indigo-600" : "bg-gray-300")}
            >
              <div className={cn("w-4 h-4 rounded-full bg-white absolute top-1 transition-transform", isDarkMode ? "translate-x-7" : "translate-x-1")} />
            </button>
          </div>
        </div>

        {/* AI Provider Settings */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm transition-colors duration-200">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-purple-500" />
            AI Provider
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Select which AI model provider you want to use.
          </p>
          <div className="flex gap-4">
            <label className={cn("flex-1 p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3", aiProvider === 'gemini' ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/20" : "border-gray-200 dark:border-gray-700 hover:border-blue-300")}>
              <input type="radio" name="provider" value="gemini" checked={aiProvider === 'gemini'} onChange={() => setAiProvider('gemini')} className="hidden" />
              <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center", aiProvider === 'gemini' ? "border-blue-500" : "border-gray-300 dark:border-gray-600")}>
                {aiProvider === 'gemini' && <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />}
              </div>
              <div>
                <p className="font-semibold text-gray-800 dark:text-white">Google Gemini</p>
              </div>
            </label>
            <label className={cn("flex-1 p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3", aiProvider === 'groq' ? "border-orange-500 bg-orange-50/50 dark:bg-orange-900/20" : "border-gray-200 dark:border-gray-700 hover:border-orange-300")}>
              <input type="radio" name="provider" value="groq" checked={aiProvider === 'groq'} onChange={() => setAiProvider('groq')} className="hidden" />
              <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center", aiProvider === 'groq' ? "border-orange-500" : "border-gray-300 dark:border-gray-600")}>
                {aiProvider === 'groq' && <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />}
              </div>
              <div>
                <p className="font-semibold text-gray-800 dark:text-white">Groq</p>
              </div>
            </label>
          </div>
        </div>

        {/* Gemini Keys */}
        {aiProvider === 'gemini' && (
          <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm transition-colors duration-200">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2 flex items-center gap-2">
              <Key className="w-5 h-5 text-blue-600" />
              Gemini API Keys
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Manage your Gemini API keys here.{' '}
              <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600 hover:underline">
                Get a Gemini API key
              </a>
            </p>

            <form onSubmit={handleAddKey} className="flex gap-3 mb-6">
              <input
                type="password"
                placeholder="Enter Gemini API Key (AIzaSy...)"
                value={newKey}
                onChange={e => setNewKey(e.target.value)}
                className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm dark:text-white"
              />
              <button type="submit" disabled={!newKey.trim()} className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 dark:disabled:bg-blue-800 text-white px-5 py-2.5 rounded-lg font-semibold transition-colors text-sm shrink-0">
                Add Key
              </button>
            </form>

            <div className="space-y-3">
              {apiKeys.length === 0 ? (
                <div className="text-center py-8 text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
                  <p className="text-sm">No custom API keys added. Using default system key.</p>
                </div>
              ) : (
                apiKeys.map((key, index) => (
                  <div key={index} className={cn("flex items-center justify-between p-4 rounded-lg border transition-all", activeKeyIndex === index ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800" : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700")}>
                    <div className="flex items-center gap-3 cursor-pointer flex-1" onClick={() => setActiveKeyIndex(index)}>
                      {activeKeyIndex === index ? <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400" /> : <Circle className="w-5 h-5 text-gray-300 dark:text-gray-600" />}
                      <span className="font-mono text-sm text-gray-700 dark:text-gray-300">{maskKey(key)}</span>
                      {activeKeyIndex === index && <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50 px-2 py-0.5 rounded-full">Active</span>}
                    </div>
                    <button onClick={() => removeKey(index)} aria-label="Remove API key" className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Groq Keys */}
        {aiProvider === 'groq' && (
          <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm transition-colors duration-200">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2 flex items-center gap-2">
              <Key className="w-5 h-5 text-orange-500" />
              Groq API Keys
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Manage your Groq API keys here. A valid key is required to use Groq.{' '}
              <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:text-orange-600 hover:underline">
                Get a Groq API key
              </a>
            </p>

            <form onSubmit={handleAddGroqKey} className="flex gap-3 mb-6">
              <input
                type="password"
                placeholder="Enter Groq API Key (gsk_...)"
                value={newGroqKey}
                onChange={e => setNewGroqKey(e.target.value)}
                className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all text-sm dark:text-white"
              />
              <button type="submit" disabled={!newGroqKey.trim()} className="bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 dark:disabled:bg-orange-800 text-white px-5 py-2.5 rounded-lg font-semibold transition-colors text-sm shrink-0">
                Add Key
              </button>
            </form>

            <div className="space-y-3">
              {groqApiKeys.length === 0 ? (
                <div className="text-center py-8 text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
                  <p className="text-sm">No Groq API keys added. Please add one to use Groq.</p>
                </div>
              ) : (
                groqApiKeys.map((key, index) => (
                  <div key={index} className={cn("flex items-center justify-between p-4 rounded-lg border transition-all", activeGroqKeyIndex === index ? "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800" : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700")}>
                    <div className="flex items-center gap-3 cursor-pointer flex-1" onClick={() => setActiveGroqKeyIndex(index)}>
                      {activeGroqKeyIndex === index ? <CheckCircle2 className="w-5 h-5 text-orange-500 dark:text-orange-400" /> : <Circle className="w-5 h-5 text-gray-300 dark:text-gray-600" />}
                      <span className="font-mono text-sm text-gray-700 dark:text-gray-300">{maskKey(key)}</span>
                      {activeGroqKeyIndex === index && <span className="text-xs font-medium text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/50 px-2 py-0.5 rounded-full">Active</span>}
                    </div>
                    <button onClick={() => removeGroqKey(index)} aria-label="Remove Groq API key" className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
