import { KnowledgeEntry } from '../types';

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
