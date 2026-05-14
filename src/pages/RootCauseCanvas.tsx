import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, Sparkles, Shield, Activity, Database, Server, AlertTriangle, MessageSquare, Maximize2, Minimize2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { mockIncidents, mockHypotheses, mockDiagnosisSteps, mockFollowUpSuggestions, getMockAIResponse } from "@/lib/mockIncidents";
import type { Incident } from "@/lib/rootCauseData";
import RCModeSwitcher from "@/components/root-cause/RCModeSwitcher";
import RCSearchModal from "@/components/root-cause/RCSearchModal";
import CanvasIncidentDock from "@/components/root-cause/canvas/CanvasIncidentDock";
import CanvasNodeInspector, { CanvasNode } from "@/components/root-cause/canvas/CanvasNodeInspector";
import CanvasAgentBar from "@/components/root-cause/canvas/CanvasAgentBar";
import CanvasConstellation from "@/components/root-cause/canvas/CanvasConstellation";

type NodeKind = CanvasNode["kind"];

interface GNode extends CanvasNode {
  x: number;
  y: number;
  delay: number;
}
interface GEdge {
  from: string;
  to: string;
  strength?: number;
}

const KIND_STYLE: Record<NodeKind, { ring: string; glow: string; icon: any; bg: string }> = {
  incident: { ring: "ring-red-400/60", glow: "shadow-[0_0_38px_hsl(0_80%_55%/0.55)]", icon: AlertTriangle, bg: "from-red-500/30 to-red-700/20" },
  thought: { ring: "ring-primary/50", glow: "shadow-[0_0_24px_hsl(var(--primary)/0.45)]", icon: Brain, bg: "from-primary/30 to-primary/10" },
  hypothesis: { ring: "ring-accent/60", glow: "shadow-[0_0_28px_hsl(var(--accent)/0.5)]", icon: Sparkles, bg: "from-accent/30 to-accent/5" },
  evidence: { ring: "ring-cyan-400/50", glow: "shadow-[0_0_20px_hsl(190_90%_55%/0.4)]", icon: Database, bg: "from-cyan-500/20 to-cyan-700/5" },
  service: { ring: "ring-emerald-400/50", glow: "shadow-[0_0_20px_hsl(160_70%_50%/0.4)]", icon: Server, bg: "from-emerald-500/20 to-emerald-700/5" },
  "user-thought": { ring: "ring-primary/60", glow: "shadow-[0_0_22px_hsl(var(--primary)/0.5)]", icon: MessageSquare, bg: "from-primary/35 to-accent/15" },
};

function buildBaseGraph(incident: Incident, hyps: { title: string; confidence: number; explanation: string }[]) {
  const ns: GNode[] = [];
  const es: GEdge[] = [];
  const cx = 700, cy = 420;

  ns.push({
    id: "inc", kind: "incident", x: cx, y: cy,
    label: incident.id, sub: incident.title,
    meta: { Service: incident.service, Severity: incident.severity, Status: incident.status },
    delay: 0,
  });

  mockDiagnosisSteps.slice(0, 4).forEach((s, i) => {
    const angle = -Math.PI / 2 + (i / 4) * Math.PI * 2;
    const r = 200;
    const id = `t${i}`;
    ns.push({ id, kind: "thought", x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r, label: s.label, sub: s.detail, delay: 0.3 + i * 0.4 });
    es.push({ from: "inc", to: id });
  });

  const safeHyps = hyps.length ? hyps : [{ title: "Resource Constraint", confidence: 70, explanation: "Возможное ресурсное ограничение." }];
  safeHyps.slice(0, 3).forEach((h, i) => {
    const angle = -Math.PI / 2 + ((i + 0.5) / safeHyps.length) * Math.PI * 2;
    const r = 380;
    const id = `h${i}`;
    ns.push({
      id, kind: "hypothesis",
      x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r,
      label: h.title, sub: h.explanation.slice(0, 90) + "…", confidence: h.confidence,
      meta: { "KB match": "0.91", "Sources": "7" },
      delay: 2.0 + i * 0.5,
    });
    es.push({ from: `t${i % 4}`, to: id, strength: h.confidence / 100 });

    const ex = cx + Math.cos(angle) * 560;
    const ey = cy + Math.sin(angle) * 560 - 50;
    const sx = cx + Math.cos(angle) * 560;
    const sy = cy + Math.sin(angle) * 560 + 80;
    ns.push({ id: `e${i}`, kind: "evidence", x: ex, y: ey, label: ["Logs spike", "Metric anomaly", "KB match"][i] || "Signal", sub: ["pg_trgm 0.91", "+340% in 2m", "AML rule 14"][i], delay: 3.6 + i * 0.4 });
    ns.push({ id: `s${i}`, kind: "service", x: sx, y: sy, label: incident.service, sub: ["healthy", "degraded", "down"][i] || "obs", delay: 3.6 + i * 0.4 });
    es.push({ from: id, to: `e${i}` });
    es.push({ from: id, to: `s${i}` });
  });

  return { ns, es };
}

