import React, { useState, useEffect } from "react";
import {
  AppState,
  TrackerCategory,
  DayEntry,
  Reminder,
  JournalEntry,
  JournalPrompt,
  SyncConfig,
  PomoSession,
  TrackerStatus,
} from "./types";
import {
  loadData,
  saveData,
  loadSyncCfg,
  saveSyncCfg,
  defData,
  CATS,
  getCatLabel,
  syncGist,
  pullGist,
  syncJSONBin,
  pullJSONBin,
} from "./utils/storage";
import { todayStr, periodRange } from "./utils/date";
import { sendBackgroundNotification } from "./utils/notifications";
import { openPiP, updatePiPContent, closePiP, isPiPOpen } from "./utils/pip";

export const ALL_FONTS = [
  { id: "inter", label: "Inter (Neo-Grotesque)", family: '"Inter", sans-serif' },
  { id: "space_grotesk", label: "Space Grotesk (Tech Future)", family: '"Space Grotesk", sans-serif' },
  { id: "jetbrains_mono", label: "JetBrains Mono (Sleek Hacker)", family: '"JetBrains Mono", monospace' },
  { id: "fira_code", label: "Fira Code (Modern Coding)", family: '"Fira Code", monospace' },
  { id: "vt323", label: "VT323 (8-Bit Arcade)", family: '"VT323", monospace' },
  { id: "quicksand", label: "Quicksand (Friendly Curves)", family: '"Quicksand", sans-serif' },
  { id: "playfair_display", label: "Playfair Display (Classy Editorial)", family: '"Playfair Display", serif' },
  { id: "outfit", label: "Outfit (Geometric Clean)", family: '"Outfit", sans-serif' },
  { id: "cabin_sketch", label: "Cabin Sketch (Creative Doodle)", family: '"Cabin Sketch", cursive' },
  { id: "bebas_neue", label: "Bebas Neue (Punchy Banner)", family: '"Bebas Neue", sans-serif' },
  { id: "cinzel", label: "Cinzel (Ancient Majesty)", family: '"Cinzel", serif' },
  { id: "syne", label: "Syne (Avant-Garde Art)", family: '"Syne", sans-serif' },
  { id: "fredoka", label: "Fredoka (Playful Rounded)", family: '"Fredoka", sans-serif' },
  { id: "unbounded", label: "Unbounded (Heavy Brutalist)", family: '"Unbounded", sans-serif' },
  { id: "inconsolata", label: "Inconsolata (Humanist Code)", family: '"Inconsolata", monospace' },
  { id: "montserrat", label: "Montserrat (Urban Classic)", family: '"Montserrat", sans-serif' },
  { id: "cardo", label: "Cardo (Ancient Scholarly)", family: '"Cardo", serif' },
  { id: "righteous", label: "Righteous (Retro Cyberwave)", family: '"Righteous", sans-serif' },
  { id: "dm_serif", label: "DM Serif (Vogue Editorial)", family: '"DM Serif Display", serif' },
  { id: "press_start", label: "Press Start 2P (Geek Chiptune)", family: '"Press Start 2P", monospace' }
];

const lightModeOverride = `
      body { color: #0f172a !important; }
      .text-white, .text-slate-100, .text-slate-200 { color: #020617 !important; }
      .text-slate-300, .text-slate-400 { color: #0f172a !important; }
      .text-slate-500, .text-slate-600 { color: #334155 !important; }
      .text-slate-700, .text-slate-800, .text-slate-900 { color: #475569 !important; }
      
      .bg-slate-800, .bg-\\[\\#1e1e38\\], .bg-\\[\\#2a2a50\\] { background-color: #f1f5f9 !important; border-color: #cbd5e1 !important; color: #0f172a !important; }
      .bg-slate-900, .bg-slate-950, .bg-\\[\\#111120\\], .bg-\\[\\#0d0d1a\\] { background-color: #ffffff !important; border-color: #e2e8f0 !important; color: #0f172a !important; }

      .border-\\[\\#2a2a50\\], .border-\\[#1e1e38\\], .border-slate-800, .border-slate-700, .border-slate-900, .border-dashed { border-color: #cbd5e1 !important; }
      .border-\\[\\#111120\\] { border-color: #e2e8f0 !important; }
      
      .hover\\:bg-slate-800:hover { background-color: #e2e8f0 !important; color: #020617 !important; }
      .hover\\:bg-slate-900:hover { background-color: #f1f5f9 !important; color: #020617 !important; }
      
        /* Remap neon colors for light mode to maintain high visibility */
      .text-\\[\\#00ff88\\], .text-\\[\\#00c853\\] { color: #059669 !important; }
      .text-\\[\\#ff00a0\\] { color: #e11d48 !important; }
      .text-\\[\\#00d4ff\\] { color: #0284c7 !important; }
      .text-\\[\\#ff4400\\] { color: #c2410c !important; }
      .text-\\[\\#aa44ff\\] { color: #6b21a8 !important; }
      
      .bg-\\[\\#00ff88\\]\\/10 { background-color: #d1fae5 !important; color: #059669 !important; }
      .bg-\\[\\#ff00a0\\]\\/10 { background-color: #ffe4e6 !important; color: #e11d48 !important; }
      .bg-\\[\\#00d4ff\\]\\/10 { background-color: #e0f2fe !important; color: #0284c7 !important; }
      .bg-rose-500\\/10, .bg-rose-500\\/20 { background-color: #ffe4e6 !important; color: #e11d48 !important; }
      .bg-amber-500\\/10, .bg-amber-500\\/20 { background-color: #fef3c7 !important; color: #d97706 !important; }
      
      button, button .text-white, button.text-white, 
      [class*="bg-emerald-"] .text-white, [class*="bg-emerald-"] .text-slate-100,
      [class*="bg-rose-"] .text-white, [class*="bg-rose-"] .text-slate-100,
      [class*="bg-red-"] .text-white, [class*="bg-indigo-"] .text-white, 
      [class*="bg-blue-"] .text-white, [class*="bg-fuchsia-"] .text-white,
      [class*="bg-[#ff6b1a]"], [class*="bg-[#ff6b1a]"] *,
      [class*="hover:bg-[#ff6b1a]"]:hover,
      [class*="hover:bg-[#ff6b1a]"]:hover *,
      .text-white-force, .bg-emerald-500 *, .bg-rose-500 * {
        color: #ffffff !important;
      }
      
      /* Special handling for text inputs to remain readable */
      textarea, input, select {
        background-color: #ffffff !important;
        color: #0f172a !important;
        border-color: #cbd5e1 !important;
      }
      textarea:focus, input:focus, select:focus {
        border-color: #94a3b8 !important;
        color: #0f172a !important;
      }
      textarea::placeholder, input::placeholder {
        color: #64748b !important;
      }
    `;

