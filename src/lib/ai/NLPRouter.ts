import { Intent } from './types';

const MAP: Record<Intent, string[]> = {
  analyze:  ['analys','review','overview','how am i','progress','report','performance','doing','stats','numbers','check in'],
  journal:  ['journal','write','prompt','reflect','diary','express','thought','entry','writing'],
  morning:  ['morning','good morning','start','wake up','today','daily plan','prepare','brief'],
  evening:  ['evening','night','end of day','done for','recap','wind down','close','bed'],
  goal:     ['goal','target','objective','achieve','milestone','deadline','aim','ambition'],
  habit:    ['habit','streak','routine','daily','consistency','complete','miss','skip','chain'],
  mood:     ['mood','feel','emotion','stress','anxious','happy','sad','energy','tired','down','low','great'],
  motivate: ['motivate','inspire','push','encourage','struggling','hard','give up','quit','can\'t'],
  science:  ['why','science','research','study','prove','evidence','explain','how does','reason','fact'],
  week:     ['week','this week','weekly','7 days','last 7'],
  fallback: [],
};

export class NLPRouter {
  static detect(input: string): Intent {
    const lower = input.toLowerCase();
    for (const [intent, keys] of Object.entries(MAP)) {
      if (keys.some(k => lower.includes(k))) return intent as Intent;
    }
    const h = new Date().getHours();
    if (h >= 5  && h < 12) return 'morning';
    if (h >= 20 || h < 5)  return 'evening';
    return 'analyze';
  }

  static findHabit(input: string, names: string[]): string | null {
    const lower = input.toLowerCase();
    return names.find(n => lower.includes(n.toLowerCase())) ?? null;
  }

  static findGoal(input: string, titles: string[]): string | null {
    const lower = input.toLowerCase();
    return titles.find(t => lower.includes(t.toLowerCase())) ?? null;
  }

  static sentimentScore(text: string): number {
    const pos = ['great','amazing','excellent','proud','happy','love','crushing','nailed','momentum','progress','strong','fired up','excited','killing'];
    const neg = ['fail','miss','skip','struggle','hard','tired','exhausted','quit','behind','stuck','overwhelmed','can\'t','lost','frustrated'];
    let score = 0;
    const words = text.toLowerCase().split(/\s+/);
    words.forEach(w => {
      if (pos.some(p => w.includes(p))) score++;
      if (neg.some(n => w.includes(n))) score--;
    });
    return Math.max(-5, Math.min(5, score));
  }
}
