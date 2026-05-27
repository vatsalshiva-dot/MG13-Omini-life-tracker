import React, { useState, useEffect } from 'react';
import { AppState, Reminder } from '../types';
import { todayStr, fmtShort } from '../utils/date';
import { Plus, Bell, AlertTriangle, Calendar, CheckCircle2, Clock, Trash2, Edit3, X, Link as LinkIcon, Shield } from 'lucide-react';
import { getFileHandle } from '../utils/ghost';

interface RemindersViewProps {
  state: AppState;
  onAddReminder: (rem: Omit<Reminder, 'id' | 'status'>) => void;
  onEditReminder: (id: string, updated: Partial<Reminder>) => void;
  onDeleteReminder: (id: string) => void;
  onToggleReminder: (id: string) => void;
  setView: (view: any) => void;
}

export const RemindersView: React.FC<RemindersViewProps> = ({
  state,
  onAddReminder,
  onEditReminder,
  onDeleteReminder,
  onToggleReminder,
  setView
}) => {
  const today = todayStr();
  const [filter, setFilter] = useState<'all' | 'overdue' | 'today' | 'upcoming' | 'done'>('all');

  const [ghostLinked, setGhostLinked] = useState(true); // default true so no flash
  useEffect(() => {
    getFileHandle().then(h => setGhostLinked(!!h)).catch(() => setGhostLinked(false));
  }, []);

  // Modal active states
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState(today);
  const [time, setTime] = useState('');
  const [type, setType] = useState('Personal');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [repeat, setRepeat] = useState<'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'>('none');
  const [notes, setNotes] = useState('');
  const [enableAlert, setEnableAlert] = useState<boolean>(true);
  const [alertOffset, setAlertOffset] = useState<number>(0);

  const openNewModal = () => {
    setEditId(null);
    setTitle('');
    setDueDate(today);
    setTime('');
    setType('Personal');
    setPriority('medium');
    setRepeat('none');
    setNotes('');
    setEnableAlert(true);
    setAlertOffset(0);
    setShowModal(true);
  };

  const openEditModal = (rem: Reminder) => {
    setEditId(rem.id);
    setTitle(rem.title);
    setDueDate(rem.dueDate);
    setTime(rem.time || '');
    setType(rem.type);
    setPriority(rem.priority);
    setRepeat(rem.repeat);
    setNotes(rem.notes || '');
    setEnableAlert(rem.enableAlert ?? true);
    setAlertOffset(rem.alertOffset ?? 0);
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const dataObj = {
      title: title.trim(),
      dueDate,
      time,
      type,
      priority,
      repeat,
      notes: notes.trim(),
      enableAlert,
      alertOffset
    };

    if (editId) {
      onEditReminder(editId, dataObj);
    } else {
      onAddReminder(dataObj);
    }
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this reminder?')) {
      onDeleteReminder(id);
      setShowModal(false);
    }
  };

  // List calculations
  const list = React.useMemo(() => {
    let base = [...state.reminders].sort((a, b) => (a.dueDate || "").localeCompare(b.dueDate || ""));

    if (filter === 'overdue') {
      return base.filter(r => r.dueDate < today && r.status !== 'done');
    }
    if (filter === 'today') {
      return base.filter(r => r.dueDate === today);
    }
    if (filter === 'upcoming') {
      return base.filter(r => r.dueDate > today && r.status !== 'done');
    }
    if (filter === 'done') {
      return base.filter(r => r.status === 'done');
    }
    return base;
  }, [state.reminders, filter, today]);

  const prioritySymbols = {
    high: '▲ HIGH',
    medium: '◈ MEDIUM',
    low: '▽ LOW'
  };

  const types = [
    'Assignment Due', 'Exam Prep', 'Meeting', 'Birthday', 
    'Bill Payment', 'Doctor Appt', 'Project Deadline', 'Personal', 'Finance', 'Trip Deadline', 'Other', 'finance', 'deadline'
  ];

  return (
    <div className="space-y-6">
      {/* Header control */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#1e1e38] pb-4">
        <div>
          <h2 className="text-xl font-extrabold tracking-wider text-[#ff6b1a]">
            PLANNER & <span className="text-slate-100 font-extrabold">EVENTS</span>
          </h2>
          <p className="text-xs uppercase tracking-widest text-slate-500 mt-1">
            SCHEDULE TASK MILESTONES · TRACK DEADLINES · REPEATING ACTIVITIES
          </p>
        </div>

        <button 
          onClick={openNewModal}
          className="flex items-center gap-1.5 px-4 py-1.5 bg-[#ff6b1a] text-black font-extrabold text-xs uppercase tracking-widest rounded-lg hover:bg-[#ff9040] transition"
        >
          <Plus size={14} className="stroke-[3px]" />
          NEW DEADLINE
        </button>
      </div>

      {/* Tabs list */}
      <div className="flex gap-1.5 bg-[#0d0d1a] p-1 border border-[#1e1e38] rounded-xl overflow-x-auto select-none">
        {(['all', 'overdue', 'today', 'upcoming', 'done'] as const).map((tab) => {
          const count = state.reminders.filter(r => {
            if (tab === 'all') return true;
            if (tab === 'overdue') return r.dueDate < today && r.status !== 'done';
            if (tab === 'today') return r.dueDate === today;
            if (tab === 'upcoming') return r.dueDate > today && r.status !== 'done';
            return r.status === 'done';
          }).length;

          return (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`flex-1 py-1.5 px-3 min-w-[70px] rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 border uppercase tracking-wider ${
                filter === tab 
                  ? 'bg-[#ff6b1a]/10 border-[#ff6b1a]/40 text-[#ff6b1a]' 
                  : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab === 'overdue' && '⚠ '}
              {tab}
              {count > 0 && (
                <span className="text-[9px] bg-slate-800/80 px-1.5 py-0.5 rounded ml-1 font-mono">{count}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Reminders List */}
      <div className="space-y-2">
        {list.length > 0 ? (
          list.map(rem => {
            const isOverdue = rem.dueDate < today && rem.status !== 'done';
            const isToday = rem.dueDate === today;
            const isDone = rem.status === 'done';

            return (
              <div 
                key={rem.id}
                className={`flex items-center gap-3.5 p-3.5 bg-[#0d0d1a] border rounded-xl hover:border-slate-700 transition-all ${
                  isOverdue ? 'border-rose-500/20 bg-rose-500/5' : 'border-[#1e1e38]'
                }`}
              >
                {/* Checkbox trigger toggler */}
                <button
                  onClick={() => onToggleReminder(rem.id)}
                  className={`w-5 h-5 flex items-center justify-center border rounded transition text-black shrink-0 ${
                    isDone 
                      ? 'bg-emerald-400 border-emerald-400' 
                      : 'border-[#2a2a50] bg-transparent hover:border-[#0d0d1a]/50'
                  }`}
                >
                  {isDone && <CheckCircle2 size={13} className="stroke-[3px] text-black fill-emerald-400" />}
                </button>

                {/* Body metadata info */}
                <div className="flex-1 min-w-0" onClick={() => openEditModal(rem)}>
                  <h4 className={`text-sm font-extrabold tracking-wide truncate cursor-pointer hover:underline ${
                    isDone ? 'line-through text-slate-600' : 'text-slate-100'
                  }`}>
                    {rem.title}
                  </h4>
                  <p className="text-[10px] text-slate-500 font-medium uppercase mt-0.5 tracking-wider">
                    {rem.type} {rem.time && `· ⏱ ${rem.time}`} {rem.notes && `· index: ${rem.notes.slice(0, 45)}`}
                    {rem.repeat !== 'none' && ` (↻ Repeats ${rem.repeat})`}
                  </p>
                </div>

                {/* Right Badge overlays */}
                <span 
                  className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase tracking-widest shrink-0 ${
                    isOverdue 
                      ? 'bg-rose-500/10 text-rose-500 border-rose-500/20 animate-pulse' 
                      : isToday 
                      ? 'bg-amber-500/10 text-amber-500 border-amber-500/25' 
                      : 'bg-[#111120] text-slate-500 border-[#1e1e38]'
                  }`}
                >
                  {isOverdue ? 'OVERDUE' : isToday ? 'TODAY' : fmtShort(rem.dueDate)}
                </span>

                <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded tracking-widest shrink-0 uppercase border ${
                  rem.priority === 'high' 
                    ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' 
                    : rem.priority === 'medium' 
                    ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' 
                    : 'bg-[#111120] text-slate-500 border-transparent'
                }`}>
                  {rem.priority}
                </span>

                <button 
                  onClick={() => openEditModal(rem)}
                  className="px-2 py-1 bg-[#1c1c35] border border-[#2a2a50] text-[#00d4ff] hover:border-[#00d4ff] hover:bg-[#00d4ff]/15 text-[10px] uppercase font-bold rounded-lg transition"
                >
                  ✏ EDIT
                </button>
              </div>
            );
          })
        ) : (
          <div className="h-48 flex flex-col items-center justify-center border border-dashed border-[#1e1e38] rounded-xl bg-[#0d0d1a]/50">
            <Bell size={32} className="text-slate-800" />
            <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest mt-2">// Cognitive load cleared. System ready.</p>
          </div>
        )}
      </div>

      {/* Editor Modal Popup */}
      {showModal && (
        <div className="fixed inset-0 bg-black/75 z-[300] flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-[#0d0d1a] border border-[#2a2a50] rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-200 transition focus:outline-none"
            >
              <X size={18} />
            </button>

            <h3 className="text-sm font-extrabold tracking-widest text-[#ff6b1a] uppercase">
              {editId ? '✏ EDIT SCHEDULED EVENT' : '◈ CREATE NEW SCHEDULED EVENT'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Title */}
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Event Title</label>
                <input 
                  type="text"
                  required
                  className="w-full bg-[#111120] border border-[#2a2a50] rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-700 focus:outline-none focus:border-[#00ff88]"
                  placeholder="e.g. Science projects review"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              {/* Date & Time grids */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Due Date</label>
                  <input 
                    type="date"
                    required
                    className="w-full bg-[#111120] border border-[#2a2a50] rounded-lg px-3 py-1 text-xs text-slate-200 focus:outline-none"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Due Time (optional)</label>
                  <input 
                    type="time"
                    className="w-full bg-[#111120] border border-[#2a2a50] rounded-lg px-3 py-1 text-xs text-slate-200 focus:outline-none font-mono"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                  />
                </div>
              </div>

              {/* Type selector */}
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Deadline Type</label>
                <select 
                  className="w-full bg-[#111120] border border-[#2a2a50] rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                >
                  {types.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              {/* Priority & Repeat */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Priority Class</label>
                  <select 
                    className="w-full bg-[#111120] border border-[#2a2a50] rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                  >
                    <option value="low">▽ LOW</option>
                    <option value="medium">◈ MEDIUM</option>
                    <option value="high">▲ HIGH</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Recurrence interval</label>
                  <select 
                    className="w-full bg-[#111120] border border-[#2a2a50] rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none"
                    value={repeat}
                    onChange={(e) => setRepeat(e.target.value as any)}
                  >
                    <option value="none">One-Time</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Specific Notes</label>
                <textarea 
                  className="w-full min-h-[50px] bg-[#111120] border border-[#2a2a50] rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-750 focus:outline-none"
                  placeholder="Optional context or description details..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              {/* Alert Configure */}
              <div className="bg-[#111120] border border-[#2a2a50] p-3 rounded-lg space-y-3">
                 <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="accent-[#00d4ff] cursor-pointer"
                      checked={enableAlert}
                      onChange={(e) => setEnableAlert(e.target.checked)}
                    />
                    <span className="text-[10px] font-black uppercase text-slate-300 tracking-wider">Enable System Popup Alert</span>
                 </label>
                 {enableAlert && (
                   <div className="pl-5 space-y-1">
                     <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                       Alert offset <span className="normal-case tracking-normal">(minutes before due time)</span>
                     </label>
                     <input 
                        type="number"
                        min="0"
                        className="w-full bg-[#0d0d1a] border border-[#2a2a50] rounded px-2 py-1 text-xs text-slate-200 focus:outline-none"
                        value={alertOffset}
                        onChange={(e) => setAlertOffset(parseInt(e.target.value) || 0)}
                     />
                     <p className="text-[8px] text-slate-500 italic mt-1 pb-1">Set to 0 to alert exactly at the designated time.</p>
                   </div>
                 )}
              </div>

              {/* Actions */}
              <div className="flex justify-between items-center pt-3 border-t border-[#111120]">
                {editId ? (
                  <button
                    type="button"
                    onClick={() => handleDelete(editId)}
                    className="flex items-center gap-1 px-3 py-1.5 border border-rose-600/40 text-rose-500 bg-rose-500/5 hover:bg-rose-500/10 rounded-lg text-xs uppercase font-bold transition"
                  >
                    <Trash2 size={12} />
                    Delete
                  </button>
                ) : <div />}

                <div className="flex gap-2 font-black uppercase">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-1.5 bg-[#1c1c35] text-slate-400 text-xs rounded-lg border border-[#2a2a50] hover:text-slate-200"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-1.5 bg-[#ff6b1a] text-black font-extrabold text-xs rounded-lg hover:bg-[#ff9040]"
                  >
                    SAVE EVENT
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
