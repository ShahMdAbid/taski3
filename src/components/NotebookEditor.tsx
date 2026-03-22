import React, { useRef, useEffect, useState } from 'react';
import { Notebook } from '../types';
import { ArrowLeft, Bold, Italic, Strikethrough, Palette, Sigma, Table2 } from 'lucide-react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

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
      // Small check to avoid resetting if the only difference is trailing whitespace or normalized tags
      const current = editorRef.current.innerHTML;
      if (current.trim() !== notebook.content?.trim()) {
        editorRef.current.innerHTML = notebook.content || '';
      }
    }
  }, [notebook.content]);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const handleDblClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Handle Math Double-Click
      const mathSpan = target.closest('.math-inline, .math-block') as HTMLElement;
      if (mathSpan && mathSpan.dataset.math) {
        const math = decodeURIComponent(mathSpan.dataset.math);
        const isBlock = mathSpan.classList.contains('math-block');
        const textNode = document.createTextNode(isBlock ? `$$${math}$$` : `$${math}$`);
        mathSpan.parentNode?.replaceChild(textNode, mathSpan);
        handleInput();
        return;
      }
      
      // Handle Markdown Double-Click (Sup/Sub/Tables)
      const mdElement = target.closest('[data-markdown]') as HTMLElement;
      if (mdElement && mdElement.dataset.markdown) {
        const rawMd = decodeURIComponent(mdElement.dataset.markdown);
        if (mdElement.tagName === 'TABLE') {
          const lines = rawMd.split('\n');
          const fragment = document.createDocumentFragment();
          lines.forEach(line => {
            const div = document.createElement('div');
            div.textContent = line;
            fragment.appendChild(div);
          });
          mdElement.parentNode?.replaceChild(fragment, mdElement);
        } else {
          // Inline sup/sub
          const textNode = document.createTextNode(rawMd);
          mdElement.parentNode?.replaceChild(textNode, mdElement);
        }
        handleInput();
        return;
      }
    };

    editor.addEventListener('dblclick', handleDblClick);
    return () => editor.removeEventListener('dblclick', handleDblClick);
  }, []);

  const handleInput = () => {
    if (editorRef.current) {
      onUpdate(notebook.id, { content: editorRef.current.innerHTML, updatedAt: new Date().toISOString() });
    }
  };

  const exec = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    handleInput();
  };

  const formatDocument = () => {
    if (!editorRef.current) return;
    let modified = false;

    // 1. Process Markdown Tables natively in DOM
    // We use a separate pass to find sequences of nodes that look like table rows
    const children = Array.from(editorRef.current.childNodes);
    let tableNodes: ChildNode[] = [];
    
    const processTableGroup = () => {
      if (tableNodes.length >= 2) {
        modified = true;
        const tableRawText = tableNodes.map(n => n.textContent?.replace(/\u00A0/g, ' ').trim() || '').join('\n');
        
        const tableHTML = document.createElement('table');
        tableHTML.className = "w-full text-sm text-left border-collapse my-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors";
        tableHTML.contentEditable = "false";
        tableHTML.dataset.markdown = encodeURIComponent(tableRawText);
        tableHTML.title = "Double-click to edit table";
        
        const thead = document.createElement('thead');
        const tbody = document.createElement('tbody');
        
        tableNodes.forEach((node, index) => {
          const text = node.textContent?.replace(/\u00A0/g, ' ').trim() || '';
          if (text.match(/^\|\s*[:\-]+\s*\|/)) return; // Skip separator row
          
          const row = document.createElement('tr');
          row.className = "border-b dark:border-gray-700";
          
          const cols = text.split('|');
          if (cols.length > 0 && cols[0].trim() === '') cols.shift();
          if (cols.length > 0 && cols[cols.length - 1].trim() === '') cols.pop();
          
          cols.forEach(col => {
            const cell = document.createElement(index === 0 ? 'th' : 'td');
            cell.className = index === 0 
              ? "px-4 py-3 bg-gray-100 dark:bg-gray-800 font-bold border dark:border-gray-700 text-gray-800 dark:text-gray-200" 
              : "px-4 py-3 border dark:border-gray-700 text-gray-700 dark:text-gray-300";
            cell.textContent = col.trim();
            row.appendChild(cell);
          });
          
          if (index === 0) thead.appendChild(row);
          else tbody.appendChild(row);
        });
        
        tableHTML.appendChild(thead);
        tableHTML.appendChild(tbody);
        
        tableNodes[0].parentNode?.insertBefore(tableHTML, tableNodes[0]);
        tableNodes.forEach(n => n.parentNode?.removeChild(n));
      }
      tableNodes = [];
    };

    children.forEach(node => {
      const text = node.textContent?.replace(/\u00A0/g, ' ').trim() || '';
      const isTableRow = text.startsWith('|') && text.endsWith('|') && text.length > 2;
      if (isTableRow) {
        tableNodes.push(node);
      } else {
        processTableGroup();
      }
    });
    processTableGroup(); 
    
    // 2. Process Math & Sub/Superscript with innerHTML
    // IMPORTANT: Capture innerHTML AFTER Step 1 finishes modifying the DOM
    let html = editorRef.current.innerHTML;

    const cleanMathContent = (m: string) => {
      return m
        .replace(/<br\s*\/?>/gi, ' ')
        .replace(/<\/div><div>/gi, ' ')
        .replace(/<[^>]+>/g, '') // Strip all remaining tags
        .replace(/&nbsp;/g, ' ')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .trim();
    };

    // Replace display math $$ ... $$ (Greedy match to handle spans across blocks)
    html = html.replace(/\$\$([\s\S]+?)\$\$/g, (match, math) => {
      modified = true;
      try {
        const decoded = cleanMathContent(math);
        if (!decoded) return match;
        const rendered = katex.renderToString(decoded, { displayMode: true, throwOnError: false });
        return `<span class="math-block inline-block cursor-pointer px-2 py-1 my-1 rounded hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors" contenteditable="false" data-math="${encodeURIComponent(decoded)}" title="Double-click to edit math">${rendered}</span>&nbsp;`;
      } catch (e) {
        return match;
      }
    });

    // Replace inline math $ ... $ (Non-greedy, avoiding tags that break patterns)
    html = html.replace(/(?<!\$)\$([^$\n]+?)\$(?!\$)/g, (match, math) => {
      const decoded = cleanMathContent(math);
      if (!decoded || decoded.length === 0) return match;
      modified = true;
      try {
        const rendered = katex.renderToString(decoded, { displayMode: false, throwOnError: false });
        return `<span class="math-inline inline cursor-pointer px-1 rounded hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors" contenteditable="false" data-math="${encodeURIComponent(decoded)}" title="Double-click to edit math">${rendered}</span>&nbsp;`;
      } catch (e) {
        return match;
      }
    });

    // Superscripts ^sup^
    html = html.replace(/\^([^\^\n<]+)\^/g, (match, content) => {
      modified = true;
      const decoded = cleanMathContent(content);
      return `<sup class="cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors px-0.5 rounded" contenteditable="false" data-markdown="${encodeURIComponent('^'+decoded+'^')}" title="Double-click to edit">${decoded}</sup>&nbsp;`;
    });

    // Subscripts ~sub~
    html = html.replace(/(?<!~)~([^~\n<]+)~(?!~)/g, (match, content) => {
      modified = true;
      const decoded = cleanMathContent(content);
      return `<sub class="cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors px-0.5 rounded" contenteditable="false" data-markdown="${encodeURIComponent('~'+decoded+'~')}" title="Double-click to edit">${decoded}</sub>&nbsp;`;
    });

    if (modified) {
      editorRef.current.innerHTML = html;
      handleInput();
    }
  };

  const colors = ['#000000', '#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#FFFFFF'];

  return (
    <div className="max-w-4xl mx-auto h-full flex flex-col bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden transition-colors duration-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex flex-col gap-4 sticky top-0 bg-white dark:bg-gray-900 z-10 transition-colors duration-200">
        <div className="flex items-center gap-4">
          <button onClick={onBack} aria-label="Go back" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-500 dark:text-gray-400">
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
          <button onClick={() => exec('bold')} aria-label="Bold" className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-md transition-colors text-gray-700 dark:text-gray-300 hover:shadow-sm" title="Bold">
            <Bold className="w-4 h-4" />
          </button>
          <button onClick={() => exec('italic')} aria-label="Italic" className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-md transition-colors text-gray-700 dark:text-gray-300 hover:shadow-sm" title="Italic">
            <Italic className="w-4 h-4" />
          </button>
          <button onClick={() => exec('strikeThrough')} aria-label="Strikethrough" className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-md transition-colors text-gray-700 dark:text-gray-300 hover:shadow-sm" title="Strikethrough">
            <Strikethrough className="w-4 h-4" />
          </button>
          
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-2" />

          <button onClick={formatDocument} aria-label="Render Structure" className="p-2 flex items-center gap-1 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-md transition-colors hover:shadow-sm" title="Render Syntax (Math blocks, Tables, Sup/Sub)">
            <Sigma className="w-4 h-4" />
            <Table2 className="w-4 h-4" />
          </button>
          
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-2" />
          
          <div className="flex items-center gap-1">
            <Palette className="w-4 h-4 text-gray-400 dark:text-gray-500 mr-1" />
            {colors.map(color => (
              <button
                key={color}
                aria-label={`Set text color to ${color}`}
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
          onBlur={formatDocument}
          className="min-h-full outline-none prose prose-indigo dark:prose-invert max-w-none text-gray-800 dark:text-gray-200"
          style={{ minHeight: '500px' }}
          data-placeholder="Start writing your syllabus or planning here... Use $inline$ / $$block$$ for math, ^sup^ for superscript, ~sub~ for subscript, and | A | B | for tables!"
        />
      </div>
    </div>
  );
}
