import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowUpRight,
  Clock,
  DollarSign,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface MissionBriefingData {
  severity: "critical" | "high" | "medium" | "low";
  tldr: string;
  businessImpact: { dollars: string; users: string; trend: "up" | "down" };
  eta: string;
  recommended: { title: string; subtitle: string };
  confidence: number;
  ready: boolean;
}

const sevMap = {
  critical: { label: "CRITICAL", color: "hsl(0 72% 55%)", glow: "hsl(0 72% 55% / 0.35)" },
  high: { label: "HIGH", color: "hsl(25 95% 55%)", glow: "hsl(25 95% 55% / 0.30)" },
  medium: { label: "MEDIUM", color: "hsl(45 93% 50%)", glow: "hsl(45 93% 50% / 0.25)" },
  low: { label: "LOW", color: "hsl(var(--primary))", glow: "hsl(var(--primary) / 0.25)" },
} as const;

/**
 * Executive-grade briefing card. Shows the answer in 5 seconds:
 * What broke, $ impact, users hit, ETA, recommended action.
 */
export default function MissionBriefing({ data }: { data: MissionBriefingData }) {
  const sev = sevMap[data.severity];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      className="relative overflow-hidden rounded-2xl border border-border/40 bg-surface-1/70 backdrop-blur-xl"
      style={{
        boxShadow: `0 24px 60px -28px ${sev.glow}, inset 0 1px 0 hsl(var(--foreground) / 0.04)`,
      }}
    >
      {/* severity rail */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1"
        style={{
          background: `linear-gradient(180deg, ${sev.color}, transparent 80%)`,
          boxShadow: `0 0 24px ${sev.glow}`,
        }}
      />
      {/* ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none opacity-60"
        style={{
          background: `radial-gradient(ellipse 70% 60% at 0% 0%, ${sev.glow}, transparent 60%)`,
        }}
      />

      <div className="relative p-5">
        {/* Header strip */}
        <div className="flex items-start gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: `linear-gradient(135deg, ${sev.color}, hsl(var(--primary) / 0.6))`,
              boxShadow: `0 8px 22px -8px ${sev.glow}`,
            }}
          >
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground/70 font-semibold">
                Mission Briefing
              </span>
              <span
                className="text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded"
                style={{ background: `${sev.color}22`, color: sev.color, border: `1px solid ${sev.color}55` }}
              >
                {sev.label}
              </span>
              {!data.ready && (
                <span className="text-[10px] text-primary/80 font-medium animate-pulse">
                  • синтезируется…
                </span>
              )}
            </div>
            <h3 className="text-[15px] font-semibold leading-snug text-foreground">
              {data.tldr}
            </h3>
          </div>
        </div>

        {/* KPI grid */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <KPI
            icon={DollarSign}
            label="At risk"
            value={data.businessImpact.dollars}
            tone="amber"
            ready={data.ready}
          />
          <KPI
            icon={Users}
            label="Affected"
            value={data.businessImpact.users}
            tone="cyan"
            ready={data.ready}
          />
          <KPI
            icon={Clock}
            label="ETA"
            value={data.eta}
            tone="emerald"
            ready={data.ready}
          />
        </div>

        {/* Recommended action */}
        <div
          className="flex items-center gap-3 rounded-xl px-3 py-2.5"
          style={{
            background:
              "linear-gradient(90deg, hsl(var(--primary) / 0.10), hsl(var(--accent) / 0.06))",
            border: "1px solid hsl(var(--primary) / 0.22)",
          }}
        >
          <Target className="w-4 h-4 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase tracking-wider text-primary/80 font-semibold">
              Recommended action
            </div>
            <div className="text-[13px] font-medium text-foreground truncate">
              {data.recommended.title}
            </div>
            <div className="text-[11px] text-muted-foreground truncate">
              {data.recommended.subtitle}
            </div>
          </div>
          <button
            disabled={!data.ready}
            className={cn(
              "shrink-0 inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all",
              data.ready
                ? "text-primary-foreground"
                : "bg-surface-2/60 text-muted-foreground/50 cursor-not-allowed",
            )}
            style={
              data.ready
                ? {
                    background:
                      "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))",
                    boxShadow: "0 8px 18px -10px hsl(var(--primary) / 0.55)",
                  }
                : undefined
            }
          >
            Запустить
            <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>

        {/* Confidence footer */}
        <div className="mt-3 flex items-center gap-2">
          <ShieldCheck className="w-3 h-3 text-emerald-400" />
          <span className="text-[10px] text-muted-foreground">Confidence</span>
          <div className="flex-1 h-1 rounded-full bg-surface-2 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${data.confidence}%` }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
              style={{
                background:
                  "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)))",
              }}
            />
          </div>
          <span className="text-[10px] font-mono tabular-nums text-primary">
            {data.confidence}%
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function KPI({
  icon: Icon,
  label,
  value,
  tone,
  ready,
}: {
  icon: typeof Clock;
  label: string;
  value: string;
  tone: "amber" | "cyan" | "emerald";
  ready: boolean;
}) {
  const toneMap = {
    amber: "text-amber-400",
    cyan: "text-cyan-400",
    emerald: "text-emerald-400",
  } as const;
  return (
    <div
      className="rounded-xl px-3 py-2.5"
      style={{
        background: "hsl(var(--surface-0) / 0.65)",
        border: "1px solid hsl(var(--border) / 0.3)",
      }}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className={cn("w-3 h-3", toneMap[tone])} />
        <span className="text-[9px] uppercase tracking-[0.16em] text-muted-foreground/70 font-semibold">
          {label}
        </span>
      </div>
      <div
        className={cn(
          "text-[15px] font-bold font-mono tabular-nums tracking-tight",
          ready ? "text-foreground" : "text-foreground/40",
        )}
      >
        {ready ? value : "—"}
      </div>
    </div>
  );
}
