import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { ArrowLeft, Plus, Trash2, Clock, CheckCircle2, Circle, MessageSquare } from 'lucide-react';
import { Task } from '../types';
import { cn } from '../lib/utils';

interface DayViewProps {
  date: string;
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  onBack: () => void;
}

export default function DayView({ date, tasks, setTasks, onBack }: DayViewProps) {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskTime, setNewTaskTime] = useState('');

  const dayTasks = tasks
    .filter(t => t.date === date)
    .sort((a, b) => (a.time || '24:00').localeCompare(b.time || '24:00'));

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newTask: Task = {
      id: Math.random().toString(36).substring(2, 9),
      title: newTaskTitle.trim(),
      date: date,
      time: newTaskTime || undefined,
      completed: false
    };

    setTasks(prev => [...prev, newTask]);
    setNewTaskTitle('');
    setNewTaskTime('');
  };

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const updateTaskComment = (id: string, comment: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, comment } : t));
  };

  const parsedDate = parseISO(date);

  return (
    <div className="max-w-4xl mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col h-full transition-colors duration-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex items-center gap-4 sticky top-0 z-10 shrink-0 transition-colors duration-200">
        <button 
          onClick={onBack} 
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-baseline gap-3">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white tracking-tight">{format(parsedDate, 'EEEE')}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{format(parsedDate, 'MMMM d, yyyy')}</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50 dark:bg-gray-950/50">
        {/* Task List */}
        <div className="space-y-3">
          {dayTasks.length === 0 ? (
            <div className="text-center py-16 text-gray-400 dark:text-gray-500 bg-white dark:bg-gray-900 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
              <p className="text-lg font-medium text-gray-500 dark:text-gray-400">No tasks scheduled for this day.</p>
              <p className="mt-2">Add one below or ask the AI assistant to schedule something!</p>
            </div>
          ) : (
            dayTasks.map(task => (
              <div
                key={task.id}
                className={cn(
                  "group flex flex-col p-4 rounded-xl border transition-all duration-200",
                  task.completed 
                    ? "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-800 opacity-75" 
                    : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => toggleTask(task.id)}>
                    <button className={cn(
                      "transition-colors shrink-0",
                      task.completed ? "text-gray-400 dark:text-gray-500" : "text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                    )}>
                      {task.completed ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                    </button>
                    <div className={cn("flex flex-col", task.completed && "line-through text-gray-500 dark:text-gray-400")}>
                      <span className={cn("text-base font-medium", task.completed ? "text-gray-500 dark:text-gray-400" : "text-gray-800 dark:text-gray-200")}>
                        {task.title}
                      </span>
                      {task.time && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5 font-medium">
                          <Clock className="w-3 h-3" /> {task.time}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all shrink-0 ml-2"
                    title="Delete task"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                {/* Comment Section */}
                <div className="mt-3 pl-9 pr-8">
                  <div className="flex items-start gap-2">
                    <MessageSquare className="w-4 h-4 text-gray-400 dark:text-gray-500 mt-2 shrink-0" />
                    <textarea
                      placeholder="Add a comment or insight (e.g., 'Waiting for PR review', 'Blocked by X')..."
                      value={task.comment || ''}
                      onChange={(e) => updateTaskComment(task.id, e.target.value)}
                      rows={task.comment ? Math.max(2, task.comment.split('\n').length) : 1}
                      className="w-full text-sm bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400 dark:focus:border-blue-500 focus:ring-1 focus:ring-blue-400 dark:focus:ring-blue-500 text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 resize-none transition-all"
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Task Form (Moved to bottom) */}
      <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shrink-0 transition-colors duration-200">
        <form onSubmit={handleAddTask} className="flex gap-3 items-center">
          <div className="flex-1 flex items-center gap-3 bg-gray-50 dark:bg-gray-800 px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 focus-within:border-blue-500 dark:focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
            <Plus className="w-5 h-5 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Add a new task for this day..."
              value={newTaskTitle}
              onChange={e => setNewTaskTitle(e.target.value)}
              className="flex-1 bg-transparent outline-none text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 font-medium text-sm"
            />
          </div>
          <div className="w-32 flex items-center gap-2 bg-gray-50 dark:bg-gray-800 px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 focus-within:border-blue-500 dark:focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
            <Clock className="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0" />
            <input
              type="time"
              value={newTaskTime}
              onChange={e => setNewTaskTime(e.target.value)}
              className="flex-1 bg-transparent outline-none text-gray-800 dark:text-gray-200 font-medium text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={!newTaskTitle.trim()}
            className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 disabled:bg-blue-300 dark:disabled:bg-blue-800 text-white px-5 py-2.5 rounded-lg font-semibold transition-colors shadow-sm text-sm shrink-0"
          >
            Add
          </button>
        </form>
      </div>
    </div>
  );
}
