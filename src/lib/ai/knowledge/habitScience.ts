import { KnowledgeEntry } from '../types';

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
