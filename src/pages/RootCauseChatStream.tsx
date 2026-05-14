import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Sparkles, Brain, Search, Database, Network, ShieldCheck,
  Zap, FileSearch, Terminal, ChevronRight, Activity, Loader2, Square,
  CircleDot, Layers, BookMarked, TrendingUp, TrendingDown, DollarSign,
  Clock, Cpu, GitBranch, Play, Pause, Rewind, FastForward, Target,
  AlertTriangle, CheckCircle2, ArrowRight, Gauge, Radio, Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import RCSidebar from "@/components/root-cause/RCSidebar";
import RCSearchModal from "@/components/root-cause/RCSearchModal";
import RCModeSwitcher from "@/components/root-cause/RCModeSwitcher";
import { mockIncidents } from "@/lib/mockIncidents";
import {
  Incident, getMockAIResponse, mockHypotheses, getSeverityColor,
} from "@/lib/rootCauseData";

/* ============================================================
   /root-cause/chat-1 — Reasoning Stream (Executive Edition)
   ВАУ-режим: телеметрия в реальном времени, кинематографичный
   pipeline, ранжирование гипотез, бизнес-импакт, нейронная панель.
   ============================================================ */

type Phase = "plan" | "search" | "reason" | "synthesize" | "done";

interface ToolCall {
  id: string;
  tool: string;
  arg: string;
  status: "pending" | "running" | "done";
  result?: string;
  durationMs?: number;
}
interface KBSource {
  id: string;
  title: string;
  type: "doc" | "log" | "metric" | "incident";
  match: number;
  excerpt: string;
}
interface RankedHypothesis {
  title: string;
  probability: number;
  evidence: string[];
  fix: string;
}
interface BusinessImpact {
  severity: "critical" | "high" | "medium" | "low";
  blastRadius: string;
  usersAffected: string;
  revenueAtRisk: string;
  etaToFix: string;
  autoFixAvailable: boolean;
}
interface PipelineRun {
  id: string;
  phase: Phase;
  phaseStartedAt: number;
  startedAt: number;
  plan: string[];
  thoughts: string[];
  thoughtsRevealed: number;     // chars revealed per-thought (animated)
  toolCalls: ToolCall[];
  sources: KBSource[];
  hypotheses: RankedHypothesis[];
  impact: BusinessImpact;
  answer: string;
  confidence: number;
  confidenceBreakdown: { label: string; value: number }[];
  tokensIn: number;
  tokensOut: number;
  costUsd: number;
  phaseTimings: Record<Phase, number>;
}
interface ChatMsg {
  id: string;
  role: "user" | "assistant";
  text: string;
  pipeline?: PipelineRun;
}

const PHASES: { key: Phase; label: string; icon: typeof Brain; tagline: string }[] = [
  { key: "plan", label: "Plan", icon: Layers, tagline: "Декомпозиция задачи" },
  { key: "search", label: "Search", icon: Search, tagline: "Сбор контекста" },
  { key: "reason", label: "Reason", icon: Brain, tagline: "Цепочка рассуждений" },
  { key: "synthesize", label: "Synthesize", icon: Sparkles, tagline: "Синтез решения" },
];

const TOOLS = [
  { tool: "kb.search", arg: "antifraud rules + decision pipeline" },
  { tool: "logs.correlate", arg: "service=payments,window=15m" },
  { tool: "metrics.fetch", arg: "p99_latency, error_rate, throughput" },
  { tool: "incidents.similar", arg: "vector_embed(symptoms)" },
  { tool: "deploys.recent", arg: "last=24h" },
];

const KB_POOL: Omit<KBSource, "id">[] = [
  { title: "Antifraud Rules Engine — Decision Pipeline", type: "doc", match: 94, excerpt: "Decision pipeline applies score threshold > 0.78 with feature_flag gating..." },
  { title: "INC-2741 — Payments degradation postmortem", type: "incident", match: 88, excerpt: "Root cause: stale cache after deploy at 14:02; mitigation took 38 minutes..." },
  { title: "payments-api error_rate spike (last 30m)", type: "metric", match: 82, excerpt: "error_rate climbed from 0.4% to 6.8% within 90s, p99 doubled..." },
  { title: "kafka-consumer lag warnings (fraud-scoring)", type: "log", match: 76, excerpt: "consumer-group=fraud-scoring lag=12.4k messages, growing 200/sec..." },
  { title: "Feature flag rollouts — last 24h", type: "doc", match: 71, excerpt: "flag `score_v3_canary` enabled for 25% traffic at 13:58 UTC..." },
];

const HYP_POOL: RankedHypothesis[] = [
  {
    title: "Stale-cache после деплоя `score_v3_canary`",
    probability: 86,
    evidence: ["Корреляция error_rate ↔ deploy 13:58", "Идентичный паттерн в INC-2741", "Кэш-ttl 900s ≈ горизонт деградации"],
    fix: "Invalidate cache namespace `fraud:scores`; rollback canary до 5%",
  },
  {
    title: "Лаг kafka-consumer fraud-scoring",
    probability: 64,
    evidence: ["Лаг 12.4k и растёт", "Throttling на брокере", "Совпадает с пиком нагрузки"],
    fix: "Scale consumers ×2, увеличить partitions",
  },
  {
    title: "Деградация upstream identity-service",
    probability: 31,
    evidence: ["p99 identity ↑ 180ms", "Часть запросов таймаутит"],
    fix: "Включить circuit-breaker на identity-проверке",
  },
];

