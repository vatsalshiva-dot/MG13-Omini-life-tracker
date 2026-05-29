import { OmniData, AIResponse, Intent, AnalysisResult } from './types';
import { DataAnalyzer } from './DataAnalyzer';
import { NLPRouter } from './NLPRouter';
import { ResponseScorer } from './ResponseScorer';
import { ContextMemory } from './ContextMemory';
import { MORNING_OPENERS, EVENING_OPENERS, MICRO_INSIGHTS, CLOSERS } from './knowledge/briefings';
import { PROMPTS as JP } from './knowledge/journalPrompts';

const pick = <T>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

export class LocalAI {
  private az:  DataAnalyzer;
  private mem: ContextMemory;

  constructor(private data: OmniData) {
    this.az  = new DataAnalyzer(data);
    this.mem = new ContextMemory();
    this.mem.learnFromJournal(data.journal);
    const best = this.az.fullAnalysis().longestStreak?.streak ?? 0;
    this.mem.updateStreakRecord(best);
  }

  // ── Guard: not enough data ────────────────────────────────
  private noData(intent: Intent): AIResponse {
    const missing: string[] = [];
    if (!this.data.habits.length)  missing.push('**habits**');
    if (!this.data.moods.length)   missing.push('**mood logs**');
    if (!this.data.goals.length)   missing.push('**goals**');
    return {
      content: `## 👋 Almost Ready\n\nTo unlock AI insights, add at least:\n\n${missing.map(m=>`- ${m}`).join('\n')}\n\nOnce you have a few days of data, I'll generate real, personalised analysis from your actual patterns — no generic advice.`,
      intent, sources: [],
    };
  }

  // ══════════════════════════════════════════════════════════
  // PUBLIC API — same surface as your Gemini calls
  // Every method is async so drop-in replacement is seamless
  // ══════════════════════════════════════════════════════════

  async query(userMessage: string): Promise<AIResponse> {
    this.mem.addMessage({ role:'user', content:userMessage, timestamp:Date.now() });
    if (!this.data.habits.length && !this.data.goals.length) return this.noData('analyze');

    const intent = NLPRouter.detect(userMessage);
    const h = NLPRouter.findHabit(userMessage, this.data.habits.map(x=>x.name));
    const g = NLPRouter.findGoal(userMessage,  this.data.goals.map(x=>x.title));

    let resp: AIResponse;
    switch (intent) {
      case 'morning':  resp = await this.briefing('morning'); break;
      case 'evening':  resp = await this.briefing('evening'); break;
      case 'journal':  resp = await this.journalPrompt(); break;
      case 'goal':     resp = await this.goalAnalysis(g); break;
      case 'habit':    resp = await this.habitDeep(h); break;
      case 'mood':     resp = await this.moodInsight(); break;
      case 'motivate': resp = await this.motivation(); break;
      case 'science':  resp = await this.scienceInsight(); break;
      case 'week':     resp = await this.weekSummary(); break;
      default:         resp = await this.fullAnalysis();
    }

    this.mem.addMessage({ role:'assistant', content:resp.content, timestamp:Date.now() });
    return resp;
  }

