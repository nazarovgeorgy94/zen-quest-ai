import { useState, useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  Sparkles,
  Shield,
  Search,
  Activity,
  TrendingUp,
  AlertTriangle,
  Zap,
  BarChart3,
  SlidersHorizontal,
  GitBranch,
  Filter,
  ArrowUpRight,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

interface EmptyStateProps {
  onQuerySelect: (query: string) => void;
}

/* ── Animated counter hook ── */
function useAnimatedCounter(end: number, duration = 1200, startOnView = true) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!startOnView || !inView) return;

    let startTime: number | null = null;
    let frame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * end));
      if (progress < 1) {
        frame = requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [end, duration, inView, startOnView]);

  return { count, ref };
}

/* ── Animated decimal counter ── */
function useAnimatedDecimal(end: number, decimals = 1, duration = 1200) {
  const [value, setValue] = useState("0");
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;

    let startTime: number | null = null;
    let frame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue((eased * end).toFixed(decimals));
      if (progress < 1) {
        frame = requestAnimationFrame(animate);
      } else {
        setValue(end.toFixed(decimals));
      }
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [end, decimals, duration, inView]);

  return { value, ref };
}

/* ── Compact stat row ── */
const StatRow = ({ stat, index }: { stat: typeof liveStats[0]; index: number }) => {
  const isInteger = stat.numericValue % 1 === 0;
  const intCounter = useAnimatedCounter(
    isInteger ? stat.numericValue : 0,
    1000 + index * 150
  );
  const decCounter = useAnimatedDecimal(
    !isInteger ? stat.numericValue : 0,
    1,
    1000 + index * 150
  );

  const displayRef = isInteger ? intCounter.ref : decCounter.ref;
  const displayValue = isInteger ? intCounter.count.toLocaleString("ru-RU") : decCounter.value;

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.25 + index * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="flex items-center gap-2.5 px-3 py-1.5 group"
    >
      <stat.icon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
      <span className="text-[11px] text-muted-foreground flex-1 truncate">{stat.label}</span>
      <span
        ref={displayRef}
        className="text-[13px] font-semibold text-foreground tabular-nums tracking-tight"
      >
        {displayValue}{stat.suffix}
      </span>
      <span className={`text-[10px] font-medium flex items-center gap-0.5 min-w-[40px] justify-end ${
        stat.up ? 'text-primary' : 'text-destructive'
      }`}>
        {stat.up ? <ArrowUp className="w-2.5 h-2.5" /> : <ArrowDown className="w-2.5 h-2.5" />}
        {stat.delta}
      </span>
    </motion.div>
  );
};

/* ── mock live stats ── */
const liveStats = [
  { label: "Сработки 24ч", numericValue: 1247, suffix: "", delta: "12%", up: true, icon: AlertTriangle },
  { label: "Detection rate", numericValue: 94.3, suffix: "%", delta: "2.1%", up: true, icon: TrendingUp },
  { label: "False positive", numericValue: 4.3, suffix: "%", delta: "1.8%", up: false, icon: Activity },
  { label: "Avg score", numericValue: 67.2, suffix: "", delta: "4.5", up: true, icon: BarChart3 },
];

/* ── quick prompt cards ── */
const promptCards = [
  {
    icon: Shield,
    title: "Анализ правила",
    text: "Объясни логику velocity_check_24h и его эффективность",
  },
  {
    icon: Search,
    title: "Расследование",
    text: "Покажи паттерны CNP-фрода за последний квартал",
  },
  {
    icon: SlidersHorizontal,
    title: "Оптимизация порогов",
    text: "Предложи корректировку порогов для снижения FP rate",
  },
  {
    icon: GitBranch,
    title: "Тиражирование",
    text: "Какие правила стоит распространить на мобильный канал?",
  },
];

/* ── recommendations ── */
const recommendations = [
  { icon: Zap, text: "Снизить порог velocity до 12 txn/24h", tag: "Порог" },
  { icon: Filter, text: "Добавить geo-condition в rule_cnp_03", tag: "Условие" },
  { icon: GitBranch, text: "Тиражировать device_fp на POS-канал", tag: "Канал" },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 10, filter: "blur(4px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] as const },
  },
};

