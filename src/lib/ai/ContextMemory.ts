import { AIMessage } from './types';

interface MemStore {
  messages:       AIMessage[];
  topTopics:      string[];
  toneStyle:      'direct' | 'gentle' | 'scientific' | 'unknown';
  sessionCount:   number;
  lastBriefDate:  string;
  streakRecord:   number;
}

const KEY = 'omnilife_memory_v2';
const MAX = 50;

export class ContextMemory {
  private s: MemStore;

  constructor() { this.s = this.load(); }

  private load(): MemStore {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return { messages:[], topTopics:[], toneStyle:'unknown', sessionCount:0, lastBriefDate:'', streakRecord:0 };
  }

  private persist() {
    try { localStorage.setItem(KEY, JSON.stringify(this.s)); } catch {}
  }

  addMessage(m: AIMessage) {
    this.s.messages.push(m);
    if (this.s.messages.length > MAX)
      this.s.messages = this.s.messages.slice(-MAX);
    this.persist();
  }

  getHistory() { return this.s.messages; }

  learnFromJournal(entries: { content: string; tags: string[] }[]) {
    const freq: Record<string, number> = {};
    entries.forEach(e => e.tags.forEach(t => { freq[t] = (freq[t]||0)+1; }));
    this.s.topTopics = Object.entries(freq)
      .filter(([,v]) => v >= 2).sort((a,b) => b[1]-a[1]).slice(0,6).map(([k]) => k);
    this.s.sessionCount++;

    const posWords = ['excited','grateful','proud','energised','focused','strong','amazing','great'];
    const negWords = ['tired','stressed','overwhelmed','anxious','distracted','struggling'];
    let pos = 0, neg = 0;
    entries.slice(0, 20).forEach(e => {
      const l = e.content.toLowerCase();
      posWords.forEach(w => { if (l.includes(w)) pos++; });
      negWords.forEach(w => { if (l.includes(w)) neg++; });
    });
    if (pos > neg * 1.5)      this.s.toneStyle = 'direct';
    else if (neg > pos * 1.5) this.s.toneStyle = 'gentle';
    else                       this.s.toneStyle = 'unknown';

    this.persist();
  }

  updateStreakRecord(n: number) {
    if (n > this.s.streakRecord) { this.s.streakRecord = n; this.persist(); }
  }

  getToneStyle()      { return this.s.toneStyle; }
  getTopTopics()      { return this.s.topTopics; }
  getStreakRecord()   { return this.s.streakRecord; }
  getSessionCount()   { return this.s.sessionCount; }
  alreadyBriefedToday() { return this.s.lastBriefDate === new Date().toISOString().split('T')[0]; }
  markBriefedToday()    { this.s.lastBriefDate = new Date().toISOString().split('T')[0]; this.persist(); }
  reset()               { this.s = { messages:[], topTopics:[], toneStyle:'unknown', sessionCount:0, lastBriefDate:'', streakRecord:0 }; this.persist(); }
}
