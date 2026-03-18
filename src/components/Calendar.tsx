import React, { useState } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays } from 'date-fns';
import { ChevronLeft, ChevronRight, CheckCircle2, Circle } from 'lucide-react';
import { Task } from '../types';
import { cn } from '../lib/utils';

interface CalendarProps {
  tasks: Task[];
  onToggleTask?: (id: string) => void;
  onDateClick?: (date: string) => void;
}

export default function Calendar({ tasks, onToggleTask, onDateClick }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const dateFormat = "d";
  const rows = [];
  let days = [];
  let day = startDate;
  let formattedDate = "";

  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
      formattedDate = format(day, dateFormat);
      const cloneDay = day;
      
      const dayTasks = tasks.filter(t => t.date === format(cloneDay, 'yyyy-MM-dd'));

      days.push(
        <div
          key={day.toString()}
          onClick={() => onDateClick?.(format(cloneDay, 'yyyy-MM-dd'))}
          className={cn(
            "min-h-[120px] p-2 border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors",
            !isSameMonth(day, monthStart) ? "text-gray-300 dark:text-gray-600 bg-gray-50/50 dark:bg-gray-950/50" : "text-gray-700 dark:text-gray-200",
            isSameDay(day, new Date()) && "bg-blue-50/30 dark:bg-blue-900/10"
          )}
        >
          <div className="flex justify-between items-start">
            <span className={cn(
              "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full",
              isSameDay(day, new Date()) ? "bg-blue-600 text-white" : ""
            )}>
              {formattedDate}
            </span>
          </div>
          <div className="mt-2 flex-1 overflow-y-auto space-y-1 custom-scrollbar">
            {dayTasks.filter(task => !task.isHealth && !task.isSpiritual).map(task => (
              <div 
                key={task.id} 
                className={cn(
                  "text-xs p-1.5 rounded truncate flex items-center gap-1.5 transition-colors",
                  task.completed 
                    ? "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 line-through" 
                    : task.isImportant
                      ? "bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800/60 font-medium"
                      : "bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800/60"
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleTask?.(task.id);
                }}
              >
                {task.completed ? <CheckCircle2 className="w-3 h-3 shrink-0" /> : <Circle className="w-3 h-3 shrink-0" />}
                <span className="truncate">{task.time ? `${task.time} ` : ''}{task.title}</span>
              </div>
            ))}
          </div>
        </div>
      );
      day = addDays(day, 1);
    }
    rows.push(
      <div className="grid grid-cols-7" key={day.toString()}>
        {days}
      </div>
    );
    days = [];
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden transition-colors duration-200">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
          {format(currentDate, 'MMMM yyyy')}
        </h2>
        <div className="flex gap-2">
          <button onClick={prevMonth} aria-label="Previous month" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
            <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <button onClick={nextMonth} aria-label="Next month" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
            <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950/50">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {day}
          </div>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto">
        {rows}
      </div>
    </div>
  );
}
