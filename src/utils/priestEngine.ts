import { AppState, FinancialGoal, ExpeditionExpense } from '../types';
import { todayStr, fmtShort } from './date';

// LAYER 0 — INFORMAL LANGUAGE PROCESSOR
export class LanguageNormalizer {
  private typoDict: Record<string, string> = {
    'yesteday': 'yesterday',
    'tomorow': 'tomorrow',
    'waht': 'what',
    'shwo': 'show',
    'hwo': 'how',
    'lst': 'last',
    'wht': 'what',
    'workotu': 'workout',
    'speding': 'spending',
    'recurds': 'records',
    'journel': 'journal',
    'habbit': 'habit',
    'remider': 'reminder',
    'schdule': 'schedule'
  };

  private hinglishDict: Record<string, string> = {
    'aaj': 'today',
    'is hafte': 'this week',
    'pichle hafte': 'last week',
    'kharcha': 'spending',
    'paisa': 'money',
    'paise': 'money',
    'kaam': 'tasks',
    'mood kaisa': 'how was my mood',
    'kya kiya': 'what did I do',
    'kya karna hai': 'what do I have to do'
  };

  process(rawInput: string) {
    let text = rawInput.toLowerCase().trim();
    let original = text;
    let wasTypoFixed = false;
    let wasHinglish = false;
    let wasFragment = false;

    // Typo fixing
    const words = text.split(/\s+/);
    const correctedWords = words.map(w => {
      let cleanWord = w.replace(/[^a-z]/g, '');
      if (this.typoDict[cleanWord]) {
        wasTypoFixed = true;
        return w.replace(cleanWord, this.typoDict[cleanWord]);
      }
      return w;
    });
    text = correctedWords.join(' ');

    // Hinglish translation
    for (const [hi, en] of Object.entries(this.hinglishDict)) {
      if (text.includes(hi)) {
        wasHinglish = true;
        text = text.replace(new RegExp(hi, 'g'), en);
      }
    }
    
    const isPast = ['did', 'was', 'were', 'happened', 'spent', 'felt', 'yesterday', 'last', 'kya kiya', 'kaisa tha'].some(w => text.includes(w));
    const isFuture = ['tomorrow', 'upcoming', 'due', 'scheduled', 'pending', 'should', 'will', 'have to', 'need to', 'plan', 'karna hai', 'kal ke'].some(w => text.includes(w));

    // Hinglish 'kal' handling
    if (text.includes('kal')) {
      wasHinglish = true;
      if (isPast && !isFuture) text = text.replace(/kal/g, 'yesterday');
      else if (isFuture && !isPast) text = text.replace(/kal/g, 'tomorrow');
      else text = text.replace(/kal/g, 'yesterday'); // default to passed
    }

    // Fragment expansion
    if (words.length <= 2) {
      wasFragment = true;
      if (text.includes('yesterday')) text = 'what did I do yesterday';
      else if (text.includes('mood')) text = 'how was my mood recently';
      else if (text.includes('workout')) text = 'show me my workout logs';
      else if (text.includes('pending')) text = 'what tasks are pending';
      else if (text.includes('finances') || text.includes('spend')) text = 'give me a summary of my finances';
      else if (text.includes('tomorrow')) text = 'what do I have scheduled for tomorrow';
      else if (text.includes('this week')) text = 'summarize this week';
    }

    let timeDirection: 'past' | 'future' | 'present' = 'present';
    if (isPast && !isFuture) timeDirection = 'past';
    else if (isFuture && !isPast) timeDirection = 'future';

    return {
      original,
      normalized: text,
      wasTypoFixed,
      wasHinglish,
      wasFragment,
      timeDirection,
      confidence: 0.9
    };
  }
}

