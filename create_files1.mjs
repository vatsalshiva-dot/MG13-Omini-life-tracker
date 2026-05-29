import fs from 'fs';
import path from 'path';

const files = {
  'src/lib/ai/types.ts': `export type MoodScore  = 1 | 2 | 3 | 4 | 5;
export type Trend      = 'rising' | 'falling' | 'stable' | 'volatile';
export type Intent     =
  | 'analyze' | 'journal' | 'morning' | 'evening'
  | 'goal'    | 'habit'   | 'mood'    | 'motivate'
  | 'science' | 'week'    | 'fallback';

export interface Habit {
  id:             string;
  name:           string;
  category:       'health' | 'mind' | 'work' | 'social' | 'finance' | 'custom';
  completedDates: string[];
  targetDays:     number;
  createdAt:      string;
  color?:         string;
  icon?:          string;
}

export interface Goal {
  id:           string;
  title:        string;
  description?: string;
  category:     string;
  targetValue:  number;
  currentValue: number;
  unit:         string;
  deadline:     string;
  createdAt:    string;
  milestones?:  { label: string; value: number }[];
}

export interface JournalEntry {
  id:            string;
  date:          string;
  content:       string;
  mood:          MoodScore;
  energy?:       MoodScore;
  tags:          string[];
  aiPromptUsed?: string;
}

export interface MoodEntry {
  date:      string;
  score:     MoodScore;
  energy?:   MoodScore;
  note?:     string;
  triggers?: string[];
}

export interface OmniData {
  habits:    Habit[];
  goals:     Goal[];
  journal:   JournalEntry[];
  moods:     MoodEntry[];
  userName?: string;
}

export interface AIMessage {
  role:      'user' | 'assistant';
  content:   string;
  timestamp: number;
}

export interface AIResponse {
  content:  string;
  intent:   Intent;
  score?:   number;
  sources:  string[];
}

export interface AnalysisResult {
  overallRate7:      number;
  overallRate30:     number;
  bestHabits:        { habit: Habit; rate: number; streak: number }[];
  weakestHabits:     { habit: Habit; rate: number }[];
  trends:            { habit: Habit; trend: Trend; delta: number }[];
  risingHabits:      { habit: Habit; delta: number }[];
  fallingHabits:     { habit: Habit; delta: number }[];
  longestStreak:     { habit: Habit; streak: number } | null;
  avgMood7:          number;
  avgMood30:         number;
  moodTrend:         Trend;
  goalsSummary:      { goal: Goal; pct: number; onTrack: boolean; daysLeft: number; rateNeeded: number }[];
  topTags:           string[];
  consistencyScore:  number;
  bestDay:           string;
  worstDay:          string;
  milestones:        { habit: Habit; days: number; label: string }[];
  categoryRates:     Record<string, number>;
  moodHabitCorr:     { habit: Habit; correlation: number }[];
  totalJournalWords: number;
}

export interface KnowledgeEntry {
  text:        string;
  weight:      number;
  triggerWhen?: {
    rateBelow?:   number;
    rateAbove?:   number;
    streakAbove?: number;
    streakBelow?: number;
    trendIs?:     Trend;
    category?:    string;
  };
  moodRange?:  [number, number];
  onTrack?:    boolean;
  pctAbove?:   number;
  pctBelow?:   number;
  context?:    string;
}
`,
  'src/lib/ai/DataAdapter.ts': `import { OmniData, Habit, Goal, JournalEntry, MoodEntry } from './types';

// Maps ANY AI-Studio-generated app data shape → OmniData
// Covers all common field name variations
export function adaptToOmniData(app: any): OmniData {
  const pick = (...keys: string[]) => (obj: any) =>
    keys.reduce<any>((v, k) => (v !== undefined ? v : obj?.[k]), undefined);

  return {
    userName: pick('userName','name','user.name','profile.name')(app) ?? '',

    habits: toArr(pick('habits','trackers','routines','tasks')(app))
      .map((h: any): Habit => ({
        id:             h.id ?? h._id ?? uid(),
        name:           pick('name','title','label','habit')(h) ?? 'Habit',
        category:       normCat(h.category),
        completedDates: toDates(
          pick('completedDates','completed','completions','done','history')(h)
        ),
        targetDays:     +(pick('targetDays','frequency','target','goal','perWeek')(h) ?? 7),
        createdAt:      toISO(pick('createdAt','created','startDate','date')(h)),
      })),

    goals: toArr(pick('goals','objectives','targets')(app))
      .map((g: any): Goal => ({
        id:           g.id ?? g._id ?? uid(),
        title:        pick('title','name','label','goal')(g) ?? 'Goal',
        category:     g.category ?? 'general',
        targetValue:  +(pick('targetValue','target','goal','total')(g) ?? 100),
        currentValue: +(pick('currentValue','current','progress','done','value')(g) ?? 0),
        unit:         g.unit ?? '%',
        deadline:     toISO(pick('deadline','dueDate','endDate','due')(g)
                       ?? new Date(Date.now() + 30 * 86400000).toISOString()),
        createdAt:    toISO(pick('createdAt','created','startDate')(g)),
        milestones:   g.milestones ?? [],
      })),

    journal: toArr(pick('journal','entries','journalEntries','logs')(app))
      .map((j: any): JournalEntry => ({
        id:           j.id ?? uid(),
        date:         (pick('date','createdAt','timestamp')(j) ?? today()).split('T')[0],
        content:      pick('content','text','body','entry','note')(j) ?? '',
        mood:         clampMood(pick('mood','moodScore','feeling')(j)),
        energy:       clampMood(pick('energy','energyLevel')(j)),
        tags:         toArr(pick('tags','keywords','topics')(j)),
        aiPromptUsed: pick('aiPromptUsed','prompt','aiPrompt')(j) ?? '',
      })),

    moods: toArr(pick('moods','moodLog','moodEntries','feelings')(app))
      .map((m: any): MoodEntry => ({
        date:    (pick('date','createdAt','timestamp')(m) ?? today()).split('T')[0],
        score:   clampMood(pick('score','mood','value','rating')(m)),
        energy:  clampMood(pick('energy','energyLevel')(m)),
        note:    pick('note','comment','text')(m) ?? undefined,
        triggers: toArr(pick('triggers','tags')(m)),
      })),
  };
}

function toArr(v: any): any[] { return Array.isArray(v) ? v : v ? [v] : []; }
function uid()  { return Math.random().toString(36).slice(2); }
function today(){ return new Date().toISOString().split('T')[0]; }
function toISO(v: any): string {
  if (!v) return new Date().toISOString();
  try { return new Date(v).toISOString(); } catch { return new Date().toISOString(); }
}
function clampMood(v: any): 1|2|3|4|5 {
  const n = Math.round(+v);
  return (isNaN(n) ? 3 : Math.max(1, Math.min(5, n))) as 1|2|3|4|5;
}
function normCat(v: any): Habit['category'] {
  const map: Record<string, Habit['category']> = {
    health:'health', fitness:'health', exercise:'health', wellness:'health',
    mind:'mind', mental:'mind', learning:'mind', education:'mind',
    work:'work', career:'work', professional:'work', productivity:'work',
    social:'social', relationships:'social', family:'social',
    finance:'finance', money:'finance', financial:'finance',
  };
  return map[String(v ?? '').toLowerCase()] ?? 'custom';
}
function toDates(v: any): string[] {
  if (!v) return [];
  if (Array.isArray(v)) {
    return v.map((d: any) => {
      if (typeof d === 'string') return d.split('T')[0];
      if (d?.date) return String(d.date).split('T')[0];
      if (d?.done && d?.date) return String(d.date).split('T')[0];
      return '';
    }).filter(Boolean);
  }
  return [];
}
`,
  'src/lib/ai/DataAnalyzer.ts': `import { OmniData, Habit, Goal, Trend, AnalysisResult } from './types';

const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MILESTONES = [
  { days:7,   label:'🏅 First Week Complete' },
  { days:21,  label:'🥈 21-Day Neural Reinforcement' },
  { days:30,  label:'🥇 One Month Streak' },
  { days:66,  label:'⭐ Habit Fully Formed (66d)' },
  { days:100, label:'🏆 100-Day Elite Performer' },
  { days:180, label:'💎 Six-Month Mastery' },
  { days:365, label:'👑 Full Year — Identity Forged' },
];

export class DataAnalyzer {
  private today: string;
  constructor(private d: OmniData) {
    this.today = new Date().toISOString().split('T')[0];
  }

  // ── Core helpers ────────────────────────────────────────
  private iso(d: Date) { return d.toISOString().split('T')[0]; }
  daysAgo(n: number): string {
    const d = new Date(); d.setDate(d.getDate() - n); return this.iso(d);
  }
  private daysBetween(a: string, b: string): number {
    return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
  }

  // ── Habit rates ─────────────────────────────────────────
  completionRate(h: Habit, days = 7): number {
    if (!h.completedDates.length) return 0;
    const cutoff = this.daysAgo(days);
    const done = h.completedDates.filter(d => d >= cutoff && d <= this.today).length;
    return +(done / days * 100).toFixed(1);
  }
  private completionRatePrior(h: Habit, days = 7): number {
    const from = this.daysAgo(days * 2);
    const to   = this.daysAgo(days);
    return +(h.completedDates.filter(d => d >= from && d < to).length / days * 100).toFixed(1);
  }
  overallRate(days = 7): number {
    if (!this.d.habits.length) return 0;
    const sum = this.d.habits.reduce((s, h) => s + this.completionRate(h, days), 0);
    return +(sum / this.d.habits.length).toFixed(1);
  }

  // ── Streaks ─────────────────────────────────────────────
  streak(h: Habit): number {
    let s = 0; const d = new Date();
    while (true) {
      if (h.completedDates.includes(this.iso(d))) { s++; d.setDate(d.getDate()-1); }
      else break;
    }
    return s;
  }
  longestEverStreak(h: Habit): number {
    if (!h.completedDates.length) return 0;
    const sorted = [...h.completedDates].sort();
    let max = 1, cur = 1;
    for (let i = 1; i < sorted.length; i++) {
      if (this.daysBetween(sorted[i-1], sorted[i]) === 1) { cur++; max = Math.max(max, cur); }
      else cur = 1;
    }
    return max;
  }

  // ── Trends ──────────────────────────────────────────────
  trend(h: Habit): { trend: Trend; delta: number } {
    const r1 = this.completionRate(h, 7);
    const r2 = this.completionRatePrior(h, 7);
    const delta = +(r1 - r2).toFixed(1);
    let trend: Trend;
    if (Math.abs(delta) < 8) trend = 'stable';
    else if (delta > 20)     trend = 'volatile';
    else if (delta > 0)      trend = 'rising';
    else                     trend = 'falling';
    return { trend, delta };
  }

  // ── Mood ────────────────────────────────────────────────
  avgMood(days = 7): number {
    const cutoff = this.daysAgo(days);
    const recent = this.d.moods.filter(m => m.date >= cutoff);
    if (!recent.length) return 0;
    return +(recent.reduce((s, m) => s + m.score, 0) / recent.length).toFixed(2);
  }
  moodTrend(): Trend {
    const r1 = this.avgMood(7);
    const priorMoods = this.d.moods.filter(m => m.date >= this.daysAgo(14) && m.date < this.daysAgo(7));
    if (!priorMoods.length) return 'stable';
    const r2 = +(priorMoods.reduce((s, m) => s + m.score, 0) / priorMoods.length).toFixed(2);
    if (r1 - r2 > 0.5) return 'rising';
    if (r2 - r1 > 0.5) return 'falling';
    return 'stable';
  }
  moodLabel(s: number): string {
    if (s >= 4.5) return 'excellent'; if (s >= 3.5) return 'good';
    if (s >= 2.5) return 'neutral';   if (s >= 1.5) return 'low';
    return 'very low';
  }

  // ── Goals ───────────────────────────────────────────────
  goalProgress(g: Goal) {
    const pct       = Math.min(100, +(g.currentValue / Math.max(1, g.targetValue) * 100).toFixed(1));
    const totalDays = this.daysBetween(g.createdAt.split('T')[0], g.deadline.split('T')[0]);
    const elapsed   = this.daysBetween(g.createdAt.split('T')[0], this.today);
    const timePct   = totalDays > 0 ? +(elapsed / totalDays * 100).toFixed(1) : 100;
    const onTrack   = pct >= timePct * 0.85;
    const daysLeft  = Math.max(0, this.daysBetween(this.today, g.deadline.split('T')[0]));
    const remaining = g.targetValue - g.currentValue;
    const rateNeeded = daysLeft > 0 ? +(remaining / daysLeft).toFixed(2) : remaining;
    return { pct, timePct, onTrack, daysLeft, rateNeeded };
  }

  // ── Weekly pattern ──────────────────────────────────────
  bestWorstDay(): { best: string; worst: string } {
    const scores = new Array(7).fill(0);
    const counts = new Array(7).fill(0);
    this.d.habits.forEach(h => {
      h.completedDates.forEach(ds => {
        const dow = (new Date(ds + 'T12:00:00').getDay());
        scores[dow]++;
        counts[dow]++;
      });
    });
    const avgs = scores.map((s, i) => counts[i] > 0 ? s / counts[i] : -1);
    const best  = avgs.indexOf(Math.max(...avgs));
    const valid = avgs.filter(v => v >= 0);
    const worst = avgs.indexOf(Math.min(...valid));
    return { best: DAYS[best] || 'Unknown', worst: DAYS[worst] || 'Unknown' };
  }

  // ── Mood-habit correlation ──────────────────────────────
  moodHabitCorrelation(): { habit: Habit; correlation: number }[] {
    if (this.d.moods.length < 5) return [];
    const moodMap: Record<string, number> = {};
    this.d.moods.forEach(m => { moodMap[m.date] = m.score; });

    return this.d.habits.map(h => {
      const pairs: [number, number][] = [];
      Object.keys(moodMap).forEach(date => {
        const done = h.completedDates.includes(date) ? 1 : 0;
        pairs.push([done, moodMap[date]]);
      });
      if (pairs.length < 5) return { habit: h, correlation: 0 };
      const n = pairs.length;
      const mx = pairs.reduce((s, p) => s + p[0], 0) / n;
      const my = pairs.reduce((s, p) => s + p[1], 0) / n;
      const num = pairs.reduce((s, p) => s + (p[0]-mx)*(p[1]-my), 0);
      const dx  = Math.sqrt(pairs.reduce((s, p) => s + (p[0]-mx)**2, 0));
      const dy  = Math.sqrt(pairs.reduce((s, p) => s + (p[1]-my)**2, 0));
      const corr = dx && dy ? +(num / (dx*dy)).toFixed(3) : 0;
      return { habit: h, correlation: corr };
    }).sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
  }

  // ── Category rates ──────────────────────────────────────
  categoryRates(): Record<string, number> {
    const cats = ['health','mind','work','social','finance','custom'] as const;
    const result: Record<string, number> = {};
    cats.forEach(cat => {
      const habits = this.d.habits.filter(h => h.category === cat);
      if (!habits.length) return;
      const avg = habits.reduce((s, h) => s + this.completionRate(h, 7), 0) / habits.length;
      result[cat] = +avg.toFixed(1);
    });
    return result;
  }

  // ── Milestones ──────────────────────────────────────────
  getMilestones(): { habit: Habit; days: number; label: string }[] {
    const results: { habit: Habit; days: number; label: string }[] = [];
    this.d.habits.forEach(h => {
      const s = this.streak(h);
      MILESTONES.forEach(m => {
        if (s >= m.days && s < m.days + 3) results.push({ habit: h, ...m });
      });
    });
    return results;
  }

  // ── Consistency score ───────────────────────────────────
  consistencyScore(): number {
    const habitScore   = this.overallRate(14);
    const moodCoverage = Math.min(100, this.d.moods.filter(m => m.date >= this.daysAgo(14)).length / 14 * 100);
    const jrnlCoverage = Math.min(100, this.d.journal.filter(j => j.date >= this.daysAgo(14)).length / 14 * 100);
    return Math.round(habitScore * 0.6 + moodCoverage * 0.2 + jrnlCoverage * 0.2);
  }

  // ── Full analysis ────────────────────────────────────────
  fullAnalysis(): AnalysisResult {
    const rated7 = this.d.habits
      .map(h => ({ habit: h, rate: this.completionRate(h, 7), streak: this.streak(h) }))
      .sort((a, b) => b.rate - a.rate);

    const dayPattern = this.bestWorstDay();

    return {
      overallRate7:      this.overallRate(7),
      overallRate30:     this.overallRate(30),
      bestHabits:        rated7.slice(0, 3),
      weakestHabits:     [...rated7].reverse().slice(0, 3),
      trends:            this.d.habits.map(h => ({ habit: h, ...this.trend(h) })),
      risingHabits:      this.d.habits.map(h => ({ habit: h, ...this.trend(h) })).filter(t => t.trend === 'rising'),
      fallingHabits:     this.d.habits.map(h => ({ habit: h, ...this.trend(h) })).filter(t => t.trend === 'falling'),
      longestStreak:     rated7.length ? rated7.reduce((a, b) => a.streak > b.streak ? a : b) : null,
      avgMood7:          this.avgMood(7),
      avgMood30:         this.avgMood(30),
      moodTrend:         this.moodTrend(),
      goalsSummary:      this.d.goals.map(g => ({ goal: g, ...this.goalProgress(g) })),
      topTags:           this.topJournalTags(5),
      consistencyScore:  this.consistencyScore(),
      bestDay:           dayPattern.best,
      worstDay:          dayPattern.worst,
      milestones:        this.getMilestones(),
      categoryRates:     this.categoryRates(),
      moodHabitCorr:     this.moodHabitCorrelation().slice(0, 5),
      totalJournalWords: this.d.journal.reduce((s, j) => s + j.content.split(/\\s+/).length, 0),
    };
  }

  topJournalTags(n = 5): string[] {
    const freq: Record<string, number> = {};
    this.d.journal.forEach(j => j.tags.forEach(t => { freq[t] = (freq[t] || 0) + 1; }));
    return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, n).map(e => e[0]);
  }
}
`,
  'src/lib/ai/NLPRouter.ts': `import { Intent } from './types';

const MAP: Record<Intent, string[]> = {
  analyze:  ['analys','review','overview','how am i','progress','report','performance','doing','stats','numbers','check in'],
  journal:  ['journal','write','prompt','reflect','diary','express','thought','entry','writing'],
  morning:  ['morning','good morning','start','wake up','today','daily plan','prepare','brief'],
  evening:  ['evening','night','end of day','done for','recap','wind down','close','bed'],
  goal:     ['goal','target','objective','achieve','milestone','deadline','aim','ambition'],
  habit:    ['habit','streak','routine','daily','consistency','complete','miss','skip','chain'],
  mood:     ['mood','feel','emotion','stress','anxious','happy','sad','energy','tired','down','low','great'],
  motivate: ['motivate','inspire','push','encourage','struggling','hard','give up','quit','can\\'t'],
  science:  ['why','science','research','study','prove','evidence','explain','how does','reason','fact'],
  week:     ['week','this week','weekly','7 days','last 7'],
  fallback: [],
};

export class NLPRouter {
  static detect(input: string): Intent {
    const lower = input.toLowerCase();
    for (const [intent, keys] of Object.entries(MAP)) {
      if (keys.some(k => lower.includes(k))) return intent as Intent;
    }
    const h = new Date().getHours();
    if (h >= 5  && h < 12) return 'morning';
    if (h >= 20 || h < 5)  return 'evening';
    return 'analyze';
  }

  static findHabit(input: string, names: string[]): string | null {
    const lower = input.toLowerCase();
    return names.find(n => lower.includes(n.toLowerCase())) ?? null;
  }

  static findGoal(input: string, titles: string[]): string | null {
    const lower = input.toLowerCase();
    return titles.find(t => lower.includes(t.toLowerCase())) ?? null;
  }

  static sentimentScore(text: string): number {
    const pos = ['great','amazing','excellent','proud','happy','love','crushing','nailed','momentum','progress','strong','fired up','excited','killing'];
    const neg = ['fail','miss','skip','struggle','hard','tired','exhausted','quit','behind','stuck','overwhelmed','can\\'t','lost','frustrated'];
    let score = 0;
    const words = text.toLowerCase().split(/\\s+/);
    words.forEach(w => {
      if (pos.some(p => w.includes(p))) score++;
      if (neg.some(n => w.includes(n))) score--;
    });
    return Math.max(-5, Math.min(5, score));
  }
}
`,
  'src/lib/ai/knowledge/habitScience.ts': `import { KnowledgeEntry } from '../types';

export const HABIT_SCIENCE: KnowledgeEntry[] = [
  // ── Automaticity & identity ─────────────────────────────
  { text: "At **85%+ completion** you've passed the automaticity threshold — this habit is now encoded in the basal ganglia, not the prefrontal cortex. It no longer requires willpower. Protect the conditions that created this.",
    triggerWhen: { rateAbove: 85 }, weight: 0.92 },
  { text: "**30-day milestone:** Phillippa Lally's UCL research found habits take 18–254 days to form, averaging 66. You're almost halfway. The discomfort is neurological wiring, not weakness.",
    triggerWhen: { streakAbove: 28, streakBelow: 35 }, weight: 0.9 },
  { text: "**Identity shift in progress:** James Clear (Atomic Habits, 2018) defines a habit as formed when someone stops saying 'I'm trying to do X' and starts saying 'I'm someone who does X.' A 21+ day streak is the point that shift typically occurs.",
    triggerWhen: { streakAbove: 21 }, weight: 0.88 },
  { text: "**66-day milestone:** Lally's research found this is the scientific average for automaticity. You've hit the evidence-based definition of a formed habit. What required decision-making is now default.",
    triggerWhen: { streakAbove: 66, streakBelow: 70 }, weight: 0.98 },
  { text: "**100-day milestone:** Fewer than 3% of people who start a habit reach 100 consecutive days. You now have a deeply grooved neural pathway. This is genuinely rare.",
    triggerWhen: { streakAbove: 100 }, weight: 1.0 },
  { text: "**7-day milestone:** 72% of new habit attempts fail before day 7 (Norcross et al., 2002). You've passed the highest dropout threshold. The curve gets shallower from here.",
    triggerWhen: { streakAbove: 7, streakBelow: 10 }, weight: 0.9 },

  // ── Low completion — friction ────────────────────────────
  { text: "Completion below 30% signals a **friction problem**, not a motivation problem. Reduce the habit's setup time to under 20 seconds. The brain's reward system won't initiate a behaviour when activation energy exceeds expected reward.",
    triggerWhen: { rateBelow: 30 }, weight: 0.95 },
  { text: "Try the **2-Minute Rule** (James Clear): scale this habit to a version completable in 120 seconds. 2-minute walk start. 2-minute meditation. 2-minute journal opening line. This isn't the habit — it's the *gateway* to the habit.",
    triggerWhen: { rateBelow: 40 }, weight: 0.92 },
  { text: "**Environment design** is 3× more effective than willpower (BJ Fogg, Tiny Habits, 2019). Move objects. Change the room arrangement. Put running shoes at the door. Put the book on the pillow. Your environment is the real autopilot.",
    triggerWhen: { rateBelow: 45 }, weight: 0.9 },
  { text: "**Temptation bundling** (Katy Milkman, Wharton): pair this habit with something you already enjoy. Only listen to your favourite podcast during this habit. Only have your favourite drink before it. Dopamine bundling creates pull, not push.",
    triggerWhen: { rateBelow: 50 }, weight: 0.85 },
  { text: "Missing **twice in a row** is the critical inflection. One miss is an accident. Two misses is the beginning of a new pattern — the habit of NOT doing it. If you've missed two days: don't attempt the full version. Do 1% of it today.",
    triggerWhen: { rateBelow: 50, streakBelow: 1 }, weight: 0.95 },
  { text: "**Context mismatch** is the #1 hidden cause of low completion. The environment doesn't cue the habit. Where does this habit live physically? What immediately precedes it in your day? Anchor it to an existing behaviour.",
    triggerWhen: { rateBelow: 35 }, weight: 0.88 },

  // ── Declining trends ─────────────────────────────────────
  { text: "A declining trend often signals **habit stack collapse** — too many habits competing for the same time slot. Identify the cannibalized habit and give it a separate, protected time anchor.",
    triggerWhen: { trendIs: 'falling' }, weight: 0.9 },
  { text: "**Commitment devices** increase completion by 65% (American Society of Training & Development): tell someone, schedule it publicly, use a physical tracker, bet money on it. External accountability works when internal motivation dips.",
    triggerWhen: { trendIs: 'falling' }, weight: 0.85 },
  { text: "A declining pattern means your **why** has weakened. Write one sentence: 'I do [this habit] because...' Make it visceral and personal, not aspirational. The more specific to your life, the stronger the re-anchor.",
    triggerWhen: { trendIs: 'falling', streakBelow: 5 }, weight: 0.82 },
  { text: "**Implementation intentions** (Peter Gollwitzer): replace 'I'll try to do X' with 'When [situation] occurs, I will do X.' Across 94 studies this if-then structure increases completion by 91%.",
    triggerWhen: { rateBelow: 60 }, weight: 0.88 },

  // ── High performance ─────────────────────────────────────
  { text: "At **90%+ completion** you've entered the identity consolidation phase. Consider upgrading this habit — increase duration, intensity, or scope. Plateau here and neurological benefit stagnates.",
    triggerWhen: { rateAbove: 90 }, weight: 0.87 },
  { text: "You're exhibiting **Golden Behavior** (BJ Fogg): high motivation AND high ability aligned. The habit fits your life. Protect the environmental and temporal conditions that created this fit.",
    triggerWhen: { rateAbove: 80 }, weight: 0.82 },

  // ── Health category ──────────────────────────────────────
  { text: "Physical health habits produce a **cascade effect**: consistent exercisers report 38% better sleep quality, make better nutritional choices, and sustain higher mood baselines (Sleep Foundation; CDC Behavioural Risk Factor data).",
    triggerWhen: { category: 'health', rateAbove: 60 }, weight: 0.78 },
  { text: "The **dose-response curve** for exercise: 1×/week = ~30% of max cardiovascular benefit; 3×/week = ~80%; 5×/week = ~100%. Each session at sub-3× frequency gives outsized returns.",
    triggerWhen: { category: 'health', rateBelow: 60 }, weight: 0.82 },

  // ── Mind category ────────────────────────────────────────
  { text: "Meditation shows the **steepest benefit curve in weeks 4–8** — increased grey matter density in the prefrontal cortex is measurable via MRI at this stage. The neurological changes happen regardless of whether you 'feel' different.",
    triggerWhen: { category: 'mind', streakAbove: 21 }, weight: 0.82 },
  { text: "20 pages/day of reading = 15–18 books/year, placing you in the top 10% of knowledge accumulators. The compounding return is not information volume — it's faster pattern recognition and crystallised intelligence.",
    triggerWhen: { category: 'mind', rateAbove: 50 }, weight: 0.74 },

  // ── The never miss twice rule ─────────────────────────────
  { text: "The **fresh start effect** (Hengchen Dai, 2014): people are 2.4× more likely to restart habits after temporal landmarks — Mondays, first of the month, after birthdays. Use this deliberately as a restart mechanism.",
    triggerWhen: { streakBelow: 3 }, weight: 0.88 },
  { text: "**Habit stacking** (Clear): 'After I [CURRENT HABIT], I will [NEW HABIT].' Neural efficiency increases ~40% when habits are chained to existing grooves because the cue is already wired.",
    triggerWhen: { rateBelow: 60 }, weight: 0.84 },
  { text: "One miss has **zero measurable impact** on long-term habit formation (Lally, 2010). The streak counter is a motivation tool — it is not the habit. Missed one day: tomorrow is day 1 of a new streak. The prior pattern still exists.",
    triggerWhen: { streakBelow: 2 }, weight: 0.93 },
];
`
};

for (const [filepath, content] of Object.entries(files)) {
  fs.mkdirSync(path.dirname(filepath), { recursive: true });
  fs.writeFileSync(filepath, content);
  console.log('Created ' + filepath);
}
