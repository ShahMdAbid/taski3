import React, { useRef, useEffect, useState } from 'react';
import { Notebook } from '../types';
import { ArrowLeft, Bold, Italic, Strikethrough, Palette, Save } from 'lucide-react';

interface Props {
  notebook: Notebook;
  onUpdate: (id: string, updates: Partial<Notebook>) => void;
  onBack: () => void;
}

export default function NotebookEditor({ notebook, onUpdate, onBack }: Props) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [title, setTitle] = useState(notebook.title);
  const [icon, setIcon] = useState(notebook.icon);

  // Update editor content only when notebook.content changes from outside
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== notebook.content) {
      editorRef.current.innerHTML = notebook.content;
    }
  }, [notebook.content]);

  const handleInput = () => {
    if (editorRef.current) {
      onUpdate(notebook.id, { content: editorRef.current.innerHTML, updatedAt: new Date().toISOString() });
    }
  };

  const exec = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    handleInput();
  };

  const colors = ['#000000', '#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#FFFFFF'];

  return (
    <div className="max-w-4xl mx-auto h-full flex flex-col bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden transition-colors duration-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex flex-col gap-4 sticky top-0 bg-white dark:bg-gray-900 z-10 transition-colors duration-200">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-500 dark:text-gray-400">
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3 flex-1">
            <input 
              type="text" 
              value={icon}
              onChange={(e) => {
                setIcon(e.target.value);
                onUpdate(notebook.id, { icon: e.target.value });
              }}
              className="w-12 text-3xl text-center bg-transparent outline-none border-b border-transparent focus:border-gray-300 dark:focus:border-gray-700"
              placeholder="📚"
            />
            <input 
              type="text" 
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                onUpdate(notebook.id, { title: e.target.value });
              }}
              className="text-2xl font-bold text-gray-800 dark:text-white bg-transparent outline-none border-b border-transparent focus:border-gray-300 dark:focus:border-gray-700 flex-1"
              placeholder="Notebook Title"
            />
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800/50 p-2 rounded-lg border border-gray-200 dark:border-gray-700">
          <button onClick={() => exec('bold')} className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-md transition-colors text-gray-700 dark:text-gray-300 hover:shadow-sm" title="Bold">
            <Bold className="w-4 h-4" />
          </button>
          <button onClick={() => exec('italic')} className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-md transition-colors text-gray-700 dark:text-gray-300 hover:shadow-sm" title="Italic">
            <Italic className="w-4 h-4" />
          </button>
          <button onClick={() => exec('strikeThrough')} className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-md transition-colors text-gray-700 dark:text-gray-300 hover:shadow-sm" title="Strikethrough (Syncs with Calendar)">
            <Strikethrough className="w-4 h-4" />
          </button>
          
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-2" />
          
          <div className="flex items-center gap-1">
            <Palette className="w-4 h-4 text-gray-400 dark:text-gray-500 mr-1" />
            {colors.map(color => (
              <button
                key={color}
                onClick={() => exec('foreColor', color)}
                className="w-6 h-6 rounded-full border border-gray-200 dark:border-gray-700 hover:scale-110 transition-transform"
                style={{ backgroundColor: color }}
                title={`Text Color: ${color}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 overflow-y-auto p-8 bg-gray-50/30 dark:bg-gray-950/30">
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          className="min-h-full outline-none prose prose-indigo dark:prose-invert max-w-none text-gray-800 dark:text-gray-200"
          style={{ minHeight: '500px' }}
          placeholder="Start writing your syllabus or planning here..."
        />
      </div>
    </div>
  );
}
