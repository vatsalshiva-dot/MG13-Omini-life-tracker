import { AppState } from '../types';
import { fmtShort, todayStr, getWeek } from './date';

export function synthesizeLocalPriest(text: string, state: AppState, today: string) {
    const q = text.toLowerCase();
    let filters: any = {};
    
    // 1. Advanced Temporal Parsing
    let targetDate = "";
    let dateLimit = 999;
    
    if (q.includes('yesterday')) {
        const d = new Date(today.substring(0,4) + '-' + today.substring(4,6) + '-' + today.substring(6,8));
        d.setDate(d.getDate() - 1);
        targetDate = d.toISOString().split('T')[0].replace(/-/g, '');
        dateLimit = 1;
    } else if (q.includes('today')) {
        targetDate = today;
        dateLimit = 1;
    } else if (q.includes('week')) {
        dateLimit = 7;
    } else if (q.includes('month')) {
        dateLimit = 30;
    } else if (q.includes('all time') || q.includes('ever')) {
        dateLimit = 9999;
    } else if (q.match(/last (\d+) days/)) {
        const m = q.match(/last (\d+) days/);
        if (m) dateLimit = parseInt(m[1]);
    }

    if (targetDate) {
        filters.dateStart = targetDate;
        filters.dateEnd = targetDate;
    }
    
    // Helper to evaluate if a date string falls within our dateLimit
    const isWithinLimit = (dStr: string) => {
        if (!dStr) return false;
        if (targetDate && dStr !== targetDate) return false;
        if (!targetDate && dateLimit < 999) {
            const todayD = new Date(today.substring(0,4) + '-' + today.substring(4,6) + '-' + today.substring(6,8));
            const itemD = new Date(dStr.substring(0,4) + '-' + dStr.substring(4,6) + '-' + dStr.substring(6,8));
            const diffDays = Math.ceil(Math.abs(todayD.getTime() - itemD.getTime()) / (1000 * 3600 * 24));
            if (diffDays > dateLimit) return false;
        }
        return true;
    };

    // 2. Intent & Data Parsing 
    let findings: string[] = [];
    let focusedModule = 'all';

    // A. Finances
    if (q.includes('spend') || q.includes('bought') || q.includes('money') || q.includes('finance') || q.includes('expense') || q.includes('cost')) {
        focusedModule = 'finance';
        let expense = 0;
        let income = 0;
        let items: string[] = [];
        
        (state.finances || []).forEach(f => {
            if (isWithinLimit(f.date)) {
                if (f.type === 'expense') { expense += f.amount; items.push(f.concept); }
                else if (f.type === 'income') income += f.amount;
            }
        });
        
        if (expense > 0 || income > 0) {
            findings.push(`I perceive financial movement: $${expense.toFixed(2)} spent across items like [${items.slice(0,3).join(', ')}]. ${income > 0 ? ` You also gathered $${income.toFixed(2)}.` : ''} Money is crystallized energy—be conscious of where it flows.`);
        } else {
            findings.push(`I see no financial transactions in this perimeter. Your reserves remain untouched.`);
        }
    }

    // B. Tracker / Habits
    if (q.includes('workout') || q.includes('exercise') || q.includes('habit') || q.includes('did i') || q.includes('productivity') || q.includes('time') || q.includes('task')) {
        if (focusedModule === 'all') focusedModule = 'tracker';
        let totalHours = 0;
        let completedHabits = 0;
        let habitNames = new Set<string>();
        
        Object.keys(state.daily || {}).forEach(ds => {
            if (isWithinLimit(ds)) {
                const day = state.daily[ds];
                Object.keys(day).forEach(cat => {
                    const categoryData = day[cat as keyof typeof day];
                    if (categoryData) {
                        Object.keys(categoryData).forEach(k => {
                           const act = categoryData[k];
                           if (act.hours) totalHours += act.hours;
                           if (act.status === 'done' || act.reps > 0) {
                               completedHabits++;
                               habitNames.add(k);
                           }
                        });
                    }
                });
            }
        });
        
        if (completedHabits > 0 || totalHours > 0) {
            let s = `Your physical and mental discipline is evident. You accumulated ${totalHours.toFixed(1)} hours of deep focus, and completed ${completedHabits} habit vectors (including ${Array.from(habitNames).slice(0,3).join(', ')}). Consistency compounds; reality bends to rhythmic execution.`;
            findings.push(s);
        } else {
            findings.push("I observe a void in your discipline logs for this period. A body at rest decays.");
        }
    }

    // C. Journal / Mind
    if (q.includes('feel') || q.includes('journal') || q.includes('thought') || q.includes('mind') || q.includes('write')) {
        if (focusedModule === 'all') focusedModule = 'journal';
        let avgMood = 0, count = 0, tags = new Set<string>();
        
        Object.keys(state.journals || {}).forEach(ds => {
             if (isWithinLimit(ds)) {
                 const j = state.journals[ds];
                 if (j.mood) { avgMood += j.mood; count++; }
                 if (j.tags) j.tags.forEach(t => tags.add(t));
             }
        });
        
        if (count > 0) {
             avgMood = avgMood / count;
             findings.push(`I have witnessed your cognitive reflections. Your energetic mood hovered around ${avgMood.toFixed(1)}/5. Themes occupying your psyche: [${Array.from(tags).join(', ')}]. The mind reveals its architect slowly.`);
        } else {
             findings.push(`Silence. No internal reflections were recorded here. The unexamined day slips through your fingers.`);
        }
    }

    // D. Reminders
    if (q.includes('reminder') || q.includes('alert') || q.includes('todo') || q.includes('plan')) {
        if (focusedModule === 'all') focusedModule = 'reminder';
        let act = 0;
        (state.reminders || []).forEach(r => {
             if (r.status !== 'done' && isWithinLimit(r.dueDate || targetDate || today)) act++;
        });
        if (act > 0) findings.push(`You have ${act} pending protocols calling for your attention. Deal with them before they become psychic weight.`);
    }

    // 3. Synthesis 
    let answer = "";
    if (findings.length > 0) {
        answer = findings.join(" ");
    } else {
        // Generic fallback analysis if no specific keywords hit
        let anyData = false;
        Object.keys(state.daily || {}).forEach(ds => { if (isWithinLimit(ds)) anyData = true; });
        (state.finances || []).forEach(f => { if (isWithinLimit(f.date)) anyData = true; });
        
        if (anyData) {
            answer = `I have scanned the ledger for this period across all modules. Data exists, but your query lacks specificity. Look to the topological map below.`;
        } else {
            answer = `No resonance found. The archives for this parameter are entirely vacant.`;
        }
    }
    
    if (focusedModule !== 'all') filters.module = focusedModule;

    return {
        answer: "[ LOCAL CORE ] " + answer,
        filters
    };
}
