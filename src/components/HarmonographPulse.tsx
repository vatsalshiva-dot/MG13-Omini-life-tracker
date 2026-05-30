import React, { useRef, useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AppState } from '../types';
import { 
  Activity, Sparkles, TrendingUp, HelpCircle, Info, Zap, 
  Settings, ShieldCheck, ShieldAlert, ArrowUpRight, Compass,
  BookOpen, Flame, Heart
} from 'lucide-react';

interface HarmonographPulseProps {
  state: AppState;
  date: string;
  getDayD: (ds: string, catKey: string, itemKey: string) => any;
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

export const HarmonographPulse: React.FC<HarmonographPulseProps> = ({
  state,
  date,
  getDayD,
  dayStats
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Interactive tuning overrides
  const [dimensions, setDimensions] = useState({ width: 300, height: 300 });
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [customPhaseShift, setCustomPhaseShift] = useState(0);
  const [isInteractive, setIsInteractive] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  
  // Internal physics animation clock
  const animationFrameId = useRef<number | null>(null);
  const timeRef = useRef<number>(0);

  // 1. EXTRACTION OF DAILY LIFE METRICS FOR PHYSICS oscillators
  const stats = dayStats(date);
  
  // Vector A: Habit completion percentage
  const habitPct = stats.pct; 
  const isHabitsSufficient = habitPct >= 80;

  // Vector B: Finance Spendings vs Budget
  const financeMetrics = useMemo(() => {
    const todayFinances = (state.finances || []).filter(tx => tx.date === date);
    const expense = todayFinances.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const budgetLimit = state.dailyFinanceGoals?.[date]?.expenseLimit || state.profile.dailyBudgetLimit || 100;
    
    const isOverSpent = expense > budgetLimit;
    const ratio = budgetLimit > 0 ? expense / budgetLimit : 0;
    return {
      spent: expense,
      limit: budgetLimit,
      isOverSpent,
      ratio
    };
  }, [state.finances, state.dailyFinanceGoals, state.profile.dailyBudgetLimit, date]);

  // Vector C: Journaling complexity index (Mental state depth)
  const journalingMetrics = useMemo(() => {
    const journalEntry = state.journals[date];
    if (!journalEntry || !journalEntry.sections) {
      return { length: 0, scale: 0.2, score: 0 };
    }
    const combinedLength = Object.values(journalEntry.sections).join('').length;
    // More writing = higher spirograph density and resolution (5 to 35 orbits)
    const scale = Math.min(1.0, Math.max(0.15, combinedLength / 600));
    return {
      length: combinedLength,
      scale, // complexity coefficient
      score: journalEntry.mood || 3
    };
  }, [state.journals, date]);

  // Vector D: Expeditions or Outer Orbits (Trips/Adventure vectors)
  const travelMetrics = useMemo(() => {
    const activeTripsCount = state.expeditions?.length || 0;
    return {
      count: activeTripsCount,
      hasTrips: activeTripsCount > 0
    };
  }, [state.expeditions]);

  // 2. STABILITY INDEX
  // Complete harmony score = 0 to 100% depending on composite daily metrics balance
  const harmonyPct = useMemo(() => {
    let score = 0;
    // Habit factor (up to 40%)
    score += (habitPct / 100) * 40;
    // Budget limit constraint check (up to 30%)
    const spentRatio = financeMetrics.ratio;
    if (spentRatio <= 1.0) {
      score += 30; // perfectly within budget
    } else {
      score += Math.max(0, 30 - (spentRatio - 1.0) * 30); // decay as budget overflows
    }
    // Reflective mindfulness factor (up to 20%)
    const reflectionLength = journalingMetrics.length;
    score += Math.min(20, (reflectionLength / 250) * 20);
    // Emotional mindfulness balance (mood exists = 10%)
    if (journalingMetrics.score > 0) score += 10;

    return Math.round(score);
  }, [habitPct, financeMetrics, journalingMetrics]);

  // 3. CANVAS RESIZING (USING RESIZEOBSERVER AS DIRECTED)
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width, height } = entries[0].contentRect;
      
      // Keep canvas slightly square and responsive, clamp max height for desktop layout aesthetic
      const safeWidth = Math.floor(width);
      const safeHeight = Math.floor(Math.max(260, Math.min(safeWidth * 0.7, 360)));
      
      setDimensions({ width: safeWidth, height: safeHeight });
    });

    resizeObserver.observe(container);
    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // 4. ANIMATED HARMONOGRAPH RENDERER LOOP
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Harmonograph Mathematical parameters configured dynamically based on App State
    let isRunning = true;

    const render = () => {
      if (!isRunning) return;
      timeRef.current += 0.004; // subtle motion step

      // Clear with elegant dark trail bleed for cyber-wireframe glow persistence
      ctx.fillStyle = 'rgba(10, 10, 22, 0.16)';
      ctx.fillRect(0, 0, dimensions.width, dimensions.height);

      // Core Pendulum Settings
      // If harmony is perfect, frequencies are exact integer ratios (e.g. 2:3:3:4)
      // If unbalanced, we inject fractional offsets that skew, deform, or warp the closed loop
      const harmonyFactor = harmonyPct / 100;
      const tensionOffset = (1 - harmonyFactor) * 0.35; // skew degree

      // Mouse interactive override influences
      const interactiveX = isInteractive ? mousePos.x * 0.1 : 0;
      const interactiveY = isInteractive ? mousePos.y * 0.1 : 0;

      // Double pendulum frequencies
      // Standard Harmonograph 4 frequency components
      const f1 = 2.0 + Math.sin(timeRef.current * 0.25) * tensionOffset + interactiveX;
      const f2 = 3.0 + Math.cos(timeRef.current * 0.13) * tensionOffset;
      const f3 = 3.0 + Math.sin(timeRef.current * 0.08) * tensionOffset - interactiveY;
      const f4 = 4.0 + Math.cos(timeRef.current * 0.35) * tensionOffset;

      // Phase Shift over time for breathing effect
      // If user hovers, they can morph phases
      const breathingPhase = timeRef.current * 0.8 + customPhaseShift;
      const p1 = 0 + breathingPhase;
      const p2 = Math.PI / 2 + breathingPhase * 0.5;
      const p3 = Math.PI / 4 - breathingPhase;
      const p4 = (3 * Math.PI) / 4 + breathingPhase * 0.2;

      // Dampings: Uncompleted habits create decay/spiral tightness or chaotic wobble
      const baseDecay = 0.03 + (1 - harmonyFactor) * 0.15;
      const d1 = baseDecay;
      const d2 = baseDecay * 1.2;
      const d3 = baseDecay * 0.9;
      const d4 = baseDecay * 1.1;

      // Scale calculations
      const scale = Math.min(dimensions.width, dimensions.height) * 0.42;
      const centerX = dimensions.width / 2;
      const centerY = dimensions.height / 2;

      // Trace Path Calculations
      // Journaling depth increases the steps resolution (longer wireframe curves)
      const baseSteps = 450 + Math.floor(journalingMetrics.scale * 1200);
      const loopsRotation = 12 + Math.floor(journalingMetrics.scale * 18); // Number of orbits
      
      ctx.beginPath();
      ctx.lineWidth = 1.35;

      // Dynamic color palette based on budget status and overall balance
      let strokeStyle = `rgba(255, 107, 26, 0.75)`; // default volcanic orange
      if (state.neonTheme) {
        strokeStyle = state.neonTheme;
      }
      
      // If overspent, flash hot crimson warnings or make line jitter dramatically
      if (financeMetrics.isOverSpent) {
        strokeStyle = '#f43f5e'; // neon crimson
      } else if (harmonyPct >= 90) {
        strokeStyle = '#00ff88'; // hyper-balanced green
      }

      ctx.strokeStyle = strokeStyle;
      ctx.shadowBlur = 10;
      ctx.shadowColor = strokeStyle;

      for (let i = 0; i <= baseSteps; i++) {
        const t = (i / baseSteps) * Math.PI * 2 * loopsRotation;
        
        // Basic harmonograph physics equations (Euler integration approximations)
        let xVal = Math.sin(f1 * t + p1) * Math.exp(-d1 * t * 0.1) + 
                   Math.sin(f2 * t + p2) * Math.exp(-d2 * t * 0.1);
                   
        let yVal = Math.cos(f3 * t + p3) * Math.exp(-d3 * t * 0.1) + 
                   Math.cos(f4 * t + p4) * Math.exp(-d4 * t * 0.1);

        // Inject chaotic jitter (static spikes) if daily finance is extremely overspent
        if (financeMetrics.isOverSpent && i % 14 === 0) {
          const spendExcess = (financeMetrics.spent - financeMetrics.limit) / financeMetrics.limit;
          const noiseRange = Math.min(0.2, spendExcess * 0.08);
          xVal += (Math.random() - 0.5) * noiseRange;
          yVal += (Math.random() - 0.5) * noiseRange;
        }

        const x = centerX + xVal * scale;
        const y = centerY + yVal * scale;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      // Render a secondary outer travel satellite orbit if on expeditions
      if (travelMetrics.hasTrips) {
        ctx.shadowBlur = 4;
        ctx.strokeStyle = 'rgba(0, 212, 255, 0.45)'; // cyber cyan travel vector
        ctx.shadowColor = '#00d4ff';
        ctx.beginPath();
        for (let i = 0; i <= 240; i++) {
          const tOuter = (i / 240) * Math.PI * 2 * 3;
          const oscSpeedState = 0.5 + travelMetrics.count * 0.15;
          const ox = centerX + Math.sin(tOuter + timeRef.current * oscSpeedState) * (scale * 1.15);
          const oy = centerY + Math.cos(tOuter * 0.5 + timeRef.current * 0.4) * (scale * 1.15);
          if (i === 0) {
            ctx.moveTo(ox, oy);
          } else {
            ctx.lineTo(ox, oy);
          }
        }
        ctx.stroke();
      }

      // Reset shadows to preserve other canvas draws
      ctx.shadowBlur = 0;

      // Draw balance node sensors on hovering categories
      if (hoveredNode) {
        ctx.fillStyle = strokeStyle;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 6, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = 'rgba(255,255,255,0.7)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 14, 0, Math.PI * 2);
        ctx.stroke();
      }

      animationFrameId.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      isRunning = false;
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [dimensions, harmonyPct, state.neonTheme, financeMetrics, journalingMetrics, travelMetrics, isInteractive, mousePos, hoveredNode, customPhaseShift]);

  // Handle canvas touch or mouse drag interaction
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setMousePos({ x, y });
    setIsInteractive(true);
    setCustomPhaseShift(prev => prev + 0.012);
  };

  const handleMouseLeave = () => {
    setIsInteractive(false);
  };

  return (
    <div className="bg-[#0e0e1e]/90 border border-[#24244b] rounded-2.5xl p-6 relative overflow-hidden transition-all duration-300 hover:border-[#ff6b1a]/25 shadow-xl">
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#ff6b1a]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1b1b36] pb-4 mb-5 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 px-2.5 text-[8.5px] uppercase font-mono font-black border border-indigo-500/40 text-indigo-400 bg-indigo-950/40 rounded-md">
              AMBIENT DIAGNOSTICS
            </span>
            <span className="flex items-center gap-1 text-xs text-amber-400 font-bold">
              <Sparkles size={11} className="animate-spin duration-1000" />
              Interactive Waveform
            </span>
          </div>
          
          <h3 className="text-lg font-black text-white tracking-tight mt-1 font-display uppercase flex items-center gap-1.5">
            Atmospheric Harmonograph Balanced Pulse
          </h3>
          <p className="text-[10.5px] text-slate-400 font-mono mt-0.5">
            A dynamic live physical Double-Pendulum simulation displaying current lifecycle harmony indices.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowExplanation(!showExplanation)}
            className="p-1.5 rounded-lg bg-[#14142d] hover:bg-[#1f1f45] border border-[#25254c] hover:border-slate-500 text-slate-400 hover:text-white transition duration-200 cursor-pointer flex items-center gap-1 text-[9.5px] font-bold uppercase font-mono"
            title="Read Harmonograph Concept"
          >
            <Info size={11} />
            {showExplanation ? 'Hide Concept' : 'Show Physics Concept'}
          </button>
        </div>
      </div>

      {/* Physics Concept Box */}
      <AnimatePresence>
        {showExplanation && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-5 p-4 rounded-xl bg-[#111124] border border-[#2a2a54] text-[11px] text-slate-350 leading-relaxed font-mono space-y-2.5 text-left"
          >
            <p className="font-bold text-slate-200 uppercase text-[10px] tracking-wider text-[#ff6b1a]">How to Read Your Daily Balancing Pulse:</p>
            <p>
              Your life metrics act as physical anchors, driving 4 key variables of a dual-pendulum harmonograph.
            </p>
            <ul className="space-y-1.5 list-disc list-inside text-slate-400">
              <li><strong className="text-indigo-400">Habit Frequency Tuning (Oscillator A & B):</strong> Completions determine loop alignment. Symmetrical circles align on high performance; incomplete routines warp and drift the waveform.</li>
              <li><strong className="text-pink-400">Financial Amplitude Resonance (Gravity):</strong> Overspending outside your set limits triggers static jitter anomalies and recolors the wave warning-red.</li>
              <li><strong className="text-violet-400">Mental Depth Matrix (Steps Resolution):</strong> Elaborate journal completions add high-density details, building an organic glow mandala of reflections.</li>
              <li><strong className="text-sky-400">Orbital Latitude (Adventure Satellites):</strong> Horizon expeditions construct a secondary outer-space ribbon orbit wrapping the main knot.</li>
            </ul>
            <p className="text-[10px] text-slate-500 italic mt-1">
              ✨ Interactive: Drag or swipe your mouse across the canvas below to distort phases manually and perform real-time tuning play!
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Core Body */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-center">
        
        {/* Harmonograph Canvas Display */}
        <div 
          ref={containerRef}
          className="lg:col-span-3 bg-[#0a0a16] border border-[#1b1b36] rounded-2xl relative overflow-hidden flex items-center justify-center min-h-[260px] group shadow-inner"
        >
          {/* Overlay Status HUD */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5 pointer-events-none font-mono text-[9px] uppercase tracking-wider relative z-10 text-left">
            <span className="p-1 px-2 border border-slate-900 bg-[#0d0d1e]/85 rounded text-white flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full inline-block animate-ping ${harmonyPct >= 80 ? 'bg-emerald-400' : 'bg-[#ff6b1a]'}`} />
              STATUS: {harmonyPct >= 90 ? 'Nominal Harmony' : harmonyPct >= 60 ? 'Stable Waveform' : 'Warped Jitter'}
            </span>
          </div>

          <div className="absolute bottom-3 right-3 flex items-center gap-1.5 pointer-events-none font-mono text-[9px] uppercase tracking-wider text-slate-500">
            <Activity size={10} className="text-[#ff6b1a] animate-pulse" />
            <span>Interactive Real-time Simulator</span>
          </div>

          <canvas
            ref={canvasRef}
            width={dimensions.width}
            height={dimensions.height}
            className="w-full h-full cursor-crosshair block"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          />
        </div>

        {/* Diagnostic Vector Panel */}
        <div className="lg:col-span-2 space-y-4 text-left">
          
          {/* Main Harmony Indicator circular chart */}
          <div className="p-4 rounded-2xl bg-[#111124]/90 border border-[#24244b] flex items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[9px] uppercase tracking-widest font-black font-mono text-slate-500">Overall Balance Vector</span>
              <h4 className="text-xl font-extrabold text-white font-display uppercase tracking-tight flex items-baseline gap-1">
                {harmonyPct}% <span className="text-xs font-mono font-bold text-slate-400">Harmony Index</span>
              </h4>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5 max-w-[155px]">
                {harmonyPct >= 90 ? 'Your vectors conform to perfect physical locks!' : harmonyPct >= 60 ? 'Slight drift is active, but core balances remain intact.' : 'Critical imbalances require daily re-centering.'}
              </p>
            </div>
            
            <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90">
                <circle cx="40" cy="40" r="32" className="stroke-slate-800" strokeWidth="6" fill="transparent" />
                <circle 
                  cx="40" 
                  cy="40" 
                  r="32" 
                  className="transition-all duration-1000"
                  strokeWidth="6" 
                  stroke={harmonyPct >= 90 ? '#00ff88' : harmonyPct >= 60 ? (state.neonTheme || '#ff6b1a') : '#f43f5e'} 
                  fill="transparent" 
                  strokeDasharray={200.96}
                  strokeDashoffset={200.96 - (200.96 * harmonyPct) / 100}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute text-[12px] font-black font-mono text-white">
                {harmonyPct}%
              </div>
            </div>
          </div>

          {/* Diagnostic Vector Indicators */}
          <div className="space-y-2.5">
            
            {/* Vector A indicator */}
            <div 
              onMouseEnter={() => setHoveredNode('habits')}
              onMouseLeave={() => setHoveredNode(null)}
              className="p-3 bg-[#0a0a16] border border-[#1b1b36] hover:border-indigo-500/50 rounded-xl flex items-center justify-between transition-all duration-200 cursor-default"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isHabitsSufficient ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25' : 'bg-amber-500/10 text-amber-400 border border-amber-500/25'}`}>
                  <Flame size={14} className="shrink-0" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h5 className="text-[11px] font-bold text-slate-200 uppercase tracking-wide">Routine Stability Tuner</h5>
                    <span className="text-[7.5px] font-mono px-1.5 py-0.5 rounded bg-[#15152d] border border-[#2a2a50] text-slate-500 tracking-widest font-black uppercase">OSC. A</span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">Completions: {stats.done}/{stats.total} habits</p>
                </div>
              </div>
              <div className="text-right font-mono">
                <span className={`text-[11px] font-bold ${isHabitsSufficient ? 'text-emerald-400' : 'text-amber-400'}`}>{stats.pct}%</span>
                <p className="text-[8px] uppercase tracking-wider font-extrabold text-slate-500 mt-0.5">
                  {isHabitsSufficient ? 'Lock Ratio: 1:1' : 'Frequency Drift'}
                </p>
              </div>
            </div>

            {/* Vector B indicator */}
            <div 
              onMouseEnter={() => setHoveredNode('finances')}
              onMouseLeave={() => setHoveredNode(null)}
              className="p-3 bg-[#0a0a16] border border-[#1b1b36] hover:border-[#ff00a0]/50 rounded-xl flex items-center justify-between transition-all duration-200 cursor-default"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${!financeMetrics.isOverSpent ? 'bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                  <TrendingUp size={14} className="shrink-0" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h5 className="text-[11px] font-bold text-slate-200 uppercase tracking-wide">Budget Amplitude Resonator</h5>
                    <span className="text-[7.5px] font-mono px-1.5 py-0.5 rounded bg-[#15152d] border border-[#2a2a50] text-slate-500 tracking-widest font-black uppercase">OSC. B</span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5"> spent: ${financeMetrics.spent.toFixed(2)} / limit: ${financeMetrics.limit}</p>
                </div>
              </div>
              <div className="text-right font-mono">
                <span className={`text-[11px] font-bold ${!financeMetrics.isOverSpent ? 'text-[#00ff88]' : 'text-rose-400'}`}>
                  {financeMetrics.ratio > 0 ? `${Math.round(financeMetrics.ratio * 100)}%` : '0%'}
                </span>
                <p className="text-[8px] uppercase tracking-wider font-extrabold text-slate-500 mt-0.5">
                  {!financeMetrics.isOverSpent ? 'Balanced Amp' : '⚠ High Jitter'}
                </p>
              </div>
            </div>

            {/* Vector C indicator */}
            <div 
              onMouseEnter={() => setHoveredNode('reflection')}
              onMouseLeave={() => setHoveredNode(null)}
              className="p-3 bg-[#0a0a16] border border-[#1b1b36] hover:border-violet-500/50 rounded-xl flex items-center justify-between transition-all duration-200 cursor-default"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-violet-600/10 text-violet-400 border border-violet-500/25">
                  <BookOpen size={14} className="shrink-0" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h5 className="text-[11px] font-bold text-slate-200 uppercase tracking-wide">Reflective Mental Matrix</h5>
                    <span className="text-[7.5px] font-mono px-1.5 py-0.5 rounded bg-[#15152d] border border-[#2a2a50] text-slate-500 tracking-widest font-black uppercase">OSC. C</span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">Journal Input characters: {journalingMetrics.length}</p>
                </div>
              </div>
              <div className="text-right font-mono">
                <span className="text-[11px] font-bold text-violet-400">{Math.round(journalingMetrics.scale * 100)}%</span>
                <p className="text-[8px] uppercase tracking-wider font-extrabold text-slate-500 mt-0.5">Complexity Density</p>
              </div>
            </div>

            {/* Vector D indicator */}
            <div 
              onMouseEnter={() => setHoveredNode('adventures')}
              onMouseLeave={() => setHoveredNode(null)}
              className="p-3 bg-[#0a0a16] border border-[#1b1b36] hover:border-sky-500/50 rounded-xl flex items-center justify-between transition-all duration-200 cursor-default"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/25">
                  <Compass size={14} className="shrink-0" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h5 className="text-[11px] font-bold text-slate-200 uppercase tracking-wide">Outer Orbital Travel Ribbon</h5>
                    <span className="text-[7.5px] font-mono px-1.5 py-0.5 rounded bg-[#15152d] border border-[#2a2a50] text-slate-500 tracking-widest font-black uppercase">OSC. D</span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">Active Horizon Journeys: {travelMetrics.count}</p>
                </div>
              </div>
              <div className="text-right font-mono">
                <span className="text-[11px] font-bold text-sky-400">{travelMetrics.count > 0 ? 'Active' : 'Dormant'}</span>
                <p className="text-[8px] uppercase tracking-wider font-extrabold text-slate-500 mt-0.5">Outer Satellite Orbit</p>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
