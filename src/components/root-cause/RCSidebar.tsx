import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, Clock, Shield, Activity, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Incident,
  getSeverityColor,
  getRelativeTime,
} from "@/lib/mockIncidents";
import { useState, useEffect } from "react";

interface RCSidebarProps {
  incidents: Incident[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  onOpenSearch: () => void;
}

/* ── Severity micro-icon ── */
function SeverityIcon({ severity }: { severity: string }) {
  if (severity === "critical")
    return <AlertTriangle className="w-3 h-3 text-red-400" />;
  if (severity === "high")
    return <Activity className="w-3 h-3 text-orange-400" />;
  return <Shield className="w-3 h-3 text-yellow-400" />;
}

/* ── Neural Shield logo (matches CommandCenter) ── */
function NeuralShieldLogo() {
  return (
    <div
      className="w-9 h-9 rounded-xl flex items-center justify-center relative overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, hsl(var(--primary) / 0.15), hsl(var(--accent) / 0.08))",
      }}
    >
      <motion.div
        className="absolute inset-0 rounded-xl"
        style={{
          background:
            "conic-gradient(from 0deg, hsl(var(--primary) / 0.1), transparent 60%, hsl(var(--accent) / 0.08), transparent)",
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
      />
      <svg viewBox="0 0 40 40" className="w-5 h-5 relative z-10" fill="none">
        <motion.path
          d="M20 4 L32 10 L32 22 C32 30 26 36 20 38 C14 36 8 30 8 22 L8 10 Z"
          stroke="hsl(var(--primary))"
          strokeWidth="1.5"
          fill="hsl(var(--primary) / 0.08)"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2, ease: "easeOut" }}
        />
        {[
          [20, 12], [14, 18], [26, 18], [16, 26], [24, 26], [20, 32],
        ].map(([cx, cy], i) => (
          <motion.circle
            key={i}
            cx={cx}
            cy={cy}
            r="1.5"
            fill="hsl(var(--primary))"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 + i * 0.1 }}
          />
        ))}
        {[
          "M20 12 L14 18", "M20 12 L26 18", "M14 18 L16 26",
          "M26 18 L24 26", "M14 18 L26 18", "M16 26 L24 26",
          "M16 26 L20 32", "M24 26 L20 32",
        ].map((d, i) => (
          <path key={i} d={d} stroke="hsl(var(--primary) / 0.3)" strokeWidth="0.75" />
        ))}
      </svg>
    </div>
  );
}

/* ── Live status dot ── */
function LiveDot() {
  return (
    <span className="relative flex h-2 w-2">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
    </span>
  );
}

const RCSidebar = ({
  incidents,
  selectedId,
  onSelect,
  onNewChat,
  onOpenSearch,
}: RCSidebarProps) => {
  const active = incidents.filter((i) => i.status !== "resolved");
  const criticalCount = incidents.filter(
    (i) => i.severity === "critical" && i.status !== "resolved"
  ).length;

  return (
    <motion.aside
      initial={{ opacity: 0, x: -24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="w-72 shrink-0 h-screen flex flex-col relative overflow-hidden"
      style={{
        background: "hsl(var(--surface-0))",
        borderRight: "1px solid hsl(var(--border) / 0.5)",
      }}
    >
      {/* Ambient gradient */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute -top-20 -left-20 w-60 h-60 rounded-full blur-[80px] opacity-30"
          style={{ background: "hsl(var(--primary) / 0.15)" }}
        />
        <div
          className="absolute bottom-0 right-0 w-40 h-40 rounded-full blur-[60px] opacity-20"
          style={{ background: "hsl(var(--accent) / 0.1)" }}
        />
      </div>

      {/* Logo */}
      <div className="relative z-10 p-4 pb-3">
        <div className="flex items-center gap-3">
          <NeuralShieldLogo />
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-semibold text-foreground tracking-tight">
              Root Cause Agent
            </h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <LiveDot />
              <p className="text-[10px] text-muted-foreground">
                Мониторинг активен
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="relative z-10 px-3 pb-2 space-y-1.5">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onNewChat}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative overflow-hidden group"
          style={{
            background: "linear-gradient(135deg, hsl(var(--primary) / 0.12), hsl(var(--accent) / 0.08))",
            border: "1px solid hsl(var(--primary) / 0.2)",
          }}
        >
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{
              background: "linear-gradient(135deg, hsl(var(--primary) / 0.2), hsl(var(--accent) / 0.12))",
            }}
          />
          <Plus className="w-4 h-4 text-primary relative z-10" />
          <span className="text-primary relative z-10">Новый инцидент</span>
        </motion.button>

        <button
          onClick={onOpenSearch}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-colors"
          style={{
            background: "hsl(var(--surface-1))",
            border: "1px solid hsl(var(--border) / 0.3)",
          }}
        >
          <Search className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="flex-1 text-left text-muted-foreground">Поиск…</span>
          <kbd className="text-[10px] text-muted-foreground/60 px-1.5 py-0.5 rounded font-mono"
            style={{ background: "hsl(var(--surface-2))" }}
          >
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Threat level bar */}
      <div className="relative z-10 mx-3 mb-2">
        <div
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
          style={{
            background: "hsl(var(--surface-1))",
            border: "1px solid hsl(var(--border) / 0.3)",
          }}
        >
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Threat Level
              </span>
              <span className={cn(
                "text-[10px] font-mono font-semibold",
                criticalCount > 0 ? "text-red-400" : "text-primary"
              )}>
                {criticalCount > 0 ? "CRITICAL" : "NOMINAL"}
              </span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "hsl(var(--surface-3))" }}>
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: criticalCount > 0
                    ? "linear-gradient(90deg, hsl(var(--primary)), hsl(0 68% 52%))"
                    : "linear-gradient(90deg, hsl(var(--primary) / 0.4), hsl(var(--primary)))",
                }}
                initial={{ width: "0%" }}
                animate={{ width: `${Math.min(100, (active.length / 8) * 100)}%` }}
                transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
              />
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold font-mono text-foreground leading-none">
              {active.length}
            </p>
            <p className="text-[9px] text-muted-foreground mt-0.5">активных</p>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="relative z-10 mx-3 mb-1">
        <div className="h-px" style={{
          background: "linear-gradient(90deg, transparent, hsl(var(--border) / 0.5), transparent)"
        }} />
      </div>

      {/* Incident list */}
      <div className="relative z-10 flex-1 overflow-y-auto px-3 pb-3 scrollbar-thin">
        <p className="px-1 pt-2 pb-2 text-[10px] font-medium text-muted-foreground uppercase tracking-widest flex items-center gap-2">
          <Activity className="w-3 h-3" />
          Инциденты
        </p>

        <div className="space-y-1">
          <AnimatePresence>
            {active.map((inc, idx) => (
              <motion.div
                key={inc.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05, duration: 0.3 }}
              >
                <IncidentCard
                  incident={inc}
                  isSelected={selectedId === inc.id}
                  onClick={() => onSelect(inc.id)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom status */}
      <div className="relative z-10 p-3 pt-0">
        <div className="h-px mb-3" style={{
          background: "linear-gradient(90deg, transparent, hsl(var(--border) / 0.5), transparent)"
        }} />
        <div className="flex items-center gap-2 px-1">
          <div className="flex -space-x-1">
            {["bg-emerald-500", "bg-teal-500", "bg-cyan-500"].map((c, i) => (
              <div key={i} className={cn("w-2 h-2 rounded-full border border-background", c)} />
            ))}
          </div>
          <span className="text-[10px] text-muted-foreground">
            3 агента на связи
          </span>
        </div>
      </div>
    </motion.aside>
  );
};

