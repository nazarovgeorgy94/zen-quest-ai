import { motion, AnimatePresence } from "framer-motion";
import { Activity, CheckCircle2, Loader2, ChevronDown, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { DiagnosisStep } from "@/lib/mockIncidents";
import { useState, useEffect } from "react";

interface DiagnosisTimelineProps {
  steps: DiagnosisStep[];
  currentStep: number;
  isDiagnosing: boolean;
}

const DiagnosisTimeline = ({ steps, currentStep, isDiagnosing }: DiagnosisTimelineProps) => {
  const totalSteps = steps.length;
  const activeIndex = isDiagnosing ? currentStep : totalSteps - 1;
  const progress = isDiagnosing
    ? Math.round(((currentStep + 1) / totalSteps) * 100)
    : 100;

  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  // Auto-expand the active step while diagnosing for the wow-effect
  useEffect(() => {
    if (isDiagnosing && currentStep >= 0) {
      setExpanded((prev) => ({ ...prev, [currentStep]: true }));
    }
  }, [currentStep, isDiagnosing]);

  const toggle = (i: number) =>
    setExpanded((prev) => ({ ...prev, [i]: !prev[i] }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border/30 bg-surface-1/40 backdrop-blur-sm overflow-hidden"
    >
      {/* Progress bar at top */}
      <div className="h-[2px] bg-surface-2/30 relative overflow-hidden">
        <motion.div
          className="h-full rounded-r-full"
          style={{
            background: isDiagnosing
              ? "linear-gradient(90deg, hsl(var(--primary) / 0.7), hsl(var(--accent) / 0.6))"
              : "linear-gradient(90deg, hsl(var(--primary) / 0.5), hsl(var(--accent) / 0.4))",
          }}
          initial={{ width: "0%" }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>

      <div className="p-4">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
            <Activity className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="text-[12px] font-semibold text-primary uppercase tracking-wider">
            Диагностика
          </span>
          {isDiagnosing && (
            <motion.span
              className="text-[11px] text-muted-foreground ml-auto font-mono tabular-nums"
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              {progress}%
            </motion.span>
          )}
          {!isDiagnosing && (
            <span className="text-[11px] text-primary/70 ml-auto font-mono">✓ завершено</span>
          )}
        </div>

        {/* Vertical timeline — fluid heights, progressive reveal */}
        <div className="relative ml-1">
          <div className="space-y-1.5">
            <AnimatePresence initial={false}>
            {steps.map((step, i) => {
              const isActive = isDiagnosing && currentStep === i;
              const isDone = !isDiagnosing || (isDiagnosing && currentStep > i);
              const isReached = isActive || isDone;
              // Progressive reveal: only render steps that have been reached
              if (isDiagnosing && i > currentStep) return null;
              const isOpen = !!expanded[i] && isReached;
              const isLast = i === steps.length - 1;

              return (
                <motion.div
                  key={i}
                  layout
                  initial={{ opacity: 0, y: -6, filter: "blur(6px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                  className="relative"
                >
                  {/* Connector line to next node */}
                  {!isLast && (
                    <div
                      className="absolute left-[9px] top-7 bottom-[-6px] w-px bg-border/30"
                      aria-hidden
                    />
                  )}
                  {!isLast && isDone && (
                    <motion.div
                      className="absolute left-[9px] top-7 bottom-[-6px] w-px"
                      style={{
                        background:
                          "linear-gradient(180deg, hsl(var(--primary)), hsl(var(--accent)))",
                      }}
                      initial={{ scaleY: 0, originY: 0 }}
                      animate={{ scaleY: 1 }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                      aria-hidden
                    />
                  )}

                  <button
                    type="button"
                    onClick={() => isReached && toggle(i)}
                    disabled={!isReached}
                    className={cn(
                      "w-full flex items-start gap-3 rounded-lg px-2 py-1.5 text-left transition-colors",
                      isReached
                        ? "hover:bg-surface-2/40 cursor-pointer"
                        : "cursor-default"
                    )}
                  >
                    {/* Node */}
                    <div className="relative z-10 mt-[3px] shrink-0">
                      {isDone ? (
                        <motion.div
                          initial={{ scale: 0.5 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 400, damping: 15 }}
                        >
                          <CheckCircle2 className="w-[18px] h-[18px] text-primary" />
                        </motion.div>
                      ) : isActive ? (
                        <div className="relative">
                          <Loader2 className="w-[18px] h-[18px] text-primary animate-spin" />
                          <motion.div
                            className="absolute inset-[-4px] rounded-full border border-primary/30"
                            animate={{ scale: [1, 1.6, 1], opacity: [0.5, 0, 0.5] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                          />
                        </div>
                      ) : (
                        <div className="w-[18px] h-[18px] rounded-full border-[1.5px] border-border/40 bg-surface-2/60" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "text-[14px] font-medium leading-tight",
                            isDone
                              ? "text-foreground/90"
                              : isActive
                                ? "text-foreground"
                                : "text-muted-foreground/50"
                          )}
                        >
                          {step.label}
                        </span>
                        {isReached && (
                          <ChevronDown
                            className={cn(
                              "w-3.5 h-3.5 text-muted-foreground/60 transition-transform duration-300",
                              isOpen && "rotate-180"
                            )}
                          />
                        )}
                      </div>
                      <p
                        className={cn(
                          "text-[12px] mt-0.5 leading-snug",
                          isReached
                            ? "text-muted-foreground"
                            : "text-muted-foreground/40"
                        )}
                      >
                        {step.detail}
                      </p>
                    </div>
                  </button>

                  {/* Expandable: full reasoning + summary */}
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        key="expand"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="ml-[30px] mt-2 mb-2 pr-2 space-y-2">
                          {step.reasoning && (
                            <div className="rounded-lg border border-border/30 bg-surface-0/60 px-3 py-2.5">
                              <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70 mb-1.5">
                                Рассуждение
                              </div>
                              <p className="text-[13px] leading-relaxed text-foreground/85 whitespace-pre-wrap">
                                {step.reasoning}
                              </p>
                            </div>
                          )}
                          {step.summary && (isDone || (isActive && !isDiagnosing)) && (
                            <motion.div
                              initial={{ opacity: 0, y: 4 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.1 }}
                              className="rounded-lg border border-primary/25 bg-primary/5 px-3 py-2 flex items-start gap-2"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-primary mt-[2px] shrink-0" />
                              <div className="min-w-0">
                                <div className="text-[10px] uppercase tracking-[0.14em] text-primary/80 mb-0.5">
                                  Итог этапа
                                </div>
                                <p className="text-[13px] leading-snug text-foreground/90">
                                  {step.summary}
                                </p>
                              </div>
                            </motion.div>
                          )}
                          {step.summary && isActive && isDiagnosing && (
                            <div className="text-[11px] text-muted-foreground/60 italic ml-1">
                              Итог появится по завершении этапа…
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default DiagnosisTimeline;
