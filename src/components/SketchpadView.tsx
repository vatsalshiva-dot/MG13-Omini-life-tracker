import React, { useRef, useState, useEffect } from 'react';
import { AppState, SketchEntry } from '../types';
import { Trash2, Save, PenTool } from 'lucide-react';

export const SketchpadView: React.FC<{ state: AppState; saveData: any; setAppState: any }> = ({ state, saveData, setAppState }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [activeEntry, setActiveEntry] = useState<string | null>(null);

  useEffect(() => {
    // initialize canvas
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#0d0d1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 4;
  }, []);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    let x, y;
    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = (e as React.MouseEvent).clientX - rect.left;
      y = (e as React.MouseEvent).clientY - rect.top;
    }
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    let x, y;
    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = (e as React.MouseEvent).clientX - rect.left;
      y = (e as React.MouseEvent).clientY - rect.top;
    }
    ctx.strokeStyle = '#ff6b1a';
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const saveSketch = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/jpeg', 0.5); // COMPRESSED
    
    const entry: SketchEntry = {
      id: activeEntry || 'sk_' + Date.now(),
      date: new Date().toISOString(),
      title: 'iPad Sketch ' + new Date().toLocaleTimeString(),
      dataUrl
    };

    setAppState((prev: AppState) => {
      const existing = prev.sketches || [];
      const isUpdate = existing.find(e => e.id === entry.id);
      let nextList = [];
      if (isUpdate) {
        nextList = existing.map(e => e.id === entry.id ? entry : e);
      } else {
        nextList = [...existing, entry];
      }
      setActiveEntry(entry.id);
      const next = { ...prev, sketches: nextList };
      saveData(next);
      return next;
    });
    alert('Sketch saved to Storage!');
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
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.src = sketch.dataUrl;
    setActiveEntry(id);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#0d0d1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setActiveEntry(null);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      <div className="border-b border-[#111120] pb-5 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white font-display">
            Visual <span className="text-[#aa44ff]">Sketchpad</span>
          </h2>
          <p className="text-xs uppercase tracking-widest text-[#a1a1aa] mt-1 font-mono">
            // IPAD COMPATIBLE CANVAS
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={clearCanvas} className="px-3 py-2 bg-[#111120] border border-[#2a2a50] text-slate-300 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#111120] transition">
            CLEAR
          </button>
          <button onClick={saveSketch} className="flex items-center gap-2 px-4 py-2 bg-[#aa44ff] text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-[#aa44ff]/80 transition shadow-lg shadow-[#aa44ff]/20">
            <Save size={14} />
            SAVE
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-3/4">
          <div className="bg-[#0d0d1a] border border-[#1e1e38] rounded-2xl p-2 shadow-2xl relative inline-block">
            <canvas
              ref={canvasRef}
              width={800}
              height={600}
              className="bg-[#0d0d1a] rounded-xl cursor-crosshair max-w-full h-auto touch-none"
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

        <div className="w-full lg:w-1/4 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono border-b border-[#111120] pb-2">
            Saved Canvas
          </h3>
          <div className="space-y-2">
            {(state.sketches || []).slice().reverse().map(sk => (
              <div 
                key={sk.id} 
                onClick={() => loadSketch(sk.id)}
                className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition ${activeEntry === sk.id ? 'bg-[#aa44ff]/10 border-[#aa44ff]/50' : 'bg-[#111120] border-[#2a2a50] hover:border-[#1e1e38]'}`}
              >
                <div className="w-10 h-10 rounded-lg overflow-hidden border border-[#2a2a50] shrink-0 bg-[#0d0d1a]">
                  <img src={sk.dataUrl} alt={sk.title} className="w-full h-full object-cover opacity-80" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-200 truncate">{sk.title}</p>
                  <p className="text-[9px] font-mono text-slate-500 mt-0.5">{new Date(sk.date).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
            {!(state.sketches?.length) && (
              <div className="p-5 text-center border border-dashed border-[#2a2a50] rounded-xl text-[10px] text-slate-600 uppercase font-mono tracking-widest">
                No sketches saved yet
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
