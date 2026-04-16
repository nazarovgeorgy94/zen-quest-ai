import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from "framer-motion";
import { Radar, Hash, ArrowRight, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { mockIncidents } from "@/lib/mockIncidents";

interface RCCommandCenterProps {
  onStartScan: () => void;
  onSelectIncident: (id: string) => void;
  onHighlightSidebar: () => void;
}

/* ── Smooth spring config ── */
const smoothSpring = { type: "spring" as const, stiffness: 60, damping: 20, mass: 1 };
const gentleSpring = { type: "spring" as const, stiffness: 40, damping: 18, mass: 1.2 };

/* ── Floating particles ── */
function OrbParticles({ isHovered }: { isHovered: boolean }) {
  const particles = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    angle: (i / 12) * 360,
    radius: 72 + (i % 3) * 14,
    size: 2 + (i % 3),
    duration: 8 + (i % 4) * 2,
    delay: i * 0.3,
    opacity: 0.15 + (i % 3) * 0.1,
  }));

  return (
    <>
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            background: `hsl(${158 + (p.id % 3) * 12} ${60 + (p.id % 2) * 15}% ${45 + (p.id % 3) * 8}% / ${p.opacity})`,
            top: "50%",
            left: "50%",
          }}
          animate={{
            x: Math.cos((p.angle * Math.PI) / 180) * (isHovered ? p.radius + 12 : p.radius),
            y: Math.sin((p.angle * Math.PI) / 180) * (isHovered ? p.radius + 12 : p.radius),
            opacity: isHovered ? p.opacity * 2.5 : p.opacity,
            scale: isHovered ? 1.5 : 1,
          }}
          transition={{ duration: isHovered ? 0.6 : p.duration, ease: "easeOut" }}
        />
      ))}
    </>
  );
}

