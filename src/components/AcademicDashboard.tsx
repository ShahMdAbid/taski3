import React from 'react';
import { Notebook } from '../types';
import { Plus, MoreVertical, BookOpen } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface Props {
  notebooks: Notebook[];
  onOpenNotebook: (id: string) => void;
  onCreateNotebook: () => void;
  onDeleteNotebook: (id: string) => void;
}

export default function AcademicDashboard({ notebooks, onOpenNotebook, onCreateNotebook, onDeleteNotebook }: Props) {
  return (
    <div className="max-w-6xl mx-auto h-full flex flex-col transition-colors duration-200">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Goal Plan
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your objectives, milestones, and syllabus planning.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {/* Create New Card */}
        <button
          onClick={onCreateNotebook}
          className="h-48 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-indigo-400 dark:hover:border-indigo-500 transition-all flex flex-col items-center justify-center gap-3 group"
        >
          <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Plus className="w-6 h-6" />
          </div>
          <span className="font-medium text-gray-600 dark:text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">Add goal</span>
        </button>

        {/* Notebook Cards */}
        {notebooks.map(notebook => (
          <div
            key={notebook.id}
            onClick={() => onOpenNotebook(notebook.id)}
            className="h-48 rounded-2xl bg-gray-800 dark:bg-gray-900 text-white p-5 flex flex-col justify-between cursor-pointer hover:ring-2 hover:ring-indigo-500 hover:ring-offset-2 dark:hover:ring-offset-gray-950 transition-all relative group border border-transparent dark:border-gray-800"
          >
            <div className="flex justify-between items-start">
              <span className="text-3xl">{notebook.icon}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm('Are you sure you want to delete this notebook?')) {
                    onDeleteNotebook(notebook.id);
                  }
                }}
                className="p-1.5 rounded-lg hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-all"
              >
                <MoreVertical className="w-5 h-5 text-gray-300" />
              </button>
            </div>

            <div>
              <h3 className="font-semibold text-lg line-clamp-2 mb-1">{notebook.title}</h3>
              <p className="text-xs text-gray-400">
                {format(parseISO(notebook.updatedAt), 'MMM d, yyyy')}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
