import React, { useRef, useEffect, useState, useMemo } from 'react';
import { AppState, TrackerCategory } from '../types';
import { CATS } from '../utils/storage';
import { 
  Network, Eye, HelpCircle, Activity, Calendar, Notebook, 
  Wallet, Play, ChevronLeft, ChevronRight, Minimize, Sliders, Sparkles,
  CheckSquare, Paintbrush, Compass, MapPin, Award
} from 'lucide-react';

interface TemporalHelixRibbonProps {
  state: AppState;
  dates: string[];
  getDayD: (ds: string, cat: string, item: string) => any;
  onNavigate: (view: string) => void;
  onSetDate: (date: string) => void;
}

interface RibbonNode {
  dateStr: string;
  hasActivity: boolean;
  habitsDone: number;
  habitsTotal: number;
  mood: number;
  energy: number;
  expensesCount: number;
  expensesSum: number;
  pomoCount: number;
  pomoMinutes: number;
  journalTags: string[];
  scorePct: number;
  
  // Extended tracks & studies data
  totalReps: number;
  totalHours: number;
  avgSatisfaction: number;
  remindersCount: number;
  remindersDone: number;
  sketchesCount: number;
  activeExpeditions: string[];
  journalLocation?: string;
  
  // Pseudo-3D attributes updated perframe
  cx: number;
  cy: number;
  cz: number; // depth (-1 to 1)
  projectedX: number;
  projectedY: number;
  projectedSize: number;
}

