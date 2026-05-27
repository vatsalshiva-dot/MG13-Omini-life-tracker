import React, { useState } from 'react';
import { Headphones, Wind, Droplets, CloudLightning, Waves, Coffee, Music, Volume2, X } from 'lucide-react';

interface FocusAudioViewProps {
  activeTrack: string;
  volume: number;
  onSetTrack: (id: string) => void;
  onSetVolume: (vol: number) => void;
}

export const FocusAudioView: React.FC<FocusAudioViewProps> = ({ activeTrack, volume, onSetTrack, onSetVolume }) => {
  const tracks = [
    { id: 'none', label: 'Off / Silence', icon: <X size={20} /> },
    { id: 'brown', label: 'Deep Focus (Brown)', icon: <Wind size={20} /> },
    { id: 'binaural_alpha', label: 'Alpha (10Hz Flow)', icon: <Headphones size={20} /> },
    { id: 'binaural_beta', label: 'Beta (20Hz Alert)', icon: <Headphones size={20} /> },
    { id: 'binaural_theta', label: 'Theta (6Hz Deep)', icon: <Headphones size={20} /> },
    { id: 'binaural_delta', label: 'Delta (2Hz Sleep)', icon: <Headphones size={20} /> },
    { id: 'rain', label: 'Light Rain', icon: <Droplets size={20} /> },
    { id: 'thunderstorm', label: 'Thunderstorms', icon: <CloudLightning size={20} /> },
    { id: 'water', label: 'River Stream', icon: <Waves size={20} /> },
    { id: 'crackle', label: 'Campfire', icon: <Wind size={20} /> },
    { id: 'cafe', label: 'Bustling Cafe', icon: <Coffee size={20} /> },
    { id: 'ambient', label: 'Deep Space Drone', icon: <Music size={20} /> },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto h-full flex flex-col items-center justify-center p-6 bg-[#000000] rounded-3xl relative overflow-hidden">
      
      {/* Background visual based on track */}
      <div className={`absolute inset-0 opacity-10 transition-colors duration-1000 ${
        activeTrack !== 'none' ? 'bg-[#aa44ff]' : 'bg-transparent'
      }`} />
      
      <div className="relative z-10 w-full text-center space-y-6">
        <div className="mx-auto w-24 h-24 rounded-full bg-[#111120] border-2 border-[#2a2a50] flex items-center justify-center text-[#aa44ff] shadow-[0_0_40px_rgba(170,68,255,0.15)] mb-8">
           <Headphones size={40} className={activeTrack !== 'none' ? 'animate-pulse' : ''} />
        </div>

        <div>
          <h2 className="text-3xl font-extrabold tracking-widest text-[#aa44ff] uppercase mb-2">Focus Audio</h2>
          <p className="text-sm text-slate-400 font-semibold max-w-md mx-auto">
            Select an ambient soundscape to help induce flow states, mask distractions, and lower stress dynamically.
          </p>
        </div>

        <div className="w-full max-w-md mx-auto space-y-4 my-8">
          <div className="flex items-center gap-4 bg-[#111120] p-4 rounded-2xl border border-[#2a2a50]">
            <Volume2 size={24} className="text-slate-500 shrink-0" />
            <input 
              type="range" 
              min="0" max="1" step="0.05"
              value={volume}
              onChange={(e) => onSetVolume(parseFloat(e.target.value))}
              className="w-full accent-[#aa44ff] h-2 bg-[#2a2a50] rounded-full appearance-none outline-none hover:accent-fuchsia-400 transition cursor-pointer"
            />
            <span className="text-xs text-slate-400 font-bold w-12 text-right">
              {Math.round(volume * 100)}%
            </span>
          </div>

          <div className="flex gap-2 justify-center">
            <a 
              href="https://open.spotify.com/genre/focus-page" 
              target="_blank" rel="noreferrer"
              className="flex-1 flex flex-col items-center justify-center p-3 bg-[#1db954]/10 hover:bg-[#1db954]/20 border border-[#1db954]/30 rounded-2xl text-[#1db954] transition"
            >
              <Music size={16} className="mb-2" />
              <span className="text-[10px] font-black uppercase tracking-widest">Spotify</span>
            </a>
            <a 
              href="https://music.youtube.com/moods-and-genres/focus" 
              target="_blank" rel="noreferrer"
              className="flex-1 flex flex-col items-center justify-center p-3 bg-[#ff0000]/10 hover:bg-[#ff0000]/20 border border-[#ff0000]/30 rounded-2xl text-[#ff0000] transition"
            >
              <Music size={16} className="mb-2" />
              <span className="text-[10px] font-black uppercase tracking-widest">YT Music</span>
            </a>
            <a 
              href="https://music.apple.com/us/curator/apple-music-focus/1410712741" 
              target="_blank" rel="noreferrer"
              className="flex-1 flex flex-col items-center justify-center p-3 bg-[#fa243c]/10 hover:bg-[#fa243c]/20 border border-[#fa243c]/30 rounded-2xl text-[#fa243c] transition"
            >
              <Music size={16} className="mb-2" />
              <span className="text-[10px] font-black uppercase tracking-widest">Apple</span>
            </a>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full">
           {tracks.map(t => (
             <button
               key={t.id}
               onClick={() => onSetTrack(t.id)}
               className={`p-4 rounded-2xl border flex flex-col items-center text-center gap-3 transition-all duration-300 ${
                 activeTrack === t.id 
                 ? 'bg-[#aa44ff]/10 border-[#aa44ff] text-[#aa44ff] shadow-[0_0_20px_rgba(170,68,255,0.4)] scale-105' 
                 : 'bg-[#111120] border-[#2a2a50] text-slate-400 hover:text-white hover:border-[#aa44ff]/50'
               }`}
             >
               {t.icon}
               <span className="text-[10px] font-black uppercase tracking-widest">{t.label}</span>
             </button>
           ))}
        </div>
        
        {activeTrack !== 'none' && (
           <div className="pt-8 animate-fade-in flex flex-col items-center gap-3">
             <div className="flex gap-2 h-8 items-center opacity-80">
                {[...Array(9)].map((_, i) => (
                  <div key={i} className="w-1.5 bg-[#aa44ff] rounded-full animate-bounce" style={{ height: `${20 + Math.random() * 80}%`, animationDelay: `${i * 0.1}s` }} />
                ))}
             </div>
             <p className="text-[#aa44ff] text-xs font-bold uppercase tracking-widest animate-pulse">Now Playing: {tracks.find(t => t.id === activeTrack)?.label}</p>
           </div>
        )}
      </div>
    </div>
  );
};
