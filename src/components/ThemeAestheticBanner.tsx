import React, { useState, useEffect } from "react";
import { Edit2, RotateCcw, Check, X, Sparkles } from "lucide-react";

interface ThemeAestheticBannerProps {
  bgTheme: string;
}

interface ThemeConfig {
  icon: string;
  badge: string;
  quote: string;
  symbols: string;
  accent: string;
  stickerStyle: string;
}

export const THEME_DATA: Record<string, ThemeConfig> = {
  midnight: {
    icon: "🌌",
    badge: "STARBOUND VOYAGER",
    quote: "Through hardships to the stars — let the quiet expanse guide your alignment.",
    symbols: "★ 🛰️ ✦ ☄️ ✴︎",
    accent: "text-indigo-400 border-indigo-500/20 bg-indigo-500/5",
    stickerStyle: "bg-indigo-600/20 text-indigo-300 border-indigo-400/40"
  },
  superhero: {
    icon: "🦸‍♂️",
    badge: "JUSTICE CONSOLE",
    quote: "With great power comes great accountability. Train like a hero, track like an executive.",
    symbols: "⚡️ ✪ 💥 ⚔️ ★",
    accent: "text-amber-400 border-amber-500/30 bg-amber-500/5",
    stickerStyle: "bg-amber-500 text-black font-black border-yellow-350 shadow-[4px_4px_0px_#000]"
  },
  teens: {
    icon: "👾",
    badge: "VIBE VECTORS",
    quote: "Always stay in the neon moment. Live, sketch, dream, repeat.",
    symbols: "⚡ 🌈 ✨ 🛸 🎮",
    accent: "text-pink-400 border-pink-500/20 bg-pink-500/5",
    stickerStyle: "bg-pink-500 text-white font-extrabold border-pink-300 transform -rotate-1 shadow-md"
  },
  swiss: {
    icon: "📐",
    badge: "DIE NEUE ORDNUNG",
    quote: "Less is more. Typographic grid systems govern pristine execution.",
    symbols: "✙ ▱ ▰ ▯ ▮ ▨",
    accent: "text-rose-600 border-black bg-rose-50/50",
    stickerStyle: "bg-black text-white font-black border-black tracking-widest uppercase rounded-none"
  },
  minimal: {
    icon: "⚪",
    badge: "PURE ESSENTIALS",
    quote: "Simplicity is the ultimate sophistication. Quiet the mind, record the facts.",
    symbols: "▫️ ◽ ◻️ 🔲 ▪️",
    accent: "text-slate-600 border-slate-200 bg-white",
    stickerStyle: "bg-slate-100 text-slate-800 border-slate-300 rounded-md"
  },
  retro: {
    icon: "🕹️",
    badge: "RETRO POP ARCADE",
    quote: "Press Start to continue. Real-time analog trackers initialized.",
    symbols: "✴️ 👾 🕹️ 📺 🎯",
    accent: "text-amber-600 border-black bg-yellow-50",
    stickerStyle: "bg-amber-450 border-2 border-black text-black font-extrabold shadow-[2px_2px_0px_rgba(0,0,0,1)]"
  },
  cute: {
    icon: "🧸",
    badge: "COZY NEST",
    quote: "Smile, take a deep breath, and drink some tea. You're doing amazing!",
    symbols: "🌸 ✨ 🧸 🍬 🎀",
    accent: "text-pink-500 border-pink-200 bg-pink-50/50",
    stickerStyle: "bg-pink-100 text-pink-700 border-pink-350 rounded-full"
  },
  playful: {
    icon: "🎨",
    badge: "VIBRANT CARNIVAL",
    quote: "Joy is the supreme fuel of heavy productivity. Keep the colors spinning!",
    symbols: "🎉 🍭 🌈 🤹 🤡",
    accent: "text-violet-600 border-violet-200 bg-violet-50/70",
    stickerStyle: "bg-yellow-400 text-black font-extrabold border-violet-500 rounded-lg animate-bounce-slow"
  },
  crimson: {
    icon: "🩸",
    badge: "CHAOS PROTOCOL",
    quote: "Let your primal fire devour all inertia. Forge forward without question.",
    symbols: "⚔️ 🩸 ☣️ 🌋 ⛓️",
    accent: "text-rose-500 border-rose-950/25 bg-rose-500/5",
    stickerStyle: "bg-rose-900/60 text-rose-200 border-rose-500/50 font-black"
  },
  hacker: {
    icon: "💻",
    badge: "INT_0X00_SHELL",
    quote: "Code is truth. Root access is granted. Logging telemetry offline.",
    symbols: "💀 ⚙️ 🖥️ 📡 💾",
    accent: "text-emerald-400 border-emerald-900/30 bg-emerald-900/5",
    stickerStyle: "bg-black text-[#00ff88] border-[#00ff88]/40 font-mono tracking-widest uppercase text-[8px]"
  },
  forest: {
    icon: "🍃",
    badge: "WOODLAND SANCTUARY",
    quote: "In nature, everything is in perfect rhythm. Plant your seeds, harvest your wins.",
    symbols: "🌲 🪵 🌱 🦎 🍄",
    accent: "text-emerald-500 border-emerald-800/30 bg-emerald-800/5",
    stickerStyle: "bg-emerald-800/30 text-emerald-300 border-emerald-500/40 font-semibold"
  },
  luxury: {
    icon: "⚜️",
    badge: "IMPERIAL ATELIER",
    quote: "Elegance is the only beauty that never fades. Indulge in classic precision.",
    symbols: "🔱 ⚜️ 💎 💍 👑",
    accent: "text-amber-500 border-amber-900/40 bg-zinc-950",
    stickerStyle: "bg-zinc-900 text-[#eed7a1] border-amber-500/60 font-serif italic"
  },
  cyberpunk: {
    icon: "🌆",
    badge: "TACTICAL NEON SYSTEM",
    quote: "The future is today. Hack your workflows, override your limitations.",
    symbols: "🦾 🔮 🕶️ 🧬 🖲️",
    accent: "text-fuchsia-500 border-fuchsia-500/30 bg-black",
    stickerStyle: "bg-[#ff007f] text-black font-black uppercase tracking-wider skew-x-2"
  },
  milkyway: {
    icon: "⭐",
    badge: "COSMIC NEBULA CORRIDOR",
    quote: "We are all made of starstuff. Re-align with your absolute constellations.",
    symbols: "☄️ 🌌 🪐 📡 👽",
    accent: "text-purple-400 border-purple-500/20 bg-purple-500/5",
    stickerStyle: "bg-purple-900/40 text-purple-200 border-purple-450 rounded-lg animate-pulse"
  },
  ocean: {
    icon: "🐬",
    badge: "ABYSSAL DEEP FLOW",
    quote: "Be water, my friend. Empty your mind, adjust form, flow around obstacles.",
    symbols: "🐳 🐋 🦈 🦈 🌊",
    accent: "text-cyan-400 border-cyan-500/20 bg-cyan-500/5",
    stickerStyle: "bg-cyan-950/80 text-cyan-200 border-cyan-400/30"
  },
  cars: {
    icon: "🏎️",
    badge: "NITRO V-12 RPM",
    quote: "Speed is life. Precision is art. Max out your metrics with relentless RPM.",
    symbols: "🏁 🏎️ ⚡ 🧱 🛠️",
    accent: "text-red-500 border-red-550/20 bg-red-500/5",
    stickerStyle: "bg-red-650 text-white font-extrabold tracking-tight border-red-400 uppercase rounded-sm"
  },
  sports: {
    icon: "⚽",
    badge: "CHAMPIONSHIP ARENA",
    quote: "You miss 100% of the shots you don't take. Commit to the field today.",
    symbols: "🏆 🏅 🥇 🏟️ 🥊",
    accent: "text-green-500 border-green-500/20 bg-green-550/5",
    stickerStyle: "bg-green-700 text-white font-bold border-green-300 rounded"
  },
  wildwest: {
    icon: "🤠",
    badge: "OLD SALOON CHRONICLES",
    quote: "No trail is too dusty for a true outlaw. Track your targets, draw fast.",
    symbols: "🌵 🥃 🧭 🪕 🛖",
    accent: "text-amber-700 border-amber-900/30 bg-amber-900/5",
    stickerStyle: "bg-[#e5c158]/50 text-amber-950 border-amber-900 font-serif"
  },
  futuristic: {
    icon: "🛸",
    badge: "CYBERNETIC COGNITION",
    quote: "Designing the tomorrow today. Human-machine interfaces calibrated successfully.",
    symbols: "🔮 📶 📡 🎛️ 🛰️",
    accent: "text-cyan-300 border-cyan-400/20 bg-cyan-950/20",
    stickerStyle: "bg-[#00fbc5]/20 text-[#00fbc5] border-[#00fbc5]/55 font-mono"
  },
  proper3d: {
    icon: "🧱",
    badge: "NEUMORPHIC DENSITY",
    quote: "Perspective changes everything. Soft raised geometries, absolute shadows.",
    symbols: "💾 🗂️ 📁 📊 🗄️",
    accent: "text-neutral-600 border-neutral-300 bg-neutral-100",
    stickerStyle: "bg-neutral-200 border-t-2 border-l-2 border-white border-r-2 border-b-2 border-neutral-400 text-neutral-800"
  },
  proper2d: {
    icon: "💬",
    badge: "POW! COMIC STRIP",
    quote: "BOOM! Smash your daily targets and keep the narrative supercharged.",
    symbols: "💥 💬 🗯️ 🌟 🖍️",
    accent: "text-yellow-600 border-black bg-yellow-100",
    stickerStyle: "bg-yellow-400 border-4 border-black text-black font-black uppercase tracking-widest tracking-tighter"
  },
  mafia: {
    icon: "💼",
    badge: "LA FAMIGLIA UNDERWORLD",
    quote: "Keep your friends close, and your targets closer. Loyalty is our currency.",
    symbols: "🚬 💼 👞 🔪 🥃",
    accent: "text-rose-600 border-red-950/30 bg-zinc-950",
    stickerStyle: "bg-zinc-900 text-red-500 border-red-700/50 font-serif font-black"
  }
};

