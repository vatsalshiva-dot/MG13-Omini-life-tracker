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
          desc: "👉 LOCATE: Look at the horizontal grid of 7 sleek cards right below the header. The first card shows your 'DONE' percentage, calculating exactly how many habits out of your daily total are marked completed. The next ones hold stats like total focused hours and overall satisfaction scores. These update instantly as you check tasks throughout the day!",
        },
        {
          title: "Step 2: Top Collapsible Aesthetics Bar",
          desc: "👉 LOCATE: Tap on the '🎨 Theme & Accent Customizer' drawer header located at the very top of your dashboard. Clicking will slide open a compact selection shelf containing custom UI configurations. Every theme you select here triggers an immediate system-wide palette swap.",
        },
        {
          title: "Step 3: Ambient Quotes & Theme Stickers",
          desc: "👉 LOCATE: Observe the visual banner just above the viewport modules. Every structural theme displays custom styled stickers, symbols, and targeted mantras. You can close this banner for space using the top-right X, and restore it anytime using the glowing green 'Restore Quote' action button that takes its place.",
        },
        {
          title: "Step 4: Bio-Climate & Environment Desk",
          desc: "👉 LOCATE: Find the large 'Bio-Climate Desk' dashboard element. Use the 'Search Location' option to query any globally recognized city to pull live weather, AQI (Air Quality Index), and wind telemetry vectors directly from meteorological APIs. The refresh button fetches the latest data instantly.",
        },
        {
          title: "Step 5: Active Habits Streaks",
          desc: "👉 LOCATE: Look at the vertical widgets in the center list. Hot-pink Fire icons highlight your consecutive daily win streaks. They increase automatically when you mark routines 'DONE' day after day, resetting immediately if you miss a single day.",
        },
      ],
    },
    daily: {
      title: "Daily Tracker Walkthrough",
      steps: [
        {
          title: "Step 1: Top Navigation Bar",
          desc: "👉 OVERVIEW: Find the horizontal header widget at the very top. Use the pointing arrow buttons (◀ and ▶) to step through dates to view past performance or plan tomorrow. Click the orange 'TODAY' badge to snap back to the current date.",
        },
        {
          title: "Step 2: Category Switches (Middle Tabs)",
          desc: "👉 ACTION: Find the horizontal tab panel underneath the date header. Switch between 'Habits', 'Leisure', and 'Custom' routines to keep your focus blocks clean. Each tab holds distinct routines that contribute independently to your daily metrics.",
        },
        {
          title: "Step 3: Direct Routine Toggles",
          desc: "👉 ACTION: Look at the rows inside the main central list. Click directly on any routine block to cycle its state (PENDING 🟡 → DONE 🟢 → MISSED 🔴 → SKIPPED ⚪). This is your primary logging action! Holding down or opening options allows you to add specific hours, reps, and satisfaction scores.",
        },
        {
          title: "Step 4: Add New Routines (+ Inline Trigger)",
          desc: "👉 ACTION: Look closely at the category section headers. Click the small round plus icon (+ button) situated on the outer right edge of each category container to add a new task item on the fly. This task will now appear in your master rotation.",
        },
        {
          title: "Step 5: Evening Debrief & Finalization",
          desc: "👉 ACTION: At the end of the day, press the 'Evening Debrief' button. This launches a guided modal that audits your reported hours versus your goal targets. It also reviews any alarms/reminders you had pending, allowing you to sweep your day totally clean.",
        },
      ],
    },
    journal: {
      title: "Interactive Journal Walkthrough",
      steps: [
        {
          title: "Step 1: Mood & Energy Smiley Gauges",
          desc: "👉 FUNCTION: At the very top of the journal desk, you'll see two rows of grid buttons with smiles and batteries. Tap them from 1 to 5 to quantitatively record your emotional and vitality balance for the day. These are used in cross-referencing AI Analysis.",
        },
        {
          title: "Step 2: Custom reflection Prompt boxes",
          desc: "👉 FUNCTION: Look at the main inputs in the middle column. Type your thoughts directly in these panels. These support full markdown, bullets, and multi-line breaks. They save automatically in the background as you write!",
        },
        {
          title: "Step 3: Multi Tag selection panel",
          desc: "👉 FUNCTION: Look at the bottom-right sidebar. Under 'Journal Tags', find the tag cloud or use the input bar to create custom text markers (e.g. 'FOCUS', 'LOW-ENERGY') to categorize daily logs for rapid search filtering.",
        },
        {
          title: "Step 4: Attached Canvas Sketches",
          desc: "👉 FUNCTION: Look at the bottom of the middle desk. Below the text boxes, click 'Sketch' to open an inline scribble box, or navigate to the main Sketchpad PRO tab to attach professional schematics directly into these sections. Selecting from the sketch shelf binds an image directly to the day's record.",
        },
      ],
    },
    goals: {
      title: "Goals & Target Walkthrough",
      steps: [
        {
          title: "Step 1: Horizon Selector Tabs",
          desc: "👉 OVERVIEW: Find the prominent tab bar at the high top header. Switch cleanly between Weekly, Monthly, and Yearly horizons to inspect different milestones.",
        },
        {
          title: "Step 2: Target Repetitions",
          desc: "👉 FUNCTION: Look at the 'TARGET REPS' column on the grid view. Use the number controls (+/-) to dictate how many individual units/times you plan to complete that habit in your active schedule framework.",
        },
        {
          title: "Step 3: Hour Duration Goals",
          desc: "👉 FUNCTION: Look next to the target reps. The clock icons let you specify minimum spent hour targets (e.g., '10 hours of Deep Work'). This is tracked natively against the actual hours you report within the Daily module.",
        },
        {
          title: "Step 4: Auto-Calculation vs Manual Override",
          desc: "👉 METRICS: By default, Monthly/Yearly targets mathematically multiply up from your custom Weekly inputs. When you manually override a Monthly number, it becomes frozen. It turns neon blue with a lock badge. Press the 'Reset' button adjacent to snap it back to automatic parity.",
        },
      ],
    },
    finances: {
      title: "Comprehensive Finance Ledger Manual",
      steps: [
        {
          title: "Step 1: Account Aggregation & Net Balance",
          desc: "👉 OVERVIEW: View the dynamic Net Balance, Income, and Expenses cards at the top of the screen to monitor overall real-time financial standing. These sum directly from your Accounts list in the ledger.",
        },
        {
          title: "Step 2: Log New Ledger Transaction",
          desc: "👉 ACTION: Use the main form block to manually log. Select 'EXPENSE' or 'INCOME'. Type a description, input the amount, select the relevant category (Food, Travel, Bills, etc.), and associate it with an existing physical Account. If you split a bill, use the 'Split With' feature.",
        },
        {
          title: "Step 3: Smart CSV/Excel Import Engine",
          desc: "👉 POWER TOOL: Go down to the 'Raw Statement Importer' section. Select advanced statements (CSV, XLS) generated by your bank. The algorithmic engine auto-maps dates, debits, and categories. If a file is uploaded again, a prompt will safely ask you if you wish to overwrite previous matching entries.",
        },
        {
          title: "Step 4: Smart Text Paste Extraction",
          desc: "👉 POWER TOOL: Not using CSV? Open the 'Smart Paste Box', paste raw SMS receipts from your phone, raw bank text lines, or unformatted PDF grabs, and click 'Parse'. The AI regex engine identifies currency arrays and timestamps automatically.",
        },
        {
          title: "Step 5: Budget Run Rate Checks",
          desc: "👉 STRATEGY: Expand 'Run Rate vs Budget Targets'. Define limit parameters (e.g., $1000/month maximum limit). The app instantly calculates your actual average burn rate across 30 days and determines if you are mathematically safe or entering emergency overspend.",
        },
        {
          title: "Step 6: Attaching Alarms",
          desc: "👉 ACTION: Notice the 'bell' icon next to your scheduled recurring bills inside the grid layout table? Click it to instantly map a due-date alarm onto your central Calendar Reminders system.",
        },
      ],
    },
    expeditions: {
      title: "Expedition Master Planning Walkthrough",
      steps: [
        {
          title: "Step 1: Create a New Expedition",
          desc: "👉 ACTION: Find the main green-accent button at the top header labeled 'Plan New Expedition'. Tap it to set up a trip name, define start tracking dates, and specify the destination city/country.",
        },
        {
          title: "Step 2: Pack Lists & Modular Task Grids",
          desc: "👉 ACTION: Click to expand any active trip card. Look at the lower half of the expanded card where toggles let you build specific packing checklists. You can add items like 'Passports', 'Adapters', and click them once you physically stow them in your luggage.",
        },
        {
          title: "Step 3: Alert Alarm Bell Integration",
          desc: "👉 INTEGRATION: Inside the expanded expedition card header, locate the grey bell icon next to the trip name. Click it to pipe an automatic flight departure reminder onto your global Reminders list.",
        },
        {
          title: "Step 4: Deleting & Archiving",
          desc: "👉 ACTION: If the trip is over, use the red Trash bin icon located on the top right rim of the expanded card to archive it and wipe it from active memory, keeping your desk pristine.",
        },
      ],
    },
    pomo: {
      title: "Pomodoro Focus Studio Walkthrough",
      steps: [
        {
          title: "Step 1: Task Routing Selector",
          desc: "👉 PREPARATION: Look at the left dropdown selector in the central focus box. Choose which active regular habit (from your actual daily tracker) you want to map this session's time value to upon completion.",
        },
        {
          title: "Step 2: Session Timestamps & Overrides",
          desc: "👉 PREPARATION: Direct your eyes to the three numeric buttons (25, 45, and 60 minutes) above the timer clock. Click them for rapid configuration, or use the +/- markers to manually notch custom blocks.",
        },
        {
          title: "Step 3: Ambient Deep Work Synthesizers",
          desc: "👉 IMMERSION: Look at the audio selector rail below the countdown clock. Select 'Cybernetic Rain' (White Noise simulation) or 'Brownian Noise' (Deep bass hum) to trigger our inline real-time browser synthesizers. Excellent for drowning out distraction without external streaming tools.",
        },
        {
          title: "Step 4: Center Start Glow Orb",
          desc: "👉 ACTIVATION: Press the main glowing central start icon to actuate deep focus mode. The dashboard dims immediately, transitioning into a high-visibility, distraction-free countdown terminal.",
        },
      ],
    },
    reminders: {
      title: "Alarms & Reminders Walkthrough",
      steps: [
        {
          title: "Step 1: Alert Construction Form",
          desc: "👉 ACTION: Look at the outer right section of the header toolbar. Fill the Title, Date limit, and optional highly specific Time tracking, and click the green 'New Reminder' button.",
        },
        {
          title: "Step 2: Recurring Loop Mechanics",
          desc: "👉 ACTION: Change the 'Repeat' dropdown to setup Daily, Weekly, Monthly, or Yearly pings. When you mark a repeating reminder 'DONE' on the main grid, it automatically schedules a new duplicate instance for the next interval.",
        },
        {
          title: "Step 3: Priority Glow Badges",
          desc: "👉 UI CUE: High-priority alarms will render with orange/red exclamation glow tags on the daily alerts feed, visually overriding low-priority blue markers.",
        },
        {
          title: "Step 4: Evening Sweep Synchronization",
          desc: "👉 INTEGRATION: Alarms marked 'Pending' that land on Today's date will actively appear when you run the 'Evening Debrief' in the Daily Module, aggressively reminding you before the day's total closeout.",
        },
      ],
    },
    search: {
      title: "Omni Knowledge Graph & Search",
      steps: [
        {
          title: "Step 1: Universal Semantic Search",
          desc: "👉 LOCATE: Open the 'Search Life' module. Enter any query to instantly index across your tracking history, habits, journals, finances, reminders, and expeditions simultaneously.",
        },
        {
          title: "Step 2: Interactive D3 Knowledge Graph",
          desc: "👉 LOCATE: Below the search overlay, explore the complex topology of your data via the interactive D3 visual network map. Scroll to zoom, click/drag to pan, and click on nodes to pull up the deep Entity Inspector overlay.",
        },
        {
          title: "Step 3: The Priest - Deep Intuition Engine",
          desc: "👉 LOCATE: Use plain English conversational queries (e.g., 'what did I spend yesterday?'). The Priest (our dual Local + Cloud AI pipeline) automatically builds semantic filters for the Ledger and returns a deeply introspective conversational analysis answering your exact question.",
        },
        {
          title: "Step 4: Central Entity Navigation",
          desc: "👉 LOCATE: From within the Graph's Node Inspector, hit 'Jump to Context' to warp directly to the related module view on the exact day that entry occurred, keeping your focus completely uninterrupted.",
        }
      ]
    },
    settings: {
      title: "System Vault Core Walkthrough",
      steps: [
        {
          title: "Step 1: Secure JSON Backup",
          desc: "👉 ACTION: Look at the left column panels. Tap the grey 'Export JSON' button. This generates a pure, strictly formatted text representation of your entire database layout and pushes it to your hard drive securely.",
        },
        {
          title: "Step 2: Disaster Restore Importer",
          desc: "👉 ACTION: Click the 'Import JSON' file-uploader adjacent to the exporter to pick any old backup file you previously exported. This immediately re-populates all tracking states, reversing any local corruptions.",
        },
        {
          title: "Step 3: Danger Zone Array Clearing",
          desc: "👉 ACTION: In the 'Danger Zone' tier, you'll find specialized buttons to NUKE or erase specifically targeted modules (like wiping Daily Logs without deleting Finance). Follow the on-screen aggressive warnings purely if you require absolute resets.",
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
        desc: "Click the AI Analyst button at any time to export context right to your clipboard, allowing you to get answers, analytics, and suggestions via the advanced ML stacking prediction inference architecture.",
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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-[300] animate-fade-in text-slate-200">
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
          <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-xl text-center shadow-[0_0_15px_rgba(168,85,247,0.15)]">
            <p className="text-[11px] text-slate-200 font-bold leading-relaxed">
              ⭐ <span className="text-purple-400 font-black uppercase tracking-widest">MAJOR HIGHLIGHT (Must Recommended):</span> 
              <br /> Make sure to check out the <span className="text-[#00ff88]">"Journal & Auto-Log"</span> from the sidebar. Just braindump your day, and the Ultra-Advanced LLM Ensemble Architecture automatically logs your habits, moods, and finances entirely offline!
            </p>
          </div>
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
