import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, Sparkles, Search, Target, FlaskConical, CheckCircle2,
  ChevronLeft, ChevronRight, Shield, AlertTriangle, BookOpen, Activity, ThumbsUp, ThumbsDown, MessageSquare
} from "lucide-react";
import { cn } from "@/lib/utils";
import { mockIncidents, mockHypotheses, getSeverityColor } from "@/lib/mockIncidents";
import RCModeSwitcher from "@/components/root-cause/RCModeSwitcher";

interface Chapter {
  id: string;
  kind: "symptom" | "signals" | "thinking" | "hypothesis" | "test" | "resolution";
  title: string;
  subtitle: string;
  icon: any;
  hue: string;
  body: () => JSX.Element;
}

export default function RootCausePlaybook() {
  const incident = mockIncidents[0];
  const hyps = (mockHypotheses[incident.id] || []).slice(0, 3);
  const colors = getSeverityColor(incident.severity);

  const [index, setIndex] = useState(0);
  const [streamed, setStreamed] = useState("");
  const [direction, setDirection] = useState(1);

  const reasoningSteps = [
    "Сравниваю профиль аномалии с базой паттернов знаний (pg_trgm + tsvector)…",
    "Совпадение 0.91 с инцидентом INC-204 (схожий рост latency на том же сервисе).",
    "Корреляция событий деплоя за последние 30 минут — найден релиз backend@1.42.0.",
    "Проверяю метрики зависимостей: Postgres pool насыщен, Redis ok, downstream API ok.",
    "Формирую 3 ранжированных гипотезы по убыванию уверенности.",
  ];

  const chapters: Chapter[] = [
    {
      id: "symptom",
      kind: "symptom",
      title: "Симптом",
      subtitle: "Что произошло",
      icon: AlertTriangle,
      hue: "from-red-500/30 via-red-500/10 to-transparent",
      body: () => (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className={cn("w-3 h-3 rounded-full animate-pulse", colors.dot)} />
            <span className={cn("text-[10px] font-bold uppercase tracking-[0.2em] px-2 py-0.5 rounded-full", colors.bg, colors.text)}>
              {incident.severity}
            </span>
            <span className="font-mono text-xs text-muted-foreground">{incident.id}</span>
          </div>
          <h2 className="text-3xl font-bold text-foreground leading-tight">{incident.title}</h2>
          <p className="text-base text-muted-foreground leading-relaxed">{incident.description}</p>
          <div className="grid grid-cols-3 gap-3 pt-2">
            {(incident.metrics || []).slice(0, 3).map((m, i) => (
              <motion.div
                key={i}
                initial={{ y: 16, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="rounded-xl border border-border/40 bg-surface-1/60 p-3"
              >
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{m.label}</div>
                <div className="mt-1 text-xl font-bold font-mono text-foreground">{m.value}</div>
              </motion.div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: "signals",
      kind: "signals",
      title: "Сигналы",
      subtitle: "Что увидел агент",
      icon: Search,
      hue: "from-cyan-500/25 via-cyan-500/5 to-transparent",
      body: () => (
        <div className="space-y-3">
          {[
            { src: "Logs", val: "2 401 events / min", trend: "+340%", color: "text-red-400" },
            { src: "Metric: latency p95", val: "1 280 ms", trend: "+12×", color: "text-orange-400" },
            { src: "KB Match", val: "AML rule #14", trend: "0.91", color: "text-accent" },
            { src: "Deploy event", val: "backend@1.42.0", trend: "−4 min", color: "text-yellow-400" },
          ].map((s, i) => (
            <motion.div
              key={i}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: i * 0.12 }}
              className="flex items-center justify-between rounded-xl border border-border/40 bg-surface-1/60 px-4 py-3 hover:border-primary/40 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Activity className="w-4 h-4 text-primary" />
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.src}</div>
                  <div className="text-sm font-mono text-foreground">{s.val}</div>
                </div>
              </div>
              <span className={cn("text-sm font-bold font-mono", s.color)}>{s.trend}</span>
            </motion.div>
          ))}
        </div>
      ),
    },
    {
      id: "thinking",
      kind: "thinking",
      title: "Цепочка рассуждений",
      subtitle: "AI думает вслух",
      icon: Brain,
      hue: "from-primary/30 via-primary/8 to-transparent",
      body: () => <ThinkingPanel steps={reasoningSteps} />,
    },
    {
      id: "hypothesis",
      kind: "hypothesis",
      title: "Гипотезы",
      subtitle: `${hyps.length} вариантов причины`,
      icon: Sparkles,
      hue: "from-accent/30 via-accent/8 to-transparent",
      body: () => (
        <div className="space-y-3">
          {hyps.map((h, i) => (
            <motion.div
              key={i}
              initial={{ y: 18, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.15, type: "spring", stiffness: 260 }}
              className={cn(
                "rounded-2xl border p-4 relative overflow-hidden",
                i === 0 ? "border-accent/50 bg-accent/5 shadow-[0_0_24px_hsl(var(--accent)/0.25)]" : "border-border/40 bg-surface-1/50"
              )}
            >
              {i === 0 && (
                <span className="absolute top-3 right-3 text-[9px] uppercase tracking-[0.2em] text-accent font-bold">Lead</span>
              )}
              <div className="flex items-center gap-3 mb-2">
                <div className={cn(
                  "w-9 h-9 rounded-xl flex items-center justify-center font-bold font-mono",
                  i === 0 ? "bg-accent/20 text-accent" : "bg-surface-2/60 text-muted-foreground"
                )}>
                  {h.confidence}%
                </div>
                <h3 className="text-base font-semibold text-foreground">{h.title}</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-2">{h.explanation}</p>
              <div className="text-xs text-foreground/80 italic">→ {h.recommendation}</div>
              <div className="mt-3 h-1 rounded-full bg-surface-3/60 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${h.confidence}%` }}
                  transition={{ duration: 0.9, delay: 0.3 + i * 0.1 }}
                  className={cn("h-full", i === 0 ? "bg-gradient-to-r from-accent to-primary" : "bg-muted-foreground/40")}
                />
              </div>
            </motion.div>
          ))}
        </div>
      ),
    },
    {
      id: "test",
      kind: "test",
      title: "Проверка",
      subtitle: "Как агент это валидирует",
      icon: FlaskConical,
      hue: "from-yellow-500/25 via-yellow-500/5 to-transparent",
      body: () => (
        <div className="space-y-3">
          {[
            { q: "Откатить релиз backend@1.42.0?", a: "Симулирую: latency возвращается к 95 ms за ~40 сек" },
            { q: "Увеличить пул Postgres ×2?", a: "Снимет 70% нагрузки, не лечит первопричину" },
            { q: "Включить fallback на Redis cache?", a: "Снижает SLA, рекомендуется как hot-fix" },
          ].map((t, i) => (
            <motion.div
              key={i}
              initial={{ y: 14, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.12 }}
              className="rounded-xl border border-border/40 bg-surface-1/60 p-4"
            >
              <div className="flex items-center gap-2 mb-1">
                <FlaskConical className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-semibold text-foreground">{t.q}</span>
              </div>
              <p className="text-xs text-muted-foreground pl-6">{t.a}</p>
            </motion.div>
          ))}
        </div>
      ),
    },
    {
      id: "resolution",
      kind: "resolution",
      title: "Решение",
      subtitle: "Рекомендация агента",
      icon: CheckCircle2,
      hue: "from-emerald-500/30 via-emerald-500/8 to-transparent",
      body: () => (
        <div className="space-y-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="rounded-2xl border border-emerald-500/40 bg-emerald-500/5 p-5 shadow-[0_0_30px_hsl(160_70%_45%/0.2)]"
          >
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              <h3 className="text-xl font-bold text-foreground">Откатить backend@1.42.0</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Главная гипотеза подтверждена. Откат вернёт сервис к baseline за ~40 секунд. Затем — ретроспектива по миграции пула соединений в коммите 7a3f1e2.
            </p>
            <div className="flex gap-2">
              <button className="flex-1 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 px-4 py-2.5 text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                <ThumbsUp className="w-4 h-4" /> Применить
              </button>
              <button className="rounded-xl bg-surface-2/60 hover:bg-surface-3/60 border border-border/40 text-muted-foreground px-4 py-2.5 text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                <MessageSquare className="w-4 h-4" /> Уточнить
              </button>
              <button className="rounded-xl bg-surface-2/60 hover:bg-surface-3/60 border border-border/40 text-muted-foreground px-4 py-2.5 text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                <ThumbsDown className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
          <div className="text-[11px] text-muted-foreground text-center">
            Цепочка рассуждений сохранена в постмортем · можно поделиться ссылкой
          </div>
        </div>
      ),
    },
  ];

  const next = () => { setDirection(1); setIndex((i) => Math.min(chapters.length - 1, i + 1)); };
  const prev = () => { setDirection(-1); setIndex((i) => Math.max(0, i - 1)); };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const ch = chapters[index];
  const Icon = ch.icon;

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-background flex flex-col">
      <RCModeSwitcher />

      {/* Ambient hue per chapter */}
      <AnimatePresence>
        <motion.div
          key={ch.id + "-hue"}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className={cn("absolute inset-0 pointer-events-none bg-gradient-to-b", ch.hue)}
        />
      </AnimatePresence>

      {/* Header */}
      <div className="relative z-20 pt-20 pb-4 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpen className="w-4 h-4 text-primary" />
          <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">AI Investigation Playbook</span>
          <span className="font-mono text-xs text-foreground/80">{incident.id}</span>
        </div>
        <span className="text-[11px] font-mono text-muted-foreground">{index + 1} / {chapters.length}</span>
      </div>

      {/* Progress dots */}
      <div className="relative z-20 px-6 pb-2 flex items-center gap-2">
        {chapters.map((c, i) => {
          const ChIcon = c.icon;
          const done = i < index;
          const active = i === index;
          return (
            <button
              key={c.id}
              onClick={() => { setDirection(i > index ? 1 : -1); setIndex(i); }}
              className={cn(
                "flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] uppercase tracking-wider transition-all",
                active && "border-primary/60 bg-primary/15 text-primary shadow-[0_0_18px_hsl(var(--primary)/0.35)]",
                done && !active && "border-emerald-500/30 bg-emerald-500/5 text-emerald-300/80",
                !active && !done && "border-border/40 bg-surface-1/40 text-muted-foreground hover:border-border"
              )}
            >
              <ChIcon className="w-3 h-3" />
              {c.title}
            </button>
          );
        })}
        <div className="ml-auto flex-1 h-1 rounded-full bg-surface-2/40 overflow-hidden max-w-[160px]">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-accent"
            animate={{ width: `${((index + 1) / chapters.length) * 100}%` }}
            transition={{ type: "spring", stiffness: 200, damping: 26 }}
          />
        </div>
      </div>

      {/* Chapter card */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-6 pb-24 overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={ch.id}
            custom={direction}
            initial={{ opacity: 0, x: direction * 60, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -direction * 60, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 240, damping: 28 }}
            className="w-full max-w-3xl rounded-3xl border border-border/40 bg-surface-1/70 backdrop-blur-2xl p-8 shadow-2xl shadow-black/40 overflow-hidden relative"
          >
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary/30 to-accent/20 flex items-center justify-center ring-1 ring-primary/30 shadow-[0_0_20px_hsl(var(--primary)/0.4)]">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{ch.subtitle}</div>
                <h2 className="text-2xl font-bold text-foreground">{ch.title}</h2>
              </div>
            </div>
            <div className="max-h-[55vh] overflow-y-auto pr-2 -mr-2">
              {ch.body()}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Nav */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3">
        <button
          onClick={prev}
          disabled={index === 0}
          className="w-11 h-11 rounded-full border border-border/40 bg-surface-1/80 backdrop-blur-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-surface-2/80 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shadow-lg"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="rounded-full border border-border/40 bg-surface-1/80 backdrop-blur-xl px-4 py-2 text-[11px] font-mono text-muted-foreground shadow-lg">
          ← → клавиатура для навигации
        </div>
        <button
          onClick={next}
          disabled={index === chapters.length - 1}
          className="w-11 h-11 rounded-full border border-primary/40 bg-gradient-to-br from-primary to-primary/70 text-primary-foreground flex items-center justify-center hover:shadow-[0_0_24px_hsl(var(--primary)/0.6)] disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

function ThinkingPanel({ steps }: { steps: string[] }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    setShown(0);
    const t = setInterval(() => {
      setShown((s) => {
        if (s >= steps.length) { clearInterval(t); return s; }
        return s + 1;
      });
    }, 700);
    return () => clearInterval(t);
  }, [steps]);

  return (
    <div className="space-y-2 font-mono text-sm">
      {steps.slice(0, shown).map((s, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex gap-3 items-start text-foreground/85"
        >
          <span className="text-primary mt-0.5 shrink-0">›</span>
          <span>{s}</span>
        </motion.div>
      ))}
      {shown < steps.length && (
        <motion.div
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.2, repeat: Infinity }}
          className="flex gap-3 items-center text-primary"
        >
          <Brain className="w-4 h-4" />
          <span className="text-xs">агент рассуждает…</span>
        </motion.div>
      )}
      {shown >= steps.length && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-3 flex items-center gap-2 text-emerald-400 text-xs"
        >
          <CheckCircle2 className="w-4 h-4" />
          Цепочка завершена · готов сформировать гипотезы
        </motion.div>
      )}
    </div>
  );
}
