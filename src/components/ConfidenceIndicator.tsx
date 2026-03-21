import { motion } from "framer-motion";
import { ShieldCheck, ShieldAlert, ShieldQuestion } from "lucide-react";

interface ConfidenceIndicatorProps {
  /** 0–100 confidence score */
  score: number;
}

const getLevel = (score: number) => {
  if (score >= 70) return { label: "Высокая уверенность", icon: ShieldCheck, color: "text-primary", bg: "bg-primary/12", bar: "bg-primary" };
  if (score >= 40) return { label: "Средняя уверенность", icon: ShieldAlert, color: "text-yellow-500", bg: "bg-yellow-500/10", bar: "bg-yellow-500" };
  return { label: "Низкая уверенность", icon: ShieldQuestion, color: "text-muted-foreground", bg: "bg-muted/30", bar: "bg-muted-foreground/50" };
};

const ConfidenceIndicator = ({ score }: ConfidenceIndicatorProps) => {
  const level = getLevel(score);
  const Icon = level.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="flex items-center gap-2 pl-9"
    >
      <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${level.bg}`}>
        <Icon className={`w-3 h-3 ${level.color}`} />
        <span className={`text-[10px] font-medium ${level.color}`}>{level.label}</span>
        <div className="w-12 h-1.5 rounded-full bg-muted/20 ml-1 overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${level.bar}`}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(score, 100)}%` }}
            transition={{ delay: 0.6, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
        <span className={`text-[10px] font-mono ${level.color} opacity-70`}>{score}%</span>
      </div>
    </motion.div>
  );
};

export default ConfidenceIndicator;
