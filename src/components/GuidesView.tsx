import React, { useState } from "react";
import { AppState } from "../types";
import { StepByStepGuideModal } from "./StepByStepGuideModal";
import {
  Home,
  Clipboard,
  Book,
  Target,
  Wallet,
  MapPin,
  Clock,
  Bell,
  Settings,
  ArrowRight,
  BookOpen,
} from "lucide-react";

interface Props {
  state: AppState;
}

export const GuidesView: React.FC<Props> = ({ state }) => {
  const [selectedGuide, setSelectedGuide] = useState<string | null>(null);

  const guideModules = [
    { id: "dashboard", name: "Dashboard Layout", icon: <Home size={18} /> },
    { id: "daily", name: "Daily Tracker", icon: <Clipboard size={18} /> },
    { id: "journal", name: "Daily Journal", icon: <Book size={18} /> },
    { id: "goals", name: "Goals & Targets", icon: <Target size={18} /> },
    { id: "finances", name: "Finance Tracker", icon: <Wallet size={18} /> },
    { id: "expeditions", name: "Expeditions", icon: <MapPin size={18} /> },
    { id: "pomo", name: "Focus Timer", icon: <Clock size={18} /> },
    { id: "reminders", name: "Reminders", icon: <Bell size={18} /> },
    { id: "settings", name: "Data & Settings", icon: <Settings size={18} /> },
  ];

  return (
    <div className="w-full h-full bg-[#0d0d1a] relative flex flex-col pt-12 md:pt-4 overflow-y-auto">
      <div className="max-w-4xl w-full mx-auto p-4 sm:p-6 pb-20 mt-8">
        <div className="flex items-center gap-3 border-b border-[#2a2a50] pb-4 mb-6">
          <BookOpen size={24} className="text-[#00d4ff]" />
          <div>
            <h1 className="text-2xl font-black uppercase tracking-widest text-[#00d4ff] font-display leading-tight">
              Module Guides
            </h1>
            <p className="text-xs uppercase text-slate-400 font-bold tracking-widest mt-1">
              Select a module below to start an interactive walkthrough
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {guideModules.map((mod) => (
            <button
              key={mod.id}
              onClick={() => setSelectedGuide(mod.id)}
              className="flex flex-col items-start p-5 bg-[#111120] border border-[#2a2a50] rounded-xl hover:border-[#00d4ff] hover:shadow-[0_4px_20px_rgba(0,212,255,0.1)] transition-all group text-left"
            >
              <div className="w-12 h-12 rounded-full bg-[#2a2a50]/40 flex items-center justify-center text-slate-300 group-hover:text-[#00d4ff] group-hover:bg-[#00d4ff]/10 transition-colors mb-4">
                {mod.icon}
              </div>
              <h3 className="font-bold text-slate-100 uppercase tracking-widest text-sm mb-1 group-hover:text-[#00d4ff] transition-colors">
                {mod.name}
              </h3>
              <p className="text-xs text-slate-400 mt-2 flex items-center gap-1 uppercase font-bold tracking-wider group-hover:text-slate-300">
                Start Walkthrough{" "}
                <ArrowRight
                  size={12}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </p>
            </button>
          ))}
        </div>

        {/* Detailed Function-by-Function Reference Accordion */}
        <div className="mt-12 space-y-6">
          <div className="border-t border-[#1e1e38] pt-8">
            <h2 className="text-sm font-black uppercase tracking-widest text-[#00ff88] font-mono">
              ⚙️ FUNCTION-BY-FUNCTION REFERENCE DIRECTORY
            </h2>
            <p className="text-[10px] text-slate-500 font-mono mt-1 uppercase">
              // Deep structural guides for every sub-function inside each module
            </p>
          </div>

          <div className="space-y-4">
            {/* Guide #1: Daily Routines */}
            <div className="bg-[#111120] border border-[#2a2a50] rounded-xl p-5 space-y-3">
              <h3 className="text-xs font-extrabold text-slate-200 uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#00d4ff] rounded-full" />
                1. Daily Tracker Functions
              </h3>
              <ul className="text-xs text-slate-400 space-y-2 list-disc list-inside pl-1">
                <li>
                  <strong className="text-slate-300">Cycle Status Indicator:</strong> Tap directly on a routine name to toggle values (<code className="text-amber-400">PENDING</code> → <code className="text-[#00ff88]">DONE</code> → <code className="text-rose-400">MISSED</code> → <code className="text-slate-500">SKIPPED</code>) to track your compliance accurately.
                </li>
                <li>
                  <strong className="text-slate-300">Task Satisfaction & Notes:</strong> Expand completed routines to input emotional rating scores (1-5) and write text reflections.
                </li>
                <li>
                  <strong className="text-slate-300">Multiplier Reps Editor:</strong> Change daily repetitions like gym sets or water glasses inside the input field. Its totals update weekly goal scores automatically.
                </li>
              </ul>
            </div>

            {/* Guide #2: Daily Journal */}
            <div className="bg-[#111120] border border-[#2a2a50] rounded-xl p-5 space-y-3">
              <h3 className="text-xs font-extrabold text-slate-200 uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#00d4ff] rounded-full" />
                2. Daily Journal Functions
              </h3>
              <ul className="text-xs text-slate-400 space-y-2 list-disc list-inside pl-1">
                <li>
                  <strong className="text-slate-300">Mood Emojis & Energy Gauges:</strong> Tap standard feeling profiles to register emotional trends. This allows the AI Analyst to run high-value correlations with habit logs.
                </li>
                <li>
                  <strong className="text-slate-300">Text Syncing Autosave:</strong> Freeform notes utilize debounced change listeners, storing paragraph characters locally as you type without safe buttons needed.
                </li>
                <li>
                  <strong className="text-slate-300">Hash Tag Clusters:</strong> Enter individual words (like "Focus", "Stormy", "Creative") and press Enter to save tags, aiding search indexing filters.
                </li>
              </ul>
            </div>

            {/* Guide #3: Goals */}
            <div className="bg-[#111120] border border-[#2a2a50] rounded-xl p-5 space-y-3">
              <h3 className="text-xs font-extrabold text-slate-200 uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#00d4ff] rounded-full" />
                3. Goals & Target Horizon Functions
              </h3>
              <ul className="text-xs text-slate-400 space-y-2 list-disc list-inside pl-1">
                <li>
                  <strong className="text-slate-300">Target Reps and Clock Hours:</strong> Choose whether a goal represents a total completion rate or total hours spent tracking.
                </li>
                <li>
                  <strong className="text-slate-300">Auto Formulas vs Locks:</strong> The system calculates goals from active routine scores automatically. Modifying a goal manually locks it (highlighted in <span className="text-[#00d4ff]">blue</span>). Click <code className="text-rose-400">Reset</code> to snap back to automated tracking.
                </li>
              </ul>
            </div>

            {/* Guide #4: Finances */}
            <div className="bg-[#111120] border border-[#2a2a50] rounded-xl p-5 space-y-3">
              <h3 className="text-xs font-extrabold text-[#ff6b1a] uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#ff6b1a] rounded-full" />
                4. Finance Ledger Functions
              </h3>
              <ul className="text-xs text-slate-400 space-y-2 list-disc list-inside pl-1">
                <li>
                  <strong className="text-[#ff6b1a]">Account Register:</strong> Set up checker registries with dedicated balance logs. Income and expenses scale totals automatically when submitted.
                </li>
                <li>
                  <strong className="text-slate-300">Custom Goals & Task Breaking:</strong> Set complex goals (e.g. "Save $10,000 for house") and create custom checkmark lists directly inside target panels to stay focused.
                </li>
                <li>
                  <strong className="text-slate-300">Integrated Alert System:</strong> Put down a due-date, specify alert frequencies, and build customized popups on your calendar for upcoming bill due cycles.
                </li>
              </ul>
            </div>

            {/* Guide #5: expeditions */}
            <div className="bg-[#111120] border border-[#2a2a50] rounded-xl p-5 space-y-3">
              <h3 className="text-xs font-extrabold text-slate-200 uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#00d4ff] rounded-full" />
                5. Travel Expedition Itineraries
              </h3>
              <ul className="text-xs text-slate-400 space-y-2 list-disc list-inside pl-1">
                <li>
                  <strong className="text-slate-300">Itineraries:</strong> Set travel dates and check check-in/out timestamps.
                </li>
                <li>
                  <strong className="text-slate-300">Dynamic Pack List:</strong> Add gear items with simple active checkbox logs to keep packing structured.
                </li>
                <li>
                  <strong className="text-slate-300">Travel Alarms:</strong> Trigger customized flight alerts which persist inside the main system Calendar and Alerts lists under the hood.
                </li>
              </ul>
            </div>

            {/* Guide #6: Pomodoro */}
            <div className="bg-[#111120] border border-[#2a2a50] rounded-xl p-5 space-y-3">
              <h3 className="text-xs font-extrabold text-[#aa44ff] uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#aa44ff] rounded-full" />
                6. Pomodoro Focus & Audio Functions
              </h3>
              <ul className="text-xs text-slate-400 space-y-2 list-disc list-inside pl-1">
                <li>
                  <strong className="text-[#aa44ff]">Instant Task Creation:</strong> Make a task then-and-there, choose to add it permanently into your daily routines to-dos, and bind the active timer to it.
                </li>
                <li>
                  <strong className="text-slate-300">Integrated Ambient Sound:</strong> Synthesizer generates Brown Noise, Stream Rain, and Synthwave. Sound turns on automatically during work and fades during the break.
                </li>
                <li>
                  <strong className="text-slate-300">Historical Journal Logs:</strong> Complete durations logs into your personal productivity ledger so you get full credit for work hours.
                </li>
              </ul>
            </div>

            {/* Guide #7: Sketchpad & Visual Themes */}
            <div className="bg-[#111120] border border-[#2a2a50] rounded-xl p-5 space-y-3">
              <h3 className="text-xs font-extrabold text-[#00ff88] uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#00ff88] rounded-full" />
                7. Sketchpad & Aesthetics Control Panel
              </h3>
              <ul className="text-xs text-slate-400 space-y-2 list-disc list-inside pl-1">
                <li>
                  <strong className="text-[#00ff88]">Infinite Sketchpad:</strong> Capture diagram notes on a custom offline pressure-sensitive drawing board. Link any sketch directly to a text Journal Entry to display your illustration inside the chronological history log.
                </li>
                <li>
                  <strong className="text-slate-300">System Color Palettes:</strong> Choose from 16 neon ambient accents. Collapse options with minimal symbols to maintain clutter-free screen layouts.
                </li>
                <li>
                  <strong className="text-slate-300">Multi-Styling Layout Engines:</strong> Change background states across 15 custom theme modes (like Luxury velvet gold, Redwood canopy forest, cyber synth cyberpunk, space cosmos, etc.).
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <StepByStepGuideModal
        isOpen={selectedGuide !== null}
        onClose={() => setSelectedGuide(null)}
        activeView={selectedGuide || "dashboard"}
      />
    </div>
  );
};
