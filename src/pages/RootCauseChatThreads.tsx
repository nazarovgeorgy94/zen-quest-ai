import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Brain, GitBranch, Sparkles, ChevronRight, X, Square, ShieldCheck,
  Lightbulb, Database, ListChecks, FlaskConical, Activity, BookMarked, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import RCSidebar from "@/components/root-cause/RCSidebar";
import RCSearchModal from "@/components/root-cause/RCSearchModal";
import RCModeSwitcher from "@/components/root-cause/RCModeSwitcher";
import { mockIncidents } from "@/lib/mockIncidents";
import {
  Incident, getMockAIResponse, mockHypotheses, Hypothesis,
} from "@/lib/rootCauseData";

/* ============================================================
   /root-cause/chat-2 — Cognitive Threads (Claude Artifacts-style)
   Линейный чат, в котором каждый ответ агента создаёт inline
   разворачиваемые артефакты: Thinking, Hypothesis Tree, Evidence
   Table, Action Plan. Клик — открывает полноразмерный side-panel.
   ============================================================ */

type ArtifactKind = "thinking" | "hypotheses" | "evidence" | "plan";

interface ThinkingStep { id: string; text: string; branch?: "A" | "B"; }
interface EvidenceRow { source: string; signal: string; strength: number; }
interface PlanItem { title: string; impact: "low" | "medium" | "high"; eta: string; }

interface Artifact {
  id: string;
  kind: ArtifactKind;
  title: string;
  preview: string;
  data: ThinkingStep[] | Hypothesis[] | EvidenceRow[] | PlanItem[];
}

interface ChatMsg {
  id: string;
  role: "user" | "assistant";
  text: string;
  artifacts?: Artifact[];
  thinking?: ThinkingStep[]; // streaming chain-of-thought above text
  isStreaming?: boolean;
}

const ART_META: Record<ArtifactKind, { icon: typeof Brain; label: string; tint: string }> = {
  thinking: { icon: Brain, label: "Thinking", tint: "from-violet-500/20 to-primary/10" },
  hypotheses: { icon: GitBranch, label: "Hypothesis Tree", tint: "from-primary/25 to-accent/10" },
  evidence: { icon: Database, label: "Evidence", tint: "from-emerald-500/20 to-primary/10" },
  plan: { icon: ListChecks, label: "Action Plan", tint: "from-amber-500/20 to-primary/10" },
};

function buildArtifacts(question: string, incident: Incident | null): {
  text: string; artifacts: Artifact[]; thinking: ThinkingStep[];
} {
  const hyps = (incident && mockHypotheses[incident.id]) || mockHypotheses.default || [];
  const text = incident
    ? getMockAIResponse(incident.id, question)
    : "Я готов исследовать. Опиши симптом или открой инцидент в боковой панели.";

  const thinking: ThinkingStep[] = [
    { id: "t1", text: "Парсю запрос, выделяю сущности: сервис, метрика, временное окно.", branch: "A" },
    { id: "t2", text: "Параллельно формирую 2 ветки гипотез: инфраструктура vs логика.", branch: "A" },
    { id: "t3", text: "Ветка B: проверяю недавние релизы и feature-flags.", branch: "B" },
    { id: "t4", text: "Кросс-валидация — оба пути сходятся на одном сервисе.", branch: "A" },
    { id: "t5", text: "Финализирую вывод и план действий.", branch: "A" },
  ];

  const evidence: EvidenceRow[] = [
    { source: "metrics:p99_latency", signal: "spike +280% @ 14:02", strength: 92 },
    { source: "logs:payments-api", signal: "5xx burst, 6.8% error_rate", strength: 88 },
    { source: "deploy:score_v3_canary", signal: "rollout 25% → 14:00", strength: 81 },
    { source: "kafka:fraud-scoring", signal: "consumer lag 12.4k", strength: 74 },
    { source: "incident:INC-2741", signal: "similar pattern (cosine 0.86)", strength: 86 },
  ];

  const plan: PlanItem[] = [
    { title: "Откатить canary score_v3 до 0%", impact: "high", eta: "2 мин" },
    { title: "Прогреть кеш rules-engine", impact: "medium", eta: "5 мин" },
    { title: "Поднять алёрт на consumer-lag > 5k", impact: "low", eta: "10 мин" },
    { title: "Добавить regression-тест на rule-eval", impact: "medium", eta: "1 ч" },
  ];

  const artifacts: Artifact[] = [
    {
      id: crypto.randomUUID(), kind: "thinking",
      title: "Цепочка размышлений", preview: `${thinking.length} шагов · 2 параллельные ветки`,
      data: thinking,
    },
    {
      id: crypto.randomUUID(), kind: "hypotheses",
      title: "Дерево гипотез",
      preview: `${hyps.length} гипотез · top ${hyps[0]?.confidence ?? 0}%`,
      data: hyps,
    },
    {
      id: crypto.randomUUID(), kind: "evidence",
      title: "Таблица доказательств", preview: `${evidence.length} сигналов из 4 источников`,
      data: evidence,
    },
    {
      id: crypto.randomUUID(), kind: "plan",
      title: "План действий", preview: `${plan.length} шагов · ~${plan.length * 5} мин`,
      data: plan,
    },
  ];

  return { text, artifacts, thinking };
}

