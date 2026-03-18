import { motion } from "framer-motion";
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
} from "lucide-react";

interface EmptyStateProps {
  onQuerySelect: (query: string) => void;
}

/* ── mock live stats ── */
const liveStats = [
  { label: "Сработки 24ч", value: "1 247", delta: "+12%", up: true, icon: AlertTriangle },
  { label: "Detection rate", value: "94.3%", delta: "+2.1%", up: true, icon: TrendingUp },
  { label: "False positive", value: "4.3%", delta: "−1.8%", up: false, icon: Activity },
  { label: "Avg score", value: "67.2", delta: "+4.5", up: true, icon: BarChart3 },
];

/* ── quick prompt cards (2x2 grid like reference) ── */
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

/* ── recommendation chips ── */
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
        <div className="relative w-14 h-14 mx-auto">
          {/* Glow */}
          <div className="absolute inset-[-8px] rounded-full bg-primary/20 blur-xl animate-pulse" />
          <div className="relative w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <div className="absolute inset-0 rounded-2xl ai-btn-ring opacity-25" />
            <Sparkles className="w-6 h-6 text-primary relative z-10" />
          </div>
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

      {/* ── Live Stats Row ── */}
      <motion.div variants={item} className="grid grid-cols-4 gap-1.5">
        {liveStats.map((s) => (
          <div
            key={s.label}
            className="relative rounded-xl bg-secondary/40 border border-border/40 px-2.5 py-2.5 text-center overflow-hidden group"
          >
            {/* Subtle top accent */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[1.5px] bg-primary/30 rounded-full" />
            <s.icon className="w-3.5 h-3.5 text-muted-foreground mx-auto mb-1.5" />
            <p className="text-[15px] font-semibold text-foreground leading-none tabular-nums">
              {s.value}
            </p>
            <p className="text-[10px] text-muted-foreground mt-1 leading-tight">{s.label}</p>
            <span
              className={`text-[10px] font-medium mt-0.5 inline-block ${
                s.up ? "text-primary" : "text-destructive"
              }`}
            >
              {s.delta}
            </span>
          </div>
        ))}
      </motion.div>

      {/* ── Prompt Cards 2×2 Grid ── */}
      <motion.div variants={item} className="space-y-2">
        <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium px-0.5">
          Быстрые запросы
        </p>
        <div className="grid grid-cols-2 gap-2">
          {promptCards.map((card) => (
            <button
              key={card.title}
              onClick={() => onQuerySelect(card.text)}
              className="group relative text-left rounded-xl bg-secondary/30 border border-border/40 hover:border-primary/25 p-3.5 transition-all duration-250 hover:bg-secondary/60"
            >
              {/* Hover glow */}
              <div className="absolute inset-0 rounded-xl bg-primary/[0.03] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative z-10">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mb-2.5 group-hover:bg-primary/15 transition-colors duration-200">
                  <card.icon className="w-4 h-4 text-primary/70 group-hover:text-primary transition-colors duration-200" />
                </div>
                <p className="text-[12px] font-medium text-foreground/90 leading-snug group-hover:text-foreground transition-colors duration-200">
                  {card.title}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed line-clamp-2">
                  {card.text}
                </p>
              </div>
              <ArrowUpRight className="absolute top-3 right-3 w-3 h-3 text-muted-foreground/40 opacity-0 group-hover:opacity-100 group-hover:text-primary/60 transition-all duration-200" />
            </button>
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
            <button
              key={rec.text}
              onClick={() => onQuerySelect(rec.text)}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-primary/[0.04] border border-primary/10 hover:border-primary/20 hover:bg-primary/[0.08] transition-all duration-200 group text-left"
            >
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <rec.icon className="w-3.5 h-3.5 text-primary/60 group-hover:text-primary transition-colors duration-200" />
              </div>
              <span className="text-[12px] text-foreground/75 group-hover:text-foreground flex-1 transition-colors duration-200 leading-snug">
                {rec.text}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary/70 font-medium shrink-0">
                {rec.tag}
              </span>
            </button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default EmptyState;
