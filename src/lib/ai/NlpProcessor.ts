/**
 * OMNILIFE NLP Processor Client interface
 * Features multi-device and iframe sandbox safety with local in-memory NLP engines
 */

export interface AnalysisResult {
  sentiment: number; // -1.0 to 1.0
  label: string;
  keywords: string[];
  moodScore: number; // 1 to 5
}

// In-memory processor for high speed fallback on platforms rejecting web-workers natively
const VALENCE_LEXICON: Record<string, number> = {
  great: 4, awesome: 4, fantastic: 4, happy: 3, proud: 3, excited: 3, energised: 4, energized: 4,
  productive: 3, progress: 3, completed: 3, accomplished: 3, success: 3, joyful: 4,
  good: 2, amazing: 4, loved: 3, healthy: 2.5, peaceful: 3, focused: 3, clear: 2, helpful: 2,
  gym: 2, workout: 2, learn: 2, grateful: 4, thankful: 3, relax: 2, active: 2, win: 3, coding: 2,
  sad: -3, angry: -4, bad: -2, terrible: -4, awful: -4, tired: -2, exhausted: -2,
  lazy: -2, procrastinated: -3, missed: -2, failed: -3, struggle: -2, hard: -1, difficult: -1.5,
  anxious: -3, depressed: -4, stress: -3, stressed: -3, sick: -3.5, pain: -3,
  waste: -2, regret: -3.5, hate: -3, unhappy: -3
};

const STOPWORDS = new Set([
  'i', 'me', 'my', 'myself', 'we', 'our', 'you', 'your', 'he', 'him', 'his', 'she', 'her', 'it', 'its',
  'they', 'them', 'their', 'what', 'which', 'who', 'this', 'that', 'these', 'those', 'am', 'is', 'are',
  'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'doing', 'a', 'an', 'the',
  'and', 'but', 'if', 'or', 'of', 'at', 'by', 'for', 'with', 'about', 'to', 'from', 'in', 'out', 'on', 'off'
]);

function computeFallback(text: string): AnalysisResult {
  if (!text || typeof text !== 'string') {
    return { sentiment: 0, label: 'Neutral', keywords: [], moodScore: 3 };
  }

  const cleanText = text.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ' ');
  const words = cleanText.split(/\s+/).filter(Boolean);

  let cumulativeValence = 0;
  let matchesCount = 0;
  let negationActive = false;
  const keywordsFreq: Record<string, number> = {};

  for (let i = 0; i < words.length; i++) {
    const word = words[i];

    if (word === 'not' || word === "didn't" || word === "don't" || word === "never" || word === "no") {
      negationActive = true;
      continue;
    }

    if (!STOPWORDS.has(word) && word.length > 2) {
      keywordsFreq[word] = (keywordsFreq[word] || 0) + 1;
    }

    let valenceScore = 0;
    if (VALENCE_LEXICON[word] !== undefined) {
      valenceScore = VALENCE_LEXICON[word];
    }

    if (valenceScore !== 0) {
      if (negationActive) {
        valenceScore *= -0.8;
        negationActive = false;
      }
      cumulativeValence += valenceScore;
      matchesCount++;
    }
  }

  const normalized = matchesCount > 0 ? Math.max(-1.0, Math.min(1.0, cumulativeValence / (matchesCount * 2))) : 0.0;
  const suggestedMood = Math.round(((normalized + 1.0) / 2.0) * 4) + 1;

  let label = 'Neutral';
  if (normalized > 0.15) label = 'Positive';
  if (normalized > 0.5) label = 'Highly Positive';
  if (normalized < -0.15) label = 'Negative';
  if (normalized < -0.5) label = 'Highly Negative';

  const sortedKeywords = Object.entries(keywordsFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(entry => entry[0]);

  return {
    sentiment: Number(normalized.toFixed(2)),
    label,
    keywords: sortedKeywords,
    moodScore: suggestedMood
  };
}

class NlpProcessorClient {
  private worker: Worker | null = null;
  private pendingCallbacks: Map<string, (res: AnalysisResult) => void> = new Map();

  constructor() {
    this.initWorker();
  }

  private initWorker() {
    if (typeof window === 'undefined' || !window.Worker) return;

    try {
      // Initialize module-typed worker via Vite standard syntax
      this.worker = new Worker(
        new URL('../../workers/nlpWorker.ts', import.meta.url),
        { type: 'module' }
      );

      this.worker.onmessage = (event) => {
        const { action, data } = event.data;
        if (action === 'ANALYSIS_RESULT') {
          // Send to first pending callback or trigger global listener
          const iterator = this.pendingCallbacks.entries().next();
          if (!iterator.done) {
            const [key, callback] = iterator.value;
            callback(data);
            this.pendingCallbacks.delete(key);
          }
        }
      };

      this.worker.onerror = (err) => {
        console.warn('NLP Web Worker encountered a sandboxing error. Gracefully running local fallback...', err);
        this.worker = null;
      };
    } catch (e) {
      console.warn('Failed to spin up separate NLP worker thread: standard sandbox restriction inside preview iframes. Operating on safe fallback loop.', e);
      this.worker = null;
    }
  }

  public async analyzeText(text: string): Promise<AnalysisResult> {
    if (!text.trim()) {
      return { sentiment: 0, label: 'Neutral', keywords: [], moodScore: 3 };
    }

    if (this.worker) {
      return new Promise((resolve) => {
        const id = Math.random().toString(36).substring(2, 9);
        this.pendingCallbacks.set(id, resolve);
        this.worker!.postMessage({ action: 'ANALYZE_TEXT', text });
        
        // Safety timeout to avoid getting stuck if Worker thread dies
        setTimeout(() => {
          if (this.pendingCallbacks.has(id)) {
            this.pendingCallbacks.delete(id);
            resolve(computeFallback(text));
          }
        }, 150);
      });
    }

    // Direct synchronous calculation
    return computeFallback(text);
  }
}

export const nlpProcessor = new NlpProcessorClient();
