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
      title: "Dashboard Walkthrough",
      steps: [
        {
          title: "Step 1: Daily Overview Bento Grid",
          desc: "👉 LOCATE: Look at the horizontal grid of 7 sleek cards right below the header. The first card shows your 'DONE' percentage, and the next ones hold stats like total focused hours and overall satisfaction scores. These update instantly as you check tasks!",
        },
        {
          title: "Step 2: Top Collapsible Aesthetics Bar",
          desc: "👉 LOCATE: Tap on the '🎨 Theme & Accent Customizer' drawer header located at the very top of your dashboard. Clicking will slide open a compact selection shelf containing custom UI configurations.",
        },
        {
          title: "Step 3: Ambient Quotes & Theme Stickers",
          desc: "👉 LOCATE: Observe the visual banner just above the viewport modules. Every structural theme displays custom styled stickers, symbols, and targeted mantras. You can close this banner for space, and restore it anytime using the glowing green 'Restore Quote' action button.",
        },
        {
          title: "Step 4: Bio-Climate & Environment Control Desk",
          desc: "👉 LOCATE: Find the large 'Bio-Climate Desk' dashboard element. Switch outdoor station overlays or use the 'Search Location' option to query and deploy live real-time weather, AQI, and wind telemetry from actual GPS coordinates worldwide.",
        },
        {
          title: "Step 5: Active Habits Streaks",
          desc: "👉 LOCATE: Look at the vertical widgets in the center list. Hot-pink Fire icons highlight your consecutive daily win streaks. They increase automatically when you mark routines done day after day.",
        },
      ],
    },
    daily: {
      title: "Daily Tracker Walkthrough",
      steps: [
        {
          title: "Step 1: Top Navigation Bar",
          desc: "👉 LOCATE: Find the horizontal header widget at the very top. Use the pointing arrow buttons (◀ and ▶) to step through dates, or click the orange 'TODAY' badge to snap back to the current date.",
        },
        {
          title: "Step 2: Category Switches (Middle Tabs)",
          desc: "👉 LOCATE: Find the horizontal tab panel underneath the date header. Switch between 'Habits', 'Leisure', and 'Custom' routines to keep your focus blocks clean and tidy.",
        },
        {
          title: "Step 3: Direct Routine Toggles",
          desc: "👉 LOCATE: Look at the rows inside the main central list. Click directly on any routine row to cycle its state (PENDING 🟡 → DONE 🟢 → MISSED 🔴 → SKIPPED ⚪). This is your primary logging action!",
        },
        {
          title: "Step 4: Add Routines (+ Inline Trigger)",
          desc: "👉 LOCATE: Look closely at the category section headers. Click the small round plus icon (+ button) situated on the outer right edge of each category container to add a new task item on the fly.",
        },
      ],
    },
    journal: {
      title: "Interactive Journal Walkthrough",
      steps: [
        {
          title: "Step 1: Mood & Energy Smiley Gauges",
          desc: "👉 LOCATE: At the very top of the journal desk, you'll see two rows of grid buttons with smiles and batteries. Tap them to record your emotional and vitality balance for the current day.",
        },
        {
          title: "Step 2: Custom reflection Prompt boxes",
          desc: "👉 LOCATE: Look at the main inputs in the middle column. Type your thoughts directly in these panels — they save automatically in the background as you write!",
        },
        {
          title: "Step 3: Multi Tag selection panel",
          desc: "👉 LOCATE: Look at the bottom-right sidebar. Under 'Journal Tags', find the tag cloud or use the input bar to create custom markers (e.g. 'FOCUS', 'ROUGH') to group daily logs.",
        },
        {
          title: "Step 4: Connected Canvas Sketches",
          desc: "👉 LOCATE: Look at the bottom of the middle desk. Below the text boxes, click 'Sketch' to open an inline scribble box, or navigate to the main Sketchpad PRO tab to attach professional schematics directly into these sections!",
        },
      ],
    },
    goals: {
      title: "Goals & Target Walkthrough",
      steps: [
        {
          title: "Step 1: Horizon Selector Tabs",
          desc: "👉 LOCATE: Find the prominent tab bar at the high top header. Switch cleanly between Weekly, Monthly, and Yearly horizons to inspect different milestones.",
        },
        {
          title: "Step 2: Repetitions Target Counters",
          desc: "👉 LOCATE: Look at the 'TARGET REPS' column on the grid view. Use the number controls to dictate how many times you plan to complete that habit in your active schedule framework.",
        },
        {
          title: "Step 3: Hour Duration Goals",
          desc: "👉 LOCATE: Look next to the target reps. The clock icons let you specify minimum spent hour targets (e.g., 10 hours of study) for high-value routines.",
        },
        {
          title: "Step 4: Blue Lock Indicators",
          desc: "👉 LOCATE: When you manually customize goal counters, they turn neon blue with a lock badge. This means they are frozen. Press the 'Reset' button adjacent to them to snap back to automatic calculations derived from daily logs.",
        },
      ],
    },
    finances: {
      title: "Finance Tracker Walkthrough",
      steps: [
        {
          title: "Step 1: Accounts Registry",
          desc: "👉 LOCATE: Look at the left sidebar. Press the '+ New Account' action button to trigger a form, letting you set up safe checking, ledger, or asset balances.",
        },
        {
          title: "Step 2: Ledger Transaction Entry",
          desc: "👉 LOCATE: Inside the details panel of any active account, press the 'Add Transaction' button at the top header to log new debits or credit inputs.",
        },
        {
          title: "Step 3: Due Money Tasks",
          desc: "👉 LOCATE: On the lower row, the 'Financial Tasks' checklist lets you catalog chores like tax filing or audits. Check off items with their simple inline triggers.",
        },
        {
          title: "Step 4: Bill Alerts & Reminders",
          desc: "👉 LOCATE: Press the small bell icon next to any account or transaction row. This triggers a calendar pop-up configuration to schedule automatic bill alerts.",
        },
      ],
    },
    expeditions: {
      title: "Expedition Walkthrough",
      steps: [
        {
          title: "Step 1: Plan Expedition Trigger",
          desc: "👉 LOCATE: Find the main green-accent button at the top header labeled 'Plan New Expedition'. Tap it to set up a trip name, dates, and destination.",
        },
        {
          title: "Step 2: Pack Lists & Checklists",
          desc: "👉 LOCATE: Click to expand any active trip card. Look at the lower half of the expanded card where checkmark sliders let you pack gear items and tick off travel tasks systematically.",
        },
        {
          title: "Step 3: Alert Alarm Bell",
          desc: "👉 LOCATE: Inside the expanded expedition card header, locate the grey bell icon next to the trip name. Click it to place automatic flight reminders onto your global alerts list.",
        },
      ],
    },
    pomo: {
      title: "Focus Walkthrough",
      steps: [
        {
          title: "Step 1: Routine Selector",
          desc: "👉 LOCATE: Look at the left dropdown selector in the central focus box. Choose which active regular study habit you want to map this session to.",
        },
        {
          title: "Step 2: Duration Presets",
          desc: "👉 LOCATE: Direct your eyes to the three numeric buttons (25, 45, and 60 mins) right above the timer circles. Click these for rapid configuration setups.",
        },
        {
          title: "Step 3: Ambient Synthesizer Rails",
          desc: "👉 LOCATE: Look at the audio selector rail below the countdown clock. Select 'Cybernetic Rain' or 'Brownian Noise' to trigger our inline real-time synthesizers.",
        },
        {
          title: "Step 4: Center Start Glow Orb",
          desc: "👉 LOCATE: Press the main glowing central start icon to activate deep focus mode. The dashboard will dim, leaving only active countdown tracking visible.",
        },
      ],
    },
    reminders: {
      title: "Reminders Walkthrough",
      steps: [
        {
          title: "Step 1: New Alert creation",
          desc: "👉 LOCATE: Look at the outer right section of the header toolbar. Click the green 'New Reminder' button to set custom date-times and flags.",
        },
        {
          title: "Step 2: Priority Badges",
          desc: "👉 LOCATE: High-priority alarms will render with orange exclamation glow tags on the daily alerts feed, warning you of impending deadlines.",
        },
      ],
    },
    settings: {
      title: "Settings Walkthrough",
      steps: [
        {
          title: "Step 1: Secure JSON Backup",
          desc: "👉 LOCATE: Look at the left column panels. Tap the grey 'Export JSON' button to save a copy of your private browser database onto your local hard drive.",
        },
        {
          title: "Step 2: Restore Import Button",
          desc: "👉 LOCATE: Click the 'Import JSON' file-uploader adjacent to the exporter to pick any old backup file to instantly re-populate all tracking states.",
        },
        {
          title: "Step 3: Ghost Continuous Sync",
          desc: "👉 LOCATE: Find the blue disk icon labeled 'Ghost Sync' in the center grid. Activate this to securely link a local folder for real-time background file writes.",
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

        <div className="mt-5 pt-4 border-t border-[#2a2a50]/60 space-y-3">
          <p className="text-[10px] text-slate-400 font-medium text-center leading-relaxed">
            ℹ️ <span className="text-[#00ff88] font-bold">Quick Tech:</span> You can always access or re-open these detailed interactive module guides from the Sidebar under <span className="text-[#00d4ff] font-bold">"Module Guides"</span> or in the <span className="text-[#00ff88] font-bold">"Help & Info"</span> tab!
          </p>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white uppercase tracking-widest text-[11px] font-black transition flex items-center justify-center gap-2 w-full bg-[#2a2a50] hover:bg-rose-500 py-3 rounded-xl shadow-lg border border-[#2a2a50]"
          >
            <X size={16} /> Close Walkthrough
          </button>
        </div>
      </div>
    </div>
  );
};