const EmptyState = ({ onQuerySelect }: EmptyStateProps) => {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="w-full space-y-5"
    >
      {/* ── Hero ── */}
      <motion.div variants={item} className="text-center space-y-3 pt-1">
        <div className="relative w-16 h-16 mx-auto">
          {/* Orbiting ring 1 */}
          <motion.div
            className="absolute inset-[-14px] rounded-full border border-primary/20"
            animate={{ rotate: 360, scale: [1, 1.06, 1] }}
            transition={{ rotate: { duration: 12, repeat: Infinity, ease: "linear" }, scale: { duration: 4, repeat: Infinity, ease: "easeInOut" } }}
          />
          {/* Orbiting ring 2 — counter-rotate */}
          <motion.div
            className="absolute inset-[-8px] rounded-full border border-teal-accent/15"
            animate={{ rotate: -360, scale: [1, 0.95, 1] }}
            transition={{ rotate: { duration: 8, repeat: Infinity, ease: "linear" }, scale: { duration: 3, repeat: Infinity, ease: "easeInOut" } }}
          />
          {/* Breathing glow */}
          <motion.div
            className="absolute inset-[-18px] rounded-full bg-primary/25 blur-2xl"
            animate={{ opacity: [0.15, 0.35, 0.15], scale: [0.9, 1.1, 0.9] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute inset-[-10px] rounded-full bg-teal-accent/15 blur-xl"
            animate={{ opacity: [0.1, 0.25, 0.1], scale: [1.05, 0.9, 1.05] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
          />
          {/* Orb */}
          <motion.div
            className="relative w-16 h-16 rounded-full flex items-center justify-center overflow-hidden"
            animate={{ scale: [1, 1.06, 1] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="absolute inset-0 ai-btn-ring opacity-50" />
            <div className="absolute inset-[2px] rounded-full bg-card flex items-center justify-center">
              <motion.div
                animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 0.9, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <Sparkles className="w-6 h-6 text-primary" />
              </motion.div>
            </div>
          </motion.div>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground tracking-tight-custom">
            Antifraud Assistant
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Аналитика • Правила • Рекомендации
          </p>
        </div>
      </motion.div>

      {/* ── Live Stats ── */}
      <motion.div variants={item} className="rounded-xl glass-card overflow-hidden divide-y divide-border/20">
        <div className="flex items-center justify-between px-3 py-2">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">
            Live-метрики
          </p>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] text-primary/70 font-medium">Realtime</span>
          </div>
        </div>
        {liveStats.map((stat, i) => (
          <StatRow key={stat.label} stat={stat} index={i} />
        ))}
      </motion.div>

      {/* ── Quick Prompts ── */}
      <motion.div variants={item} className="rounded-xl glass-card overflow-hidden">
        <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium px-3 py-2">
          Быстрые запросы
        </p>
        <div className="divide-y divide-border/20">
          {promptCards.map((card) => (
            <motion.button
              key={card.title}
              onClick={() => onQuerySelect(card.text)}
              whileHover={{ x: 3, backgroundColor: "hsl(var(--primary) / 0.06)" }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="w-full flex items-center gap-3 px-3 py-2.5 transition-colors duration-200 group text-left"
            >
              <card.icon className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary shrink-0 transition-colors duration-200" />
              <span className="text-[12px] text-foreground/80 group-hover:text-foreground flex-1 truncate transition-colors duration-200">
                {card.text}
              </span>
              <ArrowUpRight className="w-3 h-3 text-muted-foreground/30 group-hover:text-primary/60 shrink-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* ── AI Recommendations ── */}
      <motion.div variants={item} className="space-y-2">
        <div className="flex items-center gap-1.5 px-0.5">
          <Zap className="w-3 h-3 text-primary/60" />
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">
            Рекомендации AI
          </p>
        </div>
        <div className="space-y-1.5">
          {recommendations.map((rec) => (
            <motion.button
              key={rec.text}
              onClick={() => onQuerySelect(rec.text)}
              whileHover={{ scale: 1.015, y: -1 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl glass-card group text-left"
            >
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors duration-300">
                <rec.icon className="w-3.5 h-3.5 text-primary/60 group-hover:text-primary transition-colors duration-200" />
              </div>
              <span className="text-[12px] text-foreground/75 group-hover:text-foreground flex-1 transition-colors duration-200 leading-snug">
                {rec.text}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary/70 font-medium shrink-0 group-hover:bg-primary/20 transition-colors duration-300">
                {rec.tag}
              </span>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default EmptyState;
