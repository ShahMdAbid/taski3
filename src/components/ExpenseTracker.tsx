import React, { useState, useMemo } from 'react';
import { format, subDays, startOfDay, eachDayOfInterval, nextDay, parseISO } from 'date-fns';
import { Plus, TrendingUp, Calendar as CalendarIcon, Wallet, ChevronLeft, ChevronRight, X, DollarSign, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Expense } from '../types';
import { cn } from '../lib/utils';

interface Props {
  expenses: Expense[];
  onAddExpense: (expense: Omit<Expense, 'id'>) => void;
  onDeleteExpense: (id: string) => void;
  onBack: () => void;
}

type TimeRange = 7 | 14 | 30;

export default function ExpenseTracker({ expenses, onAddExpense, onDeleteExpense, onBack }: Props) {
  const [timeRange, setTimeRange] = useState<TimeRange>(7);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [isAdding, setIsAdding] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(parseFloat(amount))) return;
    onAddExpense({
      amount: parseFloat(amount),
      reason: reason.trim(),
      date
    });
    setAmount('');
    setReason('');
    setIsAdding(false);
  };

  const chartData = useMemo(() => {
    const end = startOfDay(new Date());
    const start = subDays(end, timeRange - 1);
    const interval = eachDayOfInterval({ start, end });

    return interval.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dailyTotal = expenses
        .filter(e => e.date === dayStr)
        .reduce((sum, e) => sum + e.amount, 0);
      return {
        date: dayStr,
        label: format(day, 'MMM d'),
        value: dailyTotal
      };
    });
  }, [expenses, timeRange]);

  const maxVal = Math.max(...chartData.map(d => d.value), 1) || 1;
  const totalInPeriod = chartData.reduce((sum, d) => sum + d.value, 0);

  // SVG Chart Dimensions
  const width = 800;
  const height = 200;
  const padding = 20;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const points = chartData.map((d, i) => {
    const x = padding + (i / Math.max(chartData.length - 1, 1)) * chartWidth;
    const y = padding + chartHeight - (d.value / maxVal) * chartHeight;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            aria-label="Go back"
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-600 dark:text-gray-400"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <Wallet className="w-6 h-6 text-emerald-500" />
              Expense Tracker
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Manage your daily spending</p>
          </div>
        </div>
        
        <div className="flex bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-1 shadow-sm">
          {[7, 14, 30].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range as TimeRange)}
              className={cn(
                "px-4 py-1.5 text-xs font-semibold rounded-lg transition-all",
                timeRange === range 
                  ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20" 
                  : "text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
              )}
            >
              {range}D
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Chart Card */}
        <div className="md:col-span-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm overflow-hidden relative group">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Total Expense</p>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mt-1">
                {totalInPeriod.toFixed(0)} BDT
              </h3>
            </div>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
            </div>
          </div>

          <div className="relative h-[200px]">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
              {/* Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
                <line
                  key={i}
                  x1={padding}
                  y1={padding + chartHeight * p}
                  x2={width - padding}
                  y2={padding + chartHeight * p}
                  className="stroke-gray-100 dark:stroke-gray-800"
                  strokeWidth="1"
                />
              ))}
              
              {/* The Line */}
              <motion.polyline
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-emerald-500"
                points={points}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
              />
              
              {/* Area Gradient */}
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
              </linearGradient>
              <motion.path
                d={`M ${padding},${padding + chartHeight} ${points.split(' ').map((p, i) => i === 0 ? `L ${p}` : `L ${p}`).join(' ')} L ${width - padding},${padding + chartHeight} Z`}
                fill="url(#areaGradient)"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 1 }}
              />

              {/* Data Points & Labels */}
              {chartData.map((d, i) => {
                const x = padding + (i / Math.max(chartData.length - 1, 1)) * chartWidth;
                const y = padding + chartHeight - (d.value / maxVal) * chartHeight;
                return (
                  <g key={i}>
                    {d.value > 0 && (
                      <text
                        x={x}
                        y={y - 10}
                        textAnchor="middle"
                        className="text-[10px] font-bold fill-emerald-600 dark:fill-emerald-400"
                      >
                        {d.value.toFixed(0)}
                      </text>
                    )}
                    <circle
                      cx={x}
                      cy={y}
                      r="4"
                      className="fill-white dark:fill-gray-900 stroke-emerald-500"
                      strokeWidth="2"
                    />
                  </g>
                );
              })}
            </svg>
          </div>
          
          <div className="flex justify-between mt-4 px-1">
            {chartData.filter((_, i) => i % (timeRange === 30 ? 6 : timeRange === 14 ? 3 : 1) === 0).map((d, i) => (
              <span key={i} className="text-[10px] font-medium text-gray-400">{d.label}</span>
            ))}
          </div>
        </div>

        {/* Quick Add Card */}
        <div className="flex flex-col gap-4">
          <div className="bg-emerald-500 rounded-3xl p-6 text-white shadow-lg shadow-emerald-500/20 relative overflow-hidden">
            <Wallet className="w-12 h-12 absolute -right-4 -bottom-4 opacity-20 rotate-12" />
            <p className="text-emerald-100 text-sm font-medium">Quick Insight</p>
            <h4 className="text-lg font-bold mt-1">Average Daily</h4>
            <div className="flex items-baseline gap-1 mt-2">
              <span className="text-2xl font-bold">{(totalInPeriod / timeRange).toFixed(0)} BDT</span>
              <span className="text-emerald-100 text-xs">/ day</span>
            </div>
          </div>

          {!isAdding ? (
            <button 
              onClick={() => setIsAdding(true)}
              aria-label="Add new expense"
              className="flex-1 bg-white dark:bg-gray-900 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-3xl flex flex-col items-center justify-center gap-3 hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-emerald-50/30 dark:hover:bg-emerald-900/10 transition-all p-6 text-gray-400 hover:text-emerald-600 group"
            >
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl group-hover:bg-emerald-500 group-hover:text-white transition-all">
                <Plus className="w-6 h-6" />
              </div>
              <span className="font-semibold">Add Expense</span>
            </button>
          ) : (
            <motion.form 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              onSubmit={handleSubmit}
              className="flex-1 bg-white dark:bg-gray-900 border border-emerald-200 dark:border-emerald-800 rounded-3xl p-5 shadow-xl shadow-emerald-500/5 space-y-4"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">New Entry</span>
                <button type="button" onClick={() => setIsAdding(false)} aria-label="Cancel" className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
              </div>
              
              <div className="space-y-3">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">BDT</span>
                  <input 
                    autoFocus
                    type="number" 
                    step="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    title="Expense Amount"
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-lg font-bold outline-none focus:ring-2 focus:ring-emerald-500 transition-all dark:text-white"
                  />
                </div>
                <div className="relative">
                  <Tag className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="text" 
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="What for? (Optional)"
                    title="Expense Reason"
                    className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all dark:text-white"
                  />
                </div>
                <div className="relative">
                  <CalendarIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="date" 
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    title="Expense Date"
                    className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all dark:text-white"
                  />
                </div>
              </div>
              <button 
                type="submit"
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
              >
                Save Expense
              </button>
            </motion.form>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm">
        <h3 className="text-sm font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
          Latest Records
        </h3>
        <div className="space-y-2">
          {expenses.length === 0 ? (
            <div className="py-8 text-center text-gray-400 italic text-sm">No expenses recorded yet.</div>
          ) : (
            expenses
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .slice(0, 10)
              .map(exp => (
                <div key={exp.id} className="group flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-2xl transition-all border border-transparent hover:border-gray-100 dark:hover:border-gray-700">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/30 group-hover:text-emerald-500 transition-colors">
                      <Wallet className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 dark:text-gray-200">{exp.reason || 'Miscellaneous'}</p>
                      <p className="text-[10px] text-gray-400">{format(parseISO(exp.date), 'MMMM d, yyyy')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-gray-900 dark:text-white">{exp.amount.toFixed(0)} BDT</span>
                    <button 
                      onClick={() => onDeleteExpense(exp.id)}
                      aria-label="Delete expense"
                      className="p-2 opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 hover:text-red-500 rounded-lg transition-all"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
          )}
        </div>
      </div>
    </div>
  );
}
