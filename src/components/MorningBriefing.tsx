import React, { useState, useEffect, useRef } from 'react';
import { AppState, TrackerCategory, Reminder } from '../types';
import { ChevronRight, ChevronLeft, X, Check, XCircle, ArrowRight, Plus, Bell, Edit2, Save } from 'lucide-react';
import { todayStr } from '../utils/date';
import { saveData } from '../utils/storage';

interface MorningBriefingProps {
  appState: AppState;
  setAppState: React.Dispatch<React.SetStateAction<AppState>>;
  onClose: () => void;
  targetDate?: string;
  isPlanTomorrow?: boolean;
}

export function MorningBriefing({ appState, setAppState, onClose, targetDate, isPlanTomorrow }: MorningBriefingProps) {
  const [step, setStep] = useState(0);
  const [showFirstTimeModal, setShowFirstTimeModal] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const key = isPlanTomorrow ? 'hasSeenTomorrowBriefIntro' : 'hasSeenMorningBriefIntro';
    if (!localStorage.getItem(key)) {
      setShowFirstTimeModal(true);
    }
  }, [isPlanTomorrow]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [step]);
  
  const today = targetDate || todayStr();
  
  const isTomorrow = targetDate && targetDate > todayStr();
  
  const d = new Date(today);
  d.setDate(d.getDate() - 1);
  const yesterday = [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');

  // Step 1: Mindset (Journal)
  const [mood, setMood] = useState<number>(0);
  const [energy, setEnergy] = useState<number>(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sections, setSections] = useState<Record<string, string>>({});

  const [editingPromptId, setEditingPromptId] = useState<string | null>(null);
  const [editPromptLabel, setEditPromptLabel] = useState<string>('');

  const savePromptLabel = (id: string) => {
      if (!editPromptLabel.trim()) { setEditingPromptId(null); return; }
      setAppState(prev => {
          const next = { ...prev };
          next.journalPrompts = next.journalPrompts.map(p => p.id === id ? { ...p, label: editPromptLabel.trim(), placeholder: '' } : p);
          saveData(next);
          return next;
      });
      setEditingPromptId(null);
  };

  // Init Journal if already exists
  useEffect(() => {
    if (appState.journals[today]) {
      setMood(appState.journals[today].mood || 0);
      setEnergy(appState.journals[today].energy || 0);
      setSelectedTags(appState.journals[today].tags || []);
      setSections(appState.journals[today].sections || {});
    }
  }, [appState.journals, today]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  // Step 2: Cleanup (Rollover)
  const yesterdayPending: { cat: TrackerCategory, item: string }[] = [];
  if (appState.daily[yesterday]) {
    for (const cat of Object.keys(appState.daily[yesterday]) as TrackerCategory[]) {
      for (const [item, entry] of Object.entries(appState.daily[yesterday][cat] || {})) {
        if (entry.status === 'pending') {
          yesterdayPending.push({ cat, item });
        }
      }
    }
  }
  
  const pastReminders = appState.reminders.filter(r => r.dueDate < today && r.status === 'pending');
  
  const [rolloverDecisions, setRolloverDecisions] = useState<Record<string, 'drop' | 'move'>>({});
  const setRollover = (cat: string, item: string, decision: 'drop' | 'move') => {
    setRolloverDecisions(prev => ({ ...prev, [`${cat}-${item}`]: decision }));
  };
  
  const [reminderDecisions, setReminderDecisions] = useState<Record<string, 'drop' | 'move'>>({});
  const setReminderDec = (id: string, decision: 'drop' | 'move') => {
    setReminderDecisions(prev => ({ ...prev, [id]: decision }));
  };

  // Step 3: The Plan (Daily Tasks & Hours)
  const [activeTasks, setActiveTasks] = useState<Record<string, Record<string, boolean>>>({});
  const [plannedHours, setPlannedHours] = useState<Record<string, Record<string, number>>>({});
  const [plannedReps, setPlannedReps] = useState<Record<string, Record<string, number>>>({});
  
  useEffect(() => {
    const initActive: Record<string, Record<string, boolean>> = {};
    const initHours: Record<string, Record<string, number>> = {};
    const initReps: Record<string, Record<string, number>> = {};
    
    // Populate active and hours based on today's existing entries (if any) or recurring defaults
    const cats = ['studies', 'habits', 'leisure', 'custom'] as TrackerCategory[];
    cats.forEach(cat => {
      initActive[cat] = {};
      initHours[cat] = {};
      initReps[cat] = {};
      
      const dayData = appState.daily[today]?.[cat] || {};
      appState.items[cat].forEach(item => {
        const entry = dayData[item];
        if (entry) {
          initActive[cat][item] = true;
          initHours[cat][item] = entry.goalHours !== undefined ? entry.goalHours : (entry.hours || (appState.hoursTarget?.[cat]?.[item] ?? 1));
          initReps[cat][item] = entry.goalReps !== undefined ? entry.goalReps : (entry.reps || (appState.repsTarget?.[cat]?.[item] ?? 1));
        } else {
           initActive[cat][item] = false;
           initHours[cat][item] = appState.hoursTarget?.[cat]?.[item] ?? 1;
           initReps[cat][item] = appState.repsTarget?.[cat]?.[item] ?? 1;
        }
      });
    });
    setActiveTasks(initActive);
    setPlannedHours(initHours);
    setPlannedReps(initReps);
  }, [appState, today]);

  const toggleActiveTask = (cat: string, item: string) => {
     setActiveTasks(prev => {
         const catState = prev[cat] || {};
         return {
             ...prev,
             [cat]: { ...catState, [item]: !catState[item] }
         };
     });
  };

  const updateHours = (cat: string, item: string, delta: number) => {
    if (!activeTasks[cat]?.[item]) {
        toggleActiveTask(cat, item); // auto activate if they add hours
    }
    setPlannedHours(prev => {
        const catHours = prev[cat] || {};
        return {
            ...prev,
            [cat]: {
                ...catHours,
                [item]: Math.max(0, (catHours[item] || 0) + delta)
            }
        };
    });
  };

  const updateReps = (cat: string, item: string, delta: number) => {
    if (!activeTasks[cat]?.[item]) {
        toggleActiveTask(cat, item); // auto activate if they add reps
    }
    setPlannedReps(prev => {
        const catReps = prev[cat] || {};
        return {
            ...prev,
            [cat]: {
                ...catReps,
                [item]: Math.max(0, (catReps[item] || 0) + delta)
            }
        };
    });
  };

  const [quickAdd, setQuickAdd] = useState<Record<string, string>>({});

  const handleQuickAdd = (cat: TrackerCategory, e?: React.FormEvent) => {
      if (e) e.preventDefault();
      const val = quickAdd[cat]?.trim();
      if (!val) return;
      if (appState.items[cat].includes(val)) {
          setQuickAdd(prev => ({...prev, [cat]: ''}));
          if (!activeTasks[cat]?.[val]) toggleActiveTask(cat, val);
          return;
      }
      
      setAppState(prev => ({
          ...prev,
          items: {
              ...prev.items,
              [cat]: [...prev.items[cat], val]
          }
      }));
      setQuickAdd(prev => ({...prev, [cat]: ''}));
      // Auto-activate the new task
      setActiveTasks(prev => ({
          ...prev,
          [cat]: { ...(prev[cat] || {}), [val]: true }
      }));
  };

  // Step 4: Radar & Finances
  const todayReminders = appState.reminders.filter(r => r.dueDate === today && r.status === 'pending');
  const [newReminder, setNewReminder] = useState({ title: '', time: '' });
  
  const [financeExps, setFinanceExps] = useState<Array<{ amount: string, desc: string, type: 'expense' | 'income', createReminder: boolean, reminderTime: string, alertOffset: string }>>([]);
  const [currentExp, setCurrentExp] = useState<{ amount: string, desc: string, type: 'expense' | 'income', createReminder: boolean, reminderTime: string, alertOffset: string }>({ amount: '', desc: '', type: 'expense', createReminder: false, reminderTime: '', alertOffset: '0' });

  const [financeGoal, setFinanceGoal] = useState(() => {
    const defaultIncome = appState.profile?.dailyIncomeTarget !== undefined ? String(appState.profile.dailyIncomeTarget) : '';
    const defaultExpense = appState.profile?.dailyBudgetLimit !== undefined 
      ? String(appState.profile.dailyBudgetLimit) 
      : (appState.financeBudgets?.d ? String(appState.financeBudgets.d) : '');
    return { incomeTarget: defaultIncome, expenseLimit: defaultExpense };
  });

  const handleAddExp = () => {
     if (currentExp.amount && currentExp.desc) {
         setFinanceExps([...financeExps, currentExp]);
         setCurrentExp({ amount: '', desc: '', type: 'expense', createReminder: false, reminderTime: '', alertOffset: '0' });
     }
  };

  const stepsCount = 4;

  const handleNext = () => {
    if (step < stepsCount - 1) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    setAppState(prev => {
      const next = { ...prev };
      
      // Step 1: Mindset
      if (!next.journals[today]) {
        next.journals[today] = { date: today, mood: 0, energy: 0, tags: [], sections: {}, savedAt: new Date().toISOString() };
      }
      next.journals[today].mood = mood;
      next.journals[today].energy = energy;
      next.journals[today].tags = selectedTags;
      next.journals[today].sections = { ...next.journals[today].sections, ...sections };

      // Step 2: Rollover
      for (const pending of yesterdayPending) {
        const decision = rolloverDecisions[`${pending.cat}-${pending.item}`];
        if (decision === 'drop') {
          next.daily[yesterday][pending.cat]![pending.item].status = 'skipped';
        } else if (decision === 'move') {
          next.daily[yesterday][pending.cat]![pending.item].status = 'missed';
          if (!next.daily[today]) next.daily[today] = {};
          if (!next.daily[today][pending.cat]) next.daily[today][pending.cat] = {};
          if (!next.daily[today][pending.cat]![pending.item]) {
            next.daily[today][pending.cat]![pending.item] = { status: 'pending', reps: 0, hours: 0, satisfaction: 0, notes: '' };
          }
        }
      }
      
      for (const r of pastReminders) {
        const dec = reminderDecisions[r.id];
        const idx = next.reminders.findIndex(rem => rem.id === r.id);
        if (idx >= 0) {
           if (dec === 'drop') {
               next.reminders[idx].status = 'done'; // consider it closed or dropped
           } else if (dec === 'move') {
               next.reminders[idx].dueDate = today;
           }
        }
      }

      // Step 3: Planned Hours & Active Tasks
      if (!next.daily[today]) next.daily[today] = {};
      
      const newHoursTarget = { ...next.hoursTarget } as Record<string, Record<string, number>>;
      const newRepsTarget = { ...next.repsTarget } as Record<string, Record<string, number>>;

      for (const ObjectKey of Object.keys(activeTasks)) {
        const cat = ObjectKey as TrackerCategory;
        if (!next.daily[today][cat]) next.daily[today][cat] = {};
        
        for (const item of Object.keys(activeTasks[cat])) {
          const isActive = activeTasks[cat][item];
          const hours = plannedHours[cat]?.[item] || 0;
          const reps = plannedReps[cat]?.[item] || 0;
          
          if (isActive) {
             if (!next.daily[today][cat]![item]) {
                next.daily[today][cat]![item] = { status: 'pending', reps: 0, hours: 0, satisfaction: 0, notes: '' };
             }
             if (hours > 0) {
                next.daily[today][cat]![item].goalHours = hours;
                if (!newHoursTarget[cat]) newHoursTarget[cat] = {};
                newHoursTarget[cat][item] = hours;
             }
             if (reps > 0) {
                next.daily[today][cat]![item].goalReps = reps;
                if (!newRepsTarget[cat]) newRepsTarget[cat] = {};
                newRepsTarget[cat][item] = reps;
             }
          }
        }
      }
      next.hoursTarget = newHoursTarget;
      next.repsTarget = newRepsTarget;

      // Step 4: Radar & Finances
      if (newReminder.title) {
          next.reminders.push({
              id: Date.now().toString(),
              title: newReminder.title,
              dueDate: today,
              time: newReminder.time || '',
              status: 'pending',
              createdAt: new Date().toISOString(),
              priority: 'medium',
              category: 'general'
          });
      }

      if (financeGoal.incomeTarget || financeGoal.expenseLimit) {
          if (!next.dailyFinanceGoals) next.dailyFinanceGoals = {};
          next.dailyFinanceGoals[targetDate] = {
              incomeTarget: parseFloat(financeGoal.incomeTarget) || 0,
              expenseLimit: parseFloat(financeGoal.expenseLimit) || 0
          };
      }

      const allExps = currentExp.amount && currentExp.desc ? [...financeExps, currentExp] : financeExps;
      
      if (allExps.length > 0) {
          if (!next.finances) next.finances = [];
          allExps.forEach((exp, idx) => {
              const txId = Date.now().toString() + "_" + idx;
              next.finances.push({
                  id: txId,
                  type: exp.type || 'expense',
                  date: targetDate,
                  amount: parseFloat(exp.amount) || 0,
                  category: 'Daily Planner',
                  currency: 'USD',
                  concept: exp.desc
              } as any);

              if (exp.createReminder) {
                  next.reminders.push({
                     id: txId + "_rem",
                     title: `Finance: ${exp.desc} ($${exp.amount})`,
                     dueDate: targetDate,
                     time: exp.reminderTime,
                     status: 'pending',
                     createdAt: new Date().toISOString(),
                     priority: 'high',
                     category: 'finance',
                     enableAlert: parseInt(exp.alertOffset) > 0,
                     alertOffset: parseInt(exp.alertOffset) > 0 ? parseInt(exp.alertOffset) : undefined
                  });
              }
          });
      }

      saveData(next);
      return next;
    });

    onClose();
  };

  if (showFirstTimeModal) {
    const key = isPlanTomorrow ? 'hasSeenTomorrowBriefIntro' : 'hasSeenMorningBriefIntro';
    const title = isPlanTomorrow ? "Proactive Blueprinting: Plan Tomorrow" : "Goal Setting Phase: Start the Day";
    const description = isPlanTomorrow
      ? "Proactively setup tomorrow's core schedule and aspirational metrics tonight to reduce decision fatigue when you wake up."
      : "Establish your mental guidelines, rollover pending issues, and outline your target estimations in a calm, distraction-free space.";
    
    return (
      <div className="fixed inset-0 z-[110] bg-[#0d0d1a]/95 backdrop-blur-xl flex items-center justify-center p-4 text-slate-200">
        <div className="max-w-md w-full bg-[#111120] border border-amber-500/40 rounded-2xl p-6 shadow-2xl relative overflow-hidden flex flex-col gap-6 animate-fadeIn">
          {/* Decorative subtle header line */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-500 to-purple-500" />
          
          <div className="space-y-2">
            <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded font-mono uppercase tracking-widest">
              Setup & Planning
            </span>
            <h2 className="text-xl font-bold tracking-tight text-white mt-2 flex items-center gap-2">
              🎯 {title}
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed pt-1 font-sans">
              {description}
            </p>
          </div>

          <div className="bg-[#0b0b14] border border-[#2a2a50] rounded-xl p-4 space-y-3 font-mono text-[11px] leading-relaxed text-slate-300">
            <h4 className="font-extrabold text-amber-500 uppercase tracking-widest">// CRITICAL RULES: ONLY GOAL SETTING</h4>
            <div className="space-y-2">
              <p className="flex items-start gap-2">
                <span className="text-amber-500 font-bold">1.</span>
                <span><strong>No Physical Tracking:</strong> This is a goal setter, not a tracker. Ticking checkboxes, logging pomodoros, and reflecting on accomplishments are done in the active daily layout and closed during the evening.</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-amber-500 font-bold">2.</span>
                <span><strong>Aspirational Baselines:</strong> Set your target repetitions (Reps) and estimated focused hours (Hrs) for study slots and habits. These integrate straight into your targets!</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-amber-500 font-bold">3.</span>
                <span><strong>Clean slate:</strong> Roll remaining pending tasks and reminders forward to keep the board clutter-free.</span>
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              localStorage.setItem(key, 'true');
              setShowFirstTimeModal(false);
            }}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-[#0d0d1a] font-extrabold uppercase py-3 rounded-xl text-xs tracking-widest font-mono shadow-[0_4px_12px_rgba(245,158,11,0.2)] transition-all cursor-pointer"
          >
            I understand, let's set goals
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-[#0d0d1a]/90 backdrop-blur-md flex flex-col pt-10 pb-6 px-4 animate-fade-in text-slate-200">
      <div className="max-w-3xl w-full mx-auto flex-1 flex flex-col min-h-0">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8 shrink-0">
            <h2 className="text-sm font-black tracking-widest text-[#00ff88] uppercase">{isPlanTomorrow ? 'Plan Tomorrow' : 'Start Your Day'} / {today}</h2>
            <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
                <X size={20} className="text-slate-500" />
            </button>
        </div>

        {/* Progress Bar */}
        <div className="flex gap-2 mb-8 shrink-0">
            {[0,1,2,3].map(i => (
                <div key={i} className={`h-1 flex-1 rounded-full transition-colors duration-500 ${step >= i ? 'bg-[#00ff88]' : 'bg-slate-800'}`} />
            ))}
        </div>

        {/* Content Area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-none flex flex-col pt-4 pb-12">
            
            {step === 0 && (
                <div className="space-y-10 animate-fade-in">
                    <div>
                        <h1 className="text-3xl font-light mb-2">{isPlanTomorrow ? "Tomorrow's Mindset" : "Morning Mindset"}</h1>
                        <p className="text-slate-400 text-sm">How are you stepping into {isPlanTomorrow ? "tomorrow" : "today"}?</p>
                    </div>
                    
                    <div className="flex flex-col md:flex-row gap-8">
                        <div className="flex-1">
                            <label className="block text-xs uppercase tracking-widest text-slate-500 mb-4">Mood (1 - 5)</label>
                            <div className="flex gap-3">
                                {[1, 2, 3, 4, 5].map(v => (
                                    <button key={v} onClick={() => setMood(v)}
                                        className={`flex-1 h-12 rounded-xl flex items-center justify-center text-xl transition-all ${mood === v ? 'bg-[#ff00a0]/30 border-2 border-[#ff00a0]' : 'bg-[#111120] border border-[#2a2a50] hover:bg-[#1a1a2e]'}`}>
                                        {v === 1 ? '😫' : v === 2 ? '😔' : v === 3 ? '😐' : v === 4 ? '🙂' : '🤩'}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex-1">
                            <label className="block text-xs uppercase tracking-widest text-slate-500 mb-4">Energy (1 - 5)</label>
                            <div className="flex gap-3">
                                {[1, 2, 3, 4, 5].map(v => (
                                    <button key={v} onClick={() => setEnergy(v)}
                                        className={`flex-1 h-12 rounded-xl flex items-center justify-center text-xl transition-all ${energy === v ? 'bg-[#00d0ff]/30 border-2 border-[#00d0ff]' : 'bg-[#111120] border border-[#2a2a50] hover:bg-[#1a1a2e]'}`}>
                                        {v === 1 ? '🔋' : v === 2 ? '🪫' : v === 3 ? '🔌' : v === 4 ? '⚡' : '🔥'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs uppercase tracking-widest text-slate-500 mb-4">Tags</label>
                        <div className="flex flex-wrap gap-2">
                             {appState.journalTags.map(tag => {
                                const active = selectedTags.includes(tag);
                                return (
                                    <button
                                        key={tag}
                                        onClick={() => toggleTag(tag)}
                                        className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border transition-colors ${
                                            active ? 'border-[#00ff88] bg-[#00ff88]/20 text-[#00ff88]' : 'border-[#2a2a50] bg-[#111120] hover:bg-[#1a1a2e] text-slate-400'
                                        }`}
                                    >
                                        {tag}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="space-y-6">
                        {appState.journalPrompts.map(prompt => (
                            <div key={prompt.id} className="group">
                                <div className="flex items-center gap-2 mb-2">
                                    {editingPromptId === prompt.id ? (
                                        <div className="flex items-center gap-2 flex-1">
                                            <input 
                                                type="text" 
                                                value={editPromptLabel}
                                                onChange={e => setEditPromptLabel(e.target.value)}
                                                className="bg-[#111120] border border-emerald-400 rounded-lg px-2 py-1 text-xs uppercase tracking-widest text-emerald-400 focus:outline-none flex-1"
                                                autoFocus
                                                onKeyDown={e => { if (e.key === 'Enter') savePromptLabel(prompt.id); if (e.key === 'Escape') setEditingPromptId(null); }}
                                            />
                                            <button onClick={() => savePromptLabel(prompt.id)} className="text-emerald-400 hover:text-white p-1">
                                                <Save size={14} />
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <label className="block text-xs uppercase tracking-widest text-emerald-400">{prompt.label}</label>
                                            <button 
                                                onClick={() => { setEditingPromptId(prompt.id); setEditPromptLabel(prompt.label); }} 
                                                className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-emerald-400 transition-opacity p-1"
                                                title="Edit Heading"
                                            >
                                                <Edit2 size={12} />
                                            </button>
                                        </>
                                    )}
                                </div>
                                <textarea 
                                    value={sections[prompt.id] || ''}
                                    onChange={(e) => setSections({...sections, [prompt.id]: e.target.value})}
                                    placeholder={isPlanTomorrow ? prompt.placeholder.replace(/\btoday\b/gi, match => match === 'Today' ? 'Tomorrow' : 'tomorrow') : prompt.placeholder}
                                    className="w-full bg-[#111120] border border-[#2a2a50] rounded-xl p-4 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-400 transition-colors resize-y h-24 whitespace-pre-wrap"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {step === 1 && (
                <div className="space-y-8 animate-fade-in">
                    <div>
                        <h1 className="text-3xl font-light mb-2">The Cleanup</h1>
                        <p className="text-slate-400 text-sm">Review yesterday's unfinished business and past reminders.</p>
                    </div>

                    {yesterdayPending.length === 0 && pastReminders.length === 0 ? (
                        <div className="py-12 text-center text-slate-500 border border-dashed border-slate-700 rounded-xl">
                            No pending tasks or reminders! Clean slate.
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {yesterdayPending.length > 0 && (
                                <div className="space-y-3">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 border-b border-[#2a2a50] pb-2">Yesterday's Tasks</h3>
                                    {yesterdayPending.map((p, i) => (
                                        <div key={i} className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111120] p-4 rounded-xl border transition-colors ${rolloverDecisions[`${p.cat}-${p.item}`] ? 'border-[#2a2a50]/50 opacity-50' : 'border-[#2a2a50]'}`}>
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs uppercase tracking-widest text-slate-600 w-16">{p.cat}</span>
                                                <span className={`font-medium ${rolloverDecisions[`${p.cat}-${p.item}`] === 'drop' ? 'line-through text-slate-500' : 'text-slate-200'}`}>{p.item}</span>
                                            </div>
                                            <div className="flex gap-2 self-end sm:self-auto">
                                                <button 
                                                    onClick={() => setRollover(p.cat, p.item, 'drop')}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-colors flex items-center gap-1 ${rolloverDecisions[`${p.cat}-${p.item}`] === 'drop' ? 'bg-red-500/20 text-red-500 border-red-500/40' : 'bg-[#1a1a2e] text-slate-400 hover:text-red-400'} border border-transparent`}
                                                >
                                                    <XCircle size={14} /> Drop
                                                </button>
                                                <button 
                                                    onClick={() => setRollover(p.cat, p.item, 'move')}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-colors flex items-center gap-1 ${rolloverDecisions[`${p.cat}-${p.item}`] === 'move' ? 'bg-[#00ff88]/20 text-[#00ff88] border-[#00ff88]/40' : 'bg-[#1a1a2e] text-slate-400 hover:text-[#00ff88]'} border border-transparent`}
                                                >
                                                    Move To Today <ArrowRight size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            
                            {pastReminders.length > 0 && (
                                <div className="space-y-3">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-[#ff00a0] border-b border-[#2a2a50] pb-2">Overdue Reminders</h3>
                                    {pastReminders.map((r) => (
                                        <div key={r.id} className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111120] p-4 rounded-xl border transition-colors ${reminderDecisions[r.id] ? 'border-[#2a2a50]/50 opacity-50' : 'border-[#ff00a0]/30'}`}>
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#ff00a0]/10 text-[#ff00a0]">
                                                   <Bell size={14} />
                                                </div>
                                                <div>
                                                   <span className={`font-medium ${reminderDecisions[r.id] === 'drop' ? 'line-through text-slate-500' : 'text-slate-200'}`}>{r.title}</span>
                                                   <p className="text-xs text-slate-500 uppercase tracking-widest mt-0.5">{r.dueDate} {r.time}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 self-end sm:self-auto">
                                                <button 
                                                    onClick={() => setReminderDec(r.id, 'drop')}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-colors flex items-center gap-1 ${reminderDecisions[r.id] === 'drop' ? 'bg-red-500/20 text-red-500 border-red-500/40' : 'bg-[#1a1a2e] text-slate-400 hover:text-red-400'} border border-transparent`}
                                                >
                                                    <XCircle size={14} /> Drop
                                                </button>
                                                <button 
                                                    onClick={() => setReminderDec(r.id, 'move')}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-colors flex items-center gap-1 ${reminderDecisions[r.id] === 'move' ? 'bg-[#00ff88]/20 text-[#00ff88] border-[#00ff88]/40' : 'bg-[#1a1a2e] text-slate-400 hover:text-[#00ff88]'} border border-transparent`}
                                                >
                                                    Move To Today <ArrowRight size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {step === 2 && (
                <div className="space-y-8 animate-fade-in">
                    <div>
                        <h1 className="text-3xl font-light mb-2">{isPlanTomorrow ? "Tomorrow's Plan" : "Today's Plan"}</h1>
                        <p className="text-slate-400 text-sm">Select what you intend to do {isPlanTomorrow ? "tomorrow" : "today"} and estimate time.</p>
                        
                        {/* Systemic Goal-Setting vs Tracking Clarifier */}
                        <div className="mt-4 p-4 bg-amber-500/10 border border-amber-400/40 text-amber-300 text-xs rounded-xl font-mono leading-relaxed max-w-2xl space-y-2">
                          <p className="font-extrabold uppercase tracking-wider text-sm flex items-center gap-1.5 text-amber-400">
                            🎯 GOAL SETTING PHASE (ASTEROID BASELINE)
                          </p>
                          <p className="opacity-95 leading-relaxed">
                            <strong>This is a Goal Setter, NOT a tracker.</strong> You are configuring your baseline schedules, repetition goals, and estimated hours budgets for tomorrow/today. 
                          </p>
                          <p className="opacity-80 leading-relaxed text-[10.5px] border-t border-amber-500/20 pt-2 text-slate-400">
                            // To check off, log active Pomodoros, enter satisfaction ratings, or type reflection notes as you work, please use the <strong>Daily Tracker UI</strong> during the day. Finally, use the <strong>Evening Debrief</strong> (which acts as your authoritative tracker and actuals ledger) to sweep and register final performance statistics.
                          </p>
                        </div>
                    </div>

                    <div className="space-y-8">
                        {(['studies', 'habits', 'leisure', 'custom'] as TrackerCategory[]).map(cat => (
                            <div key={cat} className="space-y-3">
                                <h3 className="text-sm font-black uppercase tracking-widest text-[#00ff88] border-b border-[#2a2a50] pb-2">{cat}</h3>
                                {appState.items[cat].length === 0 && <p className="text-xs text-slate-600">No items in this category.</p>}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {appState.items[cat].map(item => {
                                        const isActive = activeTasks[cat]?.[item] || false;
                                        const hrs = plannedHours[cat]?.[item] || 0;
                                        const rps = plannedReps[cat]?.[item] || 0;
                                        return (
                                            <div key={item} className={`flex items-center justify-between p-3 rounded-xl border transition-colors gap-2 w-full min-w-0 ${isActive ? 'bg-[#111928] border-[#00ff88]/40' : 'bg-[#111120] border-[#2a2a50] opacity-60'}`}>
                                                <div className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0" onClick={() => toggleActiveTask(cat, item)}>
                                                    <div className={`shrink-0 w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${isActive ? 'bg-[#00ff88] border-[#00ff88] text-[#0d0d1a]' : 'border-[#2a2a50] text-transparent'}`} title="Ticking plans/activates this routine for today">
                                                       <Check size={14} strokeWidth={4} />
                                                    </div>
                                                    <span className={`font-mono text-xs sm:text-sm leading-tight truncate ${isActive ? 'text-white font-bold' : 'text-slate-400'}`} title={item}>{item}</span>
                                                </div>
                                                
                                                <div className="flex items-center gap-1.5 shrink-0">
                                                    <div className="flex items-center gap-0.5 bg-[#0d0d1a] border border-[#2a2a50] rounded-lg p-0.5 shadow-inner">
                                                        <span className="text-[10px] uppercase text-slate-500 font-mono px-1 hidden lg:block">Reps</span>
                                                        <button onClick={() => updateReps(cat, item, -1)} className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors text-xs">-</button>
                                                        <span className={`w-6 text-center text-xs font-mono font-medium ${rps > 0 ? 'text-[#ff00a0]' : 'text-slate-500'}`}>{rps > 0 ? rps : '--'}</span>
                                                        <button onClick={() => updateReps(cat, item, 1)} className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors text-xs">+</button>
                                                    </div>
                                                    <div className="flex items-center gap-0.5 bg-[#0d0d1a] border border-[#2a2a50] rounded-lg p-0.5 shadow-inner">
                                                        <span className="text-[10px] uppercase text-slate-500 font-mono px-1 hidden lg:block">Hrs</span>
                                                        <button onClick={() => updateHours(cat, item, -0.5)} className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors text-xs">-</button>
                                                        <span className={`w-7 text-center text-xs font-mono font-medium ${hrs > 0 ? 'text-[#00d0ff]' : 'text-slate-500'}`}>{hrs > 0 ? hrs.toFixed(1) : '--'}</span>
                                                        <button onClick={() => updateHours(cat, item, 0.5)} className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors text-xs">+</button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <form onSubmit={(e) => handleQuickAdd(cat, e)} className="flex items-center gap-2 mt-1 sm:col-span-1 md:col-span-2">
                                        <input 
                                            type="text" 
                                            placeholder={`+ Add new task to ${cat}...`}
                                            className="w-full bg-[#0d0d1a] border border-[#2a2a50] rounded-xl px-4 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-[#00ff88]/50 focus:bg-[#111120] transition-colors"
                                            value={quickAdd[cat] || ''}
                                            onChange={e => setQuickAdd(prev => ({...prev, [cat]: e.target.value}))}
                                        />
                                        <button type="submit" disabled={!quickAdd[cat]} className="px-3 py-2 bg-[#00ff88]/10 text-[#00ff88] rounded-xl disabled:opacity-30 disabled:cursor-not-allowed">
                                            <Plus size={16} />
                                        </button>
                                    </form>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {step === 3 && (
                <div className="space-y-10 animate-fade-in">
                    <div>
                        <h1 className="text-3xl font-light mb-2">Radar & Finances</h1>
                        <p className="text-slate-400 text-sm">Any pressing reminders or expected expenses {isPlanTomorrow ? "tomorrow" : "today"}?</p>
                    </div>
                    
                    <div className="space-y-4">
                        <label className="block text-xs uppercase tracking-widest text-[#ff00a0]">{isPlanTomorrow ? "Tomorrow's Reminders" : "Today's Reminders"}</label>
                        {todayReminders.length === 0 ? (
                             <div className="py-3 px-4 text-sm text-slate-500 border border-dashed border-slate-700 bg-slate-900/30 rounded-xl">
                                No reminders due {isPlanTomorrow ? "tomorrow" : "today"}.
                             </div>
                        ) : (
                            <div className="space-y-2">
                                {todayReminders.map(r => (
                                    <div key={r.id} className="bg-[#111120] border-l-4 border-l-[#ff00a0] p-4 rounded-xl border-y border-r border-y-[#2a2a50] border-r-[#2a2a50]">
                                        <h4 className="font-medium text-slate-200">{r.title}</h4>
                                        {r.time && <p className="text-xs text-slate-400 mt-1">{r.time}</p>}
                                    </div>
                                ))}
                            </div>
                        )}
                        
                        {/* Inline add reminder */}
                        <div className="flex gap-2">
                             <input 
                                type="text"
                                placeholder="+ New quick reminder for today..."
                                value={newReminder.title}
                                onChange={e => setNewReminder({...newReminder, title: e.target.value})}
                                className="flex-1 bg-[#111120] border border-[#2a2a50] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#ff00a0] text-sm"
                             />
                             <input 
                                type="time"
                                value={newReminder.time}
                                onChange={e => setNewReminder({...newReminder, time: e.target.value})}
                                className="w-28 bg-[#111120] border border-[#2a2a50] rounded-xl px-2 py-3 text-white focus:outline-none focus:border-[#ff00a0] text-sm"
                             />
                         </div>
                    </div>

                    <div className="pt-6 border-t border-[#2a2a50]">
                       <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                           <label className="block text-xs uppercase tracking-widest text-[#00d0ff]">Daily Finance Goals</label>
                           <span className="text-[10px] text-slate-500 font-mono italic bg-[#111120] px-2 py-0.5 rounded border border-slate-800">// Pre-loaded from Setup Profile</span>
                       </div>
                       <div className="flex gap-4 mb-8">
                           <input 
                               type="number"
                               placeholder="Income Target (e.g. 100)"
                               value={financeGoal.incomeTarget}
                               onChange={e => setFinanceGoal({...financeGoal, incomeTarget: e.target.value})}
                               className="flex-1 bg-[#111120] border border-[#2a2a50] rounded-xl px-4 py-3 text-[#00ff88] focus:outline-none focus:border-[#00ff88] font-mono text-sm placeholder-slate-600"
                           />
                           <input 
                               type="number"
                               placeholder="Expense Limit (e.g. 50)"
                               value={financeGoal.expenseLimit}
                               onChange={e => setFinanceGoal({...financeGoal, expenseLimit: e.target.value})}
                               className="flex-1 bg-[#111120] border border-[#2a2a50] rounded-xl px-4 py-3 text-[#ff00a0] focus:outline-none focus:border-[#ff00a0] font-mono text-sm placeholder-slate-600"
                           />
                       </div>

                       <label className="block text-xs uppercase tracking-widest text-[#00d0ff] mb-4">Expected Transactions Today</label>
                       
                       {financeExps.map((exp, idx) => (
                           <div key={idx} className="flex gap-4 mb-4 p-4 bg-[#111120] border border-slate-700 rounded-xl items-center text-sm">
                               <span className={exp.type === 'income' ? 'text-[#00ff88]' : 'text-[#ff00a0]'}>
                                   {exp.type.toUpperCase()}
                               </span>
                               <span className="font-mono text-white">${exp.amount}</span>
                               <span className="text-slate-300 flex-1">{exp.desc}</span>
                               {exp.createReminder && (
                                   <span className="text-[#00d0ff] text-xs"><Bell size={12} className="inline mr-1" /> {exp.reminderTime}</span>
                               )}
                           </div>
                       ))}

                       <div className="flex flex-col sm:flex-row gap-4">
                           <select 
                               value={currentExp.type}
                               onChange={(e) => setCurrentExp({...currentExp, type: e.target.value as 'expense' | 'income'})}
                               className="sm:w-28 bg-[#111120] border border-[#2a2a50] rounded-xl px-2 py-3 text-white focus:outline-none focus:border-[#00d0ff] text-sm uppercase font-black tracking-wider"
                           >
                               <option value="expense">EXPENSE</option>
                               <option value="income">INCOME</option>
                           </select>
                           <input 
                              type="number"
                              placeholder="Amount (e.g. 15.00)"
                              value={currentExp.amount}
                              onChange={e => setCurrentExp({...currentExp, amount: e.target.value})}
                              className="sm:w-32 bg-[#111120] border border-[#2a2a50] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00d0ff] font-mono text-sm"
                           />
                           <input 
                              type="text"
                              placeholder="What for? (e.g., Gas, Salary)"
                              value={currentExp.desc}
                              onChange={e => setCurrentExp({...currentExp, desc: e.target.value})}
                              className="flex-1 bg-[#111120] border border-[#2a2a50] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00d0ff] text-sm"
                           />
                           <button 
                              onClick={handleAddExp}
                              className="bg-[#00d0ff]/10 text-[#00d0ff] px-4 py-3 rounded-xl hover:bg-[#00d0ff]/20 transition-colors"
                           >
                               <Plus size={18} />
                           </button>
                       </div>
                       
                       <div className="mt-4 p-4 bg-[#111120] border border-[#2a2a50] rounded-xl flex flex-col sm:flex-row sm:items-center gap-4">
                           <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300 font-medium">
                               <input 
                                   type="checkbox"
                                   checked={currentExp.createReminder}
                                   onChange={e => setCurrentExp({...currentExp, createReminder: e.target.checked})}
                                   className="w-4 h-4 rounded border-slate-700 text-[#00d0ff] focus:ring-[#00d0ff]"
                               />
                               Set Reminder/Alert
                           </label>
                           
                           {currentExp.createReminder && (
                               <div className="flex items-center gap-3">
                                   <input 
                                       type="time"
                                       value={currentExp.reminderTime}
                                       onChange={e => setCurrentExp({...currentExp, reminderTime: e.target.value})}
                                       className="bg-[#0d0d1a] border border-[#2a2a50] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#00d0ff] text-xs"
                                   />
                                   <select 
                                       value={currentExp.alertOffset}
                                       onChange={e => setCurrentExp({...currentExp, alertOffset: e.target.value})}
                                       className="bg-[#0d0d1a] border border-[#2a2a50] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#00d0ff] text-xs"
                                   >
                                       <option value="0">No Alert Popup</option>
                                       <option value="5">5 min before</option>
                                       <option value="15">15 min before</option>
                                       <option value="60">1 hour before</option>
                                   </select>
                               </div>
                           )}
                       </div>
                       
                       <p className="text-xs text-slate-600 mt-3">This will automatically be added to your finance tracker.</p>
                    </div>

                </div>
            )}

        </div>

        {/* Footer Actions */}
        <div className="flex flex-col items-center border-t border-[#2a2a50]/50 pt-6 mt-auto shrink-0 bg-[#0d0d1a] gap-4">
            <div className="flex items-center justify-between w-full">
                {step > 0 ? (
                    <button
                        onClick={() => setStep(step - 1)}
                        className="flex items-center gap-2 px-6 py-4 rounded-xl text-sm font-black uppercase tracking-widest text-slate-400 hover:text-slate-200 hover:bg-[#1a1a2e] transition-colors"
                    >
                        <ChevronLeft size={16} /> Back
                    </button>
                ) : <div />}

                <button
                    onClick={handleNext}
                    className="flex items-center gap-2 px-8 py-4 rounded-xl text-sm font-black uppercase tracking-widest bg-gradient-to-r from-[#00ff88] to-[#00d0ff] text-[#0d0d1a] shadow-[0_4px_20px_rgba(0,255,136,0.3)] hover:opacity-90 transition-opacity"
                >
                    {step === stepsCount - 1 ? 'Unlock Day' : 'Continue'} <ChevronRight size={16} />
                </button>
            </div>
            
            {step === stepsCount - 1 && (
                 <p className="text-xs text-slate-500 text-center uppercase tracking-widest mt-2 max-w-lg">
                    You can edit and customize all these defaults, goals, budgets, and reminders anytime from your specific dashboard options.
                 </p>
            )}
        </div>

      </div>
    </div>
  );
}

