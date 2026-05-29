import { OmniData, Habit, Goal, Trend, AnalysisResult } from './types';

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
      totalJournalWords: this.d.journal.reduce((s, j) => s + j.content.split(/\s+/).length, 0),
    };
  }

  topJournalTags(n = 5): string[] {
    const freq: Record<string, number> = {};
    this.d.journal.forEach(j => j.tags.forEach(t => { freq[t] = (freq[t] || 0) + 1; }));
    return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, n).map(e => e[0]);
  }
}
