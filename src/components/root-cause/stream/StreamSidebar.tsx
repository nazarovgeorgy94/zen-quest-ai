import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  Brain,
  ChevronRight,
  Clock,
  Cpu,
  Download,
  Plus,
  Radar,
  Search,
  Shield,
  Sparkles,
  TrendingUp,
  Waves,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Incident, getRelativeTime } from "@/lib/mockIncidents";

interface StreamSidebarProps {
  incidents: Incident[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  onOpenSearch: () => void;
  agentActive: boolean;
  agentPhase: string;
  sessionsToday: number;
  avgConfidence: number;
  avgMTTR: string;
}

/**
 * Bespoke "Mission Control" sidebar for /root-cause/chat-1 (Stream mode).
 * Heavier on KPIs, agent pulse, recent reasoning sessions.
 */
export default function StreamSidebar({
  incidents,
  selectedId,
  onSelect,
  onNewChat,
  onOpenSearch,
  agentActive,
  agentPhase,
  sessionsToday,
  avgConfidence,
  avgMTTR,
}: StreamSidebarProps) {
  const active = useMemo(
    () => incidents.filter((i) => i.status !== "resolved"),
    [incidents],
  );
  const critical = active.filter((i) => i.severity === "critical").length;

  return (
    <motion.aside
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="shrink-0 h-screen w-[300px] flex flex-col relative overflow-hidden border-r border-border/40"
      style={{ background: "hsl(var(--surface-0))" }}
    >
      {/* Animated neural mesh ambient */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-50"
          style={{
            background:
              "radial-gradient(ellipse 80% 30% at 50% 0%, hsl(var(--primary) / 0.10), transparent 70%), radial-gradient(ellipse 60% 30% at 50% 100%, hsl(var(--accent) / 0.06), transparent 70%)",
          }}
        />
        <motion.div
          className="absolute -inset-20 opacity-[0.05]"
          style={{
            background:
              "conic-gradient(from 0deg at 50% 50%, hsl(var(--primary)), transparent 30%, hsl(var(--accent)) 60%, transparent 90%)",
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        />
      </div>

      {/* Header — Mission Control identity */}
      <div className="relative z-10 px-4 pt-4 pb-3">
        <div className="flex items-center gap-2.5">
          <div
            className="relative w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden"
            style={{
              background:
                "linear-gradient(135deg, hsl(var(--primary) / 0.4), hsl(var(--accent) / 0.25))",
              boxShadow:
                "0 8px 22px -10px hsl(var(--primary) / 0.6), inset 0 1px 0 hsl(var(--foreground) / 0.1)",
            }}
          >
            <Waves className="w-4 h-4 text-primary-foreground relative z-10" />
            <motion.div
              className="absolute inset-0"
              style={{
                background:
                  "conic-gradient(from 0deg, transparent, hsl(var(--primary-foreground) / 0.3), transparent)",
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[9px] uppercase tracking-[0.22em] text-muted-foreground/60 mb-0.5 font-semibold">
              Mission Control
            </p>
            <h1 className="text-[13px] font-bold tracking-tight text-foreground leading-tight">
              Reasoning Stream
            </h1>
          </div>
        </div>

        {/* Agent pulse strip */}
        <div
          className="mt-3 rounded-xl px-3 py-2.5 flex items-center gap-2.5"
          style={{
            background: "hsl(var(--surface-1) / 0.7)",
            border: "1px solid hsl(var(--border) / 0.3)",
          }}
        >
          <div className="relative">
            <Brain
              className={cn(
                "w-4 h-4 transition-colors",
                agentActive ? "text-primary" : "text-muted-foreground/60",
              )}
            />
            {agentActive && (
              <motion.span
                className="absolute inset-[-3px] rounded-full border border-primary/50"
                animate={{ scale: [1, 1.4, 1], opacity: [0.7, 0, 0.7] }}
                transition={{ duration: 1.6, repeat: Infinity }}
              />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-semibold">
              Agent
            </div>
            <div
              className={cn(
                "text-[11px] font-medium",
                agentActive ? "text-primary" : "text-muted-foreground",
              )}
            >
              {agentActive ? agentPhase : "ожидает запроса"}
            </div>
          </div>
          <span className="relative flex h-2 w-2">
            {agentActive && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            )}
            <span
              className={cn(
                "relative inline-flex rounded-full h-2 w-2",
                agentActive ? "bg-primary" : "bg-muted-foreground/40",
              )}
            />
          </span>
        </div>
      </div>

      {/* Primary actions */}
      <div className="relative z-10 px-3 space-y-1.5">
        <motion.button
          whileHover={{ scale: 1.015 }}
          whileTap={{ scale: 0.985 }}
          onClick={onNewChat}
          className="relative w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-semibold overflow-hidden group"
          style={{
            background:
              "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))",
            color: "hsl(var(--primary-foreground))",
            boxShadow: "0 10px 26px -12px hsl(var(--primary) / 0.55)",
          }}
        >
          <motion.div
            className="absolute inset-0 opacity-0 group-hover:opacity-100"
            style={{
              background:
                "linear-gradient(110deg, transparent 30%, hsl(var(--primary-foreground) / 0.18), transparent 70%)",
            }}
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
          />
          <Sparkles className="w-4 h-4 relative z-10" />
          <span className="relative z-10">Новое расследование</span>
        </motion.button>

        <button
          onClick={onOpenSearch}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12px] transition-colors"
          style={{
            background: "hsl(var(--surface-1) / 0.7)",
            border: "1px solid hsl(var(--border) / 0.3)",
          }}
        >
          <Search className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="flex-1 text-left text-muted-foreground">Поиск инцидента…</span>
          <kbd
            className="text-[9px] text-muted-foreground/70 px-1.5 py-0.5 rounded font-mono"
            style={{ background: "hsl(var(--surface-2))" }}
          >
            ⌘K
          </kbd>
        </button>
      </div>

      {/* KPI grid — exec metrics */}
      <div className="relative z-10 px-3 mt-3 grid grid-cols-2 gap-1.5">
        <KpiTile icon={Activity} label="Sessions" value={String(sessionsToday)} sub="сегодня" tone="primary" />
        <KpiTile
          icon={TrendingUp}
          label="Confidence"
          value={`${avgConfidence}%`}
          sub="средняя"
          tone="emerald"
        />
        <KpiTile icon={Clock} label="MTTR" value={avgMTTR} sub="median" tone="cyan" />
        <KpiTile
          icon={AlertTriangle}
          label="Critical"
          value={String(critical)}
          sub="active"
          tone={critical > 0 ? "red" : "muted"}
        />
      </div>

      {/* Section: live incidents */}
      <div className="relative z-10 mt-4 px-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Radar className="w-3 h-3 text-primary/80" />
          <span className="text-[10px] uppercase tracking-[0.18em] font-semibold text-muted-foreground/80">
            Live Incidents
          </span>
        </div>
        <span className="text-[10px] font-mono text-muted-foreground/60">{active.length}</span>
      </div>

      <div className="relative z-10 flex-1 overflow-y-auto px-3 pt-2 pb-3 scrollbar-thin space-y-1">
        {active.length === 0 && (
          <div className="text-center text-[11px] text-muted-foreground/50 py-8">
            Все спокойно. Агент дежурит.
          </div>
        )}
        {active.map((inc, idx) => (
          <motion.button
            key={inc.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.04 }}
            onClick={() => onSelect(inc.id)}
            className={cn(
              "group w-full text-left rounded-xl px-3 py-2.5 transition-all relative overflow-hidden",
              selectedId === inc.id
                ? "bg-primary/12 border border-primary/35"
                : "border border-border/25 hover:border-primary/25 bg-surface-1/40 hover:bg-surface-1/70",
            )}
          >
            {selectedId === inc.id && (
              <motion.div
                layoutId="stream-sidebar-active"
                className="absolute left-0 top-0 bottom-0 w-0.5"
                style={{
                  background:
                    "linear-gradient(180deg, hsl(var(--primary)), hsl(var(--accent)))",
                  boxShadow: "0 0 12px hsl(var(--primary) / 0.6)",
                }}
              />
            )}
            <div className="flex items-center gap-2 mb-0.5">
              <SeverityDot sev={inc.severity} />
              <span className="text-[10px] font-mono text-muted-foreground/80">{inc.id}</span>
              <span className="ml-auto text-[10px] text-muted-foreground/60">
                {getRelativeTime(inc.createdAt)}
              </span>
            </div>
            <div
              className={cn(
                "text-[12px] font-medium leading-snug line-clamp-2",
                selectedId === inc.id ? "text-foreground" : "text-foreground/85",
              )}
            >
              {inc.title}
            </div>
            <div className="text-[10px] text-muted-foreground/60 mt-1 flex items-center gap-1">
              <Cpu className="w-2.5 h-2.5" />
              {inc.service}
              <ChevronRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </motion.button>
        ))}
      </div>

      {/* Footer — agent identity card */}
      <div className="relative z-10 p-3 pt-0">
        <div
          className="h-px mb-3"
          style={{
            background:
              "linear-gradient(90deg, transparent, hsl(var(--border) / 0.5), transparent)",
          }}
        />
        <div
          className="rounded-xl p-3 flex items-center gap-2.5 relative overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, hsl(var(--surface-1) / 0.9), hsl(var(--surface-2) / 0.7))",
            border: "1px solid hsl(var(--border) / 0.3)",
          }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{
              background:
                "linear-gradient(135deg, hsl(var(--primary) / 0.3), hsl(var(--accent) / 0.2))",
            }}
          >
            <Shield className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-semibold text-foreground leading-tight">
              ANTIFRAUD AI
            </div>
            <div className="text-[10px] text-muted-foreground">v2.6 · GPT-5 reasoning</div>
          </div>
          <button
            className="text-muted-foreground hover:text-primary transition-colors"
            title="Export executive report"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.aside>
  );
}

function KpiTile({
  icon: Icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: typeof Clock;
  label: string;
  value: string;
  sub: string;
  tone: "primary" | "emerald" | "cyan" | "red" | "muted";
}) {
  const toneMap = {
    primary: { color: "hsl(var(--primary))", bg: "hsl(var(--primary) / 0.10)" },
    emerald: { color: "hsl(150 65% 55%)", bg: "hsl(150 65% 55% / 0.10)" },
    cyan: { color: "hsl(190 80% 60%)", bg: "hsl(190 80% 60% / 0.10)" },
    red: { color: "hsl(0 70% 60%)", bg: "hsl(0 70% 60% / 0.10)" },
    muted: { color: "hsl(var(--muted-foreground))", bg: "hsl(var(--surface-1))" },
  } as const;
  const t = toneMap[tone];
  return (
    <div
      className="rounded-lg px-2.5 py-2 relative overflow-hidden"
      style={{
        background: "hsl(var(--surface-1) / 0.7)",
        border: `1px solid ${t.color.replace(")", " / 0.18)")}`,
      }}
    >
      <div
        className="absolute inset-0 opacity-40 pointer-events-none"
        style={{ background: `radial-gradient(circle at 100% 0%, ${t.bg}, transparent 70%)` }}
      />
      <div className="relative flex items-center gap-1 mb-1">
        <Icon className="w-2.5 h-2.5" style={{ color: t.color }} />
        <span className="text-[8.5px] uppercase tracking-[0.16em] text-muted-foreground/70 font-semibold">
          {label}
        </span>
      </div>
      <div className="relative text-[14px] font-bold font-mono tabular-nums text-foreground leading-tight">
        {value}
      </div>
      <div className="relative text-[9px] text-muted-foreground/60">{sub}</div>
    </div>
  );
}

function SeverityDot({ sev }: { sev: string }) {
  const map: Record<string, string> = {
    critical: "hsl(0 70% 60%)",
    high: "hsl(25 95% 55%)",
    medium: "hsl(45 93% 50%)",
    low: "hsl(var(--primary))",
  };
  const c = map[sev] || map.low;
  return (
    <span className="relative flex h-1.5 w-1.5">
      <span
        className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60"
        style={{ background: c }}
      />
      <span
        className="relative inline-flex rounded-full h-1.5 w-1.5"
        style={{ background: c, boxShadow: `0 0 6px ${c}` }}
      />
    </span>
  );
}
