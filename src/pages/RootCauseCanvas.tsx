import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Sparkles, Zap, Shield, Network, ChevronRight, Activity, Database, Server, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { mockIncidents, mockHypotheses, mockDiagnosisSteps, getSeverityColor } from "@/lib/mockIncidents";
import RCModeSwitcher from "@/components/root-cause/RCModeSwitcher";

type NodeKind = "incident" | "thought" | "hypothesis" | "evidence" | "service";
interface GNode {
  id: string;
  kind: NodeKind;
  x: number;
  y: number;
  label: string;
  sub?: string;
  confidence?: number;
  delay: number;
}
interface GEdge {
  from: string;
  to: string;
  delay: number;
  strength?: number;
}

const KIND_STYLE: Record<NodeKind, { ring: string; glow: string; icon: any; bg: string }> = {
  incident: { ring: "ring-red-400/60", glow: "shadow-[0_0_38px_hsl(0_80%_55%/0.55)]", icon: AlertTriangle, bg: "from-red-500/30 to-red-700/20" },
  thought: { ring: "ring-primary/50", glow: "shadow-[0_0_24px_hsl(var(--primary)/0.45)]", icon: Brain, bg: "from-primary/30 to-primary/10" },
  hypothesis: { ring: "ring-accent/60", glow: "shadow-[0_0_28px_hsl(var(--accent)/0.5)]", icon: Sparkles, bg: "from-accent/30 to-accent/5" },
  evidence: { ring: "ring-cyan-400/50", glow: "shadow-[0_0_20px_hsl(190_90%_55%/0.4)]", icon: Database, bg: "from-cyan-500/20 to-cyan-700/5" },
  service: { ring: "ring-emerald-400/50", glow: "shadow-[0_0_20px_hsl(160_70%_50%/0.4)]", icon: Server, bg: "from-emerald-500/20 to-emerald-700/5" },
};

