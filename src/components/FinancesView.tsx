import React, { useState } from "react";
import { AppState, ExpeditionExpense, Reminder } from "../types";
import { Plus, Trash2, Bell, AlertTriangle, CheckSquare, Square } from "lucide-react";
import { CreateReminderModal } from "./CreateReminderModal";

export const FinancesView: React.FC<{
  state: AppState;
  saveData: any;
  setAppState: any;
  onAddReminder: (rem: Omit<Reminder, "id" | "status">) => void;
}> = ({ state, saveData, setAppState, onAddReminder }) => {
  const [concept, setConcept] = useState("");
  const [amount, setAmount] = useState("");
  const [txType, setTxType] = useState<"expense" | "income">("expense");
  const [splitWith, setSplitWith] = useState("");
  const [links, setLinks] = useState("");

  const [reminderModal, setReminderModal] = useState<{
    isOpen: boolean;
    defaultTitle: string;
    defaultNotes: string;
    mode: "reminder" | "alert";
  } | null>(null);

  // Custom financial goals states
  const [goalTitle, setGoalTitle] = useState("");
  const [goalTarget, setGoalTarget] = useState("");
  const [goalCurrent, setGoalCurrent] = useState("");
  const [goalDeadline, setGoalDeadline] = useState("");
  const [goalCategory, setGoalCategory] = useState("Savings");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!concept || !amount) return;
    const expense: ExpeditionExpense = {
      id: "tx_" + Date.now(),
      date: new Date().toISOString().split("T")[0],
      concept,
      amount: parseFloat(amount),
      currency: "USD",
      category: "General",
      type: txType,
      splitWith: splitWith.trim(),
      links: links.trim(),
    };

    setAppState((prev: AppState) => {
      const next = { ...prev, finances: [...(prev.finances || []), expense] };
      saveData(next);
      return next;
    });
    setConcept("");
    setAmount("");
    setSplitWith("");
    setLinks("");
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
    const newGoal = {
      id: "goal_" + Date.now(),
      title: goalTitle,
      targetAmount: parseFloat(goalTarget) || 0,
      currentAmount: parseFloat(goalCurrent) || 0,
      deadlineDate: goalDeadline || new Date().toISOString().split("T")[0],
      category: goalCategory,
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

  const handleSetReminder = (e: ExpeditionExpense, mode: "reminder" | "alert") => {
    setReminderModal({
      isOpen: true,
      defaultTitle: `Finance: ${e.concept} ($${e.amount})`,
      defaultNotes: `Recurring/Follow-up for amount: $${e.amount} - ${e.type}`,
      mode,
    });
  };

  const income = (state.finances || [])
    .filter((e) => e.type === "income")
    .reduce((acc, curr) => acc + curr.amount, 0);
  const expenses = (state.finances || [])
    .filter((e) => !e.type || e.type === "expense")
    .reduce((acc, curr) => acc + curr.amount, 0);
  const balance = income - expenses;

  // Advanced Budget Metrics calculation
  const getExpensesAverages = () => {
    if (!state.finances?.length) return { d: 0, w: 0, m: 0, by: 0, y: 0 };
    const expOnly = state.finances.filter(
      (e) => !e.type || e.type === "expense",
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
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest font-mono">
            NET BALANCE
          </p>
          <p
            className={`text-3xl font-black mt-2 font-display ${balance >= 0 ? "text-[#00ff88]" : "text-rose-500"}`}
          >
            ${balance.toFixed(2)}
          </p>
        </div>
        <div className="bg-[#111120] border border-[#2a2a50] p-5 rounded-2xl">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest font-mono">
            TOTAL INCOME
          </p>
          <p className="text-xl font-black text-slate-200 mt-2 font-display">
            ${income.toFixed(2)}
          </p>
        </div>
        <div className="bg-[#111120] border border-[#2a2a50] p-5 rounded-2xl">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest font-mono">
            TOTAL EXPENSES
          </p>
          <p className="text-xl font-black text-slate-200 mt-2 font-display">
            ${expenses.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="bg-[#0d0d1a] border border-[#1e1e38] rounded-xl p-4 flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-[#2a2a50] pb-2">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00d4ff] shadow-[0_0_8px_#00d4ff]"></span>
            <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase font-mono">
              Run Rate vs Budget Target
            </p>
          </div>
          <p className="text-[9px] text-slate-500 font-mono tracking-wider">
            // Customizable Goals
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
                    <span className="text-[9px] text-slate-500">TGT $</span>
                    <input
                      type="number"
                      value={item.bgt || ""}
                      onChange={(e) =>
                        updateBudget(item.key as any, e.target.value)
                      }
                      placeholder="0"
                      className="bg-[#0d0d1a] border border-[#1e1e38] text-[9px] font-mono text-slate-300 w-14 px-1 py-0.5 rounded focus:outline-none focus:border-[#00d4ff]"
                    />
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

      <form
        onSubmit={handleAdd}
        className="flex flex-col gap-2 border border-[#2a2a50] bg-[#111120] p-4 rounded-2xl"
      >
        <div className="flex flex-wrap gap-2">
          <select
            value={txType}
            onChange={(e) => setTxType(e.target.value as "income" | "expense")}
            className="bg-[#0d0d1a] border border-[#2a2a50] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#00d4ff] font-bold"
          >
            <option value="expense">EXPENSE</option>
            <option value="income">INCOME</option>
          </select>
          <input
            type="text"
            value={concept}
            onChange={(e) => setConcept(e.target.value)}
            placeholder="Concept..."
            className="flex-1 bg-[#0d0d1a] border border-[#2a2a50] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#00d4ff] min-w-[200px]"
          />
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount $"
            className="w-28 bg-[#0d0d1a] border border-[#2a2a50] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#00d4ff]"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            value={splitWith}
            onChange={(e) => setSplitWith(e.target.value)}
            placeholder="Split with (optional names)..."
            className="flex-1 bg-[#0d0d1a] border border-[#2a2a50] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#00d4ff] min-w-[200px]"
          />
          <input
            type="text"
            value={links}
            onChange={(e) => setLinks(e.target.value)}
            placeholder="Link (optional receipt, doc...)"
            className="flex-1 bg-[#0d0d1a] border border-[#2a2a50] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#00d4ff] min-w-[200px]"
          />
          <button
            type="submit"
            className="bg-[#00d4ff] text-black font-extrabold px-6 rounded-xl hover:bg-[#00d4ff]/80 transition text-xs tracking-wider uppercase font-mono shadow-md whitespace-nowrap"
          >
            ADD
          </button>
        </div>
      </form>

      <div className="bg-[#0d0d1a]/50 p-4 rounded-2xl border border-[#1e1e38] min-h-[300px] flex flex-col gap-2">
        {(state.finances || [])
          .slice()
          .reverse()
          .map((e) => (
            <div
              key={e.id}
              className="flex flex-col gap-2 p-3 bg-[#111120] rounded-xl border border-[#1e1e38]"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span
                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${e.type === "income" ? "bg-[#00ff88]/10 text-[#00ff88]" : "bg-rose-500/10 text-rose-400"}`}
                  >
                    {e.type === "income" ? "+" : "-"}
                  </span>
                  <div>
                    <p className="text-xs font-bold text-slate-200">
                      {e.concept}
                    </p>
                    <p className="text-[9px] text-slate-500 font-mono mt-1">
                      {e.date}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span
                    className={`text-sm font-black ${e.type === "income" ? "text-[#00ff88]" : "text-slate-200"}`}
                  >
                    ${e.amount.toFixed(2)}
                  </span>
                  <button
                    onClick={() => handleSetReminder(e, "reminder")}
                    className="text-slate-600 hover:text-[#00d4ff] transition"
                    title="Set scheduled calendar reminder"
                  >
                    <Bell size={14} />
                  </button>
                  <button
                    onClick={() => handleSetReminder(e, "alert")}
                    className="text-slate-600 hover:text-rose-500 transition"
                    title="Set high-priority system alert"
                  >
                    <AlertTriangle size={14} />
                  </button>
                  <button
                    onClick={() => handleRemove(e.id)}
                    className="text-slate-600 hover:text-rose-500 transition"
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
                        Split w/ {e.splitWith}
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
          ))}
        {!state.finances?.length && (
          <div className="flex-1 flex items-center justify-center text-slate-600 text-[10px] tracking-widest font-mono uppercase py-8">
            // No expenses logged
          </div>
        )}
      </div>

      {/* 🎯 SYSTEMATIC FINANCIAL GOALS & SUB-TASKS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
        {/* Goals List & Tracker */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-[#2a2a50] pb-2">
            <span className="flex items-center gap-2 text-[#00d4ff]">
              <span className="w-2 h-2 rounded-full bg-[#00d4ff] shadow-[0_0_8px_#00d4ff]" />
              <h3 className="font-extrabold uppercase tracking-widest text-[#0099ff] text-xs font-mono">
                Systematic Financial Goals ({ (state.financeGoals || []).length })
              </h3>
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
                  <div className="flex items-center gap-3 pt-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                      Adjust:
                    </span>
                    <div className="flex rounded-lg border border-[#2a2a50] bg-[#0d0d1a] overflow-hidden">
                      <button 
                        onClick={() => handleUpdateGoalCurrent(goal.id, goal.currentAmount - 10)}
                        className="px-2 py-1 text-[10px] font-mono text-rose-500 hover:bg-rose-500/10 border-r border-[#2a2a50]"
                      >
                        -$10
                      </button>
                      <button 
                        onClick={() => handleUpdateGoalCurrent(goal.id, goal.currentAmount - 100)}
                        className="px-2 py-1 text-[10px] font-mono text-rose-400 hover:bg-rose-500/10 border-r border-[#2a2a50]"
                      >
                        -$100
                      </button>
                      <button 
                        onClick={() => handleUpdateGoalCurrent(goal.id, goal.currentAmount + 10)}
                        className="px-2 py-1 text-[10px] font-mono text-emerald-400 hover:bg-emerald-500/10 border-r border-[#2a2a50]"
                      >
                        +$10
                      </button>
                      <button 
                        onClick={() => handleUpdateGoalCurrent(goal.id, goal.currentAmount + 100)}
                        className="px-2 py-1 text-[10px] font-mono text-[#00ff88] hover:bg-[#00ff88]/10"
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
                // No systematic financial goals configured
              </div>
            )}
          </div>
        </div>

        {/* Create Financial Goals Form */}
        <div className="bg-[#111120] border border-[#2a2a50] p-4 rounded-xl h-fit space-y-4">
          <div className="border-b border-[#2a2a50]/60 pb-2">
            <h4 className="text-[10px] font-black uppercase text-white tracking-widest">
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
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-[#00d4ff] text-black font-extrabold py-2 rounded-xl text-xs uppercase tracking-widest font-mono hover:bg-[#00b8e6] transition"
            >
              🚀 CREATE GOAL
            </button>
          </form>
        </div>
      </div>

      {/* 🔔 FINANCE ALERTS & CALENDAR SCHEDULES */}
      <div className="border border-[#2a2a50] bg-[#111120] p-5 rounded-2xl space-y-4 pt-4 mt-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-[#2a2a50] pb-2">
          <div>
            <h3 className="font-extrabold uppercase tracking-widest text-[#00d4ff] text-xs font-mono">
              🔔 Finance Calendar Reminders & Live Alerts
            </h3>
            <p className="text-[9px] text-slate-500 font-mono uppercase mt-0.5">
              // Setup custom budgets reminder alerts linked instantly with tracker overlays.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setReminderModal({
                  isOpen: true,
                  defaultTitle: "Finance Goal Goalpost Checklist",
                  defaultNotes: "Check monthly transactions and goals update.",
                  mode: "reminder"
                });
              }}
              className="px-3 py-1.5 bg-[#00d4ff]/10 hover:bg-[#00d4ff]/20 border border-[#00d4ff]/30 text-[#00d4ff] font-extrabold tracking-wider text-[10px] uppercase rounded-lg transition"
            >
              + Create Reminder
            </button>
            <button
              onClick={() => {
                setReminderModal({
                  isOpen: true,
                  defaultTitle: "CRITICAL: Finance Budget Warning",
                  defaultNotes: "Budget limits threshold approaching warning alert.",
                  mode: "alert"
                });
              }}
              className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 font-extrabold tracking-wider text-[10px] uppercase rounded-lg transition"
            >
              🚨 Create System Alert
            </button>
          </div>
        </div>

        {/* Existing Finance Calendar Reminders list */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          {(() => {
            const list = (state.reminders || []).filter(
              (r) => r.type === "finance" || r.type === "alert" || r.title.toLowerCase().includes("finance") || r.title.toLowerCase().includes("budget")
            );
            if (!list.length) {
              return (
                <div className="md:col-span-2 bg-[#0d0d1a] border border-dashed border-[#1e1e38] p-4 text-center text-[10px] text-slate-600 uppercase font-mono tracking-wider rounded-xl">
                  // No active general alarm alerts or reminders set for finances.
                </div>
              );
            }
            return list.map((rem) => (
              <div key={rem.id} className="bg-[#0d0d1a] border border-[#2a2a50] rounded-xl p-3 flex justify-between items-center text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`w-1.5 h-1.5 rounded-full ${rem.type === "alert" || rem.title.startsWith("[ALERT]") ? "bg-rose-500" : "bg-[#00d4ff]"}`} />
                    <span className="font-extrabold text-slate-100">{rem.title}</span>
                    <span className={`text-[8px] font-black uppercase px-1 rounded ${rem.priority === "high" ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" : "bg-slate-800 text-slate-400"}`}>
                      {rem.priority}
                    </span>
                  </div>
                  <p className="text-[9px] text-slate-500 font-mono">
                    Time: {rem.dueDate} {rem.time ? `at ${rem.time}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
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
                    className={`px-2 py-0.5 text-[9px] font-black uppercase rounded ${rem.status === "done" ? "bg-green-500/10 text-green-400" : "bg-zinc-800 text-zinc-400 hover:text-white"}`}
                  >
                    {rem.status === "done" ? "Done ✓" : "Pending"}
                  </button>
                  <button
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
                    className="text-slate-600 hover:text-rose-500 text-[11px] font-bold"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ));
          })()}
        </div>
      </div>

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
    </div>
  );
};
