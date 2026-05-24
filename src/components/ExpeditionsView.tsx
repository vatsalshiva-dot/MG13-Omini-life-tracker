import React, { useState } from 'react';
import { AppState, ExpeditionEntry, ExpeditionPackItem } from '../types';
import { Plus, Trash2, CheckSquare, Square, MapPin } from 'lucide-react';

export const ExpeditionsView: React.FC<{ state: AppState; saveData: any; setAppState: any }> = ({ state, saveData, setAppState }) => {
  const [title, setTitle] = useState('');
  const [showLocMenu, setShowLocMenu] = useState<{ [id: string]: boolean }>({});
  
  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    const exp: ExpeditionEntry = {
      id: 'trip_' + Date.now(),
      title,
      dateStart: '',
      dateEnd: '',
      notes: '',
      packList: []
    };
    
    setAppState((prev: AppState) => {
      const next = { ...prev, expeditions: [...(prev.expeditions || []), exp] };
      saveData(next);
      return next;
    });
    setTitle('');
  };

  const handleRemove = (id: string) => {
    setAppState((prev: AppState) => {
      const next = { ...prev, expeditions: (prev.expeditions || []).filter(e => e.id !== id) };
      saveData(next);
      return next;
    });
  };

  const handleUpdateTrip = (id: string, updates: Partial<ExpeditionEntry>) => {
    setAppState((prev: AppState) => {
      const next = {
        ...prev,
        expeditions: (prev.expeditions || []).map(e => e.id === id ? { ...e, ...updates } : e)
      };
      saveData(next);
      return next;
    });
  };

  const handleAddItem = (tripId: string, itemName: string) => {
    if (!itemName) return;
    setAppState((prev: AppState) => {
      const next = { ...prev, expeditions: (prev.expeditions || []).map(e => {
        if (e.id === tripId) {
          return { ...e, packList: [...e.packList, { id: 'itm_'+Date.now(), name: itemName, packed: false, qty: 1 }] };
        }
        return e;
      })};
      saveData(next);
      return next;
    });
  };

  const togglePacked = (tripId: string, itemId: string) => {
    setAppState((prev: AppState) => {
      const next = { ...prev, expeditions: (prev.expeditions || []).map(e => {
        if (e.id === tripId) {
          return { ...e, packList: e.packList.map(it => it.id === itemId ? { ...it, packed: !it.packed } : it) };
        }
        return e;
      })};
      saveData(next);
      return next;
    });
  };

  const handleCaptureGPS = (tripId: string) => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        handleUpdateTrip(tripId, {
          location: `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`
        });
        alert('GPS location securely anchored to expedition.');
      },
      (err) => {
        alert("Unable to retrieve location. Please check browser permissions.");
      }
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      <div className="border-b border-[#111120] pb-5">
        <h2 className="text-3xl font-extrabold tracking-tight text-white font-display">
          Expedition <span className="text-[#00ff88]">Planner</span>
        </h2>
        <p className="text-xs uppercase tracking-widest text-[#a1a1aa] mt-1 font-mono">
          // PACKING LISTS & TRIPS
        </p>
      </div>

      <form onSubmit={handleAdd} className="flex gap-2">
        <input 
          type="text" 
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Expedition Name (e.g. Mountain Hike)..."
          className="flex-1 bg-[#111120] border border-[#2a2a50] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#00ff88]"
        />
        <button type="submit" className="bg-[#00ff88] text-black font-extrabold px-6 rounded-xl hover:bg-[#00ff88]/80 transition text-xs tracking-wider uppercase font-mono">
          CREATE
        </button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(state.expeditions || []).map(trip => (
          <div key={trip.id} className="bg-[#111120] border border-[#2a2a50] rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#2a2a50] pb-3">
              <h3 className="text-sm font-black text-slate-100 uppercase tracking-wide">{trip.title}</h3>
              <button onClick={() => handleRemove(trip.id)} className="text-slate-600 hover:text-rose-500 transition">
                <Trash2 size={14} />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div className="flex gap-1 relative">
                <input type="text" value={trip.location || ''} onChange={e => handleUpdateTrip(trip.id, { location: e.target.value })} placeholder="Location..." className="flex-1 min-w-0 bg-[#0d0d1a] border border-[#2a2a50] px-2 py-1.5 rounded-lg text-[10px] text-white focus:outline-none focus:border-[#00ff88]" />
                <button onClick={() => setShowLocMenu(prev => ({ ...prev, [trip.id]: !prev[trip.id] }))} className="bg-[#2a2a50] hover:bg-[#00ff88] hover:text-black text-slate-400 p-1.5 rounded-lg transition" title="Log Location">
                  <MapPin size={12} />
                </button>
                {showLocMenu[trip.id] && (
                  <div className="absolute top-10 right-0 mt-1 bg-[#111120] border border-[#2a2a50] rounded-xl p-1.5 flex flex-col gap-1 w-40 z-10 shadow-2xl">
                    <button onClick={() => { handleCaptureGPS(trip.id); setShowLocMenu(prev => ({ ...prev, [trip.id]: false })); }} className="text-left px-2 py-2 text-[9px] font-bold uppercase tracking-widest hover:bg-[#1a1a30] text-[#00ff88] rounded-lg transition">Current (GPS)</button>
                    <a href="https://maps.google.com" target="_blank" rel="noreferrer" onClick={() => setShowLocMenu(prev => ({ ...prev, [trip.id]: false }))} className="text-left px-2 py-2 text-[9px] font-bold uppercase tracking-widest hover:bg-[#1a1a30] text-[#00d4ff] rounded-lg transition block">Google Maps</a>
                    <a href="https://maps.apple.com" target="_blank" rel="noreferrer" onClick={() => setShowLocMenu(prev => ({ ...prev, [trip.id]: false }))} className="text-left px-2 py-2 text-[9px] font-bold uppercase tracking-widest hover:bg-[#1a1a30] text-[#ffaa44] rounded-lg transition block">Apple Maps</a>
                  </div>
                )}
              </div>
              <input type="text" value={trip.people || ''} onChange={e => handleUpdateTrip(trip.id, { people: e.target.value })} placeholder="People (e.g. Bob, Alice)..." className="bg-[#0d0d1a] border border-[#2a2a50] px-2 py-1.5 rounded-lg text-[10px] text-white focus:outline-none focus:border-[#00ff88]" />
              
              <div className="flex gap-1 items-center">
                <input type="date" value={trip.dateStart || ''} onChange={e => handleUpdateTrip(trip.id, { dateStart: e.target.value })} className="flex-1 min-w-0 bg-[#0d0d1a] border border-[#2a2a50] px-2 py-1.5 rounded-lg text-[10px] text-white focus:outline-none focus:border-[#00ff88]" title="Start Date" />
                {trip.dateStart && (
                  <button 
                    onClick={() => {
                        setAppState((prev: AppState) => {
                            const newReminder = { 
                              id: 'r_' + Date.now(), 
                              title: `Trip Starts: ${trip.title}`, 
                              dueDate: trip.dateStart!, 
                              time: '', 
                              type: 'deadline', 
                              status: 'pending',
                              priority: 'high',
                              repeat: 'none',
                              notes: '',
                              enableAlert: true
                            };
                            const next = { ...prev, reminders: [...(prev.reminders || []), newReminder as any] };
                            saveData(next);
                            alert('Reminder added to Calendar & Alerts!');
                            return next;
                        });
                    }}
                    className="bg-[#2a2a50] hover:bg-[#00ff88] hover:text-black text-[#00ff88] px-2 py-1.5 rounded-lg transition text-[9px] font-bold uppercase tracking-widest"
                    title="Add Calendar Alert"
                  >
                    + ALERT
                  </button>
                )}
              </div>

              <input type="date" value={trip.dateEnd || ''} onChange={e => handleUpdateTrip(trip.id, { dateEnd: e.target.value })} className="bg-[#0d0d1a] border border-[#2a2a50] px-2 py-1.5 rounded-lg text-[10px] text-white focus:outline-none focus:border-[#00ff88]" title="End Date" />
            </div>
            <input type="text" value={trip.links || ''} onChange={e => handleUpdateTrip(trip.id, { links: e.target.value })} placeholder="Links (Airbnb, Flights...)" className="w-full bg-[#0d0d1a] border border-[#2a2a50] px-2 py-1.5 rounded-lg text-[10px] text-white focus:outline-none focus:border-[#00ff88]" />
            <textarea value={trip.notes || ''} onChange={e => handleUpdateTrip(trip.id, { notes: e.target.value })} placeholder="Notes / Schedule..." className="w-full bg-[#0d0d1a] border border-[#2a2a50] px-2 py-1.5 rounded-lg text-[10px] text-white focus:outline-none focus:border-[#00ff88] min-h-[60px]" />

            <div className="space-y-1 pt-2 border-t border-[#1e1e38]">
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-2">Custom Tasks & Goals</p>
              {(trip.customTasks || []).map(task => (
                <div key={task.id} className="flex items-center justify-between group p-1.5 hover:bg-[#0d0d1a] rounded-lg transition">
                  <div className="flex items-center gap-2 cursor-pointer select-none flex-1" onClick={() => {
                    handleUpdateTrip(trip.id, {
                        customTasks: trip.customTasks?.map(t => t.id === task.id ? { ...t, done: !t.done } : t)
                    });
                  }}>
                    {task.done ? <CheckSquare size={14} className="text-[#00d4ff] shrink-0" /> : <Square size={14} className="text-slate-600 shrink-0" />}
                    <span className={`text-[11px] font-medium transition ${task.done ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                      {task.name}
                    </span>
                  </div>
                  <button onClick={() => {
                    handleUpdateTrip(trip.id, {
                        customTasks: trip.customTasks?.filter(t => t.id !== task.id)
                    });
                  }} className="text-slate-600 hover:text-rose-500 transition opacity-0 group-hover:opacity-100 px-2">
                    &times;
                  </button>
                </div>
              ))}
              <input 
                type="text" 
                placeholder="+ Add custom task/goal..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const el = e.target as HTMLInputElement;
                    if (!el.value) return;
                    handleUpdateTrip(trip.id, {
                        customTasks: [...(trip.customTasks || []), { id: 'ctx_' + Date.now(), name: el.value, done: false }]
                    });
                    el.value = '';
                  }
                }}
                className="w-full bg-transparent border-none text-[11px] text-slate-400 focus:outline-none placeholder-slate-600 py-1"
              />
            </div>

            <div className="space-y-1 pt-2 border-t border-[#1e1e38]">
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-2">Gear Checklist</p>
              {trip.packList.map(it => (
                <div key={it.id} className="flex items-center justify-between group p-1.5 hover:bg-[#0d0d1a] rounded-lg transition">
                  <div className="flex items-center gap-2 cursor-pointer select-none flex-1" onClick={() => togglePacked(trip.id, it.id)}>
                    {it.packed ? <CheckSquare size={14} className="text-[#00ff88] shrink-0" /> : <Square size={14} className="text-slate-600 shrink-0" />}
                    <span className={`text-[11px] font-medium transition ${it.packed ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                      {it.name}
                    </span>
                  </div>
                  <button onClick={() => {
                      setAppState((prev: AppState) => {
                          const next = { ...prev, expeditions: prev.expeditions.map(e => e.id === trip.id ? { ...e, packList: e.packList.filter(p => p.id !== it.id) } : e) };
                          saveData(next);
                          return next;
                      });
                  }} className="text-slate-600 hover:text-rose-500 transition opacity-0 group-hover:opacity-100 px-2">
                    &times;
                  </button>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <input 
                type="text" 
                placeholder="+ Add gear item..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddItem(trip.id, (e.target as HTMLInputElement).value);
                    (e.target as HTMLInputElement).value = '';
                  }
                }}
                className="w-full bg-transparent border-b border-[#2a2a50] px-2 py-1.5 text-[10px] text-slate-300 placeholder-slate-600 focus:outline-none focus:border-[#00ff88] font-mono"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
