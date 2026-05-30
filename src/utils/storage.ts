import { AppState, TrackerCategory, GoalsState, SyncConfig } from '../types';
import { ghostSyncWrite } from './ghost';
import { get, set } from 'idb-keyval';

export const SK = 'lt_v5';
export const SYNC_KEY = 'lt_v5_sync';
export const BACKUP_TIMESTAMP_KEY = 'lt_v5_last_auto_backup';

export const CATS: { id: TrackerCategory; label: string; icon: string; neon: string }[] = [
  { id: 'studies', label: 'Studies', icon: '▦', neon: '#00d4ff' },
  { id: 'habits', label: 'Habits', icon: '↻', neon: '#00ff88' },
  { id: 'leisure', label: 'Leisure', icon: '◈', neon: '#ff6b1a' },
  { id: 'custom', label: 'Custom', icon: '◎', neon: '#aa44ff' },
];

export function getAllCats(state?: AppState | null) {
  const base = [...CATS];
  if (state?.categories && Array.isArray(state.categories)) {
     base.push(...state.categories);
  }
  return base;
}

export function getCatLabel(state: AppState | undefined | null, catId: TrackerCategory): string {
  if (state?.categoryLabels?.[catId]) return state.categoryLabels[catId];
  return getAllCats(state).find(c => c.id === catId)?.label || catId;
}

export function initCG() {
  const o: any = {};
  CATS.forEach((c) => {
    o[c.id] = { reps: 0, hours: 0, auto: true };
  });
  return o;
}

export function defData(): AppState {
  return {
    hasSeenWelcome: false,
    onboarding: {},
    profile: { name: '', tagline: '', email: '' },
    items: {
      studies: ['Mathematics', 'Physics', 'Chemistry', 'English', 'History', 'Computer Science'],
      habits: ['Morning Exercise', 'Meditation', 'Reading (30 min)', 'Water Intake', 'Sleep by 11 PM', 'Journaling'],
      leisure: ['Gaming', 'Movies/Series', 'Music Practice', 'Art & Drawing', 'Outdoor Walk', 'Social Time'],
      custom: ['Morning Run', 'Budget Review', 'Language Practice'],
    },
    daily: {},
    repsTarget: {},
    hoursTarget: {},
    reminders: [],
    goals: {
      weekly: { cat: initCG(), item: {} },
      monthly: { cat: initCG(), item: {} },
      yearly: { cat: initCG(), item: {} },
    },
    pomoSessions: [],
    recurringTasks: {},
    journals: {},
    journalPrompts: [
      { id: 'wins', label: '🏆 WINS & HIGHLIGHTS', placeholder: 'What went well today? What are you proud of?' },
      { id: 'blockers', label: '🧱 BLOCKERS & CHALLENGES', placeholder: 'What got in the way? What was difficult?' },
      { id: 'notes', label: '📝 FREE NOTES', placeholder: 'Anything else on your mind...' },
      { id: 'tomorrow', label: '🎯 TODAY\'S TOP 3 FOCUS', placeholder: '1.\n2.\n3.' },
    ],
    journalTags: ['Productive', 'Grateful', 'Creative', 'Relaxed', 'Tired', 'Stressed', 'Healthy', 'Social', 'Focused', 'Exhausted'],
    expeditions: [],
    finances: [],
    sketches: [],
  };
}

export function loadData(): AppState {
  if (typeof window !== 'undefined' && window.location.search.includes('demo=true')) {
    try {
      const raw = localStorage.getItem('demo_' + SK);
      if (raw) {
         const d = JSON.parse(raw);
         migrate(d);
         return d;
      }
    } catch(e) {}
  }

  try {
    const raw = localStorage.getItem(SK);
    if (raw) {
      const d = JSON.parse(raw);
      migrate(d);
      return d;
    }
  } catch (e) {
    console.error('Failed to load storage data', e);
  }
  return defData();
}

/** 
 * IndexedDB Async Migration & Load 
 */
