import React, { useState } from 'react';
import { AppState, TrackerCategory, TrackerStatus } from '../types';
import { fmtShort, todayStr, getWeek } from '../utils/date';
import { CATS } from '../utils/storage';
import { Search, Sliders, Play, Tag, CornerDownRight } from 'lucide-react';

interface SearchViewProps {
  state: AppState;
  onSetDate: (date: string) => void;
  onSetTab: (tab: TrackerCategory) => void;
  onNavigate: (viewId: string) => void;
  getDayD: (ds: string, cat: TrackerCategory, item: string) => any;
}

export const SearchView: React.FC<SearchViewProps> = ({
  state,
  onSetDate,
  onSetTab,
  onNavigate,
  getDayD
}) => {
  const [query, setQuery] = useState('');
  const [catFilter, setCatFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [rangeFilter, setRangeFilter] = useState<string>('');

  const today = todayStr();
  const weekStart = getWeek(today)[0];
  const monthStart = today.slice(0, 8) + '01';

  // Perform search queries
  const results = React.useMemo(() => {
    const arr: { dateStr: string; cat: typeof CATS[0]; item: string; reps: number; hours: number; notes: string; status: TrackerStatus }[] = [];

    Object.keys(state.daily).forEach((ds) => {
      // Range filters
      if (rangeFilter === 'today' && ds !== today) return;
      if (rangeFilter === 'week' && (ds < weekStart || ds > today)) return;
      if (rangeFilter === 'month' && (ds < monthStart || ds > today)) return;

      CATS.forEach(c => {
        if (catFilter && catFilter !== c.id) return;
        (state.items[c.id] || []).forEach(item => {
          const entry = getDayD(ds, c.id, item);
          const st: TrackerStatus = entry ? (entry.status || 'pending') : 'pending';

          if (statusFilter && statusFilter !== st) return;

          // Search criteria (case-insensitive checks)
          const notesText = entry ? (entry.notes || '') : '';
          const matchString = `${item} ${notesText} ${c.label} ${ds}`.toLowerCase();
          if (query && !matchString.includes(query.toLowerCase())) return;

          arr.push({
            dateStr: ds,
            cat: c,
            item,
            reps: entry ? (entry.reps || 0) : 0,
            hours: entry ? (entry.hours || 0) : 0,
            notes: notesText,
            status: st
          });
        });
      });
    });

    // Sort descending by date
    return arr.sort((a, b) => b.dateStr.localeCompare(a.dateStr));
  }, [state, query, catFilter, statusFilter, rangeFilter, today, weekStart, monthStart, getDayD]);

  const sMeta: Record<TrackerStatus, { label: string; style: string }> = {
    pending: { label: 'PENDING', style: 'text-slate-400 bg-slate-900 border-slate-800' },
    done: { label: '✓ DONE', style: 'text-emerald-400 bg-emerald-500/5 border-emerald-500/20' },
    missed: { label: '✗ MISSED', style: 'text-rose-500 bg-rose-500/5 border-rose-500/20' },
    skipped: { label: '↷ SKIPPED', style: 'text-slate-500 bg-slate-800/10 border-[#1e1e38]' }
  };

  return (
    <div className="space-y-6">
      {/* Header and Input Search bar overlay */}
      <div>
        <h2 className="text-xl font-extrabold tracking-wider text-[#ff6b1a]">
          SEARCH & <span className="text-slate-100 font-extrabold">QUERY ENGINE</span>
        </h2>
        <p className="text-xs uppercase tracking-widest text-[#555577] mt-1">
          SCAN ALL HISTORICAL LOG ENTRIES · FILTER checkins status AND TIME SLICES
        </p>
      </div>

      {/* Query filters desk */}
      <div className="bg-[#0d0d1a] border border-[#1e1e38] rounded-xl p-4 space-y-3.5">
        <div className="relative">
          <input 
            type="text"
            className="w-full bg-[#111120] border border-[#2a2a50] rounded-xl px-4 py-2.5 pl-10 text-xs text-slate-100 placeholder-slate-700 focus:outline-none focus:border-[#00d4ff] transition font-medium"
            placeholder="Search items, notes keyword, category types or dates..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Search size={14} className="text-slate-500 absolute left-3.5 top-3.5" />
        </div>

        {/* Filter dropdown selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Category */}
          <div className="space-y-1">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">Fit Categories</span>
            <select 
              className="w-full bg-[#111120] border border-[#1e1e38] rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-slate-700 font-bold transition"
              value={catFilter}
              onChange={(e) => setCatFilter(e.target.value)}
            >
              <option value="">ALL CATEGORIES</option>
              {CATS.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label.toUpperCase()}</option>)}
            </select>
          </div>

          {/* Status */}
          <div className="space-y-1">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">checkins status</span>
            <select 
              className="w-full bg-[#111120] border border-[#1e1e38] rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-slate-700 font-bold transition"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">ALL STATUS</option>
              <option value="done">✓ DONE</option>
              <option value="missed">✗ MISSED</option>
              <option value="pending">◷ PENDING</option>
              <option value="skipped">↷ SKIPPED</option>
            </select>
          </div>

          {/* Range Selection */}
          <div className="space-y-1">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">timeline slice</span>
            <select 
              className="w-full bg-[#111120] border border-[#1e1e38] rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-slate-700 font-bold transition"
              value={rangeFilter}
              onChange={(e) => setRangeFilter(e.target.value)}
            >
              <option value="">ANY TIME INTERVAL</option>
              <option value="today">TODAY ONLY</option>
              <option value="week">THIS WEEK</option>
              <option value="month">THIS MONTH</option>
            </select>
          </div>
        </div>

        <p className="text-[9px] text-slate-600 font-mono text-right select-none uppercase">
          // found {results.length} elements matches
        </p>
      </div>

      {/* Results panel list */}
      <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
        {results.length > 0 ? (
          results.slice(0, 150).map((r, idx) => {
            const meta = sMeta[r.status] || sMeta['pending'];
            return (
              <div 
                key={`${r.dateStr}-${r.cat.id}-${r.item}-${idx}`} 
                className="flex items-center gap-3.5 p-3 bg-[#0d0d1a] border border-[#1e1e38] rounded-xl hover:border-slate-700 transition"
              >
                {/* Status Toggle style but static */}
                <span className={`px-2.5 py-1 text-[9px] font-black border rounded scale-95 shrink-0 ${meta.style}`}>
                  {meta.label}
                </span>

                {/* Body details */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h5 className="text-xs font-bold text-slate-200 truncate">{r.item}</h5>
                    <span className="text-[9px] uppercase font-black" style={{ color: r.cat.neon }}>
                      {r.cat.icon} {r.cat.label}
                    </span>
                  </div>
                  
                  {r.notes ? (
                    <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-1 font-medium truncate">
                      <CornerDownRight size={10} className="text-slate-600" />
                      <span>{r.notes}</span>
                    </div>
                  ) : <div className="h-1.5" />}
                </div>

                <div className="flex items-center gap-4 shrink-0 font-mono text-[10px] text-slate-500 leading-none">
                  {r.reps > 0 && <span className="text-cyan-400 font-bold">×{r.reps}</span>}
                  {r.hours > 0 && <span className="text-amber-500 font-bold">{r.hours.toFixed(1)}h</span>}
                  <span className="text-slate-600 font-bold">{fmtShort(r.dateStr)}</span>
                </div>

                <button
                  onClick={() => {
                    onSetDate(r.dateStr);
                    onSetTab(r.cat.id);
                    onNavigate('daily');
                  }}
                  className="px-2.5 py-1 bg-[#1c1c35] border border-[#2a2a50] text-[#00d4ff] hover:border-[#00d4ff] hover:bg-[#00d4ff]/10 rounded text-[9px] uppercase tracking-wider font-extrabold transition shrink-0"
                >
                  OPEN ▶
                </button>
              </div>
            );
          })
        ) : (
          <div className="h-44 flex flex-col items-center justify-center border border-dashed border-[#1e1e38] rounded-xl bg-[#0d0d1a]/50">
            <Search size={28} className="text-slate-800" />
            <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest mt-2">// No matches found</p>
          </div>
        )}
      </div>
    </div>
  );
};
