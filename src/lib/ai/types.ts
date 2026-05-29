export type MoodScore  = 1 | 2 | 3 | 4 | 5;
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
