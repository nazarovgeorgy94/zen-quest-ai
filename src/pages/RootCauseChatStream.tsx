import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Sparkles, Brain, Search, Database, Network, ShieldCheck,
  Zap, FileSearch, Terminal, ChevronRight, Activity, Loader2, Square,
  CircleDot, Layers, BookMarked,
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
   /root-cause/chat-1 — Reasoning Stream (Perplexity-style)
   Двухколоночный чат: слева диалог с pipeline-карточками,
   справа Agent Mind — live tool-calls + KB-источники + confidence.
   ============================================================ */

type Phase = "plan" | "search" | "reason" | "synthesize" | "done";

interface ToolCall {
  id: string;
  tool: string;
  arg: string;
  status: "running" | "done";
  result?: string;
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
  answer: string;
  confidence: number;
}
interface ChatMsg {
  id: string;
  role: "user" | "assistant";
  text: string;
  pipeline?: PipelineRun;
}

const PHASES: { key: Phase; label: string; icon: typeof Brain }[] = [
  { key: "plan", label: "Plan", icon: Layers },
  { key: "search", label: "Search", icon: Search },
  { key: "reason", label: "Reason", icon: Brain },
  { key: "synthesize", label: "Synthesize", icon: Sparkles },
];

const TOOLS = [
  { tool: "kb.search", arg: "antifraud rules" },
  { tool: "logs.correlate", arg: "service=payments,5m" },
  { tool: "metrics.fetch", arg: "p99_latency,error_rate" },
  { tool: "incidents.similar", arg: "vector(embed)" },
];

const KB_POOL: Omit<KBSource, "id">[] = [
  { title: "Antifraud Rules Engine — Decision Pipeline", type: "doc", match: 94, excerpt: "Decision pipeline applies score threshold > 0.78..." },
  { title: "INC-2741 — Payments degradation postmortem", type: "incident", match: 88, excerpt: "Root cause: stale cache after deploy at 14:02..." },
  { title: "payments-api error_rate spike (last 30m)", type: "metric", match: 82, excerpt: "error_rate climbed from 0.4% to 6.8% within 90s..." },
  { title: "kafka-consumer lag warnings", type: "log", match: 76, excerpt: "consumer-group=fraud-scoring lag=12.4k messages..." },
  { title: "Feature flag rollouts — last 24h", type: "doc", match: 71, excerpt: "flag `score_v3_canary` enabled for 25% traffic..." },
];

function makePipeline(question: string, incident: Incident | null): PipelineRun {
  const hyps = (incident && mockHypotheses[incident.id]) || mockHypotheses.default || [];
  const sev = incident?.severity ?? "medium";
  const baseAnswer = incident
    ? getMockAIResponse(incident.id, question)
    : "Готов провести анализ. Опишите симптом или выберите инцидент в боковой панели.";

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
    toolCalls: TOOLS.map((t, i) => ({
      id: `tc-${i}`,
      ...t,
      status: "running",
      result: undefined,
    })),
    sources: KB_POOL.map((s, i) => ({ ...s, id: `kb-${i}` })),
    answer: baseAnswer,
    confidence: hyps[0]?.confidence ?? 78,
  };
}

/* ====== UI bits ====== */

