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

        {/* Horizontal timeline */}
        <div className="relative">
          {/* Horizontal base line */}
          <div className="absolute top-[7px] left-0 right-0 h-px bg-border/30" />
          {/* Animated progress line */}
          <motion.div
            className="absolute top-[7px] left-0 h-px"
            style={{
              background: "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)))",
            }}
            initial={{ width: "0%" }}
            animate={{
              width: `${Math.min(100, ((isDiagnosing ? currentStep : steps.length - 1) / Math.max(1, steps.length - 1)) * 100)}%`,
            }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />

          <div className="flex justify-between relative">
            {steps.map((step, i) => {
              const isActive = isDiagnosing && currentStep === i;
              const isDone = !isDiagnosing || (isDiagnosing && currentStep > i);

              return (
                <div key={i} className="flex flex-col items-center" style={{ width: `${100 / steps.length}%` }}>
                  {/* Node */}
                  <div className="relative z-10 shrink-0 mb-2">
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

                  {/* Label */}
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: isDone || isActive ? 1 : 0.35 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                    className={cn(
                      "text-[10px] font-medium text-center leading-tight px-1",
                      isDone
                        ? "text-foreground/80"
                        : isActive
                          ? "text-foreground"
                          : "text-muted-foreground/50"
                    )}
                  >
                    {step.label}
                  </motion.span>
                </div>
              );
            })}
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
