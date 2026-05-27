import React, { useState, useMemo } from 'react';
import { AppState, TrackerCategory, TrackerStatus } from '../types';
import { fmtShort, todayStr, getWeek } from '../utils/date';
import {  CATS , getCatLabel } from '../utils/storage';
import { Search, Sliders, MapPin, Wallet, Calendar, Notebook, CheckSquare, CornerDownRight, Tag } from 'lucide-react';

interface SearchViewProps {
  state: AppState;
  onSetDate: (date: string) => void;
  onSetTab: (tab: TrackerCategory) => void;
  onNavigate: (viewId: string) => void;
  getDayD: (ds: string, cat: TrackerCategory, item: string) => any;
}

type ResultType = 'tracker' | 'journal' | 'finance' | 'expedition' | 'reminder';

interface SearchResult {
  id: string;
  type: ResultType;
  title: string;
  subtitle: string;
  dateStr: string;
  matchString: string;
  extra?: React.ReactNode;
  onOpen: () => void;
  icon: React.ReactNode;
}

export const SearchView: React.FC<SearchViewProps> = ({
  state,
  onSetDate,
  onSetTab,
  onNavigate,
  getDayD
}) => {
  const [query, setQuery] = useState('');
  const [moduleFilter, setModuleFilter] = useState<string>('all');
  const [rangeFilter, setRangeFilter] = useState<string>('all');
  const [customStartDate, setCustomStartDate] = useState(todayStr());
  const [customEndDate, setCustomEndDate] = useState(todayStr());

  const today = todayStr();
  const weekStart = getWeek(today)[0];
  const monthStart = today.slice(0, 8) + '01';

  const results = useMemo(() => {
    const allResults: SearchResult[] = [];

    // 1. Tracker Items
    if (moduleFilter === 'all' || moduleFilter === 'tracker') {
      Object.keys(state.daily).forEach((ds) => {
        CATS.forEach(c => {
          (state.items[c.id] || []).forEach(item => {
            const entry = getDayD(ds, c.id, item);
            const st: TrackerStatus = entry ? (entry.status || 'pending') : 'pending';
            const notes = entry?.notes || '';
            const isInteracted = entry?.reps > 0 || entry?.hours > 0 || st !== 'pending' || notes;
            
            // Only add index-worthy entries to prevent overwhelming noise
            // Always show if it's explicitly matched by query
            if (!query && !isInteracted) return;

            allResults.push({
              id: `tr-${ds}-${c.id}-${item}`,
              type: 'tracker',
              title: item,
              subtitle: `${c.icon} ${getCatLabel(state, c.id).toUpperCase()} | ${st.toUpperCase()}${notes ? ' · ' + notes : ''}`,
              dateStr: ds,
              matchString: `${item} ${notes} ${getCatLabel(state, c.id)} ${ds} tracker habit routine checkin`.toLowerCase(),
              icon: <CheckSquare size={14} style={{ color: c.neon }} />,
              extra: (
                <div className="flex gap-2 text-[10px] items-center font-mono">
                  {entry?.reps ? <span className="text-cyan-400 font-bold">×{entry.reps}</span> : null}
                  {entry?.hours ? <span className="text-amber-500 font-bold">{entry.hours}h</span> : null}
                  <span className={`px-1.5 py-0.5 rounded border scale-90 ${
                    st === 'done' ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10' :
                    st === 'missed' ? 'text-rose-500 border-rose-500/20 bg-rose-500/10' :
                    'text-slate-500 border-slate-700 bg-slate-800'
                  }`}>
                    {st.toUpperCase()}
                  </span>
                </div>
              ),
              onOpen: () => {
                onSetDate(ds);
                onSetTab(c.id);
                onNavigate('daily');
              }
            });
          });
        });
      });
    }

    // 2. Journals
    if (moduleFilter === 'all' || moduleFilter === 'journal') {
      Object.entries((state.journals as Record<string, any>) || {}).forEach(([ds, j]) => {
        const notes = j.notes || '';
        const promptsStr = Object.values(j.prompts || {}).join(' ');
        const tagsStr = (j.tags || []).join(' ');

        allResults.push({
          id: `jo-${ds}`,
          type: 'journal',
          title: `Daily Journal | Log`,
          subtitle: `${j.mood ? `Mood: ${j.mood}/5 | ` : ''}${tagsStr ? `[${tagsStr}] | ` : ''}${notes || 'No open text'}`,
          dateStr: ds,
          matchString: `${notes} ${promptsStr} ${tagsStr} journal diary ${ds}`.toLowerCase(),
          icon: <Notebook size={14} className="text-[#00ff88]" />,
          extra: <span className="text-[10px] font-black uppercase text-[#00ff88]">Journal</span>,
          onOpen: () => {
            onSetDate(ds);
            onNavigate('journal');
          }
        });
      });
    }

    // 3. Finances
    if (moduleFilter === 'all' || moduleFilter === 'finance') {
      (state.finances || []).forEach((f) => {
        allResults.push({
          id: `fin-${f.id}`,
          type: 'finance',
          title: `${f.type === 'income' ? '+' : '-'}$${f.amount.toFixed(2)} ${f.concept}`,
          subtitle: `Category: ${f.category}${f.splitWith ? ` | Split: ${f.splitWith}` : ''}${f.links ? ` | Reference: ${f.links}` : ''}`,
          dateStr: f.date,
          matchString: `${f.concept} ${f.category} ${f.splitWith || ''} ${f.amount} finance ledger money budget transaction debit credit ${f.date}`.toLowerCase(),
          icon: <Wallet size={14} className={f.type === 'income' ? "text-emerald-400" : "text-rose-400"} />,
          extra: <span className={`text-[10px] font-black uppercase ${f.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>Finance</span>,
          onOpen: () => {
            onNavigate('finances');
          }
        });
      });
    }

    // 4. Expeditions
    if (moduleFilter === 'all' || moduleFilter === 'expedition') {
      (state.expeditions || []).forEach((e) => {
        allResults.push({
          id: `exp-${e.id}`,
          type: 'expedition',
          title: e.title,
          subtitle: `Loc: ${e.location || 'N/A'} | ${e.dateStart} to ${e.dateEnd}`,
          dateStr: e.dateStart,
          matchString: `${e.title} ${e.location || ''} ${e.notes || ''} expedition trip travel destination ${e.dateStart}`.toLowerCase(),
          icon: <MapPin size={14} className="text-[#00d4ff]" />,
          extra: <span className="text-[10px] font-black uppercase text-[#00d4ff]">Expedition</span>,
          onOpen: () => {
            onNavigate('expeditions');
          }
        });
      });
    }

    // 5. Reminders
    if (moduleFilter === 'all' || moduleFilter === 'reminder') {
      (state.reminders || []).forEach((r) => {
        allResults.push({
          id: `rem-${r.id}`,
          type: 'reminder',
          title: r.title,
          subtitle: `${r.priority ? `[${r.priority.toUpperCase()}] ` : ''}${r.notes || ''}`,
          dateStr: r.dueDate,
          matchString: `${r.title} ${r.notes} ${r.priority} reminder alert warning ${r.dueDate}`.toLowerCase(),
          icon: <Calendar size={14} className="text-amber-400" />,
          extra: (
            <span className={`text-[10px] font-black uppercase ${r.status === 'done' ? 'text-emerald-400 line-through' : 'text-amber-400 animate-pulse'}`}>
              Alert
            </span>
          ),
          onOpen: () => {
            onNavigate('reminders');
          }
        });
      });
    }

    // Filter, sort
    let filtered = allResults;
    const q = query.toLowerCase().trim();

    if (q) {
      filtered = filtered.filter(f => f.matchString.includes(q));
    }

    if (rangeFilter !== 'all') {
      filtered = filtered.filter(f => {
        if (rangeFilter === 'today' && f.dateStr !== today) return false;
        if (rangeFilter === 'week' && (f.dateStr < weekStart || f.dateStr > today)) return false;
        if (rangeFilter === 'month' && (f.dateStr < monthStart || f.dateStr > today)) return false;
        if (rangeFilter === 'custom' && (f.dateStr < customStartDate || f.dateStr > customEndDate)) return false;
        return true;
      });
    }

    filtered.sort((a, b) => (b.dateStr || "").localeCompare(a.dateStr || ""));
    return filtered;

  }, [state, query, moduleFilter, rangeFilter, customStartDate, customEndDate, today, weekStart, monthStart, getDayD, onSetDate, onSetTab, onNavigate]);

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      
      {/* Header Desk */}
      <div className="border-b border-[#2a2a50] pb-5">
        <h2 className="text-3xl font-extrabold tracking-tight text-white font-display">
          Omni <span className="text-[#00ff88]">Search Engine</span>
        </h2>
        <p className="text-xs uppercase tracking-widest text-[#a1a1aa] mt-1 font-mono flex items-center gap-2">
          <Search size={14} className="text-[#00ff88]" />
          GLOBAL DATA INDEX · CROSS-MODULE QUERY
        </p>
      </div>

      {/* Advanced Search Overlay */}
      <div className="bg-[#111120]/80 border border-[#2a2a50]/60 rounded-2xl p-5 shadow-2xl backdrop-blur-xl space-y-4">
        
        {/* Main Search Input */}
        <div className="relative group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search size={18} className="text-[#00ff88] group-focus-within:animate-pulse transition" />
          </div>
          <input 
            type="text"
            className="w-full bg-[#0d0d1a] border border-[#2a2a50] hover:border-[#00ff88]/50 focus:border-[#00ff88] rounded-xl px-4 py-4 pl-12 text-sm text-white placeholder-slate-600 focus:outline-none transition shadow-inner font-bold font-mono"
            placeholder="Query tracker records, finances, expeditions, journals, alerts..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute inset-y-0 right-4 flex items-center text-slate-400 hover:text-white font-black"
            >
              ×
            </button>
          )}
        </div>

        {/* Filter Selection Panel */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-[#2a2a50]/40 pt-4">
          
          <div className="space-y-1.5 flex flex-col">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block flex items-center gap-1.5">
              <Sliders size={10} /> Node Filter Selection
            </span>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {[
                { id: 'all', label: 'All Modules' },
                { id: 'tracker', label: 'Trackers' },
                { id: 'journal', label: 'Journals' },
                { id: 'finance', label: 'Finances' },
                { id: 'expedition', label: 'Expeditions' },
                { id: 'reminder', label: 'Alerts' },
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setModuleFilter(opt.id)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                    moduleFilter === opt.id 
                    ? 'bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/40 shadow-sm'
                    : 'bg-[#0d0d1a] text-slate-500 border border-[#2a2a50] hover:bg-[#111120] hover:text-slate-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5 flex flex-col">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block flex items-center gap-1.5">
              <Calendar size={10} /> Timeline Slicing
            </span>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'all', label: 'All Data' },
                { id: 'today', label: 'Today Only' },
                { id: 'week', label: 'Past 7 Days' },
                { id: 'month', label: 'Past 30 Days' },
                { id: 'custom', label: 'Custom Range' },
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setRangeFilter(opt.id)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                    rangeFilter === opt.id 
                    ? 'bg-[#ff6b1a]/10 text-[#ff6b1a] border border-[#ff6b1a]/40 shadow-sm'
                    : 'bg-[#0d0d1a] text-slate-500 border border-[#2a2a50] hover:bg-[#111120] hover:text-slate-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {rangeFilter === 'custom' && (
              <div className="flex items-center gap-2 mt-2 p-2 bg-[#0d0d1a] border border-[#2a2a50] rounded-lg">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="bg-transparent text-[10px] text-white font-mono uppercase focus:outline-none w-full color-scheme-dark"
                />
                <span className="text-[10px] text-slate-500 font-black">TO</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="bg-transparent text-[10px] text-white font-mono uppercase focus:outline-none w-full color-scheme-dark"
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 mt-2">
          <span>{query ? "ACTIVE DYNAMIC QUERY" : "AWAITING INSTRUCTIONS"}</span>
          <span className="text-[#00ff88] font-bold">[{results.length}] MATCHES FOUND</span>
        </div>
      </div>

      {/* Results Ledger */}
      <div className="space-y-3 pt-2">
        {results.length > 0 ? (
          <div className="grid gap-3">
            {results.slice(0, 150).map((r, idx) => (
              <div 
                key={`${r.id}-${idx}`} 
                onClick={r.onOpen}
                className="group flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-[#111120]/40 hover:bg-[#111120] border border-[#2a2a50]/60 hover:border-[#00ff88]/40 rounded-xl transition cursor-pointer"
              >
                {/* Module Avatar */}
                <div className="p-3 bg-[#0d0d1a] border border-[#2a2a50] rounded-xl shrink-0 group-hover:scale-110 transition-transform">
                  {r.icon}
                </div>

                {/* Body Details */}
                <div className="flex-1 min-w-0 flex flex-col gap-1 w-full sm:w-auto">
                  <div className="flex items-center justify-between w-full">
                    <h5 className="text-xs font-black text-slate-200 uppercase tracking-widest font-mono truncate">{r.title}</h5>
                    <div className="flex items-center gap-3">
                      {r.extra && <div>{r.extra}</div>}
                      <span className="text-[10px] font-bold text-slate-500 font-mono shrink-0 whitespace-nowrap">
                        {r.dateStr}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-1.5 text-[11px] text-slate-400">
                    <CornerDownRight size={12} className="shrink-0 mt-0.5 text-slate-600" />
                    <span className="line-clamp-2 leading-relaxed">{r.subtitle}</span>
                  </div>
                </div>

                {/* Action Trigger */}
                <div className="w-full sm:w-auto mt-2 sm:mt-0 flex justify-end shrink-0">
                  <button className="px-3 py-1.5 bg-[#00ff88]/5 text-[#00ff88] border border-[#00ff88]/20 group-hover:bg-[#00ff88] group-hover:text-black rounded-lg text-[10px] uppercase tracking-wider font-black transition whitespace-nowrap">
                    ACCESS
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-64 flex flex-col items-center justify-center border border-dashed border-[#2a2a50] rounded-2xl bg-[#111120]/20">
            <Search size={32} className="text-slate-700 mb-4" />
            <p className="text-xs text-slate-500 font-black uppercase tracking-widest font-mono text-center max-w-md leading-relaxed">
              // NO RECORD MATCHES DATABASE CRITERIA<br/>
              <span className="text-slate-600 text-[10px]">Alter node filter selection or timeline slicing to expand search radius</span>
            </p>
          </div>
        )}
      </div>

    </div>
  );
};

