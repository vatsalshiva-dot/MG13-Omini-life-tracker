import React, { useState, useEffect } from 'react';
import { AppState, TrackerCategory, SyncConfig, RecurringTask } from '../types';
import { CATS } from '../utils/storage';
import { getFileHandle, linkGhostSyncFile, createGhostSyncFile } from '../utils/ghost';
import { 
  Check, Settings, Globe, Plus, Trash2, Calendar, FileText, Database, X, Cloud, Key, Link, Shield
} from 'lucide-react';

interface SettingsViewProps {
  state: AppState;
  onUpdateProfile: (name: string, tagline: string, email: string) => void;
  onAddItem: (cat: TrackerCategory, item: string) => void;
  onRemoveItem: (cat: TrackerCategory, item: string) => void;
  onUpdateTargetFields: (cat: TrackerCategory, item: string, field: 'reps' | 'hours', val: number) => void;
  
  // Recurring tasks list and triggers
  onOpenRecurringModal: (cat: TrackerCategory, item: string) => void;
  getRecurring: (cat: TrackerCategory, item: string) => RecurringTask | null;
  
  // Syncing
  syncCfg: SyncConfig;
  onSelectSyncProvider: (prov: 'none' | 'gist' | 'jsonbin') => void;
  onUpdateSyncFields: (fields: Partial<SyncConfig>) => void;
  onSyncNow: () => void;
  onPullFromCloud: () => void;
  onClearSyncConfig: () => void;
  syncLog: string;
  isSyncing: boolean;