const ALTERNATIVE_SUGGESTIONS: Record<string, string[]> = {
  midnight: [
    "Silence is the canvas of greatness. Align your focus in the deep dark night.",
    "The stars don't compete with the darkness, they simply shine. Keep tracking.",
    "Calmness of mind is the beautiful jewel of celestial wisdom."
  ],
  superhero: [
    "No cape needed. Small habits compounded daily make you a real hero.",
    "A champion is defined not by their wins, but by how they track their climbs.",
    "Courage is showing up each single day with relentless executive spirit."
  ],
  teens: [
    "Keep it 100 today. High key, you can achieve whatever is on your tracker.",
    "No cap, slow progress is still progress. Keep the energy vibing, gamer.",
    "Hustle in silence, let your dynamic charts make all the noise!"
  ],
  swiss: [
    "Good design is as little design as possible. Pure structural rigor.",
    "Standardized layouts produce frictionless cognitive processing speed.",
    "Discipline is not restriction; it is the frame of premium performance."
  ],
  minimal: [
    "Eliminate everything that is not essential to the core flow.",
    "A clean dashboard leads to an exceptionally organized life.",
    "Let go of status clutter. Record only what moves the needle."
  ],
  retro: [
    "Insert coin, take control. High score leaderboard updated in real-time.",
    "No cheats allowed. Grind through your daily quests and level up.",
    "One frame at a time. The game of life is won in small tactical loops."
  ],
  cute: [
    "Every tiny step counts. Give yourself a high-five for trying your best!",
    "Pause, stretch, and take a sip of delicious cozy water. You are loved.",
    "Let's make today full of warm achievements and snug highlights!"
  ],
  playful: [
    "Turn your routines into a canvas of sheer amusement. Have fun!",
    "No boring days! Draw, paint, scribble, and track with absolute joy.",
    "Spark light inside the metrics. Life is beautiful when it spins!"
  ],
  crimson: [
    "Conquer from within. Burn through obstacles with visceral force.",
    "Zero excuses. Let intensity override all doubt and physical limits.",
    "Forged in heat, perfected in action. Crush the goals ruthlessly."
  ],
  hacker: [
    "Execution of loops: 100%. Buffer overflows patched. Write clean scripts.",
    "Automate your constraints. Stay in the deep flow terminal zone.",
    "If it is not tracked, it is compiled as undefined. Log everything."
  ],
  forest: [
    "Slow down and listen to the wind. Deep roots withstand any storm.",
    "Growth is quiet, organic, and unstoppable. Water your green habits.",
    "A single seed builds a towering redwood. Cultivate daily routines."
  ],
  luxury: [
    "Precision is supreme luxury. Treat your time as a rare asset.",
    "Symmetry, purpose, and absolute quiet are the pillars of high standards.",
    "Live intentionally with royal focus, classic lines, and clean journals."
  ],
  cyberpunk: [
    "Grid override active. Upload new behavioral scripts into the matrix.",
    "Neon shadows, digital precision. You are the architect of your console.",
    "Do not follow the system. Reprogram your biological motherboard."
  ],
  milkyway: [
    "You are a stellar voyager traversing infinite gravity fields today.",
    "Float through the metrics. Stardust aligns your focus naturally.",
    "The universe resides inside your focus. Cosmic patterns calibrated."
  ],
  ocean: [
    "Flow like the deep tide. Soft currents erode the heaviest stones.",
    "Rupture all inertia with calm, waves of deep concentration.",
    "Anchor yourself in physical routines, swim around mental obstacles."
  ],
  cars: [
    "Maximum velocity, cornering precision. Speed past distractions.",
    "Floor the throttle of your goals, steer cleanly, and monitor indicators.",
    "Full tank of willpower. Let's break your previous high speed today."
  ],
  sports: [
    "The extra mile has no traffic. Put in the dirty work today.",
    "Consistency beats talent. Train your muscles, count your stats daily.",
    "Game face on. Win the morning, control the afternoon, dominate the night."
  ],
  wildwest: [
    "Get back on the saddle. The best horizon is the one you make.",
    "Keep your eyes sharp, your water canteen full, and your targets locked.",
    "Dust settles, but a true explorer never stops riding."
  ],
  futuristic: [
    "Quantum computing core online. Optimizing focal vectors.",
    "The best way to predict the future is to design it in real-time.",
    "Augmented neural networks aligned. Track routines with laser speed."
  ],
  proper3d: [
    "Sculpt your day. Beautiful raised perspectives and tactile focus.",
    "Depth makes all the difference. Add shadows to your worries, light to your habits.",
    "Physical structures produce absolute mental calm. Build beautifully."
  ],
  proper2d: [
    "Pow! Break through walls today. Make every panel of your life legendary.",
    "Action bubble triggered: Keep advancing despite the noise!",
    "Unleash your creative ink. Every highlight is a stroke of master art."
  ],
  mafia: [
    "Respect is earned through solid routines. Keep your word and your numbers.",
    "Make time an offer it can't refuse. No slipping, keep the organization tight.",
    "Run the day like a boss. Loyalty to your goals is everything."
  ]
};