export async function loadDataIndexedDB(): Promise<AppState | null> {
  try {
    const isDemo = typeof window !== 'undefined' && window.location.search.includes('demo=true');
    const key = isDemo ? 'demo_' + SK : SK;
    let data = await get<AppState>(key);

    if (!data) {
      // First time with IndexedDB: attempt to migrate from localStorage
      const localRaw = localStorage.getItem(key);
      if (localRaw) {
        data = JSON.parse(localRaw);
        await set(key, data); // store to IDB immediately
      }
    }

    if (data) {
      migrate(data);
      return data;
    }
  } catch (e) {
    console.error("Failed to load IndexedDB data", e);
  }
  return null;
}

export function saveData(data: AppState) {
  const isDemo = typeof window !== 'undefined' && window.location.search.includes('demo=true');
  const dKey = isDemo ? 'demo_' + SK : SK;
  
  // Keep localStorage slightly updated if within limit but heavily rely on sync IDB
  try {
    localStorage.setItem(dKey, JSON.stringify(data));
  } catch (e) {
    console.warn('Local Storage full! Relying solely on IndexedDB.');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('omnilife_storage_full'));
    }
  }

  // Fire and forget IndexedDB write
  if (typeof window !== 'undefined') {
    set(dKey, data).catch(console.error);
  }

  if (typeof window !== 'undefined' && !isDemo) {
    ghostSyncWrite(data).catch(() => {});
  }
}

/** 
 * Auto-Backup System 
 * Checks if 7 days have passed, and triggers an automated JSON download backup of the AppState 
 */
export function checkAndTriggerAutoBackup(data: AppState, onSetState?: (updater: (prev: AppState) => AppState) => void) {
  if (typeof window === 'undefined') return;
  const lastBackupStr = localStorage.getItem(BACKUP_TIMESTAMP_KEY);
  const now = Date.now();
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

  const hasPastBackup = !!lastBackupStr || !!data.lastAutoBackup;
  const lastBackupTime = lastBackupStr ? parseInt(lastBackupStr, 10) : (data.lastAutoBackup || 0);

  // If there's no backup timestamp at all (first load on a device), do not trigger backup download immediately
  if (!hasPastBackup) {
    localStorage.setItem(BACKUP_TIMESTAMP_KEY, now.toString());
    if (onSetState) {
      onSetState(prev => ({ ...prev, lastAutoBackup: now }));
    } else {
      data.lastAutoBackup = now;
      set('omnilife_v5_userdata', data).catch(console.error);
    }
    return;
  }

  if (now - lastBackupTime > SEVEN_DAYS_MS) {
    triggerBackupDownload(data, "AUTO_WEEKLY");
    localStorage.setItem(BACKUP_TIMESTAMP_KEY, now.toString());
    if (onSetState) {
      onSetState(prev => ({ ...prev, lastAutoBackup: now }));
    } else {
      data.lastAutoBackup = now;
      set('omnilife_v5_userdata', data).catch(console.error);
    }
  }
}