// LAYER 1 — ADVANCED QUERY PARSER
export class QueryParser {
  parse(normalizedRes: any, today: string) {
    const text = normalizedRes.normalized;
    let startDate = '';
    let endDate = '';
    let assumed = false;
    let label = '';
    
    // Temporal Logic
    const t = new Date(today + 'T12:00:00');
    if (text.includes('yesterday')) {
      t.setDate(t.getDate() - 1);
      startDate = endDate = t.toISOString().split('T')[0];
      label = 'yesterday';
    } else if (text.includes('tomorrow')) {
      t.setDate(t.getDate() + 1);
      startDate = endDate = t.toISOString().split('T')[0];
      label = 'tomorrow';
    } else if (text.includes('today')) {
      startDate = endDate = today;
      label = 'today';
    } else if (text.includes('last week')) {
      t.setDate(t.getDate() - 7);
      startDate = t.toISOString().split('T')[0];
      endDate = today;
      label = 'last week';
    } else if (text.includes('this week')) {
      t.setDate(t.getDate() - t.getDay() + 1);
      startDate = t.toISOString().split('T')[0];
      endDate = today;
      label = 'this week';
    } else if (text.includes('last month')) {
      t.setMonth(t.getMonth() - 1);
      startDate = t.toISOString().split('T')[0];
      endDate = today;
      label = 'last month';
    } else if (text.match(/last (\d+) days/)) {
      const match = text.match(/last (\d+) days/);
      const days = parseInt(match![1]);
      t.setDate(t.getDate() - days);
      startDate = t.toISOString().split('T')[0];
      endDate = today;
      label = `last ${days} days`;
    } else {
      assumed = true;
      if (normalizedRes.timeDirection === 'past') {
        t.setDate(t.getDate() - 30);
        startDate = t.toISOString().split('T')[0];
        endDate = today;
        label = 'last 30 days';
      } else if (normalizedRes.timeDirection === 'future') {
        t.setDate(t.getDate() + 7);
        startDate = today;
        endDate = t.toISOString().split('T')[0];
        label = 'next 7 days';
      } else {
        t.setDate(t.getDate() - 7);
        startDate = t.toISOString().split('T')[0];
        endDate = today;
        label = 'recent timeframe';
      }
    }

    const domains: string[] = [];
    if (/(spend|bought|cost|money|expense|finance|₹|\$)/i.test(text)) domains.push('finance');
    if (/(workout|habit|gym|step|run|sleep|meditat|routine)/i.test(text)) domains.push('habit');
    if (/(feel|mood|emotion|stress|anxiety|happy|sad|energy|journal)/i.test(text)) domains.push('journal');
    if (/(remind|todo|task|pending|due|scheduled|karna)/i.test(text)) domains.push('reminder');
    if (/(goal|target|progress|achieve|milestone|plan)/i.test(text)) domains.push('goal');

    if (domains.length === 0) {
      if (normalizedRes.timeDirection === 'future') domains.push('reminder', 'goal');
      else domains.push('finance', 'habit', 'journal', 'reminder');
    }

    let intent = 'lookup';
    if (/(how much|total|sum|count)/i.test(text)) intent = 'aggregation';
    else if (/(trend|improving|pattern|usually)/i.test(text)) intent = 'trend';
    else if (/(summary|recap|overview|how was|how did)/i.test(text)) intent = 'recap';
    else if (/(compare|vs|better than)/i.test(text)) intent = 'comparison';
    else if (/(unusual|most|least|spike)/i.test(text)) intent = 'anomaly';
    else if (normalizedRes.timeDirection === 'future' || /(plan|due|scheduled)/i.test(text)) intent = 'planning';

    return {
      raw: normalizedRes.original,
      normalized: text,
      temporal: { start: startDate, end: endDate, assumed, label },
      timeDirection: normalizedRes.timeDirection,
      domains,
      intent,
      ambiguous: domains.length === 0,
    };
  }
}

