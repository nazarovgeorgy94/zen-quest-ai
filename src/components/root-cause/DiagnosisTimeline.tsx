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
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
          <Activity className="w-3.5 h-3.5 text-primary" />
        </div>
        <span className="text-xs font-semibold text-primary">Диагностика</span>
        {isDiagnosing && (
          <motion.span
            className="text-[10px] text-muted-foreground ml-auto font-mono"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            в процессе...
          </motion.span>
        )}
      </div>

      <div className="relative pl-[19px]">
        <div className="absolute left-[7px] top-0 bottom-0 w-px bg-border/50" />
        {isDiagnosing && (
          <motion.div
            className="absolute left-[7px] top-0 w-px bg-primary/60"
            initial={{ height: 0 }}
            animate={{ height: `${((currentStep + 1) / steps.length) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        )}
        {!isDiagnosing && (
          <div className="absolute left-[7px] top-0 bottom-0 w-px bg-primary/40" />
        )}

        <div className="space-y-4">
          {steps.map((step, i) => {
            const isActive = isDiagnosing && currentStep === i;
            const isDone = !isDiagnosing || (isDiagnosing && currentStep > i);
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: isDone || isActive ? 1 : 0.35, x: 0 }}
                transition={{ duration: 0.4, delay: isDone ? 0 : 0.1 }}
                className="flex items-start gap-3 relative"
              >
                <div className="absolute left-[-19px] top-[3px]">
                  {isDone ? (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}>
                      <CheckCircle2 className="w-[15px] h-[15px] text-primary" />
                    </motion.div>
                  ) : isActive ? (
                    <div className="relative">
                      <Loader2 className="w-[15px] h-[15px] text-primary animate-spin" />
                      <div className="absolute inset-[-4px] rounded-full bg-primary/20 animate-ping" />
                    </div>
                  ) : (
                    <div className="w-[15px] h-[15px] rounded-full border-2 border-border/50 bg-surface-0" />
                  )}
                </div>
                <div>
                  <p className={cn("text-sm font-medium", isDone || isActive ? "text-foreground" : "text-muted-foreground")}>
                    {step.label}
                  </p>
                  <AnimatePresence>
                    {(isActive || isDone) && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="text-[11px] text-muted-foreground mt-0.5"
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
    </motion.div>
  );
};

export default DiagnosisTimeline;
