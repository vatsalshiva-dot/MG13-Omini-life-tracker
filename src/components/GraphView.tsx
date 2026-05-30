import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { AppState, TrackerCategory, JournalEntry, PomoSession, ExpeditionExpense, Reminder, SketchEntry } from '../types';
import { 
  Network, Search, Sliders, Layers, X, Calendar, Notebook, CheckSquare, 
  Timer, DollarSign, PenTool, ExternalLink, RefreshCw, ZoomIn, ZoomOut, Maximize2,
  TrendingUp, Smile, Tag, Shield, Compass, Sparkles, Filter, Activity, Terminal,
  ChevronRight, HelpCircle, Bell, LayoutGrid
} from 'lucide-react';
import { getAllCats, getCatLabel } from '../utils/storage';

interface GraphViewProps {
  state: AppState;
  onSetDate: (date: string) => void;
  onNavigate: (viewId: string) => void;
}

type NodeType = 'day' | 'category' | 'habit' | 'journal' | 'tag' | 'pomo' | 'finance' | 'sketch' | 'reminder';

interface CustomNode extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  group: NodeType;
  radius: number;
  color: string;
  desc?: string;
  rawData?: any;
}

interface CustomLink extends d3.SimulationLinkDatum<CustomNode> {
  source: any;
  target: any;
  value: number;
}

