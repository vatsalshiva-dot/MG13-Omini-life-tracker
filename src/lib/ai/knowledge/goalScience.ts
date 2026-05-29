import { KnowledgeEntry } from '../types';

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
