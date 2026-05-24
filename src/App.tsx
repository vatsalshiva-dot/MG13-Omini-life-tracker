import React, { useState, useEffect } from 'react';
import { 
  AppState, TrackerCategory, DayEntry, Reminder, JournalEntry, JournalPrompt, SyncConfig, PomoSession, TrackerStatus 
} from './types';
import { 
  loadData, saveData, loadSyncCfg, saveSyncCfg, defData, CATS,
  syncGist, pullGist, syncJSONBin, pullJSONBin 
} from './utils/storage';
import { todayStr, periodRange } from './utils/date';

const getThemeCSS = (colorHex?: string, bgTheme?: string) => {
  let cssStr = '';

  if (colorHex && colorHex !== '#ff6b1a') {
    const hex = colorHex.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const rgb = `${r}, ${g}, ${b}`;

    cssStr += `
      .text-\\[\\#ff6b1a\\] { color: ${colorHex} !important; }
      .bg-\\[\\#ff6b1a\\] { background-color: ${colorHex} !important; }
      .bg-\\[\\#ff6b1a\\]\\/10 { background-color: rgba(${rgb}, 0.1) !important; }
      .bg-\\[\\#ff6b1a\\]\\/30 { background-color: rgba(${rgb}, 0.3) !important; }
      .bg-\\[\\#ff6b1a\\]\\/50 { background-color: rgba(${rgb}, 0.5) !important; }
      .border-\\[\\#ff6b1a\\] { border-color: ${colorHex} !important; }
      .border-\\[\\#ff6b1a\\]\\/20 { border-color: rgba(${rgb}, 0.2) !important; }
      .border-\\[\\#ff6b1a\\]\\/25 { border-color: rgba(${rgb}, 0.25) !important; }
      .border-\\[\\#ff6b1a\\]\\/30 { border-color: rgba(${rgb}, 0.3) !important; }
      .border-\\[\\#ff6b1a\\]\\/40 { border-color: rgba(${rgb}, 0.4) !important; }
      .border-\\[\\#ff6b1a\\]\\/50 { border-color: rgba(${rgb}, 0.5) !important; }
      .hover\\:bg-\\[\\#ff6b1a\\]:hover { background-color: ${colorHex} !important; }
      .hover\\:bg-\\[\\#ff6b1a\\]\\/10:hover { background-color: rgba(${rgb}, 0.1) !important; }
      .hover\\:border-\\[\\#ff6b1a\\]:hover { border-color: ${colorHex} !important; }
      .hover\\:border-\\[\\#ff6b1a\\]\\/35:hover { border-color: rgba(${rgb}, 0.35) !important; }
      .hover\\:border-\\[\\#ff6b1a\\]\\/50:hover { border-color: rgba(${rgb}, 0.5) !important; }
      .hover\\:text-\\[\\#ff6b1a\\]:hover { color: ${colorHex} !important; }
      .focus\\:border-\\[\\#ff6b1a\\]:focus { border-color: ${colorHex} !important; }
      .focus\\:border-\\[\\#ff6b1a\\]\\/50:focus { border-color: rgba(${rgb}, 0.5) !important; }
      .border-l-\\[\\#ff6b1a\\] { border-left-color: ${colorHex} !important; }
    `;
  }

  if (bgTheme && bgTheme !== 'midnight') {
    let bg0 = '#0d0d1a'; // Dashboard BG
    let bg1 = '#111120'; // Card BG
    
    if (bgTheme === 'abyssal') { bg0 = '#000000'; bg1 = '#09090b'; }
    if (bgTheme === 'hacker') { bg0 = '#020a02'; bg1 = '#051205'; }
    if (bgTheme === 'cyber') { bg0 = '#020010'; bg1 = '#0a0020'; }
    if (bgTheme === 'crimson') { bg0 = '#0f0003'; bg1 = '#1a0005'; }

    cssStr += `
      .bg-\\[\\#0d0d1a\\] { background-color: ${bg0} !important; }
      .bg-\\[\\#111120\\] { background-color: ${bg1} !important; }
    `;
  }

  return cssStr;
};

// Views
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { DailyTrackerView } from './components/DailyTrackerView';
import { GoalsView } from './components/GoalsView';
import { AnalyticsView } from './components/AnalyticsView';
import { CalendarView } from './components/CalendarView';
import { RemindersView } from './components/RemindersView';
import { JournalView } from './components/JournalView';
import { PomoView } from './components/PomoView';
import { SynopsisView } from './components/SynopsisView';
import { SearchView } from './components/SearchView';
import { SettingsView } from './components/SettingsView';
import { HelpView } from './components/HelpView';
import { DEMO_STATE } from './utils/demoData';
import { ExpeditionsView } from './components/ExpeditionsView';
import { FinancesView } from './components/FinancesView';
import { SketchpadView } from './components/SketchpadView';
import { AlertsView } from './components/AlertsView';
import { AiAnalystView } from './components/AiAnalystView';
import { FocusAudioView } from './components/FocusAudioWidget';
import { OnboardingModal } from './components/OnboardingModal';

import { 
  AlertCircle, CheckCircle2, RotateCcw, X, PlusCircle, Check, Bot, ClipboardCopy
} from 'lucide-react';

import { getFileHandle } from './utils/ghost';

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
              <h4 className="text-[10px] font-black text-rose-400 uppercase tracking-widest flex items-center gap-1.5"><AlertCircle size={14} /> Alert: Offline Mode</h4>
              <button onClick={() => setShowAlert(false)} className="text-slate-500 hover:text-white transition"><X size={14}/></button>
          </div>
          <p className="text-[10px] text-rose-500/80 font-bold">Data is at risk!</p>
          <p className="text-[9px] text-slate-400 font-medium leading-relaxed">Ghost Sync is off. Please go to Settings and setup Ghost Sync to activate private auto-save to your hard drive.</p>
       </div>
    </div>
  );
};

