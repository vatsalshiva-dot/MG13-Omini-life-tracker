import { AppState, TrackerCategory, GoalsState, SyncConfig } from '../types';
import { ghostSyncWrite } from './ghost';

export const SK = 'lt_v5';
export const SYNC_KEY = 'lt_v5_sync';

export const CATS: { id: TrackerCategory; label: string; icon: string; neon: string }[] = [
  { id: 'studies', label: 'Studies', icon: '▦', neon: '#00d4ff' },
  { id: 'habits', label: 'Habits', icon: '↻', neon: '#00ff88' },
  { id: 'leisure', label: 'Leisure', icon: '◈', neon: '#ff6b1a' },
  { id: 'custom', label: 'Custom', icon: '◎', neon: '#aa44ff' },
];

export function getCatLabel(state: AppState | undefined | null, catId: TrackerCategory): string {
  if (state?.categoryLabels?.[catId]) return state.categoryLabels[catId] as string;
  return CATS.find(c => c.id === catId)?.label || catId;
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
    // Return demo state dynamically imported to avoid circular dependencies if any,
    // or just return from local storage key demo_lt_v5 
    try {
      const raw = localStorage.getItem('demo_' + SK);
      if (raw) {
         const d = JSON.parse(raw);
         migrate(d);
         return d;
      }
    } catch(e) {}
    // If we want to return DEMO_STATE directly we can export a function in demoData.ts
    // For now we'll just fall back to defData if not loaded yet if we rely on App.tsx doing the first setup
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

export function saveData(data: AppState) {
  try {
    const isDemo = typeof window !== 'undefined' && window.location.search.includes('demo=true');
    localStorage.setItem(isDemo ? 'demo_' + SK : SK, JSON.stringify(data));
  } catch (e) {
    console.error('Local Storage full!', e);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('omnilife_storage_full'));
    }
  }
  if (typeof window !== 'undefined' && !window.location.search.includes('demo=true')) {
    ghostSyncWrite(data).catch(() => {});
  }
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
