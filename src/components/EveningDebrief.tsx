import React, { useState, useEffect, useRef } from 'react';
import { AppState, TrackerCategory } from '../types';
import { ChevronRight, ChevronLeft, X, CheckCircle2, XCircle, Plus, Edit2, Save, Bell, Sparkles } from 'lucide-react';
import { todayStr } from '../utils/date';
import { saveData } from '../utils/storage';

interface EveningDebriefProps {
  appState: AppState;
  setAppState: React.Dispatch<React.SetStateAction<AppState>>;
  onClose: () => void;
  onNavigate?: (viewId: string) => void;
}

export function EveningDebrief({ appState, setAppState, onClose, onNavigate }: EveningDebriefProps) {
  const [step, setStep] = useState(0);
  const [showFirstTimeModal, setShowFirstTimeModal] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!localStorage.getItem('hasSeenEveningBriefIntro')) {
      setShowFirstTimeModal(true);
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = 0;
    }
  }, [step]);
  
  const today = todayStr();

  // Step 1: The Sweep - Pending tasks today
  const pendingTasks: { cat: TrackerCategory, item: string }[] = [];
  if (appState.daily[today]) {
    for (const ObjectKey of Object.keys(appState.daily[today])) {
        const cat = ObjectKey as TrackerCategory;
        for (const [item, entry] of Object.entries(appState.daily[today][cat] || {})) {
            if (entry.status === 'pending') {
            pendingTasks.push({ cat, item });
            }
        }
    }
  }

  const [sweepDecisions, setSweepDecisions] = useState<Record<string, 'done' | 'missed'>>({});

  // Step 2: The Actuals - Tasks interact today
  const [actualHours, setActualHours] = useState<Record<string, Record<string, number>>>(() => {
    const initHours: Record<string, Record<string, number>> = {};
    const dailyData = appState.daily[today] || {};
    for (const cat of ['studies', 'habits', 'leisure', 'custom'] as TrackerCategory[]) {
      initHours[cat] = {};
      for (const item of appState.items[cat] || []) {
        const entry = dailyData[cat]?.[item];
        if (entry && entry.goalHours !== undefined && entry.goalHours > 0) {
          initHours[cat][item] = entry.goalHours;
        } else if (entry && entry.hours !== undefined) {
          initHours[cat][item] = entry.hours;
        } else {
          initHours[cat][item] = appState.hoursTarget?.[cat]?.[item] !== undefined 
            ? appState.hoursTarget[cat][item] 
            : 1;
        }
      }
    }
    return initHours;
  });

  const [actualReps, setActualReps] = useState<Record<string, Record<string, number>>>(() => {
    const initReps: Record<string, Record<string, number>> = {};
    const dailyData = appState.daily[today] || {};
    for (const cat of ['studies', 'habits', 'leisure', 'custom'] as TrackerCategory[]) {
      initReps[cat] = {};
      for (const item of appState.items[cat] || []) {
        const entry = dailyData[cat]?.[item];
        if (entry && entry.goalReps !== undefined && entry.goalReps > 0) {
          initReps[cat][item] = entry.goalReps;
        } else if (entry && entry.reps !== undefined) {
          initReps[cat][item] = entry.reps;
        } else {
          initReps[cat][item] = appState.repsTarget?.[cat]?.[item] !== undefined 
            ? appState.repsTarget[cat][item] 
            : 1;
        }
      }
    }
    return initReps;
  });
  
  // Step 3: Ledger 
  const [financeExps, setFinanceExps] = useState<Array<{ amount: string, desc: string, type: 'expense' | 'income', createReminder: boolean, reminderTime: string, alertOffset: string }>>([]);
  const [financeExp, setFinanceExp] = useState<{ amount: string, desc: string, type: 'expense' | 'income', createReminder: boolean, reminderTime: string, alertOffset: string }>({ amount: '', desc: '', type: 'expense', createReminder: false, reminderTime: '', alertOffset: '0' });
  const [dailyTotals, setDailyTotals] = useState(() => {
    const defaultIncome = appState.profile?.dailyIncomeTarget !== undefined ? String(appState.profile.dailyIncomeTarget) : '';
    const defaultExpense = appState.profile?.dailyBudgetLimit !== undefined 
      ? String(appState.profile.dailyBudgetLimit) 
      : (appState.financeBudgets?.d ? String(appState.financeBudgets.d) : '');
    return { actualIncome: defaultIncome, actualExpense: defaultExpense };
  });

  const handleAddExp = () => {
    if (financeExp.amount && financeExp.desc) {
         setFinanceExps([...financeExps, financeExp]);
         setFinanceExp({ amount: '', desc: '', type: 'expense', createReminder: false, reminderTime: '', alertOffset: '0' });
     }
  };

  // Step 4: Reflection (Full Journal)
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
      // Don't override if they just set it in morning, but we want them to update it for evening
      setMood(appState.journals[today].mood || 0);
      setEnergy(appState.journals[today].energy || 0);
      setSelectedTags(appState.journals[today].tags || []);
      setSections(appState.journals[today].sections || {});
    }
  }, [appState.journals, today]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const stepsCount = 3;

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
      if (!next.daily[today]) next.daily[today] = {};

      // Unified Step: Sweep & Actuals
      const cats = ['studies', 'habits', 'leisure', 'custom'] as TrackerCategory[];
      for (const cat of cats) {
         if (!next.daily[today][cat]) next.daily[today][cat] = {};
         for (const item of appState.items[cat]) {
            const hrs = actualHours[cat]?.[item] || 0;
            const rps = actualReps[cat]?.[item] || 0;
            const dec = sweepDecisions[`${cat}-${item}`];
            const prevStatus = next.daily[today][cat]![item]?.status || 'pending';
            
            const isDone = dec === 'done' || (!dec && prevStatus === 'done') || (!dec && prevStatus !== 'missed' && (hrs > 0 || rps > 0));
            const isMissed = dec === 'missed' || (!dec && prevStatus === 'missed');
            
            let status: 'done' | 'pending' | 'missed' | 'skipped' = prevStatus;
            if (isDone) status = 'done';
            else if (isMissed) status = 'missed';

            if (hrs > 0 || rps > 0 || status !== 'pending') {
               const existing = next.daily[today][cat]![item] || {};
               next.daily[today][cat]![item] = {
                   ...existing,
                   status,
                   hours: hrs,
                   reps: rps,
                   satisfaction: next.daily[today][cat]![item]?.satisfaction || 0,
                   notes: next.daily[today][cat]![item]?.notes || ''
               };
            }
         }
      }

      // Reminders Sweep Save
      const todaysReminders = (next.reminders || []).filter(r => r.dueDate === today && r.status === 'pending');
      todaysReminders.forEach(rem => {
          const dec = sweepDecisions[`reminder-${rem.id}`];
          if (dec === 'done' || dec === 'missed') {
              rem.status = 'done';
          }
      });

      // Step 2: Ledger
      if (dailyTotals.actualIncome || dailyTotals.actualExpense) {
          if (!next.dailyFinanceGoals) next.dailyFinanceGoals = {};
          if (!next.dailyFinanceGoals[today]) next.dailyFinanceGoals[today] = { incomeTarget: 0, expenseLimit: 0 };
          
          if (dailyTotals.actualIncome) {
              next.dailyFinanceGoals[today].actualIncome = parseFloat(dailyTotals.actualIncome) || 0;
          }
          if (dailyTotals.actualExpense) {
              next.dailyFinanceGoals[today].actualExpense = parseFloat(dailyTotals.actualExpense) || 0;
          }
      }

      const allExps = financeExp.amount && financeExp.desc ? [...financeExps, financeExp] : financeExps;

      if (allExps.length > 0) {
          if (!next.finances) next.finances = [];
          allExps.forEach((exp, idx) => {
              const txId = Date.now().toString() + "_" + idx;
              next.finances.push({
                  id: txId,
                  type: exp.type || 'expense',
                  date: today,
                  amount: parseFloat(exp.amount) || 0,
                  category: 'Daily Ledger',
                  currency: 'USD',
                  concept: exp.desc
              } as any);

              if (exp.createReminder) {
                  next.reminders.push({
                     id: txId + "_rem",
                     title: `Finance: ${exp.desc} ($${exp.amount})`,
                     dueDate: today,
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

      // Step 4: Reflection
      if (!next.journals[today]) {
        next.journals[today] = { date: today, mood: 0, energy: 0, tags: [], sections: {}, savedAt: new Date().toISOString() };
      }
      
      next.journals[today].mood = mood;
      next.journals[today].energy = energy;
      next.journals[today].tags = selectedTags;
      next.journals[today].sections = { ...next.journals[today].sections, ...sections };

      saveData(next);
      return next;
    });

    onClose();
  };

  const setSweep = (cat: string, item: string, decision: 'done' | 'missed') => {
    setSweepDecisions(prev => ({ ...prev, [`${cat}-${item}`]: decision }));
  };

  const updateHours = (cat: string, item: string, delta: number) => {
    setActualHours(prev => {
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
    setActualReps(prev => {
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
          setSweep(cat, val, 'done');
          return;
      }
      
      setAppState(prev => ({
          ...prev,
          items: {
              ...prev.items,
              [cat]: [...prev.items[cat], val]
          }
      }));
      setActualHours(prev => {
          const catHours = prev[cat] || {};
          return {
              ...prev,
              [cat]: {
                  ...catHours,
                  [val]: 1
              }
          };
      });
      setActualReps(prev => {
          const catReps = prev[cat] || {};
          return {
              ...prev,
              [cat]: {
                  ...catReps,
                  [val]: 1
              }
          };
      });
      setQuickAdd(prev => ({...prev, [cat]: ''}));
      setSweep(cat, val, 'done'); // implicitly assume they are doing it today
  };

  if (showFirstTimeModal) {
    return (
      <div className="fixed inset-0 z-[110] bg-[#0d0d1a]/95 backdrop-blur-xl flex items-center justify-center p-4 text-slate-200">
        <div className="max-w-md w-full bg-[#111120] border border-[#00d0ff]/40 rounded-2xl p-6 shadow-2xl relative overflow-hidden flex flex-col gap-6 animate-fadeIn">
          {/* Decorative subtle header line */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#00d0ff] to-indigo-500" />
          
          <div className="space-y-2">
            <span className="text-[10px] bg-[#00d0ff]/10 text-[#00d0ff] border border-[#00d0ff]/30 px-2 py-0.5 rounded font-mono uppercase tracking-widest">
              Performance Review
            </span>
            <h2 className="text-xl font-bold tracking-tight text-white mt-2 flex items-center gap-2">
              ⚡ Evening Debrief: Tracker Mode
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed pt-1 font-sans">
              Reflect on your achievements, record actual output, review budget impact, and audit daily performance logs.
            </p>
          </div>

          <div className="bg-[#0b0b14] border border-[#2a2a50] rounded-xl p-4 space-y-3 font-mono text-[11px] leading-relaxed text-slate-300">
            <h4 className="font-extrabold text-[#00d0ff] uppercase tracking-widest">// DEBRIEF CORE FUNCTIONS: ACTUALS TRACKING</h4>
            <div className="space-y-2">
              <p className="flex items-start gap-2">
                <span className="text-[#00d0ff] font-bold">1.</span>
                <span><strong>Authoritative Tracker:</strong> This is the tracker phase. Establish and check off your completed items. Mark them as DONE, MISSED, or SKIPPED.</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-[#00d0ff] font-bold">2.</span>
                <span><strong>Record Actuals:</strong> Enter physical actual reps and real completed hours done today. Your original baseline goals are frozen so we can measure exact achievement ratios in the Analytics board!</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-[#00d0ff] font-bold">3.</span>
                <span><strong>Journal & Ledger:</strong> Perform daily emotional rating summaries, enter exact cash outflows, and log written journal reflection prompts to complete the day.</span>
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              localStorage.setItem('hasSeenEveningBriefIntro', 'true');
              setShowFirstTimeModal(false);
            }}
            className="w-full bg-[#00d0ff] hover:bg-[#00b8e6] text-[#0d0d1a] font-extrabold uppercase py-3 rounded-xl text-xs tracking-widest font-mono shadow-[0_4px_12px_rgba(0,208,255,0.2)] transition-all cursor-pointer"
          >
            Got it, let's track progress
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-[#0d0d1a]/95 backdrop-blur-md flex flex-col pt-10 pb-6 px-4 animate-fade-in text-slate-200">
      <div className="max-w-3xl w-full mx-auto flex-1 flex flex-col min-h-0">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8 shrink-0">
            <h2 className="text-sm font-black tracking-widest text-[#00d0ff] uppercase">Evening Debrief</h2>
            <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
                <X size={20} className="text-slate-500" />
            </button>
        </div>

        {/* Progress Bar */}
        <div className="flex gap-2 mb-8 shrink-0">
            {[0,1,2,3].map(i => (
                <div key={i} className={`h-1 flex-1 rounded-full transition-colors duration-500 ${step >= i ? 'bg-[#00d0ff]' : 'bg-slate-800'}`} />
            ))}
        </div>

        {/* Content Area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-none flex flex-col pt-4 pb-12">
            
            {step === 0 && (
                <div className="space-y-8 animate-fade-in">
                    <div>
                        <h1 className="text-3xl font-light mb-2">Sweep & Actuals</h1>
                        <p className="text-slate-400 text-sm">Did you finish these? Log your final status, hours and reps. Adjust if you did anything unplanned.</p>
                        
                        {/* Systemic Performance Tracking vs Goal-Setting Clarifier */}
                        <div className="mt-4 p-3.5 bg-[#00d0ff]/10 border border-[#00d0ff]/30 text-[#00d0ff] text-xs rounded-xl font-mono leading-relaxed max-w-2xl">
                          <p className="font-extrabold uppercase tracking-wider mb-1">⚡ DEBRIEF PHASE: PERFORMANCE LOGS ACTIVE</p>
                          <p className="opacity-90">You are recording actual executed outputs, real completed hours, and repetitions produced today. Inception goal targets are frozen based on the morning setup configuration to measure absolute achievement ratios.</p>
                        </div>
                    </div>

                    <div className="space-y-8">
                        {(['studies', 'habits', 'leisure', 'custom'] as TrackerCategory[]).map(cat => (
                            <div key={cat} className="space-y-3">
                                <h3 className="text-sm font-black uppercase tracking-widest text-[#00d0ff] border-b border-[#2a2a50] pb-2">{cat}</h3>
                                {appState.items[cat].length === 0 && <p className="text-xs text-slate-600">No items.</p>}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {appState.items[cat].map(item => {
                                        const hrs = actualHours[cat]?.[item] || 0;
                                        const rps = actualReps[cat]?.[item] || 0;
                                        // A task is 'done' if the status in appState.daily is 'done', OR sweepDecisions is 'done', 
                                        // or hrs>0/rps>0 and not explicitly missed.
                                        const prevStatus = appState.daily[today]?.[cat]?.[item]?.status;
                                        const dec = sweepDecisions[`${cat}-${item}`];
                                        const isDone = dec === 'done' || (!dec && prevStatus === 'done') || (!dec && prevStatus !== 'missed' && (hrs > 0 || rps > 0));
                                        const isMissed = dec === 'missed' || (!dec && prevStatus === 'missed');
                                        
                                        return (
                                            <div key={item} className={`flex items-center justify-between p-3 rounded-xl border transition-colors gap-2 w-full min-w-0 ${isDone ? 'bg-[#111928] border-[#00d0ff]/40' : (isMissed ? 'bg-red-900/10 border-red-500/20' : 'bg-[#111120] border-[#2a2a50]')}`}>
                                                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                                    <button type="button" onClick={() => setSweep(cat, item, isDone ? 'missed' : 'done')} className={`shrink-0 w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${isDone ? 'bg-[#00d0ff] border-[#00d0ff] text-[#0d0d1a]' : (isMissed ? 'bg-red-500/20 border-red-500/40 text-red-500' : 'border-[#2a2a50] text-transparent hover:border-[#00d0ff]')}`}>
                                                        {isMissed ? <X size={14} strokeWidth={4} /> : <CheckCircle2 size={14} strokeWidth={4} />}
                                                    </button>
                                                    <span className={`font-mono text-xs sm:text-sm leading-tight truncate ${isDone ? 'text-white font-bold' : (isMissed ? 'text-slate-500 line-through' : 'text-slate-400')}`} title={item}>{item}</span>
                                                </div>
                                                
                                                <div className="flex items-center gap-1.5 shrink-0">
                                                    <div className="flex items-center gap-0.5 bg-[#0d0d1a] border border-[#2a2a50] rounded-lg p-0.5 shadow-inner">
                                                        <span className="text-[10px] uppercase text-slate-500 font-mono px-1 hidden lg:block">Reps</span>
                                                        <button type="button" onClick={() => { updateReps(cat, item, -1); setSweep(cat, item, 'done'); }} className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors text-xs">-</button>
                                                        <span className={`w-6 text-center text-xs font-mono font-medium ${rps > 0 ? 'text-[#ff00a0]' : 'text-slate-500'}`}>{rps > 0 ? rps : '--'}</span>
                                                        <button type="button" onClick={() => { updateReps(cat, item, 1); setSweep(cat, item, 'done'); }} className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors text-xs">+</button>
                                                    </div>
                                                    <div className="flex items-center gap-0.5 bg-[#0d0d1a] border border-[#2a2a50] rounded-lg p-0.5 shadow-inner">
                                                        <span className="text-[10px] uppercase text-slate-500 font-mono px-1 hidden lg:block">Hrs</span>
                                                        <button type="button" onClick={() => { updateHours(cat, item, -0.5); setSweep(cat, item, 'done'); }} className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors text-xs">-</button>
                                                        <span className={`w-7 text-center text-xs font-mono font-medium ${hrs > 0 ? 'text-[#00d0ff]' : 'text-slate-500'}`}>{hrs > 0 ? hrs.toFixed(1) : '--'}</span>
                                                        <button type="button" onClick={() => { updateHours(cat, item, 0.5); setSweep(cat, item, 'done'); }} className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors text-xs">+</button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <form onSubmit={(e) => handleQuickAdd(cat, e)} className="flex items-center gap-2 mt-1 sm:col-span-1 md:col-span-2">
                                        <input 
                                            type="text" 
                                            placeholder={`+ Unplanned ${cat} item? Add it...`}
                                            className="w-full bg-[#0d0d1a] border border-[#2a2a50] rounded-xl px-4 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-[#00d0ff]/50 focus:bg-[#111120] transition-colors"
                                            value={quickAdd[cat] || ''}
                                            onChange={e => setQuickAdd(prev => ({...prev, [cat]: e.target.value}))}
                                        />
                                        <button type="submit" disabled={!quickAdd[cat]} className="px-3 py-2 bg-[#00d0ff]/10 text-[#00d0ff] rounded-xl disabled:opacity-30 disabled:cursor-not-allowed">
                                            <Plus size={16} />
                                        </button>
                                    </form>
                                </div>
                            </div>
                        ))}

                        {/* Reminders Sweep */}
                        {(() => {
                            const todaysReminders = (appState.reminders || []).filter(r => r.dueDate === today && r.status === 'pending');
                            if (todaysReminders.length === 0) return null;
                            return (
                                <div className="space-y-3 mt-8">
                                    <h3 className="text-sm font-black uppercase tracking-widest text-[#ffaa00] border-b border-[#2a2a50] pb-2 text-left">Today's Alarms & Reminders</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {todaysReminders.map((rem, index) => {
                                            const dec = sweepDecisions[`reminder-${rem.id}`];
                                            const isDone = dec === 'done';
                                            const isMissed = dec === 'missed';
                                            return (
                                                <div key={`${rem.id}-${index}`} className={`flex items-center justify-between p-3 rounded-xl border transition-colors gap-2 w-full min-w-0 ${isDone ? 'bg-[#111928] border-[#ffaa00]/40' : (isMissed ? 'bg-red-900/10 border-red-500/20' : 'bg-[#111120] border-[#2a2a50]')}`}>
                                                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                                        <button type="button" onClick={() => setSweepDecisions(p => ({...p, [`reminder-${rem.id}`]: isDone ? 'missed' : 'done'}))} className={`shrink-0 w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${isDone ? 'bg-[#ffaa00] border-[#ffaa00] text-[#0d0d1a]' : (isMissed ? 'bg-red-500/20 border-red-500/40 text-red-500' : 'border-[#2a2a50] text-transparent hover:border-[#ffaa00]')}`}>
                                                            {isMissed ? <X size={14} strokeWidth={4} /> : <CheckCircle2 size={14} strokeWidth={4} />}
                                                        </button>
                                                        <div className="flex flex-col min-w-0 text-left">
                                                            <span className={`font-mono text-xs sm:text-sm leading-tight truncate ${isDone ? 'text-white font-bold' : (isMissed ? 'text-slate-500 line-through' : 'text-slate-400')}`} title={rem.title}>{rem.title}</span>
                                                            <span className="text-[10px] text-slate-500 uppercase tracking-widest flex items-center gap-1">
                                                                {rem.type === 'alert' && <Bell size={8} />} {rem.type} {rem.time && `@ ${rem.time}`}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                </div>
            )}

             {step === 1 && (
                <div className="space-y-8 animate-fade-in">
                    <div>
                        <h1 className="text-3xl font-light mb-2">The Ledger</h1>
                        <p className="text-slate-400 text-sm">Review today's financial summary and add any missed transactions.</p>
                    </div>
                    
                    <div className="pt-2">
                       <div className="flex justify-between items-center mb-4 flex-wrap gap-2 w-full">
                           <label className="block text-xs uppercase tracking-widest text-[#ff00a0]">Total Gained & Spent Today</label>
                           <span className="text-[10px] text-slate-500 font-mono italic bg-[#111120] px-2 py-0.5 rounded border border-slate-800">// Pre-loaded from Setup Profile</span>
                       </div>
                       <div className="flex gap-4 mb-8">
                           <input 
                               type="number"
                               placeholder="Total Gained (e.g. 100)"
                               value={dailyTotals.actualIncome}
                               onChange={e => setDailyTotals({...dailyTotals, actualIncome: e.target.value})}
                               className="flex-1 bg-[#111120] border border-[#2a2a50] rounded-xl px-4 py-3 text-[#00ff88] focus:outline-none focus:border-[#00ff88] font-mono text-sm placeholder-slate-600"
                           />
                           <input 
                               type="number"
                               placeholder="Total Spent (e.g. 50)"
                               value={dailyTotals.actualExpense}
                               onChange={e => setDailyTotals({...dailyTotals, actualExpense: e.target.value})}
                               className="flex-1 bg-[#111120] border border-[#2a2a50] rounded-xl px-4 py-3 text-[#ff00a0] focus:outline-none focus:border-[#ff00a0] font-mono text-sm placeholder-slate-600"
                           />
                       </div>

                       <label className="block text-xs uppercase tracking-widest text-[#ff00a0] mb-4">Added Transactions</label>
                       
                       {financeExps.map((exp, idx) => (
                           <div key={idx} className="flex gap-4 mb-4 p-4 bg-[#111120] border border-slate-700 rounded-xl items-center text-sm">
                               <span className={exp.type === 'income' ? 'text-[#00ff88]' : 'text-[#ff00a0]'}>
                                   {exp.type.toUpperCase()}
                               </span>
                               <span className="font-mono text-white">${exp.amount}</span>
                               <span className="text-slate-300 flex-1">{exp.desc}</span>
                               {exp.createReminder && (
                                   <span className="text-[#ff00a0] text-xs"><Bell size={12} className="inline mr-1" /> {exp.reminderTime}</span>
                               )}
                           </div>
                       ))}

                       <div className="flex flex-col sm:flex-row gap-4">
                           <select 
                               value={financeExp.type}
                               onChange={(e) => setFinanceExp({...financeExp, type: e.target.value as 'expense' | 'income'})}
                               className="sm:w-28 bg-[#111120] border border-[#2a2a50] rounded-xl px-2 py-3 text-white focus:outline-none focus:border-[#ff00a0] text-sm uppercase font-black tracking-wider"
                           >
                               <option value="expense">EXPENSE</option>
                               <option value="income">INCOME</option>
                           </select>
                           <input 
                              type="number"
                              placeholder="Amount (10.00)"
                              value={financeExp.amount}
                              onChange={e => setFinanceExp({...financeExp, amount: e.target.value})}
                              className="sm:w-32 bg-[#111120] border border-[#2a2a50] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#ff00a0] font-mono text-sm"
                           />
                           <input 
                              type="text"
                              placeholder="What for? (e.g., Late dinner, Cab)"
                              value={financeExp.desc}
                              onChange={e => setFinanceExp({...financeExp, desc: e.target.value})}
                              className="flex-1 bg-[#111120] border border-[#2a2a50] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#ff00a0] text-sm"
                           />
                           <button 
                              onClick={handleAddExp}
                              className="bg-[#ff00a0]/10 text-[#ff00a0] px-4 py-3 rounded-xl hover:bg-[#ff00a0]/20 transition-colors"
                           >
                               <Plus size={18} />
                           </button>
                       </div>
                       
                       <div className="mt-4 p-4 bg-[#111120] border border-[#2a2a50] rounded-xl flex flex-col sm:flex-row sm:items-center gap-4">
                           <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300 font-medium">
                               <input 
                                   type="checkbox"
                                   checked={financeExp.createReminder}
                                   onChange={e => setFinanceExp({...financeExp, createReminder: e.target.checked})}
                                   className="w-4 h-4 rounded border-slate-700 text-[#ff00a0] focus:ring-[#ff00a0]"
                               />
                               Set Reminder/Alert
                           </label>
                           
                           {financeExp.createReminder && (
                               <div className="flex items-center gap-3">
                                   <input 
                                       type="time"
                                       value={financeExp.reminderTime}
                                       onChange={e => setFinanceExp({...financeExp, reminderTime: e.target.value})}
                                       className="bg-[#0d0d1a] border border-[#2a2a50] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#ff00a0] text-xs"
                                   />
                                   <select 
                                       value={financeExp.alertOffset}
                                       onChange={e => setFinanceExp({...financeExp, alertOffset: e.target.value})}
                                       className="bg-[#0d0d1a] border border-[#2a2a50] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#ff00a0] text-xs"
                                   >
                                       <option value="0">No Alert Popup</option>
                                       <option value="5">5 min before</option>
                                       <option value="15">15 min before</option>
                                       <option value="60">1 hour before</option>
                                   </select>
                               </div>
                           )}
                       </div>

                       <p className="text-xs text-slate-600 mt-3">Added directly to your finance tracker.</p>
                    </div>

                </div>
            )}

             {step === 2 && (
                <div className="space-y-10 animate-fade-in">
                    <div>
                        <h1 className="text-3xl font-light mb-2">Evening Reflection</h1>
                        <p className="text-slate-400 text-sm">How did today go?</p>
                    </div>
                    
                    <div className="flex flex-col md:flex-row gap-8">
                        <div className="flex-1">
                            <label className="block text-xs uppercase tracking-widest text-[#00d0ff] mb-4">End of Day Mood (1 - 5)</label>
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
                            <label className="block text-xs uppercase tracking-widest text-[#00d0ff] mb-4">End of Day Energy (1 - 5)</label>
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
                                            active ? 'border-[#00d0ff] bg-[#00d0ff]/20 text-[#00d0ff]' : 'border-[#2a2a50] bg-[#111120] hover:bg-[#1a1a2e] text-slate-400'
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
                                                className="bg-[#111120] border border-[#00d0ff] rounded-lg px-2 py-1 text-xs uppercase tracking-widest text-[#00d0ff] focus:outline-none flex-1"
                                                autoFocus
                                                onKeyDown={e => { if (e.key === 'Enter') savePromptLabel(prompt.id); if (e.key === 'Escape') setEditingPromptId(null); }}
                                            />
                                            <button onClick={() => savePromptLabel(prompt.id)} className="text-[#00d0ff] hover:text-white p-1">
                                                <Save size={14} />
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <label className="block text-xs uppercase tracking-widest text-[#00d0ff]">{prompt.label}</label>
                                            <button 
                                                onClick={() => { setEditingPromptId(prompt.id); setEditPromptLabel(prompt.label); }} 
                                                className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-[#00d0ff] transition-opacity p-1"
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
                                    placeholder={prompt.placeholder}
                                    className="w-full bg-[#111120] border border-[#2a2a50] rounded-xl p-4 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-[#00d0ff] transition-colors resize-y h-24 whitespace-pre-wrap"
                                />
                            </div>
                        ))}
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

                <div className="flex gap-4">
                     {step === stepsCount - 1 && (
                         <button
                             onClick={() => {
                                handleNext();
                                if (onNavigate) {
                                    setTimeout(() => onNavigate("journal"), 100);
                                }
                             }}
                             className="flex items-center gap-2 px-6 py-4 rounded-xl text-sm font-black uppercase tracking-widest bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-[0_4px_20px_rgba(168,85,247,0.3)] hover:opacity-90 transition-opacity"
                         >
                             Journal & Auto-Log <Sparkles size={16} />
                         </button>
                     )}
                    <button
                        onClick={handleNext}
                        className="flex items-center gap-2 px-8 py-4 rounded-xl text-sm font-black uppercase tracking-widest bg-gradient-to-r from-[#00d0ff] to-blue-500 text-white shadow-[0_4px_20px_rgba(0,208,255,0.3)] hover:opacity-90 transition-opacity"
                    >
                        {step === stepsCount - 1 ? 'Close The Day' : 'Continue'} <ChevronRight size={16} />
                    </button>
                </div>
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
