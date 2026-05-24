import React from "react";
import { AppState, TrackerCategory } from "../types";
import { fmtDate, fmtShort, getWeek } from "../utils/date";
import { CATS } from "../utils/storage";
import { DashboardWeather } from "./DashboardWeather";
import {
  Play,
  Calendar,
  Bell,
  Flame,
  Clock,
  Check,
  Award,
  TrendingUp,
  Type,
} from "lucide-react";

interface DashboardViewProps {
  state: AppState;
  date: string;
  onNavigate: (viewId: string) => void;
  onSetDate: (date: string) => void;
  onSetTheme: (themeHex: string) => void;
  onSetBgTheme: (bgId: string) => void;
  onSetFontFamily: (fontId: string) => void;
  getDayD: (ds: string, cat: TrackerCategory, item: string) => any;
  onOpenAIAnalyst?: (prompt?: string) => void;
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
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  state,
  date: activeDate,
  onNavigate,
  onSetDate,
  onSetTheme,
  onSetBgTheme,
  onSetFontFamily,
  getDayD,
  dayStats,
  onOpenAIAnalyst,
}) => {
  const today = activeDate; // Using current state date as viewport focal point
  const stats = dayStats(today);

  // Expanded panel toggler states
  const [showAllColors, setShowAllColors] = React.useState(false);
  const [showAllThemes, setShowAllThemes] = React.useState(false);
  const [isCustomizerOpen, setIsCustomizerOpen] = React.useState(false);

  const [bannerClosed, setBannerClosed] = React.useState(() => {
    return typeof window !== "undefined" && localStorage.getItem("omnilife_banner_closed") === "true";
  });

  React.useEffect(() => {
    const handleToggle = () => {
      setBannerClosed(localStorage.getItem("omnilife_banner_closed") === "true");
    };
    window.addEventListener("omnilife_banner_toggle", handleToggle);
    return () => {
      window.removeEventListener("omnilife_banner_toggle", handleToggle);
    };
  }, []);

  // Greet depending on time of day
  const hours = new Date().getHours();
  const greeting =
    hours < 12 ? "MORNING" : hours < 17 ? "AFTERNOON" : "EVENING";

  // Find upcoming reminders
  const upcomingReminders = state.reminders
    .filter((r) => r.status !== "done")
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 5);

  // Best streak
  const streak = React.useMemo(() => {
    let max = 0;
    const calculateStreak = (cat: TrackerCategory, item: string) => {
      let streakCount = 0;
      const todayDate = new Date();
      for (let i = 0; i < 365; i++) {
        const d = new Date(todayDate);
        d.setDate(todayDate.getDate() - i);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const dy = String(d.getDate()).padStart(2, "0");
        const ds = `${y}-${m}-${dy}`;

        const entry = getDayD(ds, cat, item);
        const st = entry ? entry.status : "pending";
        if (st === "done") {
          streakCount++;
        } else if (st === "skipped") {
          continue;
        } else {
          break;
        }
      }
      return streakCount;
    };

    CATS.forEach((c) => {
      (state.items[c.id] || []).forEach((it) => {
        max = Math.max(max, calculateStreak(c.id, it));
      });
    });
    return max;
  }, [state, getDayD]);

  // Weekly average completion percentage
  const weekAvg = React.useMemo(() => {
    const jours = getWeek(today);
    let sum = 0;
    jours.forEach((j) => {
      sum += dayStats(j).pct;
    });
    return Math.round(sum / 7);
  }, [today, dayStats]);

  // Satisfactions colors
  const satColors: Record<number, string> = {
    1: "text-rose-500",
    2: "text-amber-500",
    3: "text-yellow-400",
    4: "text-lime-400",
    5: "text-emerald-400",
  };

  const weekDays = getWeek(today);

  const handleCopyAIData = () => {
    const summary = `
Date: ${today}
Day Overview:
Completed: ${stats.done}/${stats.total} (${stats.pct}%)
Total Hours Logged: ${stats.hrs.toFixed(1)}h
Overall Satisfaction: ${stats.sat ? stats.sat.toFixed(1) : "-"}/5

Categories:
${CATS.map((c) => `- ${c.label}: ${state.items[c.id]?.length || 0} items monitored`).join("\n")}

Upcoming Reminders:
${upcomingReminders.map((r) => `- ${r.title} [Priority: ${r.priority}] on ${r.dueDate} ${r.time || ""}`).join("\n")}

Focus/Pomo Sessions today:
${state.pomoSessions
  .filter((p) => p.date === today && p.status === "completed")
  .map((p) => `- ${p.task} (${p.duration} mins)`)
  .join("\n")}

Journal Notes for Today:
Mood: ${state.journals[today]?.mood || "Not logged"}
Energy: ${state.journals[today]?.energy || "Not logged"}
Tags: ${(state.journals[today]?.tags || []).join(", ")}

Please analyze this data, summarize the productivity trends, and provide 3 actionable insights to improve performance for next week.
    `.trim();

    if (onOpenAIAnalyst) {
      onOpenAIAnalyst(summary);
    }
  };

  return (
    <div className="space-y-6">
      {/* Collapsible Aesthetic Customizer at Top - Takes <= 1/5th screen space */}
      <div className="bg-[#111120] border border-[#2a2a50] rounded-2xl p-3 shadow-lg select-none">
        <div 
          onClick={() => setIsCustomizerOpen(!isCustomizerOpen)} 
          className="flex items-center justify-between cursor-pointer text-slate-200 hover:text-white"
        >
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-widest text-[#00ff88] font-mono">🎨 Theme & Accent Customizer</span>
            <span className="text-[10px] bg-[#ff6b1a]/15 text-[#ff6b1a] px-2 py-0.5 rounded font-bold font-mono">
              Mode: {state.bgTheme || 'midnight'} / Accent: {state.neonTheme || '#ff6b1a'} / Font: {state.fontFamily || 'inter'}
            </span>
          </div>
          <button className="text-[10px] uppercase font-black text-[#00d4ff] hover:underline font-mono">
            {isCustomizerOpen ? "[ Close Aesthetics ▴ ]" : "[ Customize Colors, Themes & Fonts ▾ ]"}
          </button>
        </div>

        {isCustomizerOpen && (
          <>
            <div className="mt-3 pt-3 border-t border-[#2a2a50]/60 grid grid-cols-1 lg:grid-cols-3 gap-4 animate-fadeIn text-left">
            {/* Color swatches */}
            <div className="space-y-2 p-1">
              <span className="text-[9px] text-[#ff6b1a] block tracking-wider font-extrabold uppercase font-mono">
                System Accents (50 Color Palettes)
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-[85px] overflow-y-auto pr-1">
                {(() => {
                  const allPalettes = [
                    { id: "Volcanic Orange", hex: "#ff6b1a" },
                    { id: "Blaze Gold", hex: "#ffaa00" },
                    { id: "Cyber Cyan", hex: "#00d4ff" },
                    { id: "Matrix Green", hex: "#00ff88" },
                    { id: "Alien Lime", hex: "#bbfb00" },
                    { id: "Synthetic Purple", hex: "#aa44ff" },
                    { id: "Vapor Pink", hex: "#ff00b8" },
                    { id: "Polar Teal", hex: "#00fbc5" },
                    { id: "Neon Rose", hex: "#ff0055" },
                    { id: "Electric Yellow", hex: "#fbff00" },
                    { id: "Crimson Red", hex: "#ff2a2a" },
                    { id: "Abyssal Blue", hex: "#4477ff" },
                    { id: "Solar Fire", hex: "#ff4500" },
                    { id: "Mint Glow", hex: "#39ff14" },
                    { id: "Deep Sea Emerald", hex: "#00b2a9" },
                    { id: "Orchid Blossom", hex: "#e066ff" },
                    { id: "Copper Flare", hex: "#d97706" },
                    { id: "Sunset Coral", hex: "#f43f5e" },
                    { id: "Electric Violet", hex: "#8b5cf6" },
                    { id: "Sunset Rose", hex: "#e11d48" },
                    { id: "Lagoon Teal", hex: "#14b8a6" },
                    { id: "Glacial Blue", hex: "#22d3ee" },
                    { id: "Retro Bronze", hex: "#b45309" },
                    { id: "Fairy Orchid", hex: "#d946ef" },
                    { id: "Fresh Citrus", hex: "#eab308" },
                    { id: "Emerald Crest", hex: "#059669" },
                    { id: "Soft Lavender", hex: "#c084fc" },
                    { id: "Bubblegum Neon", hex: "#f472b6" },
                    { id: "Plasma Pink", hex: "#ff1493" },
                    { id: "Toxic Lime", hex: "#99ff00" },
                    { id: "Deep Sapphire", hex: "#2563eb" },
                    { id: "Hot Rose", hex: "#ec4899" },
                    { id: "Cherry Blossom", hex: "#ffb7c5" },
                    { id: "Pistachio Delight", hex: "#93c572" },
                    { id: "Sunset Gold", hex: "#ff8c00" },
                    { id: "Desert Camel", hex: "#c19a6b" },
                    { id: "Galaxy Magenta", hex: "#d10056" },
                    { id: "Imperial Jade", hex: "#00a86b" },
                    { id: "Royal Indigo", hex: "#3f00ff" },
                    { id: "Cosmic Purple", hex: "#5d3fd3" },
                    { id: "Lava Ash", hex: "#4a4b4d" },
                    { id: "Coral Pink", hex: "#f88379" },
                    { id: "Cyber Punch", hex: "#ff007f" },
                    { id: "Arctic Mint", hex: "#bef264" },
                    { id: "Sky Breeze", hex: "#0ea5e9" },
                    { id: "Champagne Gold", hex: "#f7e7ce" },
                    { id: "Rusty Clay", hex: "#b45309" },
                    { id: "Amethyst Sky", hex: "#9d4edd" },
                    { id: "Toxic Lemon", hex: "#dfff00" },
                    { id: "Electric Grape", hex: "#6f2da8" },
                  ];
                  return allPalettes.map((tmpl) => (
                    <div
                      key={tmpl.id}
                      onClick={() => onSetTheme(tmpl.hex)}
                      className={`w-4 h-4 rounded-full cursor-pointer transition ${state.neonTheme === tmpl.hex || (!state.neonTheme && tmpl.hex === "#ff6b1a") ? "ring-2 ring-white scale-110" : "opacity-60 hover:opacity-100"}`}
                      style={{ backgroundColor: tmpl.hex }}
                      title={tmpl.id}
                    />
                  ));
                })()}
              </div>
            </div>

            {/* Theme engines */}
            <div className="space-y-2 p-1">
              <span className="text-[9px] text-[#aa44ff] block tracking-wider font-extrabold uppercase font-mono">
                Visual Modes (22 Theme Engines)
              </span>
              <div className="flex flex-wrap gap-1 max-h-[85px] overflow-y-auto pr-1">
                {(() => {
                  const allThemes = [
                    { id: "midnight", label: "Default Modern (Dark)" },
                    { id: "superhero", label: "Cyber Avenger (Superhero)" },
                    { id: "teens", label: "Vapor Violet (Gen Z)" },
                    { id: "swiss", label: "Swiss Mono (High-Contrast)" },
                    { id: "retro", label: "Pop Art Retro (Light)" },
                    { id: "minimal", label: "Minimal Light (Light)" },
                    { id: "cute", label: "Soft Pastel (Light)" },
                    { id: "playful", label: "Vibrant Joy (Light)" },
                    { id: "crimson", label: "Crimson Void (Dark)" },
                    { id: "hacker", label: "Terminal Hacker (Dark)" },
                    { id: "forest", label: "Redwood Canopy (Forest)" },
                    { id: "luxury", label: "Imperial Velvet (Luxury)" },
                    { id: "cyberpunk", label: "Chrome Synth (Cyberpunk)" },
                    { id: "milkyway", label: "Cosmic Nebula (Milkyway)" },
                    { id: "ocean", label: "Bioluminescent (Ocean)" },
                    { id: "cars", label: "F1 Grand Prix (Cars)" },
                    { id: "sports", label: "Stadium Turf (Sports)" },
                    { id: "wildwest", label: "Dusty Saloon (Old West)" },
                    { id: "futuristic", label: "Utopian Glass (Futuristic)" },
                    { id: "proper3d", label: "Raised Neumorphism (3D)" },
                    { id: "proper2d", label: "Comic Dot Pop-Art (2D)" },
                    { id: "mafia", label: "La Famiglia Noir (Mafia)" },
                  ];
                  return allThemes.map((bg) => (
                    <div
                      key={bg.id}
                      onClick={() => onSetBgTheme(bg.id)}
                      className={`px-2 py-1 text-[8px] font-bold rounded cursor-pointer border transition ${state.bgTheme === bg.id || (!state.bgTheme && bg.id === "midnight") ? "border-[#ff6b1a] text-[#ff6b1a] bg-[#ff6b1a]/5" : "border-[#2a2a50] text-slate-400 hover:text-slate-200"}`}
                      title={bg.label}
                    >
                      {bg.label.replace(/ \(.+\)/, '')}
                    </div>
                  ));
                })()}
              </div>
            </div>

            {/* Typography Engines */}
            <div className="space-y-2 p-1">
              <span className="text-[9px] text-[#00d4ff] block tracking-wider font-extrabold uppercase font-mono">
                Typography Engines (20 Premium Fonts)
              </span>
              <div className="flex flex-wrap gap-1 max-h-[85px] overflow-y-auto pr-1">
                {(() => {
                  const allFonts = [
                    { id: "inter", label: "Inter", family: '"Inter", sans-serif' },
                    { id: "space_grotesk", label: "Space Grotesk", family: '"Space Grotesk", sans-serif' },
                    { id: "jetbrains_mono", label: "JetBrains Mono", family: '"JetBrains Mono", monospace' },
                    { id: "fira_code", label: "Fira Code", family: '"Fira Code", monospace' },
                    { id: "vt323", label: "VT323 (8-Bit)", family: '"VT323", monospace' },
                    { id: "quicksand", label: "Quicksand", family: '"Quicksand", sans-serif' },
                    { id: "playfair_display", label: "Playfair Display", family: '"Playfair Display", serif' },
                    { id: "outfit", label: "Outfit", family: '"Outfit", sans-serif' },
                    { id: "cabin_sketch", label: "Cabin Sketch", family: '"Cabin Sketch", cursive' },
                    { id: "bebas_neue", label: "Bebas Neue", family: '"Bebas Neue", sans-serif' },
                    { id: "cinzel", label: "Cinzel", family: '"Cinzel", serif' },
                    { id: "syne", label: "Syne", family: '"Syne", sans-serif' },
                    { id: "fredoka", label: "Fredoka", family: '"Fredoka", sans-serif' },
                    { id: "unbounded", label: "Unbounded", family: '"Unbounded", sans-serif' },
                    { id: "inconsolata", label: "Inconsolata", family: '"Inconsolata", monospace' },
                    { id: "montserrat", label: "Montserrat", family: '"Montserrat", sans-serif' },
                    { id: "cardo", label: "Cardo", family: '"Cardo", serif' },
                    { id: "righteous", label: "Righteous", family: '"Righteous", sans-serif' },
                    { id: "dm_serif", label: "DM Serif", family: '"DM Serif Display", serif' },
                    { id: "press_start", label: "Press Start", family: '"Press Start 2P", monospace' }
                  ];
                  return allFonts.map((f) => (
                    <div
                      key={f.id}
                      onClick={() => onSetFontFamily(f.id)}
                      className={`px-2 py-0.5 text-[8px] font-bold rounded cursor-pointer border transition ${state.fontFamily === f.id || (!state.fontFamily && f.id === "inter") ? "border-[#ff6b1a] text-[#ff6b1a] bg-[#ff6b1a]/5" : "border-[#2a2a50] text-slate-400 hover:text-slate-200"}`}
                      style={{ fontFamily: f.family }}
                      title={f.label}
                    >
                      {f.label}
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>
          
          {/* Invisible/Sleek Toggle for Aesthetic banners & custom quotes */}
          <div className="mt-3 pt-2.5 border-t border-[#2a2a50]/40 flex flex-col sm:flex-row sm:items-center sm:justify-between text-[10px] font-mono text-slate-500 gap-2">
            <span>🌌 SYSTEM COMPONENT VISIBILITY: AMBIENT THEME MATRIX</span>
            <button
              onClick={() => {
                const nextClosed = !bannerClosed;
                localStorage.setItem("omnilife_banner_closed", nextClosed ? "true" : "false");
                setBannerClosed(nextClosed);
                window.dispatchEvent(new Event("omnilife_banner_toggle"));
              }}
              className="px-2.5 py-1 rounded bg-[#ff6b1a]/10 hover:bg-[#ff6b1a]/25 border border-[#ff6b1a]/30 text-slate-350 hover:text-[#00ff88] transition cursor-pointer font-black tracking-wider uppercase inline-flex items-center gap-1 self-start sm:self-auto"
            >
              {bannerClosed ? "👁️ Retrieve Ambient Theme Banner" : "🙈 Dismiss Ambient Tone Banner"}
            </button>
          </div>
        </>
      )}
      </div>

      {/* Overview Head */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#111120] pb-5">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white font-display">
            {greeting === "MORNING"
              ? "Morning"
              : greeting === "AFTERNOON"
                ? "Afternoon"
                : "Evening"}
            ,{" "}
            <span className="text-[#ff6b1a] uppercase">
              {state.profile.name || "Explorer"}
            </span>
          </h2>
          <p className="text-xs uppercase tracking-widest text-[#a1a1aa] mt-1 font-mono">
            // {fmtDate(today)}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onNavigate("daily")}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-[#ff6b1a] text-white rounded-xl hover:bg-[#ff9040] transition-all duration-200 uppercase tracking-widest cursor-pointer"
          >
            <Play size={12} className="fill-white" />
            TODAY'S LOG
          </button>
        </div>
      </div>

      {/* Metrics Bento Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <div className="bg-[#111120] border border-[#2a2a50] rounded-2xl p-4 text-center hover:border-slate-700 transition">
          <p className="text-[10px] tracking-widest text-slate-500 uppercase font-black font-mono">
            DONE
          </p>
          <p className="text-2xl font-black text-emerald-400 mt-2 font-display">
            {stats.done}
          </p>
          <p className="text-[10px] text-slate-500 mt-1">
            of {stats.total} items
          </p>
        </div>
        <div className="bg-[#111120] border border-[#2a2a50] rounded-2xl p-4 text-center hover:border-slate-700 transition">
          <p className="text-[10px] tracking-widest text-slate-500 uppercase font-black font-mono">
            COMPLETION
          </p>
          <p className="text-2xl font-black text-[#ff6b1a] mt-2 font-display">
            {stats.pct}%
          </p>
          <p className="text-[10px] text-slate-500 mt-1">day progress</p>
        </div>
        <div className="bg-[#111120] border border-[#2a2a50] rounded-2xl p-4 text-center hover:border-slate-700 transition">
          <p className="text-[10px] tracking-widest text-slate-500 uppercase font-black font-mono">
            HOURS
          </p>
          <p className="text-2xl font-black text-sky-400 mt-2 font-display">
            {stats.hrs.toFixed(1)}h
          </p>
          <p className="text-[10px] text-slate-500 mt-1">logged time</p>
        </div>
        <div className="bg-[#111120] border border-[#2a2a50] rounded-2xl p-4 text-center hover:border-slate-700 transition">
          <p className="text-[10px] tracking-widest text-slate-500 uppercase font-black font-mono">
            REPS
          </p>
          <p className="text-2xl font-black text-purple-400 mt-2 font-display">
            {stats.reps}
          </p>
          <p className="text-[10px] text-slate-500 mt-1">completed reps</p>
        </div>
        <div className="bg-[#111120] border border-[#2a2a50] rounded-2xl p-4 text-center hover:border-slate-700 transition">
          <p className="text-[10px] tracking-widest text-slate-500 uppercase font-black font-mono">
            FEELING
          </p>
          <p
            className={`text-2xl font-black mt-2 font-display ${satColors[Math.round(stats.sat)] || "text-[#ff6b1a]"}`}
          >
            {stats.sat > 0 ? stats.sat.toFixed(1) : "—"}
          </p>
          <p className="text-[10px] text-slate-500 mt-1">satisfaction</p>
        </div>
        <div className="bg-[#111120] border border-[#2a2a50] rounded-2xl p-4 text-center hover:border-slate-700 transition">
          <p className="text-[10px] tracking-widest text-slate-500 uppercase font-black font-mono">
            WEEK AVG
          </p>
          <p className="text-2xl font-black text-teal-400 mt-2 font-display">
            {weekAvg}%
          </p>
          <p className="text-[10px] text-slate-500 mt-1">average score</p>
        </div>
        <div className="bg-[#111120] border border-[#2a2a50] rounded-2xl p-4 text-center hover:border-slate-700 transition col-span-2 md:col-span-1">
          <p className="text-[10px] tracking-widest text-slate-500 uppercase font-black font-mono">
            BEST STREAK
          </p>
          <p className="text-2xl font-black text-amber-400 mt-2 flex items-center justify-center gap-1 font-display">
            <Flame size={16} className="text-amber-400 fill-amber-400" />
            {streak}
          </p>
          <p className="text-[10px] text-slate-500 mt-1">active days</p>
        </div>
      </div>

      {/* Climate & Biosphere Station Console */}
      <DashboardWeather />

      {/* Two Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Category Breakdown */}
        <div className="bg-[#111120] border border-[#2a2a50] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 border-b border-[#2a2a50] pb-3 mb-4">
            <TrendingUp size={16} className="text-[#ff6b1a]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
              TODAY'S CATEGORY PROGRESS
            </h3>
          </div>

          <div className="space-y-3">
            {CATS.map((cat) => {
              const items = state.items[cat.id] || [];
              const done = items.filter(
                (it) => getDayD(today, cat.id, it).status === "done",
              ).length;
              const hrs = items.reduce(
                (sum, it) => sum + (getDayD(today, cat.id, it).hours || 0),
                0,
              );
              const pct = items.length
                ? Math.round((done / items.length) * 100)
                : 0;

              return (
                <div
                  key={cat.id}
                  onClick={() => onNavigate("daily")}
                  className="group flex items-center justify-between gap-4 p-3 bg-[#0d0d1a] border border-[#2a2a50]/60 rounded-xl hover:border-slate-700 hover:bg-[#111120]/40 transition duration-200 cursor-pointer"
                >
                  <div className="min-w-[110px]">
                    <span
                      className="text-xs font-extrabold uppercase tracking-wide flex items-center gap-1.5 font-display"
                      style={{ color: cat.neon }}
                    >
                      <span className="text-xs">{cat.icon}</span>
                      {cat.label}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-400 font-semibold font-mono">
                    {done}/{items.length}
                  </div>

                  <div className="flex-1 max-w-[120px] bg-[#111120] h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ backgroundColor: cat.neon, width: `${pct}%` }}
                    />
                  </div>

                  <div className="flex items-center gap-2 min-w-[70px] justify-end">
                    {hrs > 0 && (
                      <span className="text-[10px] text-slate-500 font-bold uppercase font-mono">
                        {hrs.toFixed(1)}h
                      </span>
                    )}
                    <span
                      className="text-xs font-bold transition group-hover:scale-105 font-mono"
                      style={{ color: cat.neon }}
                    >
                      {pct}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Reminders Panel */}
        <div className="bg-[#111120] border border-[#2a2a50] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#2a2a50] pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Bell size={16} className="text-rose-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                UPCOMING CALENDAR & REMINDERS
              </h3>
            </div>
            <button
              onClick={() => onNavigate("reminders")}
              className="text-[10px] text-[#ff6b1a] hover:text-[#00d4ff] hover:underline uppercase tracking-wider font-bold font-mono"
            >
              Manage (
              {state.reminders.filter((r) => r.status !== "done").length}) ▸
            </button>
          </div>

          <div className="space-y-2">
            {upcomingReminders.length > 0 ? (
              upcomingReminders.map((rem) => {
                const isOverdue = rem.dueDate < today;
                const isToday = rem.dueDate === today;

                return (
                  <div
                    key={rem.id}
                    className={`flex items-center justify-between p-3 bg-[#0d0d1a]/80 border rounded-xl transition duration-150 ${isOverdue ? "border-rose-500/20 bg-rose-950/10" : "border-[#2a2a50]"}`}
                  >
                    <div>
                      <h4 className="text-xs font-bold text-slate-200">
                        {rem.title}
                      </h4>
                      <p className="text-[10px] text-slate-500 mt-1 font-semibold font-mono">
                        {rem.type} {rem.time && `at ${rem.time}`}
                      </p>
                    </div>

                    <span
                      className={`text-[9px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider font-mono ${
                        isOverdue
                          ? "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                          : isToday
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                            : "bg-[#ff6b1a]/10 text-[#ff6b1a] border border-indigo-550/20"
                      }`}
                    >
                      {isOverdue
                        ? "OVERDUE"
                        : isToday
                          ? "TODAY"
                          : fmtShort(rem.dueDate)}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="h-44 flex flex-col items-center justify-center border border-dashed border-[#2a2a50] rounded-xl">
                <Bell size={24} className="text-slate-600" />
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-2 font-mono">
                  // No pending alerts
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Week Grid Block */}
      <div className="bg-[#111120] border border-[#2a2a50] rounded-2xl p-5">
        <div className="flex items-center justify-between border-b border-[#2a2a50] pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-[#ff6b1a]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
              WEEKLY TRACK TIMELINE
            </h3>
          </div>
          <span className="text-[10px] text-slate-500 font-mono uppercase">
            // focus week
          </span>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day, idx) => {
            const isToday = day === today;
            const ds = dayStats(day);
            const daysNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

            return (
              <div
                key={day}
                onClick={() => {
                  onSetDate(day);
                  onNavigate("daily");
                }}
                className={`text-center p-3 rounded-xl border transition-all duration-200 cursor-pointer select-none ${
                  isToday
                    ? "bg-[#ff6b1a]/10 border-[#ff6b1a]/40 text-[#ff6b1a] shadow-md shadow-indigo-600/5"
                    : "bg-[#0d0d1a] border-[#1e1e38] hover:border-slate-700"
                }`}
              >
                <p
                  className={`text-[9px] font-extrabold uppercase ${isToday ? "text-[#ff6b1a]" : "text-slate-500"} font-mono`}
                >
                  {daysNames[idx]}
                </p>
                <p
                  className={`text-sm font-black mt-1.5 ${isToday ? "text-[#00d4ff]" : "text-slate-200"} font-display`}
                >
                  {ds.pct}%
                </p>
                <div className="mt-1 flex items-center justify-center gap-1 text-[9px]">
                  {ds.hrs > 0 ? (
                    <span className="text-sky-400 font-bold font-mono">
                      {ds.hrs.toFixed(1)}h
                    </span>
                  ) : (
                    <span className="text-transparent font-bold font-mono">
                      0h
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
