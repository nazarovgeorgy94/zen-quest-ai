import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Radar,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  mockServices,
  mockIncidents,
  SystemService,
  getSeverityColor,
} from "@/lib/mockIncidents";

interface RCDiscoveryProps {
  onSelectIncident: (id: string) => void;
  onCancel: () => void;
}

type ScanPhase = "scanning" | "complete";

const RCDiscovery = ({ onSelectIncident, onCancel }: RCDiscoveryProps) => {
  const [phase, setPhase] = useState<ScanPhase>("scanning");
  const [scannedIndex, setScannedIndex] = useState(-1);
  const [discoveredIncidents, setDiscoveredIncidents] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;

    const runScan = async () => {
      // Scan services one by one
      for (let i = 0; i < mockServices.length; i++) {
        if (cancelled) return;
        setScannedIndex(i);
        await new Promise((r) => setTimeout(r, 400 + Math.random() * 300));

        // If service has incidents, "discover" them
        const svc = mockServices[i];
        if (svc.incidentIds?.length) {
          setDiscoveredIncidents((prev) => [
            ...prev,
            ...svc.incidentIds!.filter((id) => !prev.includes(id)),
          ]);
        }
      }

      if (!cancelled) {
        await new Promise((r) => setTimeout(r, 600));
        setPhase("complete");
      }
    };

    runScan();
    return () => {
      cancelled = true;
    };
  }, []);

  const activeIncidents = mockIncidents.filter(
    (i) => i.status !== "resolved" && discoveredIncidents.includes(i.id)
  );

  const getServiceIcon = (svc: SystemService, isScanned: boolean) => {
    if (!isScanned) return <div className="w-4 h-4 rounded-full border border-border" />;
    if (svc.status === "healthy")
      return <CheckCircle2 className="w-4 h-4 text-primary" />;
    if (svc.status === "degraded")
      return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
    return <XCircle className="w-4 h-4 text-red-400" />;
  };

  return (
    <div className="flex-1 flex flex-col h-screen">
      {/* Header */}
      <div className="shrink-0 border-b border-border bg-surface-0/80 backdrop-blur-sm">
        <div className={cn("h-[2px] w-full shimmer-line", phase === "scanning" && "shimmer-active")} />
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              animate={phase === "scanning" ? { rotate: 360 } : {}}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Radar className="w-5 h-5 text-primary" />
            </motion.div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                {phase === "scanning"
                  ? "Сканирование системы..."
                  : "Сканирование завершено"}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {phase === "scanning"
                  ? `Проверено ${Math.min(scannedIndex + 1, mockServices.length)} из ${mockServices.length} сервисов`
                  : `Обнаружено ${activeIncidents.length} инцидентов`}
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-2 rounded-lg hover:bg-surface-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Scan content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {/* Services grid */}
        <div className="grid grid-cols-2 gap-2 mb-6">
          {mockServices.map((svc, i) => {
            const isScanned = i <= scannedIndex;
            const isActive = i === scannedIndex && phase === "scanning";
            return (
              <motion.div
                key={svc.name}
                initial={{ opacity: 0.3 }}
                animate={{
                  opacity: isScanned ? 1 : 0.3,
                  scale: isActive ? 1.02 : 1,
                }}
                transition={{ duration: 0.3 }}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2.5 rounded-lg border transition-all",
                  isActive
                    ? "bg-primary/8 border-primary/20"
                    : isScanned
                    ? svc.status !== "healthy"
                      ? "bg-surface-1 border-yellow-500/20"
                      : "bg-surface-1 border-border/30"
                    : "bg-surface-0 border-border/10"
                )}
              >
                {getServiceIcon(svc, isScanned)}
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      "text-xs truncate",
                      isScanned ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {svc.displayName}
                  </p>
                  {isScanned && (
                    <p className="text-[10px] text-muted-foreground font-mono">
                      {svc.latency}
                    </p>
                  )}
                </div>
                {isActive && (
                  <motion.div
                    className="w-1.5 h-1.5 rounded-full bg-primary"
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 0.6, repeat: Infinity }}
                  />
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Discovered incidents */}
        <AnimatePresence>
          {discoveredIncidents.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider px-1">
                Обнаруженные инциденты ({activeIncidents.length})
              </p>
              {activeIncidents.map((inc, i) => {
                const colors = getSeverityColor(inc.severity);
                return (
                  <motion.button
                    key={inc.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    onClick={() => onSelectIncident(inc.id)}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="w-full text-left p-4 rounded-xl bg-surface-1 border border-border/30 hover:border-primary/20 transition-all group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 relative">
                        <div className={cn("w-3 h-3 rounded-full", colors.dot)} />
                        <div
                          className={cn(
                            "absolute inset-0 w-3 h-3 rounded-full animate-ping opacity-50",
                            colors.dot
                          )}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-muted-foreground">
                            {inc.id}
                          </span>
                          <span
                            className={cn(
                              "text-[9px] font-medium uppercase px-1.5 py-0.5 rounded-full",
                              colors.bg,
                              colors.text
                            )}
                          >
                            {inc.severity}
                          </span>
                          <span className="text-[10px] text-muted-foreground ml-auto">
                            {inc.service}
                          </span>
                        </div>
                        <p className="text-sm text-foreground mt-1">
                          {inc.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {inc.description}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0 mt-1" />
                    </div>
                  </motion.button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default RCDiscovery;
