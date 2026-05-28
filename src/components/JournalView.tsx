import React, { useState, useEffect, useRef } from 'react';
import { AppState, TrackerCategory, JournalEntry, Reminder, JournalPrompt } from '../types';
import { fmtShort, fmtDate, todayStr } from '../utils/date';
import { CATS } from '../utils/storage';
import { 
  Plus, Trash2, Edit3, Settings, Bell, Calendar, CheckSquare, 
  Smile, Zap, Award, ThumbsUp, Tag, PlusCircle, Check, MapPin, Image as ImageIcon, ClipboardCopy, FileImage, Search, Brain, X, Loader, Mic, MicOff, FileText
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
  onApplyAiLogs?: (actions: any[]) => void;
  autoStartVoice?: boolean;
  onClearAutoStartVoice?: () => void;
  autoStartText?: boolean;
  onClearAutoStartText?: () => void;
  onOmniCommand?: (mutations: any) => void;
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
  onNavigate,
  onApplyAiLogs,
  autoStartVoice,
  onClearAutoStartVoice,
  autoStartText,
  onClearAutoStartText,
  onOmniCommand,
}) => {
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [aiPercent, setAiPercent] = useState(0);
  const [aiActionsModal, setAiActionsModal] = useState<{ isOpen: boolean; actions: any[] }>({ isOpen: false, actions: [] });
  const [omniModal, setOmniModal] = useState<{ isOpen: boolean; data: any | null; pendingAudio?: string; pendingTranscript?: string }>({ isOpen: false, data: null });
  const [alertModal, setAlertModal] = useState<{ message: string; title: string } | null>(null);

  const alert = (message: string) => {
    let title = "System Notification";
    if (message.includes("Microphone") || message.includes("Mic")) {
      title = "Microphone Access Required";
    } else if (message.includes("GPS") || message.includes("Geolocation") || message.includes("coordinates")) {
      title = "GPS Geolocation Status";
    } else if (message.includes("Analyst") || message.includes("AI") || message.includes("Omni")) {
      title = "AI Engine Intelligence";
    } else if (message.includes("empty") || message.includes("write") || message.includes("speak")) {
      title = "Journal Field Entry Required";
    }
    setAlertModal({ message, title });
  };


  const today = date;
  const entry: JournalEntry = state.journals[today] || {
    date: today,
    mood: 0,
    energy: 0,
    tags: [],
    sections: {},
    savedAt: ''
  };

  const handleAiAutoLog = async () => {
    const completeText = state.journalPrompts
      .map(p => {
         const val = entry.sections[p.id]?.trim();
         return val ? `${p.label}:\n${val}` : "";
      })
      .filter(Boolean)
      .join("\n\n");

    if (!completeText.trim()) {
      alert("Journal is empty. Write something first.");
      return;
    }

    setIsAiAnalyzing(true);
    setAiPercent(10);
    const interval = setInterval(() => {
        setAiPercent(p => Math.min(p + Math.floor(Math.random() * 20), 96));
    }, 500);
    
    try {
      const response = await fetch('/api/analyze-journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: completeText,
          localTime: new Date().toISOString()
        })
      });

      if (!response.ok) {
         const errData = await response.json().catch(() => null);
         throw new Error(errData?.error || 'Failed to analyze journal.');
      }
      
      const data = await response.json();
      
      if (!data.actions || data.actions.length === 0) {
        alert("No clear actions detected to log.");
        clearInterval(interval);
        setIsAiAnalyzing(false);
        return;
      }
      
      clearInterval(interval);
      setAiPercent(100);
      setTimeout(() => {
          setIsAiAnalyzing(false);
          setAiActionsModal({ isOpen: true, actions: data.actions || [] });
      }, 400);
    } catch (e: any) {
      clearInterval(interval);
      setIsAiAnalyzing(false);
      alert("Error reaching AI Analyst: " + e.message);
    }
  };

  const dailyProgress = dayStats(today);

  // Layout editor state
  const [showLayoutEditor, setShowLayoutEditor] = useState(false);
  const [newPromptLabel, setNewPromptLabel] = useState('');
  const [newPromptPlaceholder, setNewPromptPlaceholder] = useState('');

  const isTomorrow = date === (() => { const d = new Date(); d.setDate(d.getDate() + 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })();

  // Custom tags state
  const [newTagInput, setNewTagInput] = useState('');
  
  const [viewState, setViewState] = useState<'editor' | 'timeline'>('editor');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSketch, setShowSketch] = useState(false);
  const [showLocMenu, setShowLocMenu] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Combined OmniLife Voice & Text States
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [isManualEditing, setIsManualEditing] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [accumulatedTranscript, setAccumulatedTranscript] = useState('');
  const accumulatedTranscriptRef = useRef('');
  useEffect(() => { accumulatedTranscriptRef.current = accumulatedTranscript; }, [accumulatedTranscript]);
  
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const userStoppedRecordingRef = useRef(false);

  useEffect(() => {
     if (autoStartVoice) {
        setAccumulatedTranscript('');
        if (!isVoiceRecording) {
            toggleVoiceRecording();
        }
        // Multi-stage robust scroll-into-view to bypass asynchronous rendering frames
        const handleScroll = () => {
           const consoleEl = document.getElementById("omnilife-console");
           if (consoleEl) {
              consoleEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
           }
        };
        setTimeout(handleScroll, 50);
        setTimeout(handleScroll, 150);
        setTimeout(handleScroll, 300);
        setTimeout(handleScroll, 500);

        if (onClearAutoStartVoice) onClearAutoStartVoice();
     }
  }, [autoStartVoice]);

  useEffect(() => {
     if (autoStartText) {
        setAccumulatedTranscript('');
        const handleFocusAndScroll = () => {
           const textConsole = document.getElementById("omnilife-textarea");
           if (textConsole) {
              textConsole.focus();
              textConsole.scrollIntoView({ behavior: 'smooth', block: 'center' });
           }
        };
        setTimeout(handleFocusAndScroll, 50);
        setTimeout(handleFocusAndScroll, 150);
        setTimeout(handleFocusAndScroll, 300);
        setTimeout(handleFocusAndScroll, 500);

        if (onClearAutoStartText) onClearAutoStartText();
     }
  }, [autoStartText]);

  const stopVoiceAndTracks = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch(e){}
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try { mediaRecorderRef.current.stop(); } catch(e){}
    }
    if (mediaStreamRef.current) {
      try {
        mediaStreamRef.current.getTracks().forEach(track => {
          track.stop();
          track.enabled = false;
        });
      } catch(e){}
      mediaStreamRef.current = null;
    }
    setIsVoiceRecording(false);
  };

  const toggleVoiceRecording = async () => {
    if (isVoiceRecording) {
      userStoppedRecordingRef.current = true;
      stopVoiceAndTracks();
      return;
    }

    userStoppedRecordingRef.current = false;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice recognition is not supported in this browser. Please use Chrome/Edge.");
      return;
    }

    // Try starting MediaRecorder/getUserMedia for ambient preview fallback.
    // In iframes or restricted environments, getUserMedia can fail even if SpeechRecognition is allowed.
    // Hence, this check is entirely non-blocking!
    try {
       if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          mediaStreamRef.current = stream;
          const mediaRecorder = new MediaRecorder(stream);
          audioChunksRef.current = [];
          mediaRecorder.ondataavailable = (e) => {
             if (e.data.size > 0) audioChunksRef.current.push(e.data);
          };
          mediaRecorderRef.current = mediaRecorder;
          mediaRecorder.start();
       }
    } catch (e: any) {
       console.warn("Optional MediaRecorder microphone stream failed, falling back to Web Speech API:", e);
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    


    


    recognition.onstart = () => {
       setIsVoiceRecording(true);
       setIsManualEditing(false);
    };

    recognition.onresult = (event: any) => {
       const latestTranscript = accumulatedTranscriptRef.current;
       let localTranscript = latestTranscript ? latestTranscript + ' ' : '';
       let finalTranscript = '';
       let interimTranscript = '';
       for (let i = event.resultIndex; i < event.results.length; ++i) {
         if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + ' ';
         } else {
            interimTranscript += event.results[i][0].transcript;
         }
       }
       if (finalTranscript) {
          localTranscript += finalTranscript;
       }
       setAccumulatedTranscript(localTranscript + interimTranscript);
    };

    recognition.onend = () => {
        if (!userStoppedRecordingRef.current) {
           setTimeout(() => {
              if (!userStoppedRecordingRef.current) recognition.start();
           }, 1000);
        } else {
           stopVoiceAndTracks();
        }
     };

    recognition.onerror = (event: any) => {
        if (event.error !== 'aborted') {
           console.error("Speech recognition error:", event.error);
        }
        if (event.error === 'not-allowed') {
           alert("🎤 Microphone Access Blocked:\n\nPlease make sure to grant microphone permissions in your browser. \n\n💡 Tip: Try clicking 'Open in a new tab' at the top-right of your workspace so the app runs natively outside the preview iframe where permissions are easier to authorize!");
           userStoppedRecordingRef.current = true;
           stopVoiceAndTracks();
        }
     };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const saveAudioAsBase64 = async (blob: Blob): Promise<string> => {
     return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
     });
  };

  const handleExecuteOmniCommand = async () => {
     if (isVoiceRecording) {
        stopVoiceAndTracks();
     }

     const finalText = accumulatedTranscript.trim();
     if (!finalText) {
        alert("Please speak or type commands first!");
        return;
     }

     setIsProcessingVoice(true);
     try {
        let b64Audio = "";
        
        // Wait a brief context frame for any trailing audio bytes
        await new Promise(resolve => setTimeout(resolve, 310));
        
        if (audioChunksRef.current.length > 0) {
           const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
           b64Audio = await saveAudioAsBase64(audioBlob);
        }



        const res = await fetch('/api/omni-command', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({
              text: finalText,
              today: date,
              stateContext: {
                  categories: state.categories,
                  goals: state.financeGoals?.map(g => g.title) || [],
                  projects: state.projects?.map(p => p.title) || [],
                  items: state.items || {},
                  journalPrompts: state.journalPrompts || []
              }
           })
        });
        
        if (!res.ok) throw new Error("Unified Omni Engine failed mapping actions");
        
        const data = await res.json();
        
        setOmniModal({ 
           isOpen: true, 
           data,
           pendingAudio: b64Audio || undefined,
           pendingTranscript: finalText
        });

        setAccumulatedTranscript('');
        
        
     } catch(e: any) {
         console.error(e);
         alert(`Omni Engine failed: ${e.message}`);
     } finally {
         setIsProcessingVoice(false);
     }
  };

  const handleAiAutoLogForced = async (overrideSections: any, overridePrompts: any) => {
    const completeText = overridePrompts
      .map((p: any) => {
         const val = overrideSections[p.id]?.trim();
         return val ? `${p.label}:\n${val}` : "";
      })
      .filter(Boolean)
      .join("\n\n");

    if (!completeText.trim()) return;

    setIsAiAnalyzing(true);
    setAiPercent(10);
    const interval = setInterval(() => {
        setAiPercent(p => Math.min(p + Math.floor(Math.random() * 20), 96));
    }, 500);
    
    try {
      const response = await fetch('/api/analyze-journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: completeText,
          localTime: new Date().toISOString()
        })
      });

      if (!response.ok) throw new Error('Failed to analyze journal.');
      const data = await response.json();
      
      if (!data.actions || data.actions.length === 0) {
        clearInterval(interval);
        setIsAiAnalyzing(false);
        return;
      }
      
      clearInterval(interval);
      setAiPercent(100);
      setTimeout(() => {
          setIsAiAnalyzing(false);
          setAiActionsModal({ isOpen: true, actions: data.actions || [] });
      }, 400);
    } catch (e: any) {
      clearInterval(interval);
      setIsAiAnalyzing(false);
      alert("Error reaching AI Analyst: " + e.message);
    }
  };

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

      <div className="mb-6 w-full animate-fadeIn">
         <div className="relative p-4 rounded-xl bg-gradient-to-br from-purple-900/40 to-indigo-900/40 border border-purple-500/30 overflow-hidden shadow-[0_0_20px_rgba(168,85,247,0.15)] flex gap-4 items-start">
             <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
             <div className="p-2 bg-purple-500/20 text-purple-400 rounded-lg shrink-0 backdrop-blur-sm shadow-[0_0_15px_rgba(168,85,247,0.4)]">
                <Mic size={20} className="animate-pulse" />
             </div>
             <div>
                 <h2 className="text-sm font-black uppercase text-[#00d4ff] flex items-center gap-2 font-mono">
                    <Zap size={14} className="text-purple-400" />
                    OmniLife Context Engine 
                 </h2>
                 <p className="text-xs text-slate-300 mt-1 font-semibold leading-relaxed">
                   Introducing the <strong className="text-purple-300">Continuous Voice & Auto-Log</strong> interface! Hit the "Voice Auto-Log" option in your sidebar or click the mic button below. We'll listen continuously while you speak informally. The Omni AI will automatically mark tasks as done, log finances, create reminders, adjust settings, and append to your journal dynamically!
                 </p>
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

          {/* Combined Voice, Text & Assets OmniLife Console (Inline) */}
          <div id="omnilife-console" className="bg-[#111120] border border-[#ff00a0]/30 rounded-2xl p-5 shadow-[0_0_20px_rgba(255,0,160,0.08)] space-y-4 flex flex-col animate-fadeIn relative z-20 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#ff00a0]/3 blur-3xl pointer-events-none" />
            
            <div className="flex items-center justify-between border-b border-[#201030] pb-2">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isVoiceRecording ? 'bg-rose-500' : 'bg-[#00d4ff]'}`}></span>
                  <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isVoiceRecording ? 'bg-rose-600' : 'bg-[#00d4ff]'}`}></span>
                </span>
                <h3 className="text-xs font-black uppercase tracking-widest text-[#00d4ff] font-mono flex items-center gap-1.5">
                  <Zap size={13} className="text-[#00d4ff]" />
                  OmniLife Auto-Log Console
                </h3>
              </div>
              <div className="text-[10px] uppercase font-mono tracking-widest text-[#ff00a0]/70 font-bold">
                Unified Voice & Text
              </div>
            </div>

            {/* Input Textarea for Voice & Keyboard */}
            <div className="relative">
              <textarea
                id="omnilife-textarea"
                value={accumulatedTranscript}
                onChange={(e) => setAccumulatedTranscript(e.target.value)}
                placeholder={
                  isVoiceRecording 
                    ? "🎤 Listening closely... Speak your daily logs or edit them here..." 
                    : "Type or speak your logs... (e.g. 'spent $25 on dinner, completed chest workout, add Win: did great')"
                }
                className={`w-full min-h-[140px] bg-[#070710] border rounded-xl p-4 text-xs text-slate-200 focus:outline-none transition-all duration-150 ${
                  isVoiceRecording 
                    ? 'border-[#ff00a0]/50 shadow-[0_0_15px_rgba(255,0,160,0.08)] bg-rose-950/5' 
                    : 'border-[#1e1e38] focus:border-[#00d4ff]/40 focus:bg-[#090915]'
                } font-mono leading-relaxed placeholder-slate-600`}
              />
              
              {isVoiceRecording && (
                <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-0.5 bg-rose-500/15 border border-rose-500/30 rounded-full animate-pulse text-[9px] font-mono text-rose-400 uppercase tracking-widest font-black">
                   <span className="w-1 h-1 rounded-full bg-rose-500 animate-ping" />
                   Live Mic Active
                </div>
              )}
            </div>

            {/* Actions for Auto-Log Console */}
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={toggleVoiceRecording}
                disabled={isProcessingVoice}
                className={`flex-1 flex justify-center items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer transition disabled:opacity-50 ${
                  isVoiceRecording 
                    ? 'bg-rose-500/20 text-rose-500 border border-rose-500/40 animate-pulse' 
                    : 'bg-[#ff00a0]/10 text-[#ff00a0] border border-[#ff00a0]/30 hover:bg-[#ff00a0]/20'
                }`}
              >
                {isProcessingVoice ? <Loader size={12} className="animate-spin" /> : isVoiceRecording ? <MicOff size={12} /> : <Mic size={12} />}
                {isProcessingVoice ? 'Processing...' : isVoiceRecording ? 'Stop Transcribing' : 'Use Voice (Mic)'}
              </button>

              <button
                onClick={handleExecuteOmniCommand}
                disabled={isProcessingVoice || !accumulatedTranscript.trim()}
                className="flex-1 bg-[#00d4ff]/10 hover:bg-[#00d4ff]/20 text-[#00d4ff] border border-[#00d4ff]/30 hover:border-[#00d4ff]/60 px-4 py-2.5 rounded-xl text-[10px] font-black tracking-widest uppercase transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,212,255,0.05)] hover:shadow-[0_0_25px_rgba(0,212,255,0.2)] cursor-pointer"
              >
                {isProcessingVoice ? <Loader size={12} className="animate-spin" /> : <Brain size={12} />}
                {isProcessingVoice ? 'Processing...' : 'Execute Auto-Log'}
              </button>
            </div>



            {/* Micro-Tips */}
            <div className="p-3 bg-slate-900/40 border border-[#2a2a50]/30 rounded-xl text-[10px] font-mono text-slate-400 leading-relaxed space-y-1">
               <div className="text-slate-300 font-extrabold flex items-center gap-1 text-[11px]">
                  <Brain size={12} className="text-[#00d4ff]" />
                  COMBINED AUDIO + KEYBOARD AUTO-LOG CAPABILITIES:
               </div>
               <div>
                  • <strong className="text-[#ff00a0]">Voice Capture:</strong> Speaking records a local audio clip connected directly to today's journal!
               </div>
               <div>
                  • <strong className="text-emerald-400">Habit Mapping:</strong> e.g., <em className="text-slate-300">"marked workout as done with 15 reps"</em> completes trackers.
               </div>
               <div>
                  • <strong className="text-amber-400">Finance Logging:</strong> e.g., <em className="text-slate-300">"spent $15.50 on delicious lunch"</em> logs expenses instantly.
               </div>
               <div>
                  • <strong className="text-[#00d4ff]">Diary Entries:</strong> Automatically parses text and logs reflections under custom headings.
               </div>
            </div>

            {/* Other Media & Action Assets (Image Upload, GPS, Sketch Canvas, Auto-Log Text) */}
            <div className="border-t border-[#1e1e38] pt-3 flex flex-wrap gap-2 items-center">
              <label className="flex items-center gap-1.5 px-3 py-1.5 bg-[#00d4ff]/10 text-[#00d4ff] border border-[#00d4ff]/20 rounded-lg text-[9px] font-bold uppercase tracking-wider cursor-pointer hover:bg-[#00d4ff]/20 transition select-none">
                <ImageIcon size={11} />
                Attach Image
                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
              </label>
              
              <div className="relative">
                <button 
                  onClick={() => setShowLocMenu(!showLocMenu)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#aa44ff]/10 text-[#aa44ff] border border-[#aa44ff]/20 rounded-lg text-[9px] font-bold uppercase tracking-wider cursor-pointer hover:bg-[#aa44ff]/20 transition"
                >
                  <MapPin size={11} />
                  GPS Location
                </button>
                {showLocMenu && (
                  <div className="absolute bottom-full left-0 mb-2 bg-[#111120] border border-[#2a2a50] rounded-xl p-2 flex flex-col gap-1 w-48 z-50 shadow-2xl animate-fadeIn">
                    <button onClick={() => { handleCaptureGPS(); setShowLocMenu(false); }} className="text-left px-2 py-1.5 text-[9px] font-bold uppercase tracking-widest hover:bg-[#1a1a30] text-[#00ff88] rounded-lg transition">Current (Locate)</button>
                    <a href="https://maps.google.com" target="_blank" rel="noreferrer" onClick={() => setShowLocMenu(false)} className="text-left px-2 py-1.5 text-[9px] font-bold uppercase tracking-widest hover:bg-[#1a1a30] text-[#00d4ff] rounded-lg transition block">Google Maps</a>
                    <a href="https://maps.apple.com" target="_blank" rel="noreferrer" onClick={() => setShowLocMenu(false)} className="text-left px-2 py-1.5 text-[9px] font-bold uppercase tracking-widest hover:bg-[#1a1a30] text-[#ffaa44] rounded-lg transition block">Apple Maps</a>
                  </div>
                )}
              </div>

              <button 
                onClick={() => setShowSketch(!showSketch)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider cursor-pointer transition ${showSketch ? 'bg-amber-500 text-[#0d0d1a] font-extrabold' : 'bg-[#ffaa44]/10 text-[#ffaa44] border border-[#ffaa44]/20 hover:bg-[#ffaa44]/20'}`}
              >
                <Edit3 size={11} />
                {showSketch ? 'Hide Sketch' : 'Sketch Canvas'}
              </button>

              <button
                onClick={handleAiAutoLog}
                disabled={isAiAnalyzing || isProcessingVoice}
                className="relative flex items-center gap-1.5 px-3 py-1.5 bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20 rounded-lg text-[9px] font-bold uppercase tracking-wider cursor-pointer hover:bg-[#00ff88]/20 transition disabled:opacity-50 overflow-hidden shadow-sm"
                title="Extract trackers and finances automatically from written Reflection/Journal entries"
              >
                {isAiAnalyzing && (
                  <div className="absolute inset-0 bg-[#00ff88]/20 transition-all duration-300" style={{ width: `${aiPercent}%` }} />
                )}
                <span className="relative z-10 flex items-center gap-1">
                   {isAiAnalyzing ? <Loader size={11} className="animate-spin" /> : <Brain size={11} />}
                   {isAiAnalyzing ? `Analyzing... ${aiPercent}%` : "Auto-Log Reflection Texts"}
                </span>
              </button>
            </div>
          </div>

          {/* Saved Audio Recording right below OmniLife Auto-Log Console */}
          {(entry as any).audioLog && (
            <div className="bg-[#111120] border border-[#ff00a0]/30 rounded-2xl p-4 shadow-[0_0_15px_rgba(255,0,160,0.05)] space-y-3 animate-fadeIn relative z-20">
              <div className="flex items-center gap-2 border-b border-[#201030] pb-2">
                <Mic size={14} className="text-[#ff00a0]" />
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-300 font-mono">
                  Saved Voice Auto-Log Audio Track
                </h3>
              </div>
              <div className="bg-[#070710] p-2 rounded-xl border border-[#1e1e38]">
                <audio 
                  controls 
                  src={(entry as any).audioLog} 
                  className="w-full h-9 rounded-lg opacity-90" 
                />
              </div>
              <p className="text-[9px] font-mono text-slate-500 leading-relaxed">
                // this custom recording is linked to today's active journal log for audio playback and reference
              </p>
            </div>
          )}

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
                      placeholder={isTomorrow ? p.placeholder.replace(/\btoday\b/gi, match => match === 'Today' ? 'Tomorrow' : 'tomorrow') : p.placeholder}
                      value={textVal}
                      onChange={(e) => handleSectionChange(p.id, e.target.value)}
                    />
                  </div>
                );
              })}
            </div>


            {/* Media & Sketch Canvas */}
            <div className="pt-4 mt-6 border-t border-[#1a1a2e] space-y-4">
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
                <span className="text-[9px] text-slate-600 font-mono tracking-wider italic uppercase">// Contextual tags await processing</span>
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
                dayReminders.map((rem, index) => {
                  const isDone = rem.status === 'done';
                  return (
                    <div 
                      key={`${rem.id}-${index}`}
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
              .sort((a: any, b: any) => (b.date || "").localeCompare(a.date || ""))
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

      {/* AI AUTO LOG MODAL */}
      {aiActionsModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#111120] border border-[#2a2a50] rounded-2xl p-6 w-full max-w-xl shadow-2xl relative my-8">
            <button 
              onClick={() => setAiActionsModal({ isOpen: false, actions: [] })}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            >
              <X size={16} />
            </button>
            <div className="mb-4">
              <h2 className="text-xl font-black text-white font-display mb-1 flex items-center gap-2">
                <Brain size={22} className="text-[#00ff88] animate-pulse" />
                AI COGNITIVE AUTO-LOG
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Review and customize extracted data points before writing them system-wide into the dashboard and calendar databases:
              </p>
            </div>
            
            <div className="max-h-[420px] overflow-y-auto space-y-3 mb-6 pr-1 scrollbar-none">
              {aiActionsModal.actions.map((act, i) => {
                const isReminder = act.module === "reminders";
                const isFinance = act.module === "finances";
                const isTracker = act.module === "tracker";
                const isGoal = act.module === "goals";
                const isExpedition = act.module === "expeditions";

                return (
                  <div key={i} className="p-4 bg-[#0d0d1a] border border-[#1e1e38] rounded-xl relative space-y-3">
                    {/* Delete handler */}
                    <button
                      type="button"
                      onClick={() => {
                        const updated = aiActionsModal.actions.filter((_, idx) => idx !== i);
                        setAiActionsModal({ ...aiActionsModal, actions: updated });
                      }}
                      className="absolute top-3 right-3 text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-slate-800/40 transition"
                      title="Discard extraction"
                    >
                      <Trash2 size={13} />
                    </button>

                    {/* Badge */}
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className={`text-[8.5px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                        isReminder ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" :
                        isFinance ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                        isTracker ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" :
                        isExpedition ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                        "bg-[#ff00a0]/10 text-[#ff00a0] border border-[#ff00a0]/20"
                      }`}>
                        // {act.module.toUpperCase()}
                      </span>
                    </div>

                    {/* Inline Form Grid */}
                    <div className="grid grid-cols-1 gap-2.5">
                      {/* Name / Title */}
                      <div className="flex flex-col gap-0.5">
                        <label className="text-[9px] font-mono text-slate-500 font-bold uppercase tracking-wider">Concept / Title</label>
                        <input
                          type="text"
                          value={act.title || act.concept || act.itemTitle || ""}
                          onChange={(e) => {
                            const updated = [...aiActionsModal.actions];
                            if (isReminder) updated[i].title = e.target.value;
                            else if (isFinance) updated[i].concept = e.target.value;
                            else if (isTracker) updated[i].itemTitle = e.target.value;
                            else if (isGoal) updated[i].title = e.target.value;
                            else if (isExpedition) updated[i].title = e.target.value;
                            setAiActionsModal({ ...aiActionsModal, actions: updated });
                          }}
                          className="bg-[#070710] border border-[#1e1e38] rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-[#00ff88]/40 focus:outline-none font-mono"
                        />
                      </div>

                      {/* Reminder Module fields */}
                      {isReminder && (
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex flex-col gap-0.5">
                            <label className="text-[9px] font-mono text-slate-500 font-bold uppercase tracking-wider">Target Date</label>
                            <input
                              type="date"
                              value={act.date || ""}
                              onChange={(e) => {
                                const updated = [...aiActionsModal.actions];
                                updated[i].date = e.target.value;
                                setAiActionsModal({ ...aiActionsModal, actions: updated });
                              }}
                              className="bg-[#070710] border border-[#1e1e38] rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-[#00ff88]/40 focus:outline-none font-mono"
                            />
                          </div>

                          <div className="flex flex-col gap-0.5">
                            <label className="text-[9px] font-mono text-slate-500 font-bold uppercase tracking-wider">Notify Time</label>
                            <input
                              type="text"
                              placeholder="e.g. 12:00"
                              value={act.time || ""}
                              onChange={(e) => {
                                const updated = [...aiActionsModal.actions];
                                updated[i].time = e.target.value;
                                setAiActionsModal({ ...aiActionsModal, actions: updated });
                              }}
                              className="bg-[#070710] border border-[#1e1e38] rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-[#00ff88]/40 focus:outline-none font-mono"
                            />
                          </div>

                          <div className="flex flex-col gap-0.5 col-span-2">
                            <label className="text-[9px] font-mono text-slate-500 font-bold uppercase tracking-wider">Location / Place</label>
                            <input
                              type="text"
                              value={act.location || ""}
                              placeholder="Add address or location key"
                              onChange={(e) => {
                                const updated = [...aiActionsModal.actions];
                                updated[i].location = e.target.value;
                                setAiActionsModal({ ...aiActionsModal, actions: updated });
                              }}
                              className="bg-[#070710] border border-[#1e1e38] rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-[#00ff88]/40 focus:outline-none font-mono"
                            />
                          </div>

                          <div className="flex flex-col gap-0.5 col-span-2">
                            <label className="text-[9px] font-mono text-slate-500 font-bold uppercase tracking-wider">Notes Description</label>
                            <textarea
                              value={act.description || ""}
                              placeholder="Extra guidelines..."
                              onChange={(e) => {
                                const updated = [...aiActionsModal.actions];
                                updated[i].description = e.target.value;
                                setAiActionsModal({ ...aiActionsModal, actions: updated });
                              }}
                              className="bg-[#070710] border border-[#1e1e38] rounded-lg px-2.5 py-1 text-xs text-white h-12 focus:border-[#00ff88]/40 focus:outline-none font-mono"
                            />
                          </div>

                          {/* Quick Alert option toggle required by user */}
                          <div className="col-span-2 pt-1 flex items-center justify-between">
                            <span className="text-[10px] text-slate-400 font-mono">Set Alert Alarm Sound?</span>
                            <button
                              type="button"
                              onClick={() => {
                                const updated = [...aiActionsModal.actions];
                                updated[i].enableAlert = act.enableAlert !== false ? false : true;
                                setAiActionsModal({ ...aiActionsModal, actions: updated });
                              }}
                              className={`px-3 py-1 text-[10px] font-mono font-bold rounded-lg border uppercase transition flex items-center gap-1.5 ${
                                act.enableAlert !== false
                                  ? "bg-[#00ff88]/10 border-[#00ff88]/50 text-[#00ff88]"
                                  : "bg-slate-800/40 border-slate-700 text-slate-400"
                              }`}
                            >
                              <Bell size={12} className={act.enableAlert !== false ? "animate-bounce" : ""} />
                              {act.enableAlert !== false ? "🔔 Alarm Active" : "🔕 Alarm Inactive"}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Finance Module fields */}
                      {isFinance && (
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex flex-col gap-0.5">
                            <label className="text-[9px] font-mono text-slate-500 font-bold uppercase tracking-wider">Amount ($)</label>
                            <input
                              type="number"
                              step="any"
                              value={act.amount || ""}
                              onChange={(e) => {
                                const updated = [...aiActionsModal.actions];
                                updated[i].amount = e.target.value;
                                setAiActionsModal({ ...aiActionsModal, actions: updated });
                              }}
                              className="bg-[#070710] border border-[#1e1e38] rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-[#00ff88]/40 focus:outline-none font-mono"
                            />
                          </div>

                          <div className="flex flex-col gap-0.5">
                            <label className="text-[9px] font-mono text-slate-500 font-bold uppercase tracking-wider">Type</label>
                            <select
                              value={act.type || "expense"}
                              onChange={(e) => {
                                const updated = [...aiActionsModal.actions];
                                updated[i].type = e.target.value;
                                setAiActionsModal({ ...aiActionsModal, actions: updated });
                              }}
                              className="bg-[#070710] border border-[#1e1e38] rounded-lg px-2 py-1.5 text-xs text-white focus:border-[#00ff88]/40 focus:outline-none font-mono"
                            >
                              <option value="expense">Expense</option>
                              <option value="income">Income</option>
                            </select>
                          </div>

                          <div className="flex flex-col gap-0.5 col-span-2">
                            <label className="text-[9px] font-mono text-slate-500 font-bold uppercase tracking-wider">Category</label>
                            <input
                              type="text"
                              value={act.category || "General"}
                              onChange={(e) => {
                                const updated = [...aiActionsModal.actions];
                                updated[i].category = e.target.value;
                                setAiActionsModal({ ...aiActionsModal, actions: updated });
                              }}
                              className="bg-[#070710] border border-[#1e1e38] rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-[#00ff88]/40 focus:outline-none font-mono"
                            />
                          </div>
                        </div>
                      )}

                      {/* Tracker / Habit fields */}
                      {isTracker && (
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex flex-col gap-0.5">
                            <label className="text-[9px] font-mono text-slate-500 font-bold uppercase tracking-wider">Hours Spent</label>
                            <input
                              type="number"
                              step="any"
                              value={act.hours || 0}
                              onChange={(e) => {
                                const updated = [...aiActionsModal.actions];
                                updated[i].hours = e.target.value;
                                setAiActionsModal({ ...aiActionsModal, actions: updated });
                              }}
                              className="bg-[#070710] border border-[#1e1e38] rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-[#00ff88]/40 focus:outline-none font-mono"
                            />
                          </div>

                          <div className="flex flex-col gap-0.5">
                            <label className="text-[9px] font-mono text-slate-500 font-bold uppercase tracking-wider">Reps</label>
                            <input
                              type="number"
                              value={act.reps || 0}
                              onChange={(e) => {
                                const updated = [...aiActionsModal.actions];
                                updated[i].reps = e.target.value;
                                setAiActionsModal({ ...aiActionsModal, actions: updated });
                              }}
                              className="bg-[#070710] border border-[#1e1e38] rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-[#00ff88]/40 focus:outline-none font-mono"
                            />
                          </div>
                        </div>
                      )}

                      {/* Goal fields */}
                      {isGoal && (
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex flex-col gap-0.5 col-span-2">
                            <label className="text-[9px] font-mono text-slate-500 font-bold uppercase tracking-wider">Target Objective</label>
                            <input
                              type="text"
                              value={act.target || ""}
                              onChange={(e) => {
                                const updated = [...aiActionsModal.actions];
                                updated[i].target = e.target.value;
                                setAiActionsModal({ ...aiActionsModal, actions: updated });
                              }}
                              className="bg-[#070710] border border-[#1e1e38] rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-[#00ff88]/40 focus:outline-none font-mono"
                            />
                          </div>
                        </div>
                      )}

                      {/* Expedition fields */}
                      {isExpedition && (
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex flex-col gap-0.5">
                            <label className="text-[9px] font-mono text-slate-500 font-bold uppercase tracking-wider">Start Date</label>
                            <input
                              type="date"
                              value={act.dateStart || ""}
                              onChange={(e) => {
                                const updated = [...aiActionsModal.actions];
                                updated[i].dateStart = e.target.value;
                                setAiActionsModal({ ...aiActionsModal, actions: updated });
                              }}
                              className="bg-[#070710] border border-[#1e1e38] rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-[#00ff88]/40 focus:outline-none font-mono"
                            />
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <label className="text-[9px] font-mono text-slate-500 font-bold uppercase tracking-wider">End Date</label>
                            <input
                              type="date"
                              value={act.dateEnd || ""}
                              onChange={(e) => {
                                const updated = [...aiActionsModal.actions];
                                updated[i].dateEnd = e.target.value;
                                setAiActionsModal({ ...aiActionsModal, actions: updated });
                              }}
                              className="bg-[#070710] border border-[#1e1e38] rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-[#00ff88]/40 focus:outline-none font-mono"
                            />
                          </div>
                          <div className="flex flex-col gap-0.5 col-span-2">
                            <label className="text-[9px] font-mono text-slate-500 font-bold uppercase tracking-wider">Destination / Location</label>
                            <input
                              type="text"
                              value={act.location || ""}
                              onChange={(e) => {
                                const updated = [...aiActionsModal.actions];
                                updated[i].location = e.target.value;
                                setAiActionsModal({ ...aiActionsModal, actions: updated });
                              }}
                              className="bg-[#070710] border border-[#1e1e38] rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-[#00ff88]/40 focus:outline-none font-mono"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {aiActionsModal.actions.length === 0 && (
                <div className="p-8 text-center text-slate-500 font-mono text-xs border border-dashed border-[#2a2a50] rounded-xl flex flex-col items-center justify-center gap-2">
                   <span>No actions in review deck.</span>
                   <button 
                     onClick={() => setAiActionsModal({ isOpen: false, actions: [] })}
                     className="px-4 py-1.5 bg-[#2a2a50] text-[10px] text-[#00ff88] rounded-lg hover:bg-[#3d3d75] transition"
                   >
                     Close Modal
                   </button>
                </div>
              )}
            </div>

            {aiActionsModal.actions.length > 0 && (
              <button
                onClick={() => {
                  if (onApplyAiLogs) onApplyAiLogs(aiActionsModal.actions);
                  setAiActionsModal({ isOpen: false, actions: [] });
                }}
                className="w-full py-3 bg-[#00ff88] hover:bg-emerald-400 text-[#0d0d1a] font-extrabold tracking-widest text-xs rounded-xl uppercase transition cursor-pointer select-none"
              >
                ✅ INTEGRATE {aiActionsModal.actions.length} ACTIONS SYSTEM-WIDE
              </button>
            )}
          </div>
        </div>
      )}
      {/* OMNI MODAL */}
      {omniModal.isOpen && omniModal.data && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#111120] border border-[#ff00a0]/30 rounded-2xl p-6 w-full max-w-xl shadow-[0_0_50px_rgba(255,0,160,0.1)] relative my-8 animate-fadeIn">
            <button 
              onClick={() => setOmniModal({ isOpen: false, data: null })}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            >
              <X size={16} />
            </button>
            <div className="mb-4">
              <h2 className="text-xl font-black text-white font-display mb-1 flex items-center gap-2">
                <Zap size={22} className="text-[#ff00a0]" />
                OMNILIFE LOG DECK
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Review and customize the {omniModal.data.mutations?.length || 0} system actions interpreted from your voice or text log. Edit or discard any inaccuracies before executing.
              </p>
            </div>
            
            <div className="max-h-[420px] overflow-y-auto space-y-3 mb-6 pr-1 scrollbar-none">
              {(omniModal.data.mutations || []).map((mut: any, i: number) => {
                const isGoal = mut.type === "CREATE_GOAL";
                const isLogTracker = mut.type === "LOG_TRACKER";
                const isEditTracker = mut.type === "EDIT_TRACKER";
                const isSetTrackerGoal = mut.type === "SET_TRACKER_GOAL";
                const isReminder = mut.type === "CREATE_REMINDER";
                const isFinance = mut.type === "LOG_FINANCE";
                const isAppendJournal = mut.type === "APPEND_JOURNAL";
                const isJournalMetrics = mut.type === "UPDATE_JOURNAL_METRICS";

                return (
                  <div key={i} className="p-4 bg-[#0d0d1a] border border-[#1e1e38] rounded-xl relative space-y-2">
                    <button
                      type="button"
                      onClick={() => {
                        const nextMuts = [...omniModal.data.mutations];
                        nextMuts.splice(i, 1);
                        setOmniModal({ ...omniModal, data: { ...omniModal.data, mutations: nextMuts } });
                      }}
                      className="absolute top-3 right-3 text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-slate-800/40 transition"
                      title="Discard action"
                    >
                      <Trash2 size={13} />
                    </button>
                    
                    <div className="flex items-center gap-1.5 mb-2">
                       <span className="bg-[#ff00a0]/10 text-[#ff00a0] border border-[#ff00a0]/30 text-[8.5px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full font-mono">
                         {mut.type.replace(/_/g, ' ')}
                       </span>
                    </div>

                    <div className="text-xs text-slate-300 font-mono space-y-3 pt-2">
                      {/* CREATE_GOAL */}
                      {isGoal && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div className="flex flex-col gap-0.5 col-span-2">
                            <label className="text-[9px] text-slate-500 font-bold uppercase">Goal Title</label>
                            <input
                              type="text"
                              value={mut.payload.title || ''}
                              onChange={(e) => {
                                 const nextMuts = [...omniModal.data.mutations];
                                 nextMuts[i].payload.title = e.target.value;
                                 setOmniModal({ ...omniModal, data: { ...omniModal.data, mutations: nextMuts } });
                              }}
                              className="bg-[#111120] border border-[#1e1e38] rounded p-1.5 text-slate-200 outline-none focus:border-[#ff00a0] w-full"
                            />
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <label className="text-[9px] text-slate-500 font-bold uppercase">Target Amount ($)</label>
                            <input
                              type="number"
                              value={mut.payload.targetAmount || 0}
                              onChange={(e) => {
                                 const nextMuts = [...omniModal.data.mutations];
                                 nextMuts[i].payload.targetAmount = Number(e.target.value);
                                 setOmniModal({ ...omniModal, data: { ...omniModal.data, mutations: nextMuts } });
                              }}
                              className="bg-[#111120] border border-[#1e1e38] rounded p-1.5 text-slate-200 outline-none focus:border-[#ff00a0] w-full"
                            />
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <label className="text-[9px] text-slate-500 font-bold uppercase">Deadline</label>
                            <input
                              type="date"
                              value={mut.payload.deadline || ''}
                              onChange={(e) => {
                                 const nextMuts = [...omniModal.data.mutations];
                                 nextMuts[i].payload.deadline = e.target.value;
                                 setOmniModal({ ...omniModal, data: { ...omniModal.data, mutations: nextMuts } });
                              }}
                              className="bg-[#111120] border border-[#1e1e38] rounded p-1.5 text-slate-200 outline-none focus:border-[#ff00a0] w-full"
                            />
                          </div>
                        </div>
                      )}

                      {/* LOG_TRACKER */}
                      {isLogTracker && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div className="flex flex-col gap-0.5">
                            <label className="text-[9px] text-slate-500 font-bold uppercase">Category</label>
                            <select
                              value={mut.payload.categoryId || ''}
                              onChange={(e) => {
                                 const nextMuts = [...omniModal.data.mutations];
                                 nextMuts[i].payload.categoryId = e.target.value;
                                 setOmniModal({ ...omniModal, data: { ...omniModal.data, mutations: nextMuts } });
                              }}
                              className="bg-[#111120] border border-[#1e1e38] rounded p-1.5 text-slate-200 outline-none focus:border-[#ff00a0] w-full"
                            >
                              <option value="">-- Category --</option>
                              {state.categories?.map((cat: any) => (
                                <option key={cat.id} value={cat.id}>{cat.label}</option>
                              ))}
                            </select>
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <label className="text-[9px] text-slate-500 font-bold uppercase">Item Name</label>
                            <input
                              type="text"
                              value={mut.payload.item || ''}
                              onChange={(e) => {
                                 const nextMuts = [...omniModal.data.mutations];
                                 nextMuts[i].payload.item = e.target.value;
                                 setOmniModal({ ...omniModal, data: { ...omniModal.data, mutations: nextMuts } });
                              }}
                              className="bg-[#111120] border border-[#1e1e38] rounded p-1.5 text-slate-200 outline-none focus:border-[#ff00a0] w-full"
                            />
                          </div>
                          <div className="flex flex-col gap-0.5 col-span-2">
                            <label className="text-[9px] text-slate-500 font-bold uppercase">Status</label>
                            <select
                              value={mut.payload.status || 'done'}
                              onChange={(e) => {
                                 const nextMuts = [...omniModal.data.mutations];
                                 nextMuts[i].payload.status = e.target.value;
                                 setOmniModal({ ...omniModal, data: { ...omniModal.data, mutations: nextMuts } });
                              }}
                              className="bg-[#111120] border border-[#1e1e38] rounded p-1.5 text-slate-200 outline-none focus:border-[#ff00a0] w-full"
                            >
                              <option value="done">Done</option>
                              <option value="missed">Missed</option>
                              <option value="skipped">Skipped</option>
                            </select>
                          </div>
                          <div className="flex flex-col gap-0.5 col-span-2">
                            <label className="text-[9px] text-slate-500 font-bold uppercase">Notes</label>
                            <input
                              type="text"
                              value={mut.payload.notes || ''}
                              onChange={(e) => {
                                 const nextMuts = [...omniModal.data.mutations];
                                 nextMuts[i].payload.notes = e.target.value;
                                 setOmniModal({ ...omniModal, data: { ...omniModal.data, mutations: nextMuts } });
                              }}
                              className="bg-[#111120] border border-[#1e1e38] rounded p-1.5 text-slate-200 outline-none focus:border-[#ff00a0] w-full"
                            />
                          </div>
                        </div>
                      )}

                      {/* EDIT_TRACKER */}
                      {isEditTracker && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div className="flex flex-col gap-0.5 col-span-2">
                            <label className="text-[9px] text-slate-500 font-bold uppercase">Habit Name</label>
                            <input
                              type="text"
                              value={mut.payload.item || ''}
                              onChange={(e) => {
                                 const nextMuts = [...omniModal.data.mutations];
                                 nextMuts[i].payload.item = e.target.value;
                                 setOmniModal({ ...omniModal, data: { ...omniModal.data, mutations: nextMuts } });
                              }}
                              className="bg-[#111120] border border-[#1e1e38] rounded p-1.5 text-slate-200 outline-none focus:border-[#ff00a0] w-full"
                            />
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <label className="text-[9px] text-slate-500 font-bold uppercase">Target Field</label>
                            <select
                              value={mut.payload.targetField || 'reps'}
                              onChange={(e) => {
                                 const nextMuts = [...omniModal.data.mutations];
                                 nextMuts[i].payload.targetField = e.target.value;
                                 setOmniModal({ ...omniModal, data: { ...omniModal.data, mutations: nextMuts } });
                              }}
                              className="bg-[#111120] border border-[#1e1e38] rounded p-1.5 text-slate-200 outline-none focus:border-[#ff00a0] w-full"
                            >
                              <option value="reps">Reps (Count)</option>
                              <option value="hours">Hours (Duration)</option>
                            </select>
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <label className="text-[9px] text-slate-500 font-bold uppercase">Value</label>
                            <input
                              type="number"
                              value={mut.payload.value || 0}
                              onChange={(e) => {
                                 const nextMuts = [...omniModal.data.mutations];
                                 nextMuts[i].payload.value = Number(e.target.value);
                                 setOmniModal({ ...omniModal, data: { ...omniModal.data, mutations: nextMuts } });
                              }}
                              className="bg-[#111120] border border-[#1e1e38] rounded p-1.5 text-slate-200 outline-none focus:border-[#ff00a0] w-full"
                            />
                          </div>
                        </div>
                      )}

                      {/* SET_TRACKER_GOAL */}
                      {isSetTrackerGoal && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div className="flex flex-col gap-0.5 col-span-2">
                            <label className="text-[9px] text-slate-500 font-bold uppercase">Habit Name</label>
                            <input
                              type="text"
                              value={mut.payload.item || ''}
                              onChange={(e) => {
                                 const nextMuts = [...omniModal.data.mutations];
                                 nextMuts[i].payload.item = e.target.value;
                                 setOmniModal({ ...omniModal, data: { ...omniModal.data, mutations: nextMuts } });
                              }}
                              className="bg-[#111120] border border-[#1e1e38] rounded p-1.5 text-slate-200 outline-none focus:border-[#ff00a0] w-full"
                            />
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <label className="text-[9px] text-slate-500 font-bold uppercase">Target Field</label>
                            <select
                              value={mut.payload.targetField || 'reps'}
                              onChange={(e) => {
                                 const nextMuts = [...omniModal.data.mutations];
                                 nextMuts[i].payload.targetField = e.target.value;
                                 setOmniModal({ ...omniModal, data: { ...omniModal.data, mutations: nextMuts } });
                              }}
                              className="bg-[#111120] border border-[#1e1e38] rounded p-1.5 text-slate-200 outline-none focus:border-[#ff00a0] w-full"
                            >
                              <option value="reps">Reps (Count)</option>
                              <option value="hours">Hours (Duration)</option>
                            </select>
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <label className="text-[9px] text-slate-500 font-bold uppercase">Goal Target Value</label>
                            <input
                              type="number"
                              value={mut.payload.value || 0}
                              onChange={(e) => {
                                 const nextMuts = [...omniModal.data.mutations];
                                 nextMuts[i].payload.value = Number(e.target.value);
                                 setOmniModal({ ...omniModal, data: { ...omniModal.data, mutations: nextMuts } });
                              }}
                              className="bg-[#111120] border border-[#1e1e38] rounded p-1.5 text-slate-200 outline-none focus:border-[#ff00a0] w-full"
                            />
                          </div>
                        </div>
                      )}

                      {/* CREATE_REMINDER */}
                      {isReminder && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div className="flex flex-col gap-0.5 col-span-2">
                            <label className="text-[9px] text-slate-500 font-bold uppercase">Reminder Title</label>
                            <input
                              type="text"
                              value={mut.payload.title || ''}
                              onChange={(e) => {
                                 const nextMuts = [...omniModal.data.mutations];
                                 nextMuts[i].payload.title = e.target.value;
                                 setOmniModal({ ...omniModal, data: { ...omniModal.data, mutations: nextMuts } });
                              }}
                              className="bg-[#111120] border border-[#1e1e38] rounded p-1.5 text-slate-200 outline-none focus:border-[#ff00a0] w-full"
                            />
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <label className="text-[9px] text-slate-500 font-bold uppercase">Priority</label>
                            <select
                              value={mut.payload.priority || 'medium'}
                              onChange={(e) => {
                                 const nextMuts = [...omniModal.data.mutations];
                                 nextMuts[i].payload.priority = e.target.value;
                                 setOmniModal({ ...omniModal, data: { ...omniModal.data, mutations: nextMuts } });
                              }}
                              className="bg-[#111120] border border-[#1e1e38] rounded p-1.5 text-slate-200 outline-none focus:border-[#ff00a0] w-full"
                            >
                              <option value="high">🔥 High</option>
                              <option value="medium">⚡ Medium</option>
                              <option value="low">💤 Low</option>
                            </select>
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <label className="text-[9px] text-slate-500 font-bold uppercase">Due Date</label>
                            <input
                              type="date"
                              value={mut.payload.dueDate || ''}
                              onChange={(e) => {
                                 const nextMuts = [...omniModal.data.mutations];
                                 nextMuts[i].payload.dueDate = e.target.value;
                                 setOmniModal({ ...omniModal, data: { ...omniModal.data, mutations: nextMuts } });
                              }}
                              className="bg-[#111120] border border-[#1e1e38] rounded p-1.5 text-slate-200 outline-none focus:border-[#ff00a0] w-full"
                            />
                          </div>
                        </div>
                      )}

                      {/* LOG_FINANCE */}
                      {isFinance && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div className="flex flex-col gap-0.5 col-span-2">
                            <label className="text-[9px] text-slate-500 font-bold uppercase">Concept / Detail</label>
                            <input
                              type="text"
                              value={mut.payload.concept || ''}
                              onChange={(e) => {
                                 const nextMuts = [...omniModal.data.mutations];
                                 nextMuts[i].payload.concept = e.target.value;
                                 setOmniModal({ ...omniModal, data: { ...omniModal.data, mutations: nextMuts } });
                              }}
                              className="bg-[#111120] border border-[#1e1e38] rounded p-1.5 text-slate-200 outline-none focus:border-[#ff00a0] w-full"
                            />
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <label className="text-[9px] text-slate-500 font-bold uppercase">Transaction Type</label>
                            <select
                              value={mut.payload.type || 'expense'}
                              onChange={(e) => {
                                 const nextMuts = [...omniModal.data.mutations];
                                 nextMuts[i].payload.type = e.target.value;
                                 setOmniModal({ ...omniModal, data: { ...omniModal.data, mutations: nextMuts } });
                              }}
                              className="bg-[#111120] border border-[#1e1e38] rounded p-1.5 text-slate-200 outline-none focus:border-[#ff00a0] w-full"
                            >
                              <option value="expense">Expense (Out)</option>
                              <option value="income">Income (In)</option>
                            </select>
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <label className="text-[9px] text-slate-500 font-bold uppercase">Amount ($)</label>
                            <input
                              type="number"
                              value={mut.payload.amount || 0}
                              onChange={(e) => {
                                 const nextMuts = [...omniModal.data.mutations];
                                 nextMuts[i].payload.amount = Number(e.target.value);
                                 setOmniModal({ ...omniModal, data: { ...omniModal.data, mutations: nextMuts } });
                              }}
                              className="bg-[#111120] border border-[#1e1e38] rounded p-1.5 text-slate-200 outline-none focus:border-[#ff00a0] w-full"
                            />
                          </div>
                        </div>
                      )}

                      {/* APPEND_JOURNAL */}
                      {isAppendJournal && (
                        <div className="grid grid-cols-1 gap-2">
                          <div className="flex flex-col gap-0.5">
                            <label className="text-[9px] text-slate-500 font-bold uppercase">Journal Box Heading (Topic)</label>
                            <input
                              type="text"
                              value={mut.payload.topic || ''}
                              onChange={(e) => {
                                 const nextMuts = [...omniModal.data.mutations];
                                 nextMuts[i].payload.topic = e.target.value;
                                 setOmniModal({ ...omniModal, data: { ...omniModal.data, mutations: nextMuts } });
                              }}
                              className="bg-[#111120] border border-[#1e1e38] rounded p-1.5 text-slate-200 outline-none focus:border-[#ff00a0] w-full font-mono text-xs text-[#00d4ff]"
                              placeholder="e.g. Wins & Highlights, Free Notes, Daily Reflection, or custom heading"
                            />
                            <p className="text-[8px] text-slate-500">Your spoken text will be smart recorded under this heading. Customize the label here if desired!</p>
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <label className="text-[9px] text-slate-500 font-bold uppercase">Journal Entry Text</label>
                            <textarea
                              value={mut.payload.text || ''}
                              onChange={(e) => {
                                 const nextMuts = [...omniModal.data.mutations];
                                 nextMuts[i].payload.text = e.target.value;
                                 setOmniModal({ ...omniModal, data: { ...omniModal.data, mutations: nextMuts } });
                              }}
                              className="w-full min-h-[70px] bg-[#111120] border border-[#1e1e38] rounded p-1.5 text-slate-200 outline-none focus:border-[#ff00a0]"
                            />
                          </div>
                        </div>
                      )}

                      {/* UPDATE_JOURNAL_METRICS */}
                      {isJournalMetrics && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div className="flex flex-col gap-0.5">
                            <label className="text-[9px] text-slate-500 font-bold uppercase">Mood Scale (1-5)</label>
                            <input
                              type="number"
                              min="1"
                              max="5"
                              value={mut.payload.mood || 5}
                              onChange={(e) => {
                                 const nextMuts = [...omniModal.data.mutations];
                                 nextMuts[i].payload.mood = Number(e.target.value);
                                 setOmniModal({ ...omniModal, data: { ...omniModal.data, mutations: nextMuts } });
                              }}
                              className="bg-[#111120] border border-[#1e1e38] rounded p-1.5 text-slate-200 outline-none focus:border-[#ff00a0] w-full"
                            />
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <label className="text-[9px] text-slate-500 font-bold uppercase">Energy Scale (1-5)</label>
                            <input
                              type="number"
                              min="1"
                              max="5"
                              value={mut.payload.energy || 5}
                              onChange={(e) => {
                                 const nextMuts = [...omniModal.data.mutations];
                                 nextMuts[i].payload.energy = Number(e.target.value);
                                 setOmniModal({ ...omniModal, data: { ...omniModal.data, mutations: nextMuts } });
                              }}
                              className="bg-[#111120] border border-[#1e1e38] rounded p-1.5 text-slate-200 outline-none focus:border-[#ff00a0] w-full"
                            />
                          </div>
                        </div>
                      )}

                      {/* Fallback for other mutations */}
                      {!isGoal && !isLogTracker && !isEditTracker && !isSetTrackerGoal && !isReminder && !isFinance && !isAppendJournal && !isJournalMetrics && (
                        <div>
                          {Object.keys(mut.payload).map(k => {
                             if (k === 'id') return null;
                             return (
                               <div key={k} className="flex flex-col sm:flex-row sm:gap-2 mb-1.5 border-b border-[#1e1e38]/50 pb-1">
                                 <span className="text-slate-500 w-24 shrink-0 uppercase tracking-wider text-[9px] font-bold py-1">{k}</span>
                                 <input
                                   type="text"
                                   value={typeof mut.payload[k] === 'object' ? JSON.stringify(mut.payload[k]) : mut.payload[k] || ''}
                                   onChange={(e) => {
                                      const nextMuts = [...omniModal.data.mutations];
                                      nextMuts[i].payload[k] = e.target.value;
                                      setOmniModal({ ...omniModal, data: { ...omniModal.data, mutations: nextMuts } });
                                   }}
                                   className="flex-1 bg-transparent border-none focus:outline-none focus:bg-[#111120] text-slate-200 px-1 py-0.5 w-full"
                                 />
                               </div>
                             );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {omniModal.pendingTranscript && (
                <div className="p-4 bg-[#0a2030]/40 border border-[#00d4ff]/30 rounded-xl space-y-2">
                  <div className="flex items-center gap-1.5">
                    <span className="bg-[#00d4ff]/10 text-[#00d4ff] border border-[#00d4ff]/30 text-[8.5px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full font-mono">
                      🎙️ VOICE JOURNAL LOG
                    </span>
                  </div>
                  <div className="text-xs text-slate-300 font-mono space-y-2">
                    <p className="text-[10px] text-slate-400">
                      Audio and transcription text will be recorded under your "Voice Auto-Logs" journal section:
                    </p>
                    <textarea
                      value={omniModal.pendingTranscript}
                      onChange={(e) => {
                        setOmniModal({
                          ...omniModal,
                          pendingTranscript: e.target.value
                        });
                      }}
                      className="w-full min-h-[70px] bg-[#070710] border border-[#1e1e38] rounded-lg p-2 text-[11px] text-slate-200 focus:outline-none focus:border-[#00d4ff]/40 font-mono leading-relaxed"
                    />
                  </div>
                </div>
              )}

              {(!omniModal.data.mutations || omniModal.data.mutations.length === 0) && !omniModal.pendingTranscript && (
                 <div className="p-8 text-center text-slate-500 font-mono text-xs border border-dashed border-[#2a2a50] rounded-xl flex flex-col gap-2 items-center">
                    No executable actions parsed.
                    <button onClick={() => setOmniModal({ isOpen: false, data: null })} className="bg-slate-800 px-3 py-1 rounded text-white mt-2">Close Matrix</button>
                 </div>
              )}
            </div>

            {(omniModal.data.mutations?.length > 0 || omniModal.pendingAudio || omniModal.pendingTranscript) && (
              <button
                onClick={() => {
                  if (onOmniCommand) {
                     onOmniCommand({
                        ...omniModal.data,
                        pendingAudio: omniModal.pendingAudio,
                        pendingTranscript: omniModal.pendingTranscript
                     });
                  }
                  setOmniModal({ isOpen: false, data: null });
                }}
                className="w-full py-3 bg-[#ff00a0] hover:bg-[#ff00a0]/80 text-[#0d0d1a] font-extrabold tracking-widest text-xs rounded-xl uppercase transition cursor-pointer select-none"
              >
                EXECUTE ALL ACTIONS
              </button>
            )}
          </div>
        </div>
      )}

      {/* CUSTOM ALERT MODAL OVERLAY */}
      {alertModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#111120] border border-rose-500/40 rounded-2xl p-6 w-full max-w-md shadow-[0_0_50px_rgba(244,63,94,0.15)] relative">
            <button 
              onClick={() => setAlertModal(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            >
              <X size={16} />
            </button>
            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 text-xl font-bold animate-pulse">
                ⚠️
              </div>
              <h3 className="text-base font-black text-white font-display tracking-wider uppercase">
                {alertModal.title}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed font-mono text-left whitespace-pre-wrap bg-[#080811] p-3.5 rounded-xl border border-[#1e1e38]">
                {alertModal.message}
              </p>
              <div className="pt-2">
                <button
                  onClick={() => setAlertModal(null)}
                  className="w-full py-2.5 bg-rose-600/20 hover:bg-rose-600/35 text-rose-400 border border-rose-500/40 rounded-xl text-xs font-black uppercase tracking-widest transition cursor-pointer"
                >
                  Dismiss Notice
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