  // Import Export Resets
  onExportJSON: () => void;
  onExportCSV: () => void;
  onImportJSON: (rawText: string) => void;
  onResetAll: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  state,
  onUpdateProfile,
  onAddItem,
  onRemoveItem,
  onUpdateTargetFields,
  onOpenRecurringModal,
  getRecurring,
  syncCfg,
  onSelectSyncProvider,
  onUpdateSyncFields,
  onSyncNow,
  onPullFromCloud,
  onClearSyncConfig,
  syncLog,
  isSyncing,
  onExportJSON,
  onExportCSV,
  onImportJSON,
  onResetAll
}) => {
  // Local profile state
  const [profileName, setProfileName] = useState(state.profile.name || '');
  const [profileTagline, setProfileTagline] = useState(state.profile.tagline || '');
  const [profileEmail, setProfileEmail] = useState(state.profile.email || '');

  // Add items state
  const [addInputs, setAddInputs] = useState<Record<string, string>>({});
  
  const [ghostLinked, setGhostLinked] = useState(false);
  useEffect(() => {
    getFileHandle().then(handle => setGhostLinked(!!handle)).catch(() => setGhostLinked(false));
  }, []);

  const handleLinkGhost = async () => {
    const ok = await linkGhostSyncFile();
    setGhostLinked(ok);
    if (ok) alert('Ghost Sync File Linked. Data will auto-save transparently on next edits.');
  };
  
  const handleCreateGhost = async () => {
    const ok = await createGhostSyncFile();
    setGhostLinked(ok);
    if (ok) alert('New Ghost Sync File Created. Data will auto-save transparently on next edits.');
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile(profileName.trim(), profileTagline.trim(), profileEmail.trim());
    alert('User Profile updated successfully!');
  };

  const handleAddItemSubmit = (catId: TrackerCategory, e: React.FormEvent) => {
    e.preventDefault();
    const item = (addInputs[catId] || '').trim();
    if (!item) return;
    onAddItem(catId, item);
    setAddInputs(prev => ({ ...prev, [catId]: '' }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = (evt) => {
      const text = evt.target?.result as string;
      onImportJSON(text);
    };
    r.readAsText(file);
    e.target.value = ''; // Reset
  };

  const catColors: Record<string, string> = {
    studies: '#00d4ff',
    habits: '#00ff88',
    leisure: '#ff6b1a',
    custom: '#aa44ff'
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-[#1e1e38] pb-4">
        <h2 className="text-xl font-extrabold tracking-wider text-[#ff6b1a]">
          SETTINGS & <span className="text-slate-100 font-extrabold font-black">MANAGE</span>
        </h2>
        <p className="text-xs uppercase tracking-widest text-[#555577] mt-1">
          MANAGE ITEM LISTS · CONFIGURE GOAL ESTIMATING BASES · INTEGRATE CLOUD SYNC
        </p>
      </div>

      {/* Ghost Sync Setup Section */}
      <div className="bg-[#0d0d1a] border border-[#1e1e38] rounded-xl p-5 space-y-4 shadow-[0_0_20px_rgba(255,107,26,0.05)]">
        <h3 className="text-xs font-black uppercase tracking-wider text-[#ff6b1a] border-b border-[#111120] pb-2 flex items-center gap-1.5">
          <Link size={14} className="text-[#ff6b1a]" />
          GHOST SYNC (100% PRIVATE AUTO-SAVE)
        </h3>
        
        <div className="space-y-3">
          <p className="text-[11px] text-slate-300 leading-relaxed font-semibold">
            <strong className="text-white">Why it's important:</strong> Usually, web apps either save data unreliably in browser cache (which gets wiped), or force you to use their cloud database (sacrificing your privacy). Ghost Sync gives you the best of both worlds.
          </p>
          <div className="text-[10px] text-slate-400 font-mono space-y-2 p-4 bg-[#111120] border border-[#2a2a50] rounded-lg">
            <p className="text-[#00d4ff] font-bold text-[11px] font-sans uppercase tracking-widest mb-1">HOW IT WORKS:</p>
            <p>1. Clicking <strong className="text-white">"Create New Node"</strong> asks your browser to save a `.json` database file anywhere on your computer (e.g. your Desktop or an iCloud/Dropbox folder).</p>
            <p>2. The app stores a secure "pointer" to this file.</p>
            <p>3. As you use the app normally (checking a habit off, writing a journal), your browser might show a one-time permission popup to "allow edits". Ghost Sync automatically intercepts your click to grant this permission instantly.</p>
            <p>4. From then on, every single action you take is instantly saved to your local file.</p>
            <p className="text-[#00ff88] font-bold mt-2 pt-2 border-t border-[#2a2a50]">— ZERO cloud servers. ZERO data collection. Your data never leaves your device.</p>
          </div>
        </div>
        
        <div className="space-y-3 pt-2 border-t border-[#1e1e38]">
          {ghostLinked ? (
            <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <Check size={14} className="text-emerald-400" />
              <div className="flex-1">
                <p className="text-xs text-emerald-400 font-bold uppercase tracking-widest font-mono">Tunnel Active</p>
                <p className="text-[9px] text-emerald-500/80 font-bold mt-0.5">Your edits are safely auto-writing to your disk.</p>
              </div>
              <button 
                onClick={handleLinkGhost}
                className="px-3 py-1 bg-emerald-500/20 text-emerald-300 font-bold text-[9px] uppercase tracking-widest rounded hover:bg-emerald-500/30 transition"
              >
                Relink
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl mb-2">
                <Shield size={14} className="text-rose-400" />
                <div>
                  <p className="text-xs text-rose-400 font-bold uppercase tracking-widest font-mono">Tunnel Disconnected</p>
                  <p className="text-[9px] text-rose-500/80 font-bold mt-0.5">Data currently restricted to browser temporary memory only.</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={handleCreateGhost}
                  className="flex-1 py-3 bg-[#ff6b1a] text-black font-black text-xs uppercase tracking-widest rounded-lg hover:bg-[#ff8844] transition shadow-[0_0_15px_rgba(255,107,26,0.3)]"
                >
                  Create New Node
                </button>
                <button 
                  onClick={handleLinkGhost}
                  className="flex-1 py-3 bg-transparent border border-[#2a2a50] text-[#ff6b1a] font-bold text-xs uppercase tracking-widest rounded-lg hover:bg-[#ff6b1a]/10 hover:border-[#ff6b1a] transition"
                >
                  Link Existing
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Grid: Profile and Backup */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Profile Card */}
        <div className="bg-[#0d0d1a] border border-[#1e1e38] rounded-xl p-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 border-b border-[#111120] pb-2 mb-3.5 flex items-center gap-1.5">
            <Settings size={13} className="text-[#ff6b1a]" />
            PROFILE CONFIGURATION
          </h3>

          <form onSubmit={handleProfileSubmit} className="space-y-3 font-semibold">
            <div className="space-y-1">
              <label className="text-[9px] text-slate-500 uppercase tracking-widest block font-black">YOUR NAME</label>
              <input 
                type="text"
                className="w-full bg-[#111120] border border-[#2a2a50] rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-700 focus:outline-none"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                placeholder="Type your name..."
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] text-slate-500 uppercase tracking-widest block font-black">tagline / professional status</label>
              <input 
                type="text"
                className="w-full bg-[#111120] border border-[#2a2a50] rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-700 focus:outline-none"
                value={profileTagline}
                onChange={(e) => setProfileTagline(e.target.value)}
                placeholder="e.g. Student · Developer · Visionary"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] text-slate-500 uppercase tracking-widest block font-black">backup email ADDRESS</label>
              <input 
                type="email"
                className="w-full bg-[#111120] border border-[#2a2a50] rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-700 focus:outline-none"
                value={profileEmail}
                onChange={(e) => setProfileEmail(e.target.value)}
                placeholder="email@example.com"
              />
            </div>

            <button
              type="submit"
              className="px-4 py-1.5 bg-[#ff6b1a] text-black font-extrabold text-[10px] uppercase tracking-widest rounded-lg hover:bg-[#ff9040]"
            >
              SAVE PROFILE
            </button>
          </form>
        </div>

        {/* Database backup */}
        <div className="bg-[#0d0d1a] border border-[#1e1e38] rounded-xl p-4 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 border-b border-[#111120] pb-2 mb-3 flex items-center gap-1.5">
              <Database size={13} className="text-[#00d4ff]" />
              DATABASE BACKUPS & MANAGE
            </h3>
            <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">
              Backup all your log history, journals, parameters, and reminders in lightweight JSON formatting to restore them anytime. You can also export a CSV database package to load in real Google Sheets, Microsoft Excel or LibreOffice.
            </p>
          </div>

          <div className="space-y-2 mt-4 font-black uppercase tracking-widest">
            <div className="flex gap-2 text-xs">
              <button 
                onClick={onExportJSON}
                className="flex-1 py-1.5 bg-transparent border border-[#2a2a50] text-[#00d4ff] hover:border-[#00d4ff] hover:bg-[#00d4ff]/5 rounded-lg transition"
              >
                ▼ BACKUP JSON
              </button>
              <button 
                onClick={onExportCSV}
                className="flex-1 py-1.5 bg-transparent border border-[#2a2a50] text-amber-500 hover:border-amber-400 hover:bg-amber-500/5 rounded-lg transition"
              >
                ▼ BACKUP CSV
              </button>
            </div>
            
            <div className="flex gap-2">
              <label className="flex-1 py-1.5 text-center bg-transparent border border-[#1e1e38] text-slate-400 hover:border-slate-700 rounded-lg cursor-pointer transition text-xs flex items-center justify-center font-bold">
                ▲ RESTORE JSON DATABASE
                <input 
                  type="file" 
                  accept=".json" 
                  className="hidden" 
                  onChange={handleFileUpload} 
                />
              </label>

              <button 
                onClick={onResetAll}
                className="px-4 py-1.5 border border-rose-600/40 text-rose-500 hover:bg-rose-500/10 rounded-lg text-xs"
              >
                ⚠ HARD RESET
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Cloud Sync Setup Section */}
      <div className="bg-[#0d0d1a] border border-[#1e1e38] rounded-xl p-5 space-y-4">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 border-b border-[#111120] pb-2 flex items-center gap-1.5">
          <Cloud size={14} className="text-[#00ff88]" />
          ☁ CLOUD SYNCHRONIZATION DRIVE
        </h3>
        <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">// autosaves backups as you track. synchronization works fully responsive across devices</p>

        <div className="flex gap-2 select-none">
          <button
            onClick={() => onSelectSyncProvider('none')}
            className={`px-4 py-1 text-xs font-bold rounded uppercase tracking-wider border transition ${
              syncCfg.provider === 'none' ? 'bg-slate-800 border-slate-600 text-slate-300' : 'border-[#1e1e38] text-slate-400'
            }`}
          >
            ⊘ CLOUD OFF
          </button>
          <button
            onClick={() => onSelectSyncProvider('gist')}
            className={`px-4 py-1 text-xs font-bold rounded uppercase tracking-wider border transition ${
              syncCfg.provider === 'gist' ? 'bg-[#ff6b1a]/50 text-black border-[#ff6b1a]' : 'border-[#1e1e38] text-slate-400'
            }`}
          >
            ◈ GITHUB GIST
          </button>
          <button
            onClick={() => onSelectSyncProvider('jsonbin')}
            className={`px-4 py-1 text-xs font-bold rounded uppercase tracking-wider border transition ${
              syncCfg.provider === 'jsonbin' ? 'bg-indigo-600 text-slate-100 border-indigo-400' : 'border-[#1e1e38] text-slate-400'
            }`}
          >
            ◈ JSONBIN.IO
          </button>
        </div>

        {/* Sync fields */}
        {syncCfg.provider === 'gist' && (
          <div className="p-4 bg-[#111120] border border-[#1e1e38] rounded-xl space-y-3 font-semibold">
            <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">// github gist credentials sync</p>
            <input 
              type="password"
              className="w-full bg-slate-950 border border-[#2a2a50] rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-700 focus:outline-none"
              placeholder="GitHub Developer Access Token (ghp_xxxxxxxxxxxxxxxxxxxx)"
              value={syncCfg.gistToken}
              onChange={(e) => onUpdateSyncFields({ gistToken: e.target.value })}
            />
            <input 
              type="text"
              className="w-full bg-slate-950 border border-[#2a2a50] rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-750 focus:outline-none"
              placeholder="Gist ID (leave blank to let app create automatically on first sync)"
              value={syncCfg.gistId}
              onChange={(e) => onUpdateSyncFields({ gistId: e.target.value })}
            />
          </div>
        )}

        {syncCfg.provider === 'jsonbin' && (
          <div className="p-4 bg-[#111120] border border-[#1e1e38] rounded-xl space-y-3 font-semibold">
            <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">// jsonbin.io credential sync</p>
            <input 
              type="password"
              className="w-full bg-slate-950 border border-[#2a2a50] rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-700 focus:outline-none"
              placeholder="JSONBin Master Key ($2b$10$xxxxxxxxxxxxxxxxxxxx)"
              value={syncCfg.jbKey}
              onChange={(e) => onUpdateSyncFields({ jbKey: e.target.value })}
            />
            <input 
              type="text"
              className="w-full bg-slate-950 border border-[#2a2a50] rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-750 focus:outline-none"
              placeholder="Bin ID (leave blank to let app compile bin dynamically has startup)"
              value={syncCfg.jbId}
              onChange={(e) => onUpdateSyncFields({ jbId: e.target.value })}
            />
          </div>
        )}

        {syncCfg.provider !== 'none' && (
          <div className="space-y-2 pt-2 border-t border-[#111120]/30 select-none">
            <div className="flex gap-2.5 text-xs uppercase font-black tracking-wider">
              <button 
                onClick={onSyncNow}
                disabled={isSyncing}
                className="px-4 py-1.5 bg-[#00d4ff] text-black hover:bg-cyan-400 rounded-lg font-extrabold disabled:opacity-40"
              >
                {isSyncing ? 'SYNCING...' : '⬆ SYNC TO CLOUD NOW'}
              </button>
              <button 
                onClick={onPullFromCloud}
                disabled={isSyncing}
                className="px-4 py-1.5 bg-transparent border border-[#2a2a50] text-[#00d4ff] hover:border-[#00d4ff] hover:bg-[#00d4ff]/10 rounded-lg font-bold disabled:opacity-40"
              >
                PULL FROM CLOUD DRIVE
              </button>
              <button 
                onClick={onClearSyncConfig}
                className="px-4 py-1.5 border border-rose-600/40 text-rose-500 hover:bg-rose-500/10 rounded-lg"
              >
                ✕ DISCONNECT
              </button>
            </div>

            <pre className="w-full bg-slate-950 border border-[#1e1e38] rounded-lg p-2.5 text-[9px] text-slate-500 font-mono leading-relaxed max-h-[85px] overflow-y-auto">
              {syncLog || '// no sync activity registered'}
            </pre>
          </div>
        )}
      </div>

      {/* Tracker checklist modifications */}
      <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 select-none mt-2 border-b border-[#1e1e38] pb-1.5">
        CHECKLIST MODIFICATIONS
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {CATS.map((cat) => {
          const items = state.items[cat.id] || [];
          const inputVal = addInputs[cat.id] || '';

          return (
            <div key={cat.id} className="bg-[#0d0d1a] border border-[#1e1e38] rounded-xl p-4 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wide flex items-center gap-1 border-b border-[#111120] pb-2" style={{ color: cat.neon }}>
                {cat.icon} Manage {cat.label}
              </h4>

              {/* Tag checklist pool */}
              <div className="flex flex-wrap gap-1.5 max-h-[140px] overflow-y-auto pr-1">
                {items.length > 0 ? (
                  items.map(item => (
                    <div 
                      key={item}
                      className="flex items-center text-xs font-bold border rounded-lg px-2 py-0.5"
                      style={{ borderColor: `${cat.neon}22`, color: cat.neon, backgroundColor: `${cat.neon}05` }}
                    >
                      <span className="truncate pr-1 font-medium text-slate-300">{item}</span>
                      <button 
                        onClick={() => onRemoveItem(cat.id, item)}
                        className="text-slate-500 hover:text-rose-500 pl-1 border-l border-[#1e1e38] ml-1 transition"
                        title="Remove tracker item"
                      >
                        ✕
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-[10px] text-slate-600 tracking-wider font-mono italic uppercase">// checklist is empty</p>
                )}
              </div>

              {/* Add form */}
              <form onSubmit={(e) => handleAddItemSubmit(cat.id, e)} className="flex gap-2">
                <input 
                  type="text"
                  className="flex-1 bg-[#111120] border border-[#1e1e38] rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-700 font-medium focus:outline-none"
                  placeholder={`Add new tracker ...`}
                  value={inputVal}
                  onChange={(e) => {
                    const txt = e.target.value;
                    setAddInputs(prev => ({ ...prev, [cat.id]: txt }));
                  }}
                />
                <button 
                  type="submit"
                  className="px-3.5 py-1 bg-transparent hover:bg-slate-800 rounded-lg text-xs border border-[#2a2a50] text-[#00d4ff] hover:border-[#00d4ff] transition uppercase font-bold tracking-widest shrink-0"
                >
                  + ADD
                </button>
              </form>
            </div>
          );
        })}
      </div>

      {/* Target Budgets Estimators parameters */}
      <div className="bg-[#0d0d1a] border border-[#1e1e38] rounded-xl p-5 space-y-4 select-none">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 border-b border-[#111120] pb-2">
          DAILY BUDGET PARAMETERS
        </h3>
        <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">
          Define standard daily repetition milestones and hour metrics for each checklist element below. The Goals page multiplies these base budgets by period duration automatically to form estimates!
        </p>

        <div className="space-y-4">
          {CATS.map((cat) => {
            const list = state.items[cat.id] || [];
            if (list.length === 0) return null;

            return (
              <div key={cat.id} className="space-y-2">
                <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: cat.neon }}>
                  {cat.icon} {cat.label} Estimates
                </span>

                <div className="space-y-2">
                  {list.map(it => {
                    const repsT = (state.repsTarget[cat.id] && state.repsTarget[cat.id]![it] !== undefined) ? state.repsTarget[cat.id]![it] : 1;
                    const hrsT = (state.hoursTarget[cat.id] && state.hoursTarget[cat.id]![it] !== undefined) ? state.hoursTarget[cat.id]![it] : 1;

                    return (
                      <div key={it} className="flex flex-col sm:flex-row sm:items-center p-2.5 bg-[#111120] border border-[#1e1e38] rounded-lg justify-between gap-3 text-xs font-semibold">
                        <span className="text-xs font-bold text-slate-300 flex-1">{it}</span>

                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-1.5">
                            <span className="text-[9px] text-slate-500 uppercase tracking-widest block font-bold">Reps target:</span>
                            <input 
                              type="number"
                              className="w-12 bg-slate-950 border border-[#2a2a50] rounded px-1.5 py-0.5 text-center font-bold text-xs text-[#ff6b1a] focus:outline-none"
                              value={repsT}
                              min={0}
                              onChange={(e) => onUpdateTargetFields(cat.id, it, 'reps', +e.target.value)}
                            />
                          </label>

                          <label className="flex items-center gap-1.5">
                            <span className="text-[9px] text-slate-500 uppercase tracking-widest block font-bold font-bold">Hrs target:</span>
                            <input 
                              type="number"
                              className="w-12 bg-slate-950 border border-[#2a2a50] rounded px-1.5 py-0.5 text-center font-bold text-xs text-[#00d4ff] focus:outline-none"
                              value={hrsT}
                              min={0}
                              step={0.25}
                              onChange={(e) => onUpdateTargetFields(cat.id, it, 'hours', +e.target.value)}
                            />
                          </label>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Repeating / Recurring schedulers */}
      <div className="bg-[#0d0d1a] border border-[#1e1e38] rounded-xl p-5 space-y-4">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 border-b border-[#111120] pb-2">
          ↻ REUSE / RECURRING PLANNER SCHEDULES
        </h3>
        <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">
          Configure a daily recurrence filter for any tracker checklist action. Elements not scheduled for today automatically slip so they won't weigh down your daily percentage score!
        </p>

        <div className="space-y-4">
          {CATS.map((cat) => {
            const list = state.items[cat.id] || [];
            if (list.length === 0) return null;

            return (
              <div key={cat.id} className="space-y-2">
                <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: cat.neon }}>
                  {cat.icon} {cat.label} Recurrences
                </span>

                <div className="space-y-1 bg-[#111120]/50 border border-[#1e1e38] rounded-xl p-2.5">
                  {list.map(it => {
                    const rec = getRecurring(cat.id, it);
                    return (
                      <div key={it} className="flex items-center justify-between py-1.5 border-b border-[#1e1e38]/50 last:border-b-0 text-xs">
                        <span className="font-bold text-slate-300">{it}</span>
                        <div className="flex items-center gap-2 select-none">
                          {rec ? (
                            <span className="px-2 py-0.5 bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/30 font-black text-[9px] uppercase tracking-widest rounded-md">
                              ↻ {rec.freq}
                            </span>
                          ) : (
                            <span className="text-[9px] text-slate-600 uppercase font-mono font-bold tracking-widest">// DAILY CONSTANT</span>
                          )}
                          <button
                            onClick={() => onOpenRecurringModal(cat.id, it)}
                            className="px-2.5 py-1 bg-transparent hover:bg-slate-950 border border-[#2a2a50] hover:border-[#ff6b1a]/50 text-[#ff6b1a] text-[9px] font-bold rounded-lg transition uppercase tracking-wider"
                          >
                            {rec ? '🔧 EDIT' : '+ SCHEDULE'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
