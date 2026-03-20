import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, ChevronDown, Check, Loader2 } from "lucide-react";

interface ThinkingStep {
  text: string;
  status: "pending" | "active" | "done";
}

interface ThinkingChainProps {
  steps: string[];
  /** How many steps have been revealed so far (controlled by parent) */
  revealedCount: number;
  /** Whether the whole thinking phase is complete */
  isComplete: boolean;
  /** Whether to show in collapsed mode (after answer is done) */
  collapsible?: boolean;
}

const ThinkingChain = ({ steps, revealedCount, isComplete, collapsible = false }: ThinkingChainProps) => {
  const [isExpanded, setIsExpanded] = useState(true);

  // Auto-collapse after thinking is complete and answer starts streaming
  useEffect(() => {
    if (isComplete && collapsible) {
      const timer = setTimeout(() => setIsExpanded(false), 800);
      return () => clearTimeout(timer);
    }
  }, [isComplete, collapsible]);

  const stepsWithStatus: ThinkingStep[] = steps.map((text, i) => ({
    text,
    status: i < revealedCount - 1 ? "done" : i === revealedCount - 1 ? (isComplete ? "done" : "active") : "pending",
  }));

  const visibleSteps = stepsWithStatus.filter((_, i) => i < revealedCount);

  if (steps.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="ml-9 mb-2"
    >
      {/* Header */}
      <button
        onClick={() => collapsible && setIsExpanded((v) => !v)}
        className={`flex items-center gap-2 text-[11px] font-medium transition-colors duration-200 ${
          collapsible ? "cursor-pointer hover:text-foreground" : "cursor-default"
        } ${isComplete ? "text-muted-foreground/60" : "text-primary/80"}`}
      >
        <div className="relative w-4 h-4">
          {isComplete ? (
            <Check className="w-4 h-4 text-primary/50" />
          ) : (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Brain className="w-4 h-4 text-primary" />
            </motion.div>
          )}
        </div>
        <span>{isComplete ? `Рассуждение (${steps.length} шагов)` : "Рассуждаю..."}</span>
        {collapsible && (
          <ChevronDown
            className={`w-3 h-3 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
          />
        )}
      </button>

      {/* Steps */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={false}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-2 ml-1 border-l border-primary/15 pl-3 space-y-1.5">
              <AnimatePresence>
                {visibleSteps.map((step, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8, filter: "blur(4px)" }}
                    animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="flex items-start gap-2"
                  >
                    {/* Step indicator */}
                    <div className="mt-0.5 shrink-0">
                      {step.status === "done" ? (
                        <div className="w-3.5 h-3.5 rounded-full bg-primary/15 flex items-center justify-center">
                          <Check className="w-2 h-2 text-primary/70" />
                        </div>
                      ) : step.status === "active" ? (
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                          className="w-3.5 h-3.5 rounded-full bg-primary/20 flex items-center justify-center"
                        >
                          <Loader2 className="w-2 h-2 text-primary animate-spin" />
                        </motion.div>
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full bg-muted/30" />
                      )}
                    </div>

                    {/* Step text */}
                    <span
                      className={`text-[11px] leading-snug transition-colors duration-300 ${
                        step.status === "active"
                          ? "text-foreground/80"
                          : step.status === "done"
                          ? "text-muted-foreground/60"
                          : "text-muted-foreground/30"
                      }`}
                    >
                      {step.text}
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ThinkingChain;
