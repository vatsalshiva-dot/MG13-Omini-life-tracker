import React, { useRef, useState, useEffect } from 'react';
import { AppState, SketchEntry, JournalEntry } from '../types';
import { 
  Trash2, Save, PenTool, Check, Calendar, RotateCcw, RotateCw, 
  Grid, List, Sliders, Type, Download, Sparkles, Tag, ArrowUpRight, HelpCircle
} from 'lucide-react';

interface SketchpadProps {
  state: AppState;
  saveData: any;
  setAppState: any;
  showToast?: (msg: string, type?: 'ok' | 'nfo') => void;
}

type SketchTool = 'brush' | 'marker' | 'neon' | 'spray' | 'eraser' | 'line' | 'rect' | 'circle' | 'arrow';
type BgTemplate = 'blank' | 'grid' | 'ruled' | 'dots';

export const SketchpadView: React.FC<SketchpadProps> = ({ state, saveData, setAppState, showToast }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [activeEntry, setActiveEntry] = useState<string | null>(null);
  
  // Brush Settings
  const [activeTool, setActiveTool] = useState<SketchTool>('brush');
  const [brushColor, setBrushColor] = useState('#ff6b1a');
  const [brushWeight, setBrushWeight] = useState(6);
  const [bgTemplate, setBgTemplate] = useState<BgTemplate>('blank');
  const [customColor, setCustomColor] = useState('#ff6b1a');

  // Multi-coupling Options for Journal Integration
  const [embedInJournal, setEmbedInJournal] = useState(true);
  const [journalDate, setJournalDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [targetHeading, setTargetHeading] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Undo & Redo Canvas Stacks
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);

  // Drag previews support
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [dragStartData, setDragStartData] = useState<ImageData | null>(null);

  const swatches = [
    { value: '#ff6b1a', name: 'Volcanic Orange' },
    { value: '#00d4ff', name: 'Cyber Cyan' },
    { value: '#00ff88', name: 'Matrix Green' },
    { value: '#aa44ff', name: 'Vapor Purple' },
    { value: '#fbff00', name: 'Neon Yellow' },
    { value: '#ff0055', name: 'Neon Rose' },
    { value: '#ffffff', name: 'White' },
  ];

  // Set default target heading when prompts load
  useEffect(() => {
    if (state.journalPrompts && state.journalPrompts.length > 0 && !targetHeading) {
      setTargetHeading(state.journalPrompts[0].id);
    }
  }, [state.journalPrompts]);

  // Apply template canvas on startup or template change
  useEffect(() => {
    initCanvasTemplate();
  }, [bgTemplate]);

  const initCanvasTemplate = (initialLoad = false) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background base
    ctx.fillStyle = '#0d0d1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Apply specific templates
    if (bgTemplate === 'grid') {
      ctx.strokeStyle = '#1d1d36';
      ctx.lineWidth = 1;
      const step = 30;
      for (let x = 0; x < canvas.width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
    } else if (bgTemplate === 'ruled') {
      ctx.strokeStyle = '#1a1a36';
      ctx.lineWidth = 1.2;
      const step = 28;
      for (let y = step; y < canvas.height; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
      // Vertical margin line in red/orange
      ctx.strokeStyle = '#ff6b1a2a';
      ctx.beginPath();
      ctx.moveTo(60, 0);
      ctx.lineTo(60, canvas.height);
      ctx.stroke();
    } else if (bgTemplate === 'dots') {
      ctx.fillStyle = '#2d2d48';
      const step = 25;
      for (let x = step; x < canvas.width; x += step) {
        for (let y = step; y < canvas.height; y += step) {
          ctx.beginPath();
          ctx.arc(x, y, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    if (!initialLoad) {
      saveCanvasState();
    }
  };

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;
    
    if ('touches' in e) {
      if (e.touches.length === 0) return { x: 0, y: 0 };
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    // Scale back to internal high-resolution dimensions
    const x = ((clientX - rect.left) / rect.width) * canvas.width;
    const y = ((clientY - rect.top) / rect.height) * canvas.height;
    return { x, y };
  };

  const saveCanvasState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL();
    setUndoStack(prev => [...prev, dataUrl]);
    setRedoStack([]); // clear redo stack on new action
  };

  const handleUndo = () => {
    if (undoStack.length <= 1) {
      if (showToast) showToast("NOTHING TO UNDO", "nfo");
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const currentUrl = undoStack[undoStack.length - 1];
    const previousUrl = undoStack[undoStack.length - 2];
    
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0,0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      setUndoStack(prev => prev.slice(0, -1));
      setRedoStack(prev => [...prev, currentUrl]);
      if (showToast) showToast("UNDO REVERTED", "ok");
    };
    img.src = previousUrl;
  };

  const handleRedo = () => {
    if (redoStack.length === 0) {
      if (showToast) showToast("NOTHING TO REDO", "nfo");
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const nextUrl = redoStack[redoStack.length - 1];
    
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0,0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      setUndoStack(prev => [...prev, nextUrl]);
      setRedoStack(prev => prev.slice(0, -1));
      if (showToast) showToast("REDO RE-APPLIED", "ok");
    };
    img.src = nextUrl;
  };

  const drawArrow = (ctx: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number, color: string, weight: number) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = weight;
    ctx.fillStyle = color;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Draw line
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();
    
    // Arrow head
    const angle = Math.atan2(toY - fromY, toX - fromX);
    const headLength = Math.max(weight * 2.5, 12);
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headLength * Math.cos(angle - Math.PI / 6), toY - headLength * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(toX - headLength * Math.cos(angle + Math.PI / 6), toY - headLength * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    setIsDrawing(true);
    const coords = getCoordinates(e, canvas);
    setStartPos(coords);
    
    // Save snapshot of canvas before preview drawing
    const currentData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setDragStartData(currentData);

    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    
    // Configure stroke styles
    ctx.strokeStyle = activeTool === 'eraser' ? '#0d0d1a' : brushColor;
    ctx.lineWidth = activeTool === 'eraser' ? brushWeight * 2.2 : brushWeight;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (activeTool === 'neon') {
      ctx.shadowColor = brushColor;
      ctx.shadowBlur = brushWeight * 1.5;
    } else if (activeTool === 'marker') {
      ctx.strokeStyle = brushColor + '44'; // Hex Alpha 25% opacity
      ctx.shadowBlur = 0;
    } else {
      ctx.shadowBlur = 0;
    }

    if (activeTool === 'spray') {
      sprayPaint(ctx, coords.x, coords.y, brushColor, brushWeight);
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const coords = getCoordinates(e, canvas);
    
    // Configure current color
    const drawColor = activeTool === 'eraser' ? '#0d0d1a' : brushColor;
    const weight = activeTool === 'eraser' ? brushWeight * 2.2 : brushWeight;
    
    if (activeTool === 'brush' || activeTool === 'neon' || activeTool === 'marker' || activeTool === 'eraser') {
      ctx.strokeStyle = activeTool === 'marker' ? brushColor + '44' : drawColor;
      ctx.lineWidth = weight;
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
    } else if (activeTool === 'spray') {
      e.preventDefault();
      sprayPaint(ctx, coords.x, coords.y, brushColor, brushWeight);
    } else {
      // Shapes drawing - refresh preview canvas first to override dirty drags
      if (dragStartData) {
        ctx.putImageData(dragStartData, 0, 0);
      }
      
      ctx.strokeStyle = brushColor;
      ctx.lineWidth = brushWeight;
      ctx.shadowBlur = 0;

      if (activeTool === 'line') {
        ctx.beginPath();
        ctx.moveTo(startPos.x, startPos.y);
        ctx.lineTo(coords.x, coords.y);
        ctx.stroke();
      } else if (activeTool === 'rect') {
        ctx.beginPath();
        ctx.strokeRect(startPos.x, startPos.y, coords.x - startPos.x, coords.y - startPos.y);
      } else if (activeTool === 'circle') {
        ctx.beginPath();
        const radius = Math.sqrt(Math.pow(coords.x - startPos.x, 2) + Math.pow(coords.y - startPos.y, 2));
        ctx.arc(startPos.x, startPos.y, radius, 0, Math.PI * 2);
        ctx.stroke();
      } else if (activeTool === 'arrow') {
        drawArrow(ctx, startPos.x, startPos.y, coords.x, coords.y, brushColor, brushWeight);
      }
    }
  };

  const sprayPaint = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string, weight: number) => {
    ctx.fillStyle = color;
    ctx.shadowBlur = 0;
    const radius = weight * 2.5;
    const pointsDensity = Math.round(weight * 3);
    for (let i = 0; i < pointsDensity; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * radius;
      const sx = x + Math.cos(angle) * r;
      const sy = y + Math.sin(angle) * r;
      ctx.fillRect(sx, sy, 1.5, 1.5);
    }
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      saveCanvasState();
    }
  };

  const selectColor = (hex: string) => {
    setBrushColor(hex);
    setCustomColor(hex);
  };

  const toggleTagSelection = (tag: string) => {
    setSelectedTags(p => p.includes(tag) ? p.filter(t => t !== tag) : [...p, tag]);
  };

  // Safe file down-loader
  const downloadSketch = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `Omnilife_Sketch_${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
    if (showToast) showToast("SKETCH DOWNLOADED AS PNG", "ok");
  };

  const saveSketch = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/jpeg', 0.55); // compressed for performance
    
    const entryId = activeEntry || 'sk_' + Date.now();
    const entry: SketchEntry = {
      id: entryId,
      date: new Date().toISOString(),
      title: 'Canvas Drawing ' + new Date().toLocaleTimeString('en-US', { hour12: false }),
      dataUrl
    };

    setAppState((prev: AppState) => {
      const existing = prev.sketches || [];
      const index = existing.findIndex(e => e.id === entryId);
      
      let nextList = [];
      if (index !== -1) {
        nextList = existing.map(e => e.id === entryId ? entry : e);
      } else {
        nextList = [...existing, entry];
      }
      
      // Dynamic linked embedding with daily journals & customized section insertion
      let updatedJournals = { ...prev.journals };
      if (embedInJournal && journalDate) {
        const targetJournal = updatedJournals[journalDate] || {
          date: journalDate,
          mood: 0,
          energy: 0,
          tags: [],
          sections: {},
          savedAt: '',
          sketches: []
        };
        
        // Append sketch representation to global daily journal sketches array
        const currentSketches = targetJournal.sketches || [];
        const nextSketches = currentSketches.includes(dataUrl) ? currentSketches : [...currentSketches, dataUrl];
        
        // Integrate / append custom tag selections to the journal entry
        const prevTags = targetJournal.tags || [];
        const combinedTags = Array.from(new Set([...prevTags, ...selectedTags]));

        // Direct in-text embedding option inside chosen prompt section heading
        const prevSections = { ...targetJournal.sections };
        if (targetHeading) {
          const originalText = prevSections[targetHeading] || '';
          // Avoid appending duplicate links
          const linkMark = `\n\n🖼️ [LOCKED SKETCHPAD VISUAL: ${entry.title}]`;
          if (!originalText.includes(linkMark)) {
            prevSections[targetHeading] = originalText + linkMark;
          }
        }

        updatedJournals[journalDate] = {
          ...targetJournal,
          sketches: nextSketches,
          tags: combinedTags,
          sections: prevSections,
          savedAt: new Date().toISOString()
        };
      }

      setActiveEntry(entryId);
      const next = { 
        ...prev, 
        sketches: nextList,
        journals: updatedJournals
      };
      saveData(next);
      return next;
    });

    if (showToast) {
      showToast(`SKETCH EXPORTED TO JOURNAL${embedInJournal ? ' WITH MULTI-COUPLING ✓' : ' ✓'}`, 'ok');
    }
  };

  const loadSketch = (id: string) => {
    const sketch = (state.sketches || []).find(s => s.id === id);
    if (!sketch) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0,0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      setActiveEntry(id);
      // Save load to history
      const currentUrl = canvas.toDataURL();
      setUndoStack(prev => [...prev, currentUrl]);
      if (showToast) {
        showToast("SKETCH RE-PLACED TO ADVANCED MATRIX", "ok");
      }
    };
    img.src = sketch.dataUrl;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.fillStyle = '#0d0d1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    initCanvasTemplate();
    setActiveEntry(null);
    if (showToast) {
      showToast("CANVAS CANVAS CLEANED", "nfo");
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-14 text-slate-200">
      {/* Interactive Walkthrough / Pointer Help bar */}
      <div className="bg-[#111120] border border-[#2a2a50] rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#aa44ff]/10 text-[#aa44ff] flex items-center justify-center shrink-0">
            <Sparkles size={18} className="animate-pulse" />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-200 font-mono">
              ⚡ ITERATIVE SKETCH ENGINE INSTRUCTIONS
            </h4>
            <p className="text-[10px] text-slate-400 mt-0.5 leading-normal">
              1. Choose a <span className="text-[#aa44ff] font-bold">Brush Style</span> &bull; 2. Pick a <span className="text-[#ff6b1a] font-bold">Drawing Tool</span> &bull; 3. Draw on Canvas &bull; 4. Tag and Couple with Journals down right!
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] uppercase font-mono text-slate-500">// CANVAS SCALE: 800 x 500 PX</span>
        </div>
      </div>

      {/* Title Header Panel */}
      <div className="border-b border-[#2a2a50]/50 pb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white font-display">
            Canvas <span className="text-[#aa44ff]">Sketchpad PRO</span>
          </h2>
          <p className="text-xs uppercase tracking-widest text-[#a1a1aa] mt-1 font-mono">
            // INTERLOCK DAILY JOURNAL LINKING & GEOMETRIC SHAPES
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={clearCanvas} 
            className="px-4 py-2 border border-[#2a2a50] text-[#ff6b1a] rounded-xl text-xs font-black uppercase tracking-widest bg-orange-500/5 hover:bg-orange-500/10 transition font-mono"
            title="Clean entire drawing layer"
          >
            CLEAR
          </button>
          <button 
            onClick={downloadSketch} 
            className="p-2 border border-[#2a2a50] text-slate-350 hover:bg-[#111120] hover:text-white rounded-xl transition"
            title="Export standard PNG file locally"
          >
            <Download size={14} />
          </button>
          <button 
            onClick={saveSketch} 
            className="flex items-center gap-2 px-5 py-2.5 bg-[#aa44ff] text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-[#aa44ff]/80 transition shadow-lg shadow-[#aa44ff]/20 font-mono select-none"
          >
            <Save size={14} />
            SAVE & COUPLE
          </button>
        </div>
      </div>

      {/* Grid: Left advanced settings desk, center Canvas, Right historic/integrated stack */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* Advanced Tool Desk */}
        <div className="space-y-4 xl:col-span-1">
          <div className="bg-[#111120] border border-[#2a2a50] rounded-2xl p-5 space-y-5 font-mono">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest border-b border-[#2a2a50]/50 pb-2 flex items-center gap-1.5">
              <Sliders size={13} className="text-[#aa44ff]" />
              BRUSH CONTROLS
            </h3>
            
            {/* Swatches & Picker */}
            <div className="space-y-2">
              <span className="text-[10px] text-slate-400 block tracking-widest font-bold">// INK CHROMINANCE</span>
              <div className="flex flex-wrap gap-1.5">
                {swatches.map((sw) => (
                  <button
                    key={sw.value}
                    onClick={() => selectColor(sw.value)}
                    title={sw.name}
                    className={`w-6 h-6 rounded-lg transition-all border-2 ${brushColor === sw.value ? 'border-white scale-115 shadow-md shadow-white/10' : 'border-[#2a2a50] hover:border-slate-300'}`}
                    style={{ backgroundColor: sw.value }}
                  />
                ))}
                {/* Custom Color Input */}
                <div className="w-10 h-6 relative rounded-lg overflow-hidden border border-[#2a2a50] cursor-pointer bg-[#0d0d1a]">
                  <input 
                    type="color" 
                    value={customColor}
                    onChange={(e) => selectColor(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full scale-150"
                  />
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-[9px] uppercase font-bold text-slate-300">
                    HEX
                  </div>
                </div>
              </div>
            </div>

            {/* Scale Width */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-bold text-slate-400">
                <span>// WEIGHT RANGE:</span>
                <span className="text-[#00ff88]">{brushWeight}PX</span>
              </div>
              <input
                type="range"
                min={2}
                max={30}
                value={brushWeight}
                onChange={(e) => setBrushWeight(Number(e.target.value))}
                className="w-full h-1.5 bg-[#0d0d1a] border border-[#2a2a50] rounded-lg appearance-none cursor-pointer accent-[#aa44ff]"
              />
            </div>

            {/* Grid templates */}
            <div className="space-y-2">
              <span className="text-[10px] text-slate-400 block tracking-widest font-bold">// CANVAS TEMPLATE</span>
              <div className="grid grid-cols-2 gap-1.5 text-[10px] font-bold">
                {(['blank', 'grid', 'ruled', 'dots'] as BgTemplate[]).map((tmpl) => (
                  <button
                    key={tmpl}
                    onClick={() => setBgTemplate(tmpl)}
                    className={`p-2 uppercase rounded-lg border text-center transition ${bgTemplate === tmpl ? 'border-[#00ff88] text-[#00ff88] bg-[#00ff88]/5' : 'border-[#2a2a50] text-[#a0a0b2] hover:text-white'}`}
                  >
                    {tmpl}
                  </button>
                ))}
              </div>
            </div>

            {/* Brush Style Selector */}
            <div className="space-y-2 pt-1">
              <span className="text-[10px] text-slate-400 block tracking-widest font-bold">// BRUSH STYLE</span>
              <div className="grid grid-cols-2 gap-1 text-[9px] font-bold">
                {[
                  { id: 'brush', label: '🖊️ HIGH PEN' },
                  { id: 'marker', label: '🧪 MARKER 25%' },
                  { id: 'neon', label: '🌟 GLOW NEON' },
                  { id: 'spray', label: '💨 AIRBRUSH' },
                  { id: 'eraser', label: '🧽 RUBBER FLUID' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTool(item.id as SketchTool);
                      if (showToast) showToast(`EQUIPPED: ${item.label.substring(3)}`, 'nfo');
                    }}
                    className={`p-2 rounded-lg border text-left flex items-center gap-1.5 transition ${activeTool === item.id ? 'border-[#aa44ff] text-[#aa44ff] bg-[#aa44ff]/5 font-black' : 'border-[#2a2a50] text-slate-400 hover:text-white'}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Geometric Shapes */}
            <div className="space-y-2 pt-1">
              <span className="text-[10px] text-slate-400 block tracking-widest font-bold">// GEOMETRIC SHAPES</span>
              <div className="grid grid-cols-2 gap-1 text-[9px] font-semibold">
                {[
                  { id: 'line', label: '📏 RULED LINE' },
                  { id: 'rect', label: '🟥 SQUARED RECT' },
                  { id: 'circle', label: '⭕ CIRCULAR DISK' },
                  { id: 'arrow', label: '➡️ VECTOR ARROW' },
                ].map((shape) => (
                  <button
                    key={shape.id}
                    onClick={() => {
                      setActiveTool(shape.id as SketchTool);
                      if (showToast) showToast(`ACTIVATED SHAPE: ${shape.label.substring(3)}`, 'nfo');
                    }}
                    className={`p-2 rounded-lg border text-left flex items-center gap-1.5 transition ${activeTool === shape.id ? 'border-[#00d4ff] text-[#00d4ff] bg-[#00d4ff]/5 font-black' : 'border-[#2a2a50] text-slate-450 hover:text-white'}`}
                  >
                    {shape.label}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Undo & Redo Row */}
            <div className="flex gap-2 pt-2 border-t border-[#2a2a50]/55">
              <button
                onClick={handleUndo}
                className="flex-1 p-2 bg-[#0d0d1a] border border-[#2a2a50] rounded-xl hover:text-white transition flex items-center justify-center gap-1.5 text-xs text-slate-400"
                title="Undo last stroke"
              >
                <RotateCcw size={12} /> Undo
              </button>
              <button
                onClick={handleRedo}
                className="flex-1 p-2 bg-[#0d0d1a] border border-[#2a2a50] rounded-xl hover:text-white transition flex items-center justify-center gap-1.5 text-xs text-slate-400"
                title="Redo previous undo"
              >
                <RotateCw size={12} /> Redo
              </button>
            </div>

          </div>
        </div>

        {/* Center: Interactive Canvas Board */}
        <div className="xl:col-span-2 space-y-4">
          <div className="bg-[#0d0d1a] border border-[#1e1e38] rounded-2xl p-3 shadow-2xl relative">
            <canvas
              ref={canvasRef}
              width={800}
              height={500}
              className="bg-[#0d0d1a] rounded-xl cursor-crosshair w-full h-auto touch-none border border-[#1e1e32] select-none"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseOut={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
          </div>
        </div>

        {/* Right: Timeline Coupling & Historic Vault */}
        <div className="space-y-4 xl:col-span-1 font-mono">
          
          {/* Journal Multi-Coupling Deck */}
          <div className="bg-[#111120] border border-[#2a2a50] rounded-2xl p-5 space-y-4 font-mono text-xs">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest border-b border-[#2a2a50]/55 pb-2 flex items-center gap-1.5">
              <ArrowUpRight size={13} className="text-[#ff6b1a]" />
              JOURNAL COUPLING
            </h3>

            <div className="space-y-3 font-sans">
              
              {/* Embed toggler */}
              <label className="flex items-center gap-3 cursor-pointer text-slate-350 select-none">
                <input
                  type="checkbox"
                  checked={embedInJournal}
                  onChange={(e) => setEmbedInJournal(e.target.checked)}
                  className="rounded border-[#2a2a50] bg-[#0d0d1a] text-[#aa44ff] focus:ring-0 cursor-pointer w-4 h-4"
                />
                <span className="text-xs font-bold font-mono">LINK DIRECTLY &bull; ACTIVE</span>
              </label>

              {embedInJournal && (
                <div className="space-y-3.5 pt-2 animate-fadeIn font-mono text-[11px]">
                  
                  {/* Target Date */}
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 block tracking-widest font-extrabold">// DIARY TARGET DATE</span>
                    <input
                      type="date"
                      value={journalDate}
                      onChange={(e) => setJournalDate(e.target.value)}
                      className="w-full bg-[#0d0d1a] border border-[#2a2a50] text-[#aa44ff] text-xs p-2 rounded-xl focus:outline-none focus:border-[#aa44ff]"
                    />
                  </div>

                  {/* Targeted reflection section */}
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 block tracking-widest font-extrabold">// IN-TEXT ENCLAVE SECTION</span>
                    <select
                      value={targetHeading}
                      onChange={(e) => setTargetHeading(e.target.value)}
                      className="w-full bg-[#0d0d1a] border border-[#2a2a50] text-[#ff6b1a] text-xs p-2 rounded-xl focus:outline-none focus:border-[#ff6b1a]"
                    >
                      {state.journalPrompts.map((p) => (
                        <option value={p.id} key={p.id}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Direct Multi Tag Selector */}
                  <div className="space-y-2.5 pt-1">
                    <span className="text-[10px] text-slate-400 block tracking-widest font-extrabold flex items-center gap-1">
                      <Tag size={10} /> // DAILY TAG CLOUDS
                    </span>
                    <div className="flex flex-wrap gap-1 max-h-[85px] overflow-y-auto pr-1">
                      {state.journalTags.map(tag => {
                        const isChosen = selectedTags.includes(tag);
                        return (
                          <button
                            key={tag}
                            onClick={() => toggleTagSelection(tag)}
                            className={`px-2 py-1 text-[9px] font-extrabold rounded-lg border uppercase transition ${isChosen ? 'bg-[#ff6b1a]/20 border-[#ff6b1a] text-[#ff6b1a] font-black' : 'border-[#2a2a50] text-slate-500 bg-[#0d0d1a]/60 hover:text-slate-350'}`}
                          >
                            + {tag}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                </div>
              )}
            </div>
          </div>

          {/* Sketch Backup Vault */}
          <div className="bg-[#111120] border border-[#2a2a50] rounded-2xl p-5 space-y-3 text-xs font-mono">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#aa44ff] border-b border-[#2a2a50]/50 pb-2 flex items-center gap-1.5">
              🖼️ HISTORIC VAULT ({state.sketches?.length || 0})
            </h3>
            <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
              {(state.sketches || []).slice().reverse().map((sk) => (
                <div 
                  key={sk.id} 
                  onClick={() => loadSketch(sk.id)}
                  className={`p-2.5 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all duration-300 ${activeEntry === sk.id ? 'bg-[#aa44ff]/10 border-[#aa44ff] shadow-[0_0_12px_rgba(170,68,255,0.15)] scale-[1.02]' : 'bg-[#0d0d1a]/50 border-[#2a2a50] hover:border-[#aa44ff]/35'}`}
                >
                  <div className="w-10 h-10 rounded-lg overflow-hidden border border-[#2a2a50] shrink-0 bg-[#0d0d1a] relative">
                    <img src={sk.dataUrl} alt={sk.title} className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold text-slate-200 truncate">{sk.title}</p>
                    <p className="text-[8px] text-slate-500 font-mono mt-0.5 max-w-full truncate">
                      {new Date(sk.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
              {!(state.sketches?.length) && (
                <div className="p-8 text-center border border-dashed border-[#2a2a50] rounded-xl text-[9px] text-slate-500 uppercase tracking-wider leading-relaxed">
                  // VAULT IS EMPTY. START DRAWING TO BACK UP STATE.
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