function PhaseRail({ phase }: { phase: Phase }) {
  const idx = PHASES.findIndex((p) => p.key === phase);
  const done = phase === "done";
  return (
    <div className="flex items-center gap-2">
      {PHASES.map((p, i) => {
        const Icon = p.icon;
        const active = !done && i === idx;
        const passed = done || i < idx;
        return (
          <div key={p.key} className="flex items-center gap-2">
            <div
              className={cn(
                "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider border transition-all",
                passed && "border-primary/30 bg-primary/10 text-primary",
                active && "border-primary/60 bg-primary/15 text-primary shadow-[0_0_18px_hsl(var(--primary)/0.35)]",
                !passed && !active && "border-border/30 text-muted-foreground/60",
              )}
            >
              {active ? <Loader2 className="w-3 h-3 animate-spin" /> : <Icon className="w-3 h-3" />}
              {p.label}
            </div>
            {i < PHASES.length - 1 && (
              <div className={cn("h-px w-4", passed ? "bg-primary/40" : "bg-border/30")} />
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
      <div className="relative w-24 h-1.5 rounded-full bg-surface-2 overflow-hidden">
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

function PipelineCard({ run }: { run: PipelineRun }) {
  const [expanded, setExpanded] = useState<Phase | null>(null);
  const sev = getSeverityColor("medium");
  const toggle = (k: Phase) => setExpanded((e) => (e === k ? null : k));

  return (
    <div
      className="rounded-2xl border border-border/40 bg-surface-1/60 backdrop-blur-md overflow-hidden"
      style={{ boxShadow: "0 12px 40px -16px hsl(var(--primary) / 0.18)" }}
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border/30 bg-surface-2/30">
        <PhaseRail phase={run.phase} />
        <ConfidenceMeter value={run.confidence} />
      </div>

      <div className="divide-y divide-border/20">
        {/* Plan */}
        <CollapsibleRow
          icon={Layers}
          label="Plan"
          meta={`${run.plan.length} steps`}
          open={expanded === "plan"}
          onToggle={() => toggle("plan")}
        >
          <ol className="space-y-1.5 text-sm text-foreground/80">
            {run.plan.map((p, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-1.5 w-1 h-1 rounded-full bg-primary shrink-0" />
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
          open={expanded === "search"}
          onToggle={() => toggle("search")}
        >
          <div className="space-y-1.5 font-mono text-[11px]">
            {run.toolCalls.map((t) => (
              <div
                key={t.id}
                className="flex items-center gap-2 rounded-md bg-surface-0/60 border border-border/30 px-2 py-1.5"
              >
                <CircleDot
                  className={cn(
                    "w-3 h-3 shrink-0",
                    t.status === "running" ? "text-amber-400 animate-pulse" : "text-emerald-400",
                  )}
                />
                <span className="text-primary">{t.tool}</span>
                <span className="text-muted-foreground">(</span>
                <span className="text-accent truncate">{t.arg}</span>
                <span className="text-muted-foreground">)</span>
                {t.status === "done" && (
                  <span className="ml-auto text-[10px] text-emerald-400/80">ok</span>
                )}
              </div>
            ))}
          </div>
        </CollapsibleRow>

        {/* Reasoning */}
        <CollapsibleRow
          icon={Brain}
          label="Reasoning"
          meta={`${run.thoughts.length} thoughts`}
          open={expanded === "reason"}
          onToggle={() => toggle("reason")}
        >
          <div className="space-y-2">
            {run.thoughts.map((th, i) => (
              <div
                key={i}
                className="relative pl-4 text-sm text-foreground/85 leading-relaxed"
              >
                <span className="absolute left-0 top-2 w-2 h-2 rounded-full bg-primary/70 shadow-[0_0_8px_hsl(var(--primary)/0.6)]" />
                {th}
              </div>
            ))}
          </div>
        </CollapsibleRow>

        {/* Final answer */}
        <div className="px-4 py-4 bg-gradient-to-b from-transparent to-primary/[0.04]">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
              Synthesis
            </span>
          </div>
          <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
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
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-surface-2/30 transition-colors text-left"
      >
        <Icon className="w-3.5 h-3.5 text-primary/80" />
        <span className="text-xs font-medium text-foreground/90">{label}</span>
        <span className="text-[10px] text-muted-foreground">{meta}</span>
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
            <div className="px-4 pb-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ====== Right panel: Agent Mind ====== */

function AgentMindPanel({ run, incident }: { run: PipelineRun | null; incident: Incident | null }) {
  return (
    <aside className="hidden lg:flex w-[360px] shrink-0 flex-col border-l border-border/40 bg-surface-0/60 backdrop-blur-xl">
      <div className="px-4 pt-16 pb-3 border-b border-border/30">
        <div className="flex items-center gap-2">
          <div className="relative w-7 h-7 rounded-lg bg-gradient-to-br from-primary/30 to-accent/20 flex items-center justify-center">
            <Brain className="w-3.5 h-3.5 text-primary" />
            {run && run.phase !== "done" && (
              <motion.span
                className="absolute inset-0 rounded-lg border border-primary/60"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.6, repeat: Infinity }}
              />
            )}
          </div>
          <div>
            <div className="text-xs font-semibold tracking-wide">Agent Mind</div>
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
            <Section icon={Activity} title="Phase">
              <PhaseRail phase={run.phase} />
            </Section>

            <Section icon={Terminal} title="Tool stream">
              <div className="space-y-1.5">
                {run.toolCalls.map((t) => (
                  <div
                    key={t.id}
                    className="rounded-md bg-surface-1/70 border border-border/30 px-2 py-1.5 font-mono text-[10px]"
                  >
                    <div className="flex items-center gap-1.5">
                      <CircleDot
                        className={cn(
                          "w-2.5 h-2.5 shrink-0",
                          t.status === "running"
                            ? "text-amber-400 animate-pulse"
                            : "text-emerald-400",
                        )}
                      />
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
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="rounded-lg border border-border/30 bg-surface-1/60 p-2.5 hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <SourceIcon type={s.type} />
                      <span className="text-[10px] font-mono text-primary/80">[{i + 1}]</span>
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        {s.type}
                      </span>
                      <span className="ml-auto text-[10px] tabular-nums text-emerald-400">
                        {s.match}%
                      </span>
                    </div>
                    <div className="text-[11px] font-medium text-foreground/90 leading-snug">
                      {s.title}
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-1 leading-relaxed line-clamp-2">
                      {s.excerpt}
                    </div>
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
        <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
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

function SourceIcon({ type }: { type: KBSource["type"] }) {
  const map = { doc: FileSearch, log: Terminal, metric: Activity, incident: Zap };
  const Icon = map[type];
  return <Icon className="w-2.5 h-2.5 text-primary/70" />;
}

/* ====== Page ====== */

const STARTERS = [
  "Что вызвало рост error_rate за последние 30 минут?",
  "Покажи похожие инциденты в payments-домене",
  "Сформируй гипотезы по деградации p99 latency",
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
    const phases: Phase[] = ["plan", "search", "reason", "synthesize", "done"];
    for (const ph of phases) {
      if (stopRef.current) return;
      await new Promise((r) => setTimeout(r, 700));
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== msgId || !m.pipeline) return m;
          const p = { ...m.pipeline, phase: ph };
          if (ph === "search" || ph === "reason" || ph === "synthesize") {
            p.toolCalls = p.toolCalls.map((t, i) =>
              i <= (ph === "search" ? 1 : ph === "reason" ? 2 : 3)
                ? { ...t, status: "done" as const }
                : t,
            );
          }
          return { ...m, pipeline: p };
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
              "radial-gradient(ellipse 70% 50% at 70% 0%, hsl(var(--primary) / 0.08), transparent 70%), radial-gradient(ellipse 50% 40% at 0% 100%, hsl(var(--accent) / 0.06), transparent 70%)",
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
            {/* Header */}
            <header className="shrink-0 px-6 pt-14 pb-4 border-b border-border/30 bg-surface-0/40 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/25 to-accent/15 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h1 className="text-sm font-semibold tracking-tight">Reasoning Stream</h1>
                  <p className="text-[11px] text-muted-foreground">
                    {incident ? `${incident.id} · ${incident.title}` : "Каждый ответ — прозрачный pipeline: Plan → Search → Reason → Synthesize"}
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
                <div className="flex flex-col items-center justify-center h-full text-center max-w-md mx-auto">
                  <motion.div
                    className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/30 to-accent/20 flex items-center justify-center mb-4"
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Brain className="w-7 h-7 text-primary" />
                    <motion.span
                      className="absolute inset-0 rounded-2xl border border-primary/40"
                      animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0, 0.6] }}
                      transition={{ duration: 2.4, repeat: Infinity }}
                    />
                  </motion.div>
                  <h2 className="text-base font-semibold mb-1">Спроси у агента</h2>
                  <p className="text-xs text-muted-foreground mb-5">
                    Я разложу размышление на этапы и покажу всё, что использовал.
                  </p>
                  <div className="grid gap-2 w-full">
                    {STARTERS.map((s) => (
                      <button
                        key={s}
                        onClick={() => setInput(s)}
                        className="text-left text-xs px-3 py-2.5 rounded-lg border border-border/30 bg-surface-1/50 hover:border-primary/40 hover:bg-primary/5 transition-all"
                      >
                        <Sparkles className="inline w-3 h-3 mr-1.5 text-primary" />
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
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
                >
                  {m.role === "user" ? (
                    <div className="max-w-[78%] rounded-2xl rounded-br-md px-4 py-2.5 text-sm bg-primary/15 border border-primary/25 text-foreground/95">
                      {m.text}
                    </div>
                  ) : (
                    <div className="max-w-[88%] w-full">
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
              <div className="mt-2 flex items-center gap-3 text-[10px] text-muted-foreground/70">
                <span className="inline-flex items-center gap-1">
                  <Network className="w-3 h-3" /> Pipeline визуализируется в реальном времени
                </span>
              </div>
            </div>
          </div>

          <AgentMindPanel run={lastRun} incident={incident} />
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
