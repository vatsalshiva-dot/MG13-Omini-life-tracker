import React, { useState, useEffect } from "react";
import { X, Bell, AlertOctagon, Zap } from "lucide-react";
import { Reminder } from "../types";

interface CreateReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTitle?: string;
  defaultNotes?: string;
  onSave: (reminder: Omit<Reminder, "id" | "status">) => void;
  mode?: "reminder" | "alert";
}

export const CreateReminderModal: React.FC<CreateReminderModalProps> = ({
  isOpen,
  onClose,
  defaultTitle = "",
  defaultNotes = "",
  onSave,
  mode = "reminder",
}) => {
  const [title, setTitle] = useState(defaultTitle);
  const [dueDate, setDueDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [time, setTime] = useState("09:00");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [enableAlert, setEnableAlert] = useState(true);
  const [notes, setNotes] = useState(defaultNotes);

  // Sync default fields based on mode
  useEffect(() => {
    setTitle(defaultTitle);
    setNotes(defaultNotes);
    if (mode === "alert") {
      setPriority("high");
      setEnableAlert(true);
    } else {
      setPriority("medium");
      setEnableAlert(true);
    }
  }, [defaultTitle, defaultNotes, mode, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    onSave({
      title: mode === "alert" ? `[ALERT] ${title}` : title,
      dueDate,
      time,
      priority,
      notes,
      type: mode === "alert" ? "alert" : "finance",
      enableAlert,
      repeat: "none",
    });

    onClose();
  };

  const isAlertMode = mode === "alert";

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className={`bg-[#111120] border ${isAlertMode ? "border-rose-500/40 shadow-rose-500/10" : "border-[#2a2a50] shadow-[#00d4ff]/5"} rounded-2xl w-full max-w-md shadow-2xl flex flex-col transition-all duration-300`}>
        <div className="flex items-center justify-between p-4 border-b border-[#2a2a50]">
          <div className="flex items-center gap-2">
            {isAlertMode ? (
              <div className="flex items-center gap-2 text-rose-400">
                <AlertOctagon size={18} className="animate-pulse" />
                <h3 className="font-bold uppercase tracking-widest text-xs">
                  Create High-Urgency System Alert
                </h3>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-[#00d4ff]">
                <Bell size={18} />
                <h3 className="font-bold uppercase tracking-widest text-xs">
                  Create Calendar Reminder
                </h3>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white transition"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4 flex flex-col">
          <div className="p-2.5 bg-[#0a0a14] rounded-lg border border-[#1e1e38] text-[10px] text-slate-400 leading-relaxed uppercase tracking-wider font-mono">
            {isAlertMode ? (
              <span className="text-rose-400 font-extrabold">🚨 Mode: Active Audio & Active Red Popup Notification. Overrides normal planner schedules.</span>
            ) : (
              <span className="text-[#00d4ff] font-extrabold">📅 Mode: Standard visual diary tracker. Logs in your calendar list planner view.</span>
            )}
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-wider">
              {isAlertMode ? "Alert context details" : "Reminder Title"}
            </label>
            <input
              required
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#0d0d1a] border border-[#2a2a50] rounded-lg px-3 py-2 text-xs text-slate-100 font-bold focus:outline-none focus:border-[#00d4ff]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-wider">
                Date
              </label>
              <input
                required
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-[#0d0d1a] border border-[#2a2a50] rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-[#00d4ff] color-scheme-dark"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-wider">
                Time (24h)
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-[#0d0d1a] border border-[#2a2a50] rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-[#00d4ff] color-scheme-dark"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-wider">
              Priority Ranking
            </label>
            <select
              value={priority}
              onChange={(e) =>
                setPriority(e.target.value as "low" | "medium" | "high")
              }
              className="w-full bg-[#0d0d1a] border border-[#2a2a50] rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-[#00d4ff]"
            >
              <option value="low">Low (Standard passive item)</option>
              <option value="medium">Medium (Regular Notification)</option>
              <option value="high">High (URGENT / AUDIO SYSTEM ALARM)</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-wider">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-[#0d0d1a] border border-[#2a2a50] rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-[#00d4ff] min-h-[50px]"
            />
          </div>

          <label className="flex items-center gap-2 select-none cursor-pointer mt-2">
            <input
              type="checkbox"
              checked={enableAlert}
              onChange={(e) => setEnableAlert(e.target.checked)}
              className={`accent-${isAlertMode ? "rose-500" : "[#00d4ff]"}`}
            />
            <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">
              Trigger Active System Toast overlay
            </span>
          </label>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className={`font-black px-6 py-2 rounded-lg text-xs tracking-wider uppercase font-mono shadow-md whitespace-nowrap transition ${
                isAlertMode
                  ? "bg-rose-500 text-white hover:bg-rose-600"
                  : "bg-[#00d4ff] text-black hover:bg-[#00b8e6]"
              }`}
            >
              {isAlertMode ? "🚨 Register Active Alert" : "📅 Register Reminder"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
