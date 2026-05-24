const fs = require('fs');

const replacements = {
  'bg-zinc-950': 'bg-[#0d0d1a]',
  'bg-zinc-900': 'bg-[#111120]',
  'bg-zinc-850': 'bg-[#1e1e38]',
  'bg-zinc-800': 'bg-[#111120]', // or #2a2a50
  'bg-zinc-805': 'bg-[#1e1e38]',
  
  'border-zinc-950': 'border-[#0d0d1a]',
  'border-zinc-900': 'border-[#111120]',
  'border-zinc-850': 'border-[#1e1e38]',
  'border-zinc-805': 'border-[#1e1e38]',
  'border-zinc-800': 'border-[#2a2a50]',
  'border-zinc-750': 'border-[#2a2a50]',
  'border-zinc-700': 'border-slate-700',
  
  'text-zinc-650': 'text-slate-600',
  'text-zinc-600': 'text-slate-600',
  'text-zinc-550': 'text-slate-500',
  'text-zinc-555': 'text-slate-500',
  'text-zinc-500': 'text-slate-500',
  'text-zinc-450': 'text-slate-400',
  'text-zinc-400': 'text-slate-400',
  'text-zinc-405': 'text-slate-400',
  'text-zinc-350': 'text-slate-300',
  'text-zinc-300': 'text-slate-300',
  'text-zinc-250': 'text-slate-200',
  'text-zinc-200': 'text-slate-200',
  'text-zinc-205': 'text-slate-200',
  'text-zinc-100': 'text-slate-100',
  
  'hover:border-zinc-750': 'hover:border-[#2a2a50]',
  'hover:border-zinc-700': 'hover:border-slate-700',
  'hover:bg-zinc-800': 'hover:bg-[#111120]',
  'hover:bg-zinc-900': 'hover:bg-[#111120]',
  'hover:bg-zinc-950': 'hover:bg-[#0d0d1a]',
  'hover:text-zinc-200': 'hover:text-slate-200',

  'bg-indigo-650': 'bg-[#ff6b1a]',
  'bg-indigo-600': 'bg-[#ff6b1a]',
  'bg-indigo-550': 'bg-[#ff9040]',
  'bg-indigo-505': 'bg-[#ff6b1a]',
  'bg-indigo-500': 'bg-[#ff6b1a]',
  'bg-indigo-450': 'bg-[#00d4ff]',
  'text-indigo-405': 'text-[#ff6b1a]',
  'text-indigo-400': 'text-[#ff6b1a]',
  'text-indigo-300': 'text-[#00d4ff]',
  'border-indigo-500': 'border-[#ff6b1a]',
  'border-indigo-400': 'border-[#ff6b1a]',
  'border-l-indigo-500': 'border-l-[#ff6b1a]',
};

const files = ['src/App.tsx', 'src/index.css', 'src/components/DashboardView.tsx', 'src/components/DailyTrackerView.tsx', 'src/components/JournalView.tsx', 'src/components/Sidebar.tsx'];

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf-8');
  for (const [k, v] of Object.entries(replacements)) {
    content = content.split(k).join(v);
  }
  
  content = content.replace(/zinc-950/g, '[#0d0d1a]')
                   .replace(/zinc-900/g, '[#111120]')
                   .replace(/zinc-850/g, '[#1e1e38]')
                   .replace(/zinc-800/g, '[#2a2a50]')
                   .replace(/zinc-500/g, 'slate-500')
                   .replace(/zinc-400/g, 'slate-400')
                   .replace(/zinc-300/g, 'slate-300')
                   .replace(/zinc-200/g, 'slate-200');

  fs.writeFileSync(f, content);
});

console.log('done');