export const GraphView: React.FC<GraphViewProps> = ({ state, onSetDate, onNavigate }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const simulationRef = useRef<d3.Simulation<CustomNode, CustomLink> | null>(null);

  // States for filters & simulation mechanics
  const [scanDays, setScanDays] = useState<number>(15);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedNode, setSelectedNode] = useState<CustomNode | null>(null);
  const selectedNodeRef = useRef<CustomNode | null>(null);

  // Filter Toggles
  const [showHabits, setShowHabits] = useState<boolean>(true);
  const [showJournals, setShowJournals] = useState<boolean>(true);
  const [showTags, setShowTags] = useState<boolean>(true);
  const [showPomos, setShowPomos] = useState<boolean>(true);
  const [showFinances, setShowFinances] = useState<boolean>(true);
  const [showSketches, setShowSketches] = useState<boolean>(true);
  const [showReminders, setShowReminders] = useState<boolean>(true);
  const [showCategories, setShowCategories] = useState<boolean>(true);

  // Advanced Force Controls
  const [chargeStrength, setChargeStrength] = useState<number>(-120);
  const [linkDistance, setLinkDistance] = useState<number>(60);
  const [collisionBuffer, setCollisionBuffer] = useState<number>(20);
  const [physicsActive, setPhysicsActive] = useState<boolean>(true);

  // Lightbox for sketches
  const [previewSketch, setPreviewSketch] = useState<string | null>(null);

  // Spacious Layout mode toggle: 'briefing-only' (full width, majestic index) or 'split-graph' (with visualization panel)
  const [layoutMode, setLayoutMode] = useState<'briefing-only' | 'split-graph'>(() => {
    const saved = localStorage.getItem('omnilife_graph_layout_mode');
    return (saved === 'split-graph' || saved === 'briefing-only') ? saved : 'briefing-only';
  });

  const handleSetLayoutMode = (mode: 'briefing-only' | 'split-graph') => {
    setLayoutMode(mode);
    localStorage.setItem('omnilife_graph_layout_mode', mode);
  };

  // Instruction onboarding banner: 'once in the beginning' prominent display, then 'little note' collapse state
  const [dismissedIntro, setDismissedIntro] = useState<boolean>(() => {
    return localStorage.getItem('omnilife_briefing_intro_dismissed') === 'true';
  });

  // Date Label Formatter
  const formatDateLabel = (dateStr: string) => {
    try {
      const d = new Date(dateStr + "T00:00:00");
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
    } catch (e) {
      return dateStr;
    }
  };

  // 1. Build the advanced nodes dataset based on scan window
  const graphData = useMemo(() => {
    const nodes: CustomNode[] = [];
    const links: CustomLink[] = [];
    const nodeMap = new Map<string, CustomNode>();

    const addNode = (n: CustomNode) => {
      if (!nodeMap.has(n.id)) {
        nodes.push(n);
        nodeMap.set(n.id, n);
      }
    };

    const addLink = (source: string, target: string, value: number) => {
      if (nodeMap.has(source) && nodeMap.has(target)) {
        links.push({ source, target, value });
      }
    };

    // Find all unique dates across modules
    const allAvailableDates = new Set<string>();
    Object.keys(state.daily || {}).forEach(d => allAvailableDates.add(d));
    Object.keys(state.journals || {}).forEach(d => allAvailableDates.add(d));
    (state.pomoSessions || []).forEach(p => p.date && allAvailableDates.add(p.date));
    (state.finances || []).forEach(f => f.date && allAvailableDates.add(f.date));
    (state.sketches || []).forEach(s => s.date && allAvailableDates.add(s.date));
    (state.reminders || []).forEach(r => r.dueDate && allAvailableDates.add(r.dueDate));

    // Get sorted slice of recent days
    const sortedDates = Array.from(allAvailableDates)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
      .slice(0, scanDays);

    // PERSISTENT: OS Main Categories (Modules)
    if (showCategories) {
      const cats = getAllCats(state);
      cats.forEach(c => {
        addNode({
          id: `cat_${c.id}`,
          group: 'category',
          label: `Module: ${c.label}`,
          radius: 12,
          color: '#aa44ff', // Violet
          desc: 'Persistent operational framework module focusing on distinct habit tracks.',
          rawData: c
        });
      });
    }

    // Process dates chronologically or inversely
    sortedDates.forEach(date => {
      // Day Node (Main temporal hub)
      const dateDisplay = date.split("-").slice(1).join("/");
      addNode({
        id: `day_${date}`,
        group: 'day',
        label: dateDisplay,
        radius: 10,
        color: '#00d4ff', // Cyan
        desc: `Macro calendar anchor for date ${formatDateLabel(date)}. Links direct sub-records.`,
        rawData: { dateStr: date }
      });

      // Daily habits that had work/notes completed on this date
      if (showHabits) {
        const dayData = state.daily[date];
        if (dayData) {
          Object.entries(dayData).forEach(([catId, items]) => {
            let activeItemsCount = 0;
            const itemsList: Array<{ name: string; info: any }> = [];

            Object.entries(items).forEach(([itemName, entry]) => {
              if (entry.status === 'done' || entry.reps > 0 || (entry.notes && entry.notes.trim().length > 0)) {
                activeItemsCount++;
                itemsList.push({ name: itemName, info: entry });
              }
            });

            if (activeItemsCount > 0) {
              const label = getCatLabel(state, catId);
              const habitNodeId = `habit_${date}_${catId}`;
              addNode({
                id: habitNodeId,
                group: 'habit',
                label: `${label} (${activeItemsCount})`,
                radius: 7.5,
                color: '#00ff88', // Green
                desc: `Tracked habit category completed with logged parameters on this date.`,
                rawData: { date, catId, itemsCount: activeItemsCount, list: itemsList }
              });

              // Create hierarchical bonds
              addLink(`day_${date}`, habitNodeId, 1.5);
              if (showCategories) {
                addLink(habitNodeId, `cat_${catId}`, 0.8);
              }
            }
          });
        }
      }

      // Journal & Reflection Nodes
      if (showJournals) {
        const j = state.journals[date];
        if (j) {
          addNode({
            id: `jrn_${date}`,
            group: 'journal',
            label: `Reflection Score: ${j.mood}/5`,
            radius: 13,
            color: '#ffaa00', // Gold mood glow
            desc: `Daily psychological journal, mood logging, energy levels and personal reflections.`,
            rawData: j
          });
          // Strong affinity tie
          addLink(`day_${date}`, `jrn_${date}`, 2.2);

          // Associate tag nodes directly to this journal reflection
          if (showTags && j.tags) {
            j.tags.forEach((tag) => {
              const cleanTag = tag.trim().toLowerCase();
              if (cleanTag) {
                const tagNodeId = `tag_${cleanTag}`;
                addNode({
                  id: tagNodeId,
                  group: 'tag',
                  label: `#${cleanTag}`,
                  radius: 8,
                  color: '#ff6b1a', // Orange tag indicator
                  desc: 'Auto-indexed semantic search tag linked directly to daily logs.',
                  rawData: { tag: cleanTag }
                });
                addLink(`jrn_${date}`, tagNodeId, 1.2);
              }
            });
          }
        }
      }

      // Pomodoro focus nodes
      if (showPomos) {
        const pomos = (state.pomoSessions || []).filter(p => p.date === date);
        if (pomos.length > 0) {
          const completedCount = pomos.filter(p => p.status === 'completed').length;
          const totalDuration = pomos.reduce((acc, curr) => acc + (curr.duration || 0), 0);
          addNode({
            id: `pomo_${date}`,
            group: 'pomo',
            label: `${completedCount} Pomo [${totalDuration}m]`,
            radius: 9,
            color: '#ff3366', // Rose focus
            desc: `Aggregated Pomodoro high-focus sessions completed.`,
            rawData: pomos
          });
          addLink(`day_${date}`, `pomo_${date}`, 1.4);
        }
      }

      // Financial統一 ledger nodes
      if (showFinances) {
        const financesOnDay = (state.finances || []).filter(f => f.date === date);
        if (financesOnDay.length > 0) {
          const totalSpent = financesOnDay.reduce((acc, curr) => acc + (curr.amount || 0), 0);
          addNode({
            id: `fin_${date}`,
            group: 'finance',
            label: `Ledger: $${totalSpent.toFixed(0)}`,
            radius: 9,
            color: '#ec4899', // Hot Pink Ledger
            desc: `Financial Ledger records logged for custom transaction entries.`,
            rawData: financesOnDay
          });
          addLink(`day_${date}`, `fin_${date}`, 1.4);
        }
      }

      // Creative Canvas Sketches
      if (showSketches) {
        const sketches = (state.sketches || []).filter(s => s.date === date);
        if (sketches.length > 0) {
          addNode({
            id: `sketch_${date}`,
            group: 'sketch',
            label: `${sketches.length} Canvas Sketch`,
            radius: 8.5,
            color: '#3b82f6', // Indigo Sketch Blue
            desc: `Free-form hand-drawn designs and ideation sketches attached to date context.`,
            rawData: sketches
          });
          addLink(`day_${date}`, `sketch_${date}`, 1.2);
        }
      }

      // Alarms & Reminders Due
      if (showReminders) {
        const reminders = (state.reminders || []).filter(r => r.dueDate === date);
        if (reminders.length > 0) {
          addNode({
            id: `rem_${date}`,
            group: 'reminder',
            label: `${reminders.length} Cue Deadlines`,
            radius: 8,
            color: '#e2e8f0', // Cold White
            desc: `Actionable tasks, alarms, agendas and milestones flagged with deadlines.`,
            rawData: reminders
          });
          addLink(`day_${date}`, `rem_${date}`, 1.1);
        }
      }

    });

    return { nodes, links };
  }, [
    state, scanDays, showHabits, showJournals, showTags, 
    showPomos, showFinances, showSketches, showReminders, showCategories
  ]);

  // 2. Computed overall loaded graph summary stats for Default Sidebar UI
  const graphGeneralStats = useMemo(() => {
    let totalPomos = 0;
    let pomoHours = 0;
    let totalSpent = 0;
    let totalJournals = 0;
    let averageMoodSum = 0;
    const tagFrequency: Record<string, number> = {};

    graphData.nodes.forEach(n => {
      if (n.group === 'pomo') {
        const sessions = n.rawData as PomoSession[];
        totalPomos += sessions.length;
        pomoHours += sessions.reduce((s, p) => s + (p.duration || 0), 0) / 60;
      } else if (n.group === 'finance') {
        const ledger = n.rawData as ExpeditionExpense[];
        totalSpent += ledger.reduce((sum, f) => sum + (f.amount || 0), 0);
      } else if (n.group === 'journal') {
        const jrn = n.rawData as JournalEntry;
        totalJournals++;
        averageMoodSum += jrn.mood || 0;
      } else if (n.group === 'tag') {
        const tag = n.rawData.tag;
        tagFrequency[tag] = (tagFrequency[tag] || 0) + 1;
      }
    });

    const topTags = Object.entries(tagFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);

    return {
      nodeCount: graphData.nodes.length,
      linkCount: graphData.links.length,
      totalJournals,
      avgMood: totalJournals > 0 ? (averageMoodSum / totalJournals).toFixed(1) : 'N/A',
      totalPomos,
      pomoHours: pomoHours.toFixed(1),
      totalSpent: totalSpent.toLocaleString(undefined, { maximumFractionDigits: 0 }),
      topTags
    };
  }, [graphData]);

  // Computed directory of nodes matching search query
  const filteredNodesRegistry = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return graphData.nodes;
    return graphData.nodes.filter(node => 
      node.label.toLowerCase().includes(q) || 
      node.group.toLowerCase().includes(q) ||
      (node.desc && node.desc.toLowerCase().includes(q))
    );
  }, [graphData.nodes, searchQuery]);

  // 3. React Canvas Integration & D3 Force Layout Simulation Setup
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const updateCanvasSize = () => {
      if (!canvas.parentElement) return;
      const rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = rect.width || canvas.parentElement.clientWidth || 600;
      canvas.height = rect.height || canvas.parentElement.clientHeight || 500;
    };
    updateCanvasSize();

    let width = canvas.width;
    let height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Match previous zoom settings
    let transform = d3.zoomIdentity;

    // Build lists for mutation mapping
    const nodes = graphData.nodes.map(n => ({ ...n }));
    const links = graphData.links.map(l => {
      const sourceNode = nodes.find(n => n.id === (l.source as any));
      const targetNode = nodes.find(n => n.id === (l.target as any));
      return { 
        ...l, 
        source: sourceNode || l.source, 
        target: targetNode || l.target 
      };
    });

    // Re-bind selected node ref object to match mutated copies
    if (selectedNodeRef.current) {
      const matched = nodes.find(n => n.id === selectedNodeRef.current?.id);
      if (matched) {
        selectedNodeRef.current = matched;
        setSelectedNode(matched);
      } else {
        selectedNodeRef.current = null;
        setSelectedNode(null);
      }
    }

    const simulation = d3.forceSimulation<CustomNode, CustomLink>(nodes)
      .force("charge", d3.forceManyBody<CustomNode>().strength(chargeStrength).distanceMax(250))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("link", d3.forceLink<CustomNode, CustomLink>(links).id(d => d.id).distance(linkDistance).strength(0.4))
      .force("collide", d3.forceCollide<CustomNode>().radius(d => d.radius + collisionBuffer).iterations(3));

    simulationRef.current = simulation;

    // Tick Renderer
    simulation.on("tick", () => {
      ctx.save();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.translate(transform.x, transform.y);
      ctx.scale(transform.k, transform.k);

      const activeNode = selectedNodeRef.current;
      const activeNodeId = activeNode ? activeNode.id : null;

      // Extract 1st and 2nd degree subnets
      const connectedNodeIds = new Set<string>();
      const firstDegreeIds = new Set<string>();

      if (activeNodeId) {
        connectedNodeIds.add(activeNodeId);
        links.forEach(l => {
          const sId = l.source.id || l.source;
          const tId = l.target.id || l.target;
          if (sId === activeNodeId) {
            firstDegreeIds.add(tId);
            connectedNodeIds.add(tId);
          }
          if (tId === activeNodeId) {
            firstDegreeIds.add(sId);
            connectedNodeIds.add(sId);
          }
        });
        links.forEach(l => {
          const sId = l.source.id || l.source;
          const tId = l.target.id || l.target;
          if (firstDegreeIds.has(sId)) connectedNodeIds.add(tId);
          if (firstDegreeIds.has(tId)) connectedNodeIds.add(sId);
        });
      }

      // Draw Grid Lines (Dynamic subtle backdrop)
      ctx.strokeStyle = "rgba(40, 40, 80, 0.1)";
      ctx.lineWidth = 0.5;
      const step = 60;
      const startX = Math.floor((-transform.x) / transform.k / step) * step;
      const endX = startX + (canvas.width / transform.k) + step * 2;
      const startY = Math.floor((-transform.y) / transform.k / step) * step;
      const endY = startY + (canvas.height / transform.k) + step * 2;

      for (let x = startX; x <= endX; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, startY);
        ctx.lineTo(x, endY);
        ctx.stroke();
      }
      for (let y = startY; y <= endY; y += step) {
        ctx.beginPath();
        ctx.moveTo(startX, y);
        ctx.lineTo(endX, y);
        ctx.stroke();
      }

      // Draw Lines (Ties)
      links.forEach(d => {
        const sId = d.source.id || d.source;
        const tId = d.target.id || d.target;
        let strokeColor = "rgba(42, 42, 80, 0.35)";
        let lineWidth = 0.8;

        if (activeNodeId) {
          const isDirect = (sId === activeNodeId || tId === activeNodeId);
          const isSubGraph = (connectedNodeIds.has(sId) && connectedNodeIds.has(tId));
          if (isDirect) {
            strokeColor = "rgba(0, 212, 255, 0.95)"; 
            lineWidth = 2.2;
          } else if (isSubGraph) {
            strokeColor = "rgba(170, 68, 255, 0.6)"; 
            lineWidth = 1.2;
          } else {
            strokeColor = "rgba(42, 42, 80, 0.05)"; 
            lineWidth = 0.4;
          }
        }

        ctx.beginPath();
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = lineWidth;
        ctx.moveTo(d.source.x, d.source.y);
        ctx.lineTo(d.target.x, d.target.y);
        ctx.stroke();
      });

      // Draw Circles (Nodes)
      nodes.forEach(d => {
        const isMatched = searchQuery ? d.label.toLowerCase().includes(searchQuery.toLowerCase()) : false;
        const isConnected = activeNodeId ? connectedNodeIds.has(d.id) : true;
        const isSelected = activeNodeId === d.id;

        ctx.save();
        ctx.globalAlpha = isConnected ? 1.0 : 0.15;

        // Custom highlight overlays
        if (isSelected) {
          ctx.shadowColor = d.color;
          ctx.shadowBlur = 18;
          ctx.lineWidth = 3.5;
          ctx.strokeStyle = "#ffffff";
        } else if (isMatched) {
          ctx.shadowColor = "#facc15";
          ctx.shadowBlur = 15;
          ctx.lineWidth = 2.5;
          ctx.strokeStyle = "#facc15";
        } else {
          ctx.lineWidth = 1.5;
          ctx.strokeStyle = "rgba(10, 10, 25, 0.85)";
        }

        ctx.beginPath();
        ctx.arc(d.x || 0, d.y || 0, d.radius, 0, 2 * Math.PI);
        ctx.fillStyle = d.color;
        ctx.fill();
        ctx.stroke();

        ctx.restore();

        // Node Text Labels
        const labelText = d.label;
        const mustShowText = isSelected || isMatched || d.radius > 9 || transform.k > 1.3 || isConnected;

        if (mustShowText) {
          ctx.save();
          ctx.globalAlpha = isConnected ? 1.0 : 0.2;
          let fontSize = Math.max(9, 10 / transform.k);
          ctx.font = isSelected || isMatched 
            ? `900 ${fontSize}px "JetBrains Mono", monospace` 
            : `500 ${fontSize}px "JetBrains Mono", monospace`;
          
          ctx.textAlign = "center";
          
          // Background bubble for readability on active grid
          if (isSelected || isMatched) {
            ctx.fillStyle = "rgba(10, 10, 24, 0.85)";
            const textWidth = ctx.measureText(labelText).width;
            ctx.fillRect((d.x || 0) - textWidth/2 - 4, (d.y || 0) + d.radius + 5, textWidth + 8, fontSize + 4);
          }

          ctx.fillStyle = isSelected 
            ? "#ffffff" 
            : isMatched ? "#facc15" : isConnected ? "rgba(226, 232, 240, 0.9)" : "rgba(148, 163, 184, 0.3)";
          
          ctx.fillText(
            labelText.length > 25 ? labelText.substring(0, 23) + "..." : labelText, 
            d.x || 0, 
            (d.y || 0) + d.radius + 14
          );
          ctx.restore();
        }
      });

      ctx.restore();
    });

    // Setup active Drag listener
    d3.select(canvas).call(
      d3.drag<HTMLCanvasElement, any>()
        .subject((e) => {
          const invX = transform.invertX(e.x);
          const invY = transform.invertY(e.y);
          const hitRadius = 24; 
          let found = null;
          for (let i = nodes.length - 1; i >= 0; --i) {
            const node = nodes[i];
            const dx = invX - (node.x || 0);
            const dy = invY - (node.y || 0);
            if (dx * dx + dy * dy < (node.radius + hitRadius) * (node.radius + hitRadius)) {
              found = node;
              break;
            }
          }
          return found;
        })
        .on("start", (e) => {
          if (physicsActive) {
            if (!e.active) simulation.alphaTarget(0.3).restart();
          }
          e.subject.fx = e.subject.x;
          e.subject.fy = e.subject.y;
        })
        .on("drag", (e) => {
          e.subject.fx = transform.invertX(e.x);
          e.subject.fy = transform.invertY(e.y);
          // Redraw during static drags when physics is off
          if (!physicsActive) {
            simulation.tick();
            simulation.alpha(0.01).restart();
          }
        })
        .on("end", (e) => {
          if (physicsActive) {
            if (!e.active) simulation.alphaTarget(0);
            e.subject.fx = null;
            e.subject.fy = null;
          } else {
            // Keep pinned when physics is locked
            e.subject.x = e.subject.fx;
            e.subject.y = e.subject.fy;
          }
        })
    );

    // Setup Click listener
    d3.select(canvas).on("click", (e) => {
      const invX = transform.invertX(e.offsetX);
      const invY = transform.invertY(e.offsetY);
      let found: any = null;
      const hitRadius = 15;

      for (let i = nodes.length - 1; i >= 0; --i) {
        const node = nodes[i];
        const dx = invX - (node.x || 0);
        const dy = invY - (node.y || 0);
        if (dx * dx + dy * dy < (node.radius + hitRadius) * (node.radius + hitRadius)) {
          found = node;
          break;
        }
      }

      if (found) {
        setSelectedNode(found);
        selectedNodeRef.current = found;
        simulation.alpha(0.3).restart();
      } else {
        setSelectedNode(null);
        selectedNodeRef.current = null;
        simulation.alpha(0.3).restart();
      }
    });

    // Setup Zoom actions with responsive simulation updates
    const zoom = d3.zoom<HTMLCanvasElement, any>()
      .scaleExtent([0.1, 4.0])
      .on("zoom", (e) => {
        transform = e.transform;
        simulation.alpha(0.1).restart();
      });

    d3.select(canvas).call(zoom);

    // Explicit zoom control shortcuts
    const handleZoomIn = () => {
      d3.select(canvas).transition().duration(250).call(zoom.scaleBy, 1.3);
    };
    const handleZoomOut = () => {
      d3.select(canvas).transition().duration(250).call(zoom.scaleBy, 0.7);
    };
    const handleResetZoom = () => {
      d3.select(canvas).transition().duration(350).call(zoom.transform, d3.zoomIdentity);
    };

    (canvas as any).__zoom_in = handleZoomIn;
    (canvas as any).__zoom_out = handleZoomOut;
    (canvas as any).__reset_zoom = handleResetZoom;

    // Handle Window Resizing safely with observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        const targetW = w || canvas.parentElement?.clientWidth || 600;
        const targetH = h || canvas.parentElement?.clientHeight || 500;
        canvas.width = targetW;
        canvas.height = targetH;
        simulation.force("center", d3.forceCenter(targetW / 2, targetH / 2));
        simulation.alpha(0.2).restart();
      }
    });

    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    return () => {
      simulation.stop();
      resizeObserver.disconnect();
    };
  }, [graphData, chargeStrength, linkDistance, collisionBuffer, physicsActive, searchQuery]);

  // Handle manual shortcut clicks from tag list or lists
  const handleSelectNodeById = (nodeId: string) => {
    // Look up node in current graph dataset
    const matchedNode = graphData.nodes.find(n => n.id === nodeId);
    if (matchedNode) {
      setSelectedNode(matchedNode);
      selectedNodeRef.current = matchedNode;
      if (simulationRef.current) {
        simulationRef.current.alpha(0.35).restart();
      }
    }
  };

  // Safe dispatch for viewport button triggers
  const triggerZoomIn = () => {
    if (canvasRef.current && (canvasRef.current as any).__zoom_in) {
      (canvasRef.current as any).__zoom_in();
    }
  };
  const triggerZoomOut = () => {
    if (canvasRef.current && (canvasRef.current as any).__zoom_out) {
      (canvasRef.current as any).__zoom_out();
    }
  };
  const triggerResetZoom = () => {
    if (canvasRef.current && (canvasRef.current as any).__reset_zoom) {
      (canvasRef.current as any).__reset_zoom();
    }
  };

  return (
    <div id="advanced-knowledge-graph-container" className="space-y-5 animate-fade-in w-full flex flex-col font-sans select-none text-slate-200">
      
      {/* 1. Header Toolbar Dashboard */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-[#0c0c16]/90 border border-[#232345] p-4 rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.4)] backdrop-blur-md">
        
        {/* Title branding */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#aa44ff]/10 text-[#aa44ff] border border-[#aa44ff]/30 rounded-xl flex items-center justify-center animate-pulse">
            <Network size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black tracking-widest text-[#e2e8f0] uppercase bg-[#1f1f3a]/80 px-2.5 py-1 rounded-md border border-[#303060]">
                Omnilife Knowledge Graph
              </h2>
              <span className="hidden sm:inline-flex text-[9px] bg-[#00ff88]/10 border border-[#00ff88]/30 text-[#00ff88] font-mono font-black px-2 py-0.5 rounded uppercase">
                Active Logic Layer
              </span>
            </div>
            <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500 font-mono mt-1">
              Multi-dimensional direct device memory indexing
            </p>
          </div>
        </div>

        {/* Network State badging & scan window */}
        <div className="flex flex-wrap items-center gap-2.5 self-end md:self-auto font-mono text-xs">
          <div className="bg-[#05050f] border border-[#232342] rounded-lg px-2.5 py-1 text-[10.5px] flex items-center gap-1">
             <span className="w-1.5 h-1.5 rounded-full bg-[#00d4ff]" /> Nodes: <strong className="text-[#00d4ff]">{graphGeneralStats.nodeCount}</strong>
          </div>
          <div className="bg-[#05050f] border border-[#232342] rounded-lg px-2.5 py-1 text-[10.5px] flex items-center gap-1">
             <span className="w-1.5 h-1.5 rounded-full bg-[#aa44ff]" /> Logic links: <strong className="text-[#aa44ff]">{graphGeneralStats.linkCount}</strong>
          </div>

          <div className="flex items-center gap-1.5 bg-[#151530] border border-[#3e3e6b] px-2 py-1 rounded-xl">
             <span className="text-[11px] text-slate-400 font-bold">Scanning Depth:</span>
             <select 
               value={[7, 15, 30, 45, 60, 90].includes(scanDays) ? scanDays : "custom"} 
               onChange={(e) => {
                 const val = e.target.value;
                 if (val === "custom") {
                   setScanDays(120);
                 } else {
                   setScanDays(Number(val));
                 }
                 setSelectedNode(null);
                 selectedNodeRef.current = null;
               }}
               className="bg-[#0c0c16] text-[#00d4ff] border-none focus:ring-0 text-[11px] font-black uppercase tracking-wider cursor-pointer font-mono"
             >
                <option value={7}>7 Days</option>
                <option value={15}>15 Days</option>
                <option value={30}>30 Days</option>
                <option value={45}>45 Days</option>
                <option value={60}>60 Days</option>
                <option value={90}>90 Days</option>
                <option value="custom">Custom...</option>
             </select>
             {![7, 15, 30, 45, 60, 90].includes(scanDays) && (
               <input 
                 type="number"
                 value={scanDays}
                 min={1}
                 max={1000}
                 onChange={(e) => {
                   const v = Math.max(1, Math.min(1000, Number(e.target.value)));
                   setScanDays(v);
                   setSelectedNode(null);
                   selectedNodeRef.current = null;
                 }}
                 className="w-16 bg-[#0c0c16] text-[#00ff88] border border-[#3e3e6b] rounded px-1.5 py-0.5 text-center text-[11px] font-bold font-mono focus:outline-none focus:border-[#00ff88]"
               />
             )}
          </div>

          {/* Spacious Layout Switch (Spacious Hub mode removes graph, scales indices to massive fullscreen) */}
          <div className="flex bg-[#0a0a1a] p-1 rounded-xl border border-[#232345] shrink-0 font-mono text-[10.5px]">
            <button
               onClick={() => handleSetLayoutMode('briefing-only')}
               className={`px-3 py-1.5 rounded-lg font-black uppercase transition-all flex items-center gap-1.5 cursor-pointer ${
                 layoutMode === 'briefing-only'
                   ? 'bg-cyan-500/15 text-[#00d4ff] border border-cyan-500/30 font-bold'
                   : 'text-slate-500 hover:text-slate-350 border border-transparent'
               }`}
               title="Maximize and expand semantic index briefing layout"
            >
              <LayoutGrid size={13} />
              Spacious Hub
            </button>
            <button
               onClick={() => handleSetLayoutMode('split-graph')}
               className={`px-3 py-1.5 rounded-lg font-black uppercase transition-all flex items-center gap-1.5 cursor-pointer ${
                 layoutMode === 'split-graph'
                   ? 'bg-[#aa44ff]/15 text-[#aa44ff] border border-[#aa44ff]/30 font-bold'
                   : 'text-slate-500 hover:text-slate-350 border border-transparent'
               }`}
               title="Split layout view containing logic canvas alongside dashboard"
            >
              <Network size={13} />
              Dual-Map Split
            </button>
          </div>
        </div>
      </div>

      {/* 2. Interactive Panel Options & Group Toggles */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
        
        {/* Search input field */}
        <div className="lg:col-span-1 relative flex items-center">
          <Search size={14} className="absolute left-3.5 text-slate-400" />
          <input 
            type="text"
            placeholder="Search semantic details..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0b0b16] border border-[#232345] rounded-xl pl-9 pr-8 py-2 text-xs text-slate-200 placeholder-slate-550 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 font-mono"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 p-1 text-slate-400 hover:text-white"
            >
              <X size={10} />
            </button>
          )}
        </div>

        {/* Toggles bar */}
        <div className="lg:col-span-3 flex flex-wrap items-center gap-1.5 bg-[#090911]/80 border border-[#222240] p-1.5 rounded-xl text-[10px] font-black uppercase font-mono tracking-wider overflow-x-auto select-none">
          <span className="text-[9px] text-slate-500 font-bold px-2 flex items-center gap-1.5 shrink-0"><Filter size={11} /> Filter:</span>
          
          <button 
            onClick={() => setShowCategories(!showCategories)}
            className={`px-2 py-1 rounded transition flex items-center gap-1 border ${
              showCategories 
                ? 'bg-[#aa44ff]/15 border-[#aa44ff]/40 text-[#aa44ff]' 
                : 'bg-transparent border-slate-800 text-slate-500 hover:text-slate-400'
            }`}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-[#aa44ff]" /> Modules
          </button>

          <button 
            onClick={() => setShowHabits(!showHabits)}
            className={`px-2 py-1 rounded transition flex items-center gap-1 border ${
              showHabits 
                ? 'bg-[#00ff88]/15 border-[#00ff88]/40 text-[#00ff88]' 
                : 'bg-transparent border-slate-800 text-slate-500 hover:text-slate-400'
            }`}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-[#00ff88]" /> Habits
          </button>

          <button 
            onClick={() => setShowJournals(!showJournals)}
            className={`px-2 py-1 rounded transition flex items-center gap-1 border ${
              showJournals 
                ? 'bg-[#ffaa00]/15 border-[#ffaa00]/40 text-[#ffaa00]' 
                : 'bg-transparent border-slate-800 text-slate-500 hover:text-slate-400'
            }`}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-[#ffaa00]" /> Focus Mood
          </button>

          <button 
            onClick={() => setShowTags(!showTags)}
            className={`px-2 py-1 rounded transition flex items-center gap-1 border ${
              showTags 
                ? 'bg-[#ff6b1a]/15 border-[#ff6b1a]/40 text-[#ff6b1a]' 
                : 'bg-transparent border-slate-800 text-slate-500 hover:text-slate-400'
            }`}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-[#ff6b1a]" /> #Tags
          </button>

          <button 
            onClick={() => setShowPomos(!showPomos)}
            className={`px-2 py-1 rounded transition flex items-center gap-1 border ${
              showPomos 
                ? 'bg-[#ff3366]/15 border-[#ff3366]/40 text-[#ff3366]' 
                : 'bg-transparent border-slate-800 text-slate-500 hover:text-slate-400'
            }`}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-[#ff3366]" /> Pomos
          </button>

          <button 
            onClick={() => setShowFinances(!showFinances)}
            className={`px-2 py-1 rounded transition flex items-center gap-1 border ${
              showFinances 
                ? 'bg-[#ec4899]/15 border-[#ec4899]/40 text-[#ec4899]' 
                : 'bg-transparent border-slate-800 text-slate-500 hover:text-slate-400'
            }`}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-[#ec4899]" /> Ledger
          </button>

          <button 
            onClick={() => setShowSketches(!showSketches)}
            className={`px-2 py-1 rounded transition flex items-center gap-1 border ${
              showSketches 
                ? 'bg-[#3b82f6]/15 border-[#3b82f6]/40 text-[#3b82f6]' 
                : 'bg-transparent border-slate-800 text-slate-500 hover:text-slate-400'
            }`}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]" /> Sketches
          </button>

          <button 
            onClick={() => setShowReminders(!showReminders)}
            className={`px-2 py-1 rounded transition flex items-center gap-1 border ${
              showReminders 
                ? 'bg-slate-300/10 border-slate-400/40 text-slate-350' 
                : 'bg-transparent border-slate-800 text-slate-500 hover:text-slate-400'
            }`}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-slate-300" /> Cues
          </button>
        </div>
      </div>

      {/* 3. Main Split Area: Interactive Knowledge Graph (Left) + Selected Node Inspector (Right) */}
      <div className={`grid grid-cols-1 xl:grid-cols-12 gap-5 relative w-full ${
        layoutMode === 'briefing-only' ? 'min-h-[500px]' : 'h-auto xl:h-[650px] items-stretch'
      }`}>
        
        {/* Left Interactive Graph field */}
        <div className={`bg-[#0a0a14] border border-[#232345] rounded-2xl flex flex-col relative overflow-hidden shadow-[inset_0_0_80px_rgba(0,0,0,0.85)] h-[540px] xl:h-full transition-all duration-300 ${
          layoutMode === 'briefing-only' 
            ? 'hidden' 
            : (layoutMode === 'split-graph' && !selectedNode)
            ? 'col-span-12 xl:col-span-12 animate-fade-in'
            : 'xl:col-span-7 col-span-12'
        }`}>
          
          {/* Overlay Map Key labels */}
          <div className="absolute top-4 left-4 pointer-events-none space-y-1 font-mono select-none bg-[#0a0a14]/65 backdrop-blur-md p-2.5 rounded-xl border border-[#2a2a50]/40 z-10 max-h-56 overflow-y-auto">
             <div className="text-[8.5px] uppercase font-black text-slate-500 border-b border-[#2a2a50]/50 pb-1 mb-1 tracking-widest flex items-center gap-1.5"><Layers size={10} /> Node Map Key</div>
             {showCategories && <div className="text-[10px] text-slate-350 font-bold uppercase tracking-wider flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#aa44ff] shadow-[0_0_8px_rgba(170,68,255,0.4)]" /> Modules</div>}
             <div className="text-[10px] text-slate-350 font-bold uppercase tracking-wider flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#00d4ff] shadow-[0_0_8px_rgba(0,212,255,0.4)]" /> Test Dates</div>
             {showHabits && <div className="text-[10px] text-slate-355 font-bold uppercase tracking-wider flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#00ff88] shadow-[0_0_8px_rgba(0,255,136,0.4)]" /> Daily Habits</div>}
             {showJournals && <div className="text-[10px] text-slate-350 font-bold uppercase tracking-wider flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#ffaa00] shadow-[0_0_8px_rgba(255,170,0,0.4)]" /> Reflections</div>}
             {showTags && <div className="text-[10px] text-slate-350 font-bold uppercase tracking-wider flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#ff6b1a] shadow-[0_0_8px_rgba(255,107,26,0.4)]" /> hashtags</div>}
             {showPomos && <div className="text-[10px] text-slate-350 font-bold uppercase tracking-wider flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#ff3366] shadow-[0_0_8px_rgba(255,51,102,0.4)]" /> Pomos Focus</div>}
             {showFinances && <div className="text-[10px] text-slate-350 font-bold uppercase tracking-wider flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#ec4899] shadow-[0_0_8px_rgba(236,72,153,0.4)]" /> Ledger</div>}
             {showSketches && <div className="text-[10px] text-slate-350 font-bold uppercase tracking-wider flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#3b82f6] shadow-[0_0_8px_rgba(59,130,246,0.4)]" /> Canvas Sketches</div>}
             {showReminders && <div className="text-[10px] text-slate-350 font-bold uppercase tracking-wider flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-slate-350 shadow-[0_0_8px_rgba(200,200,200,0.3)]" /> Due Cues</div>}
          </div>

          {/* Canvas manipulation controls (Floaters) */}
          <div className="absolute right-4 top-4 flex flex-col gap-2 z-10">
            <button 
              onClick={triggerZoomIn}
              title="Zoom In"
              className="p-2 bg-[#0c0c16]/85 hover:bg-[#1f1f3d] border border-[#2a2a50] hover:border-[#3d3d75] rounded-xl text-slate-300 transition-all shadow-md cursor-pointer"
            >
              <ZoomIn size={14} />
            </button>
            <button 
              onClick={triggerZoomOut}
              title="Zoom Out"
              className="p-2 bg-[#0c0c16]/85 hover:bg-[#1f1f3d] border border-[#2a2a50] hover:border-[#3d3d75] rounded-xl text-slate-300 transition-all shadow-md cursor-pointer"
            >
              <ZoomOut size={14} />
            </button>
            <button 
              onClick={triggerResetZoom}
              title="Reset Zoom Viewport"
              className="p-2 bg-[#0c0c16]/85 hover:bg-[#1f1f3d] border border-[#2a2a50] hover:border-[#3d3d75] rounded-xl text-slate-300 transition-all shadow-md cursor-pointer"
            >
              <Maximize2 size={14} />
            </button>
          </div>

          {/* D3 Simulation Tuning Controls (Sliders accordion block at bottom-left) */}
          <div className="absolute left-4 bottom-4 z-10 max-w-xs bg-[#0c0c16]/90 border border-[#2a2a50] rounded-xl shadow-lg p-3 space-y-2 text-[10.5px] font-mono leading-none">
            <div className="flex items-center justify-between font-bold text-[#aa44ff] border-b border-[#202040] pb-1 cursor-pointer">
              <span className="flex items-center gap-1"><Sliders size={12} /> Physics Adjusters</span>
              <button 
                onClick={() => setPhysicsActive(!physicsActive)} 
                className={`text-[8.5px] px-1.5 py-0.5 rounded font-black border uppercase tracking-widest ${
                  physicsActive ? 'bg-[#00ff88]/15 border-[#00ff88]/35 text-[#00ff88]' : 'bg-red-500/15 border-red-500/35 text-red-400'
                }`}
              >
                {physicsActive ? 'Active' : 'Locked'}
              </button>
            </div>
            {physicsActive && (
              <div className="space-y-1.5 py-0.5">
                <div className="space-y-0.5">
                  <div className="flex justify-between text-slate-400 text-[9.5px]">
                    <span>Gravity strength:</span>
                    <span className="text-[#00d4ff] font-bold">{chargeStrength}</span>
                  </div>
                  <input 
                    type="range"
                    min={-350}
                    max={-40}
                    step={10}
                    value={chargeStrength}
                    onChange={(e) => setChargeStrength(Number(e.target.value))}
                    className="w-full h-1 accent-cyan-500 bg-slate-800 rounded-lg appearance-none cursor-ew-resize"
                  />
                </div>
                <div className="space-y-0.5">
                  <div className="flex justify-between text-slate-400 text-[9.5px]">
                    <span>Tether length:</span>
                    <span className="text-[#00d4ff] font-bold">{linkDistance}px</span>
                  </div>
                  <input 
                    type="range"
                    min={30}
                    max={150}
                    step={5}
                    value={linkDistance}
                    onChange={(e) => setLinkDistance(Number(e.target.value))}
                    className="w-full h-1 accent-indigo-500 bg-slate-800 rounded-lg appearance-none cursor-ew-resize"
                  />
                </div>
                <div className="space-y-0.5">
                  <div className="flex justify-between text-slate-400 text-[9.5px]">
                    <span>Bound spacing:</span>
                    <span className="text-[#00d4ff] font-bold">{collisionBuffer}px</span>
                  </div>
                  <input 
                    type="range"
                    min={10}
                    max={45}
                    step={2}
                    value={collisionBuffer}
                    onChange={(e) => setCollisionBuffer(Number(e.target.value))}
                    className="w-full h-1 accent-green-500 bg-slate-800 rounded-lg appearance-none cursor-ew-resize"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Core Interactive HTML5 Canvas */}
          <div className="w-full flex-1 min-h-0 relative">
             <canvas ref={canvasRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />
          </div>
        </div>

        {/* Right Dashboard / Entity Inspector Sidebar (Columns 8 to 12 or full row if graph is hidden) */}
        <div id="inspector-sidebar-panel" className={`bg-[#0c0c16]/95 border border-[#232345] rounded-2xl flex flex-col shadow-2xl relative h-auto overflow-hidden transition-all duration-300 ${
          layoutMode === 'briefing-only' 
            ? 'col-span-12 xl:col-span-12 animate-fade-in' 
            : (layoutMode === 'split-graph' && !selectedNode)
            ? 'hidden'
            : 'xl:col-span-5 col-span-12 xl:h-full animate-fade-in'
        }`}>
          
          {/* HEADER TITLE */}
          <div className="flex justify-between items-center p-4 border-b border-[#202040]/70 bg-[#121225]/40 shrink-0">
             <span className="flex items-center gap-1.5 text-[10.5px] font-black uppercase text-slate-400 font-mono tracking-widest">
               {selectedNode ? <Terminal size={12} className="text-[#00d4ff] animate-pulse" /> : <Activity size={12} className="text-[#aa44ff]" />}
               {selectedNode ? "Entity Context Inspector" : "Semantic Index Briefing"}
             </span>
             {selectedNode && (
               <button 
                 onClick={() => {
                   setSelectedNode(null);
                   selectedNodeRef.current = null;
                   if (simulationRef.current) simulationRef.current.alpha(0.1).restart();
                 }}
                 className="p-1 text-slate-450 hover:text-white hover:bg-slate-800/40 rounded transition cursor-pointer font-bold text-xs"
               >
                 ✕
               </button>
             )}
          </div>

          {/* MAIN SCROLLER SCROLLBAR BODY */}
          <div className={`flex-1 p-4 space-y-4 text-left border-[#202040] scrollbar-thin ${
            layoutMode === 'briefing-only' ? '' : 'overflow-y-auto max-h-full'
          }`}>
            
            {/* INACTIVE STATE: GENERAL TELEMETRY INSIGHTS OVERVIEW */}
            {!selectedNode ? (
              <div className="space-y-6 animate-fade-in font-sans">
                 
                 {/* 1. Large Dynamic Interactive Introduction Banners (dismissable / collapsible) */}
                 {!dismissedIntro ? (
                   <div className="bg-gradient-to-r from-[#12122c] to-[#1f163a] border border-[#aa44ff]/30 rounded-2xl p-5 space-y-3.5 shadow-md relative overflow-hidden">
                     <div className="absolute -right-4 -bottom-4 w-28 h-28 bg-[#aa44ff]/5 rounded-full blur-2xl pointer-events-none" />
                     
                     <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#31315c]/40 pb-2">
                       <div className="flex items-center gap-2">
                         <span className="text-[9px] uppercase tracking-wider font-mono font-black text-[#00ff88] bg-[#00ff88]/10 border border-[#00ff88]/30 px-2 py-0.5 rounded">
                           Cerebral Network Guide
                         </span>
                         <h4 className="text-xs font-black uppercase text-[#aa44ff] font-mono tracking-widest flex items-center gap-1.5">
                           <Sparkles size={13} className="animate-pulse" />
                           LTM Semantic Knowledge Index
                         </h4>
                       </div>
                       <button
                         onClick={() => {
                           setDismissedIntro(true);
                           localStorage.setItem('omnilife_briefing_intro_dismissed', 'true');
                         }}
                         className="text-[9px] font-mono bg-[#111122]/90 hover:bg-[#1a1a36] text-slate-300 hover:text-white border border-[#3e3e6b] px-2.5 py-1 rounded-lg transition-all cursor-pointer font-bold uppercase tracking-wide align-middle"
                       >
                         ✕ Hide Guide Panel
                       </button>
                     </div>
                     
                     <p className="text-[11.5px] text-slate-300 leading-normal font-semibold">
                       The LTM (Long-Term Memory) engine scans and indexes your personal workspace instances—linking 
                       days with journals, habits, focused pomodoros, financial ledgers, sketches, tags, and cues into an interactive, spatial neural map.
                     </p>

                     {/* Compact 3-Column Protocol Row */}
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-3.5 text-[10.5px]">
                       <div className="space-y-1">
                         <strong className="text-cyan-400 font-mono uppercase text-[9px] tracking-wider block">1. what is it?</strong>
                         <p className="text-slate-400 select-none leading-relaxed animate-none">
                           A living semantic web representing chronological logs, habit metrics, hashtag relations, and notes in direct network graphs.
                         </p>
                       </div>
                       <div className="space-y-1">
                         <strong className="text-[#00ff88] font-mono uppercase text-[9px] tracking-wider block">2. how it works</strong>
                         <p className="text-slate-400 select-none leading-relaxed animate-none">
                           Nodes automatically anchor to each other when they share hashtags, categories, or the same creation date, forming connected memory hubs.
                         </p>
                       </div>
                       <div className="space-y-1">
                         <strong className="text-[#ffaa00] font-mono uppercase text-[9px] tracking-wider block">3. how to use</strong>
                         <p className="text-slate-400 select-none leading-relaxed animate-none">
                           Click any dot or query item to inspect properties. Tap <strong>Spacious Hub</strong> above to turn this panel into a massive full-width workspace dashboard.
                         </p>
                       </div>
                     </div>
                   </div>
                 ) : (
                   <div className="bg-[#12122c]/40 border border-[#232345] rounded-xl p-3 flex justify-between items-center text-[11px] font-mono text-slate-400">
                     <div className="flex items-center gap-2">
                       <HelpCircle size={13} className="text-[#00d4ff]" />
                       <span>
                         💡 <strong className="text-slate-200">LTM Mode Active</strong>: Timestamps, hashtags, and focused tasks are semantic hubs. Switch layout mode above at any time.
                       </span>
                     </div>
                     <button
                       onClick={() => {
                         setDismissedIntro(false);
                         localStorage.setItem('omnilife_briefing_intro_dismissed', 'false');
                       }}
                       className="text-[9px] hover:text-[#00d4ff] hover:border-[#00d4ff]/40 transition bg-[#0a0a1a] px-2.5 py-1 rounded-lg border border-slate-800 font-bold uppercase font-mono tracking-wide cursor-pointer"
                     >
                       Help Manual
                     </button>
                   </div>
                 )}

                 {/* 2. Side-By-Side Grid: Left (Metrics + Shortcuts) & Right (Registry search grid) */}
                 <div className={layoutMode === 'briefing-only' ? 'grid grid-cols-1 lg:grid-cols-12 gap-5 items-start' : 'space-y-5'}>
                   
                   {/* Left Cohort Block: Metrics and references */}
                   <div className={`${layoutMode === 'briefing-only' ? 'lg:col-span-4' : 'w-full'} space-y-4`}>
                     
                     {/* Basic Stats Grid summaries */}
                     <div className="bg-[#050512] border border-[#1e1e3b] p-4 rounded-xl space-y-3">
                       <span className="text-[9.5px] uppercase tracking-widest text-slate-400 font-black font-mono block">
                         Telemetry Stats:
                       </span>
                       
                       <div className="grid grid-cols-2 gap-2.5">
                         <div className="bg-[#0a0a20] border border-[#1e1e3b] p-2.5 rounded-lg space-y-0.5 block relative">
                           <span className="text-[8px] uppercase tracking-wider text-slate-500 font-bold block font-mono">Diary logs:</span>
                           <span className="text-xs font-extrabold text-white block flex items-center gap-1 mt-0.5">
                             <Notebook size={11} className="text-[#00d4ff]" /> {graphGeneralStats.totalJournals} Logged
                           </span>
                         </div>

                         <div className="bg-[#0a0a20] border border-[#1e1e3b] p-2.5 rounded-lg space-y-0.5 block relative">
                           <span className="text-[8px] uppercase tracking-wider text-slate-500 font-bold block font-mono">Average mood:</span>
                           <span className="text-xs font-extrabold text-[#ffaa00] block flex items-center gap-1 mt-0.5">
                             <Smile size={11} className="text-[#ffaa00]" /> {graphGeneralStats.avgMood} / 5
                           </span>
                         </div>

                         <div className="bg-[#a0a20]/10 border border-[#1e1e3b] p-2.5 rounded-lg space-y-0.5 block relative">
                           <span className="text-[8px] uppercase tracking-wider text-slate-500 font-bold block font-mono">Focused time:</span>
                           <span className="text-xs font-extrabold text-[#ff3366] block flex items-center gap-1 mt-0.5">
                             <Timer size={11} className="text-[#ff3366]" /> {graphGeneralStats.pomoHours}h 
                           </span>
                         </div>

                         <div className="bg-[#a0a20]/10 border border-[#1e1e3b] p-2.5 rounded-lg space-y-0.5 block relative">
                           <span className="text-[8px] uppercase tracking-wider text-slate-500 font-bold block font-mono">Disbursed:</span>
                           <span className="text-xs font-extrabold text-[#ec4899] block flex items-center gap-1 mt-0.5 font-mono">
                             <DollarSign size={11} className="text-[#ec4899]" /> ${graphGeneralStats.totalSpent}
                           </span>
                         </div>
                       </div>
                     </div>

                     {/* Concept Tag Cloud */}
                     {graphGeneralStats.topTags.length > 0 && (
                       <div className="bg-[#050512] border border-[#1e1e3b] p-4 rounded-xl space-y-3">
                         <span className="text-[9.5px] uppercase tracking-widest text-[#ff6b1a] font-black font-mono block">
                           Frequently Tagged Concepts:
                         </span>
                         <div className="flex flex-wrap gap-1.5">
                           {graphGeneralStats.topTags.map(([tag, freq]) => (
                             <button 
                               key={tag}
                               onClick={() => handleSelectNodeById(`tag_${tag}`)}
                               className="text-[10px] font-bold px-2.5 py-1 bg-[#121226] border border-[#ff6b1a]/30 hover:border-[#ff6b1a]/70 rounded-lg text-[#ff6b1a] transition-all flex items-center gap-1 cursor-pointer font-mono hover:scale-105 active:scale-95"
                             >
                               <Tag size={10} /> #{tag} <span className="bg-[#ff6b1a]/15 text-[8.5px] px-1 rounded-sm text-slate-350">{freq}</span>
                             </button>
                           ))}
                         </div>
                       </div>
                     )}

                     {/* Help references */}
                     <div className="bg-[#050512] border border-[#1e1e3b] p-3 rounded-xl border-t border-[#202040] text-[10px] text-slate-500 leading-normal space-y-1 font-mono uppercase">
                       <div className="flex items-center gap-1.5"><Compass size={11} className="text-slate-400" /> Interaction protocol cues:</div>
                       <p className="font-semibold select-none text-[8px] pl-1 relative shrink-0 lowercase">// Scroll: adjust zoom level</p>
                       <p className="font-semibold select-none text-[8px] pl-1 relative shrink-0 lowercase">// DRAG EMPTY Space: pan map view</p>
                       <p className="font-semibold select-none text-[8px] pl-1 relative shrink-0 lowercase">// DRAG circular node: custom pinning</p>
                     </div>

                   </div>

                   {/* Right Cohort Block: Node Listing registry (col-span-7) */}
                   <div className={`${layoutMode === 'briefing-only' ? 'lg:col-span-8 h-auto' : 'w-full'} space-y-3 bg-[#050512] border border-[#1e1e3b] p-4 rounded-xl flex flex-col min-h-[300px]`}>
                     
                     <div className="flex justify-between items-center pb-1 border-b border-[#202040]/50">
                       <span className="text-[10px] uppercase tracking-widest text-[#00d4ff] font-black font-mono block text-left">
                         Live Node Registry ({filteredNodesRegistry.length} elements)
                       </span>
                       {searchQuery && (
                         <span className="text-[9.5px] text-[#00ff88] font-mono uppercase bg-[#00ff88]/10 px-2 py-0.5 rounded border border-[#00ff88]/20 h-fit">
                           Filtered
                         </span>
                       )}
                     </div>

                     <p className="text-[11px] text-slate-400 font-sans leading-normal">
                       Located {filteredNodesRegistry.length} matching entities within selected timeline scan. Click any row to center relations and inspect properties.
                     </p>

                     <div className={`grid gap-2 ${layoutMode === 'briefing-only' ? '' : 'overflow-y-auto pr-1 scrollbar-thin'} ${
                        layoutMode === 'briefing-only'
                          ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3'
                          : 'grid-cols-1 sm:grid-cols-2 max-h-[380px]'
                      }`}>
                       {filteredNodesRegistry.slice(0, layoutMode === 'briefing-only' ? 400 : 40).map(node => {
                          let IconComponent = Compass;
                          if (node.group === 'day') IconComponent = Calendar;
                          else if (node.group === 'journal') IconComponent = Notebook;
                          else if (node.group === 'habit') IconComponent = CheckSquare;
                          else if (node.group === 'pomo') IconComponent = Timer;
                          else if (node.group === 'finance') IconComponent = DollarSign;
                          else if (node.group === 'sketch') IconComponent = PenTool;
                          else if (node.group === 'reminder') IconComponent = Bell;
                          else if (node.group === 'tag') IconComponent = Tag;
                          else if (node.group === 'category') IconComponent = Layers;

                          return (
                            <button
                              key={node.id}
                              onClick={() => handleSelectNodeById(node.id)}
                              className="flex items-center justify-between p-2.5 bg-[#0a0a20] hover:bg-[#121235] border border-[#202040] hover:border-cyan-500 rounded-xl text-left transition duration-150 group cursor-pointer hover:scale-[1.01]"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                 <div 
                                   className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border"
                                   style={{ 
                                     backgroundColor: `${node.color}15`, 
                                     borderColor: `${node.color}45`, 
                                     color: node.color 
                                   }}
                                 >
                                   <IconComponent size={14} />
                                 </div>
                                 <div className="min-w-0">
                                   <strong className="text-white text-[11px] block truncate group-hover:text-cyan-400 font-sans leading-tight">
                                     {node.label}
                                   </strong>
                                   <span className="text-[8.5px] font-mono text-slate-500 uppercase tracking-wider block leading-none mt-0.5">
                                     {node.group}
                                   </span>
                                 </div>
                              </div>
                              <ChevronRight size={12} className="text-slate-600 group-hover:text-cyan-400 transition pr-0.5 shrink-0" />
                            </button>
                          );
                       })}
                       {filteredNodesRegistry.length > (layoutMode === 'briefing-only' ? 400 : 40) && (
                         <div className="text-[9.5px] col-span-full text-slate-500 font-mono text-center pt-2 lowercase italic border-t border-[#202040]/30">
                           // showing top {layoutMode === 'briefing-only' ? 400 : 40} of {filteredNodesRegistry.length} nodes (use search bar to expand filters)
                         </div>
                       )}
                       {filteredNodesRegistry.length === 0 && (
                         <div className="col-span-full text-[10px] text-slate-500 font-mono text-center py-8 uppercase font-bold border border-dashed border-[#202040]/65 rounded-xl leading-normal">
                           No indexed nodes match<br/>your search query
                         </div>
                       )}
                     </div>
                   </div>

                 </div>
              </div>
            ) : (
              
              /* ACTIVE STATE: FULL CONTEXT REPORTING ON SELECTION */
              <div className="space-y-4 animate-fade-in font-sans">
                 
                 {/* Type identification tag badge */}
                 <div className="flex items-center justify-between border-b border-[#202040]/80 pb-2">
                   <span 
                     className="text-[9px] font-mono font-black uppercase inline-block px-2.5 py-0.5 rounded tracking-widest border shrink-0 text-white shadow-sm"
                     style={{ backgroundColor: `${selectedNode.color}15`, borderColor: `${selectedNode.color}50`, color: selectedNode.color }}
                   >
                     {selectedNode.group} Node
                   </span>
                   {selectedNode.rawData?.dateStr && (
                     <span className="text-[10.5px] font-mono text-slate-400 font-bold flex items-center gap-1">
                       <Calendar size={11} /> {formatDateLabel(selectedNode.rawData.dateStr)}
                     </span>
                   )}
                 </div>

                 {/* Title banner */}
                 <div>
                   <h3 className="text-base font-extrabold text-white leading-tight mt-0.5">
                     {selectedNode.group === 'day' 
                       ? `Chronicle: ${formatDateLabel(selectedNode.rawData?.dateStr)}` 
                       : selectedNode.label}
                   </h3>
                   <p className="text-[11px] text-slate-400 leading-normal mt-1.5 font-semibold">
                     {selectedNode.desc}
                   </p>
                 </div>

                 {/* CONTEXT RICH CONTENT RENDERING */}
                 <div className="border-t border-[#202040] pt-3.5 space-y-3.5 max-h-[350px] overflow-y-auto pr-1">
                    
                    {/* A. VIEWING DAY NODE SUMMARY */}
                    {selectedNode.group === 'day' && (() => {
                      const dt = selectedNode.rawData?.dateStr;
                      const dailyLog = state.daily[dt] || {};
                      const jrn = state.journals[dt];
                      const pomos = (state.pomoSessions || []).filter(p => p.date === dt);
                      const finances = (state.finances || []).filter(f => f.date === dt);
                      const reminding = (state.reminders || []).filter(r => r.dueDate === dt);
                      const sketches = (state.sketches || []).filter(s => s.date === dt);

                      const hasDirectAnyInfo = jrn || Object.keys(dailyLog).length > 0 || pomos.length > 0 || finances.length > 0 || reminding.length > 0 || sketches.length > 0;

                      if (!hasDirectAnyInfo) {
                        return <p className="text-[11px] text-slate-500 font-mono text-center py-4 uppercase font-bold">No registered data instances for this database node</p>;
                      }

                      return (
                        <div className="space-y-4 text-xs font-sans">
                           
                           {/* Day Reflection Snippet */}
                           {jrn && (
                             <div className="bg-[#121226] border-l-2 border-[#ffaa00] p-2.5 rounded-r-lg space-y-1">
                               <div className="flex justify-between text-[9px] font-mono font-bold text-[#ffaa00] uppercase">
                                 <span>Reflections Summary</span>
                                 <span>Mood: {jrn.mood || 'N/A'}/5</span>
                               </div>
                               {jrn.tags && jrn.tags.length > 0 && (
                                 <div className="flex flex-wrap gap-1 text-[8.5px] text-slate-400">
                                   {jrn.tags.map(t => <span key={t} className="bg-slate-900 px-1 rounded-sm">#{t}</span>)}
                                 </div>
                               )}
                               <p className="text-[11px] text-slate-200 leading-snug italic line-clamp-3 mt-1.5">
                                 "{Object.values(jrn.sections || {}).find(v => v && v.trim().length > 0) || 'Unrecorded entries'}"
                               </p>
                             </div>
                           )}

                           {/* Custom Habits lists */}
                           {Object.keys(dailyLog).length > 0 && (
                             <div className="space-y-1.5">
                               <div className="text-[9px] uppercase font-mono tracking-widest text-[#00ff88] font-black">Logged Habits Entries</div>
                               <div className="bg-[#050510] border border-[#202040]/50 rounded-xl overflow-hidden p-2.5 space-y-2">
                                  {Object.entries(dailyLog).map(([catId, catItems]) => {
                                      const catItemEntries = Object.entries(catItems).filter(([_, e]) => e.status === 'done' || e.reps > 0);
                                      if (catItemEntries.length === 0) return null;
                                      return (
                                        <div key={catId} className="space-y-1">
                                          <div className="text-[8.5px] font-mono uppercase font-black text-slate-500">{getCatLabel(state, catId)}</div>
                                          <div className="space-y-1 pl-1.5 border-l border-slate-800">
                                            {catItemEntries.map(([itemName, entry]) => (
                                              <div key={itemName} className="flex justify-between items-center text-[11px]">
                                                <span className="text-slate-300 font-semibold">{itemName}</span>
                                                <span className="text-[#00ff88] font-mono bg-[#00ff88]/10 px-1 rounded text-[10px]">{entry.reps > 0 ? `${entry.reps} reps` : 'complete'}</span>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      );
                                  })}
                               </div>
                             </div>
                           )}

                           {/* Pomodoros Focus */}
                           {pomos.length > 0 && (
                             <div className="space-y-1.5">
                               <div className="text-[9px] uppercase font-mono tracking-widest text-[#ff3366] font-black">Completed Deep Work Sessions</div>
                               <div className="bg-[#050510] border border-[#202040]/50 rounded-xl p-2.5 divide-y divide-[#1e1e35] space-y-1.5">
                                 {pomos.map((p, i) => (
                                   <div key={p.id || i} className="flex justify-between text-[11px] pt-1.5 first:pt-0">
                                      <span className="text-slate-200 truncate pr-2 font-semibold">⚡ {p.task || 'Flow focus'}</span>
                                      <span className="text-slate-400 font-mono shrink-0">{p.duration} mins</span>
                                   </div>
                                 ))}
                               </div>
                             </div>
                           )}

                           {/* Financial Records ledger */}
                           {finances.length > 0 && (
                             <div className="space-y-1.5">
                               <div className="text-[9px] uppercase font-mono tracking-widest text-[#ec4899] font-black">unified transaction ledger</div>
                               <div className="bg-[#050510] border border-[#202040]/50 rounded-xl p-2.5 divide-y divide-[#1e1e35] space-y-1.5">
                                 {finances.map((f, i) => (
                                   <div key={f.id || i} className="flex justify-between text-[11px] pt-1.5 first:pt-0">
                                      <span className="text-slate-300 truncate pr-2 font-semibold">💸 {f.concept} <span className="text-[9px] uppercase font-mono text-slate-500">[{f.category || 'General'}]</span></span>
                                      <span className="text-rose-400 font-mono shrink-0">-${f.amount}</span>
                                   </div>
                                 ))}
                               </div>
                             </div>
                           )}

                           {/* Canvas sketches thumbnails */}
                           {sketches.length > 0 && (
                             <div className="space-y-1.5">
                               <div className="text-[9px] uppercase font-mono tracking-widest text-[#3b82f6] font-black">Interactive Canvas Sketches</div>
                               <div className="grid grid-cols-2 gap-2">
                                  {sketches.map((s, idx) => (
                                    <div key={s.id || idx} className="bg-[#050510] border border-[#202042] rounded-lg p-1.5 hover:border-blue-500 transition-all cursor-pointer" onClick={() => setPreviewSketch(s.dataUrl)}>
                                       <img referrerPolicy="no-referrer" src={s.dataUrl} alt={s.title} className="w-full h-14 object-cover rounded" />
                                       <div className="text-[8px] text-slate-400 font-bold truncate mt-1 text-center font-mono uppercase">{s.title || 'Untitled Sketch'}</div>
                                    </div>
                                  ))}
                               </div>
                             </div>
                           )}

                           {/* Due cues milestones */}
                           {reminding.length > 0 && (
                             <div className="space-y-1.5">
                               <div className="text-[9px] uppercase font-mono tracking-widest text-slate-400 font-black">Agendas & Reminders Due</div>
                               <div className="bg-[#050510] border border-[#202042] rounded-xl p-2.5 divide-y divide-[#1e1e35] space-y-1.5">
                                  {reminding.map((r, i) => (
                                    <div key={r.id || i} className="flex justify-between text-[11px] pt-1.5 first:pt-0 pb-0.5">
                                       <span className="text-slate-200 font-semibold truncate pr-2">🔔 {r.title}</span>
                                       <span className="text-[9px] font-mono px-1.5 py-0.5 rounded uppercase font-black tracking-widest" style={{
                                          color: r.priority === 'high' ? '#f43f5e' : r.priority === 'medium' ? '#fbbf24' : '#10b981',
                                          backgroundColor: r.priority === 'high' ? 'rgba(244,63,94,0.1)' : r.priority === 'medium' ? 'rgba(251,191,36,0.1)' : 'rgba(16,185,129,0.1)'
                                       }}>{r.priority}</span>
                                    </div>
                                  ))}
                               </div>
                             </div>
                           )}
                        </div>
                      );
                    })()}

                    {/* B. VIEWING JOURNAL DEEP DIVE RESPONSE */}
                    {selectedNode.group === 'journal' && (() => {
                      const jrn: JournalEntry = selectedNode.rawData;
                      const prompts = state.journalPrompts || [];
                      
                      return (
                        <div className="space-y-3.5 font-sans">
                           <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="bg-[#050513] border border-[#222240] p-2 rounded-xl text-center">
                                <span className="text-[8px] uppercase tracking-wider text-slate-500 font-medium block">Mood rating:</span>
                                <span className="text-base font-black text-[#ffaa00]">{jrn.mood} / 5</span>
                              </div>
                              <div className="bg-[#050513] border border-[#222240] p-2 rounded-xl text-center">
                                <span className="text-[8px] uppercase tracking-wider text-slate-500 font-bold block">Energy Score:</span>
                                <span className="text-base font-black text-[#00d4ff]">{jrn.energy} / 5</span>
                              </div>
                           </div>

                           {/* Associated Tags list inside widget */}
                           {jrn.tags && jrn.tags.length > 0 && (
                             <div className="space-y-1 pt-1">
                               <span className="text-[8.5px] uppercase tracking-wider text-slate-500 font-semibold block">Reflection Categories:</span>
                               <div className="flex flex-wrap gap-1">
                                 {jrn.tags.map(t => (
                                   <button 
                                     key={t} 
                                     onClick={() => handleSelectNodeById(`tag_${t.trim().toLowerCase()}`)}
                                     className="text-[9.5px] font-bold px-2 py-0.5 bg-[#121226] border border-[#ff6b1a]/30 rounded-md text-[#ff6b1a] hover:border-[#ff6b1a]/80 cursor-pointer"
                                   >
                                     #{t}
                                   </button>
                                 ))}
                               </div>
                             </div>
                           )}

                           {/* Section response prompt mappings */}
                           <div className="space-y-3 pt-2">
                             <span className="text-[9.5px] uppercase tracking-widest text-slate-400 font-black block">Diary Section answers:</span>
                             <div className="space-y-3 divide-y divide-[#1e1e3b]">
                                {prompts.map(p => {
                                   const ans = jrn.sections?.[p.id];
                                   if (!ans || !ans.trim()) return null;
                                   return (
                                     <div key={p.id} className="pt-2.5 first:pt-0 text-[11px] leading-snug space-y-1">
                                       <div className="text-xs font-black text-[#ffaa00]">{p.label}</div>
                                       <p className="text-slate-300 whitespace-pre-wrap pl-1.5 border-l border-[#2e2e5c] font-medium font-sans">
                                         {ans}
                                       </p>
                                     </div>
                                   );
                                })}
                             </div>
                           </div>
                        </div>
                      );
                    })()}

                    {/* C. VIEWING HABIT INSTANCE ON DATE SUMMARY */}
                    {selectedNode.group === 'habit' && (() => {
                      const data = selectedNode.rawData;
                      const itemsList: Array<{ name: string; info: any }> = data.list || [];
                      
                      return (
                        <div className="space-y-4 text-[11px] font-sans">
                            <div className="p-3 bg-[#050512] border border-[#202042] rounded-xl flex items-center justify-between text-slate-300">
                               <div className="space-y-0.5">
                                 <span className="text-[8.5px] text-slate-550 block font-mono uppercase font-black">Logged Habits tracks:</span>
                                 <span className="text-sm font-extrabold text-white uppercase">{getCatLabel(state, data.catId)}</span>
                               </div>
                               <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded border border-emerald-500/35 font-mono uppercase">
                                 Completed
                               </span>
                            </div>

                            <div className="space-y-2">
                               <span className="text-[9.5px] uppercase tracking-widest text-[#00ff88] font-black font-mono block">Tactical completion ledger:</span>
                               <div className="space-y-2.5">
                                 {itemsList.map(item => (
                                   <div key={item.name} className="p-2.5 bg-[#121226]/50 border border-[#22223c]/50 rounded-xl space-y-1 hover:border-[#383868] transition">
                                      <div className="flex justify-between items-center">
                                         <strong className="text-slate-100 text-xs">{item.name}</strong>
                                         <span className="text-[#00ff88] font-mono text-[10px] font-bold bg-[#00ff88]/10 px-1 py-0.5 rounded">Reps: {item.info.reps || 1}</span>
                                      </div>
                                      {item.info.notes && (
                                        <p className="text-slate-400 leading-normal italic text-[10.5px] pl-1.5 border-l border-slate-700 mt-1">
                                           "{item.info.notes}"
                                        </p>
                                      )}
                                   </div>
                                 ))}
                               </div>
                            </div>
                        </div>
                      );
                    })()}

                    {/* D. VIEWING TAG LOGS FREQUENCY & LINK LISTINGS */}
                    {selectedNode.group === 'tag' && (() => {
                      const tagClean = selectedNode.rawData.tag;
                      
                      // Scan dates with journals matching this hashtag
                      const matchingEntries = Object.entries(state.journals || {})
                        .filter(([_, jrn]) => jrn.tags && jrn.tags.map(t => t.toLowerCase().trim()).includes(tagClean))
                        .map(([dt, jrn]) => ({ date: dt, journal: jrn }));

                      return (
                        <div className="space-y-4 text-xs font-sans">
                           <div className="flex justify-between p-3 bg-slate-900/40 border border-[#ff6b1a]/35 rounded-xl text-slate-350">
                              <span className="font-semibold flex items-center gap-1">📍 Total tag weight:</span>
                              <span className="text-salmon-400 font-black text-rose-400 font-mono tracking-wide">{matchingEntries.length} entries</span>
                           </div>

                           <div className="space-y-2">
                              <span className="text-[9px] uppercase tracking-widest text-[#ff6b1a] font-black font-mono block">Direct chronological occurrences:</span>
                              <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                                {matchingEntries.map(ent => (
                                  <button 
                                    key={ent.date}
                                    onClick={() => handleSelectNodeById(`jrn_${ent.date}`)}
                                    className="w-full flex items-center justify-between text-left p-2.5 bg-[#050510] hover:bg-[#12122b] border border-[#222240] hover:border-[#ff6b1a]/40 rounded-xl transition duration-150 group cursor-pointer"
                                  >
                                    <div className="space-y-0.5 pr-2">
                                      <span className="text-[#00d4ff] font-mono font-bold block text-[11px] group-hover:underline">{formatDateLabel(ent.date)}</span>
                                      <p className="text-slate-400 text-[10.5px] line-clamp-1 italic font-medium leading-none">
                                        "{Object.values(ent.journal.sections || {}).find(v => v) || 'Unrecorded notes'}"
                                      </p>
                                    </div>
                                    <span className="text-[10px] text-[#ffaa00] shrink-0 font-mono font-bold bg-[#ffaa00]/10 px-1 py-0.5 rounded">★ {ent.journal.mood}</span>
                                  </button>
                                ))}
                              </div>
                           </div>
                        </div>
                      );
                    })()}

                    {/* E. VIEWING POMO SESSIONS BREAKDOWN */}
                    {selectedNode.group === 'pomo' && (() => {
                      const pomos: PomoSession[] = selectedNode.rawData;
                      const completed = pomos.filter(p => p.status === 'completed');
                      const sumMins = pomos.reduce((total, p) => total + (p.duration || 0), 0);

                      return (
                        <div className="space-y-3.5 font-sans">
                           <div className="p-3 bg-[#0a0a18] border border-[#ff3366]/30 rounded-xl grid grid-cols-2 text-center text-xs gap-1 leading-normal text-slate-350">
                              <div className="border-r border-[#1e1e3d]">
                                <span className="font-semibold block text-[9px] uppercase tracking-wider text-slate-500">Focus sum:</span>
                                <strong className="text-sm text-white font-mono">{sumMins} mins</strong>
                              </div>
                              <div>
                                <span className="font-semibold block text-[9px] uppercase tracking-wider text-slate-500">Concluded count:</span>
                                <strong className="text-sm text-emerald-400 font-mono">{completed.length} sessions</strong>
                              </div>
                           </div>

                           <div className="space-y-1.5">
                             <span className="text-[9px] uppercase tracking-widest font-black font-mono text-[#ff3366] block">Tactical work sessions ledger:</span>
                             <div className="bg-[#050510] border border-[#202042] rounded-xl overflow-hidden divide-y divide-[#181836] shadow-sm">
                               {pomos.map((p, idx) => (
                                 <div key={p.id || idx} className="p-2.5 hover:bg-[#121226]/40 transition text-[11.5px] leading-normal flex items-start justify-between">
                                    <div className="space-y-1 pr-2">
                                       <div className="font-extrabold text-[#e2e8f0] line-clamp-1">{p.task || 'Undefined deep work task'}</div>
                                       <span className="text-[10px] uppercase font-mono tracking-wider font-extrabold text-slate-500 bg-[#16162a]/80 px-1.5 py-0.5 rounded border border-[#2a2a4c]">{getCatLabel(state, p.cat)}</span>
                                    </div>
                                    <div className="text-right shrink-0">
                                       <span className="text-[#ff3366] font-mono block font-bold">{p.duration} mins</span>
                                       <span className="text-[8.5px] uppercase font-bold px-1 rounded-sm mt-0.5 inline-block" style={{
                                          color: p.status === 'completed' ? '#00ff88' : '#ef4444',
                                          backgroundColor: p.status === 'completed' ? 'rgba(0,255,136,0.1)' : 'rgba(239,68,68,0.1)'
                                       }}>{p.status}</span>
                                    </div>
                                 </div>
                               ))}
                             </div>
                           </div>
                        </div>
                      );
                    })()}

                    {/* F. VIEWING UNIFIED FINANCE LEDGER ACTIVITY */}
                    {selectedNode.group === 'finance' && (() => {
                      const ledger: ExpeditionExpense[] = selectedNode.rawData;
                      const totalOutlay = ledger.reduce((acc, curr) => acc + (curr.amount || 0), 0);

                      return (
                        <div className="space-y-3.5 font-sans">
                           <div className="p-3 bg-[#0a0a18] border border-[#ec4899]/35 rounded-xl flex justify-between items-center text-xs">
                              <span className="font-semibold text-slate-400">💰 Cumulative outlay:</span>
                              <strong className="text-base text-rose-400 font-mono font-black">${totalOutlay.toFixed(2)}</strong>
                           </div>

                           <div className="space-y-1.5">
                              <span className="text-[9.5px] uppercase tracking-widest font-black font-mono text-[#ec4899] block">Expenditure listings:</span>
                              <div className="bg-[#050510] border border-[#202042] rounded-xl overflow-hidden divide-y divide-[#1e1e3b] shadow-sm">
                                {ledger.map((f, idx) => (
                                  <div key={f.id || idx} className="p-2.5 flex justify-between items-center text-[11px] font-sans">
                                     <div className="space-y-0.5 pr-2">
                                        <div className="font-bold text-slate-100">{f.concept}</div>
                                        <span className="text-[9px] uppercase font-mono tracking-wider font-extrabold text-slate-500 bg-[#121226] px-1.5 py-0.5 rounded">{f.category || 'Ledger'}</span>
                                     </div>
                                     <span className="text-rose-450 font-mono font-extrabold text-rose-400">-${f.amount} {f.currency}</span>
                                  </div>
                                ))}
                              </div>
                           </div>
                        </div>
                      );
                    })()}

                    {/* G. PERSISTENT CATEGORY VIEW (MODULES) */}
                    {selectedNode.group === 'category' && (() => {
                      const cat = selectedNode.rawData;
                      
                      // Count appearances of items listed in this category on state.daily
                      let overallLogCount = 0;
                      Object.values(state.daily || {}).forEach(dayContent => {
                        const sub = dayContent[cat.id];
                        if (sub) {
                          const hasDone = Object.values(sub).some(entry => entry.status === 'done' || entry.reps > 0);
                          if (hasDone) overallLogCount++;
                        }
                      });

                      const itemsGroup = state.items?.[cat.id] || [];

                      return (
                        <div className="space-y-4 text-xs font-sans">
                           <div className="grid grid-cols-2 gap-2 text-center leading-normal">
                              <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                                <span className="text-[8px] uppercase tracking-wider text-slate-500 block">Scanned log count:</span>
                                <strong className="text-sm text-[#aa44ff] font-mono font-extrabold">{overallLogCount} times</strong>
                              </div>
                              <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                                <span className="text-[8px] uppercase tracking-wider text-slate-500 block">Tracking scope:</span>
                                <strong className="text-sm text-[#00d4ff] font-mono font-extrabold">{itemsGroup.length} elements</strong>
                              </div>
                           </div>

                           <div className="space-y-2 pt-1 font-sans">
                              <span className="text-[9.5px] uppercase tracking-widest font-black font-mono text-[#aa44ff] block">Sub-elements compiled in tracker:</span>
                              <div className="flex flex-wrap gap-1.5">
                                 {itemsGroup.length > 0 ? itemsGroup.map(item => (
                                   <div key={item} className="text-[10px] font-bold px-2 py-1 bg-[#121226] border border-[#2a2a50] rounded-lg text-slate-350">
                                     {item}
                                   </div>
                                 )) : (
                                   <p className="text-[10.5px] font-mono text-slate-500 lowercase italic">// no static trackers item mapped</p>
                                 )}
                              </div>
                           </div>
                        </div>
                      );
                    })()}

                    {/* H. CANCES SKETCH VIEW */}
                    {selectedNode.group === 'sketch' && (() => {
                      const sketches: SketchEntry[] = selectedNode.rawData;

                      return (
                        <div className="space-y-3 font-sans">
                           <span className="text-[9.5px] uppercase tracking-widest font-black font-mono text-[#3b82f6] block">Canvas drawings checklist:</span>
                           <div className="grid grid-cols-1 gap-3">
                              {sketches.map((s, idx) => (
                                 <div key={s.id || idx} className="bg-slate-950 border border-slate-800 rounded-xl p-2 space-y-2 hover:border-blue-500 transition duration-150">
                                    <div className="flex justify-between items-center">
                                       <span className="text-white text-xs font-bold leading-none pr-2">{s.title || 'Untitled Sketch'}</span>
                                       <span className="text-[8.5px] font-mono text-slate-550 shrink-0 uppercase">{s.date}</span>
                                    </div>
                                    <img 
                                      referrerPolicy="no-referrer"
                                      src={s.dataUrl} 
                                      alt={s.title} 
                                      className="w-full h-36 object-cover rounded border border-slate-900 cursor-zoom-in" 
                                      onClick={() => setPreviewSketch(s.dataUrl)}
                                    />
                                    <div className="text-[9px] text-[#3b82f6] text-center font-bold tracking-widest uppercase py-0.5 bg-blue-900/10 rounded">
                                      Click sketch image to enlarge
                                    </div>
                                 </div>
                              ))}
                           </div>
                        </div>
                      );
                    })()}

                    {/* I. Agendas reminders due detail view */}
                    {selectedNode.group === 'reminder' && (() => {
                      const reminders: Reminder[] = selectedNode.rawData;

                      return (
                        <div className="space-y-3 font-sans">
                           <span className="text-[9.5px] uppercase tracking-widest font-black font-mono text-slate-400 block">agenda triggers due:</span>
                           <div className="space-y-2.5">
                             {reminders.map((r, idx) => (
                               <div key={r.id || idx} className="p-3 bg-[#111124] border border-[#202042] rounded-xl space-y-1 text-slate-300 relative">
                                  <div className="absolute right-3 top-3 w-2 h-2 rounded-full" style={{
                                     backgroundColor: r.priority === 'high' ? '#f43f5e' : r.priority === 'medium' ? '#fbbf24' : '#10b981'
                                  }} />
                                  <strong className="text-white text-xs block font-bold pr-4">{r.title}</strong>
                                  {r.notes ? (
                                    <p className="text-[10.5px] text-slate-400 leading-normal italic pl-1 border-l border-slate-700 mt-1">
                                      "{r.notes}"
                                    </p>
                                  ) : (
                                    <p className="text-[9.5px] font-mono text-slate-500 italic uppercase">// no additional warnings notes</p>
                                  )}
                                  <div className="flex gap-2.5 text-[9px] font-mono text-slate-500 pt-1 border-t border-[#1a1a36] mt-2 select-all uppercase">
                                     <span>⏰ Alert: {r.time || 'All Day'}</span>
                                     <span>Status: <strong style={{ color: r.status === 'done' ? '#00ff88' : '#fbbf24' }}>{r.status}</strong></span>
                                  </div>
                               </div>
                             ))}
                           </div>
                        </div>
                      );
                    })()}

                 </div>

                 {/* DIRECT PORTAL ACTION - REDIRECT BUTTON TO ACTIVE VIEW CONTEXT */}
                 <div className="pt-4 border-t border-[#202040]">
                    <button 
                      onClick={() => {
                        const type = selectedNode.group;
                        let targetTab = 'dashboard';
                        let targetDate = state.journals && Object.keys(state.journals).length > 0 
                          ? Object.keys(state.journals)[0] 
                          : 'today';

                        if (type === 'day' || type === 'habit') {
                          targetTab = 'daily';
                          targetDate = selectedNode.rawData?.dateStr || selectedNode.rawData?.date;
                        } else if (type === 'journal' || type === 'tag') {
                          targetTab = 'journal';
                          targetDate = selectedNode.rawData?.date || selectedNode.rawData?.dateStr;
                          // If tag, let's open journal on the tag's matching entry
                          if (type === 'tag') {
                            const matchingJrn = Object.entries(state.journals || {})
                              .find(([_, jrn]) => jrn.tags && jrn.tags.map(t => t.toLowerCase().trim()).includes(selectedNode.rawData.tag));
                            if (matchingJrn) {
                              targetDate = matchingJrn[0];
                            } else {
                              targetTab = 'search';
                            }
                          }
                        } else if (type === 'pomo') {
                          targetTab = 'pomo';
                          targetDate = selectedNode.id.split("_")[1];
                        } else if (type === 'finance') {
                          targetTab = 'finances';
                          targetDate = selectedNode.id.split("_")[1];
                        } else if (type === 'sketch') {
                          targetTab = 'sketchpad';
                          targetDate = selectedNode.id.split("_")[1];
                        } else if (type === 'reminder') {
                          targetTab = 'reminders';
                          targetDate = selectedNode.id.split("_")[1];
                        } else if (type === 'category') {
                          targetTab = 'daily';
                        }

                        if (targetDate) {
                          onSetDate(targetDate);
                        }
                        onNavigate(targetTab);
                      }}
                      className="w-full bg-[#00d4ff]/10 hover:bg-[#00d4ff]/25 text-[#00d4ff] text-[10.5px] font-black uppercase tracking-widest py-2.5 rounded-xl border border-[#00d4ff]/30 hover:shadow-[0_0_12px_rgba(0,212,255,0.15)] hover:border-[#00d4ff]/55 transition duration-150 text-center flex items-center justify-center gap-1.5 cursor-pointer font-mono"
                    >
                      <ExternalLink size={12} />
                      Jump To Active Workspace Context
                    </button>
                    <p className="text-[8.5px] text-slate-500 font-bold block text-center font-mono mt-1.5 uppercase tracking-wider">
                      // Redirects browser viewport directly onto tab
                    </p>
                 </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Secondary Semantic Index Registry panel (bottom) inside split-graph mode */}
      {layoutMode === 'split-graph' && (
        <div id="split-graph-bottom-briefing" className="bg-[#0c0c16]/95 border border-[#232345] rounded-2xl p-5 shadow-2xl relative text-left animate-fade-in space-y-5">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#202040] pb-3">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-3.5 bg-[#aa44ff] rounded-full animate-pulse" />
              <h3 className="text-xs font-black uppercase tracking-widest text-[#00d4ff] font-mono leading-none">
                Semantic Index Registries
              </h3>
            </div>
            <span className="text-[10px] text-slate-500 font-mono tracking-wider">
              💡 CLICK A NODE REGISTRY ROW BELOW TO SELECT AND ENVISION IN NETWORK GRAPH ABOVE
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            
            {/* Left Column: Telemetry info and tag cloud */}
            <div className="lg:col-span-4 space-y-4">
              
              {/* Cerebro manual */}
              {!dismissedIntro ? (
                <div className="bg-gradient-to-r from-[#12122c] to-[#1f163a] border border-[#aa44ff]/30 rounded-xl p-4.5 space-y-3.5 shadow-md relative overflow-hidden text-xs">
                  <div className="flex items-center justify-between border-b border-[#31315ca0]/40 pb-1.5">
                    <span className="text-[9px] uppercase tracking-wider font-mono font-black text-[#00ff88]">LTM Net Protocol</span>
                    <button
                      onClick={() => {
                        setDismissedIntro(true);
                        localStorage.setItem('omnilife_briefing_intro_dismissed', 'true');
                      }}
                      className="text-slate-400 hover:text-white transition cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                  <p className="text-slate-300 font-semibold leading-relaxed">
                    The LTM (Long-Term Memory) system indexes your device memory databases—mapping days, tracker metrics, focused pomodoros, hashtag relations, sketches, and logs into a neural web.
                  </p>
                  <p className="text-[10.5px] text-[#00d4ff] leading-relaxed">
                    🎯 Double-click empty canvas space to reset model layout. Click individual nodes to view their full context files.
                  </p>
                </div>
              ) : (
                <div className="bg-[#12122c]/40 border border-[#232345] rounded-xl p-3 flex justify-between items-center text-[10.5px] font-mono text-slate-450">
                  <span className="flex items-center gap-2">
                     🚀 <strong className="text-slate-300">LTM Mode Enabled</strong>
                  </span>
                  <button
                    onClick={() => {
                      setDismissedIntro(false);
                      localStorage.setItem('omnilife_briefing_intro_dismissed', 'false');
                    }}
                    className="text-[9px] hover:text-[#00d4ff] hover:border-[#00d4ff]/40 transition bg-[#0a0a1a] px-2.5 py-1 rounded-lg border border-slate-800 font-bold uppercase cursor-pointer"
                  >
                    Display Manual
                  </button>
                </div>
              )}

              {/* Little counter widgets */}
              <div className="bg-[#050512] border border-[#1e1e3b] p-4 rounded-xl space-y-3.5">
                <span className="text-[9.5px] uppercase tracking-widest text-[#aa44ff] font-black font-mono block">
                  Cerebral Telemetry Statistics
                </span>
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="bg-[#0a0a20] border border-[#1e1e3b] p-2.5 rounded-lg space-y-0.5 block relative">
                    <span className="text-[8px] uppercase tracking-wider text-slate-500 font-bold block font-mono">Diary entries:</span>
                    <span className="text-xs font-extrabold text-white block flex items-center gap-1 mt-0.5">
                      <Notebook size={11} className="text-[#00d4ff]" /> {graphGeneralStats.totalJournals} Logged
                    </span>
                  </div>
                  <div className="bg-[#0a0a20] border border-[#1e1e3b] p-2.5 rounded-lg space-y-0.5 block relative">
                    <span className="text-[8px] uppercase tracking-wider text-slate-500 font-bold block font-mono">Average mood:</span>
                    <span className="text-xs font-extrabold text-[#ffaa00] mt-0.5 block flex items-center gap-1 font-mono">
                      <Smile size={11} className="text-[#ffaa00]" /> {graphGeneralStats.avgMood} / 5
                    </span>
                  </div>
                  <div className="bg-[#0a0a20]/10 border border-[#1e1e3b] p-2.5 rounded-lg space-y-0.5 block relative">
                    <span className="text-[8px] uppercase tracking-wider text-slate-500 font-bold block">Focused hours:</span>
                    <span className="text-xs font-extrabold text-[#ff3366] mt-0.5 block flex items-center gap-1">
                      <Timer size={11} className="text-[#ff3366]" /> {graphGeneralStats.pomoHours}h Pomo
                    </span>
                  </div>
                  <div className="bg-[#0a0a20]/10 border border-[#1e1e3b] p-2.5 rounded-lg space-y-0.5 block relative font-mono">
                    <span className="text-[8px] uppercase tracking-wider text-slate-500 font-bold block">Liquid spent:</span>
                    <span className="text-xs font-extrabold text-[#00ff88] mt-0.5 block flex items-center gap-1">
                      <DollarSign size={11} className="text-[#00ff88]" /> ${graphGeneralStats.totalSpent}
                    </span>
                  </div>
                </div>
              </div>

              {/* Frequent tags cloud */}
              {graphGeneralStats.topTags.length > 0 && (
                <div className="bg-[#050512] border border-[#1e1e3b] p-4 rounded-xl space-y-3">
                  <span className="text-[9.5px] uppercase tracking-widest text-[#ff6b1a] font-black font-mono block">
                     Timeline tag correlations:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                     {graphGeneralStats.topTags.slice(0, 15).map(([tag, freq]) => (
                        <button
                          key={tag}
                          onClick={() => handleSelectNodeById(`tag_${tag}`)}
                          className="text-[9.5px] font-bold px-2.5 py-1 bg-[#121226] border border-[#ff6b1a]/30 hover:border-[#ff6b1a]/70 rounded-lg text-[#ff6b1a] transition-all flex items-center gap-1 cursor-pointer font-mono hover:scale-105 active:scale-95"
                        >
                          <Tag size={10} /> #{tag} <span className="bg-[#ff6b1a]/15 text-[8.5px] px-1 rounded-sm text-slate-400">{freq}</span>
                        </button>
                     ))}
                  </div>
                </div>
              )}

            </div>

            {/* Right Column: Searchable grid of registry nodes */}
            <div className="lg:col-span-8 bg-[#050512] border border-[#1e1e3b] p-4 rounded-xl flex flex-col min-h-[380px] space-y-3.5">
              
              <div className="flex justify-between items-center pb-1 border-b border-[#202040]/55 font-mono">
                <span className="text-[10px] uppercase tracking-widest text-[#00d4ff] font-black">
                   Active memory listings ({filteredNodesRegistry.length} elements found)
                </span>
                {searchQuery && (
                   <span className="text-[9px] text-[#00ff88] uppercase bg-[#00ff88]/10 px-2 py-0.5 rounded border border-[#00ff88]/20 leading-none">Filtered</span>
                )}
              </div>

              <div className="grid gap-2 overflow-y-auto pr-1 scrollbar-thin max-h-[420px] grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {filteredNodesRegistry.slice(0, 150).map(node => {
                  let IconComponent = Compass;
                  if (node.group === 'day') IconComponent = Calendar;
                  else if (node.group === 'journal') IconComponent = Notebook;
                  else if (node.group === 'habit') IconComponent = CheckSquare;
                  else if (node.group === 'pomo') IconComponent = Timer;
                  else if (node.group === 'finance') IconComponent = DollarSign;
                  else if (node.group === 'sketch') IconComponent = PenTool;
                  else if (node.group === 'reminder') IconComponent = Bell;
                  else if (node.group === 'tag') IconComponent = Tag;
                  else if (node.group === 'category') IconComponent = Layers;

                  const isSelected = selectedNode?.id === node.id;

                  return (
                    <button
                      key={node.id}
                      onClick={() => handleSelectNodeById(node.id)}
                      className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition duration-150 group cursor-pointer ${
                        isSelected
                          ? 'bg-cyan-500/10 border-cyan-500 hover:bg-cyan-500/15'
                          : 'bg-[#0a0a20] hover:bg-[#121235] border-[#202040] hover:border-cyan-500'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div 
                          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border"
                          style={{ 
                            backgroundColor: `${node.color}15`, 
                            borderColor: `${node.color}45`, 
                            color: node.color 
                          }}
                        >
                          <IconComponent size={13} />
                        </div>
                        <div className="min-w-0">
                          <strong className="text-white text-[10.5px] block truncate group-hover:text-cyan-400 font-sans leading-tight">
                            {node.label}
                          </strong>
                          <span className="text-[8px] font-mono text-slate-500 uppercase tracking-wider block leading-none mt-0.5">
                            {node.group}
                          </span>
                        </div>
                      </div>
                      <ChevronRight size={11} className="text-slate-600 group-hover:text-cyan-400 transition pr-0.5 shrink-0" />
                    </button>
                  );
                })}

                {filteredNodesRegistry.length > 150 && (
                   <div className="text-[9px] col-span-full text-slate-500 font-mono text-center pt-2 italic lowercase border-t border-[#202040]/30 select-none">
                     // showing top 150 of {filteredNodesRegistry.length} nodes (use search bar to expand results)
                   </div>
                )}

                {filteredNodesRegistry.length === 0 && (
                   <div className="col-span-full text-[10.5px] text-slate-500 font-mono text-center py-10 uppercase font-black border border-dashed border-[#202040]/50 rounded-xl leading-relaxed">
                     No memory nodes match search query
                   </div>
                )}
              </div>

            </div>

          </div>

        </div>
      )}

      {/* 4. Canvas Sketches thumbnail lightbox portal */}
      {previewSketch && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in" onClick={() => setPreviewSketch(null)}>
           <div className="max-w-4xl w-full bg-[#080811] border border-slate-800 rounded-3xl p-4 overflow-hidden relative space-y-4" onClick={(e) => e.stopPropagation()}>
              
              {/* Toolbar */}
              <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                 <span className="text-xs text-slate-400 font-mono uppercase font-extrabold flex items-center gap-1.5">
                   <PenTool size={13} className="text-[#3b82f6]" /> Premium Canvas Ideation Preview
                 </span>
                 <button onClick={() => setPreviewSketch(null)} className="p-1 px-2 text-slate-400 hover:text-white hover:bg-slate-85/40 text-sm font-bold rounded">
                   ✕
                 </button>
              </div>

              {/* Big Draw image */}
              <div className="w-full h-[65vh] bg-slate-950 rounded-2xl flex items-center justify-center overflow-auto border border-slate-900">
                 <img referrerPolicy="no-referrer" src={previewSketch} alt="Sketch Large Expanded" className="max-w-full max-h-full object-contain filter drop-shadow-[0_0_20px_rgba(59,130,246,0.15)]" />
              </div>

              <div className="text-center font-mono text-[10px] text-slate-500 uppercase tracking-widest leading-none">
                 Double-click outside canvas or press ✕ button to terminate overlay
              </div>
           </div>
        </div>
      )}

    </div>
  );
};