export const TemporalHelixRibbon: React.FC<TemporalHelixRibbonProps> = ({
  state,
  dates,
  getDayD,
  onNavigate,
  onSetDate
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  
  // Interactive control state
  const [scrollOffset, setScrollOffset] = useState<number>(0);
  const [rotationAngle, setRotationAngle] = useState<number>(0);
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const [activeDateNode, setActiveDateNode] = useState<RibbonNode | null>(null);
  const [amplitude, setAmplitude] = useState<number>(45);
  const [frequency, setFrequency] = useState<number>(1.5); // Number of full coils per screen width
  const [filterActiveOnly, setFilterActiveOnly] = useState<boolean>(false);
  const [nodeTypeFilter, setNodeTypeFilter] = useState<'all' | 'habits' | 'journals' | 'finances'>('all');

  // Multipliers for zoom/drag scaling
  const dragStartRef = useRef<{ x: number, y: number, offset: number, angle: number } | null>(null);

  // Compute metrics for all dates
  const rawNodes: RibbonNode[] = useMemo(() => {
    return dates.map(d => {
      // 1. Habit & Advanced Studies Stats
      let habitsDone = 0;
      let habitsTotal = 0;
      let totalReps = 0;
      let totalHours = 0;
      let satisfactionSum = 0;
      let satisfactionCount = 0;

      CATS.forEach(cat => {
        const items = state.items[cat.id] || [];
        items.forEach(item => {
          habitsTotal++;
          const entry = getDayD(d, cat.id, item);
          if (entry) {
            if (entry.status === 'done') {
              habitsDone++;
              if (typeof entry.reps === 'number') totalReps += entry.reps;
              if (typeof entry.hours === 'number') totalHours += entry.hours;
              if (typeof entry.satisfaction === 'number' && entry.satisfaction > 0) {
                satisfactionSum += entry.satisfaction;
                satisfactionCount++;
              }
            }
          }
        });
      });
      const scorePct = habitsTotal ? Math.round((habitsDone / habitsTotal) * 100) : 0;
      const avgSatisfaction = satisfactionCount ? Math.round((satisfactionSum / satisfactionCount) * 10) / 10 : 0;

      // 2. Journal status and metadata
      const journal = state.journals[d];
      const mood = journal ? journal.mood : 0;
      const energy = journal ? journal.energy : 0;
      const journalTags = journal ? journal.tags : [];
      const journalLocation = journal && journal.location ? (typeof journal.location === 'string' ? journal.location : `${journal.location.lat.toFixed(2)}, ${journal.location.lng.toFixed(2)}`) : undefined;

      // 3. Finances for this date
      const daysFinances = (state.finances || []).filter(f => f.date === d);
      const expensesCount = daysFinances.length;
      const expensesSum = daysFinances.reduce((sum, item) => sum + (item.amount || 0), 0);

      // 4. Pomodoros
      const daysPomos = (state.pomoSessions || []).filter(p => p.date === d && p.status === 'completed');
      const pomoCount = daysPomos.length;
      const pomoMinutes = daysPomos.reduce((sum, item) => sum + (item.duration || 0), 0);

      // 5. Reminders / Tasks Tracks
      const daysReminders = (state.reminders || []).filter(r => r.dueDate === d);
      const remindersCount = daysReminders.length;
      const remindersDone = daysReminders.filter(r => r.status === 'done').length;

      // 6. Sketches / Doodles
      const daysSketches = (state.sketches || []).filter(s => s.date === d);
      const sketchesCount = daysSketches.length;

      // 7. Active Expeditions / Trips
      const daysExpeditions = (state.expeditions || []).filter(e => {
        return d >= e.dateStart && d <= e.dateEnd;
      });
      const activeExpeditions = daysExpeditions.map(e => e.title);

      const hasActivity = habitsDone > 0 
        || mood > 0 
        || expensesCount > 0 
        || pomoCount > 0 
        || remindersCount > 0 
        || sketchesCount > 0 
        || activeExpeditions.length > 0;

      return {
        dateStr: d,
        hasActivity,
        habitsDone,
        habitsTotal,
        mood,
        energy,
        expensesCount,
        expensesSum,
        pomoCount,
        pomoMinutes,
        journalTags,
        scorePct,
        
        // Extended datasets
        totalReps,
        totalHours,
        avgSatisfaction,
        remindersCount,
        remindersDone,
        sketchesCount,
        activeExpeditions,
        journalLocation,
        
        cx: 0,
        cy: 0,
        cz: 0,
        projectedX: 0,
        projectedY: 0,
        projectedSize: 0
      };
    });
  }, [dates, state, getDayD]);

  // Filtered list of nodes
  const nodes = useMemo(() => {
    let list = rawNodes;
    if (filterActiveOnly) {
      list = list.filter(n => n.hasActivity);
    }
    if (nodeTypeFilter === 'journals') {
      list = list.filter(n => n.mood > 0);
    } else if (nodeTypeFilter === 'finances') {
      list = list.filter(n => n.expensesCount > 0);
    } else if (nodeTypeFilter === 'habits') {
      list = list.filter(n => n.habitsDone > 0);
    }
    return list;
  }, [rawNodes, filterActiveOnly, nodeTypeFilter]);

  // Handle Resize & Canvas Loop 
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrame: number;
    let localScroll = scrollOffset;
    let localRotation = rotationAngle;

    const resizeCanvas = () => {
      const container = containerRef.current;
      if (container && canvas) {
        // Set higher resolution for retina/clean rendering
        const rect = container.getBoundingClientRect();
        canvas.width = rect.width * window.devicePixelRatio;
        canvas.height = 240 * window.devicePixelRatio;
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `240px`;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Keep interactive node references mapped
    const drawnNodesRef: RibbonNode[] = [];

    const draw = () => {
      // Clear with dark space theme
      const width = canvas.width / window.devicePixelRatio;
      const height = 240;
      
      ctx.fillStyle = '#06060c';
      ctx.fillRect(0, 0, width, height);

      // Gentle grid lines backdrop
      ctx.strokeStyle = 'rgba(42, 42, 80, 0.25)';
      ctx.lineWidth = 0.5;
      for (let i = 0; i < width; i += 60) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, height);
        ctx.stroke();
      }

      if (nodes.length === 0) {
        ctx.fillStyle = '#64748b';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('NO ACTIVITY RECORDED FOR FILTERED SPECIFICATIONS', width / 2, height / 2);
        return;
      }

      // Auto rotation & gliding physics
      if (autoScroll) {
        localScroll += 0.4;
        localRotation += 0.007;
      }

      // Math parameters
      const nodeSpacing = width / Math.max(3, Math.min(10, nodes.length));
      const midY = height / 2;

      // Clear the projection reference
      drawnNodesRef.length = 0;

      // Draw horizontal core wire
      ctx.beginPath();
      ctx.moveTo(0, midY);
      ctx.lineTo(width, midY);
      ctx.strokeStyle = 'rgba(255,107,26,0.15)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 6]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw the helix ribbon background wave
      ctx.beginPath();
      for (let x = 0; x < width; x += 3) {
        const theta = (x / width) * frequency * Math.PI * 2 + localRotation;
        const waveY = midY + Math.sin(theta) * amplitude;
        if (x === 0) ctx.moveTo(x, waveY);
        else ctx.lineTo(x, waveY);
      }
      ctx.strokeStyle = 'rgba(0, 212, 255, 0.2)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Mirror backwave ribbon in crimson for distinct double helix vibe
      ctx.beginPath();
      for (let x = 0; x < width; x += 3) {
        const theta = (x / width) * frequency * Math.PI * 2 + localRotation + Math.PI;
        const waveY = midY + Math.sin(theta) * amplitude;
        if (x === 0) ctx.moveTo(x, waveY);
        else ctx.lineTo(x, waveY);
      }
      ctx.strokeStyle = 'rgba(255, 107, 26, 0.1)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Project Nodes onto pseudo-3D space
      nodes.forEach((node, idx) => {
        // Compute x coordinate with infinite looping scroll logic
        const rawX = (idx * nodeSpacing) - localScroll;
        // Modulo coordinate to loop smoothly around screen margins
        let screenX = rawX % (nodes.length * nodeSpacing);
        if (screenX < -100) screenX += (nodes.length * nodeSpacing);
        if (screenX > width + 100) screenX -= (nodes.length * nodeSpacing);

        // Map to ribbon wave angles
        const relativePosition = screenX / width;
        const theta = (relativePosition * frequency * Math.PI * 2) + localRotation + (idx * 0.12);
        
        // Z gives us depth (closer/further)
        const cosTheta = Math.cos(theta); // depth indicator -1 to 1
        const sinTheta = Math.sin(theta); // wave height multiplier

        node.cx = screenX;
        node.cy = midY + sinTheta * amplitude;
        node.cz = cosTheta; // Depth multiplier

        // Projected properties
        node.projectedX = screenX;
        node.projectedY = node.cy;
        node.projectedSize = 5 + (cosTheta + 1) * 3.5; // size variation 5 to 12

        drawnNodesRef.push(node);
      });

      // Sort nodes by depth (draw back nodes first, then wires, then front nodes)
      const sortedNodes = [...drawnNodesRef].sort((a, b) => a.cz - b.cz);

      // Draw Connector Strings to center timeline
      sortedNodes.forEach(node => {
        // Draw delicate connector line to centerline
        ctx.beginPath();
        ctx.moveTo(node.projectedX, midY);
        ctx.lineTo(node.projectedX, node.projectedY);
        
        const alpha = Math.max(0.1, (node.cz + 1.2) / 2.2);
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.15})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // Render Nodes themselves
      sortedNodes.forEach(node => {
        const size = node.projectedSize;
        const alpha = Math.max(0.15, (node.cz + 1.2) / 2.2);

        // Determine glowing color theme per node primary activity
        let baseColor = 'rgba(161, 161, 170, '; // gray placeholder
        let shadowColor = 'rgba(161, 161, 170, 0.4)';
        
        if (node.activeExpeditions.length > 0) {
          // Vivid Crimson/Red for Expeditions/Trips
          baseColor = 'rgba(239, 68, 68, ';
          shadowColor = 'rgba(239, 68, 68, 0.65)';
        } else if (node.mood > 0) {
          // Purple/Cyan for journals
          baseColor = 'rgba(0, 212, 255, ';
          shadowColor = 'rgba(0, 212, 255, 0.6)';
        } else if (node.sketchesCount > 0) {
          // Electric Amethyst for sketches
          baseColor = 'rgba(168, 85, 247, ';
          shadowColor = 'rgba(168, 85, 247, 0.6)';
        } else if (node.expensesCount > 0) {
          // Pink/Crimson for finances
          baseColor = 'rgba(255, 0, 160, ';
          shadowColor = 'rgba(255, 0, 160, 0.6)';
        } else if (node.habitsDone > 0) {
          // Emerald for checked habits
          baseColor = 'rgba(0, 255, 136, ';
          shadowColor = 'rgba(0, 255, 136, 0.6)';
        } else if (node.remindersCount > 0) {
          // Gold Orange for tasks
          baseColor = 'rgba(249, 115, 22, ';
          shadowColor = 'rgba(249, 115, 22, 0.6)';
        }

        // Check if node is active inspect model status
        const isHovered = activeDateNode && activeDateNode.dateStr === node.dateStr;

        ctx.save();
        ctx.shadowBlur = isHovered ? 12 : 5;
        ctx.shadowColor = shaColorStr(shadowColor, isHovered ? 0.9 : alpha);

        // Draw node core orb
        ctx.beginPath();
        ctx.arc(node.projectedX, node.projectedY, isHovered ? size + 3 : size, 0, Math.PI * 2);
        ctx.fillStyle = `${baseColor}${alpha})`;
        ctx.fill();

        // Node outline rings
        ctx.beginPath();
        ctx.arc(node.projectedX, node.projectedY, (isHovered ? size + 3 : size) + 2.5, 0, Math.PI * 2);
        ctx.strokeStyle = `${baseColor}${alpha * 0.45})`;
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.restore();

        // Label for date below/above the nodes
        const parsedDate = new Date(node.dateStr + 'T00:00:00');
        const dateText = parsedDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', weekday: 'short' });
        
        ctx.fillStyle = isHovered ? '#ffffff' : `rgba(163, 163, 185, ${alpha * 0.75})`;
        ctx.font = isHovered ? 'bold 8.5px monospace' : '7.5px monospace';
        ctx.textAlign = 'center';
        
        // Stagger labels above or below node to prevent layout overlapping
        const labelY = node.projectedY > midY ? node.projectedY + size + 11 : node.projectedY - size - 8;
        ctx.fillText(dateText.toUpperCase(), node.projectedX, labelY);

        // Mini status indicators nested inside node
        if (node.habitsTotal > 0 && node.habitsDone > 0 && !isHovered) {
          ctx.fillStyle = '#06060c';
          ctx.font = 'bold 7px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(String(node.habitsDone), node.projectedX, node.projectedY + 2.5);
        }
      });

      // Request next frame safely
      animFrame = requestAnimationFrame(draw);
    };

    draw();

    // Helper function to extract correct shadow density
    function shaColorStr(rgbaStr: string, calculatedAlpha: number): string {
      const parts = rgbaStr.replace('rgba(', '').replace(')', '').split(',');
      if (parts.length >= 3) {
        return `rgba(${parts[0].trim()}, ${parts[1].trim()}, ${parts[2].trim()}, ${calculatedAlpha})`;
      }
      return rgbaStr;
    }

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animFrame);
    };
  }, [nodes, autoScroll, scrollOffset, rotationAngle, activeDateNode, amplitude, frequency]);

  // Handle Drag / Interactivity coordinates mapping
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Detect if we clicked near any node to lock/inspect
    const foundNode = detectNodeAtCoords(clickX, clickY);
    if (foundNode) {
      setActiveDateNode(foundNode);
    } else {
      // Initiate drag panning
      setAutoScroll(false);
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        offset: scrollOffset,
        angle: rotationAngle
      };
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Direct hover check, updates immediately to highlight corresponding orbs
    const hovered = detectNodeAtCoords(mouseX, mouseY);
    if (hovered && (!activeDateNode || activeDateNode.dateStr !== hovered.dateStr)) {
      setActiveDateNode(hovered);
    }

    // Drag operations
    if (dragStartRef.current) {
      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaY = e.clientY - dragStartRef.current.y;
      setScrollOffset(dragStartRef.current.offset - deltaX * 0.95);
      setRotationAngle(dragStartRef.current.angle + deltaY * 0.006);
    }
  };

  const handleMouseUp = () => {
    dragStartRef.current = null;
  };

  const handleMouseLeave = () => {
    dragStartRef.current = null;
  };

  const detectNodeAtCoords = (mx: number, my: number): RibbonNode | null => {
    // Look through projected nodes to find hit within click radius
    for (const node of nodes) {
      const hitRadius = Math.max(14, node.projectedSize + 10);
      const dx = mx - node.projectedX;
      const dy = my - node.projectedY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < hitRadius) {
        return node;
      }
    }
    return null;
  };

  // Switch Active Nodes
  const handlePrevNode = () => {
    if (!activeDateNode || nodes.length === 0) {
      if (nodes.length > 0) setActiveDateNode(nodes[0]);
      return;
    }
    const idx = nodes.findIndex(n => n.dateStr === activeDateNode.dateStr);
    const prevIdx = (idx - 1 + nodes.length) % nodes.length;
    setActiveDateNode(nodes[prevIdx]);
    setScrollOffset(prevIdx * (canvasRef.current ? (canvasRef.current.width / window.devicePixelRatio / Math.max(3, Math.min(10, nodes.length))) : 100));
  };

  const handleNextNode = () => {
    if (!activeDateNode || nodes.length === 0) {
      if (nodes.length > 0) setActiveDateNode(nodes[0]);
      return;
    }
    const idx = nodes.findIndex(n => n.dateStr === activeDateNode.dateStr);
    const nextIdx = (idx + 1) % nodes.length;
    setActiveDateNode(nodes[nextIdx]);
    setScrollOffset(nextIdx * (canvasRef.current ? (canvasRef.current.width / window.devicePixelRatio / Math.max(3, Math.min(10, nodes.length))) : 100));
  };

  const formattedInspectDate = useMemo(() => {
    if (!activeDateNode) return '';
    const d = new Date(activeDateNode.dateStr + 'T00:00:00');
    return d.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }, [activeDateNode]);

  return (
    <div className="bg-[#0d0d1a] border border-[#1e1e38] rounded-2xl p-5 relative overflow-hidden flex flex-col space-y-4">
      {/* Upper Title and Controls bar */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 px-1.5 bg-[#ff6b1a]/10 border border-[#ff6b1a]/25 text-[#ff6b1a] text-[9px] font-black rounded font-mono uppercase tracking-widest animate-pulse">
              Dimensional Track
            </span>
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2 tracking-wide font-display">
              <Network size={16} className="text-[#00d4ff] animate-pulse" />
              TEMPORAL HELIX RIBBON
            </h3>
          </div>
          <p className="text-[10px] text-slate-500 font-mono uppercase mt-1 leading-relaxed">
            Highly tactile pseudo-3D chronological timeline spline binding your routines, journals, and funds tracking
          </p>
        </div>

        {/* Action Controls Deck */}
        <div className="flex flex-wrap gap-2 items-center">
          {/* Active node type filter */}
          <div className="bg-[#111120] border border-[#1e1e38] p-0.5 rounded-lg flex items-center">
            <button 
              onClick={() => setNodeTypeFilter('all')}
              className={`p-1 px-2.5 rounded text-[9px] font-bold uppercase transition ${nodeTypeFilter === 'all' ? 'bg-[#ff6b1a]/15 text-[#ff6b1a] border border-[#ff6b1a]/30' : 'text-slate-500 hover:text-slate-300'}`}
            >
              All Days
            </button>
            <button 
              onClick={() => setNodeTypeFilter('journals')}
              className={`p-1 px-2.5 rounded text-[9px] font-bold uppercase transition ${nodeTypeFilter === 'journals' ? 'bg-[#00d4ff]/15 text-[#00d4ff] border border-[#00d4ff]/30' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Journals
            </button>
            <button 
              onClick={() => setNodeTypeFilter('finances')}
              className={`p-1 px-2.5 rounded text-[9px] font-bold uppercase transition ${nodeTypeFilter === 'finances' ? 'bg-[#ff00a0]/15 text-[#ff00a0] border border-[#ff00a0]/30' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Budgets
            </button>
          </div>

          <button
            onClick={() => setFilterActiveOnly(!filterActiveOnly)}
            className={`p-1.5 px-3 rounded-lg text-[9px] font-bold uppercase tracking-wider border transition ${
              filterActiveOnly 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                : 'bg-[#111120] border-[#1e1e38] text-slate-400 hover:text-slate-200'
            }`}
          >
            {filterActiveOnly ? '⚡ High Activity' : 'Show All Days'}
          </button>

          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`p-1.5 px-3 rounded-lg text-[9px] font-bold uppercase tracking-wider border transition flex items-center gap-1.5 ${
              autoScroll 
                ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' 
                : 'bg-[#111120] border-[#1e1e38] text-slate-400 hover:text-slate-200'
            }`}
          >
            {autoScroll ? '⏸ Autoplay' : '▶ Static'}
          </button>
        </div>
      </div>

      {/* Main Spline Canvas container */}
      <div ref={containerRef} className="w-full h-[240px] bg-[#06060c] border border-[#1a1a35] rounded-xl relative overflow-hidden group select-none">
        
        {/* Helper guide legend inside Canvas */}
        <div className="absolute top-3 left-3 pointer-events-none z-10 flex gap-1.5 flex-wrap">
          <div className="flex items-center gap-1.5 bg-[#0d0d1a]/85 border border-[#1e1e38] rounded-md px-2 py-1 text-[9px] font-mono text-slate-400">
            <span className="w-2 h-2 rounded-full bg-[#00ff88]" /> Habits Checked
          </div>
          <div className="flex items-center gap-1.5 bg-[#0d0d1a]/85 border border-[#1e1e38] rounded-md px-2 py-1 text-[9px] font-mono text-slate-400">
            <span className="w-2 h-2 rounded-full bg-[#00d4ff]" /> Journal Linked
          </div>
          <div className="flex items-center gap-1.5 bg-[#0d0d1a]/85 border border-[#1e1e38] rounded-md px-2 py-1 text-[9px] font-mono text-slate-400">
            <span className="w-2 h-2 rounded-full bg-[#ff00a0]" /> Budget Expense
          </div>
        </div>

        {/* User drag instructions overlay */}
        <div className="absolute bottom-3 right-3 pointer-events-none text-[8.5px] font-mono uppercase text-slate-500 bg-[#0d0d1a]/80 border border-[#1e1e38]/70 rounded px-1.5 py-0.5">
          Drag horizontally to scroll node track · Click/Hover to Inspect
        </div>

        {/* Real Canvas element */}
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          className="w-full h-full cursor-grab active:cursor-grabbing block"
        />
      </div>

      {/* Interactive Micro Inspector - Pops up beneath or beside for clean details without blocking view */}
      <div className="bg-[#111120]/65 border border-[#1e1e38] rounded-xl p-4.5 animate-fadeIn min-h-[90px] text-left flex flex-col justify-between">
        {activeDateNode ? (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-[#22223c]/60 pb-2">
              <div className="flex items-center gap-2">
                <Calendar size={13} className="text-[#ff6b1a]" />
                <h4 className="text-xs font-black text-white font-mono uppercase tracking-wider">
                  {formattedInspectDate}
                </h4>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[9.5px] font-mono text-[#00ff88] uppercase bg-[#00ff88]/10 border border-[#00ff88]/20 px-2 py-0.5 rounded">
                  Habit Rate: {activeDateNode.scorePct}%
                </span>
                {activeDateNode.mood > 0 && (
                  <span className="text-[9.5px] font-mono text-yellow-400 uppercase bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 rounded">
                    Mood: {activeDateNode.mood}/5
                  </span>
                )}
              </div>
            </div>

            {/* Bento-like Dimensional stats grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 pt-1">
              {/* Habits detailed */}
              <div className="space-y-1.5 p-2.5 rounded-lg bg-[#16162d]/40 border border-[#1e1e3c]/40 hover:border-[#00ff88]/30 transition group">
                <div className="text-[9px] text-[#00ff88] font-black tracking-wider uppercase flex items-center gap-1.5">
                  <Activity size={11} className="text-[#00ff88]" /> Habits & Study
                </div>
                <div className="space-y-0.5 text-slate-200">
                  <div className="text-xs font-mono font-bold">
                    {activeDateNode.habitsDone} / {activeDateNode.habitsTotal} checked
                  </div>
                  {(activeDateNode.totalReps > 0 || activeDateNode.totalHours > 0) && (
                    <div className="text-[9.5px] font-mono text-slate-400">
                      ⏱ {activeDateNode.totalHours} hrs · 🔢 {activeDateNode.totalReps} rep
                    </div>
                  )}
                  {activeDateNode.avgSatisfaction > 0 && (
                    <div className="text-[9.5px] font-mono text-emerald-400">
                      ★ Sat: {activeDateNode.avgSatisfaction}/5
                    </div>
                  )}
                </div>
              </div>

              {/* Reminders / Tasks */}
              <div className="space-y-1.5 p-2.5 rounded-lg bg-[#16162d]/40 border border-[#1e1e3c]/40 hover:border-[#f97316]/30 transition group">
                <div className="text-[9px] text-orange-400 font-black tracking-wider uppercase flex items-center gap-1.5">
                  <CheckSquare size={11} className="text-orange-400" /> Tasks & To-Dos
                </div>
                <div className="space-y-0.5 text-slate-200">
                  <div className="text-xs font-mono font-bold">
                    {activeDateNode.remindersCount > 0 ? (
                      <span>{activeDateNode.remindersDone} of {activeDateNode.remindersCount} done</span>
                    ) : (
                      <span className="text-slate-500">No tasks due</span>
                    )}
                  </div>
                  {activeDateNode.remindersCount > 0 && (
                    <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden mt-1">
                      <div 
                        className="bg-orange-500 h-full transition-all duration-300"
                        style={{ width: `${(activeDateNode.remindersDone / activeDateNode.remindersCount) * 100}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Journal detailed */}
              <div className="space-y-1.5 p-2.5 rounded-lg bg-[#16162d]/40 border border-[#1e1e3c]/40 hover:border-[#00d4ff]/30 transition group">
                <div className="text-[9px] text-[#00d4ff] font-black tracking-wider uppercase flex items-center gap-1.5">
                  <Notebook size={11} className="text-[#00d4ff]" /> Journal Log
                </div>
                <div className="space-y-0.5 text-slate-200">
                  {activeDateNode.mood > 0 ? (
                    <>
                      <div className="text-xs font-bold text-slate-100">
                        Mood: {activeDateNode.mood} · Energy: {activeDateNode.energy}
                      </div>
                      {activeDateNode.journalTags.length > 0 && (
                        <div className="text-[9px] text-indigo-300 truncate">
                          #{activeDateNode.journalTags.slice(0, 2).join(' #')}
                        </div>
                      )}
                      {activeDateNode.journalLocation && (
                        <div className="text-[9px] text-slate-400 truncate flex items-center gap-0.5">
                          <MapPin size={9} className="text-slate-500 shrink-0" /> <span className="truncate">{activeDateNode.journalLocation}</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <span className="text-xs text-slate-500 font-medium">No logs written</span>
                  )}
                </div>
              </div>

              {/* Sketches & Canvas */}
              <div className="space-y-1.5 p-2.5 rounded-lg bg-[#16162d]/40 border border-[#1e1e3c]/40 hover:border-[#a855f7]/30 transition group">
                <div className="text-[9px] text-[#a855f7] font-black tracking-wider uppercase flex items-center gap-1.5">
                  <Paintbrush size={11} className="text-[#a855f7]" /> Sketchpad Doodles
                </div>
                <div className="space-y-0.5 text-slate-200">
                  <div className="text-xs font-mono font-bold">
                    {activeDateNode.sketchesCount > 0 ? (
                      <span className="text-purple-300 font-bold">🎨 {activeDateNode.sketchesCount} drawn</span>
                    ) : (
                      <span className="text-slate-500">None drawn</span>
                    )}
                  </div>
                  {activeDateNode.sketchesCount > 0 && (
                    <div className="text-[9px] text-slate-400">Canvas assets saved</div>
                  )}
                </div>
              </div>

              {/* Financial stats */}
              <div className="space-y-1.5 p-2.5 rounded-lg bg-[#16162d]/40 border border-[#1e1e3c]/40 hover:border-[#ff00a0]/30 transition group">
                <div className="text-[9px] text-[#ff00a0] font-black tracking-wider uppercase flex items-center gap-1.5">
                  <Wallet size={11} className="text-[#ff00a0]" /> Budget Expense
                </div>
                <div className="space-y-0.5 text-slate-200">
                  <div className="text-xs font-mono font-bold">
                    {activeDateNode.expensesCount > 0 ? (
                      <span className="text-[#ff00a0] font-black">${activeDateNode.expensesSum.toFixed(2)}</span>
                    ) : (
                      <span className="text-slate-500">$0.00 logged</span>
                    )}
                  </div>
                  {activeDateNode.expensesCount > 0 && (
                    <div className="text-[9px] text-slate-400 truncate">
                      {activeDateNode.expensesCount} transaction ledger
                    </div>
                  )}
                </div>
              </div>

              {/* Expeditions / Trips */}
              <div className="space-y-1.5 p-2.5 rounded-lg bg-[#16162d]/40 border border-[#1e1e3c]/40 hover:border-red-400/30 transition group">
                <div className="text-[9px] text-red-400 font-black tracking-wider uppercase flex items-center gap-1.5">
                  <Compass size={11} className="text-red-400" /> Active Trips
                </div>
                <div className="space-y-0.5 text-slate-200">
                  {activeDateNode.activeExpeditions.length > 0 ? (
                    <>
                      <div className="text-xs font-black text-rose-300 truncate" title={activeDateNode.activeExpeditions[0]}>
                        🧭 {activeDateNode.activeExpeditions[0]}
                      </div>
                      {activeDateNode.activeExpeditions.length > 1 && (
                        <div className="text-[9px] text-slate-400">
                          +{activeDateNode.activeExpeditions.length - 1} more itinerary
                        </div>
                      )}
                    </>
                  ) : (
                    <span className="text-xs text-slate-500 font-medium">No active journey</span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick action buttons linked to this node */}
            <div className="pt-2.5 border-t border-[#1e1e38]/40 flex flex-wrap gap-2 justify-end">
              <button
                onClick={() => {
                  onSetDate(activeDateNode.dateStr);
                  onNavigate('daily');
                }}
                className="bg-slate-800 hover:bg-[#ff6b1a]/25 text-slate-300 hover:text-[#ff6b1a] text-[9.5px] font-bold uppercase tracking-wider p-1.5 px-3 rounded-lg border border-transparent hover:border-[#ff6b1a]/40 transition duration-200 cursor-pointer"
              >
                Go to Day Check-Ins
              </button>
              
              {activeDateNode.mood > 0 && (
                <button
                  onClick={() => {
                    onSetDate(activeDateNode.dateStr);
                    onNavigate('journal');
                  }}
                  className="bg-indigo-950/40 hover:bg-[#00d4ff]/25 text-slate-300 hover:text-[#00d4ff] text-[9.5px] font-bold uppercase tracking-wider p-1.5 px-3 rounded-lg border border-transparent hover:border-[#00d4ff]/40 transition duration-200 cursor-pointer"
                >
                  Write/Read Journal Entry
                </button>
              )}

              {activeDateNode.remindersCount > 0 && (
                <button
                  onClick={() => {
                    onSetDate(activeDateNode.dateStr);
                    onNavigate('reminders');
                  }}
                  className="bg-orange-950/40 hover:bg-orange-500/25 text-slate-300 hover:text-orange-400 text-[9.5px] font-bold uppercase tracking-wider p-1.5 px-3 rounded-lg border border-transparent hover:border-orange-500/40 transition duration-200 cursor-pointer"
                >
                  Manage Tasks
                </button>
              )}

              {activeDateNode.expensesCount > 0 && (
                <button
                  onClick={() => {
                    onSetDate(activeDateNode.dateStr);
                    onNavigate('finances');
                  }}
                  className="bg-pink-950/40 hover:bg-[#ff00a0]/25 text-slate-300 hover:text-[#ff00a0] text-[9.5px] font-bold uppercase tracking-wider p-1.5 px-3 rounded-lg border border-transparent hover:border-[#ff00a0]/40 transition duration-200 cursor-pointer"
                >
                  View Ledger
                </button>
              )}

              {activeDateNode.activeExpeditions.length > 0 && (
                <button
                  onClick={() => {
                    onSetDate(activeDateNode.dateStr);
                    onNavigate('expeditions');
                  }}
                  className="bg-rose-950/40 hover:bg-rose-500/25 text-slate-300 hover:text-rose-400 text-[9.5px] font-bold uppercase tracking-wider p-1.5 px-3 rounded-lg border border-transparent hover:border-rose-500/40 transition duration-200 cursor-pointer"
                >
                  Open Trip Log
                </button>
              )}

              {activeDateNode.sketchesCount > 0 && (
                <button
                  onClick={() => {
                    onSetDate(activeDateNode.dateStr);
                    onNavigate('sketchpad');
                  }}
                  className="bg-purple-950/40 hover:bg-[#a855f7]/25 text-slate-300 hover:text-[#a855f7] text-[9.5px] font-bold uppercase tracking-wider p-1.5 px-3 rounded-lg border border-transparent hover:border-[#a855f7]/40 transition duration-200 cursor-pointer"
                >
                  Inspect Sketches
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-4 text-center">
            <Sparkles size={16} className="text-slate-500 animate-pulse mb-1.5" />
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">
              Hover/click any chronological node on the double helix ribbon to decode detailed activity summary
            </p>
          </div>
        )}
      </div>

      {/* Physics Fine Tuning Console Expandable */}
      <div className="mt-1 pt-3 border-t border-[#1e1e38]/30 flex justify-between items-center text-[9px] text-slate-500 font-mono">
        <span className="uppercase">Temporal Coordinates Solver v1.0</span>
        <div className="flex gap-4">
          <div className="flex items-center gap-1.5">
            <span>Amplitude:</span>
            <input 
              type="range" min="15" max="80" value={amplitude} onChange={e => setAmplitude(Number(e.target.value))}
              className="w-16 accent-[#ff6b1a] bg-slate-800 h-1 rounded cursor-pointer appearance-none" 
            />
            <span className="text-[#ff6b1a]">{amplitude}px</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span>Coils (Coeff):</span>
            <input 
              type="range" min="0.5" max="4.5" step="0.5" value={frequency} onChange={e => setFrequency(Number(e.target.value))}
              className="w-16 accent-[#00d4ff] bg-slate-800 h-1 rounded cursor-pointer appearance-none" 
            />
            <span className="text-[#00d4ff]">{frequency}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
