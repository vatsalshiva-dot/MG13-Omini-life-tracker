import fs from 'fs';
import path from 'path';

const files = {
  'src/lib/ai/index.ts': `export { LocalAI }       from './LocalAI';
export { DataAnalyzer }  from './DataAnalyzer';
export { NLPRouter }     from './NLPRouter';
export { ContextMemory } from './ContextMemory';
export { adaptToOmniData } from './DataAdapter';
export type { OmniData, AIResponse, Intent, AnalysisResult } from './types';
`,
  'src/lib/storage.ts': `const APP_KEY = 'omnilife_app_v1';

export function saveApp(data: any) {
  try { localStorage.setItem(APP_KEY, JSON.stringify(data)); } catch {}
}
export function loadApp<T>(defaults: T): T {
  try {
    const raw = localStorage.getItem(APP_KEY);
    if (raw) return { ...defaults, ...JSON.parse(raw) };
  } catch {}
  return defaults;
}
export function clearApp() { localStorage.removeItem(APP_KEY); }
`,
  'src/hooks/useLocalAI.ts': `import { useState, useEffect, useRef } from 'react';
import { LocalAI, OmniData, AIResponse, adaptToOmniData } from '../lib/ai';

export function useLocalAI(rawData: any) {
  const data: OmniData = adaptToOmniData(rawData);
  const aiRef = useRef<LocalAI | null>(null);
  const keyRef = useRef('');

  const key = \`\${data.habits.length}-\${data.goals.length}-\${data.moods.length}-\${data.journal.length}\`;
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
`,
  'src/components/AIResponsePanel.tsx': `import ReactMarkdown from 'react-markdown';
import { AIResponse } from '../lib/ai';

interface Props {
  response: AIResponse | null;
  loading:  boolean;
  error?:   string | null;
  className?: string;
}

export function AIResponsePanel({ response, loading, error, className = '' }: Props) {
  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', gap:8, padding:'16px 0', opacity:0.6 }}>
      <span style={{ animation:'pulse 1.2s ease-in-out infinite' }}>●</span>
      <span style={{ animation:'pulse 1.2s ease-in-out infinite 0.2s' }}>●</span>
      <span style={{ animation:'pulse 1.2s ease-in-out infinite 0.4s' }}>●</span>
      <span style={{ fontSize:12, marginLeft:8 }}>OmniLife AI thinking...</span>
      <style>{\`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.2}}\`}</style>
    </div>
  );
  if (error)    return <div style={{ color:'#ff4444', padding:8, borderRadius:6, background:'rgba(255,68,68,.08)' }}>⚠ {error}</div>;
  if (!response) return null;

  return (
    <div className={className} style={{ lineHeight: 1.75 }}>
      <ReactMarkdown>{response.content}</ReactMarkdown>
      {response.score !== undefined && (
        <div style={{ marginTop:12, fontSize:11, opacity:0.45 }}>
          Consistency score: {response.score}% · Source: local AI engine
        </div>
      )}
    </div>
  );
}
`,
};

for (const [filepath, content] of Object.entries(files)) {
  fs.mkdirSync(path.dirname(filepath), { recursive: true });
  fs.writeFileSync(filepath, content);
  console.log('Created ' + filepath);
}
