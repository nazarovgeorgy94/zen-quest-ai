import { motion } from "framer-motion";
import { GitBranch, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { Incident, getSeverityColor } from "@/lib/mockIncidents";

interface CorrelationLink {
  fromId: string;
  toId: string;
  reason: string;
  confidence: number;
  sharedComponent: string;
}

const mockCorrelations: CorrelationLink[] = [
  {
    fromId: "INC-4521",
    toId: "INC-4518",
    reason: "Общий Kafka кластер — consumer lag влияет на оба сервиса",
    confidence: 78,
    sharedComponent: "kafka-cluster-01",
  },
  {
    fromId: "INC-4521",
    toId: "INC-4515",
    reason: "Payment Gateway таймауты генерируют ложные velocity alerts",
    confidence: 65,
    sharedComponent: "event-pipeline",
  },
  {
    fromId: "INC-4518",
    toId: "INC-4515",
    reason: "Stale AML features вызывают пересчёт velocity rules",
    confidence: 52,
    sharedComponent: "feature-store",
  },
];

interface IncidentCorrelationProps {
  currentIncidentId: string;
  incidents: Incident[];
}

const IncidentCorrelation = ({ currentIncidentId, incidents }: IncidentCorrelationProps) => {
  const relevant = mockCorrelations.filter(
    (c) => c.fromId === currentIncidentId || c.toId === currentIncidentId
  );

  if (relevant.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-xl border border-border/30 bg-surface-1/40 backdrop-blur-sm overflow-hidden"
    >
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-5 h-5 rounded-md bg-accent/10 flex items-center justify-center">
            <GitBranch className="w-3 h-3 text-accent" />
          </div>
          <span className="text-[11px] font-semibold text-accent uppercase tracking-wider font-display">
            Корреляции ({relevant.length})
          </span>
        </div>

        <div className="space-y-2.5">
          {relevant.map((corr, i) => {
            const otherId = corr.fromId === currentIncidentId ? corr.toId : corr.fromId;
            const otherInc = incidents.find((inc) => inc.id === otherId);
            if (!otherInc) return null;
            const colors = getSeverityColor(otherInc.severity);

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + i * 0.1 }}
                className="w-full text-left rounded-lg p-3"
                style={{
                  background: "hsl(var(--surface-2) / 0.4)",
                  border: "1px solid hsl(var(--border) / 0.2)",
                }}
              >
                <div className="flex items-center gap-2.5">
                  {/* Correlation visual */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] font-mono text-primary font-semibold">{currentIncidentId}</span>
                    <div className="relative flex items-center">
                      <div className="w-8 h-px bg-gradient-to-r from-primary/50 to-accent/50" />
                      <Zap className="w-3 h-3 text-accent absolute left-1/2 -translate-x-1/2 -translate-y-0" />
                    </div>
                    <span className={cn("text-[10px] font-mono font-semibold", colors.text)}>{otherId}</span>
                  </div>

                  {/* Confidence */}
                  <div className="ml-auto flex items-center gap-1.5 shrink-0">
                    <div className="w-12 h-1 rounded-full bg-surface-3 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-accent to-primary"
                        initial={{ width: "0%" }}
                        animate={{ width: `${corr.confidence}%` }}
                        transition={{ duration: 0.8, delay: 0.8 + i * 0.1 }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-accent tabular-nums">{corr.confidence}%</span>
                  </div>
                </div>

                {/* Reason */}
                <p className="text-[11px] text-foreground/60 mt-1.5 leading-relaxed">{corr.reason}</p>

                {/* Shared component */}
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="text-[9px] text-muted-foreground/50 uppercase tracking-wide">Связь:</span>
                  <code className="text-[10px] font-mono text-primary/70 bg-primary/5 px-1.5 py-0.5 rounded">{corr.sharedComponent}</code>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

export default IncidentCorrelation;