/* ── Incident Card ── */
function IncidentCard({
  incident,
  isSelected,
  onClick,
}: {
  incident: Incident;
  isSelected: boolean;
  onClick: () => void;
}) {
  const colors = getSeverityColor(incident.severity);
  const isCritical = incident.severity === "critical";

  return (
    <motion.button
      whileHover={{ x: 2 }}
      onClick={onClick}
      className={cn(
        "w-full text-left px-3 py-2.5 rounded-xl transition-all duration-200 relative overflow-hidden group",
        isSelected ? "ring-1" : ""
      )}
      style={{
        background: isSelected
          ? "hsl(var(--primary) / 0.08)"
          : "transparent",
        borderColor: isSelected ? "hsl(var(--primary) / 0.25)" : undefined,
        ringColor: isSelected ? "hsl(var(--primary) / 0.25)" : undefined,
      }}
    >
      {/* Hover bg */}
      {!isSelected && (
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-xl"
          style={{ background: "hsl(var(--surface-1))" }}
        />
      )}

      {/* Left severity accent */}
      <div
        className="absolute left-0 top-2 bottom-2 w-[2px] rounded-full transition-opacity duration-200"
        style={{
          background: isCritical
            ? "hsl(0 68% 52%)"
            : incident.severity === "high"
            ? "hsl(25 95% 53%)"
            : "hsl(var(--primary))",
          opacity: isSelected ? 1 : 0.4,
        }}
      />

      <div className="relative z-10">
        {/* Top row: ID + severity */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-mono text-muted-foreground/70">
            {incident.id}
          </span>
          <span
            className={cn(
              "text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded-md flex items-center gap-1",
              colors.bg,
              colors.text
            )}
          >
            <SeverityIcon severity={incident.severity} />
            {incident.severity}
          </span>
          {isCritical && incident.status === "active" && (
            <span className="relative flex h-1.5 w-1.5 ml-auto">
              <span className="animate-ping absolute h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative rounded-full h-1.5 w-1.5 bg-red-400" />
            </span>
          )}
        </div>

        {/* Title */}
        <p
          className={cn(
            "text-[13px] leading-snug truncate",
            isSelected ? "text-foreground font-medium" : "text-foreground/80"
          )}
        >
          {incident.title}
        </p>

        {/* Meta */}
        <div className="flex items-center gap-1.5 mt-1.5">
          <Clock className="w-3 h-3 text-muted-foreground/50" />
          <span className="text-[10px] text-muted-foreground/60">
            {getRelativeTime(incident.createdAt)}
          </span>
          <span className="text-muted-foreground/30">·</span>
          <span className="text-[10px] text-muted-foreground/60 truncate">
            {incident.service}
          </span>
        </div>
      </div>
    </motion.button>
  );
}

export default RCSidebar;