// LAYER 1.5 - LOCAL OMNI COMMAND PARSER (Auto Log)
export class LocalOmniParser {
  parseText(text: string, today: string, state: AppState) {
     const t = text.toLowerCase();
     const mutations: any[] = [];
     let categoryDetected = "General";
     let tags: string[] = [];

     // 1. Finance Detection
     const spentMatch = t.match(/(?:spent|paid|bought|cost|expense).+?\$?(\d+)/);
     if (spentMatch) {
        const amount = parseFloat(spentMatch[1]);
        mutations.push({
           type: 'LOG_FINANCE',
           payload: {
              id: "tx_" + Date.now(),
              type: "expense",
              amount,
              concept: text,
              category: "Shopping",
              date: today,
              currency: "USD"
           },
           confidence: 85
        });
        tags.push("finance", "expense");
     }

     const earnedMatch = t.match(/(?:earned|made|income|received).+?\$?(\d+)/);
     if (earnedMatch) {
       const amount = parseFloat(earnedMatch[1]);
       mutations.push({
         type: 'LOG_FINANCE',
         payload: {
           id: "tx_" + Date.now(),
           type: "income",
           amount,
           concept: text,
           category: "Income",
           date: today,
           currency: "USD"
         },
         confidence: 85
       });
       tags.push("finance", "income");
     }

     // 2. Reminder Detection
     const remindMatch = t.match(/(?:remind me to|remember to|todo|task:?)\s+(.+?)(?:\s+at\s+|\s+by\s+|\s+tomorrow|\s+today|$)/);
     if (remindMatch || t.includes('remind')) {
        let dueDate = today;
        if (t.includes('tomorrow')) {
            const tm = new Date(today + "T12:00:00");
            tm.setDate(tm.getDate() + 1);
            dueDate = tm.toISOString().split('T')[0];
        }
        mutations.push({
           type: 'CREATE_REMINDER',
           payload: {
             id: "rem_" + Date.now(),
             title: remindMatch ? remindMatch[1] : text,
             priority: "medium",
             category: "general",
             dueDate,
             time: "09:00",
             enableAlert: false
           },
           confidence: 70
        });
        tags.push("reminder", "todo");
     }

     // 3. Habit / Tracker Detection
     const habitMatch = t.match(/(completed|finished|did my|done with)\s+(.+)/);
     if (habitMatch || t.includes("workout") || t.includes("gym")) {
        mutations.push({
           type: 'LOG_TRACKER',
           payload: {
              categoryId: "health", // generic fallback
              item: habitMatch ? habitMatch[2].substring(0, 20) : "workout",
              status: "done",
              notes: "Voice Auto-logged",
              date: today
           },
           confidence: 75
        });
        tags.push("habit");
     }

     // 4. Default to Journal
     if (mutations.length === 0) {
        mutations.push({
           type: 'APPEND_JOURNAL',
           payload: {
              topic: "notes",
              text: text,
              createNewHeading: false,
              date: today
           },
           confidence: 90
        });
        tags.push("journal");
     } else {
        // Also append it to journal just so the raw thought isn't lost
        mutations.push({
           type: 'APPEND_JOURNAL',
           payload: {
              topic: "notes",
              text: text,
              date: today
           },
           confidence: 100
        });
     }

     return {
        mutations,
        analysis: "Processed locally completely offline. Found intents: " + tags.join(", "),
        tags
     };
  }
}

