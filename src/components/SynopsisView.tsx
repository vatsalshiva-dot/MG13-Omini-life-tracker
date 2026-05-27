import React, { useState } from 'react';
import { AppState, TrackerCategory } from '../types';
import { fmtShort, fmtDate, todayStr, getWeek } from '../utils/date';
import {  CATS , getCatLabel } from '../utils/storage';
import { Share2, Copy, FileText, Printer, Download, BookOpen, Layout, Globe, Mail, Calendar } from 'lucide-react';

interface SynopsisViewProps {
  state: AppState;
  date: string;
  dayStats: (ds: string) => {
    done: number;
    missed: number;
    pending: number;
    skipped: number;
    total: number;
    hrs: number;
    reps: number;
    sat: number;
    pct: number;
  };
  getDayD: (ds: string, cat: TrackerCategory, item: string) => any;
}

export const SynopsisView: React.FC<SynopsisViewProps> = ({
  state,
  date: viewportDate,
  dayStats,
  getDayD
}) => {
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'year'>('today');
  const today = viewportDate;

  // Calculate matching dates
  const dates = React.useMemo(() => {
    if (period === 'today') return [today];
    if (period === 'week') {
      const wDays = getWeek(today);
      return wDays.filter(d => d <= today);
    }
    if (period === 'month') {
      const arr: string[] = [];
      const dVal = new Date(today + 'T00:00:00');
      const month = dVal.getMonth();
      const year = dVal.getFullYear();
      const dim = new Date(year, month + 1, 0).getDate();
      for (let d = 1; d <= dim; d++) {
        const ds = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        if (ds <= today) arr.push(ds);
      }
      return arr;
    }
    // Year
    const arr: string[] = [];
    const dVal = new Date(today + 'T00:00:00');
    const year = dVal.getFullYear();
    for (let m = 0; m < 12; m++) {
      const dim = new Date(year, m + 1, 0).getDate();
      for (let d = 1; d <= dim; d++) {
        const ds = `${year}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        if (ds <= today) arr.push(ds);
      }
    }
    return arr;
  }, [period, today]);

  // Aggregate stats
  const stats = React.useMemo(() => {
    let done = 0;
    let missed = 0;
    let pending = 0;
    let skipped = 0;
    let total = 0;
    let hrs = 0;
    let reps = 0;
    let satSum = 0;
    let satCnt = 0;
    
    let totalIncome = 0;
    let totalSpent = 0;
    
    (state.finances || []).forEach(tx => {
       if (dates.includes(tx.date)) {
           if (tx.type === 'income') totalIncome += tx.amount;
           else totalIncome -= 0;
           if (tx.type === 'expense') totalSpent += tx.amount;
       }
    });

    const catD: Record<string, { done: number; total: number; hrs: number; reps: number }> = {};
    CATS.forEach(c => {
      catD[c.id] = { done: 0, total: 0, hrs: 0, reps: 0 };
    });

    dates.forEach(ds => {
      CATS.forEach(cat => {
        (state.items[cat.id] || []).forEach(item => {
          const d = getDayD(ds, cat.id, item);
          const s = d ? d.status : 'pending';

          total++;
          catD[cat.id].total++;

          if (s === 'done') {
            done++;
            catD[cat.id].done++;
          } else if (s === 'missed') {
            missed++;
          } else if (s === 'skipped') {
            skipped++;
          } else {
            pending++;
          }

          const hOffset = d ? (d.hours || 0) : 0;
          const rOffset = d ? (d.reps || 0) : 0;
          hrs += hOffset;
          reps += rOffset;
          catD[cat.id].hrs += hOffset;
          catD[cat.id].reps += rOffset;

          if (d && d.satisfaction > 0) {
            satSum += d.satisfaction;
            satCnt++;
          }
        });
      });
    });

    // Best day
    let bestDayDate = '';
    let bestDayPct = -1;
    dates.forEach(d => {
      const ds = dayStats(d);
      if (ds.pct > bestDayPct) {
        bestDayPct = ds.pct;
        bestDayDate = d;
      }
    });

    return {
      done,
      missed,
      pending,
      skipped,
      total,
      hrs,
      reps,
      sat: satCnt ? (satSum / satCnt).toFixed(1) : '—',
      pct: total ? Math.round((done / total) * 100) : 0,
      catD,
      bestDay: bestDayDate ? { date: bestDayDate, pct: bestDayPct } : null,
      days: dates.length,
      totalIncome,
      totalSpent
    };
  }, [dates, state, getDayD, dayStats]);

  // Compiled Report generator body
  const compiledReportText = React.useMemo(() => {
    const prof = state.profile || { name: 'Focus User', tagline: 'Self Tracker' };
    const dateLabel = period === 'today' ? `TODAY · ${fmtShort(today)}` : `RANGE: ${fmtShort(dates[0])} – ${fmtShort(today)}`;
    
    const lines = [
      '╔══════════════════════════════════════╗',
      `  LIFE TRACKER — ${dateLabel}`,
      `  ${(prof.name || 'USER').toUpperCase()} · ${(prof.tagline || 'TRACKER').toUpperCase()}`,
      '╚══════════════════════════════════════╝',
      '',
      `✅ DONE     : ${stats.done} / ${stats.total} (${stats.pct}%)`,
      `❌ MISSED   : ${stats.missed}`,
      `⏱ Hours    : ${stats.hrs.toFixed(1)}h`,
      `🔁 Reps     : ${stats.reps}`,
      `😊 Sat      : ${stats.sat}/5`,
      `📅 Days     : ${stats.days}`,
      '',
      `💵 INCOME   : $${stats.totalIncome.toFixed(2)}`,
      `💸 SPENT    : $${stats.totalSpent.toFixed(2)}`,
      `🏷️ PROFIT   : $${(stats.totalIncome - stats.totalSpent).toFixed(2)}`,
      '',
      '── CATEGORY SUMMARY BREAKDOWN ─────────'
    ];

    CATS.forEach(c => {
      const cd = stats.catD[c.id];
      const pct = cd.total ? Math.round((cd.done / cd.total) * 100) : 0;
      const barCount = Math.round(pct / 10);
      let bar = '';
      for (let i = 0; i < 10; i++) bar += i < barCount ? '█' : '░';
      lines.push(`${c.icon} ${getCatLabel(state, c.id).slice(0, 10).padEnd(10)} [${bar}] ${pct}%  ${cd.hrs.toFixed(1)}h  ×${cd.reps}`);
    });

    if (stats.bestDay) {
      lines.push('');
      lines.push(`🏆 BEST DAY  : ${fmtShort(stats.bestDay.date)} (${stats.bestDay.pct}%)`);
    }

    const pendingTodayItems: string[] = [];
    CATS.forEach(c => {
      (state.items[c.id] || []).forEach(it => {
        if (getDayD(today, c.id, it).status === 'pending') {
          pendingTodayItems.push(`  • ${it} [${getCatLabel(state, c.id)}]`);
        }
      });
    });

    if (pendingTodayItems.length > 0) {
      lines.push('');
      lines.push('── STILL PENDING ACTIONS TODAY ────────');
      pendingTodayItems.slice(0, 5).forEach(p => lines.push(p));
      if (pendingTodayItems.length > 5) {
        lines.push(`  ... and ${pendingTodayItems.length - 5} more elements pending`);
      }
    }

    lines.push('');
    lines.push('──────────────────────────────────────');
    lines.push(`Generated: ${new Date().toLocaleString('en-IN')}`);
    lines.push('Life Tracker // Precision Sync v5');

    return lines.join('\n');
  }, [period, today, dates, stats, state, getDayD]);

  // Clipboard copies
  const handleCopyReport = () => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(compiledReportText);
      alert('Report copied to clipboard succeeded!');
    } else {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = compiledReportText;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      alert('Report copied to clipboard!');
    }
  };

  // Whatsapp shares
  const handleShareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(compiledReportText)}`, '_blank');
  };

  // Notion Markdown copy
  const handleCopyNotionMarkdown = () => {
    const lines = [
      `## 📊 Life Tracker Range Report — ${period.toUpperCase()}`,
      `Generated: ${new Date().toLocaleDateString()}`,
      '',
      '| Tracker Metric | Aggregate Value |',
      '|---|---|',
      `| ✅ Done tasks checkins | **${stats.done}** / ${stats.total} (${stats.pct}%) |`,
      `| ✗ Missed counts | **${stats.missed}** |`,
      `| ⏱ Focused Hours | **${stats.hrs.toFixed(1)}h** |`,
      `| 🔁 Finished Reps | **${stats.reps}** |`,
      `| Avg Rating Satisfaction | **${stats.sat} / 5** |`,
      `| Scoped Days Sample | **${stats.days} days** |`,
      `| 💵 Total Income    | **$${stats.totalIncome.toFixed(2)}** |`,
      `| 💸 Total Spent     | **$${stats.totalSpent.toFixed(2)}** |`,
      `| 🏷️ Net Profit      | **$${(stats.totalIncome - stats.totalSpent).toFixed(2)}** |`,
      '',
      '### Category Progression Summary',
      ''
    ];

    CATS.forEach(c => {
      const cd = stats.catD[c.id];
      const pct = cd.total ? Math.round((cd.done / cd.total) * 100) : 0;
      lines.push(`- **${c.icon} ${getCatLabel(state, c.id)}** : ${cd.done}/${cd.total} finished (**${pct}%**) · Logged **${cd.hrs.toFixed(1)}h** · Completed **${cd.reps}** reps`);
    });

    const mdown = lines.join('\n');
    navigator.clipboard.writeText(mdown).then(() => {
      alert('Notion markdown tabular data copied successfully!');
    });
  };

  // Download .ics Calendar Exporter helper
  const handleExportICS = () => {
    const list = state.reminders;
    if (list.length === 0) {
      alert('No custom calendar events / reminders created to compile.');
      return;
    }

    const pad = (n: number) => String(n).padStart(2, '0');
    
    const eventsText = list.map(rem => {
      const nowStr = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 15) + 'Z';
      
      const dateParts = rem.dueDate.split('-'); // YYYY-MM-DD
      const dateForm = dateParts.join('');

      let dtstart = dateForm;
      let allDay = true;
      if (rem.time) {
        allDay = false;
        dtstart += 'T' + rem.time.replace(':', '') + '00';
      }

      return [
        'BEGIN:VEVENT',
        `UID:${rem.id}@lt5.cloudservice`,
        `DTSTAMP:${nowStr}`,
        allDay ? `DTSTART;VALUE=DATE:${dtstart}` : `DTSTART:${dtstart}`,
        `SUMMARY:${rem.title.replace(/[,;]/g, ' ')}`,
        `DESCRIPTION:Category: ${rem.type} · Priority: ${rem.priority} · Notes: ${rem.notes || 'none'}`,
        `PRIORITY:${rem.priority === 'high' ? '1' : rem.priority === 'medium' ? '5' : '9'}`,
        'END:VEVENT'
      ].join('\r\n');
    }).join('\r\n');

    const calendarTemplate = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//LifeTracker v5 CalSync//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      eventsText,
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([calendarTemplate], { type: 'text/calendar;charset=utf-8' });
    const u = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = u;
    link.download = `lifetracker_calendar_${todayStr()}.ics`;
    link.click();
    URL.revokeObjectURL(u);
    alert('iCalendar calsync compiled package downloaded! You can import this directly into Google Calendar, Apple Calendar, Mac, Windows, or Outlook.');
  };

  return (
    <div className="space-y-6">
      {/* Header and Switches */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#1e1e38] pb-4">
        <div>
          <h2 className="text-xl font-extrabold tracking-wider text-[#ff6b1a]">
            SYNOPSIS & <span className="text-slate-100 font-extrabold">REPORTING</span>
          </h2>
          <p className="text-xs uppercase tracking-widest text-slate-500 mt-1">
            COMPILE DIGESTS · PRINT PERIODIC PERFORMANCE · GENERATE REAL-WORLD CALENDAR EXPORTS
          </p>
        </div>

        <div className="flex p-1 bg-[#0d0d1a] border border-[#1e1e38] rounded-xl self-start sm:self-center select-none">
          {(['today', 'week', 'month', 'year'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider transition ${
                period === p ? 'bg-[#ff6b1a] text-black' : 'text-slate-400 hover:text-slate-100'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Grid boxes summaries */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        <div className="bg-[#0d0d1a] border border-[#1e1e38] p-3 rounded-lg text-center">
          <span className="text-[10px] tracking-widest text-slate-500 font-semibold block uppercase">DONE ACTION TARGETS</span>
          <span className="text-xl font-black mt-1 text-emerald-400">{stats.done} Checkins</span>
        </div>
        <div className="bg-[#0d0d1a] border border-[#1e1e38] p-3 rounded-lg text-center">
          <span className="text-[10px] tracking-widest text-slate-500 font-semibold block uppercase">PERCENTAGE PERFORMANCE</span>
          <span className="text-xl font-black mt-1 text-[#ff6b1a]">{stats.pct}%</span>
        </div>
        <div className="bg-[#0d0d1a] border border-[#1e1e38] p-3 rounded-lg text-center">
          <span className="text-[10px] tracking-widest text-slate-500 font-semibold block uppercase">TIME REACHED</span>
          <span className="text-xl font-black mt-1 text-[#00d4ff]">{stats.hrs.toFixed(1)}h</span>
        </div>
        <div className="bg-[#0d0d1a] border border-[#1e1e38] p-3 rounded-lg text-center">
          <span className="text-[10px] tracking-widest text-slate-500 font-semibold block uppercase">TOTAL REPS</span>
          <span className="text-xl font-black mt-1 text-[#aa44ff]">{stats.reps} cycles</span>
        </div>
        <div className="bg-[#0d0d1a] border border-[#1e1e38] p-3 rounded-lg text-center">
          <span className="text-[10px] tracking-widest text-[#00ff88] font-semibold block uppercase">TOTAL INCOME</span>
          <span className="text-xl font-black mt-1 text-[#00ff88] font-mono">${stats.totalIncome.toFixed(0)}</span>
        </div>
        <div className="bg-[#0d0d1a] border border-[#1e1e38] p-3 rounded-lg text-center">
          <span className="text-[10px] tracking-widest text-[#ff00a0] font-semibold block uppercase">TOTAL SPENT</span>
          <span className="text-xl font-black mt-1 text-[#ff00a0] font-mono">${stats.totalSpent.toFixed(0)}</span>
        </div>
      </div>

      {/* Row: categories summary progression */}
      <div className="bg-[#0d0d1a] border border-[#1e1e38] rounded-xl p-4 space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 border-b border-[#111120] pb-2">
          Category progress digests
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {CATS.map(c => {
            const cd = stats.catD[c.id];
            const pct = cd.total ? Math.round((cd.done / cd.total) * 100) : 0;
            return (
              <div key={c.id} className="p-3 bg-[#111120] border border-[#1e1e38] rounded-lg space-y-1.5 hover:border-slate-800 transition">
                <div className="flex text-xs font-bold uppercase justify-between">
                  <span style={{ color: c.neon }} className="font-extrabold flex items-center gap-1">
                    {c.icon} {getCatLabel(state, c.id)}
                  </span>
                  <span className="text-slate-400 font-mono">
                    {cd.done}/{cd.total} done ({pct}%)
                  </span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-[#1e1e38]">
                  <div className="h-full rounded-full" style={{ backgroundColor: c.neon, width: `${pct}%` }} />
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono uppercase font-semibold">
                  <span>Hours focus: {cd.hrs.toFixed(1)}h</span>
                  <span>Reps Count: ×{cd.reps}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Row Report block */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Printable ASCII Frame desk */}
        <div className="bg-[#0d0d1a] border border-[#1e1e38] rounded-xl p-4 lg:col-span-2 flex flex-col justify-between">
          <div className="flex justify-between items-center border-b border-[#111120] pb-2 mb-3.5">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <FileText size={13} className="text-[#ff6b1a]" />
              ASCII TEXT PERFORMANCE LOG
            </h3>
            
            <button 
              onClick={handleCopyReport}
              className="text-[10px] text-slate-400 hover:text-white uppercase font-bold flex items-center gap-1"
            >
              <Copy size={11} />
              Copy Report
            </button>
          </div>

          <pre className="w-full bg-[#111120] border border-[#1e1e38] rounded-xl p-4 text-[9px] text-[#00ff88] leading-relaxed overflow-x-auto select-text font-mono max-h-[200px]">
            {compiledReportText}
          </pre>

          <div className="flex gap-2.5 mt-3 select-none">
            <button 
              onClick={handleCopyReport}
              className="flex-1 py-1.5 bg-[#ff6b1a] text-black font-extrabold text-[10px] uppercase tracking-wider rounded border border-[#ff6b1a] hover:bg-[#ff9040]"
            >
              📋 COPY SUMMARY
            </button>
            <button 
              onClick={handleShareWhatsApp}
              className="flex-1 py-1.5 bg-transparent border border-emerald-500 text-emerald-400 text-[10px] uppercase font-bold rounded hover:bg-emerald-500/10 transition"
            >
              💬 WHATSAPP
            </button>
            <button 
              onClick={() => window.open(`https://t.me/share/url?url=&text=${encodeURIComponent(compiledReportText)}`, '_blank')}
              className="flex-1 py-1.5 bg-transparent border border-[#00d4ff] text-[#00d4ff] text-[10px] uppercase font-bold rounded hover:bg-[#00d4ff]/10 transition"
            >
              ✈️ TELEGRAM
            </button>
            <button 
              onClick={() => window.location.href = `mailto:?subject=Life Tracker Report&body=${encodeURIComponent(compiledReportText)}`}
              className="flex-1 py-1.5 bg-transparent border border-rose-400 text-rose-400 text-[10px] uppercase font-bold rounded hover:bg-rose-400/10 transition"
            >
              📧 EMAIL
            </button>
            <button 
              onClick={() => window.location.href = `sms:?body=${encodeURIComponent(compiledReportText)}`}
              className="flex-1 py-1.5 bg-transparent border border-slate-400 text-slate-300 text-[10px] uppercase font-bold rounded hover:bg-slate-400/10 transition"
            >
              📱 SMS / PHONE
            </button>
          </div>
        </div>

        {/* Sync Integrations & Real Exporters */}
        <div className="bg-[#0d0d1a] border border-[#1e1e38] rounded-xl p-4 space-y-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-200 border-b border-[#111120] pb-2 mb-1">
            EXTERNAL REAL WORLD EXPORTS
          </h3>

          <div className="space-y-3">
            {/* Real Exporter .ICS */}
            <div className="p-3 bg-[#111120] border border-[#1e1e38] rounded-xl space-y-2">
              <h4 className="text-[11px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-1">
                <Calendar size={12} />
                Real Calendar Exporter (.ICS)
              </h4>
              <p className="text-[9px] text-slate-500 leading-relaxed font-semibold">
                Import your custom reminders & deadlines into your physical Google Calendar, Apple Calendar, Mac/iPhone, or Outlook. Sets dates, priority, recurrences perfectly!
              </p>
              <button 
                onClick={handleExportICS}
                className="w-full py-1 bg-transparent border border-rose-500 text-rose-500 hover:bg-rose-500/10 text-[10px] font-bold uppercase rounded-lg transition"
              >
                📅 DOWNLOAD .ICS PACKAGE
              </button>
            </div>

            {/* Notion */}
            <div className="p-3 bg-[#111120] border border-[#1e1e38] rounded-xl space-y-2">
              <h4 className="text-[11px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1">
                <BookOpen size={12} />
                Notion markdown tables
              </h4>
              <p className="text-[9px] text-slate-500 leading-relaxed font-semibold">
                Copies summary aggregates structured as pure Markdown tables. Copy and paste direct into any Notion workspace page instantly!
              </p>
              <button 
                onClick={handleCopyNotionMarkdown}
                className="w-full py-1 bg-transparent border border-[#2a2a50] text-[#00d4ff] hover:border-[#00d4ff] hover:bg-[#00d4ff]/5 text-[10px] font-bold uppercase rounded-lg transition"
              >
                📋 COPY NOTION Markdown
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
