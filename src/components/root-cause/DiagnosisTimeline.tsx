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

  const completedFraction = isDiagnosing
    ? (currentStep + 1) / steps.length
    : 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border/30 bg-surface-1/40 backdrop-blur-sm overflow-hidden"
    >
      {/* Top progress bar */}
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

      <div className="p-4 pb-5">
        {/* Header */}
        <div className="flex items-center gap-2 mb-5">
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

        {/* Horizontal timeline with gradient bar */}
        <div className="relative">
          {/* Nodes row */}
          <div className="relative flex justify-between items-center px-2">
            {steps.map((step, i) => {
              const isActive = isDiagnosing && currentStep === i;
              const isDone = !isDiagnosing || (isDiagnosing && currentStep > i);

              return (
                <div key={i} className="relative z-10">
                  {isDone ? (
                    <motion.div
                      initial={{ scale: 0.5 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 15 }}
                    >
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                    </motion.div>
                  ) : isActive ? (
                    <div className="relative">
                      <Loader2 className="w-4 h-4 text-primary animate-spin" />
                      <motion.div
                        className="absolute inset-[-3px] rounded-full border border-primary/30"
                        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                    </div>
                  ) : (
                    <div className="w-4 h-4 rounded-full border-[1.5px] border-border/40 bg-surface-2/60" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Gradient bar underneath */}
          <div className="relative mt-2 mx-2 h-9 rounded-lg overflow-hidden bg-surface-2/60">
            {/* Filled portion */}
            <motion.div
              className="absolute inset-y-0 left-0 rounded-lg"
              style={{
                background: "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)))",
              }}
              initial={{ width: "0%" }}
              animate={{ width: `${completedFraction * 100}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />

            {/* Labels inside bar */}
            <div className="relative z-10 flex h-full">
              {steps.map((step, i) => {
                const isActive = isDiagnosing && currentStep === i;
                const isDone = !isDiagnosing || (isDiagnosing && currentStep > i);

                return (
                  <div
                    key={i}
                    className="flex-1 flex items-center justify-center"
                  >
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: isDone || isActive ? 1 : 0.4 }}
                      className={cn(
                        "text-[11px] font-medium text-center px-1 leading-tight",
                        isDone || isActive
                          ? "text-background"
                          : "text-muted-foreground/60"
                      )}
                    >
                      {step.label}
                    </motion.span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Active step detail */}
        <AnimatePresence mode="wait">
          {isDiagnosing && currentStep >= 0 && currentStep < steps.length && (
            <motion.p
              key={currentStep}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.25 }}
              className="text-[10px] text-muted-foreground mt-3 text-center leading-relaxed"
            >
              {steps[currentStep].detail}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default DiagnosisTimeline;