// LAYER 2 — DATA RETRIEVAL ENGINE
export class DataEngine {
  retrieve(queryObj: any, state: AppState, today: string) {
    const isWithinLimit = (dStr: string) => {
      if (!dStr) return false;
      return dStr >= queryObj.temporal.start && dStr <= queryObj.temporal.end;
    };

    let result: any = { period: queryObj.temporal, records: [], recap: {}, planning: {} };

    if (queryObj.intent === 'planning') {
      result.planning = { todayTasks: [], tomorrowTasks: [], overdueTasks: [], upcomingGoals: [] };
      const tomD = new Date(today + 'T12:00:00');
      tomD.setDate(tomD.getDate() + 1);
      const tomorrow = tomD.toISOString().split('T')[0];

      (state.reminders || []).forEach(r => {
        if (r.status !== 'done') {
          if (r.dueDate && r.dueDate < today) result.planning.overdueTasks.push(r);
          else if (r.dueDate === today) result.planning.todayTasks.push(r);
          else if (r.dueDate === tomorrow) result.planning.tomorrowTasks.push(r);
        }
      });
      (state.financeGoals || []).forEach(g => {
        if (g.deadlineDate && g.deadlineDate >= today && g.deadlineDate <= queryObj.temporal.end) {
          result.planning.upcomingGoals.push(g);
        }
      });
    }

    if (queryObj.domains.includes('finance')) {
      let fRecs = (state.finances || []).filter(f => isWithinLimit(f.date));
      let totalExpense = fRecs.filter(f => f.type === 'expense').reduce((sum, f) => sum + f.amount, 0);
      result.recap.finance = { count: fRecs.length, total: totalExpense, items: fRecs.slice(0, 5) };
    }

    if (queryObj.domains.includes('habit')) {
      let hCount = 0;
      let hNames = new Set<string>();
      Object.keys(state.daily || {}).forEach(ds => {
        if (isWithinLimit(ds)) {
          const day = state.daily[ds];
          Object.keys(day).forEach(cat => {
            if (day[cat as keyof typeof day]) {
              Object.keys(day[cat as keyof typeof day]!).forEach(k => {
                const act = day[cat as keyof typeof day]![k];
                if (act.status === 'done' || act.reps > 0 || (act.hours && act.hours > 0)) {
                  hCount++;
                  hNames.add(k);
                }
              });
            }
          });
        }
      });
      result.recap.habit = { completed: Array.from(hNames), count: hCount };
    }

    if (queryObj.domains.includes('journal')) {
      let moods = [];
      Object.keys(state.journals || {}).forEach(ds => {
        if (isWithinLimit(ds) && state.journals[ds]?.mood) {
          moods.push(state.journals[ds].mood);
        }
      });
      const avg = moods.length > 0 ? (moods.reduce((a, b) => a + b, 0) / moods.length).toFixed(1) : 0;
      result.recap.journal = { count: moods.length, avgMood: avg };
    }

    result.queryObject = queryObj;
    return result;
  }
}

// LAYER 3 — LOCAL RESPONSE SYNTHESIZER
export class ResponseSynthesizer {
  generate(result: any) {
    const q = result.queryObject;
    let txt = "";

    if (q.intent === 'planning') {
      const plan = result.planning;
      if (q.normalized.includes('tomorrow')) {
        txt = `Tomorrow (${plan.tomorrowTasks.length} tasks scheduled):\n`;
        plan.tomorrowTasks.forEach((t: any) => txt += `- ${t.title}\n`);
        if (plan.overdueTasks.length > 0) txt += `\n⚠️ Focus on your ${plan.overdueTasks.length} overdue tasks first!`;
        if (plan.tomorrowTasks.length === 0) txt += `Nothing explicitly scheduled for tomorrow. You're free!`;
      } else {
        txt = `Here is your current outlook:\n🔴 Overdue: ${plan.overdueTasks.length} items.\n📅 Due Today: ${plan.todayTasks.length} items.\n`;
        if (plan.todayTasks.length > 0) plan.todayTasks.slice(0, 3).forEach((t: any) => txt += ` - ${t.title}\n`);
        txt += `🎯 Upcoming Goals: ${plan.upcomingGoals.length}\n`;
      }
      return txt.trim();
    }

    if (q.intent === 'recap' || q.timeDirection === 'past' || q.intent === 'aggregation') {
      txt = `Analysis for ${q.temporal.label}:\n`;
      let empty = true;
      if (result.recap.finance && result.recap.finance.count > 0) {
        txt += `💸 Spent $${result.recap.finance.total.toFixed(2)} across ${result.recap.finance.count} transactions.\n`;
        empty = false;
      }
      if (result.recap.habit && result.recap.habit.count > 0) {
        txt += `🏃 Completed ${result.recap.habit.count} habit iterations, including: ${result.recap.habit.completed.slice(0, 3).join(', ')}.\n`;
        empty = false;
      }
      if (result.recap.journal && result.recap.journal.count > 0) {
        txt += `📓 Interacted with your journal ${result.recap.journal.count} times. Average mood: ${result.recap.journal.avgMood}/10.\n`;
        empty = false;
      }
      
      if (empty) {
        txt = `No logged activities found for ${q.temporal.label}. The archives are empty for your query.`;
      }
      return txt.trim();
    }

    return `Processed your query regarding ${q.temporal.label}. No specific matches were extracted from the local ledger based on intent '${q.intent}'.`;
  }
}

