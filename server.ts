import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));

  // API Route for Parsing Finances
  app.post("/api/parse-finances", async (req, res) => {
    try {
      const { text, filename, fileData, fileMime, localTime, today } = req.body;
      if (!text && !fileData) {
        return res.status(400).json({ error: "No text or file provided" });
      }

      const prompt = `You are the OmniLife Universal Financial Parsing Engine, an absurdly advanced NLP financial intelligence system. You are trained on millions of real-world global transactions, bank statements, OCR scans, Receipts, and stream-of-consciousness financial talk. Your objective is to flawlessly structure and parse any raw text or files into a clean JSON array of transaction objects.

*** TEMPORAL REASONING STRATEGY (CRITICAL) ***
- Today's date is: "${today || new Date().toISOString().split('T')[0]}"
- Current user reference time is: "${localTime || new Date().toISOString()}"
- Interpret relative times and dates contextually with extreme care: "today", "yesterday", "last Wednesday", "tomorrow morning", "5 days ago", etc.
- If the current date is 2026-05-27:
  - "yesterday" corresponds exactly to "2026-05-26"
  - "today" corresponds exactly to "2026-05-27"
  - "on Tuesday" means the closest previous Tuesday.
- Output the "date" strictly formatted as "YYYY-MM-DD".
- If a time is mentioned (e.g., "at 4pm", "13:30"), convert to 24-hour style "HH:MM:SS" (e.g., "16:00:00" or "13:30:00"). If no time is explicitly or implicitly mentioned, fallback exactly to "12:00:00".

*** REAL-WORLD BANKING/STATEMENT LOGS AWARENESS ***
Humans copy-paste chaotic lines. You must be resilient against:
- OCR noise or line breaks.
- Ignorable document metadata (e.g., transaction IDs, run balances, headers).
- Missing positive/negative indicators: infer type based on semantics (e.g., "Uber" is an expense, "Refund" or "Salary" is credit/income).
- Explicit or implicit split billing: (e.g., "sent Rs 450 to Alex on 26 May split with Alex" or "I lent 20 to John"). Mark \`splitWith\`, \`splitType\` ('lent', 'borrowed', 'split-equally', 'none'), and \`splitAmount\`.

*** CURRENCY EXTRACTION DIRECTIVE ***
- Actively detect the currency mentioned in the text (e.g., "$", "Rs", "INR", "₹", "EUR", "€", "GBP", "£", "AED", "₩", "CAD", "AUD").
- Return the exact currency symbol or standard 3-letter code in the "currency" field. Default to "USD" or "$" if absolutely unspecified.

*** EXTRACTION DIRECTIVES (PRECISION CLEANING) ***
1. Output ONLY valid, clean JSON representing an array of objects. NEVER enclose inside a markdown code block like \`\`\`json. Return naked raw JSON.
2. concept: Strip unnecessary prefixes or IDs. Capture the clean merchant or counterpart name:
   - Example "ACH POS DEBIT - UBER EATS *12345" becomes "Uber Eats".
   - Example "PAYMENT RECEIVED FROM JOHN" becomes "John".
3. category: Map to exactly one of our whitelist options: [General, Food, Transport, Shopping, Income, Entertainment, Bills, Savings, Medical, Education].

JSON SCHEMA STRUCTURE:
[
  {
    "date": "YYYY-MM-DD",
    "time": "HH:MM:SS",
    "amount": 12.34,
    "concept": "Uber Eats",
    "type": "debit",
    "category": "Food",
    "transactionNo": "TRX-123",
    "place": "New York",
    "currency": "USD",
    "splitWith": "Name of person if split",
    "splitType": "none | lent | borrowed | split-equally",
    "splitAmount": 6.17
  }
]

RAW TEXT PAYLOAD (Filename: ${filename || "pasted_text.txt"}):
${text ? text.substring(0, 100000) : "Rely on multimodal context/attached file metadata."}
`;

      const parts: any[] = [{ text: prompt }];
      if (fileData && fileMime) {
        parts.push({
          inlineData: {
            data: fileData,
            mimeType: fileMime
          }
        });
      }

      let response: any;
      let retries = 5;
      let delay = 3000;
      while (retries > 0) {
        try {
          response = await ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: { parts },
            config: {
                responseMimeType: "application/json",
                temperature: 0.1,
                responseSchema: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      amount: { type: Type.NUMBER },
                      concept: { type: Type.STRING },
                      type: { type: Type.STRING },
                      category: { type: Type.STRING },
                      date: { type: Type.STRING }
                    }
                  }
                }
            }
          });
          break;
        } catch (err: any) {
          retries--;
          console.warn(`Finance parser error (status: ${err?.status || 'unknown'}), retrying... (${retries} left)`);
          if (retries === 0) throw err;
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2;
        }
      }

      let resultText = response?.text || "[]";
      const firstBracket = resultText.indexOf('[');
      const lastBracket = resultText.lastIndexOf(']');
      if (firstBracket !== -1 && lastBracket !== -1) {
         resultText = resultText.substring(firstBracket, lastBracket + 1);
      }
      const parsedData = JSON.parse(resultText);

      res.json({ transactions: parsedData });

    } catch (error: any) {
      console.error("AI Parsing Error:", error);
      res.status(500).json({ error: error.message || "Failed to parse data" });
    }
  });

