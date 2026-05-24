import React from 'react';
import { AppState, TrackerCategory } from '../types';
import { todayStr } from '../utils/date';
import { 
  Bell, Volume2, Award, Clock, AlertTriangle, Play, Square, RefreshCcw, Headphones
} from 'lucide-react';

interface PomoViewProps {
  state: AppState;
  
  // Pomodoro shared values/functions
  pomoState: 'idle' | 'work' | 'break';
  pomoTimeLeft: string;
  pomoPercent: number; // 0 to 1
  pomoTaskName: string | null;
  pomoTaskCat: TrackerCategory | null;
  pomoWorkMin: number;
  pomoBrkMin: number;
  pomoPreset: string;
  onStartPomo: () => void;
  onStopPomo: () => void;
  onSetPomoPreset: (preset: string) => void;
  onSetPomoCustom: (work: number, brk: number) => void;
  audioTrack?: string;
  audioVolume?: number;
  onSetAudioTrack?: (t: string) => void;
  onSetAudioVolume?: (v: number) => void;
  onNavigate?: (route: string) => void;
}

export const PomoView: React.FC<PomoViewProps> = ({
  state,
  pomoState,
  pomoTimeLeft,
  pomoPercent,
  pomoTaskName,
  pomoTaskCat,
  pomoWorkMin,
  pomoBrkMin,
  pomoPreset,
  onStartPomo,
  onStopPomo,
  onSetPomoPreset,
  onSetPomoCustom,
  audioTrack = 'none',
  audioVolume = 0.5,
  onSetAudioTrack = (t: string) => {},
  onSetAudioVolume = (v: number) => {},
  onNavigate = (route: string) => {}
}) => {
  const today = todayStr();
  
  // List only work pomodoros for today
  const todaySessions = state.pomoSessions.filter(s => s.date === today);
  const workSessions = todaySessions.filter(s => s.type === 'work');
  
  // Calculate analytics
  const completedCount = workSessions.filter(s => s.status === 'completed').length;
  const failedCount = workSessions.filter(s => s.status === 'interrupted' || s.status === 'failed').length;
  const totalMins = workSessions.reduce((sum, s) => sum + s.duration, 0);
  const totalHoursLogged = Math.round((totalMins / 60) * 100) / 100;

  // Render arc math
  const circum = 565.49; // 2 * Math.PI * 90
  const dashoffset = circum * (1 - pomoPercent);

  // Category tags colors
  const catColors: Record<string, string> = {
    studies: 'bg-[#00d4ff]',
    habits: 'bg-[#00ff88]',
    leisure: 'bg-[#ff6b1a]',
    custom: 'bg-[#aa44ff]'
  };

  const handleCustomWorkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSetPomoCustom(+e.target.value, pomoBrkMin);
  };

  const handleCustomBrkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSetPomoCustom(pomoWorkMin, +e.target.value);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#1e1e38] pb-4">
        <div>
          <h2 className="text-xl font-extrabold tracking-wider text-[#ff6b1a]">
            ⏱ POMODORO <span className="text-slate-100">TIMER</span>
          </h2>
          <p className="text-xs uppercase tracking-widest text-slate-500 mt-1">
            FOCUS SESSIONS · AUTO-LOG HOURS · RECORD INTERRUPTION DELAYS
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left Column: Progress Ring & Selection */}
        <div className="bg-[#0d0d1a] border border-[#1e1e38] rounded-xl p-6 text-center flex flex-col items-center">
          <p className="text-[10px] font-black tracking-widest text-slate-500 uppercase mb-4">
            STATUS: {pomoState === 'work' ? '⚡ ENGAGED' : pomoState === 'break' ? '☕ TAKING BREAK' : '○ IDLE READY'}
          </p>

          {/* SVG Progress Arc Clock */}
          <div className="relative w-52 h-52 my-3 select-none">
            <svg width="208" height="208" className="transform -rotate-90 absolute top-0 left-0">
              {/* Backing Ring */}
              <circle 
                cx="104" cy="104" r="90" 
                fill="none" 
                stroke="#1e1e38" 
                strokeWidth="6"
              />
              {/* Foreground Indicator */}
              <circle 
                cx="104" cy="104" r="90" 
                fill="none" 
                stroke={pomoState === 'break' ? '#00ff88' : '#ff6b1a'} 
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={String(circum)}
                strokeDashoffset={String(dashoffset)}
                className="transition-all duration-300 ease-linear"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-3xl font-black text-slate-100 font-mono tracking-wide">{pomoTimeLeft}</div>
              <div className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                {pomoState === 'work' ? `${pomoWorkMin} MIN WORK` : pomoState === 'break' ? `${pomoBrkMin} MIN BAR` : `${pomoWorkMin} min focus`}
              </div>
            </div>
          </div>

          <div className="text-sm font-black text-[#00d4ff] mt-4 max-w-sm truncate h-7 select-none">
            {pomoTaskName ? (
              <span>ACTIVE TASK: {pomoTaskName}</span>
            ) : (
              <span className="text-slate-500 font-mono sm:text-xs">// Click ⏱ POMO on Daily Checklist to lock focus</span>
            )}
          </div>

          {/* Controls */}
          <div className="flex gap-3 my-6">
            {pomoState === 'idle' ? (
              <button 
                onClick={onStartPomo}
                disabled={!pomoTaskName}
                className="px-6 py-2 bg-[#ff6b1a] text-black font-extrabold text-xs uppercase tracking-widest rounded-lg hover:bg-[#ff9040] disabled:opacity-35 disabled:cursor-not-allowed transition"
              >
                ▶ START SESSION
              </button>
            ) : (
              <button 
                onClick={onStopPomo}
                className="px-6 py-2 border border-rose-500 text-rose-500 bg-rose-500/5 font-extrabold text-xs uppercase tracking-widest rounded-lg hover:bg-rose-500/15 transition animate-pulse"
              >
                ⏹ STOP SESSION
              </button>
            )}

            <button
               onClick={() => {
                  if (audioTrack === 'none') {
                     onSetAudioTrack('brown');
                  } else {
                     onSetAudioTrack('none');
                  }
               }}
               className={`flex items-center justify-center gap-1.5 px-4 rounded-lg font-extrabold text-[10px] uppercase tracking-widest border transition ${
                 audioTrack !== 'none' ? 'border-[#aa44ff] text-[#aa44ff] bg-[#aa44ff]/10' : 'border-[#1e1e38] text-slate-400 hover:border-slate-500'
               }`}
            >
               <Headphones size={14} /> AUDIO {audioTrack !== 'none' ? 'ON' : 'OFF'}
            </button>
          </div>

          <p className="text-[9px] text-slate-500 mt-2 hover:text-[#aa44ff] cursor-pointer" onClick={() => onNavigate('focus_audio')}>
             ▹ OPEN FOCUS AUDIO CONTROLS
          </p>

          {/* Presets Grid */}
          <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-2.5 mt-6">focus cycles presets</p>
          <div className="flex gap-2">
            <button 
              onClick={() => onSetPomoPreset('classic')}
              className={`px-3 py-1 text-[10px] font-extrabold rounded uppercase tracking-wider border ${
                pomoPreset === 'classic' 
                  ? 'border-[#ff6b1a] text-[#ff6b1a]' 
                  : 'border-[#1e1e38] text-slate-400 hover:border-slate-700'
              }`}
            >
              Classic 25/5
            </button>
            <button 
              onClick={() => onSetPomoPreset('deep')}
              className={`px-3 py-1 text-[10px] font-extrabold rounded uppercase tracking-wider border ${
                pomoPreset === 'deep' 
                  ? 'border-[#ff6b1a] text-[#ff6b1a]' 
                  : 'border-[#1e1e38] text-slate-400 hover:border-slate-700'
              }`}
            >
              Deep work 50/10
            </button>
            <button 
              onClick={() => onSetPomoPreset('ultra')}
              className={`px-3 py-1 text-[10px] font-extrabold rounded uppercase tracking-wider border ${
                pomoPreset === 'ultra' 
                  ? 'border-[#ff6b1a] text-[#ff6b1a]' 
                  : 'border-[#1e1e38] text-slate-400 hover:border-slate-700'
              }`}
            >
              Ultradian 90/20
            </button>
            <button 
              onClick={() => onSetPomoPreset('custom')}
              className={`px-3 py-1 text-[10px] font-extrabold rounded uppercase tracking-wider border ${
                pomoPreset === 'custom' 
                  ? 'border-[#ff6b1a] text-[#ff6b1a]' 
                  : 'border-[#1e1e38] text-slate-400 hover:border-slate-700'
              }`}
            >
              Custom
            </button>
          </div>

          {pomoPreset === 'custom' && (
            <div className="flex gap-3 mt-4 items-center text-xs text-slate-400 font-bold border-t border-[#1e1e38] pt-3">
              <label className="flex items-center gap-1">
                Work:
                <input 
                  type="number" 
                  className="w-12 bg-[#111120] text-[#ff6b1a] border border-[#2a2a50] rounded px-1 text-center py-0.5"
                  value={pomoWorkMin}
                  min={1} max={180}
                  onChange={handleCustomWorkChange}
                />
                min
              </label>

              <label className="flex items-center gap-1">
                Break:
                <input 
                  type="number" 
                  className="w-12 bg-[#111120] text-[#00ff88] border border-[#2a2a50] rounded px-1 text-center py-0.5"
                  value={pomoBrkMin}
                  min={1} max={60}
                  onChange={handleCustomBrkChange}
                />
                min
              </label>
            </div>
          )}
        </div>

        {/* Right Column: Sessions History */}
        <div className="space-y-4">
          <div className="bg-[#0d0d1a] border border-[#1e1e38] rounded-xl p-4">
            <div className="flex justify-between items-center border-b border-[#111120] pb-2 mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">TODAY'S JOURNAL SESSIONS</h3>
              <span className="text-[10px] bg-[#1e1e38] text-slate-400 px-2.5 py-0.5 rounded font-mono font-bold uppercase">
                {workSessions.length} total
              </span>
            </div>

            <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
              {workSessions.length > 0 ? (
                workSessions.map(sess => (
                  <div key={sess.id} className="flex items-center justify-between p-2.5 bg-[#111120] border border-[#1e1e38] rounded-lg text-xs leading-none">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${catColors[sess.cat] || 'bg-slate-500'}`} />
                      <span className="font-bold text-slate-200 truncate">{sess.task}</span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 uppercase font-mono text-[10px]">
                      {sess.status === 'completed' ? (
                        <span className="text-emerald-400 font-extrabold">✓ COMPLETED ({sess.duration}m)</span>
                      ) : (
                        <span className="text-rose-500 font-bold bg-rose-500/5 px-2 py-0.5 border border-rose-500/20 rounded">
                          ⚠ INTERRUPTED ({sess.duration}m)
                        </span>
                      )}
                      <span className="text-slate-600">{sess.time}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 border border-dashed border-[#1e1e38] rounded-lg text-[10px] text-slate-600 uppercase tracking-widest font-mono">
                  // No sessions completed today
                </div>
              )}
            </div>
          </div>

          {/* Stats card */}
          <div className="bg-[#0d0d1a] border border-[#1e1e38] rounded-xl p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3.5 border-b border-[#111120] pb-2">
              TODAY'S WORK TIMER ANALYTICS
            </h3>

            <div className="grid grid-cols-3 gap-2">
              <div className="bg-[#111120] p-3 text-center border border-[#1e1e38] rounded-lg">
                <p className="text-lg font-black text-emerald-400">{completedCount}</p>
                <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mt-0.5">COMPLETED</p>
              </div>

              <div className="bg-[#111120] p-3 text-center border border-[#1e1e38] rounded-lg">
                <p className="text-lg font-black text-amber-500">{failedCount}</p>
                <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mt-0.5">INTERRUPTS</p>
                <p className="text-[7px] text-slate-600 uppercase mt-0.5 font-mono">tracked</p>
              </div>

              <div className="bg-[#111120] p-3 text-center border border-[#1e1e38] rounded-lg">
                <p className="text-lg font-black text-[#00d4ff]">{totalMins}<span className="text-[10px] text-slate-500">m</span></p>
                <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mt-0.5">TOTAL FOCUS</p>
                <p className="text-[7px] text-slate-600 uppercase mt-0.5 font-mono">({totalHoursLogged} hours)</p>
              </div>
            </div>

            <p className="text-[9px] text-slate-500 uppercase text-center mt-3 leading-relaxed font-semibold italic text-slate-500">
              * Every minute focused counts! Time spent in interrupted sessions is completely logged so you get credit for all focus efforts.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