const ReminderAlert = ({ state, hasSystemAlerts, onNavigate }: { state: AppState, hasSystemAlerts: boolean, onNavigate: (v: string) => void }) => {
  const [show, setShow] = useState(false);
  const [counts, setCounts] = useState({ user: 0, sys: 0 });
  const [dismissedCount, setDismissedCount] = useState({ alerts: 0, time: 0 });

  useEffect(() => {
    const check = () => {
      const today = todayStr();
      const pNow = new Date();
      
      const isDueOrOverdue = (r: any) => {
        if (r.status === 'done') return false;
        if (r.enableAlert === false) return false;
        
        if (r.dueDate < today) return true;
        
        if (r.dueDate === today) {
          if (!r.time) return true; // All day alerts
          
          const targetTime = new Date();
          const [h, m] = r.time.split(':').map(Number);
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
        setCounts(prev => prev.user === userCount && prev.sys === sysCount ? prev : { user: userCount, sys: sysCount });
        if (totalAlerts !== dismissedCount.alerts || (Date.now() - dismissedCount.time > 60 * 60 * 1000)) {
          setShow(true);
        }
      } else {
        setShow(false);
        setDismissedCount(prev => prev.alerts === 0 && prev.time === 0 ? prev : { alerts: 0, time: 0 });
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
    <div className="fixed bottom-24 right-6 z-[60] animate-bounce pointer-events-auto">
       <div 
         className="bg-[#111120] border-2 border-rose-500 p-3 rounded-xl shadow-[0_4px_24px_rgba(244,63,94,0.4)] flex items-center gap-3 transition"
       >
         <div onClick={() => onNavigate(isOnlySys ? 'alerts' : 'reminders')} className="flex items-center gap-3 cursor-pointer hover:opacity-80">
           <div className="w-8 h-8 rounded-full bg-rose-500/20 text-rose-500 flex items-center justify-center">
             <AlertCircle size={16} />
           </div>
           <div>
             <h4 className="text-xs font-black text-rose-400 uppercase tracking-widest">{isOnlySys ? 'System Alert' : 'Active Reminder'}</h4>
             <p className="text-[10px] text-slate-300 font-bold">{total} Alert{total > 1 ? 's' : ''} Pending</p>
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

import { focusAudio } from './utils/audioSystem';

export default function App() {
  const [activeView, setActiveView] = useState<string>('dashboard');
  const [audioTrack, setAudioTrack] = useState('none');
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
  const [appState, setAppState] = useState<AppState>(defData());
  
  // Cloud sync
  const [syncCfg, setSyncCfg] = useState<SyncConfig>({
    provider: 'none', gistToken: '', gistId: '', jbKey: '', jbId: '', lastSync: '', lastSyncTs: 0
  });
  const [syncLog, setSyncLog] = useState<string>('');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Toast status states
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'nfo' } | null>(null);
  
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (appState && !appState.onboarding?.[activeView]) {
      setShowOnboarding(true);
    }
  }, [activeView, appState?.onboarding]);

  const handleDismissOnboarding = () => {
    setShowOnboarding(false);
    setAppState(prev => ({
      ...prev,
      onboarding: { ...(prev.onboarding || {}), [activeView]: true }
    }));
    saveData({
      ...appState,
      onboarding: { ...(appState.onboarding || {}), [activeView]: true }
    });
  };

  // Pomodoro Shared States
  const [pomoState, setPomoState] = useState<'idle' | 'work' | 'break'>('idle');
  const [pomoTimeLeft, setPomoTimeLeft] = useState<string>('25:00');
  const [pomoPercent, setPomoPercent] = useState<number>(0);
  const [pomoElapsedSeconds, setPomoElapsedSeconds] = useState<number>(0);
  const [pomoTaskName, setPomoTaskName] = useState<string | null>(null);
  const [pomoTaskCat, setPomoTaskCat] = useState<TrackerCategory | null>(null);
  const [pomoWorkMin, setPomoWorkMin] = useState<number>(25);
  const [pomoBrkMin, setPomoBrkMin] = useState<number>(5);
  const [pomoPreset, setPomoPreset] = useState<string>('classic');

  // Recurring Modal Overlay State
  const [recModalOpen, setRecModalOpen] = useState(false);
  const [recCat, setRecCat] = useState<TrackerCategory | null>(null);
  const [recItem, setRecItem] = useState<string | null>(null);
  const [recFreq, setRecFreq] = useState<'daily' | 'weekdays' | 'weekends' | 'custom'>('daily');
  const [recDays, setRecDays] = useState<number[]>([]);

  // AI Analyst Modal
  const [aiModal, setAiModal] = useState<{ isOpen: boolean, promptText: string }>({ isOpen: false, promptText: '' });

  const handleOpenAIAnalyst = (customPrompt?: string | React.MouseEvent) => {
    let finalPrompt = typeof customPrompt === 'string' ? customPrompt : null;

    if (!finalPrompt) {
      let focusData: any = {};
      if (activeView === 'dashboard') focusData = appState;
      else if (activeView === 'daily') focusData = { daily: appState.daily, goals: appState.goals, pomoSessions: appState.pomoSessions };
      else if (activeView === 'journal') focusData = { journals: appState.journals, daily: appState.daily };
      else if (activeView === 'finances') focusData = appState.finances;
      else if (activeView === 'expeditions') focusData = appState.expeditions;
      else if (activeView === 'reminders') focusData = appState.reminders;
      else if (activeView === 'goals') focusData = { goals: appState.goals, daily: appState.daily, pomoSessions: appState.pomoSessions };
      else if (activeView === 'pomo') focusData = appState.pomoSessions;
      else focusData = appState;

      let summaryText = "";
      try {
        summaryText = JSON.stringify(focusData, null, 2); 
        if (summaryText.length > 50000) {
          summaryText = summaryText.substring(0, 50000) + '\n... [Data Truncated due to size]';
        }
      } catch (e) {
        summaryText = "[Data Overview]";
      }

      finalPrompt = `Hello AI, act as my elite personal analyst and life-optimization executive assistant for my "Omnilife Tracker".

### PURPOSE OF THIS PROMPT:
I am providing you with my personal data exported from Omnilife Tracker. I want you to perform deep, advanced, personalized analysis to help me optimize my life, habits, productivity, and finances. 

### OMNILIFE TRACKER - SYSTEM ARCHITECTURE & DATA DICTIONARY:
Omnilife Tracker is a 100% local, offline-first super-app. All my data is stored as a single JSON tree. You need to understand how the modules interlock to provide holistic insights:

1. **Dashboard & Streaks**: The command node. Tracks daily completion rates and active habit streaks.
2. **Daily Tracker (\`daily\`)**: [Date] -> [Category: 'health' | 'work' | 'learning' | 'personal'] -> [Task Name]. Contains \`completed\` (boolean), \`qty\` (number, e.g. hours or reps), \`skipped\` (boolean), \`notes\` (string).
   -> *Analysis Note*: Look for days where completing one habit (e.g. sleep) correlates with completing another (e.g. work). Find gaps or "skipped" chains.
3. **Daily Journal (\`journals\`)**: Nested by [Date]. Contains \`mood\` (1-5 scale), \`energy\` (1-5 scale), \`location\` (GPS string), \`tags\` (array), \`prompts\` (text responses), \`notes\` (freeform text).
   -> *Analysis Note*: This is critical. Correlate \`mood\` and \`energy\` with the \`daily\` habit completion rates. Does low energy follow high spending? Does high mood follow exercise?
4. **Goals & Targets (\`goals\`)**: Structured by period ('weekly', 'monthly', 'yearly', 'lifetime'). Contains target \`reps\` and target \`hours\` for specific tasks. The app aggregates \`daily\` logs and \`pomoSessions\` to calculate progress.
5. **Finances (\`finances\`)**: Contains \`accounts\` (name, balance, type), \`transactions\` (amount, category, type: 'income' | 'expense', and array of \`tasks\` for financial goals). We run analysis against \`financeBudgets\`.
   -> *Analysis Note*: Analyze my burn rate and financial goals. Warn me if my expenses exceed my income trajectory or budget limits. Check if my manual financial tasks/goals are being met.
6. **Expeditions (\`expeditions\`)**: My trip planner with itinerary dates, packing lists, custom goals (\`customTasks\`), and locations. Can be linked to Alerts, Reminders, and Calendar seamlessly. Note that expeditions directly trigger alert timelines.
7. **Pomodoro (\`pomoSessions\`)**: Focus timer logs. Array of { taskName, category, durationMinutes, timestamp }. Heavily integrated with Focus Audio.
   -> *Analysis Note*: Cross-reference these with my \`goals\` and \`daily\` tasks. Am I actually spending time effectively? Does Focus Audio ("brown noise," "rain," etc.) correlate with longer sessions?
8. **Reminders (\`reminders\`)**: One-off and recurring tasks with \`priority\` ('high'|'medium'|'low'), \`dueDate\`, \`time\`, and \`enableAlert\`. Reminders are directly spawned from Expeditions and Finances for billing and trip alerts.
9. **Focus Audio**: Embedded ambient audio states. Notice how audio states integrate directly with Pomodoro sessions to lower stress and induce flow.
10. **Sketchpad**: Digital drawing tools (not purely data).
11. **Settings / Theme**: Custom Neon Color profiles ("Volcanic Orange", "Cyber Cyan", etc.) are stored in \`neonTheme\`.
12. **Synopsis**: Digested logs are sent directly to Email, Telegram, and SMS through the frontend gateways.

### MY CURRENT CONTEXT:
I am currently viewing the [${activeView.toUpperCase()}] module. I am looking for insights specifically related to this view, but you should use the full context provided to give holistic advice.

### EXPORTED JSON DATA (FOR ANALYSIS):
\`\`\`json
${summaryText}
\`\`\`

### INSTRUCTIONS FOR YOUR ANALYSIS:
1. **Data Ingestion**: Thoroughly parse the provided JSON data. It represents my actual life metrics.
2. **Correlation & Cross-Analysis**: Do not just summarize. Connect the dots.
   - If \`journals\` and \`daily\` data are present: How do my habits directly impact my \`mood\` and \`energy\`?
   - If \`finances\` and \`journals\` are present: Do I spend more money on low-energy days?
   - If \`expeditions\` and \`finances\` are present: How do my travel trips impact my net balance? Are my budgets handling it well?
   - If \`pomoSessions\` are present: How do different \`focus_audio\` tracks affect my Pomodoro productivity?
   - What are my strongest consistency loops? Where are the breaking points in my streaks?
3. **Advanced Personalization**: Base all advice *strictly* on the numbers and trends in the data. If I am failing a goal, point it out ruthlessly.
4. **Actionable Roadmap**: Provide 3-5 specific, stoic, and immediately actionable steps I can take TODAY to fix weak points and accelerate my momentum.
5. **Tone**: Be professional, analytical, objective, and highly strategic. Pretend you are Advising a high-performance executive.`;
    }
    
    setAiModal({ isOpen: true, promptText: finalPrompt }); 
  };

  // 1. Initial Load
  useEffect(() => {
    let loaded = loadData();
    // If in demo mode and no demo data was loaded from storage, use DEMO_STATE
    if (window.location.search.includes('demo=true') && !localStorage.getItem('demo_lt_v5')) {
      loaded = DEMO_STATE;
      saveData(DEMO_STATE);
    }
    
    setAppState(loaded);

    const loadedSync = loadSyncCfg();
    setSyncCfg(loadedSync);
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
  const showToast = (msg: string, type: 'ok' | 'nfo' = 'ok') => {
    setToast({ msg, type });
  };

  useEffect(() => {
    if (toast) {
      const tid = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(tid);
    }
  }, [toast]);

  // 3. Sync Logger helper
  const logSync = (msg: string) => {
    const ts = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setSyncLog(prev => `[${ts}] ${msg}\n${prev}`);
  };

  // 4. Cloud operations
  const syncNow = async () => {
    if (syncCfg.provider === 'none') {
      showToast('CLOUDSYNC IS TERMINATED', 'nfo');
      return;
    }
    setIsSyncing(true);
    logSync('Sync initialized...');

    try {
      if (syncCfg.provider === 'gist') {
        const res = await syncGist(syncCfg, appState);
        setSyncCfg(prev => {
          const next = { ...prev, gistId: res.gistId, lastSync: 'ok' as const, lastSyncTs: Date.now() };
          saveSyncCfg(next);
          return next;
        });
      } else {
        const res = await syncJSONBin(syncCfg, appState);
        setSyncCfg(prev => {
          const next = { ...prev, jbId: res.binId, lastSync: 'ok' as const, lastSyncTs: Date.now() };
          saveSyncCfg(next);
          return next;
        });
      }
      logSync('Sync success ✓');
      showToast('DATABASE SAVED TO CLOUD DRIVE', 'ok');
    } catch (err: any) {
      setSyncCfg(prev => {
        const next = { ...prev, lastSync: 'error' as const };
        saveSyncCfg(next);
        return next;
      });
      logSync(`Sync failed: ${err.message}`);
      showToast(`SYNC FAILED: ${err.message}`, 'nfo');
    } finally {
      setIsSyncing(false);
    }
  };

  const pullFromCloud = async () => {
    if (syncCfg.provider === 'none') return;
    if (!confirm('PULL DATABASE BACKUP?\nYour local un-synchronized changes will be completely overwritten.')) return;
    setIsSyncing(true);
    logSync('Pull initialized...');

    try {
      let pulled: AppState;
      if (syncCfg.provider === 'gist') {
        pulled = await pullGist(syncCfg);
      } else {
        pulled = await pullJSONBin(syncCfg);
      }
      
      setAppState(pulled);
      saveData(pulled);
      logSync('Pull success ✓');
      showToast('PULLED DATABASE BACKUP SUCCESSFULLY', 'ok');
    } catch (err: any) {
      logSync(`Pull failed: ${err.message}`);
      showToast(`PULL FAILED: ${err.message}`, 'nfo');
    } finally {
      setIsSyncing(false);
    }
  };

  const updateSyncFields = (updatedFields: Partial<SyncConfig>) => {
    setSyncCfg(prev => {
      const next = { ...prev, ...updatedFields };
      saveSyncCfg(next);
      return next;
    });
  };

  const selectSyncProvider = (provider: 'none' | 'gist' | 'jsonbin') => {
    setSyncCfg(prev => {
      const next = { ...prev, provider };
      saveSyncCfg(next);
      return next;
    });
    logSync(`Selected cloud: ${provider.toUpperCase()}`);
  };

  const clearSyncConfig = () => {
    const next: SyncConfig = { provider: 'none', gistToken: '', gistId: '', jbKey: '', jbId: '', lastSync: '', lastSyncTs: 0 };
    setSyncCfg(next);
    saveSyncCfg(next);
    setSyncLog('');
    showToast('DISCONNECTED SYNC PROFILE', 'nfo');
  };

  // 5. Pomodoro clock ticker
  useEffect(() => {
    let intervalId: any = null;
    if (pomoState !== 'idle') {
      intervalId = setInterval(() => {
        setPomoElapsedSeconds(prev => {
          const next = prev + 1;
          const targetLimit = (pomoState === 'work' ? pomoWorkMin : pomoBrkMin) * 60;
          
          if (next >= targetLimit) {
            clearInterval(intervalId);
            onPomoCycleCompleted();
            return 0;
          }

          // Format countdown format
          const rem = targetLimit - next;
          const m = String(Math.floor(rem / 60)).padStart(2, '0');
          const s = String(rem % 60).padStart(2, '0');
          setPomoTimeLeft(`${m}:${s}`);
          setPomoPercent(next / targetLimit);
          return next;
        });
      }, 1000);
    } else {
      const m = String(pomoWorkMin).padStart(2, '0');
      setPomoTimeLeft(`${m}:00`);
      setPomoPercent(0);
    }

    return () => clearInterval(intervalId);
  }, [pomoState, pomoWorkMin, pomoBrkMin]);

  const onPomoCycleCompleted = () => {
    const isWork = pomoState === 'work';

    if (isWork && pomoTaskName) {
      const minsEarned = pomoWorkMin;
      const hrsEquivalent = Math.round((minsEarned / 60) * 100) / 100;

      const newSession: PomoSession = {
        id: 'p_done_' + Date.now(),
        task: pomoTaskName,
        cat: pomoTaskCat || 'custom',
        duration: minsEarned,
        type: 'work',
        date: todayStr(),
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        status: 'completed'
      };

      // Sound feedback synth
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, audioCtx.currentTime); // High A
        gain.gain.setValueAtTime(0.35, audioCtx.currentTime);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.35);
      } catch (err) {}

      setAppState(prev => {
        const cat = pomoTaskCat || 'custom';
        const item = pomoTaskName;

        let dailyNode = { ...prev.daily };
        if (!dailyNode[activeDate]) dailyNode[activeDate] = {};
        if (!dailyNode[activeDate][cat]) dailyNode[activeDate][cat] = {};

        const currentEntry = dailyNode[activeDate][cat]![item] || {
          status: 'pending', reps: 0, hours: 0, satisfaction: 0, notes: ''
        };

        const updatedEntry = {
          ...currentEntry,
          status: 'done' as const,
          hours: Math.round(((currentEntry.hours || 0) + hrsEquivalent) * 100) / 100
        };

        dailyNode[activeDate][cat]![item] = updatedEntry;

        const next = {
          ...prev,
          pomoSessions: [...(prev.pomoSessions || []), newSession],
          daily: dailyNode
        };
        saveData(next);
        return next;
      });

      showToast(`CONGRATS! ${pomoWorkMin}MIN FOCUS ACHIEVED — ADDED TO TODAY CHECKLIST!`, 'ok');
      
      // Auto transitions into breaks
      setPomoState('break');
      setPomoElapsedSeconds(0);
    } else {
      // Completed breaks
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, audioCtx.currentTime); // Concert A
        gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.45);
      } catch (err) {}

      showToast('BREAK CONCLUDED. SELECT WORK TARGET AND RESTART LOCK!', 'ok');
      setPomoState('idle');
      setPomoElapsedSeconds(0);
    }
  };

  const stopPomo = () => {
    if (pomoState === 'idle') return;

    const secondsTracked = pomoElapsedSeconds;

    // Record incomplete or failed Pomodoro sessions
    if (pomoState === 'work' && secondsTracked > 5 && pomoTaskName) {
      const minutesSpent = Math.round((secondsTracked / 60) * 100) / 100;

      const newSession: PomoSession = {
        id: 'p_failed_' + Date.now(),
        task: pomoTaskName,
        cat: pomoTaskCat || 'custom',
        duration: minutesSpent,
        type: 'work',
        date: todayStr(),
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        status: 'interrupted'
      };

      setAppState(prev => {
        const cat = pomoTaskCat || 'custom';
        const item = pomoTaskName;
        
        let dailyNode = { ...prev.daily };
        if (!dailyNode[activeDate]) dailyNode[activeDate] = {};
        if (!dailyNode[activeDate][cat]) dailyNode[activeDate][cat] = {};

        const currentEntry = dailyNode[activeDate][cat]![item] || {
          status: 'pending', reps: 0, hours: 0, satisfaction: 0, notes: ''
        };

        const hrsEquivalent = Math.round((minutesSpent / 60) * 100) / 100;
        const updatedEntry = {
          ...currentEntry,
          hours: Math.round(((currentEntry.hours || 0) + hrsEquivalent) * 100) / 100
        };

        dailyNode[activeDate][cat]![item] = updatedEntry;

        const next = {
          ...prev,
          pomoSessions: [...(prev.pomoSessions || []), newSession],
          daily: dailyNode
        };
        saveData(next);
        return next;
      });

      showToast(`interruption recorded! logged ${minutesSpent}m focus effort successfully.`, 'ok');
    } else {
      showToast('FOCUS LOOP DISCONNECTED EARLY — SESSION UN-LOGGED', 'nfo');
    }

    setPomoState('idle');
    setPomoPercent(0);
    setPomoElapsedSeconds(0);
  };

  const handleStartPomo = () => {
    if (pomoState !== 'idle') return;
    if (!pomoTaskName) return;

    setPomoState('work');
    setPomoElapsedSeconds(0);
    showToast(`FOCUS LOCKED ON: ${pomoTaskName.toUpperCase()}`, 'ok');
  };

  const handleSetPomoTask = (cat: TrackerCategory, item: string) => {
    setPomoTaskCat(cat);
    setPomoTaskName(item);
    showToast(`POMO TARGET REGISTERED: ${item.toUpperCase()}`, 'ok');
  };

  const handleSetPomoPreset = (preset: string) => {
    setPomoPreset(preset);
    if (pomoState !== 'idle') return;

    if (preset === 'classic') {
      setPomoWorkMin(25);
      setPomoBrkMin(5);
    } else if (preset === 'deep') {
      setPomoWorkMin(50);
      setPomoBrkMin(10);
    } else if (preset === 'ultra') {
      setPomoWorkMin(90);
      setPomoBrkMin(20);
    }
  };

  const handleSetPomoCustom = (work: number, brk: number) => {
    setPomoWorkMin(work);
    setPomoBrkMin(brk);
  };

  // 6. Database Getters
  const getDayD = (ds: string, cat: TrackerCategory, item: string): DayEntry => {
    if (!appState.daily[ds]) appState.daily[ds] = {};
    if (!appState.daily[ds][cat]) appState.daily[ds][cat] = {};
    if (!appState.daily[ds][cat]![item]) {
      appState.daily[ds][cat]![item] = {
        status: 'pending', reps: 0, hours: 0, satisfaction: 0, notes: ''
      };
    }
    return appState.daily[ds][cat]![item];
  };

  const updateDayField = (ds: string, cat: TrackerCategory, item: string, field: keyof DayEntry, val: any) => {
    setAppState(prev => {
      let dailyNode = { ...prev.daily };
      if (!dailyNode[ds]) dailyNode[ds] = {};
      if (!dailyNode[ds][cat]) dailyNode[ds][cat] = {};
      
      const current = dailyNode[ds][cat]![item] || {
        status: 'pending', reps: 0, hours: 0, satisfaction: 0, notes: ''
      };

      const updated = { ...current, [field]: val };
      dailyNode[ds][cat]![item] = updated;

      const next = { ...prev, daily: dailyNode };
      saveData(next);
      return next;
    });
  };

  const getRepsT = (cat: TrackerCategory, item: string): number => {
    return (appState.repsTarget[cat] && appState.repsTarget[cat]![item] !== undefined)
      ? appState.repsTarget[cat]![item]
      : 1;
  };

  const getHrsT = (cat: TrackerCategory, item: string): number => {
    return (appState.hoursTarget[cat] && appState.hoursTarget[cat]![item] !== undefined)
      ? appState.hoursTarget[cat]![item]
      : 1;
  };

  // Streak calculators
  const calculateStreak = (cat: TrackerCategory, item: string): number => {
    let s = 0;
    const d = new Date(todayStr() + 'T00:00:00');
    
    for (let i = 0; i < 365; i++) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const dy = String(d.getDate()).padStart(2, '0');
      const ds = `${year}-${month}-${dy}`;

      const entry = appState.daily[ds]?.[cat]?.[item];
      const st = entry ? entry.status : 'pending';

      if (st === 'done') {
        s++;
      } else if (st === 'skipped') {
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

  const isScheduledToday = (cat: TrackerCategory, item: string, ds: string): boolean => {
    const rec = getRecurring(cat, item);
    if (!rec) return true; // Daily constant
    
    const d = new Date(ds + 'T00:00:00');
    const dow = (d.getDay() + 6) % 7; // Convert Sun=0 to Sun=6, Mon=0

    if (rec.freq === 'daily') return true;
    if (rec.freq === 'weekdays') return dow < 5;
    if (rec.freq === 'weekends') return dow >= 5;
    if (rec.freq === 'custom') return rec.days.includes(dow);
    
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

    CATS.forEach(cat => {
      // Build a set of all tracker items for this category (registered + adhoc from daily data)
      const registeredItems = appState.items[cat.id] || [];
      const adhocItems = Object.keys(appState.daily[ds]?.[cat.id] || {});
      const allItems = Array.from(new Set([...registeredItems, ...adhocItems]));

      allItems.forEach(item => {
        const isSch = isScheduledToday(cat.id, item, ds);
        const d = getDayD(ds, cat.id, item);
        let statusValue = d ? d.status : 'pending';

        // Auto skip un-scheduled pending items
        if (!isSch && statusValue === 'pending') {
          statusValue = 'skipped';
        }

        // We count it if it's scheduled OR if it's an adhoc item that was marked done or has hours
        const isAdhocCompleted = !registeredItems.includes(item) && (statusValue === 'done' || (d && d.hours > 0));
        
        if (isSch || isAdhocCompleted) {
          if (isSch) total++;
          if (statusValue === 'done') done++;
          else if (statusValue === 'missed') missed++;
          else if (statusValue === 'skipped') skipped++;
          else if (isSch) pending++;

          const hOffset = d ? (d.hours || 0) : 0;
          const rOffset = d ? (d.reps || (statusValue === 'done' ? getRepsT(cat.id, item) : 0)) : 0;
          hrs += hOffset;
          reps += rOffset;

          if (d && d.satisfaction > 0) {
            satSum += d.satisfaction;
            satCount++;
          }
        } else {
          if (statusValue === 'skipped') skipped++;
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
      pct: total ? Math.round((done / total) * 100) : 0
    };
  };

  const cycleStatus = (ds: string, cat: TrackerCategory, item: string) => {
    setAppState(prev => {
      let dailyNode = { ...prev.daily };
      if (!dailyNode[ds]) dailyNode[ds] = {};
      if (!dailyNode[ds][cat]) dailyNode[ds][cat] = {};

      const current = dailyNode[ds][cat]![item] || {
        status: 'pending', reps: 0, hours: 0, satisfaction: 0, notes: ''
      };

      const cycle: TrackerStatus[] = ['pending', 'done', 'missed', 'skipped'];
      const curIdx = cycle.indexOf(current.status);
      const nextStatus = cycle[(curIdx + 1) % cycle.length];

      const updated = {
        ...current,
        status: nextStatus,
        reps: nextStatus === 'done' && !current.reps ? getRepsT(cat, item) : current.reps
      };

      dailyNode[ds][cat]![item] = updated;

      const next = { ...prev, daily: dailyNode };
      saveData(next);
      return next;
    });
  };

  // 8. Database mutators
  const updateProfile = (name: string, tagline: string, email: string) => {
    setAppState(prev => {
      const next = {
        ...prev,
        profile: { name, tagline, email }
      };
      saveData(next);
      return next;
    });
    showToast('PROFILE RECONFIGURED ✓', 'ok');
  };

  const addItemInput = (cat: TrackerCategory, name: string) => {
    setAppState(prev => {
      const list = prev.items[cat] || [];
      if (list.includes(name)) return prev;

      const next = {
        ...prev,
        items: {
          ...prev.items,
          [cat]: [...list, name]
        }
      };
      saveData(next);
      return next;
    });
    showToast(`ADDED TRACKER TARGET: ${name.toUpperCase()}`, 'ok');
  };

  const removeItemInput = (cat: TrackerCategory, name: string) => {
    setAppState(prev => {
      const list = prev.items[cat] || [];
      const next = {
        ...prev,
        items: {
          ...prev.items,
          [cat]: list.filter(it => it !== name)
        }
      };
      saveData(next);
      return next;
    });
    showToast('REMOVED CHECKLIST ELEMENT', 'nfo');
  };

  const updateTargetFields = (cat: TrackerCategory, item: string, field: 'reps' | 'hours', val: number) => {
    setAppState(prev => {
      const targetObj = field === 'reps' ? { ...prev.repsTarget } : { ...prev.hoursTarget };
      if (!targetObj[cat]) targetObj[cat] = {};
      targetObj[cat]![item] = Math.max(0, val || 0);

      const next = {
        ...prev,
        [field === 'reps' ? 'repsTarget' : 'hoursTarget']: targetObj
      };
      saveData(next);
      return next;
    });
  };

  // 9. Reminders Alarm Database handlers
  const handleAddReminder = (rem: Omit<Reminder, 'id' | 'status'>) => {
    const newRem: Reminder = {
      ...rem,
      id: 'rem_' + Date.now(),
      status: 'pending'
    };
    setAppState(prev => {
      const next = {
        ...prev,
        reminders: [...(prev.reminders || []), newRem]
      };
      saveData(next);
      return next;
    });
    showToast('PLANNER EVENT CREATED ✓', 'ok');
  };

  const handleEditReminder = (id: string, updated: Partial<Reminder>) => {
    setAppState(prev => {
      const next = {
        ...prev,
        reminders: (prev.reminders || []).map(r => r.id === id ? { ...r, ...updated } : r)
      };
      saveData(next);
      return next;
    });
    showToast('DEADLINE MODIFIED ✓', 'ok');
  };

  const handleDeleteReminder = (id: string) => {
    setAppState(prev => {
      const next = {
        ...prev,
        reminders: (prev.reminders || []).filter(r => r.id !== id)
      };
      saveData(next);
      return next;
    });
    showToast('PLANNER EVENT REMOVED', 'nfo');
  };

  const handleToggleReminder = (id: string) => {
    setAppState(prev => {
      const next = {
        ...prev,
        reminders: (prev.reminders || []).map(r => r.id === id ? { ...r, status: (r.status === 'done' ? 'pending' : 'done') as any } : r)
      };
      saveData(next);
      return next;
    });
    showToast('EVENT STATUS RE-SAVED', 'ok');
  };

  const handleMuteReminder = (id: string) => {
    setAppState(prev => {
      const next = {
        ...prev,
        reminders: (prev.reminders || []).map(r => r.id === id ? { ...r, enableAlert: false } : r)
      };
      saveData(next);
      return next;
    });
    showToast('ALARM SILENCED', 'ok');
  };

  // 10. Journals flexible actions
  const handleSaveJournal = (dt: string, updated: Partial<JournalEntry>) => {
    setAppState(prev => {
      let journalsNode = { ...prev.journals };
      const current = journalsNode[dt] || {
        date: dt, mood: 0, energy: 0, tags: [], sections: {}, savedAt: ''
      };

      const nextEntry = {
        ...current,
        ...updated,
        savedAt: new Date().toISOString()
      };
      journalsNode[dt] = nextEntry;

      const next = { ...prev, journals: journalsNode };
      saveData(next);
      return next;
    });
  };

  const handleUpdateJournalPrompts = (prompts: JournalPrompt[]) => {
    setAppState(prev => {
      const next = { ...prev, journalPrompts: prompts };
      saveData(next);
      return next;
    });
    showToast('DIARY HEADINGS ADAPTED', 'ok');
  };

  const handleUpdateJournalTags = (tags: string[]) => {
    setAppState(prev => {
      const next = { ...prev, journalTags: tags };
      saveData(next);
      return next;
    });
    showToast('TAG COLLECTION RE-INDEXED', 'ok');
  };

  // 11. Custom Recurrence overlay modal callbacks
  const openRecurringModalObj = (cat: TrackerCategory, item: string) => {
    setRecCat(cat);
    setRecItem(item);
    
    const exist = getRecurring(cat, item) || { freq: 'daily', days: [] };
    setRecFreq(exist.freq || 'daily');
    setRecDays((exist.days || []).slice());
    
    setRecModalOpen(true);
  };

  const toggleModalRecDay = (dayIndex: number) => {
    setRecDays(prev => {
      if (prev.includes(dayIndex)) {
        return prev.filter(d => d !== dayIndex);
      } else {
        return [...prev, dayIndex];
      }
    });
  };

  const handleSaveRecurringParams = () => {
    if (!recCat || !recItem) return;
    const taskKey = `${recCat}::${recItem}`;

    setAppState(prev => {
      let node = { ...prev.recurringTasks };
      node[taskKey] = { freq: recFreq, days: recDays };

      const next = { ...prev, recurringTasks: node };
      saveData(next);
      return next;
    });

    setRecModalOpen(false);
    showToast(`RECURRING SCHEDULE SAVED FOR: ${recItem.toUpperCase()}`, 'ok');
  };

  const handleRemoveRecurringParams = () => {
    if (!recCat || !recItem) return;
    const taskKey = `${recCat}::${recItem}`;

    setAppState(prev => {
      let node = { ...prev.recurringTasks };
      delete node[taskKey];

      const next = { ...prev, recurringTasks: node };
      saveData(next);
      return next;
    });

    setRecModalOpen(false);
    showToast('REMOVED SCHEDULE CONFIG — DAILY SINCE CONSTANT', 'nfo');
  };

  // 12. Backup JSON/CSV handlers
  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(appState, null, 2)], { type: 'application/json' });
    const u = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = u;
    link.download = `lifetracker_db_${todayStr()}.json`;
    link.click();
    URL.revokeObjectURL(u);
    showToast('JSON BACKUP GENERATED!', 'ok');
  };

  const handleExportCSV = () => {
    let csv = 'Date,Category,Checklist Element,Checkins Status,Reps Completed,Focused Hours,Satisfaction score,Notes Reflection\n';
    Object.keys(appState.daily).forEach((ds) => {
      CATS.forEach(c => {
        (appState.items[c.id] || []).forEach(item => {
          const entry = getDayD(ds, c.id, item);
          csv += `${ds},${c.label},"${item.replace(/"/g, '""')}",${entry.status},${entry.reps},${entry.hours},${entry.satisfaction},"${(entry.notes || '').replace(/"/g, '""')}"\n`;
        });
      });
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const u = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = u;
    link.download = `lifetracker_export_${todayStr()}.csv`;
    link.click();
    URL.revokeObjectURL(u);
    showToast('CSV EXPORT COMPLETED!', 'ok');
  };

  const handleImportJSONText = (rawStr: string) => {
    try {
      const parsed = JSON.parse(rawStr);
      if (confirm('Deploy backups merge? Existing profiles, checklists and checklist targets will merge cohesively.')) {
        setAppState(prev => {
          // Merge checklists arrays
          const nextItems = { ...prev.items };
          if (parsed.items) {
            Object.keys(parsed.items).forEach((catK: any) => {
              const prevL = prev.items[catK as TrackerCategory] || [];
              const rawL = parsed.items[catK] || [];
              nextItems[catK as TrackerCategory] = Array.from(new Set([...prevL, ...rawL]));
            });
          }

          // Merge daily records
          const nextDaily = { ...prev.daily };
          if (parsed.daily) {
            Object.keys(parsed.daily).forEach(ds => {
              if (!nextDaily[ds]) nextDaily[ds] = {};
              Object.keys(parsed.daily[ds]).forEach(catKey => {
                nextDaily[ds][catKey as TrackerCategory] = {
                  ...(nextDaily[ds][catKey as TrackerCategory] || {}),
                  ...(parsed.daily[ds][catKey] || {})
                };
              });
            });
          }

          // Reminders list
          let nextRem = [...prev.reminders];
          if (parsed.reminders) {
            const rawRem = Array.isArray(parsed.reminders) ? parsed.reminders : Object.values(parsed.reminders);
            rawRem.forEach((r: any) => {
              if (!nextRem.some(x => x.id === r.id)) nextRem.push(r);
            });
          }

          const nextState: AppState = {
            ...prev,
            profile: parsed.profile ? { ...prev.profile, ...parsed.profile } : prev.profile,
            items: nextItems,
            daily: nextDaily,
            repsTarget: parsed.repsTarget ? { ...prev.repsTarget, ...parsed.repsTarget } : prev.repsTarget,
            hoursTarget: parsed.hoursTarget ? { ...prev.hoursTarget, ...parsed.hoursTarget } : prev.hoursTarget,
            reminders: nextRem,
            goals: parsed.goals ? { ...prev.goals, ...parsed.goals } : prev.goals,
            pomoSessions: parsed.pomoSessions ? [...prev.pomoSessions, ...(parsed.pomoSessions || [])] : prev.pomoSessions,
            recurringTasks: parsed.recurringTasks ? { ...prev.recurringTasks, ...parsed.recurringTasks } : prev.recurringTasks,
            journals: parsed.journals ? { ...prev.journals, ...parsed.journals } : prev.journals,
            journalPrompts: parsed.journalPrompts || prev.journalPrompts,
            journalTags: parsed.journalTags || prev.journalTags,
          };

          saveData(nextState);
          return nextState;
        });
        showToast('DATA BACKUPS APPLIED ✓', 'ok');
      }
    } catch (e) {
      alert('Corrupted JSON files. Overwrite failed.');
    }
  };

  const handleResetAll = () => {
    if (confirm('Perform factory database wipe out? Old logs, schedules, focus lists and targets parameters will be lost.')) {
      if (confirm('Wiping out cannot be undone. Are you absolutely certain?')) {
        localStorage.removeItem('lt_v5');
        const empty = defData();
        setAppState(empty);
        saveData(empty);
        showToast('FACILITY WIPED TO FACTORY BASE', 'nfo');
      }
    }
  };

  const handleLoadDemo = () => {
    window.open(window.location.pathname + '?demo=true', '_blank');
  };

  const handleToggleMuteGhostAlerts = () => {
    setAppState(prev => {
      const next = { ...prev, muteGhostAlerts: !prev.muteGhostAlerts };
      saveData(next);
      return next;
    });
    showToast('SYSTEM ALERTS OPTIONS UPDATED', 'ok');
  };

  const handleSetTheme = (themeHex: string) => {
    setAppState(prev => {
      const next = { ...prev, neonTheme: themeHex };
      saveData(next);
      return next;
    });
    showToast(`THEME APPLIED: ${themeHex}`, 'ok');
  };

  const handleSetBgTheme = (bgId: string) => {
    setAppState(prev => {
      const next = { ...prev, bgTheme: bgId };
      saveData(next);
      return next;
    });
    showToast(`BACKGROUND APPLIED: ${bgId.toUpperCase()}`, 'ok');
  };

  // Rendering screen routing selector
  const renderFocalScreen = () => {
    switch (activeView) {
      case 'dashboard':
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
          />
        );
      case 'daily':
        return (
          <DailyTrackerView 
            state={appState}
            date={activeDate}
            onSetDate={setActiveDate}
            onChangeDate={(offset) => {
              const d = new Date(activeDate + 'T00:00:00');
              d.setDate(d.getDate() + offset);
              const yr = d.getFullYear();
              const mt = String(d.getMonth() + 1).padStart(2, '0');
              const dy = String(d.getDate()).padStart(2, '0');
              setActiveDate(`${yr}-${mt}-${dy}`);
            }}
            onGoToday={() => setActiveDate(todayStr())}
            getDayD={getDayD}
            onUpdateDayField={updateDayField}
            onCycleStatus={cycleStatus}
            onQuickAdd={addItemInput}
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
          />
        );
      case 'goals':
        return (
          <GoalsView 
            state={appState}
            date={activeDate}
            onSaveGoal={(period, scope, key, field, val) => {
              setAppState(prev => {
                let goalsNode = { ...prev.goals };
                if (!goalsNode[period]) goalsNode[period] = { cat: {}, item: {} };
                if (!goalsNode[period][scope]) goalsNode[period][scope] = {};
                if (!goalsNode[period][scope][key]) goalsNode[period][scope][key] = { reps: 0, hours: 0, auto: false };
                
                goalsNode[period][scope][key][field] = Math.max(0, val || 0);
                goalsNode[period][scope][key].auto = false;

                const next = { ...prev, goals: goalsNode };
                saveData(next);
                return next;
              });
            }}
            onResetGoalAuto={(period, scope, key) => {
              setAppState(prev => {
                let goalsNode = { ...prev.goals };
                if (goalsNode[period]?.[scope]?.[key]) {
                  goalsNode[period][scope][key] = { reps: 0, hours: 0, auto: true };
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
      case 'analytics':
        return (
          <AnalyticsView 
            state={appState}
            date={activeDate}
            dayStats={dayStats}
            getDayD={getDayD}
          />
        );
      case 'calendar':
        return (
          <CalendarView 
            state={appState}
            onSetDate={setActiveDate}
            onNavigate={setActiveView}
            dayStats={dayStats}
          />
        );
      case 'expeditions':
        return <ExpeditionsView state={appState} saveData={saveData} setAppState={setAppState} />;
      case 'finances':
        return <FinancesView state={appState} saveData={saveData} setAppState={setAppState} />;
      case 'sketchpad':
        return <SketchpadView state={appState} saveData={saveData} setAppState={setAppState} />;
      case 'reminders':
        return (
          <RemindersView 
            state={appState}
            onAddReminder={handleAddReminder}
            onEditReminder={handleEditReminder}
            onDeleteReminder={handleDeleteReminder}
            onToggleReminder={handleToggleReminder}
            setView={setActiveView}
          />
        );
      case 'pomo':
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
            onNavigate={setActiveView}
          />
        );
      case 'journal':
        return (
          <JournalView 
            state={appState}
            date={activeDate}
            onSetDate={setActiveDate}
            onChangeDate={(offset) => {
              const d = new Date(activeDate + 'T00:00:00');
              d.setDate(d.getDate() + offset);
              const yr = d.getFullYear();
              const mt = String(d.getMonth() + 1).padStart(2, '0');
              const dy = String(d.getDate()).padStart(2, '0');
              setActiveDate(`${yr}-${mt}-${dy}`);
            }}
            dayStats={dayStats}
            onSaveJournal={handleSaveJournal}
            onUpdateJournalPrompts={handleUpdateJournalPrompts}
            onUpdateJournalTags={handleUpdateJournalTags}
            onAddReminder={handleAddReminder}
            onToggleReminder={handleToggleReminder}
            onNavigate={setActiveView}
          />
        );
      case 'synopsis':
        return (
          <SynopsisView 
            state={appState}
            date={activeDate}
            dayStats={dayStats}
            getDayD={getDayD}
          />
        );
      case 'search':
        return (
          <SearchView 
            state={appState}
            onSetDate={setActiveDate}
            onSetTab={setActiveView as any}
            onNavigate={setActiveView}
            getDayD={getDayD}
          />
        );
      case 'settings':
        return (
          <SettingsView 
            state={appState}
            onUpdateProfile={updateProfile}
            onAddItem={addItemInput}
            onRemoveItem={removeItemInput}
            onUpdateTargetFields={updateTargetFields}
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
      case 'help':
        return <HelpView state={appState} onOpenAIAnalyst={handleOpenAIAnalyst} onLoadDemo={handleLoadDemo} />;
      case 'alerts':
        return <AlertsView state={appState} onToggleReminder={handleToggleReminder} onMuteReminder={handleMuteReminder} onToggleMuteSystemAlerts={handleToggleMuteGhostAlerts} onNavigate={setActiveView} />;
      case 'focus_audio':
        return <FocusAudioView activeTrack={audioTrack} volume={audioVolume} onSetTrack={setAudioTrack} onSetVolume={setAudioVolume} />;
      case 'ai_analyst':
        return (
          <AiAnalystView 
             state={appState} 
             onOpenAIAnalyst={handleOpenAIAnalyst} 
             onGeneratePrompt={(module) => {
                let focusData: any = {};
                if (module === 'all') focusData = appState;
                else if (module === 'daily') focusData = { daily: appState.daily, goals: appState.goals, pomoSessions: appState.pomoSessions };
                else if (module === 'journals') focusData = { journals: appState.journals, daily: appState.daily };
                else if (module === 'finances') focusData = appState.finances;
                else if (module === 'goals') focusData = { goals: appState.goals, daily: appState.daily, pomoSessions: appState.pomoSessions };
                else if (module === 'expeditions') focusData = appState.expeditions;
                else if (module === 'focus_audio') focusData = { pomoSessions: appState.pomoSessions, daily: appState.daily };
                else focusData = appState;

                let summaryText = "";
                try {
                  summaryText = JSON.stringify(focusData, null, 2); 
                  if (summaryText.length > 50000) {
                    summaryText = summaryText.substring(0, 50000) + '\n... [Data Truncated due to size]';
                  }
                } catch (e) {
                  summaryText = "[Data Overview]";
                }

                const finalPrompt = `Hello AI, act as my elite personal analyst and life-optimization executive assistant for my "Omnilife Tracker".

### PURPOSE OF THIS PROMPT:
I am providing you with my personal data exported from Omnilife Tracker. I want you to perform deep, advanced, personalized analysis to help me optimize my life, habits, productivity, and finances. 

### OMNILIFE TRACKER - SYSTEM ARCHITECTURE & DATA DICTIONARY:
Omnilife Tracker is a 100% local, offline-first super-app. All my data is stored as a single JSON tree. You need to understand how the modules interlock to provide holistic insights:

1. **Dashboard & Streaks**: The command node. Tracks daily completion rates and active habit streaks.
2. **Daily Tracker (\`daily\`)**: [Date] -> [Category: 'health' | 'work' | 'learning' | 'personal'] -> [Task Name]. Contains \`completed\` (boolean), \`qty\` (number, e.g. hours or reps), \`skipped\` (boolean), \`notes\` (string).
   -> *Analysis Note*: Look for days where completing one habit (e.g. sleep) correlates with completing another (e.g. work). Find gaps or "skipped" chains.
3. **Daily Journal (\`journals\`)**: Nested by [Date]. Contains \`mood\` (1-5 scale), \`energy\` (1-5 scale), \`location\` (GPS string), \`tags\` (array), \`prompts\` (text responses), \`notes\` (freeform text).
   -> *Analysis Note*: This is critical. Correlate \`mood\` and \`energy\` with the \`daily\` habit completion rates. Does low energy follow high spending? Does high mood follow exercise?
4. **Goals & Targets (\`goals\`)**: Structured by period ('weekly', 'monthly', 'yearly', 'lifetime'). Contains target \`reps\` and target \`hours\` for specific tasks. The app aggregates \`daily\` logs and \`pomoSessions\` to calculate progress.
5. **Finances (\`finances\`)**: Contains \`accounts\` (name, balance, type), \`transactions\` (amount, category, type: 'income' | 'expense', and array of \`tasks\` for financial goals). We run analysis against \`financeBudgets\`.
   -> *Analysis Note*: Analyze my burn rate and financial goals. Warn me if my expenses exceed my income trajectory or budget limits. Check if my manual financial tasks/goals are being met.
6. **Expeditions (\`expeditions\`)**: My trip planner with itinerary dates, packing lists, custom goals (\`customTasks\`), and locations. Can be linked to Alerts, Reminders, and Calendar seamlessly. Note that expeditions directly trigger alert timelines.
7. **Pomodoro (\`pomoSessions\`)**: Focus timer logs. Array of { taskName, category, durationMinutes, timestamp }. Heavily integrated with Focus Audio.
   -> *Analysis Note*: Cross-reference these with my \`goals\` and \`daily\` tasks. Am I actually spending time effectively? Does Focus Audio ("brown noise," "rain," etc.) correlate with longer sessions?
8. **Reminders (\`reminders\`)**: One-off and recurring tasks with \`priority\` ('high'|'medium'|'low'), \`dueDate\`, \`time\`, and \`enableAlert\`. Reminders are directly spawned from Expeditions and Finances for billing and trip alerts.
9. **Focus Audio**: Embedded ambient audio states. Notice how audio states integrate directly with Pomodoro sessions to lower stress and induce flow.
10. **Sketchpad**: Digital drawing tools (not purely data).
11. **Settings / Theme**: Custom Neon Color profiles ("Volcanic Orange", "Cyber Cyan", etc.) are stored in \`neonTheme\`.
12. **Synopsis**: Digested logs are sent directly to Email, Telegram, and SMS through the frontend gateways.
   
### MY CURRENT CONTEXT:
I am submitting data for the module: [${module.toUpperCase()}]. Focus your analysis primarily on this dataset, but weave in the greater context conceptually.

### EXPORTED JSON DATA (FOR ANALYSIS):
\`\`\`json
${summaryText}
\`\`\`

### INSTRUCTIONS FOR YOUR ANALYSIS:
1. **Data Ingestion**: Thoroughly parse the provided JSON data. It represents my actual life metrics.
2. **Correlation & Cross-Analysis**: Do not just summarize. Connect the dots.
   - If \`journals\` and \`daily\` data are present: How do my habits directly impact my \`mood\` and \`energy\`?
   - If \`finances\` and \`journals\` are present: Do I spend more money on low-energy days?
   - What are my strongest consistency loops? Where are the breaking points in my streaks?
3. **Advanced Personalization**: Base all advice *strictly* on the numbers and trends in the data. If I am failing a goal, point it out ruthlessly.
4. **Actionable Roadmap**: Provide 3-5 specific, stoic, and immediately actionable steps I can take TODAY to fix weak points and accelerate my momentum.
5. **Tone**: Be professional, analytical, objective, and highly strategic. Pretend you are advising a high-performance executive.`;

                handleOpenAIAnalyst(finalPrompt);
             }}
          />
        );
      default:
        return <div className="p-10">Select an option from the sidebar.</div>;
    }
  };

  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  useEffect(() => {
    // Close mobile nav when running active view changes
    setIsMobileNavOpen(false);
  }, [activeView]);

  return (
    <div className="flex h-screen bg-[#0d0d1a] text-slate-100 overflow-hidden font-sans">
      <style>{getThemeCSS(appState.neonTheme, appState.bgTheme)}</style>
      <GhostAlert muted={appState.muteGhostAlerts} />
      <ReminderAlert state={appState} hasSystemAlerts={ghostOffline && !appState.muteGhostAlerts} onNavigate={setActiveView} />
      
      {/* Mobile nav overlay */}
      {isMobileNavOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-[60] md:hidden"
          onClick={() => setIsMobileNavOpen(false)}
        />
      )}

      {/* 1. Left Sidebar menu */}
      <div className={`fixed md:relative z-[70] h-full transform transition-transform duration-300 ${isMobileNavOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <Sidebar 
          state={appState}
          activeView={activeView}
          onNavigate={setActiveView}
          syncCfg={syncCfg}
          isSyncing={isSyncing}
          onExportJSON={handleExportJSON}
          onExportCSV={handleExportCSV}
          hasSystemAlerts={syncCfg.lastSync === 'error' || ghostOffline}
          onLoadDemo={handleLoadDemo}
        />
      </div>

      {/* 2. Main Desk space */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Mobile Header Box */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-[#111120] bg-[#0d0d1a] relative z-40 shrink-0">
          <h1 className="text-sm font-extrabold tracking-wider text-white">
            OMNILIFE <span className="text-[#ff6b1a]">TRACKER</span>
          </h1>
          <button 
            onClick={() => setIsMobileNavOpen(true)}
            className="text-slate-300 hover:text-white"
          >
            <div className="space-y-1">
              <div className="w-5 h-0.5 bg-current"></div>
              <div className="w-5 h-0.5 bg-current"></div>
              <div className="w-5 h-0.5 bg-current"></div>
            </div>
          </button>
        </div>

        <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6 scrollbar-none w-full max-w-full">
          <div className="max-w-[1000px] mx-auto min-h-full flex flex-col pb-8">
            {/* Active viewport content */}
            {renderFocalScreen()}
          </div>
        </main>
      </div>

      {/* 3. Global Toasts chimes notifications */}
      {toast && (
        <div className={`fixed bottom-4 right-4 z-50 px-4 py-2 text-xs font-black rounded-lg border flex items-center gap-2 tracking-widest uppercase transition-all duration-300 font-mono shadow-[0_4px_16px_rgba(0,0,0,0.55)] ${
          toast.type === 'ok' 
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
            : 'bg-[#ff6b1a]/10 text-[#ff6b1a] border-[#ff6b1a]/20'
        }`}>
          <span>// {toast.msg}</span>
        </div>
      )}

      {/* 4. Recurring Scheduler Config Modal Overlay */}
      {recModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-[#111120] border border-[#2a2a50] rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl shadow-black/80">
            <h3 className="text-sm font-extrabold tracking-widest text-[#ff6b1a] uppercase font-display">↻ REUSE / RECURRING PLANNER</h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono">// active element: {recItem}</p>
            
            <div className="space-y-4 font-semibold text-slate-300">
              {/* Frequency selection buttons */}
              <div>
                <span className="text-[9px] text-slate-500 tracking-widest block font-black uppercase mb-1.5 font-mono">RECURRING INTERVALS</span>
                <div className="grid grid-cols-2 gap-2 text-xs select-none">
                  {(['daily', 'weekdays', 'weekends', 'custom'] as const).map(freq => (
                    <button
                      key={freq}
                      onClick={() => setRecFreq(freq)}
                      className={`py-1.5 rounded-lg border uppercase text-[10px] font-bold tracking-wider transition-all duration-200 ${
                        recFreq === freq 
                          ? 'bg-[#ff6b1a]/10 border-indigo-600/30 text-[#ff6b1a]' 
                          : 'border-[#2a2a50] text-slate-400 hover:border-slate-700 hover:bg-[#111120]/30'
                      }`}
                    >
                      {freq}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Weekdays Picker */}
              {recFreq === 'custom' && (
                <div className="space-y-1.5 select-none animate-fadeIn">
                  <span className="text-[9px] text-slate-500 tracking-widest block font-black uppercase font-mono">CHOOSE RECURRENCE EVENTS</span>
                  <div className="flex flex-wrap gap-1">
                    {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((wd, wdIdx) => {
                      const isPicked = recDays.includes(wdIdx);
                      return (
                        <button
                          key={wdIdx}
                          onClick={() => toggleModalRecDay(wdIdx)}
                          className={`w-7 h-7 font-black text-[9px] rounded-lg border transition-all duration-200 ${
                            isPicked 
                              ? 'bg-[#ff6b1a] text-white border-indigo-600 shadow-md shadow-indigo-600/10' 
                              : 'bg-transparent border-[#2a2a50] text-slate-500 hover:border-slate-700 hover:bg-[#111120]/20'
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
                ) : <div />}

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
            <h3 className="text-xl font-extrabold tracking-widest text-[#00d4ff] uppercase font-display border-b border-[#2a2a50] pb-2">Welcome to Omnilife</h3>
            <p className="text-[10px] text-slate-400 font-bold tracking-wider font-mono">// ARCHITECTURE & PRIVACY</p>
            
            <div className="space-y-4 font-semibold text-slate-300 text-sm leading-relaxed max-h-[60vh] overflow-y-auto scrollbar-none">
              <p>
                <strong>100% Local & Private:</strong> This application has no backend. All your logs, tracking, and sketches are stored purely inside your browser memory locally or directly backed up to a .json file on your local hard drive. You are in complete control of your data.
              </p>
              <p>
                <strong>Export & Backup:</strong> Because there is no cloud database, you can use the "Export JSON" option at the bottom of the sidebar at any time. Keep this file safe. If you clear your browser cache, you can "Import JSON" to instantly restore everything.
              </p>
              <p>
                <strong>Ghost Sync:</strong> (Recommended) Found in Settings, this feature utilizes the File System Access API. It links exactly <i>one</i> local .json file and automatically overwrites it in the background as you click items, offering zero-touch local-first syncing without standard cloud privacy vulnerabilities.
              </p>
              <p>
                <strong>AI Assist:</strong> Across the app (and specifically in the Help section), look for the AI Assist buttons (GPT, Claude, Gemini). When you click them, the system copies a perfectly formatted data snapshot and software context into your clipboard. Paste it into your favorite AI to get tailored advice, schedule generation, or bug fixes.
              </p>
              <p>
                Enjoy planning your expeditions, tracking your local finances, and auditing your goals in absolute security!
              </p>
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

      {/* Floating global AI Assist Action */}
      <div className="fixed bottom-6 right-6 z-50">
        <button onClick={handleOpenAIAnalyst} className="flex items-center justify-center gap-2 px-4 py-3 bg-[#111120] border border-[#2a2a50] rounded-full shadow-[0_4px_24px_rgba(0,0,0,0.8)] hover:border-[#00ff88] text-[#00ff88] transition-all duration-300 backdrop-blur-md">
          <Bot size={18} />
          <span className="text-[10px] font-black uppercase tracking-widest leading-none">AI Analyst</span>
        </button>
      </div>

      {/* AI Analyst Modal */}
      {aiModal.isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-[80] animate-fade-in text-center">
          <div className="bg-[#111120] relative border border-[#00ff88]/30 rounded-2xl max-w-sm w-full p-6 space-y-6 shadow-2xl shadow-[#00ff88]/10 flex flex-col items-center">
            
            <button
               onClick={() => setAiModal({ isOpen: false, promptText: '' })}
               className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-[#2a2a50]/50 hover:bg-[#2a2a50] text-slate-400 hover:text-white transition"
            >
               <X size={16} />
            </button>

            <div className="mx-auto w-16 h-16 bg-[#00ff88]/10 text-[#00ff88] rounded-full flex items-center justify-center animate-pulse">
              <Bot size={32} />
            </div>

            <div>
              <h3 className="text-xl font-extrabold tracking-widest text-[#00ff88] uppercase font-display">AI Context Hub</h3>
              <div className="mt-4 p-3 bg-[#0a0a14] border border-[#2a2a50] rounded-xl text-left space-y-2">
                 <p className="text-[10px] text-[#00ff88] font-black tracking-widest uppercase mb-1 flex items-center gap-2">
                   <CheckCircle2 size={12} /> Instructions Compiled
                 </p>
                 <p className="text-[10px] text-slate-300 leading-relaxed font-mono">
                   Your private data and detailed AI instructions are ready. 
                 </p>
                 <div className="bg-[#00ff88]/10 text-[#00ff88] p-2 rounded text-[10px] font-bold border border-[#00ff88]/20">
                   <strong>PURPOSE:</strong> This data package helps you analyze your life metrics with your preferred AI, acting as your personalized executive assistant.
                 </div>
                 <ul className="text-[10px] text-[#00d4ff] font-bold list-disc pl-3 mt-1 space-y-0.5">
                    <li>Click any option below to copy the data.</li>
                    <li>Go to the AI tab and <strong>paste it</strong> (Ctrl+V/Cmd+V).</li>
                    <li>Start asking your AI any queries!</li>
                    <li>The data can be pasted into <strong>ANY AI</strong> of your choice.</li>
                 </ul>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 w-full">
              {[
                { name: 'ChatGPT', url: 'https://chatgpt.com', color: '#00d4ff' },
                { name: 'Claude', url: 'https://claude.ai/new', color: '#ffaa44' },
                { name: 'Gemini', url: 'https://gemini.google.com/app', color: '#00ff88' },
                { name: 'Perplexity', url: 'https://www.perplexity.ai/', color: '#ff6b1a' }
              ].map(ai => (
                <button
                  key={ai.name}
                  onClick={() => {
                    navigator.clipboard.writeText(aiModal.promptText).then(() => {
                      window.open(ai.url, '_blank');
                      setAiModal({ isOpen: false, promptText: '' });
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
                <p className="text-[9px] text-[#00d4ff] uppercase tracking-widest font-black mb-1">Use ANY Other AI</p>
                <p className="text-[9px] text-slate-400 font-medium leading-relaxed px-4">
                  The copied data contains exhaustive instructions, data dictionaries, and your active data. Paste it into any AI to kickstart advanced analysis.
                </p>
              </div>
              <button
                 onClick={() => {
                   navigator.clipboard.writeText(aiModal.promptText).then(() => {
                     setToast({ msg: "Copied! You can paste this in ANY AI.", type: "ok" });
                     setAiModal({ isOpen: false, promptText: '' });
                   });
                 }}
                 className="w-full py-3 bg-[#aa44ff]/10 hover:bg-[#aa44ff]/20 border border-[#aa44ff]/30 text-[#aa44ff] font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 rounded-xl transition shadow-[0_4px_15px_rgba(170,68,255,0.2)]"
              >
                <ClipboardCopy size={16} /> Copy Full Prompt & Data Package
              </button>
            </div>

            <button 
              onClick={() => setAiModal({ isOpen: false, promptText: '' })}
              className="mt-4 text-slate-400 hover:text-white uppercase tracking-widest text-[11px] font-black transition flex items-center justify-center gap-2 w-full bg-[#2a2a50] hover:bg-rose-500 py-3 rounded-xl shadow-lg border border-[#2a2a50]"
            >
              <X size={16} /> Close & Go Back
            </button>
          </div>
        </div>
      )}

      {showOnboarding && <OnboardingModal viewId={activeView} onDismiss={handleDismissOnboarding} />}
    
    </div>
  );
}
