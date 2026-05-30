import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AppState, JournalEntry } from '../types';
import { fmtShort, fmtDate, todayStr } from '../utils/date';
import { CATS } from '../utils/storage';
import { 
  Hourglass, Calendar, Sparkles, Send, Inbox, ArrowLeftRight, 
  TrendingUp, TrendingDown, BookOpen, Clock, Wallet, Smile, Brain, 
  HelpCircle, Eye, RefreshCw, CheckCircle2, Lock, Unlock, Moon, Zap, Cpu
} from 'lucide-react';

interface TimeCapsuleEngineProps {
  state: AppState;
  activeDate: string; // the date currently being viewed/edited in the main journal
  onSetDate: (date: string) => void;
  onNavigate: (viewId: string) => void;
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
  onSaveJournal: (dateStr: string, updated: Partial<JournalEntry>) => void;
}

interface FutureLetter {
  id: string;
  composedDate: string;
  targetDate: string;
  content: string;
  unlocked: boolean;
}

export const TimeCapsuleEngine: React.FC<TimeCapsuleEngineProps> = ({
  state,
  activeDate,
  onSetDate,
  onNavigate,
  dayStats,
  onSaveJournal,
}) => {
  // Preset comparison options
  const [comparisonDate, setComparisonDate] = useState<string>(() => {
    // Default to exactly 1 week ago
    const active = new Date(activeDate);
    if (isNaN(active.getTime())) return todayStr();
    active.setDate(active.getDate() - 7);
    return active.toISOString().split('T')[0];
  });

  // Writing Letter states
  const [letterContent, setLetterContent] = useState('');
  const [letterOffset, setLetterOffset] = useState<'7' | '30' | '90' | '365' | 'custom'>('7');
  const [customDeliveryDate, setCustomDeliveryDate] = useState('');
  const [letterStatusMsg, setLetterStatusMsg] = useState('');

  // Active section inside the Time Capsule View
  const [activeTab, setActiveTab] = useState<'comparison' | 'future_letters'>('comparison');

  const todayEntry = state.journals[activeDate] || {
    date: activeDate,
    mood: 0,
    energy: 0,
    tags: [],
    sections: {}
  };

  const compEntry = state.journals[comparisonDate] || {
    date: comparisonDate,
    mood: 0,
    energy: 0,
    tags: [],
    sections: {}
  };

  const todayStats = dayStats(activeDate);
  const compStats = dayStats(comparisonDate);

  // Parse all letters directed to activeDate or custom composed letters
  const allLetters = useMemo(() => {
    const letters: FutureLetter[] = [];
    Object.entries(state.journals).forEach(([composedDate, journal]) => {
      if (journal.sections?.['__future_letters']) {
        try {
          const parsed = JSON.parse(journal.sections['__future_letters']);
          if (Array.isArray(parsed)) {
            parsed.forEach((l: any) => {
              letters.push({
                ...l,
                composedDate
              });
            });
          }
        } catch (e) {
          console.error('Error parsing future letters:', e);
        }
      }
    });

    // Make sure they are uniquely sorted
    return letters.sort((a, b) => b.composedDate.localeCompare(a.composedDate));
  }, [state.journals]);

  // Split letters into available and locked
  const unlockedLetters = useMemo(() => {
    return allLetters.filter(l => l.targetDate <= todayStr() || l.unlocked);
  }, [allLetters]);

  const lockedLetters = useMemo(() => {
    return allLetters.filter(l => l.targetDate > todayStr() && !l.unlocked);
  }, [allLetters]);

  // Compute stats comparison insights
  const insights = useMemo(() => {
    const list: string[] = [];
    
    // Mood comparison
    if (todayEntry.mood > 0 && compEntry.mood > 0) {
      const diff = todayEntry.mood - compEntry.mood;
      if (diff > 0) {
        list.push(`🌟 Vitality Surge: Your mood is up by ${diff} points compared to ${fmtShort(comparisonDate)}! Your mindset is currently in a high-frequency zone.`);
      } else if (diff < 0) {
        list.push(`⚠️ Re-centering Needed: Your mood is lower by ${Math.abs(diff)} points than on ${fmtShort(comparisonDate)}. Review your journaling history and focus on restorative activities.`);
      } else {
        list.push(`⚖️ Emotional Balance: Your vibes match perfectly with your emotional state on ${fmtShort(comparisonDate)}.`);
      }
    }

    // Completion rate comparison
    if (todayStats.pct !== compStats.pct) {
      const pctDiff = todayStats.pct - compStats.pct;
      if (pctDiff > 0) {
        list.push(`🚀 Productivity Elevation: Today's completing index is ${pctDiff}% higher. You are seizing compound habits with greater velocity!`);
      } else {
        list.push(`📉 Focus Check: You checked fewer items than on ${fmtShort(comparisonDate)} (-${Math.abs(pctDiff)}%). Try dividing your goals into smaller, low-friction micro-habits.`);
      }
    }

    // Energy comparison
    if (todayEntry.energy > 0 && compEntry.energy > 0) {
      if (todayEntry.energy > compEntry.energy) {
        list.push(`🔋 Recharge Sync: Energy is highly active! You have a higher cellular battery charge compared to the anchor date.`);
      } else if (todayEntry.energy < compEntry.energy) {
        list.push(`🧘 High-Yield Rest: Your energy today is slightly depleted. Keep focus sessions shorter or leverage a pomodoro ratio for recovery.`);
      }
    }

    // Shared Tag synchronicities
    const sharedTags = todayEntry.tags.filter(t => compEntry.tags.includes(t));
    if (sharedTags.length > 0) {
      list.push(`🌀 Synchronicity: Both days share the keywords: "${sharedTags.join(', ')}". These sub-themes represent continuous active nodes in your lifestyle spectrum.`);
    }

    if (list.length === 0) {
      list.push("🧩 No narrative patterns found. Write your journal and complete tracker values to feed the Flashback analysis engine!");
    }

    return list;
  }, [todayEntry, compEntry, todayStats, compStats, comparisonDate]);

  // Composes a letter to the future
  const handleSendLetter = () => {
    if (!letterContent.trim()) {
      setLetterStatusMsg("Please write some content first!");
      return;
    }

    let target = '';
    if (letterOffset === 'custom') {
      if (!customDeliveryDate) {
        setLetterStatusMsg("Please select a target delivery date");
        return;
      }
      target = customDeliveryDate;
    } else {
      const days = parseInt(letterOffset, 10);
      const d = new Date();
      d.setDate(d.getDate() + days);
      target = d.toISOString().split('T')[0];
    }

    if (target <= todayStr()) {
      setLetterStatusMsg("Delivery date must be strictly in the future!");
      return;
    }

    // Structure new letter
    const newLetter = {
      id: Math.random().toString(36).substring(2, 9),
      targetDate: target,
      content: letterContent.trim(),
      unlocked: false
    };

    // We store the letters in the source date's journal entry object
    const currentSourceLetters = todayEntry.sections?.['__future_letters']
      ? JSON.parse(todayEntry.sections['__future_letters'])
      : [];

    currentSourceLetters.push(newLetter);

    onSaveJournal(activeDate, {
      sections: {
        ...todayEntry.sections,
        '__future_letters': JSON.stringify(currentSourceLetters)
      }
    });

    setLetterContent('');
    setCustomDeliveryDate('');
    setLetterStatusMsg("✨ Time Capsule sealed and launched successfully! Composed for delivery on " + fmtShort(target));
    setTimeout(() => setLetterStatusMsg(''), 5000);
  };

  // Toggle letter unlock
  const handleToggleUnlock = (letter: FutureLetter) => {
    const journalOfComposed = state.journals[letter.composedDate];
    if (!journalOfComposed?.sections?.['__future_letters']) return;

    try {
      const parsed = JSON.parse(journalOfComposed.sections['__future_letters']);
      const updated = parsed.map((l: any) => {
        if (l.id === letter.id) {
          return { ...l, unlocked: !l.unlocked };
        }
        return l;
      });

      onSaveJournal(letter.composedDate, {
        sections: {
          ...journalOfComposed.sections,
          '__future_letters': JSON.stringify(updated)
        }
      });
    } catch (e) {
      console.error(e);
    }
  };

  // Preset offset modifiers
  const handlePresetOffset = (days: number) => {
    const base = new Date();
    base.setDate(base.getDate() - days);
    setComparisonDate(base.toISOString().split('T')[0]);
  };

  // Pick random past journal date
  const handleRandomDay = () => {
    const keys = Object.keys(state.journals).filter(k => k !== activeDate && (state.journals[k]?.mood > 0 || Object.keys(state.journals[k]?.sections || {}).length > 0));
    if (keys.length > 0) {
      const rand = keys[Math.floor(Math.random() * keys.length)];
      setComparisonDate(rand);
    } else {
      setLetterStatusMsg("No other historical journal entries found to jump to!");
      setTimeout(() => setLetterStatusMsg(''), 3000);
    }
  };

  // Pick peak productive day
  const handlePeakDay = () => {
    let peakDate = '';
    let peakVal = -1;
    Object.keys(state.journals).forEach(d => {
      const stats = dayStats(d);
      if (stats.pct > peakVal && d !== activeDate) {
        peakVal = stats.pct;
        peakDate = d;
      }
    });

    if (peakDate) {
      setComparisonDate(peakDate);
    } else {
      setLetterStatusMsg("No high performance days tracked in history!");
      setTimeout(() => setLetterStatusMsg(''), 3000);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Visual Banner Header */}
      <div className="relative p-6 rounded-2xl bg-[#0b0b1a]/95 border border-[#ff6b1a]/30 overflow-hidden shadow-[0_0_30px_rgba(255,107,26,0.1)]">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-[#ff6b1a]/15 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-44 h-44 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#ff6b1a]/15 text-[#ff6b1a] shadow-[0_0_15px_rgba(255,107,26,0.3)] animate-pulse">
                <Hourglass size={18} />
              </span>
              <h2 className="text-xl font-extrabold tracking-tight text-white font-display">
                Temporal Time Capsule Dashboard
              </h2>
            </div>
            <p className="text-xs text-slate-400 font-semibold max-w-2xl leading-relaxed">
              Unlock powerful, multi-dimensional correlations across your lifecycle history. Reflect side-by-side with your former self, trace habit variances, and compose smart messages to your future destiny.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('comparison')}
              className={`px-4 py-2 text-[10px] uppercase tracking-widest font-black rounded-lg border font-mono transition duration-200 cursor-pointer flex items-center gap-2 ${
                activeTab === 'comparison'
                  ? 'bg-gradient-to-r from-orange-500 to-[#ff6b1a] text-black border-transparent shadow-[0_0_15px_rgba(255,107,26,0.3)]'
                  : 'bg-[#111124] border-[#25254c] text-slate-400 hover:text-slate-200 hover:bg-[#161633]'
              }`}
            >
              <ArrowLeftRight size={13} />
              Flashback Align
            </button>
            <button
              onClick={() => setActiveTab('future_letters')}
              className={`px-4 py-2 text-[10px] uppercase tracking-widest font-black rounded-lg border font-mono transition duration-200 cursor-pointer flex items-center gap-2 ${
                activeTab === 'future_letters'
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-transparent shadow-[0_0_15px_rgba(124,58,237,0.3)]'
                  : 'bg-[#111124] border-[#25254c] text-slate-400 hover:text-slate-200 hover:bg-[#161633]'
              }`}
            >
              <Inbox size={13} />
              Future Box
              {unlockedLetters.length > 0 && (
                <span className="ml-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
              )}
            </button>
          </div>
        </div>
      </div>

      {letterStatusMsg && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 text-xs bg-[#0f172a] border border-[#ff6b1a]/40 text-[#ff6b1a] rounded-xl font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(255,107,26,0.1)]"
        >
          <Sparkles size={14} className="shrink-0 text-orange-400" />
          <span>{letterStatusMsg}</span>
        </motion.div>
      )}

      {/* Main Panel views */}
      <AnimatePresence mode="wait">
        {activeTab === 'comparison' ? (
          <motion.div
            key="comparison-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Control Panel / Chrono Controller */}
            <div className="bg-[#111124]/80 border border-[#232348] rounded-2xl p-5 space-y-4">
              <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-black text-rose-450 tracking-widest font-mono text-[#ff6b1a]">CHRONOMETER TUNING BLOCK</span>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="text-xs font-bold text-slate-200">Comparing active date:</span>
                    <span className="text-xs font-bold bg-[#1a1a36] text-[#00ff88] p-1 px-2.5 rounded border border-[#2c2c5e] font-mono">{fmtShort(activeDate)}</span>
                    <span className="text-xs font-bold text-slate-550 text-slate-500">with historic destination:</span>
                    <input 
                      type="date"
                      value={comparisonDate}
                      onChange={e => setComparisonDate(e.target.value)}
                      className="bg-[#0c0c16] border border-[#2a2a50] text-[#ff6b1a] rounded px-2.5 py-1 text-xs font-mono font-bold focus:outline-none focus:border-[#ff6b1a]/60 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Preset shortcuts */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <button onClick={() => handlePresetOffset(7)} className="px-2.5 py-1 text-[9.5px] font-bold font-mono uppercase bg-[#181832] hover:bg-[#ff6b1a]/25 text-slate-450 hover:text-[#ff6b1a] border border-[#272753] rounded transition cursor-pointer">7D Ago</button>
                  <button onClick={() => handlePresetOffset(30)} className="px-2.5 py-1 text-[9.5px] font-bold font-mono uppercase bg-[#181832] hover:bg-[#ff6b1a]/25 text-slate-450 hover:text-[#ff6b1a] border border-[#272753] rounded transition cursor-pointer">30D Ago</button>
                  <button onClick={() => handlePresetOffset(365)} className="px-2.5 py-1 text-[9.5px] font-bold font-mono uppercase bg-[#181832] hover:bg-[#ff6b1a]/25 text-slate-450 hover:text-[#ff6b1a] border border-[#272753] rounded transition cursor-pointer">1Y Ago</button>
                  <button onClick={handleRandomDay} className="px-2.5 py-1 text-[9.5px] font-bold font-mono uppercase bg-[#1d143c] hover:bg-purple-500/25 text-[#a855f7] hover:text-purple-300 border border-purple-500/30 rounded transition cursor-pointer flex items-center gap-1">🎲 Random Day</button>
                  <button onClick={handlePeakDay} className="px-2.5 py-1 text-[9.5px] font-bold font-mono uppercase bg-[#122329] hover:bg-[#00ff88]/25 text-[#00ff88] hover:text-emerald-300 border border-emerald-500/30 rounded transition cursor-pointer flex items-center gap-1">🏆 Peak Day</button>
                </div>
              </div>
            </div>

            {/* Side-by-Side Dual Deck */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              
              {/* PRIMARY SCREEN: COMPOSING PRESENT DAY */}
              <div className="bg-[#111124]/90 border border-[#24244b] rounded-2xl overflow-hidden shadow-lg transition hover:border-[#ff6b1a]/30">
                {/* Header ribbon */}
                <div className="bg-gradient-to-r from-orange-500/20 to-transparent p-4 border-b border-[#24244b] flex items-center justify-between">
                  <div>
                    <span className="text-[8px] uppercase tracking-widest font-black text-[#ff6b1a] font-mono">Present Focus State</span>
                    <h3 className="text-base font-extrabold text-white font-display mt-0.5">{fmtDate(activeDate)}</h3>
                  </div>
                  <span className="text-[10px] font-bold font-mono text-[#ff6b1a] p-1 px-2.5 bg-[#ff6b1a]/10 rounded border border-[#ff6b1a]/20">CURRENT ANCHOR</span>
                </div>

                <div className="p-5 space-y-5">
                  {/* Mood Vitality Row */}
                  <div className="p-3.5 bg-[#090914] rounded-xl border border-[#1b1b36] space-y-3.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[9.5px] font-black uppercase text-slate-500 tracking-wider font-mono">Mindscape & Resiliance</span>
                      <span className="text-xs font-black text-rose-300 font-mono">🔋 Energy: {todayEntry.energy ? `${todayEntry.energy}/5` : 'None'}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-3xl filter drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]">
                        {todayEntry.mood === 1 ? '😞' : todayEntry.mood === 2 ? '😕' : todayEntry.mood === 3 ? '😐' : todayEntry.mood === 4 ? '😊' : todayEntry.mood === 5 ? '🌟' : '❔'}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex justify-between text-[10px] text-slate-450 font-bold">
                          <span>Emotional Rating</span>
                          <span>{todayEntry.mood ? `${todayEntry.mood} / 5` : 'Not recorded'}</span>
                        </div>
                        <div className="w-full bg-slate-800/80 h-2 rounded-full overflow-hidden">
                          <div className="bg-[#ff6b1a] h-full transition-all duration-300 shadow-[0_0_10px_rgba(255,107,26,0.6)]" style={{ width: `${(todayEntry.mood / 5) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Core Metrics Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-[#090914] rounded-xl border border-[#1b1b36]">
                      <span className="text-[8.5px] font-bold uppercase text-slate-505 tracking-wider font-mono text-slate-500 block mb-1">COMPLETION RATE</span>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-black font-display text-emerald-400">{todayStats.pct}%</span>
                        <span className="text-[10px] text-slate-550 font-mono text-slate-500">({todayStats.done}/{todayStats.total})</span>
                      </div>
                      <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden mt-2">
                        <div className="bg-emerald-400 h-full transition-all duration-300" style={{ width: `${todayStats.pct}%` }} />
                      </div>
                    </div>

                    <div className="p-3 bg-[#090914] rounded-xl border border-[#1b1b36]">
                      <span className="text-[8.5px] font-bold uppercase text-slate-505 tracking-wider font-mono text-slate-500 block mb-1">PRODUCTIVE TIMELINES</span>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-black font-display text-indigo-400">{todayStats.hrs.toFixed(1)} hrs</span>
                        <span className="text-[10px] text-slate-550 font-mono text-slate-550 text-indigo-300/60">({todayStats.reps} reps)</span>
                      </div>
                      <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden mt-2">
                        <div className="bg-indigo-400 h-full transition-all duration-300" style={{ width: `${Math.min((todayStats.hrs / 8) * 100, 100)}%` }} />
                      </div>
                    </div>
                  </div>

                  {/* Custom fields answers */}
                  <div className="space-y-2.5">
                    <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono flex items-center gap-1.5">
                      <BookOpen size={12} className="text-[#ff6b1a]" /> Narrative Slices
                    </h4>
                    
                    <div className="space-y-2 max-h-[220px] overflow-y-auto scrollbar-none pr-1">
                      {state.journalPrompts.map(p => {
                        const ans = todayEntry.sections?.[p.id];
                        if (!ans) return null;
                        return (
                          <div key={p.id} className="p-3 rounded-lg bg-[#0d0d1c] border border-[#1e1e3b]">
                            <span className="text-[9px] font-black uppercase text-[#ff6b1a]/80 font-mono tracking-wider">{p.label}</span>
                            <p className="text-xs text-slate-350 bg-[#070710]/40 p-2 rounded border border-[#141427]/40 mt-1.5 italic text-slate-300 font-medium leading-relaxed">&ldquo;{ans}&rdquo;</p>
                          </div>
                        );
                      })}
                      {Object.keys(todayEntry.sections || {}).filter(k => !k.startsWith('__')).length === 0 && (
                        <p className="text-xs text-slate-600 font-mono italic">No journal entries written yet for this day.</p>
                      )}
                    </div>
                  </div>

                  {/* Present Tag Index */}
                  {todayEntry.tags.length > 0 && (
                    <div className="pt-3 border-t border-[#181832] flex flex-wrap gap-1.5 items-center">
                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 font-mono mr-1">Present Tags:</span>
                      {todayEntry.tags.map(t => (
                        <span key={t} className="p-1 px-2.5 bg-[#090914] text-[9.5px] font-mono font-bold text-orange-400 border border-[#ff6b1a]/25 rounded-md">#{t}</span>
                      ))}
                    </div>
                  )}

                </div>
              </div>

              {/* SECONDARY SCREEN: HISTORICAL REFLECTION DESTINATION */}
              <div className="bg-[#111124]/90 border border-[#24244b] rounded-2xl overflow-hidden shadow-lg transition hover:border-purple-500/30">
                {/* Header ribbon */}
                <div className="bg-gradient-to-r from-purple-500/20 to-transparent p-4 border-b border-[#24244b] flex items-center justify-between">
                  <div>
                    <span className="text-[8px] uppercase tracking-widest font-black text-purple-400 font-mono">Historical Record</span>
                    <h3 className="text-base font-extrabold text-white font-display mt-0.5">{fmtDate(comparisonDate)}</h3>
                  </div>
                  <button 
                    onClick={() => {
                      onSetDate(comparisonDate);
                      onNavigate('journal');
                    }}
                    className="text-[10px] font-bold font-mono text-purple-400 p-1 px-2.5 bg-purple-500/10 hover:bg-purple-500/25 rounded border border-purple-500/20 transition cursor-pointer"
                  >
                    🚀 TELEPORT HERE
                  </button>
                </div>

                <div className="p-5 space-y-5">
                  {/* Mood Vitality Row */}
                  <div className="p-3.5 bg-[#090914] rounded-xl border border-[#1b1b36] space-y-3.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[9.5px] font-black uppercase text-slate-500 tracking-wider font-mono">Mindscape & Resiliance</span>
                      <span className="text-xs font-black text-violet-300 font-mono">🔋 Energy: {compEntry.energy ? `${compEntry.energy}/5` : 'None'}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-3xl filter drop-shadow-[0_0_10px_rgba(255,255,255,0.1)] animate-pulse">
                        {compEntry.mood === 1 ? '😞' : compEntry.mood === 2 ? '😕' : compEntry.mood === 3 ? '😐' : compEntry.mood === 4 ? '😊' : compEntry.mood === 5 ? '🌟' : '❔'}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex justify-between text-[10px] text-slate-450 font-bold">
                          <span>Emotional Rating</span>
                          <span>{compEntry.mood ? `${compEntry.mood} / 5` : 'Not recorded'}</span>
                        </div>
                        <div className="w-full bg-slate-800/80 h-2 rounded-full overflow-hidden">
                          <div className="bg-purple-500 h-full transition-all duration-300 shadow-[0_0_10px_rgba(168,85,247,0.6)]" style={{ width: `${(compEntry.mood / 5) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Core Metrics Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-[#090914] rounded-xl border border-[#1b1b36]">
                      <span className="text-[8.5px] font-bold uppercase text-slate-505 tracking-wider font-mono text-slate-500 block mb-1">COMPLETION RATE</span>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-black font-display text-emerald-400">{compStats.pct}%</span>
                        <span className="text-[10px] text-slate-550 font-mono text-slate-500">({compStats.done}/{compStats.total})</span>
                      </div>
                      <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden mt-2">
                        <div className="bg-emerald-400 h-full transition-all duration-300" style={{ width: `${compStats.pct}%` }} />
                      </div>
                    </div>

                    <div className="p-3 bg-[#090914] rounded-xl border border-[#1b1b36]">
                      <span className="text-[8.5px] font-bold uppercase text-slate-505 tracking-wider font-mono text-slate-500 block mb-1">PRODUCTIVE TIMELINES</span>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-black font-display text-indigo-400">{compStats.hrs.toFixed(1)} hrs</span>
                        <span className="text-[10px] text-slate-550 font-mono text-indigo-300/60">({compStats.reps} reps)</span>
                      </div>
                      <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden mt-2">
                        <div className="bg-indigo-400 h-full transition-all duration-300" style={{ width: `${Math.min((compStats.hrs / 8) * 100, 100)}%` }} />
                      </div>
                    </div>
                  </div>

                  {/* Custom fields answers */}
                  <div className="space-y-2.5">
                    <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono flex items-center gap-1.5">
                      <BookOpen size={12} className="text-purple-400" /> Narrative Slices
                    </h4>
                    
                    <div className="space-y-2 max-h-[220px] overflow-y-auto scrollbar-none pr-1">
                      {state.journalPrompts.map(p => {
                        const ans = compEntry.sections?.[p.id];
                        if (!ans) return null;
                        return (
                          <div key={p.id} className="p-3 rounded-lg bg-[#0d0d1c] border border-[#1e1e3b]">
                            <span className="text-[9px] font-black uppercase text-purple-400 font-mono tracking-wider">{p.label}</span>
                            <p className="text-xs text-slate-350 bg-[#070710]/40 p-2 rounded border border-[#141427]/40 mt-1.5 italic text-slate-300 font-medium leading-relaxed">&ldquo;{ans}&rdquo;</p>
                          </div>
                        );
                      })}
                      {Object.keys(compEntry.sections || {}).filter(k => !k.startsWith('__')).length === 0 && (
                        <p className="text-xs text-slate-600 font-mono italic text-slate-500">No journal entries written for this past reference date.</p>
                      )}
                    </div>
                  </div>

                  {/* Past Tag Index */}
                  {compEntry.tags.length > 0 && (
                    <div className="pt-3 border-t border-[#181832] flex flex-wrap gap-1.5 items-center">
                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 font-mono mr-1">Former Tags:</span>
                      {compEntry.tags.map(t => (
                        <span key={t} className="p-1 px-2.5 bg-[#090914] text-[9.5px] font-mono font-bold text-indigo-451 text-indigo-400 border border-purple-500/25 rounded-md">#{t}</span>
                      ))}
                    </div>
                  )}

                </div>
              </div>

            </div>

            {/* Smart Chrono Insights Panel */}
            <div className="bg-[#111124] border border-[#232349] rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-[#1b1b36] pb-3">
                <Cpu size={14} className="text-[#ff6b1a] shrink-0" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-250 font-mono">
                  Comparative Analysis & Life Synchronization Insights
                </h3>
              </div>

              <div className="space-y-3">
                {insights.map((ins, i) => (
                  <div key={i} className="flex gap-3 items-start text-xs font-medium text-slate-300 leading-relaxed bg-[#0a0a14]/60 p-3 rounded-xl border border-[#1e1e3a]/40">
                    <span className="text-[#ff6b1a]">⚡</span>
                    <p>{ins}</p>
                  </div>
                ))}
              </div>
            </div>

          </motion.div>
        ) : (
          <motion.div
            key="future-letters-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            
            {/* Pen Future Letter Column */}
            <div className="lg:col-span-2 bg-[#111124]/90 border border-[#232349] p-5 rounded-2xl space-y-4">
              <div className="border-b border-[#222244] pb-3 flex items-center gap-2">
                <Send size={15} className="text-violet-400" />
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-200">Seal a Future Delivery Letter</h3>
                  <p className="text-[10px] text-slate-500 font-mono uppercase mt-0.5">Pen an honest, deep letter to your future destiny</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 font-mono">Your Message</label>
                  <textarea
                    rows={7}
                    placeholder="Dear Future Self, what goals did we complete? Did we maintain the core integrity of our habit codes? How are we doing? Let me remind you of current wisdom..."
                    value={letterContent}
                    onChange={e => setLetterContent(e.target.value)}
                    className="w-full bg-[#0a0a14] border border-[#222245] rounded-xl p-4 text-xs font-medium text-slate-200 placeholder-slate-600 focus:outline-none focus:border-violet-500/60 leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 font-mono">Target Delivery Date</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button 
                        onClick={() => setLetterOffset('7')} 
                        className={`py-2 text-[10px] font-mono font-bold rounded-lg border transition ${
                          letterOffset === '7' ? 'bg-violet-950/60 text-violet-300 border-violet-500/60' : 'bg-[#090914] border-[#222245] text-slate-450 hover:border-slate-700'
                        }`}
                      >
                        In 7 days
                      </button>
                      <button 
                        onClick={() => setLetterOffset('30')} 
                        className={`py-2 text-[10px] font-mono font-bold rounded-lg border transition ${
                          letterOffset === '30' ? 'bg-violet-950/60 text-violet-300 border-violet-500/60' : 'bg-[#090914] border-[#222245] text-slate-450 hover:border-slate-700'
                        }`}
                      >
                        In 30 days
                      </button>
                      <button 
                        onClick={() => setLetterOffset('365')} 
                        className={`py-2 text-[10px] font-mono font-bold rounded-lg border transition ${
                          letterOffset === '365' ? 'bg-violet-950/60 text-violet-300 border-violet-500/60' : 'bg-[#090914] border-[#222245] text-slate-450 hover:border-slate-700'
                        }`}
                      >
                        In 1 Year
                      </button>
                    </div>

                    <div className="pt-2">
                      <button 
                        onClick={() => setLetterOffset('custom')} 
                        className={`w-full py-2 text-[10px] font-mono font-bold rounded-lg border transition ${
                          letterOffset === 'custom' ? 'bg-violet-950/60 text-violet-300 border-violet-500/60' : 'bg-[#090914] border-[#222245] text-slate-450 hover:border-slate-700'
                        }`}
                      >
                        Custom Delivery Selector
                      </button>
                    </div>
                  </div>

                  {letterOffset === 'custom' && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="space-y-1 flex flex-col justify-end"
                    >
                      <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 font-mono">Choose Specific Date</label>
                      <input 
                        type="date"
                        value={customDeliveryDate}
                        onChange={e => setCustomDeliveryDate(e.target.value)}
                        min={todayStr()}
                        className="bg-[#0a0a14] border border-[#222245] text-slate-300 rounded px-3 py-2 text-xs font-mono font-bold focus:outline-none focus:border-violet-500/60 w-full"
                      />
                    </motion.div>
                  )}
                </div>

                <button
                  onClick={handleSendLetter}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold tracking-wider uppercase text-xs hover:shadow-[0_0_20px_rgba(124,58,237,0.4)] transition duration-200 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Send size={13} />
                  Seal Time Capsule & Send to Future
                </button>
              </div>
            </div>

            {/* Matures Letters Column */}
            <div className="bg-[#111124]/90 border border-[#232349] p-5 rounded-2xl space-y-4">
              <div className="border-b border-[#222244] pb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Inbox size={15} className="text-[#ff6b1a]" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-200">Historical Mailbox</h3>
                </div>
                <span className="text-[9.5px] font-mono bg-indigo-950 text-indigo-300 p-1 rounded font-bold">{allLetters.length} letter(s)</span>
              </div>

              <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                {/* UNLOCKED / MATURED LETTERS */}
                {unlockedLetters.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[9px] font-black tracking-widest text-[#00ff88] uppercase block font-mono">🔓 Matured / Past Self Wisdom</span>
                    {unlockedLetters.map(letter => {
                      const isUnlockingNow = letter.unlocked;
                      return (
                        <div key={letter.id} className="p-3.5 bg-[#0a0a15] rounded-xl border border-emerald-500/25 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <span className="text-[8px] uppercase tracking-widest font-black text-slate-500 font-mono">COMPOSED ON</span>
                              <p className="text-xs font-black text-indigo-300 font-mono">{fmtShort(letter.composedDate)}</p>
                            </div>
                            <button
                              onClick={() => handleToggleUnlock(letter)}
                              className="text-[9px] font-bold font-mono text-emerald-400 p-1 px-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded cursor-pointer"
                            >
                              {isUnlockingNow ? "HIDE" : "READ NOW"}
                            </button>
                          </div>

                          {isUnlockingNow && (
                            <motion.div 
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              className="p-3 bg-[#111122] rounded-lg border border-[#2a2a4c] text-xs font-medium text-slate-250 italic leading-relaxed border-l-2 border-l-emerald-400 text-slate-300"
                            >
                              &ldquo;{letter.content}&rdquo;
                            </motion.div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* LOCKED / MATURING LETTERS */}
                {lockedLetters.length > 0 && (
                  <div className="space-y-2 pt-3 border-t border-[#181832]">
                    <span className="text-[9px] font-black tracking-widest text-[#ff6b1a] uppercase block font-mono">🔒 SINKING IN SPACE-TIME / SEALED</span>
                    {lockedLetters.map(letter => {
                      const remainingMs = new Date(letter.targetDate).getTime() - new Date().getTime();
                      const remainingDays = Math.max(0, Math.ceil(remainingMs / (1000 * 60 * 60 * 24)));
                      return (
                        <div key={letter.id} className="p-3 bg-[#0c0c16] rounded-xl border border-orange-500/15 space-y-2 relative group overflow-hidden">
                          <div className="absolute top-0 right-0 w-24 h-12 bg-orange-500/5 rotate-12 filter blur-md pointer-events-none" />
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">Matures in:</span>
                            <span className="text-[10px] font-black text-orange-400 font-mono flex items-center gap-1">
                              <Lock size={10} /> {remainingDays} Days Left
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300">
                            <span>From: {fmtShort(letter.composedDate)}</span>
                            <span>Target: {fmtShort(letter.targetDate)}</span>
                          </div>

                          {/* Lock progress */}
                          <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                            <div className="bg-orange-500 h-full transition-all duration-300 shadow-[0_0_10px_rgba(249,115,22,0.4)]" style={{ width: `${Math.max(10, Math.min(100, (1 - remainingDays / 30) * 100))}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {allLetters.length === 0 && (
                  <div className="p-8 text-center space-y-2">
                    <Moon size={24} className="mx-auto text-slate-600 animate-pulse" />
                    <p className="text-xs text-slate-500 font-mono italic">No time-drift letters composed inside this sandbox yet.</p>
                  </div>
                )}
              </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
