import { motion } from "framer-motion";
import { AlertCircle, Clock, Search, Cpu, Lightbulb, CheckCircle2, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { Incident, getSeverityColor } from "@/lib/mockIncidents";

interface IncidentTimelineProps {
  incident: Incident;
}

interface TimelineEvent {
  label: string;
  time: Date | null;
  icon: React.ElementType;
  active: boolean;
  severity?: "critical" | "high" | "medium" | "low";
}

function formatTime(date: Date) {
  return date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

const IncidentTimeline = ({ incident }: IncidentTimelineProps) => {
  const createdAt = incident.createdAt;
  const isInvestigating = incident.status === "investigating" || incident.status === "resolved";
  const isResolved = incident.status === "resolved";

  const events: TimelineEvent[] = [
    {
      label: "Обнаружен",
      time: createdAt,
      icon: AlertCircle,
      active: true,
      severity: incident.severity,
    },
    {
      label: "Эскалация",
      time: incident.severity === "critical" || incident.severity === "high"
        ? new Date(createdAt.getTime() + 2 * 60000)
        : null,
      icon: ShieldAlert,
      active: incident.severity === "critical" || incident.severity === "high",
    },
    {
      label: "Расследование",
      time: isInvestigating ? new Date(createdAt.getTime() + 5 * 60000) : null,
      icon: Search,
      active: isInvestigating,
    },
    {
      label: "Диагностика",
      time: isInvestigating ? new Date(createdAt.getTime() + 12 * 60000) : null,
      icon: Cpu,
      active: isInvestigating,
    },
    {
      label: "Причина найдена",
      time: isInvestigating ? new Date(createdAt.getTime() + 18 * 60000) : null,
      icon: Lightbulb,
      active: isInvestigating,
    },
    {
      label: "Решён",
      time: incident.resolvedAt || null,
      icon: CheckCircle2,
      active: isResolved,
    },
  ];

  // Filter out events that shouldn't show
  const visibleEvents = events.filter((e) => e.active || e === events[events.length - 1]);
  const lastActiveIdx = visibleEvents.reduce((acc, e, i) => e.active ? i : acc, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
      className="relative px-4 py-3 rounded-xl bg-surface-1/30 border border-border/15 overflow-x-auto"
    >
      <div className="flex items-start gap-0 min-w-max">
        {visibleEvents.map((evt, i) => {
          const Icon = evt.icon;
          const isLast = i === visibleEvents.length - 1;
          const isActive = evt.active;
          const isCurrent = i === lastActiveIdx && !isResolved;
          const severityColors = evt.severity ? getSeverityColor(evt.severity) : null;

          return (
            <div key={i} className="flex items-start">
              {/* Node + Label */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + i * 0.08 }}
                className="flex flex-col items-center min-w-[72px]"
              >
                {/* Node */}
                <div className="relative">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center border transition-all",
                    isCurrent
                      ? "bg-primary/15 border-primary/40 shadow-[0_0_12px_-2px_hsl(var(--primary)/0.3)]"
                      : isActive
                        ? isLast && isResolved
                          ? "bg-success/15 border-success/30"
                          : "bg-primary/8 border-primary/20"
                        : "bg-surface-2/60 border-border/30"
                  )}>
                    <Icon className={cn(
                      "w-3.5 h-3.5",
                      isCurrent
                        ? "text-primary"
                        : isActive
                          ? isLast && isResolved ? "text-success" : "text-primary/70"
                          : "text-muted-foreground/30"
                    )} />
                  </div>
                  {/* Pulse on current */}
                  {isCurrent && (
                    <motion.div
                      className="absolute inset-[-3px] rounded-full border border-primary/30"
                      animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}
                </div>

                {/* Label */}
                <span className={cn(
                  "text-[9px] mt-1.5 font-medium text-center leading-tight font-display",
                  isCurrent ? "text-primary" : isActive ? "text-foreground/70" : "text-muted-foreground/30"
                )}>
                  {evt.label}
                </span>

                {/* Time */}
                {evt.time && (
                  <span className="text-[8px] text-muted-foreground/50 font-mono mt-0.5">
                    {formatTime(evt.time)}
                  </span>
                )}
              </motion.div>

              {/* Connector */}
              {!isLast && (
                <div className="flex items-center mt-4 mx-0.5">
                  <motion.div
                    className={cn("h-px w-8")}
                    style={{
                      background: visibleEvents[i + 1]?.active
                        ? "linear-gradient(90deg, hsl(var(--primary) / 0.4), hsl(var(--primary) / 0.2))"
                        : "hsl(var(--border) / 0.2)",
                    }}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.3 + i * 0.08, duration: 0.3 }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default IncidentTimeline;
