export const MN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const DN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function todayStr(): string {
  // Returns YYYY-MM-DD in local time
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function fmtDate(ds: string): string {
  if (!ds) return '';
  const d = new Date(ds + 'T00:00:00');
  return d.toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).toUpperCase();
}

export function fmtShort(ds: string): string {
  if (!ds) return '';
  const d = new Date(ds + 'T00:00:00');
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short'
  }).toUpperCase();
}

export function getWeek(ds: string): string[] {
  const d = new Date(ds + 'T00:00:00');
  const dayOfWeek = d.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  const mon = new Date(d);
  // Calculate relative difference to Monday
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  mon.setDate(d.getDate() + diff);

  const arr: string[] = [];
  for (let i = 0; i < 7; i++) {
    const x = new Date(mon);
    x.setDate(mon.getDate() + i);
    const yr = x.getFullYear();
    const mt = String(x.getMonth() + 1).padStart(2, '0');
    const dy = String(x.getDate()).padStart(2, '0');
    arr.push(`${yr}-${mt}-${dy}`);
  }
  return arr;
}

export function getMonthDays(year: number, month: number): string[] {
  const dim = new Date(year, month + 1, 0).getDate();
  const arr: string[] = [];
  for (let d = 1; d <= dim; d++) {
    const mt = String(month + 1).padStart(2, '0');
    const dy = String(d).padStart(2, '0');
    arr.push(`${year}-${mt}-${dy}`);
  }
  return arr;
}

export function periodDays(p: 'weekly' | 'monthly' | 'yearly', dateStr: string): number {
  if (p === 'weekly') return 7;
  if (p === 'monthly') {
    const d = new Date(dateStr + 'T00:00:00');
    return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  }
  return 365;
}

export function periodRange(p: 'weekly' | 'monthly' | 'yearly', dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  const yr = d.getFullYear();
  if (p === 'weekly') {
    const week = getWeek(dateStr);
    return {
      s: week[0],
      e: week[6],
      label: `${fmtShort(week[0])} – ${fmtShort(week[6])}`
    };
  }
  if (p === 'monthly') {
    const m = d.getMonth();
    const s = `${yr}-${String(m + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(yr, m + 1, 0).getDate();
    const e = `${yr}-${String(m + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    return {
      s,
      e,
      label: `${MN[m].toUpperCase()} ${yr}`
    };
  }
  return {
    s: `${yr}-01-01`,
    e: `${yr}-12-31`,
    label: `YEAR ${yr}`
  };
}
