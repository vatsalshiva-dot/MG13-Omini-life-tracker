import React, { useState } from 'react';
import { AppState, TrackerCategory, GoalCategory, GoalTarget } from '../types';
import { periodDays, periodRange } from '../utils/date';
import {  CATS , getCatLabel } from '../utils/storage';
import { Award, Target, HelpCircle, ArrowRight, RotateCcw } from 'lucide-react';

interface GoalsViewProps {
  state: AppState;
  date: string;
  onSaveGoal: (period: 'weekly' | 'monthly' | 'yearly', scope: 'cat' | 'item', key: string, field: 'reps' | 'hours', val: number) => void;
  onResetGoalAuto: (period: 'weekly' | 'monthly' | 'yearly', scope: 'cat' | 'item', key: string) => void;
  getRepsT: (cat: TrackerCategory, item: string) => number;
  getHrsT: (cat: TrackerCategory, item: string) => number;
}

export const GoalsView: React.FC<GoalsViewProps> = ({
  state,
  date,
  onSaveGoal,
  onResetGoalAuto,
  getRepsT,
  getHrsT
}) => {
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('weekly');
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({});

  const daysLength = periodDays(period, date);
  const range = periodRange(period, date);

  // Helper selectors
  const itemDefReps = (cat: TrackerCategory, item: string) => getRepsT(cat, item) * daysLength;
  const itemDefHrs = (cat: TrackerCategory, item: string) => getHrsT(cat, item) * daysLength;
  
  const catDefReps = (cat: TrackerCategory) => {
    return (state.items[cat] || []).reduce((s, it) => s + itemDefReps(cat, it), 0);
  };
  const catDefHrs = (cat: TrackerCategory) => {
    return (state.items[cat] || []).reduce((s, it) => s + itemDefHrs(cat, it), 0);
  };

  const effGoal = (scope: 'cat' | 'item', key: string, field: 'reps' | 'hours') => {
    const gObj = state.goals[period]?.[scope]?.[key];
    if (gObj && !gObj.auto && gObj[field] > 0) return gObj[field];
    if (scope === 'cat') {
      const catId = key as TrackerCategory;
      return field === 'reps' ? catDefReps(catId) : catDefHrs(catId);
    }
    // Item format: cat::item
    const [cat, item] = key.split('::');
    return field === 'reps' ? itemDefReps(cat as TrackerCategory, item) : itemDefHrs(cat as TrackerCategory, item);
  };

  const isAuto = (scope: 'cat' | 'item', key: string, field: 'reps' | 'hours') => {
    const gObj = state.goals[period]?.[scope]?.[key];
    return !gObj || gObj.auto || !gObj[field];
  };

  // Calculate actual completion across this range
  const calcActuals = () => {
    const cat: Record<string, { reps: number; hours: number }> = {};
    const item: Record<string, { reps: number; hours: number }> = {};

    CATS.forEach(c => {
      cat[c.id] = { reps: 0, hours: 0 };
      (state.items[c.id] || []).forEach(it => {
        item[`${c.id}::${it}`] = { reps: 0, hours: 0 };
      });
    });

    Object.keys(state.daily).forEach((ds) => {
      if (ds < range.s || ds > range.e) return;
      CATS.forEach(c => {
        (state.items[c.id] || []).forEach(it => {
          const dEntry = state.daily[ds]?.[c.id]?.[it];
          if (!dEntry) return;

          const baseReps = dEntry.reps || (dEntry.status === 'done' ? getRepsT(c.id, it) : 0);
          const baseHrs = dEntry.hours || 0;

          cat[c.id].reps += baseReps;
          cat[c.id].hours += baseHrs;

          const k = `${c.id}::${it}`;
          if (item[k]) {
            item[k].reps += baseReps;
            item[k].hours += baseHrs;
          }
        });
      });
    });

    return { cat, item };
  };

  const actuals = calcActuals();

  // Sum aggregates
  let totalRepsGoal = 0;
  let totalRepsActual = 0;
  let totalHrsGoal = 0;
  let totalHrsActual = 0;

  CATS.forEach(c => {
    totalRepsGoal += effGoal('cat', c.id, 'reps');
    totalRepsActual += actuals.cat[c.id].reps;
    totalHrsGoal += effGoal('cat', c.id, 'hours');
    totalHrsActual += actuals.cat[c.id].hours;
  });

  const toggleExpand = (catId: string) => {
    setExpandedCats(prev => ({ ...prev, [catId]: !prev[catId] }));
  };

  const textPeriodsColors = {
    weekly: 'bg-[#ff6b1a]/10 border-[#ff6b1a]/40 text-[#ff6b1a]',
    monthly: 'bg-[#ff6b1a]/10 border-[#ff6b1a]/40 text-[#ff6b1a]',
    yearly: 'bg-[#ff6b1a]/10 border-[#ff6b1a]/40 text-[#ff6b1a]',
  };

  return (
    <div className="space-y-6">
      {/* Header and Switches */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#1e1e38] pb-4">
        <div>
          <h2 className="text-xl font-extrabold tracking-wider text-[#ff6b1a]">
            GOALS & <span className="text-slate-100">TARGETS</span>
          </h2>
          <p className="text-xs uppercase tracking-widest text-slate-500 mt-1">
            REPS + TIME BUDGETS · AUTO-DEFAULTS MULTIPLIED FROM DAILY TARGETS
          </p>
        </div>

        <div className="flex p-1 bg-[#0d0d1a] border border-[#1e1e38] rounded-xl self-start sm:self-center">
          {(['weekly', 'monthly', 'yearly'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-1 rounded-lg text-xs font-bold uppercase tracking-wider transition ${
                period === p 
                  ? 'bg-[#ff6b1a] text-black' 
                  : 'text-slate-400 hover:text-slate-100'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Aggregates Card */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 bg-[#0d0d1a] border border-[#1e1e38] p-4 rounded-xl">
        <div>
          <p className="text-[10px] tracking-widest text-[#ff6b1a] uppercase font-bold">TOTAL REPETITIONS</p>
          <p className="text-xl font-black text-slate-100 mt-1.5">
            {totalRepsActual}
            <span className="text-xs font-semibold text-slate-500 font-mono"> / {totalRepsGoal}</span>
          </p>
          <div className="text-[9px] text-slate-600 mt-1 uppercase font-mono">// reps done / gap</div>
        </div>
        <div>
          <p className="text-[10px] tracking-widest text-[#00d4ff] uppercase font-bold">TOTAL REGISTERED HOURS</p>
          <p className="text-xl font-black text-slate-100 mt-1.5">
            {totalHrsActual.toFixed(1)}h
            <span className="text-xs font-semibold text-slate-500 font-mono"> / {totalHrsGoal.toFixed(1)}h</span>
          </p>
          <div className="text-[9px] text-slate-600 mt-1 uppercase font-mono">// focus logged time</div>
        </div>
        <div>
          <p className="text-[10px] tracking-widest text-slate-500 uppercase font-black">CURRENT PERIOD RANGE</p>
          <p className="text-sm font-black text-[#00d4ff] mt-2 truncate uppercase">{range.label}</p>
          <div className="text-[9px] text-slate-600 mt-0.5 uppercase font-mono">// interactive focus dates</div>
        </div>
        <div>
          <p className="text-[10px] tracking-widest text-slate-500 uppercase font-black font-semibold">LENGTH</p>
          <p className="text-xl font-black text-[#ff6b1a] mt-1">{daysLength} DAYS</p>
          <div className="text-[9px] text-slate-600 mt-1 uppercase font-mono">// period duration size</div>
        </div>
      </div>

      {/* Category Targets list */}
      <div className="space-y-3.5">
        {CATS.map((cat) => {
          const act = actuals.cat[cat.id];
          const trgReps = effGoal('cat', cat.id, 'reps');
          const trgHrs = effGoal('cat', cat.id, 'hours');

          const hasRepsAuto = isAuto('cat', cat.id, 'reps');
          const hasHrsAuto = isAuto('cat', cat.id, 'hours');

          const repsPct = trgReps > 0 ? Math.min(100, Math.round((act.reps / trgReps) * 100)) : 0;
          const hrsPct = trgHrs > 0 ? Math.min(100, Math.round((act.hours / trgHrs) * 100)) : 0;

          const repsColorClass = repsPct >= 100 ? 'text-emerald-400' : repsPct >= 50 ? 'text-cyan-400' : 'text-rose-400';
          const hrsColorClass = hrsPct >= 100 ? 'text-emerald-400' : hrsPct >= 50 ? 'text-[#00d4ff]' : 'text-amber-400';

          const isExpanded = !!expandedCats[cat.id];
          const items = state.items[cat.id] || [];

          return (
            <div key={cat.id} className="bg-[#0d0d1a] border border-[#1e1e38] rounded-xl overflow-hidden hover:border-slate-800 transition">
              {/* Card Header controls */}
              <div className="bg-[#111120] px-4 py-3 border-b border-[#1e1e38] flex flex-wrap items-center justify-between gap-4">
                <span className="text-sm font-extrabold uppercase tracking-wide flex items-center gap-1.5" style={{ color: cat.neon }}>
                  <span className="text-base">{cat.icon}</span>
                  {getCatLabel(state, cat.id)}
                </span>

                {/* Overrides form fields */}
                <div className="flex flex-wrap items-center gap-4">
                  {/* Reps selector */}
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Reps limit:</span>
                    <input 
                      type="number"
                      className={`w-14 bg-slate-950 border border-[#2a2a50] text-[#ff6b1a] hover:border-slate-700 px-1 py-0.5 rounded text-center font-bold text-xs focus:outline-none ${
                        hasRepsAuto ? 'opacity-40 italic' : ''
                      }`}
                      value={hasRepsAuto ? '' : trgReps}
                      placeholder={String(trgReps)}
                      onChange={(e) => onSaveGoal(period, 'cat', cat.id, 'reps', +e.target.value)}
                    />
                    {hasRepsAuto ? (
                      <span className="text-[8px] bg-[#1c1c35] text-slate-500 font-bold uppercase rounded px-1 tracking-widest font-mono">auto</span>
                    ) : (
                      <button 
                        onClick={() => onResetGoalAuto(period, 'cat', cat.id)}
                        className="text-rose-500 hover:text-rose-400 font-bold px-1.5"
                        title="Revert override"
                      >
                        <RotateCcw size={10} />
                      </button>
                    )}
                  </div>

                  {/* Hours selector */}
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Hrs limit:</span>
                    <input 
                      type="number"
                      className={`w-14 bg-slate-950 border border-[#2a2a50] text-amber-400 hover:border-slate-700 px-1 py-0.5 rounded text-center font-bold text-xs focus:outline-none ${
                        hasHrsAuto ? 'opacity-40 italic' : ''
                      }`}
                      value={hasHrsAuto ? '' : trgHrs}
                      placeholder={String(trgHrs)}
                      onChange={(e) => onSaveGoal(period, 'cat', cat.id, 'hours', +e.target.value)}
                    />
                    {hasHrsAuto ? (
                      <span className="text-[8px] bg-[#1c1c35] text-slate-500 font-bold uppercase rounded px-1 tracking-widest font-mono">auto</span>
                    ) : (
                      <button 
                        onClick={() => onResetGoalAuto(period, 'cat', cat.id)}
                        className="text-rose-500 hover:text-rose-400 font-bold px-1.5"
                        title="Revert override"
                      >
                        <RotateCcw size={10} />
                      </button>
                    )}
                  </div>

                  {items.length > 0 && (
                    <button
                      onClick={() => toggleExpand(cat.id)}
                      className="px-2.5 py-1 text-[10px] font-bold bg-[#1c1c35] hover:bg-slate-800 text-slate-200 border border-[#2a2a50] rounded uppercase transition"
                    >
                      {isExpanded ? '▲ Hide items' : `▼ View Items (${items.length})`}
                    </button>
                  )}
                </div>
              </div>

              {/* Progress Gauges */}
              <div className="p-4 space-y-3.5">
                {/* Reps completion */}
                <div className="space-y-1">
                  <div className="flex text-xs font-bold uppercase justify-between">
                    <span className="text-[10px] text-slate-400">Total Repetition milestones</span>
                    <span className={repsColorClass}>
                      {act.reps} of {trgReps} reps done ({repsPct}%)
                    </span>
                  </div>
                  <div className="bg-[#111120] h-2 rounded-full overflow-hidden border border-[#1e1e38]">
                    <div 
                      className="h-full rounded-full transition-all duration-500" 
                      style={{ 
                        backgroundColor: repsPct >= 100 ? '#00ff88' : repsPct >= 50 ? '#00d4ff' : '#ff2255', 
                        width: `${repsPct}%` 
                      }}
                    />
                  </div>
                </div>

                {/* Hours logged completion */}
                <div className="space-y-1">
                  <div className="flex text-xs font-bold uppercase justify-between">
                    <span className="text-[10px] text-slate-400">total tracked focus hours</span>
                    <span className={hrsColorClass}>
                      {act.hours.toFixed(1)}h of {trgHrs.toFixed(1)}h logged ({hrsPct}%)
                    </span>
                  </div>
                  <div className="bg-[#111120] h-2 rounded-full overflow-hidden border border-[#1e1e38]">
                    <div 
                      className="h-full rounded-full transition-all duration-500" 
                      style={{ 
                        backgroundColor: hrsPct >= 100 ? '#00ff88' : hrsPct >= 50 ? '#00d4ff' : '#ff6b1a', 
                        width: `${hrsPct}%` 
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Collapsed items level overrides lists */}
              {isExpanded && items.length > 0 && (
                <div className="px-4 pb-4 border-t border-[#111120] pt-4 bg-[#111120]/50 space-y-3">
                  <p className="text-[9px] text-slate-500 font-extrabold uppercase tracking-widest border-b border-[#1e1e38] pb-1">
                    ITEM-LEVEL SPECIFIC OVVERIDES ({daysLength} DAYS SCALE)
                  </p>

                  <div className="space-y-2">
                    {items.map(item => {
                      const itemK = `${cat.id}::${item}`;
                      const iact = actuals.item[itemK] || { reps: 0, hours: 0 };
                      const itrgReps = effGoal('item', itemK, 'reps');
                      const itrgHrs = effGoal('item', itemK, 'hours');

                      const iRepsAuto = isAuto('item', itemK, 'reps');
                      const iHrsAuto = isAuto('item', itemK, 'hours');

                      const iRepsPct = itrgReps > 0 ? Math.min(100, Math.round((iact.reps / itrgReps) * 105)) : 0;
                      const iHrsPct = itrgHrs > 0 ? Math.min(100, Math.round((iact.hours / itrgHrs) * 105)) : 0;

                      return (
                        <div key={item} className="flex flex-col sm:flex-row sm:items-center p-3 bg-[#0d0d1a] border border-[#1e1e38] rounded-lg gap-3">
                          
                          <div className="flex-1 min-w-[120px]">
                            <p className="text-xs font-bold text-slate-200">{item}</p>
                          </div>

                          {/* Inputs */}
                          <div className="flex flex-wrap items-center gap-3 shrink-0">
                            {/* Override reps */}
                            <div className="flex items-center gap-1 text-xs">
                              <span className="text-[9px] text-[#ff6b1a] font-bold">REPS:</span>
                              <input 
                                type="number"
                                className="w-12 bg-[#111120] border border-[#2a2a50] rounded px-1 text-center font-bold text-xs focus:outline-none"
                                value={iRepsAuto ? '' : itrgReps}
                                placeholder={String(itrgReps)}
                                onChange={(e) => onSaveGoal(period, 'item', itemK, 'reps', +e.target.value)}
                              />
                            </div>

                            {/* Override hours */}
                            <div className="flex items-center gap-1 text-xs">
                              <span className="text-[9px] text-amber-500 font-bold">HRS:</span>
                              <input 
                                type="number"
                                className="w-12 bg-[#111120] border border-[#2a2a50] rounded px-1 text-center font-bold text-xs focus:outline-none"
                                value={iHrsAuto ? '' : itrgHrs}
                                placeholder={String(itrgHrs)}
                                onChange={(e) => onSaveGoal(period, 'item', itemK, 'hours', +e.target.value)}
                              />
                            </div>
                          </div>

                          {/* Percentages bar visualization row */}
                          <div className="flex-1 min-w-[140px] space-y-1.5 pt-2 sm:pt-0">
                            {/* Reps */}
                            <div className="flex items-center gap-2">
                              <span className="text-[8px] text-slate-500 font-bold min-w-[45px] uppercase">Reps done</span>
                              <div className="flex-1 bg-slate-950 h-1 rounded-full overflow-hidden">
                                <div className="bg-[#ff6b1a] h-full" style={{ width: `${iRepsPct}%` }} />
                              </div>
                              <span className="text-[9px] font-mono font-black text-rose-400 min-w-[20px] text-right">{iRepsPct}%</span>
                            </div>

                            {/* Hours */}
                            <div className="flex items-center gap-2">
                              <span className="text-[8px] text-slate-500 font-bold min-w-[45px] uppercase">hrs done</span>
                              <div className="flex-1 bg-slate-950 h-1 rounded-full overflow-hidden">
                                <div className="bg-[#00d4ff] h-full" style={{ width: `${iHrsPct}%` }} />
                              </div>
                              <span className="text-[9px] font-mono font-black text-[#00d4ff] min-w-[20px] text-right">{iHrsPct}%</span>
                            </div>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
