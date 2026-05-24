import React from 'react';
import { AppState, TrackerCategory } from '../types';
import { fmtDate, fmtShort, getWeek } from '../utils/date';
import { CATS } from '../utils/storage';
import { 
  Play, Calendar, Bell, Flame, Clock, Check, Award, TrendingUp 
} from 'lucide-react';

interface DashboardViewProps {
  state: AppState;
  date: string;
  onNavigate: (viewId: string) => void;
  onSetDate: (date: string) => void;
  onSetTheme: (themeHex: string) => void;
  onSetBgTheme: (bgId: string) => void;
  getDayD: (ds: string, cat: TrackerCategory, item: string) => any;
  onOpenAIAnalyst?: (prompt?: string) => void;
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
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  state,
  date: activeDate,
  onNavigate,
  onSetDate,
  onSetTheme,
  onSetBgTheme,
  getDayD,
  dayStats,
  onOpenAIAnalyst
}) => {
  const today = activeDate; // Using current state date as viewport focal point
  const stats = dayStats(today);

  // Greet depending on time of day
  const hours = new Date().getHours();
  const greeting = hours < 12 ? 'MORNING' : hours < 17 ? 'AFTERNOON' : 'EVENING';

  // Find upcoming reminders
  const upcomingReminders = state.reminders
    .filter(r => r.status !== 'done')
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 5);

  // Best streak
  const streak = React.useMemo(() => {
    let max = 0;
    const calculateStreak = (cat: TrackerCategory, item: string) => {
      let streakCount = 0;
      const todayDate = new Date();
      for (let i = 0; i < 365; i++) {
        const d = new Date(todayDate);
        d.setDate(todayDate.getDate() - i);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const dy = String(d.getDate()).padStart(2, '0');
        const ds = `${y}-${m}-${dy}`;
        
        const entry = getDayD(ds, cat, item);
        const st = entry ? entry.status : 'pending';
        if (st === 'done') {
          streakCount++;
        } else if (st === 'skipped') {
          continue;
        } else {
          break;
        }
      }
      return streakCount;
    };

    CATS.forEach(c => {
      (state.items[c.id] || []).forEach(it => {
        max = Math.max(max, calculateStreak(c.id, it));
      });
    });
    return max;
  }, [state, getDayD]);

  // Weekly average completion percentage
  const weekAvg = React.useMemo(() => {
    const jours = getWeek(today);
    let sum = 0;
    jours.forEach(j => {
      sum += dayStats(j).pct;
    });
    return Math.round(sum / 7);
  }, [today, dayStats]);

  // Satisfactions colors
  const satColors: Record<number, string> = {
    1: 'text-rose-500',
    2: 'text-amber-500',
    3: 'text-yellow-400',
    4: 'text-lime-400',
    5: 'text-emerald-400'
  };

  const weekDays = getWeek(today);

  const handleCopyAIData = () => {
    const summary = `
Date: ${today}
Day Overview:
Completed: ${stats.done}/${stats.total} (${stats.pct}%)
Total Hours Logged: ${stats.hrs.toFixed(1)}h
Overall Satisfaction: ${stats.sat ? stats.sat.toFixed(1) : '-'}/5

Categories:
${CATS.map(c => `- ${c.label}: ${state.items[c.id]?.length || 0} items monitored`).join('\n')}

Upcoming Reminders:
${upcomingReminders.map(r => `- ${r.title} [Priority: ${r.priority}] on ${r.dueDate} ${r.time||''}`).join('\n')}

Focus/Pomo Sessions today:
${state.pomoSessions.filter(p => p.date === today && p.status === 'completed').map(p => `- ${p.task} (${p.duration} mins)`).join('\n')}

Journal Notes for Today:
Mood: ${state.journals[today]?.mood || 'Not logged'}
Energy: ${state.journals[today]?.energy || 'Not logged'}
Tags: ${(state.journals[today]?.tags || []).join(', ')}

Please analyze this data, summarize the productivity trends, and provide 3 actionable insights to improve performance for next week.
    `.trim();
      
    if (onOpenAIAnalyst) {
       onOpenAIAnalyst(summary);
    }
  };

  return (
    <div className="space-y-6">
      {/* Theme Selector */}
      <div className="bg-[#111120] border border-[#2a2a50] rounded-2xl p-4 flex flex-col sm:flex-row gap-6 sm:gap-8">
        <div className="flex-1">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono pb-2">
            SYSTEM COLOR PALETTES
          </h3>
          <div className="flex flex-wrap gap-3">
            {[
              { id: 'Volcanic Orange', hex: '#ff6b1a' },
              { id: 'Cyber Cyan', hex: '#00d4ff' },
              { id: 'Matrix Green', hex: '#00ff88' },
              { id: 'Synthetic Purple', hex: '#aa44ff' },
              { id: 'Neon Rose', hex: '#ff0055' }
            ].map(theme => (
               <div 
                 key={theme.id}
                 onClick={() => onSetTheme(theme.hex)}
                 className={`w-6 h-6 rounded-full cursor-pointer border-2 transition ${state.neonTheme === theme.hex || (!state.neonTheme && theme.hex === '#ff6b1a') ? 'border-white scale-110 shadow-md' : 'border-transparent opacity-50 hover:opacity-100'}`}
                 style={{ backgroundColor: theme.hex, boxShadow: state.neonTheme === theme.hex || (!state.neonTheme && theme.hex === '#ff6b1a') ? `0 0 10px ${theme.hex}` : 'none' }}
                 title={theme.id}
               />
            ))}
          </div>
        </div>
        <div className="flex-1">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono pb-2">
            BACKGROUND THEMES
          </h3>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {[
              { id: 'midnight', label: 'Midnight Blue' },
              { id: 'abyssal', label: 'Abyssal Black' },
              { id: 'hacker', label: 'Hacker Terminal' },
              { id: 'cyber', label: 'Dark Cyber' },
              { id: 'crimson', label: 'Deep Crimson' }
            ].map(bg => (
               <div 
                 key={bg.id}
                 onClick={() => onSetBgTheme(bg.id)}
                 className={`px-3 py-1 text-[10px] uppercase font-bold rounded cursor-pointer border transition ${state.bgTheme === bg.id || (!state.bgTheme && bg.id === 'midnight') ? 'border-[#ff6b1a] text-[#ff6b1a] shadow-md shadow-indigo-500/10' : 'border-[#2a2a50] text-slate-400 hover:text-slate-200'}`}
                 title={bg.label}
               >
                 {bg.id}
               </div>
            ))}
          </div>
        </div>
      </div>

      {/* Overview Head */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#111120] pb-5">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white font-display">
            {greeting === 'MORNING' ? 'Morning' : greeting === 'AFTERNOON' ? 'Afternoon' : 'Evening'}, <span className="text-[#ff6b1a] uppercase">{state.profile.name || 'Explorer'}</span>
          </h2>
          <p className="text-xs uppercase tracking-widest text-[#a1a1aa] mt-1 font-mono">
            // {fmtDate(today)}
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => onNavigate('daily')}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-[#ff6b1a] text-white rounded-xl hover:bg-[#ff9040] transition-all duration-200 uppercase tracking-widest cursor-pointer"
          >
            <Play size={12} className="fill-white" />
            TODAY'S LOG
          </button>
        </div>
      </div>

      {/* Metrics Bento Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <div className="bg-[#111120] border border-[#2a2a50] rounded-2xl p-4 text-center hover:border-slate-700 transition">
          <p className="text-[10px] tracking-widest text-slate-500 uppercase font-black font-mono">DONE</p>
          <p className="text-2xl font-black text-emerald-400 mt-2 font-display">{stats.done}</p>
          <p className="text-[10px] text-slate-500 mt-1">of {stats.total} items</p>
        </div>
        <div className="bg-[#111120] border border-[#2a2a50] rounded-2xl p-4 text-center hover:border-slate-700 transition">
          <p className="text-[10px] tracking-widest text-slate-500 uppercase font-black font-mono">COMPLETION</p>
          <p className="text-2xl font-black text-[#ff6b1a] mt-2 font-display">{stats.pct}%</p>
          <p className="text-[10px] text-slate-500 mt-1">day progress</p>
        </div>
        <div className="bg-[#111120] border border-[#2a2a50] rounded-2xl p-4 text-center hover:border-slate-700 transition">
          <p className="text-[10px] tracking-widest text-slate-500 uppercase font-black font-mono">HOURS</p>
          <p className="text-2xl font-black text-sky-400 mt-2 font-display">{stats.hrs.toFixed(1)}h</p>
          <p className="text-[10px] text-slate-500 mt-1">logged time</p>
        </div>
        <div className="bg-[#111120] border border-[#2a2a50] rounded-2xl p-4 text-center hover:border-slate-700 transition">
          <p className="text-[10px] tracking-widest text-slate-500 uppercase font-black font-mono">REPS</p>
          <p className="text-2xl font-black text-purple-400 mt-2 font-display">{stats.reps}</p>
          <p className="text-[10px] text-slate-500 mt-1">completed reps</p>
        </div>
        <div className="bg-[#111120] border border-[#2a2a50] rounded-2xl p-4 text-center hover:border-slate-700 transition">
          <p className="text-[10px] tracking-widest text-slate-500 uppercase font-black font-mono">FEELING</p>
          <p className={`text-2xl font-black mt-2 font-display ${satColors[Math.round(stats.sat)] || 'text-[#ff6b1a]'}`}>
            {stats.sat > 0 ? stats.sat.toFixed(1) : '—'}
          </p>
          <p className="text-[10px] text-slate-500 mt-1">satisfaction</p>
        </div>
        <div className="bg-[#111120] border border-[#2a2a50] rounded-2xl p-4 text-center hover:border-slate-700 transition">
          <p className="text-[10px] tracking-widest text-slate-500 uppercase font-black font-mono">WEEK AVG</p>
          <p className="text-2xl font-black text-teal-400 mt-2 font-display">{weekAvg}%</p>
          <p className="text-[10px] text-slate-500 mt-1">average score</p>
        </div>
        <div className="bg-[#111120] border border-[#2a2a50] rounded-2xl p-4 text-center hover:border-slate-700 transition col-span-2 md:col-span-1">
          <p className="text-[10px] tracking-widest text-slate-500 uppercase font-black font-mono">BEST STREAK</p>
          <p className="text-2xl font-black text-amber-400 mt-2 flex items-center justify-center gap-1 font-display">
            <Flame size={16} className="text-amber-400 fill-amber-400" />
            {streak}
          </p>
          <p className="text-[10px] text-slate-500 mt-1">active days</p>
        </div>
      </div>

      {/* Two Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Category Breakdown */}
        <div className="bg-[#111120] border border-[#2a2a50] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 border-b border-[#2a2a50] pb-3 mb-4">
            <TrendingUp size={16} className="text-[#ff6b1a]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">TODAY'S CATEGORY PROGRESS</h3>
          </div>
          
          <div className="space-y-3">
            {CATS.map((cat) => {
              const items = state.items[cat.id] || [];
              const done = items.filter(it => getDayD(today, cat.id, it).status === 'done').length;
              const hrs = items.reduce((sum, it) => sum + (getDayD(today, cat.id, it).hours || 0), 0);
              const pct = items.length ? Math.round((done / items.length) * 100) : 0;
              
              return (
                <div 
                  key={cat.id} 
                  onClick={() => onNavigate('daily')}
                  className="group flex items-center justify-between gap-4 p-3 bg-[#0d0d1a] border border-[#2a2a50]/60 rounded-xl hover:border-slate-700 hover:bg-[#111120]/40 transition duration-200 cursor-pointer"
                >
                  <div className="min-w-[110px]">
                    <span 
                      className="text-xs font-extrabold uppercase tracking-wide flex items-center gap-1.5 font-display"
                      style={{ color: cat.neon }}
                    >
                      <span className="text-xs">{cat.icon}</span>
                      {cat.label}
                    </span>
                  </div>
                  
                  <div className="text-[11px] text-slate-400 font-semibold font-mono">
                    {done}/{items.length}
                  </div>

                  <div className="flex-1 max-w-[120px] bg-[#111120] h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500" 
                      style={{ backgroundColor: cat.neon, width: `${pct}%` }}
                    />
                  </div>

                  <div className="flex items-center gap-2 min-w-[70px] justify-end">
                    {hrs > 0 && (
                      <span className="text-[10px] text-slate-500 font-bold uppercase font-mono">{hrs.toFixed(1)}h</span>
                    )}
                    <span 
                      className="text-xs font-bold transition group-hover:scale-105 font-mono" 
                      style={{ color: cat.neon }}
                    >
                      {pct}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Reminders Panel */}
        <div className="bg-[#111120] border border-[#2a2a50] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#2a2a50] pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Bell size={16} className="text-rose-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">UPCOMING CALENDAR & REMINDERS</h3>
            </div>
            <button 
              onClick={() => onNavigate('reminders')}
              className="text-[10px] text-[#ff6b1a] hover:text-[#00d4ff] hover:underline uppercase tracking-wider font-bold font-mono"
            >
              Manage ({state.reminders.filter(r => r.status !== 'done').length}) ▸
            </button>
          </div>

          <div className="space-y-2">
            {upcomingReminders.length > 0 ? (
              upcomingReminders.map(rem => {
                const isOverdue = rem.dueDate < today;
                const isToday = rem.dueDate === today;
                
                return (
                  <div 
                    key={rem.id}
                    className={`flex items-center justify-between p-3 bg-[#0d0d1a]/80 border rounded-xl transition duration-150 ${isOverdue ? 'border-rose-500/20 bg-rose-950/10' : 'border-[#2a2a50]'}`}
                  >
                    <div>
                      <h4 className="text-xs font-bold text-slate-200">{rem.title}</h4>
                      <p className="text-[10px] text-slate-500 mt-1 font-semibold font-mono">
                        {rem.type} {rem.time && `at ${rem.time}`}
                      </p>
                    </div>

                    <span 
                      className={`text-[9px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider font-mono ${
                        isOverdue 
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30' 
                          : isToday 
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' 
                          : 'bg-[#ff6b1a]/10 text-[#ff6b1a] border border-indigo-550/20'
                      }`}
                    >
                      {isOverdue ? 'OVERDUE' : isToday ? 'TODAY' : fmtShort(rem.dueDate)}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="h-44 flex flex-col items-center justify-center border border-dashed border-[#2a2a50] rounded-xl">
                <Bell size={24} className="text-slate-600" />
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-2 font-mono">// No pending alerts</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Week Grid Block */}
      <div className="bg-[#111120] border border-[#2a2a50] rounded-2xl p-5">
        <div className="flex items-center justify-between border-b border-[#2a2a50] pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-[#ff6b1a]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">WEEKLY TRACK TIMELINE</h3>
          </div>
          <span className="text-[10px] text-slate-500 font-mono uppercase">// focus week</span>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day, idx) => {
            const isToday = day === today;
            const ds = dayStats(day);
            const daysNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

            return (
              <div 
                key={day}
                onClick={() => {
                  onSetDate(day);
                  onNavigate('daily');
                }}
                className={`text-center p-3 rounded-xl border transition-all duration-200 cursor-pointer select-none ${
                  isToday 
                    ? 'bg-[#ff6b1a]/10 border-[#ff6b1a]/40 text-[#ff6b1a] shadow-md shadow-indigo-600/5' 
                    : 'bg-[#0d0d1a] border-[#1e1e38] hover:border-slate-700'
                }`}
              >
                <p className={`text-[9px] font-extrabold uppercase ${isToday ? 'text-[#ff6b1a]' : 'text-slate-500'} font-mono`}>
                  {daysNames[idx]}
                </p>
                <p className={`text-sm font-black mt-1.5 ${isToday ? 'text-[#00d4ff]' : 'text-slate-200'} font-display`}>
                  {ds.pct}%
                </p>
                <div className="mt-1 flex items-center justify-center gap-1 text-[9px]">
                  {ds.hrs > 0 ? (
                    <span className="text-sky-400 font-bold font-mono">{ds.hrs.toFixed(1)}h</span>
                  ) : (
                    <span className="text-transparent font-bold font-mono">0h</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