const getThemeCSS = (colorHex?: string, bgTheme?: string, fontFamily?: string) => {
  let cssStr = "";
  let extraCss = "";

  let derivedTextHex = colorHex || "#ff6b1a";
  let derivedBgTextHex = "#ffffff";
  let r = 255, g = 107, b = 26; // Default to #ff6b1a
  
  if (colorHex) {
    const hex = colorHex.replace("#", "");
    r = parseInt(hex.substring(0, 2), 16);
    g = parseInt(hex.substring(2, 4), 16);
    b = parseInt(hex.substring(4, 6), 16);
    const yiq = ((r*299)+(g*587)+(b*114))/1000;
    
    derivedBgTextHex = yiq > 140 ? "#0f172a" : "#ffffff";
    const isLightBg = bgTheme === "draft";
    
    if (isLightBg) {
      // For light backgrounds, always guarantee deep high-contrast text by scaling down color luminosity
      const factor = yiq > 200 ? 0.35 : yiq > 140 ? 0.5 : 0.65;
      const nr = Math.floor(r * factor);
      const ng = Math.floor(g * factor);
      const nb = Math.floor(b * factor);
      const toHex = (c: number) => {
        const s = Math.max(0, Math.min(255, c)).toString(16);
        return s.length === 1 ? "0" + s : s;
      };
      derivedTextHex = `#${toHex(nr)}${toHex(ng)}${toHex(nb)}`;
      extraCss = lightModeOverride;
    } else {
      // For dark backgrounds, always guarantee bright luminous high-contrast text by scaling up color luminosity
      const factor = yiq < 90 ? 1.8 : yiq < 150 ? 1.3 : 1.1;
      const nr = Math.min(255, Math.floor(r * factor + (255 - r) * 0.25));
      const ng = Math.min(255, Math.floor(g * factor + (255 - g) * 0.25));
      const nb = Math.min(255, Math.floor(b * factor + (255 - b) * 0.25));
      const toHex = (c: number) => {
        const s = Math.max(0, Math.min(255, c)).toString(16);
        return s.length === 1 ? "0" + s : s;
      };
      derivedTextHex = `#${toHex(nr)}${toHex(ng)}${toHex(nb)}`;
    }
  }

  const rgb = `${r}, ${g}, ${b}`;
  const appliedColor = colorHex || "#ff6b1a";

  cssStr += `
    .text-\\[\\#ff6b1a\\] { color: ${derivedTextHex} !important; }
    .bg-\\[\\#ff6b1a\\] { 
      background-color: ${appliedColor} !important; 
      color: ${derivedBgTextHex} !important;
    }
    .bg-\\[\\#ff6b1a\\] svg {
      stroke: ${derivedBgTextHex} !important;
      color: ${derivedBgTextHex} !important;
    }
    .bg-\\[\\#ff6b1a\\]\\/10 { background-color: rgba(${rgb}, 0.1) !important; }
    .bg-\\[\\#ff6b1a\\]\\/30 { background-color: rgba(${rgb}, 0.3) !important; }
    .bg-\\[\\#ff6b1a\\]\\/50 { background-color: rgba(${rgb}, 0.5) !important; }
    .border-\\[\\#ff6b1a\\] { border-color: ${appliedColor} !important; }
    .border-\\[\\#ff6b1a\\]\\/20 { border-color: rgba(${rgb}, 0.2) !important; }
    .border-\\[\\#ff6b1a\\]\\/25 { border-color: rgba(${rgb}, 0.25) !important; }
    .border-\\[\\#ff6b1a\\]\\/30 { border-color: rgba(${rgb}, 0.3) !important; }
    .border-\\[\\#ff6b1a\\]\\/40 { border-color: rgba(${rgb}, 0.4) !important; }
    .border-\\[\\#ff6b1a\\]\\/50 { border-color: rgba(${rgb}, 0.5) !important; }
    .hover\\:bg-\\[\\#ff6b1a\\]:hover { 
      background-color: ${appliedColor} !important; 
      color: ${derivedBgTextHex} !important;
    }
    .hover\\:bg-\\[\\#ff6b1a\\] svg:hover {
      stroke: ${derivedBgTextHex} !important;
    }
    .hover\\:bg-\\[\\#ff6b1a\\]\\/10:hover { background-color: rgba(${rgb}, 0.1) !important; }
    .hover\\:border-\\[\\#ff6b1a\\]:hover { border-color: ${appliedColor} !important; }
    .hover\\:border-\\[\\#ff6b1a\\]\\/35:hover { border-color: rgba(${rgb}, 0.35) !important; }
    .hover\\:border-\\[\\#ff6b1a\\]\\/50:hover { border-color: rgba(${rgb}, 0.5) !important; }
    .hover\\:text-\\[\\#ff6b1a\\]:hover { color: ${derivedTextHex} !important; }
    .focus\\:border-\\[\\#ff6b1a\\]:focus { border-color: ${appliedColor} !important; }
    .focus\\:border-\\[\\#ff6b1a\\]\\/50:focus { border-color: rgba(${rgb}, 0.5) !important; }
    .border-l-\\[\\#ff6b1a\\] { border-left-color: ${appliedColor} !important; }
  `;

  if (fontFamily) {
    const foundFont = ALL_FONTS.find(f => f.id === fontFamily);
    if (foundFont) {
      cssStr += `
        body, .font-sans, p, span, h1, h2, h3, h4, h5, h6, button, div, input, textarea, select {
          font-family: ${foundFont.family} !important;
        }
        .font-display {
          font-family: ${foundFont.family} !important;
        }
      `;
    }
  }

  if (bgTheme && bgTheme !== "midnight") {
    let bg0 = "#0d0d1a";
    let bg1 = "#111120";
    let sidebarBg = "#0a0a14";
    let borderPrimary = "#2a2a50";
    let borderSecondary = "#1e1e38";
    let text100 = "#ffffff";
    let text200 = "#e2e8f0";
    let text300 = "#cbd5e1";
    let text400 = "#94a3b8";
    let text500 = "#64748b";

    if (bgTheme === "superhero") {
      bg0 = "#05081c";
      bg1 = "#0e1236";
      sidebarBg = "#03040a";
      borderPrimary = "#ffd700";
      borderSecondary = "#ae8b02";
      text100 = "#ffffff";
      text400 = "#ffaa00";
      extraCss = `
        body {
          --font-sans: "Space Grotesk", sans-serif;
          --font-display: "Space Grotesk", sans-serif;
          --font-mono: "Fira Code", monospace;
          background-image: radial-gradient(circle at top right, rgba(239, 68, 68, 0.15), transparent 60%), 
                            radial-gradient(circle at bottom left, rgba(56, 189, 248, 0.15), transparent 60%), 
                            radial-gradient(#1e1b4b 1px, transparent 1px) !important;
          background-size: 100% 100%, 100% 100%, 20px 20px !important;
          background-color: #05081c !important;
        }
        .border-\\[\\#2a2a50\\] { border-color: #ffd700 !important; border-width: 3px !important; border-style: solid !important; }
        .text-slate-100, .text-white { color: #ffffff !important; font-weight: 900 !important; text-shadow: 2px 2px 0px #b45309, 0 0 10px rgba(255, 215, 0, 0.4) !important; }
        .text-slate-400 { color: #ffaa00 !important; font-weight: 900 !important; text-transform: uppercase !important; }
        .bg-\\[\\#2a2a50\\] { background-color: #ffd700 !important; }
        .bg-\\[\\#111120\\] { 
          border: 3px solid #ffaa00 !important; 
          background-color: #0b103d !important; 
          box-shadow: 8px 8px 0px #000000, 0 0 15px rgba(255, 215, 0, 0.15) !important;
          border-radius: 12px !important; 
          position: relative;
        }
        /* Sticker styling indicator */
        .bg-\\[\\#111120\\]::after {
          content: "⚡️ JUSTICE CONSOLE ★";
          position: absolute;
          top: -12px;
          right: 15px;
          background: linear-gradient(135deg, #ef4444 0%, #ff0055 100%);
          color: white;
          font-size: 8px;
          font-family: "Space Grotesk", sans-serif;
          padding: 2px 8px;
          border-radius: 40px;
          font-weight: 900;
          border: 1.5px solid white;
          box-shadow: 3px 3px 0px #000;
          letter-spacing: 1px;
        }
      `;
    } else if (bgTheme === "forest") {
      bg0 = "#031207";
      bg1 = "#0a2612";
      sidebarBg = "#010803";
      borderPrimary = "#22c55e";
      borderSecondary = "#14532d";
      text100 = "#f0fdf4";
      text400 = "#4ade80";
      extraCss = `
        body {
          --font-sans: "Inter", sans-serif;
          --font-display: "Outfit", sans-serif;
          --font-mono: "JetBrains Mono", monospace;
          background-image: 
            radial-gradient(circle at 10% 20%, rgba(34, 197, 94, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 90% 85%, rgba(234, 179, 8, 0.08) 0%, transparent 50%),
            repeating-linear-gradient(45deg, rgba(34, 197, 94, 0.02) 0px, rgba(34, 197, 94, 0.02) 1px, transparent 1px, transparent 24px) !important;
          background-color: #031207 !important;
        }
        .border-\\[\\#2a2a50\\] { border-color: #2e5c3e !important; }
        .text-slate-100, .text-white { color: #f0fdf4 !important; font-family: "Outfit", sans-serif !important; font-weight: 800 !important; }
        .text-slate-400 { color: #86efac !important; }
        .bg-\\[\\#111120\\] { 
          border-color: #15803d !important; 
          background-color: #061e0f !important; 
          border-radius: 24px !important;
          border-left: 6px solid #22c55e !important;
          box-shadow: 0 10px 30px -5px rgba(2, 48, 18, 0.7), inset 0 0 12px rgba(34, 197, 94, 0.1) !important;
        }
        .bg-\\[\\#111120\\]::after {
          content: "🍃 WOODLAND SANCTUARY";
          position: absolute;
          bottom: 8px;
          right: 14px;
          color: #22c55e99;
          font-weight: bold;
          font-size: 7.5px;
          letter-spacing: 1.5px;
          font-family: monospace;
        }
      `;
    } else if (bgTheme === "luxury") {
      bg0 = "#080603";
      bg1 = "#1c1307";
      sidebarBg = "#030201";
      borderPrimary = "#d4af37";
      borderSecondary = "#5e481a";
      text100 = "#ffffff";
      text400 = "#eed7a1";
      extraCss = `
        body {
          --font-sans: "Playfair Display", serif;
          --font-display: "Playfair Display", serif;
          --font-mono: "Playfair Display", serif;
          background-image: 
            radial-gradient(ellipse at center, #231807 0%, #080603 100%),
            repeating-linear-gradient(0deg, rgba(212, 175, 55, 0.02) 0px, rgba(212, 175, 55, 0.02) 1px, transparent 1px, transparent 40px) !important;
          background-color: #080603 !important;
        }
        .border-\\[\\#2a2a50\\] { border-color: #c5a059 !important; border-width: 1.5px !important; }
        .text-slate-100, .text-white { color: #fdfaf2 !important; font-family: "Playfair Display", serif !important; text-shadow: 0 0 10px rgba(212, 175, 55, 0.5) !important; font-style: italic !important; }
        .text-slate-400 { color: #eed7a1 !important; font-style: italic !important; font-weight: bold !important; }
        .bg-\\[\\#111120\\] { 
          border: 1px solid #d4af37 !important; 
          background-color: #120a03 !important; 
          box-shadow: 0 15px 35px rgba(212, 175, 55, 0.12), inset 0 0 15px rgba(212,175,55,0.05) !important; 
          border-radius: 8px !important;
        }
        .bg-\\[\\#111120\\]::after {
          content: "⚜️ IMPERIAL ATELIER";
          position: absolute;
          top: 8px;
          right: 14px;
          color: #d4af37bb;
          font-family: "Playfair Display", serif;
          font-weight: bold;
          font-size: 8px;
          letter-spacing: 2.5px;
        }
      `;
    } else if (bgTheme === "cyberpunk") {
      bg0 = "#000000";
      bg1 = "#0c0211";
      sidebarBg = "#000000";
      borderPrimary = "#ff007f";
      borderSecondary = "#250036";
      text100 = "#ffffff";
      text400 = "#00ffff";
      extraCss = `
        body {
          --font-sans: "Space Grotesk", sans-serif;
          --font-display: "Space Grotesk", sans-serif;
          --font-mono: "Fira Code", monospace;
          background-image: 
            linear-gradient(180deg, rgba(0,0,0,0.92) 0%, rgba(12,2,17,0.97) 100%), 
            repeating-linear-gradient(0deg, rgba(255, 0, 127, 0.05) 0px, rgba(255, 0, 127, 0.05) 1px, transparent 1px, transparent 20px),
            repeating-linear-gradient(90deg, rgba(0, 255, 255, 0.03) 0px, rgba(0, 255, 255, 0.03) 1px, transparent 1px, transparent 40px) !important;
          background-color: #000000 !important;
        }
        .border-\\[\\#2a2a50\\] { border-color: #ff007f !important; border-width: 2px !important; border-style: solid !important; }
        .text-slate-100, .text-white { color: #ffffff !important; text-shadow: 0 0 8px #ff007f, 0 0 15px #00ffff !important; font-family: "Space Grotesk" !important; font-weight: 900 !important; letter-spacing: 1px; }
        .text-slate-400 { color: #00ffff !important; font-weight: bold !important; text-shadow: 0 0 6px rgba(0, 255, 255, 0.8) !important; font-family: "Fira Code", monospace !important; }
        .bg-\\[\\#111120\\] { 
          border: 2px solid #ff007f !important; 
          background-color: rgba(14, 2, 22, 0.9) !important; 
          box-shadow: 0px 0px 22px rgba(255, 0, 127, 0.35), inset 0 0 12px rgba(0, 255, 255, 0.1) !important; 
          border-radius: 0px !important;
          clip-path: polygon(100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 0) !important;
        }
        .bg-\\[\\#111120\\]::after {
          content: "🏴‍☠️ [CYBER_TACTICAL_CORE]";
          position: absolute;
          top: 6px;
          right: 14px;
          background: #ff007f;
          color: black;
          font-family: monospace;
          font-weight: 950;
          font-size: 7px;
          padding: 1px 5px;
        }
      `;
    } else if (bgTheme === "milkyway") {
      bg0 = "#030107";
      bg1 = "#110724";
      sidebarBg = "#020004";
      borderPrimary = "#a855f7";
      borderSecondary = "#4c1d95";
      text100 = "#f5f3ff";
      text400 = "#d8b4fe";
      extraCss = `
        body {
          --font-sans: "Outfit", sans-serif;
          --font-display: "Quicksand", sans-serif;
          --font-mono: "JetBrains Mono", monospace;
          background-image: 
            radial-gradient(ellipse at top, rgba(168, 85, 247, 0.15) 0%, transparent 60%),
            radial-gradient(1.5px 1.5px at 30px 40px, #fff, rgba(0,0,0,0)), 
            radial-gradient(2px 2px at 120px 180px, #e879f9, rgba(0,0,0,0)), 
            radial-gradient(1px 1px at 250px 350px, #818cf8, rgba(0,0,0,0)), 
            linear-gradient(180deg, #030107 0%, #0d051f 100%) !important;
          background-size: 100% 100%, 120px 120px, 200px 200px, 300px 300px, 100% 100% !important;
          background-color: #030107 !important;
        }
        .border-\\[\\#2a2a50\\] { border-color: #a855f7 !important; }
        .text-slate-100, .text-white { color: #f5f3ff !important; text-shadow: 0 0 10px #c084fc, 0 0 20px rgba(168, 85, 247, 0.4) !important; font-family: "Quicksand" !important; font-weight: bold; }
        .text-slate-400 { color: #e9d5ff !important; font-family: "JetBrains Mono" !important; }
        .bg-\\[\\#111120\\] { 
          border: 1px solid rgba(168, 85, 247, 0.45) !important; 
          background-color: rgba(15, 6, 33, 0.8) !important; 
          backdrop-filter: blur(16px) !important;
          border-radius: 20px !important; 
          box-shadow: 0 0 30px rgba(168, 85, 247, 0.16), inset 0 0 15px rgba(240, 171, 252, 0.05) !important;
        }
        .bg-\\[\\#111120\\]::after {
          content: "✦ CELESTIAL PROTOCOL";
          position: absolute;
          top: -10px;
          left: 20px;
          background: rgba(168, 85, 247, 0.2);
          border: 1px solid #c084fc;
          color: #f5f3ff;
          font-size: 7px;
          padding: 2px 8px;
          border-radius: 30px;
          font-weight: 800;
          letter-spacing: 1px;
        }
      `;
    } else if (bgTheme === "ocean") {
      bg0 = "#01080e";
      bg1 = "#041528";
      sidebarBg = "#000307";
      borderPrimary = "#0c7390";
      borderSecondary = "#164e63";
      text100 = "#ecfeff";
      text400 = "#22d3ee";
      extraCss = `
        body {
          --font-sans: "Inter", sans-serif;
          --font-display: "Outfit", sans-serif;
          --font-mono: "Fira Code", monospace;
          background-image: 
            radial-gradient(ellipse at bottom, #062b3d 0%, #01080e 80%),
            repeating-linear-gradient(0deg, rgba(34, 211, 238, 0.015) 0px, rgba(34, 211, 238, 0.015) 1px, transparent 1px, transparent 20px) !important;
          background-color: #01080e !important;
        }
        .border-\\[\\#2a2a50\\] { border-color: #0e7490 !important; }
        .text-slate-100, .text-white { color: #ecfeff !important; text-shadow: 0 2px 14px rgba(34, 211, 238, 0.5) !important; font-family: "Outfit", sans-serif !important; }
        .text-slate-400 { color: #22d3ee !important; }
        .bg-\\[\\#111120\\] { 
          border: 1.5px solid #0891b2 !important; 
          background-color: rgba(4, 20, 39, 0.9) !important; 
          border-radius: 24px !important;
          border-bottom: 5px solid #06b6d4 !important;
          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.6), inset 0 2px 10px rgba(34, 211, 238, 0.1) !important;
        }
        .bg-\\[\\#111120\\]::after {
          content: "⚓ DEEP_SEA_VECTORS";
          position: absolute;
          bottom: -10px;
          right: 20px;
          background: #0891b2;
          color: white;
          font-weight: 900;
          font-size: 7px;
          padding: 1px 7px;
          border-radius: 4px;
        }
      `;
    } else if (bgTheme === "teens") {
      bg0 = "#1a0b2e";
      bg1 = "#2c124d";
      sidebarBg = "#0e051c";
      borderPrimary = "#ff00ff";
      borderSecondary = "#4a044e";
      text100 = "#ffffff";
      text400 = "#00fbc5";
      extraCss = `
        body {
          --font-sans: "Quicksand", sans-serif;
          --font-display: "Quicksand", sans-serif;
          --font-mono: "Fira Code", monospace;
          background-image: 
            radial-gradient(circle at 15% 20%, rgba(244, 63, 94, 0.12) 0%, transparent 45%),
            radial-gradient(circle at 85% 75%, rgba(168, 85, 247, 0.12) 0%, transparent 45%),
            repeating-linear-gradient(135deg, rgba(255, 0, 255, 0.02) 0px, rgba(255, 0, 255, 0.02) 2px, transparent 2px, transparent 15px) !important;
          background-color: #1a0b2e !important;
        }
        .border-\\[\\#2a2a50\\] { border-color: #ff00ff !important; }
        .text-slate-100, .text-white { color: #ffffff !important; text-shadow: 0 0 15px #ff00ff, 0 0 25px rgba(255,0,255,0.2) !important; font-family: "Quicksand" !important; font-weight: 900; }
        .text-slate-400 { color: #00fbc5 !important; font-family: "Quicksand" !important; font-weight: 800 !important; }
        .bg-\\[\\#111120\\] { 
          border: 2px solid #ff00ff !important; 
          background-color: #1f0b3b !important; 
          box-shadow: 8px 8px 0px rgba(255, 0, 255, 0.25), 0px 5px 20px rgba(0,0,0,0.5) !important; 
          border-radius: 20px !important;
        }
        .bg-\\[\\#111120\\]::after {
          content: "⚡ SYSTEM VIBE CHECK";
          position: absolute;
          top: -11px;
          left: 18px;
          background: #00fbc5;
          color: black;
          font-weight: 950;
          font-size: 7.5px;
          padding: 2px 7px;
          border-radius: 99px;
          border: 1px solid black;
        }
      `;
    } else if (bgTheme === "swiss") {
      bg0 = "#ffffff";
      bg1 = "#f5f5f7";
      sidebarBg = "#ffffff";
      borderPrimary = "#000000";
      borderSecondary = "#222222";
      text100 = "#000000";
      text200 = "#111111";
      text300 = "#2d2d2d";
      text400 = "#000000";
      text500 = "#555555";
      extraCss = `
        body {
          --font-sans: "Helvetica Neue", Arial, sans-serif;
          --font-display: "Helvetica Neue", Arial, sans-serif;
          --font-mono: "Fira Code", monospace;
          background-color: #ffffff !important;
          background-image: 
            repeating-linear-gradient(90deg, #f0f0f4 0px, #f0f0f4 1px, transparent 1px, transparent 60px) !important;
          letter-spacing: -0.025em !important;
        }
        .font-sans, .font-display { font-family: "Helvetica Neue", Arial, sans-serif !important; font-weight: 900 !important; }
        .text-slate-100, .text-white { color: #000000 !important; font-weight: 950 !important; letter-spacing: -0.04em !important; }
        .text-slate-200 { color: #111111 !important; font-weight: 800 !important; }
        .text-slate-300 { color: #222222 !important; }
        .text-slate-300, .text-slate-400 { color: #000000 !important; font-weight: 900 !important; text-transform: uppercase !important; }
        .text-slate-500 { color: #444444 !important; }
        .border-\\[\\#2a2a50\\] { border-color: #000000 !important; border-width: 3px !important; }
        .border-\\[\\#111120\\] { border-color: #000000 !important; border-width: 3px !important; }
        .bg-\\[\\#111120\\] { 
          background-color: #ffffff !important; 
          border: 3.5px solid #000000 !important; 
          box-shadow: none !important; 
          border-radius: 0px !important;
        }
        .bg-\\[\\#0a0a14\\] { background-color: #fafafa !important; border-right: 3 board solid #000000 !important; }
        .bg-\\[\\#2a2a50\\] { background-color: #000000 !important; }
        .text-\\[\\#ff6b1a\\] { color: #e11d48 !important; font-weight: 900 !important; }
        .rounded-2xl, .rounded-xl, .rounded-lg, .rounded { border-radius: 0px !important; }
        .bg-\\[\\#111120\\]::after {
          content: "+ NEUE ARCHITEKTUR";
          position: absolute;
          top: 6px;
          right: 12px;
          color: #e11d48;
          font-weight: 950;
          font-size: 7.5px;
          letter-spacing: 0.5px;
        }
      `;
    } else if (bgTheme === "minimal") {
      bg0 = "#f8fafc";
      bg1 = "#ffffff";
      sidebarBg = "#f1f5f9";
      borderPrimary = "#cbd5e1";
      borderSecondary = "#e2e8f0";
      text100 = "#0f172a";
      text400 = "#475569";
      extraCss =
        lightModeOverride +
        `
          body {
            --font-display: "Inter", sans-serif;
            --font-mono: "Inter", sans-serif;
            background-color: #f8fafc !important;
            background-image: radial-gradient(rgba(148, 163, 184, 0.08) 1.5px, transparent 1.5px) !important;
            background-size: 30px 30px !important;
          }
          .font-sans, .font-display, .font-mono { font-family: "Inter", sans-serif !important; }
          .rounded-2xl { border-radius: 16px !important; }
          .rounded-xl { border-radius: 12px !important; }
          .rounded-lg, .rounded { border-radius: 8px !important; }
          .border-\\[\\#2a2a50\\] { border-color: #e2e8f0 !important; }
          .bg-\\[\\#111120\\] { 
            box-shadow: 0 4px 30px rgba(15, 23, 42, 0.025), inset 0 1px 0 rgba(255,255,255,0.6) !important; 
            border: 1px solid #e2e8f0 !important; 
            border-radius: 16px !important; 
          }
        `;
    } else if (bgTheme === "light1") {
      bg0 = "#e0f2fe"; bg1 = "#f0f9ff"; sidebarBg = "#ffffff"; borderPrimary = "#7dd3fc"; borderSecondary = "#bae6fd"; text100 = "#0c4a6e";
      const boxStyle = `background-color: #ffffff !important; border: 1px solid ${borderPrimary} !important;`;
      extraCss = lightModeOverride + `.bg-\\[\\#111120\\], .bg-\\[\\#0a0a14\\], .bg-\\[\\#0d0d1a\\], .bg-\\[\\#111928\\], .bg-\\[\\#1e1e38\\], .bg-\\[\\#2a2a50\\] { ${boxStyle} color: ${text100} !important; }`;
    } else if (bgTheme === "light2") {
      bg0 = "#f8fafc"; bg1 = "#ffffff"; sidebarBg = "#ffffff"; borderPrimary = "#cbd5e1"; borderSecondary = "#e2e8f0"; text100 = "#0f172a";
      const boxStyle = `background-color: #f1f5f9 !important; border: 1px solid ${borderPrimary} !important;`;
      extraCss = lightModeOverride + `.bg-\\[\\#111120\\], .bg-\\[\\#0a0a14\\], .bg-\\[\\#0d0d1a\\], .bg-\\[\\#111928\\], .bg-\\[\\#1e1e38\\], .bg-\\[\\#2a2a50\\] { ${boxStyle} color: ${text100} !important; }`;
    } else if (bgTheme === "light3") {
      bg0 = "#dcfce7"; bg1 = "#f0fdf4"; sidebarBg = "#ffffff"; borderPrimary = "#4ade80"; borderSecondary = "#bbf7d0"; text100 = "#064e3b";
      const boxStyle = `background-color: #ffffff !important; border: 1px solid ${borderPrimary} !important;`;
      extraCss = lightModeOverride + `.bg-\\[\\#111120\\], .bg-\\[\\#0a0a14\\], .bg-\\[\\#0d0d1a\\], .bg-\\[\\#111928\\], .bg-\\[\\#1e1e38\\], .bg-\\[\\#2a2a50\\] { ${boxStyle} color: ${text100} !important; }`;
    } else if (bgTheme === "light4") {
      bg0 = "#ffedd5"; bg1 = "#fff7ed"; sidebarBg = "#ffffff"; borderPrimary = "#fdba74"; borderSecondary = "#fed7aa"; text100 = "#7c2d12";
      const boxStyle = `background-color: #ffffff !important; border: 1px solid ${borderPrimary} !important;`;
      extraCss = lightModeOverride + `.bg-\\[\\#111120\\], .bg-\\[\\#0a0a14\\], .bg-\\[\\#0d0d1a\\], .bg-\\[\\#111928\\], .bg-\\[\\#1e1e38\\], .bg-\\[\\#2a2a50\\] { ${boxStyle} color: ${text100} !important; }`;
    } else if (bgTheme === "light5") {
      bg0 = "#ede9fe"; bg1 = "#f5f3ff"; sidebarBg = "#ffffff"; borderPrimary = "#a78bfa"; borderSecondary = "#ddd6fe"; text100 = "#4c1d95";
      const boxStyle = `background-color: #ffffff !important; border: 1px solid ${borderPrimary} !important;`;
      extraCss = lightModeOverride + `.bg-\\[\\#111120\\], .bg-\\[\\#0a0a14\\], .bg-\\[\\#0d0d1a\\], .bg-\\[\\#111928\\], .bg-\\[\\#1e1e38\\], .bg-\\[\\#2a2a50\\] { ${boxStyle} color: ${text100} !important; }`;
    } else if (bgTheme === "light6") {
      bg0 = "#e0f7fa"; bg1 = "#f0fdf9"; sidebarBg = "#ffffff"; borderPrimary = "#67e8f9"; borderSecondary = "#cffafe"; text100 = "#134e4a";
      const boxStyle = `background-color: #ffffff !important; border: 1px solid ${borderPrimary} !important;`;
      extraCss = lightModeOverride + `.bg-\\[\\#111120\\], .bg-\\[\\#0a0a14\\], .bg-\\[\\#0d0d1a\\], .bg-\\[\\#111928\\], .bg-\\[\\#1e1e38\\], .bg-\\[\\#2a2a50\\] { ${boxStyle} color: ${text100} !important; }`;
    } else if (bgTheme === "light7") {
      bg0 = "#fef9c3"; bg1 = "#fffef0"; sidebarBg = "#ffffff"; borderPrimary = "#fde047"; borderSecondary = "#fef08a"; text100 = "#713f12";
      const boxStyle = `background-color: #ffffff !important; border: 1px solid ${borderPrimary} !important;`;
      extraCss = lightModeOverride + `.bg-\\[\\#111120\\], .bg-\\[\\#0a0a14\\], .bg-\\[\\#0d0d1a\\], .bg-\\[\\#111928\\], .bg-\\[\\#1e1e38\\], .bg-\\[\\#2a2a50\\] { ${boxStyle} color: ${text100} !important; }`;
    } else if (bgTheme === "draft") {
      bg0 = "#ffffff"; bg1 = "#f1f5f9"; sidebarBg = "#ffffff"; borderPrimary = "#cbd5e1"; borderSecondary = "#e2e8f0"; text100 = "#0f172a";
      const boxStyle = `background-color: #f1f5f9 !important; border: 1px solid ${borderPrimary} !important;`;
      extraCss = lightModeOverride + `.bg-\\[\\#111120\\], .bg-\\[\\#0a0a14\\], .bg-\\[\\#0d0d1a\\], .bg-\\[\\#111928\\], .bg-\\[\\#1e1e38\\], .bg-\\[\\#2a2a50\\] { ${boxStyle} color: ${text100} !important; }`;
    } else if (bgTheme === "retro") {
      bg0 = "#fffbe6";
      bg1 = "#ffffff";
      sidebarBg = "#fbe5a3";
      borderPrimary = "#000000";
      borderSecondary = "#111111";
      text100 = "#000000";
      text400 = "#333333";
      extraCss =
        lightModeOverride +
        `
          body {
            --font-sans: "Space Grotesk", sans-serif;
            --font-display: "Space Grotesk", sans-serif;
            --font-mono: "VT323", monospace;
            background-image: 
              radial-gradient(#000000 12%, transparent 13%),
              radial-gradient(#000000 12%, transparent 13%) !important;
            background-size: 20px 20px !important;
            background-position: 0 0, 10px 10px !important;
            background-color: #f9f5e1 !important;
          }
          .font-sans, .font-display { font-family: var(--font-sans) !important; font-weight: 900 !important; }
          .font-mono { font-family: var(--font-mono) !important; font-size: 1.2rem !important; }
          .rounded-2xl, .rounded-xl, .rounded-lg, .rounded { border-radius: 6px !important; }
          .border-\\[\\#2a2a50\\] { border-color: #000000 !important; border-width: 3px !important; }
          .border-\\[\\#111120\\] { border-color: #000000 !important; border-width: 3px !important; }
          .bg-\\[\\#111120\\] { 
            background-color: #ffffff !important; 
            box-shadow: 8px 8px 0px #000000 !important; 
            border: 3px solid #000000 !important;
            border-radius: 6px !important;
          }
          .text-slate-100, .text-white { color: #000000 !important; font-weight: 950 !important; text-transform: uppercase !important; }
          .text-slate-400 { color: #111111 !important; font-weight: 900 !important; }
          .bg-\\[\\#111120\\]::after {
            content: "✴️ RETRO_POP";
            position: absolute;
            bottom: 6px;
            right: 12px;
            background: #000;
            color: #fffbe6;
            font-size: 7px;
            font-family: monospace;
            padding: 1px 5px;
          }
        `;
    } else if (bgTheme === "cute") {
      bg0 = "#fff0f5";
      bg1 = "#ffffff";
      sidebarBg = "#ffe2e9";
      borderPrimary = "#ffb6c1";
      borderSecondary = "#ffd1dc";
      text100 = "#5a4b5e";
      text400 = "#88788c";
      extraCss =
        lightModeOverride +
        `
          body {
            --font-sans: "Quicksand", sans-serif;
            --font-display: "Quicksand", sans-serif;
            --font-mono: "Quicksand", sans-serif;
            background-image: 
              radial-gradient(#ffd1dc 30%, transparent 30%),
              radial-gradient(#ffe2f0 30%, transparent 30%) !important;
            background-size: 32px 32px !important;
            background-position: 0 0, 16px 16px !important;
            background-color: #fff2f6 !important;
          }
          .rounded-2xl { border-radius: 28px !important; }
          .rounded-xl { border-radius: 20px !important; }
          .rounded-lg { border-radius: 14px !important; }
          .font-sans, .font-display, .font-mono { font-family: "Quicksand", sans-serif !important; font-weight: 800 !important; }
          .bg-\\[\\#111120\\] { 
            background-color: #ffffff !important; 
            box-shadow: 0 12px 30px rgba(255, 150, 170, 0.22), inset 0 -4px 0 rgba(255,182,193,0.3) !important; 
            border: 3.5px solid #ffb6c1 !important;
            border-radius: 24px !important;
          }
          .bg-\\[\\#111120\\]::after {
            content: "☁️ SoftCloud ✨";
            position: absolute;
            top: -12px;
            right: 18px;
            background: linear-gradient(135deg, #ff9eb5 0%, #ffcbd5 100%);
            color: white;
            font-size: 8px;
            padding: 2.5px 10px;
            border-radius: 25px;
            font-weight: 900;
          }
          .text-slate-100 { color: #5a4b5e !important; }
          .text-slate-400 { color: #ff6b8b !important; }
        `;
    } else if (bgTheme === "playful") {
      bg0 = "#e0f2fe";
      bg1 = "#ffffff";
      sidebarBg = "#bae6fd";
      borderPrimary = "#0ea5e9";
      borderSecondary = "#38bdf8";
      text100 = "#01527e";
      text400 = "#38bdf8";
      extraCss =
        lightModeOverride +
        `
          body {
            --font-sans: "Space Grotesk", sans-serif;
            --font-display: "Space Grotesk", sans-serif;
            --font-mono: "Space Grotesk", sans-serif;
            background-image: 
              radial-gradient(circle at top right, rgba(14, 165, 233, 0.1), transparent 50%),
              repeating-linear-gradient(90deg, rgba(56, 189, 248, 0.05) 0px, rgba(56, 189, 248, 0.05) 4px, transparent 4px, transparent 30px) !important;
            background-color: #e0f2fe !important;
          }
          .font-sans, .font-display, .font-mono { font-family: "Space Grotesk", sans-serif !important; }
          .rounded-2xl { border-radius: 20px !important; }
          .bg-\\[\\#111120\\] { 
            background-color: #ffffff !important; 
            box-shadow: 0 10px 40px rgba(14, 165, 233, 0.18) !important;
            border: 3px solid #0ea5e9 !important;
            border-radius: 20px !important;
          }
          .text-slate-100 { color: #0369a1 !important; font-weight: 900 !important; }
          .text-slate-300 { color: #0ea5e9 !important; }
          .text-slate-400 { color: #0284c7 !important; font-weight: bold !important; }
          .bg-\\[\\#111120\\]::after {
            content: "🎉 JOYSTICK RIDE";
            position: absolute;
            top: -10px;
            right: 15px;
            background: #ffbc00;
            color: black;
            font-size: 7.5px;
            font-weight: 950;
            padding: 2px 7px;
            border-radius: 6px;
            border: 2px solid black;
          }
        `;
    } else if (bgTheme === "crimson") {
      bg0 = "#0d0202";
      bg1 = "#1a0303";
      sidebarBg = "#060101";
      borderPrimary = "#b91c1c";
      borderSecondary = "#5c0e0e";
      text100 = "#ffffff";
      text400 = "#ef4444";
      text500 = "#991b1b";
      extraCss = `
        body {
          --font-sans: "Inter", sans-serif;
          --font-display: "Space Grotesk", sans-serif;
          --font-mono: "JetBrains Mono", monospace;
          background-image: 
            radial-gradient(circle at center, #2e0505 0%, #0d0202 100%),
            repeating-linear-gradient(135deg, rgba(220, 38, 38, 0.03) 0px, rgba(220, 38, 38, 0.03) 1px, transparent 1px, transparent 40px) !important;
          background-color: #0d0202 !important;
        }
        .border-\\[\\#2a2a50\\] { border-color: #ef4444 !important; border-width: 1.5px !important; }
        .text-slate-400 { color: #fca5a5 !important; }
        .bg-\\[\\#111120\\] { 
          background-color: #120202 !important; 
          border: 1px solid #7f1d1d !important;
          border-left: 5px solid #ef4444 !important;
          box-shadow: 0 0 25px rgba(220, 38, 38, 0.18), inset 0 0 10px rgba(0,0,0,0.8) !important;
        }
        .bg-\\[\\#111120\\]::after {
          content: "☣️ [CRIMSON_GRID_SECTOR]";
          position: absolute;
          top: 6px;
          right: 14px;
          color: #ef4444;
          font-weight: 800;
          font-family: monospace;
          font-size: 7px;
        }
      `;
    } else if (bgTheme === "hacker") {
      bg0 = "#000000";
      bg1 = "#000c02";
      sidebarBg = "#000000";
      borderPrimary = "#00ff66";
      borderSecondary = "#003b12";
      text100 = "#00ff66";
      text400 = "#00ff66";
      extraCss = `
        body {
          --font-sans: "Consolas", "Courier New", monospace;
          --font-display: "Consolas", "Courier New", monospace;
          --font-mono: "Consolas", "Courier New", monospace;
          background-image: 
            linear-gradient(rgba(0,10,0,0.95), rgba(0,0,0,0.98)),
            repeating-linear-gradient(0deg, rgba(0, 255, 102, 0.03) 0px, rgba(0, 255, 102, 0.03) 2px, transparent 2px, transparent 10px) !important;
          background-color: #000000 !important;
        }
        .font-sans, .font-display, .font-mono { font-family: "Consolas", monospace !important; }
        .border-\\[\\#2a2a50\\] { border-color: #00ff66 !important; border-style: dashed !important; border-width: 1px !important; }
        .bg-\\[\\#111120\\] { 
          border: 1px solid #00ff66 !important; 
          background-color: rgba(0, 15, 4, 0.9) !important; 
          box-shadow: 0 0 15px rgba(0, 255, 102, 0.12) !important; 
        }
        .rounded-2xl, .rounded-xl, .rounded-lg, .rounded, .rounded-full { border-radius: 0px !important; }
        .text-slate-100, .text-white, .text-slate-200, .text-slate-300, .text-slate-400, .text-slate-500, .text-\\[\\#ff6b1a\\] { 
          color: #00ff66 !important; 
          text-shadow: 0 0 4px rgba(0, 255, 102, 0.6) !important; 
        }
        .border-\\[\\#1e1e38\\] { border-color: #004d1c !important; }
        .bg-\\[\\#111120\\]::after {
          content: "📟 [TERMINAL LOAD ACTIVE]";
          position: absolute;
          top: 6px;
          right: 14px;
          font-size: 7.5px;
          color: #00ff66;
          font-weight: bold;
          letter-spacing: 1px;
        }
      `;
    } else if (bgTheme === "cars") {
      bg0 = "#0a0a0d";
      bg1 = "#13141a";
      sidebarBg = "#040406";
      borderPrimary = "#ef4444";
      borderSecondary = "#272a35";
      text100 = "#ffffff";
      text400 = "#ef4444";
      extraCss = `
        body {
          --font-sans: "Space Grotesk", sans-serif;
          --font-display: "Space Grotesk", sans-serif;
          --font-mono: "Fira Code", monospace;
          background-image: 
            radial-gradient(circle at bottom right, rgba(239, 68, 68, 0.12) 0%, transparent 50%),
            repeating-linear-gradient(45deg, #13141a 0px, #13141a 12px, #0a0a0d 12px, #0a0a0d 24px) !important;
          background-color: #0a0a0d !important;
          font-style: italic !important;
        }
        .border-\\[\\#2a2a50\\] { border-color: #ef4444 !important; border-width: 2px !important; border-style: double !important; }
        .text-slate-100, .text-white { color: #ffffff !important; text-shadow: 0px 0px 10px rgba(239, 68, 68, 0.5) !important; font-weight: 900 !important; text-transform: uppercase !important; }
        .text-slate-400 { color: #ef4444 !important; font-weight: 800 !important; }
        .bg-\\[\\#111120\\] { 
          background-color: #171921 !important; 
          border: 2px solid #ef4444 !important;
          border-left: 8px solid #ef4444 !important;
          border-radius: 6px !important;
          box-shadow: 6px 6px 0px #000000, 0 10px 20px rgba(0,0,0,0.4) !important;
        }
        .bg-\\[\\#111120\\]::after {
          content: "🏁 F1 telemetry";
          position: absolute;
          top: -10px;
          right: 12px;
          background: #ef4444;
          color: white;
          font-size: 7.5px;
          font-family: monospace;
          padding: 1.5px 6px;
          font-weight: 900;
          border-radius: 2px;
        }
      `;
    } else if (bgTheme === "sports") {
      bg0 = "#011206";
      bg1 = "#062912";
      sidebarBg = "#000702";
      borderPrimary = "#ea580c";
      borderSecondary = "#166534";
      text100 = "#ffffff";
      text400 = "#22c55e";
      extraCss = `
        body {
          --font-sans: "Space Grotesk", sans-serif;
          --font-display: "Space Grotesk", sans-serif;
          --font-mono: "Courier New", monospace;
          background-image: 
            linear-gradient(180deg, #011206 0%, #03210d 100%),
            repeating-linear-gradient(90deg, rgba(34, 197, 94, 0.02) 0px, rgba(34, 197, 94, 0.02) 2px, transparent 2px, transparent 40px) !important;
          background-color: #011206 !important;
        }
        .border-\\[\\#2a2a50\\] { border-color: #ea580c !important; border-width: 2.5px !important; }
        .text-slate-100, .text-white { color: #ffffff !important; font-weight: 900 !important; text-transform: uppercase !important; letter-spacing: 1px !important; text-shadow: 2px 2px 0px #ea580c !important; }
        .text-slate-400 { color: #4ade80 !important; font-weight: 950 !important; }
        .bg-\\[\\#111120\\] { 
          background-color: #041f0d !important; 
          border: 3.5px solid #ea580c !important; 
          box-shadow: inset 0 0 15px rgba(34, 197, 94, 0.25), 8px 8px 0px #000000 !important;
          border-radius: 12px !important;
        }
        .bg-\\[\\#111120\\]::after {
          content: "● LIVE STADIUM TRACKER";
          position: absolute;
          top: 6px;
          right: 14px;
          color: #22c55e;
          font-weight: 900;
          font-size: 7px;
          font-family: monospace;
          letter-spacing: 0.5px;
        }
      `;
    } else if (bgTheme === "wildwest") {
      bg0 = "#261a0f";
      bg1 = "#382716";
      sidebarBg = "#1c120a";
      borderPrimary = "#bf8f54";
      borderSecondary = "#5c3f21";
      text100 = "#ebd0a9";
      text400 = "#d4af37";
      extraCss = `
        body {
          --font-sans: "Georgia", serif;
          --font-display: "Georgia", serif;
          --font-mono: "Courier New", monospace;
          background-color: #261a0f !important;
          background-image: 
            repeating-linear-gradient(0deg, #261a0f 0px, #261a0f 50px, #1a110a 50px, #1a110a 52px) !important;
        }
        .border-\\[\\#2a2a50\\] { border-color: #bf935c !important; border-width: 2px !important; }
        .text-slate-100, .text-white { color: #ebd0a9 !important; font-family: "Georgia", serif !important; font-weight: bold !important; text-shadow: 2px 2px 0px #000 !important; }
        .text-slate-400 { color: #d4af37 !important; font-weight: bold !important; }
        .bg-\\[\\#111120\\] { 
          background-color: #4a341d !important; 
          border: 3px solid #bf935c !important; 
          border-radius: 0px !important;
          box-shadow: 8px 8px 18px rgba(0,0,0,0.6) !important;
        }
        .bg-\\[\\#111120\\]::after {
          content: "🤠 SALOON WANTED";
          position: absolute;
          top: 8px;
          right: 12px;
          color: #d4af37;
          font-size: 8.5px;
          font-weight: bold;
          font-family: "Georgia", serif;
        }
      `;
    } else if (bgTheme === "futuristic") {
      bg0 = "#030611";
      bg1 = "#061026";
      sidebarBg = "#02040a";
      borderPrimary = "#38bdf8";
      borderSecondary = "#072f4a";
      text100 = "#38bdf8";
      text400 = "#00fbc5";
      extraCss = `
        body {
          --font-sans: "Space Grotesk", sans-serif;
          --font-display: "Space Grotesk", sans-serif;
          --font-mono: "Fira Code", monospace;
          background-image: 
            radial-gradient(circle at 50% 50%, #0e2042 0%, #030611 100%),
            repeating-linear-gradient(90deg, rgba(56, 189, 248, 0.015) 0px, rgba(56, 189, 248, 0.015) 1px, transparent 1px, transparent 30px) !important;
          background-color: #030611 !important;
        }
        .border-\\[\\#2a2a50\\] { border-color: #38bdf8 !important; border-width: 1px !important; }
        .text-slate-100, .text-white { color: #e2f5ff !important; text-shadow: 0 0 12px rgba(56, 189, 248, 0.6) !important; }
        .text-slate-400 { color: #00fbc5 !important; font-family: monospace !important; font-weight: bold; }
        .bg-\\[\\#111120\\] { 
          background-color: rgba(6, 18, 44, 0.75) !important; 
          backdrop-filter: blur(20px) !important;
          border: 1px solid rgba(56, 189, 248, 0.4) !important; 
          border-radius: 24px !important;
          box-shadow: 0 0 25px rgba(56, 189, 248, 0.15), inset 0 1px 1px rgba(255,255,255,0.1) !important;
        }
        .bg-\\[\\#111120\\]::after {
          content: "🔮 [UTOPIAN VECTOR]";
          position: absolute;
          top: -9px;
          right: 20px;
          background: rgba(56, 189, 248, 0.2);
          border: 1.5px solid #38bdf8;
          color: white;
          padding: 1.5px 8px;
          font-size: 7px;
          border-radius: 30px;
          font-weight: 800;
        }
      `;
    } else if (bgTheme === "proper3d") {
      bg0 = "#cbd5e1";
      bg1 = "#f1f5f9";
      sidebarBg = "#94a3b8";
      borderPrimary = "#94a3b8";
      borderSecondary = "#cbd5e1";
      text100 = "#0f172a";
      text400 = "#334155";
      extraCss =
        lightModeOverride +
        `
          body {
            --font-sans: "Space Grotesk", sans-serif;
            --font-display: "Space Grotesk", sans-serif;
            background: #cbd5e1 !important;
            background-image: radial-gradient(circle at center, #cbd5e1 0%, #94a3b8 100%) !important;
          }
          .rounded-2xl { border-radius: 20px !important; }
          .rounded-xl { border-radius: 14px !important; }
          .bg-\\[\\#111120\\] { 
            background: #f1f5f9 !important; 
            border: 1px solid #ffffff !important;
            box-shadow: 10px 10px 22px #94a3b8, -10px -10px 22px #ffffff !important;
            border-radius: 16px !important;
          }
          .border-\\[\\#2a2a50\\] { border-color: #cbd5e1 !important; }
          input, button {
            box-shadow: 4px 4px 8px #94a3b8, -4px -4px 8px #ffffff !important;
          }
        `;
    } else if (bgTheme === "proper2d") {
      bg0 = "#ffde00";
      bg1 = "#ffffff";
      sidebarBg = "#ff6bdf";
      borderPrimary = "#000000";
      borderSecondary = "#000000";
      text100 = "#000000";
      text400 = "#000000";
      extraCss =
        lightModeOverride +
        `
          body {
            --font-sans: "Space Grotesk", sans-serif;
            --font-display: "Space Grotesk", sans-serif;
            font-family: "Space Grotesk" !important;
            background-color: #ffde00 !important;
            background-image: radial-gradient(#000000 9%, transparent 9%) !important;
            background-size: 20px 20px !important;
          }
          .font-sans, .font-display, .font-mono { font-family: "Space Grotesk" !important; font-weight: 950 !important; }
          .rounded-2xl, .rounded-xl, .rounded-lg, .rounded, .rounded-full { border-radius: 0px !important; }
          .border-\\[\\#2a2a50\\] { border-color: #000000 !important; border-width: 4px !important; }
          .border-\\[\\#111120\\] { border-color: #000000 !important; border-width: 4px !important; }
          .bg-\\[\\#111120\\] { 
            border: 4.5px solid #000000 !important; 
            box-shadow: 10px 10px 0px #000000 !important; 
            background-color: #ffffff !important;
          }
          .text-slate-100, .text-white { color: #000000 !important; font-weight: 950 !important; -webkit-text-stroke: 1.5px #000 !important; }
          .text-slate-400 { color: #000000 !important; font-weight: 950 !important; }
          .bg-\\[\\#111120\\]::after {
            content: "✦ POP CRASH! ✦";
            position: absolute;
            top: -14px;
            right: 15px;
            background: #ff00ff;
            color: white;
            font-size: 9.5px;
            font-weight: 950;
            padding: 3px 10px;
            border: 3px solid #000;
            box-shadow: 3px 3px 0px #000;
          }
        `;
    } else if (bgTheme === "mafia") {
      bg0 = "#030303";
      bg1 = "#111113";
      sidebarBg = "#000000";
      borderPrimary = "#990000";
      borderSecondary = "#1b1b1c";
      text100 = "#ffffff";
      text400 = "#990000";
      extraCss = `
        body {
          --font-sans: "Playfair Display", serif;
          --font-display: "Playfair Display", serif;
          --font-mono: "Georgia", serif;
          background-image: 
            radial-gradient(ellipse at bottom, #2b0404 0%, #030303 100%),
            repeating-linear-gradient(90deg, #050505 0px, #050505 60px, rgba(130, 0, 0, 0.05) 60px, rgba(130, 0, 0, 0.05) 61px) !important;
          background-color: #030303 !important;
        }
        .border-\\[\\#2a2a50\\] { border-color: #880000 !important; border-width: 1.5px !important; }
        .text-slate-100, .text-white { color: #df1c1c !important; font-family: "Playfair Display" !important; text-shadow: 0 0 10px rgba(153, 0, 0, 0.7) !important; font-weight: bold; }
        .text-slate-400 { color: #990000 !important; font-weight: bold !important; font-style: italic !important; }
        .bg-\\[\\#111120\\] { 
          background-color: #0c0a0a !important; 
          border: 1.5px solid #2a1111 !important;
          border-left: 5px solid #bd1c1c !important;
          box-shadow: 0 15px 35px rgba(0,0,0,0.9), inset 0 0 10px rgba(189,28,28,0.08) !important;
          border-radius: 4px !important;
        }
        .bg-\\[\\#111120\\]::after {
          content: "🚬 LA FAMIGLIA UNDERWORLD";
          position: absolute;
          bottom: 8px;
          right: 14px;
          color: #bd1c1caa;
          font-size: 7.5px;
          font-weight: bold;
          letter-spacing: 1.5px;
          font-family: serif;
        }
      `;
    }

    cssStr += `
      body {
        background-color: ${bg0} !important;
        color: ${text300} !important;
      }
      .bg-\\[\\#0d0d1a\\] { background-color: ${bg0} !important; }
      .bg-\\[\\#111120\\] { background-color: ${bg1} !important; }
      .bg-\\[\\#0a0a14\\] { background-color: ${sidebarBg} !important; }
      .border-\\[\\#2a2a50\\] { border-color: ${borderPrimary} !important; }
      .border-\\[\\#1e1e38\\] { border-color: ${borderSecondary} !important; }
      
      /* Typography & textual color propagates */
      .text-slate-100, .text-white { color: ${text100} !important; }
      .text-slate-200 { color: ${text200} !important; }
      .text-slate-300 { color: ${text300} !important; }
      .text-slate-400 { color: ${text400} !important; }
      .text-slate-500 { color: ${text500} !important; }
      
      ${extraCss}
    `;
  }

  return cssStr;
};

