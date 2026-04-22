import { type ReactNode, useState, useRef, useEffect } from "react";
import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import { Radar, Hash, ArrowRight, Search, AlertTriangle, Clock, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { mockIncidents, getSeverityColor, getRelativeTime } from "@/lib/mockIncidents";

interface RCCommandCenterProps {
  onStartScan: () => void;
  onSelectIncident: (id: string) => void;
  onHighlightSidebar: () => void;
}

/* ── Smooth spring config ── */
const smoothSpring = { type: "spring" as const, stiffness: 60, damping: 20, mass: 1 };

/* ── Hero Orb ── */
function HeroOrb({ isHovered }: { isHovered: boolean }) {
  return (
    <div className="relative w-28 h-28 mx-auto">
      {/* Outer glow */}
      <motion.div
        className="absolute inset-[-24px] rounded-full blur-[50px]"
        style={{
          background:
            "radial-gradient(circle, hsl(var(--primary) / 0.2), hsl(var(--accent) / 0.08), transparent)",
        }}
        animate={{
          scale: isHovered ? 1.25 : [1, 1.1, 1],
          opacity: isHovered ? 1 : [0.5, 0.7, 0.5],
        }}
        transition={isHovered ? { duration: 0.5 } : { duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Ring */}
      <motion.div
        className="absolute inset-[-8px]"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      >
        <svg viewBox="0 0 160 160" className="w-full h-full">
          <defs>
            <linearGradient id="orbRing" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={isHovered ? 0.6 : 0.25} />
              <stop offset="50%" stopColor="hsl(var(--accent))" stopOpacity={0.05} />
              <stop offset="100%" stopColor="hsl(var(--cyan-pop))" stopOpacity={isHovered ? 0.5 : 0.15} />
            </linearGradient>
          </defs>
          <circle cx="80" cy="80" r="76" fill="none" stroke="url(#orbRing)"
            strokeWidth={1} strokeDasharray="6 12 3 10" />
        </svg>
      </motion.div>

      {/* Glass shell — без backdrop-blur (дорого над анимированным фоном) */}
      <div
        className="absolute inset-[6px] rounded-full"
        style={{
          background:
            "radial-gradient(circle at 35% 35%, hsl(var(--primary) / 0.18), hsl(var(--accent) / 0.08), hsl(var(--surface-1)) 80%)",
          border: "1px solid hsl(var(--primary) / 0.15)",
        }}
      />

      {/* Shield icon */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.svg viewBox="0 0 40 40" className="w-9 h-9" fill="none"
          animate={{ scale: isHovered ? 1.06 : 1 }}
          transition={{ duration: 0.3 }}>
          <motion.path
            d="M20 4 L32 10 L32 22 C32 30 26 36 20 38 C14 36 8 30 8 22 L8 10 Z"
            stroke="hsl(var(--primary))"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="hsl(var(--primary) / 0.08)"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }}
          />
          {[[20,12],[14,18],[26,18],[16,26],[24,26],[20,32]].map(([cx, cy], i) => (
            <motion.circle key={i} cx={cx} cy={cy} r="1.5"
              fill="hsl(var(--primary))"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: [0.4, 0.9, 0.4], scale: 1 }}
              transition={{
                opacity: { duration: 2.5, repeat: Infinity, delay: i * 0.3 },
                scale: { duration: 0.8, delay: 1.5 + i * 0.1 },
              }}
            />
          ))}
          {[
            "M20 12 L14 18","M20 12 L26 18","M14 18 L16 26",
            "M26 18 L24 26","M14 18 L26 18","M16 26 L24 26",
            "M16 26 L20 32","M24 26 L20 32",
          ].map((d, i) => (
            <motion.path key={i} d={d}
              stroke="hsl(var(--primary) / 0.35)"
              strokeWidth="0.75"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.6, delay: 2 + i * 0.08 }}
            />
          ))}
        </motion.svg>
      </div>
    </div>
  );
}

