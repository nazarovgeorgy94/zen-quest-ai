import { motion } from "framer-motion";
import { Clock, Search, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Incident, getSeverityColor } from "@/lib/mockIncidents";

interface IncidentTimelineProps {
  incident: Incident;
}

function formatTime(date: Date) {
  return date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(date: Date) {
  return date.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

const IncidentTimeline = ({ incident }: IncidentTimelineProps) => {
  const colors = getSeverityColor(incident.severity);

  const events = [
    { label: "Создан", time: incident.createdAt, icon: Clock, active: true },
    { label: "Расследование", time: incident.status !== "active" ? new Date(incident.createdAt.getTime() + 5 * 60000) : null, icon: Search, active: incident.status !== "active" },
    { label: "Решён", time: incident.resolvedAt || null, icon: CheckCircle2, active: !!incident.resolvedAt },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="flex items-center gap-0 px-4 py-2 mb-2"
    >
      {events.map((evt, i) => {
        const Icon = evt.icon;
        return (
          <div key={i} className="flex items-center">
            {/* Node */}
            <div className="flex flex-col items-center">
              <div className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center border transition-all",
                evt.active
                  ? i === events.length - 1 && incident.resolvedAt
                    ? "bg-success/15 border-success/30"
                    : "bg-primary/10 border-primary/25"
                  : "bg-surface-2/60 border-border/30"
              )}>
                <Icon className={cn(
                  "w-3.5 h-3.5",
                  evt.active
                    ? i === events.length - 1 && incident.resolvedAt ? "text-success" : "text-primary"
                    : "text-muted-foreground/40"
                )} />
              </div>
              <span className={cn("text-[9px] mt-1 font-medium", evt.active ? "text-foreground/70" : "text-muted-foreground/40")}>
                {evt.label}
              </span>
              {evt.time && (
                <span className="text-[8px] text-muted-foreground/50 font-mono">
                  {formatDate(evt.time)} {formatTime(evt.time)}
                </span>
              )}
            </div>

            {/* Connector line */}
            {i < events.length - 1 && (
              <div className={cn(
                "h-px w-12 mx-1 mt-[-18px]",
                events[i + 1].active ? "bg-primary/30" : "bg-border/30"
              )} />
            )}
          </div>
        );
      })}
    </motion.div>
  );
};

export default IncidentTimeline;