export const ThemeAestheticBanner: React.FC<ThemeAestheticBannerProps> = ({ bgTheme }) => {
  const tId = bgTheme || "midnight";
  const cfg = THEME_DATA[tId] || THEME_DATA.midnight;

  const [isClosed, setIsClosed] = useState<boolean>(() => {
    return localStorage.getItem("omnilife_banner_closed") === "true";
  });

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [customQuote, setCustomQuote] = useState<string>("");
  const [tempQuote, setTempQuote] = useState<string>("");

  useEffect(() => {
    const saved = localStorage.getItem("omnilife_custom_quote_" + tId);
    setCustomQuote(saved || "");
    setTempQuote(saved || cfg.quote);
  }, [tId, cfg.quote]);

  useEffect(() => {
    const syncClosed = () => {
      setIsClosed(localStorage.getItem("omnilife_banner_closed") === "true");
    };
    window.addEventListener("storage", syncClosed);
    window.addEventListener("omnilife_banner_toggle", syncClosed);
    return () => {
      window.removeEventListener("storage", syncClosed);
      window.removeEventListener("omnilife_banner_toggle", syncClosed);
    };
  }, []);

  const handleSaveQuote = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = tempQuote.trim();
    if (trimmed) {
      localStorage.setItem("omnilife_custom_quote_" + tId, trimmed);
      setCustomQuote(trimmed);
      setIsEditing(false);
    }
  };

  const handleResetQuote = () => {
    localStorage.removeItem("omnilife_custom_quote_" + tId);
    setCustomQuote("");
    setTempQuote(cfg.quote);
    setIsEditing(false);
  };

  const handleCloseBanner = () => {
    localStorage.setItem("omnilife_banner_closed", "true");
    setIsClosed(true);
    // Notify other panels to sync instant closed state
    window.dispatchEvent(new Event("omnilife_banner_toggle"));
  };

  const activeQuoteCopy = customQuote || cfg.quote;

  // Bright, high-contrast button to easily restore the quotes banner when closed.
  if (isClosed) {
    return (
      <div className="flex justify-end -mt-4 mb-2 animate-fadeIn relative z-10">
        <button
          onClick={() => {
            localStorage.setItem("omnilife_banner_closed", "false");
            setIsClosed(false);
            window.dispatchEvent(new Event("omnilife_banner_toggle"));
          }}
          className="p-1 px-2.5 rounded-full bg-[#00ff88]/15 hover:bg-[#00ff88]/25 border border-[#00ff88]/40 hover:border-[#00ff88]/65 text-[#00ff88] transition duration-300 cursor-pointer flex items-center gap-1.5 text-[9px] font-mono select-none font-bold shadow-sm shadow-[#00ff88]/10"
          title="Retrieve Ambient Quotes & Visual Theme Banner"
        >
          <Sparkles size={11} className="text-[#ff6b1a] animate-pulse" />
          <span className="text-[9px] font-black tracking-widest uppercase text-[#00ff88] hover:text-white">Restore Quote Banner</span>
        </button>
      </div>
    );
  }

  const suggestions = ALTERNATIVE_SUGGESTIONS[tId] || [];

  return (
    <div className={`mb-6 p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-300 backdrop-blur-md relative overflow-hidden ${cfg.accent} animate-fadeIn`}>
      {/* Absolute faint background pattern decoration */}
      <span className="absolute -right-4 -bottom-6 text-7xl select-none opacity-5 hover:scale-110 transition duration-500">
        {cfg.icon}
      </span>
      
      <div className="flex-1 flex items-start gap-4 relative z-10 w-full">
        <span className="text-3xl filter drop-shadow-md sm:mt-1 select-none animate-pulse shrink-0">
          {cfg.icon}
        </span>
        
        <div className="space-y-1 flex-1 w-full text-left">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-2 py-0.5 text-[8px] font-black tracking-widest border uppercase rounded ${cfg.stickerStyle}`}>
                {cfg.symbols.split(" ")[0]} {cfg.badge}
              </span>
              <span className="text-[9px] text-slate-500 font-mono tracking-widest uppercase">
                {cfg.symbols}
              </span>
            </div>
          </div>
          
          {/* Quote display/editor container */}
          <div className="pt-1 select-all">
            {isEditing ? (
              <div className="mt-1 space-y-2 w-full max-w-[650px]">
                <form onSubmit={handleSaveQuote} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full">
                  <input
                    type="text"
                    value={tempQuote}
                    onChange={(e) => setTempQuote(e.target.value)}
                    placeholder="Type custom quote of the day..."
                    className="flex-1 bg-black/60 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-[#ff6b1a] font-mono"
                    autoFocus
                  />
                  <div className="flex items-center gap-1">
                    <button
                      type="submit"
                      className="p-1.5 px-3 rounded bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[10px] uppercase flex items-center gap-1 transition shrink-0 cursor-pointer"
                      title="Save Custom Quote"
                    >
                      <Check size={10} /> Save
                    </button>
                    <button
                      type="button"
                      onClick={handleResetQuote}
                      className="p-1.5 px-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-black text-[10px] uppercase flex items-center gap-1 transition shrink-0 cursor-pointer"
                      title="Reset to Original Stoic Quote"
                    >
                      <RotateCcw size={10} /> Reset
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="p-1.5 px-2 rounded bg-rose-600 hover:bg-rose-700 text-white font-black text-[10px] uppercase flex items-center gap-1 transition shrink-0 cursor-pointer"
                      title="Cancel"
                    >
                      Cancel
                    </button>
                  </div>
                </form>

                {/* Aesthetic Quote suggestions box */}
                {suggestions.length > 0 && (
                  <div className="p-2 bg-black/25 rounded-lg border border-slate-800 space-y-1 text-left">
                    <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider font-mono">// High-Vibe Aesthetic Preset Suggestions:</p>
                    <div className="flex flex-col gap-1">
                      {suggestions.map((sug, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setTempQuote(sug)}
                          className="text-left text-[10px] text-slate-300 hover:text-[#00ff88] hover:bg-slate-800/50 px-2 py-1 rounded transition line-clamp-1 border border-transparent hover:border-slate-700/50 font-mono"
                          title={sug}
                        >
                          💡 "{sug}"
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div 
                onDoubleClick={() => setIsEditing(true)}
                className="flex items-start gap-2 group/text max-w-[650px] cursor-pointer"
                title="Double click text to customize this quote!"
              >
                <p className="text-xs text-slate-300 italic font-semibold leading-relaxed group-hover/text:text-white transition">
                  &ldquo;{activeQuoteCopy}&rdquo;
                  {customQuote && (
                    <span className="ml-2 text-[9px] not-italic font-mono bg-[#00ff88]/15 text-[#00ff88] px-1 py-0.2 rounded border border-[#00ff88]/30 uppercase font-black">
                      Customized
                    </span>
                  )}
                </p>
                
                {/* Pencil edit trigger */}
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-1 rounded bg-slate-800/10 opacity-60 hover:opacity-100 hover:bg-slate-700/50 text-slate-400 hover:text-[#00ff88] transition shrink-0"
                  title="Customize Quote"
                >
                  <Edit2 size={10} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Station indicators and banners control actions */}
      <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 shrink-0 relative z-20 self-end sm:self-center">
        <span className="text-[9px] uppercase tracking-wider text-slate-400 font-extrabold font-mono">
          STATION: {tId.toUpperCase()}
        </span>
        
        {/* Banner Close action trigger button */}
        <button
          onClick={handleCloseBanner}
          className="p-1 rounded-lg bg-slate-800/20 text-slate-400 hover:bg-rose-500/20 hover:text-rose-400 transition"
          title="Dismiss / Close Banner"
        >
          <X size={12} />
        </button>
      </div>
    </div>
  );
};
