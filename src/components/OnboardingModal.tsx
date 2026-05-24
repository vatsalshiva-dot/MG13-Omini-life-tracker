import React from 'react';
import { HelpCircle, Check } from 'lucide-react';

interface OnboardingModalProps {
  viewId: string;
  onDismiss: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ viewId, onDismiss }) => {
  const contentMap: Record<string, { title: string; steps: string[] }> = {
    dashboard: {
      title: 'Welcome to Dashboard',
      steps: [
        'Here you can view a quick summary of your day.',
        'See your active streak and progression metrics.',
        'Quickly jump to the Daily Tracker for more details.'
      ]
    },
    daily: {
      title: 'Using the Daily Tracker',
      steps: [
        'Mark tasks as done, missed, or skipped.',
        'Use the quick-add button to add custom items on the fly.',
        'View real-time progression toward your specific repetition goals.'
      ]
    },
    journal: {
      title: 'Using the Daily Journal',
      steps: [
        'Write detailed entries for your habits and emotions.',
        'Attach GPS locations safely to your entries.',
        'Draw sketches or add images directly inline.'
      ]
    },
    goals: {
      title: 'Managing Goals',
      steps: [
        'Set daily repetition and hour targets for all activities.',
        'Check your target progress automatically calculated.',
        'Ensure automatic synchronization in background.'
      ]
    },
    analytics: {
      title: 'Understanding Analytics',
      steps: [
        'Review your historical stats across any 7-day period.',
        'View graphical charts of your habit consistency.',
        'Analyze long-term trends.'
      ]
    },
    calendar: {
      title: 'Calendar View',
      steps: [
        'Navigate across the month to view daily snapshots.',
        'Click on any date to jump back into its tracking state.',
        'See visual intensity tags representing how active you were.'
      ]
    },
    expeditions: {
      title: 'Planning Expeditions',
      steps: [
        'Log upcoming or past trips.',
        'Securely record GPS coordinates.',
        'Create packing lists with checkbox tracking.'
      ]
    },
    finances: {
      title: 'Managing Finances',
      steps: [
        'Track multiple accounts and budgets.',
        'Add recurring and custom transactions.',
        'Identify spending trends safely and privately.'
      ]
    },
    sketchpad: {
      title: 'Using the Sketchpad',
      steps: [
        'Freeform drawing across an infinite canvas style.',
        'Doodle and visually brainstorm.',
        'Save sketches securely into local memory.'
      ]
    },
    reminders: {
      title: 'Setting Reminders',
      steps: [
        'Set scheduled reminders for habits or custom events.',
        'Recurring alarms will alert every 15 minutes if missed.',
        'Tag as urgent to prioritize them.'
      ]
    },
    pomo: {
      title: 'Pomodoro Clock',
      steps: [
        'Follow the 25-5 structured focus methodology.',
        'Tie a focused session directly to a habit.',
        'Completed sessions are automatically logged over time.'
      ]
    },
    synopsis: {
      title: 'Synopsis & Export',
      steps: [
        'Select a date range to compile a comprehensive summary.',
        'Export this summary seamlessly.',
        'View the generated text or send it to AI.'
      ]
    },
    search: {
      title: 'Global Search',
      steps: [
        'Find specific words across all journal logs.',
        'Search through daily activities or tasks quickly.',
        'Jump immediately to the specific date.'
      ]
    },
    settings: {
      title: 'App Settings',
      steps: [
        'Configure your profile details.',
        'Customize your tracking categories.',
        'Manage Ghost Sync to ensure data is permanently saved offline.'
      ]
    },
    alerts: {
      title: 'Active Alerts',
      steps: [
        'See overdue reminders that have fired.',
        'These alerts will trigger every 15 minutes.',
        'Mark them done here to stop notifications.'
      ]
    },
    focus_audio: {
      title: 'Focus Audio',
      steps: [
        'Engage ambient soundscapes for deep focus.',
        'Play noise masking completely offline.',
        'Integrates natively with your pomodoro routines.'
      ]
    },
    help: {
      title: 'Help & Info',
      steps: [
        'Read the internal architecture of the app.',
        'Load the AI Analyst for comprehensive guidance.'
      ]
    }
  };

  const data = contentMap[viewId];
  if (!data) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-[90] animate-fadeIn">
      <div className="bg-[#111120] border border-[#00d4ff] rounded-3xl max-w-sm w-full p-6 space-y-6 shadow-[0_0_50px_rgba(0,212,255,0.15)] flex flex-col relative overflow-hidden">
        {/* Glow BG */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#00d4ff] to-[#aa44ff]"></div>
        
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#00d4ff]/10 flex items-center justify-center text-[#00d4ff]">
            <HelpCircle size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-widest">{data.title}</h2>
            <p className="text-[10px] text-[#00d4ff] font-mono tracking-widest uppercase">Quick Tutorial</p>
          </div>
        </div>

        <div className="space-y-4">
          {data.steps.map((step, idx) => (
            <div key={idx} className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-[#2a2a50] text-[#00d4ff] font-black text-[10px] flex items-center justify-center shrink-0">
                {idx + 1}
              </div>
              <p className="text-xs text-slate-300 font-medium leading-relaxed pt-0.5">{step}</p>
            </div>
          ))}
        </div>

        <button 
          onClick={onDismiss}
          className="w-full py-4 bg-[#0d0d1a] hover:bg-[#1a1a30] border border-[#2a2a50] hover:border-[#00d4ff] transition-all rounded-xl text-[#00d4ff] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2"
        >
          <Check size={16} /> Got it!
        </button>
      </div>
    </div>
  );
};
