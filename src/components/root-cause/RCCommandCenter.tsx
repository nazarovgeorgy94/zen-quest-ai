import { useState, useRef, useEffect } from "react";
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

      {/* Conic sweep */}
      <motion.div
        className="absolute inset-[4px] rounded-full"
        animate={{ rotate: 360 }}
        transition={{ duration: isHovered ? 4 : 10, repeat: Infinity, ease: "linear" }}
        style={{
          background: "conic-gradient(from 0deg, transparent 0%, hsl(var(--primary) / 0.1) 15%, transparent 30%)",
        }}
      />

      {/* Glass shell */}
      <div
        className="absolute inset-[6px] rounded-full backdrop-blur-md"
        style={{
          background:
            "radial-gradient(circle at 35% 35%, hsl(var(--primary) / 0.12), hsl(var(--accent) / 0.06), hsl(var(--background) / 0.9))",
          border: "1px solid hsl(var(--primary) / 0.1)",
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

      <div className="relative z-10 text-center max-w-md xl:max-w-lg 2xl:max-w-xl px-6 w-full">
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

        {/* Action cards */}
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="space-y-2"
        >
          {/* Scan System — primary CTA */}
          <motion.button variants={fadeUp}
            onClick={onStartScan}
            className="group w-full relative rounded-xl overflow-hidden text-left transition-transform duration-200 hover:-translate-y-0.5 active:scale-[0.99]"
          >
            <div className="absolute inset-0 rounded-xl opacity-60 group-hover:opacity-100 transition-opacity duration-500"
              style={{
                background: "linear-gradient(135deg, hsl(var(--primary) / 0.3), hsl(var(--accent) / 0.15), hsl(var(--cyan-pop) / 0.2))",
              }} />
            <div className="absolute inset-[1px] rounded-[11px] bg-surface-0/95 group-hover:bg-surface-0/90 transition-colors duration-300" />
            <div className="relative flex items-center gap-4 px-5 py-3.5">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border border-primary/20 group-hover:border-primary/40 transition-colors duration-300"
                style={{ background: "linear-gradient(135deg, hsl(var(--primary) / 0.15), hsl(var(--accent) / 0.08))" }}>
                <Radar className="w-4.5 h-4.5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">Сканировать систему</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Глубокий анализ всех сервисов</p>
              </div>
              <ArrowRight className="w-4 h-4 text-primary/40 group-hover:text-primary group-hover:translate-x-1 transition-all duration-300 shrink-0" />
            </div>
          </motion.button>

          {/* Enter Incident ID */}
          <motion.div variants={fadeUp}
            className="w-full rounded-xl bg-surface-1/40 backdrop-blur-sm border border-border/15 hover:border-border/30 transition-all duration-200 overflow-hidden"
          >
            {showInput ? (
              <div className="flex items-center gap-2 px-4 py-3">
                <Hash className="w-4 h-4 text-primary/60 shrink-0" />
                <input ref={inputRef} value={incidentInput}
                  onChange={(e) => { setIncidentInput(e.target.value.toUpperCase()); setInputError(""); }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSubmitId();
                    if (e.key === "Escape") { setShowInput(false); setIncidentInput(""); setInputError(""); }
                  }}
                  placeholder="INC-XXXX"
                  className="flex-1 bg-transparent text-sm text-foreground font-mono placeholder:text-muted-foreground/50 outline-none"
                />
                <button onClick={handleSubmitId} disabled={!incidentInput.trim()}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-primary-foreground disabled:opacity-30 transition-all"
                  style={{
                    background: incidentInput.trim()
                      ? "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))"
                      : "hsl(var(--border))",
                  }}>
                  Найти
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowInput(true)}
                className="group w-full flex items-center gap-4 px-5 py-3.5 text-left"
              >
                <div className="w-9 h-9 rounded-lg bg-surface-2/60 flex items-center justify-center shrink-0 group-hover:bg-surface-2 transition-colors duration-200">
                  <Hash className="w-4.5 h-4.5 text-muted-foreground group-hover:text-foreground transition-colors duration-200" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">Ввести ID инцидента</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Прямой переход по номеру INC-XXXX</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-foreground/60 group-hover:translate-x-1 transition-all duration-200 shrink-0" />
              </button>
            )}
            {inputError && <p className="text-xs text-destructive px-5 pb-2">{inputError}</p>}
          </motion.div>

          {/* Browse */}
          <motion.button variants={fadeUp}
            onClick={onHighlightSidebar}
            className="group w-full flex items-center gap-4 px-5 py-3.5 rounded-xl bg-surface-1/40 hover:bg-surface-1/60 backdrop-blur-sm border border-border/15 hover:border-border/30 transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.99] text-left"
          >
            <div className="w-9 h-9 rounded-lg bg-surface-2/60 flex items-center justify-center shrink-0 group-hover:bg-surface-2 transition-colors duration-300">
              <Search className="w-4.5 h-4.5 text-muted-foreground group-hover:text-foreground transition-colors duration-300" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">Найти инцидент</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Поиск и фильтрация по всем инцидентам</p>
            </div>
            <kbd className="text-[10px] text-muted-foreground/60 bg-surface-2/50 px-1.5 py-0.5 rounded font-mono shrink-0 border border-border/20">⌘K</kbd>
          </motion.button>
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
