import ReactMarkdown from 'react-markdown';
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
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.2}}`}</style>
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
