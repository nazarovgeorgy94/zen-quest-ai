import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ScrollText,
  LineChart,
  GitBranch,
  Network,
  Sparkles,
  CheckCircle2,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Incident,
  mockHypotheses,
  getSeverityColor,
  getRelativeTime,
} from "@/lib/mockIncidents";

interface RCAgentWorkspaceProps {
  incident: Incident | null;
}

type AgentState = "idle" | "thinking" | "done";

interface SubAgent {
  id: string;
  name: string;
  role: string;
  icon: typeof ScrollText;
  accent: string;
  thoughts: string[];
  finding: string;
}

const buildAgents = (inc: Incident): SubAgent[] => [
  {
    id: "logs",
    name: "Logs Agent",
    role: "Анализ логов и трейсов",
    icon: ScrollText,
    accent: "from-emerald-500/30 to-emerald-500/5",
    thoughts: [
      `Поиск ERROR за последние 30 мин в ${inc.service}…`,
      "Найдено 1,284 совпадения, кластеризую по stack-trace…",
      "Доминирующий паттерн: `connection reset by peer` (78%).",
      "Корреляция с pod restart в 14:22:08.",
    ],
    finding: "Всплеск reset-ов начался ровно после redeploy.",
  },
  {
    id: "metrics",
    name: "Metrics Agent",
    role: "Метрики и аномалии",
    icon: LineChart,
    accent: "from-cyan-500/30 to-cyan-500/5",
    thoughts: [
      "Сканирую p95 latency, error_rate, saturation…",
      "Anomaly score 0.91 на error_rate (baseline×6.4).",
      "CPU/memory в пределах нормы — не ресурс.",
      "Saturation на upstream connection pool: 98%.",
    ],
    finding: "Connection pool насыщен, но ресурсы свободны.",
  },
  {
    id: "deploy",
    name: "Deploy Agent",
    role: "История изменений",
    icon: GitBranch,
    accent: "from-violet-500/30 to-violet-500/5",
    thoughts: [
      "Загружаю CI/CD события за 4 часа…",
      "Найден deploy `payment-svc@v2.41.3` в 14:21:55.",
      "Diff: изменён `httpClient.timeout` 30s → 3s.",
      "Прошлый rollback решал похожий инцидент INC-204.",
    ],
    finding: "Подозрительный коммит — снижен timeout x10.",
  },
  {
    id: "network",
    name: "Network Agent",
    role: "Зависимости и сеть",
    icon: Network,
    accent: "from-amber-500/30 to-amber-500/5",
    thoughts: [
      "Опрашиваю service mesh за health upstream…",
      "Все upstream healthy, latency в норме.",
      "Retry-storm от payment-svc: ×4.2 RPS.",
      "Cascade риск на auth-svc через 8–12 минут.",
    ],
    finding: "Сеть здорова. Шторм генерируется самим сервисом.",
  },
];

