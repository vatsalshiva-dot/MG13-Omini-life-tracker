import React, { useState } from 'react';
import { AppState } from '../types';
import { Bot, CheckCircle2, ClipboardCopy, PieChart, Target, Calendar, CreditCard, Compass, Headphones, Search, Info } from 'lucide-react';
import { StepByStepGuideModal } from './StepByStepGuideModal';
import { useAIQuery } from '../hooks/useLocalAI';
import { AIResponsePanel } from './AIResponsePanel';

interface AiAnalystViewProps {
  state: AppState;
  onOpenAIAnalyst?: (customPrompt?: string | React.MouseEvent) => void;
  onGeneratePrompt?: (module: string) => void;
}

export const AiAnalystView: React.FC<AiAnalystViewProps> = ({ state }) => {
  const [tutorialTarget, setTutorialTarget] = useState<string | null>(null);
  
  // Initialize our new local AI engine
  const ai = useAIQuery(state);

  const modules = [
     { id: 'all', name: 'Complete Brain Scan', desc: 'Holistic cross-analysis of every module', icon: <Bot size={18} />, action: ai.analyze },
     { id: 'habit', name: 'Habit Deep Dive', desc: 'Focus strictly on daily streaks and completion', icon: <Calendar size={18} />, action: () => ai.query('habit') },
     { id: 'goals', name: 'Goals & Targets', desc: 'Am I hitting my targets? Track progress.', icon: <Target size={18} />, action: () => ai.query('goal') },
     { id: 'mood', name: 'Mood & Energy', desc: 'Analyze mood trends and factors.', icon: <Search size={18} />, action: () => ai.query('mood') },
     { id: 'week', name: 'Weekly Summary', desc: 'View 7-day performance.', icon: <PieChart size={18} />, action: ai.week },
     { id: 'motivate', name: 'Motivation Boost', desc: 'Need a push? Get encouraging stats.', icon: <CheckCircle2 size={18} />, action: ai.motivate },
  ];

  const tutorials = [
    { id: 'dashboard', name: 'Dashboard Core', icon: <PieChart size={16} /> },
    { id: 'daily', name: 'Daily Tracker & Logs', icon: <Calendar size={16} /> },
    { id: 'journal', name: 'Interactive Journal & Tags', icon: <Search size={16} /> },
    { id: 'goals', name: 'Goals Settings', icon: <Target size={16} /> },
    { id: 'finances', name: 'Finance Ledger & Inputs', icon: <CreditCard size={16} /> },
    { id: 'expeditions', name: 'Expedition Planning', icon: <Compass size={16} /> },
    { id: 'pomo', name: 'Focus Timer Studio', icon: <Headphones size={16} /> },
    { id: 'reminders', name: 'Alarms & Reminders Engine', icon: <CheckCircle2 size={16} /> },
    { id: 'settings', name: 'System Vault & Sync', icon: <Bot size={16} /> },
  ];

  return (
    <div className="space-y-6 animate-fade-in pl-1">
      <header className="mb-8">
        <h2 className="text-2xl font-black text-white tracking-widest uppercase font-display flex items-center gap-3">
          <Bot className="text-[#00ff88]" size={28} /> AI Analyst Hub
        </h2>
        <p className="text-sm text-slate-400 mt-2 font-medium max-w-2xl">
          Complete intelligence center for your Omnilife Tracker data. Pick a domain to analyze or run a full system check. We run a 100% offline, local AI engine to analyze your progress.
        </p>
      </header>

      {/* RENDER LOCAL AI RESPONSE */}
      {(ai.response || ai.loading || ai.error) && (
        <div className="bg-[#111120] border border-[#00ff88]/40 shadow-[0_0_30px_rgba(0,255,136,0.1)] rounded-2xl p-6 mb-8 mt-4 relative">
          <AIResponsePanel response={ai.response} loading={ai.loading} error={ai.error} className="prose prose-invert max-w-none text-sm text-slate-300" />
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
         {modules.map(m => (
            <button 
               key={m.id}
               onClick={m.action}
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

      <div className="mt-8 border-t border-[#2a2a50] pt-8">
        <h3 className="text-lg font-black text-[#00d4ff] tracking-widest uppercase flex items-center gap-2 mb-4">
          <Info size={20} /> Master Tutorials & Interactive Manuals
        </h3>
        <p className="text-xs text-slate-400 mb-6">Learn exactly how to use every button and function, step-by-step, with comprehensive instruction modals.</p>
        
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {tutorials.map(t => (
            <button 
              key={t.id}
              onClick={() => setTutorialTarget(t.id)}
              className="flex items-center gap-3 p-3 bg-[#111120] hover:bg-[#00d4ff]/10 border border-[#2a2a50] hover:border-[#00d4ff] text-slate-300 hover:text-[#00d4ff] rounded-xl transition text-left"
            >
              <div className="text-inherit opacity-80">{t.icon}</div>
              <span className="text-[10px] font-bold uppercase tracking-wider">{t.name}</span>
            </button>
          ))}
        </div>
      </div>

      {tutorialTarget && (
        <StepByStepGuideModal
          isOpen={true}
          activeView={tutorialTarget}
          onClose={() => setTutorialTarget(null)}
        />
      )}
    </div>
  );
}
