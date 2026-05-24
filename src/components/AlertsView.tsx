import React, { useState, useEffect } from 'react';
import { AppState, Reminder } from '../types';
import { BellRing, Check, Clock, AlertTriangle, VolumeX } from 'lucide-react';
import { todayStr, fmtShort } from '../utils/date';
import { getFileHandle } from '../utils/ghost';

interface AlertsViewProps {
  state: AppState;
  onToggleReminder: (id: string) => void;
  onMuteReminder: (id: string) => void;
  onToggleMuteSystemAlerts: () => void;
  onNavigate: (viewId: string) => void;
}

export const AlertsView: React.FC<AlertsViewProps> = ({ state, onToggleReminder, onMuteReminder, onToggleMuteSystemAlerts, onNavigate }) => {
  const [ghostOffline, setGhostOffline] = useState(false);
  
  const today = todayStr();
  const timeStr = new Date().toTimeString().slice(0, 5); // HH:MM

  useEffect(() => {
    const checkGhost = async () => {
      try {
        const handle = await getFileHandle();
        setGhostOffline(!handle);
      } catch (e) {
        setGhostOffline(true);
      }
    };
    checkGhost();
  }, []);

  const isDueOrOverdue = (r: Reminder) => {
    if (r.status === 'done') return false;
    if (r.enableAlert === false) return false; // Must have alert enabled to show in AlertsView specifically?
    // Actually, AlertsView might list all alerts. The user wanted non-stop of sync as under alert option as well, and "any alert I tell you put it under the alert option".
    // For Reminders specifically, let's respect enableAlert!
    
    if (r.dueDate < today) return true;
    
    if (r.dueDate === today) {
      if (!r.time) return true; // All day
      const targetTime = new Date();
      const pNow = new Date();
      const [h, m] = r.time.split(':').map(Number);
      targetTime.setHours(h, m, 0, 0);
      
      if (r.alertOffset) {
         targetTime.setMinutes(targetTime.getMinutes() - r.alertOffset);
      }
      
      if (pNow >= targetTime) return true;
    }
    return false;
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="space-y-1">
        <h2 className="text-3xl font-black tracking-tighter text-white font-display uppercase">Developer Alerts</h2>
        <p className="text-slate-400 font-medium text-xs">Manage system warnings, memory sync status, and internal constraints.</p>
      </div>

      <div className="space-y-2">
        {ghostOffline ? (
          <div className="flex items-center gap-3 bg-[#111120] border border-orange-500/50 p-4 rounded-xl shadow-[0_4px_24px_rgba(244,153,63,0.1)]">
            <div className="w-10 h-10 shrink-0 bg-orange-500/10 text-orange-500 rounded-full flex items-center justify-center animate-pulse">
              <AlertTriangle size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-white font-bold truncate">Ghost Sync Offline</h4>
              <div className="flex items-center mt-1 text-[10px] text-slate-400 font-mono tracking-wider">
                <span className="leading-tight">Your data is currently only saved in browser memory and could be lost. Please navigate to settings to re-link your local Ghost Sync file.</span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button 
                onClick={onToggleMuteSystemAlerts}
                className={`w-10 h-10 ${state.muteGhostAlerts ? 'bg-orange-500/20 text-orange-400 hover:bg-orange-500 hover:text-black' : 'bg-[#2a2a50] text-[#a1a1aa] hover:bg-orange-500 hover:text-black'} rounded-xl transition flex items-center justify-center shadow-lg`}
                title={state.muteGhostAlerts ? "Unmute popup alerts" : "Mute continuous popup alerts for Ghost Sync"}
              >
                <VolumeX size={18} />
              </button>
              <button 
                onClick={() => onNavigate('settings')}
                className="shrink-0 px-4 h-10 bg-[#2a2a50] text-[#ffaa44] hover:bg-[#ffaa44] hover:text-black rounded-xl transition flex items-center justify-center shadow-lg font-bold text-[10px] uppercase tracking-widest"
              >
                Fix
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center p-10 bg-[#111120] border border-[#2a2a50] rounded-2xl text-slate-500 text-xs font-bold uppercase tracking-widest">
            No active developer alerts. System healthy.
          </div>
        )}
      </div>
    </div>
  );
};
