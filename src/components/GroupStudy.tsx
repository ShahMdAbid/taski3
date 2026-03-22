import React, { useState, useEffect, useRef } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, parseISO } from 'date-fns';
import { 
  ChevronLeft, ChevronRight, Plus, Trash2, Clock, 
  CheckCircle2, Circle, MessageSquare, Users, 
  Copy, Check, ArrowLeft, LogOut
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';

interface GroupMember {
  id: string;
  name: string;
}

interface GroupTask {
  id: string;
  group_id: string;
  member_id: string;
  title: string;
  date: string;
  time?: string;
  completed: boolean;
  is_important: boolean;
  is_health: boolean;
  is_spiritual: boolean;
  comment?: string;
  created_at: string;
}

export default function GroupStudy() {
  const [group, setGroup] = useState<{ id: string; name: string; key: string } | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [myMemberId, setMyMemberId] = useState<string | null>(localStorage.getItem('study_member_id'));
  const [tasks, setTasks] = useState<GroupTask[]>([]);
  const [loading, setLoading] = useState(false);
  
  // UI State
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [joinKey, setJoinKey] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [copied, setCopied] = useState(false);

  // New Task Form State
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskTime, setNewTaskTime] = useState('');
  const [isImportant, setIsImportant] = useState(false);
  const [isHealth, setIsHealth] = useState(false);
  const [isSpiritual, setIsSpiritual] = useState(false);
  const timeInputRef = useRef<HTMLInputElement>(null);

  // Load existing session and verify it
  useEffect(() => {
    const checkGroup = async () => {
      const savedGroup = localStorage.getItem('study_group');
      if (savedGroup) {
        const parsed = JSON.parse(savedGroup);
        const { data, error } = await supabase.from('study_groups').select('id, name, key').eq('id', parsed.id).single();
        if (data) {
          setGroup(data);
          localStorage.setItem('study_group', JSON.stringify(data));
        } else {
          // Group was deleted or not found
          localStorage.removeItem('study_group');
          localStorage.removeItem('study_member_id');
          setGroup(null);
          setMyMemberId(null);
        }
      }
    };
    checkGroup();
  }, []);

  // Fetch data when group changes
  useEffect(() => {
    if (!group) return;

    // Fetch members
    const fetchMembers = async () => {
      const { data } = await supabase.from('group_members').select('*').eq('group_id', group.id);
      if (data) setMembers(data);
    };

    // Fetch tasks
    const fetchTasks = async () => {
      const { data } = await supabase.from('group_tasks').select('*').eq('group_id', group.id);
      if (data) setTasks(data);
    };

    fetchMembers();
    fetchTasks();

    // Subscribe to tasks
    const channel = supabase
      .channel(`group_tasks_${group.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'group_tasks', filter: `group_id=eq.${group.id}` }, 
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setTasks(prev => [...prev, payload.new as GroupTask]);
          } else if (payload.eventType === 'DELETE') {
            setTasks(prev => prev.filter(t => t.id !== payload.old.id));
          } else if (payload.eventType === 'UPDATE') {
            setTasks(prev => prev.map(t => t.id === payload.new.id ? payload.new as GroupTask : t));
          }
        }
      )
      .subscribe();

    return () => { channel.unsubscribe(); };
  }, [group]);

  const createGroup = async () => {
    if (!newGroupName.trim()) return;
    setLoading(true);
    const key = Math.random().toString(36).substring(2, 8).toUpperCase();
    const { data, error } = await supabase.from('study_groups').insert([{ name: newGroupName, key }]).select().single();
    if (data) {
      setGroup(data);
      localStorage.setItem('study_group', JSON.stringify(data));
    } else if (error) alert(error.message);
    setLoading(false);
  };

  const joinGroup = async () => {
    if (!joinKey.trim()) return;
    setLoading(true);
    const { data, error } = await supabase.from('study_groups').select('*').eq('key', joinKey.toUpperCase()).single();
    if (data) {
      setGroup(data);
      localStorage.setItem('study_group', JSON.stringify(data));
    } else alert(error?.message || "Group not found");
    setLoading(false);
  };

  const addMember = async (name: string) => {
    if (!name.trim() || !group) return;
    const { data, error } = await supabase.from('group_members').insert([{ group_id: group.id, name: name.trim() }]).select().single();
    if (data) {
      setMyMemberId(data.id);
      localStorage.setItem('study_member_id', data.id);
      // Refresh members list
      const { data: list } = await supabase.from('group_members').select('*').eq('group_id', group.id);
      if (list) setMembers(list);
    } else if (error) alert(error.message);
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !group || !myMemberId || !selectedDate) return;

    const newTask = {
      group_id: group.id,
      member_id: myMemberId,
      title: newTaskTitle.trim(),
      date: selectedDate,
      time: newTaskTime || null,
      completed: false,
      is_important: isImportant,
      is_health: isHealth,
      is_spiritual: isSpiritual
    };

    const { error } = await supabase.from('group_tasks').insert([newTask]);
    if (error) alert(error.message);
    else {
      setNewTaskTitle('');
      setNewTaskTime('');
      setIsImportant(false);
      setIsHealth(false);
      setIsSpiritual(false);
    }
  };

  const toggleTask = async (task: GroupTask) => {
    const { error } = await supabase.from('group_tasks').update({ completed: !task.completed }).eq('id', task.id);
    if (error) alert(error.message);
  };

  const deleteTask = async (taskId: string) => {
    const { error } = await supabase.from('group_tasks').delete().eq('id', taskId);
    if (error) alert(error.message);
  };

  const updateTaskComment = async (taskId: string, comment: string) => {
    await supabase.from('group_tasks').update({ comment }).eq('id', taskId);
  };

  const copyKey = () => {
    if (group) {
      navigator.clipboard.writeText(group.key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const leaveGroup = () => {
    localStorage.removeItem('study_group');
    localStorage.removeItem('study_member_id');
    setGroup(null);
    setMyMemberId(null);
    setTasks([]);
  };

  // Gateway Screens
  if (!group) {
    return (
      <div className="max-w-md mx-auto mt-20 p-8 glass-panel rounded-3xl text-center space-y-6">
        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/40 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        </div>
        <h2 className="text-2xl font-black dark:text-white">Group Study Calendar</h2>
        <p className="text-gray-500 dark:text-gray-400">Collaborate on study tasks with your friends in real-time.</p>
        
        {!showJoinForm ? (
          <div className="space-y-3">
            <button onClick={() => setShowJoinForm(true)} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20">Join Existing Group</button>
            <div className="relative py-4"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200 dark:border-gray-800"></div></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-white dark:bg-gray-900 px-2 text-gray-500">Or host a session</span></div></div>
            <input type="text" placeholder="New Group Name" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-transparent focus:border-blue-500 rounded-xl outline-none transition-all dark:text-white" />
            <button onClick={createGroup} disabled={loading || !newGroupName.trim()} className="w-full py-3 border-2 border-blue-600 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl font-bold transition-all disabled:opacity-50">Create New Group</button>
          </div>
        ) : (
          <div className="space-y-3">
            <input type="text" placeholder="Enter Invite Key" value={joinKey} onChange={e => setJoinKey(e.target.value.toUpperCase())} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-transparent focus:border-blue-500 rounded-xl outline-none transition-all dark:text-white text-center text-xl font-black tracking-widest uppercase" />
            <button onClick={joinGroup} disabled={loading || !joinKey} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all">Join Group</button>
            <button onClick={() => setShowJoinForm(false)} className="w-full py-2 text-gray-500 text-sm hover:underline">Go Back</button>
          </div>
        )}
      </div>
    );
  }

  if (!myMemberId) {
    return (
      <div className="max-w-md mx-auto mt-20 p-8 glass-panel rounded-3xl text-center space-y-6">
        <h2 className="text-xl font-black dark:text-white">Join As...</h2>
        <div className="grid gap-3 text-left">
          {members.map(m => (
            <button key={m.id} onClick={() => { setMyMemberId(m.id); localStorage.setItem('study_member_id', m.id); }} className="p-4 bg-gray-50 dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-transparent hover:border-blue-500 rounded-2xl transition-all group flex items-center justify-between">
              <span className="font-bold dark:text-white">{m.name}</span>
              <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500" />
            </button>
          ))}
          <div className="relative py-2"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200 dark:border-gray-800"></div></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-white dark:bg-gray-900 px-2 text-gray-500">Not listed?</span></div></div>
          <input type="text" placeholder="Guest Name" onKeyDown={(e) => { if (e.key === 'Enter') addMember(e.currentTarget.value); }} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:border-blue-500 dark:text-white" />
        </div>
        <button onClick={leaveGroup} className="flex items-center gap-2 text-red-500 text-sm mx-auto hover:underline mt-4"><LogOut className="w-4 h-4" /> Switch Group</button>
      </div>
    );
  }

  // Day View Logic
  if (selectedDate) {
    const dayTasks = tasks
      .filter(t => t.date === selectedDate)
      .sort((a, b) => (a.time || '24:00').localeCompare(b.time || '24:00'));
    
    const parsedDate = parseISO(selectedDate);

    return (
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col h-full transition-colors duration-200">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex items-center gap-4 sticky top-0 z-10 shrink-0 transition-colors duration-200">
          <button onClick={() => setSelectedDate(null)} aria-label="Go back" title="Back to Calendar" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-500">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-baseline gap-3">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white tracking-tight">{format(parsedDate, 'EEEE')}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{format(parsedDate, 'MMMM d, yyyy')}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50 dark:bg-gray-950/50">
          <div className="space-y-3">
            {dayTasks.length === 0 ? (
              <div className="text-center py-16 text-gray-400 dark:text-gray-500 bg-white dark:bg-gray-900 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                <p className="text-lg font-medium">No shared tasks for this day.</p>
                <p className="mt-2 text-sm text-gray-500">Everything added here will be synced with your group.</p>
              </div>
            ) : (
              dayTasks.map(task => (
                <div key={task.id} className={cn(
                  "group flex flex-col p-4 rounded-xl border transition-all duration-200",
                  task.completed 
                    ? "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-800 opacity-75" 
                    : task.is_important
                      ? "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900 shadow-sm"
                      : task.is_health
                        ? "bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-900 shadow-sm"
                        : task.is_spiritual
                          ? "bg-purple-50 dark:bg-purple-900/10 border-purple-200 dark:border-purple-900 shadow-sm"
                          : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 shadow-sm"
                )}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => toggleTask(task)}>
                      <button className={cn("transition-colors shrink-0", task.completed ? "text-gray-400" : "text-blue-600")}>
                        {task.completed ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                      </button>
                      <div className={cn("flex flex-col", task.completed && "line-through text-gray-500")}>
                        <span className="text-base font-medium dark:text-white">{task.title}</span>
                        <div className="flex items-center gap-3 mt-1">
                          {task.time && <span className="text-[10px] text-gray-500 flex items-center gap-1 font-bold"><Clock className="w-3 h-3" /> {task.time}</span>}
                          <span className="text-[10px] text-blue-500 font-black uppercase">BY {members.find(m => m.id === task.member_id)?.name || 'Member'}</span>
                        </div>
                      </div>
                    </div>
                    {task.member_id === myMemberId && (
                      <button onClick={() => deleteTask(task.id)} className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-600 transition-all ml-2" title="Delete task">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="mt-3 pl-9 pr-8">
                    <div className="flex items-start gap-2">
                      <MessageSquare className="w-4 h-4 text-gray-400 mt-2 shrink-0" />
                      <textarea
                        placeholder="Group insights..."
                        value={task.comment || ''}
                        onChange={(e) => updateTaskComment(task.id, e.target.value)}
                        rows={task.comment ? Math.max(2, task.comment.split('\n').length) : 1}
                        className="w-full text-sm bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 outline-none dark:text-gray-300 resize-none"
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shrink-0">
          <form onSubmit={handleAddTask} className="flex gap-3 items-center">
            <div className="flex-1 flex items-center gap-3 bg-gray-50 dark:bg-gray-800 px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 focus-within:border-blue-500 transition-all">
              <Plus className="w-5 h-5 text-gray-400" />
              <input type="text" placeholder="Add shared task..." value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} className="flex-1 bg-transparent outline-none text-gray-800 dark:text-white font-medium text-sm" />
            </div>
            <div onClick={() => timeInputRef.current?.showPicker()} className="relative w-32 flex items-center gap-2 bg-gray-50 dark:bg-gray-800 px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer group/time">
              <Clock className="w-4 h-4 text-gray-400 group-hover/time:text-blue-500 transition-colors" />
              <span className="text-gray-400 font-medium text-sm">{newTaskTime || 'Set time'}</span>
              <input ref={timeInputRef} type="time" value={newTaskTime} onChange={e => setNewTaskTime(e.target.value)} className="absolute inset-0 opacity-0 pointer-events-none" title="Set task time" placeholder="Set time" />
            </div>
            <div className="flex gap-1">
              {[['E', setIsImportant, isImportant], ['H', setIsHealth, isHealth], ['S', setIsSpiritual, isSpiritual]].map(([label, setter, val]: any) => (
                <button key={label} type="button" onClick={() => {
                  setIsImportant(false); setIsHealth(false); setIsSpiritual(false);
                  setter(!val);
                }} className={cn(
                  "w-10 h-10 rounded-lg border transition-all flex items-center justify-center text-sm font-semibold",
                  val ? "bg-blue-50 border-blue-200 text-blue-600 shadow-sm" : "bg-gray-50 border-gray-200 text-gray-400"
                )}>{label}</button>
              ))}
            </div>
            <button type="submit" disabled={!newTaskTitle.trim()} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg font-semibold transition-colors text-sm">Add</button>
          </form>
        </div>
      </div>
    );
  }

  // Month View Grid (matches Calendar.tsx)
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  
  const rows = [];
  let days = [];
  let day = startDate;

  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
      const cloneDay = day;
      const dateStr = format(cloneDay, 'yyyy-MM-dd');
      const dayTasks = tasks.filter(t => t.date === dateStr);
      
      days.push(
        <div key={day.toString()} onClick={() => setSelectedDate(dateStr)} className={cn(
          "min-h-[120px] p-2 border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors",
          !isSameMonth(day, monthStart) ? "opacity-30" : "text-gray-700 dark:text-gray-200",
          isSameDay(day, new Date()) && "bg-blue-50/30 dark:bg-blue-900/10"
        )}>
          <div className="flex justify-between items-start">
            <span className={cn(
              "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full",
              isSameDay(day, new Date()) ? "bg-blue-600 text-white" : ""
            )}>{format(day, 'd')}</span>
          </div>
          <div className="mt-2 flex-1 overflow-y-auto space-y-1 custom-scrollbar">
            {dayTasks.map(task => (
              <div key={task.id} className={cn(
                "text-[10px] p-1 rounded truncate flex items-center gap-1 transition-colors",
                task.completed 
                  ? "bg-gray-100 dark:bg-gray-800 text-gray-500 line-through" 
                  : task.is_important ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"
              )}>
                {task.completed ? <CheckCircle2 className="w-2 h-2" /> : <Circle className="w-2 h-2" />}
                <span>{task.title}</span>
              </div>
            ))}
          </div>
        </div>
      );
      day = addDays(day, 1);
    }
    rows.push(<div className="grid grid-cols-7" key={day.toString()}>{days}</div>);
    days = [];
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden transition-colors duration-200">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-xl font-bold dark:text-white uppercase tracking-tight">{group.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Invite Key:</span>
              <button onClick={copyKey} className="flex items-center gap-1.5 px-2 py-0.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-all group/key">
                <span className="text-[11px] font-black text-blue-600 dark:text-blue-400 font-mono tracking-widest">{group.key}</span>
                {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3 text-gray-400 group-hover/key:text-blue-500" />}
              </button>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors" title="Previous Month">
              <ChevronLeft className="w-5 h-5 dark:text-white" />
            </button>
            <h3 className="text-sm font-black dark:text-white min-w-[120px] text-center uppercase tracking-widest self-center">{format(currentMonth, 'MMMM yyyy')}</h3>
            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors" title="Next Month">
              <ChevronRight className="w-5 h-5 dark:text-white" />
            </button>
          </div>
          <button onClick={leaveGroup} className="p-2 text-gray-400 hover:text-red-500 transition-colors" title="Leave Group"><LogOut className="w-5 h-5" /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950/50">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="py-2 text-center text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{d}</div>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto">
        {rows}
      </div>
    </div>
  );
}
