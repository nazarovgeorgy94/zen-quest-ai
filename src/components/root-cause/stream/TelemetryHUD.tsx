import { motion, AnimatePresence } from "framer-motion";
import { Activity, Cpu, Database, Gauge, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface TelemetryHUDProps {
  active: boolean;
  phase: string;
  toolsRunning: number;
  toolsDone: number;
  sources: number;
  confidence: number;
}

/**
 * Floating top-right HUD with live agent telemetry.
 * Tokens/sec, calls, sources, confidence trajectory — pure executive eye-candy.
 */
export default function TelemetryHUD({
  active,
  phase,
  toolsRunning,
  toolsDone,
  sources,
  confidence,
}: TelemetryHUDProps) {
  const [tps, setTps] = useState(0);
  const [history, setHistory] = useState<number[]>(Array(24).fill(0));

  useEffect(() => {
    if (!active) {
      setTps(0);
      return;
    }
    const id = setInterval(() => {
      const next = 80 + Math.random() * 220;
      setTps(Math.round(next));
      setHistory((h) => [...h.slice(1), next]);
    }, 280);
    return () => clearInterval(id);
  }, [active]);

  const max = Math.max(...history, 300);
  const w = 88;
  const h = 22;
  const pts = history
    .map((v, i) => `${(i / (history.length - 1)) * w},${h - (v / max) * h}`)
    .join(" ");

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="pointer-events-none fixed top-3 right-4 z-40 flex items-center gap-2"
    >
      <div
        className="pointer-events-auto flex items-center gap-2 rounded-full border border-border/40 bg-surface-1/80 backdrop-blur-xl px-2.5 py-1.5 shadow-[0_8px_30px_-12px_hsl(var(--primary)/0.35)]"
      >
        {/* status dot */}
        <div className="flex items-center gap-1.5 pl-1 pr-2 border-r border-border/30">
          <span className="relative flex h-2 w-2">
            <span
              className={cn(
                "absolute inline-flex h-full w-full rounded-full",
                active ? "animate-ping bg-emerald-400 opacity-75" : "opacity-0",
              )}
            />
            <span
              className={cn(
                "relative inline-flex rounded-full h-2 w-2",
                active ? "bg-emerald-400" : "bg-muted-foreground/40",
              )}
            />
          </span>
          <span className="text-[10px] uppercase tracking-wider font-semibold text-foreground/80">
            {active ? phase : "idle"}
          </span>
        </div>

        {/* tps + sparkline */}
        <div className="flex items-center gap-1.5">
          <Zap className="w-3 h-3 text-primary" />
          <span className="text-[10px] font-mono tabular-nums text-primary w-9">
            {tps}
          </span>
          <svg width={w} height={h} className="opacity-90">
            <defs>
              <linearGradient id="tps-grad" x1="0" x2="1">
                <stop offset="0" stopColor="hsl(var(--accent))" />
                <stop offset="1" stopColor="hsl(var(--primary))" />
              </linearGradient>
            </defs>
            <polyline
              fill="none"
              stroke="url(#tps-grad)"
              strokeWidth={1.4}
              strokeLinecap="round"
              points={pts}
            />
          </svg>
          <span className="text-[9px] uppercase text-muted-foreground/70">tok/s</span>
        </div>

        {/* tool calls */}
        <div className="flex items-center gap-1 pl-2 border-l border-border/30">
          <Cpu className="w-3 h-3 text-muted-foreground/80" />
          <span className="text-[10px] font-mono tabular-nums text-foreground/85">
            {toolsDone}
            <span className="text-muted-foreground/50">/{toolsDone + toolsRunning}</span>
          </span>
        </div>

        {/* sources */}
        <div className="flex items-center gap-1 pl-2 border-l border-border/30">
          <Database className="w-3 h-3 text-muted-foreground/80" />
          <span className="text-[10px] font-mono tabular-nums text-foreground/85">{sources}</span>
        </div>

        {/* confidence */}
        <div className="flex items-center gap-1 pl-2 border-l border-border/30">
          <Gauge className="w-3 h-3 text-emerald-400" />
          <span className="text-[10px] font-mono tabular-nums text-emerald-400">
            {confidence}%
          </span>
        </div>
      </div>
    </motion.div>
  );
}