app.post("/api/analyze-journal", async (req, res) => {
    try {
      const { text, localTime } = req.body;
      if (!text) {
        return res.status(400).json({ error: "No text provided" });
      }

      const prompt = `You are an elite, highly advanced Life Operating System AI and cognitive extraction engine. You have been extensively trained on millions of real-world human journals, unstructured brain dumps, stream-of-consciousness logs, and erratic scheduling notes. Your objective is to meticulously analyze the following raw journal entry and extract structured actionable data across multiple life modules without missing a single implicit or explicit action item.

*** CONTEXT & TEMPORAL INTELLIGENCE ***
- **User's Current Local ISO Time:** ${localTime}
- You must perform hyper-accurate contextual date/time math. Humans write "tomorrow morning", "next Friday", "in 3 weeks", "12th may". 
- If the current month is May 2026, "12th may" means "2026-05-12".
- "tonight at 8" means today's date at 20:00.
- If the user implies an event just happened (e.g., "I just spent $50 on gas"), log the date as today.

*** EXTRACTION MODULES & BEHAVIORAL PATTERNS ***
1. "reminders" (Events, Tasks, Appointments)
   - Humans forget details. Infer priority and type. If they say "flight to NYC", priority="high", type="Trip Deadline", enableAlert=true.
   - "title": Clean concise title (e.g., "Flight to NYC").
   - "date": "YYYY-MM-DD". Extremely critical.
   - "time": "HH:MM" (24h). If none, "".
   - "location": Extracted place (e.g., "Airport", "JFK", "Dentist Office").
   - "description": Keep rich context. Include booking refs, names, reasons.
   - "priority": "low" | "medium" | "high". Urgent/Deadlines = high.
   - "type": "Assignment Due", "Exam Prep", "Meeting", "Birthday", "Bill Payment", "Doctor Appt", "Project Deadline", "Personal", "Finance", "Trip Deadline", "Other".
   - "enableAlert": boolean. Set to true if they mention time, "remind me", "have to", "flight", "call", "urgent".

2. "finances" (Micro-transactions, budgeting)
   - Humans say "grabbed a 5 buck coffee", "owed Jim $20", "paid rent 1500".
   - "concept": "Coffee", "Jim (Debt)", "Rent". Clean and pristine.
   - "amount": absolute float (e.g. 5, 20, 1500).
   - "type": "expense" or "income".
   - "category": "Food" | "Transport" | "Shopping" | "Income" | "Entertainment" | "Bills" | "Savings" | "General".
   - "date": "YYYY-MM-DD".

3. "tracker" (Habits, routines, reps, hours) [PAST / ACCOMPLISHED ACTIONS]
   - *CRITICAL DISTINCTION*: This is ONLY for things the user HAS DONE. If they say "I played 2 hours of tennis yesterday", "I read 50 pages tonight", this is a tracker log. 
   - "itemTitle": "Tennis", "Read book", "Programming".
   - "reps": integer (e.g. 50).
   - "hours": float (e.g. 2.0).
   - "date": "YYYY-MM-DD" of when it was performed.

4. "goals" (Ambitions, Resolutions, Targets) [FUTURE / ASPIRATIONAL ACTIONS]
   - *CRITICAL DISTINCTION*: This is for things the user WANTS to do continuously or achieve. If they say "I have to play 2 hours of tennis every weekend", "I want to run 10k by next month", this is a goal setting intent. Do not confuse this with tracker.
   - "title": "Play Tennis", "Run 10k", "Save $5000".
   - "target": "2 hours/weekend", "10k", "$5000".
   - "timeline": "daily" | "weekly" | "monthly" | "yearly".

5. "expeditions" (Trips, Vacations, Journeys)
   - Humans say "I'm going to Bali from June 1st to June 14th", "Trip to Tokyo next weekend".
   - "title": Clean title (e.g., "Trip to Bali", "Tokyo Weekend").
   - "dateStart": "YYYY-MM-DD" of the trip start.
   - "dateEnd": "YYYY-MM-DD" of the trip end.
   - "location": String (e.g. "Bali, Indonesia", "Tokyo").
   - "notes": Any specific context.

*** STRICT RULES ***
1. Output ONLY a valid JSON object with an "actions" array. NO markdown \`\`\`json. NO conversational text.
2. DIFFERENTIATE PAST VS FUTURE: "I did X" -> Tracker. "I want/need to do X regularly" -> Goal. "Remind me to do X once on Friday" -> Reminder.
3. Be excessively aggressive in finding data. Overlap is fine: "paid gym membership $40 and worked out 1 hour" = 1 finance item + 1 tracker item.

JSON SCHEMA:
{
  "actions": [
    {
      "module": "reminders",
      "title": "Flight to NYC",
      "date": "2026-05-12",
      "time": "14:00",
      "location": "JFK Airport",
      "description": "Terminal 4, bring passport.",
      "priority": "high",
      "type": "Trip Deadline",
      "enableAlert": true
    },
    {
      "module": "expeditions",
      "title": "Trip to Tokyo",
      "dateStart": "2026-06-01",
      "dateEnd": "2026-06-14",
      "location": "Tokyo, Japan",
      "notes": "Booked flights with ANA."
    }
  ]
}

RAW HUMAN JOURNAL ENTRY:
${text}
`;

      let aiResponse: any;
      let retries = 5;
      let delay = 3000;
      while (retries > 0) {
        try {
          aiResponse = await ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            config: {
              temperature: 0.1,
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  actions: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        module: { type: Type.STRING },
                        title: { type: Type.STRING },
                        date: { type: Type.STRING },
                        time: { type: Type.STRING },
                        location: { type: Type.STRING },
                        description: { type: Type.STRING },
                        priority: { type: Type.STRING },
                        type: { type: Type.STRING },
                        enableAlert: { type: Type.BOOLEAN },
                        alertOffset: { type: Type.NUMBER },
                        dateStart: { type: Type.STRING },
                        dateEnd: { type: Type.STRING },
                        notes: { type: Type.STRING },
                        amount: { type: Type.STRING },
                        concept: { type: Type.STRING },
                        category: { type: Type.STRING },
                        itemTitle: { type: Type.STRING },
                        reps: { type: Type.STRING },
                        hours: { type: Type.STRING },
                        target: { type: Type.STRING },
                        timeline: { type: Type.STRING }
                      }
                    }
                  }
                }
              }
            },
          });
          break; // success
        } catch (err: any) {
          retries--;
          console.warn(`AI Analysis error (status: ${err?.status || 'unknown'}), retrying... (${retries} retries left)`);
          if (retries === 0) {
            console.error("AI Analysis failed:", err);
            throw err;
          }
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2;
        }
      }

      let rawContent = aiResponse?.text;
      if (!rawContent) {
        throw new Error("No output from AI");
      }

      const firstBrace = rawContent.indexOf('{');
      const lastBrace = rawContent.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
         rawContent = rawContent.substring(firstBrace, lastBrace + 1);
      }
        
      const parsed = JSON.parse(rawContent);
      res.json(parsed);
    } catch (e: any) {
      console.error("AI Journal Analysis Error:", e.message);
      res.status(500).json({ error: e.message });
    }
  });

  // API Route for Voice Journal Routing (Simulating Advanced Local NLP)
  app.post("/api/voice-journal-routing", async (req, res) => {
    try {
      const { text, currentPrompts, currentSections } = req.body;
      if (!text) {
        return res.status(400).json({ error: "No text provided" });
      }

      const prompt = `You are the OmniLife Context Engine, an absurdly advanced NLP parser designed to map highly colloquial, rambling, and unstructured voice transcripts directly into a clean, structured journal schema.

Your objective is to map free-form transcriptions of speech into the correct journal sections. 
The user might speak dynamically, informally describing what they did:
- E.g. "So first thing is I went to the gym did chest... second thing I bought a coffee for 5 bucks... third is I'm feeling kinda tired"
- E.g. "Put this under How was the day: I'm good. For Tomorrow I want to do a lot of exercise. Oh and add a new heading for Finance, I spent 500 on rent."

Current available predefined headings (prompts - prefer mapping to these if the semantic intent matches):
${JSON.stringify(currentPrompts)}

Current content already in these headings (APPEND to it, DO NOT overwrite/replace existing content):
${JSON.stringify(currentSections)}

*** MASSIVE EXTRACTION INTELLIGENCE DIRECTIVE ***
1. SEMANTIC MATCHING: Look past exact words. If the user says "first I ate...", map that to "Meals" or "Diet" if such a heading exists.
2. DYNAMIC HEADING CREATION: If the user says "Create a new heading called X" or explicitly creates sequences that don't fit current prompts (e.g. "First thing is... second thing is..."), synthesize new appropriate headings contextually! For example, "First thing..." might become a new label "Task 1", or if it's about gym, label it "Fitness".
3. CONVERSATIONAL CLEANUP: Remove fillers like "um", "ah", "like". Extract the core meaning but maintain the user's voice.
4. APPEND ONLY: If a section already has text, output the EXISTING text plus a newline, then the NEW text. Do NOT delete what's already there!
5. EXACT JSON OUTPUT ONLY. NO MARKDOWN WRAPPERS. NO CHAT.

EXPECTED JSON FORMAT:
{
  "updatedSections": {
    "existing_prompt_id": "existing text plus new formatted text",
    "prompt_NEW_ID_randomness": "new text for new heading"
  },
  "newPromptsCreated": [
    { "id": "prompt_NEW_ID_randomness", "label": "The newly inferred heading", "placeholder": "..." }
  ],
  "triggerAutoLog": true
}

RAW TRANSCRIPTION:
"${text}"
`;

      let aiResponse: any;
      let retries = 5;
      let delay = 3000;
      while (retries > 0) {
        try {
          aiResponse = await ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            config: { 
              temperature: 0.1, 
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  updatedSections: { type: Type.OBJECT },
                  newPromptsCreated: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING },
                        label: { type: Type.STRING },
                        placeholder: { type: Type.STRING }
                      }
                    }
                  },
                  triggerAutoLog: { type: Type.BOOLEAN }
                }
              }
            },
          });
          break;
        } catch (err: any) {
          retries--;
          await new Promise(resolve => setTimeout(resolve, delay));
          if (retries === 0) throw err;
          delay *= 2;
        }
      }

      let rawContent = aiResponse?.text || "{}";
      const firstBrace = rawContent.indexOf('{');
      const lastBrace = rawContent.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
         rawContent = rawContent.substring(firstBrace, lastBrace + 1);
      }
      res.json(JSON.parse(rawContent));
    } catch (e: any) {
      console.error("Local Voice AI Error:", e.message);
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/search-life", async (req, res) => {
    try {
      const { text, today, stateSummary } = req.body;
      if (!text) return res.status(400).json({ error: "No text provided" });

      const prompt = `You are "The Priest", a deeply introspective, wise, and analytical AI observer within this individual's Personal Operating System.
The user is speaking to you informally and asking a question about their life data (e.g., "what did I do yesterday", "how am I doing", "what did I spend").
Current Date: ${today}

Your goal:
1. Parse the temporal and contextual intent from their informal query.
2. Determine if the user is asking a conversational question that requires a direct summary of the data provided in stateSummary.
3. Provide a profound, highly analytical, and insightful answer that directly addresses their informal request. Read between the lines of their habits, spending, and journals.

Available State Summary context (snapshot of recent life data):
${JSON.stringify(stateSummary)}

Respond with JSON:
{
  "filters": {
    "dateStart": "YYYY-MM-DD",
    "dateEnd": "YYYY-MM-DD",
    "module": "all | tracker | journal | finance | expedition | reminder",
    "keywords": ["array", "of", "search", "terms"]
  },
  "answer": "Write in the voice of a wise, observant guide. Summarize what you see in the provided State Summary that answers their question. Be direct, deeply insightful, and speak to them about their life patterns."
}
If no exact date is specified, use a reasonable default window and provide a broader analysis.`;
      
      let response;
      let retries = 5;
      let delay = 3000;
      while (retries > 0) {
        try {
          response = await ai.models.generateContent({
            model: "gemini-1.5-flash",
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            config: {
              temperature: 0.1,
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  filters: {
                    type: Type.OBJECT,
                    properties: {
                      dateStart: { type: Type.STRING },
                      dateEnd: { type: Type.STRING },
                      module: { type: Type.STRING },
                      keywords: { type: Type.ARRAY, items: { type: Type.STRING } }
                    }
                  },
                  answer: { type: Type.STRING }
                }
              }
            },
          });
          break; // success
        } catch(e: any) {
           if (e.message && e.message.includes('429')) {
             retries--;
             if (retries === 0) throw e;
             await new Promise(r => setTimeout(r, delay));
             delay *= 2;
           } else {
             throw e;
           }
        }
      }
      
      let rawContent = response?.text || "{}";
      const firstBrace = rawContent.indexOf('{');
      const lastBrace = rawContent.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
         rawContent = rawContent.substring(firstBrace, lastBrace + 1);
      }
      res.json(JSON.parse(rawContent));
    } catch (e: any) {
      console.error("Search Life API Error:", e.message);
      res.status(500).json({ error: e.message });
    }
  });

  // API Route for Global Omni Assistant
  app.post("/api/omni-command", async (req, res) => {
    try {
      const { text, stateContext, today } = req.body;
      if (!text) {
        return res.status(400).json({ error: "No text provided" });
      }

      const prompt = `You are the OmniLife Engine, a highly advanced global AI assistant that manages the user's entire life via an integrated app.
The user will naturally talk to you in an informal, colloquial, or even rambling manner. Your job is to listen, deeply understand their intent, and dispatch the correct system mutations.

Current Date: ${today}

Available System Mutations (Commands):
- CREATE_GOAL: { id: "g_" + Math.random(), title, targetAmount, currentAmount: 0, deadline: "YYYY-MM-DD", category: "General" }
- LOG_TRACKER: { categoryId, item: "task name", status: "done" | "missed" | "skipped", notes: "optional extracted context", date?: "YYYY-MM-DD" }
- EDIT_TRACKER: { categoryId, item: "task name", targetField: "reps" | "hours", value: number, date?: "YYYY-MM-DD" }
- SET_TRACKER_GOAL: { categoryId, item: "task name", targetField: "reps" | "hours", value: number } <-- Use this only when setting, creating or changing routine targets or goal values for reps/hours (e.g. "set gym target reps to 15" or "set chemotherapy target to 3 hours") in the daily tracker.
- CREATE_REMINDER: { id: "rem_" + Math.random(), title, priority: "high"|"medium"|"low", category: "general", dueDate: "YYYY-MM-DD", time: "HH:MM", enableAlert: boolean }
- LOG_FINANCE: { id: "tx_" + Math.random(), type: "income"|"expense", amount: number, concept: string, category: string, date: "YYYY-MM-DD", currency: "USD" }
- UPDATE_SETTINGS: { theme?: string, bgTheme?: string, dailyBudgetLimit?: number, dailyIncomeTarget?: number }
- APPEND_JOURNAL: { topic: string, text: string, createNewHeading?: boolean, date?: "YYYY-MM-DD" }  <-- Use this to log thoughts, feelings, reflections, or general journal entries.
  - Guidelines for topics/headings:
    1. If the user explicitly mentions wishing to log under a brand-new custom heading (e.g. "create a new heading called Workout", "add new heading Biochemistry Notes and put X", or "make a new heading called Friday Musings"), set 'topic' to that heading name (e.g. "Biochemistry Notes") and set 'createNewHeading' to true.
    2. If the user explicitly mentions wishing to log under an already existing heading (e.g. "add to my wins X", "put X under free notes", or "challenge is X"), find the matching heading in 'stateContext.journalPrompts' list and set 'topic' to its label or id (and leave 'createNewHeading' absent or false).
    3. If the user does NOT explicitly specify any heading:
       - Deeply analyze their spoken transcript to naturally categorize which of the existing prompts ('stateContext.journalPrompts') matches best.
         * Pride, achievements, good occurrences -> "🏆 WINS & HIGHLIGHTS".
         * Obstacles, difficulties, struggles -> "🧱 BLOCKERS & CHALLENGES".
         * Priorities, to-do focus, lists -> "🎯 TODAY'S TOP 3 FOCUS".
         * Intimate thoughts, generic logs, mood entries, daily overview -> "Daily Reflection" (which translates to free notes).
       - If no heading category fits, or if they are just rambling generally without clear category matches, select "Daily Reflection" as the topic.
    4. Ensure NO user spoken information is ever lost. If they cover multiple separate topics (e.g. "I had a great run today but had a tough meeting later"), split them into multiple separate APPEND_JOURNAL mutations so they land under correct headings correctly.
- UPDATE_JOURNAL_METRICS: { mood?: number, energy?: number, addTags?: string[], date?: "YYYY-MM-DD" } <-- Scale is 1-5 for mood and energy.
- ADD_EXPEDITION: { id: "exp_" + Math.random(), title, concept, status: "planning" }
- DELETE_ITEM: { type: "reminder"|"finance"|"goal", id: string }

Return JSON format: { "mutations": [ { type: "...", payload: { ... } } ] }. Focus on returning ONLY reliable commands. Extract the intent. If user asks to edit past entries, be sure to pass the date in 'YYYY-MM-DD' format if mentioned. The date attribute is always optional, defaults to 'today'.

User Transcript:
"${text}"

Current App Context summary (Categories, active tasks, etc - Use this to map tracker categories properly):
${JSON.stringify(stateContext)}

*** MASSIVE INTELLIGENCE DIRECTIVES ***
1. Identify EVERYTHING the user wants to do. E.g., if they say "Change theme to neon, I also spent 5 bucks on coffee, and my chest workout is done", you must return THREE mutations (UPDATE_SETTINGS, LOG_FINANCE, LOG_TRACKER).
2. For Settings, if they say "customize my alerts", just return a conversational response telling them how to do it manually OR if it's a known setting like theme/bg, change it.
3. INFER DETAILS: If they say "Remind me to call John tomorrow", calculate tomorrow's date based on Current Date. Assume noon if time not specified.
4. ONLY RETURN VALID JSON. NO MARKDOWN WRAPPERS. NO EXTRA TEXT. 

EXPECTED JSON SCHEMA:
{
  "mutations": [
    {
      "type": "COMMAND_NAME",
      "payload": { ... }
    }
  ],
  "aiResponse": "A highly personalized, extremely conversational, and advanced human-like response summarizing what you just did for them. Be friendly, empathetic, and smart."
}
`;

      let aiResponse: any;
      let retries = 5;
      let delay = 3000;
      while (retries > 0) {
        try {
          aiResponse = await ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            config: { 
              temperature: 0.2, 
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  mutations: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        type: { type: Type.STRING },
                        payload: { type: Type.OBJECT }
                      }
                    }
                  },
                  aiResponse: { type: Type.STRING }
                }
              }
            },
          });
          break;
        } catch (err: any) {
          retries--;
          // Always wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, delay));
          if (retries === 0) throw err;
          delay *= 2;
        }
      }

      let rawContent = aiResponse?.text || "{}";
      const firstBrace = rawContent.indexOf('{');
      const lastBrace = rawContent.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
         rawContent = rawContent.substring(firstBrace, lastBrace + 1);
      }
      res.json(JSON.parse(rawContent));
    } catch (e: any) {
      console.error("Omni Voice AI Error:", e.message);
      res.status(500).json({ error: e.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
