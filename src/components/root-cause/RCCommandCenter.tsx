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
  const orbitNodes = [18, 142, 224, 304];
  const spikeAngles = [22, 118, 198, 286];

  return (
    <div className="relative w-32 h-32 mx-auto">
      {/* Outer glow */}
      <motion.div
        className="absolute inset-[-26px] rounded-full blur-[54px]"
        style={{
          background:
            "radial-gradient(circle, hsl(var(--primary) / 0.2), hsl(var(--accent) / 0.08), transparent)",
        }}
        animate={{
          scale: isHovered ? 1.22 : [1, 1.08, 1],
          opacity: isHovered ? 0.95 : [0.45, 0.68, 0.45],
        }}
        transition={isHovered ? { duration: 0.5 } : { duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Reticle ring */}
      <motion.div
        className="absolute inset-[-10px]"
        animate={{ rotate: 360 }}
        transition={{ duration: 26, repeat: Infinity, ease: "linear" }}
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
          <circle cx="80" cy="80" r="62" fill="none" stroke="hsl(var(--border) / 0.28)"
            strokeWidth={1} strokeDasharray="3 8" />
          {spikeAngles.map((angle, i) => {
            const radians = (angle * Math.PI) / 180;
            const x1 = 80 + Math.cos(radians) * 66;
            const y1 = 80 + Math.sin(radians) * 66;
            const x2 = 80 + Math.cos(radians) * 80;
            const y2 = 80 + Math.sin(radians) * 80;
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={i % 2 === 0 ? "hsl(var(--primary) / 0.45)" : "hsl(var(--accent) / 0.35)"}
                strokeWidth={1}
                strokeLinecap="round"
              />
            );
          })}
        </svg>
      </motion.div>

      {/* Orbit markers */}
      <motion.div
        className="absolute inset-0"
        animate={{ rotate: -360 }}
        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
      >
        {orbitNodes.map((angle, i) => {
          const radians = (angle * Math.PI) / 180;
          const radius = i % 2 === 0 ? 52 : 46;
          const x = 64 + Math.cos(radians) * radius;
          const y = 64 + Math.sin(radians) * radius;

          return (
            <motion.div
              key={angle}
              className="absolute"
              style={{ left: x - 3, top: y - 3 }}
              animate={{ scale: isHovered ? [1, 1.3, 1] : [0.9, 1.15, 0.9], opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2.6, repeat: Infinity, delay: i * 0.35 }}
            >
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
            </motion.div>
          );
        })}
      </motion.div>

      {/* Glass shell — без backdrop-blur (дорого над анимированным фоном) */}
      <div
        className="absolute inset-[10px] rounded-full"
        style={{
          background:
            "radial-gradient(circle at 34% 32%, hsl(var(--primary) / 0.18), hsl(var(--accent) / 0.09), hsl(var(--surface-1)) 78%)",
          border: "1px solid hsl(var(--primary) / 0.15)",
        }}
      />

      <div
        className="absolute inset-[22px] rounded-full"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, hsl(var(--primary) / 0.18), hsl(var(--surface-2) / 0.92) 62%, hsl(var(--surface-1)) 100%)",
          border: "1px solid hsl(var(--border) / 0.28)",
          boxShadow: "inset 0 1px 14px hsl(var(--primary) / 0.14)",
        }}
      />

      {/* Crosshair */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative h-[72px] w-[72px] rounded-full border border-border/30">
          <div className="absolute left-1/2 top-0 h-2 w-px -translate-x-1/2 bg-border/70" />
          <div className="absolute left-1/2 bottom-0 h-2 w-px -translate-x-1/2 bg-border/70" />
          <div className="absolute top-1/2 left-0 h-px w-2 -translate-y-1/2 bg-border/70" />
          <div className="absolute top-1/2 right-0 h-px w-2 -translate-y-1/2 bg-border/70" />
        </div>
      </div>

      {/* Diagnostic core */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.svg viewBox="0 0 48 48" className="w-12 h-12" fill="none"
          animate={{ scale: isHovered ? 1.04 : 1 }}
          transition={{ duration: 0.3 }}>
          <motion.circle
            cx="24"
            cy="24"
            r="18"
            stroke="hsl(var(--primary) / 0.18)"
            strokeWidth="1"
            strokeDasharray="3 5"
            animate={{ rotate: 360 }}
            transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
            style={{ transformOrigin: "24px 24px" }}
          />
          <motion.path
            d="M24 8 L36 14 L36 24 C36 32 30 38 24 40 C18 38 12 32 12 24 L12 14 Z"
            stroke="hsl(var(--primary))"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="hsl(var(--primary) / 0.08)"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }}
          />
          {[[24,14],[17,20],[31,20],[19,29],[29,29],[24,34]].map(([cx, cy], i) => (
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
            "M24 14 L17 20","M24 14 L31 20","M17 20 L19 29",
            "M31 20 L29 29","M17 20 L31 20","M19 29 L29 29",
            "M19 29 L24 34","M29 29 L24 34",
          ].map((d, i) => (
            <motion.path key={i} d={d}
              stroke="hsl(var(--primary) / 0.35)"
              strokeWidth="0.75"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.6, delay: 2 + i * 0.08 }}
            />
          ))}
          <motion.circle
            cx="24"
            cy="24"
            r="3.5"
            fill="hsl(var(--primary))"
            animate={{ opacity: [0.5, 1, 0.5], scale: isHovered ? [1, 1.2, 1] : [1, 1.08, 1] }}
            transition={{ duration: 1.8, repeat: Infinity }}
          />
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
