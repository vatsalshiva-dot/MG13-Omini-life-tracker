import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { AppState, TrackerCategory } from '../types';
import { Network, Plus, Search, Layers, Compass, BrainCircuit, Activity } from 'lucide-react';
import { getAllCats, getCatLabel } from '../utils/storage';

interface GraphViewProps {
  state: AppState;
}

type Node = {
  id: string;
  group: string; // 'day', 'journal', 'habit', 'finance', 'pomo', 'tag'
  label: string;
  val: number; // size
  color: string;
};

type Link = {
  source: string;
  target: string;
  value: number; // weight
};

export const GraphView: React.FC<GraphViewProps> = ({ state }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [filterTags, setFilterTags] = useState<string>('');

  const graphData = useMemo(() => {
    const nodes: Node[] = [];
    const links: Link[] = [];
    const nodeMap = new Set<string>();

    const addNode = (n: Node) => {
      if (!nodeMap.has(n.id)) {
        nodes.push(n);
        nodeMap.add(n.id);
      }
    };

    const addLink = (source: string, target: string, value: number) => {
      if (nodeMap.has(source) && nodeMap.has(target)) {
        links.push({ source, target, value });
      }
    };

    // We process the last 15 days to avoid overloading the browser
    const recentDays = Object.keys(state.daily)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
      .slice(0, 15);

    const cats = getAllCats(state);
    
    // Create base nodes for tracked categories to show persistent nodes
    cats.forEach(c => {
        addNode({ id: `cat_${c.id}`, group: 'category', label: c.label, val: 5, color: '#aa44ff' });
    });

    recentDays.forEach(date => {
       // Day node
       addNode({ id: `day_${date}`, group: 'day', label: date.split("-").slice(1).join("/"), val: 8, color: '#00d4ff' });

       // Categories / Habits that had activity
       const dayData = state.daily[date];
       if (dayData) {
         Object.entries(dayData).forEach(([catId, items]) => {
            let catTotalReps = 0;
            Object.values(items).forEach((item: any) => {
                if (item.status === 'done' || item.reps > 0) catTotalReps++;
            });
            if (catTotalReps > 0) {
              addNode({ id: `day_${date}_${catId}`, group: 'habit', label: getCatLabel(state, catId), val: 3, color: '#00ff88' });
              addLink(`day_${date}`, `day_${date}_${catId}`, 1);
              addLink(`day_${date}_${catId}`, `cat_${catId}`, 0.5);
            }
         });
       }

       // Journals and Mood
       const j = state.journals[date];
       if (j) {
         addNode({ id: `jrn_${date}`, group: 'journal', label: `Mood: ${j.mood}`, val: j.mood * 1.5, color: '#ffaa00' });
         addLink(`day_${date}`, `jrn_${date}`, 2);

         if (j.tags) {
           j.tags.forEach((tag) => {
             addNode({ id: `tag_${tag}`, group: 'tag', label: `#${tag}`, val: 4, color: '#ff6b1a' });
             addLink(`jrn_${date}`, `tag_${tag}`, 1);
           });
         }
       }

        // Pomodoro (search pomo sessions by date)
        const pomos = (state.pomoSessions || []).filter(p => p.date === date);
       if (pomos.length > 0) {
         addNode({ id: `pomo_${date}`, group: 'pomo', label: `${pomos.length} Sessions`, val: 5, color: '#ff3366' });
         addLink(`day_${date}`, `pomo_${date}`, 1);
       }
    });

    return { nodes, links };
  }, [state]);

  useEffect(() => {
    if (!containerRef.current) return;
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight || 500;

    d3.select(containerRef.current).selectAll("*").remove();

    const svg = d3.select(containerRef.current)
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height]);

    const g = svg.append("g");

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (e) => {
        g.attr("transform", e.transform);
      });
    svg.call(zoom);
    svg.call(zoom.translateTo, width / 2, height / 2);

    const simulation = d3.forceSimulation(graphData.nodes as any)
      .force("link", d3.forceLink(graphData.links).id((d: any) => d.id).distance(60))
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide().radius((d: any) => d.val * 3));

    const link = g.append("g")
      .attr("stroke", "#2a2a50")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(graphData.links)
      .join("line")
      .attr("stroke-width", (d: any) => Math.sqrt(d.value));

    const node = g.append("g")
      .attr("stroke", "#0a0a14")
      .attr("stroke-width", 1.5)
      .selectAll("circle")
      .data(graphData.nodes)
      .join("circle")
      .attr("r", (d: any) => d.val * 2)
      .attr("fill", (d: any) => d.color)
      .call(drag(simulation) as any);

    const labels = g.append("g")
      .selectAll("text")
      .data(graphData.nodes)
      .join("text")
      .attr("font-size", 9)
      .attr("fill", "#8f8fa3")
      .attr("dx", 12)
      .attr("dy", 4)
      .text((d: Node) => d.label);

    node.append("title")
      .text((d: Node) => d.label);

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node
        .attr("cx", (d: any) => Math.max(10, Math.min(width - 10, d.x)))
        .attr("cy", (d: any) => Math.max(10, Math.min(height - 10, d.y)));

      labels
        .attr("x", (d: any) => Math.max(10, Math.min(width - 10, d.x)))
        .attr("y", (d: any) => Math.max(10, Math.min(height - 10, d.y)));
    });

    return () => {
      simulation.stop();
    };
  }, [graphData]);

  const drag = (simulation: any) => {
    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }
    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }
    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }
    return d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended);
  }

  return (
    <div className="space-y-4 animate-fade-in w-full h-[calc(100vh-140px)] flex flex-col">
      <div className="flex items-center justify-between">
         <div className="flex items-center gap-2">
           <div className="p-2 bg-[#00d4ff]/10 text-[#00d4ff] rounded-xl">
             <Network size={20} />
           </div>
           <div>
              <h2 className="text-xl font-extrabold tracking-widest text-slate-100 uppercase font-display border-b border-[#2a2a50] pb-1 pr-6 flex items-center gap-2">
                Knowledge Graph
              </h2>
              <p className="text-[10px] text-slate-500 font-black tracking-widest uppercase font-mono mt-1">
                OMNI-VIEW SEMANTIC LAYER
              </p>
           </div>
         </div>
      </div>

      <div className="flex-1 bg-[#111120] border border-[#2a2a50] rounded-2xl overflow-hidden relative shadow-[inset_0_0_80px_rgba(0,0,0,0.8)]">
         {/* Instruction Overlay */}
         <div className="absolute top-4 left-4 pointer-events-none opacity-50 space-y-1 font-mono">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#00d4ff]" /> Days</p>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#00ff88]" /> Behaviors</p>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#ffaa00]" /> Mood</p>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#ff6b1a]" /> Tags</p>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#aa44ff]" /> Modules</p>
         </div>

         {/* Note: Interactivity instructions */}
         <div className="absolute bottom-4 right-4 bg-[#0a0a14]/80 backdrop-blur-md p-2 rounded-xl border border-[#2a2a50] pointer-events-none opacity-60">
            <p className="text-[10px] font-black tracking-widest text-[#00d4ff] uppercase">Drag nodes & Scroll to zoom</p>
         </div>

         <div ref={containerRef} className="w-full h-full cursor-move" />
      </div>
    </div>
  );
};
