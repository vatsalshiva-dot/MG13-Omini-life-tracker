import React, { useState } from 'react';
import { AppState, ExpeditionExpense } from '../types';
import { Plus, Trash2, Bell, CheckSquare, Square } from 'lucide-react';

export const FinancesView: React.FC<{ state: AppState; saveData: any; setAppState: any }> = ({ state, saveData, setAppState }) => {
  const [concept, setConcept] = useState('');
  const [amount, setAmount] = useState('');
  const [txType, setTxType] = useState<'expense' | 'income'>('expense');
  const [splitWith, setSplitWith] = useState('');
  const [links, setLinks] = useState('');
  
  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!concept || !amount) return;
    const expense: ExpeditionExpense = {
      id: 'tx_' + Date.now(),
      date: new Date().toISOString().split('T')[0],
      concept,
      amount: parseFloat(amount),
      currency: 'USD',
      category: 'General',
      type: txType,
      splitWith: splitWith.trim(),
      links: links.trim()
    };
    
    setAppState((prev: AppState) => {
      const next = { ...prev, finances: [...(prev.finances || []), expense] };
      saveData(next);
      return next;
    });
    setConcept('');
    setAmount('');
    setSplitWith('');
    setLinks('');
  };

  const handleRemove = (id: string) => {
    setAppState((prev: AppState) => {
      const next = { ...prev, finances: (prev.finances || []).filter(e => e.id !== id) };
      saveData(next);
      return next;
    });
  };

  const updateBudget = (field: 'd'|'w'|'m'|'y', val: string) => {
    setAppState((prev: AppState) => {
      const currentBudgets = prev.financeBudgets || { d: 0, w: 0, m: 0, y: 0 };
      const next = { ...prev, financeBudgets: { ...currentBudgets, [field]: parseFloat(val) || 0 } };
      saveData(next);
      return next;
    });
  };

  const handleSetReminder = (e: ExpeditionExpense) => {
    setAppState((prev: AppState) => {
      const title = `Finance: ${e.concept} ($${e.amount})`;
      const newRem = {
        id: crypto.randomUUID(),
        title,
        dueDate: new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0], // default 1 mo from now
        time: '',
        type: 'finance',
        priority: 'medium',
        repeat: 'none',
        notes: `Recurring for amount: $${e.amount} - ${e.type}`,
        status: 'pending',
        enableAlert: true
      };
      const next = {
        ...prev,
        reminders: [...(prev.reminders || []), newRem as any]
      };
      saveData(next);
      return next;
    });
    alert(`Alert & Reminder for ${e.concept} set for next month! View in Reminders.`);
  };

  const income = (state.finances || []).filter(e => e.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
  const expenses = (state.finances || []).filter(e => !e.type || e.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
  const balance = income - expenses;

  // Advanced Budget Metrics calculation
  const getExpensesAverages = () => {
    if (!state.finances?.length) return { d: 0, w: 0, m: 0, by: 0, y: 0 };
    const expOnly = state.finances.filter(e => !e.type || e.type === 'expense');
    if (!expOnly.length) return { d: 0, w: 0, m: 0, by: 0, y: 0 };
    
    // Find absolute timespan in days
    const dates = expOnly.map(e => new Date(e.date).getTime());
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

  const avgs = getExpensesAverages();

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      <div className="border-b border-[#111120] pb-5">
        <h2 className="text-3xl font-extrabold tracking-tight text-white font-display">
          Financial <span className="text-[#00d4ff]">Ledger</span>
        </h2>
        <p className="text-xs uppercase tracking-widest text-[#a1a1aa] mt-1 font-mono">
          // EXPENSES, INCOME & BUDGET
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#111120] border border-[#2a2a50] p-5 rounded-2xl">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest font-mono">NET BALANCE</p>
          <p className={`text-3xl font-black mt-2 font-display ${balance >= 0 ? 'text-[#00ff88]' : 'text-rose-500'}`}>${balance.toFixed(2)}</p>
        </div>
        <div className="bg-[#111120] border border-[#2a2a50] p-5 rounded-2xl">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest font-mono">TOTAL INCOME</p>
          <p className="text-xl font-black text-slate-200 mt-2 font-display">${income.toFixed(2)}</p>
        </div>
        <div className="bg-[#111120] border border-[#2a2a50] p-5 rounded-2xl">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest font-mono">TOTAL EXPENSES</p>
          <p className="text-xl font-black text-slate-200 mt-2 font-display">${expenses.toFixed(2)}</p>
        </div>
      </div>

      <div className="bg-[#0d0d1a] border border-[#1e1e38] rounded-xl p-4 flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-[#2a2a50] pb-2">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00d4ff] shadow-[0_0_8px_#00d4ff]"></span>
            <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase font-mono">Run Rate vs Budget Target</p>
          </div>
          <p className="text-[9px] text-slate-500 font-mono tracking-wider">// Customizable Goals</p>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Daily', key: 'd', avg: avgs.d, bgt: state.financeBudgets?.d || 0 },
            { label: 'Weekly', key: 'w', avg: avgs.w, bgt: state.financeBudgets?.w || 0 },
            { label: 'Monthly', key: 'm', avg: avgs.m, bgt: state.financeBudgets?.m || 0 },
            { label: 'Annually', key: 'y', avg: avgs.y, bgt: state.financeBudgets?.y || 0 },
          ].map((item) => {
            const isOver = item.bgt > 0 && item.avg > item.bgt;
            const pct = item.bgt > 0 ? Math.min(100, Math.round((item.avg / item.bgt) * 100)) : 0;
            return (
              <div key={item.key} className="bg-[#111120] border border-[#2a2a50] p-3 rounded-xl flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <p className="text-[9px] text-slate-500 font-mono tracking-widest uppercase">{item.label}</p>
                  <p className={`text-[10px] font-black font-display tracking-wider ${isOver ? 'text-rose-500 animate-pulse' : 'text-[#00ff88]'}`}>
                    {item.bgt > 0 ? `${pct}%` : '---'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold font-mono text-slate-200">${item.avg.toFixed(1)} <span className="text-[9px] text-slate-500 font-sans">Avg</span></p>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-[9px] text-slate-500">TGT $</span>
                    <input 
                      type="number"
                      value={item.bgt || ''}
                      onChange={(e) => updateBudget(item.key as any, e.target.value)}
                      placeholder="0"
                      className="bg-[#0d0d1a] border border-[#1e1e38] text-[9px] font-mono text-slate-300 w-14 px-1 py-0.5 rounded focus:outline-none focus:border-[#00d4ff]"
                    />
                  </div>
                </div>
                {item.bgt > 0 && (
                  <div className="h-1 bg-[#0d0d1a] w-full rounded-full overflow-hidden mt-1">
                    <div className={`h-full ${isOver ? 'bg-rose-500' : 'bg-[#00ff88]'}`} style={{ width: `${pct}%` }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleAdd} className="flex flex-col gap-2 border border-[#2a2a50] bg-[#111120] p-4 rounded-2xl">
        <div className="flex flex-wrap gap-2">
          <select
            value={txType}
            onChange={(e) => setTxType(e.target.value as 'income' | 'expense')}
            className="bg-[#0d0d1a] border border-[#2a2a50] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#00d4ff] font-bold"
          >
            <option value="expense">EXPENSE</option>
            <option value="income">INCOME</option>
          </select>
          <input 
            type="text" 
            value={concept}
            onChange={e => setConcept(e.target.value)}
            placeholder="Concept..."
            className="flex-1 bg-[#0d0d1a] border border-[#2a2a50] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#00d4ff] min-w-[200px]"
          />
          <input 
            type="number" 
            step="0.01"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="Amount $"
            className="w-28 bg-[#0d0d1a] border border-[#2a2a50] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#00d4ff]"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <input 
            type="text" 
            value={splitWith}
            onChange={e => setSplitWith(e.target.value)}
            placeholder="Split with (optional names)..."
            className="flex-1 bg-[#0d0d1a] border border-[#2a2a50] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#00d4ff] min-w-[200px]"
          />
          <input 
            type="text" 
            value={links}
            onChange={e => setLinks(e.target.value)}
            placeholder="Link (optional receipt, doc...)"
            className="flex-1 bg-[#0d0d1a] border border-[#2a2a50] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#00d4ff] min-w-[200px]"
          />
          <button type="submit" className="bg-[#00d4ff] text-black font-extrabold px-6 rounded-xl hover:bg-[#00d4ff]/80 transition text-xs tracking-wider uppercase font-mono shadow-md whitespace-nowrap">
            ADD
          </button>
        </div>
      </form>

      <div className="bg-[#0d0d1a]/50 p-4 rounded-2xl border border-[#1e1e38] min-h-[300px] flex flex-col gap-2">
        {(state.finances || []).slice().reverse().map(e => (
          <div key={e.id} className="flex flex-col gap-2 p-3 bg-[#111120] rounded-xl border border-[#1e1e38]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${e.type === 'income' ? 'bg-[#00ff88]/10 text-[#00ff88]' : 'bg-rose-500/10 text-rose-400'}`}>
                  {e.type === 'income' ? '+' : '-'}
                </span>
                <div>
                  <p className="text-xs font-bold text-slate-200">{e.concept}</p>
                  <p className="text-[9px] text-slate-500 font-mono mt-1">{e.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className={`text-sm font-black ${e.type === 'income' ? 'text-[#00ff88]' : 'text-slate-200'}`}>
                  ${e.amount.toFixed(2)}
                </span>
                <button onClick={() => handleSetReminder(e)} className="text-slate-600 hover:text-[#00d4ff] transition" title="Set a monthly reminder for this">
                  <Bell size={14} />
                </button>
                <button onClick={() => handleRemove(e.id)} className="text-slate-600 hover:text-rose-500 transition" title="Delete">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            {(e.splitWith || e.links || (e.tasks && e.tasks.length > 0)) && (
              <div className="flex flex-col gap-2 pl-11 pt-1 border-t border-[#1e1e38]/50 mt-1">
                <div className="flex flex-wrap gap-3">
                  {e.splitWith && (
                    <span className="text-[10px] text-slate-400 bg-[#0d0d1a] px-2 py-0.5 rounded border border-[#2a2a50]">Split w/ {e.splitWith}</span>
                  )}
                  {e.links && (
                    <a href={e.links.startsWith('http') ? e.links : `https://${e.links}`} target="_blank" rel="noreferrer" className="text-[10px] text-[#00d4ff] hover:underline bg-[#00d4ff]/10 px-2 py-0.5 rounded border border-[#00d4ff]/20 truncate max-w-[200px]">Link</a>
                  )}
                </div>

                <div className="space-y-1">
                  {(e.tasks || []).map(task => (
                    <div key={task.id} className="flex items-center justify-between group p-1.5 hover:bg-[#0d0d1a] rounded-lg transition">
                      <div className="flex items-center gap-2 cursor-pointer select-none flex-1" onClick={() => {
                        setAppState((prev: AppState) => {
                          const next = { ...prev, finances: prev.finances.map(f => f.id === e.id ? { ...f, tasks: (f.tasks || []).map(t => t.id === task.id ? { ...t, done: !t.done } : t) } : f) };
                          saveData(next);
                          return next;
                        });
                      }}>
                        {task.done ? <CheckSquare size={14} className="text-[#00ff88] shrink-0" /> : <Square size={14} className="text-slate-600 shrink-0" />}
                        <span className={`text-[11px] font-medium transition ${task.done ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                          {task.name}
                        </span>
                      </div>
                      <button onClick={() => {
                        setAppState((prev: AppState) => {
                          const next = { ...prev, finances: prev.finances.map(f => f.id === e.id ? { ...f, tasks: (f.tasks || []).filter(t => t.id !== task.id) } : f) };
                          saveData(next);
                          return next;
                        });
                      }} className="text-slate-600 hover:text-rose-500 transition opacity-0 group-hover:opacity-100 px-2">
                        &times;
                      </button>
                    </div>
                  ))}
                  <input 
                    type="text" 
                    placeholder="+ Add step/goal task..."
                    onKeyDown={(evt) => {
                      if (evt.key === 'Enter') {
                        const el = evt.target as HTMLInputElement;
                        if (!el.value) return;
                        setAppState((prev: AppState) => {
                          const next = { ...prev, finances: prev.finances.map(f => f.id === e.id ? { ...f, tasks: [...(f.tasks || []), { id: 'tk_' + Date.now(), name: el.value, done: false }] } : f) };
                          saveData(next);
                          return next;
                        });
                        el.value = '';
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
                      if (evt.key === 'Enter') {
                        const el = evt.target as HTMLInputElement;
                        if (!el.value) return;
                        setAppState((prev: AppState) => {
                          const next = { ...prev, finances: prev.finances.map(f => f.id === e.id ? { ...f, tasks: [...(f.tasks || []), { id: 'tk_' + Date.now(), name: el.value, done: false }] } : f) };
                          saveData(next);
                          return next;
                        });
                        el.value = '';
                      }
                    }}
                    className="w-full bg-transparent border-none text-[10px] text-slate-500 focus:outline-none placeholder-slate-700 py-0.5 px-1.5"
                  />
                </div>
            )}
          </div>
        ))}
        {!(state.finances?.length) && (
          <div className="flex-1 flex items-center justify-center text-slate-600 text-[10px] tracking-widest font-mono uppercase">
            // No expenses logged
          </div>
        )}
      </div>
    </div>
  );
};
