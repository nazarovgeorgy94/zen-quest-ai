import { motion } from "framer-motion";
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
        <div className="flex items-center gap-2 mb-3">
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

        {/* Steps as horizontal chips */}
        <div className="flex flex-wrap gap-2">
          {steps.map((step, i) => {
            const isActive = isDiagnosing && currentStep === i;
            const isDone = !isDiagnosing || (isDiagnosing && currentStep > i);

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: isDone || isActive ? 1 : 0.35, scale: 1 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors duration-300",
                  isDone && "bg-primary/8 border border-primary/15",
                  isActive && "bg-primary/12 border border-primary/25",
                  !isDone && !isActive && "bg-surface-2/40 border border-border/20"
                )}
              >
                {isDone ? (
                  <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
                ) : isActive ? (
                  <Loader2 className="w-3 h-3 text-primary animate-spin shrink-0" />
                ) : (
                  <div className="w-3 h-3 rounded-full border border-border/50 shrink-0" />
                )}
                <span
                  className={cn(
                    "font-medium whitespace-nowrap",
                    isDone ? "text-foreground/80" : isActive ? "text-foreground" : "text-muted-foreground/60"
                  )}
                >
                  {step.label}
                </span>
              </motion.div>
            );
          })}
        </div>

        {/* Current step detail */}
        {isDiagnosing && currentStep >= 0 && currentStep < steps.length && (
          <motion.p
            key={currentStep}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[11px] text-muted-foreground mt-2.5 pl-1"
          >
            {steps[currentStep].detail}
          </motion.p>
        )}
      </div>
    </motion.div>
  );
};

export default DiagnosisTimeline;