  async fullAnalysis(): Promise<AIResponse> {
    if (!this.data.habits.length) return this.noData('analyze');
    const a   = this.az.fullAnalysis();
    const sc  = new ResponseScorer(a);
    const ins = sc.topInsights(4);

    const sections: string[] = [];
    const perf = a.overallRate7>=75?'🟢':a.overallRate7>=50?'🟡':'🔴';
    sections.push(`## ${perf} Weekly Performance\n**${a.overallRate7}%** this week · **${a.overallRate30}%** past 30 days · **Consistency: ${a.consistencyScore}/100**`);

    // Milestones first — celebrate!
    if (a.milestones.length) {
      sections.push(`## 🎉 Milestone${a.milestones.length>1?'s':''} This Week\n${a.milestones.map(m=>MICRO_INSIGHTS.milestone(m.label+' — '+m.habit.name)).join('\n')}`);
    }

    // Best habits
    if (a.bestHabits.length) {
      sections.push(`## 💪 Strongest Habits\n${a.bestHabits.map(b=>`- ${MICRO_INSIGHTS.best(b.habit.name, b.rate)} ${b.streak>2?'🔥'+b.streak+'d':''}`).join('\n')}`);
    }

    // Weakest habits
    const weak = a.weakestHabits.filter(w => w.rate < 60);
    if (weak.length) {
      sections.push(`## ⚠️ Needs Attention\n${weak.map(w=>`- ${MICRO_INSIGHTS.attention(w.habit.name, w.rate)}`).join('\n')}`);
    }

    // Trends
    if (a.risingHabits.length)  sections.push(`## 📈 Rising\n${a.risingHabits.map(t=>`- **${t.habit.name}** +${t.delta}% vs last week`).join('\n')}`);
    if (a.fallingHabits.length) sections.push(`## 📉 Slipping\n${a.fallingHabits.map(t=>`- **${t.habit.name}** ${t.delta}% vs last week`).join('\n')}`);

    // Category breakdown
    const cats = Object.entries(a.categoryRates);
    if (cats.length) {
      const catLines = cats.map(([c, r]) => {
        const bar = '█'.repeat(Math.round(r/10))+'░'.repeat(10-Math.round(r/10));
        return `- **${c}** \`${bar}\` ${r}%`;
      });
      sections.push(`## 📂 By Category\n${catLines.join('\n')}`);
    }

    // Mood
    if (a.avgMood7 > 0) {
      const bar = '⬛'.repeat(Math.round(a.avgMood7))+'⬜'.repeat(5-Math.round(a.avgMood7));
      sections.push(`## 😊 Mood\n**${a.avgMood7}/5** ${bar} · Trend: ${a.moodTrend} · 30-day avg: ${a.avgMood30}`);
    }

    // Goals
    if (a.goalsSummary.length) {
      sections.push(`## 🎯 Goals\n${a.goalsSummary.map(g=>{
        const bar='█'.repeat(Math.round(g.pct/10))+'░'.repeat(10-Math.round(g.pct/10));
        return `- **${g.goal.title}** \`${bar}\` ${g.pct}% ${g.onTrack?'✅':g.daysLeft<7?'🚨':'⚠️'} ${g.daysLeft}d left`;
      }).join('\n')}`);
    }

    // Mood-habit correlation
    const corrs = a.moodHabitCorr.filter(c => Math.abs(c.correlation) > 0.2);
    if (corrs.length) {
      const lines = corrs.map(c => `- **${c.habit.name}** → mood correlation: ${c.correlation>0?'+':''}${c.correlation} ${c.correlation>0.3?'(positive link)':c.correlation<-0.3?'(check if this drains you)':'(weak)'}`);
      sections.push(`## 🔗 Habit-Mood Links\n${lines.join('\n')}`);
    }

    // Weekly pattern
    if (a.bestDay && a.worstDay)
      sections.push(`## 📅 Pattern\nStrongest day: **${a.bestDay}** · Weakest: **${a.worstDay}** — schedule demanding habits on ${a.bestDay}.`);

    // Scored AI insights
    sections.push(`## 🧠 AI Insights\n${ins.map(i=>`> ${i}`).join('\n\n')}`);

    // Priority directive
    if (weak.length) sections.push(`## 🎯 This Week's Priority\nFocus on **${weak[0].habit.name}**. Everything else is a bonus.`);

    return {
      content:  sections.join('\n\n'),
      intent:   'analyze',
      score:    a.overallRate7,
      sources:  ['habits','mood','goals','journal'],
    };
  }

  async journalPrompt(): Promise<AIResponse> {
    const a    = this.az.fullAnalysis();
    const rate = a.overallRate7;
    const mood = a.avgMood7;
    const dow  = new Date().getDay();
    const hour = new Date().getHours();

    let pool: string[];
    if      (mood >= 4 && rate >= 70)          pool = JP.highMoodHighCompletion;
    else if (mood >= 4 && rate < 50)           pool = JP.highMoodLowCompletion;
    else if (mood > 0 && mood < 3 && rate >=70) pool = JP.lowMoodHighCompletion;
    else if (mood > 0 && mood < 3 && rate < 50) pool = JP.lowMoodLowCompletion;
    else if (a.goalsSummary.some(g=>g.pct>0))  pool = JP.goalFocused;
    else if (a.longestStreak && a.longestStreak.streak > 14) pool = JP.streakProtect;
    else if (dow === 0)                         pool = JP.weeklyReview;
    else if (hour < 10)                         pool = JP.morningIntent;
    else if (hour >= 20)                        pool = JP.eveningClose;
    else                                        pool = JP.deepReflection;

    const prompt = pick(pool);
    const ctx = mood > 0
      ? `\n\n*Personalised for mood ${mood}/5 · ${rate}% completion · ${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][dow]}*`
      : '';

    return { content: `## ✍️ Journal Prompt\n\n**${prompt}**${ctx}`, intent:'journal', sources:['mood','habits'] };
  }

  async briefing(type: 'morning' | 'evening'): Promise<AIResponse> {
    const a    = this.az.fullAnalysis();
    const name = this.data.userName || '';
    const rate = a.overallRate7;
    const mood = a.avgMood7;
    const parts: string[] = [];

    if (type === 'morning') {
      parts.push(`## ☀️ Morning Briefing\n${pick(MORNING_OPENERS)(name, rate)}`);
      // Focus habit
      const weak = a.weakestHabits[0];
      if (weak) parts.push(MICRO_INSIGHTS.attention(weak.habit.name, weak.rate));
      // Best streak
      if (a.longestStreak && a.longestStreak.streak > 0)
        parts.push(MICRO_INSIGHTS.streak(a.longestStreak.habit.name, a.longestStreak.streak));
      // Mood signal
      if (mood > 0)
        parts.push(mood >= 3.5 ? MICRO_INSIGHTS.moodHigh(mood) : MICRO_INSIGHTS.moodLow(mood));
      // Goals
      a.goalsSummary.slice(0, 2).forEach(g => parts.push(MICRO_INSIGHTS.goal(g.goal.title, g.pct)));
      // Daily milestone
      if (a.milestones.length) parts.push(MICRO_INSIGHTS.milestone(a.milestones[0].label));
      // One priority
      const priority = a.weakestHabits[0]?.habit.name || a.bestHabits[0]?.habit.name || 'your most important habit';
      parts.push(`\n### 🎯 Today's One Priority\n**${priority}** — everything else is a bonus.`);

    } else {
      parts.push(`## 🌙 Evening Wrap-Up\n${pick(EVENING_OPENERS)(name, rate)}`);
      // Celebrate best habit
      if (a.bestHabits.length) parts.push(MICRO_INSIGHTS.best(a.bestHabits[0].habit.name, a.bestHabits[0].rate));
      // Rising trends
      if (a.risingHabits.length)
        parts.push(a.risingHabits.map(t => MICRO_INSIGHTS.rising(t.habit.name, t.delta)).join('\n'));
      // Evening journal nudge
      parts.push(`\n**Tonight's reflection:**\n> *${pick(JP.eveningClose)}*`);
    }

    // Weekly pattern note
    if (a.bestDay) parts.push(`Pattern note: you're historically strongest on **${a.bestDay}**.`);

    parts.push(`\n---\n*${pick(CLOSERS)}*`);
    this.mem.markBriefedToday();

    return { content: parts.join('\n\n'), intent: type, sources: ['habits','goals','mood'] };
  }

  async goalAnalysis(goalTitle: string | null): Promise<AIResponse> {
    const goals = goalTitle
      ? this.data.goals.filter(g => g.title.toLowerCase().includes(goalTitle.toLowerCase()))
      : this.data.goals;

    if (!goals.length)
      return { content:'## 🎯 Goals\nNo goals found. Add your first goal to get AI analysis.', intent:'goal', sources:[] };

    const a = this.az.fullAnalysis();
    const sc = new ResponseScorer(a);
    const insights = sc.topInsights(2).filter(i => GOAL_SCIENCE.some((g: any) => g.text === i));

    const sections = ['## 🎯 Goal Analysis'];
    goals.forEach(g => {
      const prog = this.az.goalProgress(g);
      const bar  = '█'.repeat(Math.round(prog.pct/10))+'░'.repeat(10-Math.round(prog.pct/10));
      const emoji = prog.pct >= 100?'🏆':prog.onTrack?'✅':prog.daysLeft<7?'🚨':'⚠️';
      sections.push(
        `### ${emoji} ${g.title}\n` +
        `\`[${bar}]\` **${prog.pct}%** complete\n\n` +
        `- Time remaining: **${prog.daysLeft} days**\n` +
        `- Status: ${prog.onTrack?'**On track** ✅':'**Behind pace** ⚠️'}\n` +
        (prog.rateNeeded > 0 ? `- Needed to catch up: **${prog.rateNeeded} ${g.unit}/day**\n` : '') +
        (g.description ? `\n*${g.description}*` : '')
      );
    });

    if (insights.length) sections.push(`\n## 🧠 Goal Science\n${insights.map(i => `> ${i}`).join('\n\n')}`);
    return { content: sections.join('\n\n'), intent:'goal', sources:['goals'] };
  }

  async habitDeep(habitName: string | null): Promise<AIResponse> {
    const habits = habitName
      ? this.data.habits.filter(h => h.name.toLowerCase().includes(habitName.toLowerCase()))
      : this.data.habits.slice(0, 5);

    if (!habits.length)
      return { content:'## 💪 Habits\nNo habits found. Add some habits to get deep analysis.', intent:'habit', sources:[] };

    const sections = ['## 💪 Habit Deep Dive'];
    habits.forEach(h => {
      const r7   = this.az.completionRate(h, 7);
      const r30  = this.az.completionRate(h, 30);
      const cur  = this.az.streak(h);
      const best = this.az.longestEverStreak(h);
      const t    = this.az.trend(h);
      const bar  = '█'.repeat(Math.round(r7/10))+'░'.repeat(10-Math.round(r7/10));
      sections.push(
        `### ${h.icon??'◈'} ${h.name}\n` +
        `\`[${bar}]\` **${r7}%** (7d) · **${r30}%** (30d)\n\n` +
        `- Current streak: **${cur}d** · Longest ever: **${best}d**\n` +
        `- Trend: **${t.trend}** (${t.delta>0?'+':''}${t.delta}% vs last week)\n` +
        `- Category: ${h.category} · Target: ${h.targetDays}d/week`
      );
    });

    return { content: sections.join('\n\n'), intent:'habit', sources:['habits'] };
  }

  async moodInsight(): Promise<AIResponse> {
    if (!this.data.moods.length)
      return { content:'## 😊 Mood\nNo mood data yet. Log your first mood check-in to get analysis.', intent:'mood', sources:[] };

    const avg7  = this.az.avgMood(7);
    const avg30 = this.az.avgMood(30);
    const trend = this.az.moodTrend();
    const recent = [...this.data.moods].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,7);
    const bar = '⬛'.repeat(Math.round(avg7))+'⬜'.repeat(5-Math.round(avg7));
    const label = this.az.moodLabel(avg7);

    const corrs = this.az.moodHabitCorrelation().filter(c => Math.abs(c.correlation) > 0.25);
    const corrSection = corrs.length
      ? `\n\n## 🔗 Habit-Mood Links\n${corrs.map(c=>`- **${c.habit.name}**: ${c.correlation>0?'positive':'negative'} correlation (${c.correlation>0?'+':''}${c.correlation})`).join('\n')}`
      : '';

    const a = this.az.fullAnalysis();
    const sc = new ResponseScorer(a);
    const scienceInsight = MOOD_SCIENCE.filter((e: any) => {
      if (!e.moodRange) return false;
      const [lo, hi] = e.moodRange;
      return avg7 >= lo && avg7 <= hi;
    }).sort((a: any, b: any) => b.weight - a.weight)[0]?.text;

    const content =
      `## 😊 Mood Analysis\n\n**7-day avg: ${avg7}/5** ${bar} · ${label}\n30-day avg: **${avg30}/5** · Trend: **${trend}**\n\n` +
      `### Last 7 Entries\n${recent.map(m=>`- ${m.date}: ${'⭐'.repeat(m.score)}${'☆'.repeat(5-m.score)} ${m.note?`· *${m.note.slice(0,40)}*`:''}`).join('\n')}` +
      corrSection +
      (scienceInsight ? `\n\n## 🔬 Science\n> ${scienceInsight}` : '');

    return { content, intent:'mood', sources:['moods','habits'] };
  }

  async weekSummary(): Promise<AIResponse> {
    const a = this.az.fullAnalysis();
    const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const today = new Date();
    const weekData: string[] = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today); d.setDate(d.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      const dow = days[d.getDay()];
      const done = this.data.habits.filter(h => h.completedDates.includes(ds)).length;
      const total = this.data.habits.length;
      const pct = total ? Math.round(done/total*100) : 0;
      const bar = '█'.repeat(Math.round(pct/10))+'░'.repeat(10-Math.round(pct/10));
      const mood = this.data.moods.find(m => m.date === ds);
      weekData.push(`**${dow}** \`${bar}\` ${pct}%${mood?` · ${mood.score}/5 mood`:''}`);
    }

    const content =
      `## 📊 7-Day Summary\n\n${weekData.join('\n')}\n\n` +
      `**Average: ${a.overallRate7}%** · Best day: **${a.bestDay}** · Worst: **${a.worstDay}**\n\n` +
      (a.milestones.length ? `**Milestones:** ${a.milestones.map(m=>m.label+' ('+m.habit.name+')').join(', ')}\n\n` : '') +
      `*${pick(CLOSERS)}*`;

    return { content, intent:'week', sources:['habits','moods'] };
  }

  async motivation(): Promise<AIResponse> {
    const a = this.az.fullAnalysis();
    const rate = a.overallRate7;
    const streak = a.longestStreak;
    const sessionCount = this.mem.getSessionCount();

    const lines: string[] = [];
    if (rate > 0)    lines.push(`You've completed **${rate}%** of your habits this week. That's not nothing — that's real.`);
    if (streak?.streak) lines.push(`Your best streak is **${streak.streak} days** on **${streak.habit.name}**. That's evidence. You've done hard things before.`);
    lines.push(`Most people quit before day 14. You're still here.`);
    if (sessionCount > 5) lines.push(`You've been tracking for ${sessionCount}+ sessions. That consistency *is* the practice.`);
    if (a.risingHabits.length) lines.push(`**${a.risingHabits[0].habit.name}** is rising. Something is working.`);
    lines.push(pick(CLOSERS));

    return { content: `## 🔥 Push Forward\n\n${lines.join('\n\n')}`, intent:'motivate', sources:['habits'] };
  }

  async scienceInsight(): Promise<AIResponse> {
    const a  = this.az.fullAnalysis();
    const sc = new ResponseScorer(a);
    const insights = sc.topInsights(3);
    return { content: `## 🔬 Evidence-Based Insights\n\n${insights.map(i=>`> ${i}`).join('\n\n---\n\n')}`, intent:'science', sources:['habits','mood'] };
  }
}

// Re-export knowledge for scoring (needed by ResponseScorer)
import { GOAL_SCIENCE } from './knowledge/goalScience';
import { MOOD_SCIENCE } from './knowledge/psychology';
