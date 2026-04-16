import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb, ArrowRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Hypothesis } from "@/lib/mockIncidents";

interface HypothesisCardProps {
  hypothesis: Hypothesis;
  index: number;
  isTop: boolean;
}

function ConfidenceBar({ value }: { value: number }) {
  const color =
    value >= 80
      ? "from-primary to-accent"
      : value >= 50
      ? "from-warning to-yellow-500"
      : "from-muted-foreground/40 to-muted-foreground/20";

  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 h-1.5 rounded-full bg-surface-2/80 overflow-hidden">
        <motion.div
          className={cn("h-full rounded-full bg-gradient-to-r", color)}
          initial={{ width: "0%" }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
        />
      </div>
      <span
        className={cn(
          "text-[11px] font-mono font-bold tabular-nums shrink-0",
          value >= 80 ? "text-primary" : value >= 50 ? "text-warning" : "text-muted-foreground"
        )}
      >
        {value}%
      </span>
    </div>
  );
}

const HypothesisCard = ({ hypothesis: hyp, index: i, isTop }: HypothesisCardProps) => {
  const [expanded, setExpanded] = useState(isTop);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 + i * 0.12, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "rounded-xl border transition-colors duration-200",
        isTop
          ? "border-primary/20 bg-primary/[0.04]"
          : "border-border/20 bg-surface-1/50 hover:border-border/40"
      )}
    >
      <div className="p-4">
        {/* Title row */}
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
              isTop ? "bg-primary/15" : "bg-surface-2/60"
            )}
          >
            <Lightbulb className={cn("w-3.5 h-3.5", isTop ? "text-primary" : "text-muted-foreground")} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground">{hyp.title}</h3>
              {isTop && (
                <span className="text-[9px] uppercase px-1.5 py-0.5 rounded-full bg-primary/15 text-primary font-semibold">
                  Top
                </span>
              )}
            </div>
            <div className="mt-2">
              <ConfidenceBar value={hyp.confidence} />
            </div>
          </div>
        </div>

        {/* Explanation */}
        <p className="text-[13px] text-foreground/60 mt-3 leading-relaxed pl-10">{hyp.explanation}</p>

        {/* Expandable recommendation */}
        <div className="mt-3 pl-10">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1.5 text-[11px] text-primary/70 hover:text-primary font-medium transition-colors"
          >
            <ArrowRight className="w-3 h-3" />
            Рекомендация
            <ChevronDown
              className={cn("w-3 h-3 transition-transform duration-200", expanded && "rotate-180")}
            />
          </button>
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="mt-2 p-3 rounded-lg bg-primary/[0.04] border border-primary/10">
                  <p className="text-xs text-foreground/70 leading-relaxed">{hyp.recommendation}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default HypothesisCard;
