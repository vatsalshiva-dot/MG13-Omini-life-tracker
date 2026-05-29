import { AnalysisResult, KnowledgeEntry, Trend } from './types';
import { HABIT_SCIENCE } from './knowledge/habitScience';
import { PSYCHOLOGY, MOOD_SCIENCE } from './knowledge/psychology';
import { GOAL_SCIENCE } from './knowledge/goalScience';

export class ResponseScorer {
  constructor(private a: AnalysisResult) {}

  private score(entry: any): number {
    let s = entry.weight ?? 0.5;

    // habitScience-style triggers
    if (entry.triggerWhen) {
      const t = entry.triggerWhen;
      if (t.rateAbove  !== undefined) s *= this.a.overallRate7 >= t.rateAbove  ? 1.4 : 0.04;
      if (t.rateBelow  !== undefined) s *= this.a.overallRate7 <= t.rateBelow  ? 1.4 : 0.04;
      if (t.streakAbove !== undefined) {
        const best = this.a.longestStreak?.streak ?? 0;
        s *= best >= t.streakAbove ? 1.5 : 0.04;
      }
      if (t.streakBelow !== undefined) {
        const best = this.a.longestStreak?.streak ?? 0;
        s *= best <= t.streakBelow ? 1.5 : 0.04;
      }
      if (t.trendIs !== undefined) {
        s *= this.a.trends.some(tr => tr.trend === t.trendIs) ? 1.5 : 0.04;
      }
      if (t.category !== undefined) {
        s *= (this.a.categoryRates[t.category] ?? 0) > 50 ? 1.3 : 0.5;
      }
    }

    // Mood range
    if (entry.moodRange) {
      const [lo, hi] = entry.moodRange;
      s *= (this.a.avgMood7 >= lo && this.a.avgMood7 <= hi) ? 1.7 : 0.04;
    }

    // Goal state
    if (entry.onTrack !== undefined) {
      const actuallyOnTrack = this.a.goalsSummary.some(g => g.onTrack);
      s *= entry.onTrack === actuallyOnTrack ? 1.4 : 0.04;
    }
    if (entry.pctAbove !== undefined)
      s *= this.a.goalsSummary.some(g => g.pct >= entry.pctAbove) ? 1.4 : 0.04;
    if (entry.pctBelow !== undefined)
      s *= this.a.goalsSummary.some(g => g.pct <= entry.pctBelow) ? 1.4 : 0.04;

    // Psychological context
    const ctx: Record<string, boolean> = {
      setback:      this.a.overallRate7 < 40 || this.a.moodTrend === 'falling',
      motivation:   this.a.overallRate7 < 55,
      identity:     (this.a.longestStreak?.streak ?? 0) > 21,
      productivity: this.a.consistencyScore > 60,
      resilience:   this.a.fallingHabits.length > 0,
      tracking:     true,
      systems:      this.a.overallRate7 < 65,
      mood:         this.a.avgMood7 > 0,
    };
    if (entry.context && ctx[entry.context] !== undefined) {
      s *= ctx[entry.context] ? 1.35 : 0.55;
    }

    return s;
  }

  topInsights(n = 5): string[] {
    const all = [...HABIT_SCIENCE, ...PSYCHOLOGY, ...MOOD_SCIENCE, ...GOAL_SCIENCE];
    return all
      .map(e => ({ e, s: this.score(e) }))
      .sort((a, b) => b.s - a.s)
      .slice(0, n)
      .map(x => x.e.text);
  }
}
