export interface Profile {
  name: string;
  tagline: string;
  email: string;
}

export type TrackerCategory = 'studies' | 'habits' | 'leisure' | 'custom';

export interface TrackerItem {
  id: string; // usually name
  category: TrackerCategory;
}

export type TrackerStatus = 'pending' | 'done' | 'missed' | 'skipped';

export interface DayEntry {
  status: TrackerStatus;
  reps: number;
  hours: number;
  satisfaction: number; // 1 to 5
  notes: string;
  [key: string]: any; // Allow custom inputs for deep dives
}

export interface DailyState {
  [date: string]: {
    [category in TrackerCategory]?: {
      [item: string]: DayEntry;
    };
  };
}

export interface RecurringTask {
  freq: 'daily' | 'weekdays' | 'weekends' | 'custom';
  days: number[]; // 0 = Mon, ..., 6 = Sun
}

export interface Reminder {
  id: string;
  title: string;
  dueDate: string; // YYYY-MM-DD
  time: string; // HH:MM (24h) or empty
  type: string;
  priority: 'low' | 'medium' | 'high';
  repeat: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  notes: string;
  status: 'pending' | 'done';
  enableAlert?: boolean;
  alertOffset?: number; // minutes before to show popup alert
}

export interface PomoSession {
  id: string;
  task: string;
  cat: TrackerCategory;
  duration: number; // minutes spent
  type: 'work' | 'break';
  date: string; // YYYY-MM-DD
  time: string; // e.g. 11:34
  status: 'completed' | 'failed' | 'interrupted';
}

export interface JournalPrompt {
  id: string;
  label: string;
  placeholder: string;
}

export interface JournalEntry {
  date: string; // YYYY-MM-DD
  mood: number; // 0 (none) or 1-5
  energy: number; // 0 (none) or 1-5
  tags: string[];
  sections: { [promptId: string]: string };
  savedAt: string; // ISO string
  location?: { lat: number; lng: number } | string;
  photos?: string[];
  sketches?: string[];
}

export interface GoalCategory {
  reps: number;
  hours: number;
  auto: boolean;
}

export interface GoalTarget {
  cat: { [catId: string]: GoalCategory };
  item: { [itemKey: string]: GoalCategory };
}

export interface GoalsState {
  weekly: GoalTarget;
  monthly: GoalTarget;
  yearly: GoalTarget;
}

export interface FinanceTask {
  id: string;
  name: string;
  done: boolean;
}

export interface ExpeditionExpense {
  id: string;
  date: string;
  concept: string;
  amount: number;
  currency: string;
  category: string;
  type?: 'expense' | 'income';
  splitWith?: string;
  links?: string;
  tasks?: FinanceTask[];
}

export interface ExpeditionPackItem {
  id: string;
  name: string;
  packed: boolean;
  qty: number;
}

export interface ExpeditionEntry {
  id: string;
  title: string;
  dateStart: string;
  dateEnd: string;
  notes: string;
  location?: string;
  people?: string;
  links?: string;
  packList: ExpeditionPackItem[];
  customTasks?: FinanceTask[];
}

export interface SketchEntry {
  id: string;
  date: string;
  title: string;
  dataUrl: string; // Base64 png/jpeg of the canvas
}

export interface SyncConfig {
  provider: 'none' | 'gist' | 'jsonbin';
  gistToken: string;
  gistId: string;
  jbKey: string;
  jbId: string;
  lastSync: 'ok' | 'error' | '';
  lastSyncTs: number;
}

export interface AppState {
  hasSeenWelcome?: boolean;
  onboarding?: Record<string, boolean>;
  profile: Profile;
  items: { [category in TrackerCategory]: string[] };
  daily: DailyState;
  repsTarget: { [category in TrackerCategory]?: { [item: string]: number } };
  hoursTarget: { [category in TrackerCategory]?: { [item: string]: number } };
  financeBudgets?: { d: number; w: number; m: number; y: number };
  reminders: Reminder[];
  goals: GoalsState;
  pomoSessions: PomoSession[];
  recurringTasks: { [taskKey: string]: RecurringTask };
  journals: { [date: string]: JournalEntry };
  journalPrompts: JournalPrompt[];
  journalTags: string[];
  expeditions: ExpeditionEntry[];
  finances: ExpeditionExpense[];
  sketches: SketchEntry[];
  muteGhostAlerts?: boolean;
  neonTheme?: string;
  bgTheme?: string;
}
