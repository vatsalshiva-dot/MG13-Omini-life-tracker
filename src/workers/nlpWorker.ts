/**
 * OmniLife Offline NLP Processing Daemon (Web Worker Thread)
 * 100% Offline | Zero Main-Thread Lag | High-Fidelity Heuristics
 */

interface SentimentLexicon {
  [word: string]: number;
}

// Optimized Lexicon with emotional valence mappings for health, productivity, and mindfulness
const VALENCE_LEXICON: SentimentLexicon = {
  // Positive markers
  great: 4, awesome: 4, fantastic: 4, happy: 3, proud: 3, excited: 3, energised: 4, energized: 4,
  productive: 3, progress: 3, completed: 3, did: 1.5, accomplished: 3, success: 3, joyful: 4,
  good: 2, amazing: 4, loved: 3, healthy: 2.5, peaceful: 3, focused: 3, clear: 2, helpful: 2,
  gym: 2, workout: 2, learn: 2, grateful: 4, thankful: 3, relax: 2, active: 2, win: 3, coding: 2,
  // Negative markers
  sad: -3, angry: -4, furious: -4, bad: -2, terrible: -4, awful: -4, tired: -2, exhausted: -2,
  lazy: -2, procrastinated: -3, missed: -2, failed: -3, struggle: -2, hard: -1, difficult: -1.5,
  anxious: -3, depressed: -4, stress: -3, stressed: -3, hurt: -3, sick: -3.5, pain: -3, headach: -2.5,
  waste: -2, regret: -3.5, delay: -1.5, lonely: -3, hate: -3, bore: -1.5, unhappy: -3,
  // Modifiers (shifters / multipliers)
  very: 1.5, highly: 1.8, basic: 0.8, slightly: 0.6, not: -1 // Negation
};

const STOPWORDS = new Set([
  'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your', 'yours', 
  'he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself', 'it', 'its', 'itself', 
  'they', 'them', 'their', 'theirs', 'themselves', 'what', 'which', 'who', 'whom', 'this', 
  'that', 'these', 'those', 'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 
  'has', 'had', 'having', 'do', 'does', 'did', 'doing', 'a', 'an', 'the', 'and', 'but', 
  'if', 'or', 'because', 'as', 'until', 'while', 'of', 'at', 'by', 'for', 'with', 'about', 
  'against', 'between', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 
  'to', 'from', 'up', 'down', 'in', 'out', 'on', 'off', 'over', 'under', 'again', 'further', 
  'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'any', 'both', 
  'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 
  'same', 'so', 'than', 'too', 'very', 's', 't', 'can', 'will', 'just', 'don', 'should', 'now'
]);

self.onmessage = function (e: MessageEvent) {
  const { action, text, context } = e.data;

  if (action === 'ANALYZE_TEXT') {
    const analysis = performAnalysis(text);
    self.postMessage({ action: 'ANALYSIS_RESULT', data: analysis });
  }
};

function performAnalysis(text: string) {
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

    // Simple negation look-ahead or trigger
    if (word === 'not' || word === "didn't" || word === "don't" || word === "never" || word === "no") {
      negationActive = true;
      continue;
    }

    // Keyword collection
    if (!STOPWORDS.has(word) && word.length > 2) {
      keywordsFreq[word] = (keywordsFreq[word] || 0) + 1;
    }

    // Lookup word or root word in lexicon
    let valenceScore = 0;
    if (VALENCE_LEXICON[word] !== undefined) {
      valenceScore = VALENCE_LEXICON[word];
    } else {
      // Basic stemming fallback
      const root = word.slice(0, -1);
      if (VALENCE_LEXICON[root] !== undefined) {
        valenceScore = VALENCE_LEXICON[root];
      }
    }

    if (valenceScore !== 0) {
      if (negationActive) {
        valenceScore *= -0.8; // Reverse & damp sentiment
        negationActive = false;
      }
      cumulativeValence += valenceScore;
      matchesCount++;
    }
  }

  // Calculate dynamic average sentiment score normalized from -1.0 to 1.0
  const normalizedSentiment = matchesCount > 0 ? Math.max(-1.0, Math.min(1.0, cumulativeValence / (matchesCount * 2))) : 0.0;
  
  // Mood level suggestion (scale 1 to 5)
  // mapped from -1.0..1.0 onto 1..5
  const suggestedMood = Math.round(((normalizedSentiment + 1.0) / 2.0) * 4) + 1;

  let label = 'Neutral';
  if (normalizedSentiment > 0.15) label = 'Positive';
  if (normalizedSentiment > 0.5) label = 'Highly Positive';
  if (normalizedSentiment < -0.15) label = 'Negative';
  if (normalizedSentiment < -0.5) label = 'Highly Negative';

  // Sort keywords
  const sortedKeywords = Object.entries(keywordsFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(entry => entry[0]);

  return {
    sentiment: Number(normalizedSentiment.toFixed(2)),
    label,
    keywords: sortedKeywords,
    moodScore: suggestedMood
  };
}
