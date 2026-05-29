import React, { useState, useRef, useEffect } from 'react';
import { AppState, TrackerCategory, DayEntry, TrackerStatus } from '../types';
import { fmtDate, getWeek, todayStr } from '../utils/date';
import {  CATS, getAllCats , getCatLabel } from '../utils/storage';
import { Play, Square, Plus, Sparkles, Flame, Check, X, HelpCircle, CornerDownRight, Edit2, Mic, MicOff, Loader } from 'lucide-react';

interface DailyTrackerViewProps {
  state: AppState;
  date: string;
  onSetDate: (date: string) => void;
  onChangeDate: (offset: number) => void;
  onGoToday: () => void;
  getDayD: (ds: string, cat: TrackerCategory, item: string) => DayEntry;
  onUpdateDayField: (ds: string, cat: TrackerCategory, item: string, field: keyof DayEntry, val: any) => void;
  onCycleStatus: (ds: string, cat: TrackerCategory, item: string) => void;
  onQuickAdd: (cat: TrackerCategory, item: string) => void;
  onRenameItem?: (cat: TrackerCategory, oldItem: string, newItem: string) => void;
  onUpdateCategoryLabel?: (cat: TrackerCategory, label: string) => void;
  onUpdateTargetFields?: (cat: TrackerCategory, item: string, field: "reps" | "hours", val: number) => void;
  onMigrateYesterday?: () => void;
  onOpenAIAnalyst?: () => void;
  dayStats: (ds: string) => {
    done: number;
    missed: number;
    pending: number;
    skipped: number;
    total: number;
    hrs: number;
    reps: number;
    sat: number;
    pct: number;
  };
  getRepsT: (cat: TrackerCategory, item: string) => number;
  streak: (cat: TrackerCategory, item: string) => number;
  isScheduledToday: (cat: TrackerCategory, item: string, ds: string) => boolean;
  getRecurring: (cat: TrackerCategory, item: string) => any;
  
  // Pomodoro shared states
  pomoState: 'idle' | 'work' | 'break';
  pomoTimeLeft: string;
  pomoTaskName: string | null;
  pomoTaskCat: TrackerCategory | null;
  onStartPomo: () => void;
  onStopPomo: () => void;
  onSetPomoTask: (cat: TrackerCategory, item: string) => void;
  onSetPomoPreset: (preset: string) => void;
  onOmniCommand?: (data: any) => void;
  onSaveJournal?: (date: string, entry: any) => void;
  onUpdateJournalPrompts?: (prompts: any[]) => void;
}

