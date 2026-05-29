import fs from 'fs';
import path from 'path';

const files = {
  'src/lib/ai/knowledge/psychology.ts': `import { KnowledgeEntry } from '../types';

export const PSYCHOLOGY: KnowledgeEntry[] = [
  { text: "**Intrinsic motivation** predicts 3× better long-term adherence than extrinsic motivation (Ryan & Deci, 2000). Habits chosen voluntarily — not imposed externally — have dramatically higher 90-day survival rates. The shift from 'I have to' → 'I get to' is measurable in cortisol levels.",
    context: 'motivation', weight: 0.88 },
  { text: "**Growth mindset** (Carol Dweck, Stanford): people who treat missed days as *information* rather than *failure* show 40% faster recovery rates. The question isn't 'why did I fail' — it's 'what does this data tell me about my system?'",
    context: 'setback', weight: 0.92 },
  { text: "Negative self-talk after a setback activates the same threat-response as a physical danger. Optimal recovery framing: 'That was one day. My identity is built on trends, not isolated events.'",
    context: 'setback', weight: 0.87 },
  { text: "**Narrative identity** (Dan McAdams): how you describe yourself determines your future behaviour more than your intentions do. 'Someone who is *becoming* more consistent' outperforms 'I'm *trying* to be consistent' in 6-month adherence studies.",
    context: 'identity', weight: 0.85 },
  { text: "**Decision fatigue** (Roy Baumeister): willpower is a depleting cognitive resource. High-priority habits anchored to the first 2 hours of the day require less self-regulatory energy because the prefrontal cortex is at peak function.",
    context: 'productivity', weight: 0.87 },
  { text: "**Dopamine fires in anticipation**, not just on receipt. Visual tracking — streaks, progress bars, completion rings — triggers the same neurochemical as the reward itself. Your tracking dashboard is literally dopaminergic.",
    context: 'tracking', weight: 0.82 },
  { text: "**Self-determination theory** (Ryan & Deci): three universal psychological needs drive sustained behaviour — autonomy (I chose this), competence (I can do this), and relatedness (this connects me to something). Habits that satisfy all three are most durable.",
    context: 'motivation', weight: 0.85 },
  { text: "**Emotional granularity** (Lisa Feldman Barrett, 2018): people who name emotions precisely ('I'm not just stressed, I'm pre-emptively dreading X') show 30% faster emotional recovery. Name it to regulate it.",
    context: 'mood', weight: 0.8 },
  { text: "**Variable ratio reinforcement** (B.F. Skinner): habits that occasionally break and rebuild are often *more* durable than unbroken ones. Recovery is not failure — it is training in resilience. The habit pattern survives one break.",
    context: 'resilience', weight: 0.78 },
  { text: "**Implementation intentions** (Gollwitzer, 1999): 'When situation Y occurs, I will do X' increased adherence across 94 studies by 91% vs setting the same goal without an if-then structure. The situation becomes the automatic trigger.",
    context: 'systems', weight: 0.9 },
];

export const MOOD_SCIENCE: KnowledgeEntry[] = [
  { text: "Mood below **2.5/5 for 5+ consecutive days** is a pattern signal, not a blip. The single highest-evidence intervention: vigorous exercise for 30 minutes (effect size equivalent to antidepressants for mild-moderate depression — Blumenthal et al., 1999). Prioritise this before anything else.",
    moodRange: [1, 2.5], weight: 0.97 },
  { text: "**Positive affect** (mood 4+/5) predicts higher creativity, stronger immune function, greater prosocial behaviour, and faster cognitive processing (Fredrickson, 2001). Your current mood state is a genuine cognitive advantage. Leverage it.",
    moodRange: [4, 5], weight: 0.84 },
  { text: "**Sleep is the master lever for mood.** Poor sleep reduces mood by ~0.8 points on a 5-point scale (Walker, 2017). If mood is consistently below 3, optimise sleep quality before any other intervention.",
    moodRange: [1, 3], weight: 0.93 },
  { text: "**Hedonic adaptation** resets your mood baseline within ~3 months of most positive changes. Sustained wellbeing comes from process — habits, relationships, growth — not from outcomes like achievements or acquisitions.",
    moodRange: [3, 5], weight: 0.77 },
  { text: "Low mood correlates with **habit completion drop** (average 22% reduction in the same week — Hagger et al., 2010). This is the most important time to protect your minimum viable habit set — the 2-minute versions.",
    moodRange: [1, 2.8], weight: 0.88 },
];
`,
  'src/lib/ai/knowledge/goalScience.ts': `import { KnowledgeEntry } from '../types';

export const GOAL_SCIENCE: KnowledgeEntry[] = [
  { text: "**WOOP framework** (Gabriele Oettingen): Wish → Outcome → Obstacle → Plan. People using WOOP vs pure positive visualisation show 2× better attainment because mental contrasting activates problem-solving circuits rather than just reward circuits.",
    weight: 0.82 },
  { text: "Goals within **40–70% probability of success** produce peak performance (Yerkes-Dodson). Too easy = no activation. Too hard = learned helplessness. Being on track means you're in the optimal zone.",
    onTrack: true, weight: 0.8 },
  { text: "A goal **behind its time curve** signals a leading indicator problem, not a lagging one. Don't measure the outcome harder — change the *daily action*. The destination is right; the vehicle needs adjusting.",
    onTrack: false, weight: 0.93 },
  { text: "**Goal proximity acceleration** (Nunes & Drèze, 2006): effort increases non-linearly as you approach a finish line, even without external pressure. You're approaching the zone where this effect kicks in. Lean into it.",
    pctAbove: 70, weight: 0.87 },
  { text: "For goals below 20% progress: use the **proximate sub-goal strategy** — set a visible nearby target (first 25%) rather than focusing on the full outcome. Proximate goals increase sustained effort by 52% (Huang & Zhang, 2013).",
    pctBelow: 20, weight: 0.92 },
  { text: "**Approach goals** ('gain X') outperform **avoidance goals** ('stop Y') by 40% in completion rates (Elliot & Sheldon, 1997). Reframe any avoidance-framed goal in your list as an approach goal.",
    weight: 0.73 },
  { text: "**Weekly progress check-ins** on goals (vs monthly) produce 2.3× higher completion rates (Dominican University study). The act of measuring momentum *creates* momentum.",
    weight: 0.8 },
  { text: "The **planning fallacy** (Kahneman & Tversky): people systematically underestimate time, costs, and obstacles. If your goal timeline feels comfortable, it's probably optimistic. Add a 40% time buffer to your deadline.",
    weight: 0.72 },
];
`,
  'src/lib/ai/knowledge/journalPrompts.ts': `export const PROMPTS = {
  highMoodHighCompletion: [
    "You're operating well. Write the recipe: what exact conditions (sleep, schedule, environment, mindset) created this week?",
    "Describe the internal state you're in right now — not what you *did*, but what it *feels* like to be in momentum.",
    "What version of yourself is now possible that wasn't two months ago? Be specific.",
    "Who deserves to hear 'you made a difference in this'? What would you say to them?",
    "What are you taking for granted right now that you should consciously appreciate before it changes?",
    "What would you do differently if you knew this window of clarity was temporary?",
  ],
  highMoodLowCompletion: [
    "You're feeling good even though the numbers are lower. What's sustaining your mood independent of your output?",
    "Name the one habit that, if done daily for 30 days, would change everything else. Start with that.",
    "What's the exact friction point between your current state and your target completion rate? Be surgical.",
  ],
  lowMoodHighCompletion: [
    "You're showing up even when it's hard. That *is* discipline — the definition of it. What's keeping you going?",
    "Your actions and feelings are disconnected: your actions are *ahead*. Trust the actions; feelings catch up.",
    "What is the feeling underneath the low mood? Give it the most precise name you can.",
    "What need — sleep, connection, rest, creative space — is going unmet right now?",
    "If you could change one thing about your environment this week, what would it be, specifically?",
  ],
  lowMoodLowCompletion: [
    "No performance pressure. Just write. What's actually going on right now?",
    "What's the smallest possible version of tomorrow that would feel like a win — genuinely, not aspirationally?",
    "Who in your life would you want to talk to right now? What would you tell them?",
    "What would it mean to be *kind* to yourself this week, concretely? Not vaguely — specifically.",
    "List three things that are working, no matter how small. Start with the most mundane.",
  ],
  goalFocused: [
    "Your most important goal: what's the one daily action that makes all other actions less important?",
    "Describe the day you hit this goal. Who are you with? Where are you? What does the moment feel like?",
    "What would you need to *believe* about yourself to pursue this goal confidently?",
    "What are you using as an excuse that you could simply — honestly — stop using?",
    "If your goal could speak, what would it say to you right now?",
  ],
  streakProtect: [
    "You have a streak worth protecting. Write the contingency plan for your three hardest possible days.",
    "What is the absolute minimum version of each habit that still *counts*? Write these down now, not when you need them.",
    "Describe a day where everything goes wrong. Walk through exactly how you protect the streak anyway.",
    "Your streak is data: what does it tell you about who you are that you didn't know when you started?",
  ],
  weeklyReview: [
    "Rate this week 1–10 across: energy, focus, relationships, health, output. What drove each score?",
    "What one decision from this week would you undo? What would you do instead?",
    "What did you learn about yourself this week that you didn't know on Monday?",
    "Which habit showed up most reliably? What made it stick when others didn't?",
    "What gets consciously carried forward into next week, and what gets deliberately left behind?",
    "What surprised you this week? About yourself, or the world?",
  ],
  deepReflection: [
    "What fear is disguising itself as procrastination right now?",
    "Describe your ideal life in 5 years without referencing money, status, or achievements.",
    "What belief about yourself — formed before age 20 — needs updating?",
    "What are you most proud of that no one knows about?",
    "What would you do if you knew no one was watching or judging?",
    "Write a brief obituary of the version of you that gives up easily.",
    "What conversation are you avoiding that would free up the most mental energy?",
    "What does 'enough' actually look like for you? In work, in habits, in achievement?",
  ],
  morningIntent: [
    "One word for today. Why that word?",
    "What is the single thing that, if done today, makes everything else easier or irrelevant?",
    "Who do you want to be today? Describe it behaviourally — not 'be kind' but 'I will...'",
    "What are you most looking forward to today? Start there.",
    "What would today look like if it were 10% better than yesterday?",
  ],
  eveningClose: [
    "Three things that went well today, and *why* they went well. The why matters more than the what.",
    "One thing you'll do differently tomorrow. Not 'should' — *will*.",
    "Who did you genuinely help today, even in a small way?",
    "What part of today are you at peace with, even if it wasn't perfect?",
    "Rate your energy at end-of-day: what consumed it most? What created it?",
    "What did today teach you about your capacity?",
  ],
  scienceBased: [
    "Research shows self-compassion after setbacks predicts faster recovery than self-criticism (Neff, 2003). Where could you apply this concretely this week?",
    "The best predictor of future behaviour is past behaviour, not intentions. Looking at your last 14 days: what pattern are you reinforcing?",
    "Writing about goals for 15–20 minutes improves attainment by 42% (Pennebaker & Seagal, 1999). Use this session for exactly that — one specific goal, 15 minutes.",
  ],
  gratitude: [
    "Three people who made a positive difference in the last 7 days. What specifically did they do?",
    "What about your body are you grateful for today? Be specific — not 'my health' but what it let you *do*.",
    "What challenge are you secretly grateful for, because of what it's building in you?",
    "Describe one moment from today, however small, that was genuinely good.",
  ],
};
`,
  'src/lib/ai/knowledge/briefings.ts': `export const MORNING_OPENERS = [
  (n: string, r: number) => \`Good morning\${n?', '+n:''}. Your 7-day completion rate is **\${r}%** — here's how to make today count.\`,
  (n: string, r: number) => \`Morning\${n?', '+n:''}. You're at **\${r}%** for the week. \${r>=70?'Strong position.':r>=50?'Solid footing.':'Today is a reset opportunity.'}\`,
  (n: string) => \`New day\${n?', '+n:''}. Yesterday is data. Today is a decision.\`,
  (n: string, r: number) => \`\${n||'Hey'}. Weekly rate: **\${r}%**. Let's move the needle.\`,
];

export const EVENING_OPENERS = [
  (n: string, r: number) => \`Evening\${n?', '+n:''}. Today's contribution lands your weekly rate at **\${r}%**.\`,
  (n: string) => \`Day closed\${n?', '+n:''}. Let's extract the signal before you sleep.\`,
  (n: string, r: number) => \`End-of-day, \${n||'friend'}. The week sits at **\${r}%**. \${r>=70?'Well done.':'Tomorrow is another rep.'}\`,
];

export const MICRO_INSIGHTS = {
  streak:    (name: string, d: number) => \`🔥 **\${name}**: \${d}-day streak.\`,
  best:      (name: string, r: number) => \`✅ **\${name}** leading at **\${r}%** this week.\`,
  attention: (name: string, r: number) => \`⚠️ **\${name}** needs attention — **\${r}%** this week.\`,
  goal:      (title: string, p: number) => \`🎯 **\${title}** at **\${p}%** — \${p>=80?'final stretch.':p>=50?'halfway there.':'keep the daily actions consistent.'}\`,
  milestone: (label: string) => \`🎉 \${label}\`,
  rising:    (name: string, d: number) => \`📈 **\${name}** up **+\${d}%** vs last week.\`,
  moodHigh:  (s: number) => \`😊 Mood averaging **\${s}/5** — use this energy.\`,
  moodLow:   (s: number) => \`😔 Mood at **\${s}/5** — protect your minimum viable habits today.\`,
};

export const CLOSERS = [
  "The quality of your life is the quality of your habits.",
  "Small actions, repeated, become who you are.",
  "You don't rise to your goals — you fall to your systems. Build better systems.",
  "Every rep counts. Every day counts. Even the imperfect ones.",
  "Progress is invisible until suddenly, irreversibly, it isn't.",
  "Discipline is choosing what you want most over what you want now.",
  "Compound interest applies to habits: boring consistency creates extraordinary results.",
  "The goal isn't to be perfect. It's to never stop.",
  "You're building the proof that you can do hard things.",
  "Identity shift precedes behaviour change. Act as the person you're becoming.",
  "One more rep. Always one more rep.",
  "The most successful people aren't more motivated — they built better systems.",
];
`,
  'src/lib/ai/ResponseScorer.ts': `import { AnalysisResult, KnowledgeEntry, Trend } from './types';
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
`,
};

for (const [filepath, content] of Object.entries(files)) {
  fs.mkdirSync(path.dirname(filepath), { recursive: true });
  fs.writeFileSync(filepath, content);
  console.log('Created ' + filepath);
}