export function triggerBackupDownload(data: AppState, prefix: string = "MANUAL") {
  const payload = JSON.stringify(data, null, 2);
  const blob = new Blob([payload], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const d = new Date();
  const dateStr = d.toISOString().split("T")[0];
  a.download = `omnilife_backup_${prefix}_${dateStr}.json`;
  a.click();
  URL.revokeObjectURL(url);
}


export function loadSyncCfg(): SyncConfig {
  try {
    const raw = localStorage.getItem(SYNC_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return {
    provider: 'none',
    gistToken: '',
    gistId: '',
    jbKey: '',
    jbId: '',
    lastSync: '',
    lastSyncTs: 0,
  };
}

export function saveSyncCfg(cfg: SyncConfig) {
  try {
    localStorage.setItem(SYNC_KEY, JSON.stringify(cfg));
  } catch (e) {}
}

export function migrate(d: any) {
  if (!d.profile) d.profile = { name: '', tagline: '', email: '' };
  if (!d.repsTarget) d.repsTarget = {};
  if (!d.hoursTarget) d.hoursTarget = {};
  if (!Array.isArray(d.reminders)) d.reminders = d.reminders ? Object.values(d.reminders) : [];
  if (!d.expeditions) d.expeditions = [];
  if (!d.finances) d.finances = [];
  if (!d.sketches) d.sketches = [];
  if (!d.goals) {
    d.goals = {
      weekly: { cat: initCG(), item: {} },
      monthly: { cat: initCG(), item: {} },
      yearly: { cat: initCG(), item: {} },
    };
  }
  ['weekly', 'monthly', 'yearly'].forEach((p) => {
    if (!d.goals[p]) d.goals[p] = { cat: initCG(), item: {} };
    if (!d.goals[p].cat) d.goals[p].cat = initCG();
    if (!d.goals[p].item) d.goals[p].item = {};
    CATS.forEach((c) => {
      const cg = d.goals[p].cat[c.id];
      if (!cg || typeof cg === 'number') {
        d.goals[p].cat[c.id] = { reps: +(cg || 0), hours: 0, auto: true };
      }
      if (d.goals[p].cat[c.id].auto === undefined) {
        d.goals[p].cat[c.id].auto = true;
      }
    });
  });
  if (!d.items) d.items = defData().items;
  CATS.forEach((c) => {
    if (!d.items[c.id]) d.items[c.id] = [];
  });
  if (!d.pomoSessions) d.pomoSessions = [];
  if (!d.recurringTasks) d.recurringTasks = {};
  if (!d.journals) d.journals = {};
  if (!d.journalPrompts) d.journalPrompts = defData().journalPrompts;
  if (!d.journalTags) d.journalTags = defData().journalTags;
  if (!d.onboarding) d.onboarding = {};
}

// ── CLOUD SYNC SERVICES ──

const GIST_FILE = 'life_tracker_data_v5.json';

export async function syncGist(cfg: SyncConfig, data: AppState): Promise<{ gistId: string }> {
  const token = cfg.gistToken;
  if (!token) throw new Error('No GitHub token provided');

  const payload = JSON.stringify(data, null, 2);
  const headers = {
    Authorization: `token ${token}`,
    'Content-Type': 'application/json',
  };

  if (cfg.gistId) {
    const res = await fetch(`https://api.github.com/gists/${cfg.gistId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        files: { [GIST_FILE]: { content: payload } },
      }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Gist update failed');
    return { gistId: cfg.gistId };
  } else {
    const res = await fetch('https://api.github.com/gists', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        description: 'Life Tracker Data Cloud Sync (V5)',
        public: false,
        files: { [GIST_FILE]: { content: payload } },
      }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Gist create failed');
    return { gistId: json.id };
  }
}

export async function pullGist(cfg: SyncConfig): Promise<AppState> {
  const token = cfg.gistToken;
  const gistId = cfg.gistId;
  if (!token) throw new Error('No GitHub token configured');
  if (!gistId) throw new Error('No Gist ID configured — sync first');

  const res = await fetch(`https://api.github.com/gists/${gistId}`, {
    headers: { Authorization: `token ${token}` },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Gist fetch failed');

  const file = json.files && json.files[GIST_FILE];
  if (!file) throw new Error('File not found in Gist');

  if (file.content) {
    return JSON.parse(file.content);
  } else {
    const rawRes = await fetch(file.raw_url);
    const text = await rawRes.text();
    return JSON.parse(text);
  }
}

export async function syncJSONBin(cfg: SyncConfig, data: AppState): Promise<{ binId: string }> {
  const key = cfg.jbKey;
  if (!key) throw new Error('No JSONBin Master Key');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Master-Key': key,
  };

  if (cfg.jbId) {
    const res = await fetch(`https://api.jsonbin.io/v3/b/${cfg.jbId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || json.error || 'JSONBin update failed');
    return { binId: cfg.jbId };
  } else {
    const res = await fetch('https://api.jsonbin.io/v3/b', {
      method: 'POST',
      headers: {
        ...headers,
        'X-Bin-Name': 'LifeTracker_v5',
        'X-Bin-Private': 'true',
      },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || json.error || 'JSONBin create failed');
    return { binId: json.metadata.id };
  }
}

export async function pullJSONBin(cfg: SyncConfig): Promise<AppState> {
  const key = cfg.jbKey;
  const id = cfg.jbId;
  if (!key) throw new Error('No JSONBin key');
  if (!id) throw new Error('No Bin ID — sync first');

  const res = await fetch(`https://api.jsonbin.io/v3/b/${id}/latest`, {
    headers: { 'X-Master-Key': key },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || json.error || 'JSONBin fetch failed');
  return json.record;
}