/* ── Stats ── */
function QuickStats() {
  const active = mockIncidents.filter((i) => i.status !== "resolved");
  const critical = active.filter((i) => i.severity === "critical").length;
  const resolved = mockIncidents.filter((i) => i.status === "resolved").length;

  const stats = [
    { label: "Активных", value: active.length.toString(), accent: true },
    { label: "Critical", value: critical.toString(), danger: critical > 0 },
    { label: "Решено", value: resolved.toString() },
  ];

  return (
    <div className="flex items-center justify-center gap-4">
      {stats.map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 + i * 0.08, duration: 0.4 }}
          className="text-center"
        >
          <p className={cn(
            "text-lg font-bold font-mono leading-none",
            s.danger ? "text-red-400" : s.accent ? "text-primary" : "text-foreground/60"
          )}>
            {s.value}
          </p>
          <p className="text-[9px] text-muted-foreground mt-1">{s.label}</p>
        </motion.div>
      ))}
    </div>
  );
}

/* ── Recent Incidents Preview ── */
function RecentIncidents({ onSelect }: { onSelect: (id: string) => void }) {
  const recent = mockIncidents
    .filter((i) => i.status !== "resolved")
    .slice(0, 3);

  return (
    <div className="w-full space-y-1.5">
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="text-[10px] text-muted-foreground/60 uppercase tracking-wider font-medium px-1"
      >
        Недавние инциденты
      </motion.p>
      {recent.map((inc, i) => {
        const colors = getSeverityColor(inc.severity);
        return (
          <motion.button
            key={inc.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.75 + i * 0.08 }}
            onClick={() => onSelect(inc.id)}
            className="w-full group flex items-center gap-3 px-3 py-2.5 rounded-lg bg-surface-1/30 hover:bg-surface-1/60 border border-border/10 hover:border-border/25 transition-all duration-200 text-left"
          >
            <div className={cn("w-2 h-2 rounded-full shrink-0", colors.dot)} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono text-muted-foreground/60">{inc.id}</span>
                <span className={cn("text-[8px] font-semibold uppercase px-1 py-0.5 rounded", colors.bg, colors.text)}>
                  {inc.severity}
                </span>
              </div>
              <p className="text-xs text-foreground/70 truncate mt-0.5">{inc.title}</p>
            </div>
            <div className="flex items-center gap-1 text-[9px] text-muted-foreground/40 shrink-0">
              <Clock className="w-2.5 h-2.5" />
              {getRelativeTime(inc.createdAt)}
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}

/* ── Simple fade-in stagger ── */
const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.3 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
};

function TacticalActionRow({
  index,
  icon,
  title,
  description,
  right,
  onClick,
  highlighted = false,
}: {
  index: string;
  icon: ReactNode;
  title: string;
  description: string;
  right?: React.ReactNode;
  onClick?: () => void;
  highlighted?: boolean;
}) {
  const Comp = onClick ? "button" : "div";

  return (
    <Comp
      onClick={onClick}
      className={cn(
        "group relative flex w-full items-center gap-4 px-4 py-4 text-left transition-all duration-300",
        onClick && "hover:bg-surface-2/45 active:scale-[0.995]",
        highlighted && "bg-surface-2/30",
      )}
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border/40 bg-surface-2/70 text-muted-foreground transition-colors duration-300 group-hover:border-primary/35 group-hover:text-primary">
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono uppercase tracking-[0.24em] text-muted-foreground/55">
            {index}
          </span>
          <p className="text-sm font-semibold text-foreground">{title}</p>
        </div>
        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>

      {right ?? (
        <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground/35 transition-all duration-300 group-hover:translate-x-1 group-hover:text-primary" />
      )}
    </Comp>
  );
}

const RCCommandCenter = ({
  onStartScan,
  onSelectIncident,
  onHighlightSidebar,
}: RCCommandCenterProps) => {
  const [incidentInput, setIncidentInput] = useState("");
  const [showInput, setShowInput] = useState(false);
  const [inputError, setInputError] = useState("");
  const [orbHovered, setOrbHovered] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showInput) inputRef.current?.focus();
  }, [showInput]);

  const handleSubmitId = () => {
    const id = incidentInput.trim().toUpperCase();
    const found = mockIncidents.find((i) => i.id === id);
    if (found) {
      onSelectIncident(found.id);
      setShowInput(false);
      setIncidentInput("");
      setInputError("");
    } else {
      setInputError(`Инцидент ${id} не найден`);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center h-screen relative overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }} />

      {/* Radial ambient */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at 50% 40%, hsl(var(--primary) / 0.04) 0%, transparent 60%)",
        }} />

      <div className="relative z-10 text-center w-full px-6 max-w-md xl:max-w-xl 2xl:max-w-2xl [@media(min-width:2400px)]:max-w-3xl">
        {/* Orb */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          onMouseEnter={() => setOrbHovered(true)}
          onMouseLeave={() => setOrbHovered(false)}
          className="cursor-pointer"
        >
          <HeroOrb isHovered={orbHovered} />
        </motion.div>

        {/* Title + Stats */}
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="mt-6 mb-6"
        >
          <motion.h2 variants={fadeUp}
            className="text-xl font-bold text-foreground tracking-tight">
            Root Cause Agent
          </motion.h2>
          <motion.p variants={fadeUp}
            className="text-sm text-muted-foreground mt-1.5 leading-relaxed max-w-sm mx-auto">
            AI-диагностика инцидентов и анализ первопричин
          </motion.p>

          <motion.div variants={fadeUp} className="mt-4">
            <QuickStats />
          </motion.div>
        </motion.div>

        {/* Command monolith */}
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="overflow-hidden rounded-2xl border border-border/25 bg-surface-1/55 shadow-[0_24px_80px_-40px_hsl(var(--background)/0.95)] backdrop-blur-md"
        >
          <motion.div variants={fadeUp} className="px-4 py-3 text-left">
            <div className="flex items-center justify-between gap-3 border-b border-border/20 pb-3">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-[0.28em] text-muted-foreground/55">
                  Tactical stack
                </p>
                <p className="mt-1 text-sm font-medium text-foreground/88">
                  Три команды в едином command monolith
                </p>
              </div>
              <div className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[10px] font-mono uppercase tracking-[0.2em] text-primary">
                Ready
              </div>
            </div>
          </motion.div>

          <div className="divide-y divide-border/15">
            <motion.div variants={fadeUp}>
              <TacticalActionRow
                index="01"
                icon={<Radar className="h-4 w-4" />}
                title="Scan system"
                description="Глубокий проход по сервисам, цепочкам сигналов и аномалиям в реальном времени"
                onClick={onStartScan}
                highlighted
              />
            </motion.div>

            <motion.div variants={fadeUp} className="bg-surface-1/20">
            {showInput ? (
              <div className="flex items-center gap-3 px-4 py-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border/40 bg-surface-2/70 text-primary">
                  <Hash className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase tracking-[0.24em] text-muted-foreground/55">02</span>
                    <p className="text-sm font-semibold text-foreground">Open incident</p>
                  </div>
                  <input ref={inputRef} value={incidentInput}
                  onChange={(e) => { setIncidentInput(e.target.value.toUpperCase()); setInputError(""); }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSubmitId();
                    if (e.key === "Escape") { setShowInput(false); setIncidentInput(""); setInputError(""); }
                  }}
                  placeholder="INC-XXXX"
                  className="w-full border-0 bg-transparent p-0 text-sm text-foreground font-mono placeholder:text-muted-foreground/45 outline-none"
                />
                  <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                    Прямой вход в диагностику по точному номеру инцидента
                  </p>
                  {inputError && <p className="pt-2 text-xs text-destructive">{inputError}</p>}
                </div>
                <button onClick={handleSubmitId} disabled={!incidentInput.trim()}
                  className="rounded-lg border border-primary/30 bg-primary/12 px-3 py-2 text-xs font-medium text-primary disabled:opacity-30 transition-all hover:bg-primary/18"
                  style={{
                    boxShadow: incidentInput.trim() ? "var(--shadow-glow)" : "none",
                  }}>
                  Найти
                </button>
              </div>
            ) : (
              <TacticalActionRow
                index="02"
                icon={<Hash className="h-4 w-4" />}
                title="Open incident"
                description="Прямой переход в карточку расследования по номеру инцидента"
                onClick={() => setShowInput(true)}
              />
            )}
            </motion.div>

            <motion.div variants={fadeUp}>
              <TacticalActionRow
                index="03"
                icon={<Search className="h-4 w-4" />}
                title="Search archive"
                description="Поиск по истории инцидентов, фильтрам и заархивированным расследованиям"
                onClick={onHighlightSidebar}
                right={<kbd className="shrink-0 rounded border border-border/20 bg-surface-2/50 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground/60">⌘K</kbd>}
              />
            </motion.div>
          </div>
        </motion.div>

        {/* Recent incidents */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-6"
        >
          <RecentIncidents onSelect={onSelectIncident} />
        </motion.div>
      </div>
    </div>
  );
};

export default RCCommandCenter;