const RCAgentWorkspace = ({ incident }: RCAgentWorkspaceProps) => {
  const [states, setStates] = useState<Record<string, AgentState>>({});
  const [thoughtIdx, setThoughtIdx] = useState<Record<string, number>>({});
  const [orchestratorReady, setOrchestratorReady] = useState(false);

  const agents = useMemo(
    () => (incident ? buildAgents(incident) : []),
    [incident?.id]
  );

  useEffect(() => {
    if (!incident) return;
    setStates({});
    setThoughtIdx({});
    setOrchestratorReady(false);

    agents.forEach((a, ai) => {
      setTimeout(() => {
        setStates((s) => ({ ...s, [a.id]: "thinking" }));
        a.thoughts.forEach((_, ti) => {
          setTimeout(() => {
            setThoughtIdx((p) => ({ ...p, [a.id]: ti + 1 }));
            if (ti === a.thoughts.length - 1) {
              setStates((s) => ({ ...s, [a.id]: "done" }));
            }
          }, 700 + ti * 900);
        });
      }, ai * 350);
    });

    const total = 350 * agents.length + 700 + 900 * 4 + 600;
    const t = setTimeout(() => setOrchestratorReady(true), total);
    return () => clearTimeout(t);
  }, [incident?.id]);

  if (!incident) return null;

  const colors = getSeverityColor(incident.severity);
  const topHyp = (mockHypotheses[incident.id] || []).sort(
    (a, b) => b.confidence - a.confidence
  )[0];

  const doneCount = Object.values(states).filter((s) => s === "done").length;
  const progress = (doneCount / agents.length) * 100;

  return (
    <div className="flex-1 flex flex-col h-screen relative overflow-hidden">
      {/* Header */}
      <div className="shrink-0 border-b border-border bg-surface-0/80 backdrop-blur-sm relative z-10">
        <div className="px-6 py-3 flex items-center gap-3">
          <span className={cn("h-2.5 w-2.5 rounded-full shrink-0", colors.dot)} />
          <div className="min-w-0">
            <h2 className="text-sm font-semibold truncate">{incident.title}</h2>
            <div className="text-[10px] text-muted-foreground font-mono">
              {incident.id} · {incident.service} · {getRelativeTime(incident.createdAt)}
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            <Sparkles className="w-3 h-3 text-primary" />
            Multi-Agent Workspace
          </div>
        </div>
        <div className="h-[2px] w-full bg-border/30 relative overflow-hidden">
          <motion.div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary via-cyan-400 to-primary"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto relative z-10">
        <div className="px-6 py-5 space-y-5">
          {/* Orchestrator */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-surface-1/80 to-surface-0/80 backdrop-blur-sm p-4 overflow-hidden"
          >
            <div className="absolute inset-0 opacity-40 pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse at 0% 0%, hsl(var(--primary) / 0.25), transparent 60%)",
              }}
            />
            <div className="relative flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] uppercase tracking-[0.18em] text-primary font-semibold">
                    Orchestrator
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    свожу выводы {doneCount}/{agents.length} агентов
                  </span>
                </div>
                <AnimatePresence mode="wait">
                  {orchestratorReady && topHyp ? (
                    <motion.div
                      key="ready"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-2"
                    >
                      <p className="text-sm text-foreground leading-relaxed">
                        Финальная гипотеза:{" "}
                        <span className="font-semibold text-primary">
                          {topHyp.title}
                        </span>{" "}
                        · уверенность{" "}
                        <span className="font-mono">{topHyp.confidence}%</span>
                      </p>
                      <p className="text-[12px] text-muted-foreground mt-1">
                        {topHyp.recommendation}
                      </p>
                      <button className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold text-primary hover:gap-2 transition-all">
                        Открыть подробный отчёт
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </motion.div>
                  ) : (
                    <motion.p
                      key="wait"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mt-1.5 text-[12px] text-muted-foreground italic"
                    >
                      Жду завершения суб-агентов…
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>

          {/* Agent grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {agents.map((a, idx) => {
              const state = states[a.id] || "idle";
              const tShown = thoughtIdx[a.id] || 0;
              const Icon = a.icon;
              return (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.08 }}
                  className={cn(
                    "relative rounded-2xl border bg-surface-1/60 backdrop-blur-sm p-4 overflow-hidden transition-colors",
                    state === "done"
                      ? "border-primary/30"
                      : state === "thinking"
                        ? "border-border/60"
                        : "border-border/30"
                  )}
                >
                  {/* Accent */}
                  <div
                    className={cn(
                      "absolute inset-0 opacity-50 pointer-events-none bg-gradient-to-br",
                      a.accent
                    )}
                  />
                  {state === "thinking" && (
                    <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse" />
                  )}

                  <div className="relative">
                    <div className="flex items-center gap-2.5 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-surface-2/80 border border-border/40 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-foreground/80" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-semibold truncate">
                          {a.name}
                        </div>
                        <div className="text-[10px] text-muted-foreground truncate">
                          {a.role}
                        </div>
                      </div>
                      <div className="shrink-0">
                        {state === "done" ? (
                          <CheckCircle2 className="w-4 h-4 text-primary" />
                        ) : state === "thinking" ? (
                          <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
                        ) : (
                          <span className="text-[10px] uppercase text-muted-foreground/60">
                            ожидание
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Thoughts */}
                    <ul className="space-y-1.5 min-h-[100px]">
                      <AnimatePresence initial={false}>
                        {a.thoughts.slice(0, tShown).map((t, ti) => (
                          <motion.li
                            key={ti}
                            initial={{ opacity: 0, x: -6 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="text-[12px] text-muted-foreground leading-relaxed flex gap-2"
                          >
                            <span className="text-primary/60 font-mono shrink-0">
                              ›
                            </span>
                            <span>{t}</span>
                          </motion.li>
                        ))}
                      </AnimatePresence>
                    </ul>

                    {/* Finding */}
                    <AnimatePresence>
                      {state === "done" && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="mt-3 pt-3 border-t border-border/40"
                        >
                          <div className="text-[10px] uppercase tracking-[0.16em] text-primary/80 font-semibold mb-1">
                            Вывод
                          </div>
                          <div className="text-[12px] text-foreground/90">
                            {a.finding}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RCAgentWorkspace;
