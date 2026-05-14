import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  X,
  Clock,
  Server,
  Sparkles,
  Hash,
  Calendar,
  Activity,
  Wand2,
  Loader2,
  Plus,
  ArrowRight,
  Brain,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Incident,
  getSeverityColor,
  getRelativeTime,
  getStatusLabel,
} from "@/lib/mockIncidents";
import {
  parseIncidentQuery,
  scoreIncidentMatch,
  buildVirtualIncident,
} from "@/lib/incidentQueryParser";

interface RCSearchModalProps {
  open: boolean;
  onClose: () => void;
  incidents: Incident[];
  onSelect: (id: string) => void;
  onCreateIncident?: (incident: Incident) => void;
}

type ReasoningStep = {
  id: string;
  icon: React.ReactNode;
  label: string;
  detail?: string;
  durationMs: number;
};

const RCSearchModal = ({
  open,
  onClose,
  incidents,
  onSelect,
  onCreateIncident,
}: RCSearchModalProps) => {
  const [query, setQuery] = useState("");
  const [severity, setSeverity] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [reasoning, setReasoning] = useState<{
    steps: ReasoningStep[];
    completedCount: number;
    activeStep: number;
    finalAction: { kind: "select" | "create"; payload: Incident } | null;
  } | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const reasoningCancelRef = useRef(false);

  const parsed = useMemo(() => parseIncidentQuery(query), [query]);

  const ranked = useMemo(() => {
    if (!query.trim()) {
      return incidents
        .filter((inc) => !severity || inc.severity === severity)
        .map((inc) => ({ inc, score: 0 }));
    }
    return incidents
      .map((inc) => ({ inc, score: scoreIncidentMatch(parsed, inc) }))
      .filter(({ inc, score }) => {
        if (severity && inc.severity !== severity) return false;
        return score > 0;
      })
      .sort((a, b) => b.score - a.score);
  }, [incidents, parsed, query, severity]);

  const filtered = ranked.map((r) => r.inc);

  const exactIdMatch = useMemo(() => {
    if (!parsed.id) return null;
    return incidents.find((i) => i.id.toUpperCase() === parsed.id!.toUpperCase()) || null;
  }, [parsed.id, incidents]);

  const showCreateOption =
    parsed.isRich && !exactIdMatch && (filtered[0]?.score ?? 0) < 30;

  useEffect(() => {
    if (open) {
      setQuery("");
      setSeverity(null);
      setActiveIndex(0);
      setReasoning(null);
      reasoningCancelRef.current = false;
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      reasoningCancelRef.current = true;
    }
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, severity]);

  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.querySelector(`[data-index="${activeIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  // auto-grow textarea
  useEffect(() => {
    const t = inputRef.current;
    if (!t) return;
    t.style.height = "auto";
    t.style.height = Math.min(t.scrollHeight, 120) + "px";
  }, [query]);

  const handleClose = useCallback(() => {
    reasoningCancelRef.current = true;
    onClose();
  }, [onClose]);

  const finishReasoning = useCallback(
    (action: { kind: "select" | "create"; payload: Incident }) => {
      setTimeout(() => {
        if (reasoningCancelRef.current) return;
        if (action.kind === "create" && onCreateIncident) {
          onCreateIncident(action.payload);
        } else {
          onSelect(action.payload.id);
        }
        onClose();
      }, 600);
    },
    [onSelect, onCreateIncident, onClose]
  );

  const runReasoning = useCallback(
    async (action: { kind: "select" | "create"; payload: Incident }) => {
      reasoningCancelRef.current = false;

      const entityChips: string[] = [];
      if (parsed.id) entityChips.push(parsed.id);
      if (parsed.date) entityChips.push(parsed.date);
      if (parsed.timeRange)
        entityChips.push(`${parsed.timeRange.from}–${parsed.timeRange.to}`);
      if (parsed.metricPercent !== undefined)
        entityChips.push(`${parsed.metricPercent}%`);
      if (parsed.service) entityChips.push(parsed.service);

      const steps: ReasoningStep[] = [
        {
          id: "parse",
          icon: <Wand2 className="w-3.5 h-3.5" />,
          label: "Разбираю запрос",
          detail: entityChips.length
            ? `Извлечено: ${entityChips.join(" · ")}`
            : "Анализирую естественный язык…",
          durationMs: 420 + Math.random() * 280,
        },
        {
          id: "search",
          icon: <Search className="w-3.5 h-3.5" />,
          label: "Поиск по базе инцидентов",
          detail: `Просмотрено ${incidents.length} записей, релевантных: ${
            ranked.filter((r) => r.score > 0).length
          }`,
          durationMs: 520 + Math.random() * 380,
        },
        {
          id: "correlate",
          icon: <Brain className="w-3.5 h-3.5" />,
          label: "Сопоставление с историческими паттернами",
          detail:
            action.kind === "create"
              ? "Похожих кейсов не найдено — это новый инцидент"
              : `Совпадение с ${action.payload.id} — ${action.payload.service}`,
          durationMs: 640 + Math.random() * 360,
        },
        {
          id: "ready",
          icon: <Sparkles className="w-3.5 h-3.5" />,
          label:
            action.kind === "create"
              ? "Готовлю виртуальный контекст для диагностики"
              : "Подгружаю контекст инцидента",
          detail: action.kind === "create"
            ? `Создан ${action.payload.id} · severity ${action.payload.severity}`
            : "Метрики, логи, сервисная топология",
          durationMs: 480 + Math.random() * 320,
        },
      ];

      setReasoning({ steps, completedCount: 0, activeStep: 0, finalAction: null });

      for (let i = 0; i < steps.length; i++) {
        if (reasoningCancelRef.current) return;
        setReasoning((prev) =>
          prev ? { ...prev, activeStep: i, completedCount: i } : prev
        );
        await new Promise((r) => setTimeout(r, steps[i].durationMs));
      }
      if (reasoningCancelRef.current) return;
      setReasoning((prev) =>
        prev
          ? { ...prev, activeStep: -1, completedCount: steps.length, finalAction: action }
          : prev
      );
      finishReasoning(action);
    },
    [parsed, incidents.length, ranked, finishReasoning]
  );

  const handleSelect = useCallback(
    (inc: Incident) => {
      runReasoning({ kind: "select", payload: inc });
    },
    [runReasoning]
  );

  const handleCreate = useCallback(() => {
    if (!query.trim()) return;
    const virt = buildVirtualIncident(parsed);
    runReasoning({ kind: "create", payload: virt });
  }, [parsed, query, runReasoning]);

  // Global key handlers
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (open) handleClose();
      }
      if (e.key === "Escape" && open) handleClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, handleClose]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (reasoning) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((p) => Math.min(p + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((p) => Math.max(p - 1, 0));
    } else if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (filtered.length > 0 && !showCreateOption) {
        handleSelect(filtered[activeIndex]);
      } else if (showCreateOption) {
        handleCreate();
      } else if (filtered.length > 0) {
        handleSelect(filtered[activeIndex]);
      }
    }
  };

  const severities = ["critical", "high", "medium", "low"] as const;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -20 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-x-4 top-[10%] z-50 mx-auto max-w-2xl"
          >
            <div className="rounded-2xl border border-border bg-surface-0 shadow-2xl shadow-black/40 overflow-hidden">
              {/* Search input */}
              <div className="flex items-start gap-3 px-4 py-3 border-b border-border">
                <div className="mt-1.5 relative">
                  <Search className="w-5 h-5 text-muted-foreground shrink-0" />
                  <motion.div
                    className="absolute -inset-1 rounded-full bg-primary/20 -z-10"
                    animate={{ scale: query ? [1, 1.4, 1] : 1, opacity: query ? [0.4, 0, 0.4] : 0 }}
                    transition={{ duration: 1.8, repeat: query ? Infinity : 0 }}
                  />
                </div>
                <textarea
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  disabled={!!reasoning}
                  placeholder="Опишите инцидент или введите ID — например: «INC-999 07.05.2026 22:00–23:00, 1.2% транзакций не обработано»"
                  className="flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground/70 outline-none leading-relaxed py-1 max-h-[120px] disabled:opacity-50"
                />
                <button
                  onClick={handleClose}
                  className="mt-1 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Parsed entities chips */}
              <AnimatePresence initial={false}>
                {parsed.isRich && !reasoning && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden border-b border-border/50 bg-surface-1/40"
                  >
                    <div className="px-4 py-2.5 flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-primary" />
                        Распознано
                      </span>
                      {parsed.id && (
                        <Chip icon={<Hash className="w-3 h-3" />} label={parsed.id} />
                      )}
                      {parsed.date && (
                        <Chip icon={<Calendar className="w-3 h-3" />} label={parsed.date} />
                      )}
                      {parsed.timeRange && (
                        <Chip
                          icon={<Clock className="w-3 h-3" />}
                          label={`${parsed.timeRange.from}–${parsed.timeRange.to}`}
                        />
                      )}
                      {parsed.metricPercent !== undefined && (
                        <Chip
                          icon={<Activity className="w-3 h-3" />}
                          label={`${parsed.metricPercent}%`}
                          accent
                        />
                      )}
                      {parsed.service && (
                        <Chip icon={<Server className="w-3 h-3" />} label={parsed.service} />
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Severity filters (hidden during reasoning) */}
              {!reasoning && (
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/50">
                  <span className="text-[11px] text-muted-foreground mr-1">Severity:</span>
                  {severities.map((s) => {
                    const colors = getSeverityColor(s);
                    return (
                      <button
                        key={s}
                        onClick={() => setSeverity(severity === s ? null : s)}
                        className={cn(
                          "text-[11px] font-medium uppercase px-2 py-1 rounded-md transition-all",
                          severity === s
                            ? cn(colors.bg, colors.text, "ring-1 ring-current/30")
                            : "text-muted-foreground hover:text-foreground hover:bg-surface-1"
                        )}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Body */}
              <div className="max-h-[460px] overflow-y-auto" ref={listRef}>
                {reasoning ? (
                  <ReasoningView reasoning={reasoning} />
                ) : (
                  <>
                    {/* Create option (when query is rich and no exact match) */}
                    {showCreateOption && (
                      <CreateNewBlock
                        active={activeIndex === -1 || filtered.length === 0}
                        onClick={handleCreate}
                        parsedSummary={query.trim()}
                      />
                    )}

                    {filtered.length === 0 ? (
                      !showCreateOption && (
                        <div className="py-12 text-center text-sm text-muted-foreground">
                          {query.trim()
                            ? "Ничего не найдено. Уточните описание или ID."
                            : "Начните вводить запрос…"}
                        </div>
                      )
                    ) : (
                      <div className="p-2">
                        {filtered.length > 0 && showCreateOption && (
                          <p className="px-3 pt-1 pb-1.5 text-[10px] uppercase tracking-wider text-muted-foreground/60">
                            Возможно, похоже в базе
                          </p>
                        )}
                        {filtered.map((inc, idx) => {
                          const colors = getSeverityColor(inc.severity);
                          const isActive = idx === activeIndex;
                          return (
                            <button
                              key={inc.id}
                              data-index={idx}
                              onClick={() => handleSelect(inc)}
                              onMouseEnter={() => setActiveIndex(idx)}
                              className={cn(
                                "w-full text-left px-3 py-3 rounded-lg transition-colors group",
                                isActive ? "bg-surface-1" : "hover:bg-surface-1"
                              )}
                            >
                              <div className="flex items-start gap-3">
                                <div className="mt-1">
                                  <div className={cn("w-2.5 h-2.5 rounded-full", colors.dot)} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-mono text-muted-foreground">
                                      {inc.id}
                                    </span>
                                    <span
                                      className={cn(
                                        "text-[9px] font-medium uppercase px-1.5 py-0.5 rounded-full",
                                        colors.bg,
                                        colors.text
                                      )}
                                    >
                                      {inc.severity}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground ml-auto">
                                      {getStatusLabel(inc.status)}
                                    </span>
                                  </div>
                                  <p className="text-sm text-foreground mt-1 truncate">
                                    {inc.title}
                                  </p>
                                  <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                      <Server className="w-3 h-3" />
                                      {inc.service}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {getRelativeTime(inc.createdAt)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-4 py-2.5 border-t border-border/50 text-[10px] text-muted-foreground">
                <span>
                  {reasoning
                    ? "AI-агент анализирует запрос…"
                    : `${filtered.length} найдено${showCreateOption ? " · +новый" : ""}`}
                </span>
                {!reasoning && (
                  <div className="flex items-center gap-3">
                    <span>
                      <kbd className="bg-surface-2 px-1 py-0.5 rounded font-mono">↑↓</kbd>{" "}
                      навигация
                    </span>
                    <span>
                      <kbd className="bg-surface-2 px-1 py-0.5 rounded font-mono">Enter</kbd>{" "}
                      {showCreateOption && filtered.length === 0 ? "диагностировать" : "выбрать"}
                    </span>
                    <span>
                      <kbd className="bg-surface-2 px-1 py-0.5 rounded font-mono">Esc</kbd>{" "}
                      закрыть
                    </span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const Chip = ({
  icon,
  label,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  accent?: boolean;
}) => (
  <motion.span
    initial={{ opacity: 0, scale: 0.85, y: -2 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    transition={{ type: "spring", stiffness: 300, damping: 22 }}
    className={cn(
      "inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-md border",
      accent
        ? "bg-primary/15 text-primary border-primary/30"
        : "bg-surface-2/70 text-foreground/80 border-border/40"
    )}
  >
    {icon}
    {label}
  </motion.span>
);

const CreateNewBlock = ({
  onClick,
  parsedSummary,
  active,
}: {
  onClick: () => void;
  parsedSummary: string;
  active: boolean;
}) => (
  <div className="p-2">
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left px-3 py-3 rounded-lg transition-all group relative overflow-hidden",
        "border border-primary/25 hover:border-primary/50",
        active ? "bg-primary/10" : "bg-primary/5 hover:bg-primary/10"
      )}
    >
      <div
        className="absolute inset-0 opacity-30 group-hover:opacity-50 transition-opacity"
        style={{
          background:
            "linear-gradient(135deg, hsl(var(--primary) / 0.15), transparent 60%)",
        }}
      />
      <div className="relative flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center shrink-0 border border-primary/30">
          <Plus className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
              Новый инцидент
            </span>
            <Sparkles className="w-3 h-3 text-primary/70" />
          </div>
          <p className="text-sm text-foreground mt-1 line-clamp-2">{parsedSummary}</p>
          <p className="text-[10px] text-muted-foreground mt-1">
            Запустить AI-диагностику по описанию
          </p>
        </div>
        <ArrowRight className="w-4 h-4 text-primary/60 group-hover:translate-x-1 transition-transform" />
      </div>
    </button>
  </div>
);

const ReasoningView = ({
  reasoning,
}: {
  reasoning: {
    steps: ReasoningStep[];
    completedCount: number;
    activeStep: number;
    finalAction: { kind: "select" | "create"; payload: Incident } | null;
  };
}) => {
  return (
    <div className="px-5 py-5 space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }}
        >
          <Brain className="w-4 h-4 text-primary" />
        </motion.div>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">
          Reasoning
        </span>
      </div>

      <div className="relative pl-1">
        {reasoning.steps.map((step, i) => {
          const isDone = i < reasoning.completedCount;
          const isActive = i === reasoning.activeStep;
          const isVisible = i <= reasoning.activeStep || isDone || (reasoning.activeStep === -1);
          if (!isVisible) return null;
          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: -4, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.35 }}
              className="relative flex items-start gap-3 py-2"
            >
              <div className="relative shrink-0 mt-0.5">
                <div
                  className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center border transition-colors",
                    isDone
                      ? "bg-primary/15 border-primary/40 text-primary"
                      : isActive
                      ? "bg-primary/10 border-primary/30 text-primary"
                      : "bg-surface-1 border-border text-muted-foreground"
                  )}
                >
                  {isActive && !isDone ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    step.icon
                  )}
                </div>
                {isActive && (
                  <motion.div
                    className="absolute inset-[-3px] rounded-full border border-primary/40"
                    animate={{ scale: [1, 1.4], opacity: [0.6, 0] }}
                    transition={{ duration: 1.4, repeat: Infinity }}
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "text-sm transition-colors",
                    isDone || isActive ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {step.label}
                </p>
                {step.detail && (isActive || isDone) && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.15 }}
                    className="text-[11px] text-muted-foreground mt-0.5"
                  >
                    {step.detail}
                  </motion.p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {reasoning.finalAction && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 p-3 rounded-lg border border-primary/30 bg-primary/10 flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-xs text-foreground">
              {reasoning.finalAction.kind === "create"
                ? `Открываю диагностику нового инцидента ${reasoning.finalAction.payload.id}…`
                : `Открываю инцидент ${reasoning.finalAction.payload.id}…`}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RCSearchModal;
