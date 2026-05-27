import React, { useState } from 'react';
import { HelpCircle, Check, BookOpen, Layers, Target, Clock, Zap, Book, Box, Lock, Activity, Database, Navigation } from 'lucide-react';

interface OnboardingModalProps {
  viewId: string;
  onDismiss: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ viewId, onDismiss }) => {
  const [activeTab, setActiveTab] = useState(viewId || 'dashboard');

  React.useEffect(() => {
    if (viewId) {
      setActiveTab(viewId);
    }
  }, [viewId]);

  const contentMap: Record<string, { title: string; icon: React.ReactNode; steps: { title: string; desc: string }[] }> = {
    dashboard: {
      title: 'Global Dashboard & Global Momentum',
      icon: <Activity size={18} />,
      steps: [
        { title: 'The Macro View', desc: 'The Dashboard gives you a 10,000-foot view of your entire operational momentum. It aggregates data from your daily habits, financial burn rate, and focus sessions.' },
        { title: 'Bio-Climate Control Desk', desc: 'A real-time weather and environment tracker. Enter any city name to pull precise atmospheric conditions. Use this to determine if environmental factors correlate with productivity.' },
        { title: 'Visual Theme Customization', desc: 'Click the Palette icon to switch between deep focus themes. Theme choices are logged in your data and can be analyzed by the AI Analyst to see if certain colors improve your output.' },
        { title: 'Streak Counters', desc: 'At the bottom, numeric trackers display your ongoing uninterrupted streaks. A broken streak requires a full reset.' }
      ]
    },
    daily: {
      title: 'Daily Micro-Habit Tracker',
      icon: <Check size={18} />,
      steps: [
        { title: 'Core Functionality', desc: 'This is the engine room. Every predefined habit from your Goals page appears here. You must mark them as DONE, SKIPPED, or MISSED daily.' },
        { title: 'The Status Buttons', desc: 'DONE (Green): Logs the completion. SKIPPED (Yellow): Neutral, used when a habit is resting or intentionally paused. MISSED (Red): Punitive, breaks your streak.' },
        { title: 'Volume Tracking', desc: 'Use the Reps and Hours input fields. If your goal is 100 Pushups, enter 100 in Reps. The AI Analyst will cross-reference this volume against your targets.' },
        { title: 'Evening Debrief', desc: 'At the end of your day, click the Evening Debrief button. This locks the day\'s data, calculates your final Daily Score (0-100%), and prepares the system for tomorrow.' }
      ]
    },
    journal: {
      title: 'Psychological Journaling',
      icon: <BookOpen size={18} />,
      steps: [
        { title: 'Emotional Telemetry', desc: 'Create entries detailing your thoughts. You MUST rate your Mood (1-5) and Energy (1-5). This scalar data is fed directly to the AI Analyst to map emotional states to productivity drops.' },
        { title: 'Tagging System', desc: 'Assign tags (e.g., #stress, #victory, #anxiety). Future AI analysis will correlate these specific tags with your financial spending or focus failures.' },
        { title: 'Media & Location', desc: 'Click the Map icon to snapshot your current GPS coordinates. Click the Image icon to attach visualizations. This creates a spatial and visual map of your mindset over time.' }
      ]
    },
    finances: {
      title: 'Financial Ledger & Auditing',
      icon: <Database size={18} />,
      steps: [
        { title: 'Four Pathways of Entry', desc: '1. Quick Log (fastest overhead). 2. Advanced Log (attach locations, invoice URLs, split peer tabs). 3. Smart Text Paste (copy raw SMS). 4. AI Copier (paste entire bank sheets for AI extraction).' },
        { title: 'Smart Text Paste', desc: 'Simply copy an SMS alert from your bank (e.g., "Spent $45 at Zomato on 5th May") and paste it. The AI backend will instantly extract the name, amount, date, and category.' },
        { title: 'Historical Synchronization', desc: 'Unlike basic apps, when you import a past statement, transactions are retroactively locked to their EXACT real-world occurrence day, preserving your analytical timeline.' },
        { title: 'Category Filters', desc: 'Filter by Income/Expense and categorical tags to audit specific leaks in your budget. The AI Analyst can read this view to give you a 30-day strict budget plan.' }
      ]
    },
    reminders: {
      title: 'Cognitive Load & Reminders',
      icon: <Clock size={18} />,
      steps: [
        { title: 'Setting a Reminder', desc: 'Click "Create Reminder". Input a title, a deep description, and an exact trigger time. Set Priority (High/Normal) and Type (Generic, Alert, Deadline).' },
        { title: 'Recurring Loops', desc: 'Toggle the "Recurring" checkbox. If a recurring alarm triggers, it will ping you, and if you ignore it, it will re-enter the queue and alert you repeatedly until explicitly marked DONE.' },
        { title: 'Snooze vs Complete', desc: 'Marking "Done" resolves the loop safely. "Dismissing" removes the notification but logs the failure. This failure rate is tracked.' },
        { title: 'Budget Warning Signals', desc: 'Inside the finances hub, you can also trigger system-wide Finance Alerts that appear here as hyper-critical red blinking priority alarms.' }
      ]
    },
    pomo: {
      title: 'Deep Work (Pomodoro)',
      icon: <Zap size={18} />,
      steps: [
        { title: 'The Framework', desc: 'Standard 25-minute extreme focus, 5-minute cognitive rest. This forces intense flow states while preventing burnout.' },
        { title: 'Target Locking', desc: 'Before starting, ALWAYS type exactly what you are focusing on in the target field. This binds the time strictly to a concept.' },
        { title: 'Ambient Synthesis', desc: 'Toggle Brownian, Pink, or White noise. Brownian is recommended for ADHD/Deep focus. Pink is for reading. White is for blocking chaotic external environments.' },
        { title: 'Session Logging', desc: 'When the timer hits 0, the session is locked into your permanent database with exact duration and timestamp. If you cancel early, it is discarded.' }
      ]
    },
    goals: {
      title: 'Macro Goals & Directives',
      icon: <Target size={18} />,
      steps: [
        { title: 'Defining the Scope', desc: 'This is where you define your life. Without a goal listed here, it cannot be tracked in the Daily module. Click Add Goal.' },
        { title: 'Metric Targets', desc: 'Set numerical targets (e.g., "100" reps of Pushups). The system will automatically track how many reps you log in the Daily view and calculate your overall completion percentage.' },
        { title: 'Time Horizons', desc: 'Categorize goals intelligently: Daily (Habits), Weekly (Projects), Monthly (Milestones), Yearly (Visions). The AI Analyst checks your daily speed against these macro horizons.' }
      ]
    },
    expeditions: {
      title: 'Command: Expeditions',
      icon: <Navigation size={18} />,
      steps: [
        { title: 'Logistics Deployment', desc: 'Plan physical travel. Set Departure and Return timestamps. Attach the specific location coordinates.' },
        { title: 'Categorization', desc: 'Is this Leisure, Business, or a deep-work Focus Retreat? Tagging it properly helps correlate whether "Leisure" trips cause a massive spike in Financial burn.' },
        { title: 'Master Packing List', desc: 'Inside each expedition, generate a checklist of gear. Missing a charger? The list ensures you never drop logistical components.' }
      ]
    },
  };

  const tabs = Object.keys(contentMap);
  const safeViewId = Object.keys(contentMap).includes(activeTab) ? activeTab : 'dashboard';
  const activeContent = contentMap[safeViewId];

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-[999] animate-fade-in text-left">
      <div className="bg-[#0a0a14] relative border border-[#00d4ff]/40 rounded-2xl max-w-4xl w-full h-[85vh] shadow-[0_0_50px_rgba(0,212,255,0.1)] flex flex-col md:flex-row overflow-hidden">
        
        {/* Sidebar Navigation */}
        <div className="md:w-1/3 border-b md:border-b-0 md:border-r border-[#2a2a50] bg-[#111120] overflow-y-auto scroll-style flex flex-col">
          <div className="p-5 border-b border-[#2a2a50] sticky top-0 bg-[#111120] z-10">
             <h2 className="text-xl font-extrabold text-white tracking-widest uppercase font-display flex items-center gap-2">
                 <Book className="text-[#00d4ff]" /> Master Manual
             </h2>
             <p className="text-[10px] text-slate-400 font-mono mt-1 uppercase tracking-widest">// Deep System Documentation</p>
          </div>
          <div className="flex flex-row md:flex-col p-2 gap-1 overflow-x-auto md:overflow-visible">
             {tabs.map((key) => {
               const mapping = contentMap[key];
               const isActive = activeTab === key || (!contentMap[activeTab] && key === 'dashboard');
               return (
                 <button
                   key={key}
                   onClick={() => setActiveTab(key)}
                   className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all shrink-0 md:shrink border ${isActive ? 'bg-[#00d4ff]/10 border-[#00d4ff]/40 text-[#00d4ff]' : 'bg-transparent border-transparent text-slate-400 hover:bg-[#2a2a50]/50 hover:text-slate-200'}`}
                 >
                    {mapping.icon}
                    <span className="font-extrabold text-[11px] uppercase tracking-widest">{key}</span>
                 </button>
               )
             })}
          </div>
        </div>

        {/* Content Area */}
        <div className="md:w-2/3 flex flex-col bg-[#0d0d1a] h-full">
           <div className="p-6 md:p-10 overflow-y-auto scroll-style flex-1 space-y-8">
              <div className="border-b border-[#2a2a50] pb-4">
                 <h3 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                   {activeContent.icon} {activeContent.title}
                 </h3>
                 <p className="text-xs text-[#00d4ff] font-mono mt-2 uppercase tracking-widest">
                   Module Functionality & AI Connectivity
                 </p>
              </div>

              <div className="space-y-6">
                 {activeContent.steps.map((step, idx) => (
                    <div key={idx} className="bg-[#111120] border border-[#2a2a50] p-5 rounded-xl flex gap-4 items-start hover:border-[#00d4ff]/30 transition-colors">
                       <div className="w-8 h-8 rounded-full bg-[#00d4ff]/10 text-[#00d4ff] flex items-center justify-center font-black shrink-0 border border-[#00d4ff]/30">
                          {idx + 1}
                       </div>
                       <div>
                          <h4 className="font-extrabold text-sm text-slate-200 uppercase tracking-widest mb-1.5">{step.title}</h4>
                          <p className="text-xs leading-relaxed text-slate-400 font-mono">{step.desc}</p>
                       </div>
                    </div>
                 ))}
                 
                 <div className="mt-8 bg-[#00ff88]/5 border border-[#00ff88]/20 p-5 rounded-xl">
                    <h4 className="font-extrabold text-xs text-[#00ff88] uppercase tracking-widest mb-2 flex items-center gap-2">
                      <Zap size={14} /> AI Connection & Data Science
                    </h4>
                    <p className="text-[10px] text-slate-300 leading-relaxed font-mono">
                      Every single action documented above is compiled into the Master JSON Payload. When you open the <strong>AI Analyst Hub (Sidebar)</strong>, the system generates a massive prompt incorporating your physical, emotional, and financial data. You can paste this payload into ChatGPT or Claude to act as your personalized operations manager.
                    </p>
                 </div>
                 
                 <div className="mt-4 p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl relative overflow-hidden shadow-[0_0_20px_rgba(168,85,247,0.15)] ring-1 ring-white/5">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl" />
                   <h2 className="text-sm font-black uppercase tracking-widest text-[#00d4ff] font-mono mb-2 flex items-center gap-2">
                     <strong className="text-purple-400">⭐ MAJOR HIGHLIGHT</strong> (Must Regarded)
                   </h2>
                   <p className="text-[11px] text-slate-300 leading-relaxed font-semibold">
                     We highly recommend exclusively using the <strong className="text-[#00ff88]">"Journal & Auto-Log"</strong> interface. Provide a messy brain-dump of your day's activities, meals, spending, and mood. The engine will <strong className="text-purple-300">automatically distribute, categorize, and log</strong> these entities into your Habits, Goals, Finances, and Timeline views simultaneously!
                   </p>
                 </div>
              </div>
           </div>

           <div className="p-5 border-t border-[#2a2a50] bg-[#111120] flex justify-end">
              <button
                onClick={onDismiss}
                className="bg-[#00d4ff] text-[#0d0d1a] px-8 py-3 rounded-xl font-extrabold text-xs uppercase tracking-widest hover:bg-[#00b0d4] transition shadow-[0_0_15px_rgba(0,212,255,0.3)]"
              >
                CLOSE MANUAL & RETURN
              </button>
           </div>
        </div>

      </div>
    </div>
  );
};