export default function RootCauseCanvas() {
  const incident = mockIncidents[0];
  const hyps = (mockHypotheses[incident.id] || []).slice(0, 3);
  const colors = getSeverityColor(incident.severity);

  const [revealed, setRevealed] = useState(0);
  const [activeNode, setActiveNode] = useState<string | null>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const draggingRef = useRef<{ x: number; y: number } | null>(null);

  const { nodes, edges } = useMemo(() => {
    const ns: GNode[] = [];
    const es: GEdge[] = [];
    const cx = 600, cy = 380;

    ns.push({ id: "inc", kind: "incident", x: cx, y: cy, label: incident.id, sub: incident.title, delay: 0 });

    // Thought chain ring around incident
    mockDiagnosisSteps.slice(0, 4).forEach((s, i) => {
      const angle = -Math.PI / 2 + (i / 4) * Math.PI * 2;
      const r = 180;
      const id = `t${i}`;
      ns.push({ id, kind: "thought", x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r, label: s.label, sub: s.detail, delay: 0.3 + i * 0.4 });
      es.push({ from: "inc", to: id, delay: 0.3 + i * 0.4 });
    });

    // Hypotheses radiating outward
    hyps.forEach((h, i) => {
      const angle = -Math.PI / 2 + ((i + 0.5) / hyps.length) * Math.PI * 2;
      const r = 360;
      const id = `h${i}`;
      ns.push({ id, kind: "hypothesis", x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r, label: h.title, sub: h.explanation.slice(0, 70) + "…", confidence: h.confidence, delay: 2.2 + i * 0.5 });
      const parent = `t${i % 4}`;
      es.push({ from: parent, to: id, delay: 2.2 + i * 0.5, strength: h.confidence / 100 });

      // Evidence + service per hypothesis
      const ex = cx + Math.cos(angle) * 540;
      const ey = cy + Math.sin(angle) * 540 - 50;
      const sx = cx + Math.cos(angle) * 540;
      const sy = cy + Math.sin(angle) * 540 + 80;
      ns.push({ id: `e${i}`, kind: "evidence", x: ex, y: ey, label: ["Logs spike", "Metric anomaly", "KB match"][i] || "Signal", sub: ["pg_trgm 0.91", "+340% in 2m", "AML rule 14"][i], delay: 3.8 + i * 0.5 });
      ns.push({ id: `s${i}`, kind: "service", x: sx, y: sy, label: incident.service, sub: ["healthy", "degraded", "down"][i] || "obs", delay: 3.8 + i * 0.5 });
      es.push({ from: id, to: `e${i}`, delay: 3.8 + i * 0.5 });
      es.push({ from: id, to: `s${i}`, delay: 3.8 + i * 0.5 });
    });

    return { nodes: ns, edges: es };
  }, [incident.id]);

  useEffect(() => {
    let i = 0;
    const tick = () => {
      i++;
      setRevealed(i);
      if (i < nodes.length) setTimeout(tick, 380);
    };
    setTimeout(tick, 200);
  }, [nodes.length]);

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const next = Math.min(1.6, Math.max(0.4, scale - e.deltaY * 0.001));
    setScale(next);
  };
  const onMouseDown = (e: React.MouseEvent) => {
    draggingRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!draggingRef.current) return;
    setPan({ x: e.clientX - draggingRef.current.x, y: e.clientY - draggingRef.current.y });
  };
  const onMouseUp = () => { draggingRef.current = null; };

  const visibleNodes = nodes.slice(0, revealed);
  const visibleEdges = edges.filter((e) => visibleNodes.some(n => n.id === e.from) && visibleNodes.some(n => n.id === e.to));

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-background">
      <RCModeSwitcher />

      {/* Ambient grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.07]"
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
          <span className="absolute inset-0 animate-ping">
            <Brain className="w-4 h-4 text-primary opacity-30" />
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">AI Reasoning Graph</span>
          <span className="text-xs font-mono text-foreground">
            {revealed}/{nodes.length} nodes • {visibleEdges.length} links
          </span>
        </div>
      </div>

      {/* HUD top-right: confidence */}
      <div className="absolute top-3 right-3 z-30 flex items-center gap-3 rounded-xl border border-border/40 bg-surface-1/70 backdrop-blur-xl px-3 py-2 shadow-lg">
        <Shield className="w-4 h-4 text-accent" />
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Lead Hypothesis</span>
          <span className="text-xs font-mono text-foreground">{hyps[0]?.title}</span>
        </div>
        <div className="text-lg font-bold text-accent font-mono">{hyps[0]?.confidence}%</div>
      </div>

      {/* Canvas */}
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
          <svg className="absolute inset-0 pointer-events-none" width="1400" height="900" style={{ overflow: "visible" }}>
            <defs>
              <linearGradient id="edge-grad" x1="0" x2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.7" />
                <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0.7" />
              </linearGradient>
            </defs>
            {visibleEdges.map((e, i) => {
              const a = nodes.find(n => n.id === e.from)!;
              const b = nodes.find(n => n.id === e.to)!;
              const mx = (a.x + b.x) / 2;
              const my = (a.y + b.y) / 2 - 40;
              const path = `M ${a.x} ${a.y} Q ${mx} ${my} ${b.x} ${b.y}`;
              return (
                <g key={`${e.from}-${e.to}-${i}`}>
                  <motion.path
                    d={path}
                    fill="none"
                    stroke="url(#edge-grad)"
                    strokeWidth={1.5 + (e.strength || 0.5) * 1.5}
                    strokeDasharray="4 4"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 0.55 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                  {/* Pulse particle */}
                  <motion.circle
                    r="3"
                    fill="hsl(var(--primary))"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                  >
                    <animateMotion dur="2s" repeatCount="indefinite" path={path} />
                  </motion.circle>
                </g>
              );
            })}
          </svg>

          {visibleNodes.map((n) => {
            const style = KIND_STYLE[n.kind];
            const Icon = style.icon;
            const isActive = activeNode === n.id;
            const w = n.kind === "incident" ? 240 : n.kind === "hypothesis" ? 220 : 170;
            return (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, scale: 0.4 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 280, damping: 22 }}
                onMouseEnter={() => setActiveNode(n.id)}
                onMouseLeave={() => setActiveNode(null)}
                className={cn(
                  "absolute -translate-x-1/2 -translate-y-1/2 rounded-2xl border bg-gradient-to-br backdrop-blur-md p-3 ring-1 cursor-pointer",
                  "border-border/40", style.bg, style.ring, style.glow,
                  isActive && "scale-110 z-20"
                )}
                style={{ left: n.x, top: n.y, width: w }}
              >
                <div className="flex items-start gap-2">
                  <div className="shrink-0 w-8 h-8 rounded-lg bg-surface-2/80 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground">{n.kind}</span>
                      {n.confidence && (
                        <span className="text-[10px] font-mono text-accent font-bold">{n.confidence}%</span>
                      )}
                    </div>
                    <div className="mt-0.5 text-xs font-semibold text-foreground truncate">{n.label}</div>
                    {n.sub && <div className="mt-0.5 text-[10px] text-muted-foreground line-clamp-2">{n.sub}</div>}
                    {n.confidence && (
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
                {n.kind === "thought" && (
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

      {/* Streaming reasoning ticker */}
      <div className="absolute bottom-3 left-3 right-3 z-30 rounded-xl border border-border/40 bg-surface-1/80 backdrop-blur-xl px-4 py-3 shadow-lg overflow-hidden">
        <div className="flex items-center gap-2 mb-1">
          <Activity className="w-3 h-3 text-primary animate-pulse" />
          <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Live Chain-of-Thought</span>
        </div>
        <AnimatePresence mode="popLayout">
          <motion.div
            key={revealed}
            initial={{ y: 14, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -14, opacity: 0 }}
            className="text-sm text-foreground/90 font-mono"
          >
            <span className="text-primary">›</span>{" "}
            {visibleNodes[visibleNodes.length - 1]?.kind === "incident" && "Принят инцидент. Запускаю поиск контекста по KB и метрикам…"}
            {visibleNodes[visibleNodes.length - 1]?.kind === "thought" && `Шаг рассуждения: ${visibleNodes[visibleNodes.length - 1]?.label} — ${visibleNodes[visibleNodes.length - 1]?.sub}`}
            {visibleNodes[visibleNodes.length - 1]?.kind === "hypothesis" && `Сформирована гипотеза «${visibleNodes[visibleNodes.length - 1]?.label}» с уверенностью ${visibleNodes[visibleNodes.length - 1]?.confidence}%.`}
            {visibleNodes[visibleNodes.length - 1]?.kind === "evidence" && `Подтверждено доказательство: ${visibleNodes[visibleNodes.length - 1]?.label} (${visibleNodes[visibleNodes.length - 1]?.sub}).`}
            {visibleNodes[visibleNodes.length - 1]?.kind === "service" && `Затронут сервис ${visibleNodes[visibleNodes.length - 1]?.label}.`}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Zoom hint */}
      <div className="absolute bottom-3 right-3 z-20 text-[10px] text-muted-foreground/70 font-mono">
        scroll to zoom • drag to pan • {Math.round(scale * 100)}%
      </div>
    </div>
  );
}
