import { motion } from "framer-motion";
import { Lightbulb, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Hypothesis } from "@/lib/mockIncidents";

interface HypothesisCardProps {
  hypothesis: Hypothesis;
  index: number;
  isTop: boolean;
}

const HypothesisCard = ({ hypothesis: hyp, index: i, isTop }: HypothesisCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.3 + i * 0.15, ease: [0.16, 1, 0.3, 1] }}
      className="relative rounded-xl overflow-hidden"
    >
      <div
        className={cn("absolute inset-0 rounded-xl", isTop ? "opacity-100" : "opacity-0")}
        style={{
          background: "linear-gradient(135deg, hsl(158 72% 42% / 0.25), hsl(175 65% 38% / 0.15), transparent)",
        }}
      />
      <div className={cn("absolute inset-[1px] rounded-[11px]", isTop ? "bg-surface-0/90" : "bg-surface-1")} />

      <div className="relative p-4">
        <div className="flex items-start gap-3">
          {/* Confidence ring */}
          <div className="relative w-12 h-12 shrink-0">
            <svg viewBox="0 0 48 48" className="w-12 h-12 -rotate-90">
              <circle cx="24" cy="24" r="20" fill="none" stroke="hsl(160 12% 15%)" strokeWidth="3" />
              <motion.circle
                cx="24" cy="24" r="20" fill="none"
                stroke={
                  hyp.confidence >= 80 ? "hsl(var(--success))"
                    : hyp.confidence >= 50 ? "hsl(var(--warning))"
                    : "hsl(160 10% 40%)"
                }
                strokeWidth="3" strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 20}`}
                initial={{ strokeDashoffset: 2 * Math.PI * 20 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 20 * (1 - hyp.confidence / 100) }}
                transition={{ duration: 1.2, delay: 0.4 + i * 0.15, ease: "easeOut" }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={cn(
                "text-[11px] font-mono font-bold",
                hyp.confidence >= 80 ? "text-success"
                  : hyp.confidence >= 50 ? "text-warning"
                  : "text-muted-foreground"
              )}>
                {hyp.confidence}%
              </span>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Lightbulb className={cn("w-3.5 h-3.5", isTop ? "text-primary" : "text-muted-foreground")} />
              <h3 className="text-sm font-semibold text-foreground">{hyp.title}</h3>
              {isTop && (
                <span className="text-[9px] uppercase px-1.5 py-0.5 rounded-full bg-primary/15 text-primary font-semibold">Top</span>
              )}
            </div>
            <p className="text-[13px] text-foreground/65 mt-1.5 leading-relaxed">{hyp.explanation}</p>
            <div className="mt-3 flex items-start gap-2 p-2.5 rounded-lg bg-primary/[0.04] border border-primary/10">
              <ArrowRight className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
              <p className="text-xs text-foreground/75 leading-relaxed">{hyp.recommendation}</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default HypothesisCard;
