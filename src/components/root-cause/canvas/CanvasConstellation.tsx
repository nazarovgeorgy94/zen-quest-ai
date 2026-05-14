import { useMemo } from "react";
import { motion } from "framer-motion";
import { X, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Incident } from "@/lib/rootCauseData";
import { getSeverityColor } from "@/lib/mockIncidents";

interface Props {
  incidents: Incident[];
  onSelect: (id: string) => void;
  onClose: () => void;
}

export default function CanvasConstellation({ incidents, onSelect, onClose }: Props) {
  // arrange incidents on concentric orbits by severity
  const orbits = useMemo(() => {
    const buckets: Record<string, Incident[]> = { critical: [], high: [], medium: [], low: [] };
    incidents.forEach((i) => buckets[i.severity]?.push(i));
    return [
      { r: 150, items: buckets.critical },
      { r: 250, items: buckets.high },
      { r: 350, items: buckets.medium },
      { r: 440, items: buckets.low },
    ].filter((o) => o.items.length);
  }, [incidents]);

  const cx = 0, cy = 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 bg-background/90 backdrop-blur-xl flex items-center justify-center"
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 rounded-full border border-border/40 bg-surface-1/70 backdrop-blur-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors z-10"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="absolute top-6 left-1/2 -translate-x-1/2 text-center">
        <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">System Constellation</div>
        <div className="text-base font-mono text-foreground/80 mt-1">{incidents.length} активных сигналов</div>
      </div>

      <div className="relative" style={{ width: 1000, height: 1000 }}>
        <svg viewBox="-500 -500 1000 1000" className="absolute inset-0 w-full h-full">
          <defs>
            <radialGradient id="core-grad">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.9" />
              <stop offset="60%" stopColor="hsl(var(--accent))" stopOpacity="0.4" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Orbit rings */}
          {orbits.map((o, i) => (
            <circle
              key={i}
              cx={cx} cy={cy} r={o.r}
              fill="none"
              stroke="hsl(var(--border))"
              strokeOpacity="0.25"
              strokeDasharray="2 6"
            />
          ))}

          {/* Core */}
          <circle cx={cx} cy={cy} r="80" fill="url(#core-grad)" />
          <motion.circle
            cx={cx} cy={cy} r="40"
            fill="hsl(var(--primary) / 0.3)"
            animate={{ r: [40, 56, 40], opacity: [0.5, 0.1, 0.5] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
          <text x={cx} y={cy + 4} textAnchor="middle" fill="hsl(var(--primary-foreground))" fontSize="11" fontFamily="monospace" letterSpacing="2">
            ANTIFRAUD
          </text>

          {/* Connection lines from core to incidents */}
          {orbits.map((o) =>
            o.items.map((inc, idx) => {
              const total = o.items.length;
              const angle = (idx / total) * Math.PI * 2 - Math.PI / 2;
              const x = cx + Math.cos(angle) * o.r;
              const y = cy + Math.sin(angle) * o.r;
              const c = getSeverityColor(inc.severity);
              return (
                <motion.line
                  key={inc.id + "-line"}
                  x1={cx} y1={cy} x2={x} y2={y}
                  stroke={c.stripe}
                  strokeOpacity="0.25"
                  strokeWidth="1"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.6, delay: idx * 0.04 }}
                />
              );
            })
          )}
        </svg>

        {/* Incident orbs */}
        {orbits.map((o) =>
          o.items.map((inc, idx) => {
            const total = o.items.length;
            const angle = (idx / total) * Math.PI * 2 - Math.PI / 2;
            const x = 500 + Math.cos(angle) * o.r;
            const y = 500 + Math.sin(angle) * o.r;
            const c = getSeverityColor(inc.severity);
            const size = inc.severity === "critical" ? 56 : inc.severity === "high" ? 46 : 38;
            return (
              <motion.button
                key={inc.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 240, damping: 20, delay: idx * 0.05 }}
                whileHover={{ scale: 1.18, zIndex: 10 }}
                onClick={() => onSelect(inc.id)}
                className="absolute -translate-x-1/2 -translate-y-1/2 group"
                style={{ left: x, top: y, width: size, height: size }}
              >
                <div
                  className={cn("w-full h-full rounded-full ring-2 backdrop-blur-md flex items-center justify-center cursor-pointer transition-shadow", c.glow)}
                  style={{
                    background: `radial-gradient(circle at 30% 30%, ${c.stripe}, transparent 75%)`,
                    boxShadow: `0 0 24px ${c.stripe}66, inset 0 0 12px ${c.stripe}44`,
                    borderColor: c.stripe,
                  }}
                >
                  {inc.status === "active" && (
                    <motion.span
                      className="absolute inset-0 rounded-full"
                      style={{ boxShadow: `0 0 0 0 ${c.stripe}` }}
                      animate={{ boxShadow: [`0 0 0 0 ${c.stripe}99`, `0 0 0 16px ${c.stripe}00`] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}
                  <Activity className="w-3.5 h-3.5 text-foreground/90" />
                </div>
                {/* Hover label */}
                <div className="absolute left-1/2 top-full -translate-x-1/2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                  <div className="rounded-lg border border-border/50 bg-surface-1/90 backdrop-blur-xl px-2.5 py-1.5 text-[10px] shadow-xl">
                    <div className="font-mono text-muted-foreground">{inc.id}</div>
                    <div className="text-foreground font-medium">{inc.title}</div>
                  </div>
                </div>
              </motion.button>
            );
          })
        )}
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground/70 font-mono">
        клик по узлу — погрузиться в расследование
      </div>
    </motion.div>
  );
}
