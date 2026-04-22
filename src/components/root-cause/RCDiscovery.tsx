import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  X,
  Shield,
  Terminal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  mockServices,
  mockIncidents,
  scanLogs,
  SystemService,
  getSeverityColor,
} from "@/lib/mockIncidents";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface RCDiscoveryProps {
  onSelectIncident: (id: string) => void;
  onCancel: () => void;
  onScanComplete?: () => void;
}

type ScanPhase = "scanning" | "complete";

/* ── Advanced Radar ── */
function ScanRadar({
  services,
  scannedIndex,
  phase,
  activeIncidentIds,
  serviceSeverityByName,
}: {
  services: SystemService[];
  scannedIndex: number;
  phase: ScanPhase;
  activeIncidentIds: Set<string>;
  serviceSeverityByName: Record<string, "critical" | "high" | "medium" | "low" | undefined>;
}) {
  const isScanning = phase === "scanning";
  const isStaticResult = phase === "complete";
  const size = 220;
  const cx = size / 2;
  const cy = size / 2;
  const rings = [30, 55, 80];
  const zoneLabels = ["critical", "suspicious", "noise"];

  return (
    <TooltipProvider delayDuration={100}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="absolute inset-0">
          <defs>
            <radialGradient id="radar-zone-critical" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="hsl(var(--destructive) / 0.16)" />
              <stop offset="100%" stopColor="hsl(var(--destructive) / 0)" />
            </radialGradient>
            <radialGradient id="radar-zone-suspicious" cx="50%" cy="50%" r="60%">
              <stop offset="0%" stopColor="hsl(var(--accent) / 0.12)" />
              <stop offset="100%" stopColor="hsl(var(--accent) / 0)" />
            </radialGradient>
            <radialGradient id="radar-zone-noise" cx="50%" cy="50%" r="70%">
              <stop offset="0%" stopColor="hsl(var(--primary) / 0.08)" />
              <stop offset="100%" stopColor="hsl(var(--primary) / 0)" />
            </radialGradient>
          </defs>

          {rings.map((r, i) => (
            <circle
              key={`zone-${r}`}
              cx={cx}
              cy={cy}
              r={r}
              fill={i === 0 ? "url(#radar-zone-critical)" : i === 1 ? "url(#radar-zone-suspicious)" : "url(#radar-zone-noise)"}
            />
          ))}

        {/* Grid lines — crosshair */}
        <line x1={cx} y1={0} x2={cx} y2={size} stroke="hsl(var(--primary))" strokeOpacity={0.06} strokeWidth={1} />
        <line x1={0} y1={cy} x2={size} y2={cy} stroke="hsl(var(--primary))" strokeOpacity={0.06} strokeWidth={1} />

        {/* Concentric rings */}
        {rings.map((r, i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none"
            stroke="hsl(var(--primary))" strokeOpacity={0.08} strokeWidth={1}
            strokeDasharray={i === 2 ? "4 4" : "none"}
          />
        ))}

        {/* Ring labels */}
        {rings.map((r, i) => (
          <text
            key={`label-${r}`}
            x={cx + r + 3}
            y={cy - 3}
            fill="hsl(var(--primary))"
            fillOpacity={0.24}
            fontSize={7}
            fontFamily="monospace"
          >
            {zoneLabels[i].toUpperCase()}
          </text>
        ))}
        </svg>

      {/* Sweep beam — conic gradient */}
      {isScanning && (
        <>
          <motion.div
            className="absolute rounded-full"
            style={{
              inset: cx - rings[2],
              width: rings[2] * 2,
              height: rings[2] * 2,
              top: cy - rings[2],
              left: cx - rings[2],
              background: `conic-gradient(from 0deg, transparent 0deg, hsl(var(--primary) / 0.18) 18deg, hsl(var(--accent) / 0.08) 36deg, transparent 72deg)`,
              filter: "blur(1px)",
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute rounded-full"
            style={{
              inset: cx - rings[2],
              width: rings[2] * 2,
              height: rings[2] * 2,
              top: cy - rings[2],
              left: cx - rings[2],
              background: `conic-gradient(from 0deg, transparent 0deg, hsl(var(--primary) / 0.06) 12deg, transparent 52deg)`,
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 3.6, repeat: Infinity, ease: "linear" }}
          />
        </>
      )}

      {/* Sweep line */}
      {isScanning && (
        <>
          <motion.div
            className="absolute origin-bottom"
            style={{
              width: 2,
              height: rings[2],
              left: cx - 1,
              top: cy - rings[2],
              background: "linear-gradient(to top, hsl(var(--primary) / 0.75), hsl(var(--accent) / 0.08))",
              boxShadow: "0 0 10px hsl(var(--primary) / 0.35)",
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute origin-bottom"
            style={{
              width: 10,
              height: rings[2],
              left: cx - 5,
              top: cy - rings[2],
              background: "linear-gradient(to top, hsl(var(--primary) / 0.14), transparent)",
              filter: "blur(4px)",
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />
        </>
      )}

      {/* Center core */}
      <div className="absolute" style={{ left: cx - 8, top: cy - 8, width: 16, height: 16 }}>
        <div className="w-4 h-4 rounded-full flex items-center justify-center"
          style={{ background: "hsl(var(--primary) / 0.3)", boxShadow: "0 0 20px hsl(var(--primary) / 0.3)" }}>
          <div className="w-2 h-2 rounded-full" style={{ background: "hsl(var(--primary))" }} />
        </div>
        {isScanning && (
          <motion.div className="absolute inset-[-4px] rounded-full border border-primary/30"
            animate={{ scale: [1, 2, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }} />
        )}
      </div>

      {/* Service nodes */}
      {services.map((svc, i) => {
        const isScanned = i <= scannedIndex;
        const isCurrentSweep = i === scannedIndex && isScanning;
        const angle = (i / services.length) * 360 - 90;
        const ringIdx = i % 3;
        const radius = rings[ringIdx] + (i % 2 === 0 ? -5 : 5);
        const x = cx + Math.cos((angle * Math.PI) / 180) * radius;
        const y = cy + Math.sin((angle * Math.PI) / 180) * radius;
        const hasActiveIncident = Boolean(svc.incidentIds?.some((id) => activeIncidentIds.has(id)));
        const hasAnyIncident = Boolean(svc.incidentIds?.length);
        const severity = serviceSeverityByName[svc.name];
        const severityColor = severity ? getSeverityColor(severity).stripe : undefined;
        const isAlerted = isScanned && hasActiveIncident;
        const nodeSize = isAlerted || (svc.status !== "healthy" && isScanned) ? 10 : 7;
        const nodeColor = !isScanned
          ? "hsl(var(--muted-foreground) / 0.2)"
          : severityColor
            ? severityColor
            : svc.status === "healthy"
              ? "hsl(var(--primary))"
              : svc.status === "degraded"
                ? "hsl(45 93% 47%)"
                : "hsl(var(--destructive))";
        const tooltipTone = severityColor ?? "hsl(var(--primary))";

        return (
          <motion.div
            key={svc.name}
            className="absolute"
            style={{ left: x - nodeSize / 2, top: y - nodeSize / 2 }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: isScanned ? 1 : 0.2,
              scale: isScanned ? 1 : 0.5,
            }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            {/* Connection line to center */}
            {isScanned && (
              <svg
                className="absolute pointer-events-none"
                style={{
                  left: nodeSize / 2,
                  top: nodeSize / 2,
                  width: 1,
                  height: 1,
                  overflow: "visible",
                }}
              >
                <motion.line
                  x1={0} y1={0}
                  x2={cx - x} y2={cy - y}
                  stroke={nodeColor}
                  strokeOpacity={0.12}
                  strokeWidth={0.75}
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.6 }}
                />
              </svg>
            )}

            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" className="relative block rounded-full focus:outline-none" aria-label={svc.displayName}>
                  <div
                    className="rounded-full transition-all duration-500 relative"
                    style={{
                      width: nodeSize,
                      height: nodeSize,
                      background: nodeColor,
                      boxShadow: isAlerted
                        ? `0 0 16px ${nodeColor}`
                        : isScanned && svc.status !== "healthy"
                          ? `0 0 12px ${nodeColor}`
                          : isScanned
                            ? "0 0 8px hsl(var(--primary) / 0.3)"
                            : "none",
                    }}
                  />

                  {isScanned && isScanning && (
                    <motion.div
                      className="absolute rounded-full"
                      style={{
                        inset: -3,
                        border: `1px solid ${nodeColor}`,
                        opacity: hasAnyIncident ? 0.42 : 0.18,
                      }}
                      animate={{ scale: [1, 1.55, 1.8], opacity: hasAnyIncident ? [0.42, 0.14, 0] : [0.18, 0.08, 0] }}
                      transition={{ duration: hasAnyIncident ? 2.2 : 3.4, repeat: Infinity, delay: i * 0.12 }}
                    />
                  )}

                  {isScanned && hasAnyIncident && isScanning && (
                    <motion.div
                      className="absolute rounded-full"
                      style={{
                        inset: -7,
                        border: `1px solid ${nodeColor}`,
                      }}
                      animate={{ scale: [1, 1.9], opacity: [0.22, 0] }}
                      transition={{ duration: 2.8, repeat: Infinity, delay: 0.45 + i * 0.1 }}
                    />
                  )}

                  {isCurrentSweep && hasAnyIncident && (
                    <motion.div
                      className="absolute"
                      style={{ inset: -11 }}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: [0, 1, 0.72, 1], scale: [0.8, 1.08, 1] }}
                      transition={{ duration: 0.55, ease: "easeOut" }}
                    >
                      {[
                        "left-0 top-0 border-l border-t",
                        "right-0 top-0 border-r border-t",
                        "left-0 bottom-0 border-l border-b",
                        "right-0 bottom-0 border-r border-b",
                      ].map((corner) => (
                        <div
                          key={corner}
                          className={cn("absolute h-2.5 w-2.5", corner)}
                          style={{ borderColor: tooltipTone }}
                        />
                      ))}
                    </motion.div>
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent
                className="min-w-[170px] border-border/60 bg-surface-0/95 text-foreground backdrop-blur-sm"
                side="top"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ background: tooltipTone }} />
                    <span className="text-xs font-medium">{svc.displayName}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 text-[10px] font-mono text-muted-foreground">
                    <span>{severity ? severity.toUpperCase() : svc.status.toUpperCase()}</span>
                    <span>{svc.latency}</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {hasAnyIncident
                      ? `${svc.incidentIds?.length} сигнал(ов) — объект требует проверки`
                      : "Стабильный узел, отмечен как шумовой фон"}
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>

            {/* Alert pulse for incidents */}
            {isScanned && hasAnyIncident && isScanning && (
              <motion.div
                className="absolute rounded-full"
                style={{
                  inset: -4,
                  border: `1.5px solid color-mix(in srgb, ${nodeColor} 65%, transparent)`,
                }}
                animate={{ scale: [1, 1.8, 1], opacity: [0.6, 0, 0.6] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.15 }}
              />
            )}

            {/* Label on hover/scan */}
            {isScanned && (
              <motion.div
                className="absolute whitespace-nowrap text-[8px] font-mono pointer-events-none"
                style={{
                  top: nodeSize + 4,
                  left: "50%",
                  transform: "translateX(-50%)",
                  color: hasAnyIncident ? nodeColor : "hsl(var(--muted-foreground) / 0.5)",
                }}
                initial={{ opacity: 0, y: -3 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                {svc.displayName.length > 10 ? svc.displayName.slice(0, 8) + "…" : svc.displayName}
              </motion.div>
            )}

            {isStaticResult && isScanned && hasAnyIncident && (
              <div
                className="absolute rounded-full"
                style={{
                  inset: -4,
                  border: `1px solid ${nodeColor}`,
                  opacity: 0.24,
                }}
              />
            )}
          </motion.div>
        );
      })}

      {/* Scan complete overlay */}
      {phase === "complete" && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="px-3 py-1.5 rounded-lg text-[10px] font-mono font-semibold text-primary uppercase tracking-wider"
            style={{
              background: "hsl(var(--surface-0) / 0.9)",
              border: "1px solid hsl(var(--primary) / 0.3)",
              boxShadow: "0 0 20px hsl(var(--primary) / 0.1)",
            }}>
            Scan Complete
          </div>
        </motion.div>
      )}
      </div>
    </TooltipProvider>
  );
}

const RCDiscovery = ({ onSelectIncident, onCancel, onScanComplete }: RCDiscoveryProps) => {
  const [phase, setPhase] = useState<ScanPhase>("scanning");
  const [scannedIndex, setScannedIndex] = useState(-1);
  const [discoveredIncidents, setDiscoveredIncidents] = useState<string[]>([]);
  const [terminalLines, setTerminalLines] = useState<
    { text: string; type: "info" | "warn" | "ok" | "header" }[]
  >([]);
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    terminalRef.current?.scrollTo({
      top: terminalRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [terminalLines]);

  useEffect(() => {
    let cancelled = false;

    const addLine = (text: string, type: "info" | "warn" | "ok" | "header") => {
      if (!cancelled) setTerminalLines((prev) => [...prev, { text, type }]);
    };

    const runScan = async () => {
      addLine("$ rca-agent scan --all-services --deep", "header");
      await new Promise((r) => setTimeout(r, 600));
      addLine(`Initiating deep scan of ${mockServices.length} services...`, "info");
      await new Promise((r) => setTimeout(r, 400));

      for (let i = 0; i < mockServices.length; i++) {
        if (cancelled) return;
        setScannedIndex(i);
        const svc = mockServices[i];
        const logs = scanLogs[svc.name] || [`Connecting to ${svc.name}...`, "✓ Health check passed."];

        addLine("", "info");
        addLine(`[${i + 1}/${mockServices.length}] Scanning ${svc.displayName}`, "header");

        for (const log of logs) {
          if (cancelled) return;
          await new Promise((r) => setTimeout(r, 150 + Math.random() * 200));
          const type = log.startsWith("⚠") || log.startsWith("→") ? "warn" : log.startsWith("✓") ? "ok" : "info";
          addLine(log, type);
        }

        if (svc.incidentIds?.length) {
          await new Promise((r) => setTimeout(r, 200));
          for (const incId of svc.incidentIds) {
            addLine(`🔴 INCIDENT DETECTED: ${incId} — requires investigation`, "warn");
          }
          setDiscoveredIncidents((prev) => [
            ...prev,
            ...svc.incidentIds!.filter((id) => !prev.includes(id)),
          ]);
        }

        await new Promise((r) => setTimeout(r, 200));
      }

      if (!cancelled) {
        await new Promise((r) => setTimeout(r, 400));
        addLine("", "info");
        addLine("═══ Scan complete ═══", "header");
        const found = mockIncidents.filter((i) => i.status !== "resolved").length;
        addLine(`Result: ${mockServices.length} services scanned, ${found} incidents detected.`, found > 0 ? "warn" : "ok");
        setPhase("complete");
        onScanComplete?.();
      }
    };

    runScan();
    return () => { cancelled = true; };
  }, []);

  const activeIncidents = mockIncidents.filter(
    (i) => i.status !== "resolved" && discoveredIncidents.includes(i.id)
  );
  const activeIncidentIds = new Set(activeIncidents.map((incident) => incident.id));
  const serviceSeverityByName = activeIncidents.reduce<Record<string, "critical" | "high" | "medium" | "low">>((acc, incident) => {
    const rank = { critical: 4, high: 3, medium: 2, low: 1 } as const;
    const current = acc[incident.service];
    if (!current || rank[incident.severity] > rank[current]) {
      acc[incident.service] = incident.severity;
    }
    return acc;
  }, {});

  const degradedCount = mockServices.filter((svc) => svc.status === "degraded").length;
  const failedCount = mockServices.filter((svc) => svc.status === "down").length;
  const currentService = phase === "scanning" && scannedIndex >= 0 ? mockServices[scannedIndex] : null;

  const progress = phase === "complete" ? 100 : Math.round(((scannedIndex + 1) / mockServices.length) * 100);

  const getStatusIcon = (svc: SystemService) => {
    if (svc.status === "healthy") return <CheckCircle2 className="w-3.5 h-3.5 text-primary" />;
    if (svc.status === "degraded") return <AlertTriangle className="w-3.5 h-3.5 text-yellow-400" />;
    return <XCircle className="w-3.5 h-3.5 text-destructive" />;
  };

  return (
    <div className="flex-1 flex flex-col h-screen">
      {/* Header */}
      <div className="shrink-0 border-b border-border bg-surface-0/80 backdrop-blur-sm">
        <div className={cn("h-[2px] w-full shimmer-line", phase === "scanning" && "shimmer-active")} />
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-6 h-6">
              <Shield className="w-6 h-6 text-primary" />
              {phase === "scanning" && (
                <motion.div className="absolute inset-[-3px] rounded-full border border-primary/30"
                  animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }} />
              )}
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                {phase === "scanning" ? "Глубокое сканирование..." : "Сканирование завершено"}
              </h2>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                <span>
                  {phase === "scanning"
                    ? `${scannedIndex + 1} из ${mockServices.length} сервисов`
                    : `${activeIncidents.length} инцидентов обнаружено`}
                </span>
                <span className="hidden sm:inline text-border">•</span>
                <span>Degraded {degradedCount}</span>
                <span className="hidden sm:inline text-border">•</span>
                <span>Down {failedCount}</span>
              </div>
            </div>
          </div>
          <button onClick={onCancel}
            className="p-2 rounded-lg hover:bg-surface-1 text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Radar + Services */}
        <div className="px-6 pt-6 pb-4 shrink-0">
          <div className="flex gap-6 items-start">
            <div className="shrink-0 relative overflow-hidden rounded-2xl border border-border/40 bg-surface-1/55 px-5 py-4">
              <div className="absolute inset-0 opacity-70 bg-[radial-gradient(circle_at_center,hsl(var(--primary)/0.10),transparent_68%)]" />
              <div className="absolute inset-x-6 top-3 flex items-center justify-between text-[9px] uppercase tracking-[0.18em] text-muted-foreground/80">
                <span>Threat Mesh</span>
                <span>{phase === "scanning" ? "Live Sweep" : "Locked"}</span>
              </div>
              <div className="relative mt-4">
                <ScanRadar
                  services={mockServices}
                  scannedIndex={scannedIndex}
                  phase={phase}
                  activeIncidentIds={activeIncidentIds}
                  serviceSeverityByName={serviceSeverityByName}
                />
              </div>
            </div>

            {/* Services list */}
            <div className="flex-1 min-w-0 rounded-2xl border border-border/40 bg-surface-1/45 p-2 max-h-[260px] overflow-y-auto pr-1">
              {mockServices.map((svc, i) => {
                const isScanned = i <= scannedIndex;
                const isActive = i === scannedIndex && phase === "scanning";
                const hasActiveIncident = Boolean(svc.incidentIds?.some((id) => activeIncidentIds.has(id)));
                const hasIncident = Boolean(svc.incidentIds?.length);
                return (
                  <motion.div key={svc.name}
                    initial={{ opacity: 0.25 }}
                    animate={{ opacity: isScanned ? 1 : 0.25 }}
                    transition={{ duration: 0.5 }}
                    className={cn(
                      "group relative mb-1 flex items-center gap-2.5 rounded-lg border border-transparent px-3 py-2 text-xs transition-all duration-300",
                      isActive && "border-primary/20 bg-primary/5 shadow-[0_0_0_1px_hsl(var(--primary)/0.08)]",
                      isScanned && !isActive && "hover:border-border/50 hover:bg-surface-2/40"
                    )}>
                    <div className={cn(
                      "absolute left-0 top-1.5 bottom-1.5 w-px rounded-full opacity-0 transition-opacity duration-300",
                      isActive && "opacity-100 bg-primary",
                      hasActiveIncident && isScanned && !isActive && "opacity-100 bg-destructive"
                    )} />
                    {isScanned ? getStatusIcon(svc) : isActive ? (
                      <motion.div className="w-3.5 h-3.5 rounded-full border-2 border-primary border-t-transparent"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }} />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-border/50" />
                    )}
                    <span className={cn(
                      "truncate transition-colors duration-300",
                      isScanned
                        ? hasActiveIncident
                          ? "text-foreground font-medium"
                          : svc.status !== "healthy"
                            ? "text-foreground font-medium"
                            : "text-foreground/70"
                        : "text-muted-foreground/50"
                    )}>{svc.displayName}</span>
                    {hasIncident && isScanned && (
                      <span className={cn(
                        "rounded-full border px-1.5 py-0.5 text-[9px] font-mono",
                        hasActiveIncident
                          ? "border-destructive/30 bg-destructive/10 text-destructive"
                          : "border-border/40 bg-surface-2/60 text-foreground/70"
                      )}>
                        {svc.incidentIds?.length} alert
                      </span>
                    )}
                    {isScanned && (
                      <span className="ml-auto text-[10px] font-mono text-muted-foreground">{svc.latency}</span>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4 rounded-xl border border-border/40 bg-surface-1/45 p-3">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1.5">
              <span>Прогресс сканирования</span>
              <span className="font-mono">{progress}%</span>
            </div>
            <div className="h-1 rounded-full bg-surface-2 overflow-hidden">
              <motion.div className="h-full rounded-full"
                style={{ background: "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)))" }}
                initial={{ width: "0%" }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }} />
            </div>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[10px] text-muted-foreground">
              <span>
                {currentService
                  ? `Scanning: ${currentService.displayName}`
                  : phase === "complete"
                    ? "All services indexed"
                    : "Initializing scan graph"}
              </span>
              <span className="font-mono text-foreground/70">{activeIncidents.length} active incidents</span>
            </div>
          </div>
        </div>

        {/* Terminal */}
        <div className="flex-1 flex flex-col min-h-0 px-6 pb-4">
          <div className="flex items-center gap-2 mb-2">
            <Terminal className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Scan Log</span>
          </div>
          <div ref={terminalRef}
            className="flex-1 rounded-xl bg-[hsl(160_20%_4%)] border border-border/30 p-4 overflow-y-auto font-mono text-[11px] leading-relaxed">
            {terminalLines.map((line, i) => (
              <div key={i} className={cn(
                line.text === "" && "h-2",
                line.type === "header" && "text-primary font-semibold",
                line.type === "info" && "text-foreground/50",
                line.type === "warn" && "text-yellow-400",
                line.type === "ok" && "text-primary/80"
              )}>{line.text}</div>
            ))}
            {phase === "scanning" && (
              <motion.span className="inline-block w-1.5 h-3.5 bg-primary/80 ml-0.5"
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }} />
            )}
          </div>
        </div>

        {/* Discovered incidents */}
        <AnimatePresence>
          {phase === "complete" && activeIncidents.length > 0 && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="shrink-0 border-t border-border bg-surface-0/90 backdrop-blur-sm px-6 py-4 max-h-[45%] overflow-y-auto"
            >
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-3">
                Требуют расследования ({activeIncidents.length})
              </p>
              <div className="space-y-2">
                {activeIncidents.map((inc, i) => {
                  const colors = getSeverityColor(inc.severity);
                  return (
                    <motion.button key={inc.id}
                      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 + i * 0.1 }}
                      onClick={() => onSelectIncident(inc.id)}
                      className="w-full text-left px-4 py-3 rounded-xl bg-surface-1 border border-border/30 hover:border-primary/25 transition-all group flex items-center gap-3">
                      <div className="relative shrink-0">
                        <div className={cn("w-2.5 h-2.5 rounded-full", colors.dot)} />
                        <div className={cn("absolute inset-0 w-2.5 h-2.5 rounded-full animate-ping opacity-40", colors.dot)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-muted-foreground">{inc.id}</span>
                          <span className={cn("text-[9px] font-medium uppercase px-1.5 py-0.5 rounded-full", colors.bg, colors.text)}>
                            {inc.severity}
                          </span>
                        </div>
                        <p className="text-sm text-foreground mt-0.5 truncate">{inc.title}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default RCDiscovery;
