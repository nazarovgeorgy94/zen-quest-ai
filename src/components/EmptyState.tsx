import { motion } from "framer-motion";
import { Sparkles, TrendingUp, Zap } from "lucide-react";

interface EmptyStateProps {
  onQuerySelect: (query: string) => void;
}

const recentQueries = [
  "Политика удалённой работы",
  "Процедура онбординга",
  "Квартальные KPI команд",
  "Бюджет на обучение",
];

const trendingQueries = [
  { num: 1, text: "Обновления политики безопасности" },
  { num: 2, text: "Структура отделов Q1 2026" },
  { num: 3, text: "Руководство по код-ревью" },
  { num: 4, text: "Корпоративные льготы" },
];

const forYouCards = [
  {
    icon: "📋",
    title: "Регламент согласования договоров",
    subtitle: "На основе ваших запросов",
  },
  {
    icon: "🔐",
    title: "Политика информационной безопасности",
    subtitle: "Обновлено недавно",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.2 },
  },
};

const item = {
  hidden: { opacity: 0, y: 10, filter: "blur(4px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
};

const EmptyState = ({ onQuerySelect }: EmptyStateProps) => {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="w-full max-w-[800px] mx-auto space-y-8"
    >
      {/* Header */}
      <motion.div variants={item} className="space-y-2">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium tracking-tight-custom">Knowledge Assistant</span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight-custom text-foreground text-balance">
          Чем могу помочь?
        </h1>
      </motion.div>

      {/* Recent */}
      <motion.div variants={item} className="space-y-3">
        <h2 className="text-sm font-medium text-primary/80 uppercase tracking-wider">Недавние</h2>
        <div className="flex flex-wrap gap-2">
          {recentQueries.map((q) => (
            <button
              key={q}
              onClick={() => onQuerySelect(q)}
              className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm hover:bg-muted transition-colors duration-200"
            >
              {q}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Trending */}
      <motion.div variants={item} className="space-y-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-3.5 h-3.5 text-primary/70" />
          <h2 className="text-sm font-medium text-primary/80 uppercase tracking-wider">Популярные</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {trendingQueries.map((q) => (
            <button
              key={q.num}
              onClick={() => onQuerySelect(q.text)}
              className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm hover:bg-muted transition-colors duration-200"
            >
              <span className="text-primary/70 mr-1.5">{q.num}.</span>
              {q.text}
            </button>
          ))}
        </div>
      </motion.div>

      {/* For You */}
      <motion.div variants={item} className="space-y-3">
        <div className="flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-primary/70" />
          <h2 className="text-sm font-medium text-primary/80 uppercase tracking-wider">Для вас</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {forYouCards.map((card) => (
            <button
              key={card.title}
              onClick={() => onQuerySelect(card.title)}
              className="text-left p-5 rounded-xl bg-card border border-border hover:border-primary/20 transition-all duration-300 group"
            >
              <span className="text-2xl mb-3 block">{card.icon}</span>
              <h3 className="font-semibold text-card-foreground text-sm tracking-tight-custom group-hover:text-primary transition-colors duration-200">
                {card.title}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">{card.subtitle}</p>
            </button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default EmptyState;
