export const MORNING_OPENERS = [
  (n: string, r: number) => `Good morning${n?', '+n:''}. Your 7-day completion rate is **${r}%** — here's how to make today count.`,
  (n: string, r: number) => `Morning${n?', '+n:''}. You're at **${r}%** for the week. ${r>=70?'Strong position.':r>=50?'Solid footing.':'Today is a reset opportunity.'}`,
  (n: string) => `New day${n?', '+n:''}. Yesterday is data. Today is a decision.`,
  (n: string, r: number) => `${n||'Hey'}. Weekly rate: **${r}%**. Let's move the needle.`,
];

export const EVENING_OPENERS = [
  (n: string, r: number) => `Evening${n?', '+n:''}. Today's contribution lands your weekly rate at **${r}%**.`,
  (n: string) => `Day closed${n?', '+n:''}. Let's extract the signal before you sleep.`,
  (n: string, r: number) => `End-of-day, ${n||'friend'}. The week sits at **${r}%**. ${r>=70?'Well done.':'Tomorrow is another rep.'}`,
];

export const MICRO_INSIGHTS = {
  streak:    (name: string, d: number) => `🔥 **${name}**: ${d}-day streak.`,
  best:      (name: string, r: number) => `✅ **${name}** leading at **${r}%** this week.`,
  attention: (name: string, r: number) => `⚠️ **${name}** needs attention — **${r}%** this week.`,
  goal:      (title: string, p: number) => `🎯 **${title}** at **${p}%** — ${p>=80?'final stretch.':p>=50?'halfway there.':'keep the daily actions consistent.'}`,
  milestone: (label: string) => `🎉 ${label}`,
  rising:    (name: string, d: number) => `📈 **${name}** up **+${d}%** vs last week.`,
  moodHigh:  (s: number) => `😊 Mood averaging **${s}/5** — use this energy.`,
  moodLow:   (s: number) => `😔 Mood at **${s}/5** — protect your minimum viable habits today.`,
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