// LAYER 4 — LOCAL LLM ENHANCER
export class LLMEnhancer {
  async enhance(prompt: string, localResponse: string, result: any, onChunk: (text: string) => void) {
    try {
      const { LocalAI } = await import('../lib/ai');
      // Create a mock OmniData or use existing state
      const data = {
        habits: [],
        goals: [],
        journal: [],
        moods: [],
        userName: 'User',
      };
      
      const ai = new LocalAI(data);
      const response = await ai.query(prompt);
      
      if (response && response.content) {
         onChunk(response.content);
         return { answer: response.content, filters: {} };
      }
    } catch(err) {
      console.warn("Local AI Engine failed.", err);
    }
    return null;
  }
}

// FULL ENGINE
export class PriestEngine {
  normalizer = new LanguageNormalizer();
  parser = new QueryParser();
  dataEngine = new DataEngine();
  synthesizer = new ResponseSynthesizer();
  llm = new LLMEnhancer();
  omniParser = new LocalOmniParser();

  async processQuery(rawInput: string, state: AppState, onStream?: (text: string) => void): Promise<{ answer: string, analysisObj: any, queryObj: any, usedLLM: boolean }> {
    const today = todayStr();
    
    // 1. Normalize
    const norm = this.normalizer.process(rawInput);
    
    // 2. Parse
    let queryObj = this.parser.parse(norm, today);
    
    // 3. Retrieve
    const dataRes = this.dataEngine.retrieve(queryObj, state, today);
    
    // 4. Synthesize local fallback
    const localRes = this.synthesizer.generate(dataRes);
    
    // 5. Enhance if callback provided
    if (onStream) {
      onStream(localRes + "\n\nConsulting Omni AI...");
      const enhanced = await this.llm.enhance(rawInput, localRes, dataRes, (chunk) => {
        onStream(chunk);
      });
      if (enhanced) {
        let finalAnswer: string = "";
        
        if (typeof enhanced === 'string') {
           finalAnswer = enhanced;
        } else if (typeof enhanced === 'object' && 'answer' in enhanced) {
           finalAnswer = enhanced.answer as string;
           if ((enhanced as any).filters) {
               const f = (enhanced as any).filters;
               if (f.dateStart) queryObj.temporal.start = f.dateStart;
               if (f.dateEnd) queryObj.temporal.end = f.dateEnd;
               if (f.module && f.module !== 'all') {
                  if (f.module === 'tracker') queryObj.domains = ['habit'];
                  else if (f.module === 'journal') queryObj.domains = ['journal'];
                  else if (f.module === 'finance') queryObj.domains = ['finance'];
                  else if (f.module === 'reminder' || f.module === 'expedition') queryObj.domains = ['reminder'];
               }
               if (f.keywords && Array.isArray(f.keywords)) {
                   (queryObj as any).keywords = f.keywords;
               }
           }
        }
        
        return { answer: finalAnswer, analysisObj: norm, queryObj: queryObj, usedLLM: true };
      }
    }
    
    return { answer: localRes, analysisObj: norm, queryObj: queryObj, usedLLM: false };
  }
}
