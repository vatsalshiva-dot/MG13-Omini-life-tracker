const offsetDate = (base: string, days: number) => { 
  const d = new Date(base+'T12:00:00'); 
  d.setDate(d.getDate() + days); 
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; 
};

const resolveDate = (expr: string, today: string) => {
  const t = (expr || '').toLowerCase().trim();
  if(!t || t === 'today') return today;
  if(t === 'yesterday') return offsetDate(today,-1);
  if(t === 'tomorrow') return offsetDate(today,1);
  const m = t.match(/(\d+)\s+days?\s+ago/); if(m) return offsetDate(today, -parseInt(m[1]));
  const iso = t.match(/(\d{4}-\d{2}-\d{2})/); if(iso) return iso[1];
  const slash = t.match(/(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?/);
  if(slash) {
      const a = parseInt(slash[1]), b = parseInt(slash[2]), y = slash[3] ? (slash[3].length === 2 ? 2000 + parseInt(slash[3]) : parseInt(slash[3])) : new Date(today).getFullYear();
      const [day, mon] = a > 12 ? [a, b] : [b, a];
      if (mon >= 1 && mon <= 12) return `${y}-${String(mon).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
  }
  return today;
};

const extractAmt = (text: string) => {
  const t = text.replace(/,(?=\d{3})/g,'');
  const s = t.match(/([₹$€£])\s*([\d]+(?:\.\d{1,2})?)/); if(s) return { amount: parseFloat(s[2]), currency: s[1] };
  const c = t.match(/(?:Rs\.?|INR|USD|\$)\s*([\d]+(?:\.\d{1,2})?)/i); if(c) return { amount: parseFloat(c[1]), currency: '$' };
  const w = t.match(/([\d]+(?:\.\d{1,2})?)\s*(?:rupees?|bucks?|dollars?|rs\.?)/i); if(w) return { amount: parseFloat(w[1]), currency: t.match(/dollar|buck/i) ? '$' : '$' };
  const v = t.match(/(?:spent|paid|cost|received|earned|income)\D{0,5}([\d]+(?:\.\d{1,2})?)/i); if(v) { const a = parseFloat(v[1]); if (a > 0) return { amount: a, currency: '$' }; }
  return null;
};

const CATMAP: Record<string, RegExp> = { Food: /coffee|chai|lunch|dinner|breakfast|food|restaurant|cafe|swiggy|zomato|pizza|burger|groceries?|milk|snack|meal|juice/, Transport: /uber|ola|auto|metro|bus|train|taxi|petrol|fuel|cab|flight|fare|ticket/, Shopping: /amazon|flipkart|clothes|shoes|phone|laptop|mall|shop|purchase|online/, Income: /salary|freelance|received|earned|income|credit|refund|cashback|bonus|stipend/, Bills: /electricity|water bill|phone bill|internet|rent|emi|loan|insurance|netflix|subscription|recharge/, Medical: /doctor|hospital|medicine|pharmacy|clinic|medical|health|tablet|prescription/, Education: /book|course|class|tuition|school|coaching|exam fee|library|stationery/, Entertainment: /movie|cinema|game|concert|event|show|hotstar|netflix/ };
const detectCat = (t: string) => { for(const[cat,re] of Object.entries(CATMAP)) if(re.test(t.toLowerCase())) return cat.toLowerCase(); return 'lifestyle'; };
const detectType = (t: string) => /received|earned|income|salary|credit|refund|cashback|bonus/i.test(t) ? 'income' : 'expense';

export function parseFinancesLocally(text: string, today: string) {
    const parsed: any[] = [];
    if(!text?.trim()) return [];
    const lines = text.split(/\n|;/).map(l=>l.trim()).filter(l=>l.length>2);
    for (let line of lines) {
        if (/^(date|description|amount|type|narration)/i.test(line)) continue;
        const ai = extractAmt(line); if (!ai || ai.amount <= 0) continue;
        const dm = line.match(/\b(today|yesterday|\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{2,4})?|\d{4}-\d{2}-\d{2})\b/i);
        let concept = line.replace(/[₹$€£]?\s*[\d,]+(?:\.\d{1,2})?/g,'').replace(/\b(INR|USD|Rs\.?|rupees?|spent|paid|bought|received|earned|on|for|from|today|yesterday|debit|credit|dr|cr)\b/gi,' ').replace(/\s+/g,' ').trim();
        if (!concept || concept.length < 2) concept = 'Transaction';
        parsed.push({
            date: dm ? resolveDate(dm[1], today) : today,
            amount: ai.amount,
            concept: concept.substring(0, 50),
            type: detectType(line),
            category: detectCat(line),
            currency: ai.currency
        });
    }
    return parsed;
}

export function parseMutationsLocally(text: string, stateContext: any, today: string) {
  const mutations: any[] = [];
  const lower = text.toLowerCase();
  
  // Date extraction
  let parsedDate = today.includes('T') ? today.split('T')[0] : today;
  if (lower.includes('yesterday')) {
      const d = new Date(today);
      d.setDate(d.getDate() - 1);
      parsedDate = d.toISOString().split('T')[0];
  } else if (lower.includes('tomorrow')) {
      const d = new Date(today);
      d.setDate(d.getDate() + 1);
      parsedDate = d.toISOString().split('T')[0];
  } else {
      const dateMatch = lower.match(/on\s+(\d{4}-\d{2}-\d{2})/i) || lower.match(/for\s+(\d{4}-\d{2}-\d{2})/i) || lower.match(/date[d:]\s*(\d{4}-\d{2}-\d{2})/i);
      if (dateMatch) {
          parsedDate = dateMatch[1];
      }
  }
  
  today = parsedDate;

  const phrases = text.split(/(?: and | also |\b then \b|, |\.|;|\n)+/i).map(p => p.trim()).filter(Boolean);
  
  for (const phrase of phrases) {
    const lowerPhrase = phrase.toLowerCase();
    let matchedExistingItem = false;
    
    // Checking tasks/habits completions dynamically based on current items
    if (stateContext.items && typeof stateContext.items === 'object') {
      Object.entries(stateContext.items).forEach(([category, itemList]) => {
        if (Array.isArray(itemList)) {
          itemList.forEach((itemName: string) => {
            if (lowerPhrase.includes(itemName.toLowerCase())) {
               const isGoalSetting = (lowerPhrase.includes('set') || lowerPhrase.includes('change') || lowerPhrase.includes('update')) && (lowerPhrase.includes('target') || lowerPhrase.includes('goal'));
               const isExplicitGenericGoal = (lowerPhrase.includes('set a goal') || lowerPhrase.includes('new goal') || lowerPhrase.includes('create a goal') || lowerPhrase.includes('add a goal')) && !lowerPhrase.match(/\d+\s*(?:reps|times|hour|hr|h|mins|min|steps|count)/i);
               
               if (!isGoalSetting && !isExplicitGenericGoal && (lowerPhrase.includes('done') || lowerPhrase.includes('did') || lowerPhrase.includes('completed') || lowerPhrase.includes('finished') || lowerPhrase.includes('skip') || lowerPhrase.includes('miss') || lowerPhrase.includes('log') || lowerPhrase.match(new RegExp(`${itemName.toLowerCase()}[^a-z]*?\\d`, 'i')))) {
                  let status = 'done';
                  if (lowerPhrase.includes('skip')) status = 'skipped';
                  else if (lowerPhrase.includes('miss')) status = 'missed';
                  
                  let reps = 0;
                  let hours = 0;
                  const repsMatch = lowerPhrase.match(new RegExp(`${itemName.toLowerCase()}[^0-9]*?(\\d+)\\s*(?:reps|times|count)`, 'i')) || lowerPhrase.match(/(\d+)\s*(?:reps|times)/i);
                  if (repsMatch) reps = parseInt(repsMatch[1]);
                  
                  const hoursMatch = lowerPhrase.match(new RegExp(`${itemName.toLowerCase()}[^0-9]*?(\\d+(?:\\.\\d+)?)\\s*(?:hour|hr|h|mins|min)`, 'i')) || lowerPhrase.match(/(\d+(?:\.\d+)?)\s*(?:hour|hr|h|mins|min)/i);
                  if (hoursMatch) {
                     let rawVal = parseFloat(hoursMatch[1]);
                     if (hoursMatch[0].includes('min')) rawVal = rawVal / 60;
                     hours = rawVal;
                  }
                  
                  matchedExistingItem = true;
                  mutations.push({
                    date: today,
                    type: 'LOG_TRACKER',
                    payload: {
                       item: itemName,
                       categoryId: category,
                       status: status,
                       reps: reps || undefined,
                       hours: hours || undefined
                    }
                  });
               }
               // Handle SET_TRACKER_GOAL
               if (isGoalSetting && !isExplicitGenericGoal) {
                  let reps: number | undefined = undefined;
                  let hours: number | undefined = undefined;
                  
                  const repsMatch = lowerPhrase.match(new RegExp(`(?:set.*?|target.*?|change.*?|update.*?)${itemName.toLowerCase()}[^0-9]*?(\\d+)\\s*(?:reps|times)`, 'i')) || lowerPhrase.match(/(\d+)\s*(?:reps|times)/i) || (lowerPhrase.includes('reps') ? phrase.match(/target.*?(\d+)/i) : null);
                  
                  const hoursMatch = lowerPhrase.match(new RegExp(`(?:set.*?|target.*?|change.*?|update.*?)${itemName.toLowerCase()}[^0-9]*?(\\d+(?:\\.\\d+)?)\\s*(?:hour|hr|h|mins|min)`, 'i')) || lowerPhrase.match(/(\d+(?:\.\d+)?)\s*(?:hour|hr|h|mins|min)/i);
                  
                  if (hoursMatch && (hoursMatch[0].includes('hour') || hoursMatch[0].includes('hr') || hoursMatch[0].includes('min') || hoursMatch[0].includes('h'))) { 
                     let val = parseFloat(hoursMatch[1]); 
                     if (hoursMatch[0].includes('min')) val = val / 60;
                     hours = val; 
                  } else if (repsMatch) { 
                     reps = parseInt(repsMatch[1]); 
                  } else {
                      const genericMatch = lowerPhrase.match(new RegExp(`(?:set|target|change|update).*?${itemName.toLowerCase()}[^0-9]*?(\\d+)`, 'i')) || lowerPhrase.match(/(?:set|change|update) .*? goal to (\d+)/i) || lowerPhrase.match(/target .*?(\d+)/i);
                      if (genericMatch) reps = parseInt(genericMatch[1]);
                  }
                  
                  if (reps !== undefined || hours !== undefined) {
                      matchedExistingItem = true;
                      mutations.push({
                          date: today,
                          type: 'SET_TRACKER_GOAL',
                          payload: {
                              item: itemName,
                              categoryId: category,
                              reps: reps,
                              hours: hours
                          }
                      });
                  }
               }
            }
          });
        }
      });
    }

    if (matchedExistingItem) continue;
    
    // Create Category
    const categoryRegexes = [
       /(?:create|add|new) (?:tracker )?category(?: called| named|:)?\s+([a-zA-Z\s]+)(?: with| and)?/i
    ];
    for (const regex of categoryRegexes) {
        const match = phrase.match(regex);
        if (match && match[1]) {
            const catName = match[1].trim();
            if (catName.length > 0 && catName.length < 20) {
                mutations.push({
                    date: today,
                    type: 'CREATE_CATEGORY',
                    payload: {
                        id: catName.toLowerCase().replace(/\s+/g, '_'),
                        label: catName,
                        icon: '◈',
                        neon: '#ff00a0'
                    }
                });
            }
        }
    }

    let matchedHabit = false;

    // Create Tracker Item / Habit
    const habitRegexes = [
       /(?:start tracking|new habit|add task|start a habit of|new task)(?: called|:| to)?\s+(.*?)(?:\.|and|$)/i,
       /(?:set(?: a)? target|set target|set(?: a)? goal|change(?: my)? goal(?: for)?|update(?: my)? goal(?: for)?)(?: for| to)?\s+(.*?)(?:(?: to| for|as)\s+)?(\d+(?:\.\d+)?)\s*(reps|times|hour|hr|h|mins|min|steps)/i
    ];
    for (const regex of habitRegexes) {
        const match = phrase.match(regex);
        if (match && match[1]) {
            matchedHabit = true;
            let item = match[1].replace(/\b(?:today|tomorrow|yesterday)\b/ig, '').trim();
            
            let targetValue = 0;
            let targetField = 'reps';
            let categoryId = 'health'; // default
            
            const categoryMatch = item.match(/(.*?)\s+(?:under|in)\s+([a-zA-Z\s]+)$/i);
            if (categoryMatch) {
                item = categoryMatch[1].trim();
                categoryId = categoryMatch[2].trim().toLowerCase().replace(/\s+/g, '_');
            }
            
            if (match[2] && match[3]) {
               targetValue = parseFloat(match[2]);
               const unit = match[3].toLowerCase();
               if (unit.includes('hour') || unit.includes('hr') || unit.includes('min') || unit.includes('h')) {
                   targetField = 'hours';
                   if (unit.includes('min')) targetValue = targetValue / 60;
               }
            } else {
               const repsMatch = item.match(/for (\d+)\s*(?:reps|times|steps)/i);
               const hoursMatch = item.match(/for (\d+(?:\.\d+)?)\s*(?:hour|hr|h|mins|min)/i);
               
               if (repsMatch) {
                   targetValue = parseInt(repsMatch[1]);
                   item = item.replace(repsMatch[0], '').trim();
               } else if (hoursMatch) {
                   targetValue = parseFloat(hoursMatch[1]);
                   if (hoursMatch[0].includes('min')) targetValue = targetValue / 60;
                   targetField = 'hours';
                   item = item.replace(hoursMatch[0], '').trim();
               }
            }

            // check if there's *still* an "under category" that might have been hidden prior to stripping "for X reps"
            const lateCatMatch = item.match(/(.*?)\s+(?:under|in)\s+([a-zA-Z\s]+)$/i);
            if (lateCatMatch) {
                item = lateCatMatch[1].trim();
                categoryId = lateCatMatch[2].trim().toLowerCase().replace(/\s+/g, '_');
            }

            if (targetValue > 0) {
                mutations.push({
                    date: today,
                    type: 'SET_TRACKER_GOAL',
                    payload: {
                        categoryId: categoryId,
                        item: item.replace(/\s+for\s*$/, '').trim() || item,
                        reps: targetField === 'reps' ? targetValue : undefined,
                        hours: targetField === 'hours' ? targetValue : undefined
                    }
                });
            } else {
                mutations.push({
                    date: today,
                    type: 'CREATE_TRACKER_ITEM',
                    payload: {
                        categoryId: categoryId, 
                        item: item.replace(/\s+for\s*$/, '').trim() || item 
                    }
                });
            }
        }
    }

    // Create general / Finance goal
    if (!matchedHabit && !matchedExistingItem) {
        const gm = phrase.match(/(?:(?:want|plan|aim) to|goal is|resolve to|add goal|new goal)\s+(.+?)(?:\s+(?:every|daily|weekly|monthly|yearly)|$)/i);
        if (gm && !/spent|paid/i.test(phrase)) {
           let title = gm[1].trim();
           let amount = 100;
           const amtMatch = title.match(/\$?(\d+(?:\.\d+)?)/);
           if (amtMatch) amount = parseFloat(amtMatch[1]);
           const tl = /daily|every\s+day/i.test(phrase) ? 'daily' : /weekly/i.test(phrase) ? 'weekly' : /yearly|year/i.test(phrase) ? 'yearly' : 'monthly';
           mutations.push({
              date: today,
              type: 'CREATE_GOAL',
              payload: {
                 title: title.replace(/\$?(\d+(?:\.\d+)?)/, '').trim() || title,
                 targetAmount: amount,
                 deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
                 category: 'General',
                 timeline: tl
              }
           });
        } else {
            const goalRegexes = [
              /(?:new goal|set a goal)(?: to|:| for)?\s+(?:save|buy|purchase|fund)\s+([a-zA-Z\s]+?)(?:for|of|to save)?\s*\$?(\d+(?:\.\d+)?)/i,
              /(?:want to save|goal is to save)\s*\$?(\d+(?:\.\d+)?)\s+(?:for|to|on)\s+([a-zA-Z\s]+)/i,
              /(?:create finance goal|add financial goal)(?: to|:| for)?\s+(.*?)(?:\.|and|$)/i,
              /(?:set a goal)(?: to|:| for)?\s+([a-zA-Z\s]+?)\s+\$(\d+(?:\.\d+)?)/i,
              /(?:new goal|set a goal)(?: to|:| for)\s+(.*?)(?:\.|and|$)/i
            ];
            
            for (const regex of goalRegexes) {
                const match = phrase.match(regex);
                if (match) {
                    let title = "";
                    let amount = 0;
                    if (match[2] && parseFloat(match[2]) > 0 && !isNaN(parseFloat(match[2]))) {
                       title = match[1].trim();
                       amount = parseFloat(match[2]);
                    } else if (match[1] && parseFloat(match[1]) > 0 && !isNaN(parseFloat(match[1])) && match[2]) {
                       title = match[2].trim();
                       amount = parseFloat(match[1]);
                    } else if (match[1]) {
                       title = match[1].trim();
                       const amtMatch = title.match(/\$?(\d+(?:\.\d+)?)/);
                       if (amtMatch) amount = parseFloat(amtMatch[1]);
                    }
                    if (title) {
                      mutations.push({
                          date: today,
                          type: 'CREATE_GOAL',
                          payload: {
                             title: title.replace(/\$?(\d+(?:\.\d+)?)/, '').trim() || title,
                             targetAmount: amount || 100,
                             deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
                             category: 'General'
                          }
                      });
                      break; 
                    }
                }
            }
        }
    }

    // Generic Tracker Keyword mapping (e.g., "marked workout as done with 15 reps")
    if (/\b(?:completed?|finished?|did|went to|practiced|read|studied|ran|meditated|worked out|exercised)\b/i.test(phrase)) {
        const hm = phrase.match(/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|mins?|m)/i);
        const rm = phrase.match(/(\d+)\s*(?:times|reps?|pages?|steps)/i);
        const im = phrase.match(/(?:did|completed|finished|practiced|went to)\s+(?:my\s+)?([a-zA-Z][a-zA-Z\s]+?)(?:\s+(?:for|with|today|yesterday|\d)|$)/i) || phrase.match(/\b(gym|yoga|meditation|run|walk|reading|coding|studying)\b/i);
        
        if (im && im[1]) {
            let item = im[1].trim().replace(/\b(?:as done|today|yesterday)\b/gi, '').trim();
            const isAlreadyMatched = mutations.some(m => m.type === 'LOG_TRACKER' && m.payload.item.toLowerCase() === item.toLowerCase());
            if (!isAlreadyMatched && item.length > 1 && item.toLowerCase() !== 'my' && item.toLowerCase() !== 'the') {
                let hours = 0;
                if (hm) {
                    hours = parseFloat(hm[1]);
                    if (hm[0].includes('min') || hm[0].includes(' m')) hours = hours / 60;
                }
                mutations.push({
                   date: today,
                   type: 'LOG_TRACKER',
                   payload: {
                      item: item.substring(0, 40),
                      categoryId: 'custom',
                      status: 'done',
                      reps: rm ? parseInt(rm[1]) : 0,
                      hours: hours
                   }
                });
            }
        }
    }

    // Reminders
    const rm = phrase.match(/(?:remind\s+(?:me\s+)?to|set\s+reminder\s+(?:for\s+)?(?:to)?|don'?t\s+forget\s+(?:to)?)\s+(.+?)(?:\s+(?:at|by|on|tomorrow|today)|$)/i);
    if (rm) {
       const tm2 = phrase.match(/\bat\s+([\d:apm\s]+(?:am|pm)?)/i);
       const dm2 = phrase.match(/\b(tomorrow|today|yesterday)\b/i);
       mutations.push({
         date: dm2 ? resolveDate(dm2[0], today) : today,
         type: 'CREATE_REMINDER',
         payload: {
            title: rm[1].trim().substring(0,80),
            time: tm2 ? tm2[1].trim() : '',
            priority: lowerPhrase.includes('high') ? 'high' : 'medium'
         }
       });
    }

    // Finances
    const aiFin = extractAmt(phrase);
    if (aiFin && aiFin.amount > 0 && /spent|paid|bought|received|earned|income|cost/i.test(phrase)) {
       const isIn = /received|earned|income|salary/i.test(phrase);
       const cm = phrase.match(/(?:on|for|at|from)\s+([a-zA-Z][a-zA-Z\s]+?)(?:\s*$|(?:\s+(?:yesterday|today|tomorrow)))/i);
       const dm = phrase.match(/\b(yesterday|today|tomorrow)\b/i);
       mutations.push({
          date: dm ? resolveDate(dm[0], today) : today,
          type: 'LOG_FINANCE',
          payload: {
             amount: aiFin.amount,
             currency: aiFin.currency,
             type: isIn ? 'income' : 'expense',
             concept: (cm?.[1]||'Transaction').trim().substring(0,50),
             category: detectCat(phrase)
          }
       });
    }

    // Mood
    if (lowerPhrase.includes('feel') || lowerPhrase.includes('mood')) {
       let mood = 5;
       if (lowerPhrase.includes('bad') || lowerPhrase.includes('sad') || lowerPhrase.includes('terrible')) mood = 2;
       if (lowerPhrase.includes('great') || lowerPhrase.includes('awesome') || lowerPhrase.includes('fantastic')) mood = 5;
       if (lowerPhrase.includes('okay') || lowerPhrase.includes('alright')) mood = 3;
       
       mutations.push({
          date: today,
          type: 'UPDATE_JOURNAL_METRICS',
          payload: {
             mood: mood
          }
       });
    }

    // Settings
    if (lowerPhrase.includes('change theme to') || lowerPhrase.includes('set theme to')) {
       const themeMatch = lowerPhrase.match(/(?:change|set) theme to (dark|light|neon|cyberpunk|midnight|ocean|forest)/i);
       if (themeMatch) {
          mutations.push({
             date: today,
             type: 'UPDATE_SETTINGS',
             payload: {
                theme: themeMatch[1]
             }
          });
       }
    }
    
    if (lowerPhrase.includes('budget') || lowerPhrase.includes('limit')) {
       const budgetMatch = lowerPhrase.match(/(?:set|change) (?:daily )?budget(?: limit)? to \$?(\d+(?:\.\d+)?)/i);
       if (budgetMatch) {
           mutations.push({ date: today, type: 'UPDATE_SETTINGS', payload: { dailyBudgetLimit: parseFloat(budgetMatch[1]) } });
       }
    }
  }

  // Append generic journal reflection only if no other mutations were found
  if (mutations.length === 0) {
      if (lower.includes('reflect') || lower.includes('thought') || lower.includes('diary')) {
          const topicMatch = text.match(/(?:diary|thought|reflect)(?: about| on)? (.*?)(?:\.|and|$)/i);
          mutations.push({
             date: today,
             type: 'APPEND_JOURNAL',
             payload: {
                topic: topicMatch && topicMatch[1] ? topicMatch[1].trim() : 'Self Reflection',
                text: text,
                createNewHeading: true
             }
          });
      } else {
          // Fallback: If no actions found, treat as general journal entry.
          let topic = 'General Note';
          let createNewHeading = false;
          if (lower.includes('win') || lower.includes('accomplish')) { topic = 'wins'; }
          else if (lower.includes('blocker') || lower.includes('difficult')) { topic = 'blockers'; }
          else if (lower.includes('tomorrow') || lower.includes('plan')) { topic = 'tomorrow'; }
          
          mutations.push({
             date: today,
             type: 'APPEND_JOURNAL',
             payload: {
                topic: topic,
                text: text.trim(),
                createNewHeading: createNewHeading
             }
          });
      }
  }

  return { mutations: mutations };
}