/* ====== Inline artifact card ====== */

function ArtifactCard({
  art, onOpen,
}: { art: Artifact; onOpen: () => void }) {
  const meta = ART_META[art.kind];
  const Icon = meta.icon;
  return (
    <motion.button
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      onClick={onOpen}
      className="group relative w-full text-left rounded-xl border border-border/40 bg-surface-1/60 backdrop-blur-md overflow-hidden hover:border-primary/40 transition-all"
      style={{ boxShadow: "0 8px 24px -12px hsl(var(--primary) / 0.18)" }}
    >
      <div
        className={cn(
          "absolute inset-0 opacity-60 bg-gradient-to-br pointer-events-none",
          meta.tint,
        )}
      />
      <div className="relative px-3.5 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-surface-0/80 border border-border/30 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-primary/80">
              {meta.label}
            </span>
            <span className="text-[10px] text-muted-foreground">·</span>
            <span className="text-xs font-medium text-foreground/90 truncate">
              {art.title}
            </span>
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
            {art.preview}
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
      </div>
    </motion.button>
  );
}

/* ====== Streaming thinking strip (above message) ====== */

function ThinkingStrip({ steps, active }: { steps: ThinkingStep[]; active: boolean }) {
  return (
    <div className="mb-3 rounded-xl border border-primary/20 bg-primary/5 backdrop-blur-sm overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-primary/15">
        <Brain className="w-3.5 h-3.5 text-primary" />
        <span className="text-[10px] uppercase tracking-wider font-semibold text-primary">
          Cognitive thread
        </span>
        {active && (
          <motion.span
            className="ml-auto flex items-center gap-1 text-[10px] text-primary/80"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.4, repeat: Infinity }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            thinking…
          </motion.span>
        )}
      </div>
      <div className="px-3 py-2 space-y-1.5">
        {steps.map((s, i) => (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            className="flex items-start gap-2 text-[11px] text-foreground/80"
          >
            <span
              className={cn(
                "mt-1 shrink-0 w-3 h-3 rounded-full border flex items-center justify-center text-[8px] font-mono font-bold",
                s.branch === "B"
                  ? "border-accent/50 text-accent bg-accent/10"
                  : "border-primary/50 text-primary bg-primary/10",
              )}
            >
              {s.branch}
            </span>
            <span>{s.text}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ====== Slide-in artifact panel ====== */

function ArtifactPanel({
  art, onClose,
}: { art: Artifact | null; onClose: () => void }) {
  return (
    <AnimatePresence>
      {art && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-background/40 backdrop-blur-sm"
          />
          <motion.aside
            key={art.id}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 360, damping: 36 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-[520px] z-50 bg-surface-0/95 backdrop-blur-xl border-l border-border/40 flex flex-col"
          >
            <header className="shrink-0 px-5 py-4 border-b border-border/40 flex items-center gap-3">
              {(() => {
                const Icon = ART_META[art.kind].icon;
                return (
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/25 to-accent/15 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                );
              })()}
              <div className="flex-1 min-w-0">
                <div className="text-[10px] uppercase tracking-wider text-primary/80 font-semibold">
                  {ART_META[art.kind].label}
                </div>
                <div className="text-sm font-semibold truncate">{art.title}</div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface-2/60 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </header>
            <div className="flex-1 overflow-y-auto px-5 py-5 custom-scrollbar">
              <ArtifactBody art={art} />
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function ArtifactBody({ art }: { art: Artifact }) {
  if (art.kind === "thinking") {
    const steps = art.data as ThinkingStep[];
    return (
      <div className="relative pl-4">
        <div className="absolute left-1 top-1 bottom-1 w-px bg-gradient-to-b from-primary/60 via-primary/20 to-transparent" />
        <div className="space-y-3">
          {steps.map((s) => (
            <div key={s.id} className="relative">
              <span
                className={cn(
                  "absolute -left-[15px] top-1 w-2.5 h-2.5 rounded-full border-2",
                  s.branch === "B"
                    ? "border-accent bg-accent/20"
                    : "border-primary bg-primary/20",
                )}
              />
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-mono">
                  branch {s.branch}
                </span>
              </div>
              <p className="text-sm text-foreground/90 leading-relaxed">{s.text}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (art.kind === "hypotheses") {
    const hyps = art.data as Hypothesis[];
    if (!hyps.length) return <p className="text-sm text-muted-foreground">Нет гипотез.</p>;
    return (
      <div className="space-y-3">
        {hyps.map((h, i) => (
          <div
            key={i}
            className="rounded-xl border border-border/40 bg-surface-1/60 p-4 hover:border-primary/40 transition-colors"
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-primary" />
                <h4 className="text-sm font-semibold text-foreground">{h.title}</h4>
              </div>
              <span className="text-xs font-mono tabular-nums text-primary shrink-0">
                {h.confidence}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed mb-2">
              {h.explanation}
            </p>
            <div className="flex items-start gap-2 mt-2 pt-2 border-t border-border/30">
              <FlaskConical className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" />
              <p className="text-xs text-foreground/80 leading-relaxed">{h.recommendation}</p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (art.kind === "evidence") {
    const rows = art.data as EvidenceRow[];
    return (
      <div className="rounded-xl border border-border/40 bg-surface-1/40 overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-surface-2/50 text-[10px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="text-left px-3 py-2 font-semibold">Source</th>
              <th className="text-left px-3 py-2 font-semibold">Signal</th>
              <th className="text-right px-3 py-2 font-semibold">Strength</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {rows.map((r, i) => (
              <tr key={i} className="hover:bg-surface-2/30">
                <td className="px-3 py-2.5 font-mono text-primary/85">{r.source}</td>
                <td className="px-3 py-2.5 text-foreground/85">{r.signal}</td>
                <td className="px-3 py-2.5 text-right">
                  <div className="inline-flex items-center gap-2">
                    <div className="w-16 h-1 rounded-full bg-surface-2 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${r.strength}%`,
                          background: "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)))",
                        }}
                      />
                    </div>
                    <span className="font-mono tabular-nums text-emerald-400 text-[11px]">
                      {r.strength}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // plan
  const items = art.data as PlanItem[];
  const colors = {
    high: "bg-red-500/15 text-red-400 border-red-500/30",
    medium: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    low: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  } as const;
  return (
    <ol className="space-y-2">
      {items.map((p, i) => (
        <li
          key={i}
          className="flex items-center gap-3 rounded-xl border border-border/40 bg-surface-1/60 px-3 py-2.5"
        >
          <div className="w-6 h-6 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center text-[11px] font-mono font-semibold text-primary shrink-0">
            {i + 1}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm text-foreground/95">{p.title}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">~{p.eta}</div>
          </div>
          <span
            className={cn(
              "shrink-0 text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full border",
              colors[p.impact],
            )}
          >
            {p.impact}
          </span>
        </li>
      ))}
    </ol>
  );
}

/* ====== Page ====== */

const STARTERS = [
  "Найди корневую причину деградации payments-api",
  "Сравни этот инцидент с похожими из прошлого",
  "Сгенерируй план восстановления и митигаций",
];

export default function RootCauseChatThreads() {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [openArt, setOpenArt] = useState<Artifact | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [extra, setExtra] = useState<Incident[]>([]);
  const all = [...extra, ...mockIncidents];
  const incident = all.find((i) => i.id === selectedId) ?? null;
  const scrollRef = useRef<HTMLDivElement>(null);
  const stopRef = useRef(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = useCallback(async () => {
    if (!input.trim() || isStreaming) return;
    const q = input;
    const userMsg: ChatMsg = { id: crypto.randomUUID(), role: "user", text: q };
    const built = buildArtifacts(q, incident);
    const aiId = crypto.randomUUID();
    const aiMsg: ChatMsg = {
      id: aiId,
      role: "assistant",
      text: "",
      thinking: [],
      isStreaming: true,
    };
    setMessages((prev) => [...prev, userMsg, aiMsg]);
    setInput("");
    setIsStreaming(true);
    stopRef.current = false;

    // 1. Stream thinking steps
    for (let i = 0; i < built.thinking.length; i++) {
      if (stopRef.current) break;
      await new Promise((r) => setTimeout(r, 450));
      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiId
            ? { ...m, thinking: built.thinking.slice(0, i + 1) }
            : m,
        ),
      );
    }

    // 2. Stream answer text (drip)
    if (!stopRef.current) {
      const tokens = built.text.split(/(\s+)/);
      for (let i = 1; i <= tokens.length; i++) {
        if (stopRef.current) break;
        await new Promise((r) => setTimeout(r, 22));
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiId ? { ...m, text: tokens.slice(0, i).join("") } : m,
          ),
        );
      }
    }

    // 3. Reveal artifacts
    if (!stopRef.current) {
      await new Promise((r) => setTimeout(r, 250));
      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiId ? { ...m, artifacts: built.artifacts, isStreaming: false } : m,
        ),
      );
    } else {
      setMessages((prev) =>
        prev.map((m) => (m.id === aiId ? { ...m, isStreaming: false } : m)),
      );
    }
    setIsStreaming(false);
  }, [input, incident, isStreaming]);

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
              "radial-gradient(ellipse 60% 45% at 50% 0%, hsl(var(--primary) / 0.07), transparent 70%), radial-gradient(ellipse 50% 40% at 100% 100%, hsl(var(--accent) / 0.05), transparent 70%)",
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

        <main className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="shrink-0 px-6 pt-14 pb-4 border-b border-border/30 bg-surface-0/40 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/25 to-accent/15 flex items-center justify-center">
                <GitBranch className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-sm font-semibold tracking-tight">Cognitive Threads</h1>
                <p className="text-[11px] text-muted-foreground truncate">
                  {incident
                    ? `${incident.id} · ${incident.title}`
                    : "Каждый ответ агента — поток размышлений + разворачиваемые артефакты"}
                </p>
              </div>
              {incident && (
                <span className="hidden md:inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground border border-border/40 rounded-full px-2 py-1">
                  <BookMarked className="w-3 h-3" /> Контекст загружен
                </span>
              )}
            </div>
          </header>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar"
          >
            <div className="max-w-3xl mx-auto space-y-6">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center text-center py-16">
                  <motion.div
                    className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/30 to-accent/20 flex items-center justify-center mb-4"
                    animate={{ rotate: [0, 4, -4, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <GitBranch className="w-7 h-7 text-primary" />
                    <motion.span
                      className="absolute inset-0 rounded-2xl border border-primary/40"
                      animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0, 0.6] }}
                      transition={{ duration: 2.4, repeat: Infinity }}
                    />
                  </motion.div>
                  <h2 className="text-base font-semibold mb-1">
                    Думаю в нескольких ветках одновременно
                  </h2>
                  <p className="text-xs text-muted-foreground mb-5 max-w-md">
                    Каждый ответ — поток размышлений и набор разворачиваемых артефактов:
                    дерево гипотез, таблица доказательств, план действий.
                  </p>
                  <div className="grid gap-2 w-full max-w-md">
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
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
                >
                  {m.role === "user" ? (
                    <div className="max-w-[78%] rounded-2xl rounded-br-md px-4 py-2.5 text-sm bg-primary/15 border border-primary/25 text-foreground/95">
                      {m.text}
                    </div>
                  ) : (
                    <div className="max-w-[88%] w-full">
                      {m.thinking && m.thinking.length > 0 && (
                        <ThinkingStrip steps={m.thinking} active={!!m.isStreaming && !m.artifacts} />
                      )}
                      <div className="rounded-2xl bg-surface-1/40 border border-border/30 px-4 py-3">
                        <p className="text-sm text-foreground/95 leading-relaxed whitespace-pre-line min-h-[1.25rem]">
                          {m.text}
                          {m.isStreaming && !m.artifacts && (
                            <motion.span
                              className="inline-block w-1.5 h-4 bg-primary ml-0.5 align-middle"
                              animate={{ opacity: [1, 0.2, 1] }}
                              transition={{ duration: 0.8, repeat: Infinity }}
                            />
                          )}
                        </p>
                      </div>
                      {m.artifacts && (
                        <motion.div
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2"
                        >
                          {m.artifacts.map((a) => (
                            <ArtifactCard key={a.id} art={a} onOpen={() => setOpenArt(a)} />
                          ))}
                        </motion.div>
                      )}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="shrink-0 border-t border-border/40 bg-surface-0/60 backdrop-blur-md px-6 py-4">
            <div className="max-w-3xl mx-auto flex items-center gap-3">
              <div className="flex-1 relative">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
                  placeholder="Спроси у агента — он развернёт мысли и артефакты…"
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
            <div className="max-w-3xl mx-auto mt-2 flex items-center gap-3 text-[10px] text-muted-foreground/70">
              <span className="inline-flex items-center gap-1">
                <Brain className="w-3 h-3" /> Агент думает в параллельных ветках и публикует артефакты
              </span>
            </div>
          </div>
        </main>
      </div>

      <ArtifactPanel art={openArt} onClose={() => setOpenArt(null)} />

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
