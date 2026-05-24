import React, { useState } from 'react';
import { AppState, TrackerCategory } from '../types';
import { MN, fmtShort, fmtDate } from '../utils/date';
import { CATS } from '../utils/storage';
import { Calendar, Layers, X, ArrowRight } from 'lucide-react';

interface CalendarViewProps {
  state: AppState;
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
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  state,
  onSetDate,
  onNavigate,
  dayStats
}) => {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const handleMonthChange = (offset: number) => {
    let nextMonth = currentMonth + offset;
    let nextYear = currentYear;

    if (nextMonth < 0) {
      nextMonth = 11;
      nextYear--;
    } else if (nextMonth > 11) {
      nextMonth = 0;
      nextYear++;
    }

    setCurrentMonth(nextMonth);
    setCurrentYear(nextYear);
  };

  const todayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const getDaysInMonthGrid = () => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDayNum = new Date(currentYear, currentMonth + 1, 0).getDate();
    // Weekday starting of month (0 = Sun, 1 = Mon, ..., 6 = Sat)
    // Convert to Monday focused (0 = Mon, ..., 6 = Sun)
    let startDayOfWeek = firstDay.getDay();
    startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

    const cells: { dateStr: string; dayNum: number; empty: boolean }[] = [];

    // Pre-pends blank cells
    for (let i = 0; i < startDayOfWeek; i++) {
      cells.push({ dateStr: '', dayNum: 0, empty: true });
    }

    // Daily active cells
    for (let d = 1; d <= lastDayNum; d++) {
      const formattedDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({ dateStr: formattedDate, dayNum: d, empty: false });
    }

    return cells;
  };

  const gridCells = getDaysInMonthGrid();
  const dayNames = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

  const getHeatmapColor = (pct: number) => {
    if (pct === 0) return 'bg-[#111120] border-transparent hover:border-[#ff6b1a] text-slate-600';
    if (pct < 25) return 'bg-emerald-500/10 hover:border-emerald-400/50 text-emerald-300';
    if (pct < 50) return 'bg-emerald-500/25 hover:border-emerald-400/50 text-emerald-200';
    if (pct < 75) return 'bg-emerald-500/40 hover:border-emerald-400 text-emerald-100';
    if (pct < 100) return 'bg-emerald-500/60 hover:border-emerald-300 text-emerald-500';
    return 'bg-emerald-400 hover:border-white text-black font-extrabold';
  };

  return (
    <div className="space-y-6">
      {/* Month nav Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#1e1e38] pb-4">
        <div>
          <h2 className="text-xl font-extrabold tracking-wider text-[#ff6b1a]">
            CALENDAR <span className="text-slate-100 font-extrabold">VIEW</span>
          </h2>
          <p className="text-xs uppercase tracking-widest text-slate-500 mt-1">
            CLICK ANY DAY TO REFLECT CHECKLISTS AND JOURNAL
          </p>
        </div>

        <div className="flex items-center gap-2 bg-[#0d0d1a] border border-[#2a2a50] p-1 rounded-lg">
          <button 
            onClick={() => handleMonthChange(-1)}
            className="px-2.5 py-1 text-xs font-bold text-slate-200 hover:bg-[#1c1c35] transition rounded"
          >
            ◀ PREV
          </button>
          <span className="text-xs font-black text-[#00d4ff] px-4 py-1 tracking-widest">
            {MN[currentMonth].toUpperCase()} {currentYear}
          </span>
          <button 
            onClick={() => handleMonthChange(1)}
            className="px-2.5 py-1 text-xs font-bold text-slate-200 hover:bg-[#1c1c35] transition rounded"
          >
            NEXT ▶
          </button>
        </div>
      </div>

      {/* Main Heatmap block */}
      <div className="bg-[#0d0d1a]/95 border border-[#1e1e38] rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 border-b border-[#111120] pb-2">
          <Calendar size={14} className="text-[#00ff88]" />
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">COMPLETION SCORING HEATMAP</h3>
        </div>

        {/* Days label columns */}
        <div className="grid grid-cols-7 gap-2 text-center text-[9px] font-black text-slate-500 tracking-wider">
          {dayNames.map(d => <div key={d}>{d}</div>)}
        </div>

        {/* Calendar Heatmap Grid Cells */}
        <div className="grid grid-cols-7 gap-1.5 pt-1">
          {gridCells.map((cell, idx) => {
            if (cell.empty) {
              return <div key={`empty-${idx}`} className="aspect-square bg-transparent" />;
            }

            const stats = dayStats(cell.dateStr);
            const isToday = cell.dateStr === todayStr();
            const colorClass = getHeatmapColor(stats.pct);
            
            const jEntry = state.journals[cell.dateStr];
            const hasJournal = jEntry ? Object.keys(jEntry.sections || {}).length > 0 : false;
            const hasLocation = !!jEntry?.location;
            const hasSketch = !!jEntry?.sketches?.length;
            const hasFin = state.finances?.some(f => f.date === cell.dateStr);
            const hasReminder = state.reminders?.some(r => r.dueDate === cell.dateStr && r.status !== 'done');

            const hasExpedition = state.expeditions?.some(e => e.dateStart === cell.dateStr || (e.dateStart && e.dateEnd && cell.dateStr >= e.dateStart && cell.dateStr <= e.dateEnd));

            return (
              <div
                key={cell.dateStr}
                onClick={() => setSelectedDate(cell.dateStr)}
                className={`aspect-square sm:aspect-auto sm:h-16 rounded-lg flex flex-col items-center justify-center text-xs font-bold border transition cursor-pointer select-none relative ${colorClass} ${
                  isToday ? 'border-[#00d4ff] shadow-[0_0_8px_rgba(0,212,255,0.25)]' : 'border-transparent'
                }`}
                title={`${fmtDate(cell.dateStr)}: ${stats.pct}% score (${stats.done}/${stats.total} done)`}
              >
                <span>{cell.dayNum}</span>
                {stats.hrs > 0 && (
                  <span className="text-[7px] sm:text-[9px] font-semibold opacity-75 font-mono mt-0.5">{stats.hrs.toFixed(1)}h</span>
                )}
                
                {/* Data dots integrated */}
                <div className="absolute bottom-1 right-1 flex flex-row-reverse gap-0.5 flex-wrap w-full justify-end px-1 sm:bottom-1.5 sm:right-1.5">
                  {hasJournal && <div className="w-[3px] h-[3px] sm:w-[5px] sm:h-[5px] rounded-full bg-[#aa44ff] shadow-[0_0_4px_#aa44ff]" title="Journal logged"></div>}
                  {hasLocation && <div className="w-[3px] h-[3px] sm:w-[5px] sm:h-[5px] rounded-full bg-[#00d4ff] shadow-[0_0_4px_#00d4ff]" title="GPS Block"></div>}
                  {hasSketch && <div className="w-[3px] h-[3px] sm:w-[5px] sm:h-[5px] rounded-full bg-[#ffaa44] shadow-[0_0_4px_#ffaa44]" title="Sketch logged"></div>}
                  {hasFin && <div className="w-[3px] h-[3px] sm:w-[5px] sm:h-[5px] rounded-full bg-emerald-400 shadow-[0_0_4px_#10b981]" title="Finances logged"></div>}
                  {hasExpedition && <div className="w-[3px] h-[3px] sm:w-[5px] sm:h-[5px] rounded-full bg-[#ff6b1a] shadow-[0_0_4px_#ff6b1a]" title="Expedition Active"></div>}
                  {hasReminder && <div className="w-[3px] h-[3px] sm:w-[5px] sm:h-[5px] rounded-full bg-rose-500 shadow-[0_0_4px_#f43f5e]" title="Active Reminders"></div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Category Wise Heatmaps Overlay grids */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {CATS.map((cat) => (
          <div key={cat.id} className="bg-[#0d0d1a] border border-[#1e1e38] rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 border-b border-[#111120] pb-2 text-slate-300">
              <Layers size={13} style={{ color: cat.neon }} />
              <span className="text-xs font-black uppercase tracking-wider" style={{ color: cat.neon }}>
                {cat.icon} {cat.label} Grid
              </span>
            </div>

            {/* Days labels */}
            <div className="grid grid-cols-7 gap-1 text-center text-[7px] font-black text-slate-600 tracking-wider">
              {dayNames.map(d => <div key={d}>{d.slice(0,2)}</div>)}
            </div>

            {/* Mini matrix grid cells */}
            <div className="grid grid-cols-7 gap-1">
              {gridCells.map((cell, idx) => {
                if (cell.empty) {
                  return <div key={`empty-${idx}-cat-${cat.id}`} className="aspect-square bg-transparent" />;
                }

                // Calculate category fraction
                const items = state.items[cat.id] || [];
                let doneCount = 0;
                items.forEach(it => {
                  const entry = state.daily[cell.dateStr]?.[cat.id]?.[it];
                  if (entry && entry.status === 'done') doneCount++;
                });

                const fraction = items.length ? doneCount / items.length : 0;
                let hLevel = 0;
                if (fraction > 0) {
                  hLevel = fraction === 1 ? 5 : Math.ceil(fraction * 4);
                }

                // Neon backgrounds levels
                const lightsClasses = [
                  'bg-[#111120] hover:border-slate-700 hover:scale-105 transition',
                  'opacity-30 hover:opacity-100 transition hover:scale-105',
                  'opacity-50 hover:opacity-100 transition hover:scale-105',
                  'opacity-70 hover:opacity-100 transition hover:scale-105',
                  'opacity-90 hover:opacity-100 transition hover:scale-105',
                  'opacity-100 font-extrabold text-black hover:scale-105 hover:border-white transition'
                ];

                const customStyle: React.CSSProperties = hLevel > 0 ? {
                  backgroundColor: cat.neon,
                  color: hLevel === 5 ? '#000' : cat.neon
                } : {};

                return (
                  <div
                    key={`cat-${cat.id}-${cell.dateStr}`}
                    onClick={() => setSelectedDate(cell.dateStr)}
                    className={`aspect-square text-[9px] font-bold rounded flex items-center justify-center cursor-pointer border border-transparent border-slate-900/5 select-none ${lightsClasses[hLevel]}`}
                    style={customStyle}
                    title={`${cell.dateStr}: ${doneCount}/${items.length} completed`}
                  >
                    {cell.dayNum}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Selected Day Modal popup */}
      {selectedDate && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur flex items-center justify-center z-50 p-4">
          <div className="bg-[#111120] border border-[#2a2a50] rounded-2xl w-full max-w-lg shadow-[0_0_40px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-[#2a2a50] bg-[#0d0d1a]">
              <h3 className="text-sm font-extrabold font-display uppercase tracking-widest text-white">DAY OVERVIEW <span className="text-[#00d4ff]">{fmtDate(selectedDate)}</span></h3>
              <button onClick={() => setSelectedDate(null)} className="text-slate-500 hover:text-white transition"><X size={16} /></button>
            </div>
            
            <div className="p-5 overflow-y-auto max-h-[70vh] space-y-5">
              {/* Tracker Stats Overview */}
              {(() => {
                const stats = dayStats(selectedDate);
                if (stats.total === 0) return null;
                return (
                  <div className="bg-[#0d0d1a] border border-[#2a2a50] p-4 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest font-mono mb-1">Tracker Score</p>
                      <p className={`text-2xl font-black font-display ${stats.pct >= 100 ? 'text-[#00ff88]' : stats.pct >= 50 ? 'text-[#ffaa44]' : 'text-rose-500'}`}>{stats.pct}%</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest font-mono mb-1">Total Hours</p>
                      <p className="text-xl font-bold font-mono text-[#00d4ff]">{stats.hrs.toFixed(1)}h</p>
                    </div>
                    <button 
                      onClick={() => { onSetDate(selectedDate); onNavigate('daily'); }}
                      className="bg-[#2a2a50] hover:bg-[#3f3f74] p-2 rounded-lg text-white transition cursor-pointer" title="Go to Tracker"
                    >
                      <ArrowRight size={14} />
                    </button>
                  </div>
                );
              })()}

              {/* Journal Overview */}
              {(() => {
                const jEntry = state.journals[selectedDate];
                const hasSections = jEntry && Object.keys(jEntry.sections || {}).length > 0;
                if (!jEntry && !hasSections) return null;
                return (
                  <div className="bg-[#0d0d1a] border border-[#2a2a50] p-4 rounded-xl flex items-start gap-4 justify-between">
                    <div className="space-y-1 w-full overflow-hidden">
                      <p className="text-[10px] text-[#aa44ff] font-bold uppercase tracking-widest font-mono mb-2">Journal & Log</p>
                      {jEntry.location && <p className="text-[10px] text-slate-400 font-mono truncate">Loc: {typeof jEntry.location === 'string' ? jEntry.location : `GPS: ${jEntry.location.lat?.toFixed(4)}, ${jEntry.location.lng?.toFixed(4)}`}</p>}
                      {jEntry.sketches && jEntry.sketches.length > 0 && <p className="text-[10px] text-[#ffaa44] font-mono">Sketches: {jEntry.sketches.length}</p>}
                    </div>
                    <button 
                      onClick={() => { onSetDate(selectedDate); onNavigate('journal'); }}
                      className="bg-[#2a2a50] hover:bg-[#3f3f74] p-2 rounded-lg text-white transition shrink-0 cursor-pointer" title="Go to Journal"
                    >
                      <ArrowRight size={14} />
                    </button>
                  </div>
                );
              })()}

              {/* Reminders Overview */}
              {(() => {
                const dayReminders = state.reminders?.filter(r => r.dueDate === selectedDate) || [];
                if (dayReminders.length === 0) return null;
                return (
                  <div className="bg-[#0d0d1a] border border-[#2a2a50] p-4 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-[#ffaa44] font-bold uppercase tracking-widest font-mono mb-1">Alerts & Reminders ({dayReminders.length})</p>
                      <div className="space-y-1 mt-1">
                        {dayReminders.map(r => (
                           <div key={r.id} className="flex flex-col">
                             <p className={`text-xs font-bold ${r.status === 'done' ? 'text-slate-500 line-through' : 'text-slate-300'}`}>{r.title}</p>
                             {r.time && <p className="text-[10px] text-[#00d4ff] font-mono">{r.time}</p>}
                           </div>
                        ))}
                      </div>
                    </div>
                    <button 
                      onClick={() => { onNavigate('alerts'); }}
                      className="bg-[#2a2a50] hover:bg-[#3f3f74] p-2 rounded-lg text-white transition cursor-pointer self-start" title="Go to Alerts"
                    >
                      <ArrowRight size={14} />
                    </button>
                  </div>
                );
              })()}

              {/* Finance Overview */}
              {(() => {
                const fin = state.finances?.filter(f => f.date === selectedDate);
                if (!fin || fin.length === 0) return null;
                const total = fin.reduce((a, b) => b.type === 'income' ? a + b.amount : a - b.amount, 0);
                return (
                  <div className="bg-[#0d0d1a] border border-[#2a2a50] p-4 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest font-mono mb-1">Finances ({fin.length})</p>
                      <p className={`text-lg font-black font-mono ${total >= 0 ? 'text-[#00ff88]' : 'text-rose-500'}`}>${total.toFixed(2)}</p>
                    </div>
                    <button 
                      onClick={() => { onNavigate('finances'); }}
                      className="bg-[#2a2a50] hover:bg-[#3f3f74] p-2 rounded-lg text-white transition cursor-pointer" title="Go to Finances"
                    >
                      <ArrowRight size={14} />
                    </button>
                  </div>
                );
              })()}
              
              {/* Expeditions Overview */}
              {(() => {
                const exps = state.expeditions?.filter(e => e.dateStart === selectedDate || e.dateEnd === selectedDate);
                if (!exps || exps.length === 0) return null;
                return (
                  <div className="bg-[#0d0d1a] border border-[#2a2a50] p-4 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-[#ff6b1a] font-bold uppercase tracking-widest font-mono mb-1">Expeditions Events</p>
                      {exps.map(e => (
                        <p key={e.id} className="text-xs font-bold text-slate-300 uppercase">{e.title}</p>
                      ))}
                    </div>
                    <button 
                      onClick={() => { onNavigate('expeditions'); }}
                      className="bg-[#2a2a50] hover:bg-[#3f3f74] p-2 rounded-lg text-white transition cursor-pointer" title="Go to Expeditions"
                    >
                      <ArrowRight size={14} />
                    </button>
                  </div>
                );
              })()}

            </div>
          </div>
        </div>
      )}

    </div>
  );
};