/* ── Hero Orb with hover interactions ── */
function HeroOrb({ isHovered }: { isHovered: boolean }) {
  return (
    <div className="relative w-36 h-36 mx-auto">
      {/* Outer glow — intensifies on hover */}
      <motion.div
        className="absolute inset-[-30px] rounded-full blur-[60px]"
        style={{
          background:
            "radial-gradient(circle, hsl(158 72% 42% / 0.2), hsl(175 65% 38% / 0.08), transparent)",
        }}
        animate={{
          scale: isHovered ? 1.3 : [1, 1.12, 1],
          opacity: isHovered ? 1 : [0.5, 0.8, 0.5],
        }}
        transition={isHovered ? { duration: 0.5 } : { duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Ring 1 — slow, lights up on hover */}
      <motion.div
        className="absolute inset-[-12px]"
        animate={{ rotate: 360 }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
      >
        <motion.svg viewBox="0 0 180 180" className="w-full h-full"
          animate={{ opacity: isHovered ? 1 : 0.5 }}
          transition={{ duration: 0.4 }}>
          <defs>
            <linearGradient id="ring1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(158 72% 42%)" stopOpacity={isHovered ? 0.7 : 0.3} />
              <stop offset="50%" stopColor="hsl(175 65% 38%)" stopOpacity={isHovered ? 0.3 : 0.05} />
              <stop offset="100%" stopColor="hsl(185 70% 45%)" stopOpacity={isHovered ? 0.6 : 0.2} />
            </linearGradient>
          </defs>
          <circle cx="90" cy="90" r="86" fill="none" stroke="url(#ring1)"
            strokeWidth={isHovered ? 1.5 : 1} strokeDasharray="8 16 4 12" />
        </motion.svg>
      </motion.div>

      {/* Ring 2 — counter-rotate, brightens on hover */}
      <motion.div
        className="absolute inset-[-4px]"
        animate={{ rotate: -360 }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
      >
        <motion.svg viewBox="0 0 160 160" className="w-full h-full"
          animate={{ opacity: isHovered ? 1 : 0.5 }}
          transition={{ duration: 0.4 }}>
          <defs>
            <linearGradient id="ring2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(175 65% 38%)" stopOpacity={isHovered ? 0.6 : 0.25} />
              <stop offset="100%" stopColor="hsl(158 72% 42%)" stopOpacity={isHovered ? 0.4 : 0.1} />
            </linearGradient>
          </defs>
          <circle cx="80" cy="80" r="76" fill="none" stroke="url(#ring2)"
            strokeWidth={isHovered ? 1.25 : 0.75} strokeDasharray="3 8 6 10" />
        </motion.svg>
      </motion.div>

      {/* Hover ring — appears only on hover */}
      <motion.div
        className="absolute inset-[-20px] rounded-full"
        style={{ border: "1px solid hsl(var(--primary))" }}
        animate={{
          opacity: isHovered ? [0, 0.35, 0] : 0,
        }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Conic sweep — speeds up on hover */}
      <motion.div
        className="absolute inset-[6px] rounded-full"
        animate={{ rotate: 360 }}
        transition={{ duration: isHovered ? 3 : 8, repeat: Infinity, ease: "linear" }}
        style={{
          background: isHovered
            ? "conic-gradient(from 0deg, transparent 0%, hsl(158 72% 42% / 0.2) 15%, hsl(175 65% 38% / 0.1) 25%, transparent 35%)"
            : "conic-gradient(from 0deg, transparent 0%, hsl(158 72% 42% / 0.1) 15%, transparent 30%)",
        }}
      />

      {/* Inner glass shell */}
      <motion.div
        className="absolute inset-[8px] rounded-full backdrop-blur-md"
        style={{
          background:
            "radial-gradient(circle at 35% 35%, hsl(158 72% 42% / 0.12), hsl(175 65% 38% / 0.06), hsl(160 18% 6% / 0.9))",
          border: "1px solid hsl(var(--primary) / 0.1)",
        }}
        animate={{
          borderColor: isHovered ? "hsl(158 72% 42% / 0.3)" : "hsl(158 72% 42% / 0.1)",
        }}
        transition={{ duration: 0.3 }}
      />

      {/* Inner core gradient */}
      <div className="absolute inset-[20px] rounded-full overflow-hidden">
        <motion.div
          className="absolute inset-0"
          animate={{ rotate: -360 }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          style={{
            background:
              "conic-gradient(from 45deg, hsl(158 72% 42% / 0.2), hsl(175 65% 38% / 0.15), hsl(185 70% 45% / 0.1), hsl(158 72% 42% / 0.2))",
          }}
        />
      </div>

      {/* Shield + neural nodes */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.svg viewBox="0 0 40 40" className="w-11 h-11" fill="none"
          animate={{ scale: isHovered ? 1.08 : 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}>
          <motion.path
            d="M20 4 L32 10 L32 22 C32 30 26 36 20 38 C14 36 8 30 8 22 L8 10 Z"
            stroke="hsl(158 72% 42%)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="hsl(158 72% 42% / 0.08)"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 2.5, ease: [0.16, 1, 0.3, 1] }}
          />
          {[[20,12],[14,18],[26,18],[16,26],[24,26],[20,32]].map(([cx, cy], i) => (
            <motion.circle key={i} cx={cx} cy={cy} r="1.5"
              fill="hsl(158 72% 42%)"
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: isHovered ? 1 : [0.4, 0.9, 0.4],
                scale: 1,
                r: isHovered ? 2 : 1.5,
              }}
              transition={{
                opacity: { duration: 2.5, repeat: Infinity, delay: i * 0.3 },
                scale: { duration: 0.8, delay: 2 + i * 0.15, ease: "easeOut" },
                r: { duration: 0.3 },
              }}
            />
          ))}
          {[
            "M20 12 L14 18","M20 12 L26 18","M14 18 L16 26",
            "M26 18 L24 26","M14 18 L26 18","M16 26 L24 26",
            "M16 26 L20 32","M24 26 L20 32",
          ].map((d, i) => (
            <motion.path key={i} d={d}
              stroke={isHovered ? "hsl(158 72% 42% / 0.7)" : "hsl(158 72% 42% / 0.35)"}
              strokeWidth="0.75"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.8, delay: 2.5 + i * 0.1, ease: "easeOut" }}
            />
          ))}
        </motion.svg>
      </div>

      {/* Particles */}
      <OrbParticles isHovered={isHovered} />

    </div>
  );
}

/* ── Simple fade-in stagger ── */
const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.4 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
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

  const activeCount = mockIncidents.filter((i) => i.status !== "resolved").length;
  const criticalCount = mockIncidents.filter(
    (i) => i.severity === "critical" && i.status !== "resolved"
  ).length;

  return (
    <div className="flex-1 flex items-center justify-center h-screen relative overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(158 72% 42%) 1px, transparent 1px), linear-gradient(90deg, hsl(158 72% 42%) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }} />

      {/* Radial ambient */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at 50% 40%, hsl(158 72% 42% / 0.04) 0%, transparent 60%)",
        }} />

      <div className="relative z-10 text-center max-w-lg px-6">
        {/* Orb — smooth entrance */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          onMouseEnter={() => setOrbHovered(true)}
          onMouseLeave={() => setOrbHovered(false)}
          className="cursor-pointer"
        >
          <HeroOrb isHovered={orbHovered} />
        </motion.div>

        {/* Title + badges — staggered */}
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="mt-8 mb-8"
        >
          <motion.h2 variants={fadeUp}
            className="text-2xl font-bold text-foreground tracking-tight">
            Root Cause Agent
          </motion.h2>
          <motion.p variants={fadeUp}
            className="text-sm text-muted-foreground mt-2 leading-relaxed max-w-sm mx-auto">
            AI-диагностика инцидентов, анализ первопричин и рекомендации по устранению
          </motion.p>

          <motion.div variants={fadeUp}
            className="flex items-center justify-center gap-3 mt-4">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-1 border border-border/30 text-[10px]">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-muted-foreground">
                <span className="text-foreground font-semibold">{activeCount}</span> активных
              </span>
            </div>
            {criticalCount > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/5 border border-red-500/15 text-[10px]">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-muted-foreground">
                  <span className="text-red-400 font-semibold">{criticalCount}</span> critical
                </span>
              </div>
            )}
          </motion.div>
        </motion.div>

        {/* Action cards — staggered */}
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="space-y-2.5"
        >
          {/* Scan System */}
          <motion.button variants={fadeUp}
            onClick={onStartScan}
            className="group w-full relative rounded-xl overflow-hidden text-left transition-transform duration-200 hover:-translate-y-0.5 active:scale-[0.99]"
          >
            <div className="absolute inset-0 rounded-xl opacity-60 group-hover:opacity-100 transition-opacity duration-500"
              style={{
                background: "linear-gradient(135deg, hsl(158 72% 42% / 0.3), hsl(175 65% 38% / 0.15), hsl(185 70% 45% / 0.2))",
              }} />
            <div className="absolute inset-[1px] rounded-[11px] bg-surface-0/95 group-hover:bg-surface-0/90 transition-colors duration-300" />
            <div className="relative flex items-center gap-4 px-5 py-4">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border border-primary/20 group-hover:border-primary/40 transition-colors duration-300"
                style={{ background: "linear-gradient(135deg, hsl(158 72% 42% / 0.15), hsl(175 65% 38% / 0.08))" }}>
                <Radar className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">Сканировать систему</p>
                <p className="text-xs text-muted-foreground mt-0.5">Глубокий анализ всех сервисов в реальном времени</p>
              </div>
              <ArrowRight className="w-4 h-4 text-primary/40 group-hover:text-primary group-hover:translate-x-1 transition-all duration-300 shrink-0" />
            </div>
          </motion.button>

          {/* Enter Incident ID */}
          <motion.div variants={fadeUp}
            className="w-full rounded-xl bg-surface-1/50 backdrop-blur-sm border border-border/20 hover:border-border/40 transition-all duration-200 overflow-hidden"
          >
            {showInput ? (
              <div className="flex items-center gap-2 px-5 py-3">
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
                      ? "linear-gradient(135deg, hsl(158 72% 42%), hsl(175 65% 38%))"
                      : "hsl(160 12% 15%)",
                  }}>
                  Найти
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowInput(true)}
                className="group w-full flex items-center gap-4 px-5 py-4 text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-surface-2/60 flex items-center justify-center shrink-0 group-hover:bg-surface-2 transition-colors duration-200">
                  <Hash className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors duration-200" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">Ввести ID инцидента</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Прямой переход по номеру INC-XXXX</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-foreground/60 group-hover:translate-x-1 transition-all duration-200 shrink-0" />
              </button>
            )}
            {inputError && <p className="text-xs text-destructive px-5 pb-2">{inputError}</p>}
          </motion.div>

          {/* Browse */}
          <motion.button variants={fadeUp}
            onClick={onHighlightSidebar}
            className="group w-full flex items-center gap-4 px-5 py-4 rounded-xl bg-surface-1/50 hover:bg-surface-1/80 backdrop-blur-sm border border-border/20 hover:border-border/40 transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.99] text-left"
          >
            <div className="w-10 h-10 rounded-lg bg-surface-2/60 flex items-center justify-center shrink-0 group-hover:bg-surface-2 transition-colors duration-300">
              <Search className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors duration-300" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">Найти инцидент</p>
              <p className="text-xs text-muted-foreground mt-0.5">Поиск и фильтрация по всем инцидентам</p>
            </div>
            <kbd className="text-[10px] text-muted-foreground/60 bg-surface-2/50 px-1.5 py-0.5 rounded font-mono shrink-0 border border-border/20">⌘K</kbd>
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
};

export default RCCommandCenter;
