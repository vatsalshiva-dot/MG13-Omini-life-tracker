import React, { useState, useMemo, useEffect, useRef } from 'react';
import { AppState, TrackerCategory, TrackerStatus } from '../types';
import { fmtShort, todayStr, getWeek } from '../utils/date';
import { CATS , getCatLabel } from '../utils/storage';
import { Search, Sliders, MapPin, Wallet, Calendar, Notebook, CheckSquare, CornerDownRight, Tag, Network, Bot } from 'lucide-react';
import * as d3 from 'd3';
import { synthesizeLocalPriest } from '../utils/priestLocal';

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
  const [isSearchingRag, setIsSearchingRag] = useState(false);
  const [aiAnswer, setAiAnswer] = useState<string>('');
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const selectedNodeRef = useRef<any>(null);
  const [showMax, setShowMax] = useState<number>(10);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

  // D3 Knowledge Graph (Rendered AFTER results generation)
  useEffect(() => {
    const reqIdle = window.requestIdleCallback || ((cb: any) => window.setTimeout(cb, 1) as unknown as number);
    const clearIdle = window.cancelIdleCallback || ((id: any) => window.clearTimeout(id));

    let simulation: any = null;
    let rbId = reqIdle(() => {
      if (!canvasRef.current) return;
      
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      const updateCanvasSize = () => {
        if (!canvas.parentElement) return;
        const rect = canvas.parentElement.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
      };
      updateCanvasSize();
      
      const width = canvas.width;
      const height = canvas.height;
      
      ctx.clearRect(0, 0, width, height);

      // We will restructure the node building slightly to allow deep interaction.
      const nodesMap = new Map();
      const linksMap = new Map();
      
      // Node extraction from dynamic search results
      results.forEach((r, idx) => {
          if (idx > 300) return; // limit nodes for performance

          let catGroup = r.type === 'finance' ? 'finance' : 
                         r.type === 'journal' ? 'journal' :
                         r.type === 'tracker' ? 'tracker' :
                         r.type === 'reminder' ? 'reminder' :
                         r.type === 'expedition' ? 'expedition' : 'custom';
                         
          let radius = r.type === 'finance' ? 12 : 
                       r.type === 'journal' ? 15 : 
                       r.type === 'expedition' ? 14 : 
                       r.type === 'reminder' ? 11 : 10;
                       
          let entryNodeId = r.id; // Unique id
          if (!nodesMap.has(entryNodeId)) {
             nodesMap.set(entryNodeId, { id: entryNodeId, title: r.title || r.id, group: catGroup, radius, rawData: r });
          }

          const sub = r.subtitle || '';
          
          // Auto-link by exact Tags / Keywords (like Obsidian Tag Nodes)
          const tags = sub.match(/\[([^\]]+)\]/g);
          if (tags) {
              tags.forEach(t => {
                 let tag = t.toLowerCase();
                 if (!nodesMap.has(tag)) {
                    nodesMap.set(tag, { id: tag, title: tag, group: 'tag', radius: 8, rawData: { title: tag, type: 'tag', desc: 'Auto-extracted semantic tag' } });
                 }
                 const linkId = `${entryNodeId}-${tag}`;
                 if (!linksMap.has(linkId)) {
                    linksMap.set(linkId, { source: entryNodeId, target: tag, value: 1 });
                 }
              });
          }

          // Link by Date (Timeline nodes)
          if (r.dateStr) {
             const ds = r.dateStr;
             if (!nodesMap.has(ds)) {
                nodesMap.set(ds, { id: ds, title: ds, group: 'date', radius: 5, rawData: { title: ds, type: 'date', dateStr: ds, desc: 'Temporal anchor point' } });
             }
             const linkId = `${entryNodeId}-${ds}`;
             if (!linksMap.has(linkId)) {
                 linksMap.set(linkId, { source: entryNodeId, target: ds, value: 0.2 });
             }
          }
      });

      // Filter out isolated nodes if there are too many
      const nodes = Array.from(nodesMap.values());
      const links = Array.from(linksMap.values());

      let transform = d3.zoomIdentity;

      simulation = d3.forceSimulation(nodes)
          .force("charge", d3.forceManyBody().strength(-80).distanceMax(200))
          .force("center", d3.forceCenter(width / 2, height / 2))
          .force("link", d3.forceLink(links).id((d: any) => d.id).distance(60).strength(0.3))
          .force("collide", d3.forceCollide().radius((d: any) => d.radius + 15).iterations(2))
          .on("tick", () => {
              ctx.save();
              ctx.clearRect(0, 0, width, height);
              ctx.translate(transform.x, transform.y);
              ctx.scale(transform.k, transform.k);
              
              const activeNode = selectedNodeRef.current;
              const activeNodeId = activeNode ? activeNode.id : null;
              
              let connected = new Set();
              if (activeNodeId) {
                 connected.add(activeNodeId);
                 links.forEach(l => {
                     if (l.source.id === activeNodeId) connected.add(l.target.id);
                     if (l.target.id === activeNodeId) connected.add(l.source.id);
                 });
              }

              ctx.beginPath();
              links.forEach(d => {
                  if (activeNodeId) {
                      if (d.source.id === activeNodeId || d.target.id === activeNodeId) {
                          ctx.strokeStyle = "rgba(0, 255, 136, 0.8)";
                          ctx.lineWidth = 2;
                      } else {
                          ctx.strokeStyle = "rgba(42, 42, 80, 0.1)";
                          ctx.lineWidth = 0.5;
                      }
                  } else {
                      ctx.strokeStyle = "rgba(42, 42, 80, 0.4)";
                      ctx.lineWidth = 1;
                  }
                  
                  ctx.beginPath();
                  ctx.moveTo(d.source.x, d.source.y);
                  ctx.lineTo(d.target.x, d.target.y);
                  ctx.stroke();
              });

              nodes.forEach(d => {
                  let isConnected = activeNodeId ? connected.has(d.id) : true;
                  ctx.globalAlpha = isConnected ? 1 : 0.15;
                  
                  ctx.beginPath();
                  ctx.moveTo(d.x + d.radius, d.y);
                  ctx.arc(d.x, d.y, d.radius, 0, 2 * Math.PI);
                  if (d.group === 'finance') ctx.fillStyle = "#ff00a0";
                  else if (d.group === 'journal') ctx.fillStyle = "#00d4ff";
                  else if (d.group === 'tracker') ctx.fillStyle = "#00ff88"; // standard neon green
                  else if (d.group === 'expedition') ctx.fillStyle = "#ff9900"; // Orange
                  else if (d.group === 'reminder') ctx.fillStyle = "#aa44ff"; // Purple
                  else if (d.group === 'tag') ctx.fillStyle = "#facc15"; // Yellow for tags
                  else if (d.group === 'date') ctx.fillStyle = "#a1a1aa";
                  else ctx.fillStyle = "#ffffff";
                   
                  ctx.fill();
                  ctx.strokeStyle = "#ffffff";
                  ctx.lineWidth = d.group === 'tag' ? 0 : 1.5;
                  ctx.stroke();
                  
                  if (d.radius > 5 || transform.k > 1.5 || isConnected) {
                    ctx.fillStyle = d.group === 'tag' ? "#facc15" : "#ffffff";
                    ctx.font = `bold ${Math.max(10, 10/transform.k)}px 'JetBrains Mono'`;
                    ctx.textAlign = "center";
                    let label = d.title || d.id;
                    if (label.length > 20) label = label.substring(0,20) + '...';
                    ctx.fillText(label, d.x, d.y + d.radius + 15);
                  }
              });
              ctx.restore();
          });
          
      // Drag Interaction
      d3.select(canvas).call(
        d3.drag<HTMLCanvasElement, any>()
            .subject((e) => {
               // Adjust for transform
               const invX = transform.invertX(e.x);
               const invY = transform.invertY(e.y);
               const r = 20; // Hit radius
               let found = null;
               for (let i = nodes.length - 1; i >= 0; --i) {
                   const node = nodes[i];
                   const dx = invX - node.x;
                   const dy = invY - node.y;
                   if (dx * dx + dy * dy < r * r) {
                       found = node;
                       break;
                   }
               }
               return found;
            })
            .on("start", (e) => {
               if (!e.active) simulation.alphaTarget(0.3).restart();
               e.subject.fx = e.subject.x;
               e.subject.fy = e.subject.y;
            })
            .on("drag", (e) => {
               // Drag works in zoomed space
               e.subject.fx = transform.invertX(e.x);
               e.subject.fy = transform.invertY(e.y);
            })
            .on("end", (e) => {
               if (!e.active) simulation.alphaTarget(0);
               e.subject.fx = null;
               e.subject.fy = null;
            })
      );
      
      // Zoom and Click Interaction
      d3.select(canvas).on("click", (e) => {
         const invX = transform.invertX(e.offsetX);
         const invY = transform.invertY(e.offsetY);
         let found = null;
         for (let i = nodes.length - 1; i >= 0; --i) {
             const node = nodes[i];
             const dx = invX - node.x;
             const dy = invY - node.y;
             if (dx * dx + dy * dy < (node.radius + 10) * (node.radius + 10)) {
                 found = node;
                 break;
             }
         }
         // Important: Need to use a ref or closure careful with React state inside D3
         if (found) {
             setSelectedNode(found);
             selectedNodeRef.current = found;
             simulation.alpha(0.3).restart();
         } else {
             setSelectedNode(null);
             selectedNodeRef.current = null;
             simulation.alpha(0.3).restart();
         }
      });

      d3.select(canvas).call(
          d3.zoom<HTMLCanvasElement, any>()
            .scaleExtent([0.1, 4])
            .on("zoom", (e) => {
                transform = e.transform;
                simulation.alpha(0.1).restart();
            })
      );

      
      const handleResize = () => {
         if (!canvasRef.current || !simulation) return;
         updateCanvasSize();
         simulation.force("center", d3.forceCenter(canvasRef.current.width / 2, canvasRef.current.height / 2));
         simulation.alpha(1).restart();
      };
      window.addEventListener("resize", handleResize);

    }, { timeout: 1000 });

    return () => {
      clearIdle(rbId);
      if (simulation) simulation.stop();
      window.removeEventListener("resize", () => {});
    };
  }, [results]);

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      
      {/* Header Desk */}
      <div className="border-b border-[#2a2a50] pb-5">
        <h2 className="text-3xl font-extrabold tracking-tight text-white font-display">
          Search <span className="text-[#00ff88]">Your Life</span>
        </h2>
        <p className="text-xs uppercase tracking-widest text-[#a1a1aa] mt-1 font-mono flex items-center gap-2">
           <Search size={14} className="text-[#00ff88]" />
           NEURAL NETWORK KNOWLEDGE GRAPH & CONVERSATIONAL QUERY
        </p>
      </div>

      {/* Advanced Search Overlay */}
      <div className="bg-[#111120]/80 border border-[#2a2a50]/60 rounded-2xl p-5 shadow-2xl backdrop-blur-xl space-y-4">
        
        {/* Main Search Input */}
        <div className="flex gap-2">
            <div className="relative group flex-1">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Search size={18} className="text-[#00ff88] group-focus-within:animate-pulse transition" />
              </div>
              <input 
                type="text"
                className="w-full bg-[#0d0d1a] border border-[#2a2a50] hover:border-[#00ff88]/50 focus:border-[#00ff88] rounded-xl px-4 py-4 pl-12 text-sm text-white placeholder-slate-600 focus:outline-none transition shadow-inner font-bold font-mono"
                placeholder="Query tracker records, finances, expeditions, journals, alerts..."
                value={query}
                onChange={(e) => {
                    setQuery(e.target.value);
                    setAiAnswer(''); // Clear semantic matches when typing
                }}
              />
              {query && (
                <button
                  onClick={() => {
                    setQuery('');
                    setAiAnswer('');
                  }}
                  className="absolute inset-y-0 right-4 flex items-center text-slate-400 hover:text-white font-black"
                >
                  ×
                </button>
              )}
            </div>
            
            <button
               onClick={async () => {
                   if (!query) {
                      alert("Please ask a question or enter a search query.");
                      return;
                   }
                   try {
                       setIsSearchingRag(true);
                       
                       // Construct minimal state summary tracking to send
                       const stateSummary = {
                           finances: (state.finances || []).slice(0, 10).map(f => ({ c: f.concept, a: f.amount, d: f.date, cat: f.category })),
                           journals: Object.keys(state.journals || {}).slice(0, 7).reduce((acc: any, k) => { 
                               acc[k] = { 
                                   notes: (state.journals[k].notes || '').substring(0, 200),
                                   mood: state.journals[k].mood
                               }; 
                               return acc; 
                           }, {}),
                           daily: Object.keys(state.daily || {}).slice(0, 3).reduce((acc: any, k) => { acc[k] = state.daily[k]; return acc; }, {})
                       };
                       
                       // INSTANT LOCAL INFERENCE (The Priest)
                       const localRes = synthesizeLocalPriest(query, state, todayStr());
                       setAiAnswer(localRes.answer + " ..."); // indicating thinking
                       if (localRes.filters) {
                           if (localRes.filters.module) setModuleFilter(localRes.filters.module as any);
                           if (localRes.filters.dateStart) {
                               setRangeFilter('custom');
                               setCustomStartDate(localRes.filters.dateStart);
                               setCustomEndDate(localRes.filters.dateEnd || localRes.filters.dateStart);
                           }
                       }

                       const response = await fetch('/api/search-life', {
                           method: 'POST',
                           headers: { 'Content-Type': 'application/json' },
                           body: JSON.stringify({ text: query, today: todayStr(), stateSummary })
                       });
                       
                       const data = await response.json();
                       // We prefer our new advanced local priest output if rate limited, or if there's an error.
                       if (data.filters && !data.error) {
                           if (data.filters.module && data.filters.module !== 'all') {
                               setModuleFilter(data.filters.module);
                           }
                           if (data.filters.dateStart && data.filters.dateEnd) {
                               setRangeFilter('custom');
                               setCustomStartDate(data.filters.dateStart);
                               setCustomEndDate(data.filters.dateEnd);
                           }
                       }
                       if (data.answer && !data.error) {
                           setAiAnswer(data.answer);
                       } else if (data.error) {
                           setAiAnswer(localRes.answer); // Fallback to fully loaded local response silently
                           console.error(data.error);
                       }
                   } catch (e) {
                       console.error(e);
                       // Cannot run `synthesizeLocalPriest` here again, it's already generated. Just use the original one. 
                       // I am removing the duplicate call here, but will just use the old fallback message temporarily or recalculate it contextually in the catch block if needed.
                       // Oh wait, `localRes` is defined inside `try`, so it is scoped.
                       const localComplete = synthesizeLocalPriest(query, state, todayStr());
                       setAiAnswer(localComplete.answer); // Fully load local response silently on network failure
                   } finally {
                       setIsSearchingRag(false);
                   }
               }}
               disabled={isSearchingRag}
               className="bg-[#0b103d] border border-cyan-500 text-cyan-400 px-6 rounded-xl font-bold uppercase text-[10px] tracking-widest hover:bg-cyan-500/20 transition-all flex items-center gap-2 whitespace-nowrap disabled:opacity-50"
            >
                <Bot size={14} className={isSearchingRag ? 'animate-bounce' : 'animate-pulse'} />
                {isSearchingRag ? 'THINKING...' : 'TALK TO DATA'}
            </button>
        </div>

        {/* AI Answer Banner */}
        {aiAnswer && (
           <div className="bg-[#0b103d]/40 border border-cyan-500/30 p-4 rounded-xl flex items-start gap-4 mt-6">
              <Bot size={24} className="text-cyan-400 mt-1 shrink-0" />
              <div>
                  <h4 className="text-cyan-400 font-black text-[10px] uppercase tracking-widest font-mono mb-1 bg-cyan-900/30 inline-block px-2 py-1 rounded">The Priest · Insight Engine</h4>
                  <p className="text-sm font-medium text-slate-200 leading-relaxed mt-2">{aiAnswer}</p>
              </div>
           </div>
        )}

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
      <div className="space-y-3 pt-4">
        {results.length > 0 ? (
          <div className="grid gap-3">
            {results.slice(0, showMax).map((r, idx) => (
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
            
            {results.length > showMax && (
              <button 
                onClick={() => setShowMax(prev => prev + 10)}
                className="w-full py-3 bg-[#111120] border border-[#2a2a50] hover:bg-[#111120]/80 hover:border-cyan-500/50 rounded-xl text-[10px] uppercase font-bold tracking-widest text-cyan-400 transition"
              >
                 LOAD MORE PROTOCOLS ({results.length - showMax} REMAINING)
              </button>
            )}
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

      {/* Interactive D3 Knowledge Graph */}
      <div className="w-full h-80 md:h-[450px] bg-[#0d0d1a] border border-[#2a2a50] rounded-2xl shadow-inner relative overflow-hidden flex flex-col group mt-8">
         <div className="absolute top-4 left-4 z-10 flex flex-wrap gap-2 pointer-events-none max-w-full pr-4">
            <div className="flex items-center gap-2 bg-[#111120]/80 rounded p-2 text-[10px] font-mono border border-[#2a2a50]">
               <div className="w-2 h-2 rounded-full bg-[#00ff88]" /> Habit/Task
            </div>
            <div className="flex items-center gap-2 bg-[#111120]/80 rounded p-2 text-[10px] font-mono border border-[#2a2a50]">
               <div className="w-2 h-2 rounded-full bg-[#ff00a0]" /> Finances
            </div>
            <div className="flex items-center gap-2 bg-[#111120]/80 rounded p-2 text-[10px] font-mono border border-[#2a2a50]">
               <div className="w-2 h-2 rounded-full bg-[#00d4ff]" /> Journal/Note
            </div>
            <div className="flex items-center gap-2 bg-[#111120]/80 rounded p-2 text-[10px] font-mono border border-[#2a2a50]">
               <div className="w-2 h-2 rounded-full bg-[#ff9900]" /> Expedition
            </div>
            <div className="flex items-center gap-2 bg-[#111120]/80 rounded p-2 text-[10px] font-mono border border-[#2a2a50]">
               <div className="w-2 h-2 rounded-full bg-[#aa44ff]" /> Reminder
            </div>
            <div className="flex items-center gap-2 bg-[#111120]/80 rounded p-2 text-[10px] font-mono border border-[#2a2a50]">
               <div className="w-2 h-2 rounded-full bg-[#facc15]" /> Tags
            </div>
            <div className="flex items-center gap-2 bg-[#111120]/80 text-slate-400 rounded p-2 text-[10px] font-mono border border-[#2a2a50]">
               (Scroll to Zoom, Drag to Pan)
            </div>
         </div>
         
         {/* Node Details Overlay */}
         {selectedNode && (
            <div className="absolute right-4 top-4 bottom-4 w-72 bg-[#111120]/95 backdrop-blur-md border border-cyan-500/40 rounded-xl p-5 shadow-2xl z-20 overflow-y-auto animate-fade-in text-left flex flex-col">
               <button 
                  onClick={() => {
                     setSelectedNode(null);
                     selectedNodeRef.current = null;
                  }} 
                  className="self-end text-slate-400 hover:text-white pb-2"
               >
                  ✕
               </button>
               <h4 className="text-cyan-400 font-extrabold uppercase tracking-widest text-[11px] mb-4 border-b border-[#2a2a50] pb-2">
                 Entity Inspector
               </h4>
               
               <div className="space-y-4">
                 <div>
                   <div className="text-[9px] text-slate-500 tracking-wider">TITLE / FOCUS</div>
                   <div className="text-sm font-bold text-white mt-1 leading-tight">{selectedNode.rawData.title || selectedNode.id}</div>
                 </div>
                 
                 <div>
                   <div className="text-[9px] text-slate-500 tracking-wider">TYPE</div>
                   <div className="text-xs font-mono text-cyan-400 mt-1 uppercase bg-cyan-900/30 inline-block px-2 py-1 rounded">
                     {selectedNode.group}
                   </div>
                 </div>

                 {selectedNode.rawData.dateStr && (
                 <div>
                   <div className="text-[9px] text-slate-500 tracking-wider">TIMESTMP</div>
                   <div className="text-xs font-mono text-slate-300 mt-1">{selectedNode.rawData.dateStr}</div>
                 </div>
                 )}
                 
                 {selectedNode.rawData.desc && (
                 <div>
                   <div className="text-[9px] text-slate-500 tracking-wider">EXTRACTED CONTENT</div>
                   <div className="text-xs text-slate-300 mt-1 whitespace-pre-wrap leading-relaxed">{selectedNode.rawData.desc}</div>
                 </div>
                 )}
               </div>
               
               <div className="mt-auto pt-6 flex gap-2">
                   <button 
                     onClick={() => {
                       // Jump to view action
                       if (selectedNode.rawData.type === 'journal' || selectedNode.rawData.type === 'task') {
                         onSetDate(selectedNode.rawData.dateStr);
                         onNavigate(selectedNode.rawData.type === 'journal' ? 'journal' : 'daily');
                       } else if (selectedNode.rawData.type === 'finance') {
                         onNavigate('finances');
                       }
                     }}
                     className="flex-1 bg-cyan-500/10 hover:bg-cyan-500/30 text-cyan-400 text-[10px] font-bold uppercase tracking-widest py-2 rounded-lg border border-cyan-500/30 transition-all"
                   >
                     Jump to Context
                   </button>
               </div>
            </div>
         )}
         
         <canvas ref={canvasRef} className="w-full h-full cursor-crosshair active:cursor-move" />
      </div>

    </div>
  );
};

