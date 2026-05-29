import { OmniData, Habit, Goal, JournalEntry, MoodEntry } from './types';

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
