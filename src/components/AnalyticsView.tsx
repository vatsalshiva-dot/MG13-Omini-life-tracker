import React, { useState } from 'react';
import { AppState, TrackerCategory } from '../types';
import { getWeek } from '../utils/date';
import { CATS } from '../utils/storage';
import { TrendingUp, BarChart, Percent, Clock, AlertCircle } from 'lucide-react';

interface AnalyticsViewProps {
  state: AppState;
  date: string;
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
  getDayD: (ds: string, cat: TrackerCategory, item: string) => any;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  state,
  date,
  dayStats,
  getDayD
}) => {
  const [period, setPeriod] = useState<'week' | 'month' | 'year' | 'custom'>('week');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const today = date;

  // Gather list of dates depending on selection
  const dates = React.useMemo(() => {
    if (period === 'week') {
      return getWeek(today);
    } else if (period === 'month') {
      // Last 30 days
      const arr: string[] = [];
      const d = new Date(today + 'T00:00:00');
      for (let i = 29; i >= 0; i--) {
        const x = new Date(d);
        x.setDate(d.getDate() - i);
        const yr = x.getFullYear();
        const mt = String(x.getMonth() + 1).padStart(2, '0');
        const dy = String(x.getDate()).padStart(2, '0');
        arr.push(`${yr}-${mt}-${dy}`);
      }
      return arr;
    } else if (period === 'year') {
      // Last 365 days
      const arr: string[] = [];
      const d = new Date(today + 'T00:00:00');
      for (let i = 364; i >= 0; i--) {
        const x = new Date(d);
        x.setDate(d.getDate() - i);
        const yr = x.getFullYear();
        const mt = String(x.getMonth() + 1).padStart(2, '0');
        const dy = String(x.getDate()).padStart(2, '0');
        arr.push(`${yr}-${mt}-${dy}`);
      }
      return arr;
    } else {
      if (!customStart || !customEnd) return getWeek(today);
      const arr: string[] = [];
      let current = new Date(customStart + 'T00:00:00');
      const end = new Date(customEnd + 'T00:00:00');
      while (current <= end) {
        const yr = current.getFullYear();
        const mt = String(current.getMonth() + 1).padStart(2, '0');
        const dy = String(current.getDate()).padStart(2, '0');
        arr.push(`${yr}-${mt}-${dy}`);
        current.setDate(current.getDate() + 1);
        if (arr.length > 1095) break; // cap at 3 years safety
      }
      return arr;
    }
  }, [today, period, customStart, customEnd]);

  // Aggregate stats across period dates
  const aggregated = React.useMemo(() => {
    let done = 0;
    let missed = 0;
    let pending = 0;
    const catStats: Record<string, { done: number; total: number; hrs: number; reps: number }> = {};
    let totalHrs = 0;
    let totalReps = 0;
    let satSum = 0;
    let satCount = 0;

    CATS.forEach(c => {
      catStats[c.id] = { done: 0, total: 0, hrs: 0, reps: 0 };
    });

    dates.forEach(d => {
      CATS.forEach(cat => {
        (state.items[cat.id] || []).forEach(item => {
          const entry = getDayD(d, cat.id, item);
          const s = entry ? entry.status : 'pending';
          
          catStats[cat.id].total++;
          if (s === 'done') {
            done++;
            catStats[cat.id].done++;
          } else if (s === 'missed') {
            missed++;
          } else {
            pending++;
          }

          const hrs = entry ? (entry.hours || 0) : 0;
          const reps = entry ? (entry.reps || 0) : 0;
          catStats[cat.id].hrs += hrs;
          catStats[cat.id].reps += reps;

          totalHrs += hrs;
          totalReps += reps;

          if (entry && entry.satisfaction > 0) {
            satSum += entry.satisfaction;
            satCount++;
          }
        });
      });
    });

    const totalCheckins = done + missed + pending;
    return {
      done,
      missed,
      pct: totalCheckins ? Math.round((done / totalCheckins) * 100) : 0,
      hrs: totalHrs,
      reps: totalReps,
      avgSat: satCount ? (satSum / satCount).toFixed(1) : '—',
      catStats
    };
  }, [dates, state, getDayD]);

  // SVG drawing math
  const padding = { top: 20, right: 20, bottom: 35, left: 40 };

  return (
    <div className="space-y-6">
      {/* Header and Switches */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#1e1e38] pb-4">
        <div>
          <h2 className="text-xl font-extrabold tracking-wider text-[#ff6b1a]">
            ANALYTICS & <span className="text-slate-100 font-black">CHARTS</span>
          </h2>
          <p className="text-xs uppercase tracking-widest text-slate-500 mt-1">
            STATISTICS · HEATMAP SCORES · SATISFACTION TRENDS
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 self-start sm:self-center">
          <div className="flex p-1 bg-[#0d0d1a] border border-[#1e1e38] rounded-xl self-start sm:self-center">
            <button
              onClick={() => setPeriod('week')}
              className={`px-4 py-1 rounded-lg text-xs font-bold uppercase tracking-wider transition ${
                period === 'week' ? 'bg-[#ff6b1a] text-black' : 'text-slate-400 hover:text-slate-100'
              }`}
            >
              WEEK
            </button>
            <button
              onClick={() => setPeriod('month')}
              className={`px-4 py-1 rounded-lg text-xs font-bold uppercase tracking-wider transition ${
                period === 'month' ? 'bg-[#ff6b1a] text-black' : 'text-slate-400 hover:text-slate-100'
              }`}
            >
              MONTH
            </button>
            <button
              onClick={() => setPeriod('year')}
              className={`px-4 py-1 rounded-lg text-xs font-bold uppercase tracking-wider transition ${
                period === 'year' ? 'bg-[#ff6b1a] text-black' : 'text-slate-400 hover:text-slate-100'
              }`}
            >
              YEAR
            </button>
            <button
              onClick={() => setPeriod('custom')}
              className={`px-4 py-1 rounded-lg text-xs font-bold uppercase tracking-wider transition ${
                period === 'custom' ? 'bg-[#ff6b1a] text-black' : 'text-slate-400 hover:text-slate-100'
              }`}
            >
              CUSTOM
            </button>
          </div>
          {period === 'custom' && (
            <div className="flex items-center gap-2 bg-[#0d0d1a] border border-[#1e1e38] p-1 rounded-xl">
              <input type="date" className="bg-transparent border-none text-xs text-slate-300 outline-none" value={customStart} onChange={e => setCustomStart(e.target.value)} />
              <span className="text-slate-500">-</span>
              <input type="date" className="bg-transparent border-none text-xs text-slate-300 outline-none" value={customEnd} onChange={e => setCustomEnd(e.target.value)} />
            </div>
          )}
        </div>
      </div>

      {/* Aggregate stats summary boxes */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 select-none">
        <div className="bg-[#0d0d1a] border border-[#1e1e38] p-3 rounded-lg text-center hover:border-[#ff6b1a] transition">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">COMPLETED</p>
          <p className="text-2xl font-black mt-1 text-emerald-400">{aggregated.done}</p>
        </div>
        <div className="bg-[#0d0d1a] border border-[#1e1e38] p-3 rounded-lg text-center hover:border-rose-500 transition">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">MISSED</p>
          <p className="text-2xl font-black mt-1 text-rose-500">{aggregated.missed}</p>
        </div>
        <div className="bg-[#0d0d1a] border border-[#1e1e38] p-3 rounded-lg text-center hover:border-[#00d4ff] transition">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">SCORE %</p>
          <p className="text-2xl font-black mt-1 text-[#ff6b1a]">{aggregated.pct}%</p>
        </div>
        <div className="bg-[#0d0d1a] border border-[#1e1e38] p-3 rounded-lg text-center hover:border-[#aa44ff] transition">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">TOTAL TIME</p>
          <p className="text-2xl font-black mt-1 text-[#00d4ff]">{aggregated.hrs.toFixed(1)}h</p>
        </div>
        <div className="bg-[#0d0d1a] border border-[#1e1e38] p-3 rounded-lg text-center hover:border-[#00ff88] transition">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">REPETITIONS</p>
          <p className="text-2xl font-black mt-1 text-[#aa44ff]">{aggregated.reps}</p>
        </div>
        <div className="bg-[#0d0d1a] border border-[#1e1e38] p-3 rounded-lg text-center hover:border-yellow-500 transition">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">SATISFACTION</p>
          <p className="text-2xl font-black mt-1 text-yellow-500">{aggregated.avgSat}</p>
        </div>
      </div>

      {/* SVG charts: Vector drawing suite */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Completion by Category Side-Bar-Chart view */}
        <div className="bg-[#0d0d1a] border border-[#1e1e38] rounded-xl p-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 mb-4 flex items-center gap-1.5">
            <BarChart size={13} className="text-[#ff6b1a]" />
            COMPLETION BY CATS OVER PERIOD
          </h3>

          <div className="space-y-4">
            {CATS.map((cat, idx) => {
              const cStat = aggregated.catStats[cat.id];
              const pct = cStat.total ? Math.round((cStat.done / cStat.total) * 105) : 0;
              return (
                <div key={cat.id} className="space-y-1">
                  <div className="flex text-xs font-bold uppercase justify-between text-slate-400">
                    <span style={{ color: cat.neon }}>{cat.icon} {cat.label}</span>
                    <span>
                      {cStat.done}/{cStat.total} done ({pct}%)
                    </span>
                  </div>
                  <div className="h-5 bg-[#111120] rounded-md overflow-hidden relative border border-[#1e1e38] flex items-center">
                    <div 
                      className="h-full rounded-md opacity-75"
                      style={{ backgroundColor: cat.neon, width: `${pct}%`, transition: 'width 0.6s ease' }}
                    />
                    <div className="absolute right-3.5 text-[9px] font-mono font-black text-slate-300 uppercase">
                      {cStat.hrs > 0 && `${cStat.hrs.toFixed(1)}h logged`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Categories Distribution visualizer (Inline SVG Pie) */}
        <div className="bg-[#0d0d1a] border border-[#1e1e38] rounded-xl p-4 flex flex-col justify-between">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 mb-4 flex items-center gap-1.5">
            <Percent size={13} className="text-[#00d4ff]" />
            DONE TASKS RATIO DISTRIBUTION
          </h3>

          <div className="flex flex-col sm:flex-row items-center gap-8 justify-center py-2.5">
            {/* Inline SVG donut */}
            <div className="relative w-32 h-32">
              <svg width="128" height="128" className="transform -rotate-90">
                <circle cx="64" cy="64" r="50" fill="none" stroke="#111120" strokeWidth="18" />
                {(() => {
                  let accumDegree = 0;
                  const totalDone = CATS.reduce((sum, c) => sum + aggregated.catStats[c.id].done, 0);
                  if (totalDone === 0) return <circle cx="64" cy="64" r="50" fill="none" stroke="#222" strokeWidth="18" />;

                  const strokeCircum = 2 * Math.PI * 50;

                  return CATS.map((cat, i) => {
                    const count = aggregated.catStats[cat.id].done;
                    if (count === 0) return null;
                    const pctOfDone = count / totalDone;
                    const shareLength = strokeCircum * pctOfDone;
                    const offset = strokeCircum - shareLength + accumDegree;
                    accumDegree -= shareLength;

                    return (
                      <circle
                        key={cat.id}
                        cx="64" cy="64" r="50"
                        fill="none"
                        stroke={cat.neon}
                        strokeWidth="18"
                        strokeDasharray={String(strokeCircum)}
                        strokeDashoffset={String(offset)}
                        className="transition-all duration-500 ease-out"
                        style={{ strokeLinecap: 'butt' }}
                      />
                    );
                  });
                })()}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center select-none">
                <span className="text-xs text-slate-500 uppercase tracking-widest font-bold">TOTAL</span>
                <span className="text-lg font-black text-slate-100">
                  {CATS.reduce((sum, c) => sum + aggregated.catStats[c.id].done, 0)}
                </span>
              </div>
            </div>

            {/* Labels */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              {CATS.map((cat) => {
                const count = aggregated.catStats[cat.id].done;
                const totalOfAll = CATS.reduce((sum, c) => sum + aggregated.catStats[c.id].done, 0);
                const percentDone = totalOfAll > 0 ? Math.round((count / totalOfAll) * 100) : 0;
                return (
                  <div key={cat.id} className="text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.neon }} />
                      <span className="text-slate-400 font-bold">{cat.label}</span>
                    </div>
                    <div className="pl-3.5 text-[10px] font-mono text-slate-500 mt-0.5">
                      {count} items ({percentDone}%)
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Completion score trend line chart (Inline Vector SVG) */}
      <div className="bg-[#0d0d1a] border border-[#1e1e38] rounded-xl p-4">
        <div className="flex justify-between items-center mb-4 border-b border-[#111120] pb-2">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <TrendingUp size={13} className="text-[#00ff88]" />
            DAILY COMPLETION SCORING TIMELINE
          </h3>
          <span className="text-[9px] text-slate-500 uppercase font-mono tracking-widest leading-none">// percentage scoring</span>
        </div>

        <div className="w-full h-40">
          {dates.length > 0 ? (
            <svg viewBox={`0 0 500 120`} className="w-full h-full text-slate-500 overflow-visible font-mono text-[8px]" preserveAspectRatio="none">
              {/* Backing Horizontal Grid lines */}
              {[0, 25, 50, 75, 100].map((v) => {
                const y = 100 - v;
                return (
                  <g key={v}>
                    <line x1="30" y1={y} x2="495" y2={y} stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
                    <text x="5" y={y + 3} fill="#444466" fontSize="7">{v}%</text>
                  </g>
                );
              })}

              {/* Draw Lines */}
              {(() => {
                const step = (495 - 30) / Math.max(1, dates.length - 1);
                const points = dates.map((day, dIdx) => {
                  const s = dayStats(day);
                  const x = 30 + dIdx * step;
                  const y = 100 - s.pct;
                  return { x, y, pct: s.pct, day };
                });

                const pathData = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

                return (
                  <>
                    {/* Shadow Area below line */}
                    {points.length > 1 && (
                      <path 
                        d={`${pathData} L ${points[points.length-1].x} 100 L 30 100 Z`}
                        fill="url(#completionGrad)"
                        opacity="0.1"
                      />
                    )}

                    {/* Completion line */}
                    <path 
                      d={pathData} 
                      fill="none" 
                      stroke="#ff6b1a" 
                      strokeWidth="1.5" 
                      strokeLinecap="round"
                    />

                    {/* Gradient definition */}
                    <defs>
                      <linearGradient id="completionGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ff6b1a" />
                        <stop offset="100%" stopColor="#ff6b1a" stopOpacity="0" />
                      </linearGradient>
                    </defs>

                    {/* Radial Dots */}
                    {points.map((p, pIdx) => {
                      if (dates.length > 12 && pIdx % 2 !== 0 && pIdx !== dates.length - 1) return null;
                      return (
                        <g key={p.day}>
                          <circle cx={p.x} cy={p.y} r="2.5" fill="#ff6b1a" />
                          <circle cx={p.x} cy={p.y} r="5" stroke="#ff6b1a" strokeWidth="1" fill="none" opacity="0.3" className="animate-ping" style={{ transformOrigin: `${p.x}px ${p.y}px` }} />
                        </g>
                      );
                    })}

                    {/* Bottom Day coordinates */}
                    {dates.map((day, dIdx) => {
                      // skip to avoid text overlaps on month view
                      const totalWidthDays = dates.length;
                      const skipStep = totalWidthDays > 300 ? 30 : totalWidthDays > 14 ? 5 : totalWidthDays > 7 ? 2 : 1;
                      if (dIdx % skipStep !== 0 && dIdx !== dates.length - 1) return null;

                      const label = totalWidthDays > 300 && (dIdx % skipStep === 0) ? day.slice(5, 7) + '/' + day.slice(8) : day.slice(8);
                      const x = 30 + dIdx * step;

                      return (
                        <text key={day} x={x - 4} y="115" fill="#555577" fontSize="7">
                          {label}
                        </text>
                      );
                    })}
                  </>
                );
              })()}
            </svg>
          ) : (
            <div className="flex h-full items-center justify-center font-mono">LOADING DATA...</div>
          )}
        </div>
      </div>

      {/* Hours tracked trend vector line (Inline SVG) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Hours card view */}
        <div className="bg-[#0d0d1a] border border-[#1e1e38] rounded-xl p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Clock size={13} className="text-[#00d4ff]" />
              TIME LOGGED DAILY
            </h3>
            <span className="text-[9px] text-[#00d4ff] uppercase font-mono font-bold tracking-wider">// active focused hours</span>
          </div>

          <div className="h-32">
            <svg viewBox="0 0 500 120" className="w-full h-full text-slate-500 overflow-visible font-mono text-[8px]" preserveAspectRatio="none">
              {(() => {
                // Find axis limits
                const points = dates.map((day, dIdx) => {
                  const s = dayStats(day);
                  return { day, hrs: s.hrs, dIdx };
                });
                const maxHrs = Math.max(...points.map(p => p.hrs)) || 4;

                const step = (495 - 30) / Math.max(1, dates.length - 1);
                
                return (
                  <>
                    {[0, maxHrs * 0.25, maxHrs * 0.5, maxHrs * 0.75, maxHrs].map((v, idx) => {
                      const y = 100 - (v / maxHrs) * 90;
                      return (
                        <g key={idx}>
                          <line x1="30" y1={y} x2="495" y2={y} stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
                          <text x="5" y={y + 3} fill="#444466" fontSize="7">{v.toFixed(1)}h</text>
                        </g>
                      );
                    })}

                    {/* Bars or Lines? Bars look fantastic! */}
                    {points.map((p, pIdx) => {
                      const x = 30 + p.dIdx * step;
                      const h = (p.hrs / maxHrs) * 90;
                      const y = 100 - h;
                      const width = Math.max(3, step * 0.6);

                      return (
                        <g key={p.day} className="group cursor-pointer">
                          <rect 
                            x={x - width / 2} 
                            y={y} 
                            width={width} 
                            height={h} 
                            fill="url(#hoursGrad)" 
                            rx="1"
                            className="hover:fill-cyan-400 transition"
                          />
                        </g>
                      );
                    })}

                    <defs>
                      <linearGradient id="hoursGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#00d4ff" />
                        <stop offset="100%" stopColor="#00d4ff" stopOpacity="0.05" />
                      </linearGradient>
                    </defs>

                    {/* Bottom axis dates */}
                    {dates.map((day, dIdx) => {
                      const totalWidthDays = dates.length;
                      const skipStep = totalWidthDays > 300 ? 30 : totalWidthDays > 14 ? 5 : totalWidthDays > 7 ? 2 : 1;
                      if (dIdx % skipStep !== 0 && dIdx !== dates.length - 1) return null;
                      const x = 30 + dIdx * step;
                      const label = totalWidthDays > 300 && (dIdx % skipStep === 0) ? day.slice(5, 7) + '/' + day.slice(8) : day.slice(8);
                      return (
                        <text key={day} x={x - 4} y="115" fill="#444466" fontSize="7">
                          {label}
                        </text>
                      );
                    })}
                  </>
                );
              })()}
            </svg>
          </div>
        </div>

        {/* Aggregate reps daily column trend */}
        <div className="bg-[#0d0d1a] border border-[#1e1e38] rounded-xl p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <TrendingUp size={13} className="text-[#aa44ff]" />
              REPS LOGGED TIMELINE
            </h3>
            <span className="text-[9px] text-[#aa44ff] uppercase font-mono font-bold tracking-wider">// reps counts</span>
          </div>

          <div className="h-32">
            <svg viewBox="0 0 500 120" className="w-full h-full text-slate-500 overflow-visible font-mono text-[8px]" preserveAspectRatio="none">
              {(() => {
                // Find limits
                const points = dates.map((day, dIdx) => {
                  const s = dayStats(day);
                  return { day, reps: s.reps, dIdx };
                });
                const maxReps = Math.max(...points.map(p => p.reps)) || 20;

                const step = (495 - 30) / Math.max(1, dates.length - 1);
                
                return (
                  <>
                    {[0, maxReps * 0.25, maxReps * 0.5, maxReps * 0.75, maxReps].map((v, idx) => {
                      const y = 100 - (v / maxReps) * 90;
                      return (
                        <g key={idx}>
                          <line x1="30" y1={y} x2="495" y2={y} stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
                          <text x="5" y={y + 3} fill="#444466" fontSize="7">{Math.round(v)}</text>
                        </g>
                      );
                    })}

                    {/* Bars or Lines */}
                    {points.map((p, pIdx) => {
                      const x = 30 + p.dIdx * step;
                      const h = (p.reps / maxReps) * 90;
                      const y = 100 - h;
                      const width = Math.max(3, step * 0.6);

                      return (
                        <g key={p.day}>
                          <rect 
                            x={x - width / 2} 
                            y={y} 
                            width={width} 
                            height={h} 
                            fill="url(#repsGrad)" 
                            rx="1"
                            className="hover:fill-purple-400 transition"
                          />
                        </g>
                      );
                    })}

                    <defs>
                      <linearGradient id="repsGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#aa44ff" />
                        <stop offset="100%" stopColor="#aa44ff" stopOpacity="0.05" />
                      </linearGradient>
                    </defs>

                    {/* Bottom Dates */}
                    {dates.map((day, dIdx) => {
                      const totalWidthDays = dates.length;
                      const skipStep = totalWidthDays > 300 ? 30 : totalWidthDays > 14 ? 5 : totalWidthDays > 7 ? 2 : 1;
                      if (dIdx % skipStep !== 0 && dIdx !== dates.length - 1) return null;
                      const x = 30 + dIdx * step;
                      const label = totalWidthDays > 300 && (dIdx % skipStep === 0) ? day.slice(5, 7) + '/' + day.slice(8) : day.slice(8);
                      return (
                        <text key={day} x={x - 4} y="115" fill="#444466" fontSize="7">
                          {label}
                        </text>
                      );
                    })}
                  </>
                );
              })()}
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};
