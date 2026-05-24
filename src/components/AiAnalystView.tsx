import React, { useState } from 'react';
import { AppState } from '../types';
import { Bot, CheckCircle2, ClipboardCopy, PieChart, Target, Calendar, CreditCard, Compass, Headphones } from 'lucide-react';

interface AiAnalystViewProps {
  state: AppState;
  onOpenAIAnalyst: (customPrompt?: string | React.MouseEvent) => void;
  onGeneratePrompt: (module: string) => void;
}

export const AiAnalystView: React.FC<AiAnalystViewProps> = ({ state, onOpenAIAnalyst, onGeneratePrompt }) => {
  const [toast, setToast] = useState<string | null>(null);

  const modules = [
     { id: 'all', name: 'Complete Brain Scan (All Data)', desc: 'Holistic cross-analysis of every module', icon: <Bot size={18} /> },
     { id: 'daily', name: 'Habits & Routine', desc: 'Focus strictly on daily streaks and completion', icon: <Calendar size={18} /> },
     { id: 'goals', name: 'Goals & Targets', desc: 'Am I hitting my targets? Track progress.', icon: <Target size={18} /> },
     { id: 'finances', name: 'Finances & Burn Rate', desc: 'Analyze spending against budgets', icon: <CreditCard size={18} /> },
     { id: 'expeditions', name: 'Expeditions', desc: 'Analyze travel plans and packing lists', icon: <Compass size={18} /> },
     { id: 'focus_audio', name: 'Focus Audio Patterns', desc: 'Analyze correlation between audio and productivity', icon: <Headphones size={18} /> },
  ];

  return (
    <div className="space-y-6 animate-fade-in pl-1">
      <header className="mb-8">
        <h2 className="text-2xl font-black text-white tracking-widest uppercase font-display flex items-center gap-3">
          <Bot className="text-[#00ff88]" size={28} /> AI Analyst Hub
        </h2>
        <p className="text-sm text-slate-400 mt-2 font-medium max-w-2xl">
          Complete intelligence center for your Omnilife Tracker data. Pick a domain to analyze or run a full system check. We'll compile an exhaustive blueprint and open the context modal, where you can select your preferred AI.
        </p>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         {modules.map(m => (
            <button 
               key={m.id}
               onClick={() => onGeneratePrompt(m.id)}
               className="bg-[#111120] border border-[#2a2a50] hover:border-[#00ff88]/50 p-5 rounded-2xl flex flex-col items-start text-left transition-all group"
            >
               <div className="w-10 h-10 rounded-xl bg-[#2a2a50] text-[#00ff88] group-hover:bg-[#00ff88] group-hover:text-black transition flex items-center justify-center mb-3 shadow-lg">
                  {m.icon}
               </div>
               <h3 className="font-black text-slate-100 uppercase tracking-wide text-sm mb-1">{m.name}</h3>
               <p className="text-xs text-slate-500 font-medium">{m.desc}</p>
            </button>
         ))}
      </div>

      <div className="mt-12 bg-[#0a0a14] border border-[#2a2a50] rounded-2xl p-6">
         <h4 className="font-extrabold uppercase tracking-widest text-[#00d4ff] text-xs mb-4">How it works</h4>
         <p className="text-sm text-slate-400 mb-4">
           Select a module above. We will bundle your data and open the <strong>AI Context Hub</strong>, where you can instantly copy the prompt and jump into ChatGPT, Claude, Gemini, or Perplexity.
         </p>
         <div className="bg-[#00ff88]/10 text-[#00ff88] p-3 rounded-lg text-xs font-bold border border-[#00ff88]/20 flex items-start gap-2">
            <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
            <p><strong>Note:</strong> The AI tool acts as your customized data analyst. Your data is passed entirely via the manual prompt you paste, keeping your sync encrypted offline first.</p>
         </div>
      </div>
    </div>
  );
}