function makePipeline(question: string, incident: Incident | null): PipelineRun {
  const hyps = (incident && mockHypotheses[incident.id]) || mockHypotheses.default || [];
  const sev = incident?.severity ?? "high";
  const baseAnswer = incident
    ? getMockAIResponse(incident.id, question)
    : "Готов провести анализ. Выберите инцидент или опишите симптом — я разложу мышление пошагово.";

  return {
    id: crypto.randomUUID(),
    phase: "plan",
    phaseStartedAt: Date.now(),
    startedAt: Date.now(),
    plan: [
      "Декомпозировать вопрос на подзадачи",
      "Поднять связанные KB-документы и инциденты",
      "Скоррелировать метрики и логи в окне ±15 минут",
      "Сформировать ранжированные гипотезы с probability",
      "Подготовить рекомендации и оценить бизнес-импакт",
    ],
    thoughts: [
      `Симптом указывает на ${sev === "critical" ? "критический" : "повышенный"} риск в payments-домене — приоритизирую корреляцию релизов и кеша.`,
      "Похожий паттерн встречался в INC-2741: stale-cache после деплоя — сигнатура совпадает на 88%.",
      "Метрики p99 и error_rate коррелируют с включением flag `score_v3_canary` (Pearson r=0.91).",
      hyps[0]?.explanation || "Наиболее вероятная причина — конфигурация скоринга после деплоя.",
      "Cross-check: 4 из 5 источников подтверждают гипотезу. Предлагаю invalidate cache + rollback canary.",
    ],
    thoughtsRevealed: 0,
    toolCalls: TOOLS.map((t, i) => ({
      id: `tc-${i}`,
      ...t,
      status: "pending",
    })),
    sources: KB_POOL.map((s, i) => ({ ...s, id: `kb-${i}` })),
    hypotheses: HYP_POOL,
    impact: {
      severity: sev,
      blastRadius: "payments + checkout (3 сервиса)",
      usersAffected: "~12 400 / час",
      revenueAtRisk: "$48.2k / час",
      etaToFix: "8–12 минут (auto-remediation)",
      autoFixAvailable: true,
    },
    answer: baseAnswer,
    confidence: hyps[0]?.confidence ?? 86,
    confidenceBreakdown: [
      { label: "Покрытие источников", value: 92 },
      { label: "Согласованность рассуждений", value: 88 },
      { label: "Совпадение паттернов", value: 84 },
    ],
    tokensIn: 0,
    tokensOut: 0,
    costUsd: 0,
    phaseTimings: { plan: 0, search: 0, reason: 0, synthesize: 0, done: 0 },
  };
}

/* ============================================================
   Top Telemetry Ribbon — KPI ticker for executive demo
   ============================================================ */
