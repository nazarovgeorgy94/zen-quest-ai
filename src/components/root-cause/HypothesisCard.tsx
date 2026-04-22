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
  const confidenceTone = hyp.confidence >= 80 ? "High confidence" : hyp.confidence >= 50 ? "Moderate confidence" : "Weak signal";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 + i * 0.12, ease: [0.16, 1, 0.3, 1] }}
      className="relative group/card"
    >
      {/* Outer glow for top hypothesis */}
      {isTop && (
        <div
          className="absolute -inset-[1px] rounded-xl opacity-60 blur-[1px]"
          style={{
            background: "linear-gradient(135deg, hsl(var(--primary) / 0.3), hsl(var(--accent) / 0.15), hsl(var(--primary) / 0.2))",
          }}
        />
      )}

      {/* Glass container */}
        <div
        className={cn(
          "relative rounded-xl overflow-hidden transition-all duration-300",
          isTop
              ? "shadow-[0_10px_34px_-10px_hsl(var(--primary)/0.16)]"
              : "hover:shadow-[0_6px_22px_-8px_hsl(var(--primary)/0.1)]"
        )}
        style={{
          background: isTop
            ? "linear-gradient(135deg, hsl(var(--surface-1) / 0.85), hsl(var(--surface-2) / 0.6))"
            : "hsl(var(--surface-1) / 0.5)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          border: isTop
            ? "1px solid hsl(var(--primary) / 0.2)"
            : "1px solid hsl(var(--border) / 0.2)",
        }}
      >
        {/* Noise texture overlay */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Inner light reflection */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: isTop
              ? "linear-gradient(135deg, hsl(var(--primary) / 0.06) 0%, transparent 40%, hsl(var(--accent) / 0.04) 100%)"
              : "linear-gradient(135deg, hsl(var(--muted-foreground) / 0.04) 0%, transparent 50%)",
          }}
        />

        {/* Shimmer edge on hover */}
        <div
          className="absolute inset-0 pointer-events-none opacity-0 group-hover/card:opacity-100 transition-opacity duration-500"
          style={{
            background: "linear-gradient(135deg, hsl(var(--primary) / 0.08), transparent 60%)",
          }}
        />

        <div className={cn("relative", isTop ? "p-5" : "p-4")}>
          {/* Title row */}
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 relative overflow-hidden",
              )}
              style={{
                background: isTop
                  ? "linear-gradient(135deg, hsl(var(--primary) / 0.2), hsl(var(--accent) / 0.1))"
                  : "hsl(var(--surface-2) / 0.6)",
                border: isTop ? "1px solid hsl(var(--primary) / 0.15)" : "none",
              }}
            >
              <Lightbulb className={cn("w-3.5 h-3.5 relative z-10", isTop ? "text-primary" : "text-muted-foreground")} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className={cn("font-semibold text-foreground", isTop ? "text-base" : "text-sm")}>{hyp.title}</h3>
                <span
                  className="text-[9px] uppercase px-1.5 py-0.5 rounded-full font-semibold"
                  style={{
                    background: isTop
                      ? "linear-gradient(135deg, hsl(var(--primary) / 0.2), hsl(var(--accent) / 0.12))"
                      : "hsl(var(--surface-2) / 0.8)",
                    color: isTop ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
                    border: isTop ? "1px solid hsl(var(--primary) / 0.15)" : "1px solid hsl(var(--border) / 0.2)",
                  }}
                >
                  {isTop ? "Lead" : "Alt"}
                </span>
                <span className="text-[10px] text-muted-foreground">{confidenceTone}</span>
              </div>
              <div className="mt-2">
                <ConfidenceBar value={hyp.confidence} />
              </div>
            </div>
          </div>

          {/* Explanation */}
          <p className={cn("mt-3 leading-relaxed pl-10", isTop ? "text-[13px] text-foreground/72" : "text-[12px] text-foreground/58")}>
            {hyp.explanation}
          </p>

          {/* Expandable recommendation */}
          <div className="mt-3 pl-10">
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1.5 text-[11px] text-primary/70 hover:text-primary font-medium transition-colors"
            >
              <ArrowRight className="w-3 h-3" />
              {isTop ? "Priority recommendation" : "Recommendation"}
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
                  <div
                    className="mt-2 p-3 rounded-lg"
                    style={{
                      background: "hsl(var(--primary) / 0.04)",
                      border: "1px solid hsl(var(--primary) / 0.1)",
                      backdropFilter: "blur(8px)",
                    }}
                  >
                    <p className="text-xs text-foreground/70 leading-relaxed">{hyp.recommendation}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default HypothesisCard;
