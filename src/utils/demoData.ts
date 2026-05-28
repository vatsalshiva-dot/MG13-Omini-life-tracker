import { AppState, DailyState } from "../types";
import { defData } from "./storage";

function createDemoData(): AppState {
  const state: AppState = defData();

  state.profile = {
    name: "Dr. Demo Explorer",
    tagline: "Director of Product & Research",
    email: "hello@example.com",
    dailyBudgetLimit: 120,
    dailyIncomeTarget: 800,
  };

  state.items = {
    studies: [
      "Advanced NLP Algorithms",
      "Large Language Models Architecture",
      "System Design for Scale",
      "Neuroscience & Flow States",
    ],
    habits: [
      "Morning Run (5k)",
      "Vipassana Meditation",
      "Weight Lifting (Push/Pull)",
      "Read Research Papers",
      "Drink 4L Water",
      "Evening Gratitude Journal"
    ],
    leisure: ["Guitar Practice", "Indie Game Dev", "Cinematography"],
    custom: ["Strategic Planning", "Client Proposals", "Code Review (PRs)", "Server Maintenance"],
  };

  state.repsTarget = {
    studies: {
      "Advanced NLP Algorithms": 1,
      "System Design for Scale": 1,
      "Neuroscience & Flow States": 1,
    },
    habits: {
      "Morning Run (5k)": 1,
      "Vipassana Meditation": 2,
      "Read Research Papers": 1,
      "Drink 4L Water": 4,
      "Evening Gratitude Journal": 1
    },
    custom: { "Client Proposals": 2, "Code Review (PRs)": 3, "Strategic Planning": 1 },
  };

  state.hoursTarget = {
    studies: { "Advanced NLP Algorithms": 2.5, "System Design for Scale": 1.5, "Large Language Models Architecture": 2.0 },
    habits: { "Read Research Papers": 1.5, "Weight Lifting (Push/Pull)": 1.5 },
    custom: { "Client Proposals": 3.0, "Code Review (PRs)": 2.0, "Strategic Planning": 1.0 },
  };

  state.reminders = [
    {
      id: "1",
      title: "Submit Autonomous Agent Research Doc",
      dueDate: "2026-06-01",
      time: "12:00",
      type: "deadline",
      priority: "high",
      repeat: "none",
      notes: "Ensure sections on parallel agent execution are complete.",
      status: "pending",
    },
    {
      id: "2",
      title: "Weekly sync with Engineering Leadership",
      dueDate: "2026-05-24",
      time: "10:30",
      type: "routine",
      priority: "medium",
      repeat: "weekly",
      notes: "Discuss Q3 OKRs and hiring pipeline.",
      status: "pending",
    },
    {
      id: "3",
      title: "Expedition Starts: Alps Retreat",
      dueDate: "2026-06-15",
      time: "08:00",
      type: "Trip Deadline",
      priority: "high",
      repeat: "none",
      notes: "Flight leaves from Terminal 2",
      status: "pending",
    },
    {
      id: "4",
      title: "Auto-Log: Cloud GPU Subscription ($450)",
      dueDate: "2026-06-23",
      time: "09:00",
      type: "finance",
      priority: "high",
      repeat: "monthly",
      notes: "Recurring for amount: 450 - expense",
      status: "pending",
    },
  ];

  state.pomoSessions = [
    {
      id: "p1",
      date: "2026-05-24",
      duration: 25,
      task: "Deep Learning",
      cat: "studies",
      type: "work",
      time: "10:00",
      status: "completed",
    },
    {
      id: "p2",
      date: "2026-05-24",
      duration: 25,
      task: "System Design",
      cat: "studies",
      type: "work",
      time: "11:00",
      status: "completed",
    },
  ];

  state.finances = [];
  state.expeditions = [
    {
      id: "exp_1",
      title: "Mountain Hike 2026",
      dateStart: "2026-06-15",
      dateEnd: "2026-06-20",
      location: "Mt. Rainier National Park",
      notes: "Need to prepare high alt gear.",
      packList: [
        { id: "p1", name: "Tent", packed: false, qty: 1 },
        { id: "p2", name: "Boots", packed: true, qty: 1 },
        { id: "p3", name: "Water Filter", packed: false, qty: 1 }
      ],
      customTasks: [
        { id: "t1", name: "Book Campsite", done: true },
        { id: "t2", name: "Buy trail mix", done: false }
      ]
    }
  ];

  // Generate 2 years of VERY exhaustive historical daily data
  const dateObj = new Date();
  for (let i = 730; i >= 0; i--) {
    const d = new Date(dateObj);
    d.setDate(d.getDate() - i);
    const yr = d.getFullYear();
    const mt = String(d.getMonth() + 1).padStart(2, "0");
    const dy = String(d.getDate()).padStart(2, "0");
    const dateStr = `${yr}-${mt}-${dy}`;

    const isWeekend = d.getDay() === 0 || d.getDay() === 6;

    state.daily[dateStr] = {};

    // Studies
    if (Math.random() > 0.15) {
      state.daily[dateStr].studies = {
        "Deep Learning": {
          status: "done",
          reps: Math.floor(Math.random() * 2) + 1,
          hours: Math.floor(Math.random() * 3) + 1,
          satisfaction: Math.floor(Math.random() * 2) + 4,
          notes: "Paper review.",
        },
        "System Design": {
          status: "done",
          reps: 1,
          hours: 1.5,
          satisfaction: 4,
          notes: "",
        },
      };
    }

    // Custom (only on weekdays)
    if (!isWeekend && Math.random() > 0.1) {
      state.daily[dateStr].custom = {
        "Client Proposals": {
          status: "done",
          reps: 1,
          hours: 3.5,
          satisfaction: 4,
          notes: "",
        },
        "Code Review": {
          status: "done",
          reps: 3,
          hours: 2,
          satisfaction: 5,
          notes: "",
        },
        "Server Maintenance": {
          status: "done",
          reps: 1,
          hours: 0.5,
          satisfaction: 3,
          notes: "",
        },
      };
    }

    // Habits
    if (Math.random() > 0.05) {
      state.daily[dateStr].habits = {
        "Morning Run": {
          status: "done",
          reps: 1,
          hours: 0.5,
          satisfaction: Math.floor(Math.random() * 2) + 4,
          notes: "Felt great",
        },
        Meditation: {
          status: Math.random() > 0.3 ? "done" : "missed",
          reps: 1,
          hours: 0.3,
          satisfaction: 4,
          notes: "",
        },
        "Weight Lifting": isWeekend
          ? {
              status: "done",
              reps: 1,
              hours: 1.5,
              satisfaction: 5,
              notes: "PR hit",
            }
          : {
              status: "pending",
              reps: 0,
              hours: 0,
              satisfaction: 0,
              notes: "",
            },
        Reading: {
          status: "done",
          reps: 1,
          hours: 1,
          satisfaction: 4,
          notes: "",
        },
        "Drink 3L Water": {
          status: "done",
          reps: 3,
          hours: 0,
          satisfaction: 3,
          notes: "",
        },
      };
    }

    if (isWeekend) {
      state.daily[dateStr].leisure = {
        Guitar: {
          status: "done",
          reps: 1,
          hours: Math.floor(Math.random() * 2) + 1,
          satisfaction: 5,
          notes: "Practiced new chords",
        },
        Netflix: {
          status: "done",
          reps: 1,
          hours: 3,
          satisfaction: 4,
          notes: "",
        },
      };
    }

    // Journals - VERY dense
    if (Math.random() > 0.1) {
      state.journals[dateStr] = {
        date: dateStr,
        mood: isWeekend ? 5 : Math.floor(Math.random() * 3) + 3,
        energy: Math.floor(Math.random() * 3) + 3,
        tags: ["Focused", "Learning", isWeekend ? "Relaxed" : "Grind"],
        sections: {
          wins: "Stayed consistent on all health goals.",
          notes: isWeekend ? "Rested up." : "Long deep work sessions.",
        },
        savedAt: new Date(d.getTime() + 86400000).toISOString(),
      };
    }

    // Pomo Sessions
    if (Math.random() > 0.2 && !isWeekend) {
      state.pomoSessions.push({
        id: `p_${dateStr}_1`,
        date: dateStr,
        duration: 60,
        task: "Deep Learning",
        cat: "studies",
        type: "work",
        time: "09:00",
        status: "completed",
      });
      if (Math.random() > 0.5) {
        state.pomoSessions.push({
          id: `p_${dateStr}_2`,
          date: dateStr,
          duration: 45,
          task: "Code Review",
          cat: "custom",
          type: "work",
          time: "14:00",
          status: "completed",
        });
      }
    }

    // Finances every month realistically
    if (d.getDate() === 1 || d.getDate() === 15) {
      state.finances.push({
        id: `f_${dateStr}_inc_${yr}${mt}`,
        date: dateStr,
        concept: "Direct Deposit / Salary",
        amount: 4500,
        type: "income",
        category: "salary",
        currency: "USD",
        tasks: [
          { id: "t1", name: "Wait for wire clear", done: true },
          { id: "t2", name: "Move 20% to savings", done: true },
        ],
      });
    }
    if (Math.random() > 0.6) {
      state.finances.push({
        id: `f_${dateStr}_exp_${Math.random()}`,
        date: dateStr,
        concept: ["Groceries", "Amazon", "Gas", "Dinner", "Coffee"][
          Math.floor(Math.random() * 5)
        ],
        amount: Math.floor(Math.random() * 150) + 15,
        type: "expense",
        category: "living",
        currency: "USD",
        tasks: [],
      });
    }

    // Expeditions Historical - 3 trips a year
    if (d.getDate() === 10 && ["02", "06", "10"].includes(mt)) {
      state.expeditions.push({
        id: `exp_${yr}_${mt}`,
        title: mt === "06" ? `Summer Retreat ${yr}` : `Weekend Escape ${yr}`,
        dateStart: `${yr}-${mt}-15`,
        dateEnd: `${yr}-${mt}-20`,
        location: "Remote cabin",
        notes: "A perfect getaway to clear the mind.",
        packList: [
          { id: "1", name: "Jacket", packed: true, qty: 1 },
          { id: "2", name: "Boots", packed: true, qty: 1 },
          { id: "3", name: "Passport", packed: true, qty: 1 },
        ],
        customTasks: [
          { id: "c1", name: "Book flights", done: true },
          { id: "c2", name: "Call guides", done: true },
          { id: "c3", name: "Setup auto-responder", done: true },
        ],
      });
    }
  }

  return state;
}

export const DEMO_STATE = createDemoData();
