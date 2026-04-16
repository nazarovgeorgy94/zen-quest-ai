import { motion, AnimatePresence } from "framer-motion";
import { Activity, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { DiagnosisStep } from "@/lib/mockIncidents";

interface DiagnosisTimelineProps {
  steps: DiagnosisStep[];
  currentStep: number;
  isDiagnosing: boolean;
}

const DiagnosisTimeline = ({ steps, currentStep, isDiagnosing }: DiagnosisTimelineProps) => {
  const progress = isDiagnosing
    ? Math.round(((currentStep + 1) / steps.length) * 100)
    : 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border/30 bg-surface-1/40 backdrop-blur-sm overflow-hidden"
    >
      {/* Progress bar at top */}
      <div className="h-1 bg-surface-2">
        <motion.div
          className="h-full rounded-r-full"
          style={{
            background: "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)))",
          }}
          initial={{ width: "0%" }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>

      <div className="p-4">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-5 h-5 rounded-md bg-primary/10 flex items-center justify-center">
            <Activity className="w-3 h-3 text-primary" />
          </div>
          <span className="text-[11px] font-semibold text-primary uppercase tracking-wider">
            Диагностика
          </span>
          {isDiagnosing && (
            <motion.span
              className="text-[10px] text-muted-foreground ml-auto font-mono tabular-nums"
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              {progress}%
            </motion.span>
          )}
          {!isDiagnosing && (
            <span className="text-[10px] text-primary/70 ml-auto font-mono">✓ завершено</span>
          )}
        </div>

        {/* Vertical timeline */}
        <div className="relative ml-1">
          {/* Vertical line */}
          <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border/30" />
          {/* Animated progress line */}
          <motion.div
            className="absolute left-[7px] top-2 w-px"
            style={{
              background: "linear-gradient(180deg, hsl(var(--primary)), hsl(var(--accent)))",
            }}
            initial={{ height: 0 }}
            animate={{
              height: `${Math.min(100, ((isDiagnosing ? currentStep : steps.length - 1) / Math.max(1, steps.length - 1)) * 100)}%`,
            }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />

          <div className="space-y-0">
            {steps.map((step, i) => {
              const isActive = isDiagnosing && currentStep === i;
              const isDone = !isDiagnosing || (isDiagnosing && currentStep > i);

              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: isDone || isActive ? 1 : 0.35, x: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.06 }}
                  className="relative flex items-start gap-3 py-2"
                >
                  {/* Node */}
                  <div className="relative z-10 mt-0.5 shrink-0">
                    {isDone ? (
                      <motion.div
                        initial={{ scale: 0.5 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 400, damping: 15 }}
                      >
                        <CheckCircle2 className="w-[15px] h-[15px] text-primary" />
                      </motion.div>
                    ) : isActive ? (
                      <div className="relative">
                        <Loader2 className="w-[15px] h-[15px] text-primary animate-spin" />
                        <motion.div
                          className="absolute inset-[-4px] rounded-full border border-primary/30"
                          animate={{ scale: [1, 1.6, 1], opacity: [0.5, 0, 0.5] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        />
                      </div>
                    ) : (
                      <div className="w-[15px] h-[15px] rounded-full border-[1.5px] border-border/40 bg-surface-2/60" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 -mt-0.5">
                    <span
                      className={cn(
                        "text-xs font-medium block",
                        isDone
                          ? "text-foreground/80"
                          : isActive
                            ? "text-foreground"
                            : "text-muted-foreground/50"
                      )}
                    >
                      {step.label}
                    </span>
                    <AnimatePresence mode="wait">
                      {isActive && (
                        <motion.p
                          key={`detail-${i}`}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.25 }}
                          className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed"
                        >
                          {step.detail}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default DiagnosisTimeline;