function TelemetryRibbon() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 2200);
    return () => clearInterval(t);
  }, []);

  const kpis = useMemo(
    () => [
      { icon: CheckCircle2, label: "Resolved today", value: `${127 + (tick % 7)}`, accent: "text-emerald-400", delta: "+18%" },
      { icon: Clock, label: "Median MTTR", value: `${(8.4 - (tick % 3) * 0.1).toFixed(1)}m`, accent: "text-primary", delta: "−43%" },
      { icon: DollarSign, label: "Loss prevented", value: `$${(312 + tick * 0.3).toFixed(1)}k`, accent: "text-accent", delta: "+12%" },
      { icon: Cpu, label: "Models online", value: "4 / 4", accent: "text-foreground", delta: "healthy" },
      { icon: Radio, label: "Live signals/sec", value: `${1240 + ((tick * 17) % 220)}`, accent: "text-foreground", delta: "" },
    ],
    [tick],
  );

  return (
    <div className="shrink-0 border-b border-border/30 bg-surface-0/70 backdrop-blur-md px-6 py-2">
      <div className="flex items-center gap-5 overflow-x-auto custom-scrollbar">
        <div className="flex items-center gap-2 shrink-0">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">
            Live · Antifraud Ops
          </span>
        </div>
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="flex items-center gap-2 shrink-0">
              <Icon className={cn("w-3.5 h-3.5", k.accent)} />
              <div className="flex items-baseline gap-1.5">
                <span className={cn("text-[12px] font-mono font-semibold tabular-nums", k.accent)}>
                  {k.value}
                </span>
                <span className="text-[10px] text-muted-foreground">{k.label}</span>
                {k.delta && (
                  <span className="text-[10px] text-emerald-400/80 font-mono">{k.delta}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================
   Phase Rail — кинематографичный таймлайн с tagline
   ============================================================ */
function PhaseRail({ phase, timings }: { phase: Phase; timings?: Record<Phase, number> }) {
  const idx = PHASES.findIndex((p) => p.key === phase);
  const done = phase === "done";
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {PHASES.map((p, i) => {
        const Icon = p.icon;
        const active = !done && i === idx;
        const passed = done || i < idx;
        const dur = timings?.[p.key] ?? 0;
        return (
          <div key={p.key} className="flex items-center gap-1.5">
            <motion.div
              animate={active ? { boxShadow: ["0 0 0 hsl(var(--primary)/0.0)", "0 0 24px hsl(var(--primary)/0.5)", "0 0 0 hsl(var(--primary)/0.0)"] } : {}}
              transition={active ? { duration: 1.6, repeat: Infinity } : {}}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider border transition-all",
                passed && "border-primary/30 bg-primary/10 text-primary",
                active && "border-primary/60 bg-primary/15 text-primary",
                !passed && !active && "border-border/30 text-muted-foreground/50",
              )}
            >
              {active ? <Loader2 className="w-3 h-3 animate-spin" /> : passed ? <CheckCircle2 className="w-3 h-3" /> : <Icon className="w-3 h-3" />}
              {p.label}
              {dur > 0 && (
                <span className="ml-0.5 font-mono text-[9px] opacity-70">{(dur / 1000).toFixed(1)}s</span>
              )}
            </motion.div>
            {i < PHASES.length - 1 && (
              <div className={cn("h-px w-3", passed ? "bg-primary/40" : "bg-border/30")} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ============================================================
   Confidence — radial gauge + breakdown
   ============================================================ */
function ConfidenceGauge({ value, size = 56 }: { value: number; size?: number }) {
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (c * value) / 100;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="hsl(var(--border))" strokeWidth={4} fill="none" opacity={0.3} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="url(#confGrad)"
          strokeWidth={4}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          style={{ filter: "drop-shadow(0 0 6px hsl(var(--primary)/0.6))" }}
        />
        <defs>
          <linearGradient id="confGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="hsl(var(--accent))" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[11px] font-mono font-bold text-primary tabular-nums">{value}%</span>
      </div>
    </div>
  );
}

/* ============================================================
   Executive Impact Card — для бизнеса/руководства
   ============================================================ */
function ImpactCard({ impact }: { impact: BusinessImpact }) {
  const sevConf = {
    critical: { color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30", label: "CRITICAL" },
    high: { color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/30", label: "HIGH" },
    medium: { color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/30", label: "MEDIUM" },
    low: { color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30", label: "LOW" },
  }[impact.severity];

  const cells = [
    { icon: Target, label: "Blast radius", value: impact.blastRadius },
    { icon: Users, label: "Users affected", value: impact.usersAffected },
    { icon: DollarSign, label: "Revenue at risk", value: impact.revenueAtRisk, accent: "text-orange-300" },
    { icon: Clock, label: "ETA to fix", value: impact.etaToFix, accent: "text-emerald-300" },
  ];

  return (
    <div className="rounded-xl border border-border/40 bg-gradient-to-br from-surface-1/80 to-surface-0/40 backdrop-blur-md overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/30 bg-surface-2/40">
        <div className="flex items-center gap-2">
          <Gauge className="w-3.5 h-3.5 text-primary" />
          <span className="text-[10px] uppercase tracking-[0.18em] font-bold text-foreground/80">
            Executive impact
          </span>
        </div>
        <div className={cn("flex items-center gap-1.5 px-2 py-0.5 rounded-full border", sevConf.bg, sevConf.border)}>
          <AlertTriangle className={cn("w-2.5 h-2.5", sevConf.color)} />
          <span className={cn("text-[9px] font-bold tracking-wider", sevConf.color)}>{sevConf.label}</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-px bg-border/20">
        {cells.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="bg-surface-1/40 px-3 py-2.5">
              <div className="flex items-center gap-1.5 mb-1">
                <Icon className="w-3 h-3 text-muted-foreground/70" />
                <span className="text-[9px] uppercase tracking-wider text-muted-foreground">{c.label}</span>
              </div>
              <div className={cn("text-[12px] font-semibold", c.accent || "text-foreground/95")}>
                {c.value}
              </div>
            </div>
          );
        })}
      </div>
      {impact.autoFixAvailable && (
        <div className="px-4 py-2.5 border-t border-border/30 bg-primary/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-primary" />
            <span className="text-[11px] font-medium text-foreground/90">Auto-remediation готов</span>
          </div>
          <button
            className="text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg text-primary-foreground transition-all hover:scale-[1.03]"
            style={{
              background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))",
              boxShadow: "0 8px 22px -10px hsl(var(--primary) / 0.6)",
            }}
          >
            Apply fix <ArrowRight className="inline w-3 h-3 ml-1" />
          </button>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   Hypothesis Ranking — ранжированные гипотезы с evidence
   ============================================================ */
function HypothesisRanking({ items }: { items: RankedHypothesis[] }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="rounded-xl border border-border/40 bg-surface-1/50 backdrop-blur-md overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/30 bg-surface-2/40">
        <GitBranch className="w-3.5 h-3.5 text-primary" />
        <span className="text-[10px] uppercase tracking-[0.18em] font-bold text-foreground/80">
          Ranked hypotheses
        </span>
        <span className="ml-auto text-[10px] text-muted-foreground font-mono">{items.length} candidates</span>
      </div>
      <div className="divide-y divide-border/20">
        {items.map((h, i) => {
          const isOpen = open === i;
          const isTop = i === 0;
          return (
            <div key={i}>
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                className="w-full px-4 py-2.5 hover:bg-surface-2/30 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold font-mono shrink-0",
                    isTop ? "bg-primary/20 text-primary border border-primary/40" : "bg-surface-2/60 text-muted-foreground border border-border/30",
                  )}>
                    #{i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-medium text-foreground/95 truncate">{h.title}</div>
                    <div className="mt-1 flex items-center gap-2">
                      <div className="relative flex-1 h-1 rounded-full bg-surface-2/60 overflow-hidden max-w-[160px]">
                        <motion.div
                          className="absolute inset-y-0 left-0 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${h.probability}%` }}
                          transition={{ duration: 0.9, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                          style={{
                            background: isTop
                              ? "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)))"
                              : "hsl(var(--muted-foreground) / 0.4)",
                            boxShadow: isTop ? "0 0 8px hsl(var(--primary)/0.5)" : "none",
                          }}
                        />
                      </div>
                      <span className={cn("text-[10px] font-mono tabular-nums", isTop ? "text-primary font-bold" : "text-muted-foreground")}>
                        {h.probability}%
                      </span>
                    </div>
                  </div>
                  <ChevronRight className={cn("w-3.5 h-3.5 text-muted-foreground transition-transform", isOpen && "rotate-90")} />
                </div>
              </button>
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-3 pl-[52px] space-y-2.5">
                      <div>
                        <div className="text-[9px] uppercase tracking-wider text-muted-foreground mb-1.5">Evidence</div>
                        <ul className="space-y-1">
                          {h.evidence.map((e, j) => (
                            <li key={j} className="flex items-start gap-2 text-[11px] text-foreground/80">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400/80 mt-0.5 shrink-0" />
                              <span>{e}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="rounded-lg bg-primary/5 border border-primary/20 px-3 py-2">
                        <div className="text-[9px] uppercase tracking-wider text-primary/80 mb-0.5">Recommended fix</div>
                        <div className="text-[11px] text-foreground/90">{h.fix}</div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================
   Main Pipeline Card — hero of the page
   ============================================================ */
function PipelineCard({ run }: { run: PipelineRun }) {
  const [section, setSection] = useState<"plan" | "tools" | "reason" | null>("reason");
  const toggle = (k: typeof section) => setSection((s) => (s === k ? null : k));

  // current revealed thoughts (animated)
  const revealedThoughts = run.thoughts.map((th, i) => {
    const charsRevealed = Math.max(0, run.thoughtsRevealed - i * 60);
    return th.slice(0, Math.min(th.length, charsRevealed));
  });

  return (
    <div
      className="rounded-2xl border border-border/40 bg-surface-1/60 backdrop-blur-xl overflow-hidden"
      style={{ boxShadow: "0 20px 60px -24px hsl(var(--primary) / 0.25)" }}
    >
      {/* Header: phase rail + confidence gauge */}
      <div className="flex items-center justify-between gap-4 px-5 py-3 border-b border-border/30 bg-gradient-to-r from-surface-2/50 via-surface-1/30 to-surface-2/50">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <Brain className="w-3 h-3 text-primary" />
            <span className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground font-bold">
              Reasoning pipeline
            </span>
            <span className="text-[9px] font-mono text-muted-foreground/60 ml-auto">
              {run.tokensIn + run.tokensOut} tok · ${run.costUsd.toFixed(4)}
            </span>
          </div>
          <PhaseRail phase={run.phase} timings={run.phaseTimings} />
        </div>
        <ConfidenceGauge value={run.confidence} />
      </div>

      <div className="divide-y divide-border/20">
        {/* Plan */}
        <CollapsibleRow
          icon={Layers}
          label="Plan"
          meta={`${run.plan.length} шагов`}
          open={section === "plan"}
          onToggle={() => toggle("plan")}
        >
          <ol className="space-y-1.5 text-[12px] text-foreground/85">
            {run.plan.map((p, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-0.5 w-4 h-4 rounded-md bg-primary/10 text-primary text-[9px] font-mono flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <span>{p}</span>
              </li>
            ))}
          </ol>
        </CollapsibleRow>

        {/* Tool calls */}
        <CollapsibleRow
          icon={Terminal}
          label="Tool calls"
          meta={`${run.toolCalls.filter((t) => t.status === "done").length}/${run.toolCalls.length}`}
          open={section === "tools"}
          onToggle={() => toggle("tools")}
        >
          <div className="space-y-1.5 font-mono text-[11px]">
            {run.toolCalls.map((t) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                className={cn(
                  "flex items-center gap-2 rounded-md border px-2.5 py-1.5",
                  t.status === "running" && "bg-amber-500/5 border-amber-500/30",
                  t.status === "done" && "bg-emerald-500/5 border-emerald-500/20",
                  t.status === "pending" && "bg-surface-0/40 border-border/20 opacity-50",
                )}
              >
                {t.status === "running" ? (
                  <Loader2 className="w-3 h-3 text-amber-400 animate-spin shrink-0" />
                ) : t.status === "done" ? (
                  <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                ) : (
                  <CircleDot className="w-3 h-3 text-muted-foreground/50 shrink-0" />
                )}
                <span className="text-primary font-semibold">{t.tool}</span>
                <span className="text-muted-foreground">(</span>
                <span className="text-accent truncate">{t.arg}</span>
                <span className="text-muted-foreground">)</span>
                {t.status === "done" && t.durationMs && (
                  <span className="ml-auto text-[10px] text-emerald-400/70">{t.durationMs}ms</span>
                )}
              </motion.div>
            ))}
          </div>
        </CollapsibleRow>

        {/* Live Reasoning Stream — always visible during streaming */}
        <CollapsibleRow
          icon={Brain}
          label="Reasoning stream"
          meta={`${revealedThoughts.filter(Boolean).length}/${run.thoughts.length}`}
          open={section === "reason"}
          onToggle={() => toggle("reason")}
        >
          <div className="space-y-2.5 relative">
            {/* timeline rail */}
            <div className="absolute left-1.5 top-1 bottom-1 w-px bg-gradient-to-b from-primary/40 via-primary/20 to-transparent" />
            {run.thoughts.map((full, i) => {
              const text = revealedThoughts[i];
              if (!text) return null;
              const isStreaming = text.length < full.length;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="relative pl-6"
                >
                  <span
                    className={cn(
                      "absolute left-0 top-1.5 w-3 h-3 rounded-full border-2",
                      isStreaming
                        ? "border-primary bg-primary/40 animate-pulse"
                        : "border-primary/60 bg-primary/20",
                    )}
                    style={{ boxShadow: isStreaming ? "0 0 10px hsl(var(--primary)/0.7)" : "none" }}
                  />
                  <p className="text-[12.5px] text-foreground/85 leading-relaxed font-serif">
                    {text}
                    {isStreaming && (
                      <span className="inline-block w-0.5 h-3.5 bg-primary ml-0.5 align-middle animate-pulse" />
                    )}
                  </p>
                </motion.div>
              );
            })}
            {revealedThoughts.every((t) => !t) && (
              <div className="pl-6 text-[11px] text-muted-foreground italic">Подключаюсь к контексту…</div>
            )}
          </div>
        </CollapsibleRow>

        {/* Synthesis — final answer */}
        {run.phase === "done" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="px-5 py-4 bg-gradient-to-b from-transparent to-primary/[0.06]"
          >
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span className="text-[9px] uppercase tracking-[0.2em] text-primary font-bold">
                Synthesis
              </span>
              <div className="ml-auto flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
                <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" />
                <span className="text-[9px] font-bold text-emerald-400 tracking-wider">
                  CROSS-VERIFIED · {run.sources.length} SOURCES
                </span>
              </div>
            </div>
            <p className="text-[13px] text-foreground/95 leading-relaxed whitespace-pre-line font-serif">
              {run.answer}
            </p>
            {run.sources.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {run.sources.slice(0, 4).map((s, i) => (
                  <span
                    key={s.id}
                    className="inline-flex items-center gap-1 rounded-full border border-border/40 bg-surface-2/50 px-2 py-0.5 text-[10px] text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors cursor-pointer"
                  >
                    <span className="font-mono text-primary/70">[{i + 1}]</span>
                    {s.title.slice(0, 30)}…
                  </span>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Hypothesis ranking + impact — appear after done */}
      {run.phase === "done" && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-surface-0/40 border-t border-border/30"
        >
          <HypothesisRanking items={run.hypotheses} />
          <ImpactCard impact={run.impact} />
        </motion.div>
      )}
    </div>
  );
}

function CollapsibleRow({
  icon: Icon, label, meta, open, onToggle, children,
}: {
  icon: typeof Brain; label: string; meta: string; open: boolean;
  onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-5 py-2.5 hover:bg-surface-2/30 transition-colors text-left"
      >
        <Icon className="w-3.5 h-3.5 text-primary/80" />
        <span className="text-[12px] font-semibold text-foreground/90">{label}</span>
        <span className="text-[10px] text-muted-foreground font-mono">{meta}</span>
        <ChevronRight
          className={cn(
            "w-3.5 h-3.5 ml-auto text-muted-foreground transition-transform",
            open && "rotate-90",
          )}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ============================================================
   Agent Mind Panel 2.0 — Neural Activity + KG + Confidence
   ============================================================ */
function NeuralActivity({ active }: { active: boolean }) {
  return (
    <div className="relative h-16 rounded-lg bg-surface-0/60 border border-border/30 overflow-hidden">
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 64" preserveAspectRatio="none">
        {Array.from({ length: 28 }).map((_, i) => {
          const x = (i / 27) * 200;
          return (
            <motion.line
              key={i}
              x1={x}
              y1={32}
              x2={x}
              y2={32}
              stroke="hsl(var(--primary))"
              strokeWidth={1.5}
              strokeLinecap="round"
              animate={
                active
                  ? {
                      y1: [32, 32 - (8 + Math.sin(i) * 12), 32],
                      y2: [32, 32 + (8 + Math.cos(i) * 12), 32],
                      opacity: [0.4, 1, 0.4],
                    }
                  : { y1: 32, y2: 32, opacity: 0.2 }
              }
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.04,
                ease: "easeInOut",
              }}
            />
          );
        })}
      </svg>
      <div className="absolute top-1.5 left-2 text-[9px] uppercase tracking-wider text-primary/80 font-bold">
        Neural activity
      </div>
      <div className="absolute bottom-1.5 right-2 text-[9px] font-mono text-muted-foreground">
        {active ? "thinking…" : "idle"}
      </div>
    </div>
  );
}

function KnowledgeGraph({ sources }: { sources: KBSource[] }) {
  const nodes = sources.slice(0, 5);
  return (
    <div className="relative h-32 rounded-lg bg-surface-0/60 border border-border/30 overflow-hidden">
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 128">
        {/* edges from center */}
        {nodes.map((_, i) => {
          const angle = (i / nodes.length) * Math.PI * 2 - Math.PI / 2;
          const x2 = 100 + Math.cos(angle) * 52;
          const y2 = 64 + Math.sin(angle) * 42;
          return (
            <motion.line
              key={`e-${i}`}
              x1={100}
              y1={64}
              x2={x2}
              y2={y2}
              stroke="hsl(var(--primary) / 0.4)"
              strokeWidth={1}
              strokeDasharray="2 3"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ delay: i * 0.1, duration: 0.6 }}
            />
          );
        })}
        {/* center node = agent */}
        <motion.circle
          cx={100}
          cy={64}
          r={9}
          fill="hsl(var(--primary))"
          animate={{ r: [9, 11, 9] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{ filter: "drop-shadow(0 0 8px hsl(var(--primary)/0.7))" }}
        />
        <text x={100} y={67.5} textAnchor="middle" fontSize="8" fill="hsl(var(--primary-foreground))" fontWeight="bold">
          AI
        </text>
        {/* source nodes */}
        {nodes.map((s, i) => {
          const angle = (i / nodes.length) * Math.PI * 2 - Math.PI / 2;
          const x = 100 + Math.cos(angle) * 52;
          const y = 64 + Math.sin(angle) * 42;
          return (
            <motion.g
              key={s.id}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + i * 0.08 }}
            >
              <circle cx={x} cy={y} r={5} fill="hsl(var(--accent))" opacity={0.9} />
              <text x={x} y={y + 12} textAnchor="middle" fontSize="6" fill="hsl(var(--muted-foreground))">
                [{i + 1}]
              </text>
            </motion.g>
          );
        })}
      </svg>
      <div className="absolute top-1.5 left-2 text-[9px] uppercase tracking-wider text-primary/80 font-bold">
        Knowledge graph
      </div>
      <div className="absolute bottom-1.5 right-2 text-[9px] font-mono text-muted-foreground">
        {nodes.length} nodes · {nodes.length} edges
      </div>
    </div>
  );
}

function ConfidenceBreakdown({ items }: { items: { label: string; value: number }[] }) {
  return (
    <div className="space-y-1.5">
      {items.map((it) => (
        <div key={it.label}>
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[10px] text-muted-foreground">{it.label}</span>
            <span className="text-[10px] font-mono text-primary">{it.value}%</span>
          </div>
          <div className="h-1 rounded-full bg-surface-2/60 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${it.value}%` }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)))" }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function AgentMindPanel({ run, incident, isStreaming }: { run: PipelineRun | null; incident: Incident | null; isStreaming: boolean }) {
  return (
    <aside className="hidden lg:flex w-[380px] shrink-0 flex-col border-l border-border/40 bg-surface-0/60 backdrop-blur-xl">
      <div className="px-4 pt-4 pb-3 border-b border-border/30">
        <div className="flex items-center gap-2">
          <div className="relative w-8 h-8 rounded-xl bg-gradient-to-br from-primary/40 to-accent/25 flex items-center justify-center">
            <Brain className="w-4 h-4 text-primary" />
            {isStreaming && (
              <motion.span
                className="absolute inset-0 rounded-xl border-2 border-primary/60"
                animate={{ scale: [1, 1.2, 1], opacity: [0.7, 0, 0.7] }}
                transition={{ duration: 1.6, repeat: Infinity }}
              />
            )}
          </div>
          <div>
            <div className="text-[13px] font-bold tracking-tight">Agent Mind</div>
            <div className="text-[10px] text-muted-foreground">Live cognitive telemetry</div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 custom-scrollbar">
        <NeuralActivity active={isStreaming} />

        {!run ? (
          <div className="text-[11px] text-muted-foreground/70 leading-relaxed mt-2">
            Задайте вопрос — здесь появятся живые инструменты, которые вызывает агент,
            источники из базы знаний, его внутренние рассуждения и связи между ними.
          </div>
        ) : (
          <>
            <Section icon={Database} title="Knowledge graph">
              <KnowledgeGraph sources={run.sources} />
            </Section>

            <Section icon={Terminal} title="Tool stream">
              <div className="space-y-1">
                {run.toolCalls.map((t) => (
                  <div
                    key={t.id}
                    className={cn(
                      "rounded-md border px-2 py-1.5 font-mono text-[10px] transition-all",
                      t.status === "running" && "bg-amber-500/5 border-amber-500/30",
                      t.status === "done" && "bg-emerald-500/5 border-emerald-500/20",
                      t.status === "pending" && "bg-surface-1/30 border-border/20 opacity-40",
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      {t.status === "running" ? (
                        <Loader2 className="w-2.5 h-2.5 animate-spin text-amber-400 shrink-0" />
                      ) : t.status === "done" ? (
                        <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                      ) : (
                        <CircleDot className="w-2.5 h-2.5 text-muted-foreground/40 shrink-0" />
                      )}
                      <span className="text-primary font-semibold truncate">{t.tool}</span>
                      {t.status === "done" && t.durationMs && (
                        <span className="ml-auto text-emerald-400/70">{t.durationMs}ms</span>
                      )}
                    </div>
                    <div className="pl-4 text-muted-foreground truncate text-[9px]">{t.arg}</div>
                  </div>
                ))}
              </div>
            </Section>

            <Section icon={ShieldCheck} title="Confidence breakdown">
              <ConfidenceBreakdown items={run.confidenceBreakdown} />
              <div className="mt-2 flex items-center justify-between rounded-md bg-primary/5 border border-primary/20 px-2 py-1.5">
                <span className="text-[9px] uppercase tracking-wider text-primary font-bold">Overall</span>
                <span className="text-[12px] font-mono font-bold text-primary">{run.confidence}%</span>
              </div>
            </Section>

            <Section icon={Activity} title="Compute">
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="rounded-md bg-surface-1/60 border border-border/30 px-2 py-1.5">
                  <div className="text-muted-foreground text-[9px]">Tokens</div>
                  <div className="font-mono text-foreground/90">
                    {run.tokensIn} <span className="text-muted-foreground">in</span> · {run.tokensOut} <span className="text-muted-foreground">out</span>
                  </div>
                </div>
                <div className="rounded-md bg-surface-1/60 border border-border/30 px-2 py-1.5">
                  <div className="text-muted-foreground text-[9px]">Cost</div>
                  <div className="font-mono text-foreground/90">${run.costUsd.toFixed(4)}</div>
                </div>
                <div className="rounded-md bg-surface-1/60 border border-border/30 px-2 py-1.5">
                  <div className="text-muted-foreground text-[9px]">Elapsed</div>
                  <div className="font-mono text-foreground/90">
                    {((Date.now() - run.startedAt) / 1000).toFixed(1)}s
                  </div>
                </div>
                <div className="rounded-md bg-surface-1/60 border border-border/30 px-2 py-1.5">
                  <div className="text-muted-foreground text-[9px]">Model</div>
                  <div className="font-mono text-foreground/90">gemini-2.5</div>
                </div>
              </div>
            </Section>

            {incident && (
              <Section icon={BookMarked} title="Context">
                <div className="rounded-md bg-surface-1/60 border border-border/30 px-2.5 py-2 text-[11px]">
                  <div className="font-mono text-primary text-[10px]">{incident.id}</div>
                  <div className="mt-0.5 text-foreground/85">{incident.title}</div>
                </div>
              </Section>
            )}
          </>
        )}
      </div>
    </aside>
  );
}

function Section({
  icon: Icon, title, badge, children,
}: { icon: typeof Brain; title: string; badge?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon className="w-3 h-3 text-primary/70" />
        <span className="text-[9px] uppercase tracking-[0.18em] font-bold text-muted-foreground">
          {title}
        </span>
        {badge && (
          <span className="ml-auto text-[10px] font-mono text-primary/80">{badge}</span>
        )}
      </div>
      {children}
    </div>
  );
}

/* ============================================================
   Page
   ============================================================ */

const STARTERS = [
  "Что вызвало рост error_rate за последние 30 минут?",
  "Покажи похожие инциденты в payments-домене",
  "Сформируй ранжированные гипотезы по деградации p99",
  "Оцени бизнес-импакт текущих инцидентов за час",
];

export default function RootCauseChatStream() {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [extra, setExtra] = useState<Incident[]>([]);
  const all = [...extra, ...mockIncidents];
  const incident = all.find((i) => i.id === selectedId) ?? null;
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastRun = messages.filter((m) => m.pipeline).slice(-1)[0]?.pipeline ?? null;
  const stopRef = useRef(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const advancePipeline = useCallback(async (msgId: string) => {
    const phaseDurations: Record<Phase, number> = {
      plan: 600,
      search: 1400,
      reason: 2400,
      synthesize: 900,
      done: 0,
    };
    const phases: Phase[] = ["plan", "search", "reason", "synthesize", "done"];

    for (const ph of phases) {
      if (stopRef.current) return;
      const phaseStart = Date.now();

      // Mark phase
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== msgId || !m.pipeline) return m;
          return {
            ...m,
            pipeline: { ...m.pipeline, phase: ph, phaseStartedAt: phaseStart },
          };
        }),
      );

      // Animate tool calls during search
      if (ph === "search") {
        const toolIdxs = [0, 1, 2, 3, 4];
        for (const idx of toolIdxs) {
          if (stopRef.current) return;
          // start running
          setMessages((prev) =>
            prev.map((m) => {
              if (m.id !== msgId || !m.pipeline) return m;
              const tc = m.pipeline.toolCalls.map((t, i) =>
                i === idx ? { ...t, status: "running" as const } : t,
              );
              return { ...m, pipeline: { ...m.pipeline, toolCalls: tc } };
            }),
          );
          await new Promise((r) => setTimeout(r, 220));
          if (stopRef.current) return;
          const dur = 80 + Math.floor(Math.random() * 240);
          setMessages((prev) =>
            prev.map((m) => {
              if (m.id !== msgId || !m.pipeline) return m;
              const tc = m.pipeline.toolCalls.map((t, i) =>
                i === idx ? { ...t, status: "done" as const, durationMs: dur } : t,
              );
              return {
                ...m,
                pipeline: {
                  ...m.pipeline,
                  toolCalls: tc,
                  tokensIn: m.pipeline.tokensIn + 120 + Math.floor(Math.random() * 80),
                },
              };
            }),
          );
        }
      }

      // Animate thoughts streaming during reason
      if (ph === "reason") {
        const totalChars = 1200;
        const stepMs = 30;
        const steps = Math.floor(phaseDurations.reason / stepMs);
        const charsPerStep = Math.ceil(totalChars / steps);
        for (let s = 0; s < steps; s++) {
          if (stopRef.current) return;
          await new Promise((r) => setTimeout(r, stepMs));
          setMessages((prev) =>
            prev.map((m) => {
              if (m.id !== msgId || !m.pipeline) return m;
              return {
                ...m,
                pipeline: {
                  ...m.pipeline,
                  thoughtsRevealed: m.pipeline.thoughtsRevealed + charsPerStep,
                  tokensOut: m.pipeline.tokensOut + 4,
                  costUsd: m.pipeline.costUsd + 0.00012,
                },
              };
            }),
          );
        }
      } else {
        await new Promise((r) => setTimeout(r, phaseDurations[ph]));
      }

      // Record phase timing
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== msgId || !m.pipeline) return m;
          return {
            ...m,
            pipeline: {
              ...m.pipeline,
              phaseTimings: {
                ...m.pipeline.phaseTimings,
                [ph]: Date.now() - phaseStart,
              },
            },
          };
        }),
      );
    }
    setIsStreaming(false);
  }, []);

  const send = useCallback(() => {
    if (!input.trim() || isStreaming) return;
    const userMsg: ChatMsg = { id: crypto.randomUUID(), role: "user", text: input };
    const pipe = makePipeline(input, incident);
    const aiMsg: ChatMsg = {
      id: crypto.randomUUID(),
      role: "assistant",
      text: pipe.answer,
      pipeline: pipe,
    };
    setMessages((prev) => [...prev, userMsg, aiMsg]);
    setInput("");
    setIsStreaming(true);
    stopRef.current = false;
    advancePipeline(aiMsg.id);
  }, [input, incident, isStreaming, advancePipeline]);

  const stop = () => {
    stopRef.current = true;
    setIsStreaming(false);
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <RCModeSwitcher />

      {/* Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 50% at 70% 0%, hsl(var(--primary) / 0.10), transparent 70%), radial-gradient(ellipse 50% 40% at 0% 100%, hsl(var(--accent) / 0.07), transparent 70%)",
          }}
        />
        {/* subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      <div className="relative z-10 flex w-full">
        <RCSidebar
          incidents={all}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onNewChat={() => {
            setSelectedId(null);
            setMessages([]);
          }}
          onOpenSearch={() => setSearchOpen(true)}
          lastScanTime={null}
          isScanning={false}
        />

        <main className="flex-1 flex min-w-0">
          <div className="flex-1 flex flex-col min-w-0">
            {/* Telemetry Ribbon */}
            <div className="pt-12">
              <TelemetryRibbon />
            </div>

            {/* Header */}
            <header className="shrink-0 px-6 py-3 border-b border-border/30 bg-surface-0/40 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-primary/30 to-accent/20 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <motion.span
                    className="absolute inset-0 rounded-xl border border-primary/40"
                    animate={{ scale: [1, 1.18, 1], opacity: [0.6, 0, 0.6] }}
                    transition={{ duration: 2.4, repeat: Infinity }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h1 className="text-sm font-bold tracking-tight">Reasoning Stream</h1>
                    <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-primary px-1.5 py-0.5 rounded bg-primary/10 border border-primary/30">
                      Executive
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {incident
                      ? `${incident.id} · ${incident.title}`
                      : "Прозрачный pipeline → ранжирование гипотез → бизнес-импакт → авто-ремидиация"}
                  </p>
                </div>
              </div>
            </header>

            {/* Messages */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto px-6 py-6 space-y-6 custom-scrollbar"
            >
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center max-w-lg mx-auto">
                  <motion.div
                    className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/30 to-accent/20 flex items-center justify-center mb-5"
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Brain className="w-8 h-8 text-primary" />
                    <motion.span
                      className="absolute inset-0 rounded-2xl border border-primary/40"
                      animate={{ scale: [1, 1.2, 1], opacity: [0.6, 0, 0.6] }}
                      transition={{ duration: 2.4, repeat: Infinity }}
                    />
                    <motion.span
                      className="absolute inset-0 rounded-2xl border border-accent/30"
                      animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0, 0.4] }}
                      transition={{ duration: 2.4, repeat: Infinity, delay: 0.6 }}
                    />
                  </motion.div>
                  <h2 className="text-lg font-bold mb-1.5 tracking-tight">Спроси у AI-агента</h2>
                  <p className="text-[12px] text-muted-foreground mb-5 leading-relaxed max-w-sm">
                    Я разложу мышление на этапы, покажу источники, ранжирую гипотезы и оценю
                    бизнес-импакт. Каждый шаг — прозрачный.
                  </p>
                  <div className="grid gap-2 w-full">
                    {STARTERS.map((s) => (
                      <button
                        key={s}
                        onClick={() => setInput(s)}
                        className="text-left text-[12px] px-3.5 py-2.5 rounded-xl border border-border/30 bg-surface-1/50 hover:border-primary/40 hover:bg-primary/5 transition-all group"
                      >
                        <Sparkles className="inline w-3 h-3 mr-2 text-primary group-hover:rotate-12 transition-transform" />
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
                >
                  {m.role === "user" ? (
                    <div className="max-w-[78%] rounded-2xl rounded-br-md px-4 py-2.5 text-[13px] bg-primary/15 border border-primary/25 text-foreground/95">
                      {m.text}
                    </div>
                  ) : (
                    <div className="max-w-[92%] w-full">
                      {m.pipeline ? <PipelineCard run={m.pipeline} /> : (
                        <div className="text-sm text-foreground/90">{m.text}</div>
                      )}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Input */}
            <div className="shrink-0 border-t border-border/40 bg-surface-0/60 backdrop-blur-md px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
                    placeholder="Опиши симптом, спроси о причине, потребуй гипотезу…"
                    disabled={isStreaming}
                    className="w-full rounded-xl bg-surface-1/60 border border-border/40 px-4 py-3 text-sm outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 disabled:opacity-50"
                  />
                </div>
                {isStreaming ? (
                  <button
                    onClick={stop}
                    className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center bg-destructive/15 border border-destructive/30 text-destructive hover:bg-destructive/25 transition-all"
                  >
                    <Square className="w-4 h-4 fill-current" />
                  </button>
                ) : (
                  <button
                    onClick={send}
                    disabled={!input.trim()}
                    className={cn(
                      "shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                      input.trim()
                        ? "text-primary-foreground"
                        : "bg-surface-2/60 text-muted-foreground/40 cursor-not-allowed",
                    )}
                    style={
                      input.trim()
                        ? {
                            background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))",
                            boxShadow: "0 10px 22px -10px hsl(var(--primary) / 0.45)",
                          }
                        : undefined
                    }
                  >
                    <Send className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="mt-2 flex items-center gap-4 text-[10px] text-muted-foreground/70">
                <span className="inline-flex items-center gap-1">
                  <Network className="w-3 h-3" /> Pipeline в реальном времени
                </span>
                <span className="inline-flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Cross-verified источниками
                </span>
                <span className="inline-flex items-center gap-1">
                  <Zap className="w-3 h-3" /> Auto-remediation готов
                </span>
              </div>
            </div>
          </div>

          <AgentMindPanel run={lastRun} incident={incident} isStreaming={isStreaming} />
        </main>
      </div>

      <RCSearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        incidents={all}
        onSelect={(id) => setSelectedId(id)}
        onCreateIncident={(inc) => {
          setExtra((p) => (p.find((x) => x.id === inc.id) ? p : [inc, ...p]));
          setSelectedId(inc.id);
        }}
      />
    </div>
  );
}
