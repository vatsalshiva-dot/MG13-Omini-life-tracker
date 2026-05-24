import React, { useState, useEffect, useRef } from 'react';
import { AppState, TrackerCategory, JournalEntry, Reminder, JournalPrompt } from '../types';
import { fmtShort, fmtDate, todayStr } from '../utils/date';
import { CATS } from '../utils/storage';
import { 
  Plus, Trash2, Edit3, Settings, Bell, Calendar, CheckSquare, 
  Smile, Zap, Award, ThumbsUp, Tag, PlusCircle, Check, MapPin, Image as ImageIcon, ClipboardCopy, FileImage, Search
} from 'lucide-react';

interface JournalViewProps {
  state: AppState;
  date: string;
  onSetDate: (date: string) => void;
  onChangeDate: (offset: number) => void;
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
  onSaveJournal: (dateStr: string, updated: Partial<JournalEntry>) => void;
  onUpdateJournalPrompts: (prompts: JournalPrompt[]) => void;
  onUpdateJournalTags: (tags: string[]) => void;
  onAddReminder: (rem: Omit<Reminder, 'id' | 'status'>) => void;
  onToggleReminder: (id: string) => void;
  onNavigate: (viewId: string) => void;
}

export const JournalView: React.FC<JournalViewProps> = ({
  state,
  date,
  onSetDate,
  onChangeDate,
  dayStats,
  onSaveJournal,
  onUpdateJournalPrompts,
  onUpdateJournalTags,
  onAddReminder,
  onToggleReminder,
  onNavigate
}) => {
  const today = date;
  const entry: JournalEntry = state.journals[today] || {
    date: today,
    mood: 0,
    energy: 0,
    tags: [],
    sections: {},
    savedAt: ''
  };

  const dailyProgress = dayStats(today);

  // Layout editor state
  const [showLayoutEditor, setShowLayoutEditor] = useState(false);
  const [newPromptLabel, setNewPromptLabel] = useState('');
  const [newPromptPlaceholder, setNewPromptPlaceholder] = useState('');

  // Custom tags state
  const [newTagInput, setNewTagInput] = useState('');
  
  const [viewState, setViewState] = useState<'editor' | 'timeline'>('editor');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSketch, setShowSketch] = useState(false);
  const [showLocMenu, setShowLocMenu] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Provide initial stroke setup
  useEffect(() => {
    if (showSketch && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#0d0d1a';
        ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#00d4ff';
      }
    }
  }, [showSketch]);

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    setIsDrawing(true);
    
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };
  
  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    e.preventDefault(); 
    const rect = canvasRef.current.getBoundingClientRect();
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };
  
  const stopDraw = () => {
    if (!isDrawing || !canvasRef.current) return;
    setIsDrawing(false);
  };

  const overrideSaveSketch = () => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL('image/png', 0.8);
    onSaveJournal(date, { sketches: [...(entry.sketches || []), dataUrl] });
    setShowSketch(false);
  };

  const moodTexts = ['', '😞 Rough Focus', '😕 Exhausted', '😐 Stable / Fair', '😊 High Spirit', '🌟 Stellar / Peak'];
  const energyTexts = ['', '🔋 Drained', '😴 Low Charge', '⚡ Functional', '🚀 Motivated', '🔥 Redline / Peak'];

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const scale = Math.min(MAX_WIDTH / img.width, 1);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        const base64Str = canvas.toDataURL('image/jpeg', 0.6);
        onSaveJournal(date, { photos: [...(entry.photos || []), base64Str] });
      };
      if (ev.target?.result) img.src = ev.target.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleCaptureGPS = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onSaveJournal(date, {
          location: { lat: pos.coords.latitude, lng: pos.coords.longitude }
        });
        alert('GPS location securely anchored to journal log.');
      },
      (err) => {
        alert("Error mapping coordinates: " + err.message);
      }
    );
  };



  // Inline Quick Reminder state
  const [remTitle, setRemTitle] = useState('');
  const [remTime, setRemTime] = useState('');
  const [remType, setRemType] = useState('Personal');

  // Load section entries as needed
  const handleSectionChange = (promptId: string, val: string) => {
    const updatedSections = { ...entry.sections, [promptId]: val };
    onSaveJournal(today, { sections: updatedSections });
  };

  const handleMoodSelect = (mValue: number) => {
    onSaveJournal(today, { mood: entry.mood === mValue ? 0 : mValue });
  };

  const handleEnergySelect = (eValue: number) => {
    onSaveJournal(today, { energy: entry.energy === eValue ? 0 : eValue });
  };

  const toggleTag = (tg: string) => {
    const activeTags = entry.tags || [];
    const updatedTags = activeTags.includes(tg)
      ? activeTags.filter(t => t !== tg)
      : [...activeTags, tg];
    onSaveJournal(today, { tags: updatedTags });
  };

  const handleCreateTag = (e: React.FormEvent) => {
    e.preventDefault();
    const tag = newTagInput.trim();
    if (!tag) return;
    if (!state.journalTags.includes(tag)) {
      onUpdateJournalTags([...state.journalTags, tag]);
    }
    toggleTag(tag);
    setNewTagInput('');
  };

  const handleDeleteTagPool = (tag: string) => {
    onUpdateJournalTags(state.journalTags.filter(t => t !== tag));
  };

  // Heading Prompts Customization Actions
  const handleAddPrompt = (e: React.FormEvent) => {
    e.preventDefault();
    const lbl = newPromptLabel.trim();
    if (!lbl) return;
    const pId = 'prompt_' + Date.now();
    const newPr: JournalPrompt = {
      id: pId,
      label: lbl,
      placeholder: newPromptPlaceholder.trim() || 'Write reflection...'
    };
    onUpdateJournalPrompts([...state.journalPrompts, newPr]);
    setNewPromptLabel('');
    setNewPromptPlaceholder('');
  };

  const handleDeletePrompt = (id: string) => {
    if (state.journalPrompts.length <= 1) {
      alert('Keep at least one heading section so you can write!');
      return;
    }
    if (confirm('Delete this journal heading? Your text for this heading on old entries is saved, but the input section will be removed.')) {
      onUpdateJournalPrompts(state.journalPrompts.filter(p => p.id !== id));
    }
  };

  const handleMovePrompt = (index: number, direction: 'up' | 'down') => {
    const arr = [...state.journalPrompts];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= arr.length) return;
    
    // Swap
    const temp = arr[index];
    arr[index] = arr[targetIdx];
    arr[targetIdx] = temp;
    onUpdateJournalPrompts(arr);
  };

  // Inline Quick Reminder
  const handleCreateReminder = (e: React.FormEvent) => {
    e.preventDefault();
    const tit = remTitle.trim();
    if (!tit) return;
    onAddReminder({
      title: tit,
      dueDate: today,
      time: remTime,
      type: remType,
      priority: 'medium',
      repeat: 'none',
      notes: 'Added from daily journal page'
    });
    setRemTitle('');
    setRemTime('');
  };

  // Connected reminders/events for this date
  const dayReminders = state.reminders.filter(r => r.dueDate === today);

  return (
    <div className="space-y-6">
      {/* Date Header navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#111120] pb-5">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white font-display flex items-center gap-2">
            Journal & Reflections
          </h2>
          <div className="flex items-center gap-3 mt-1.5">
            <select
              value={viewState}
              onChange={(e) => setViewState(e.target.value as 'editor' | 'timeline')}
              className="bg-[#0d0d1a] border border-[#2a2a50] text-[#ff6b1a] rounded-lg px-2 py-1 text-xs font-bold uppercase tracking-widest font-mono focus:outline-none cursor-pointer"
            >
              <option value="editor">Editor (Daily View)</option>
              <option value="timeline">Archive (History & Search)</option>
            </select>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">

          
          <div className="flex items-center gap-2 bg-[#111120] border border-[#2a2a50] p-1.5 rounded-xl font-mono">
          <button 
            onClick={() => onChangeDate(-1)}
            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:bg-[#111120] hover:text-[#ff6b1a] rounded-lg transition-all duration-150 font-bold cursor-pointer"
          >
            ◀
          </button>
          <div className="px-3 py-1 text-xs font-black text-indigo-450 tracking-widest uppercase text-[#ff6b1a]">
            {fmtShort(today)}
          </div>
          <button 
            onClick={() => onChangeDate(1)}
            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:bg-[#111120] hover:text-[#ff6b1a] rounded-lg transition-all duration-150 font-bold cursor-pointer"
          >
            ▶
          </button>
          <button 
            onClick={() => onSetDate(todayStr())}
            className="px-3 py-1.5 text-[10px] font-bold text-white bg-[#ff6b1a] rounded-lg hover:bg-[#ff6b1a] transition-all duration-150 tracking-wider uppercase cursor-pointer"
          >
            TODAY
          </button>
          </div>
        </div>
      </div>

      {/* Main Grid: left writing desk, right metrics/reminders sidebar */}
      {viewState === 'editor' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Left Side: Writing Desk */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Day Mood & Energy */}
          <div className="bg-[#111120] border border-[#2a2a50] rounded-2xl p-5 shadow-sm">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-2 mb-4 font-mono border-b border-[#1e1e38] pb-3">
              <Smile size={14} className="text-[#ff6b1a] animate-bounce" />
              How was your day?
            </h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2 font-mono">MOOD REFLECTION</p>
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map(val => {
                    const icons = ['😞', '😕', '😐', '😊', '🌟'];
                    const styles = [
                      '',
                      'hover:bg-rose-500/10 hover:border-rose-500/35 border-[#1e1e38] text-rose-550',
                      'hover:bg-orange-500/10 hover:border-orange-500/35 border-[#1e1e38] text-orange-400',
                      'hover:bg-yellow-550/10 hover:border-yellow-500/35 border-[#1e1e38] text-yellow-450',
                      'hover:bg-emerald-500/10 hover:border-emerald-500/35 border-[#1e1e38] text-emerald-400',
                      'hover:bg-[#ff6b1a]/10 hover:border-[#ff6b1a]/35 border-[#1e1e38] text-[#ff6b1a]'
                    ];
                    const labels = ['', 'Rough', 'Low', 'Okay', 'Good', 'Peak!'];
                    const isActive = entry.mood === val;
                    return (
                      <button 
                        key={val}
                        onClick={() => handleMoodSelect(val)}
                        className={`py-2 border rounded-xl text-center font-bold text-xs flex flex-col items-center gap-1 transition-all duration-200 cursor-pointer ${
                          isActive 
                            ? 'bg-[#111120]/80 scale-[1.03] border-indigo-505 border-[#ff6b1a] font-black' 
                            : 'bg-[#0d0d1a]/60 border-[#2a2a50] hover:bg-[#0d0d1a]'
                        } ${styles[val]}`}
                      >
                        <span className="text-lg">{icons[val-1]}</span>
                        <span className="text-[9px] font-bold uppercase tracking-wide">{labels[val]}</span>
                      </button>
                    );
                  })}
                </div>
                {entry.mood > 0 && (
                  <p className="text-[10px] text-slate-500 mt-2 font-mono">// mood logged as: {moodTexts[entry.mood]}</p>
                )}
              </div>

              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2 font-mono">ENERGY CHARGE</p>
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map(val => {
                    const icons = ['🔋', '😴', '⚡', '🚀', '🔥'];
                    const styles = [
                      '',
                      'hover:bg-rose-500/10 hover:border-rose-500 border-[#1e1e38] text-rose-500',
                      'hover:bg-[#ff6b1a]/10 hover:border-[#ff6b1a] border-[#1e1e38] text-[#ff6b1a]',
                      'hover:bg-amber-500/10 hover:border-amber-500 border-[#1e1e38] text-amber-500',
                      'hover:bg-emerald-500/10 hover:border-emerald-400 border-[#1e1e38] text-emerald-400',
                      'hover:bg-pink-500/10 hover:border-pink-500 border-[#1e1e38] text-pink-400'
                    ];
                    const labels = ['', 'Drained', 'Low', 'Fine', 'High', 'Peak'];
                    const isActive = entry.energy === val;
                    return (
                      <button 
                        key={val}
                        onClick={() => handleEnergySelect(val)}
                        className={`py-2 border rounded-xl text-center font-bold text-xs flex flex-col items-center gap-1 transition-all duration-200 cursor-pointer ${
                          isActive 
                            ? 'bg-[#111120]/80 scale-[1.03] border-[#ff6b1a] font-extrabold' 
                            : 'bg-[#0d0d1a]/60 border-[#1e1e38] hover:bg-[#0d0d1a]'
                        } ${styles[val]}`}
                      >
                        <span className="text-base">{icons[val-1]}</span>
                        <span className="text-[9px] font-bold uppercase tracking-wide">{labels[val]}</span>
                      </button>
                    );
                  })}
                </div>
                {entry.energy > 0 && (
                  <p className="text-[10px] text-slate-500 mt-2 font-mono">// energy logged as: {energyTexts[entry.energy]}</p>
                )}
              </div>
            </div>
          </div>

          {/* Dynamic Prompts / Custom Headings */}
          <div className="bg-[#111120] border border-[#2a2a50] rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#1e1e38] pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 font-mono">
                <Edit3 size={14} className="text-[#ff6b1a]" />
                CUSTOM DAILY REFLECTION
              </h3>
              
              <button 
                onClick={() => setShowLayoutEditor(!showLayoutEditor)}
                className="text-[10px] flex items-center gap-1.5 bg-[#0d0d1a] border border-[#2a2a50] hover:bg-[#111120]/60 font-bold uppercase px-2.5 py-1 rounded-xl text-[#ff6b1a] transition cursor-pointer"
              >
                <Settings size={10} />
                Customize Headings
              </button>
            </div>

            {/* Prompt Configurator */}
            {showLayoutEditor && (
              <div className="bg-[#0d0d1a]/80 p-4 rounded-xl border border-[#2a2a50] space-y-3.5 animate-fadeIn">
                <h4 className="text-[11px] font-bold tracking-wider text-[#ff6b1a] uppercase font-mono">// heading customization panel</h4>
                
                <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1 scrollbar-none">
                  {state.journalPrompts.map((p, idx) => (
                    <div key={p.id} className="flex items-center gap-2 justify-between bg-[#111120] px-3 py-2 rounded-xl text-xs border border-[#2a2a50]/55">
                      <span className="font-bold text-slate-300">{p.label}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        <button 
                          onClick={() => handleMovePrompt(idx, 'up')}
                          disabled={idx === 0}
                          className="px-2 py-0.5 text-[8px] bg-[#0d0d1a] disabled:opacity-20 text-slate-400 rounded-lg hover:bg-[#111120] border border-[#2a2a50]/40 cursor-pointer"
                        >
                          ▲
                        </button>
                        <button 
                          onClick={() => handleMovePrompt(idx, 'down')}
                          disabled={idx === state.journalPrompts.length - 1}
                          className="px-2 py-0.5 text-[8px] bg-[#0d0d1a] disabled:opacity-20 text-slate-400 rounded-lg hover:bg-[#111120] border border-[#2a2a50]/40 cursor-pointer"
                        >
                          ▼
                        </button>
                        <button 
                          onClick={() => handleDeletePrompt(p.id)}
                          className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg transition cursor-pointer"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Create prompt */}
                <form onSubmit={handleAddPrompt} className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-3.5 border-t border-[#111120]">
                  <div className="col-span-1">
                    <input 
                      type="text"
                      className="w-full bg-[#111120] border border-[#2a2a50]/75 px-3 py-1.5 text-xs rounded-xl text-slate-100 placeholder-zinc-650 focus:outline-none focus:border-[#ff6b1a]"
                      placeholder="e.g. 🍕 FOOD LOG"
                      value={newPromptLabel}
                      onChange={(e) => setNewPromptLabel(e.target.value)}
                    />
                  </div>
                  <div className="col-span-1 flex gap-2">
                    <input 
                      type="text"
                      className="flex-1 bg-[#111120] border border-[#2a2a50]/75 px-3 py-1.5 text-xs rounded-xl text-slate-100 placeholder-zinc-650 focus:outline-none focus:border-[#ff6b1a]"
                      placeholder="Optional placeholder..."
                      value={newPromptPlaceholder}
                      onChange={(e) => setNewPromptPlaceholder(e.target.value)}
                    />
                    <button 
                      type="submit"
                      className="px-3.5 bg-[#ff6b1a] hover:bg-[#ff6b1a] text-white font-extrabold text-[10px] tracking-wider rounded-xl transition cursor-pointer"
                    >
                      ADD
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Main Inputs */}
            <div className="space-y-4">
              {state.journalPrompts.map((p) => {
                const textVal = entry.sections[p.id] || '';
                return (
                  <div key={p.id} className="space-y-1.5">
                    <label className="text-[10px] font-black tracking-widest text-[#ff6b1a] uppercase block font-mono">
                      {p.label}
                    </label>
                    <textarea
                      className="w-full min-h-[95px] bg-[#0d0d1a]/80 border border-[#2a2a50] rounded-xl px-3.5 py-2.5 text-xs text-slate-200 placeholder-zinc-600 focus:placeholder-zinc-700 leading-relaxed focus:outline-none focus:border-indigo-550 focus:border-[#ff6b1a] transition-all"
                      placeholder={p.placeholder}
                      value={textVal}
                      onChange={(e) => handleSectionChange(p.id, e.target.value)}
                    />
                  </div>
                );
              })}
            </div>

            {/* Media & Coordinates Anchors */}
            <div className="pt-4 mt-6 border-t border-[#1a1a2e] space-y-4">
              <h3 className="text-[10px] font-black tracking-widest text-[#00d4ff] uppercase block font-mono">Location & Assets</h3>
              <div className="flex gap-2">
                <label className="flex items-center gap-2 px-3 py-1.5 bg-[#00d4ff]/10 text-[#00d4ff] border border-[#00d4ff]/20 rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer hover:bg-[#00d4ff]/20 transition">
                  <ImageIcon size={12} />
                  Attach Image
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                </label>
                <div className="relative">
                  <button 
                    onClick={() => setShowLocMenu(!showLocMenu)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-[#aa44ff]/10 text-[#aa44ff] border border-[#aa44ff]/20 rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer hover:bg-[#aa44ff]/20 transition"
                  >
                    <MapPin size={12} />
                    Location
                  </button>
                  {showLocMenu && (
                    <div className="absolute top-full lg:bottom-full lg:mb-2 lg:top-auto mt-2 left-0 bg-[#111120] border border-[#2a2a50] rounded-xl p-1.5 flex flex-col gap-1 w-48 z-10 shadow-2xl">
                      <button onClick={() => { handleCaptureGPS(); setShowLocMenu(false); }} className="text-left px-2 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-[#1a1a30] text-[#00ff88] rounded-lg transition">Current (Locate)</button>
                      <a href="https://maps.google.com" target="_blank" rel="noreferrer" onClick={() => setShowLocMenu(false)} className="text-left px-2 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-[#1a1a30] text-[#00d4ff] rounded-lg transition block">Google Maps</a>
                      <a href="https://maps.apple.com" target="_blank" rel="noreferrer" onClick={() => setShowLocMenu(false)} className="text-left px-2 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-[#1a1a30] text-[#ffaa44] rounded-lg transition block">Apple Maps</a>
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => setShowSketch(!showSketch)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-[#ffaa44]/10 text-[#ffaa44] border border-[#ffaa44]/20 rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer hover:bg-[#ffaa44]/20 transition"
                >
                  <Edit3 size={12} />
                  {showSketch ? 'Hide Sketch' : 'Sketch'}
                </button>
              </div>

              {/* Sketch UI */}
              {showSketch && (
                <div className="bg-[#111120] border border-[#2a2a50] p-4 rounded-xl">
                  <div className="flex justify-between items-center mb-3">
                    <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">Scribble Canvas</p>
                    <button onClick={overrideSaveSketch} className="bg-[#ffaa44] text-[#111120] px-3 py-1 text-[10px] uppercase font-bold rounded-lg hover:bg-orange-300 transition">Save to Journal</button>
                  </div>
                  <canvas 
                    ref={canvasRef}
                    width={500} 
                    height={300} 
                    onMouseDown={startDraw}
                    onMouseMove={draw}
                    onMouseUp={stopDraw}
                    onMouseLeave={stopDraw}
                    onTouchStart={startDraw}
                    onTouchMove={draw}
                    onTouchEnd={stopDraw}
                    className="w-full bg-[#0d0d1a] border border-[#2a2a50] rounded-xl cursor-crosshair touch-none"
                  />
                </div>
              )}

              {/* Renders */}
              {entry.location && (
                <div className="bg-[#111120] border border-[#2a2a50] p-3 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-300">
                    <MapPin size={14} className="text-[#aa44ff]" />
                    <span className="text-[10px] font-mono">
                      {typeof entry.location === 'string' ? entry.location : `${entry.location.lat?.toFixed(4)}, ${entry.location.lng?.toFixed(4)}`}
                    </span>
                  </div>
                  {typeof entry.location !== 'string' && entry.location.lat && (
                    <div className="flex items-center gap-2">
                       <a 
                         href={`https://maps.google.com/?q=${entry.location.lat},${entry.location.lng}`}
                         target="_blank" rel="noreferrer"
                         className="text-[9px] font-bold uppercase tracking-widest text-[#111120] bg-[#00d4ff] px-2 py-1 rounded hover:opacity-80 transition block"
                       >
                         Google Maps
                       </a>
                       <a 
                         href={`https://maps.apple.com/?q=${entry.location.lat},${entry.location.lng}`}
                         target="_blank" rel="noreferrer"
                         className="text-[9px] font-bold uppercase tracking-widest text-white bg-[#aa44ff] px-2 py-1 rounded hover:bg-[#aa44ff]/80 transition block"
                       >
                         Apple Maps
                       </a>
                    </div>
                  )}
                </div>
              )}

              {entry.photos && entry.photos.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {entry.photos.map((pt, i) => (
                    <div key={i} className="aspect-square bg-[#0d0d1a] border border-[#2a2a50] rounded-xl overflow-hidden relative group">
                      <img src={pt} alt="Journal Upload" className="object-cover w-full h-full opacity-80 group-hover:opacity-100 transition" />
                      <button 
                        onClick={() => {
                           // Remove photo
                           onSaveJournal(date, { photos: entry.photos!.filter((_, idx) => idx !== i) });
                        }}
                        className="absolute top-1 right-1 p-1 bg-rose-500/80 text-white rounded opacity-0 group-hover:opacity-100 transition cursor-pointer"
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {entry.sketches && entry.sketches.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {entry.sketches.map((sk, i) => (
                    <div key={'sk_'+i} className="aspect-video bg-[#0d0d1a] border border-[#2a2a50] rounded-xl overflow-hidden relative group flex items-center justify-center p-1">
                      <img src={sk} alt="Journal Sketch" className="object-contain w-full h-full opacity-90 group-hover:opacity-100 transition" />
                      <button 
                        onClick={() => {
                           onSaveJournal(date, { sketches: entry.sketches!.filter((_, idx) => idx !== i) });
                        }}
                        className="absolute top-1 right-1 p-1 bg-rose-500/80 text-white rounded opacity-0 group-hover:opacity-100 transition cursor-pointer"
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Connections Card Sidebar */}
        <div className="space-y-4">
          
          {/* Day Review Snapshot */}
          <div className="bg-[#111120] border border-[#2a2a50] rounded-2xl p-5 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 mb-3.5 border-b border-[#1e1e38] pb-3 font-mono">
              <Award size={14} className="text-emerald-400" />
              Day Progress Snapshot
            </h3>

            <div className="grid grid-cols-2 gap-2 text-center">
              <div 
                className="bg-[#0d0d1a]/60 border border-[#1e1e38] p-3 rounded-xl cursor-pointer hover:border-emerald-600 transition"
                onClick={() => onNavigate('daily')}
              >
                <p className="text-xl font-extrabold text-emerald-450 text-emerald-400 font-display">{dailyProgress.pct}%</p>
                <p className="text-[8.5px] text-slate-500 uppercase tracking-widest font-bold mt-1">score complete</p>
              </div>
              <div className="bg-[#0d0d1a]/60 border border-[#1e1e38] p-3 rounded-xl">
                <p className="text-xl font-extrabold text-indigo-455 text-indigo-450 font-display">{dailyProgress.hrs.toFixed(1)}h</p>
                <p className="text-[8.5px] text-slate-500 uppercase tracking-widest font-bold mt-1">hours logged</p>
              </div>
              <div className="bg-[#0d0d1a]/60 border border-[#1e1e38] p-3 rounded-xl col-span-2 flex items-center justify-between px-3.5">
                <span className="text-[8.5px] text-slate-500 font-bold uppercase tracking-wider font-mono">Tracker items:</span>
                <span className="text-xs font-bold text-slate-200">{dailyProgress.done} of {dailyProgress.total} checks</span>
              </div>
            </div>

            {/* Compiled Tracker Notes */}
            <div className="mt-4 pt-3 border-t border-[#1e1e38]">
              <h4 className="text-[9px] font-black tracking-widest text-[#00d4ff] uppercase font-mono mb-2">Automated Tracker Data</h4>
              <div className="space-y-1.5 max-h-[160px] overflow-y-auto scrollbar-none">
                {Object.entries(state.daily[today] || {}).flatMap(([cat, items]) => 
                  Object.entries(items).map(([itm, data]) => {
                    if (data.notes || data.deepData) {
                      return (
                        <div key={`${cat}-${itm}`} className="bg-[#0d0d1a] px-2 py-1.5 rounded-lg border border-[#2a2a50]">
                          <span className="text-[9px] font-bold text-slate-400 block mb-0.5">{itm}</span>
                          {data.notes && <p className="text-[10px] text-slate-300">"{data.notes}"</p>}
                          {data.deepData && <p className="text-[9px] text-[#ff6b1a] font-mono mt-0.5">&gt; {data.deepData}</p>}
                        </div>
                      );
                    }
                    return null;
                  }).filter(Boolean)
                )}
                {Object.keys(state.daily[today] || {}).length === 0 && (
                  <p className="text-[10px] text-slate-600 font-mono italic">No notes linked from tracker today.</p>
                )}
              </div>
            </div>
          </div>

          {/* Tags Widget */}
          <div className="bg-[#111120] border border-[#2a2a50] rounded-2xl p-5 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 mb-3.5 border-b border-[#1e1e38] pb-3 font-mono">
              <Tag size={14} className="text-indigo-450 text-[#ff6b1a]" />
              Journal Tags
            </h3>

            {/* Selected Tags list */}
            <div className="flex flex-wrap gap-1.5 mb-3.5">
              {(entry.tags || []).length > 0 ? (
                entry.tags.map(t => (
                  <span 
                    key={t}
                    onClick={() => toggleTag(t)}
                    className="flex items-center gap-1.5 px-3 py-1 bg-[#ff6b1a]/10 border border-[#ff6b1a]/20 text-[#ff6b1a] text-[10px] font-bold rounded-lg cursor-pointer hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-450 transition-all uppercase font-mono"
                    title="Click to remove"
                  >
                    {t} ×
                  </span>
                ))
              ) : (
                <span className="text-[9px] text-slate-600 font-mono tracking-wider italic uppercase">// No tags assigned to this entry</span>
              )}
            </div>

            {/* Tag Selection Pool */}
            <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-2 font-mono">// Select to toggle</p>
            <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto pr-1 scrollbar-none">
              {state.journalTags.map(tag => {
                const isSelected = (entry.tags || []).includes(tag);
                if (isSelected) return null; // already in top pool
                return (
                  <div key={tag} className="group flex items-center bg-[#0d0d1a]/80 border border-[#1e1e38] text-slate-400 text-[10px] font-semibold rounded-lg pr-1">
                    <button 
                      onClick={() => toggleTag(tag)}
                      className="px-2.5 py-0.5 hover:text-slate-200 transition text-[10px] uppercase font-bold"
                    >
                      + {tag}
                    </button>
                    <button 
                      onClick={() => handleDeleteTagPool(tag)}
                      className="p-1 text-zinc-700 hover:text-rose-500 transition border-l border-[#2a2a50] cursor-pointer"
                      title="delete tag"
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Create Tag */}
            <form onSubmit={handleCreateTag} className="flex gap-1.5 mt-4 border-t border-[#1e1e38] pt-3.5">
              <input 
                type="text"
                className="flex-1 bg-[#0d0d1a] border border-[#1e1e38] rounded-xl px-3 py-1.5 text-[11px] text-slate-200 placeholder-zinc-650 focus:outline-none focus:border-[#ff6b1a]/50"
                placeholder="New custom tag name..."
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
              />
              <button 
                type="submit"
                className="p-1 px-3 bg-[#ff6b1a] hover:bg-[#ff6b1a] text-white rounded-xl font-bold text-[10px] uppercase tracking-wider cursor-pointer"
              >
                +
              </button>
            </form>
          </div>

          {/* Integrated Reminders Connection list */}
          <div className="bg-[#111120] border border-[#2a2a50] rounded-2xl p-5 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 mb-3.5 border-b border-[#1e1e38] pb-3 font-mono">
              <Bell size={14} className="text-slate-400 text-[#ff6b1a]" />
              Reminders Connected
            </h3>

            {/* Quick Reminder creator inside journal */}
            <form onSubmit={handleCreateReminder} className="bg-[#0d0d1a]/90 border border-[#1e1e38] rounded-xl p-3.5 mb-4 space-y-2">
              <p className="text-[9px] text-[#ff6b1a] font-extrabold uppercase tracking-widest font-mono">// Add task due today</p>
              
              <input 
                type="text"
                className="w-full bg-[#111120] border border-[#2a2a50] rounded-xl px-3 py-1.5 text-xs text-slate-200 placeholder-zinc-600 focus:outline-none focus:border-[#ff6b1a]"
                placeholder="e.g. Turn in report draft"
                value={remTitle}
                onChange={(e) => setRemTitle(e.target.value)}
              />
              
              <div className="flex gap-2 items-center">
                <input 
                  type="time" 
                  className="flex-1 bg-[#111120] border border-[#2a2a50] rounded-xl px-2 py-1.5 text-[11px] text-slate-300 font-mono focus:outline-none focus:border-[#ff6b1a]"
                  value={remTime}
                  onChange={(e) => setRemTime(e.target.value)}
                />
                
                <select 
                  className="bg-[#111120] border border-[#2a2a50] rounded-xl px-2 py-1.5 text-[11px] text-slate-300 focus:outline-none focus:border-[#ff6b1a] cursor-pointer"
                  value={remType}
                  onChange={(e) => setRemType(e.target.value)}
                >
                  <option value="Personal">Personal</option>
                  <option value="Exam Prep">Exam Prep</option>
                  <option value="Meeting">Meeting</option>
                  <option value="Project Deadline">Deadline</option>
                  <option value="Bills">Bills</option>
                </select>

                <button 
                  type="submit"
                  className="px-3 py-1.5 bg-[#ff6b1a] hover:bg-[#ff6b1a] text-white text-[10px] font-bold rounded-xl uppercase transition tracking-wider shrink-0 cursor-pointer"
                >
                  CREATE
                </button>
              </div>
            </form>

            <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1 scrollbar-none">
              {dayReminders.length > 0 ? (
                dayReminders.map(rem => {
                  const isDone = rem.status === 'done';
                  return (
                    <div 
                      key={rem.id}
                      className="flex items-center gap-2.5 bg-[#0d0d1a]/80 p-2.5 rounded-xl border border-[#1e1e38] justify-between font-sans"
                    >
                      <button 
                        onClick={() => onToggleReminder(rem.id)}
                        className={`w-4 h-4 flex items-center justify-center border rounded transition text-black shrink-0 cursor-pointer ${
                          isDone 
                            ? 'bg-emerald-400 border-emerald-400' 
                            : 'border-[#2a2a50] bg-transparent text-transparent'
                        }`}
                      >
                        {isDone && <Check size={11} className="stroke-[4px]" />}
                      </button>

                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-bold truncate ${isDone ? 'line-through text-slate-600 text-slate-500' : 'text-slate-200 text-slate-200'}`}>
                          {rem.title}
                        </p>
                        <p className="text-[9px] text-slate-500 font-bold font-mono mt-0.5">
                          {rem.type} {rem.time && `at ${rem.time}`}
                        </p>
                      </div>

                      <span className={`text-[8px] font-bold px-1.5 rounded uppercase font-mono ${
                        rem.priority === 'high' ? 'bg-rose-500/10 text-rose-400' : 'bg-[#111120] border border-[#1e1e38] text-slate-500'
                      }`}>
                        {rem.priority}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6 border border-dashed border-[#2a2a50] rounded-xl text-[9px] text-slate-600 uppercase tracking-widest font-mono">
                  // No connected reminders for today
                </div>
              )}
            </div>
          </div>
        </div>
        </div>
      ) : (
        <div className="space-y-6 animate-fadeIn pb-10">
          <div className="bg-[#111120] border border-[#2a2a50] rounded-xl flex items-center px-4 py-3 gap-3">
            <Search size={16} className="text-slate-500" />
            <input 
              type="text" 
              placeholder="Search past logs, tags, keywords..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-transparent border-none text-white text-xs font-medium focus:outline-none flex-1 placeholder-slate-600"
            />
          </div>

          <div className="space-y-4">
            {Object.values(state.journals)
              .filter((j: any) => {
                if (!searchQuery) return true;
                const sq = searchQuery.toLowerCase();
                const hasTag = j.tags?.some((t: string) => t.toLowerCase().includes(sq));
                const inPrompt = Object.values(j.sections || {}).some((tx: any) => tx.toLowerCase().includes(sq));
                return hasTag || inPrompt;
              })
              .sort((a: any, b: any) => b.date.localeCompare(a.date))
              .map((j: any) => {
                const stats = dayStats(j.date);
                return (
                  <div key={j.date} className="bg-[#111120] border border-[#2a2a50] rounded-2xl p-4 md:p-6 shadow-sm hover:border-[#383860] transition cursor-pointer" onClick={() => { onSetDate(j.date); setViewState('editor'); }}>
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4 border-b border-[#1e1e38] pb-4">
                      <div>
                        <h3 className="text-xl font-bold font-display text-white">{fmtDate(j.date)}</h3>
                        <div className="flex gap-2 mt-2">
                          {j.tags?.map((t: string) => (
                            <span key={t} className="px-2 py-0.5 bg-[#0d0d1a] border border-[#1e1e38] text-[9px] font-bold uppercase tracking-widest text-[#ff6b1a] rounded font-mono">
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 bg-[#0d0d1a] px-3 py-2 rounded-xl border border-[#1e1e38]">
                        <div className="text-center">
                          <p className="text-[9px] uppercase font-bold text-slate-500 mb-0.5">SCORE</p>
                          <p className="text-sm font-black text-emerald-400 font-display">{stats.pct}%</p>
                        </div>
                        <div className="w-px h-6 bg-[#2a2a50]"></div>
                        <div className="text-center">
                          <p className="text-[9px] uppercase font-bold text-slate-500 mb-0.5">HOURS</p>
                          <p className="text-sm font-black text-indigo-400 font-display">{stats.hrs.toFixed(1)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {Object.entries(j.sections || {}).slice(0, 3).map(([cId, txt]: any) => {
                        const p = (state as any).journalPrompts.find((pr: any) => pr.id === cId);
                        if (!p || !txt.trim()) return null;
                        return (
                          <div key={cId}>
                            <h4 className="text-[9px] font-black uppercase text-slate-400 font-mono tracking-widest mb-1">{p.label}</h4>
                            <p className="text-[11px] text-slate-300 line-clamp-3 leading-relaxed">{txt}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            {Object.keys(state.journals).length === 0 && (
              <div className="p-8 text-center border-2 border-dashed border-[#2a2a50] rounded-2xl">
                <p className="text-slate-500 font-mono uppercase tracking-widest text-xs">No historical journals present.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
