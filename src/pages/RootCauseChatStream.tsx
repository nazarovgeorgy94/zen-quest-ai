import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Sparkles, Brain, Search, Database, Network, ShieldCheck,
  Zap, FileSearch, Terminal, ChevronRight, Activity, Loader2, Square,
  CircleDot, Layers, BookMarked, Waves, Target, Crown, Lightbulb,
  TrendingUp, Mic, Paperclip,
} from "lucide-react";
import { cn } from "@/lib/utils";
import RCSearchModal from "@/components/root-cause/RCSearchModal";
import RCModeSwitcher from "@/components/root-cause/RCModeSwitcher";
import StreamSidebar from "@/components/root-cause/stream/StreamSidebar";
import MissionBriefing, { type MissionBriefingData } from "@/components/root-cause/stream/MissionBriefing";
import HypothesisRace, { type RaceHypothesis } from "@/components/root-cause/stream/HypothesisRace";
import TelemetryHUD from "@/components/root-cause/stream/TelemetryHUD";
import AgentOrb from "@/components/root-cause/stream/AgentOrb";
import { mockIncidents } from "@/lib/mockIncidents";
import {
  Incident, getMockAIResponse, mockHypotheses, getSeverityColor,
} from "@/lib/rootCauseData";

/* ============================================================
   /root-cause/chat-1 — Reasoning Stream (Mission Control Edition)
   Executive-grade WOW: Mission Briefing → Pipeline → Hypothesis Race
   + Telemetry HUD + Agent Orb + bespoke Mission Control sidebar.
   ============================================================ */

type Phase = "plan" | "search" | "reason" | "synthesize" | "done";

interface ToolCall {
  id: string;
  tool: string;
  arg: string;
  status: "running" | "done";
}
interface KBSource {
  id: string;
  title: string;
  type: "doc" | "log" | "metric" | "incident";
  match: number;
  excerpt: string;
}
interface PipelineRun {
  id: string;
  phase: Phase;
  plan: string[];
  thoughts: string[];
  toolCalls: ToolCall[];
  sources: KBSource[];
  hypotheses: RaceHypothesis[];
  briefing: MissionBriefingData;
  answer: string;
  confidence: number;
}
interface ChatMsg {
  id: string;
  role: "user" | "assistant";
  text: string;
  pipeline?: PipelineRun;
}

const PHASES: { key: Phase; label: string; icon: typeof Brain; desc: string }[] = [
  { key: "plan",       label: "Plan",       icon: Layers,    desc: "декомпозиция задачи" },
  { key: "search",     label: "Search",     icon: Search,    desc: "сбор контекста" },
  { key: "reason",     label: "Reason",     icon: Brain,     desc: "построение гипотез" },
  { key: "synthesize", label: "Synthesize", icon: Sparkles,  desc: "финальный ответ" },
];

const PHASE_LABEL: Record<Phase, string> = {
  plan: "Plan",
  search: "Search",
  reason: "Reason",
  synthesize: "Synthesize",
  done: "Done",
};

const TOOLS = [
  { tool: "kb.search",        arg: "antifraud rules" },
  { tool: "logs.correlate",   arg: "service=payments,5m" },
  { tool: "metrics.fetch",    arg: "p99_latency,error_rate" },
  { tool: "incidents.similar",arg: "vector(embed)" },
];

const KB_POOL: Omit<KBSource, "id">[] = [
  { title: "Antifraud Rules Engine — Decision Pipeline", type: "doc",      match: 94, excerpt: "Decision pipeline applies score threshold > 0.78..." },
  { title: "INC-2741 — Payments degradation postmortem", type: "incident", match: 88, excerpt: "Root cause: stale cache after deploy at 14:02..." },
  { title: "payments-api error_rate spike (last 30m)",   type: "metric",   match: 82, excerpt: "error_rate climbed from 0.4% to 6.8% within 90s..." },
  { title: "kafka-consumer lag warnings",                type: "log",      match: 76, excerpt: "consumer-group=fraud-scoring lag=12.4k messages..." },
  { title: "Feature flag rollouts — last 24h",           type: "doc",      match: 71, excerpt: "flag `score_v3_canary` enabled for 25% traffic..." },
];

