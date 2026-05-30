import React, { useState } from "react";
import { AppState, ExpeditionExpense, Reminder } from "../types";
import { Plus, Trash2, Bell, AlertTriangle, CheckSquare, Square, ChevronDown, ChevronUp, Info, UploadCloud, Type, Search, MapPin, Printer, Clipboard, FileText, SlidersHorizontal, ArrowUpDown, Edit2, Activity, X } from "lucide-react";
import { CreateReminderModal } from "./CreateReminderModal";
import Papa from 'papaparse';
import * as XLSX from "xlsx";

import * as pdfjsLib from 'pdfjs-dist';

// Setting worker for pdfjs safely
try {
  if (pdfjsLib && pdfjsLib.GlobalWorkerOptions) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.0.379'}/pdf.worker.min.mjs`;
  }
} catch (e) {
  console.error("PDF.js worker setup failed:", e);
}

const safeBtoa = (str: string): string => {
  try {
    return btoa(unescape(encodeURIComponent(str)));
  } catch (e) {
    const clean = str.replace(/[^\x00-\x7F]/g, "");
    try {
      return btoa(clean);
    } catch {
      return Math.random().toString(36).substring(2, 10);
    }
  }
};

export const FinancesView: React.FC<{
  state: AppState;
  saveData: any;
  setAppState: any;
  onAddReminder: (rem: Omit<Reminder, "id" | "status">) => void;
}> = ({ state, saveData, setAppState, onAddReminder }) => {
  const curr = state.profile?.preferredCurrency || "$";
  const [concept, setConcept] = useState("");
  const [amount, setAmount] = useState("");
  const [txType, setTxType] = useState<"expense" | "income">("expense");
  const [splitWith, setSplitWith] = useState("");
  const [splitType, setSplitType] = useState<"none" | "lent" | "borrowed" | "split-equally">("none");
  const [splitAmount, setSplitAmount] = useState("");
  const [links, setLinks] = useState("");
  const [createReminder, setCreateReminder] = useState(false);
  const [reminderTime, setReminderTime] = useState("");
  const [alertOffset, setAlertOffset] = useState("0");

  // Advanced search, sorting, filtering and copy/pasting statement states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [sortBy, setSortBy] = useState("date-desc");
  const [textStatement, setTextStatement] = useState("");
  const [showStatementModal, setShowStatementModal] = useState(false);

  const [financeTab, setFinanceTab] = useState<'quick' | 'advanced' | 'file_import' | 'text_import' | 'external_ai' | 'splits'>('quick');
  const [importSubTab, setImportSubTab] = useState<'file' | 'paste'>('file');
  const [rawPasteText, setRawPasteText] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiPercent, setAiPercent] = useState(0);
  const [aiParseFailed, setAiParseFailed] = useState(false);
  const [parsedPasteTxs, setParsedPasteTxs] = useState<any[]>([]);
  const [advDate, setAdvDate] = useState(new Date().toISOString().split("T")[0]);
  const [advTime, setAdvTime] = useState("");
  const [advTxType, setAdvTxType] = useState<string>("debit");
  const [advCategory, setAdvCategory] = useState("General");
  const [advLocation, setAdvLocation] = useState("");
  const [customTxType, setCustomTxType] = useState("");
  const [customGoalCategory, setCustomGoalCategory] = useState("");
  
  const [isDragOver, setIsDragOver] = useState(false);
  const [showFormatModal, setShowFormatModal] = useState(false);
  
  const [loadedFile, setLoadedFile] = useState<{
    name: string;
    text?: string;
    base64?: string;
    mime?: string;
    isTextBased: boolean;
  } | null>(null);
  const [selectedAIProcessor, setSelectedAIProcessor] = useState<'none' | 'instant' | 'external'>('none');
  const [externalAiPasteValue, setExternalAiPasteValue] = useState("");
  const [isCopied, setIsCopied] = useState(false);

  const [reminderModal, setReminderModal] = useState<{
    isOpen: boolean;
    defaultTitle: string;
    defaultNotes: string;
    mode: "reminder" | "alert";
  } | null>(null);

  // Collapsible dropdown states to prevent heavy scrolling clutter
  const [isGoalsExpanded, setIsGoalsExpanded] = useState(true);
  const [isBudgetsExpanded, setIsBudgetsExpanded] = useState(false);
  const [isRemindersExpanded, setIsRemindersExpanded] = useState(false);
  const [goalsTab, setGoalsTab] = useState<'d' | 'w' | 'm' | 'y'>('d');

  // Editing state for financial logs
  const [editingTx, setEditingTx] = useState<ExpeditionExpense | null>(null);
  const [editConcept, setEditConcept] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editType, setEditType] = useState<string>("debit");
  const [editCategory, setEditCategory] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editSplitWith, setEditSplitWith] = useState("");
  const [editSplitType, setEditSplitType] = useState<"none" | "lent" | "borrowed" | "split-equally">("none");
  const [editSplitAmount, setEditSplitAmount] = useState("");
  const [editLinks, setEditLinks] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [visibleTxsCount, setVisibleTxsCount] = useState(10);

  const promptText = loadedFile ? `You are a highly advanced financial forensics intelligence system, trained on massive global datasets, accounting ledgers, and human behavioral data. I am giving you my raw financial statement records from the file '${loadedFile.name}'.
Your absolute directive is to parse this chaotic data flawlessly into a secure JSON array.

*** STATEMENT DETAILS ***
File Name: ${loadedFile.name}
${loadedFile.isTextBased ? `
*** STATEMENT DATA CONTENT ***
${loadedFile.text || ""}
` : `
[DRAG_AND_DROP_ALERT] Since this is a PDF or an Image file, please drag and drop the original file '${loadedFile.name}' directly into your external AI window alongside this instruction prompt.
`}

*** EXTRACTION INTELLIGENCE & REAL WORLD RULES ***
1. Identify all valid transaction logic. Handle all varying Date encodings (US/EU formats, shorthand "12th May", explicit "2026-05-12"), weird bank column shifts, and messy multi-line entries. 
2. ENTITY NAMING ("concept" field): Synthesize pristine canonical names. Remove generic noise ("POS DEBIT", "ACH Transfer", "Tx #192", city names if a chain like Starbucks is present). E.g. "VISA DIRECT *UBER EATS NY" -> "Uber Eats".
3. Calculate "type" purely as "debit" or "credit". Infer from the nature of the entity if math signs are missing (e.g. Salary = credit).
4. Assign "category" intelligently from: General, Food, Transport, Shopping, Income, Entertainment, Bills, Savings, Medical, Education.

*** OUTPUT SPECIFICATION ***
- DO NOT say "Here is the data" or "Sure". 
- Output ONLY valid client-side JSON block matching this EXACT layout inside a standard code block starting with \`\`\`json and ending with \`\`\`.

[
  {
    "date": "YYYY-MM-DD",
    "time": "HH:MM:SS",
    "amount": 12.34,
    "concept": "Clean Merchant Name Only",
    "type": "debit" | "credit",
    "category": "Food"
  }
]

Prepend or include this command string clearly before your code block:
"📋 STATE COMPILED PERFECTLY. COPY THE JSON ARRAY BELOW AND PASTE IT BACK INTO THE SECURE FILES PARSER IN OMNILIFE COCKPIT TO COMPLETE YOUR SECURE RECORD SYNCHRONIZATION."` : "";


  const startEditing = (tx: ExpeditionExpense) => {
    setEditingTx(tx);
    setEditConcept(tx.concept || "");
    setEditAmount(tx.amount?.toString() || "");
    setEditDate(tx.date || new Date().toISOString().split("T")[0]);
    setEditType(tx.type || "debit");
    setEditCategory(tx.category || "General");
    setEditLocation(tx.location || "");
    setEditSplitWith(tx.splitWith || "");
    setEditSplitType(tx.splitType || "none");
    setEditSplitAmount(tx.splitAmount?.toString() || "");
    setEditLinks(tx.links || "");
    setEditNotes(tx.notes || "");
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTx) return;
    if (!editConcept || !editAmount) return;

    setAppState((prev: AppState) => {
      const next = { ...prev };
      next.finances = (prev.finances || []).map((f) => {
        if (f.id === editingTx.id) {
          return {
            ...f,
            concept: editConcept,
            amount: parseFloat(editAmount),
            date: editDate,
            type: editType,
            category: editCategory,
            location: editLocation,
            splitWith: editSplitWith || undefined,
            splitType: editSplitType,
            splitAmount: editSplitAmount ? parseFloat(editSplitAmount) : undefined,
            links: editLinks || undefined,
            notes: editNotes || undefined,
            timestamp: editDate + (f.timestamp ? f.timestamp.substring(10) : 'T12:00:00Z'),
          };
        }
        return f;
      });
      saveData(next);
      return next;
    });

    setEditingTx(null);
  };

  // Custom financial goals states
  const [goalTitle, setGoalTitle] = useState("");
  const [goalTarget, setGoalTarget] = useState("");
  const [goalCurrent, setGoalCurrent] = useState("");
  const [goalDeadline, setGoalDeadline] = useState("");
  const [goalCategory, setGoalCategory] = useState("Savings");

  const handleQuickLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!concept || !amount) return;
    const expense: ExpeditionExpense = {
      id: "tx_" + safeBtoa(Date.now() + concept + amount).slice(0, 16),
      date: new Date().toISOString().split("T")[0],
      timestamp: new Date().toISOString(),
      concept,
      notes: concept,
      amount: parseFloat(amount),
      currency: "USD",
      category: "General",
      type: txType as 'expense' | 'income' | 'debit' | 'credit', 
      source: 'quick',
    };
    saveTx(expense);
    setConcept("");
    setAmount("");
  };

  const handleAdvancedLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!concept || !amount) return;
    const datetimeStr = advDate + (advTime ? `T${advTime}:00Z` : 'T00:00:00Z');
    const finalTxType = advTxType === "custom" ? (customTxType.trim() || "custom") : advTxType;
    const finalCategory = advCategory === "custom" ? (customGoalCategory.trim() || "General") : advCategory;
    const expense: ExpeditionExpense = {
      id: "tx_" + safeBtoa(advDate + advTime + concept + amount).slice(0, 16),
      date: advDate,
      timestamp: datetimeStr,
      concept,
      notes: concept,
      amount: parseFloat(amount),
      currency: "USD",
      category: finalCategory,
      type: finalTxType,
      counterparty: splitWith.trim(),
      splitWith: splitWith.trim(),
      splitType: splitType,
      splitAmount: splitAmount ? parseFloat(splitAmount) : undefined,
      links: links.trim(),
      location: advLocation.trim(),
      source: 'advanced',
    };
    saveTx(expense);
    setConcept("");
    setAmount("");
    setSplitWith("");
    setSplitType("none");
    setSplitAmount("");
    setLinks("");
    setAdvCategory("General");
    setAdvLocation("");
    setCustomTxType("");
  };

  const saveTx = (expense: ExpeditionExpense) => {
    setAppState((prev: AppState) => {
      const next = { ...prev };
      if (!next.finances) next.finances = [];
      // Deduplication check
      if (next.finances.some(f => f.id === expense.id)) return prev;
      next.finances.push(expense);
      saveData(next);
      return next;
    });
  };

  const [aiAbortController, setAiAbortController] = useState<AbortController | null>(null);

  const importViaAiServer = async (text: string, filename: string, fileData?: string, fileMime?: string) => {
    setIsAiLoading(true);
    setAiParseFailed(false);
    setAiPercent(10);
    const interval = setInterval(() => {
        setAiPercent(p => Math.min(p + Math.floor(Math.random() * 20), 96));
    }, 500);
    setRawPasteText(text || "[File Attached: Offline Local Parsing...]"); // just to show it in UI optionally
    
    const controller = new AbortController();
    setAiAbortController(controller);

    try {
      const { parseFinancesLocally } = await import('../lib/ai/CommandParser');
      const parsed = parseFinancesLocally(text, new Date().toLocaleDateString('en-CA'));
      
      if (!Array.isArray(parsed) || parsed.length === 0) {
        alert("The AI could not confidently detect any ledger history. Try pasting clear text!");
        setParsedPasteTxs([]);
        setIsAiLoading(false);
        setAiParseFailed(true);
        setAiAbortController(null);
        clearInterval(interval);
        return;
      }
      
      const newTxs: any[] = [];

      for (const tx of parsed) {
        if (!tx.date || tx.amount == null || !tx.concept) continue;
        
        const rawId = tx.date + tx.amount + tx.concept;
        const cleanId = "tx_ai_" + safeBtoa(rawId.substring(0, 50)).slice(0, 16);
        const time = tx.time || "12:00:00";
        const timestampStr = `${tx.date}T${time}Z`;

        let parsedAmtStr = String(tx.amount).replace(/[^0-9.-]/g, '');
        let originalParsedAmt = parseFloat(parsedAmtStr);
        let absoluteAmt = Math.abs(originalParsedAmt);
        
        let typeMapping = tx.type === "credit" || tx.type === "income" ? "credit" : "debit";
        if (originalParsedAmt < 0) {
           typeMapping = "debit";
        }

        newTxs.push({
            id: cleanId,
            tempId: "paste_" + cleanId + "_" + Math.random().toString(36).substring(7),
            date: tx.date,
            timestamp: timestampStr,
            amount: absoluteAmt,
            concept: String(tx.concept || "Unknown").substring(0, 50),
            notes: "Auto-AI Extracted",
            category: tx.category || "General",
            currency: tx.currency || state.profile?.preferredCurrency || "$",
            source: "text_paste" as any,
            type: typeMapping,
            counterparty: tx.splitWith ? tx.splitWith.substring(0,30) : tx.concept.substring(0,30),
            location: tx.place || tx.location || undefined,
            splitWith: tx.splitWith || undefined,
            splitType: tx.splitType || "none",
            splitAmount: tx.splitAmount ? parseFloat(String(tx.splitAmount)) : undefined
        });
      }

      if (newTxs.length === 0) {
         alert("AI parsed successfully, but no valid transactions were found matching the required format.");
         setAiParseFailed(true);
         setIsAiLoading(false);
         setAiAbortController(null);
         clearInterval(interval);
         return;
      }

      clearInterval(interval);
      setAiPercent(100);

      setTimeout(() => {
          setParsedPasteTxs(newTxs);
          setFinanceTab('text_import');
          setImportSubTab('paste');
          setIsAiLoading(false);
          setAiAbortController(null);
      }, 400);
    } catch (e: any) {
      clearInterval(interval);
      if (e.name === 'AbortError') {
        alert("AI Analyzing stopped.");
      } else {
        alert("❌ Failed to process data with AI: " + e.message);
      }
      setIsAiLoading(false);
      setAiParseFailed(true);
      setAiAbortController(null);
    }
  };

  const cancelAiAnalysis = () => {
    if (aiAbortController) {
      aiAbortController.abort();
    }
  };

  const parseDateTimeStr = (str: string): { date: string; time: string | null } => {
    let finalDate = new Date().toISOString().split("T")[0];
    let finalTime: string | null = null;
    const cleanedStr = str.replace(/\s+/g, " ").trim();

    // Try to extract time
    const timeMatch = cleanedStr.match(/\b([01]?\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?(\s*[aApP][mM])?\b/);
    if (timeMatch) {
      let hh = parseInt(timeMatch[1]);
      const mm = timeMatch[2].padStart(2, '0');
      const ss = timeMatch[3] ? timeMatch[3].padStart(2, '0') : "00";
      const ampm = timeMatch[4] ? timeMatch[4].toLowerCase().trim() : "";
      if (ampm.includes("pm") && hh < 12) hh += 12;
      if (ampm.includes("am") && hh === 12) hh = 0;
      finalTime = `${String(hh).padStart(2, '0')}:${mm}:${ss}`;
    }

    // Excel serial numbers
    if (/^\d{5}(\.\d+)?$/.test(cleanedStr)) {
      const num = parseFloat(cleanedStr);
      if (num > 30000 && num < 60000) {
        const utc_days = Math.floor(num - 25569);
        const utc_value = utc_days * 86400;
        const date_info = new Date(utc_value * 1000);
        
        const fractional_day = num - Math.floor(num) + 0.0000001;
        let total_seconds = Math.floor(86400 * fractional_day);
        const secs = total_seconds % 60;
        total_seconds = Math.floor(total_seconds / 60);
        const mins = total_seconds % 60;
        const hours = Math.floor(total_seconds / 60);

        finalDate = date_info.toISOString().split("T")[0];
        if (!finalTime) {
          finalTime = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        }
        return { date: finalDate, time: finalTime };
      }
    }

    // Text Representation ("26 May 2026", "May 26, 2026")
    const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
    const textDt = cleanedStr.match(/\b(\d{1,2})?(?:st|nd|rd|th)?[\s\-_/\.]*([A-Za-z]{3,10})[\s\-_/\.]*(\d{1,2})?(?:st|nd|rd|th)?,?[\s\-_/\.]*(\d{2,4})?\b/i);
    if (textDt) {
      const mStr = textDt[2].toLowerCase().substring(0, 3);
      const mIdx = months.indexOf(mStr);
      if (mIdx !== -1) {
        const monthPart = String(mIdx + 1).padStart(2, '0');
        let dayVal = textDt[1] || textDt[3] || "01";
        dayVal = String(parseInt(dayVal)).padStart(2, '0');
        let yrVal = textDt[4] || new Date().getFullYear().toString();
        if (yrVal.length === 2) yrVal = `20${yrVal}`;
        finalDate = `${yrVal}-${monthPart}-${dayVal}`;
        return { date: finalDate, time: finalTime };
      }
    }

    // YYYY-MM-DD
    const ymd = cleanedStr.match(/\b(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})\b/);
    if (ymd) {
      finalDate = `${ymd[1]}-${ymd[2].padStart(2, '0')}-${ymd[3].padStart(2, '0')}`;
      return { date: finalDate, time: finalTime };
    }

    // DD/MM/YYYY or MM/DD/YYYY
    const dmy = cleanedStr.match(/\b(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})\b/);
    if (dmy) {
      let yearStr = dmy[3];
      if (yearStr.length === 2) yearStr = `20${yearStr}`;
      const p1 = parseInt(dmy[1]);
      const p2 = parseInt(dmy[2]);
      
      if (p1 > 12) {
        // p1 must be day, p2 is month (DD/MM/YYYY)
        finalDate = `${yearStr}-${String(p2).padStart(2, '0')}-${String(p1).padStart(2, '0')}`;
      } else if (p2 > 12) {
        // p2 must be day, p1 is month (MM/DD/YYYY)
        finalDate = `${yearStr}-${String(p1).padStart(2, '0')}-${String(p2).padStart(2, '0')}`;
      } else {
        // Ambiguous, assume DD/MM/YYYY for most countries
        finalDate = `${yearStr}-${String(p2).padStart(2, '0')}-${String(p1).padStart(2, '0')}`;
      }
      return { date: finalDate, time: finalTime };
    }

    try {
      const parsed = new Date(cleanedStr);
      if (!isNaN(parsed.getTime())) {
        const y = parsed.getFullYear();
        const m = String(parsed.getMonth() + 1).padStart(2, '0');
        const d = String(parsed.getDate()).padStart(2, '0');
        finalDate = `${y}-${m}-${d}`;
        if (!finalTime) {
          const hh = String(parsed.getHours()).padStart(2, '0');
          const mm = String(parsed.getMinutes()).padStart(2, '0');
          const ss = String(parsed.getSeconds()).padStart(2, '0');
          if (hh !== '00' || mm !== '00' || ss !== '00') {
             finalTime = `${hh}:${mm}:${ss}`;
          }
        }
      }
    } catch (e) {}

    return { date: finalDate, time: finalTime };
  };

  const parseRawRows = (rawRows: string[][], filename: string) => {
    if (rawRows.length === 0) {
      alert("No data rows found in this sheet.");
      return;
    }

    let headerRowIdx = -1;
    let dateIdx = -1;
    let timeIdx = -1;
    let descIdx = -1;
    let amtIdx = -1;
    let debitIdx = -1;
    let creditIdx = -1;

    // Scan up to 25 rows for a header
    for (let i = 0; i < Math.min(25, rawRows.length); i++) {
      const row = rawRows[i];
      if (!row) continue;

      let dIdx = -1, tIdx = -1, deIdx = -1, aIdx = -1, drIdx = -1, crIdx = -1;
      for (let j = 0; j < row.length; j++) {
        const cell = String(row[j] || "").toLowerCase().trim();
        if (!cell) continue;

        if (cell === "date" || cell.includes("dt") || cell === "posting date" || cell === "val dt" || cell.includes("txn date") || cell.includes("transaction date")) {
          dIdx = j;
        } else if (cell === "time" || cell === "tm" || cell.includes("clock") || cell.includes("timestamp")) {
          tIdx = j;
        } else if (cell.includes("desc") || cell.includes("narr") || cell.includes("concept") || cell.includes("detail") || cell.includes("merchant") || cell.includes("particular") || cell.includes("payee") || cell.includes("to") || cell.includes("by") || cell === "memo" || cell === "transaction") {
          deIdx = j;
        } else if (cell === "amount" || cell === "amt" || cell.includes("val") || cell.includes("sum") || cell.includes("cost") || cell.includes("total") || cell.includes("amount (usd)") || cell.includes("balance")) {
          aIdx = j;
        } else if (cell.includes("debit") || cell.includes("withdrawal") || cell === "spent" || cell === "dr" || cell === "outflow") {
          drIdx = j;
        } else if (cell.includes("credit") || cell.includes("deposit") || cell === "earned" || cell === "cr" || cell === "inflow") {
          crIdx = j;
        }
      }

      if (dIdx !== -1 && (deIdx !== -1 || aIdx !== -1 || drIdx !== -1 || crIdx !== -1)) {
        headerRowIdx = i;
        dateIdx = dIdx;
        timeIdx = tIdx;
        descIdx = deIdx;
        amtIdx = aIdx;
        debitIdx = drIdx;
        creditIdx = crIdx;
        break;
      }
    }

    // Default column mapping if header was not matched
    if (headerRowIdx === -1) {
      const firstNonEmptyRow = rawRows.find(r => r && r.length >= 2);
      if (firstNonEmptyRow) {
        headerRowIdx = rawRows.indexOf(firstNonEmptyRow) - 1;
        for (let j = 0; j < firstNonEmptyRow.length; j++) {
          const val = String(firstNonEmptyRow[j]).trim();
          if (/^\d{2,4}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}/.test(val)) {
            dateIdx = j;
          } else if (!isNaN(parseFloat(val.replace(/[^\d.-]/g, ""))) && val.includes(".")) {
            if (amtIdx === -1) amtIdx = j;
          } else if (val.length > 4 && descIdx === -1) {
            descIdx = j;
          }
        }
        if (dateIdx === -1) dateIdx = 0;
        if (descIdx === -1) descIdx = 1;
        if (amtIdx === -1) amtIdx = Math.min(2, firstNonEmptyRow.length - 1);
      }
    }

    const dataRows = rawRows.slice(headerRowIdx + 1);
    if (dataRows.length === 0) {
      alert("No transaction records detected underneath column headers. Please copy-paste the raw statement into our Smart Text Paste box below for robust parsing!");
      return;
    }

    // Check for previous import outside of setState to avoid freezing React
    const isReupload = state.finances?.some(f => f.importFileName === filename);
    const shouldOverwrite = isReupload;

    setAppState((prev: AppState) => {
      const next = { ...prev };
      next.finances = prev.finances ? [...prev.finances] : [];
      let addedCount = 0;
      let skippedCount = 0;

      if (shouldOverwrite) {
         next.finances = next.finances.filter(f => f.importFileName !== filename);
      }

      dataRows.forEach((row, rIdx) => {
        try {
          if (!row || row.length === 0 || row.every(cell => !String(cell).trim())) return;

          let rawDateCell = row[dateIdx] ? String(row[dateIdx]).trim() : "";
          let rawTimeCell = timeIdx !== -1 && row[timeIdx] ? String(row[timeIdx]).trim() : "";
          let rawDesc = row[descIdx] ? String(row[descIdx]).trim() : `Imported ${filename}`;

          let amt = 0;
          let type: 'debit' | 'credit' = 'debit';

          if (amtIdx !== -1 && row[amtIdx]) {
            const cleanedVal = String(row[amtIdx]).replace(/[^\d.-]+/g, "");
            amt = parseFloat(cleanedVal);
          } else if (debitIdx !== -1 && row[debitIdx] && parseFloat(String(row[debitIdx]).replace(/[^\d.]+/g, "")) > 0) {
            amt = parseFloat(String(row[debitIdx]).replace(/[^\d.]+/g, ""));
            type = 'debit';
          } else if (creditIdx !== -1 && row[creditIdx] && parseFloat(String(row[creditIdx]).replace(/[^\d.]+/g, "")) > 0) {
            amt = parseFloat(String(row[creditIdx]).replace(/[^\d.]+/g, ""));
            type = 'credit';
          }

          if (amt === 0 || isNaN(amt)) {
            for (let j = 0; j < row.length; j++) {
              if (j === dateIdx || j === descIdx || j === timeIdx) continue;
              const valStr = String(row[j]).trim();
              const cleaned = valStr.replace(/[^\d.-]+/g, "");
              const parsedNum = parseFloat(cleaned);
              if (valStr.includes(".") && !isNaN(parsedNum) && Math.abs(parsedNum) > 0) {
                amt = parsedNum;
                break;
              }
            }
          }

          if (amt < 0) {
            amt = Math.abs(amt);
            type = 'debit';
          }

          if (amt === 0 || isNaN(amt)) return;

          let parseInput = rawDateCell;
          if (rawTimeCell) {
            parseInput += " " + rawTimeCell;
          }
          const parsedDT = parseDateTimeStr(parseInput);
          const finalDate = parsedDT.date;
          const finalTime = parsedDT.time || "12:00:00";
          const timestamp = `${finalDate}T${finalTime}Z`;

          const rowStr = row.join(" ").toLowerCase();
          if (rowStr.includes("credit") || rowStr.includes("refund") || rowStr.includes("salary") || rowStr.includes("deposit") || rowStr.includes("incoming") || rowStr.includes("received") || rowStr.includes("upi received") || rowStr.includes("cashback")) {
            type = 'credit';
          } else if (rowStr.includes("debit") || rowStr.includes("payment") || rowStr.includes("fee") || rowStr.includes("withdrawn") || rowStr.includes("charge") || rowStr.includes("spent") || rowStr.includes("sent to")) {
            type = 'debit';
          }

          let category = "General";
          const lc = rawDesc.toLowerCase();
          if (lc.includes('zomato') || lc.includes('swiggy') || lc.includes('food') || lc.includes('restaurant') || lc.includes('dine') || lc.includes('cafe')) category = 'Food';
          else if (lc.includes('uber') || lc.includes('ola') || lc.includes('metro') || lc.includes('train') || lc.includes('cab') || lc.includes('taxi') || lc.includes('fuel')) category = 'Transport';
          else if (lc.includes('amazon') || lc.includes('flipkart') || lc.includes('store') || lc.includes('shopping') || lc.includes('grocery')) category = 'Shopping';
          else if (lc.includes('salary') || lc.includes('dividend') || lc.includes('paycheck') || lc.includes('interest')) category = 'Income';
          else if (lc.includes('netflix') || lc.includes('spotify') || lc.includes('movie') || lc.includes('show')) category = 'Entertainment';
          else if (lc.includes('bill') || lc.includes('rent') || lc.includes('electric') || lc.includes('utility')) category = 'Bills';

          const rawId = finalDate + amt + rawDesc + rIdx + timestamp;
          const cleanId = "tx_" + safeBtoa(rawId.substring(0, 50)).slice(0, 16);

          if (shouldOverwrite || !next.finances!.some(f => f.id === cleanId)) {
            next.finances!.push({
              id: cleanId,
              date: finalDate,
              timestamp,
              amount: amt,
              concept: rawDesc.substring(0, 50),
              notes: rawDesc,
              category,
              currency: 'USD',
              source: 'csv',
              importFileName: filename,
              type,
              counterparty: rawDesc.substring(0, 30)
            });
            addedCount++;
          } else {
            skippedCount++;
          }
        } catch (errRow) {
          console.error("Row parsing failed", errRow, row);
        }
      });

      saveData(next);
      if (addedCount > 0) {
        alert(shouldOverwrite 
          ? `Successfully replaced and imported ${addedCount} detailed transactions from ${filename}!`
          : `Flawlessly imported ${addedCount} detailed statement records with precise time tracking from ${filename}!`
        );
      } else if (skippedCount > 0) {
        alert(`Finished processing. ${skippedCount} items were skipped because they already exist in the ledger (Duplicates).`);
      } else {
        alert(`No new transactions were extracted. Ensure the file contains parseable data.`);
      }
      return next;
    });
  };

  const parseCsvData = (file: File) => {
    Papa.parse(file, {
      header: false,
      skipEmptyLines: true,
      complete: (results) => {
        const rawRows = results.data as string[][];
        parseRawRows(rawRows, file.name);
      }
    });
  };

  const parseExcelData = async (file: File) => {
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const rawJson = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });
      
      const cleanedRows: string[][] = rawJson.map(row => {
        if (Array.isArray(row)) {
          return row.map(cellValue => cellValue === null || cellValue === undefined ? "" : String(cellValue));
        }
        return [];
      });

      parseRawRows(cleanedRows, file.name);
    } catch (err) {
      console.error("Excel sheet parsing failed", err);
      alert("Oops! This Excel sheet format couldn't be loaded. Verify it's a standard XLS/XLSX statement.");
    }
  };

  const parsePdfData = async (file: File) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      let fullText = "";
      for (let i = 1; i <= pdf.numPages; i++) {
         const page = await pdf.getPage(i);
         const textContent = await page.getTextContent();
         const strings = textContent.items.map((item: any) => item.str);
         fullText += strings.join(" ") + "\n";
      }

      // Multiple fallback search expressions
      const regex1 = /(\d{2,4}[\/\-\.]\d{2}[\/\-\.]\d{2,4})\s+([A-Za-z0-9\s\#\.\-\*\_]+?)\s+([\d\,\-]+?\.\d{2})/g;
      const regex2 = /(\d{1,2}\s+[A-Za-z]{3,9}\s+\d{2,4})\s+([A-Za-z0-9\s\#\.\-\*\_]+?)\s+([\d\,\-]+?\.\d{2})/g;
      
      let match;
      let addedCount = 0;
      const parsedMatches: any[] = [];
      
      while ((match = regex1.exec(fullText)) !== null) {
          parsedMatches.push({
             date: match[1],
             desc: match[2],
             amt: parseFloat(match[3].replace(/,/g, ''))
          });
      }

      if (parsedMatches.length === 0) {
        while ((match = regex2.exec(fullText)) !== null) {
          parsedMatches.push({
             date: match[1],
             desc: match[2],
             amt: parseFloat(match[3].replace(/,/g, ''))
          });
        }
      }

      // Line by line fallback
      if (parsedMatches.length === 0) {
        const lines = fullText.split("\n");
        lines.forEach(line => {
          const dtMatch = line.match(/(\d{2,4}[\/\-\.]\d{2}[\/\-\.]\d{2,4})|(\d{1,2}\s+[A-Za-z]{3,9}\s+\d{2,4})/);
          const numMatch = line.match(/[\d\,\-]+\.\d{2}/);
          if (dtMatch && numMatch) {
            const dateStr = dtMatch[0];
            const amtStr = numMatch[0].replace(/,/g, '');
            const amtVal = parseFloat(amtStr);
            let desc = line.replace(dateStr, '').replace(numMatch[0], '').trim();
            if (!desc) desc = "PDF Transaction";
            parsedMatches.push({
              date: dateStr,
              desc,
              amt: Math.abs(amtVal)
            });
          }
        });
      }

      if (parsedMatches.length === 0) {
          alert("We extracted raw text but couldn't auto-regex transactions. Try pasting raw text lines in the fallback paste box below, which matches custom structures seamlessly!");
          return;
      }
      
      setAppState((prev: AppState) => {
          const next = { ...prev };
          next.finances = prev.finances ? [...prev.finances] : [];
          
          parsedMatches.forEach(tx => {
             const amt = Math.abs(tx.amt);
             const desc = tx.desc.trim();
             let type: 'debit' | 'credit' = desc.toLowerCase().includes('credit') || desc.toLowerCase().includes('deposit') ? 'credit' : 'debit';
             if (tx.amt < 0) type = 'debit';
             
             let category = "General";
             const lc = desc.toLowerCase();
             if (lc.includes('zomato') || lc.includes('swiggy') || lc.includes('food')) category = 'Food';
             else if (lc.includes('uber') || lc.includes('ola') || lc.includes('metro')) category = 'Transport';
             else if (lc.includes('amazon') || lc.includes('flipkart')) category = 'Shopping';
             else if (lc.includes('salary') || lc.includes('dividend')) category = 'Income';
             
             let dateStr = new Date().toISOString().split("T")[0];
             const parts = tx.date.split(/[\/\-\.]/);
             if (parts.length === 3) {
                 const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
                 dateStr = `${year}-${parts[1]}-${parts[0]}`; // assume DD-MM-YYYY
             }

             const rawId = tx.date + amt + desc;
             const cleanId = "tx_" + safeBtoa(rawId.substring(0, 50)).slice(0, 16);
            
             if (!next.finances!.some(f => f.id === cleanId)) {
                 next.finances!.push({
                     id: cleanId,
                     date: String(dateStr).substring(0,10),
                     timestamp: String(dateStr),
                     amount: amt,
                     concept: String(desc).substring(0, 50),
                     notes: String(desc),
                     category,
                     currency: 'USD',
                     source: 'pdf' as any,
                     type,
                     counterparty: String(desc).substring(0, 30)
                 });
                 addedCount++;
             }
          });
          
          saveData(next);
          alert(`Successfully extracted & imported ${addedCount} transactions from PDF.`);
          return next;
      });

    } catch (err) {
       console.error("PDF parsing error", err);
       alert("PDF module reading failed. Use the direct Paste Box for perfect transcription!");
    }
  };

  const handleParseTextStatement = () => {
    if (!textStatement.trim()) {
      alert("Please paste text statement lines first.");
      return;
    }
    const lines = textStatement.split("\n");
    let addedCount = 0;
    
    setAppState((prev: AppState) => {
      const next = { ...prev };
      next.finances = prev.finances ? [...prev.finances] : [];
      
      lines.forEach(line => {
        if (!line.trim()) return;
        const dateMatch = line.match(/(\d{2,4}[\/\-\.]\d{2}[\/\-\.]\d{2,4})|(\d{1,2}\s+[A-Za-z]{3,10}\s+\d{2,4})/);
        const amtMatch = line.match(/[\d\,\-]+\.\d{2}/);
        
        if (dateMatch && amtMatch) {
          const dateStr = dateMatch[0].trim();
          const amtStr = amtMatch[0].replace(/,/g, '');
          const originalAmountVal = parseFloat(amtStr);
          const amountVal = Math.abs(originalAmountVal);
          
          if (!isNaN(amountVal) && amountVal > 0) {
            let desc = line.replace(dateStr, '').replace(amtMatch[0], '').replace(/[\$\+\-]/g, '').trim();
            if (!desc) desc = "Copied transaction";
            
            let type: 'debit' | 'credit' = 'debit';
            if (line.toLowerCase().includes('credit') || line.toLowerCase().includes('received') || line.toLowerCase().includes('deposit') || line.includes('+')) {
              type = 'credit';
            } else if (originalAmountVal < 0 || line.includes('-')) {
              type = 'debit';
            }
            
            let category = "General";
            const lc = desc.toLowerCase();
            if (lc.includes('zomato') || lc.includes('swiggy') || lc.includes('food')) category = 'Food';
            else if (lc.includes('uber') || lc.includes('ola') || lc.includes('metro')) category = 'Transport';
            else if (lc.includes('amazon') || lc.includes('flipkart')) category = 'Shopping';
            else if (lc.includes('salary') || lc.includes('dividend')) category = 'Income';
            
            let finalDate = new Date().toISOString().split("T")[0];
            const parts = dateStr.split(/[\/\-\.]/);
            if (parts.length === 3) {
              const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
              if (parts[0].length === 4) {
                finalDate = `${parts[0]}-${parts[1]}-${parts[2]}`;
              } else {
                finalDate = `${year}-${parts[1]}-${parts[0]}`;
              }
            }
            
            const rawId = dateStr + amountVal + desc;
            const cleanId = "tx_" + safeBtoa(rawId.substring(0, 50)).slice(0, 16);
            
            if (!next.finances!.some(f => f.id === cleanId)) {
                next.finances!.push({
                    id: cleanId,
                    date: finalDate,
                    timestamp: finalDate,
                    amount: amountVal,
                    concept: desc.substring(0, 50),
                    notes: desc,
                    category,
                    currency: 'USD',
                    source: 'text_paste' as any,
                    type,
                    counterparty: desc.substring(0, 30)
                });
                addedCount++;
            }
          }
        }
      });
      
      saveData(next);
      alert(`Successfully parsed & imported ${addedCount} transactions from pasted text!`);
      setTextStatement("");
      return next;
    });
  };

  const processUploadedFile = async (file: File) => {
    try {
      const lowerName = file.name.toLowerCase();
      let text = "";
      
      const toBase64 = (f: File) => new Promise<{ data: string; mime: string }>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(f);
        reader.onload = () => {
          const result = reader.result as string;
          const [prefix, data] = result.split(",");
          const mime = prefix.match(/:(.*?);/)?.[1] || "";
          resolve({ data, mime });
        };
        reader.onerror = error => reject(error);
      });

      if (lowerName.endsWith('.csv') || lowerName.endsWith('.txt')) {
        text = await file.text();
        setLoadedFile({
          name: file.name,
          text: text,
          isTextBased: true
        });
        setSelectedAIProcessor('none');
      } else if (lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls')) {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });
        text = rawJson.map(row => (Array.isArray(row) ? row.join(", ") : "")).join("\n");
        setLoadedFile({
          name: file.name,
          text: text,
          isTextBased: true
        });
        setSelectedAIProcessor('none');
      } else if (lowerName.endsWith('.pdf') || file.type.startsWith('image/')) {
        const b64 = await toBase64(file);
        setLoadedFile({
          name: file.name,
          base64: b64.data,
          mime: b64.mime,
          isTextBased: false
        });
        setSelectedAIProcessor('none');
      } else {
        setShowFormatModal(true);
        return;
      }

    } catch (e: any) {
      alert("Error reading file: " + e.message);
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processUploadedFile(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processUploadedFile(file);
    e.target.value = '';
  };

  const handleRemove = (id: string) => {
    setAppState((prev: AppState) => {
      const next = {
        ...prev,
        finances: (prev.finances || []).filter((e) => e.id !== id),
      };
      saveData(next);
      return next;
    });
  };

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle || !goalTarget) return;
    const finalCategory = goalCategory === "custom" ? (customGoalCategory.trim() || 'custom') : goalCategory;
    const newGoal = {
      id: "goal_" + Date.now(),
      title: goalTitle,
      targetAmount: parseFloat(goalTarget) || 0,
      currentAmount: parseFloat(goalCurrent) || 0,
      deadlineDate: goalDeadline || new Date().toISOString().split("T")[0],
      category: finalCategory,
      tasks: [],
    };
    setAppState((prev: AppState) => {
      const next = {
        ...prev,
        financeGoals: [...(prev.financeGoals || []), newGoal],
      };
      saveData(next);
      return next;
    });
    setGoalTitle("");
    setGoalTarget("");
    setGoalCurrent("");
    setGoalDeadline("");
    setCustomGoalCategory("");
    setGoalCategory("Savings");
  };

  const handleRemoveGoal = (id: string) => {
    setAppState((prev: AppState) => {
      const next = {
        ...prev,
        financeGoals: (prev.financeGoals || []).filter((g) => g.id !== id),
      };
      saveData(next);
      return next;
    });
  };

  const handleUpdateGoalCurrent = (id: string, newAmt: number) => {
    setAppState((prev: AppState) => {
      const next = {
        ...prev,
        financeGoals: (prev.financeGoals || []).map((g) =>
          g.id === id ? { ...g, currentAmount: Math.max(0, newAmt) } : g
        ),
      };
      saveData(next);
      return next;
    });
  };

  const updateBudget = (field: "d" | "w" | "m" | "y", val: string) => {
    setAppState((prev: AppState) => {
      const currentBudgets = prev.financeBudgets || { d: 0, w: 0, m: 0, y: 0 };
      const next = {
        ...prev,
        financeBudgets: { ...currentBudgets, [field]: parseFloat(val) || 0 },
      };
      saveData(next);
      return next;
    });
  };

  const updateIncomeTarget = (field: "d" | "w" | "m" | "y", val: string) => {
    setAppState((prev: AppState) => {
      const currentTargets = prev.financeIncomeTargets || { d: 0, w: 0, m: 0, y: 0 };
      const next = {
        ...prev,
        financeIncomeTargets: { ...currentTargets, [field]: parseFloat(val) || 0 },
      };
      saveData(next);
      return next;
    });
  };

  const handleSetReminder = (e: ExpeditionExpense, mode: "reminder" | "alert") => {
    setReminderModal({
      isOpen: true,
      defaultTitle: `Finance: ${e.concept} ($${e.amount})`,
      defaultNotes: `Recurring/Follow-up for amount: $${e.amount} - ${e.type}`,
      mode,
    });
  };

  const income = (state.finances || [])
    .filter((e) => e.type === "income" || e.type === "credit")
    .reduce((acc, curr) => acc + Number(curr.amount), 0);
  const expenses = (state.finances || [])
    .filter((e) => !e.type || e.type === "expense" || e.type === "debit" || e.type === "loan_given")
    .reduce((acc, curr) => acc + Number(curr.amount), 0);
  const balance = income - expenses;

  // Advanced Budget Metrics calculation
  const getExpensesAverages = () => {
    if (!state.finances?.length) return { d: 0, w: 0, m: 0, by: 0, y: 0 };
    const expOnly = state.finances.filter(
      (e) => !e.type || e.type === "expense" || e.type === "debit" || e.type === "loan_given",
    );
    if (!expOnly.length) return { d: 0, w: 0, m: 0, by: 0, y: 0 };

    // Find absolute timespan in days
    const dates = expOnly.map((e) => new Date(e.date).getTime());
    const minD = Math.min(...dates);
    const maxD = Math.max(...dates, Date.now()); // Ensure we count up to today minimum
    const spanDays = Math.max(1, (maxD - minD) / (1000 * 60 * 60 * 24));

    const dAvg = expenses / spanDays;
    return {
      d: dAvg,
      w: dAvg * 7,
      m: dAvg * 30.4,
      by: dAvg * 182.5,
      y: dAvg * 365,
    };
  };

  const todayStr = new Date().toISOString().split("T")[0];

  const isSameWeek = (date1Str: string, date2Str: string) => {
    try {
      const d1 = new Date(date1Str);
      const d2 = new Date(date2Str);
      if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return false;
      const day2 = d2.getDay();
      const diff = d2.getDate() - day2 + (day2 === 0 ? -6 : 1);
      const mon2 = new Date(d2);
      mon2.setDate(diff);
      mon2.setHours(0, 0, 0, 0);
      const sun2 = new Date(mon2);
      sun2.setDate(mon2.getDate() + 6);
      sun2.setHours(23, 59, 59, 999);
      const t1 = d1.getTime();
      return t1 >= mon2.getTime() && t1 <= sun2.getTime();
    } catch (e) {
      return false;
    }
  };

  const periodicActuals = React.useMemo(() => {
    const list = state.finances || [];
    
    // Day
    const dayInc = list.filter(e => e.date === todayStr && (e.type === 'income' || e.type === 'credit')).reduce((sum, e) => sum + Number(e.amount), 0);
    const dayExp = list.filter(e => e.date === todayStr && (!e.type || e.type === 'expense' || e.type === 'debit' || e.type === 'loan_given')).reduce((sum, e) => sum + Number(e.amount), 0);
    
    // Week
    const weekInc = list.filter(e => isSameWeek(e.date, todayStr) && (e.type === 'income' || e.type === 'credit')).reduce((sum, e) => sum + Number(e.amount), 0);
    const weekExp = list.filter(e => isSameWeek(e.date, todayStr) && (!e.type || e.type === 'expense' || e.type === 'debit' || e.type === 'loan_given')).reduce((sum, e) => sum + Number(e.amount), 0);
    
    // Month
    const mPrefix = todayStr.slice(0, 7);
    const monthInc = list.filter(e => e.date.startsWith(mPrefix) && (e.type === 'income' || e.type === 'credit')).reduce((sum, e) => sum + Number(e.amount), 0);
    const monthExp = list.filter(e => e.date.startsWith(mPrefix) && (!e.type || e.type === 'expense' || e.type === 'debit' || e.type === 'loan_given')).reduce((sum, e) => sum + Number(e.amount), 0);
    
    // Year
    const yPrefix = todayStr.slice(0, 4);
    const yearInc = list.filter(e => e.date.startsWith(yPrefix) && (e.type === 'income' || e.type === 'credit')).reduce((sum, e) => sum + Number(e.amount), 0);
    const yearExp = list.filter(e => e.date.startsWith(yPrefix) && (!e.type || e.type === 'expense' || e.type === 'debit' || e.type === 'loan_given')).reduce((sum, e) => sum + Number(e.amount), 0);
    
    return {
      d: { income: dayInc, expense: dayExp },
      w: { income: weekInc, expense: weekExp },
      m: { income: monthInc, expense: monthExp },
      y: { income: yearInc, expense: yearExp },
    };
  }, [state.finances, todayStr]);

  const todayGoals = state.dailyFinanceGoals?.[todayStr] || { incomeTarget: 0, expenseLimit: 0 };
  
  const handleUpdateTodayGoals = (field: 'incomeTarget' | 'expenseLimit', val: string) => {
      const num = parseFloat(val) || 0;
      setAppState((prev: AppState) => {
          const next = {...prev};
          if (!next.dailyFinanceGoals) next.dailyFinanceGoals = {};
          if (!next.dailyFinanceGoals[todayStr]) next.dailyFinanceGoals[todayStr] = { incomeTarget: 0, expenseLimit: 0 };
          next.dailyFinanceGoals[todayStr][field] = num;
          saveData(next);
          return next;
      });
  };

  const avgs = getExpensesAverages();

  const last7DaysData = React.useMemo(() => {
    const list = [];
    const d = new Date();
    // Gather last 7 days dates
    for (let i = 6; i >= 0; i--) {
      const active = new Date(d);
      active.setDate(d.getDate() - i);
      const ds = [active.getFullYear(), String(active.getMonth() + 1).padStart(2, '0'), String(active.getDate()).padStart(2, '0')].join('-');
      
      const totalExp = (state.finances || [])
        .filter(e => e.date === ds && (!e.type || e.type === 'expense' || e.type === 'debit' || e.type === 'loan_given'))
        .reduce((sum, current) => sum + Number(current.amount), 0);
      const totalInc = (state.finances || [])
        .filter(e => e.date === ds && (e.type === 'income' || e.type === 'credit'))
        .reduce((sum, current) => sum + Number(current.amount), 0);

      list.push({
        dateStr: ds,
        label: active.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' }),
        expense: totalExp,
        income: totalInc
      });
    }
    return list;
  }, [state.finances]);

  const categorySplit = React.useMemo(() => {
    const cats: Record<string, number> = {};
    (state.finances || []).forEach(e => {
      if (!e.type || e.type === 'expense' || e.type === 'debit' || e.type === 'loan_given') {
        const c = e.category?.trim() || 'General';
        cats[c] = (cats[c] || 0) + Number(e.amount);
      }
    });

    return Object.entries(cats).sort((a,b) => b[1] - a[1]);
  }, [state.finances]);

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      <div className="border-b border-[#111120] pb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white font-display">
            Financial <span className="text-[#00d4ff]">Ledger</span>
          </h2>
          <p className="text-xs uppercase tracking-widest text-[#a1a1aa] mt-1 font-mono">
            // EXPENSES, INCOME & BUDGET
          </p>
        </div>

        {/* Sleek Currency Selector */}
        <div className="flex items-center gap-2 bg-[#111120] border border-[#2a2a50] rounded-xl px-3 py-1.5 shrink-0 self-start sm:self-auto">
          <span className="text-[9px] uppercase font-bold tracking-widest font-mono text-slate-500">
            Currency:
          </span>
          <select
            value={curr}
            onChange={(e) => {
              const newCurr = e.target.value;
              setAppState((prev: any) => {
                const next = {
                  ...prev,
                  profile: {
                    ...prev.profile,
                    preferredCurrency: newCurr
                  }
                };
                saveData(next);
                return next;
              });
            }}
            className="bg-[#0d0d1a] border border-[#2a2a50] rounded-lg px-2 py-0.5 text-xs text-white focus:outline-none focus:border-[#00d4ff] cursor-pointer font-bold font-mono"
          >
            <option value="$">USD ($)</option>
            <option value="₹">INR (₹)</option>
            <option value="€">EUR (€)</option>
            <option value="£">GBP (£)</option>
            <option value="¥">YEN (¥)</option>
            <option value="C$">CAD (C$)</option>
            <option value="A$">AUD (A$)</option>
            <option value="د.إ">AED (د.إ)</option>
            <option value="₩">KRW (₩)</option>
            <option value="CHF">CHF</option>
          </select>
        </div>
      </div>

      {/* NET METRICS CARDS PANEL */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#111120] border border-[#2a2a50] p-5 rounded-2xl">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest font-mono">
            NET BALANCE
          </p>
          <p
            className={`text-3xl font-black mt-2 font-display ${balance >= 0 ? "text-[#00ff88]" : "text-rose-500"}`}
          >
            {curr}{balance.toFixed(2)}
          </p>
        </div>
        <div className="bg-[#111120] border border-[#2a2a50] p-5 rounded-2xl">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest font-mono">
            TOTAL INCOME
          </p>
          <p className="text-xl font-black text-slate-200 mt-2 font-display">
            {curr}{income.toFixed(2)}
          </p>
        </div>
        <div className="bg-[#111120] border border-[#2a2a50] p-5 rounded-2xl">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest font-mono">
            TOTAL EXPENSES
          </p>
          <p className="text-xl font-black text-slate-200 mt-2 font-display">
            {curr}{expenses.toFixed(2)}
          </p>
        </div>
      </div>

      {/* 📊 ADVANCED FINANCIAL ANALYTICS & INFOGRAPHICS BOARD */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 border border-[#2a2a50]/65 bg-[#111120]/45 p-5 rounded-2xl animate-fadeIn">
        
        {/* Panel 1: Trends SVG Graph (Last 7 Days) */}
        <div className="lg:col-span-2 bg-[#0d0d1a] border border-[#2a2a50] p-4 rounded-xl space-y-4">
          <div className="flex items-center justify-between border-b border-[#2a2a50]/50 pb-2">
            <div>
              <h4 className="text-xs font-black uppercase text-white tracking-widest font-mono">📈 7-Day Capital Flow Trend</h4>
              <p className="text-[9px] text-slate-500 font-mono mt-0.5">// Interactive visual ledger tracking polylines</p>
            </div>
            <div className="flex gap-3 text-[9px] font-mono select-none">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-[#00ff88]" /> INCOME</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-[#ff00a0]" /> EXPENSES</span>
            </div>
          </div>

          {/* SVG Polyline Render Frame */}
          <div className="relative w-full h-44">
            {(() => {
              const maxVal = Math.max(...last7DaysData.map(d => Math.max(d.expense, d.income, 30)));
              const height = (maxVal > 0) ? 150 : 150;
              const width = 450;
              const padding = 20;

              // Generate coordinate pairs
              const numPoints = last7DaysData.length;
              const xStep = (width - padding * 2) / (numPoints - 1);
              
              const expPoints = last7DaysData.map((d, i) => {
                const x = padding + i * xStep;
                const ratio = maxVal > 0 ? d.expense / maxVal : 0;
                const y = height - padding - ratio * (height - padding * 2);
                return { x, y };
              });

              const incPoints = last7DaysData.map((d, i) => {
                const x = padding + i * xStep;
                const ratio = maxVal > 0 ? d.income / maxVal : 0;
                const y = height - padding - ratio * (height - padding * 2);
                return { x, y };
              });

              const expPath = expPoints.map(p => `${p.x},${p.y}`).join(' ');
              const incPath = incPoints.map(p => `${p.x},${p.y}`).join(' ');

              return (
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full text-slate-600 font-mono text-[8px] select-none">
                  {/* Grid Grid-lines */}
                  {[0, 1, 2, 3].map(ratioIdx => {
                    const ratio = ratioIdx / 3;
                    const y = padding + (1 - ratio) * (height - padding * 2);
                    const val = Math.round(ratio * maxVal);
                    return (
                      <g key={ratioIdx} className="opacity-30">
                        <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#1e1e38" strokeDasharray="3,3" />
                        <text x={padding - 5} y={y + 3} textAnchor="end" fill="#475569" className="font-bold font-mono">${val}</text>
                      </g>
                    );
                  })}

                  {/* Gradient Backing for Fill areas */}
                  <defs>
                     <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ff00a0" stopOpacity="0.15" />
                        <stop offset="100%" stopColor="#ff00a0" stopOpacity="0.0" />
                     </linearGradient>
                     <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#00ff88" stopOpacity="0.15" />
                        <stop offset="100%" stopColor="#00ff88" stopOpacity="0.0" />
                     </linearGradient>
                  </defs>

                  {/* Area Fills */}
                  {expPoints.length > 0 && (
                    <polygon
                       points={`${padding},${height-padding} ${expPath} ${width-padding},${height-padding}`}
                       fill="url(#expGrad)"
                    />
                  )}
                  {incPoints.length > 0 && (
                    <polygon
                       points={`${padding},${height-padding} ${incPath} ${width-padding},${height-padding}`}
                       fill="url(#incGrad)"
                    />
                  )}

                  {/* Poly lines */}
                  <polyline points={expPath} fill="none" stroke="#ff00a0" strokeWidth="2" strokeLinecap="round" className="drop-shadow-[0_0_4px_#ff00a0]" />
                  <polyline points={incPath} fill="none" stroke="#00ff88" strokeWidth="2" strokeLinecap="round" className="drop-shadow-[0_0_4px_#00ff88]" />

                  {/* Nodes & Tooltips */}
                  {expPoints.map((p, idx) => (
                    <g key={`exp-dot-${idx}`} className="group">
                      <circle cx={p.x} cy={p.y} r="3" fill="#ff00a0" className="cursor-pointer hover:r-4 transition-all duration-100" />
                      <text x={p.x} y={p.y - 8} textAnchor="middle" fill="#ff00a0" className="hidden group-hover:block font-black font-mono bg-[#0d0d1a] text-[7px]" style={{ pointerEvents: 'none' }}>
                        ${last7DaysData[idx].expense.toFixed(0)}
                      </text>
                    </g>
                  ))}
                  {incPoints.map((p, idx) => (
                    <g key={`inc-dot-${idx}`} className="group">
                      <circle cx={p.x} cy={p.y} r="3" fill="#00ff88" className="cursor-pointer hover:r-4 transition-all duration-100" />
                      <text x={p.x} y={p.y - 8} textAnchor="middle" fill="#00ff88" className="hidden group-hover:block font-black font-mono bg-[#0d0d1a] text-[7px]" style={{ pointerEvents: 'none' }}>
                        ${last7DaysData[idx].income.toFixed(0)}
                      </text>
                    </g>
                  ))}

                  {/* X Axis Labels */}
                  {last7DaysData.map((d, i) => {
                    const x = padding + i * xStep;
                    return (
                      <text key={i} x={x} y={height - 5} textAnchor="middle" fill="#475569" className="font-bold text-[7px]">{d.label}</text>
                    );
                  })}
                </svg>
              );
            })()}
          </div>
        </div>

        {/* Panel 2: Category Distribution Infographics */}
        <div className="bg-[#0d0d1a] border border-[#2a2a50] p-4 rounded-xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="border-b border-[#2a2a50]/50 pb-2">
              <h4 className="text-xs font-black uppercase text-white tracking-widest font-mono">📦 Expense Segmentations</h4>
              <p className="text-[9px] text-slate-500 font-mono mt-0.5">// Category distribution allocations</p>
            </div>

            <div className="space-y-3 mt-3 overflow-y-auto max-h-36 scrollbar-none pr-1">
              {categorySplit.length > 0 ? (
                (() => {
                  const totalSpent = categorySplit.reduce((sum, item) => sum + item[1], 0);
                  return categorySplit.map(([cat, val]) => {
                    const pct = totalSpent > 0 ? Math.round((val / totalSpent) * 100) : 0;
                    return (
                      <div key={cat} className="space-y-1 text-slate-300">
                        <div className="flex justify-between items-center text-[10px] font-medium font-mono text-slate-200">
                          <span className="truncate pr-2 font-bold uppercase">{cat}</span>
                          <span className="shrink-0 text-[#ff00a0] font-black">${val.toFixed(2)} ({pct}%)</span>
                        </div>
                        <div className="w-full bg-[#111120] h-1.5 rounded-full overflow-hidden border border-[#1e1e38]">
                          <div className="h-full bg-gradient-to-r from-[#ff00a0] to-indigo-500" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  });
                })()
              ) : (
                <div className="h-28 flex flex-col items-center justify-center text-center">
                  <p className="text-[9px] text-slate-600 font-bold uppercase font-mono tracking-wider">// System segmentation pending inputs</p>
                  <p className="text-[8px] text-zinc-700 font-mono mt-1">// Log transaction expense to populate data</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-[#111120]/60 p-2.5 border border-[#1e1e38] rounded-xl flex items-center justify-between text-[9px] font-mono leading-none">
            <span className="text-slate-500 uppercase">Capital Output Segments</span>
            <strong className="text-[#00d4ff] font-extrabold">{categorySplit.length} channels</strong>
          </div>
        </div>
      </div>

      {/* 📊 PERIODIC FINANCIAL HORIZON GOALS & PERFORMANCE DESK */}
      <div className="bg-[#111120] border border-[#2a2a50] p-5 rounded-2xl space-y-5 shadow-xl shadow-black/30">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-[#2a2a50]/60 pb-3">
              <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-[#00ff88] font-mono flex items-center gap-1.5">
                      🎯 Financial Horizon Goals
                  </h3>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">// Track income goals & expense budgets and verify day-by-day calculations</p>
              </div>

              {/* Interval tabs switcher */}
              <div className="flex items-center gap-1 bg-[#090913] p-1 rounded-xl border border-[#2a2a50]/40">
                  {([
                      { id: 'd', label: 'Daily' },
                      { id: 'w', label: 'Weekly' },
                      { id: 'm', label: 'Monthly' },
                      { id: 'y', label: 'Yearly' }
                  ] as const).map((tab) => (
                      <button
                          key={tab.id}
                          type="button"
                          onClick={() => setGoalsTab(tab.id)}
                          className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all duration-200 ${
                              goalsTab === tab.id
                                  ? 'bg-[#00ff88] text-black font-extrabold shadow-[0_0_12px_rgba(0,255,136,0.25)]'
                                  : 'text-slate-400 hover:text-white'
                          }`}
                      >
                          {tab.label}
                      </button>
                  ))}
              </div>
          </div>

          {/* Goal inputs and metrics */}
          {(() => {
              const getActiveTabGoals = () => {
                  switch (goalsTab) {
                      case 'd':
                          return {
                              incomeTarget: todayGoals.incomeTarget || 0,
                              expenseLimit: todayGoals.expenseLimit || 0,
                              actualIncome: periodicActuals.d.income,
                              actualExpense: periodicActuals.d.expense,
                              handleIncomeChange: (val: string) => handleUpdateTodayGoals('incomeTarget', val),
                              handleExpenseChange: (val: string) => handleUpdateTodayGoals('expenseLimit', val)
                          };
                      case 'w':
                          return {
                              incomeTarget: state.financeIncomeTargets?.w || 0,
                              expenseLimit: state.financeBudgets?.w || 0,
                              actualIncome: periodicActuals.w.income,
                              actualExpense: periodicActuals.w.expense,
                              handleIncomeChange: (val: string) => updateIncomeTarget('w', val),
                              handleExpenseChange: (val: string) => updateBudget('w', val)
                          };
                      case 'm':
                          return {
                              incomeTarget: state.financeIncomeTargets?.m || 0,
                              expenseLimit: state.financeBudgets?.m || 0,
                              actualIncome: periodicActuals.m.income,
                              actualExpense: periodicActuals.m.expense,
                              handleIncomeChange: (val: string) => updateIncomeTarget('m', val),
                              handleExpenseChange: (val: string) => updateBudget('m', val)
                          };
                      case 'y':
                          return {
                              incomeTarget: state.financeIncomeTargets?.y || 0,
                              expenseLimit: state.financeBudgets?.y || 0,
                              actualIncome: periodicActuals.y.income,
                              actualExpense: periodicActuals.y.expense,
                              handleIncomeChange: (val: string) => updateIncomeTarget('y', val),
                              handleExpenseChange: (val: string) => updateBudget('y', val)
                          };
                  }
              };

              const activeGoals = getActiveTabGoals();
              const profitTarget = activeGoals.incomeTarget - activeGoals.expenseLimit;
              const actualProfit = activeGoals.actualIncome - activeGoals.actualExpense;

              const incPct = activeGoals.incomeTarget > 0 
                  ? Math.round((activeGoals.actualIncome / activeGoals.incomeTarget) * 100) 
                  : 0;

              const expPct = activeGoals.expenseLimit > 0 
                  ? Math.round((activeGoals.actualExpense / activeGoals.expenseLimit) * 100) 
                  : 0;

              const isOverExp = activeGoals.expenseLimit > 0 && activeGoals.actualExpense > activeGoals.expenseLimit;

              // Convert current target values to equivalents across other periods
              const getEquivalencies = () => {
                  let dInc = 0, dExp = 0;
                  switch (goalsTab) {
                      case 'd':
                          dInc = activeGoals.incomeTarget;
                          dExp = activeGoals.expenseLimit;
                          break;
                      case 'w':
                          dInc = activeGoals.incomeTarget / 7;
                          dExp = activeGoals.expenseLimit / 7;
                          break;
                      case 'm':
                          dInc = activeGoals.incomeTarget / 30.4;
                          dExp = activeGoals.expenseLimit / 30.4;
                          break;
                      case 'y':
                          dInc = activeGoals.incomeTarget / 365;
                          dExp = activeGoals.expenseLimit / 365;
                          break;
                  }
                  return {
                      d: { income: dInc, expense: dExp },
                      w: { income: dInc * 7, expense: dExp * 7 },
                      m: { income: dInc * 30.4, expense: dExp * 30.4 },
                      y: { income: dInc * 365, expense: dExp * 365 }
                  };
              };

              const equivs = getEquivalencies();

              return (
                  <div className="space-y-5">
                      {/* Interactive Target Editing Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="bg-[#090913] border border-[#2a2a50]/50 p-4 rounded-xl space-y-2">
                              <label className="block text-[8px] text-slate-500 font-mono tracking-widest uppercase font-black">
                                  💵 {goalsTab === 'd' ? 'Today\'s' : goalsTab === 'w' ? 'Weekly' : goalsTab === 'm' ? 'Monthly' : 'Yearly'} Income Target
                              </label>
                              <div className="relative">
                                  <span className="absolute left-3 top-2.5 text-[10px] text-slate-500 font-mono font-bold">$</span>
                                  <input 
                                      type="number"
                                      value={activeGoals.incomeTarget || ''}
                                      onChange={e => activeGoals.handleIncomeChange(e.target.value)}
                                      placeholder="e.g. 150.00"
                                      className="w-full bg-[#0d0d1a] border border-[#2a2a50]/60 rounded-lg pl-6 pr-3 py-2 text-[#00ff88] focus:outline-none focus:border-[#00ff88] font-mono text-xs font-bold"
                                  />
                              </div>
                              {activeGoals.incomeTarget > 0 && (
                                  <div className="flex justify-between items-center text-[9px] font-mono mt-1">
                                      <span className="text-slate-500">Progress:</span>
                                      <span className="text-[#00ff88] font-black">{incPct}% ({activeGoals.actualIncome > activeGoals.incomeTarget ? "Completed ✓" : "Tracking"})</span>
                                  </div>
                              )}
                          </div>

                          <div className="bg-[#090913] border border-[#2a2a50]/50 p-4 rounded-xl space-y-2">
                              <label className="block text-[8px] text-slate-500 font-mono tracking-widest uppercase font-black">
                                  🛑 {goalsTab === 'd' ? 'Today\'s' : goalsTab === 'w' ? 'Weekly' : goalsTab === 'm' ? 'Monthly' : 'Yearly'} Expense Limit
                              </label>
                              <div className="relative">
                                  <span className="absolute left-3 top-2.5 text-[10px] text-slate-500 font-mono font-bold">$</span>
                                  <input 
                                      type="number"
                                      value={activeGoals.expenseLimit || ''}
                                      onChange={e => activeGoals.handleExpenseChange(e.target.value)}
                                      placeholder="e.g. 75.00"
                                      className="w-full bg-[#0d0d1a] border border-[#2a2a50]/60 rounded-lg pl-6 pr-3 py-2 text-[#ff00a0] focus:outline-none focus:border-[#ff00a0] font-mono text-xs font-bold"
                                  />
                              </div>
                              {activeGoals.expenseLimit > 0 && (
                                  <div className="flex justify-between items-center text-[9px] font-mono mt-1">
                                      <span className="text-slate-500">Threshold Used:</span>
                                      <span className={`font-black ${isOverExp ? "text-rose-500 animate-pulse" : "text-[#ff00a0]"}`}>{expPct}% {isOverExp ? "(OVER LIMIT!)" : ""}</span>
                                  </div>
                              )}
                          </div>

                          <div className="bg-[#090913] border border-[#2a2a50]/50 p-4 rounded-xl space-y-2">
                              <label className="block text-[8px] text-slate-500 font-mono tracking-widest uppercase font-black font-semibold">
                                  📈 Net Target Profit Margin
                              </label>
                              <div className="relative">
                                  <div className="w-full bg-[#0d0d1a] border border-[#2a2a50]/60 rounded-lg px-3 py-2 text-slate-200 font-mono text-xs font-bold flex items-center h-[34px]">
                                      ${profitTarget.toFixed(2)}
                                  </div>
                              </div>
                              <div className="flex justify-between items-center text-[9px] font-mono mt-1">
                                  <span className="text-slate-500">Actual Realized Profit:</span>
                                  <strong className={`font-black ${actualProfit >= profitTarget ? "text-[#00ff88]" : actualProfit >= 0 ? "text-amber-400" : "text-rose-500"}`}>
                                      ${actualProfit.toFixed(2)}
                                  </strong>
                              </div>
                          </div>
                      </div>

                      {/* Progress visual displays */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* Income progress bar */}
                          <div className="bg-[#0d0d1a]/50 p-3.5 border border-[#2a2a50]/40 rounded-xl space-y-2">
                              <div className="flex justify-between items-center text-[10px] font-mono">
                                  <span className="text-slate-400 font-bold uppercase tracking-wider">💵 Income Goal Completion</span>
                                  <strong className="text-[#00ff88]">{activeGoals.actualIncome.toFixed(2)} / {activeGoals.incomeTarget.toFixed(2)} ({incPct}%)</strong>
                              </div>
                              <div className="w-full bg-[#090913] h-2.5 rounded-full overflow-hidden border border-[#2a2a50]/40 p-0.5">
                                  <div 
                                      className="h-full bg-gradient-to-r from-[#00d4ff] to-[#00ff88] rounded-full transition-all duration-300"
                                      style={{ width: `${Math.min(100, incPct)}%` }}
                                  />
                              </div>
                          </div>

                          {/* Expense progress bar */}
                          <div className="bg-[#0d0d1a]/50 p-3.5 border border-[#2a2a50]/40 rounded-xl space-y-2">
                              <div className="flex justify-between items-center text-[10px] font-mono">
                                  <span className="text-slate-400 font-bold uppercase tracking-wider">🛑 Expense Threshold Check</span>
                                  <strong className={isOverExp ? "text-rose-500 font-extrabold animate-pulse" : "text-[#ff00a0]"}>
                                      {activeGoals.actualExpense.toFixed(2)} / {activeGoals.expenseLimit.toFixed(2)} ({expPct}%)
                                  </strong>
                              </div>
                              <div className="w-full bg-[#090913] h-2.5 rounded-full overflow-hidden border border-[#2a2a50]/40 p-0.5">
                                  <div 
                                      className={`h-full rounded-full transition-all duration-300 ${isOverExp ? 'bg-rose-500' : 'bg-gradient-to-r from-[#ff00a0] to-indigo-500'}`}
                                      style={{ width: `${Math.min(100, expPct)}%` }}
                                  />
                              </div>
                          </div>
                      </div>

                      {/* Temporal Equivalency Projection Converter */}
                      <div className="bg-[#0e0f17] border border-[#2a2a50]/80 p-4 rounded-xl space-y-3">
                          <div className="flex items-center gap-2 border-b border-[#2a2a50]/40 pb-2">
                              <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0" />
                              <h4 className="text-[10px] font-black uppercase text-cyan-400 font-mono tracking-widest">
                                  🔄 TEMPORAL EQUIVALENCY CALCULATOR & PROJECTIONS
                              </h4>
                          </div>
                          
                          <p className="text-[10px] text-slate-400 font-mono leading-relaxed uppercase tracking-wide">
                              Converting your active <strong className="text-[#00ff88]">{goalsTab === 'd' ? 'Daily' : goalsTab === 'w' ? 'Weekly' : goalsTab === 'm' ? 'Monthly' : 'Yearly'}</strong> targets across all metrics:
                          </p>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              {[
                                  { label: "Daily Conversion", frame: "d", suffix: "day" },
                                  { label: "Weekly Conversion", frame: "w", suffix: "week" },
                                  { label: "Monthly Conversion", frame: "m", suffix: "month" },
                                  { label: "Yearly Conversion", frame: "y", suffix: "year" },
                              ].map((item) => {
                                  const incVal = equivs[item.frame as 'd'|'w'|'m'|'y'].income;
                                  const expVal = equivs[item.frame as 'd'|'w'|'m'|'y'].expense;
                                  const isActiveFrame = goalsTab === item.frame;

                                  return (
                                      <div 
                                          key={item.frame} 
                                          className={`p-3 rounded-lg flex flex-col justify-between border ${
                                              isActiveFrame 
                                                  ? 'bg-[#00ff88]/5 border-[#00ff88]/30 shadow-[0_0_12px_rgba(0,255,136,0.05)]' 
                                                  : 'bg-[#06060c] border-[#2a2a50]/40'
                                          }`}
                                      >
                                          <div className="flex justify-between items-center border-b border-[#2a2a50]/20 pb-1 mb-1.5">
                                              <span className="text-[8px] font-mono font-black text-slate-500 uppercase tracking-wider">{item.label}</span>
                                              {isActiveFrame && <span className="text-[7px] px-1 bg-[#00ff88]/20 text-[#00ff88] font-bold uppercase rounded font-mono">Active</span>}
                                          </div>
                                          
                                          <div className="space-y-1 text-[10px] font-mono font-medium">
                                              <div className="flex justify-between">
                                                  <span className="text-slate-400 font-bold shrink-0">Income:</span>
                                                  <span className="text-[#00ff88] shrink-0 font-bold">${incVal.toFixed(2)}</span>
                                              </div>
                                              <div className="flex justify-between">
                                                  <span className="text-slate-400 font-bold shrink-0">Limit:</span>
                                                  <span className="text-[#ff00a0] shrink-0 font-bold">${expVal.toFixed(2)}</span>
                                              </div>
                                              <div className="flex justify-between border-t border-[#2a2a50]/20 pt-1 mt-1 text-[9px]">
                                                  <span className="text-slate-500 font-semibold shrink-0">Profit:</span>
                                                  <span className={`shrink-0 font-black ${(incVal - expVal) >= 0 ? "text-[#00d4ff]" : "text-rose-500"}`}>
                                                      ${(incVal - expVal).toFixed(2)}
                                                  </span>
                                              </div>
                                          </div>
                                      </div>
                                  );
                              })}
                          </div>
                      </div>
                  </div>
              );
          })()}
      </div>

      {/* ⚙️ FINANCIAL OPTIONS & SYSTEMATIC GOALS CONTROL DESK (COLLAPSIBLE DROPDOWNS) */}
      <div className="flex flex-col gap-3.5">
        
        {/* Dropdown Panel 1: Systematic Financial Goals */}
        <div className="border border-[#2a2a50]/60 rounded-2xl overflow-hidden bg-[#111120]/40 transition duration-300">
          <button
            type="button"
            onClick={() => setIsGoalsExpanded(!isGoalsExpanded)}
            className="w-full p-4 flex items-center justify-between text-left select-none cursor-pointer hover:bg-[#111120] transition duration-200"
          >
            <div className="flex items-center gap-3">
              <span className={`w-2.5 h-2.5 rounded-full bg-[#00d4ff] shadow-[0_0_10px_#00d4ff] shrink-0 ${isGoalsExpanded ? "animate-pulse" : ""}`} />
              <div>
                <h3 className="font-extrabold uppercase tracking-widest text-[#00d4ff] text-xs font-mono flex items-center gap-2">
                  🎯 Systematic Financial Goals & Targets
                  <span className="text-[10px] lowercase font-normal text-slate-500 font-sans">
                    ({(state.financeGoals || []).length} active)
                  </span>
                </h3>
                <p className="text-[9px] text-slate-500 font-mono uppercase mt-0.5">
                  // Monitor saved progress, timelines, and strategy milestones
                </p>
              </div>
            </div>
            <div className="text-slate-400">
              {isGoalsExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
          </button>

          {isGoalsExpanded && (
            <div className="p-4 border-t border-[#2a2a50]/40 bg-[#0d0d1a]/60 space-y-4 animate-fadeIn">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-1">
                {/* Goals List & Tracker */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex items-center justify-between border-b border-[#2a2a50] pb-2">
                    <span className="flex items-center gap-2 text-[#00d4ff]">
                      <span className="w-2 h-2 rounded-full bg-[#00d4ff] shadow-[0_0_8px_#00d4ff]" />
                      <h4 className="font-extrabold uppercase tracking-widest text-[#0099ff] text-xs font-mono">
                        Systematic Financial Goals ({ (state.financeGoals || []).length })
                      </h4>
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">// TRACK PROGRESS & MANDATORY MILESTONES</span>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {(state.financeGoals || []).map((goal) => {
                      const pct = goal.targetAmount > 0 
                        ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100))
                        : 0;
                      return (
                        <div key={goal.id} className="bg-[#111120] border border-[#2a2a50] p-4 rounded-xl space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="px-2 py-0.5 text-[8px] font-black uppercase text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded mr-2">
                                {goal.category}
                              </span>
                              <h4 className="inline-block text-xs font-bold text-white tracking-wider">
                                {goal.title}
                              </h4>
                              <p className="text-[10px] text-slate-500 font-mono mt-1">
                                Target date: {goal.deadlineDate}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveGoal(goal.id)}
                              className="text-slate-600 hover:text-rose-500 transition text-[11px]"
                              title="Remove Goal"
                            >
                              Remove
                            </button>
                          </div>

                          {/* Progress bar info */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-[11px] font-mono leading-none">
                              <span className="text-slate-400">
                                ${goal.currentAmount.toFixed(0)} of ${goal.targetAmount.toFixed(0)}
                              </span>
                              <span className="text-[#00ff88] font-black">{pct}%</span>
                            </div>
                            <div className="h-1.5 bg-[#0d0d1a] rounded-full overflow-hidden w-full">
                              <div 
                                className={`h-full transition-all duration-500 ${pct >= 100 ? "bg-[#00ff88]" : "bg-[#00d4ff]"}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>

                          {/* Quick adjust saved money */}
                          <div className="flex flex-wrap items-center gap-3 pt-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                              Adjust:
                            </span>
                            <div className="flex rounded-lg border border-[#2a2a50] bg-[#0d0d1a] overflow-hidden">
                              <button 
                                type="button"
                                onClick={() => handleUpdateGoalCurrent(goal.id, goal.currentAmount - 10)}
                                className="px-2 py-1 text-[10px] font-mono text-rose-500 hover:bg-rose-500/10 border-r border-[#2a2a50] cursor-pointer animate-none"
                              >
                                -$10
                              </button>
                              <button 
                                type="button"
                                onClick={() => handleUpdateGoalCurrent(goal.id, goal.currentAmount - 100)}
                                className="px-2 py-1 text-[10px] font-mono text-rose-400 hover:bg-rose-500/10 border-r border-[#2a2a50] cursor-pointer"
                              >
                                -$100
                              </button>
                              <button 
                                type="button"
                                onClick={() => handleUpdateGoalCurrent(goal.id, goal.currentAmount + 10)}
                                className="px-2 py-1 text-[10px] font-mono text-emerald-400 hover:bg-emerald-500/10 border-r border-[#2a2a50] cursor-pointer"
                              >
                                +$10
                              </button>
                              <button 
                                type="button"
                                onClick={() => handleUpdateGoalCurrent(goal.id, goal.currentAmount + 100)}
                                className="px-2 py-1 text-[10px] font-mono text-[#00ff88] hover:bg-[#00ff88]/10 cursor-pointer"
                              >
                                +$100
                              </button>
                            </div>

                            <input
                              type="number"
                              placeholder="Current Amt"
                              value={goal.currentAmount || ""}
                              onChange={(evt) => handleUpdateGoalCurrent(goal.id, parseFloat(evt.target.value) || 0)}
                              className="bg-[#0d0d1a] border border-[#2a2a50] rounded px-2 py-1 text-center font-mono text-[10px] text-slate-200 w-20 focus:outline-none focus:border-[#00d4ff]"
                            />
                          </div>

                          {/* Goal Milestones/Tasks Checklist */}
                          <div className="border-t border-[#1e1e38] pt-2 mt-2 space-y-1.5">
                            <p className="text-[9px] font-bold text-slate-500 tracking-wider uppercase">
                              Milestone checklist & sub-tasks:
                            </p>
                            {(goal.tasks || []).map((t) => (
                              <div key={t.id} className="flex items-center justify-between group px-1 rounded hover:bg-[#0d0d1a] transition">
                                <div 
                                  className="flex items-center gap-2 cursor-pointer select-none py-0.5"
                                  onClick={() => {
                                    setAppState((prev: AppState) => {
                                      const next = {
                                        ...prev,
                                        financeGoals: (prev.financeGoals || []).map((g) =>
                                          g.id === goal.id ? {
                                            ...g,
                                            tasks: (g.tasks || []).map((tk) => 
                                              tk.id === t.id ? { ...tk, done: !tk.done } : tk
                                            )
                                          } : g
                                        )
                                      };
                                      saveData(next);
                                      return next;
                                    });
                                  }}
                                >
                                  {t.done ? (
                                    <CheckSquare size={13} className="text-[#00ff88]" />
                                  ) : (
                                    <Square size={13} className="text-slate-600" />
                                  )}
                                  <span className={`text-[10px] transition ${t.done ? "text-slate-500 line-through" : "text-slate-300"}`}>
                                    {t.name}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAppState((prev: AppState) => {
                                      const next = {
                                        ...prev,
                                        financeGoals: (prev.financeGoals || []).map((g) =>
                                          g.id === goal.id ? {
                                            ...g,
                                            tasks: (g.tasks || []).filter((tk) => tk.id !== t.id)
                                          } : g
                                        )
                                      };
                                      saveData(next);
                                      return next;
                                    });
                                  }}
                                  className="text-slate-600 hover:text-rose-500 text-[10px] p-0.5"
                                >
                                  &times;
                                </button>
                              </div>
                            ))}

                            <input
                              type="text"
                              placeholder="+ Add strategic step/task..."
                              onKeyDown={(evt) => {
                                if (evt.key === "Enter") {
                                  const el = evt.target as HTMLInputElement;
                                  if (!el.value) return;
                                  setAppState((prev: AppState) => {
                                    const next = {
                                      ...prev,
                                      financeGoals: (prev.financeGoals || []).map((g) =>
                                        g.id === goal.id ? {
                                          ...g,
                                          tasks: [
                                            ...(g.tasks || []),
                                            {
                                              id: "g_tk_" + Date.now(),
                                              name: el.value,
                                              done: false,
                                            }
                                          ]
                                        } : g
                                      )
                                    };
                                    saveData(next);
                                    return next;
                                  });
                                  el.value = "";
                                }
                              }}
                              className="w-full bg-[#0d0d1a] border border-[#2a2a50]/60 rounded px-2 py-1 text-[10px] text-slate-300 focus:outline-none focus:border-[#00d4ff] mt-1"
                            />
                          </div>
                        </div>
                      );
                    })}
                    {!(state.financeGoals || []).length && (
                      <div className="bg-[#111120] border border-dashed border-[#2a2a50] p-6 rounded-xl text-center text-slate-600 text-[10px] uppercase font-mono tracking-wider">
                        // System financial parameters unconfigured. Setup required.
                      </div>
                    )}
                  </div>
                </div>

                {/* Create Financial Goals Form */}
                <div className="bg-[#111120] border border-[#2a2a50] p-4 rounded-xl h-fit space-y-4">
                  <div className="border-b border-[#2a2a50]/60 pb-2">
                    <h4 className="text-[10px] font-black uppercase text-white tracking-widest font-mono">
                      Set Financial Target
                    </h4>
                  </div>

                  <form onSubmit={handleAddGoal} className="space-y-3">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Target Name</label>
                      <input
                        type="text"
                        required
                        value={goalTitle}
                        onChange={(e) => setGoalTitle(e.target.value)}
                        placeholder="e.g. Vacation Fund, Pay Credit"
                        className="w-full bg-[#0d0d1a] border border-[#2a2a50] rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-[#00d4ff]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Target ($)</label>
                        <input
                          type="number"
                          required
                          value={goalTarget}
                          onChange={(e) => setGoalTarget(e.target.value)}
                          placeholder="2000"
                          className="w-full bg-[#0d0d1a] border border-[#2a2a50] rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-[#00d4ff]"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Current ($)</label>
                        <input
                          type="number"
                          value={goalCurrent}
                          onChange={(e) => setGoalCurrent(e.target.value)}
                          placeholder="150"
                          className="w-full bg-[#0d0d1a] border border-[#2a2a50] rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-[#00d4ff]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Target Date</label>
                        <input
                          type="date"
                          value={goalDeadline}
                          onChange={(e) => setGoalDeadline(e.target.value)}
                          className="w-full bg-[#0d0d1a] border border-[#2a2a50] rounded-lg px-2 py-2 text-[10px] text-slate-200 color-scheme-dark focus:outline-none focus:border-[#00d4ff]"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Category</label>
                        <select
                          value={goalCategory}
                          onChange={(e) => setGoalCategory(e.target.value)}
                          className="w-full bg-[#0d0d1a] border border-[#2a2a50] rounded-lg px-2 py-2 text-[10px] text-slate-200 focus:outline-none focus:border-[#00d4ff]"
                        >
                          <option value="Savings">Savings Fund</option>
                          <option value="Debt Paydown">Debt Paydown</option>
                          <option value="Asset Investment">Asset Investment</option>
                          <option value="Major Purchase">Major Purchase</option>
                          <option value="custom">CUSTOM...</option>
                        </select>
                      </div>
                    </div>

                    {goalCategory === 'custom' && (
                      <div className="animate-fadeIn">
                        <label className="block text-[9px] font-bold text-[#ff00a0] uppercase tracking-widest mb-1">Custom Category Name</label>
                        <input
                          type="text"
                          required
                          value={customGoalCategory}
                          onChange={(e) => setCustomGoalCategory(e.target.value)}
                          placeholder="e.g., Cryptocurrencies, Real Estate"
                          className="w-full bg-[#0d0d1a] border border-[#ff00a0] rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none"
                        />
                      </div>
                    )}

                    <button
                      type="submit"
                      className="w-full bg-[#00d4ff] text-black font-extrabold py-2 rounded-xl text-xs uppercase tracking-widest font-mono hover:bg-[#00b8e6] transition cursor-pointer"
                    >
                      🚀 CREATE GOAL
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Dropdown Panel 2: Run Rate vs Budget Targets */}
        <div className="border border-[#2a2a50]/60 rounded-2xl overflow-hidden bg-[#111120]/40 transition duration-300">
          <button
            type="button"
            onClick={() => setIsBudgetsExpanded(!isBudgetsExpanded)}
            className="w-full p-4 flex items-center justify-between text-left select-none cursor-pointer hover:bg-[#111120] transition duration-200"
          >
            <div className="flex items-center gap-3">
              <span className={`w-2.5 h-2.5 rounded-full bg-[#00ff88] shadow-[0_0_10px_#00ff88] shrink-0 ${isBudgetsExpanded ? "animate-pulse" : ""}`} />
              <div>
                <h3 className="font-extrabold uppercase tracking-widest text-[#00ff88] text-xs font-mono">
                  📊 Run Rate vs Budget Targets
                </h3>
                <p className="text-[9px] text-slate-500 font-mono uppercase mt-0.5">
                  // Set customized daily, weekly, and monthly threshold limits
                </p>
              </div>
            </div>
            <div className="text-slate-400">
              {isBudgetsExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
          </button>

          {isBudgetsExpanded && (
            <div className="p-4 border-t border-[#2a2a50]/40 bg-[#0d0d1a]/60 space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-[#2a2a50]/60 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88]" />
                  <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase font-mono">
                    Budget Efficiency Dashboard
                  </p>
                </div>
                <p className="text-[9px] text-slate-500 font-mono tracking-wider italic">
                  // Interactive thresholds update live below
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  {
                    label: "Daily",
                    key: "d",
                    avg: avgs.d,
                    bgt: state.financeBudgets?.d || 0,
                  },
                  {
                    label: "Weekly",
                    key: "w",
                    avg: avgs.w,
                    bgt: state.financeBudgets?.w || 0,
                  },
                  {
                    label: "Monthly",
                    key: "m",
                    avg: avgs.m,
                    bgt: state.financeBudgets?.m || 0,
                  },
                  {
                    label: "Annually",
                    key: "y",
                    avg: avgs.y,
                    bgt: state.financeBudgets?.y || 0,
                  },
                ].map((item) => {
                  const isOver = item.bgt > 0 && item.avg > item.bgt;
                  const pct =
                    item.bgt > 0
                      ? Math.min(100, Math.round((item.avg / item.bgt) * 100))
                      : 0;
                  return (
                    <div
                      key={item.key}
                      className="bg-[#111120] border border-[#2a2a50] p-3 rounded-xl flex flex-col gap-2"
                    >
                      <div className="flex justify-between items-start">
                        <p className="text-[9px] text-slate-500 font-mono tracking-widest uppercase">
                          {item.label}
                        </p>
                        <p
                          className={`text-[10px] font-black font-display tracking-wider ${isOver ? "text-rose-500 animate-pulse" : "text-[#00ff88]"}`}
                        >
                          {item.bgt > 0 ? `${pct}%` : "---"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-bold font-mono text-slate-200">
                          ${item.avg.toFixed(1)}{" "}
                          <span className="text-[9px] text-slate-500 font-sans">
                            Avg
                          </span>
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-[9px] text-[#a1a1aa]">TGT $</span>
                          <input
                            type="number"
                            value={item.bgt || ""}
                            disabled
                            readOnly
                            placeholder="0"
                            className="bg-[#090913] border border-[#2af0a3]/10 text-[9px] font-mono text-[#00d4ff] font-bold w-14 px-1 py-0.5 rounded cursor-not-allowed focus:outline-none"
                            title="Master budget limit can only be modified in the Profile Setup configuration."
                          />
                          <span className="text-[8px] text-slate-500 font-mono scale-[0.85] select-none" title="Change the master budget inside the Profile Settings tab">// Lock</span>
                        </div>
                      </div>
                      {item.bgt > 0 && (
                        <div className="h-1 bg-[#0d0d1a] w-full rounded-full overflow-hidden mt-1">
                          <div
                            className={`h-full ${isOver ? "bg-rose-500" : "bg-[#00ff88]"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Dropdown Panel 3: Calendar Reminders & Warning Alerts */}
        <div className="border border-[#2a2a50]/60 rounded-2xl overflow-hidden bg-[#111120]/40 transition duration-300">
          <button
            type="button"
            onClick={() => setIsRemindersExpanded(!isRemindersExpanded)}
            className="w-full p-4 flex items-center justify-between text-left select-none cursor-pointer hover:bg-[#111120] transition duration-200"
          >
            <div className="flex items-center gap-3">
              <span className={`w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_10px_rgb(250,204,21)] shrink-0 ${isRemindersExpanded ? "animate-pulse" : ""}`} />
              <div>
                <h3 className="font-extrabold uppercase tracking-widest text-[#00d4ff] text-xs font-mono">
                  🔔 Calendar Reminders & Alerts
                </h3>
                <p className="text-[9px] text-slate-500 font-mono uppercase mt-0.5">
                  // Trigger quick follow-ups, scheduled milestones, or bill alerts ({(() => {
                    const cnt = (state.reminders || []).filter(
                      (r) => r.type === "finance" || r.type === "alert" || r.title.toLowerCase().includes("finance") || r.title.toLowerCase().includes("budget")
                    ).length;
                    return cnt;
                  })()} Active alerts)
                </p>
              </div>
            </div>
            <div className="text-slate-400">
              {isRemindersExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
          </button>

          {isRemindersExpanded && (
            <div className="p-4 border-t border-[#2a2a50]/40 bg-[#0d0d1a]/60 space-y-4 animate-fadeIn">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-[#2a2a50]/60 pb-2">
                <div>
                  <h4 className="font-extrabold uppercase tracking-widest text-[#00d4ff] text-xs font-mono">
                    Budget Warning Signals & Notifications
                  </h4>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setReminderModal({
                        isOpen: true,
                        defaultTitle: "Finance Goal Goalpost Checklist",
                        defaultNotes: "Check monthly transactions and goals update.",
                        mode: "reminder"
                      });
                    }}
                    className="px-3 py-1.5 bg-[#00d4ff]/10 hover:bg-[#00d4ff]/20 border border-[#00d4ff]/30 text-[#00d4ff] font-extrabold tracking-wider text-[10px] uppercase rounded-lg transition cursor-pointer"
                  >
                    + Create Reminder
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setReminderModal({
                        isOpen: true,
                        defaultTitle: "CRITICAL: Finance Budget Warning",
                        defaultNotes: "Budget limits threshold approaching warning alert.",
                        mode: "alert"
                      });
                    }}
                    className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 font-extrabold tracking-wider text-[10px] uppercase rounded-lg transition cursor-pointer"
                  >
                    🚨 Create System Alert
                  </button>
                </div>
              </div>

              {/* Existing Finance Calendar Reminders list */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {(() => {
                  const list = (state.reminders || []).filter(
                    (r) => r.type === "finance" || r.type === "alert" || r.title.toLowerCase().includes("finance") || r.title.toLowerCase().includes("budget")
                  );
                  if (!list.length) {
                    return (
                      <div className="md:col-span-2 bg-[#111120] border border-dashed border-[#1e1e38] p-4 text-center text-[10px] text-slate-600 uppercase font-mono tracking-wider rounded-xl">
                        // Operational capacity normal. Zero financial anomalies detected.
                      </div>
                    );
                  }
                  return list.map((rem) => (
                    <div key={rem.id} className="bg-[#111120] border border-[#2a2a50] rounded-xl p-3 flex justify-between items-center text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`w-1.5 h-1.5 rounded-full ${rem.type === "alert" || rem.title.startsWith("[ALERT]") ? "bg-rose-500 animate-ping" : "bg-[#00d4ff]"}`} />
                          <span className="font-extrabold text-slate-100">{rem.title}</span>
                          <span className={`text-[8px] font-black uppercase px-1 rounded ${rem.priority === "high" ? "bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse" : "bg-slate-800 text-slate-400"}`}>
                            {rem.priority}
                          </span>
                        </div>
                        <p className="text-[9px] text-slate-500 font-mono">
                          Time: {rem.dueDate} {rem.time ? `at ${rem.time}` : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setAppState((prev: AppState) => {
                              const next = {
                                ...prev,
                                reminders: prev.reminders.map((r) => r.id === rem.id ? { ...r, status: r.status === "done" ? "pending" : "done" as const } : r)
                              };
                              saveData(next);
                              return next;
                            });
                          }}
                          className={`px-2 py-0.5 text-[9px] font-black uppercase rounded cursor-pointer ${rem.status === "done" ? "bg-green-500/10 text-green-400" : "bg-zinc-800 text-zinc-400 hover:text-white"}`}
                        >
                          {rem.status === "done" ? "Done ✓" : "Pending"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setAppState((prev: AppState) => {
                              const next = {
                                ...prev,
                                reminders: prev.reminders.filter((r) => r.id !== rem.id)
                              };
                              saveData(next);
                              return next;
                            });
                          }}
                          className="text-slate-600 hover:text-rose-500 text-[11px] font-bold cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 💸 UNIFIED FINANCE HUB (Quick, Advanced, File Import, Text Paste) */}
      <div className="flex flex-col gap-4 border border-[#2a2a50] bg-[#111120] p-5 rounded-2xl animate-fadeIn">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-[#2a2a50]/40 pb-2 mb-1">
          <button 
            type="button"
            onClick={() => setFinanceTab('quick')} 
            className={`text-[10px] uppercase font-bold tracking-widest font-mono pb-1 transition-all cursor-pointer ${financeTab === 'quick' ? 'text-[#00ff88] border-b-2 border-[#00ff88]' : 'text-slate-500 hover:text-slate-300'}`}
          >
            ⚡ Quick Entry
          </button>
          <button 
            type="button"
            onClick={() => setFinanceTab('advanced')} 
            className={`text-[10px] uppercase font-bold tracking-widest font-mono pb-1 transition-all cursor-pointer ${financeTab === 'advanced' ? 'text-[#00d4ff] border-b-2 border-[#00d4ff]' : 'text-slate-500 hover:text-slate-300'}`}
          >
            ✍️ Manual Advanced Log
          </button>
          <button 
            type="button"
            onClick={() => setFinanceTab('file_import')} 
            className={`text-[10px] uppercase font-bold tracking-widest font-mono pb-1 transition-all cursor-pointer ${financeTab === 'file_import' ? 'text-[#ffaa00] border-b-2 border-[#ffaa00]' : 'text-slate-500 hover:text-slate-300'}`}
          >
            📁 File Statement Importer
          </button>
          <button 
            type="button"
            onClick={() => setFinanceTab('text_import')} 
            className={`text-[10px] uppercase font-bold tracking-widest font-mono pb-1 transition-all cursor-pointer ${financeTab === 'text_import' ? 'text-[#ff00a0] border-b-2 border-[#ff00a0]' : 'text-slate-500 hover:text-slate-300'}`}
          >
            📋 Smart Text Paste
          </button>
          <button 
            type="button"
            onClick={() => setFinanceTab('external_ai')} 
            className={`text-[10px] uppercase font-bold tracking-widest font-mono pb-1 transition-all cursor-pointer ${financeTab === 'external_ai' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-slate-500 hover:text-slate-300'}`}
          >
            🧠 Advanced External AI Coprocessor
          </button>
          <button 
            type="button"
            onClick={() => setFinanceTab('splits')} 
            className={`text-[10px] uppercase font-bold tracking-widest font-mono pb-1 transition-all cursor-pointer ${financeTab === 'splits' ? 'text-[#ff6b1a] border-b-2 border-[#ff6b1a]' : 'text-slate-500 hover:text-slate-300'}`}
          >
            🤝 Split Accounts Analyzer
          </button>
        </div>

        {/* 1. QUICK LOG TAB */}
        {financeTab === 'quick' && (
          <form onSubmit={handleQuickLog} className="flex flex-wrap gap-2 animate-fadeIn">
            <select value={txType} onChange={e => setTxType(e.target.value as any)} className="bg-[#0d0d1a] border border-[#2a2a50] rounded-xl px-3 py-2 text-xs text-white focus:outline-none cursor-pointer">
              <option value="expense">EXPENSE (-)</option>
              <option value="income">INCOME (+)</option>
            </select>
            <input type="text" placeholder="Note / Concept (e.g., Dinner at Bistro)..." value={concept} onChange={e => setConcept(e.target.value)} className="flex-1 bg-[#0d0d1a] border border-[#2a2a50] rounded-xl px-4 py-2 text-xs text-white min-w-[200px] focus:outline-none focus:border-[#00ff88]" required />
            <input type="number" step="0.01" placeholder="Amt $" value={amount} onChange={e => setAmount(e.target.value)} className="w-28 bg-[#0d0d1a] border border-[#2a2a50] rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-[#00ff88]" required />
            <button type="submit" className="bg-[#00ff88] text-black font-extrabold px-6 py-2 rounded-xl text-xs uppercase tracking-wider font-mono cursor-pointer hover:bg-opacity-90 transition animate-pulse">// ADD TRANSACTION</button>
          </form>
        )}

        {/* 2. MANUAL ADVANCED ENTRY LOG */}
        {financeTab === 'advanced' && (
          <div className="animate-fadeIn text-slate-200">
            <form onSubmit={handleAdvancedLog} className="space-y-4">
              <div className="flex items-center gap-1.5 border-b border-indigo-500/10 pb-1.5">
                <span className="text-[10px] font-bold text-[#00d4ff] uppercase tracking-widest font-mono">// 🌌 manual advanced transaction ledger log</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-widest font-bold text-slate-500 font-mono block">Transaction Date</label>
                  <input type="date" value={advDate} onChange={e => setAdvDate(e.target.value)} className="w-full bg-[#0d0d1a] border border-[#2a2a50] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00d4ff]" required />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-widest font-bold text-slate-500 font-mono block">Time (Optional)</label>
                  <input type="time" value={advTime} onChange={e => setAdvTime(e.target.value)} className="w-full bg-[#0d0d1a] border border-[#2a2a50] rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-[#00d4ff]" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-widest font-bold text-slate-500 font-mono block">Transaction Type</label>
                  <select value={advTxType} onChange={e => setAdvTxType(e.target.value as any)} className="w-full bg-[#0d0d1a] border border-[#2a2a50] rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-bold cursor-pointer font-mono">
                    <option value="debit">DEBIT (Expense)</option>
                    <option value="credit">CREDIT (Income)</option>
                    <option value="loan_given">LOAN GIVEN</option>
                    <option value="loan_repaid">LOAN REPAID</option>
                    <option value="custom">CUSTOM TYPE...</option>
                  </select>
                </div>
              </div>

              {advTxType === 'custom' && (
                <div className="space-y-1 animate-fadeIn">
                  <label className="text-[9px] uppercase tracking-widest font-bold text-slate-500 font-mono block">Custom Type Name</label>
                  <input
                    type="text"
                    placeholder="E.g. investment, gift, tax..."
                    value={customTxType}
                    onChange={e => setCustomTxType(e.target.value)}
                    className="w-full bg-[#0d0d1a] border border-[#ff00a0] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00d4ff]"
                    required
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-widest font-bold text-slate-500 font-mono block">Category</label>
                  <select value={advCategory} onChange={e => setAdvCategory(e.target.value)} className="w-full bg-[#0d0d1a] border border-[#2a2a50] rounded-xl px-3 py-2 text-xs text-white focus:outline-none cursor-pointer">
                    <option value="General">General</option>
                    <option value="Food">Food / Meals</option>
                    <option value="Bills">Bills / Utilities</option>
                    <option value="Shopping">Shopping / Essentials</option>
                    <option value="Transport">Transport / Fuels</option>
                    <option value="Entertainment">Entertainment / Leisure</option>
                    <option value="Savings">Savings / Investments</option>
                    <option value="Income">Income / Earnings</option>
                    <option value="custom">CUSTOM CATEGORY...</option>
                  </select>
                </div>

                {advCategory === 'custom' && (
                  <div className="space-y-1 animate-fadeIn">
                    <label className="text-[9px] uppercase tracking-widest font-bold text-slate-500 font-mono block">Custom Category Name</label>
                    <input
                      type="text"
                      placeholder="E.g. Travel, Gifts..."
                      value={customGoalCategory}
                      onChange={e => setCustomGoalCategory(e.target.value)}
                      className="w-full bg-[#0d0d1a] border border-[#2a2a50] rounded-xl px-3 py-2 text-xs text-indigo-300 focus:outline-none focus:border-[#00d4ff]"
                    />
                  </div>
                )}
                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-widest font-bold text-slate-500 font-mono block">Item / Concept / Merchant</label>
                  <input type="text" placeholder="E.g., AWS Cloud Hosting, Grocery Outlet..." value={concept} onChange={e => setConcept(e.target.value)} className="w-full bg-[#0d0d1a] border border-[#2a2a50] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00d4ff]" required />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-widest font-bold text-slate-500 font-mono block">Amount ({curr})</label>
                  <input type="number" step="0.01" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} className="w-full bg-[#0d0d1a] border border-[#2a2a50] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00d4ff]" required />
                </div>
              </div>

              {/* Advanced Fields matching Edit Modal */}
              <div className="border border-[#2a2a50]/40 p-3.5 rounded-xl bg-[#0a0a14] space-y-3.5">
                <p className="text-[9px] font-bold text-[#00d4ff] uppercase tracking-widest font-mono">// 🛠️ EXTENDED DATA MATRIX</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase tracking-widest font-bold text-slate-500 font-mono block">Physical Location / Spot</label>
                    <input type="text" placeholder="🗺️ Location (e.g. Starbucks, Paris)" value={advLocation} onChange={e => setAdvLocation(e.target.value)} className="w-full bg-[#0d0d1a] border border-[#2a2a50] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00d4ff]" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase tracking-widest font-bold text-slate-500 font-mono block">Reference URL / Invoice Link / Receipt</label>
                    <input type="text" placeholder="🔗 https://drive.google.com/..." value={links} onChange={e => setLinks(e.target.value)} className="w-full bg-[#0d0d1a] border border-[#2a2a50] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00d4ff]" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase tracking-widest font-bold text-slate-500 font-mono block">Split billing setting</label>
                    <select value={splitType} onChange={e => setSplitType(e.target.value as any)} className="w-full bg-[#0d0d1a] border border-[#2a2a50] rounded-xl px-3 py-2 text-xs text-white focus:outline-none cursor-pointer">
                      <option value="none">No Split (Standard Personal Tx)</option>
                      <option value="split-equally">Equally Split 50/50</option>
                      <option value="lent">"I Lent" (Peer owes me complete amt)</option>
                      <option value="borrowed">"I Owe" (I borrow from peer)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase tracking-widest font-bold text-slate-500 font-mono block">Counterparty / Participant Name</label>
                    <input 
                      type="text" 
                      placeholder="E.g., Alex, Roommate" 
                      value={splitWith} 
                      onChange={e => setSplitWith(e.target.value)} 
                      className={`w-full bg-[#0d0d1a] border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00d4ff] ${splitType !== 'none' ? 'border-[#00d4ff]/60' : 'border-[#2a2a50]'}`}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase tracking-widest font-bold text-slate-500 font-mono block">Custom Split Amount (Optional)</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      placeholder={splitType === 'split-equally' && amount ? (parseFloat(amount)/2).toFixed(2) : "Calculated dynamically"} 
                      value={splitAmount} 
                      onChange={e => setSplitAmount(e.target.value)} 
                      className={`w-full bg-[#0d0d1a] border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00d4ff] ${splitType !== 'none' ? 'border-[#00d4ff]/60' : 'border-[#2a2a50]'}`}
                      disabled={splitType === 'none'}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button type="submit" className="bg-[#00d4ff] text-black font-extrabold px-8 py-2.5 rounded-xl text-xs uppercase tracking-wider font-mono cursor-pointer hover:bg-opacity-90 transition shadow-[0_4px_12px_rgba(0,212,255,0.2)]">
                  ✓ LOG ADVANCED TRANSACTION
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 3. FILE STATEMENT IMPORTER */}
        {financeTab === 'file_import' && (
          <div className="space-y-3 animate-fadeIn">
            {loadedFile ? (
              <div className="space-y-4">
                {/* Cockpit Header */}
                <div className="flex items-center justify-between border-b border-[#ffaa00]/15 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#00ff88] animate-ping" />
                    <span className="text-[10px] font-bold text-[#ffaa00] uppercase tracking-widest font-mono">// FILE READY: {loadedFile.name}</span>
                  </div>
                  <button 
                    onClick={() => {
                      setLoadedFile(null);
                      setSelectedAIProcessor('none');
                      setExternalAiPasteValue("");
                    }}
                    className="text-[10px] text-red-400 hover:text-white font-mono font-bold uppercase tracking-widest bg-red-950/20 px-2.5 py-1 rounded-xl transition border border-red-900/40 hover:bg-red-900"
                  >
                    ✕ Clear & Upload New
                  </button>
                </div>

                {/* Processor Choice system */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button
                    onClick={async () => {
                      setIsAiLoading(true);
                      setSelectedAIProcessor('instant');
                      try {
                         if (loadedFile.isTextBased) {
                           await importViaAiServer(loadedFile.text || "", loadedFile.name);
                         } else {
                           await importViaAiServer("", loadedFile.name, loadedFile.base64, loadedFile.mime);
                         }
                      } catch(e) {
                         console.error(e);
                      } finally {
                         setIsAiLoading(false);
                      }
                    }}
                    disabled={isAiLoading}
                    className={`flex flex-col items-start text-left p-4 rounded-xl border transition cursor-pointer select-none
                       ${selectedAIProcessor === 'instant' 
                         ? 'border-[#00ff88] bg-[#00ff88]/5 shadow-[0_0_15px_rgba(0,255,136,0.15)]' 
                         : 'border-[#2a2a50] bg-[#0d0d1a] hover:border-[#00ff88]/40 hover:bg-[#111124]'}`}
                  >
                    <span className="text-[11px] font-bold text-[#00ff88] uppercase tracking-widest font-mono mb-1">⚡ Instant Background AI</span>
                    <p className="text-[10px] text-slate-400 font-mono leading-relaxed mb-3">
                      Completely hands-free backend conversion. Raw text is parsed safely on standard models with no copy-pasting.
                    </p>
                    <div className="w-full relative mt-auto text-center font-bold text-[10px] text-white py-1.5 uppercase font-mono tracking-wider bg-[#00ff88]/10 hover:bg-[#00ff88]/20 border border-[#00ff88]/30 hover:border-[#00ff88]/50 rounded-lg transition-all overflow-hidden">
                      {isAiLoading && selectedAIProcessor === 'instant' && (
                        <div className="absolute inset-0 bg-[#00ff88]/20 transition-all duration-300" style={{ width: `${aiPercent}%` }} />
                      )}
                      <span className="relative z-10">
                        {isAiLoading && selectedAIProcessor === 'instant' ? `⏳ Running AI System... ${aiPercent}%` : "Launch Instant Parsing"}
                      </span>
                    </div>
                  </button>

                  {aiParseFailed && (
                    <button
                      onClick={() => {
                        setSelectedAIProcessor('external');
                        // Automatically copy prompt to user's clipboard!
                        navigator.clipboard.writeText(promptText).then(() => {
                           setIsCopied(true);
                           setTimeout(() => setIsCopied(false), 3000);
                        }).catch(() => {});
                      }}
                      className={`flex flex-col items-start text-left p-4 rounded-xl border transition cursor-pointer select-none
                         ${selectedAIProcessor === 'external' 
                           ? 'border-purple-500 bg-purple-950/20 shadow-[0_0_15px_rgba(168,85,247,0.2)]' 
                           : 'border-[#2a2a50] bg-[#0d0d1a] hover:border-purple-500/40 hover:bg-[#111124]'}`}
                    >
                      <span className="text-[11px] font-bold text-purple-400 uppercase tracking-widest font-mono mb-1 font-sans">🧠 Advanced External Coprocessor</span>
                      <p className="text-[10px] text-slate-400 font-mono leading-relaxed mb-3">
                        Enlist elite 3rd party foundation LLMs (ChatGPT, Claude, etc.) for flawless column-map decoding & heavy datasets.
                      </p>
                      <div className="w-full mt-auto text-center font-bold text-[10px] text-white py-1.5 uppercase font-mono tracking-wider bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 hover:border-purple-500/50 rounded-lg transition-all">
                        Open Coprocessor Guide {isCopied && " (Auto-Copied!)"}
                      </div>
                    </button>
                  )}
                </div>

                {isAiLoading && selectedAIProcessor === 'instant' && (
                  <div className="p-4 bg-[#0d0d1a] border border-[#00ff88]/20 rounded-xl text-center space-y-2.5 animate-pulse mt-2">
                     <span className="text-xs font-mono text-[#00ff88] block tracking-wider uppercase">⏳ Analyzing with Secure Backend AI...</span>
                     <p className="text-[10px] text-slate-400 max-w-sm mx-auto font-mono">
                        Converting, analyzing and mapping transaction dates. Hold tight!
                     </p>
                     <button 
                       onClick={cancelAiAnalysis}
                       className="px-4 py-1 bg-slate-800 text-[10px] font-mono hover:bg-red-900 rounded-lg text-white transition"
                     >
                       Cancel
                     </button>
                  </div>
                )}

                {/* STEP-BY-STEP GUIDED FLOW FOR EXTERNAL AI COPROCESSOR */}
                {selectedAIProcessor === 'external' && (
                  <div className="space-y-4 border border-purple-500/25 p-4 rounded-xl bg-[#0d0d1a] mt-3">
                      {/* Explanatory notice */}
                      <div className="bg-[#111124] border border-purple-500/15 rounded-xl p-3.5 leading-relaxed font-mono">
                         <h4 className="text-[10.5px] font-bold text-purple-400 uppercase tracking-widest mb-1.5">// 💡 COPROCESSOR ASSISTANT DECK</h4>
                         <p className="text-[10px] text-slate-300">
                            Bypasses size boundaries and standard format limits by utilizing external consumer reasoning models.
                         </p>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[9px] mt-2.5">
                            <div className="bg-[#131124] p-2.5 rounded-lg border border-[#2a214a]">
                               <strong className="text-[#00ff88] block text-[10px] mb-1 font-sans">✓ Why choose this? (Pros)</strong>
                               • Flawless structure alignment even for complex bank grid styles.<br/>
                               • Bypasses internal time boundaries and processes heavy statement flows seamlessly.
                            </div>
                            <div className="bg-[#131124] p-2.5 rounded-lg border border-[#2a214a]">
                               <strong className="text-[#ff00a0] block text-[10px] mb-1 font-sans">✗ Trade-offs (Cons)</strong>
                               • Requires a quick manual copier/paster loop.<br/>
                               • Financial text/records are handled by your choice of external AI.
                            </div>
                         </div>
                      </div>

                      {/* Timeline Steps layout */}
                      <div className="relative border-l border-purple-500/25 ml-2 pl-4 space-y-6 pt-1">
                         {/* Step 1 */}
                         <div className="relative">
                            <span className="absolute -left-[22.5px] top-0 w-4.5 h-4.5 rounded-full bg-purple-500 text-black flex items-center justify-center text-[9px] font-bold font-mono">1</span>
                            <div>
                               <h5 className="text-[11px] font-bold text-white uppercase tracking-wider font-mono">We've compiled your data! Click to Copy Prompt:</h5>
                               <p className="text-[10px] text-slate-400 font-mono mb-2 leading-tight">
                                  {loadedFile.isTextBased 
                                     ? "✓ Raw statement records and formatting keys were automatically packed into the clipboard!" 
                                     : "💡 Image/PDF files can't be converted as text clipboard. Simply drag the file directly into ChatGPT along with the copied instructions below!"
                                  }
                               </p>
                               <div className="flex gap-2 font-mono">
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(promptText);
                                      setIsCopied(true);
                                      setTimeout(() => setIsCopied(false), 3000);
                                    }}
                                    className={`px-4 py-2 text-black font-extrabold text-[10px] uppercase tracking-widest rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${isCopied ? 'bg-[#00ff88]' : 'bg-purple-400 hover:bg-purple-300'}`}
                                  >
                                     {isCopied ? "✓ READY IN CLIPBOARD!" : "📋 COPY PROMPT WITH DATA"}
                                  </button>
                                  <button
                                    onClick={() => alert(promptText)}
                                    className="px-3 bg-slate-800 text-[9px] hover:text-white rounded-lg transition"
                                  >
                                     Show Raw Code
                                  </button>
                               </div>
                            </div>
                         </div>

                         {/* Step 2 */}
                         <div className="relative">
                            <span className="absolute -left-[22.5px] top-0 w-4.5 h-4.5 rounded-full bg-purple-500 text-black flex items-center justify-center text-[9px] font-bold font-mono">2</span>
                            <div>
                               <h5 className="text-[11px] font-bold text-white uppercase tracking-wider font-mono">Select Portal & Paste:</h5>
                               <p className="text-[10px] text-slate-400 font-mono mb-2 leading-tight">
                                  Paste it to your preferred AI portal. (The prompt instructs the AI to compose a clear copyable JSON array back for you):
                               </p>
                               <div className="flex flex-wrap gap-2 pt-1 font-mono">
                                  <a 
                                    href="https://chatgpt.com" 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="px-3 py-1.5 bg-[#0e0e1a] hover:bg-purple-900/40 border border-purple-500/20 hover:border-purple-500/50 text-[10px] rounded-lg transition"
                                  >
                                     💬 OpenAI ChatGPT
                                  </a>
                                  <a 
                                    href="https://claude.ai" 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="px-3 py-1.5 bg-[#0e0e1a] hover:bg-purple-900/40 border border-purple-500/20 hover:border-purple-500/50 text-[10px] rounded-lg transition"
                                  >
                                     🎭 Anthropic Claude
                                  </a>
                                  <a 
                                    href="https://gemini.google.com" 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="px-3 py-1.5 bg-[#0e0e1a] hover:bg-purple-900/40 border border-purple-500/20 hover:border-purple-500/50 text-[10px] rounded-lg transition"
                                  >
                                     ✨ Google Gemini
                                  </a>
                               </div>
                            </div>
                         </div>

                         {/* Step 3 */}
                         <div className="relative">
                            <span className="absolute -left-[22.5px] top-0 w-4.5 h-4.5 rounded-full bg-purple-500 text-black flex items-center justify-center text-[9px] font-bold font-mono">3</span>
                            <div>
                               <h5 className="text-[11px] font-bold text-white uppercase tracking-wider font-mono">Paste Copied AI Code Block Result Below:</h5>
                               <p className="text-[10px] text-slate-400 font-mono mb-2 leading-tight">
                                  Paste the exact JSON response list back from the AI box to complete:
                               </p>
                               <textarea
                                 value={externalAiPasteValue}
                                 onChange={(e) => setExternalAiPasteValue(e.target.value)}
                                 placeholder="[ { 'date': '... ' } ]"
                                 className="w-full h-32 bg-[#0c0c16] border border-purple-500/20 focus:border-purple-400 rounded-lg p-3 text-[10.5px] text-purple-200 font-mono focus:outline-none placeholder-purple-800/60"
                               />
                               <div className="flex gap-2 mt-2 font-mono">
                                  <button
                                    onClick={() => {
                                       if (!externalAiPasteValue.trim()) {
                                          alert("Please paste the AI output first!");
                                          return;
                                       }
                                       try {
                                         // Clean up markdown markers
                                         const cleanText = externalAiPasteValue
                                            .replace(/```json/gi, "")
                                            .replace(/```/gi, "");
                                         
                                         // Search for JSON array block bounds [ and ]
                                         const startIdx = cleanText.indexOf('[');
                                         const endIdx = cleanText.lastIndexOf(']');
                                         if (startIdx === -1 || endIdx === -1) {
                                            throw new Error("Missing structural JSON markers ([ or ]). Verify the copied data correctly contains a list.");
                                         }
                                         const parsedText = cleanText.substring(startIdx, endIdx + 1);
                                         const parsed = JSON.parse(parsedText);
                                         
                                         if (!Array.isArray(parsed)) throw new Error("Parsed result is not an Array format.");
                                         
                                         const newTxs: any[] = [];
                                         for (const tx of parsed) {
                                           if (!tx.date || !tx.amount || !tx.concept || !tx.type) continue;
                                           const rawId = tx.date + tx.amount + tx.concept;
                                           const cleanId = "tx_ai_ext_fk_" + safeBtoa(rawId.substring(0, 50)).slice(0, 16);
                                           
                                           let parsedAmtStr = String(tx.amount).replace(/[^0-9.-]/g, '');
                                           let originalParsedAmt = parseFloat(parsedAmtStr);
                                           let absoluteAmt = Math.abs(originalParsedAmt);
                                           
                                           let typeMapping = tx.type === "credit" || tx.type === "income" ? "credit" : "debit";
                                           if (originalParsedAmt < 0) {
                                              typeMapping = "debit";
                                           }

                                           newTxs.push({
                                               id: cleanId,
                                               tempId: "ext_" + Math.random().toString(36).substring(7),
                                               date: tx.date,
                                               timestamp: `${tx.date}T${tx.time || "12:00:00"}Z`,
                                               amount: absoluteAmt,
                                               concept: tx.concept.substring(0, 50),
                                               notes: "Extracted via External AI Companion",
                                               category: tx.category || "General",
                                               currency: "USD",
                                               source: "text_paste" as any,
                                               type: typeMapping,
                                               counterparty: tx.splitWith ? tx.splitWith.substring(0, 30) : tx.concept.substring(0, 30),
                                               location: tx.place || tx.location || undefined,
                                               splitWith: tx.splitWith || undefined,
                                               splitType: tx.splitType || "none",
                                               splitAmount: tx.splitAmount ? parseFloat(String(tx.splitAmount)) : undefined
                                           });
                                         }
                                         
                                         if (newTxs.length === 0) {
                                            alert("No valid transaction list was populated. Ensure your AI output has the proper object shape.");
                                            return;
                                         }
                                         
                                         setParsedPasteTxs(newTxs);
                                         // Clean up states
                                         setLoadedFile(null);
                                         setSelectedAIProcessor('none');
                                         setExternalAiPasteValue("");
                                         alert(`🎉 Outstanding! Imported ${newTxs.length} records into your temporary desk queue. Review & Save them below!`);
                                       } catch (err: any) {
                                          alert("Error during parsing: " + err.message + "\n\nMake sure the AI completed the query and gave proper JSON array structure.");
                                       }
                                    }}
                                    disabled={!externalAiPasteValue.trim()}
                                    className="flex-1 py-2 rounded-lg bg-[#00ff88] text-black font-black uppercase text-[10px] tracking-widest transition disabled:opacity-40 select-none cursor-pointer"
                                  >
                                     ✓ Process & Sync Statement
                                  </button>
                                  <button
                                    onClick={() => setExternalAiPasteValue("")}
                                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 font-semibold text-[10px] rounded-lg transition"
                                  >
                                     Clear
                                  </button>
                               </div>
                            </div>
                         </div>
                      </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="flex items-center gap-1.5 border-b border-[#ffaa00]/10 pb-1.5">
                  <span className="text-[10px] font-bold text-[#ffaa00] uppercase tracking-widest font-mono">// 📂 FILE STATEMENT AUTO-IMPORTER</span>
                </div>
                <div
                  onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleFileDrop}
                  className={`h-48 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-colors cursor-pointer
                             ${isDragOver ? 'border-[#ffaa00] bg-[#ffaa00]/10' : 'border-[#2a2a50] bg-[#0d0d1a] hover:border-[#ffaa00]/40'}`}
                >
                  <UploadCloud size={36} className={isDragOver ? "text-[#ffaa00]" : "text-slate-400"} />
                  <p className="text-xs text-slate-300 mt-2 font-mono uppercase tracking-widest text-center px-4 leading-relaxed">
                    Drop Image, PDF, CSV, or Excel Here<br />
                    <span className="text-[9px] text-[#00ff88]">(AI parses receipts, standard GPay/Bank PDFs & CSV forms seamlessly)</span>
                  </p>
                  <label className="mt-2.5 text-[10px] bg-[#2a2a50] px-3.5 py-1.5 rounded-full text-white cursor-pointer hover:bg-[#ffaa00] hover:text-black transition">
                    Browse Files
                    <input type="file" accept="image/*, .pdf, .csv, .xlsx, .xls, .txt" className="hidden" onChange={handleFileSelect} />
                  </label>
                </div>
                
                <button 
                  onClick={() => setFinanceTab('text_import')}
                  className="w-full mt-2 text-[10px] text-slate-500 hover:text-[#ff00a0] font-mono tracking-widest text-center border border-[#2a2a50] hover:border-[#ff00a0]/50 rounded-xl py-2 cursor-pointer transition border-dashed"
                >
                   Alternatively, copy-pasted text from statements? Click here to use Smart Text Paste!
                </button>
                <p className="text-[9.5px] text-slate-500 leading-normal font-mono px-1">
                  * Automatically extracts column layouts. Historical events synchronize safely to original transaction days and include automatic categorization logic.
                </p>
              </>
            )}
          </div>
        )}

        {/* 4. SMART TEXT PASTE IMPORTER */}
        {financeTab === 'text_import' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex items-center gap-1.5 border-b border-[#ff00a0]/10 pb-1.5">
              <span className="text-[10px] font-bold text-[#ff00a0] uppercase tracking-widest font-mono">// 📋 UNIVERSAL SMART TEXT PASTE</span>
            </div>
            <div className="text-[10.5px] text-slate-300 leading-relaxed bg-[#0d0d1a] border border-[#2a2a50]/40 p-3 rounded-xl font-mono">
               💡 <strong>Freeform AI Copier:</strong> Directly copy SMS alerts, receipt emails, or banking rows from websites, and paste them here. The OmniLife AI Backend will parse them dynamically!
            </div>
            <textarea
              value={rawPasteText}
              onChange={(e) => setRawPasteText(e.target.value)}
              placeholder="Example SMS/HTML text copy:
2026-05-25, Paid to Zomato Rome, 34.50 USD
Sent Rs 450 to Alex on 26 May at Bistro split with Alex
Salary Credit USD 5200 at 26-May-2026 09:30"
              className="w-full h-36 bg-[#0d0d1a] border border-[#2a2a50] rounded-xl p-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-[#ff00a0]"
            />
            <div className="flex gap-2">
              <button
                 onClick={() => importViaAiServer(rawPasteText, "pasted_text.txt")}
                 disabled={!rawPasteText.trim() || isAiLoading}
                 className={`relative overflow-hidden flex-1 bg-[#ff00a0] text-white font-extrabold px-6 py-2.5 rounded-xl text-xs uppercase tracking-widest font-mono cursor-pointer flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(255,0,160,0.35)] ${isAiLoading ? 'opacity-70' : 'hover:bg-opacity-90'}`}
              >
                 {isAiLoading && (
                   <div className="absolute inset-0 bg-black/20 transition-all duration-300" style={{ width: `${aiPercent}%` }} />
                 )}
                 <span className="relative z-10">
                    {isAiLoading ? `⏳ AI IS ANALYZING... ${aiPercent}%` : "🚀 ANALYZE & IMPORT"}
                 </span>
              </button>
              {isAiLoading && (
                 <button
                   onClick={cancelAiAnalysis}
                   className="bg-slate-800 hover:bg-slate-700 text-white font-extrabold px-4 py-2.5 rounded-xl text-[10px] uppercase tracking-widest font-mono cursor-pointer transition"
                 >
                   Stop
                 </button>
              )}
            </div>
            
            {aiParseFailed && (
              <div className="mt-4 p-3 border border-purple-500/20 bg-purple-900/10 rounded-xl text-center">
                 <p className="text-[10px] text-slate-300 font-mono mb-2">Instant Parsing failed. The statement format might be too complex for standard models.</p>
                 <button 
                    onClick={() => setFinanceTab('external_ai')}
                    className="px-4 py-1.5 bg-purple-500 hover:bg-purple-400 text-white font-bold text-[10px] uppercase tracking-widest rounded-lg transition"
                 >
                    Switch to External Coprocessor
                 </button>
              </div>
            )}
          </div>
        )}

        {/* 5. ADVANCED EXTERNAL AI COPROCESSOR */}
        {financeTab === 'external_ai' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-purple-500/10 pb-1.5">
              <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest font-mono">// 🧠 ADVANCED EXTERNAL AI COPROCESSOR</span>
              <span className="text-[9px] text-slate-500 uppercase tracking-widest bg-slate-800 px-2 py-0.5 rounded-full">Manual Processing Loop</span>
            </div>
            
            <div className="text-[10.5px] text-slate-300 leading-relaxed bg-[#0d0d1a] border border-purple-500/30 p-4 rounded-xl font-mono">
               <strong className="text-purple-400">⚠️ PRIVACY & SPEED NOTICE:</strong> This tab bypasses our internal AI parsing and relies on an external, high-context AI of your choice (like ChatGPT, Claude, Gemini Advanced). 
               <br/><br/>
               Use this if the file is too chaotic for the Universal Smart Paste tab, or if you prefer the fastest, most capable reasoning engines on the internet. <strong className="text-[#ff00a0]">Only do this if you are comfortable sharing your localized data with an external internet AI provider!</strong> Otherwise, stick to the local Smart Text Paste tab.
            </div>

            <div className="bg-[#1a1a2e] border border-[#2a2a50] rounded-xl p-3">
              <span className="text-[10px] text-slate-400 uppercase tracking-widest block mb-1">Step 1: Copy Prompt</span>
              <p className="text-[11px] text-slate-300 font-mono mb-2">
                Paste the following structured prompt alongside your messy financial data / CSV / bank statement into an external AI:
              </p>
              <div className="relative group">
                <textarea
                  readOnly
                  value={`I am giving you my messy financial data. Please act as a forensic accountant and parse it flawlessly into this EXACT JSON array format. Do not use markdown wrappers, do not chat. Reply ONLY with the [ { ... } ] JSON array.

[
  {
    "date": "YYYY-MM-DD",
    "time": "HH:MM:SS",
    "amount": 12.34,
    "concept": "Clean Merchant Name Only",
    "type": "debit" | "credit",
    "category": "Food/Transport/Shopping/Income/Entertainment/Bills/Savings/General/custom",
    "splitWith": "Name of person (optional)",
    "splitType": "none | lent | borrowed | split-equally",
    "splitAmount": 0
  }
]`}
                  className="w-full h-36 bg-[#0d0d1a] border border-[#2a2a50] rounded-xl p-3 text-[10px] text-purple-200 font-mono focus:outline-none"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`I am giving you my messy financial data. Please act as a forensic accountant and parse it flawlessly into this EXACT JSON array format. Do not use markdown wrappers, do not chat. Reply ONLY with the [ { ... } ] JSON array.\n\n[\n  {\n    "date": "YYYY-MM-DD",\n    "time": "HH:MM:SS",\n    "amount": 12.34,\n    "concept": "Clean Merchant Name Only",\n    "type": "debit" | "credit",\n    "category": "Food/Transport/Shopping/Income/Entertainment/Bills/Savings/General/custom",\n    "splitWith": "Name of person",\n    "splitType": "none | lent | borrowed | split-equally",\n    "splitAmount": 0\n  }\n]`);
                    alert("Copied Prompt to Clipboard!");
                  }}
                  className="absolute top-2 right-2 bg-slate-800 text-purple-400 hover:text-white px-3 py-1 rounded-md text-[9px] uppercase tracking-widest transition cursor-pointer"
                >
                  Copy Prompt
                </button>
              </div>
            </div>

            <div className="bg-[#1a1a2e] border border-[#2a2a50] rounded-xl p-3">
              <span className="text-[10px] text-slate-400 uppercase tracking-widest block mb-1">Step 2: Paste AI Response</span>
              <p className="text-[11px] text-slate-300 font-mono mb-2">
                Paste the resulting JSON array back from the AI here:
              </p>
              <textarea
                value={textStatement}
                onChange={(e) => setTextStatement(e.target.value)}
                placeholder="[ { ...parsed JSON... } ]"
                className="w-full h-32 bg-[#0d0d1a] border border-[#2a2a50] rounded-xl p-3 text-[11px] text-[#00ff88] font-mono focus:outline-none focus:border-purple-400"
              />
              <button
                onClick={() => {
                   if (!textStatement.trim()) return;
                   try {
                     const parsed = JSON.parse(textStatement.replace(/```json/g, "").replace(/```/g, ""));
                     if (!Array.isArray(parsed)) throw new Error("Resulting JSON must be an Array.");
                     
                     const newTxs: any[] = [];
                     for (const tx of parsed) {
                        if (!tx.date || !tx.amount || !tx.concept || !tx.type) continue;
                        const rawId = tx.date + tx.amount + tx.concept;
                        const cleanId = "tx_ai_ext_" + safeBtoa(rawId.substring(0, 50)).slice(0, 16);
                        
                        let extParsedAmtStr = String(tx.amount).replace(/[^0-9.-]/g, '');
                        let extOriginalParsedAmt = parseFloat(extParsedAmtStr);
                        let extAbsoluteAmt = Math.abs(extOriginalParsedAmt);
                        
                        let extTypeMapping = tx.type === "credit" || tx.type === "income" ? "credit" : "debit";
                        if (extOriginalParsedAmt < 0) {
                           extTypeMapping = "debit";
                        }

                        newTxs.push({
                            id: cleanId,
                            tempId: "ext_" + Math.random().toString(36).substring(7),
                            date: tx.date,
                            timestamp: `${tx.date}T${tx.time || "12:00:00"}Z`,
                            amount: extAbsoluteAmt,
                            concept: tx.concept.substring(0, 50),
                            notes: "Extracted via External AI",
                            category: tx.category || "General",
                            currency: "USD",
                            source: "text_paste" as any,
                            type: extTypeMapping,
                            counterparty: tx.splitWith ? tx.splitWith.substring(0,30) : tx.concept.substring(0,30),
                            location: tx.place || tx.location || undefined,
                            splitWith: tx.splitWith || undefined,
                            splitType: tx.splitType || "none",
                            splitAmount: tx.splitAmount ? parseFloat(String(tx.splitAmount)) : undefined
                        });
                     }
                     
                     setParsedPasteTxs(newTxs);
                     setFinanceTab('file_import');
                     setImportSubTab('paste');
                     setTextStatement(''); 
                   } catch(e: any) {
                     alert("Could not parse JSON. Make sure the AI gave you valid JSON data! Error: " + e.message);
                   }
                }}
                disabled={!textStatement.trim()}
                className="w-full mt-2 bg-purple-500 hover:bg-purple-400 text-white font-extrabold px-6 py-2.5 rounded-xl text-xs uppercase tracking-widest font-mono cursor-pointer transition shadow-[0_0_15px_rgba(168,85,247,0.3)] disabled:opacity-50"
              >
                Import Externally Parsed Data
              </button>
            </div>
          </div>
        )}

        {/* 6. SPLIT ACCOUNTS ANALYZER */}
        {financeTab === 'splits' && (() => {
          const splitTotals: Record<string, { youOwe: number, theyOwe: number, txs: any[] }> = {};
          
          (state.finances || []).forEach(f => {
             const person = f.splitWith?.trim();
             if (!person) return;
             if (!splitTotals[person]) {
                splitTotals[person] = { youOwe: 0, theyOwe: 0, txs: [] };
             }
             splitTotals[person].txs.push(f);
             
             if (f.splitType === 'lent') {
                splitTotals[person].theyOwe += parseFloat(f.splitAmount as any || 0);
             } else if (f.splitType === 'borrowed') {
                splitTotals[person].youOwe += parseFloat(f.splitAmount as any || 0);
             } else if (f.splitType === 'split-equally') {
                // assume you paid and they owe half
                splitTotals[person].theyOwe += (f.amount / 2);
             }
          });

          return (
            <div className="space-y-4 animate-fadeIn text-slate-200">
               <div className="flex items-center gap-1.5 border-b border-[#ff6b1a]/20 pb-1.5">
                  <span className="text-[10px] font-bold text-[#ff6b1a] uppercase tracking-widest font-mono">// 🤝 SPLIT ACCOUNTS & DEBTS ANALYZER</span>
               </div>
               
               {Object.keys(splitTotals).length === 0 ? (
                 <p className="text-xs text-slate-500 font-mono italic">No split transactions recorded yet. Add "Counterparty Details" in advanced log.</p>
               ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {Object.entries(splitTotals).map(([person, data]) => {
                      const net = data.theyOwe - data.youOwe;
                      const isNetPositive = net > 0;
                      return (
                        <div key={person} className="bg-[#1a1a2e] border border-[#2a2a50] p-4 rounded-xl flex flex-col gap-3">
                           <div className="flex justify-between items-center border-b border-[#2a2a50]/60 pb-2">
                             <h4 className="text-sm font-black uppercase tracking-widest text-[#00d4ff]">{person}</h4>
                             <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${net === 0 ? 'bg-slate-800 text-slate-400' : isNetPositive ? 'bg-[#00ff88]/10 text-[#00ff88]' : 'bg-rose-500/10 text-rose-400'}`}>
                               {net === 0 ? 'SETTLED' : isNetPositive ? `OWES YOU ${curr}${Math.abs(net).toFixed(2)}` : `YOU OWE ${curr}${Math.abs(net).toFixed(2)}`}
                             </span>
                           </div>
                           <div className="flex justify-between text-xs font-mono text-slate-400">
                             <div>
                               <p>You Borrowed: <span className="text-rose-400 font-bold">{curr}{data.youOwe.toFixed(2)}</span></p>
                             </div>
                             <div>
                               <p className="text-right">You Lent: <span className="text-[#00ff88] font-bold">{curr}{data.theyOwe.toFixed(2)}</span></p>
                             </div>
                           </div>
                           <div className="mt-2 text-[10px] space-y-1.5 max-h-32 overflow-y-auto scrollbar-none border-t border-[#2a2a50]/30 pt-2">
                              <p className="font-bold text-slate-500 mb-1 uppercase tracking-widest">Transaction History</p>
                              {data.txs.map(tx => (
                                <div key={tx.id} className="flex justify-between text-slate-400">
                                   <span>{tx.date} - {tx.concept}</span>
                                   <span className="font-mono text-slate-300">
                                     {tx.splitType === 'lent' && <span className="text-[#00ff88]">Lent: {curr}{tx.splitAmount}</span>}
                                     {tx.splitType === 'borrowed' && <span className="text-rose-400">Borrowed: {curr}{tx.splitAmount}</span>}
                                     {tx.splitType === 'split-equally' && <span className="text-indigo-400">Split (Total: {curr}{tx.amount})</span>}
                                   </span>
                                </div>
                              ))}
                           </div>
                        </div>
                      )
                   })}
                 </div>
               )}
            </div>
          );
        })()}

        {/* PREVIEW PANEL FOR AI IMPORTED TRANSACTIONS */}
        {parsedPasteTxs.length > 0 && (
          <div className="mt-6 border rounded-xl p-4 bg-[#0d0d1a] border-[#00d4ff]/40 shadow-[0_0_20px_rgba(0,212,255,0.1)]">
             <div className="flex items-center justify-between mb-4 border-b border-[#2a2a50] pb-2">
                <h3 className="text-xs font-bold text-[#00d4ff] uppercase tracking-widest font-mono">
                  Review & Approve ({parsedPasteTxs.length} items)
                </h3>
                <button
                  onClick={() => setParsedPasteTxs([])}
                  className="text-xs text-slate-500 hover:text-white uppercase font-bold tracking-widest font-mono transition"
                >
                  Discard
                </button>
             </div>
             <div className="max-h-[300px] overflow-y-auto scroll-style space-y-2 mb-4 pr-1">
                {parsedPasteTxs.map((tx, idx) => (
                   <div key={idx} className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-[#1a1a2e] border border-[#2a2a50] p-3 rounded-xl gap-2">
                       <div className="flex items-center gap-3 w-full sm:w-auto">
                          <div className={`p-1.5 rounded-full ${tx.type === 'debit' || tx.type === 'expense' ? 'bg-[#ff00a0]/10 text-[#ff00a0]' : 'bg-[#00ff88]/10 text-[#00ff88]'}`}>
                            <Activity size={14} />
                          </div>
                          <div>
                            <p className="text-[11px] text-white font-bold max-w-[200px] truncate" title={tx.concept}>{tx.concept}</p>
                            <p className="text-[9px] text-slate-400 font-mono">{tx.date} • {tx.category}</p>
                          </div>
                       </div>
                       <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto mt-2 sm:mt-0">
                          <p className={`text-[11px] font-mono font-bold ${tx.type === 'debit' || tx.type === 'expense' ? 'text-[#ff00a0]' : 'text-[#00ff88]'}`}>
                            {tx.type === 'debit' || tx.type === 'expense' ? '-' : '+'}${tx.amount.toFixed(2)}
                          </p>
                          <button
                             onClick={() => setParsedPasteTxs(prev => prev.filter((_, i) => i !== idx))}
                             className="text-slate-500 hover:text-red-400 transition"
                             title="Remove line"
                          >
                             <X size={14} />
                          </button>
                       </div>
                   </div>
                ))}
             </div>
             
             <div className="flex gap-2">
               <button
                 onClick={() => {
                   setAppState(prev => {
                      const next = { ...prev };
                      next.finances = prev.finances ? [...prev.finances] : [];
                      
                      let added = 0;
                      for (const tx of parsedPasteTxs) {
                        if (!next.finances.some(f => f.id === tx.id)) {
                           next.finances.push(tx);
                           added++;
                        }
                      }
                      
                      saveData(next);
                      alert(`🚀 You have successfully committed ${added} items to the secure universal registry.`);
                      return next;
                   });
                   setParsedPasteTxs([]);
                 }}
                 className="flex-1 bg-[#00d4ff] text-black font-extrabold px-6 py-2.5 rounded-xl text-xs uppercase tracking-widest font-mono hover:bg-opacity-90 inline-flex justify-center transition"
               >
                 Confirm & Record All
               </button>
             </div>
          </div>
        )}
      </div>
      
      {/* 📝 REGISTRY OF HISTORIC TRANSACTIONS & BALANCE AUDIT */}
      {(() => {
        const uniqueCategories = Array.from(new Set((state.finances || []).map(f => f.category || "General")));
        const uniqueTypes = Array.from(new Set((state.finances || []).map(f => f.type || "debit")));

        const filteredFinances = (state.finances || []).filter(tx => {
          const query = searchQuery.toLowerCase();
          const matchesQuery = !query || 
            (tx.concept && tx.concept.toLowerCase().includes(query)) || 
            (tx.notes && tx.notes.toLowerCase().includes(query)) ||
            (tx.category && tx.category.toLowerCase().includes(query)) ||
            (tx.location && tx.location.toLowerCase().includes(query)) ||
            (tx.type && tx.type.toLowerCase().includes(query)) ||
            (tx.counterparty && tx.counterparty.toLowerCase().includes(query));

          let matchesType = true;
          if (filterType !== 'all') {
            if (filterType === 'expense') {
              matchesType = tx.type === 'expense' || tx.type === 'debit';
            } else if (filterType === 'income') {
              matchesType = tx.type === 'income' || tx.type === 'credit';
            } else {
              matchesType = tx.type === filterType;
            }
          }

          let matchesCategory = true;
          if (filterCategory !== 'all') {
            matchesCategory = (tx.category || "General") === filterCategory;
          }

          return matchesQuery && matchesType && matchesCategory;
        });

        const sortedFinances = [...filteredFinances].sort((a, b) => {
          const dateA = a.date || "";
          const dateB = b.date || "";
          const idA = a.id || "";
          const idB = b.id || "";
          if (sortBy === 'date-desc') {
            return dateB.localeCompare(dateA) || idB.localeCompare(idA);
          } else if (sortBy === 'date-asc') {
            return dateA.localeCompare(dateB) || idA.localeCompare(idB);
          } else if (sortBy === 'amount-desc') {
            return (b.amount || 0) - (a.amount || 0);
          } else if (sortBy === 'amount-asc') {
            return (a.amount || 0) - (b.amount || 0);
          }
          return 0;
        });

        // Aggregations for Statement Report
        const allTransactions = state.finances || [];
        const inflowTx = allTransactions.filter(t => t.type === 'income' || t.type === 'credit');
        const outflowTx = allTransactions.filter(t => !t.type || t.type === 'expense' || t.type === 'debit' || t.type === 'loan_given');
        const totalInflows = inflowTx.reduce((sum, t) => sum + Number(t.amount), 0);
        const totalOutflows = outflowTx.reduce((sum, t) => sum + Number(t.amount), 0);
        const netCashflow = totalInflows - totalOutflows;

        let categoryOutflows: {[key: string]: number} = {};
        outflowTx.forEach(t => {
          const cat = t.category || "General";
          categoryOutflows[cat] = (categoryOutflows[cat] || 0) + Number(t.amount);
        });

        const handleCopyStatementPrompt = () => {
          let mark = `## COMPREHENSIVE FINANCIAL AUDIT REPORT STATEMENT\n\n`;
          mark += `### CORE BALANCE MATRIX\n`;
          mark += `- TOTAL CASH REVENUE INFLOWS: $${totalInflows.toFixed(2)}\n`;
          mark += `- TOTAL CASH DISBURSEMENT OUTFLOWS: $${totalOutflows.toFixed(2)}\n`;
          mark += `- NET CASHFLOW POSITION: $${netCashflow.toFixed(2)}\n\n`;
          
          mark += `### OPERATING EXPENDITURE OUTLAYS BY CATEGORY\n`;
          Object.entries(categoryOutflows).forEach(([cat, val]) => {
            mark += `- ${cat.toUpperCase()}: $${val.toFixed(2)}\n`;
          });
          
          mark += `\n### DETAILED TRANSACTION PATHS\n`;
          allTransactions.forEach((tx) => {
            const safeType = (tx.type || "expense").toUpperCase();
            const safeAmount = (Number(tx.amount) || 0).toFixed(2);
            mark += `- [${tx.date}] [Type: ${safeType}] Category: ${tx.category || "General"} | ${tx.concept} : $${safeAmount} ${tx.location ? `| Location: ${tx.location}` : ""} ${tx.counterparty ? `| Party: ${tx.counterparty}` : ""}\n`;
          });

          navigator.clipboard.writeText(mark);
          alert("Dynamic Financial Statement copied to clipboard!");
        };

        return (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#2a2a50]/60 pb-2 gap-2">
              <div>
                <h3 className="font-extrabold uppercase tracking-widest text-[#00d4ff] text-xs font-mono flex items-center gap-1.5">
                  📝 Ledgers & Active Audit Reports
                </h3>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">Showing {sortedFinances.length} of {allTransactions.length} transaction logs.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setShowStatementModal(true)}
                  className="bg-gradient-to-r from-[#00d4ff] to-[#00ff88] text-[#0d0d1a] font-mono font-black text-[10px] uppercase px-3 py-1.5 rounded-xl tracking-wider hover:opacity-90 transition flex items-center gap-1"
                >
                  <FileText size={12} /> 📋 View Statement
                </button>
                <button
                  type="button"
                  onClick={handleCopyStatementPrompt}
                  className="bg-[#2a2a50] hover:bg-[#3a3a60] text-slate-200 border border-[#44447a]/50 font-mono text-[10px] uppercase px-3 py-1.5 rounded-xl tracking-wider transition flex items-center gap-1"
                >
                  <Clipboard size={12} /> Copy Statement
                </button>
              </div>
            </div>

            {/* 🔍 SEARCH, FILTER & SORTING COMMAND GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 bg-[#111120] p-3 rounded-xl border border-[#2a2a50]">
              <div className="relative col-span-1 sm:col-span-1.5 font-mono">
                <Search size={14} className="absolute left-2.5 top-2.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search ledgers, location..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-[#0d0d1a] border border-[#2a2a50] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#00d4ff] font-mono"
                />
              </div>

              <div className="flex items-center gap-1 bg-[#0d0d1a] border border-[#2a2a50] rounded-lg px-2 py-1">
                <SlidersHorizontal size={12} className="text-slate-500" />
                <select
                  value={filterType}
                  onChange={e => setFilterType(e.target.value)}
                  className="bg-transparent text-slate-300 text-[10px] uppercase font-bold focus:outline-none w-full cursor-pointer"
                >
                  <option value="all">ALL TYPES</option>
                  <option value="expense">EXPENSES (Debit)</option>
                  <option value="income">INCOME (Credit)</option>
                  <option value="loan_given">LOAN GIVEN</option>
                  <option value="loan_repaid">LOAN REPAID</option>
                  {uniqueTypes.filter(t => t !== 'expense' && t !== 'debit' && t !== 'income' && t !== 'credit' && t !== 'loan_given' && t !== 'loan_repaid').map(t => (
                    <option key={t} value={t}>{String(t).toUpperCase()}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1 bg-[#0d0d1a] border border-[#2a2a50] rounded-lg px-2 py-1">
                <SlidersHorizontal size={12} className="text-slate-500" />
                <select
                  value={filterCategory}
                  onChange={e => setFilterCategory(e.target.value)}
                  className="bg-transparent text-slate-300 text-[10px] uppercase font-bold focus:outline-none w-full cursor-pointer"
                >
                  <option value="all">ALL CATEGORIES</option>
                  {uniqueCategories.map(cat => (
                    <option key={cat || 'General'} value={cat || 'General'}>{String(cat || 'General').toUpperCase()}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1 bg-[#0d0d1a] border border-[#2a2a50] rounded-lg px-2 py-1">
                <ArrowUpDown size={12} className="text-slate-500" />
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  className="bg-transparent text-slate-300 text-[10px] uppercase font-bold focus:outline-none w-full cursor-pointer"
                >
                  <option value="date-desc">Newest First</option>
                  <option value="date-asc">Oldest First</option>
                  <option value="amount-desc">Amount (Max)</option>
                  <option value="amount-asc">Amount (Min)</option>
                </select>
              </div>
            </div>

            {/* 📝 DYNAMIC SORTED LEDGER CONTAINER */}
            <div className="bg-[#0d0d1a]/50 p-4 rounded-2xl border border-[#1e1e38] min-h-[300px] flex flex-col gap-2">
              {sortedFinances.slice(0, visibleTxsCount).map((e, eIdx) => {
                const isInc = e.type === "income" || e.type === "credit" || e.type === "loan_repaid";
                return (
                  <div
                    key={`${e.id}_${eIdx}`}
                    className="flex flex-col gap-2 p-3 bg-[#111120] rounded-xl border border-[#1e1e38] hover:border-[#2a2a50] transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${isInc ? "bg-[#00ff88]/10 text-[#00ff88]" : "bg-rose-500/10 text-rose-400"}`}
                        >
                          {isInc ? "+" : "-"}
                        </span>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-xs font-bold text-slate-200">
                              {e.concept}
                            </p>
                            {e.category && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#1e1e38] text-slate-400 font-mono">
                                {e.category}
                              </span>
                            )}
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-950/20 text-[#00d4ff] font-mono tracking-widest font-black uppercase">
                              {(e.type || "expense").toUpperCase()}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 mt-1.5">
                            <span className="text-[9px] text-slate-500 font-mono">
                              {e.date}
                            </span>
                            {e.location && (
                              <span className="text-[9px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 flex items-center gap-0.5 font-mono">
                                <MapPin size={9} className="text-slate-500" /> {e.location}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span
                          className={`text-sm font-black ${isInc ? "text-[#00ff88]" : "text-slate-200"}`}
                        >
                          {curr}{(Number(e.amount) || 0).toFixed(2)}
                        </span>
                    <button
                      onClick={() => handleSetReminder(e, "reminder")}
                      className="text-slate-600 hover:text-[#00d4ff] transition cursor-pointer"
                      title="Set scheduled calendar reminder"
                    >
                      <Bell size={14} />
                    </button>
                    <button
                      onClick={() => handleSetReminder(e, "alert")}
                      className="text-slate-600 hover:text-rose-500 transition cursor-pointer"
                      title="Set high-priority system alert"
                    >
                      <AlertTriangle size={14} />
                    </button>
                    <button
                      onClick={() => startEditing(e)}
                      className="text-slate-600 hover:text-[#00ff88] transition cursor-pointer"
                      title="Edit Transaction"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={() => handleRemove(e.id)}
                      className="text-slate-600 hover:text-rose-500 transition cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                {(e.splitWith || e.links || (e.tasks && e.tasks.length > 0)) && (
                  <div className="flex flex-col gap-2 pl-11 pt-1 border-t border-[#1e1e38]/50 mt-1">
                    <div className="flex flex-wrap gap-3">
                      {e.splitWith && (
                        <span className="text-[10px] text-slate-400 bg-[#0d0d1a] px-2 py-0.5 rounded border border-[#2a2a50]">
                          Split: {e.splitWith}
                          {e.splitType === 'lent' && ` (I lent: $${e.splitAmount || 0})`}
                          {e.splitType === 'borrowed' && ` (I owe: $${e.splitAmount || 0})`}
                          {e.splitType === 'split-equally' && ` (Equally)`}
                        </span>
                      )}
                      {e.links && (
                        <a
                          href={
                            e.links.startsWith("http")
                              ? e.links
                              : `https://${e.links}`
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-[#00d4ff] hover:underline bg-[#00d4ff]/10 px-2 py-0.5 rounded border border-[#00d4ff]/20 truncate max-w-[200px]"
                        >
                          Link
                        </a>
                      )}
                    </div>

                    <div className="space-y-1">
                      {(e.tasks || []).map((task) => (
                        <div
                          key={task.id}
                          className="flex items-center justify-between group p-1.5 hover:bg-[#0d0d1a] rounded-lg transition"
                        >
                          <div
                            className="flex items-center gap-2 cursor-pointer select-none flex-1"
                            onClick={() => {
                              setAppState((prev: AppState) => {
                                const next = {
                                  ...prev,
                                  finances: prev.finances.map((f) =>
                                    f.id === e.id
                                      ? {
                                          ...f,
                                          tasks: (f.tasks || []).map((t) =>
                                            t.id === task.id
                                              ? { ...t, done: !t.done }
                                              : t,
                                          ),
                                        }
                                      : f,
                                  ),
                                };
                                saveData(next);
                                return next;
                              });
                            }}
                          >
                            {task.done ? (
                              <CheckSquare
                                size={14}
                                className="text-[#00ff88] shrink-0"
                              />
                            ) : (
                              <Square
                                size={14}
                                className="text-slate-600 shrink-0"
                              />
                            )}
                            <span
                              className={`text-[11px] font-medium transition ${task.done ? "text-slate-500 line-through" : "text-slate-200"}`}
                            >
                              {task.name}
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              setAppState((prev: AppState) => {
                                const next = {
                                  ...prev,
                                  finances: prev.finances.map((f) =>
                                    f.id === e.id
                                      ? {
                                          ...f,
                                          tasks: (f.tasks || []).filter(
                                            (t) => t.id !== task.id,
                                          ),
                                        }
                                      : f,
                                  ),
                                };
                                saveData(next);
                                return next;
                              });
                            }}
                            className="text-slate-600 hover:text-rose-500 transition opacity-0 group-hover:opacity-100 px-2"
                          >
                            &times;
                          </button>
                        </div>
                      ))}
                      <input
                        type="text"
                        placeholder="+ Add step/goal task..."
                        onKeyDown={(evt) => {
                          if (evt.key === "Enter") {
                            const el = evt.target as HTMLInputElement;
                            if (!el.value) return;
                            setAppState((prev: AppState) => {
                              const next = {
                                ...prev,
                                finances: prev.finances.map((f) =>
                                  f.id === e.id
                                    ? {
                                        ...f,
                                        tasks: [
                                          ...(f.tasks || []),
                                          {
                                            id: "tk_" + Date.now(),
                                            name: el.value,
                                            done: false,
                                          },
                                        ],
                                      }
                                    : f,
                                ),
                              };
                              saveData(next);
                              return next;
                            });
                            el.value = "";
                          }
                        }}
                        className="w-full bg-transparent border-none text-[10px] text-slate-500 focus:outline-none placeholder-slate-700 py-0.5 px-1.5"
                      />
                    </div>
                  </div>
                )}
                {!(e.splitWith || e.links || (e.tasks && e.tasks.length > 0)) && (
                  <div className="pl-11 pt-1 border-t border-[#1e1e38]/50 mt-1">
                    <input
                      type="text"
                      placeholder="+ Add step/goal task..."
                      onKeyDown={(evt) => {
                        if (evt.key === "Enter") {
                          const el = evt.target as HTMLInputElement;
                          if (!el.value) return;
                          setAppState((prev: AppState) => {
                            const next = {
                              ...prev,
                              finances: prev.finances.map((f) =>
                                f.id === e.id
                                  ? {
                                      ...f,
                                      tasks: [
                                        ...(f.tasks || []),
                                        {
                                          id: "tk_" + Date.now(),
                                          name: el.value,
                                          done: false,
                                        },
                                      ],
                                    }
                                  : f,
                              ),
                            };
                            saveData(next);
                            return next;
                          });
                          el.value = "";
                        }
                      }}
                      className="w-full bg-transparent border-none text-[10px] text-slate-500 focus:outline-none placeholder-slate-700 py-0.5 px-1.5"
                    />
                  </div>
                )}
              </div>
            ); })}

          {sortedFinances.length > visibleTxsCount && (
            <div className="pt-2 pb-1 flex justify-center">
              <button
                type="button"
                onClick={() => setVisibleTxsCount(prev => prev + 10)}
                className="w-full bg-[#111122] hover:bg-[#1e1e38] border border-[#2a2a50] hover:border-[#00ff88]/50 text-slate-300 hover:text-[#00ff88] py-2.5 px-6 rounded-xl text-[10px] tracking-widest uppercase font-mono font-bold transition flex items-center justify-center gap-2"
              >
                🎒 See More Transactions (+10) <span>▼</span>
              </button>
            </div>
          )}

          {!state.finances?.length && (
            <div className="flex-1 flex items-center justify-center text-slate-600 text-[10px] tracking-widest font-mono uppercase py-8">
              // Financial ledger empty. Awaiting dynamic tracking injection.
            </div>
          )}
        </div>

        {/* 📊 ADVANCED FINANCIAL ANALYTICS & INTELLIGENCE SUITE */}
        {(() => {
          const allFinances = state.finances || [];
          const totalIncome = allFinances.filter(f => f.type === 'income' || f.type === 'credit').reduce((sum, f) => sum + Number(f.amount), 0);
          const totalExpense = allFinances.filter(f => !f.type || f.type === 'expense' || f.type === 'debit' || f.type === 'loan_given').reduce((sum, f) => sum + Number(f.amount), 0);
          const netFlow = totalIncome - totalExpense;

          let lent = 0;
          let borrowed = 0;
          allFinances.forEach(f => {
              if (f.splitType === 'lent') lent += (f.splitAmount || 0);
              if (f.splitType === 'borrowed') borrowed += (f.splitAmount || 0);
              if (f.type === 'loan_given') lent += f.amount;
              if (f.type === 'loan_repaid') lent -= f.amount;
          });

          // Category breakdowns
          const expByCategory = allFinances
            .filter(f => f.type === 'expense' || f.type === 'debit')
            .reduce((acc, f) => {
              const cat = f.category || 'General';
              acc[cat] = (acc[cat] || 0) + f.amount;
              return acc;
            }, {} as Record<string, number>);

          const incByCategory = allFinances
            .filter(f => f.type === 'income' || f.type === 'credit')
            .reduce((acc, f) => {
              const cat = f.category || 'General';
              acc[cat] = (acc[cat] || 0) + f.amount;
              return acc;
            }, {} as Record<string, number>);

          // Saving margin ratio helper
          const savingsRatio = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;
          const totalTxsCount = allFinances.length;
          
          // Daily Burn Rate Analysis
          const distinctDates = Array.from(new Set(allFinances.map(f => f.date || ''))).filter(Boolean).sort() as string[];
          const totalDaysSpan = distinctDates.length > 1 
            ? Math.max(1, Math.round((new Date((distinctDates[distinctDates.length - 1] as string)).getTime() - new Date((distinctDates[0] as string)).getTime()) / (1000*60*60*24)))
            : 1;
          const dailyBurnRate = totalExpense / totalDaysSpan;
          const dailyIncomeRate = totalIncome / totalDaysSpan;

          // Compute budget check against a custom alert benchmark
          const foodBudget = state.profile?.dailyBudgetLimit !== undefined ? (state.profile.dailyBudgetLimit * 0.3) : 15;
          const foodExpense = Number(expByCategory['Food'] || 0);
          const currentFoodBurnPercentage = foodBudget > 0 ? (foodExpense / (foodBudget * totalDaysSpan)) * 100 : 0;

          return (
            <div className="bg-[#111120] border border-[#2a2a50] p-6 rounded-2xl space-y-6 mt-6 animate-fadeIn">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-[#2a2a50]/60 pb-4 gap-2">
                <div>
                  <h3 className="text-sm font-black uppercase text-[#00ff88] tracking-widest font-mono flex items-center gap-1.5">
                    📊 ADVANCED FINANCIAL INTELLIGENCE DASHBOARD
                  </h3>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">// REAL-TIME DEEP ANALYSIS AND COGNITIVE INSIGHTS</p>
                </div>
                <div className="bg-[#0d0d1a] px-3 py-1 rounded-full border border-[#2a2a50] text-[10px] text-slate-400 font-mono">
                  Tx Loaded Count: <span className="text-white font-bold">{totalTxsCount}</span>
                </div>
              </div>

              {/* Core metrics panel row */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-[#0d0d1a] border border-[#2a2a50]/65 p-4 rounded-xl flex flex-col justify-between">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Aggregate Cashflow</span>
                  <div className="mt-2">
                    <span className="text-slate-600 text-[10px] block font-mono">Net Savings Flow</span>
                    <span className={`text-lg font-black font-mono tracking-tight ${netFlow >= 0 ? 'text-[#00ff88]' : 'text-[#ff00a0]'}`}>
                      {netFlow >= 0 ? '+' : ''}{curr}{netFlow.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="bg-[#0d0d1a] border border-[#2a2a50]/65 p-4 rounded-xl flex flex-col justify-between">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Savings Margin Ratio</span>
                  <div className="mt-2 w-full">
                    <div className="flex justify-between items-center text-[9px] text-slate-500 font-mono mb-1">
                      <span>Savings Ratio</span>
                      <span className={savingsRatio >= 20 ? 'text-[#00ff88] font-bold' : (savingsRatio >= 0 ? 'text-yellow-400' : 'text-red-400')}>
                        {savingsRatio.toFixed(1)}% Saved
                      </span>
                    </div>
                    {/* Visual metric ratio bar */}
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${savingsRatio >= 20 ? 'bg-[#00ff88]' : (savingsRatio >= 0 ? 'bg-yellow-400' : 'bg-[#ff00a0]')}`}
                        style={{ width: `${Math.min(100, Math.max(0, savingsRatio))}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-[#0d0d1a] border border-[#2a2a50]/65 p-4 rounded-xl flex flex-col justify-between">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Lent & Borrowed Ledger</span>
                  <div className="mt-2 text-[11px] font-mono">
                    <div className="flex justify-between text-[#00d4ff]">
                      <span>Owed to You:</span>
                      <span className="font-bold text-white">{curr}{lent.toFixed(1)}</span>
                    </div>
                    <div className="flex justify-between text-rose-400 mt-1">
                      <span>You Owe:</span>
                      <span className="font-bold text-white">{curr}{borrowed.toFixed(1)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-[#0d0d1a] border border-[#2a2a50]/65 p-4 rounded-xl flex flex-col justify-between">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Daily Burn / Earn Rate</span>
                  <div className="mt-2 text-[11px] font-mono flex flex-col gap-1.5">
                    <div className="flex justify-between text-rose-400">
                      <span>Spend Rate:</span>
                      <span className="font-bold text-right">{curr}{dailyBurnRate.toFixed(1)}/d {state.profile?.dailyBudgetLimit ? <span className="block text-[8px] opacity-70">Limit: {curr}{state.profile.dailyBudgetLimit}</span> : ''}</span>
                    </div>
                    <div className="flex justify-between text-[#00ff88]">
                      <span>Earn Rate:</span>
                      <span className="font-bold text-right">{curr}{dailyIncomeRate.toFixed(1)}/d {state.profile?.dailyIncomeTarget ? <span className="block text-[8px] opacity-70">Target: {curr}{state.profile.dailyIncomeTarget}</span> : ''}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Graphical breakdowns and distribution progress panel */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Category Outflows */}
                <div className="bg-[#0d0d1a] border border-[#1e1e35] rounded-xl p-4 space-y-3">
                  <span className="text-[10px] font-mono font-bold text-[#ff00a0] uppercase tracking-widest block">// Outflow Breakdown by Category</span>
                  <div className="space-y-2.5">
                    {(Object.entries(expByCategory) as [string, number][]).sort((a,b)=>Number(b[1])-Number(a[1])).map(([cat, val]) => {
                      const valNum = Number(val);
                      const percentage = totalExpense > 0 ? (valNum / totalExpense) * 100 : 0;
                      return (
                        <div key={cat} className="space-y-1">
                          <div className="flex justify-between text-[11px] font-mono">
                            <span className="text-slate-300">{cat}</span>
                            <span className="text-slate-400 font-bold">${valNum.toFixed(2)} ({percentage.toFixed(0)}%)</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-red-500 to-[#ff00a0] rounded-full" 
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                    {Object.keys(expByCategory).length === 0 && (
                      <span className="text-[10px] text-slate-600 font-mono block py-2">No category outflows captured.</span>
                    )}
                  </div>
                </div>

                {/* Category Inflows */}
                <div className="bg-[#0d0d1a] border border-[#1e1e35] rounded-xl p-4 space-y-3">
                  <span className="text-[10px] font-mono font-bold text-[#00ff88] uppercase tracking-widest block">// Inflow Breakdown by Category</span>
                  <div className="space-y-2.5">
                    {(Object.entries(incByCategory) as [string, number][]).sort((a,b)=>Number(b[1])-Number(a[1])).map(([cat, val]) => {
                      const valNum = Number(val);
                      const percentage = totalIncome > 0 ? (valNum / totalIncome) * 100 : 0;
                      return (
                        <div key={cat} className="space-y-1">
                          <div className="flex justify-between text-[11px] font-mono">
                            <span className="text-slate-300">{cat}</span>
                            <span className="text-slate-400 font-bold">${valNum.toFixed(2)} ({percentage.toFixed(0)}%)</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-teal-400 to-[#00ff88] rounded-full" 
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                    {Object.keys(incByCategory).length === 0 && (
                      <span className="text-[10px] text-slate-600 font-mono block py-2">No category inflows captured.</span>
                    )}
                  </div>
                </div>

              </div>

              {/* Dynamic Health Warnings & Smart Advice */}
              <div className="bg-[#0d0d1a]/55 border border-[#2a2a50]/50 p-4 rounded-xl space-y-2">
                <span className="text-[10px] font-mono font-bold text-[#00d4ff] uppercase tracking-widest block">💡 PREDICTIVE METRIC INSIGHTS</span>
                <div className="text-[11px] font-mono space-y-1.5 text-slate-400">
                  {netFlow > 0 ? (
                    <p className="text-emerald-400">✓ Your ledger is in positive net flow status. Your saving velocity is configured fine for wealth cultivation.</p>
                  ) : (
                    <p className="text-rose-400 font-medium">⚠️ Alert: You are spending more than your captured inflows. Recommend pruning non-essential shopping or food expenditures immediately.</p>
                  )}
                  {foodExpense > 0 && currentFoodBurnPercentage > 80 && (
                    <p className="text-yellow-400">⏳ Warning: Food subscription/eating out is taking up {currentFoodBurnPercentage.toFixed(0)}% of your estimated budget allotment.</p>
                  )}
                  {lent > borrowed ? (
                    <p className="text-sky-400">ℹ Balance Notice: You are net-lent to peers (${(lent - borrowed).toFixed(0)} surplus in outstanding IOUs). Remind debtors to settle balances.</p>
                  ) : null}
                  <p className="text-slate-500 italic">// Calculated dynamically from {totalDaysSpan} captured timeline days.</p>
                </div>
              </div>
            </div>
          );
        })()}

        {showStatementModal && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[300] animate-fadeIn font-sans flex items-center justify-center p-4">
            <div className="bg-[#0b0b16] border border-[#2a2a50] rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
              <div className="p-5 border-b border-[#2a2a50]/60 flex items-center justify-between bg-[#111122]">
                <div>
                  <h4 className="text-xs sm:text-sm font-black uppercase text-[#00d4ff] tracking-widest font-mono flex items-center gap-2">
                    📊 SYSTEM PRECISE FINANCIAL STATEMENT
                  </h4>
                  <p className="text-[9px] sm:text-[10px] text-slate-500 font-mono mt-0.5">// OFFICIAL GENERATED BALANCE SHEET REPORT</p>
                </div>
                <button
                  onClick={() => setShowStatementModal(false)}
                  className="text-slate-400 hover:text-white font-black font-mono text-xs p-1"
                >
                  [CLOSE &times;]
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-6 text-slate-200">
                {/* Key Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-[#111122]/80 p-3.5 rounded-xl border border-[#2a2a50]">
                    <span className="text-[8.5px] font-bold text-slate-500 uppercase tracking-widest font-mono block">Gross Inflows</span>
                    <span className="text-base sm:text-lg font-black text-[#00ff88] mt-1 block">${totalInflows.toFixed(2)}</span>
                    <span className="text-[8px] text-emerald-600 font-mono mt-1 block">// REVENUE CREDIT</span>
                  </div>
                  <div className="bg-[#111122]/80 p-3.5 rounded-xl border border-[#2a2a50]">
                    <span className="text-[8.5px] font-bold text-slate-500 uppercase tracking-widest font-mono block">Gross Outflows</span>
                    <span className="text-base sm:text-lg font-black text-rose-400 mt-1 block">${totalOutflows.toFixed(2)}</span>
                    <span className="text-[8px] text-rose-600 font-mono mt-1 block">// OPERATING DEBITS</span>
                  </div>
                  <div className="bg-[#111122]/80 p-3.5 rounded-xl border border-[#2a2a50]">
                    <span className="text-[8.5px] font-bold text-slate-500 uppercase tracking-widest font-mono block">Net Cashflow</span>
                    <span className={`text-base sm:text-lg font-black mt-1 block ${netCashflow >= 0 ? "text-[#00ff88]" : "text-rose-400"}`}>
                      ${netCashflow.toFixed(2)}
                    </span>
                    <span className="text-[8px] text-slate-600 font-mono mt-1 block">// SYSTEM POSITIONAL FLOW</span>
                  </div>
                </div>

                {/* Categorized Expenditures */}
                <div className="space-y-3 bg-[#0d0d1a] p-4 rounded-xl border border-[#1e1e3b]">
                  <h5 className="text-[10px] font-bold uppercase tracking-widest font-mono text-slate-400">Operating Expenses Breakdown</h5>
                  <div className="space-y-4">
                    {Object.entries(categoryOutflows).map(([cat, val]) => {
                      const percent = totalOutflows > 0 ? (val / totalOutflows) * 100 : 0;
                      return (
                        <div key={cat} className="space-y-1">
                          <div className="flex justify-between items-center text-xs font-mono">
                            <span className="text-slate-300 font-bold uppercase">{cat}</span>
                            <span className="text-[#00d4ff] font-extrabold">${val.toFixed(2)} <span className="text-slate-500 font-mono">({percent.toFixed(0)}%)</span></span>
                          </div>
                          <div className="w-full bg-[#111122] h-2 rounded-full overflow-hidden relative border border-[#2a2a50]/40">
                            <div
                              className="h-full bg-gradient-to-r from-teal-400 to-[#00d4ff] rounded-full"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                    {Object.keys(categoryOutflows).length === 0 && (
                      <div className="text-center font-mono py-4 text-slate-600 text-[10px] uppercase tracking-wider">
                        // Ledger sequence uninitiated. Awaiting transactional data.
                      </div>
                    )}
                  </div>
                </div>

                {/* Printer Friendly / copy notice */}
                <div className="text-[10px] text-slate-500 font-mono flex items-start gap-1 bg-[#111122] p-3 rounded-lg border border-[#2a2a50]/40">
                  <span>💡</span>
                  <p>
                    This statement maps your custom expense types & categories dynamically. Click the <strong>Copy Statement</strong> button below to copy the raw structured ledger context to your clipboard.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-[#111122] border-t border-[#2a2a50]/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-center">
                <button
                  onClick={() => window.print()}
                  className="bg-[#2a2a50] hover:bg-[#3a3a60] text-white font-mono font-bold text-[10px] uppercase px-4 py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Printer size={13} /> Print Statement
                </button>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={handleCopyStatementPrompt}
                    className="bg-[#00ff88] text-[#0d0d1a] font-mono font-black text-[10px] uppercase px-4 py-2.5 rounded-xl tracking-wider hover:opacity-90 transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Clipboard size={13} /> Copy Statement
                  </button>
                  <button
                    onClick={() => setShowStatementModal(false)}
                    className="bg-rose-600 hover:bg-rose-500 text-white font-mono font-bold text-[10px] uppercase px-4 py-2.5 rounded-xl transition cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      );
      })()}

      <CreateReminderModal
        isOpen={!!reminderModal}
        onClose={() => setReminderModal(null)}
        defaultTitle={reminderModal?.defaultTitle}
        defaultNotes={reminderModal?.defaultNotes}
        mode={reminderModal?.mode}
        onSave={(rem) => {
          onAddReminder(rem);
        }}
      />

      {editingTx && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[300] flex items-center justify-center p-4 animate-fadeIn font-sans">
          <div className="bg-[#0b0b16] border border-[#2a2a50] rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-[#2a2a50]/60 flex items-center justify-between bg-[#111122]">
              <div>
                <h4 className="text-sm font-black uppercase text-[#00ff88] tracking-widest font-mono flex items-center gap-2">
                  📝 EDIT TRANSACTION LOG
                </h4>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">// REWRITE RECORDED OR IMPORTED ENTRY</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingTx(null)}
                className="text-slate-400 hover:text-white font-black font-mono text-xs p-1"
              >
                [CANCEL &times;]
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 overflow-y-auto space-y-4 text-slate-200">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-400 font-mono mb-1.5">Date</label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full bg-[#0d0d1a] border border-[#2a2a50] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#00ff88] font-mono text-slate-200"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-400 font-mono mb-1.5">Amount ({curr})</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    className="w-full bg-[#0d0d1a] border border-[#2a2a50] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#00ff88] font-mono text-slate-200"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-400 font-mono mb-1.5">Concept / Description</label>
                <input
                  type="text"
                  value={editConcept}
                  onChange={(e) => setEditConcept(e.target.value)}
                  className="w-full bg-[#0d0d1a] border border-[#2a2a50] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#00ff88] text-slate-200 font-sans"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-400 font-mono mb-1.5">Type</label>
                  <select
                    value={editType}
                    onChange={(e) => setEditType(e.target.value)}
                    className="w-full bg-[#0d0d1a] border border-[#2a2a50] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#00ff88] font-mono text-slate-200 cursor-pointer"
                  >
                    <option value="debit">Debit (Expense)</option>
                    <option value="credit">Credit (Inflow)</option>
                    <option value="expense">Expense (Outflow)</option>
                    <option value="income">Income (Earnings)</option>
                    <option value="loan_repaid">Loan Repaid (Inflow)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-400 font-mono mb-1.5">Category</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full bg-[#0d0d1a] border border-[#2a2a50] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#00ff88] font-mono text-slate-200 cursor-pointer"
                  >
                    <option value="General">General</option>
                    <option value="Food">Food & Groceries</option>
                    <option value="Transport">Transport / Travel</option>
                    <option value="Housing">Housing & Rent</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Utilities">Utilities & Bills</option>
                    <option value="Health">Health & Wellness</option>
                    <option value="Education">Education</option>
                    <option value="Savings">Savings</option>
                    <option value="Investments">Investments</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-400 font-mono mb-1.5">Location</label>
                  <input
                    type="text"
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    className="w-full bg-[#0d0d1a] border border-[#2a2a50] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#00ff88]"
                    placeholder="Physical address, city or shop location"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-400 font-mono mb-1.5">Ref Link</label>
                  <input
                    type="text"
                    value={editLinks}
                    onChange={(e) => setEditLinks(e.target.value)}
                    className="w-full bg-[#0d0d1a] border border-[#2a2a50] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#00ff88]"
                    placeholder="URL, invoice link, receipt copy"
                  />
                </div>
              </div>

              {/* Split Options */}
              <div className="bg-[#111122]/50 p-4 rounded-xl border border-[#2a2a50]/60 space-y-3">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono block">// SPLIT SHARE SETTINGS (Optional)</span>
                
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-1">
                    <label className="block text-[8.5px] uppercase text-slate-500 font-mono mb-1">Split Method</label>
                    <select
                      value={editSplitType}
                      onChange={(e: any) => setEditSplitType(e.target.value)}
                      className="w-full bg-[#0d0d1a] border border-[#2a2a50] rounded-lg px-2 py-1.5 text-[11px] focus:outline-none focus:border-[#00ff88]"
                    >
                      <option value="none">None</option>
                      <option value="lent">I Lent</option>
                      <option value="borrowed">I Borrowed</option>
                      <option value="split-equally">Split Equally</option>
                    </select>
                  </div>
                  <div className="col-span-1">
                    <label className="block text-[8.5px] uppercase text-slate-500 font-mono mb-1">Split With</label>
                    <input
                      type="text"
                      value={editSplitWith}
                      onChange={(e) => setEditSplitWith(e.target.value)}
                      disabled={editSplitType === 'none'}
                      className="w-full bg-[#0d0d1a] border border-[#2a2a50] rounded-lg px-2 py-1.5 text-[11px] focus:outline-none focus:border-[#00ff88] disabled:opacity-40"
                      placeholder="Name"
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-[8.5px] uppercase text-slate-500 font-mono mb-1">My Share / Amt</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editSplitAmount}
                      onChange={(e) => setEditSplitAmount(e.target.value)}
                      disabled={editSplitType === 'none'}
                      className="w-full bg-[#0d0d1a] border border-[#2a2a50] rounded-lg px-2 py-1.5 text-[11px] focus:outline-none focus:border-[#00ff88] disabled:opacity-40"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-400 font-mono mb-1.5">Extended Notes</label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full h-16 bg-[#0d0d1a] border border-[#2a2a50] rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-[#00ff88] resize-none"
                  placeholder="Additional context, remarks, details of items purchased..."
                />
              </div>

              <div className="pt-4 border-t border-[#2a2a50]/60 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingTx(null)}
                  className="bg-[#1e1e38] text-slate-300 font-mono font-bold text-[10px] uppercase px-4 py-2.5 rounded-xl hover:bg-[#2a2a50] transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#00ff88] text-black font-mono font-black text-[10px] uppercase px-5 py-2.5 rounded-xl tracking-wider hover:opacity-95 transition cursor-pointer"
                >
                  ✓ Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showFormatModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[300] flex items-center justify-center p-4">
          <div className="bg-[#111120] border border-[#2a2a50] w-full max-w-lg rounded-2xl p-6 shadow-[0_0_50px_rgba(0,0,0,0.8)] relative flex flex-col max-h-[90vh]">
            <button 
              onClick={() => setShowFormatModal(false)} 
              className="absolute top-4 right-4 text-slate-500 hover:text-white transition w-8 h-8 rounded-full bg-[#1e1e38]/50 flex items-center justify-center font-bold"
            >
              ✕
            </button>
            
            <div className="mb-4">
              <span className="text-[10px] text-rose-500 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded font-mono uppercase tracking-widest font-bold">
                Unsupported format detected
              </span>
              <h3 className="text-white font-black uppercase tracking-widest text-[#00d4ff] text-base mt-2">
                Let's convert that PDF to CSV!
              </h3>
            </div>

            <div className="overflow-y-auto pr-1 space-y-4 text-xs font-sans text-slate-300">
              <p className="leading-relaxed">
                Our secure parser processes all uploaded records <strong>100% locally and privately</strong> inside your browser. Because PDF structures are highly irregular, we restrict file uploads to standard <strong>CSV</strong> and <strong>Excel (.xlsx, .xls)</strong> formats to guarantee exact balance and math calculations.
              </p>

              <div className="border border-yellow-500/20 rounded-xl p-3 bg-yellow-500/5 text-slate-300">
                <h4 className="font-bold text-yellow-400 text-[11px] uppercase mb-1 flex items-center gap-1">
                  💡 TWO-SECOND PDF CONVERSION SOLUTIONS:
                </h4>
                <ul className="text-[10px] list-disc pl-4 space-y-1 text-slate-400">
                  <li>Use a free converter like <a href="https://www.adobe.com/acrobat/online/pdf-to-excel.html" target="_blank" rel="noreferrer" className="text-[#00d4ff] underline">Adobe Acrobat Online</a>, <a href="https://smallpdf.com/pdf-to-excel" target="_blank" rel="noreferrer" className="text-[#00d4ff] underline">Smallpdf</a>, or <a href="https://www.ilovepdf.com/pdf_to_excel" target="_blank" rel="noreferrer" className="text-[#00d4ff] underline">iLovePDF</a>.</li>
                  <li>Simply open your exported PDF file, select all content, copy it, and paste it into our <strong>Smart Text Paste</strong> tab! Our engine parses pasted text lines flawlessly!</li>
                </ul>
              </div>

              <div className="space-y-3.5 mt-2">
                <div className="border border-[#2a2a50]/60 rounded-xl p-3 bg-[#0d0d1a]">
                  <h4 className="font-bold text-[#00ff88] text-[10px] uppercase mb-1.5">How to get a CSV from Google Pay / PhonePe</h4>
                  <p className="text-[10px] text-slate-400">
                    Open your payment app history, select download statement or request receipt summary, and select <strong>CSV</strong> or <strong>Excel Spreadsheet</strong> format instead of PDF.
                  </p>
                </div>
                
                <div className="border border-[#2a2a50]/60 rounded-xl p-3 bg-[#0d0d1a]">
                  <h4 className="font-bold text-[#00ff88] text-[10px] uppercase mb-1.5">Standard Netbanking Statements (e.g., Chase, HDFC, SBI)</h4>
                  <p className="text-[10px] text-slate-400">
                    Log in to your website netbanking portal, navigate to Account Statement, select your dates, and download as <strong>Excel/Spreadsheet (CSV/XLS/XLSX)</strong> format.
                  </p>
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => setShowFormatModal(false)} 
              className="w-full mt-5 bg-[#2a2a50] hover:bg-[#323260] text-white py-2.5 rounded-xl font-bold uppercase tracking-widest text-[10px] transition font-mono"
            >
              GOT IT, LET'S DO THAT
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
