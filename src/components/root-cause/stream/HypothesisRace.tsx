import { motion } from "framer-motion";
import { Crown, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

export interface RaceHypothesis {
  title: string;
  confidence: number;
  rationale: string;
}

interface HypothesisRaceProps {
  hypotheses: RaceHypothesis[];
  ready: boolean;
}

/**
 * Animated horse-race of competing hypotheses.
 * Each hypothesis bar fills toward its confidence; winner gets a crown + glow.
 */
export default function HypothesisRace({ hypotheses, ready }: HypothesisRaceProps) {
  const sorted = [...hypotheses].sort((a, b) => b.confidence - a.confidence);
  const winnerIdx = 0;
  const max = sorted[0]?.confidence ?? 100;

  return (
    <div className="rounded-2xl border border-border/40 bg-surface-1/60 backdrop-blur-md overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/30 bg-surface-2/30">
        <Lightbulb className="w-3.5 h-3.5 text-primary" />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground/85">
          Hypothesis Race
        </span>
        <span className="text-[10px] text-muted-foreground ml-auto">
          {ready ? "финиш" : "идёт скоринг…"}
        </span>
      </div>

      <div className="p-4 space-y-3">
        {sorted.map((h, i) => {
          const isWinner = i === winnerIdx && ready;
          const widthPct = ready ? (h.confidence / max) * 100 : 0;
          return (
            <div key={i} className="relative">
              <div className="flex items-center gap-2 mb-1.5">
                <div
                  className={cn(
                    "w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-mono font-bold shrink-0",
                    isWinner
                      ? "text-primary-foreground"
                      : "bg-surface-2/70 text-muted-foreground border border-border/30",
                  )}
                  style={
                    isWinner
                      ? {
                          background:
                            "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))",
                          boxShadow: "0 4px 12px -4px hsl(var(--primary) / 0.5)",
                        }
                      : undefined
                  }
                >
                  {isWinner ? <Crown className="w-3 h-3" /> : i + 1}
                </div>
                <div
                  className={cn(
                    "text-[13px] font-medium leading-tight",
                    isWinner ? "text-foreground" : "text-foreground/75",
                  )}
                >
                  {h.title}
                </div>
                <div className="ml-auto flex items-center gap-1">
                  <span
                    className={cn(
                      "text-[11px] font-mono tabular-nums font-semibold",
                      isWinner ? "text-primary" : "text-muted-foreground",
                    )}
                  >
                    {ready ? `${h.confidence}%` : "…"}
                  </span>
                </div>
              </div>

              {/* progress bar */}
              <div className="relative h-2 rounded-full bg-surface-2/70 overflow-hidden ml-7">
                <motion.div
                  className="absolute inset-y-0 left-0 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${widthPct}%` }}
                  transition={{
                    duration: 0.9 + i * 0.15,
                    ease: [0.16, 1, 0.3, 1],
                    delay: 0.1 + i * 0.08,
                  }}
                  style={{
                    background: isWinner
                      ? "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)))"
                      : "linear-gradient(90deg, hsl(var(--primary) / 0.4), hsl(var(--primary) / 0.6))",
                    boxShadow: isWinner
                      ? "0 0 16px hsl(var(--primary) / 0.5)"
                      : undefined,
                  }}
                />
                {/* shimmer for winner */}
                {isWinner && (
                  <motion.div
                    className="absolute inset-y-0 w-12"
                    style={{
                      background:
                        "linear-gradient(90deg, transparent, hsl(var(--primary-foreground) / 0.4), transparent)",
                    }}
                    animate={{ x: ["-50%", "300%"] }}
                    transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                  />
                )}
              </div>

              <p className="text-[11px] text-muted-foreground/80 leading-snug ml-7 mt-1.5">
                {h.rationale}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
