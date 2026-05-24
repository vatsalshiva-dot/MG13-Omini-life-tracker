import { AppState, DailyState } from '../types';
import { defData } from './storage';

function createDemoData(): AppState {
  const state: AppState = defData();
  
  state.profile = { name: 'Demo Explorer', tagline: 'Consistent Achiever', email: 'hello@example.com' };
  
  state.items = {
    studies: ['Deep Learning', 'System Design', 'Algorithm Analysis', 'Neuroscience'],
    habits: ['Morning Run', 'Meditation', 'Weight Lifting', 'Reading', 'Drink 3L Water'],
    leisure: ['Guitar', 'Video Games', 'Netflix'],
    custom: ['Client Proposals', 'Code Review', 'Server Maintenance']
  };

  state.repsTarget = { 
    studies: { 'Deep Learning': 1, 'System Design': 1, 'Algorithm Analysis': 1 }, 
    habits: { 'Morning Run': 1, 'Meditation': 2, 'Reading': 1, 'Drink 3L Water': 3 },
    custom: { 'Client Proposals': 1, 'Code Review': 2 }
  };
  
  state.hoursTarget = { 
    studies: { 'Deep Learning': 2.0, 'System Design': 1.5 },
    habits: { 'Reading': 1.0, 'Weight Lifting': 1.5 },
    custom: { 'Client Proposals': 3.0, 'Code Review': 2.0 }
  };

  state.reminders = [
    { id: '1', title: 'Submit Systems design doc', dueDate: '2026-06-01', time: '12:00', type: 'deadline', priority: 'high', repeat: 'none', notes: '', status: 'pending' },
    { id: '2', title: 'Schedule meeting with mentor', dueDate: '2026-05-24', time: '', type: 'routine', priority: 'medium', repeat: 'none', notes: '', status: 'pending' },
    { id: '3', title: 'Trip Starts: Mountain Hike', dueDate: '2026-06-15', time: '', type: 'Trip Deadline', priority: 'high', repeat: 'none', notes: '', status: 'pending' },
    { id: '4', title: 'Finance: Hosting Subscription ($45)', dueDate: '2026-06-23', time: '', type: 'finance', priority: 'medium', repeat: 'none', notes: 'Recurring for amount: 45 - expense', status: 'pending' }
  ];

  state.pomoSessions = [
      { id: 'p1', date: '2026-05-24', duration: 25, task: 'Deep Learning', cat: 'studies', type: 'work', time: '10:00', status: 'completed' },
      { id: 'p2', date: '2026-05-24', duration: 25, task: 'System Design', cat: 'studies', type: 'work', time: '11:00', status: 'completed' }
  ];

  state.finances = [];
  state.expeditions = [];

  // Generate 2 years of VERY exhaustive historical daily data
  const dateObj = new Date();
  for (let i = 730; i >= 0; i--) {
     const d = new Date(dateObj);
     d.setDate(d.getDate() - i);
     const yr = d.getFullYear();
     const mt = String(d.getMonth() + 1).padStart(2, '0');
     const dy = String(d.getDate()).padStart(2, '0');
     const dateStr = `${yr}-${mt}-${dy}`;

     const isWeekend = d.getDay() === 0 || d.getDay() === 6;
     
     state.daily[dateStr] = {};

     // Studies
     if (Math.random() > 0.15) {
       state.daily[dateStr].studies = {
         'Deep Learning': { status: 'done', reps: Math.floor(Math.random() * 2) + 1, hours: Math.floor(Math.random() * 3) + 1, satisfaction: Math.floor(Math.random() * 2) + 4, notes: 'Paper review.' },
         'System Design': { status: 'done', reps: 1, hours: 1.5, satisfaction: 4, notes: '' },
       };
     }
     
     // Custom (only on weekdays)
     if (!isWeekend && Math.random() > 0.1) {
       state.daily[dateStr].custom = {
         'Client Proposals': { status: 'done', reps: 1, hours: 3.5, satisfaction: 4, notes: '' },
         'Code Review': { status: 'done', reps: 3, hours: 2, satisfaction: 5, notes: '' },
         'Server Maintenance': { status: 'done', reps: 1, hours: 0.5, satisfaction: 3, notes: '' }
       };
     }

     // Habits
     if (Math.random() > 0.05) {
       state.daily[dateStr].habits = {
         'Morning Run': { status: 'done', reps: 1, hours: 0.5, satisfaction: Math.floor(Math.random() * 2) + 4, notes: 'Felt great' },
         'Meditation': { status: Math.random() > 0.3 ? 'done' : 'missed', reps: 1, hours: 0.3, satisfaction: 4, notes: '' },
         'Weight Lifting': isWeekend ? { status: 'done', reps: 1, hours: 1.5, satisfaction: 5, notes: 'PR hit' } : { status: 'pending', reps: 0, hours: 0, satisfaction: 0, notes: '' },
         'Reading': { status: 'done', reps: 1, hours: 1, satisfaction: 4, notes: '' },
         'Drink 3L Water': { status: 'done', reps: 3, hours: 0, satisfaction: 3, notes: '' }
       };
     }

     if (isWeekend) {
       state.daily[dateStr].leisure = {
         'Guitar': { status: 'done', reps: 1, hours: Math.floor(Math.random() * 2) + 1, satisfaction: 5, notes: 'Practiced new chords' },
         'Netflix': { status: 'done', reps: 1, hours: 3, satisfaction: 4, notes: '' }
       };
     }

     // Journals - VERY dense
     if (Math.random() > 0.1) {
         state.journals[dateStr] = {
             date: dateStr,
             mood: isWeekend ? 5 : (Math.floor(Math.random() * 3) + 3),
             energy: Math.floor(Math.random() * 3) + 3,
             tags: ['Focused', 'Learning', isWeekend ? 'Relaxed' : 'Grind'],
             sections: { 'wins': 'Stayed consistent on all health goals.', 'notes': isWeekend ? 'Rested up.' : 'Long deep work sessions.' },
             savedAt: new Date(d.getTime() + 86400000).toISOString()
         };
     }

     // Pomo Sessions
     if (Math.random() > 0.2 && !isWeekend) {
        state.pomoSessions.push({
           id: `p_${dateStr}_1`,
           date: dateStr,
           duration: 60,
           task: 'Deep Learning',
           cat: 'studies',
           type: 'work',
           time: '09:00',
           status: 'completed'
        });
        if (Math.random() > 0.5) {
          state.pomoSessions.push({
             id: `p_${dateStr}_2`,
             date: dateStr,
             duration: 45,
             task: 'Code Review',
             cat: 'custom',
             type: 'work',
             time: '14:00',
             status: 'completed'
          });
        }
     }

     // Finances every month realistically
     if (d.getDate() === 1 || d.getDate() === 15) {
        state.finances.push({
          id: `f_${dateStr}_inc_${yr}${mt}`,
          date: dateStr,
          concept: 'Direct Deposit / Salary',
          amount: 4500,
          type: 'income',
          category: 'salary',
          currency: 'USD',
          tasks: [{ id: 't1', name: 'Wait for wire clear', done: true }, { id: 't2', name: 'Move 20% to savings', done: true }]
        });
     }
     if (Math.random() > 0.6) {
        state.finances.push({
          id: `f_${dateStr}_exp_${Math.random()}`,
          date: dateStr,
          concept: ['Groceries', 'Amazon', 'Gas', 'Dinner', 'Coffee'][Math.floor(Math.random() * 5)],
          amount: Math.floor(Math.random() * 150) + 15,
          type: 'expense',
          category: 'living',
          currency: 'USD',
          tasks: []
        });
     }

     // Expeditions Historical - 3 trips a year
     if (d.getDate() === 10 && ['02', '06', '10'].includes(mt)) {
         state.expeditions.push({
            id: `exp_${yr}_${mt}`,
            title: mt === '06' ? `Summer Retreat ${yr}` : `Weekend Escape ${yr}`,
            dateStart: `${yr}-${mt}-15`,
            dateEnd: `${yr}-${mt}-20`,
            location: 'Remote cabin',
            notes: 'A perfect getaway to clear the mind.',
            packList: [
                { id: '1', name: 'Jacket', packed: true, qty: 1 },
                { id: '2', name: 'Boots', packed: true, qty: 1 },
                { id: '3', name: 'Passport', packed: true, qty: 1 }
            ],
            customTasks: [
                { id: 'c1', name: 'Book flights', done: true },
                { id: 'c2', name: 'Call guides', done: true },
                { id: 'c3', name: 'Setup auto-responder', done: true }
            ]
         });
     }
  }

  return state;
}

export const DEMO_STATE = createDemoData();