function makePipeline(question: string, incident: Incident | null): PipelineRun {
  const hyps = (incident && mockHypotheses[incident.id]) || mockHypotheses.default || [];
  const sev = (incident?.severity ?? "medium") as MissionBriefingData["severity"];
  const baseAnswer = incident
    ? getMockAIResponse(incident.id, question)
    : "Готов провести анализ. Опишите симптом или выберите инцидент в боковой панели.";

  // Race hypotheses (top 3)
  const race: RaceHypothesis[] = hyps.slice(0, 3).map((h) => ({
    title: h.title,
    confidence: h.confidence,
    rationale: h.explanation,
  }));
  while (race.length < 3) {
    race.push({
      title: ["Stale cache after deploy", "Kafka consumer backpressure", "Feature flag misconfig"][race.length],
      confidence: [82, 64, 51][race.length],
      rationale: "Сгенерировано на основе похожих паттернов в KB.",
    });
  }

  const briefing: MissionBriefingData = {
    severity: sev,
    tldr: incident
      ? `${incident.title} — наиболее вероятная причина: ${race[0].title.toLowerCase()}.`
      : "Готов к расследованию. Выберите инцидент или задайте вопрос.",
    businessImpact: {
      dollars: sev === "critical" ? "$48.2K/h" : sev === "high" ? "$12.8K/h" : "$3.1K/h",
      users: sev === "critical" ? "12 400" : sev === "high" ? "3 200" : "640",
      trend: "up",
    },
    eta: sev === "critical" ? "8–12 мин" : sev === "high" ? "15–25 мин" : "25–40 мин",
    recommended: {
      title: race[0].title,
      subtitle: hyps[0]?.recommendation || "Проверить и откатить последний релиз feature-flag.",
    },
    confidence: race[0].confidence,
    ready: false,
  };

  return {
    id: crypto.randomUUID(),
    phase: "plan",
    plan: [
      "Декомпозировать вопрос на подзадачи",
      "Поднять связанные KB-документы и инциденты",
      "Скоррелировать метрики и логи в окне ±15 минут",
      "Сформировать гипотезы с confidence-score",
    ],
    thoughts: [
      `Симптом указывает на ${sev === "critical" ? "критический" : "повышенный"} риск в payments-домене.`,
      "Похожий паттерн встречался в INC-2741 — стейл-кеш после деплоя.",
      "Метрики p99 и error_rate коррелируют с релизом flag `score_v3_canary`.",
      hyps[0]?.explanation || "Наиболее вероятная причина — конфигурация скоринга.",
    ],
    toolCalls: TOOLS.map((t, i) => ({ id: `tc-${i}`, ...t, status: "running" as const })),
    sources: KB_POOL.map((s, i) => ({ ...s, id: `kb-${i}` })),
    hypotheses: race,
    briefing,
    answer: baseAnswer,
    confidence: race[0].confidence,
  };
}

/* ====== Phase rail ====== */

