import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Server, Activity, GitCommit, Lightbulb, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Incident,
  mockHypotheses,
  getSeverityColor,
  getRelativeTime,
} from "@/lib/mockIncidents";

interface RCCausalCanvasProps {
  incident: Incident | null;
}

type NodeKind = "incident" | "service" | "signal" | "hypothesis";

interface GraphNode {
  id: string;
  kind: NodeKind;
  label: string;
  sub?: string;
  x: number;
  y: number;
  evidence: string[];
}

interface GraphEdge {
  from: string;
  to: string;
  weight: number; // 0..1 — confidence
  label?: string;
}

const KIND_META: Record<
  NodeKind,
  { icon: typeof Server; ring: string; bg: string; chip: string; chipBg: string }
> = {
  incident: {
    icon: AlertTriangle,
    ring: "stroke-destructive/70",
    bg: "bg-destructive/15",
    chip: "text-destructive",
    chipBg: "bg-destructive/10",
  },
  service: {
    icon: Server,
    ring: "stroke-cyan-400/60",
    bg: "bg-cyan-400/10",
    chip: "text-cyan-300",
    chipBg: "bg-cyan-400/10",
  },
  signal: {
    icon: Activity,
    ring: "stroke-amber-400/60",
    bg: "bg-amber-400/10",
    chip: "text-amber-300",
    chipBg: "bg-amber-400/10",
  },
  hypothesis: {
    icon: Lightbulb,
    ring: "stroke-primary/70",
    bg: "bg-primary/15",
    chip: "text-primary",
    chipBg: "bg-primary/10",
  },
};

const VIEW_W = 1000;
const VIEW_H = 620;

const buildGraph = (inc: Incident): { nodes: GraphNode[]; edges: GraphEdge[] } => {
  const hyps = (mockHypotheses[inc.id] || []).slice(0, 3);

  const nodes: GraphNode[] = [
    {
      id: "incident",
      kind: "incident",
      label: inc.title.slice(0, 32),
      sub: inc.id,
      x: 120,
      y: 310,
      evidence: [
        `Severity: ${inc.severity}`,
        `Service: ${inc.service}`,
        `Started: ${getRelativeTime(inc.createdAt)}`,
        inc.description,
      ],
    },
    {
      id: "svc-payment",
      kind: "service",
      label: inc.service,
      sub: "p95 ↑ 6.4×",
      x: 360,
      y: 160,
      evidence: ["error_rate baseline ×6.4", "saturation 98%", "1,284 ERROR за 30 мин"],
    },
    {
      id: "svc-auth",
      kind: "service",
      label: "auth-svc",
      sub: "downstream",
      x: 360,
      y: 310,
      evidence: ["healthy", "под угрозой каскада через 8–12 мин"],
    },
    {
      id: "svc-db",
      kind: "service",
      label: "postgres-main",
      sub: "stable",
      x: 360,
      y: 460,
      evidence: ["latency в норме", "connection pool: 32/100"],
    },
    {
      id: "sig-logs",
      kind: "signal",
      label: "Log cluster",
      sub: "connection reset ×1,284",
      x: 600,
      y: 140,
      evidence: [
        "78% совпадений в одном stack-trace",
        "Старт: 14:22:08",
        "Корреляция с pod restart",
      ],
    },
    {
      id: "sig-deploy",
      kind: "signal",
      label: "Deploy event",
      sub: "payment-svc@v2.41.3",
      x: 600,
      y: 290,
      evidence: [
        "Время: 14:21:55",
        "Изменён httpClient.timeout: 30s → 3s",
        "Прошлый rollback решал INC-204",
      ],
    },
    {
      id: "sig-pool",
      kind: "signal",
      label: "Saturation",
      sub: "conn pool 98%",
      x: 600,
      y: 440,
      evidence: ["Retry-storm ×4.2 RPS", "CPU/MEM в норме"],
    },
  ];

  hyps.forEach((h, i) => {
    nodes.push({
      id: `hyp-${i}`,
      kind: "hypothesis",
      label: h.title,
      sub: `${h.confidence}% уверенности`,
      x: 870,
      y: 180 + i * 140,
      evidence: [h.explanation, "→ " + h.recommendation],
    });
  });

  const edges: GraphEdge[] = [
    { from: "incident", to: "svc-payment", weight: 0.95 },
    { from: "incident", to: "svc-auth", weight: 0.45 },
    { from: "incident", to: "svc-db", weight: 0.2 },
    { from: "svc-payment", to: "sig-logs", weight: 0.9 },
    { from: "svc-payment", to: "sig-deploy", weight: 0.85 },
    { from: "svc-payment", to: "sig-pool", weight: 0.8 },
    { from: "svc-auth", to: "sig-pool", weight: 0.5 },
  ];

  hyps.forEach((h, i) => {
    edges.push({ from: "sig-deploy", to: `hyp-${i}`, weight: h.confidence / 100 });
    if (i === 0) edges.push({ from: "sig-logs", to: `hyp-${i}`, weight: 0.7 });
    if (i === 1) edges.push({ from: "sig-pool", to: `hyp-${i}`, weight: 0.6 });
  });

  return { nodes, edges };
};

