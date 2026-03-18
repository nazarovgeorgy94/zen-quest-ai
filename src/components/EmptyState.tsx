import { motion } from "framer-motion";
import { Sparkles, Shield, Search, Activity } from "lucide-react";

interface EmptyStateProps {
  onQuerySelect: (query: string) => void;
}

const suggestions = [
  { icon: Shield, text: "Что делает velocity_check_24h?", color: "text-primary" },
  { icon: Search, text: "Правила CNP-фрод детекции", color: "text-primary" },
  { icon: Activity, text: "Пороги скоринга для блокировки", color: "text-primary" },
];

const quickTags = [
  "Device fingerprinting",
  "AML-мониторинг",
  "Chargeback workflow",
  "Score-модель Q1",
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.15 },
  },
};

const item = {
  hidden: { opacity: 0, y: 8, filter: "blur(3px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const } },
};

const EmptyState = ({ onQuerySelect }: EmptyStateProps) => {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="w-full space-y-6"
    >
      {/* Hero */}
      <motion.div variants={item} className="text-center space-y-3">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center relative">
          <div className="absolute inset-0 rounded-2xl ai-btn-ring opacity-20" />
          <Sparkles className="w-5 h-5 text-primary relative z-10" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground tracking-tight-custom">
            Antifraud Assistant
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Поиск по базе знаний • Правила • Политики
          </p>
        </div>
      </motion.div>

      {/* Suggestion cards */}
      <motion.div variants={item} className="space-y-2">
        {suggestions.map((s) => (
          <button
            key={s.text}
            onClick={() => onQuerySelect(s.text)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-secondary/50 border border-border/50 hover:border-primary/20 hover:bg-secondary transition-all duration-200 group text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors duration-200">
              <s.icon className="w-4 h-4 text-primary/70 group-hover:text-primary transition-colors duration-200" />
            </div>
            <span className="text-[13px] text-foreground/80 group-hover:text-foreground transition-colors duration-200">
              {s.text}
            </span>
          </button>
        ))}
      </motion.div>

      {/* Quick tags */}
      <motion.div variants={item} className="space-y-2.5">
        <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium px-1">Популярные темы</p>
        <div className="flex flex-wrap gap-1.5">
          {quickTags.map((tag) => (
            <button
              key={tag}
              onClick={() => onQuerySelect(tag)}
              className="px-3 py-1.5 rounded-lg bg-secondary/40 text-[12px] text-secondary-foreground hover:bg-secondary hover:text-foreground transition-all duration-200 border border-transparent hover:border-border/50"
            >
              {tag}
            </button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default EmptyState;