function PhaseRail({ phase }: { phase: Phase }) {
  const idx = PHASES.findIndex((p) => p.key === phase);
  const done = phase === "done";
  return (
    <div className="flex items-center gap-1.5">
      {PHASES.map((p, i) => {
        const Icon = p.icon;
        const active = !done && i === idx;
        const passed = done || i < idx;
        return (
          <div key={p.key} className="flex items-center gap-1.5">
            <div
              className={cn(
                "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider border transition-all",
                passed && "border-primary/30 bg-primary/12 text-primary",
                active && "border-primary/60 bg-primary/15 text-primary shadow-[0_0_18px_hsl(var(--primary)/0.4)]",
                !passed && !active && "border-border/30 text-muted-foreground/60",
              )}
            >
              {active ? <Loader2 className="w-3 h-3 animate-spin" /> : <Icon className="w-3 h-3" />}
              {p.label}
            </div>
            {i < PHASES.length - 1 && (
              <div className={cn("h-px w-3", passed ? "bg-primary/40" : "bg-border/30")} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function ConfidenceMeter({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative w-20 h-1.5 rounded-full bg-surface-2 overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          style={{
            background: "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)))",
            boxShadow: "0 0 8px hsl(var(--primary) / 0.5)",
          }}
        />
      </div>
      <span className="text-[10px] font-mono tabular-nums text-primary">{value}%</span>
    </div>
  );
}

/* ====== Reasoning Spine — vertical glowing timeline ====== */

function ReasoningSpine({ phase }: { phase: Phase }) {
  const idx = PHASES.findIndex((p) => p.key === phase);
  const done = phase === "done";
  return (
    <div className="hidden md:flex flex-col items-center gap-2 pt-4 pr-4">
      {PHASES.map((p, i) => {
        const Icon = p.icon;
        const active = !done && i === idx;
        const passed = done || i < idx;
        return (
          <div key={p.key} className="flex flex-col items-center">
            <div className="relative">
              <div
                className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center border transition-all",
                  active && "border-primary bg-primary/15 text-primary",
                  passed && !active && "border-primary/40 bg-primary/10 text-primary",
                  !passed && !active && "border-border/30 text-muted-foreground/50 bg-surface-1/40",
                )}
                style={
                  active
                    ? { boxShadow: "0 0 18px hsl(var(--primary) / 0.5)" }
                    : undefined
                }
              >
                <Icon className="w-3 h-3" />
              </div>
              {active && (
                <motion.span
                  className="absolute inset-0 rounded-full border-2 border-primary/60"
                  animate={{ scale: [1, 1.5, 1], opacity: [0.7, 0, 0.7] }}
                  transition={{ duration: 1.6, repeat: Infinity }}
                />
              )}
            </div>
            {i < PHASES.length - 1 && (
              <div className="relative w-px h-8 my-0.5 bg-border/30 overflow-hidden">
                {passed && (
                  <motion.div
                    className="absolute inset-x-0 top-0 h-full"
                    style={{
                      background:
                        "linear-gradient(180deg, hsl(var(--primary)), hsl(var(--accent)))",
                    }}
                    initial={{ y: "-100%" }}
                    animate={{ y: "0%" }}
                    transition={{ duration: 0.5 }}
                  />
                )}
                {active && (
                  <motion.div
                    className="absolute inset-x-0 h-3 rounded-full"
                    style={{ background: "hsl(var(--primary))", boxShadow: "0 0 10px hsl(var(--primary))" }}
                    animate={{ y: ["-100%", "300%"] }}
                    transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                  />
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ====== Pipeline card ====== */

function PipelineCard({ run }: { run: PipelineRun }) {
  const [expanded, setExpanded] = useState<Phase | null>(null);
  const toggle = (k: Phase) => setExpanded((e) => (e === k ? null : k));

  return (
    <div
      className="rounded-2xl border border-border/40 bg-surface-1/60 backdrop-blur-md overflow-hidden"
      style={{ boxShadow: "0 14px 44px -18px hsl(var(--primary) / 0.22)" }}
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border/30 bg-surface-2/30">
        <PhaseRail phase={run.phase} />
        <ConfidenceMeter value={run.confidence} />
      </div>

      <div className="divide-y divide-border/20">
        <CollapsibleRow
          icon={Layers} label="Plan" meta={`${run.plan.length} steps`}
          open={expanded === "plan"} onToggle={() => toggle("plan")}
        >
          <ol className="space-y-1.5 text-[13px] text-foreground/85">
            {run.plan.map((p, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-1.5 w-1 h-1 rounded-full bg-primary shrink-0" />
                <span>{p}</span>
              </li>
            ))}
          </ol>
        </CollapsibleRow>

        <CollapsibleRow
          icon={Terminal} label="Tool calls"
          meta={`${run.toolCalls.filter((t) => t.status === "done").length}/${run.toolCalls.length}`}
          open={expanded === "search"} onToggle={() => toggle("search")}
        >
          <div className="space-y-1.5 font-mono text-[11px]">
            {run.toolCalls.map((t) => (
              <div key={t.id}
                className="flex items-center gap-2 rounded-md bg-surface-0/60 border border-border/30 px-2 py-1.5">
                <CircleDot className={cn("w-3 h-3 shrink-0",
                  t.status === "running" ? "text-amber-400 animate-pulse" : "text-emerald-400")} />
                <span className="text-primary">{t.tool}</span>
                <span className="text-muted-foreground">(</span>
                <span className="text-accent truncate">{t.arg}</span>
                <span className="text-muted-foreground">)</span>
                {t.status === "done" && <span className="ml-auto text-[10px] text-emerald-400/80">ok</span>}
              </div>
            ))}
          </div>
        </CollapsibleRow>

        <CollapsibleRow
          icon={Brain} label="Reasoning" meta={`${run.thoughts.length} thoughts`}
          open={expanded === "reason"} onToggle={() => toggle("reason")}
        >
          <div className="space-y-2">
            {run.thoughts.map((th, i) => (
              <div key={i} className="relative pl-4 text-[13px] text-foreground/85 leading-relaxed">
                <span className="absolute left-0 top-2 w-2 h-2 rounded-full bg-primary/70 shadow-[0_0_8px_hsl(var(--primary)/0.6)]" />
                {th}
              </div>
            ))}
          </div>
        </CollapsibleRow>

        <div className="px-4 py-4 bg-gradient-to-b from-transparent to-primary/[0.04]">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              Synthesis
            </span>
          </div>
          <p className="text-[13px] text-foreground/90 leading-relaxed whitespace-pre-line">
            {run.answer}
          </p>
          {run.sources.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {run.sources.slice(0, 4).map((s, i) => (
                <span key={s.id}
                  className="inline-flex items-center gap-1 rounded-full border border-border/40 bg-surface-2/50 px-2 py-0.5 text-[10px] text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors cursor-pointer">
                  <span className="font-mono text-primary/70">[{i + 1}]</span>
                  {s.title.slice(0, 28)}…
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
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
      <button onClick={onToggle}
        className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-surface-2/30 transition-colors text-left">
        <Icon className="w-3.5 h-3.5 text-primary/80" />
        <span className="text-xs font-semibold text-foreground/90">{label}</span>
        <span className="text-[10px] text-muted-foreground">{meta}</span>
        <ChevronRight className={cn("w-3.5 h-3.5 ml-auto text-muted-foreground transition-transform", open && "rotate-90")} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden">
            <div className="px-4 pb-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ====== Right panel: Agent Mind ====== */

function AgentMindPanel({ run, incident, active }: { run: PipelineRun | null; incident: Incident | null; active: boolean }) {
  return (
    <aside className="hidden xl:flex w-[320px] shrink-0 flex-col border-l border-border/40 bg-surface-0/60 backdrop-blur-xl">
      <div className="px-4 pt-16 pb-3 border-b border-border/30">
        <div className="flex items-center gap-3">
          <AgentOrb active={active} size={42} />
          <div>
            <div className="text-xs font-bold tracking-wide">Agent Mind</div>
            <div className="text-[10px] text-muted-foreground">Live reasoning telemetry</div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5 custom-scrollbar">
        {!run ? (
          <div className="text-xs text-muted-foreground/70 leading-relaxed">
            Задайте вопрос — здесь появятся живые инструменты, которые вызывает агент,
            источники из базы знаний и его внутренние рассуждения.
          </div>
        ) : (
          <>
            <Section icon={Activity} title="Current phase">
              <PhaseRail phase={run.phase} />
            </Section>

            <Section icon={Terminal} title="Tool stream">
              <div className="space-y-1.5">
                {run.toolCalls.map((t) => (
                  <div key={t.id} className="rounded-md bg-surface-1/70 border border-border/30 px-2 py-1.5 font-mono text-[10px]">
                    <div className="flex items-center gap-1.5">
                      <CircleDot className={cn("w-2.5 h-2.5 shrink-0",
                        t.status === "running" ? "text-amber-400 animate-pulse" : "text-emerald-400")} />
                      <span className="text-primary">{t.tool}</span>
                    </div>
                    <div className="pl-4 text-muted-foreground truncate">{t.arg}</div>
                  </div>
                ))}
              </div>
            </Section>

            <Section icon={Database} title="KB sources" badge={`${run.sources.length}`}>
              <div className="space-y-2">
                {run.sources.map((s, i) => (
                  <motion.div key={s.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="rounded-lg border border-border/30 bg-surface-1/60 p-2.5 hover:border-primary/30 transition-colors">
                    <div className="flex items-center gap-1.5 mb-1">
                      <SourceIcon type={s.type} />
                      <span className="text-[10px] font-mono text-primary/80">[{i + 1}]</span>
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.type}</span>
                      <span className="ml-auto text-[10px] tabular-nums text-emerald-400">{s.match}%</span>
                    </div>
                    <div className="text-[11px] font-medium text-foreground/90 leading-snug">{s.title}</div>
                    <div className="text-[10px] text-muted-foreground mt-1 leading-relaxed line-clamp-2">{s.excerpt}</div>
                  </motion.div>
                ))}
              </div>
            </Section>

            <Section icon={ShieldCheck} title="Confidence">
              <ConfidenceMeter value={run.confidence} />
              <div className="mt-2 text-[10px] text-muted-foreground leading-relaxed">
                Основано на покрытии источников ({run.sources.length}), согласованности
                рассуждений и совпадении паттернов с прошлыми инцидентами.
              </div>
            </Section>

            {incident && (
              <Section icon={BookMarked} title="Context">
                <div className="text-[11px] text-foreground/85">
                  <div className="font-mono text-primary">{incident.id}</div>
                  <div className="mt-0.5">{incident.title}</div>
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
      <div className="flex items-center gap-1.5 mb-2">
        <Icon className="w-3 h-3 text-primary/70" />
        <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">{title}</span>
        {badge && <span className="ml-auto text-[10px] font-mono text-primary/80">{badge}</span>}
      </div>
      {children}
    </div>
  );
}

function SourceIcon({ type }: { type: KBSource["type"] }) {
  const map = { doc: FileSearch, log: Terminal, metric: Activity, incident: Zap };
  const Icon = map[type];
  return <Icon className="w-2.5 h-2.5 text-primary/70" />;
}

/* ====== Page ====== */

const STARTERS = [
  { icon: Zap, text: "Что вызвало рост error_rate за последние 30 минут?" },
  { icon: Search, text: "Покажи похожие инциденты в payments-домене" },
  { icon: Lightbulb, text: "Сформируй гипотезы по деградации p99 latency" },
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

  const phaseStr = lastRun ? PHASE_LABEL[lastRun.phase] : "idle";
  const toolsDone = lastRun?.toolCalls.filter((t) => t.status === "done").length ?? 0;
  const toolsRun = lastRun?.toolCalls.filter((t) => t.status === "running").length ?? 0;
  const totalSources = lastRun?.sources.length ?? 0;

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const advancePipeline = useCallback(async (msgId: string) => {
    const phases: Phase[] = ["plan", "search", "reason", "synthesize", "done"];
    for (const ph of phases) {
      if (stopRef.current) return;
      await new Promise((r) => setTimeout(r, 800));
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== msgId || !m.pipeline) return m;
          const p = { ...m.pipeline, phase: ph };
          if (ph === "search" || ph === "reason" || ph === "synthesize" || ph === "done") {
            const upTo = ph === "search" ? 1 : ph === "reason" ? 2 : ph === "synthesize" ? 3 : 4;
            p.toolCalls = p.toolCalls.map((t, i) =>
              i < upTo ? { ...t, status: "done" as const } : t,
            );
          }
          if (ph === "done") {
            p.briefing = { ...p.briefing, ready: true };
          }
          return { ...m, pipeline: p };
        }),
      );
    }
    setIsStreaming(false);
  }, []);

  const send = useCallback((overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || isStreaming) return;
    const userMsg: ChatMsg = { id: crypto.randomUUID(), role: "user", text };
    const pipe = makePipeline(text, incident);
    const aiMsg: ChatMsg = { id: crypto.randomUUID(), role: "assistant", text: pipe.answer, pipeline: pipe };
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

  // Stats for sidebar
  const sessionsToday = Math.max(messages.filter((m) => m.role === "user").length, 7);
  const avgConfidence = useMemo(() => {
    const vals = messages.map((m) => m.pipeline?.confidence).filter(Boolean) as number[];
    if (!vals.length) return 86;
    return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  }, [messages]);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <RCModeSwitcher />
      <TelemetryHUD
        active={isStreaming}
        phase={phaseStr}
        toolsRunning={toolsRun}
        toolsDone={toolsDone}
        sources={totalSources}
        confidence={lastRun?.confidence ?? 0}
      />

      {/* Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 50% at 70% 0%, hsl(var(--primary) / 0.10), transparent 70%), radial-gradient(ellipse 50% 40% at 0% 100%, hsl(var(--accent) / 0.07), transparent 70%)",
          }} />
        {/* Subtle moving grid */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />
      </div>

      <div className="relative z-10 flex w-full">
        <StreamSidebar
          incidents={all}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onNewChat={() => { setSelectedId(null); setMessages([]); }}
          onOpenSearch={() => setSearchOpen(true)}
          agentActive={isStreaming}
          agentPhase={phaseStr}
          sessionsToday={sessionsToday}
          avgConfidence={avgConfidence}
          avgMTTR="11m 24s"
        />

        <main className="flex-1 flex min-w-0">
          <div className="flex-1 flex flex-col min-w-0">
            {/* Header — premium incident strip */}
            <header className="shrink-0 px-6 pt-14 pb-4 border-b border-border/30 bg-surface-0/40 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <AgentOrb active={isStreaming} size={40} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h1 className="text-[14px] font-bold tracking-tight">Reasoning Stream</h1>
                    <span className="text-[9px] uppercase tracking-[0.18em] text-primary/70 font-semibold px-1.5 py-0.5 rounded border border-primary/30 bg-primary/10">
                      Mission Control
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {incident
                      ? `${incident.id} · ${incident.title}`
                      : "Plan → Search → Reason → Synthesize · полный transparent reasoning"}
                  </p>
                </div>
                {incident && (
                  <div className="hidden sm:flex items-center gap-2">
                    <div className="text-right">
                      <div className="text-[9px] uppercase tracking-wider text-muted-foreground/70">Service</div>
                      <div className="text-[12px] font-mono text-foreground">{incident.service}</div>
                    </div>
                    <div className="w-px h-8 bg-border/40" />
                    <div className="text-right">
                      <div className="text-[9px] uppercase tracking-wider text-muted-foreground/70">Severity</div>
                      <div className={cn(
                        "text-[12px] font-bold uppercase",
                        incident.severity === "critical" && "text-red-400",
                        incident.severity === "high" && "text-orange-400",
                        incident.severity === "medium" && "text-yellow-400",
                        incident.severity === "low" && "text-primary",
                      )}>
                        {incident.severity}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </header>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center max-w-2xl mx-auto">
                  <AgentOrb active size={88} intensity={0.9} />
                  <h2 className="text-xl font-bold mt-6 mb-2 tracking-tight">
                    Mission Control готов к расследованию
                  </h2>
                  <p className="text-[13px] text-muted-foreground mb-6 max-w-md">
                    Опишите симптом — агент построит прозрачный pipeline:
                    спланирует задачу, поднимет источники, разложит рассуждение и выдаст
                    executive briefing с бизнес-импактом.
                  </p>
                  <div className="grid sm:grid-cols-3 gap-2 w-full">
                    {STARTERS.map((s) => {
                      const Icon = s.icon;
                      return (
                        <button key={s.text} onClick={() => send(s.text)}
                          className="group text-left text-[12px] px-3 py-3 rounded-xl border border-border/30 bg-surface-1/50 hover:border-primary/40 hover:bg-primary/5 transition-all">
                          <Icon className="w-3.5 h-3.5 text-primary mb-1.5" />
                          <div className="text-foreground/90 group-hover:text-foreground leading-snug">
                            {s.text}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Trust strip */}
                  <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[10px] text-muted-foreground/70 uppercase tracking-wider font-semibold">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3 h-3 text-primary" /> Auditable reasoning
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Database className="w-3 h-3 text-primary" /> Grounded in KB
                    </span>
                    <span className="flex items-center gap-1.5">
                      <TrendingUp className="w-3 h-3 text-primary" /> 87% accuracy
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Zap className="w-3 h-3 text-primary" /> &lt; 12s avg
                    </span>
                  </div>
                </div>
              )}

              <div className="space-y-6">
                {messages.map((m) => (
                  <motion.div key={m.id}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                    {m.role === "user" ? (
                      <div className="max-w-[78%] rounded-2xl rounded-br-md px-4 py-2.5 text-[13px] bg-primary/15 border border-primary/25 text-foreground/95">
                        {m.text}
                      </div>
                    ) : (
                      <div className="max-w-[92%] w-full flex gap-3">
                        <ReasoningSpine phase={m.pipeline?.phase ?? "done"} />
                        <div className="flex-1 min-w-0 space-y-3">
                          {/* Mission Briefing on top */}
                          {m.pipeline && <MissionBriefing data={m.pipeline.briefing} />}
                          {/* Hypothesis Race */}
                          {m.pipeline && <HypothesisRace hypotheses={m.pipeline.hypotheses} ready={m.pipeline.phase === "done"} />}
                          {/* Pipeline reasoning */}
                          {m.pipeline ? <PipelineCard run={m.pipeline} /> : (
                            <div className="text-sm text-foreground/90">{m.text}</div>
                          )}
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Input — premium command bar */}
            <div className="shrink-0 border-t border-border/40 bg-surface-0/70 backdrop-blur-md px-6 py-4">
              <div
                className={cn(
                  "flex items-center gap-2 rounded-2xl pl-2 pr-2 py-1.5 transition-all",
                  isStreaming
                    ? "border border-primary/30 bg-surface-1/70"
                    : "border border-border/40 bg-surface-1/60 focus-within:border-primary/40 focus-within:shadow-[0_0_0_3px_hsl(var(--primary)/0.1)]",
                )}
              >
                <div className="pl-2">
                  <Sparkles className={cn(
                    "w-4 h-4",
                    isStreaming ? "text-primary animate-pulse" : "text-muted-foreground/60",
                  )} />
                </div>
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
                  placeholder={isStreaming ? "Агент рассуждает…" : "Опиши симптом, спроси о причине, потребуй гипотезу…"}
                  disabled={isStreaming}
                  className="flex-1 bg-transparent border-0 outline-none text-[14px] py-2 px-1 placeholder:text-muted-foreground/50 disabled:opacity-50"
                />
                <button className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground/60 hover:text-foreground hover:bg-surface-2/50 transition-all"
                  title="Прикрепить лог">
                  <Paperclip className="w-3.5 h-3.5" />
                </button>
                <button className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground/60 hover:text-foreground hover:bg-surface-2/50 transition-all"
                  title="Voice query">
                  <Mic className="w-3.5 h-3.5" />
                </button>
                {isStreaming ? (
                  <button onClick={stop}
                    className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center bg-destructive/15 border border-destructive/30 text-destructive hover:bg-destructive/25 transition-all">
                    <Square className="w-3.5 h-3.5 fill-current" />
                  </button>
                ) : (
                  <button onClick={() => send()} disabled={!input.trim()}
                    className={cn(
                      "shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all",
                      input.trim() ? "text-primary-foreground"
                        : "bg-surface-2/60 text-muted-foreground/40 cursor-not-allowed",
                    )}
                    style={input.trim() ? {
                      background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))",
                      boxShadow: "0 10px 22px -10px hsl(var(--primary) / 0.55)",
                    } : undefined}>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground/70">
                <span className="inline-flex items-center gap-1.5">
                  <Network className="w-3 h-3 text-primary/70" />
                  Pipeline визуализируется в реальном времени
                </span>
                <span className="inline-flex items-center gap-3">
                  <span><kbd className="px-1 py-0.5 rounded bg-surface-2/70 font-mono">↵</kbd> отправить</span>
                  <span><kbd className="px-1 py-0.5 rounded bg-surface-2/70 font-mono">⌘K</kbd> поиск</span>
                </span>
              </div>
            </div>
          </div>

          <AgentMindPanel run={lastRun} incident={incident} active={isStreaming} />
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