const RCCausalCanvas = ({ incident }: RCCausalCanvasProps) => {
  const [revealed, setRevealed] = useState(0);
  const [selectedId, setSelectedId] = useState<string>("incident");

  const { nodes, edges } = useMemo(
    () => (incident ? buildGraph(incident) : { nodes: [], edges: [] }),
    [incident?.id]
  );

  useEffect(() => {
    if (!incident) return;
    setRevealed(0);
    setSelectedId("incident");
    const totalSteps = nodes.length + edges.length;
    let i = 0;
    const t = setInterval(() => {
      i += 1;
      setRevealed(i);
      if (i >= totalSteps) clearInterval(t);
    }, 90);
    return () => clearInterval(t);
  }, [incident?.id, nodes.length, edges.length]);

  if (!incident) return null;

  const colors = getSeverityColor(incident.severity);
  const selected = nodes.find((n) => n.id === selectedId);
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  return (
    <div className="flex-1 flex flex-col h-screen relative overflow-hidden">
      {/* Header */}
      <div className="shrink-0 border-b border-border bg-surface-0/80 backdrop-blur-sm relative z-10 px-6 py-3 flex items-center gap-3">
        <span className={cn("h-2.5 w-2.5 rounded-full shrink-0", colors.dot)} />
        <div className="min-w-0">
          <h2 className="text-sm font-semibold truncate">{incident.title}</h2>
          <div className="text-[10px] text-muted-foreground font-mono">
            {incident.id} · {incident.service} · {getRelativeTime(incident.createdAt)}
          </div>
        </div>
        <div className="ml-auto text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Causal Canvas
        </div>
      </div>

      {/* Canvas + side panel */}
      <div className="flex-1 flex relative z-10 min-h-0">
        <div className="flex-1 relative overflow-hidden bg-[radial-gradient(ellipse_at_center,hsl(var(--surface-1)/0.6),transparent_70%)]">
          {/* Grid backdrop */}
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />

          {/* Legend */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
            {(Object.entries(KIND_META) as [NodeKind, typeof KIND_META.incident][]).map(
              ([k, m]) => (
                <span
                  key={k}
                  className={cn(
                    "px-2 py-0.5 rounded-full text-[9px] uppercase tracking-[0.12em] font-semibold",
                    m.chipBg,
                    m.chip
                  )}
                >
                  {k}
                </span>
              )
            )}
          </div>

          <svg
            viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
            preserveAspectRatio="xMidYMid meet"
            className="w-full h-full"
          >
            {/* Edges */}
            {edges.map((e, i) => {
              const from = nodeMap.get(e.from);
              const to = nodeMap.get(e.to);
              if (!from || !to) return null;
              const visible = i + nodes.length < revealed;
              const isActive =
                selected && (selected.id === e.from || selected.id === e.to);
              const dx = to.x - from.x;
              const dy = to.y - from.y;
              const cx = from.x + dx * 0.5;
              const cy = from.y + dy * 0.5 - 20;
              const path = `M ${from.x} ${from.y} Q ${cx} ${cy} ${to.x} ${to.y}`;
              return (
                <motion.path
                  key={`${e.from}-${e.to}`}
                  d={path}
                  fill="none"
                  stroke={
                    isActive ? "hsl(var(--primary))" : "hsl(var(--foreground) / 0.35)"
                  }
                  strokeWidth={1 + e.weight * 2}
                  strokeOpacity={visible ? (isActive ? 0.95 : 0.35 + e.weight * 0.4) : 0}
                  strokeDasharray={e.weight < 0.4 ? "4 4" : "0"}
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: visible ? 1 : 0 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              );
            })}

            {/* Nodes */}
            {nodes.map((n, i) => {
              const meta = KIND_META[n.kind];
              const visible = i < revealed;
              const isSelected = selectedId === n.id;
              return (
                <motion.g
                  key={n.id}
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: visible ? 1 : 0, scale: visible ? 1 : 0.7 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  style={{ cursor: "pointer" }}
                  onClick={() => setSelectedId(n.id)}
                >
                  {/* Halo */}
                  {isSelected && (
                    <circle
                      cx={n.x}
                      cy={n.y}
                      r={42}
                      fill="hsl(var(--primary) / 0.18)"
                      className="animate-pulse"
                    />
                  )}
                  <circle
                    cx={n.x}
                    cy={n.y}
                    r={28}
                    className={cn("transition-all", meta.ring)}
                    fill="hsl(var(--surface-1))"
                    strokeWidth={isSelected ? 2.5 : 1.5}
                  />
                  <foreignObject x={n.x - 14} y={n.y - 14} width={28} height={28}>
                    <div className="w-full h-full flex items-center justify-center">
                      <meta.icon
                        className={cn("w-3.5 h-3.5", meta.chip)}
                      />
                    </div>
                  </foreignObject>
                  <text
                    x={n.x}
                    y={n.y + 46}
                    textAnchor="middle"
                    className="fill-foreground"
                    style={{ fontSize: 11, fontWeight: 600 }}
                  >
                    {n.label}
                  </text>
                  {n.sub && (
                    <text
                      x={n.x}
                      y={n.y + 60}
                      textAnchor="middle"
                      className="fill-muted-foreground"
                      style={{ fontSize: 9 }}
                    >
                      {n.sub}
                    </text>
                  )}
                </motion.g>
              );
            })}
          </svg>
        </div>

        {/* Side panel */}
        <AnimatePresence mode="wait">
          {selected && (
            <motion.aside
              key={selected.id}
              initial={{ x: 30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 30, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="w-80 shrink-0 border-l border-border bg-surface-0/85 backdrop-blur-md p-5 overflow-y-auto"
            >
              <div className="flex items-start gap-2 mb-4">
                <span
                  className={cn(
                    "px-2 py-0.5 rounded-full text-[9px] uppercase tracking-[0.14em] font-semibold",
                    KIND_META[selected.kind].chipBg,
                    KIND_META[selected.kind].chip
                  )}
                >
                  {selected.kind}
                </span>
                <button
                  onClick={() => setSelectedId("incident")}
                  className="ml-auto text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <h3 className="text-base font-semibold leading-tight">{selected.label}</h3>
              {selected.sub && (
                <div className="text-[11px] text-muted-foreground font-mono mt-0.5">
                  {selected.sub}
                </div>
              )}
              <div className="mt-4 space-y-2">
                <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground font-semibold">
                  Evidence
                </div>
                <ul className="space-y-1.5">
                  {selected.evidence.map((ev, i) => (
                    <li
                      key={i}
                      className="text-[12px] text-foreground/90 leading-relaxed flex gap-2"
                    >
                      <span className="text-primary/70 shrink-0">•</span>
                      <span>{ev}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default RCCausalCanvas;
