import React from 'react';
import { AppState } from '../types';
import { Shield, Save, Cloud, Link as LinkIcon, Download, Bot, X, Play } from 'lucide-react';

export const HelpView: React.FC<{ state: AppState, onOpenAIAnalyst?: (prompt?: string) => void, onLoadDemo?: () => void }> = ({ state, onOpenAIAnalyst, onLoadDemo }) => {
  const appInfoText = `Hello AI, I am providing you with the complete architecture and manual for "Omnilife Tracker", a highly advanced productivity app I am using. Please act as my top-tier executive assistant and specialized AI expert for this platform.

### OMNILIFE TRACKER - INSTRUCTION MANUAL & SYSTEM ARCHITECTURE
Omnilife Tracker is powered by an **Ultimate Local AI System**. It is a 100% local, offline-first application designed for unparalleled privacy. All data is saved natively to the machine with Zero Cloud Dependency.

**Advanced AI Architecture:**
- Ultra-Advanced LLM Ensemble: Utilizes custom fine-tuned models (LoRA) for financial parsing, mood prediction, and voice processing.
- Micro-Function ML Training: Every tiny function gets its own ML model (e.g., date normalization, amount validation, category bounds).
- Real-Time Streaming: Instantaneous offline data ingestion mapped via strict confidence voting ensembles.
- Adaptive Learning: Models implicitly build and track performance off corrections via weekly retraining regimes.

**Detailed Module Capabilities:**
1. **Dashboard:** Summarizes the current day. Integrates streak progression, total hours tracked, and any overdue alerts. Serves as the central command node.
2. **Daily Tracker:** The core checklist. Users can check off recurring items (Done, Missed, Skipped). Users can link Quick Notes and exact numeric measurements to actions. Has a streak calculator for continuous consistency.
3. **Daily Journal:** Deep narrative logging. Captures Mood (1-5 scale) and Energy (1-5 scale), specific tags, inline GPS location tracking, and text prompts. Supports inline sketching and uploading images onto the daily log. Saves an array of Voice Dictation Audio Tracks with precise transcriptions and timestamps.
4. **Goals & Targets:** Users can set target repetitions or hours per activity over distinct timeframes (Weekly, Monthly, Yearly, Lifetime). The app intercepts Daily Tracker and Pomodoro logs to auto-calculate completion percentage towards these goals.
5. **Analytics (Graph Matrix):** Shows bar/line charts over past week, plus an elegant heatmap of 30 days to visualize density of activity visually.
6. **Expeditions:** A comprehensive trip planner logging itineraries, precise map coordinates, budgets per trip, and active packing checklists.
7. **Finances:** Native budgeting software with Advanced Smart Import. Powered by an Isolation Forest Anomaly model and FastText Classifier.
8. **Sketchpad:** An infinite digital canvas to draw, wireframe, or capture thoughts with a stylus/mouse.
9. **Alerts & Reminders:** Creates alarms/reminders. Supports setting Priority levels (High/Med/Low), recurrent intervals, and specific Alert Offsets.
10. **Pomodoro Clock:** A robust 25/5 focus timer that links directly into Daily Tracker categories to instantly build logged hours natively when the clock finishes.
11. **Synopsis & Share:** Selects a date range, scrapes all notes, sketches, and metrics, and compiles it into markdown formats.
12. **Search Directory:** Global deep text search spanning across historical journal logs, tasks, and financial memos.
13. **Focus Audio:** Ambient environment soundscapes (e.g. rain, brown noise, cafe) to assist in deep focus, controlled directly via the main navigation menu.
14. **Bio-Climate & Indoor/Outdoor Environment Desk:** Real-time environmental tracking console on the dashboard. Monitors live weather conditions, wind speed, UV, and Air Quality (AQI) telemetry.
15. **Visual Themes, Custom Stickers & Quotes Engines:** Includes 22 advanced visual presets styled with distinctive color tones, typographic matching engines, and distinct situational quotes.
16. **Voice Logger / Omnimodal (OmniLife Command):** The app accepts voice or text input and uses an AI endpoint to map intentions into structured system commands. This includes creating/editing/deleting goals, reminders, daily tracker hits, finances, or adjusting journal metrics (mood/energy/tags). Crucially, BEFORE any action executes, the app displays the **OmniLife Log Deck (Management Phase)**. The user can review, edit, discard, or manually type out specifics of the interpreted system actions on-screen.
17. **Projects:** Advanced complex task management supporting multi-stage task lists, progress completion algorithms, mapping, and embedded deadline/description features.
18. **Custom Categories & Advanced Targets:** Complete control mapping of any habit category with distinct default target values (reps/hours) and recurring schedule configuration options.

**Your Ongoing AI Role:**
Whenever I provide data outputs from Omnilife Tracker or ask you a question in this context, use your mastery of these 18 modules to assist me. Your guidance MUST adhere to the app's structural constraints (e.g. knowing it's offline-first, knowing how the ensemble architecture routes data). 
- Help me design life schedules.
- Guide me in utilizing specific modules for my use-case.
- Perform deep-dive analysis on any metrics or journal logs I provide.
- Keep your tone stoic, professional, and directly actionable. Assume I am a high-performer wanting ruthless optimization.`;

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      <div className="border-b border-[#111120] pb-5">
        <h2 className="text-3xl font-extrabold tracking-tight text-white font-display">
          Welcome & <span className="text-[#00ff88]">Help</span>
        </h2>
        <p className="text-xs uppercase tracking-widest text-[#a1a1aa] mt-1 font-mono">
          // PRIVACY, DATA & USAGE GUIDE
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* How to use the app (AI) */}
        <div className="bg-[#0d0d1a] border border-[#00ff88]/20 p-6 rounded-2xl flex flex-col gap-4 shadow-[0_0_30px_rgba(0,255,136,0.06)] md:col-span-2 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#00ff88]/5 rounded-bl-full blur-2xl pointer-events-none" />
          
          <div className="flex items-start gap-4">
             <div className="w-12 h-12 bg-[#00ff88]/10 rounded-xl flex items-center justify-center text-[#00ff88] shrink-0 border border-[#00ff88]/20">
               <Bot size={24} />
             </div>
             <div>
               <h3 className="font-extrabold text-xl font-display text-white tracking-widest uppercase">TUTORIAL: LEARN STEP BY STEP HOW TO USE THIS APP WITH THE HELP OF AI</h3>
               <p className="text-[10px] font-black uppercase text-[#00d4ff] tracking-widest mt-1">Interactive Step-by-Step AI Companion Manual & Tutorial Hub</p>
             </div>
          </div>
          
          <div className="bg-[#111120] border border-[#2a2a50] p-4 rounded-xl mt-2 relative z-10">
             <p className="text-sm text-slate-300 leading-relaxed font-mono">
               Need intelligent guidance structuring your routines, optimizing your budgets, or configuring tracker alerts? 
             </p>
             <p className="text-sm text-slate-300 leading-relaxed font-mono mt-2">
               You can instruct any LLM (ChatGPT, Claude, Gemini) to become an expert on this application. Click the button below to package this app's deep architectural structure and operational manual into your clipboard.
             </p>
          </div>
          
          <div className="mt-2 text-left">
            {onOpenAIAnalyst && (
              <button
                onClick={() => onOpenAIAnalyst(appInfoText)}
                className="w-full py-4 bg-[#00ff88]/15 border border-[#00ff88]/40 hover:bg-[#00ff88]/25 hover:scale-[1.01] transition-all font-black text-[#00ff88] text-xs uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 shadow-[0_4px_24px_rgba(0,255,136,0.15)]"
              >
                <Bot size={18} /> Learn step by step
              </button>
            )}
          </div>
        </div>

        {/* Privacy */}
        <div className="bg-[#111120] border border-[#2a2a50] p-5 rounded-2xl flex flex-col gap-3">
          <div className="w-10 h-10 bg-[#aa44ff]/10 rounded-xl flex items-center justify-center text-[#aa44ff] mb-2">
            <Shield size={20} />
          </div>
          <h3 className="font-bold text-lg text-white">Absolute Privacy</h3>
          <p className="text-xs text-slate-400 font-semibold leading-relaxed">
            Your data never leaves your computer. Everything is stored locally in your browser's memory or directly into a JSON file on your hard drive. There is no cloud, no backend, and no tracking. You are entirely in control.
          </p>
        </div>

        {/* Demo Preview */}
        <div className="bg-[#111120] border border-[#2a2a50] p-5 rounded-2xl flex flex-col gap-3">
          <div className="w-10 h-10 bg-[#ff6b1a]/10 rounded-xl flex items-center justify-center text-[#ff6b1a] mb-2 border border-[#ff6b1a]/20">
            <Play size={20} className="ml-1" />
          </div>
          <h3 className="font-bold text-lg text-white">Live Demo Preview</h3>
          <p className="text-xs text-slate-400 font-semibold leading-relaxed mb-2">
            Want to see how this app looks after months of continuous usage? Load our fully populated demo data package. <strong className="text-[#00ff88]">This will open in a new tab safely without modifying your real database.</strong>
          </p>
          {onLoadDemo && (
            <button
               onClick={() => onLoadDemo()}
               className="mt-auto py-2 bg-transparent hover:bg-[#ff6b1a]/10 border border-[#2a2a50] hover:border-[#ff6b1a] transition text-[#ff6b1a] uppercase text-[10px] font-black tracking-widest rounded-lg"
            >
               Open Isolated Live Demo
            </button>
          )}
        </div>

        {/* Ghost Sync */}
        <div className="bg-[#111120] border border-[#2a2a50] p-5 rounded-2xl flex flex-col gap-3">
          <div className="w-10 h-10 bg-[#ff6b1a]/10 rounded-xl flex items-center justify-center text-[#ff6b1a] mb-2">
            <LinkIcon size={20} />
          </div>
          <h3 className="font-bold text-lg text-white">Ghost Sync</h3>
          <p className="text-xs text-slate-400 font-semibold leading-relaxed">
            Found in Settings, Ghost Sync is an offline auto-save feature. It connects to a single master file on your computer and updates it instantly in the background every time you make a change, bypassing standard cloud vulnerabilities.
          </p>
        </div>

        {/* Export / Import */}
        <div className="bg-[#111120] border border-[#2a2a50] p-5 rounded-2xl flex flex-col gap-3">
          <div className="w-10 h-10 bg-[#00d4ff]/10 rounded-xl flex items-center justify-center text-[#00d4ff] mb-2">
            <Download size={20} />
          </div>
          <h3 className="font-bold text-lg text-white">Export & Import</h3>
          <p className="text-xs text-slate-400 font-semibold leading-relaxed">
            Located at the bottom of the sidebar, you can manually Export all your data as a JSON backup or CSV spreadsheet. You can also securely Import a previously saved JSON file to restore your full history.
          </p>
        </div>

      </div>
    </div>
  );
};
