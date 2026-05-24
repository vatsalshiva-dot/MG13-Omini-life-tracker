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
      </div>

      <StepByStepGuideModal
        isOpen={selectedGuide !== null}
        onClose={() => setSelectedGuide(null)}
        activeView={selectedGuide || "dashboard"}
      />
    </div>
  );
};