// Views
import { StepByStepGuideModal } from "./components/StepByStepGuideModal";
import { GuidesView } from "./components/GuidesView";
import { Sidebar } from "./components/Sidebar";
import { MorningBriefing } from "./components/MorningBriefing";
import { EveningDebrief } from "./components/EveningDebrief";
import { DashboardView } from "./components/DashboardView";
import { DailyTrackerView } from "./components/DailyTrackerView";
import { GoalsView } from "./components/GoalsView";
import { AnalyticsView } from "./components/AnalyticsView";
import { CalendarView } from "./components/CalendarView";
import { RemindersView } from "./components/RemindersView";
import { JournalView } from "./components/JournalView";
import { PomoView } from "./components/PomoView";
import { SynopsisView } from "./components/SynopsisView";
import { SearchView } from "./components/SearchView";
import { SettingsView } from "./components/SettingsView";
import { HelpView } from "./components/HelpView";
import { DEMO_STATE } from "./utils/demoData";
import { ExpeditionsView } from "./components/ExpeditionsView";
import { FinancesView } from "./components/FinancesView";
import { SketchpadView } from "./components/SketchpadView";
import { AlertsView } from "./components/AlertsView";
import { AiAnalystView } from "./components/AiAnalystView";
import { FocusAudioView } from "./components/FocusAudioWidget";
import { TelemetryView } from "./components/TelemetryView";
import { OnboardingModal } from "./components/OnboardingModal";
import { ThemeAestheticBanner } from "./components/ThemeAestheticBanner";

import {
  AlertCircle,
  CheckCircle2,
  RotateCcw,
  X,
  PlusCircle,
  Check,
  Bot,
  ClipboardCopy,
  Info,
  ChevronUp,
  ChevronLeft,
} from "lucide-react";

import { getFileHandle } from "./utils/ghost";

const GhostAlert = ({ muted }: { muted?: boolean }) => {
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    const check = async () => {
      if (muted) {
        setShowAlert(false);
        return;
      }
      try {
        const handle = await getFileHandle();
        setShowAlert(!handle);
      } catch (e) {
        setShowAlert(true);
      }
    };
    check();
    const interval = setInterval(check, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, [muted]);

  if (!showAlert || muted) return null;

  return (
    <div className="fixed top-24 right-4 z-[60] animate-fade-in pointer-events-auto">
      <div className="bg-[#111120] border border-rose-500/50 p-4 rounded-xl shadow-[0_4px_24px_rgba(244,63,94,0.2)] flex flex-col gap-2 w-64 backdrop-blur-md">
        <div className="flex justify-between items-start">
          <h4 className="text-[10px] font-black text-rose-400 uppercase tracking-widest flex items-center gap-1.5">
            <AlertCircle size={14} /> Alert: Offline Mode
          </h4>
          <button
            onClick={() => setShowAlert(false)}
            className="text-slate-500 hover:text-white transition"
          >
            <X size={14} />
          </button>
        </div>
        <p className="text-[10px] text-rose-500/80 font-bold">
          Data is at risk!
        </p>
        <p className="text-[9px] text-slate-400 font-medium leading-relaxed">
          Ghost Sync is off. Please go to Settings and setup Ghost Sync to
          activate private auto-save to your hard drive.
        </p>
      </div>
    </div>
  );
};

const ReminderAlert = ({
  state,
  hasSystemAlerts,
  onNavigate,
}: {
  state: AppState;
  hasSystemAlerts: boolean;
  onNavigate: (v: string) => void;
}) => {
  const [show, setShow] = useState(false);
  const [counts, setCounts] = useState({ user: 0, sys: 0 });
  const [dismissedCount, setDismissedCount] = useState({ alerts: 0, time: 0 });

  useEffect(() => {
    const check = () => {
      const today = todayStr();
      const pNow = new Date();

      const isDueOrOverdue = (r: any) => {
        if (r.status === "done") return false;
        if (r.enableAlert === false) return false;

        if (r.dueDate < today) return true;

        if (r.dueDate === today) {
          if (!r.time) return true; // All day alerts

          const targetTime = new Date();
          const [h, m] = r.time.split(":").map(Number);
          targetTime.setHours(h, m, 0, 0);

          if (r.alertOffset) {
            targetTime.setMinutes(targetTime.getMinutes() - r.alertOffset);
          }

          if (pNow >= targetTime) return true;
        }
        return false;
      };
      const active = state.reminders?.filter(isDueOrOverdue) || [];
      const userCount = active.length;
      const sysCount = hasSystemAlerts ? 1 : 0;
      const totalAlerts = userCount + sysCount;

      if (totalAlerts > 0) {
        setCounts((prev) =>
          prev.user === userCount && prev.sys === sysCount
            ? prev
            : { user: userCount, sys: sysCount },
        );
        if (
          totalAlerts !== dismissedCount.alerts ||
          Date.now() - dismissedCount.time > 60 * 60 * 1000
        ) {
          setShow(true);
        }
      } else {
        setShow(false);
        setDismissedCount((prev) =>
          prev.alerts === 0 && prev.time === 0 ? prev : { alerts: 0, time: 0 },
        );
      }
    };
    check();
    // every minute is better for custom offset accuracy
    const interval = setInterval(check, 60 * 1000);
    return () => clearInterval(interval);
  }, [state.reminders, hasSystemAlerts, dismissedCount]);

  if (!show) return null;

  const total = counts.user + counts.sys;
  const isOnlySys = counts.sys > 0 && counts.user === 0;

  return (
    <div className="fixed bottom-24 left-4 md:left-[226px] z-[60] animate-bounce pointer-events-auto">
      <div className="bg-[#111120] border-2 border-rose-500 p-3 rounded-xl shadow-[0_4px_24px_rgba(244,63,94,0.4)] flex items-center gap-3 transition">
        <div
          onClick={() => onNavigate(isOnlySys ? "alerts" : "reminders")}
          className="flex items-center gap-3 cursor-pointer hover:opacity-80"
        >
          <div className="w-8 h-8 rounded-full bg-rose-500/20 text-rose-500 flex items-center justify-center">
            <AlertCircle size={16} />
          </div>
          <div>
            <h4 className="text-xs font-black text-rose-400 uppercase tracking-widest">
              {isOnlySys ? "System Alert" : "Active Reminder"}
            </h4>
            <p className="text-[10px] text-slate-300 font-bold">
              {total} Alert{total > 1 ? "s" : ""} Pending
            </p>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShow(false);
            setDismissedCount({ alerts: total, time: Date.now() });
          }}
          className="p-1.5 ml-2 hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 rounded-lg transition"
          title="Temporarily dismiss popup"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

import { focusAudio } from "./utils/audioSystem";