export const DailyTrackerView: React.FC<DailyTrackerViewProps> = ({
  state,
  date,
  onSetDate,
  onChangeDate,
  onGoToday,
  getDayD,
  onUpdateDayField,
  onCycleStatus,
  onQuickAdd,
  onRenameItem,
  onUpdateCategoryLabel,
  onUpdateTargetFields,
  onMigrateYesterday,
  onOpenAIAnalyst,
  dayStats,
  getRepsT,
  streak,
  isScheduledToday,
  getRecurring,
  pomoState,
  pomoTimeLeft,
  pomoTaskName,
  pomoTaskCat,
  onStartPomo,
  onStopPomo,
  onSetPomoTask,
  onSetPomoPreset,
  onOmniCommand,
  onSaveJournal,
  onUpdateJournalPrompts
}) => {
  const [activeTab, setActiveTab] = useState<TrackerCategory>('studies');
  const [quickAddVal, setQuickAddVal] = useState('');
  const [trackerMode, setTrackerMode] = useState<'track' | 'goal'>('track');

  const stats = dayStats(date);
  const allCats = getAllCats(state);
  const currentCategory = allCats.find(c => c.id === activeTab) || allCats[0];
  const items = state.items[activeTab] || [];
  const weekDays = getWeek(date);

  const handleQuickAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = quickAddVal.trim();
    if (!val) return;
    onQuickAdd(activeTab, val);
    setQuickAddVal('');
  };

  const statusMap = {
    pending: { label: '◷ PEND', style: 'border-[#1e1e38] text-slate-500 bg-[#0d0d1a]/30' },
    done: { label: '✓ DONE', style: 'border-emerald-500/25 text-emerald-400 bg-emerald-950/10' },
    missed: { label: '✗ MISS', style: 'border-rose-500/25 text-rose-400 bg-rose-950/10' },
    skipped: { label: '↷ SKIP', style: 'border-[#1e1e38] text-slate-600 bg-[#1e1e38]/10' }
  };

  const satLevels = ['', '😞 Dread', '😕 Tired', '😐 Fine', '😊 Good', '🌟 Peak'];

  return (
    <div className="space-y-5">
      {/* Date Navigator Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#111120] pb-5">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white font-display">
            Activity & Routines
          </h2>
          <p className="text-xs uppercase tracking-widest text-slate-500 mt-1 font-mono">
            // STATUS · REPS · HOURS · SATISFACTION
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row flex-wrap items-center gap-3">
          {/* Date navigators */}
          <div className="flex items-center gap-2 bg-[#111120] border border-[#2a2a50] p-1.5 rounded-xl font-mono">
            <button 
              onClick={() => onChangeDate(-1)}
            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:bg-[#111120] hover:text-[#ff6b1a] rounded-lg transition-all duration-150 font-bold cursor-pointer"
          >
            ◀
          </button>
          <div className="px-3 py-1 text-xs font-black text-[#ff6b1a] tracking-wider">
            {fmtDate(date).split(',', 1)[0]}
          </div>
          <button 
            onClick={() => onChangeDate(1)}
            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:bg-[#111120] hover:text-[#ff6b1a] rounded-lg transition-all duration-150 font-bold cursor-pointer"
          >
            ▶
          </button>
          <button 
            onClick={onGoToday}
            className="px-3 py-1.5 text-[10px] font-bold text-white bg-[#ff6b1a] rounded-lg hover:bg-[#ff9040] transition-all duration-150 tracking-wider uppercase cursor-pointer"
          >
            NOW
          </button>
        </div>
      </div>
    </div>

      {/* Week Day Strip (Interactive) */}
      <div className="grid grid-cols-7 gap-2 shrink-0 font-sans">
        {weekDays.map((d, i) => {
          const isSelected = d === date;
          const ds = dayStats(d);
          const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
          const dateObj = new Date(d + 'T00:00:00');
          const dayNum = dateObj.getDate();

          let dotColor = 'bg-[#111120]';
          if (ds.done > 0) dotColor = 'bg-emerald-400';
          else if (ds.missed > 0) dotColor = 'bg-rose-500';

          return (
            <div
              key={d}
              onClick={() => onSetDate(d)}
              className={`flex flex-col items-center p-3 rounded-xl border text-center transition-all duration-200 cursor-pointer select-none ${
                isSelected 
                  ? 'bg-[#ff6b1a]/10 border-[#ff6b1a] text-[#ff6b1a]' 
                  : 'bg-[#111120] border-[#1e1e38] text-slate-400 hover:border-slate-700'
              }`}
            >
              <span className={`text-[8.5px] uppercase tracking-wider font-extrabold ${isSelected ? 'text-[#ff6b1a]' : 'text-slate-500'} font-mono`}>{labels[i]}</span>
              <span className={`text-base font-black mt-1 ${isSelected ? 'text-[#00d4ff]' : 'text-slate-200'} font-display`}>
                {dayNum}
              </span>
              <span className={`w-1.5 h-1.5 rounded-full mt-2 ${dotColor} transition-colors`} />
            </div>
          );
        })}
      </div>


      {/* 🎯 GOAL-SETTING vs PERFORMANCE TRACKING SYSTEMIC MODE SELECTOR */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-[#111120] border border-[#2a2a50] rounded-2xl shadow-lg relative overflow-hidden">
        {/* Subtle decorative background gradient */}
        <div className={`absolute inset-0 bg-gradient-to-r opacity-5 pointer-events-none transition-all duration-300 ${trackerMode === 'goal' ? 'from-amber-500/20 to-purple-500/20' : 'from-[#00d4ff]/20 to-indigo-500/20'}`} />
        <div className="flex items-center gap-3 relative z-10">
          <span className={`w-3.5 h-3.5 rounded-full ${trackerMode === 'goal' ? 'bg-amber-500 shadow-[0_0_12px_#f59e0b]' : 'bg-[#00d4ff] shadow-[0_0_12px_#00d4ff]'}`} />
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-white font-mono flex items-center gap-2">
              {trackerMode === 'goal' ? '🎯 GOAL SETTING MODE (Plan Routines)' : '⚡ PERFORMANCE TRACKING MODE (Log Achievements)'}
              <span className={`text-[8.5px] px-1.5 py-0.5 rounded-md text-black font-extrabold font-mono uppercase ${trackerMode === 'goal' ? 'bg-amber-400' : 'bg-[#00d4ff]'}`}>
                {trackerMode.toUpperCase()} ACTIVE
              </span>
            </h4>
            <p className="text-[10px] text-slate-500 font-mono mt-1 leading-relaxed">
              {trackerMode === 'goal' 
                ? '// You are currently drafting daily baseline targets, focus hour budgets, and reps limits. Completion records are locked.' 
                : '// You are logging actual checklists, cycles logged, real focused hours, emotional ratings, and journaling reflection.'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 bg-[#0d0d1a] p-1 border border-[#1e1e38] rounded-xl font-mono relative z-10 shrink-0">
          <button
            onClick={() => setTrackerMode('goal')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-150 cursor-pointer ${trackerMode === 'goal' ? 'bg-amber-500 text-[#0d0d1a] font-extrabold shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
          >
            🎯 Goal Planning
          </button>
          <button
            onClick={() => setTrackerMode('track')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-150 cursor-pointer ${trackerMode === 'track' ? 'bg-[#00d4ff] text-[#0d0d1a] font-extrabold shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
          >
            ⚡ Performance Log
          </button>
        </div>
      </div>

      {/* Daily Snapshot Status Board */}
      <div className="bg-[#111120] border border-[#2a2a50] rounded-2xl p-4 shadow-sm">
        <div className="flex flex-wrap gap-4 items-center justify-between text-xs font-semibold text-slate-400">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-1.5 bg-[#0d0d1a]/60 border border-[#1e1e38] px-3 py-1.5 rounded-xl font-mono text-[9px]">
              <span className="text-slate-500">✓ DONE</span>
              <strong className="text-emerald-400 font-extrabold text-xs">{stats.done}</strong>
            </div>
            <div className="flex items-center gap-1.5 bg-[#0d0d1a]/60 border border-[#1e1e38] px-3 py-1.5 rounded-xl font-mono text-[9px]">
              <span className="text-slate-500">✗ MISS</span>
              <strong className="text-rose-400 font-extrabold text-xs">{stats.missed}</strong>
            </div>
            <div className="flex items-center gap-1.5 bg-[#0d0d1a]/60 border border-[#1e1e38] px-3 py-1.5 rounded-xl font-mono text-[9px]">
              <span className="text-slate-500">◷ PEND</span>
              <strong className="text-[#ff6b1a] font-extrabold text-xs">{stats.pending}</strong>
            </div>
            <div className="flex items-center gap-1.5 bg-[#0d0d1a]/60 border border-[#1e1e38] px-3 py-1.5 rounded-xl font-mono text-[9px]">
              <span className="text-slate-500">↷ SKIP</span>
              <strong className="text-slate-400 font-extrabold text-xs">{stats.skipped}</strong>
            </div>
            <div className="flex items-center gap-1.5 border-l border-[#1e1e38] pl-4 font-mono text-[9px] h-6">
              <span className="text-slate-400">⏱ TIME</span>
              <strong className="text-[#ff6b1a] font-extrabold text-xs">{stats.hrs.toFixed(1)}h</strong>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500 uppercase font-mono tracking-wider font-extrabold">// HOURLY SCORE</span>
            <strong className="text-xl font-black text-[#ff6b1a] font-display">{stats.pct}%</strong>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-[#0d0d1a] h-2 rounded-full mt-4 overflow-hidden border border-zinc-855">
          <div 
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-indigo-450" 
            style={{ width: `${stats.pct}%` }}
          />
        </div>
      </div>

      {/* Daily Finance Snapshot */}
      {(() => {
        const todayExp = (state.finances || []).filter(e => e.date === date && (!e.type || e.type === 'expense' || e.type === 'debit')).reduce((acc, curr) => acc + curr.amount, 0);
        const bgtD = state.financeBudgets?.d || 0;
        const isOver = bgtD > 0 && todayExp > bgtD;
        const pct = bgtD > 0 ? Math.min(100, Math.round((todayExp / bgtD) * 100)) : 0;
        
        return (
          <div className="bg-[#111120] border border-[#2a2a50] rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-[#00d4ff]/10 text-[#00d4ff] flex items-center justify-center font-bold font-mono">$</span>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest font-mono">FINANCE: TODAY</p>
                <div className="flex items-end gap-2 mt-0.5">
                  <p className={`text-xl font-black font-display ${isOver ? 'text-rose-500 animate-pulse' : 'text-[#00d4ff]'}`}>
                    ${todayExp.toFixed(2)}
                  </p>
                  {bgtD > 0 && <span className="text-[10px] text-slate-500 font-mono mb-1">/ ${bgtD.toFixed(2)} limit</span>}
                </div>
              </div>
            </div>
            
            {bgtD > 0 && (
              <div className="flex-1 max-w-xs w-full">
                <div className="flex items-center justify-between text-[9px] font-mono text-slate-500 mb-1.5 uppercase font-bold tracking-widest">
                  <span>Capacity</span>
                  <span className={isOver ? 'text-rose-500' : 'text-slate-400'}>{pct}%</span>
                </div>
                <div className="w-full bg-[#0d0d1a] h-1.5 rounded-full overflow-hidden border border-[#1e1e38]">
                  <div className={`h-full rounded-full ${isOver ? 'bg-rose-500' : 'bg-[#00d4ff]'}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* Tabs */}
      <div className="flex gap-2 bg-[#111120] p-2 border border-[#2a2a50] rounded-2xl overflow-x-auto scrollbar-none shadow-sm">
        {allCats.map((cat) => {
          const catItems = state.items[cat.id] || [];
          const countDone = catItems.filter(it => getDayD(date, cat.id, it).status === 'done').length;

          return (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.id)}
              className={`flex-1 py-1.5 px-3.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 border uppercase tracking-wider cursor-pointer ${
                activeTab === cat.id 
                  ? 'bg-[#ff6b1a] border-[#ff6b1a] text-white font-extrabold shadow-md shadow-indigo-650/10' 
                  : 'bg-[#0d0d1a]/60 border-zinc-855 text-slate-400 hover:bg-[#111120] hover:text-slate-100'
              }`}
            >
              <span>{cat.icon}</span>
              <input 
                type="text"
                className="bg-transparent border-none focus:outline-none min-w-[3rem] max-w-[5rem] truncate text-center cursor-text placeholder-slate-500 font-bold"
                value={state.categoryLabels?.[cat.id] !== undefined ? state.categoryLabels[cat.id] : getCatLabel(state, cat.id)}
                onChange={(e) => onUpdateCategoryLabel && onUpdateCategoryLabel(cat.id, e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
              <span className={`text-[10px] ${activeTab === cat.id ? 'bg-[#ff6b1a]/30 text-white' : 'bg-[#111120] text-slate-500'} px-2 py-0.5 rounded-lg ml-1 font-mono font-bold`}>
                {countDone}/{catItems.length}
              </span>
            </button>
          );
        })}
      </div>

      {/* Pomodoro Focus Mini Bar */}
      <div className="bg-[#111120] border border-[#2a2a50] border-l-4 border-l-[#ff6b1a] rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 font-semibold text-xs relative overflow-hidden shadow-sm">
        
        <div className="flex flex-col md:flex-row md:items-center gap-3.5 pl-1.5 flex-1 select-none min-w-0">
          {/* Status Badge */}
          <span className={`px-2.5 py-1 rounded-lg text-[9px] font-extrabold uppercase tracking-widest font-mono ${
            pomoState === 'work' 
              ? 'bg-[#ff6b1a]/10 text-[#ff6b1a] border border-[#ff6b1a]/30 animate-pulse' 
              : pomoState === 'break' 
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
              : 'bg-[#0d0d1a] border border-zinc-855 text-slate-500'
          }`}>
            {pomoState === 'work' ? '⚡ FOCUS ACTIVE' : pomoState === 'break' ? '☕ TAKING BREAK' : '○ POMO SYSTEM'}
          </span>

          <div className="text-xl font-black text-[#ff6b1a] min-w-[50px] tracking-tight font-mono">
            {pomoTimeLeft}
          </div>

          <div className="text-slate-400 text-xs truncate font-sans">
            {pomoTaskName ? (
              <span>Target: <strong className="text-slate-100 font-extrabold">{pomoTaskName}</strong></span>
            ) : (
              <span className="text-slate-500 font-mono text-[11px] font-medium">// Select task: click ⏱ POMO on any row</span>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 pl-1.5 md:pl-0 shrink-0">
          <select 
            onChange={(e) => onSetPomoPreset(e.target.value)}
            className="bg-[#0d0d1a] border border-[#2a2a50] text-slate-300 rounded-xl px-2.5 py-1.5 text-[10px] font-bold focus:outline-none focus:border-[#ff6b1a] cursor-pointer"
            defaultValue="classic"
          >
            <option value="classic">Classic 25/5</option>
            <option value="deep">Deep focus 50/10</option>
            <option value="ultra">Ultradian 90/20</option>
            <option value="custom">Custom...</option>
          </select>

          {pomoState === 'idle' ? (
            <button 
              onClick={onStartPomo}
              disabled={!pomoTaskName}
              className="px-3.5 py-1.5 font-bold bg-[#ff6b1a] bg-[#ff6b1a] text-white text-[10px] uppercase tracking-wider rounded-xl hover:bg-[#ff6b1a] disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
            >
              ▶ START POMO
            </button>
          ) : (
            <button 
              onClick={onStopPomo}
              className="px-3.5 py-1.5 font-bold bg-transparent border border-rose-500/40 text-rose-400 text-[10px] uppercase tracking-wider rounded-xl hover:bg-rose-500/10 transition cursor-pointer"
            >
              ⏹ STOP
            </button>
          )}
        </div>
      </div>

      {/* Tracker Items List */}
      <div className="bg-[#111120] border border-[#1e1e38] rounded-2xl p-5 space-y-4 shadow-sm font-sans">
        <div className="flex items-center justify-between text-slate-300 pb-3 border-b border-[#1e1e38]">
          <span className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 font-mono text-slate-400">
            {currentCategory.icon} {currentCategory.label} Content
          </span>
          <span className="text-[10px] text-slate-600 uppercase font-mono">// Click Status to cycle logs</span>
        </div>

        <div className="space-y-3">
          {items.length > 0 ? (
            items.map((item) => {
              const entry = getDayD(date, activeTab, item);
              const status: TrackerStatus = entry.status || 'pending';
              const sMeta = statusMap[status] || statusMap['pending'];
              const streakVal = streak(activeTab, item);
              const recT = getRecurring(activeTab, item);
              const isScheduled = isScheduledToday(activeTab, item, date);

              const isActivePomo = pomoTaskCat === activeTab && pomoTaskName === item;

              return (
                <div 
                  key={item}
                  className={`flex flex-col gap-3.5 p-4 bg-[#0d0d1a]/65 border rounded-2xl transition-all duration-200 border-[#1e1e38]/70 ${
                    !isScheduled ? 'opacity-30' : 'hover:border-[#2a2a50] hover:bg-[#0d0d1a]/95 shadow-sm'
                  }`}
                >
                  {/* Row content */}
                  <div className="flex flex-wrap items-center justify-between gap-3 font-sans">
                    {/* Status check / Goal Badge */}
                    {trackerMode === 'goal' ? (
                      <div className="px-3 py-1.5 text-[10px] font-black border rounded-xl border-amber-500/30 text-amber-500 bg-amber-950/10 font-mono tracking-wider select-none">
                        🎯 GOAL MODE
                      </div>
                    ) : (
                      <select
                        value={status}
                        onChange={(e) => onUpdateDayField(date, activeTab, item, 'status', e.target.value)}
                        disabled={!isScheduled}
                        className={`px-3 py-1.5 text-[10px] font-black border rounded-xl cursor-pointer transition-all duration-155 select-none tracking-wider font-mono ${sMeta.style} ${!isScheduled && 'opacity-40 cursor-not-allowed'}`}
                      >
                        <option value="pending">◷ PEND</option>
                        <option value="done">✓ DONE</option>
                        <option value="missed">✗ MISS</option>
                        <option value="skipped">↷ SKIP</option>
                      </select>
                    )}

                    {/* Tracker Name */}
                    <div className="flex-1 min-w-[130px] flex items-center pr-2">
                      <input 
                        type="text"
                        defaultValue={item}
                        className="bg-transparent border-none focus:outline-none focus:border-b border-[#2a2a50] text-sm font-bold text-slate-200 truncate flex-1 min-w-0"
                        onBlur={(e) => {
                            if (onRenameItem && e.target.value.trim() && e.target.value.trim() !== item) {
                                onRenameItem(activeTab, item, e.target.value.trim());
                            } else {
                                e.target.value = item;
                            }
                        }}
                        onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                        disabled={!isScheduled}
                      />
                      {isScheduled && (
                        <button 
                          type="button"
                          onClick={(e) => {
                            const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                            if (input) {
                              input.focus();
                              input.select();
                            }
                          }}
                          title="Edit Task Title"
                          className="p-1 text-slate-500 hover:text-[#00d4ff] hover:bg-[#111120] rounded transition cursor-pointer flex items-center justify-center shrink-0"
                        >
                          <Edit2 size={11} />
                        </button>
                      )}
                      {recT && (
                        <span className="ml-1.5 px-1.5 py-0.5 bg-[#ff6b1a]/10 border border-[#ff6b1a]/25 text-[#ff6b1a] text-[8px] font-black rounded-lg tracking-widest uppercase font-mono" title={`Recurring: ${recT.freq}`}>
                          ↻
                        </span>
                      )}
                      {!isScheduled && (
                        <span className="ml-1.5 text-[8px] text-slate-600 tracking-wider font-mono">// AUTOSKIP TODAY</span>
                      )}
                    </div>

                    {/* Streak Badge (Performance logs only) */}
                    {trackerMode !== 'goal' && status === 'done' && streakVal > 0 && (
                      <span className="flex items-center gap-0.5 text-[10px] font-bold text-amber-500 bg-amber-500/5 px-2 py-0.5 border border-amber-500/20 rounded-lg font-mono">
                        <Flame size={10} className="fill-amber-500 animate-pulse" />
                        {streakVal}D Streak
                      </span>
                    )}

                    {/* Pomo selector row (Performance logs only) */}
                    {trackerMode !== 'goal' && (
                      <button
                        onClick={() => isScheduled && onSetPomoTask(activeTab, item)}
                        disabled={!isScheduled}
                        className={`px-2.5 py-1 rounded-xl text-[9px] font-bold tracking-wider border transition-all duration-155 cursor-pointer ${
                          isActivePomo 
                            ? 'bg-[#ff6b1a] border-[#ff6b1a] text-white font-extrabold' 
                            : 'bg-[#111120] hover:bg-[#111120] border-[#2a2a50] text-slate-400'
                        } ${!isScheduled && 'opacity-30 cursor-not-allowed'}`}
                      >
                        ⏱ POMO
                      </button>
                    )}

                    {/* Tracker Value Widgets (Reps & Hours) */}
                    <div className="flex items-center gap-3">
                      {trackerMode === 'goal' ? (
                        <>
                          <div className="flex flex-col items-center">
                            <span className="text-[8px] text-amber-400 uppercase tracking-widest font-mono font-bold">Target Reps</span>
                            <input 
                              type="number"
                              className="w-14 bg-[#111120] border border-amber-500/40 rounded-lg py-1 text-center font-bold text-amber-300 text-xs focus:outline-none mt-1 font-mono focus:border-amber-400"
                              value={state.repsTarget?.[activeTab]?.[item] !== undefined ? state.repsTarget[activeTab]![item] : (getRepsT(activeTab, item) || 0)}
                              min={0}
                              placeholder="0"
                              disabled={!isScheduled}
                              onChange={(e) => onUpdateTargetFields && onUpdateTargetFields(activeTab, item, 'reps', +e.target.value)}
                            />
                          </div>

                          <div className="flex flex-col items-center">
                            <span className="text-[8px] text-amber-400 uppercase tracking-widest font-mono font-bold">Target Hours</span>
                            <input 
                              type="number"
                              className="w-14 bg-[#111120] border border-amber-500/40 rounded-lg py-1 text-center font-bold text-amber-300 text-xs focus:outline-none mt-1 font-mono focus:border-amber-400"
                              value={state.hoursTarget?.[activeTab]?.[item] !== undefined ? state.hoursTarget[activeTab]![item] : 1}
                              min={0}
                              max={24}
                              step={0.25}
                              placeholder="1"
                              disabled={!isScheduled}
                              onChange={(e) => onUpdateTargetFields && onUpdateTargetFields(activeTab, item, 'hours', +e.target.value)}
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex flex-col items-center">
                            <span className="text-[8.5px] text-slate-500 uppercase tracking-widest font-mono font-bold">Reps×{getRepsT(activeTab, item)}</span>
                            <input 
                              type="number"
                              className="w-12 bg-[#111120] border border-[#2a2a50] rounded-lg py-1 text-center font-bold text-[#ff6b1a] text-xs focus:outline-none mt-1 font-mono"
                              value={entry.reps || ''}
                              min={0}
                              placeholder={String(getRepsT(activeTab, item))}
                              disabled={!isScheduled}
                              onChange={(e) => onUpdateDayField(date, activeTab, item, 'reps', +e.target.value)}
                            />
                          </div>

                          <div className="flex flex-col items-center">
                            <span className="text-[8.5px] text-slate-500 uppercase tracking-widest font-mono font-bold font-sans">Hours</span>
                            <input 
                              type="number"
                              className="w-12 bg-[#111120] border border-[#2a2a50] rounded-lg py-1 text-center font-bold text-[#ff6b1a] text-xs focus:outline-none mt-1 font-mono"
                              value={entry.hours || ''}
                              min={0}
                              max={24}
                              step={0.25}
                              placeholder="0"
                              disabled={!isScheduled}
                              onChange={(e) => onUpdateDayField(date, activeTab, item, 'hours', +e.target.value)}
                            />
                          </div>

                          {/* Satisfaction levels 1-5 */}
                          <div className="flex flex-col items-center">
                            <span className="text-[8.5px] text-slate-500 uppercase tracking-widest font-mono font-bold">Rating</span>
                            <div className="flex gap-1.5 h-4 items-center mt-1">
                              {[1, 2, 3, 4, 5].map((lv) => {
                                const satColorsClass = [
                                  '', 'bg-rose-500', 'bg-orange-500', 'bg-amber-500', 'bg-emerald-400', 'bg-indigo-400'
                                ];
                                const dotIsActive = entry.satisfaction >= lv;
                                return (
                                  <button
                                    key={lv}
                                    disabled={!isScheduled}
                                    onClick={() => {
                                      const newVal = entry.satisfaction === lv ? 0 : lv;
                                      onUpdateDayField(date, activeTab, item, 'satisfaction', newVal);
                                    }}
                                    className={`w-2.5 h-2.5 rounded-full border transition hover:scale-125 focus:outline-none cursor-pointer ${
                                      dotIsActive 
                                        ? `${satColorsClass[lv]} border-transparent` 
                                        : 'bg-transparent border-[#2a2a50]'
                                    }`}
                                    title={satLevels[lv]}
                                  />
                                );
                              })}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {trackerMode !== 'goal' && (
                    <>
                      {/* Notes bar */}
                      <div className="flex items-center gap-2 bg-[#0d0d1a] px-3.5 py-2.5 rounded-xl border border-[#111120]">
                        <CornerDownRight size={10} className="text-slate-600 shrink-0" />
                        <input 
                          type="text"
                          className="bg-transparent text-[11px] text-slate-300 placeholder-zinc-700 font-sans focus:outline-none flex-1"
                          placeholder="reflection / observation / micro notes..."
                          value={entry.notes || ''}
                          disabled={!isScheduled}
                          onChange={(e) => onUpdateDayField(date, activeTab, item, 'notes', e.target.value)}
                        />
                      </div>

                      {/* Legal Deep Dive & Habit Chains (Custom Extensibility) */}
                      <div className="flex gap-2">
                        <input 
                          type="text"
                          placeholder="Custom metrics (e.g. 50 pages read, Sequence setup...)"
                          className="flex-1 bg-transparent border border-[#2a2a50] rounded-lg px-3 py-1.5 text-[10px] text-slate-300 placeholder-slate-600 font-mono tracking-tight focus:outline-none focus:border-[#ff6b1a]/50"
                          value={entry.deepData || ''}
                          onChange={(e) => onUpdateDayField(date, activeTab, item, 'deepData', e.target.value)}
                        />
                      </div>
                    </>
                  )}
                </div>
              );
            })
          ) : (
            <div className="h-28 flex flex-col items-center justify-center border border-dashed border-[#2a2a50] rounded-2xl">
              <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest font-mono">// System awaits your routine input</p>
              <p className="text-[8px] text-zinc-700 uppercase mt-1 font-mono">// customize in scheduler/settings or add below</p>
            </div>
          )}
        </div>

        {/* Quick Add Bar */}
        <form onSubmit={handleQuickAddSubmit} className="flex gap-2 pt-4 border-t border-[#1e1e38]">
          <input
            type="text"
            className="flex-1 bg-[#0d0d1a] border border-[#1e1e38] rounded-xl px-3.5 py-2 text-xs text-slate-200 placeholder-zinc-650 focus:outline-none focus:border-[#ff6b1a]/50 transition font-medium"
            placeholder={`Quick add task to ${currentCategory.label.toLowerCase()}...`}
            value={quickAddVal}
            onChange={(e) => setQuickAddVal(e.target.value)}
          />
          <button
            type="submit"
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-[#ff6b1a] bg-[#ff6b1a] text-white rounded-xl hover:bg-[#ff6b1a] tracking-wider uppercase transition cursor-pointer font-sans"
          >
            <Plus size={12} />
            ADD TASK
          </button>
        </form>
      </div>
    </div>
  );
};
