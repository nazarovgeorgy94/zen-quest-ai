import { motion, AnimatePresence } from "framer-motion";
import { Activity, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { DiagnosisStep } from "@/lib/mockIncidents";
import { useRef, useEffect, useState } from "react";

interface DiagnosisTimelineProps {
  steps: DiagnosisStep[];
  currentStep: number;
  isDiagnosing: boolean;
}

const STEP_HEIGHT = 44; // fixed height per step in px

const DiagnosisTimeline = ({ steps, currentStep, isDiagnosing }: DiagnosisTimelineProps) => {
  const progress = isDiagnosing
    ? Math.round(((currentStep + 1) / steps.length) * 100)
    : 100;

  // Calculate line height in pixels based on fixed step heights
  const totalSteps = steps.length;
  const activeIndex = isDiagnosing ? currentStep : totalSteps - 1;
  // Line goes from center of first node to center of active node
  const lineHeightPx = activeIndex * STEP_HEIGHT;
  const totalLineHeightPx = (totalSteps - 1) * STEP_HEIGHT;

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
          {/* Background vertical line - fixed height */}
          <div
            className="absolute left-[7px] w-px bg-border/30"
            style={{ top: 8, height: totalLineHeightPx }}
          />
          {/* Animated progress line - pixel based */}
          <motion.div
            className="absolute left-[7px] w-px"
            style={{
              top: 8,
              background: "linear-gradient(180deg, hsl(var(--primary)), hsl(var(--accent)))",
            }}
            initial={{ height: 0 }}
            animate={{ height: lineHeightPx }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />

          <div>
            {steps.map((step, i) => {
              const isActive = isDiagnosing && currentStep === i;
              const isDone = !isDiagnosing || (isDiagnosing && currentStep > i);

              return (
                <div
                  key={i}
                  className="relative flex items-start gap-3"
                  style={{ height: STEP_HEIGHT }}
                >
                  {/* Node */}
                  <div className="relative z-10 mt-[5px] shrink-0">
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
                  <div className="flex-1 min-w-0 mt-0.5">
                    <motion.span
                      animate={{ opacity: isDone || isActive ? 1 : 0.35 }}
                      transition={{ duration: 0.3 }}
                      className={cn(
                        "text-xs font-medium block leading-tight",
                        isDone
                          ? "text-foreground/80"
                          : isActive
                            ? "text-foreground"
                            : "text-muted-foreground/50"
                      )}
                    >
                      {step.label}
                    </motion.span>
                    <AnimatePresence mode="wait">
                      {isActive && (
                        <motion.p
                          key={`detail-${i}`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="text-[10px] text-muted-foreground mt-0.5 leading-snug truncate"
                        >
                          {step.detail}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default DiagnosisTimeline;