export default function App() {
  const [activeView, setActiveView] = useState<string>("dashboard");
  const [viewHistory, setViewHistory] = useState<string[]>([]);
  const [showMorningBriefing, setShowMorningBriefing] = useState(false);
  const [showEveningDebrief, setShowEveningDebrief] = useState(false);
  const [showPlanTomorrow, setShowPlanTomorrow] = useState(false);
  const [autoStartVoiceLog, setAutoStartVoiceLog] = useState(false);
  const [autoStartTextLog, setAutoStartTextLog] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      alert("App can be installed directly from your browser. Try clicking 'Add to Home Screen' on mobile or the Install icon in your desktop browser address bar.");
    }
  };

  const handleOmniMutations = (data: any) => {
    if ((!data.mutations || !Array.isArray(data.mutations)) && !data.pendingAudio && !data.pendingTranscript) return;
    
    setAppState(prev => {
      let next = { ...prev };
      const jd = activeDate;
      
      if (data.pendingAudio || data.pendingTranscript) {
         if (!next.journals[jd]) {
            next.journals[jd] = { date: jd, mood: 0, energy: 0, tags: [], sections: {}, savedAt: new Date().toISOString() };
         }
         if (data.pendingAudio) {
            next.journals[jd].audioLog = data.pendingAudio;
         }
         if (data.pendingTranscript) {
            const voicePromptId = "prompt_voice_auto_logs";
            const hasVoicePrompt = next.journalPrompts.some(p => p.id === voicePromptId);
            if (!hasVoicePrompt) {
               next.journalPrompts.push({
                  id: voicePromptId,
                  label: "Voice Auto-Logs",
                  placeholder: "Transcribed audio clips and commands..."
               });
            }
            const localTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const logStr = `[${localTimeStr}] ${data.pendingTranscript}`;
            const prevVal = next.journals[jd].sections[voicePromptId] || "";
            next.journals[jd].sections[voicePromptId] = prevVal ? `${prevVal}\n${logStr}` : logStr;
         }
      }

      const muts = Array.isArray(data.mutations) ? data.mutations : [];
      muts.forEach((mut: any) => {
         const { type, payload } = mut;
         if (!payload) return;
         
         if (type === 'CREATE_GOAL') {
             if (!next.financeGoals) next.financeGoals = [];
             next.financeGoals.push({
                id: payload.id || "g_" + Date.now(),
                title: payload.title,
                targetAmount: payload.targetAmount || 100,
                currentAmount: payload.currentAmount || 0,
                deadline: payload.deadline || new Date().toISOString().split("T")[0],
                category: payload.category || "General"
             } as any);
         } else if (type === 'LOG_TRACKER') {
             if (payload.categoryId && payload.item) {
                 const ds = payload.date || activeDate;
                 if (!next.daily[ds]) next.daily[ds] = {};
                 if (!next.daily[ds][payload.categoryId]) next.daily[ds][payload.categoryId] = {};
                 
                 // make sure item exists in schema
                 if (!next.items[payload.categoryId]) next.items[payload.categoryId] = [];
                 if (!next.items[payload.categoryId].includes(payload.item)) {
                     next.items[payload.categoryId].push(payload.item);
                 }

                 next.daily[ds][payload.categoryId][payload.item] = {
                     status: payload.status || 'done',
                     reps: 1, hours: 0, satisfaction: 0, notes: payload.notes || ""
                 };
             }
         } else if (type === 'EDIT_TRACKER') {
             if (payload.categoryId && payload.item && payload.targetField) {
                 const ds = payload.date || activeDate;
                 if (next.daily[ds]?.[payload.categoryId]?.[payload.item]) {
                    if (payload.targetField === 'reps') {
                        next.daily[ds][payload.categoryId][payload.item].reps = payload.value || 0;
                    } else if (payload.targetField === 'hours') {
                        next.daily[ds][payload.categoryId][payload.item].hours = payload.value || 0;
                    }
                 }
             }
         } else if (type === 'SET_TRACKER_GOAL') {
            if (payload.categoryId && payload.item && payload.targetField) {
                const cat = payload.categoryId;
                const item = payload.item;
                const field = payload.targetField;
                const val = Math.max(0, Number(payload.value) || 0);

                if (!next.repsTarget) next.repsTarget = {};
                if (!next.hoursTarget) next.hoursTarget = {};

                const targetObj = field === "reps" ? { ...next.repsTarget } : { ...next.hoursTarget };
                if (!targetObj[cat]) targetObj[cat] = {};
                targetObj[cat][item] = val;

                next[field === "reps" ? "repsTarget" : "hoursTarget" as any] = targetObj;
            }
        } else if (type === 'CREATE_REMINDER') {
             next.reminders.push({
                 id: payload.id || "rem_" + Date.now(),
                 title: payload.title,
                 dueDate: payload.dueDate || activeDate,
                 time: payload.time || '12:00',
                 status: 'pending',
                 createdAt: new Date().toISOString(),
                 priority: payload.priority || 'medium',
                 category: payload.category || 'general'
             });
         } else if (type === 'LOG_FINANCE') {
             if (!next.finances) next.finances = [];
             next.finances.push({
                 id: payload.id || "tx_" + Date.now(),
                 type: payload.type || 'expense',
                 amount: payload.amount || 0,
                 currency: payload.currency || 'USD',
                 concept: payload.concept || 'AI Entry',
                 category: payload.category || 'General',
                 date: payload.date || activeDate
             } as any);
         } else if (type === 'UPDATE_SETTINGS') {
             if (payload.theme) next.neonTheme = payload.theme;
             if (payload.bgTheme) next.bgTheme = payload.bgTheme;
             if (payload.dailyBudgetLimit !== undefined || payload.dailyIncomeTarget !== undefined) {
                 if (!next.profile) next.profile = { name: "User", tagline: "", email: "", dailyBudgetLimit: 0, dailyIncomeTarget: 0 };
                 if (payload.dailyBudgetLimit !== undefined) next.profile.dailyBudgetLimit = payload.dailyBudgetLimit;
                 if (payload.dailyIncomeTarget !== undefined) next.profile.dailyIncomeTarget = payload.dailyIncomeTarget;
             }
         } else if (type === 'APPEND_JOURNAL') {
             const jd = payload.date || activeDate;
             if (!next.journals[jd]) {
                next.journals[jd] = { date: jd, mood: 0, energy: 0, tags: [], sections: {}, savedAt: new Date().toISOString() };
             }
             let existingPrompt = null;
             
             // If not explicitly asked to create a new heading, try matching existing prompts
             if (!payload.createNewHeading) {
                 existingPrompt = next.journalPrompts.find(p => {
                      const topicLower = payload.topic?.toLowerCase() || "";
                      const plabel = p.label.toLowerCase();
                      if (plabel === topicLower || 
                          plabel.replace(/[^\w\s]/g, "").trim() === topicLower.replace(/[^\w\s]/g, "").trim() ||
                          p.id === topicLower) {
                          return true;
                      }
                      return false;
                 });
                 
                 if (!existingPrompt) {
                     // Try synonyms falling back to built-ins
                     existingPrompt = next.journalPrompts.find(p => {
                          const topicLower = payload.topic?.toLowerCase() || "";
                          if (topicLower.includes("reflection") || topicLower.includes("note") || topicLower.includes("thought") || topicLower.includes("general") || topicLower.includes("diary")) {
                              return p.id === 'notes';
                          } else if (topicLower.includes("win") || topicLower.includes("highlight") || topicLower.includes("gratitude")) {
                              return p.id === 'wins';
                          } else if (topicLower.includes("blocker") || topicLower.includes("challenge") || topicLower.includes("difficult")) {
                              return p.id === 'blockers';
                          } else if (topicLower.includes("tomorrow") || topicLower.includes("focus")) {
                              return p.id === 'tomorrow';
                          }
                          return false;
                     });
                 }
             }

             if (!existingPrompt) {
                 const labelNormalized = payload.topic ? (payload.topic.charAt(0).toUpperCase() + payload.topic.slice(1)) : "Note";
                 
                 // Try one more time to find an existing prompt by normalized label
                 existingPrompt = next.journalPrompts.find(p => p.label.toLowerCase().includes(labelNormalized.toLowerCase()));
                 
                 if (!existingPrompt) {
                    existingPrompt = { id: "prompt_" + Date.now() + Math.floor(Math.random() * 1000), label: "📌 " + labelNormalized.toUpperCase(), placeholder: `Write under ${labelNormalized}...` };
                    next.journalPrompts.push(existingPrompt);
                 }
             }
             const cur = next.journals[jd].sections[existingPrompt.id] || "";
             next.journals[jd].sections[existingPrompt.id] = cur ? cur + "\n" + payload.text : payload.text;
         } else if (type === 'UPDATE_JOURNAL_METRICS') {
             const jd = payload.date || activeDate;
             if (!next.journals[jd]) {
                next.journals[jd] = { date: jd, mood: 0, energy: 0, tags: [], sections: {}, savedAt: new Date().toISOString() };
             }
             if (payload.mood !== undefined) next.journals[jd].mood = payload.mood;
             if (payload.energy !== undefined) next.journals[jd].energy = payload.energy;
             if (payload.addTags && Array.isArray(payload.addTags)) {
                 const newTags = new Set([...next.journals[jd].tags, ...payload.addTags]);
                 next.journals[jd].tags = Array.from(newTags);
             }
         } else if (type === 'DELETE_ITEM') {
             if (payload.type === 'reminder') {
                 next.reminders = next.reminders.filter(r => r.id !== payload.id);
             } else if (payload.type === 'finance') {
                 next.finances = next.finances.filter(f => f.id !== payload.id);
             } else if (payload.type === 'goal') {
                 next.financeGoals = next.financeGoals.filter(g => g.id !== payload.id);
             }
         } else if (type === 'ADD_EXPEDITION') {
             if (!next.projects) next.projects = [];
             next.projects.push({
                 id: payload.id || "exp_" + Date.now(),
                 title: payload.title,
                 concept: payload.concept || "AI Generated Expedition",
                 status: "planning",
                 startDate: activeDate,
                 tasks: []
             } as any);
         }
      });
      
      saveData(next);
      return next;
    });

    if (data.aiResponse) {
       setCenterToast({ msg: "Global Voice Agent", sub: data.aiResponse });
       // Auto close after longer time to read
       setTimeout(() => setCenterToast(null), 8000);
    }
  };

  const handleNavigate = (newView: string) => {
    if (newView !== activeView) {
      setViewHistory((prev) => [...prev, activeView]);
      setActiveView(newView);
    }
  };

  const handleSidebarNavigate = (newView: string) => {
    if (newView !== activeView) {
      setViewHistory([]); // Clear history on direct sidebar navigation
      setActiveView(newView);
    }
  };

  const goBackView = () => {
    if (viewHistory.length > 0) {
      const prev = viewHistory[viewHistory.length - 1];
      setViewHistory((prevHistory) => prevHistory.slice(0, -1));
      setActiveView(prev);
    }
  };
  const [audioTrack, setAudioTrack] = useState("none");
  const [audioVolume, setAudioVolume] = useState(0.5);

  useEffect(() => {
    focusAudio.start(audioTrack);
    focusAudio.setVolume(audioVolume);
  }, [audioTrack]);

  useEffect(() => {
    focusAudio.setVolume(audioVolume);
  }, [audioVolume]);
  const [activeDate, setActiveDate] = useState<string>(todayStr());

  // Database store
  const [appState, setAppState] = useState<AppState>(() => {
    let loaded = loadData();
    if (
      typeof window !== "undefined" &&
      window.location.search.includes("demo=true") &&
      !localStorage.getItem("demo_lt_v5")
    ) {
      loaded = DEMO_STATE;
    }
    return loaded;
  });

  // Cloud sync
  const [syncCfg, setSyncCfg] = useState<SyncConfig>({
    provider: "none",
    gistToken: "",
    gistId: "",
    jbKey: "",
    jbId: "",
    lastSync: "",
    lastSyncTs: 0,
  });
  const [syncLog, setSyncLog] = useState<string>("");
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Toast status states
  const [toast, setToast] = useState<{
    msg: string;
    type: "ok" | "nfo" | "action";
    actionBtn?: { label: string, onClick: () => void };
  } | null>(null);

  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (appState) {
      if (!appState.onboarding?.hasSeenGlobalOnboarding && !appState.onboarding?.[activeView]) {
        setShowOnboarding(true);
      } else {
        setShowOnboarding(false);
      }
    }
  }, [activeView, appState?.onboarding]);

  const handleDismissOnboarding = () => {
    setShowOnboarding(false);
    
    // Also intelligently stow the module guide floater since they finished the master manual.
    setIsGuideFloaterClosed(true);
    setCenterToast({
       msg: "MODULE GUIDE STOWED",
       sub: "The floating Module Guide banner has been hidden. You can access the manual anytime from the AI Analyst hub."
    });

    const updatedOnboarding = { ...(appState.onboarding || {}) };
    const allViews = [
      "dashboard", "daily", "journal", "expeditions", "finances", "focus_audio", 
      "sketchpad", "goals", "analytics", "calendar", "telemetry", "ai_analyst", 
      "reminders", "pomo", "synopsis", "search", "settings", "alerts", "guides", "help", "demo"
    ];
    allViews.forEach(v => {
      updatedOnboarding[v] = true;
    });
    updatedOnboarding.hasSeenGlobalOnboarding = true;

    setAppState((prev) => ({
      ...prev,
      hideGuideFloater: true,
      onboarding: updatedOnboarding,
    }));
    saveData({
      ...appState,
      hideGuideFloater: true,
      onboarding: updatedOnboarding,
    });
  };

  // Pomodoro Shared States
  const [pomoState, setPomoState] = useState<"idle" | "work" | "break">("idle");
  const [isPomoPaused, setIsPomoPaused] = useState<boolean>(false);
  const [pomoTimeLeft, setPomoTimeLeft] = useState<string>("25:00");
  const [pomoPercent, setPomoPercent] = useState<number>(0);
  const [pomoElapsedSeconds, setPomoElapsedSeconds] = useState<number>(0);
  const [pomoTaskName, setPomoTaskName] = useState<string | null>(null);
  const [pomoTaskCat, setPomoTaskCat] = useState<TrackerCategory | null>(null);
  const [pomoWorkMin, setPomoWorkMin] = useState<number>(25);
  const [pomoBrkMin, setPomoBrkMin] = useState<number>(5);
  const [pomoPreset, setPomoPreset] = useState<string>("classic");

  // Recurring Modal Overlay State
  const [recModalOpen, setRecModalOpen] = useState(false);
  const [recCat, setRecCat] = useState<TrackerCategory | null>(null);
  const [recItem, setRecItem] = useState<string | null>(null);
  const [recFreq, setRecFreq] = useState<
    "daily" | "weekdays" | "weekends" | "custom"
  >("daily");
  const [recDays, setRecDays] = useState<number[]>([]);

  // Guide Modal
  const [guideModalOpen, setGuideModalOpen] = useState(false);
  const [isAiAnalystClosed, setIsAiAnalystClosed] = useState(false);
  const [isGuideFloaterClosed, setIsGuideFloaterClosed] = useState(false);
  const [centerToast, setCenterToast] = useState<{ msg: string; sub?: string } | null>(null);

  useEffect(() => {
    if (centerToast) {
      const tid = setTimeout(() => setCenterToast(null), 6000);
      return () => clearTimeout(tid);
    }
  }, [centerToast]);

  // AI Analyst Modal
  const [aiModal, setAiModal] = useState<{
    isOpen: boolean;
    promptText: string;
  }>({ isOpen: false, promptText: "" });

  const handleOpenAIAnalyst = (customPrompt?: string | React.MouseEvent) => {
    let finalPrompt = typeof customPrompt === "string" ? customPrompt : null;

    if (!finalPrompt) {
      // Per User Request: Always feed purely all interrelated data for maximum cross-referencing capabilities
      const focusData = appState;
      let specificInstructions = "";

      if (activeView === "dashboard") {
        specificInstructions = `
### DOMAIN FOCUS: DASHBOARD & GLOBAL MOMENTUM
- **Objective**: Provide a macro-level assessment of my entire operational momentum based on all interconnected domains across my life.
- **Deep Analysis**: Analyze the interconnectedness of my daily completion rates, habit streaks, Pomodoro focus times, financial health, and emotional journal entries simultaneously. 
- **Identify**: Are there specific environmental factors, financial stressors, or time periods that correlate with high or low productivity? 
- **Output**: Give me a highly advanced "State of the Union" address on my life's operating system.
`;
      } else if (activeView === "daily") {
        specificInstructions = `
### DOMAIN FOCUS: DAILY TRACKER & ROUTINE OPTIMIZATION
- **Objective**: Analyze my micro-habits and daily routines within the broader context of my entire life operating system (goals, finances, journals, reminders).
- **Deep Analysis**: Look at my daily tracking (\`daily\`) and correlate it tightly with my Evening Debriefs, goals (\`goals\`), Focus sessions (\`pomoSessions\`), and emotional triggers in my Journal (\`journals\`).
- **Identify**: Which habits am I consistently missing? What is the trigger across my entire dataset? Are there specific routines that mathematically lead to a higher overall daily completion rate? Is there a day of the week where my discipline breaks down? Do my pending reminders (\`reminders\`) or financial stress (\`finances\`) cause me to miss habits?
- **Output**: Provide the most detailed and advanced tactical schedule breakdown possible.
`;
      } else if (activeView === "journal") {
        specificInstructions = `
### DOMAIN FOCUS: PSYCHOLOGY, MOOD & JOURNALING
- **Objective**: Conduct a deep psychological and behavioral analysis of my daily journal entries and cross-correlate with all life domains.
- **Deep Analysis**: Read my text entries, tags, mood (1-5), and energy (1-5) ratings in \`journals\`. Correlate this emotional data broadly with my physical output in \`daily\`, my spending patterns in \`finances\`, and focus in \`pomoSessions\`.
- **Identify**: What linguistic patterns, tags, financial transactions, or life events (like \`expeditions\`) reliably precede a drop in mood or energy? When my energy is peak (5), what was the exact sequence of events the day before across all modules?
- **Output**: Output a highly advanced psychological profile and predictive emotional framework.
`;
      } else if (activeView === "finances") {
        specificInstructions = `
### DOMAIN FOCUS: FINANCIAL LEDGER & RUN-RATE BURN
- **Objective**: Act as a brutal, forensic financial auditor interpreting my spending across all general life contexts.
- **Deep Analysis**: Analyze every transaction, categorization, and timestamp. Correlate my spending habits directly with my \`journals\` (do I spend more money when my mood is low?) and my \`daily\` routines (does high spending correlate with missing study habits, or vice versa?).
- **Identify**: Calculate my true daily burn rate. Am I violating my monthly budget limits? What are my most toxic financial leaks?
- **Output**: Provide an unparalleled forensic financial breakdown. Link my spending to my habits. Provide a strict, data-driven financial optimization blueprint.
`;
      } else if (activeView === "expeditions") {
        specificInstructions = `
### DOMAIN FOCUS: TRAVEL & EXPEDITION LOGISTICS
- **Objective**: Optimize my active and upcoming travel plans with deep context to my daily life constraints.
- **Deep Analysis**: Review my \`expeditions\` packing lists/destinations. Cross-reference this with my \`finances\` (am I budgeting for these trips?), \`reminders\` (alerts), and \`goals\`.
- **Identify**: How does travel impact my \`daily\` habit completion rates?
- **Output**: Provide an elite logistical briefing for my upcoming trips and suggest optimizations for maintaining habits while traveling.
`;
      } else if (activeView === "reminders") {
        specificInstructions = `
### DOMAIN FOCUS: ALARMS, REMINDERS & COGNITIVE LOAD
- **Objective**: Analyze my cognitive load and schedule management holistically.
- **Deep Analysis**: Look at my \`reminders\`, recurring loops, and priority tags. Cross-reference this with my \`finances\` (billing schedules) and \`daily\` habit completion rates.
- **Identify**: Am I setting too many alarms and suffering from alert fatigue? Are there high-priority tasks I am constantly deferring? 
- **Output**: Restructure my psychological schedule mapping to end procrastination and alert fatigue based on all connected data.
`;
      } else if (activeView === "goals") {
        specificInstructions = `
### DOMAIN FOCUS: MACRO GOALS & TARGET ATTRITION
- **Objective**: Evaluate my long-term trajectory versus my actual short-term execution context.
- **Deep Analysis**: Compare my defined \`goals\` against the raw execution data in \`daily\` and \`pomoSessions\`, while factoring in \`journals\` mood drops and \`finances\` boundaries.
- **Identify**: Where is the exact numerical gap between my ambition and my execution? Extrapolate failures mathematically. 
- **Output**: Provide a strict, cross-correlated reality check on my goals. Give me a drastic multidimensional operational plan.
`;
      } else if (activeView === "pomo") {
        specificInstructions = `
### DOMAIN FOCUS: DEEP WORK & FLOW PREDICTION
- **Objective**: Analyze my attention span and deep work capacity.
- **Deep Analysis**: Analyze \`pomoSessions\` durations and habits. Deeply correlate with \`journals\` (energy levels), \`finances\` (stress), and \`daily\` schedules.
- **Identify**: What exact combination of time, energy, and prior day activities unlock my longest focus sessions?
- **Output**: Give me a neuro-optimized flow-state prediction model based strictly on my historical data across all systems.
`;
      } else if (activeView === "search") {
        specificInstructions = `
### DOMAIN FOCUS: OMNI KNOWLEDGE GRAPH & SEMANTIC RESONANCE
- **Objective**: Analyze the deep topological connections of my life nodes.
- **Deep Analysis**: I am currently using the D3 Knowledge Graph (The Priest view). Analyze the \`daily\`, \`finances\`, \`journals\`, and \`tags\` to find semantic clusters.
- **Identify**: Which tags or habits act as central hubs connecting my finances, mood, and productivity? Are there isolated events that sparked long chains of habits?
- **Output**: Map my life dynamically. Tell me exactly what node I should focus on building or destroying next to optimize the network.
`;
      } else {
        specificInstructions = `
### DOMAIN FOCUS: HOLISTIC SYSTEM ANALYSIS
- **Objective**: Pure advanced mechanism to extract maximum insight.
- **Deep Analysis**: Cross-reference all modules dynamically to find hidden correlations in my general life.
- **Output**: Provide the ultimate interconnected lifestyle optimization report.
`;
      }

      let summaryText = "";
      try {
        summaryText = JSON.stringify(focusData, null, 2);
        if (summaryText.length > 80000) {
          summaryText =
            summaryText.substring(0, 80000) +
            "\n... [Data Truncated due to size but trends remain visible]";
        }
      } catch (e) {
        summaryText = "[Data Overview]";
      }

      finalPrompt = `Hello AI, act as my elite personal analyst, data scientist, and life-optimization executive assistant for my "Omnilife Tracker".

### OVERALL PRIME DIRECTIVE:
I am providing you with my personal real-world data exported directly from Omnilife Tracker. I want you to perform a highly advanced, brutal, and mathematically precise analysis to help me optimize my life, habits, productivity, and finances. Do not give generic self-help advice. Base EVERY insight on the exact numbers, correlations, and timestamps provided in the JSON data.

### OMNILIFE TRACKER - SYSTEM ARCHITECTURE (HOW TO READ THE DATA):
Omnilife Tracker is a comprehensive life-management engine. All my data is stored as a massive interconnected JSON tree. The modules are deeply interlocked:
1. **Daily Tracker (\`daily\`)**: Contains \`status\` (pending | done | missed | skipped), \`hours\` (number), \`reps\` (number), \`notes\`, and \`satisfaction\`. Evening Debriefs lock this data in.
2. **Daily Journal (\`journals\`)**: Contains \`mood\` (1-5 scale), \`energy\` (1-5 scale), \`tags\`, text arrays, and canvas sketches. Crucial for psychological correlation.
3. **Goals & Targets (\`goals\`)**: Structured by period ('weekly', 'monthly', 'yearly', 'lifetime').
4. **Finances (\`finances\`)**: Highly advanced ledger. Contains \`transactions\` with exact date & categorization.
5. **Pomodoro Focus (\`pomoSessions\`)**: Focus timer logs with start/end timestamps.
6. **Reminders (\`reminders\`)**: Cognitive load, priority loops, and scheduled time-blocks.
7. **Expeditions (\`expeditions\`)**: Tactical deployment tracking, location mapping, and payload logistics.
8. **Knowledge Graph / The Priest**: The omni-view semantic layer. You MUST act as this node graph. When analyzing the JSON, build virtual edges connecting finances to journals to habits.
9. **OmniLife Voice/Text Mutations**: If you want to suggest actionable changes, you MUST formulate them as natural language instructions that can be parsed by an NLP model. Examples: "Log a 50 USD expense for dining today", "Create a reminder to pay rent tomorrow at 9 AM", "Create an expedition to Tokyo next week", "Set my mood to 5 for yesterday", or "Mark habit gym as done today." I will copy your suggested text into my app's input!

${specificInstructions}

### EXPORTED JSON DATA MINING TARGET:
\`\`\`json
${summaryText}
\`\`\`

### REQUIRED OUTPUT FORMAT:
1. **The Hard Truth**: 1-2 paragraphs of brutal, undeniable truths hidden in the data. What am I doing wrong?
2. **Hidden Correlations**: Bullet points connecting variables across different modules (e.g. "On days you spend >$50 on Food, your Focus hours drop by 40%").
3. **Strategic Execution Roadmaps**: 3-5 hyper-specific, actionable implementations I must make TODAY to accelerate my momentum, complete with exact numerical targets to hit.
4. **Tone**: Be professional, stoic, analytical, objective, and highly strategic. No fluff.`;
    }

    setAiModal({ isOpen: true, promptText: finalPrompt });
  };

  // 1. Initial Load
  useEffect(() => {
    let loaded = loadData();
    // If in demo mode and no demo data was loaded from storage, use DEMO_STATE
    if (
      window.location.search.includes("demo=true") &&
      !localStorage.getItem("demo_lt_v5")
    ) {
      loaded = DEMO_STATE;
      saveData(DEMO_STATE);
    }

    setAppState(loaded);

    const loadedSync = loadSyncCfg();
    setSyncCfg(loadedSync);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(err => {
        console.error("Service Worker registration failed:", err);
      });
    }
  }, []);

  const [ghostOffline, setGhostOffline] = useState(false);

  useEffect(() => {
    // Check ghost sync status periodically for alerts badge
    const checkGhostStatus = async () => {
      try {
        const handle = await getFileHandle();
        setGhostOffline(!handle);
      } catch (e) {
        setGhostOffline(true);
      }
    };
    checkGhostStatus();
    const iv = setInterval(checkGhostStatus, 5000);
    return () => clearInterval(iv);
  }, []);

  // 2. Toast managers
  const showToast = (msg: string, type: "ok" | "nfo" | "action" = "ok", actionBtn?: { label: string, onClick: () => void }) => {
    setToast({ msg, type, actionBtn });
  };

  useEffect(() => {
    if (toast) {
      if (toast.type === "action") {
         const tid = setTimeout(() => setToast(null), 10000);
         return () => clearTimeout(tid);
      } else {
         const tid = setTimeout(() => setToast(null), 3000);
         return () => clearTimeout(tid);
      }
    }
  }, [toast]);

  // Check reminders on loop natively
  useEffect(() => {
    const notifyLoop = setInterval(() => {
      const now = new Date();
      const yr = now.getFullYear();
      const mt = String(now.getMonth() + 1).padStart(2, '0');
      const dy = String(now.getDate()).padStart(2, '0');
      const currentDate = `${yr}-${mt}-${dy}`;
      const hrs = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');
      const currentTime = `${hrs}:${mins}`;

      appState.reminders?.forEach(rem => {
        if (rem.status === 'pending' && rem.dueDate === currentDate && rem.time === currentTime) {
           const guardKey = `notif_${rem.id}_${currentDate}_${currentTime}`;
           if (!localStorage.getItem(guardKey)) {
              sendBackgroundNotification(`Reminder: ${rem.title}`, {
                 body: rem.notes || 'Scheduled alert.',
                 icon: '/icon.svg'
              });
              localStorage.setItem(guardKey, "true");
           }
        }
      });
    }, 20000); 
    return () => clearInterval(notifyLoop);
  }, [appState.reminders]);

  // 3. Sync Logger helper
  const logSync = (msg: string) => {
    const ts = new Date().toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    setSyncLog((prev) => `[${ts}] ${msg}\n${prev}`);
  };

  // 4. Cloud operations
  const syncNow = async () => {
    if (syncCfg.provider === "none") {
      showToast("CLOUDSYNC IS TERMINATED", "nfo");
      return;
    }
    setIsSyncing(true);
    logSync("Sync initialized...");

    try {
      if (syncCfg.provider === "gist") {
        const res = await syncGist(syncCfg, appState);
        setSyncCfg((prev) => {
          const next = {
            ...prev,
            gistId: res.gistId,
            lastSync: "ok" as const,
            lastSyncTs: Date.now(),
          };
          saveSyncCfg(next);
          return next;
        });
      } else {
        const res = await syncJSONBin(syncCfg, appState);
        setSyncCfg((prev) => {
          const next = {
            ...prev,
            jbId: res.binId,
            lastSync: "ok" as const,
            lastSyncTs: Date.now(),
          };
          saveSyncCfg(next);
          return next;
        });
      }
      logSync("Sync success ✓");
      showToast("DATABASE SAVED TO CLOUD DRIVE", "ok");
    } catch (err: any) {
      setSyncCfg((prev) => {
        const next = { ...prev, lastSync: "error" as const };
        saveSyncCfg(next);
        return next;
      });
      logSync(`Sync failed: ${err.message}`);
      showToast(`SYNC FAILED: ${err.message}`, "nfo");
    } finally {
      setIsSyncing(false);
    }
  };

  const pullFromCloud = async () => {
    if (syncCfg.provider === "none") return;
    if (
      !confirm(
        "PULL DATABASE BACKUP?\nYour local un-synchronized changes will be completely overwritten.",
      )
    )
      return;
    setIsSyncing(true);
    logSync("Pull initialized...");

    try {
      let pulled: AppState;
      if (syncCfg.provider === "gist") {
        pulled = await pullGist(syncCfg);
      } else {
        pulled = await pullJSONBin(syncCfg);
      }

      setAppState(pulled);
      saveData(pulled);
      logSync("Pull success ✓");
      showToast("PULLED DATABASE BACKUP SUCCESSFULLY", "ok");
    } catch (err: any) {
      logSync(`Pull failed: ${err.message}`);
      showToast(`PULL FAILED: ${err.message}`, "nfo");
    } finally {
      setIsSyncing(false);
    }
  };

  const updateSyncFields = (updatedFields: Partial<SyncConfig>) => {
    setSyncCfg((prev) => {
      const next = { ...prev, ...updatedFields };
      saveSyncCfg(next);
      return next;
    });
  };

  const selectSyncProvider = (provider: "none" | "gist" | "jsonbin") => {
    setSyncCfg((prev) => {
      const next = { ...prev, provider };
      saveSyncCfg(next);
      return next;
    });
    logSync(`Selected cloud: ${provider.toUpperCase()}`);
  };

  const clearSyncConfig = () => {
    const next: SyncConfig = {
      provider: "none",
      gistToken: "",
      gistId: "",
      jbKey: "",
      jbId: "",
      lastSync: "",
      lastSyncTs: 0,
    };
    setSyncCfg(next);
    saveSyncCfg(next);
    setSyncLog("");
    showToast("DISCONNECTED SYNC PROFILE", "nfo");
  };

  // 5. Pomodoro clock ticker
  useEffect(() => {
    let intervalId: any = null;
    if (pomoState !== "idle") {
      if (!isPomoPaused) {
        intervalId = setInterval(() => {
          setPomoElapsedSeconds((prev) => {
            const next = prev + 1;
            const targetLimit =
              (pomoState === "work" ? pomoWorkMin : pomoBrkMin) * 60;

            if (next >= targetLimit) {
              clearInterval(intervalId);
              onPomoCycleCompleted();
              return 0;
            }

            // Format countdown format
            const rem = targetLimit - next;
            const m = String(Math.floor(rem / 60)).padStart(2, "0");
            const s = String(rem % 60).padStart(2, "0");
            setPomoTimeLeft(`${m}:${s}`);
            setPomoPercent(next / targetLimit);
            return next;
          });
        }, 1000);
      }
    } else {
      const m = String(pomoWorkMin).padStart(2, "0");
      setPomoTimeLeft(`${m}:00`);
      setPomoPercent(0);
    }

    return () => clearInterval(intervalId);
  }, [pomoState, pomoWorkMin, pomoBrkMin, isPomoPaused]);

  const onPomoCycleCompleted = () => {
    const isWork = pomoState === "work";
    
    // Play sound snippet here if desired...
    
    // Native Notification
    sendBackgroundNotification(isWork ? "Focus Session Complete!" : "Break Finished!", {
      body: isWork ? `Great job! You focused on ${pomoTaskName || 'your task'} for ${pomoWorkMin} minutes.` : "Time to get back to work!",
      icon: "/icon.svg"
    });

    if (isWork && pomoTaskName) {
      const minsEarned = pomoWorkMin;
      const hrsEquivalent = Math.round((minsEarned / 60) * 100) / 100;

      const newSession: PomoSession = {
        id: "p_done_" + Date.now(),
        task: pomoTaskName,
        cat: pomoTaskCat || "custom",
        duration: minsEarned,
        type: "work",
        date: todayStr(),
        time: new Date().toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        status: "completed",
      };

      // Sound feedback synth
      try {
        const audioCtx = new (
          window.AudioContext || (window as any).webkitAudioContext
        )();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(880, audioCtx.currentTime); // High A
        gain.gain.setValueAtTime(0.35, audioCtx.currentTime);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.35);
      } catch (err) {}

      setAppState((prev) => {
        const cat = pomoTaskCat || "custom";
        const item = pomoTaskName;

        let dailyNode = { ...prev.daily };
        if (!dailyNode[activeDate]) dailyNode[activeDate] = {};
        if (!dailyNode[activeDate][cat]) dailyNode[activeDate][cat] = {};

        const currentEntry = dailyNode[activeDate][cat]![item] || {
          status: "pending",
          reps: 0,
          hours: 0,
          satisfaction: 0,
          notes: "",
        };

        const updatedEntry = {
          ...currentEntry,
          status: "done" as const,
          hours:
            Math.round(((currentEntry.hours || 0) + hrsEquivalent) * 100) / 100,
        };

        dailyNode[activeDate][cat]![item] = updatedEntry;

        const next = {
          ...prev,
          pomoSessions: [...(prev.pomoSessions || []), newSession],
          daily: dailyNode,
        };
        saveData(next);
        return next;
      });

      showToast(
        `CONGRATS! ${pomoWorkMin}MIN FOCUS ACHIEVED — ADDED TO TODAY CHECKLIST!`,
        "ok",
      );

      // Auto transitions into breaks
      setPomoState("break");
      setPomoElapsedSeconds(0);
      setIsPomoPaused(false);
    } else {
      // Completed breaks
      try {
        const audioCtx = new (
          window.AudioContext || (window as any).webkitAudioContext
        )();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = "triangle";
        osc.frequency.setValueAtTime(440, audioCtx.currentTime); // Concert A
        gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.45);
      } catch (err) {}

      showToast("BREAK CONCLUDED. SELECT WORK TARGET AND RESTART LOCK!", "ok");
      setPomoState("idle");
      setPomoElapsedSeconds(0);
    }
  };

  const stopPomo = () => {
    if (pomoState === "idle") return;

    const secondsTracked = pomoElapsedSeconds;

    // Record incomplete or failed Pomodoro sessions
    if (pomoState === "work" && secondsTracked > 5 && pomoTaskName) {
      const minutesSpent = Math.round((secondsTracked / 60) * 100) / 100;

      const newSession: PomoSession = {
        id: "p_failed_" + Date.now(),
        task: pomoTaskName,
        cat: pomoTaskCat || "custom",
        duration: minutesSpent,
        type: "work",
        date: todayStr(),
        time: new Date().toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        status: "interrupted",
      };

      setAppState((prev) => {
        const cat = pomoTaskCat || "custom";
        const item = pomoTaskName;

        let dailyNode = { ...prev.daily };
        if (!dailyNode[activeDate]) dailyNode[activeDate] = {};
        if (!dailyNode[activeDate][cat]) dailyNode[activeDate][cat] = {};

        const currentEntry = dailyNode[activeDate][cat]![item] || {
          status: "pending",
          reps: 0,
          hours: 0,
          satisfaction: 0,
          notes: "",
        };

        const hrsEquivalent = Math.round((minutesSpent / 60) * 100) / 100;
        const updatedEntry = {
          ...currentEntry,
          hours:
            Math.round(((currentEntry.hours || 0) + hrsEquivalent) * 100) / 100,
        };

        dailyNode[activeDate][cat]![item] = updatedEntry;

        const next = {
          ...prev,
          pomoSessions: [...(prev.pomoSessions || []), newSession],
          daily: dailyNode,
        };
        saveData(next);
        return next;
      });

      showToast(
        `interruption recorded! logged ${minutesSpent}m focus effort successfully.`,
        "ok",
      );
    } else {
      showToast("FOCUS LOOP DISCONNECTED EARLY — SESSION UN-LOGGED", "nfo");
    }

    setPomoState("idle");
    setPomoPercent(0);
    setPomoElapsedSeconds(0);
    setIsPomoPaused(false);
  };

  const handleStartPomo = () => {
    if (pomoState !== "idle") return;
    if (!pomoTaskName) return;

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    setPomoState("work");
    setPomoElapsedSeconds(0);
    setIsPomoPaused(false);
    showToast(`FOCUS LOCKED ON: ${pomoTaskName.toUpperCase()}`, "ok");
  };

  const handleSetPomoTask = (cat: TrackerCategory, item: string) => {
    setPomoTaskCat(cat);
    setPomoTaskName(item);
    showToast(`POMO TARGET REGISTERED: ${item.toUpperCase()}`, "ok");
    handleNavigate("pomo");
  };

  const handleSetPomoPreset = (preset: string) => {
    setPomoPreset(preset);
    if (pomoState !== "idle") return;

    if (preset === "classic") {
      setPomoWorkMin(25);
      setPomoBrkMin(5);
    } else if (preset === "deep") {
      setPomoWorkMin(50);
      setPomoBrkMin(10);
    } else if (preset === "ultra") {
      setPomoWorkMin(90);
      setPomoBrkMin(20);
    }
  };

  const handleSetPomoCustom = (work: number, brk: number) => {
    setPomoWorkMin(work);
    setPomoBrkMin(brk);
  };

  // 6. Database Getters
  const getDayD = (
    ds: string,
    cat: TrackerCategory,
    item: string,
  ): DayEntry => {
    if (!appState.daily[ds]) appState.daily[ds] = {};
    if (!appState.daily[ds][cat]) appState.daily[ds][cat] = {};
    if (!appState.daily[ds][cat]![item]) {
      appState.daily[ds][cat]![item] = {
        status: "pending",
        reps: appState.repsTarget[cat]?.[item] ?? 1,
        hours: appState.hoursTarget[cat]?.[item] ?? 1,
        satisfaction: 0,
        notes: "",
      };
    }
    return appState.daily[ds][cat]![item];
  };

  const updateDayField = (
    ds: string,
    cat: TrackerCategory,
    item: string,
    field: keyof DayEntry,
    val: any,
  ) => {
    setAppState((prev) => {
      let dailyNode = { ...prev.daily };
      if (!dailyNode[ds]) dailyNode[ds] = {};
      if (!dailyNode[ds][cat]) dailyNode[ds][cat] = {};

      const current = dailyNode[ds][cat]![item] || {
        status: "pending",
        reps: prev.repsTarget[cat]?.[item] ?? 1,
        hours: prev.hoursTarget[cat]?.[item] ?? 1,
        satisfaction: 0,
        notes: "",
      };

      const updated = { ...current, [field]: val };
      dailyNode[ds][cat]![item] = updated;

      const next = { ...prev, daily: dailyNode };
      saveData(next);
      return next;
    });
  };

  const getRepsT = (cat: TrackerCategory, item: string): number => {
    return appState.repsTarget[cat] &&
      appState.repsTarget[cat]![item] !== undefined
      ? appState.repsTarget[cat]![item]
      : 1;
  };

  const getHrsT = (cat: TrackerCategory, item: string): number => {
    return appState.hoursTarget[cat] &&
      appState.hoursTarget[cat]![item] !== undefined
      ? appState.hoursTarget[cat]![item]
      : 1;
  };

  // Streak calculators
  const calculateStreak = (cat: TrackerCategory, item: string): number => {
    let s = 0;
    const d = new Date(todayStr() + "T00:00:00");

    for (let i = 0; i < 365; i++) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const dy = String(d.getDate()).padStart(2, "0");
      const ds = `${year}-${month}-${dy}`;

      const entry = appState.daily[ds]?.[cat]?.[item];
      const st = entry ? entry.status : "pending";

      if (st === "done") {
        s++;
      } else if (st === "skipped") {
        d.setDate(d.getDate() - 1);
        continue;
      } else {
        break;
      }
      d.setDate(d.getDate() - 1);
    }
    return s;
  };

  // 7. Recurring task calendar schedules calculations
  const getRecurring = (cat: TrackerCategory, item: string) => {
    return appState.recurringTasks[`${cat}::${item}`] || null;
  };

  const isScheduledToday = (
    cat: TrackerCategory,
    item: string,
    ds: string,
  ): boolean => {
    const rec = getRecurring(cat, item);
    if (!rec) return true; // Daily constant

    const d = new Date(ds + "T00:00:00");
    const dow = (d.getDay() + 6) % 7; // Convert Sun=0 to Sun=6, Mon=0

    if (rec.freq === "daily") return true;
    if (rec.freq === "weekdays") return dow < 5;
    if (rec.freq === "weekends") return dow >= 5;
    if (rec.freq === "custom") return rec.days.includes(dow);

    return true;
  };

  // Day general checkin calculations
  const dayStats = (ds: string) => {
    let done = 0;
    let missed = 0;
    let pending = 0;
    let skipped = 0;
    let total = 0;
    let hrs = 0;
    let reps = 0;
    let satSum = 0;
    let satCount = 0;

    CATS.forEach((cat) => {
      // Build a set of all tracker items for this category (registered + adhoc from daily data)
      const registeredItems = appState.items[cat.id] || [];
      const adhocItems = Object.keys(appState.daily[ds]?.[cat.id] || {});
      const allItems = Array.from(new Set([...registeredItems, ...adhocItems]));

      allItems.forEach((item) => {
        const isSch = isScheduledToday(cat.id, item, ds);
        const d = getDayD(ds, cat.id, item);
        let statusValue = d ? d.status : "pending";

        // Auto skip un-scheduled pending items
        if (!isSch && statusValue === "pending") {
          statusValue = "skipped";
        }

        // We count it if it's scheduled OR if it's an adhoc item that was marked done or has hours
        const isAdhocCompleted =
          !registeredItems.includes(item) &&
          (statusValue === "done" || (d && d.hours > 0));

        if (isSch || isAdhocCompleted) {
          if (isSch) total++;
          if (statusValue === "done") done++;
          else if (statusValue === "missed") missed++;
          else if (statusValue === "skipped") skipped++;
          else if (isSch) pending++;

          const hOffset = d ? d.hours || 0 : 0;
          const rOffset = d
            ? d.reps || (statusValue === "done" ? getRepsT(cat.id, item) : 0)
            : 0;
          hrs += hOffset;
          reps += rOffset;

          if (d && d.satisfaction > 0) {
            satSum += d.satisfaction;
            satCount++;
          }
        } else {
          if (statusValue === "skipped") skipped++;
        }
      });
    });

    return {
      done,
      missed,
      pending,
      skipped,
      total,
      hrs,
      reps,
      sat: satCount ? satSum / satCount : 0,
      pct: total ? Math.round((done / total) * 100) : 0,
    };
  };

  const cycleStatus = (ds: string, cat: TrackerCategory, item: string) => {
    setAppState((prev) => {
      let dailyNode = { ...prev.daily };
      if (!dailyNode[ds]) dailyNode[ds] = {};
      if (!dailyNode[ds][cat]) dailyNode[ds][cat] = {};

      const current = dailyNode[ds][cat]![item] || {
        status: "pending",
        reps: 0,
        hours: 0,
        satisfaction: 0,
        notes: "",
      };

      const cycle: TrackerStatus[] = ["pending", "done", "missed", "skipped"];
      const curIdx = cycle.indexOf(current.status);
      const nextStatus = cycle[(curIdx + 1) % cycle.length];

      const updated = {
        ...current,
        status: nextStatus,
        reps:
          nextStatus === "done" && !current.reps
            ? getRepsT(cat, item)
            : current.reps,
      };

      dailyNode[ds][cat]![item] = updated;

      const next = { ...prev, daily: dailyNode };
      saveData(next);
      return next;
    });
  };

  // 8. Database mutators
  const updateProfile = (name: string, tagline: string, email: string, dailyBudgetLimit?: number, dailyIncomeTarget?: number) => {
    setAppState((prev) => {
      const bgtL = dailyBudgetLimit !== undefined ? dailyBudgetLimit : (prev.profile?.dailyBudgetLimit || 0);
      const incT = dailyIncomeTarget !== undefined ? dailyIncomeTarget : (prev.profile?.dailyIncomeTarget || 0);
      const next = {
        ...prev,
        profile: { 
          ...prev.profile, 
          name, 
          tagline, 
          email, 
          dailyBudgetLimit: bgtL, 
          dailyIncomeTarget: incT 
        },
        financeBudgets: {
          d: bgtL,
          w: bgtL * 7,
          m: bgtL * 30,
          y: bgtL * 365
        }
      };
      saveData(next);
      return next;
    });
    showToast("PROFILE RECONFIGURED ✓", "ok");
  };

  const addItemInput = (cat: TrackerCategory, name: string) => {
    setAppState((prev) => {
      const list = prev.items[cat] || [];
      if (list.includes(name)) return prev;

      const next = {
        ...prev,
        items: {
          ...prev.items,
          [cat]: [...list, name],
        },
      };
      saveData(next);
      return next;
    });
    showToast(`ADDED TRACKER TARGET: ${name.toUpperCase()}`, "ok");
  };

  const removeItemInput = (cat: TrackerCategory, name: string) => {
    setAppState((prev) => {
      const list = prev.items[cat] || [];
      const next = {
        ...prev,
        items: {
          ...prev.items,
          [cat]: list.filter((it) => it !== name),
        },
      };
      saveData(next);
      return next;
    });
    showToast("REMOVED CHECKLIST ELEMENT", "nfo");
  };

  const renameItemInput = (cat: TrackerCategory, oldName: string, newName: string) => {
    if (!newName.trim() || oldName === newName) return;
    setAppState((prev) => {
      const next = JSON.parse(JSON.stringify(prev)) as AppState;
      const cleanNew = newName.trim();
      
      // Add cleanNew to items array if not present, and preserve oldName
      if (next.items && next.items[cat]) {
        const list = next.items[cat];
        if (!list.includes(cleanNew)) {
          list.push(cleanNew);
        }
      }
      
      // Copy repsTarget from oldName, but do NOT delete oldName targets
      if (next.repsTarget && next.repsTarget[cat]) {
        if (next.repsTarget[cat]![oldName] !== undefined) {
          next.repsTarget[cat]![cleanNew] = next.repsTarget[cat]![oldName];
        } else {
          next.repsTarget[cat]![cleanNew] = 1;
        }
      }
      
      // Copy hoursTarget from oldName, but do NOT delete oldName targets
      if (next.hoursTarget && next.hoursTarget[cat]) {
        if (next.hoursTarget[cat]![oldName] !== undefined) {
          next.hoursTarget[cat]![cleanNew] = next.hoursTarget[cat]![oldName];
        } else {
          next.hoursTarget[cat]![cleanNew] = 1;
        }
      }
      
      // We do NOT modify or rename any daily history records of oldName!
      // This preserves oldName's historical logs completely separate and untouched.

      // Copy recurringTasks default schedule if any
      const oldRecKey = `${cat}-${oldName}`;
      const newRecKey = `${cat}-${cleanNew}`;
      if (next.recurringTasks && next.recurringTasks[oldRecKey]) {
          next.recurringTasks[newRecKey] = {
            ...next.recurringTasks[oldRecKey]
          };
      }

      saveData(next);
      return next;
    });
    showToast(`CREATED NEW TASK "${newName.toUpperCase()}" (Old task is kept intact with its historical data!)`, "ok");
  };

  const handleUpdateCategoryLabel = (cat: TrackerCategory, label: string) => {
    setAppState((prev) => {
      const next = { ...prev };
      if (!next.categoryLabels) next.categoryLabels = {};
      next.categoryLabels[cat] = label;
      saveData(next);
      return next;
    });
  };

  const updateTargetFields = (
    cat: TrackerCategory,
    item: string,
    field: "reps" | "hours",
    val: number,
  ) => {
    setAppState((prev) => {
      const targetObj =
        field === "reps" ? { ...prev.repsTarget } : { ...prev.hoursTarget };
      if (!targetObj[cat]) targetObj[cat] = {};
      targetObj[cat]![item] = Math.max(0, val || 0);

      const next = {
        ...prev,
        [field === "reps" ? "repsTarget" : "hoursTarget"]: targetObj,
      };

      // Also sync it visually with today's specific tracker goals, if they exist for activeDate
      if (next.daily[activeDate]?.[cat]?.[item]) {
        if (field === 'hours') {
           next.daily[activeDate][cat]![item].goalHours = Math.max(0, val || 0);
        } else {
           next.daily[activeDate][cat]![item].goalReps = Math.max(0, val || 0);
        }
      }

      saveData(next);
      return next;
    });
  };

  // 9. Reminders Alarm Database handlers
  const handleAddReminder = (rem: Omit<Reminder, "id" | "status">) => {
    const newRem: Reminder = {
      ...rem,
      id: "rem_" + Date.now(),
      status: "pending",
    };
    setAppState((prev) => {
      const next = {
        ...prev,
        reminders: [...(prev.reminders || []), newRem],
      };
      saveData(next);
      return next;
    });
    showToast("PLANNER EVENT CREATED ✓", "ok");
  };

  const handleEditReminder = (id: string, updated: Partial<Reminder>) => {
    setAppState((prev) => {
      const next = {
        ...prev,
        reminders: (prev.reminders || []).map((r) =>
          r.id === id ? { ...r, ...updated } : r,
        ),
      };
      saveData(next);
      return next;
    });
    showToast("DEADLINE MODIFIED ✓", "ok");
  };

  const handleDeleteReminder = (id: string) => {
    setAppState((prev) => {
      const next = {
        ...prev,
        reminders: (prev.reminders || []).filter((r) => r.id !== id),
      };
      saveData(next);
      return next;
    });
    showToast("PLANNER EVENT REMOVED", "nfo");
  };

  const handleToggleReminder = (id: string) => {
    setAppState((prev) => {
      const next = {
        ...prev,
        reminders: (prev.reminders || []).map((r) =>
          r.id === id
            ? {
                ...r,
                status: (r.status === "done" ? "pending" : "done") as any,
              }
            : r,
        ),
      };
      saveData(next);
      return next;
    });
    showToast("EVENT STATUS RE-SAVED", "ok");
  };

  const handleMuteReminder = (id: string) => {
    setAppState((prev) => {
      const next = {
        ...prev,
        reminders: (prev.reminders || []).map((r) =>
          r.id === id ? { ...r, enableAlert: false } : r,
        ),
      };
      saveData(next);
      return next;
    });
    showToast("ALARM SILENCED", "ok");
  };

  // 10. Journals flexible actions
  const handleSaveJournal = (dt: string, updated: Partial<JournalEntry>) => {
    setAppState((prev) => {
      let journalsNode = { ...prev.journals };
      const current = journalsNode[dt] || {
        date: dt,
        mood: 0,
        energy: 0,
        tags: [],
        sections: {},
        savedAt: "",
      };

      const nextEntry = {
        ...current,
        ...updated,
        savedAt: new Date().toISOString(),
      };
      journalsNode[dt] = nextEntry;

      const next = { ...prev, journals: journalsNode };
      saveData(next);
      return next;
    });
  };

  const handleUpdateJournalPrompts = (prompts: JournalPrompt[]) => {
    setAppState((prev) => {
      const next = { ...prev, journalPrompts: prompts };
      saveData(next);
      return next;
    });
    showToast("DIARY HEADINGS ADAPTED", "ok");
  };

  const handleUpdateJournalTags = (tags: string[]) => {
    setAppState((prev) => {
      const next = { ...prev, journalTags: tags };
      saveData(next);
      return next;
    });
    showToast("TAG COLLECTION RE-INDEXED", "ok");
  };

  // 11. Custom Recurrence overlay modal callbacks
  const openRecurringModalObj = (cat: TrackerCategory, item: string) => {
    setRecCat(cat);
    setRecItem(item);

    const exist = getRecurring(cat, item) || { freq: "daily", days: [] };
    setRecFreq(exist.freq || "daily");
    setRecDays((exist.days || []).slice());

    setRecModalOpen(true);
  };

  const toggleModalRecDay = (dayIndex: number) => {
    setRecDays((prev) => {
      if (prev.includes(dayIndex)) {
        return prev.filter((d) => d !== dayIndex);
      } else {
        return [...prev, dayIndex];
      }
    });
  };

  const handleSaveRecurringParams = () => {
    if (!recCat || !recItem) return;
    const taskKey = `${recCat}::${recItem}`;

    setAppState((prev) => {
      let node = { ...prev.recurringTasks };
      node[taskKey] = { freq: recFreq, days: recDays };

      const next = { ...prev, recurringTasks: node };
      saveData(next);
      return next;
    });

    setRecModalOpen(false);
    showToast(`RECURRING SCHEDULE SAVED FOR: ${recItem.toUpperCase()}`, "ok");
  };

  const handleRemoveRecurringParams = () => {
    if (!recCat || !recItem) return;
    const taskKey = `${recCat}::${recItem}`;

    setAppState((prev) => {
      let node = { ...prev.recurringTasks };
      delete node[taskKey];

      const next = { ...prev, recurringTasks: node };
      saveData(next);
      return next;
    });

    setRecModalOpen(false);
    showToast("REMOVED SCHEDULE CONFIG — DAILY SINCE CONSTANT", "nfo");
  };

  // 12. Backup JSON/CSV handlers
  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(appState, null, 2)], {
      type: "application/json",
    });
    const u = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = u;
    link.download = `lifetracker_db_${todayStr()}.json`;
    link.click();
    URL.revokeObjectURL(u);
    showToast("JSON BACKUP GENERATED!", "ok");
  };

  const handleExportCSV = () => {
    let csv =
      "Date,Category,Checklist Element,Checkins Status,Reps Completed,Focused Hours,Satisfaction score,Notes Reflection\n";
    Object.keys(appState.daily).forEach((ds) => {
      CATS.forEach((c) => {
        (appState.items[c.id] || []).forEach((item) => {
          const entry = getDayD(ds, c.id, item);
          csv += `${ds},${getCatLabel(appState, c.id)},"${item.replace(/"/g, '""')}",${entry.status},${entry.reps},${entry.hours},${entry.satisfaction},"${(entry.notes || "").replace(/"/g, '""')}"\n`;
        });
      });
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const u = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = u;
    link.download = `lifetracker_export_${todayStr()}.csv`;
    link.click();
    URL.revokeObjectURL(u);
    showToast("CSV EXPORT COMPLETED!", "ok");
  };

  const handleImportJSONText = (rawStr: string) => {
    try {
      const parsed = JSON.parse(rawStr);
      if (
        confirm(
          "Deploy backups merge? Existing profiles, checklists and checklist targets will merge cohesively.",
        )
      ) {
        setAppState((prev) => {
          // Merge checklists arrays
          const nextItems = { ...prev.items };
          if (parsed.items) {
            Object.keys(parsed.items).forEach((catK: any) => {
              const prevL = prev.items[catK as TrackerCategory] || [];
              const rawL = parsed.items[catK] || [];
              nextItems[catK as TrackerCategory] = Array.from(
                new Set([...prevL, ...rawL]),
              );
            });
          }

          // Merge daily records
          const nextDaily = { ...prev.daily };
          if (parsed.daily) {
            Object.keys(parsed.daily).forEach((ds) => {
              if (!nextDaily[ds]) nextDaily[ds] = {};
              Object.keys(parsed.daily[ds]).forEach((catKey) => {
                nextDaily[ds][catKey as TrackerCategory] = {
                  ...(nextDaily[ds][catKey as TrackerCategory] || {}),
                  ...(parsed.daily[ds][catKey] || {}),
                };
              });
            });
          }

          // Reminders list
          let nextRem = [...prev.reminders];
          if (parsed.reminders) {
            const rawRem = Array.isArray(parsed.reminders)
              ? parsed.reminders
              : Object.values(parsed.reminders);
            rawRem.forEach((r: any) => {
              if (!nextRem.some((x) => x.id === r.id)) nextRem.push(r);
            });
          }

          const nextState: AppState = {
            ...prev,
            profile: parsed.profile
              ? { ...prev.profile, ...parsed.profile }
              : prev.profile,
            items: nextItems,
            daily: nextDaily,
            repsTarget: parsed.repsTarget
              ? { ...prev.repsTarget, ...parsed.repsTarget }
              : prev.repsTarget,
            hoursTarget: parsed.hoursTarget
              ? { ...prev.hoursTarget, ...parsed.hoursTarget }
              : prev.hoursTarget,
            reminders: nextRem,
            goals: parsed.goals
              ? { ...prev.goals, ...parsed.goals }
              : prev.goals,
            pomoSessions: parsed.pomoSessions
              ? [...prev.pomoSessions, ...(parsed.pomoSessions || [])]
              : prev.pomoSessions,
            recurringTasks: parsed.recurringTasks
              ? { ...prev.recurringTasks, ...parsed.recurringTasks }
              : prev.recurringTasks,
            journals: parsed.journals
              ? { ...prev.journals, ...parsed.journals }
              : prev.journals,
            journalPrompts: parsed.journalPrompts || prev.journalPrompts,
            journalTags: parsed.journalTags || prev.journalTags,
          };

          saveData(nextState);
          return nextState;
        });
        showToast("DATA BACKUPS APPLIED ✓", "ok");
      }
    } catch (e) {
      alert("Corrupted JSON files. Overwrite failed.");
    }
  };

  const handleResetAll = () => {
    if (
      confirm(
        "Perform factory database wipe out? Old logs, schedules, focus lists and targets parameters will be lost.",
      )
    ) {
      if (confirm("Wiping out cannot be undone. Are you absolutely certain?")) {
        localStorage.removeItem("lt_v5");
        const empty = defData();
        setAppState(empty);
        saveData(empty);
        showToast("FACILITY WIPED TO FACTORY BASE", "nfo");
      }
    }
  };

  const handleLoadDemo = () => {
    window.open(window.location.pathname + "?demo=true", "_blank");
  };

  const handleToggleMuteGhostAlerts = () => {
    setAppState((prev) => {
      const next = { ...prev, muteGhostAlerts: !prev.muteGhostAlerts };
      saveData(next);
      return next;
    });
    showToast("SYSTEM ALERTS OPTIONS UPDATED", "ok");
  };

  const handleSetTheme = (themeHex: string) => {
    setAppState((prev) => {
      const next = { ...prev, neonTheme: themeHex };
      saveData(next);
      return next;
    });
    showToast(`THEME APPLIED: ${themeHex}`, "ok");
  };

  const handleSetBgTheme = (bgId: string) => {
    setAppState((prev) => {
      const next = { ...prev, bgTheme: bgId };
      saveData(next);
      return next;
    });
    showToast(`BACKGROUND APPLIED: ${bgId.toUpperCase()}`, "ok");
  };

  const handleSetFontFamily = (fontId: string) => {
    setAppState((prev) => {
      const next = { ...prev, fontFamily: fontId };
      saveData(next);
      return next;
    });
    const fontLabel = ALL_FONTS.find(f => f.id === fontId)?.label || fontId;
    showToast(`FONT DEPLOYED: ${fontLabel.toUpperCase()}`, "ok");
  };

  // Rendering screen routing selector
  const renderFocalScreen = () => {
    switch (activeView) {
      case "dashboard":
        return (
          <DashboardView
            state={appState}
            date={activeDate}
            onNavigate={setActiveView}
            onSetDate={setActiveDate}
            getDayD={getDayD}
            dayStats={dayStats}
            onOpenAIAnalyst={handleOpenAIAnalyst}
            onSetTheme={handleSetTheme}
            onSetBgTheme={handleSetBgTheme}
            onSetFontFamily={handleSetFontFamily}
            onStartMorning={() => setShowMorningBriefing(true)}
            onStartEvening={() => setShowEveningDebrief(true)}
            onPlanTomorrow={() => setShowPlanTomorrow(true)}
            onToggleReminder={handleToggleReminder}
            onCycleStatus={(cat, item) => cycleStatus(activeDate, cat as any, item)}
          />
        );
      case "daily":
        return (
          <DailyTrackerView
            state={appState}
            date={activeDate}
            onSetDate={setActiveDate}
            onChangeDate={(offset) => {
              const d = new Date(activeDate + "T00:00:00");
              d.setDate(d.getDate() + offset);
              const yr = d.getFullYear();
              const mt = String(d.getMonth() + 1).padStart(2, "0");
              const dy = String(d.getDate()).padStart(2, "0");
              setActiveDate(`${yr}-${mt}-${dy}`);
            }}
            onGoToday={() => setActiveDate(todayStr())}
            getDayD={getDayD}
            onUpdateDayField={updateDayField}
            onCycleStatus={cycleStatus}
            onQuickAdd={addItemInput}
            onRenameItem={renameItemInput}
            onUpdateCategoryLabel={handleUpdateCategoryLabel}
            onUpdateTargetFields={updateTargetFields}
            dayStats={dayStats}
            getRepsT={getRepsT}
            streak={calculateStreak}
            isScheduledToday={isScheduledToday}
            getRecurring={getRecurring}
            pomoState={pomoState}
            pomoTimeLeft={pomoTimeLeft}
            pomoTaskName={pomoTaskName}
            pomoTaskCat={pomoTaskCat}
            onStartPomo={handleStartPomo}
            onStopPomo={stopPomo}
            onSetPomoTask={handleSetPomoTask}
            onSetPomoPreset={handleSetPomoPreset}
            onOpenAIAnalyst={handleOpenAIAnalyst}
            onOmniCommand={handleOmniMutations}
            onSaveJournal={handleSaveJournal}
            onUpdateJournalPrompts={handleUpdateJournalPrompts}
          />
        );
      case "goals":
        return (
          <GoalsView
            state={appState}
            date={activeDate}
            onSaveGoal={(period, scope, key, field, val) => {
              setAppState((prev) => {
                let goalsNode = { ...prev.goals };
                if (!goalsNode[period])
                  goalsNode[period] = { cat: {}, item: {} };
                if (!goalsNode[period][scope]) goalsNode[period][scope] = {};
                if (!goalsNode[period][scope][key])
                  goalsNode[period][scope][key] = {
                    reps: 0,
                    hours: 0,
                    auto: false,
                  };

                goalsNode[period][scope][key][field] = Math.max(0, val || 0);
                goalsNode[period][scope][key].auto = false;

                const next = { ...prev, goals: goalsNode };
                saveData(next);
                return next;
              });
            }}
            onResetGoalAuto={(period, scope, key) => {
              setAppState((prev) => {
                let goalsNode = { ...prev.goals };
                if (goalsNode[period]?.[scope]?.[key]) {
                  goalsNode[period][scope][key] = {
                    reps: 0,
                    hours: 0,
                    auto: true,
                  };
                }
                const next = { ...prev, goals: goalsNode };
                saveData(next);
                return next;
              });
            }}
            getRepsT={getRepsT}
            getHrsT={getHrsT}
          />
        );
      case "analytics":
        return (
          <AnalyticsView
            state={appState}
            date={activeDate}
            dayStats={dayStats}
            getDayD={getDayD}
          />
        );
      case "calendar":
        return (
          <CalendarView
            state={appState}
            onSetDate={setActiveDate}
            onNavigate={handleNavigate}
            dayStats={dayStats}
          />
        );
      case "expeditions":
        return (
          <ExpeditionsView
            state={appState}
            saveData={saveData}
            setAppState={setAppState}
            onAddReminder={handleAddReminder}
          />
        );
      case "telemetry":
        return <TelemetryView state={appState} />;
      case "finances":
        return (
          <FinancesView
            state={appState}
            saveData={saveData}
            setAppState={setAppState}
            onAddReminder={handleAddReminder}
          />
        );
      case "sketchpad":
        return (
          <SketchpadView
            state={appState}
            saveData={saveData}
            setAppState={setAppState}
            showToast={showToast}
          />
        );
      case "reminders":
        return (
          <RemindersView
            state={appState}
            onAddReminder={handleAddReminder}
            onEditReminder={handleEditReminder}
            onDeleteReminder={handleDeleteReminder}
            onToggleReminder={handleToggleReminder}
            setView={handleNavigate}
          />
        );
      case "pomo":
        return (
          <PomoView
            state={appState}
            pomoState={pomoState}
            pomoTimeLeft={pomoTimeLeft}
            pomoPercent={pomoPercent}
            pomoTaskName={pomoTaskName}
            pomoTaskCat={pomoTaskCat}
            pomoWorkMin={pomoWorkMin}
            pomoBrkMin={pomoBrkMin}
            pomoPreset={pomoPreset}
            onStartPomo={handleStartPomo}
            onStopPomo={stopPomo}
            onSetPomoPreset={handleSetPomoPreset}
            onSetPomoCustom={handleSetPomoCustom}
            audioTrack={audioTrack}
            audioVolume={audioVolume}
            onSetAudioTrack={setAudioTrack}
            onSetAudioVolume={setAudioVolume}
            onNavigate={handleNavigate}
            onSetPomoTask={(name, cat) => {
              setPomoTaskName(name || null);
              setPomoTaskCat(cat);
            }}
            onTogglePiP={async () => {
              if (isPiPOpen()) {
                closePiP();
                setIsPipEnabled(false);
              } else {
                await openPiP();
                setIsPipEnabled(true);
              }
            }}
            isPipEnabled={isPipEnabled}
            isPomoPaused={isPomoPaused}
            onTogglePomoPause={() => setIsPomoPaused(prev => !prev)}
          />
        );
      case "journal":
        return (
          <JournalView
            state={appState}
            date={activeDate}
            onSetDate={setActiveDate}
            onChangeDate={(offset) => {
              const d = new Date(activeDate + "T00:00:00");
              d.setDate(d.getDate() + offset);
              const yr = d.getFullYear();
              const mt = String(d.getMonth() + 1).padStart(2, "0");
              const dy = String(d.getDate()).padStart(2, "0");
              setActiveDate(`${yr}-${mt}-${dy}`);
            }}
            dayStats={dayStats}
            onSaveJournal={handleSaveJournal}
            onUpdateJournalPrompts={handleUpdateJournalPrompts}
            onUpdateJournalTags={handleUpdateJournalTags}
            onAddReminder={handleAddReminder}
            onToggleReminder={handleToggleReminder}
            onNavigate={setActiveView}
            autoStartVoice={autoStartVoiceLog}
            onClearAutoStartVoice={() => setAutoStartVoiceLog(false)}
            autoStartText={autoStartTextLog}
            onClearAutoStartText={() => setAutoStartTextLog(false)}
            onOmniCommand={handleOmniMutations}
            onApplyAiLogs={(actions) => {
               setAppState(prev => {
                  const next = { ...prev };
                  actions.forEach(act => {
                     const targetD = act.date || activeDate;
                     if (act.module === "reminders") {
                        if (!next.reminders) next.reminders = [];
                        let pLevel: "low" | "medium" | "high" = "medium";
                        if (act.priority === "high") pLevel = "high";
                        if (act.priority === "low") pLevel = "low";

                        let remNotes = act.description || "";
                        if (act.location) {
                           remNotes = `Location: ${act.location}. ${remNotes}`;
                        }

                        next.reminders.push({
                           id: "rem_ai_" + Date.now() + Math.random().toString(36).substring(7),
                           title: act.title || "AI Alert",
                           dueDate: targetD,
                           time: act.time || "",
                           type: act.type || "Personal",
                           priority: pLevel,
                           repeat: act.repeat || "none",
                           notes: remNotes || "Auto-logged from AI Journal Analysis",
                           status: "pending",
                           enableAlert: act.enableAlert !== false,
                           alertOffset: act.alertOffset || 0
                        });
                     } else if (act.module === "finances") {
                        if (!next.finances) next.finances = [];
                        next.finances.push({
                           id: "tx_ai_" + Date.now() + Math.random().toString(36).substring(7),
                           date: targetD,
                           timestamp: `${targetD}T12:00:00Z`,
                           amount: parseFloat(act.amount) || 0,
                           concept: act.concept || "AI Finance Log",
                           notes: "Auto-logged from AI Journal Analysis",
                           category: act.category || "General",
                           currency: "USD",
                           source: "user",
                           type: act.type === "credit" || act.type === "income" ? "credit" : "debit",
                           counterparty: "General"
                        });
                     } else if (act.module === "tracker") {
                        if (!next.daily[targetD]) next.daily[targetD] = {};
                        
                        // Try to find the matching category item
                        let foundCatId = "habits";
                        let foundItem = Object.keys(next.items || {}).some(k => next.items[k]?.includes(act.itemTitle)) ? act.itemTitle : null;
                        
                        // If not found, add to habits category
                        if (!foundItem && act.itemTitle) {
                           if (!next.items["habits"]) next.items["habits"] = [];
                           if (!next.items["habits"].includes(act.itemTitle)) {
                              next.items["habits"].push(act.itemTitle);
                           }
                           foundItem = act.itemTitle;
                        }

                        if (foundItem) {
                           const key = `${foundCatId}_${foundItem}`;
                           const existing = next.daily[targetD][key] || { status: 'none', reps: 0, hours: 0, notes: '', satisfaction: 5 };
                           next.daily[targetD][key] = {
                              ...existing,
                              status: 'done',
                              reps: existing.reps + (parseInt(act.reps) || 0),
                              hours: existing.hours + (parseFloat(act.hours) || 0)
                           };
                        }
                     } else if (act.module === "goals") {
                        if (!next.goals) next.goals = [];
                        next.goals.push({
                           id: "goal_ai_" + Date.now() + Math.random().toString(36).substring(7),
                           title: act.title || "AI Goal",
                           target: act.target || "1",
                           timeline: act.timeline || "monthly",
                           category: "General",
                           reps: 0
                        });
                     } else if (act.module === "expeditions") {
                        if (!next.expeditions) next.expeditions = [];
                        next.expeditions.push({
                           id: "exp_ai_" + Date.now() + Math.random().toString(36).substring(7),
                           title: act.title || "AI Expedition",
                           dateStart: act.dateStart || targetD,
                           dateEnd: act.dateEnd || targetD,
                           notes: act.notes || "Auto-logged from AI Journal Analysis",
                           location: act.location || "",
                           packList: []
                        });
                     }
                  });
                  setTimeout(() => saveData(next), 0);
                  return next;
               });
               showToast("AI Auto-Logs applied successfully!", "ok");
            }}
          />
        );
      case "guides":
        return <GuidesView state={appState} />;
      case "synopsis":
        return (
          <SynopsisView
            state={appState}
            date={activeDate}
            dayStats={dayStats}
            getDayD={getDayD}
          />
        );
      case "search":
        return (
          <SearchView
            state={appState}
            onSetDate={setActiveDate}
            onSetTab={setActiveView as any}
            onNavigate={setActiveView}
            getDayD={getDayD}
          />
        );
      case "settings":
        return (
          <SettingsView
            state={appState}
            onUpdateProfile={updateProfile}
            onAddItem={addItemInput}
            onRemoveItem={removeItemInput}
            onRenameItem={renameItemInput}
            onUpdateTargetFields={updateTargetFields}
            onUpdateCategoryLabel={handleUpdateCategoryLabel}
            onOpenRecurringModal={openRecurringModalObj}
            getRecurring={getRecurring}
            syncCfg={syncCfg}
            onSelectSyncProvider={selectSyncProvider}
            onUpdateSyncFields={updateSyncFields}
            onSyncNow={syncNow}
            onPullFromCloud={pullFromCloud}
            onClearSyncConfig={clearSyncConfig}
            syncLog={syncLog}
            isSyncing={isSyncing}
            onExportJSON={handleExportJSON}
            onExportCSV={handleExportCSV}
            onImportJSON={handleImportJSONText}
            onResetAll={handleResetAll}
          />
        );
      case "help":
        return (
          <HelpView
            state={appState}
            onOpenAIAnalyst={handleOpenAIAnalyst}
            onLoadDemo={handleLoadDemo}
          />
        );
      case "alerts":
        return (
          <AlertsView
            state={appState}
            onToggleReminder={handleToggleReminder}
            onMuteReminder={handleMuteReminder}
            onToggleMuteSystemAlerts={handleToggleMuteGhostAlerts}
            onNavigate={setActiveView}
          />
        );
      case "focus_audio":
        return (
          <FocusAudioView
            activeTrack={audioTrack}
            volume={audioVolume}
            onSetTrack={setAudioTrack}
            onSetVolume={setAudioVolume}
          />
        );
      case "ai_analyst":
        return (
          <AiAnalystView onGeneratePrompt={(module) => {
              // Per User Request: Always feed purely all interrelated data for maximum cross-referencing capabilities
              const focusData = appState;
              let specificInstructions = "";

              if (module === "dashboard" || module === "all") {
                specificInstructions = `
### DOMAIN FOCUS: DASHBOARD & MACRO OMNILIFE MOMENTUM
- **Objective**: Act as an elite, omniscient Life Operating System analyst trained on vast arrays of behavioral economics, neuroscience, and macro-lifestyle data. Execute a holistic assessment of my operational momentum.
- **Deep Analysis**: Dynamically crunch data across daily completion rates, habit streaks, absolute Pomodoro focus times, financial ledgers, and emotional journal sentiment logic simultaneously. Uncover hidden behavioral feedback loops.
- **Identify**: Are there specific environmental variables, silent financial stressors escaping my notice, or circadian energy fluctuations that perfectly correlate with high or low productivity? Factor in human variables (procrastination, burnout limits, erratic schedules).
- **Output**: Give me an executive "State of the Union" briefing using sophisticated tactical insights. Provide hard numerical correlations and root-cause behavioral psychological analyses.
`;
              } else if (module === "daily") {
                specificInstructions = `
### DOMAIN FOCUS: DAILY TRACKER, ROUTINE OPTIMIZATION & HABIT DECAY
- **Objective**: Function as a hyper-advanced behavioral psychologist and data-scientist. Analyze my micro-habits and chaotic daily routines natively within the constraints of my entire life operating system.
- **Deep Analysis**: Correlate my daily tracking (\`daily\`) with my Evening Debriefs, goals (\`goals\`), absolute Focus durations (\`pomoSessions\`), and emotional sentiment scores derived from my Journal (\`journals\`).
- **Identify**: Pinpoint exactly which habits suffer from highest attrition rates. What is the overarching trigger cascade? Calculate the mathematical probability of success based on time-of-day execution. Map out my discipline breakdown days. Determine if pending cognitive load (\`reminders\`) or financial stress (\`finances\`) actively degrades my structural routine.
- **Output**: Provide an unparalleled, statistically-backed tactical optimization schedule.
`;
              } else if (module === "journal") {
                specificInstructions = `
### DOMAIN FOCUS: PSYCHOLOGY, MOOD SENTIMENT & EMOTIONAL PREDICTIVE MODELING
- **Objective**: Conduct a clinical-grade psychological and behavioral analysis of my daily unstructured journal entries, cross-referencing all life metrics. This goes beyond simple text analysis.
- **Deep Analysis**: Forensically read the subtext of my entries, tags, mood (1-5), and energy (1-5) ratings in \`journals\`. Correlate this emotional baseline broadly with physical output (\`daily\`), spending impulse control (\`finances\`), and focus (\`pomoSessions\`).
- **Identify**: What real-world linguistic patterns, specific micro-purchases, or life events (like \`expeditions\`) reliably foreshadow a depressive drop in mood or energy? Conversely, reverse-engineer my peak flow states (Energy 5): what precise cocktail of events triggered it?
- **Output**: Output a highly advanced psychological profile, highlighting emotional volatility markers and delivering a predictive emotional stabilization framework.
`;
              } else if (module === "finances") {
                specificInstructions = `
### DOMAIN FOCUS: BRUTAL FINANCIAL LEDGER & RUN-RATE BURN
- **Objective**: Embody an elite forensic financial auditor and behavioral economist. Interpret my messy, real-world spending across all life contexts.
- **Deep Analysis**: Ingest and categorize every single transaction, concept, and timestamp. Map my systemic spending habits back to my psychological state in \`journals\` (do I exhibit erratic spending when energy drops?) and my physical routines in \`daily\` (do high-expense days ruin my disciplined habits?). Track everything against my \`profile.dailyBudgetLimit\` and \`profile.dailyIncomeTarget\` parameters.
- **Identify**: Calculate my true daily operating burn rate. Am I statistically violating implicit monthly budget limits or missing the daily income target? Identify insidious, compounding financial leaks (the "latte factor" on steroids). 
- **Output**: Provide an uncompromising forensic financial breakdown. Link spending trauma to habit decay. Architect a strict, data-driven financial survivability and growth blueprint.
`;
              } else if (module === "expeditions") {
                specificInstructions = `
### DOMAIN FOCUS: TRAVEL, LOGISTICS & CONTEXT SWITCHING
- **Objective**: Optimize my physical movement, active travel, and expedition plans using deep situational awareness.
- **Deep Analysis**: Drill down into my \`expeditions\` metadata, packing lists, and destinations. Cross-reference this aggressively with \`finances\` (am I unknowingly bleeding money on trips?), \`reminders\` (travel alerts), and \`goals\` attrition.
- **Identify**: Mathematically map how physical displacement (travel) impacts my baseline \`daily\` habit completion rates. 
- **Output**: Deliver elite logistical briefings for my upcoming physical movements. Provide advanced protocol suggestions for minimizing "travel friction" and context-switching fatigue.
`;
              } else if (module === "reminders") {
                specificInstructions = `
### DOMAIN FOCUS: ALARMS, COGNITIVE LOAD & PROCRASTINATION ENGINEERING
- **Objective**: Analyze my cognitive debt and schedule management holistically.
- **Deep Analysis**: Interrogate my \`reminders\`, recurring loops, alert offsets, and priority tags. Cross-reference this load against my \`finances\` (billing deadlines) and \`daily\` habit completion rates.
- **Identify**: Quantify my alert fatigue. Am I hoarding low-priority tasks to simulate productivity? Are there high-priority tactical tasks I am neurotically deferring? 
- **Output**: Restructure my psychological schedule map. Devise a system to eradicate procrastination, manage cognitive debt, and neutralize alert fatigue relying unconditionally on the provided raw data.
`;
              } else if (module === "goals") {
                specificInstructions = `
### DOMAIN FOCUS: MACRO GOALS & TARGET ATTRITION RATES
- **Objective**: Evaluate the trajectory of my macro life-aspirations versus the cold, hard reality of my short-term execution.
- **Deep Analysis**: Contrast my idealistic \`goals\` against my raw execution metadata in \`daily\` and \`pomoSessions\`. Factor in \`journals\` mood drops and \`finances\` runway boundaries.
- **Identify**: Expose the exact numerical chasm between my ambition and my daily execution. Mathematically extrapolate failures predicting precisely when I will abandon a goal based on current pacing.
- **Output**: Issue a strict, cross-correlated reality check on my life goals. Develop a drastic, unyielding multidimensional operational restructure.
`;
              } else if (module === "pomo" || module === "focus_audio") {
                specificInstructions = `
### DOMAIN FOCUS: DEEP WORK, NEURO-FLOW STATES & AUDIO CORRELATIONS
- **Objective**: Become a neuro-optimisation AI. Analyze my attention span and deep work capacity natively within my life context.
- **Deep Analysis**: Scrutinize \`pomoSessions\` durations, session tags, and focus audio selections. Deeply correlate with \`journals\` (energy levels), \`finances\` (financial security stress), and \`daily\` output schedules.
- **Identify**: Discover the "God Mode" trigger. What exact combination of time, energy rating, prior day physical activities, and audio tracks unlocks my deepest, longest duration focus sessions? 
- **Output**: Deliver a neuro-optimized flow-state prediction algorithm derived strictly from my idiosyncratic historical dataset.
`;
              } else {
                specificInstructions = `
### DOMAIN FOCUS: HOLISTIC HYPER-SYSTEM ANALYSIS
- **Objective**: Execute an advanced, unrestricted systemic pattern recognition protocol.
- **Deep Analysis**: Cross-reference all data modules globally to discover invisible correlations, human behavior variations, and systemic inefficiencies hidden in my general life data.
- **Output**: Present the ultimate interconnected behavioral and lifestyle optimization dossier.
`;
              }

              let summaryText = "";
              try {
                // Curate a clean, 360-degree view of the user's data by omitting noisy app states
                const cleanState = {
                  Profile: focusData.profile,
                  Categories_And_Tags: focusData.categories,
                  Goals_Active: focusData.goals,
                  Daily_Performance_Log: focusData.daily,
                  Journal_Entries_And_Mood: focusData.journals,
                  Financial_Ledger: focusData.finances,
                  Pomodoro_Focus_Sessions: focusData.pomoSessions,
                  Reminders_And_Cognitive_Debt: focusData.reminders,
                  Travel_Expeditions: focusData.expeditions,
                  Projects: focusData.projects,
                };
                summaryText = JSON.stringify(cleanState, null, 2);
                if (summaryText.length > 500000) {
                  summaryText =
                    summaryText.substring(0, 500000) +
                    "\n... [Data Truncated due to size but trends remain visible]";
                }
              } catch (e) {
                summaryText = "[Data Overview Error]";
              }

              const finalPrompt = `Hello AI, act as my elite personal analyst, data scientist, and life-optimization executive assistant for my "Omnilife Tracker".

### OVERALL PRIME DIRECTIVE
I am providing you with my personal real-world data exported directly from Omnilife Tracker. I want you to perform a highly advanced, brutal, and mathematically precise analysis to help me optimize my life, habits, productivity, and finances. Do not give generic self-help advice. Base EVERY insight on the exact numbers, correlations, and timestamps provided in the JSON data.

### OMNILIFE TRACKER - SYSTEM ARCHITECTURE (HOW TO READ THE DATA)
Omnilife Tracker is a comprehensive life-management engine. All my data is stored as a massive interconnected JSON tree. The modules are deeply interlocked:
1. **Daily Tracker (\`Daily_Performance_Log\`)**: Contains \`status\` (pending | done | missed | skipped), \`hours\` (number), \`reps\` (number), \`notes\`, and \`satisfaction\`. Evening Debriefs lock this data in.
2. **Daily Journal (\`Journal_Entries_And_Mood\`)**: Contains \`mood\` (1-5 scale), \`energy\` (1-5 scale), \`tags\`, text arrays, and canvas sketches. Crucial for psychological correlation.
3. **Goals & Targets (\`Goals_Active\`)**: Structured by period ('weekly', 'monthly', 'yearly', 'lifetime'). Target \`reps\` and \`hours\` for specific tasks.
4. **Finances (\`Financial_Ledger\`)**: Highly advanced ledger. Contains \`transactions\` with exact date & precise time parsed from file imports (CSV, Excel) and Smart Text Imports (raw SMS/Text). Detailed categorization.
5. **Pomodoro Focus (\`Pomodoro_Focus_Sessions\`)**: Focus timer logs with start/end timestamps, tasks mapped, and ambient audio states.
6. **Reminders (\`Reminders_And_Cognitive_Debt\`)**: Cognitive load tracking (alerts, recurring loops).
7. **Expeditions (\`Travel_Expeditions\`)**: Logistics and packing arrays.
8. **OmniLife Voice/Text Mutations**: If you want to suggest actionable changes in your output to help me optimize, you MUST formulate them as natural language instructions that can be parsed by an NLP model. Examples: "Log a $50 expense for dining today", "Create a reminder to pay rent tomorrow at 9 AM", "Set my mood to 5 for yesterday", or "Mark habit gym as done today." I will copy your suggested text into my app's input!

${specificInstructions}

### EXPORTED JSON DATA MINING TARGET
\`\`\`json
${summaryText}
\`\`\`

### REQUIRED OUTPUT FORMAT
Ensure your response is pristine Markdown. Use bolding to highlight specific data points and numerical correlations.

## 1. The Hard Truth
1-2 paragraphs of brutal, undeniable truths hidden in the data. What am I doing wrong? What are the biggest leaks in my system?

## 2. Hidden Correlations
Bullet points connecting variables across different modules. 
*Example: "On days you spend >$50 on Food, your Focus hours drop by 40%."*

## 3. Strategic Execution Roadmaps
3-5 hyper-specific, actionable implementations I must make TODAY to accelerate my momentum, complete with exact numerical targets to hit. 

## 4. NLP Auto-Log Instructions (Crucial)
Provide 3-5 exact, natural-language commands based on your Roadmap that I can copy-paste back into my "Omnilife Voice/Text Auto-Log" engine to instantly set up reminders, fix budgets, or adjust goals. 
*Example: "Create a reminder to review weekly finances every Sunday at 8 PM."*

**Tone**: Be professional, stoic, analytical, objective, and highly strategic. No fluff.`;

              handleOpenAIAnalyst(finalPrompt);
            }}
          />
        );
      default:
        return <div className="p-10">Select an option from the sidebar.</div>;
    }
  };

  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isPipEnabled, setIsPipEnabled] = useState(false);
  
  useEffect(() => {
    if (isPiPOpen()) {
        const color = pomoState === 'work' ? '#00ff88' : (pomoState === 'break' ? '#00d4ff' : '#aaaaaa');
        const pct = Math.round(pomoPercent * 100);
        updatePiPContent(`
          <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px; height:100vh;">
            <div style="font-size:10px; color:#ccc; text-transform:uppercase; font-weight:bold; letter-spacing:2px; font-family: monospace;">
              ${pomoState === 'idle' ? 'IDLE' : (pomoState === 'break' ? '☕ ON BREAK' : '🔥 FOCUS MODE')}
            </div>
            <div style="font-size:11px; font-weight:bold; color:#fff; text-transform:uppercase; margin-top:-4px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:90%;">
              ${pomoTaskName || 'Awaiting target'}
            </div>
            <div style="font-size:32px; font-weight:bold; color:${color}; margin: 2px 0; font-family: monospace;">${pomoTimeLeft}</div>
            <div style="width:200px; height:4px; background:#222; border-radius:4px; overflow:hidden;">
              <div style="width:${pct}%; height:100%; background:${color}; transition: width 1s linear;"></div>
            </div>
          </div>
        `);
    }
  }, [pomoTimeLeft, pomoPercent, pomoState, pomoTaskName]);

  // 1. Service Worker action listener for Pomodoro controls from notification clicks
  useEffect(() => {
    const handleSWMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'POMO_ACTION') {
        const action = event.data.action;
        if (action === 'pause') {
          setIsPomoPaused(true);
        } else if (action === 'resume') {
          setIsPomoPaused(false);
        } else if (action === 'stop') {
          stopPomo();
        }
      }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleSWMessage);
    }
    return () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleSWMessage);
      }
    };
  }, [pomoState, pomoElapsedSeconds, pomoTaskName, pomoTaskCat]);

  // 2. Synchronize internal Pomodoro state and timer to native OS background notification
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const syncNotification = async () => {
      if ('serviceWorker' in navigator && Notification.permission === 'granted') {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg) {
          if (pomoState !== 'idle') {
            const title = pomoState === 'work' ? "🔥 Focus Mode Active" : "☕ Break Active";
            const taskLabel = pomoTaskName || 'Unassigned';
            const statusLabel = isPomoPaused ? 'PAUSED' : 'RUNNING';
            const body = `${pomoTimeLeft} remaining | Target: ${taskLabel} (${statusLabel})`;
            
            const actions = isPomoPaused 
              ? [
                  { action: 'resume', title: '▶️ Resume' },
                  { action: 'stop', title: '🛑 Stop' }
                ]
              : [
                  { action: 'pause', title: '⏸️ Pause' },
                  { action: 'stop', title: '🛑 Stop' }
                ];
            
            reg.showNotification(title, {
              body,
              tag: 'pomo_timer',
              renotify: false,
              silent: true,
              icon: '/icon.svg',
              badge: '/icon.svg',
              actions: actions
            } as any);
          } else {
            // Dismiss active timer notification if idle
            const notifications = await reg.getNotifications({ tag: 'pomo_timer' });
            notifications.forEach(n => n.close());
          }
        }
      }
    };

    syncNotification();
  }, [pomoState, pomoTimeLeft, isPomoPaused, pomoTaskName]);

  useEffect(() => {
    // Close mobile nav when running active view changes
    setIsMobileNavOpen(false);
  }, [activeView]);

  return (
    <div className="flex h-screen bg-[#0d0d1a] text-slate-100 overflow-hidden font-sans">
      <style>{getThemeCSS(appState.neonTheme, appState.bgTheme, appState.fontFamily)}</style>

      {/* Conditionally hide floaters during onboarding */}
      {appState.hasSeenWelcome && (
        <>
          <GhostAlert muted={appState.muteGhostAlerts} />
          <ReminderAlert
            state={appState}
            hasSystemAlerts={ghostOffline && !appState.muteGhostAlerts}
            onNavigate={setActiveView}
          />
        </>
      )}

      {/* Mobile nav overlay */}
      {isMobileNavOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-[60] md:hidden"
          onClick={() => setIsMobileNavOpen(false)}
        />
      )}

      {/* 1. Left Sidebar menu */}
      <div
        className={`fixed md:relative z-[70] md:z-10 h-full transform transition-transform duration-300 ${isMobileNavOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        <Sidebar
          state={appState}
          activeView={activeView}
          activeDate={activeDate}
          onSaveJournal={handleSaveJournal}
          onNavigate={handleSidebarNavigate}
          syncCfg={syncCfg}
          isSyncing={isSyncing}
          onExportJSON={handleExportJSON}
          onExportCSV={handleExportCSV}
          hasSystemAlerts={syncCfg.lastSync === "error" || ghostOffline}
          onLoadDemo={handleLoadDemo}
          onStartMorning={() => setShowMorningBriefing(true)}
          onStartEvening={() => setShowEveningDebrief(true)}
          onPlanTomorrow={() => setShowPlanTomorrow(true)}
          onInstallApp={handleInstallApp}
          onToggleGlobalVoice={() => {
             setActiveView("journal");
             setTimeout(() => {
                setAutoStartVoiceLog(true);
              }, 100);
              if (isMobileNavOpen) setIsMobileNavOpen(false);
          }}
          onStartAutoLog={() => {
             setActiveView("journal");
             setTimeout(() => {
                setAutoStartTextLog(true);
             }, 100);
             if (isMobileNavOpen) setIsMobileNavOpen(false);
          }}
        />
      </div>

      {/* 2. Main Desk space */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative z-[20]">
        {/* Mobile Header Box */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-[#111120] bg-[#0d0d1a] relative z-40 shrink-0">
          <button
            onClick={() => setIsMobileNavOpen(true)}
            className="text-slate-300 hover:text-white cursor-pointer"
          >
            <div className="space-y-1">
              <div className="w-5 h-0.5 bg-current"></div>
              <div className="w-5 h-0.5 bg-current"></div>
              <div className="w-5 h-0.5 bg-current"></div>
            </div>
          </button>

          <h1 className="text-sm font-extrabold tracking-wider text-white">
            OMNILIFE <span className="text-[#ff6b1a]">TRACKER</span>
          </h1>
        </div>

        <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6 scrollbar-none w-full max-w-full relative">
          
          {/* Floating Back Button (Right side of Sidebar) to avoid scrolling to top */}
          {viewHistory.length > 0 && (
            <button
              onClick={goBackView}
              className="fixed bottom-6 left-6 md:left-[260px] z-50 p-3 bg-[#111120] border border-[#2a2a50] hover:border-[#00ff88] hover:bg-[#00ff88]/10 text-[#00ff88] rounded-full shadow-[0_4px_20px_rgba(0,255,136,0.15)] transition-all cursor-pointer group"
              title="Go Back"
            >
              <ChevronLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
            </button>
          )}

          <div className="max-w-[1000px] mx-auto min-h-full flex flex-col pb-8">
            {/* ↩ Dynamic Navigation Back Button */}
            {viewHistory.length > 0 && (
              <div className="mb-4">
                <button
                  onClick={goBackView}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#2a2a50] bg-[#111120] text-[#00ff88] hover:bg-[#00ff88]/10 hover:border-[#00ff88]/40 transition text-[9px] font-black uppercase tracking-widest leading-none font-mono cursor-pointer shadow-lg animate-fade-in"
                >
                  <span>← go back to {({
                    dashboard: "Dashboard Command",
                    daily: "Daily Tracker & Routines",
                    analytics: "Analytics Panel",
                    calendar: "Calendar Heatmap",
                    expeditions: "Travel Expeditions",
                    finances: "Finance Ledger",
                    sketchpad: "Advanced Sketchpad & Log",
                    reminders: "Reminders & Alerts",
                    pomo: "Pomodoro Clock",
                    guides: "Interactive Module Guide",
                    synopsis: "Weekly Synopsis Control",
                    search: "Deep Search Analyzer",
                    settings: "System Vault Vault Core",
                    focus_audio: "Focus Ambient Audio",
                    ai_analyst: "AI Strategy Analyst"
                  } as Record<string, string>)[viewHistory[viewHistory.length - 1]] || "previous page"}</span>
                </button>
              </div>
            )}
            {/* Theme Aesthetic Banner, Quotes, and Stickers */}
            <ThemeAestheticBanner bgTheme={appState.bgTheme} />

            {/* Active viewport content */}
            {renderFocalScreen()}
          </div>
        </main>
      </div>

      {/* 3. Global Toasts chimes notifications */}
      {toast && (
        <div
          className={`fixed bottom-4 left-4 md:left-[240px] z-[110] px-5 py-3 rounded-xl border flex flex-col gap-2 tracking-widest uppercase transition-all duration-300 font-mono text-xs font-black shadow-[0_10px_30px_rgba(0,0,0,0.6)] border-l-4 animate-slide-in-left backdrop-blur-md ${
            toast.type === "ok"
              ? "bg-[#0a0f1d]/85 text-emerald-400 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.25)]"
              : toast.type === "action" 
              ? "bg-[#0d0d1a]/95 text-indigo-400 border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.25)]"
              : "bg-[#181111]/85 text-[#ff6b1a] border-[#ff6b1a] shadow-[0_0_20px_rgba(255,107,26,0.25)]"
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="shrink-0 text-base">{toast.type === "ok" ? "✓" : toast.type === "action" ? "🌙" : "⚡"}</span>
            <span>// {toast.msg}</span>
          </div>
          {toast.type === "action" && toast.actionBtn && (
            <button 
                onClick={() => {
                   toast.actionBtn!.onClick();
                   setToast(null);
                }}
                className="mt-1 w-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 rounded py-1.5 hover:bg-indigo-500/40 transition flex items-center justify-center"
            >
                {toast.actionBtn.label}
            </button>
          )}
        </div>
      )}

      {/* Centered Notification Overlay for Floater Closures */}
      {centerToast && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] animate-fade-in font-sans">
          <div className="bg-[#0b0f19] border-2 border-[#ff6b1a] text-slate-100 p-6 rounded-2xl max-w-sm w-full space-y-4 shadow-[0_0_50px_rgba(255,107,26,0.25)] relative overflow-hidden text-center flex flex-col items-center">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#ff6b1a] to-[#aa44ff]" />
            <div className="flex flex-col items-center gap-3 text-[#ff6b1a]">
              <Info size={36} className="animate-pulse" />
              <h4 className="font-extrabold tracking-widest text-[#ff6b1a] text-xs uppercase font-mono">
                {centerToast.msg}
              </h4>
            </div>
            <p className="text-[11px] text-slate-300 font-medium leading-relaxed uppercase tracking-wider font-mono">
              // {centerToast.sub}
            </p>
            <div className="pt-2 w-full">
              <button
                onClick={() => setCenterToast(null)}
                className="w-full py-2.5 bg-[#ff6b1a]/10 hover:bg-[#ff6b1a]/20 border border-[#ff6b1a]/30 hover:border-[#ff6b1a] text-[#ff6b1a] rounded-xl text-[10px] font-black uppercase tracking-widest transition"
              >
                GOT IT ✓
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Recurring Scheduler Config Modal Overlay */}
      {recModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-[#111120] border border-[#2a2a50] rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl shadow-black/80">
            <h3 className="text-sm font-extrabold tracking-widest text-[#ff6b1a] uppercase font-display">
              ↻ REUSE / RECURRING PLANNER
            </h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono">
              // active element: {recItem}
            </p>

            <div className="space-y-4 font-semibold text-slate-300">
              {/* Frequency selection buttons */}
              <div>
                <span className="text-[9px] text-slate-500 tracking-widest block font-black uppercase mb-1.5 font-mono">
                  RECURRING INTERVALS
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs select-none">
                  {(["daily", "weekdays", "weekends", "custom"] as const).map(
                    (freq) => (
                      <button
                        key={freq}
                        onClick={() => setRecFreq(freq)}
                        className={`py-1.5 rounded-lg border uppercase text-[10px] font-bold tracking-wider transition-all duration-200 ${
                          recFreq === freq
                            ? "bg-[#ff6b1a]/10 border-indigo-600/30 text-[#ff6b1a]"
                            : "border-[#2a2a50] text-slate-400 hover:border-slate-700 hover:bg-[#111120]/30"
                        }`}
                      >
                        {freq}
                      </button>
                    ),
                  )}
                </div>
              </div>

              {/* Custom Weekdays Picker */}
              {recFreq === "custom" && (
                <div className="space-y-1.5 select-none animate-fadeIn">
                  <span className="text-[9px] text-slate-500 tracking-widest block font-black uppercase font-mono">
                    CHOOSE RECURRENCE EVENTS
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {["M", "T", "W", "T", "F", "S", "S"].map((wd, wdIdx) => {
                      const isPicked = recDays.includes(wdIdx);
                      return (
                        <button
                          key={wdIdx}
                          onClick={() => toggleModalRecDay(wdIdx)}
                          className={`w-7 h-7 font-black text-[9px] rounded-lg border transition-all duration-200 ${
                            isPicked
                              ? "bg-[#ff6b1a] text-white border-indigo-600 shadow-md shadow-indigo-600/10"
                              : "bg-transparent border-[#2a2a50] text-slate-500 hover:border-slate-700 hover:bg-[#111120]/20"
                          }`}
                        >
                          {wd}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Actions footer */}
              <div className="flex justify-between items-center pt-3 border-t border-[#0d0d1a]">
                {appState.recurringTasks[`${recCat}::${recItem}`] ? (
                  <button
                    onClick={handleRemoveRecurringParams}
                    className="p-1.5 px-3 border border-rose-500/20 text-rose-500 hover:bg-rose-500/10 rounded-lg text-[10px] uppercase font-bold"
                  >
                    DISABLE
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => setRecModalOpen(false)}
                    className="px-3.5 py-1.5 bg-[#0d0d1a] hover:bg-[#111120] hover:text-slate-200 text-slate-400 border border-[#2a2a50] rounded-lg text-[10px] transition-colors"
                  >
                    CLOSE
                  </button>
                  <button
                    onClick={handleSaveRecurringParams}
                    className="px-4 py-1.5 bg-[#ff6b1a] hover:bg-[#ff6b1a] text-white font-extrabold rounded-lg text-[10px] transition-colors shadow-lg shadow-indigo-600/20"
                  >
                    SAVE PLAN
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Welcome & Instructions Modal */}
      {!appState.hasSeenWelcome && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-[#111120] border border-[#2a2a50] rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl shadow-[#aa44ff]/10">
            <h3 className="text-xl font-extrabold tracking-widest text-[#00d4ff] uppercase font-display border-b border-[#2a2a50] pb-2">
              Welcome to Omnilife
            </h3>
            <p className="text-[10px] text-slate-400 font-bold tracking-wider font-mono">
              // ARCHITECTURE & PRIVACY
            </p>

            <div className="space-y-4 font-semibold text-slate-300 text-sm leading-relaxed max-h-[60vh] overflow-y-auto scrollbar-none">
              <p>
                <strong>Uncompromising Privacy & Total Control:</strong> This is
                the ultimate life tracker app. Unlike other apps where you have
                zero privacy or control over your data, Omnilife gives you total
                ownership. Your data never touches our servers—because there are
                none. All your logs, tracking, and routines are stored purely
                inside your browser memory or directly backed up to a .json file
                on your local hard drive.
              </p>
              <p>
                <strong>Export & Backup:</strong> Because there is no cloud
                database, you can use the "Export JSON" option at the bottom of
                the sidebar at any time. Keep this file safe. If you clear your
                browser cache, you can "Import JSON" to instantly restore
                everything.
              </p>
              <p>
                <strong>Ghost Sync:</strong> (Recommended) Found in Settings,
                this feature utilizes the File System Access API. It links
                exactly <i>one</i> local .json file and automatically overwrites
                it in the background as you click items, offering zero-touch
                local-first syncing.
              </p>
              <p>
                <strong>Themes & AI:</strong> Personalize your experience with
                multi-style themes on your dashboard (Retro, Minimalistic, Soft
                & Cute). Plus, all data can be perfectly copied to your
                clipboard to use with any AI for analysis, ensuring your data
                never gets sent securely unless YOU send it.
              </p>
              <p>Enjoy tracking your daily routines in absolute security!</p>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                onClick={() => {
                  const next = { ...appState, hasSeenWelcome: true };
                  setAppState(next);
                  saveData(next);
                }}
                className="bg-[#00d4ff] text-black hover:bg-[#00d4ff]/80 font-black uppercase text-xs tracking-widest px-6 py-2.5 rounded-xl transition shadow-[0_0_15px_rgba(0,212,255,0.4)]"
              >
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating global Actions */}
      {appState.hasSeenWelcome && (
        <div className="fixed bottom-[20px] right-[20px] md:bottom-8 md:right-8 z-50 flex flex-col gap-3">
          {!appState.hideGuideFloater && !isGuideFloaterClosed && (
            <div className="relative font-sans animate-fade-in">
              <button
                onClick={() => setGuideModalOpen(true)}
                className="flex items-center justify-center gap-2 pl-4 pr-11 py-3 bg-[#111120] border border-[#2a2a50] rounded-full shadow-[0_4px_24px_rgba(0,0,0,0.8)] hover:border-[#00d4ff] text-[#00d4ff] transition-all duration-300 backdrop-blur-md w-full text-left"
              >
                <Info size={18} />
                <span className="text-[10px] font-black uppercase tracking-widest leading-none">
                  Module Guide
                </span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsGuideFloaterClosed(true);
                  saveData({ ...appState, hideGuideFloater: true });
                  setCenterToast({
                    msg: "MODULE GUIDE STOWED",
                    sub: "The interactive Module Guide banner has been moved. You can access the full interactive Master Tutorials anytime inside the 'AI Analyst' hub!"
                  });
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full bg-[#2a2a50]/60 hover:bg-[#ff6b1a]/20 border border-slate-700/50 hover:border-[#ff6b1a]/45 text-slate-400 hover:text-[#ff6b1a] transition"
                title="Close and hide Module Guide button"
              >
                <X size={10} />
              </button>
            </div>
          )}
          {!isAiAnalystClosed && (
            <div className="relative">
              <button
                onClick={() => handleOpenAIAnalyst()}
                className="flex items-center justify-center gap-2 pl-4 pr-11 py-3 bg-[#111120] border border-[#2a2a50] rounded-full shadow-[0_4px_24px_rgba(0,0,0,0.8)] hover:border-[#00ff88] text-[#00ff88] transition-all duration-300 backdrop-blur-md w-full text-left"
              >
                <Bot size={18} />
                <span className="text-[10px] font-black uppercase tracking-widest leading-none">
                  AI Analyst
                </span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsAiAnalystClosed(true);
                  setCenterToast({
                    msg: "AI STRATEGIST ARCHIVED",
                    sub: "The floating strategic AI Analyst has been stowed safely under management control. You can prompt state analysis anytime from the menu sidebar directory."
                  });
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full bg-[#2a2a50]/60 hover:bg-[#ff6b1a]/20 border border-slate-700/50 hover:border-[#ff6b1a]/45 text-slate-400 hover:text-[#ff6b1a] transition"
                title="Close and hide AI Analyst button"
              >
                <X size={10} />
              </button>
            </div>
          )}
        </div>
      )}

      {showMorningBriefing && (
        <MorningBriefing 
           appState={appState}
           setAppState={setAppState}
           onClose={() => setShowMorningBriefing(false)}
        />
      )}

      {showEveningDebrief && (
        <EveningDebrief 
           appState={appState}
           setAppState={setAppState}
           onClose={() => setShowEveningDebrief(false)}
           onNavigate={setActiveView}
        />
      )}

      {showPlanTomorrow && (
        <MorningBriefing 
           appState={appState}
           setAppState={setAppState}
           onClose={() => setShowPlanTomorrow(false)}
           isPlanTomorrow={true}
           targetDate={(() => {
              const d = new Date();
              d.setDate(d.getDate() + 1);
              return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
           })()}
        />
      )}

      <StepByStepGuideModal
        isOpen={guideModalOpen}
        onClose={() => setGuideModalOpen(false)}
        activeView={activeView}
        onHideFloater={() => {
          setIsGuideFloaterClosed(true);
          saveData({ ...appState, hideGuideFloater: true });
          setCenterToast({
            msg: "MODULE GUIDE STOWED",
            sub: "The interactive Module Guide banner has been moved. You can access the full interactive Master Tutorials anytime inside the 'AI Analyst' hub!"
          });
        }}
      />

      {/* AI Analyst Modal */}
      {aiModal.isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-[80] animate-fade-in text-center">
          <div className="bg-[#111120] relative border border-[#00ff88]/30 rounded-2xl max-w-sm w-full p-6 space-y-6 shadow-2xl shadow-[#00ff88]/10 flex flex-col items-center">
            <button
              onClick={() => setAiModal({ isOpen: false, promptText: "" })}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-[#2a2a50]/50 hover:bg-[#2a2a50] text-slate-400 hover:text-white transition"
            >
              <X size={16} />
            </button>

            <div className="mx-auto w-16 h-16 bg-[#00ff88]/10 text-[#00ff88] rounded-full flex items-center justify-center animate-pulse">
              <Bot size={32} />
            </div>

            <div>
              <h3 className="text-xl font-extrabold tracking-widest text-[#00ff88] uppercase font-display">
                AI Context Hub
              </h3>
              <div className="mt-4 p-3 bg-[#0a0a14] border border-[#2a2a50] rounded-xl text-left space-y-2">
                <p className="text-[10px] text-[#00ff88] font-black tracking-widest uppercase mb-1 flex items-center gap-2">
                  <CheckCircle2 size={12} /> Instructions Compiled
                </p>
                <p className="text-[10px] text-slate-300 leading-relaxed font-mono">
                  Your private data and detailed AI instructions are ready.
                </p>
                <div className="bg-[#00ff88]/10 text-[#00ff88] p-2 rounded text-[10px] font-bold border border-[#00ff88]/20">
                  <strong>PURPOSE:</strong> This data package helps you analyze
                  your life metrics with your preferred AI, acting as your
                  personalized executive assistant.
                </div>
                <ul className="text-[10px] text-[#00d4ff] font-bold list-disc pl-3 mt-1 space-y-0.5">
                  <li>Click any option below to copy the data.</li>
                  <li>
                    Go to the AI tab and <strong>paste it</strong>{" "}
                    (Ctrl+V/Cmd+V).
                  </li>
                  <li>Start asking your AI any queries!</li>
                  <li>
                    The data can be pasted into <strong>ANY AI</strong> of your
                    choice.
                  </li>
                </ul>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 w-full">
              {[
                {
                  name: "ChatGPT",
                  url: "https://chatgpt.com",
                  color: "#00d4ff",
                },
                {
                  name: "Claude",
                  url: "https://claude.ai/new",
                  color: "#ffaa44",
                },
                {
                  name: "Gemini",
                  url: "https://gemini.google.com/app",
                  color: "#00ff88",
                },
                {
                  name: "Perplexity",
                  url: "https://www.perplexity.ai/",
                  color: "#ff6b1a",
                },
              ].map((ai) => (
                <button
                  key={ai.name}
                  onClick={() => {
                    navigator.clipboard
                      .writeText(aiModal.promptText)
                      .then(() => {
                        window.open(ai.url, "_blank");
                        setAiModal({ isOpen: false, promptText: "" });
                      });
                  }}
                  className="px-2 py-3 bg-[#0d0d1a] border border-[#2a2a50] hover:bg-[#1a1a30] transition rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-1.5"
                  style={{ color: ai.color }}
                >
                  <Bot size={14} /> {ai.name}
                </button>
              ))}
            </div>

            <div className="w-full pt-3 border-t border-[#2a2a50] space-y-2">
              <div className="text-center mb-2">
                <p className="text-[9px] text-[#00d4ff] uppercase tracking-widest font-black mb-1">
                  Use ANY Other AI
                </p>
                <p className="text-[9px] text-slate-400 font-medium leading-relaxed px-4">
                  The copied data contains exhaustive instructions, data
                  dictionaries, and your active data. Paste it into any AI to
                  kickstart advanced analysis.
                </p>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(aiModal.promptText).then(() => {
                    setToast({
                      msg: "Copied! You can paste this in ANY AI.",
                      type: "ok",
                    });
                    setAiModal({ isOpen: false, promptText: "" });
                  });
                }}
                className="w-full py-3 bg-[#aa44ff]/10 hover:bg-[#aa44ff]/20 border border-[#aa44ff]/30 text-[#aa44ff] font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 rounded-xl transition shadow-[0_4px_15px_rgba(170,68,255,0.2)]"
              >
                <ClipboardCopy size={16} /> Copy Full Prompt & Data Package
              </button>

              <button
                onClick={() => {
                   setAiModal({ isOpen: false, promptText: "" });
                   setShowOnboarding(true);
                }}
                className="w-full mt-2 py-3 bg-[#ffaa00]/10 hover:bg-[#ffaa00]/20 border border-[#ffaa00]/30 text-[#ffaa00] font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 rounded-xl transition shadow-[0_0_15px_rgba(255,170,0,0.15)]"
              >
                <Info size={16} /> Open Interactive Master Manual
              </button>
            </div>

            <button
              onClick={() => setAiModal({ isOpen: false, promptText: "" })}
              className="mt-4 text-slate-400 hover:text-white uppercase tracking-widest text-[11px] font-black transition flex items-center justify-center gap-2 w-full bg-[#2a2a50] hover:bg-rose-500 py-3 rounded-xl shadow-lg border border-[#2a2a50]"
            >
              <X size={16} /> Close & Go Back
            </button>
          </div>
        </div>
      )}

      {showOnboarding && (
        <OnboardingModal
          viewId={activeView}
          onDismiss={handleDismissOnboarding}
        />
      )}
    </div>
  );
}
