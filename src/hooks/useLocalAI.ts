import { useState, useEffect, useRef } from 'react';
import { LocalAI, OmniData, AIResponse, adaptToOmniData } from '../lib/ai';

export function useLocalAI(rawData: any) {
  const data: OmniData = adaptToOmniData(rawData);
  const aiRef = useRef<LocalAI | null>(null);
  const keyRef = useRef('');

  const key = `${data.habits.length}-${data.goals.length}-${data.moods.length}-${data.journal.length}`;
  if (key !== keyRef.current || !aiRef.current) {
    aiRef.current = new LocalAI(data);
    keyRef.current = key;
  }
  const ai = aiRef.current;

  return {
    query:    (msg: string)        => ai.query(msg),
    analyze:  ()                   => ai.fullAnalysis(),
    journal:  ()                   => ai.journalPrompt(),
    morning:  ()                   => ai.briefing('morning'),
    evening:  ()                   => ai.briefing('evening'),
    goals:    (g?: string)         => ai.goalAnalysis(g ?? null),
    habits:   (h?: string)         => ai.habitDeep(h ?? null),
    mood:     ()                   => ai.moodInsight(),
    motivate: ()                   => ai.motivation(),
    week:     ()                   => ai.weekSummary(),
    science:  ()                   => ai.scienceInsight(),
  };
}

// Convenience hook with loading state
export function useAIQuery(rawData: any) {
  const ai = useLocalAI(rawData);
  const [response, setResponse]  = useState<AIResponse | null>(null);
  const [loading,  setLoading]   = useState(false);
  const [error,    setError]     = useState<string | null>(null);

  const run = async (fn: () => Promise<AIResponse>) => {
    setLoading(true); setError(null);
    try   { setResponse(await fn()); }
    catch (e) { setError('AI error — check console'); console.error(e); }
    finally   { setLoading(false); }
  };

  return {
    response, loading, error,
    analyze:  ()    => run(ai.analyze),
    journal:  ()    => run(ai.journal),
    morning:  ()    => run(ai.morning),
    evening:  ()    => run(ai.evening),
    query:    (msg: string) => run(() => ai.query(msg)),
    week:     ()    => run(ai.week),
    motivate: ()    => run(ai.motivate),
  };
}
