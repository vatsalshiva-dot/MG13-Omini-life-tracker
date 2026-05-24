import React from "react";
import { AppState, SyncConfig } from "../types";
import { CATS } from "../utils/storage";
import {
  Home,
  Clipboard,
  Target,
  BarChart2,
  Calendar,
  Bell,
  Clock,
  Book,
  BookOpen, // New
  Share2,
  Search,
  Settings,
  Cloud,
  Download,
  Bot,
  HelpCircle,
  AlertCircle,
  Headphones,
  X,
  Wind,
  Droplets,
  CloudLightning,
  Waves,
  Coffee,
  Music,
  Volume2,
} from "lucide-react";

interface SidebarProps {
  state: AppState;
  activeView: string;
  onNavigate: (viewId: string) => void;
  syncCfg: SyncConfig;
  isSyncing: boolean;
  onExportJSON: () => void;
  onExportCSV: () => void;
  hasSystemAlerts?: boolean;
  onLoadDemo?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  state,
  activeView,
  onNavigate,
  syncCfg,
  isSyncing,
  onExportJSON,
  onExportCSV,
  hasSystemAlerts = false,
  onLoadDemo = () => {},
}) => {
  const profile = state.profile || { name: "", tagline: "" };

  // Calculate initials
  const initials = React.useMemo(() => {
    const name = profile.name || "";
    if (!name) return "?";
    return name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }, [profile.name]);

  // Alert Badge count
  const todayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  const userAlertsCount = React.useMemo(() => {
    const today = todayStr();
    return state.reminders.filter(
      (r) => r.status !== "done" && r.dueDate <= today,
    ).length;
  }, [state.reminders]);

  const systemAlertsCount = hasSystemAlerts ? 1 : 0;

  const sections = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: <Home size={14} />,
      section: "OVERVIEW",
    },
    {
      id: "daily",
      label: "Daily Tracker",
      icon: <Clipboard size={14} />,
      section: "DAILY LOG",
    },
    {
      id: "journal",
      label: "Daily Journal",
      icon: <Book size={14} />,
      section: "DAILY LOG",
    },
    {
      id: "goals",
      label: "Goals & Targets",
      icon: <Target size={14} />,
      section: "GOALS & ANALYSIS",
    },
    {
      id: "analytics",
      label: "Analytics",
      icon: <BarChart2 size={14} />,
      section: "GOALS & ANALYSIS",
    },
    {
      id: "calendar",
      label: "Calendar View",
      icon: <Calendar size={14} />,
      section: "GOALS & ANALYSIS",
    },
    {
      id: "ai_analyst",
      label: "AI Analyst Hub",
      icon: <Bot size={14} />,
      section: "EXTENSIONS",
    },
    {
      id: "focus_audio",
      label: "Focus Audio",
      icon: <Headphones size={14} />,
      section: "EXTENSIONS",
    },
    {
      id: "expeditions",
      label: "Expeditions",
      icon: <Search size={14} />,
      section: "EXTENSIONS",
    },
    {
      id: "finances",
      label: "Finances",
      icon: <Target size={14} />,
      section: "EXTENSIONS",
    },
    {
      id: "sketchpad",
      label: "Sketchpad",
      icon: <Share2 size={14} />,
      section: "EXTENSIONS",
    },
    {
      id: "reminders",
      label: "Reminders & Alerts",
      icon: <Bell size={14} />,
      badgeCount: userAlertsCount,
      section: "MANAGE",
    },
    {
      id: "pomo",
      label: "Pomodoro Clock",
      icon: <Clock size={14} />,
      section: "MANAGE",
    },
    {
      id: "synopsis",
      label: "Synopsis & Share",
      icon: <Share2 size={14} />,
      section: "MANAGE",
    },
    {
      id: "search",
      label: "Search",
      icon: <Search size={14} />,
      section: "MANAGE",
    },
    {
      id: "settings",
      label: "Settings",
      icon: <Settings size={14} />,
      section: "MANAGE",
    },
    {
      id: "alerts",
      label: "Developer Alerts",
      icon: <AlertCircle size={14} />,
      badgeCount: systemAlertsCount,
      section: "MANAGE",
    },
    {
      id: "guides",
      label: "Module Guides",
      icon: <BookOpen size={14} />,
      section: "MANAGE",
    },
    {
      id: "help",
      label: "Help & Info",
      icon: <HelpCircle size={14} />,
      section: "MANAGE",
    },
    {
      id: "demo",
      label: "Load Live Demo",
      icon: <CloudLightning size={14} />,
      section: "MANAGE",
    },
  ];

  const groupSections: Record<string, typeof sections> = {};
  sections.forEach((s) => {
    if (!groupSections[s.section]) groupSections[s.section] = [];
    groupSections[s.section].push(s);
  });

  // Bottom export drawers

  return (
    <nav className="w-[210px] min-w-[210px] bg-[#0d0d1a] border-r border-[#111120] flex flex-col h-screen sticky top-0 overflow-y-auto font-semibold scrollbar-none select-none">
      {/* App brand */}
      <div
        className="p-4 border-b border-[#111120] cursor-pointer hover:bg-[#111120]/40 transition"
        onClick={() => onNavigate("dashboard")}
      >
        <h1 className="text-sm font-extrabold tracking-wider text-white">
          OMNILIFE{" "}
          <span id="brand-accent" className="text-[#ff6b1a]">
            TRACKER
          </span>
        </h1>
        <p className="text-[7.5px] text-slate-500 uppercase tracking-widest mt-1 font-mono">
          // BENTO SYSTEM V5.2
        </p>
      </div>

      {/* Profile Card */}
      <div
        className="flex items-center gap-3 p-3.5 border-b border-[#111120] hover:bg-[#111120]/30 transition cursor-pointer"
        onClick={() => onNavigate("settings")}
      >
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-indigo-400 flex items-center justify-center text-xs font-black text-white flex-shrink-0 shadow-lg shadow-indigo-500/10">
          {initials}
        </div>
        <div className="min-w-0 text-left">
          <p className="text-xs font-extrabold text-slate-200 truncate uppercase">
            {profile.name || "Set Up Profile"}
          </p>
          <p className="text-[8px] text-slate-500 truncate mt-0.5 uppercase tracking-wider">
            {profile.tagline || "click to configure ▸"}
          </p>
        </div>
      </div>

      {/* Sidebar Links Sections */}
      <div className="flex-1 p-2 space-y-4">
        {Object.entries(groupSections).map(([groupTitle, list]) => (
          <div key={groupTitle} className="space-y-1">
            <span className="text-[8px] font-black text-slate-600 block pl-2 mb-2 tracking-widest uppercase font-mono">
              {groupTitle}
            </span>
            <div className="space-y-0.5">
              {list.map((s) => {
                const isActive = activeView === s.id;
                return (
                  <button
                    key={s.id}
                    id={`sidebar-nav-${s.id}`}
                    onClick={() => {
                      if (s.id === "demo") {
                        onLoadDemo();
                      } else {
                        onNavigate(s.id);
                      }
                    }}
                    className={`nav-item w-full flex items-center gap-3 px-3 py-1.5 text-xs font-bold rounded-lg border uppercase transition text-left tracking-wide select-none cursor-pointer ${
                      isActive
                        ? "bg-[#ff6b1a]/10 text-[#ff6b1a] border-[#ff6b1a]/30 font-semibold"
                        : "border-transparent text-slate-400 hover:bg-[#111120]/50 hover:text-slate-200"
                    }`}
                  >
                    <span
                      className={`shrink-0 ${isActive ? "text-[#ff6b1a]" : "text-slate-500"}`}
                    >
                      {s.icon}
                    </span>
                    <span className="truncate">{s.label}</span>
                    {s.badgeCount !== undefined && s.badgeCount > 0 && (
                      <span className="ml-auto bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[8px] font-black font-semibold rounded px-1.5 tracking-wider py-0.5 font-mono leading-none">
                        {s.badgeCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Sync Status Banner */}
      <div
        className="border-t border-[#111120] p-2.5 hover:bg-[#111120]/30 transition cursor-pointer shrink-0"
        onClick={() => onNavigate("settings")}
      >
        <div className="flex items-center gap-2 pl-1 select-none text-[8.5px] uppercase font-black tracking-widest">
          <span
            className={`w-2 h-2 rounded-full ${
              syncCfg.provider === "none"
                ? "bg-zinc-600"
                : isSyncing
                  ? "bg-indigo-400 animate-pulse"
                  : syncCfg.lastSync === "error"
                    ? "bg-rose-500"
                    : "bg-emerald-500 font-semibold"
            }`}
          />
          <span className={isSyncing ? "text-[#ff6b1a]" : "text-slate-400"}>
            {syncCfg.provider === "none"
              ? "SYNC: OFF"
              : isSyncing
                ? "SYNCING..."
                : syncCfg.lastSync === "error"
                  ? "SYNC: ERROR"
                  : "SYNC ACTIVE"}
          </span>
        </div>
      </div>

      {/* Bottom export drawers */}
      <div className="border-t border-[#111120] p-2 space-y-1 text-center bg-[#0d0d1a] shrink-0 font-bold uppercase tracking-widest">
        <button
          onClick={onExportJSON}
          className="w-full flex items-center justify-center gap-1.5 py-1 text-[9px] text-slate-300 bg-[#111120] border border-[#2a2a50] hover:border-slate-700 rounded transition cursor-pointer"
        >
          <Download size={10} />
          JSON DATABASE
        </button>
        <button
          onClick={onExportCSV}
          className="w-full flex items-center justify-center gap-1.5 py-1 text-[9px] text-white bg-[#ff6b1a] hover:bg-[#ff6b1a] border border-transparent rounded transition cursor-pointer"
        >
          <Download size={10} />
          CSV SHEET
        </button>
      </div>
    </nav>
  );
};
