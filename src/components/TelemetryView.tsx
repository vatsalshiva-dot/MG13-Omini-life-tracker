import React, { useState, useEffect, useRef } from "react";
import { AppState, TrackerCategory } from "../types";
import {
  Activity,
  Cpu,
  Database,
  Network,
  Clock,
  HardDrive,
} from "lucide-react";

interface TelemetryViewProps {
  state: AppState;
}

export function TelemetryView({ state }: TelemetryViewProps) {
  const [dbSize, setDbSize] = useState<number>(0);
  const [sessionTime, setSessionTime] = useState<number>(0);
  const [clientEnv, setClientEnv] = useState<any>({});

  useEffect(() => {
    // 1. Calculate Local DB Size
    try {
      const dataStr = JSON.stringify(state);
      const bytes = new Blob([dataStr]).size;
      setDbSize(bytes);
    } catch (e) {
      console.warn("Telemetry could not calculate db size");
    }

    // 2. Poll hardware/client logic
    const nav = navigator as any;
    setClientEnv({
      userAgent: navigator.userAgent,
      platform: nav?.userAgentData?.platform || navigator.platform,
      memory: nav.deviceMemory ? `${nav.deviceMemory} GB` : "Not Exposed",
      cores: navigator.hardwareConcurrency || "Dynamic/Unknown",
      connection: nav.connection?.effectiveType || "Unknown",
      language: navigator.language,
      vw: window.innerWidth,
      vh: window.innerHeight,
    });

    // 3. Mount Session Clock
    const timer = setInterval(() => {
      setSessionTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [state]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const padZero = (num: number) => num.toString().padStart(2, "0");
  const fmtTime = (ss: number) => {
    const h = Math.floor(ss / 3600);
    const m = Math.floor((ss % 3600) / 60);
    const s = ss % 60;
    return `${padZero(h)}:${padZero(m)}:${padZero(s)}`;
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 animate-fadeIn">
      <div className="flex items-center justify-between mb-8 pb-3 border-b border-[#2a2a50]">
        <div>
          <h1 className="text-xl md:text-2xl font-black uppercase tracking-widest flex items-center gap-3">
            <Activity className="text-cyan-400" size={24} />
            System Telemetry
          </h1>
          <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500 mt-1">
            Realtime Matrix & Local Datastore Footprint
          </p>
        </div>
        <div className="text-right">
          <p className="text-[9px] text-[#00ff88] uppercase tracking-widest animate-pulse font-mono font-bold">
            • LIVE TELEMETRY
          </p>
          <p className="text-[10px] text-slate-400 font-mono mt-0.5">
            SYS_ONLINE Check: OK
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Memory Storage Unit */}
        <div className="bg-[#0d0d1a] border border-[#2a2a50] p-5 rounded-xl shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <Database size={64} className="text-cyan-400" />
          </div>
          <h3 className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-2 mb-3">
            <Database size={12} className="text-cyan-400" />
            Payload / Memory
          </h3>
          <div className="text-3xl font-black font-mono text-white mb-1">
            {formatBytes(dbSize)}
          </div>
          <p className="text-[10px] text-slate-500 font-mono">
            Encrypted Core DB Weight
          </p>

          <div className="mt-4 pt-4 border-t border-[#2a2a50]">
            <p className="text-[11px] text-slate-300 font-mono flex justify-between">
              <span>Financial Txs:</span>
              <span className="text-[#00ff88] font-bold">
                {state.finances?.length || 0}
              </span>
            </p>
            <p className="text-[11px] text-slate-300 font-mono flex justify-between mt-1">
              <span>Journal Ents:</span>
              <span className="text-cyan-400 font-bold">
                {state.journals ? Object.keys(state.journals).length : 0}
              </span>
            </p>
            <p className="text-[11px] text-slate-300 font-mono flex justify-between mt-1">
              <span>Alarm Nodes:</span>
              <span className="text-purple-400 font-bold">
                {state.reminders?.length || 0}
              </span>
            </p>
          </div>
        </div>

        {/* Hardware Architecture */}
        <div className="bg-[#0d0d1a] border border-[#2a2a50] p-5 rounded-xl shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <Cpu size={64} className="text-[#ff00a0]" />
          </div>
          <h3 className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-2 mb-3">
            <Cpu size={12} className="text-[#ff00a0]" />
            Hardware & Agent Scope
          </h3>
          <div className="font-mono text-[11px] space-y-2 mt-2">
            <div className="flex justify-between items-center bg-[#1a1a2e] p-2 rounded">
              <span className="text-slate-500 uppercase tracking-widest">
                Platform
              </span>
              <span className="text-[#ff00a0] font-bold">
                {clientEnv.platform}
              </span>
            </div>
            <div className="flex justify-between items-center bg-[#1a1a2e] p-2 rounded">
              <span className="text-slate-500 uppercase tracking-widest">
                CPU Cores
              </span>
              <span className="text-[#ff00a0] font-bold">
                {clientEnv.cores} Threads
              </span>
            </div>
            <div className="flex justify-between items-center bg-[#1a1a2e] p-2 rounded">
              <span className="text-slate-500 uppercase tracking-widest">
                Device Mem
              </span>
              <span className="text-[#ff00a0] font-bold">
                {clientEnv.memory}
              </span>
            </div>
            <div className="flex justify-between items-center bg-[#1a1a2e] p-2 rounded">
              <span className="text-slate-500 uppercase tracking-widest">
                Viewport Res
              </span>
              <span className="text-[#ff00a0] font-bold">
                {clientEnv.vw}x{clientEnv.vh}
              </span>
            </div>
          </div>
        </div>

        {/* Time Vectors */}
        <div className="bg-[#0d0d1a] border border-[#2a2a50] p-5 rounded-xl shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <Clock size={64} className="text-emerald-400" />
          </div>
          <h3 className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-2 mb-3">
            <Clock size={12} className="text-emerald-400" />
            Session Flow
          </h3>
          <div className="text-3xl font-black font-mono text-white mb-1">
            {fmtTime(sessionTime)}
          </div>
          <p className="text-[10px] text-slate-500 font-mono">
            Current Session Ignition
          </p>

          <div className="mt-4 pt-4 border-t border-[#2a2a50]">
            <div className="flex justify-between items-center text-[11px] font-mono mb-2">
              <span className="text-slate-500">Language Lock:</span>
              <span className="text-emerald-400 font-bold uppercase">
                {clientEnv.language}
              </span>
            </div>
            <div className="flex justify-between items-center text-[11px] font-mono">
              <span className="text-slate-500">Uptime State:</span>
              <span className="text-emerald-400 font-bold uppercase tracking-widest">
                Nominal
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 bg-[#0d0d1a] border border-[#2a2a50] p-5 rounded-xl">
        <h3 className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-2 mb-3 border-b border-[#2a2a50] pb-2">
          <Network size={12} className="text-indigo-400" />
          Raw Diagnostic Dump / Client UA
        </h3>
        <p className="text-[10px] text-slate-500 font-mono break-all leading-relaxed">
          {clientEnv.userAgent}
        </p>
      </div>
    </div>
  );
}
