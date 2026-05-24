import React, { useState, useEffect } from "react";
import {
  X,
  Info,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  EyeOff,
} from "lucide-react";

interface GuideProps {
  isOpen: boolean;
  onClose: () => void;
  activeView: string;
  onHideFloater?: () => void;
}

export const StepByStepGuideModal: React.FC<GuideProps> = ({
  isOpen,
  onClose,
  activeView,
  onHideFloater,
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
    }
  }, [isOpen, activeView]);

  if (!isOpen) return null;

  const content: Record<
    string,
    { title: string; steps: { title: string; desc: string }[] }
  > = {
    dashboard: {
      title: "Dashboard Guide",
      steps: [
        {
          title: "Step 1: Daily Overview",
          desc: "This is your command center. You can see active streaks, energy levels, and overall session stats for the day. Think of it as a birds-eye view of your life.",
        },
        {
          title: "Step 2: Themes & Styles",
          desc: "Use the UI Themes & Styles section to change your aesthetic. Click on 'Pop Art Retro', 'Minimal Light', or 'Default Modern' to instantly change the vibe of the entire app.",
        },
        {
          title: "Step 3: Neon Accents",
          desc: "Right below the themes, you can select your accent color. These apply glowing effects to active elements throughout the system.",
        },
        {
          title: "Step 4: Streak Tracking",
          desc: "Your streaks are displayed here. They increase automatically as you complete daily habits over consecutive days in the 'Daily Tracker'. Miss a day, and the streak resets to zero automatically.",
        },
      ],
    },
    daily: {
      title: "Daily Tracker Guide",
      steps: [
        {
          title: "Step 1: Date Navigation",
          desc: "At the very top, use the left/right arrows to change the date you are viewing. You can track past days or plan for future days. Click 'Go to Today' to snap back.",
        },
        {
          title: "Step 2: Category Switching",
          desc: "Below the date, you'll see tabs for 'Habits', 'Leisure', and 'Custom'. Click these to split your tasks into logical chunks and keep your view clean.",
        },
        {
          title: "Step 3: Quick Task Tracking",
          desc: "Just click somewhere on a task row to easily toggle its state between 'done' and 'skip'. If it's done, you can tap it again to set a satisfaction score or custom notes.",
        },
        {
          title: "Step 4: Adding New Tasks",
          desc: "Click the smaller + button at the top right of each category section (right next to the category title). Type the name and press Enter to add a new task for that day.",
        },
      ],
    },
    journal: {
      title: "Journal Guide",
      steps: [
        {
          title: "Step 1: Setting Mood & Energy",
          desc: "Start your journal entry by clicking the mood emojis and energy icons at the top to set a quick emotional baseline for the day.",
        },
        {
          title: "Step 2: Freeform Notes",
          desc: "Use the large text area below to brain-dump your thoughts. Changes save automatically as you type, so you don't need to look for a save button.",
        },
        {
          title: "Step 3: Applying Tags",
          desc: "Under the text area, type a word like 'Reflective' or 'Anxious' and hit Enter to add tags. This helps you categorize entries for the AI Analyst to review later.",
        },
      ],
    },
    goals: {
      title: "Goals & Targets Guide",
      steps: [
        {
          title: "Step 1: Choosing a Timeline",
          desc: "Switch between the Weekly, Monthly, Yearly, or Lifetime tabs at the top to see different horizons for your goals.",
        },
        {
          title: "Step 2: Setting Target Reps",
          desc: "Each goal has a numerical counter. Click this number to set how many times you want to complete a specific task in this timeframe (e.g., 5 times a week).",
        },
        {
          title: "Step 3: Setting Target Hours",
          desc: "Click the clock icon and number next to it if you want to aim for a certain amount of hours spent on the given task, rather than just repetitions.",
        },
        {
          title: "Step 4: Manual vs Auto-Sync",
          desc: "If you adjust a goal manually, its number turns 'blue', meaning it is detached from auto-calculation. You can click 'reset' on it to revert it back to auto-tracking from your Daily Tracker.",
        },
      ],
    },
    finances: {
      title: "Finance Tracker Guide",
      steps: [
        {
          title: "Step 1: Adding Accounts",
          desc: "First, set up your checking, savings, or investment accounts utilizing the '+ New Account' button. Note that each starts with its own balance.",
        },
        {
          title: "Step 2: Logging Transactions",
          desc: "Click inside an account to view details. Then click 'Add Transaction' to record income or expenses. They will automatically affect the linked account balance.",
        },
        {
          title: "Step 3: Managing Financial Tasks",
          desc: "Create tasks like 'Pay Bills' or 'Audit Taxes' right inside the finances tab using the 'Tasks' section to keep money-chores centralized.",
        },
      ],
    },
    expeditions: {
      title: "Expeditions Guide",
      steps: [
        {
          title: "Step 1: Planning a New Trip",
          desc: "Click 'Plan New Expedition' to create a new trip container. Give it a title and select dates.",
        },
        {
          title: "Step 2: Setting the Itinerary",
          desc: "Add specific locations and descriptions to the expedition. This acts as your high-level travel context and itinerary.",
        },
        {
          title: "Step 3: Packing Lists",
          desc: "Click on a created expedition to expand it. Here you can list out your packing requirements. Check them off as you place them in your bag.",
        },
        {
          title: "Step 4: Travel Tasks",
          desc: "Add travel-specific sub-tasks (like 'buy tickets' or 'print visas') and check them off securely before you go.",
        },
      ],
    },
    pomo: {
      title: "Pomodoro Timer Guide",
      steps: [
        {
          title: "Step 1: Selecting a Task",
          desc: "First, select a task you want to focus on from the dropdown, or just use the generic focus timer.",
        },
        {
          title: "Step 2: Setting the Timer",
          desc: "Use the presets (25, 45, or 60 minutes) for quick setups. The required break time automatically adjusts proportionally.",
        },
        {
          title: "Step 3: Focus Audio Integration",
          desc: "You can toggle audio tracks (Brown noise, Rain, Cyber) below the timer. These will automatically play ambient sound during your work sessions and mute during breaks.",
        },
        {
          title: "Step 4: Starting the Session",
          desc: "Click the big 'START' button to begin focusing. The timer will take over your screen visually to minimize distractions.",
        },
      ],
    },
    reminders: {
      title: "Reminders Guide",
      steps: [
        {
          title: "Step 1: Adding Reminders",
          desc: "Click 'New Reminder'. Set the title, specify the exact due date, and choose an optional time.",
        },
        {
          title: "Step 2: Priority Flags",
          desc: "When creating a reminder, flag it as high priority if needed. High priority alerts show up visually differently across the app.",
        },
      ],
    },
    settings: {
      title: "Settings Guide",
      steps: [
        {
          title: "Step 1: Data Backup (Export)",
          desc: "Because Omnilife is 100% private, there is no cloud! You must secure your own data. Click 'Export JSON' to download a backup of everything.",
        },
        {
          title: "Step 2: Restoring Data",
          desc: "If you change browsers or clear cache, just click 'Import JSON' and supply your saved backup to instantly restore everything to exactly how it was.",
        },
        {
          title: "Step 3: Enabling Ghost Sync",
          desc: "Ghost Sync uses standard File System Access. Click it, select your JSON backup file on your local hard drive, and the app will continuously save your clicks automatically in the background.",
        },
      ],
    },
  };

  const currentContent = content[activeView] || {
    title: "System Feature Guide",
    steps: [
      {
        title: "Step 1: Navigation",
        desc: "Use the sidebar to explore different modules. Click on any icon to switch your context.",
      },
      {
        title: "Step 2: AI Analysis",
        desc: "Click the AI Analyst button at any time to export context right to your clipboard, allowing you to get answers, analytics, and suggestions from your preferred AI.",
      },
    ],
  };

  const totalSteps = currentContent.steps.length;
  const step = currentContent.steps[currentStep];

  const handleNext = () => {
    if (currentStep < totalSteps - 1) setCurrentStep(currentStep + 1);
    else onClose();
  };

  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-[90] animate-fade-in text-slate-200">
      <div className="bg-[#111120] relative border border-[#2a2a50] rounded-2xl max-w-md w-full p-6 shadow-[0_10px_40px_rgba(0,0,0,0.5)] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-[#2a2a50]/50 hover:bg-[#2a2a50] text-slate-400 hover:text-white transition"
        >
          <X size={16} />
        </button>

        <div className="flex items-center justify-between mb-6 border-b border-[#2a2a50] pb-4 pr-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#00d4ff]/10 text-[#00d4ff] flex items-center justify-center shrink-0">
              <Info size={20} />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-widest text-[#00d4ff] leading-none">
                {currentContent.title}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Interactive walkthrough
              </p>
            </div>
          </div>
        </div>

        <div className="min-h-[160px] flex flex-col">
          <div className="flex items-center gap-3 mb-2">
            <div className="font-mono text-sm bg-[#00d4ff]/10 text-[#00d4ff] px-2 py-0.5 rounded border border-[#00d4ff]/20">
              {currentStep + 1} / {totalSteps}
            </div>
            <h4 className="font-bold text-slate-100 text-lg">{step.title}</h4>
          </div>
          <p className="text-slate-300 leading-relaxed text-sm animate-fade-in mt-2 flex-grow">
            {step.desc}
          </p>
        </div>

        <div className="pt-6 border-t border-[#2a2a50] mt-4 flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={handlePrev}
              disabled={currentStep === 0}
              className={`w-10 h-10 flex items-center justify-center rounded-full transition ${
                currentStep === 0
                  ? "opacity-50 cursor-not-allowed bg-[#2a2a50]/30 text-slate-500"
                  : "bg-[#2a2a50]/50 hover:bg-[#2a2a50] text-slate-200"
              }`}
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={handleNext}
              className="px-6 py-2 flex items-center justify-center gap-2 rounded-full bg-[#00d4ff] hover:bg-[#00b8e6] text-black font-bold uppercase tracking-widest text-xs transition"
            >
              {currentStep === totalSteps - 1 ? (
                <>
                  <CheckCircle size={16} /> Finish
                </>
              ) : (
                <>
                  Next <ChevronRight size={16} />
                </>
              )}
            </button>
          </div>

          {onHideFloater && (
            <button
              onClick={() => {
                onHideFloater();
                onClose();
              }}
              className="text-[10px] text-slate-500 hover:text-slate-300 uppercase font-bold tracking-wider flex items-center gap-1.5 transition"
            >
              <EyeOff size={12} />
              Hide Floater
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