export default function RootCauseCanvas() {
  const [extraIncidents, setExtraIncidents] = useState<Incident[]>([]);
  const allIncidents = useMemo(() => [...extraIncidents, ...mockIncidents], [extraIncidents]);

  const [selectedId, setSelectedId] = useState<string>(allIncidents[0].id);
  const incident = useMemo(() => allIncidents.find((i) => i.id === selectedId)!, [allIncidents, selectedId]);
  const hyps = useMemo(() => (mockHypotheses[incident.id] || []).slice(0, 3), [incident.id]);

  const [dockCollapsed, setDockCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [constellationOpen, setConstellationOpen] = useState(false);
  const [activeNode, setActiveNode] = useState<CanvasNode | null>(null);
  const [liveThought, setLiveThought] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const stopRef = useRef(false);

  // Graph state
  const [graphNodes, setGraphNodes] = useState<GNode[]>([]);
  const [graphEdges, setGraphEdges] = useState<GEdge[]>([]);
  const [revealCount, setRevealCount] = useState(0);

  // Pan/zoom
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(0.9);
  const draggingRef = useRef<{ x: number; y: number } | null>(null);

  // Build graph when incident changes
  useEffect(() => {
    const { ns, es } = buildBaseGraph(incident, hyps);
    setGraphNodes(ns);
    setGraphEdges(es);
    setRevealCount(0);
    setActiveNode(null);
    let i = 0;
    const tick = () => {
      i++;
      setRevealCount(i);
      if (i < ns.length) setTimeout(tick, 320);
    };
    setTimeout(tick, 200);
  }, [incident.id]);

  // Cmd+K
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === "Escape") {
        setActiveNode(null);
        setConstellationOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const onWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) e.preventDefault();
    const next = Math.min(1.6, Math.max(0.4, scale - e.deltaY * 0.001));
    setScale(next);
  };
  const onMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("[data-node]")) return;
    draggingRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!draggingRef.current) return;
    setPan({ x: e.clientX - draggingRef.current.x, y: e.clientY - draggingRef.current.y });
  };
  const onMouseUp = () => { draggingRef.current = null; };

  const recenter = () => { setPan({ x: 0, y: 0 }); setScale(0.9); };

  // Agent interaction — adds nodes to graph and streams thought
  const askAgent = useCallback(async (q: string) => {
    setIsThinking(true);
    stopRef.current = false;
    setLiveThought(null);

    // 1. Add user-thought node
    const lead = graphNodes.find((n) => n.kind === "hypothesis") || graphNodes.find((n) => n.kind === "incident")!;
    const userNode: GNode = {
      id: `u-${Date.now()}`,
      kind: "user-thought",
      x: lead.x + 240,
      y: lead.y + 180 + Math.random() * 60,
      label: q.length > 40 ? q.slice(0, 40) + "…" : q,
      sub: q,
      delay: 0,
    };
    setGraphNodes((prev) => [...prev, userNode]);
    setGraphEdges((prev) => [...prev, { from: lead.id, to: userNode.id }]);
    setRevealCount((r) => r + 1);

    // 2. Stream thinking
    const steps = [
      "Парсю запрос и ищу контекст в графе…",
      "Сопоставляю с базой знаний (pg_trgm + tsvector)…",
      "Выбираю наиболее релевантные узлы…",
      "Формирую ответ…",
    ];
    for (const s of steps) {
      if (stopRef.current) break;
      setLiveThought(s);
      await new Promise((r) => setTimeout(r, 600));
    }
    if (stopRef.current) { setIsThinking(false); return; }

    // 3. Append agent answer node
    const answer = getMockAIResponse(incident.id, q);
    const short = answer.replace(/[#*]/g, "").split("\n")[0].slice(0, 80);
    const answerNode: GNode = {
      id: `a-${Date.now()}`,
      kind: "thought",
      x: userNode.x + 60,
      y: userNode.y + 140,
      label: "Ответ агента",
      sub: short || "Смотрите развёрнутый ответ в инспекторе.",
      meta: { "Источников": "5", "Confidence": "84%" },
      delay: 0,
    };
    setGraphNodes((prev) => [...prev, answerNode]);
    setGraphEdges((prev) => [...prev, { from: userNode.id, to: answerNode.id }]);
    setRevealCount((r) => r + 1);
    setLiveThought(short || "Готово.");
    setIsThinking(false);
    setActiveNode(answerNode);
    setTimeout(() => setLiveThought(null), 4000);
  }, [graphNodes, incident.id]);

  const stopAgent = () => { stopRef.current = true; setIsThinking(false); setLiveThought(null); };

  const visibleNodes = graphNodes.slice(0, revealCount);
  const visibleEdges = graphEdges.filter((e) => visibleNodes.some(n => n.id === e.from) && visibleNodes.some(n => n.id === e.to));

  const followUps = mockFollowUpSuggestions[incident.id] || mockFollowUpSuggestions.default || [];

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-background flex">
      <RCModeSwitcher />

      {/* Left dock */}
      <CanvasIncidentDock
        incidents={allIncidents}
        selectedId={selectedId}
        collapsed={dockCollapsed}
        onSelect={setSelectedId}
        onToggleCollapse={() => setDockCollapsed((c) => !c)}
        onOpenSearch={() => setSearchOpen(true)}
        onOpenConstellation={() => setConstellationOpen(true)}
      />

      {/* Canvas viewport */}
      <div className="relative flex-1 overflow-hidden">
        {/* Ambient grid */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
            backgroundPosition: `${pan.x}px ${pan.y}px`,
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 50% 50%, hsl(var(--primary)/0.08), transparent 70%), radial-gradient(ellipse 40% 40% at 80% 20%, hsl(var(--accent)/0.06), transparent 70%)",
          }}
        />

        {/* HUD top-left */}
        <div className="absolute top-3 left-3 z-30 flex items-center gap-2 rounded-xl border border-border/40 bg-surface-1/70 backdrop-blur-xl px-3 py-2 shadow-lg">
          <div className="relative">
            <Brain className="w-4 h-4 text-primary" />
            {isThinking && (
              <span className="absolute inset-0 animate-ping">
                <Brain className="w-4 h-4 text-primary opacity-30" />
              </span>
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">AI Reasoning Graph</span>
            <span className="text-xs font-mono text-foreground">{visibleNodes.length} nodes · {visibleEdges.length} links</span>
          </div>
        </div>

        {/* HUD top-right: lead hypothesis */}
        {hyps[0] && (
          <div className="absolute top-3 right-3 z-30 flex items-center gap-3 rounded-xl border border-border/40 bg-surface-1/70 backdrop-blur-xl px-3 py-2 shadow-lg max-w-[300px]">
            <Shield className="w-4 h-4 text-accent shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Lead Hypothesis</span>
              <span className="text-xs font-mono text-foreground truncate">{hyps[0].title}</span>
            </div>
            <div className="text-lg font-bold text-accent font-mono shrink-0">{hyps[0].confidence}%</div>
          </div>
        )}

        {/* Recenter button */}
        <button
          onClick={recenter}
          className="absolute top-16 right-3 z-30 w-9 h-9 rounded-xl border border-border/40 bg-surface-1/70 backdrop-blur-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-surface-2/70 transition-colors shadow-lg"
          title="Сбросить вид"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>

        {/* Pan/zoom canvas */}
        <div
          className="absolute inset-0 cursor-grab active:cursor-grabbing"
          onWheel={onWheel}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
        >
          <div
            className="absolute inset-0"
            style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`, transformOrigin: "0 0" }}
          >
            <svg className="absolute inset-0 pointer-events-none" width="1600" height="1000" style={{ overflow: "visible" }}>
              <defs>
                <linearGradient id="edge-grad" x1="0" x2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.7" />
                  <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0.7" />
                </linearGradient>
              </defs>
              {visibleEdges.map((e, i) => {
                const a = graphNodes.find(n => n.id === e.from)!;
                const b = graphNodes.find(n => n.id === e.to)!;
                if (!a || !b) return null;
                const mx = (a.x + b.x) / 2;
                const my = (a.y + b.y) / 2 - 40;
                const path = `M ${a.x} ${a.y} Q ${mx} ${my} ${b.x} ${b.y}`;
                const isActive = activeNode && (activeNode.id === a.id || activeNode.id === b.id);
                return (
                  <g key={`${e.from}-${e.to}-${i}`}>
                    <motion.path
                      d={path}
                      fill="none"
                      stroke="url(#edge-grad)"
                      strokeWidth={(1.5 + (e.strength || 0.5) * 1.5) * (isActive ? 2 : 1)}
                      strokeDasharray="4 4"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: isActive ? 0.9 : 0.5 }}
                      transition={{ duration: 0.7 }}
                    />
                    <motion.circle r="2.5" fill="hsl(var(--primary))" initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0] }} transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.2 }}>
                      <animateMotion dur="2.4s" repeatCount="indefinite" path={path} />
                    </motion.circle>
                  </g>
                );
              })}
            </svg>

            {visibleNodes.map((n) => {
              const style = KIND_STYLE[n.kind];
              const Icon = style.icon;
              const isActive = activeNode?.id === n.id;
              const w = n.kind === "incident" ? 240 : n.kind === "hypothesis" ? 220 : n.kind === "user-thought" ? 200 : 170;
              return (
                <motion.div
                  key={n.id}
                  data-node
                  initial={{ opacity: 0, scale: 0.4 }}
                  animate={{ opacity: 1, scale: isActive ? 1.06 : 1 }}
                  transition={{ type: "spring", stiffness: 280, damping: 22 }}
                  onClick={(e) => { e.stopPropagation(); setActiveNode(n); }}
                  className={cn(
                    "absolute -translate-x-1/2 -translate-y-1/2 rounded-2xl border bg-gradient-to-br backdrop-blur-md p-3 ring-1 cursor-pointer hover:scale-105 transition-transform",
                    "border-border/40", style.bg, style.ring, style.glow,
                    isActive && "z-20 ring-2 ring-primary/70"
                  )}
                  style={{ left: n.x, top: n.y, width: w }}
                >
                  <div className="flex items-start gap-2">
                    <div className="shrink-0 w-8 h-8 rounded-lg bg-surface-2/80 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground">{n.kind.replace("-", " ")}</span>
                        {n.confidence !== undefined && (
                          <span className="text-[10px] font-mono text-accent font-bold">{n.confidence}%</span>
                        )}
                      </div>
                      <div className="mt-0.5 text-xs font-semibold text-foreground truncate">{n.label}</div>
                      {n.sub && <div className="mt-0.5 text-[10px] text-muted-foreground line-clamp-2">{n.sub}</div>}
                      {n.confidence !== undefined && (
                        <div className="mt-1.5 h-1 rounded-full bg-surface-3/60 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${n.confidence}%` }}
                            transition={{ duration: 1, delay: 0.2 }}
                            className="h-full bg-gradient-to-r from-primary to-accent"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  {(n.kind === "thought" || n.kind === "user-thought") && (
                    <motion.div
                      className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-primary"
                      animate={{ scale: [1, 1.6, 1], opacity: [1, 0.4, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Zoom indicator */}
        <div className="absolute bottom-3 right-3 z-20 text-[10px] text-muted-foreground/70 font-mono pointer-events-none">
          scroll = zoom · drag = pan · {Math.round(scale * 100)}%
        </div>

        {/* Agent bar */}
        <CanvasAgentBar
          liveThought={liveThought}
          isThinking={isThinking}
          followUps={followUps}
          onSend={askAgent}
          onStop={stopAgent}
        />

        {/* Inspector */}
        <CanvasNodeInspector node={activeNode} onClose={() => setActiveNode(null)} onAsk={(q) => { setActiveNode(null); askAgent(q); }} />

        {/* Constellation */}
        <AnimatePresence>
          {constellationOpen && (
            <CanvasConstellation
              incidents={allIncidents}
              onSelect={(id) => { setSelectedId(id); setConstellationOpen(false); }}
              onClose={() => setConstellationOpen(false)}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Search modal */}
      <RCSearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        incidents={allIncidents}
        onSelect={(id) => { setSelectedId(id); setSearchOpen(false); }}
        onCreateIncident={(inc) => {
          setExtraIncidents((prev) => prev.find((p) => p.id === inc.id) ? prev : [inc, ...prev]);
          setSelectedId(inc.id);
          setSearchOpen(false);
        }}
      />
    </div>
  );
}
