import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Radar, Hash, List, ArrowRight, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { mockIncidents } from "@/lib/mockIncidents";

interface RCCommandCenterProps {
  onStartScan: () => void;
  onSelectIncident: (id: string) => void;
  onHighlightSidebar: () => void;
}

/* ── Floating particles around the orb ── */
function OrbParticles() {
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
            x: [
              Math.cos((p.angle * Math.PI) / 180) * p.radius,
              Math.cos(((p.angle + 360) * Math.PI) / 180) * p.radius,
            ],
            y: [
              Math.sin((p.angle * Math.PI) / 180) * p.radius,
              Math.sin(((p.angle + 360) * Math.PI) / 180) * p.radius,
            ],
            opacity: [p.opacity, p.opacity * 2, p.opacity],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            ease: "linear",
            delay: p.delay,
          }}
        />
      ))}
    </>
  );
}

/* ── The hero orb ── */
function HeroOrb() {
  return (
    <div className="relative w-36 h-36 mx-auto">
      {/* Outer glow */}
      <motion.div
        className="absolute inset-[-30px] rounded-full blur-[60px]"
        style={{
          background:
            "radial-gradient(circle, hsl(158 72% 42% / 0.2), hsl(175 65% 38% / 0.08), transparent)",
        }}
        animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Outer rotating ring 1 — slow */}
      <motion.div
        className="absolute inset-[-12px]"
        animate={{ rotate: 360 }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
      >
        <svg viewBox="0 0 180 180" className="w-full h-full">
          <defs>
            <linearGradient id="ring1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(158 72% 42%)" stopOpacity="0.3" />
              <stop offset="50%" stopColor="hsl(175 65% 38%)" stopOpacity="0.05" />
              <stop offset="100%" stopColor="hsl(185 70% 45%)" stopOpacity="0.2" />
            </linearGradient>
          </defs>
          <circle
            cx="90"
            cy="90"
            r="86"
            fill="none"
            stroke="url(#ring1)"
            strokeWidth="1"
            strokeDasharray="8 16 4 12"
          />
        </svg>
      </motion.div>

      {/* Outer rotating ring 2 — faster, opposite */}
      <motion.div
        className="absolute inset-[-4px]"
        animate={{ rotate: -360 }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
      >
        <svg viewBox="0 0 160 160" className="w-full h-full">
          <defs>
            <linearGradient id="ring2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(175 65% 38%)" stopOpacity="0.25" />
              <stop offset="100%" stopColor="hsl(158 72% 42%)" stopOpacity="0.1" />
            </linearGradient>
          </defs>
          <circle
            cx="80"
            cy="80"
            r="76"
            fill="none"
            stroke="url(#ring2)"
            strokeWidth="0.75"
            strokeDasharray="3 8 6 10"
          />
        </svg>
      </motion.div>

      {/* Conic sweep */}
      <motion.div
        className="absolute inset-[6px] rounded-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        style={{
          background:
            "conic-gradient(from 0deg, transparent 0%, hsl(158 72% 42% / 0.1) 15%, transparent 30%)",
        }}
      />

      {/* Inner glass shell */}
      <div
        className="absolute inset-[8px] rounded-full backdrop-blur-md border border-primary/10"
        style={{
          background:
            "radial-gradient(circle at 35% 35%, hsl(158 72% 42% / 0.12), hsl(175 65% 38% / 0.06), hsl(160 18% 6% / 0.9))",
        }}
      />

      {/* Inner core gradient mesh */}
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

      {/* Center icon — neural network / shield shape */}
      <div className="absolute inset-0 flex items-center justify-center">
        <svg
          viewBox="0 0 40 40"
          className="w-11 h-11"
          fill="none"
        >
          {/* Shield shape */}
          <motion.path
            d="M20 4 L32 10 L32 22 C32 30 26 36 20 38 C14 36 8 30 8 22 L8 10 Z"
            stroke="hsl(158 72% 42%)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="hsl(158 72% 42% / 0.08)"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 2, ease: "easeOut" }}
          />
          {/* Neural nodes */}
          {[
            [20, 12],
            [14, 18],
            [26, 18],
            [16, 26],
            [24, 26],
            [20, 32],
          ].map(([cx, cy], i) => (
            <motion.circle
              key={i}
              cx={cx}
              cy={cy}
              r="1.5"
              fill="hsl(158 72% 42%)"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: [0.5, 1, 0.5], scale: 1 }}
              transition={{
                opacity: { duration: 2, repeat: Infinity, delay: i * 0.3 },
                scale: { duration: 0.4, delay: 1.5 + i * 0.1 },
              }}
            />
          ))}
          {/* Neural connections */}
          {[
            "M20 12 L14 18",
            "M20 12 L26 18",
            "M14 18 L16 26",
            "M26 18 L24 26",
            "M14 18 L26 18",
            "M16 26 L24 26",
            "M16 26 L20 32",
            "M24 26 L20 32",
          ].map((d, i) => (
            <motion.path
              key={i}
              d={d}
              stroke="hsl(158 72% 42% / 0.4)"
              strokeWidth="0.75"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5, delay: 2 + i * 0.08 }}
            />
          ))}
        </svg>
      </div>

      {/* Particles */}
      <OrbParticles />

      {/* Pulse rings */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute inset-0 rounded-full border border-primary/[0.06]"
          animate={{
            scale: [1, 2.2],
            opacity: [0.15, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            delay: i * 1,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
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
      {/* Background grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(158 72% 42%) 1px, transparent 1px), linear-gradient(90deg, hsl(158 72% 42%) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Radial ambient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 40%, hsl(158 72% 42% / 0.04) 0%, transparent 60%)",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 text-center max-w-lg px-6"
      >
        {/* Orb */}
        <HeroOrb />

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mt-8 mb-8"
        >
          <h2 className="text-2xl font-bold text-foreground tracking-tight">
            Root Cause Agent
          </h2>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed max-w-sm mx-auto">
            AI-диагностика инцидентов, анализ первопричин и рекомендации по устранению
          </p>

          {/* Live status badges */}
          <div className="flex items-center justify-center gap-3 mt-4">
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
          </div>
        </motion.div>

        {/* Action cards */}
        <div className="space-y-2.5">
          {/* Primary: Scan System */}
          <motion.button
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            onClick={onStartScan}
            whileHover={{ scale: 1.015 }}
            whileTap={{ scale: 0.985 }}
            className="group w-full relative rounded-xl overflow-hidden text-left"
          >
            {/* Gradient border */}
            <div
              className="absolute inset-0 rounded-xl opacity-60 group-hover:opacity-100 transition-opacity duration-500"
              style={{
                background:
                  "linear-gradient(135deg, hsl(158 72% 42% / 0.3), hsl(175 65% 38% / 0.15), hsl(185 70% 45% / 0.2))",
              }}
            />
            <div className="absolute inset-[1px] rounded-[11px] bg-surface-0/95 group-hover:bg-surface-0/90 transition-colors" />

            <div className="relative flex items-center gap-4 px-5 py-4">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border border-primary/20"
                style={{
                  background:
                    "linear-gradient(135deg, hsl(158 72% 42% / 0.15), hsl(175 65% 38% / 0.08))",
                }}
              >
                <Radar className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  Сканировать систему
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Глубокий анализ всех сервисов в реальном времени
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-primary/40 group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
            </div>
          </motion.button>

          {/* Enter Incident ID */}
          <AnimatePresence mode="wait">
            {showInput ? (
              <motion.div
                key="input"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="flex items-center gap-2 px-5 py-3 rounded-xl bg-surface-1/80 backdrop-blur-sm border border-border/40">
                  <Hash className="w-4 h-4 text-primary/60 shrink-0" />
                  <input
                    ref={inputRef}
                    value={incidentInput}
                    onChange={(e) => {
                      setIncidentInput(e.target.value.toUpperCase());
                      setInputError("");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSubmitId();
                      if (e.key === "Escape") {
                        setShowInput(false);
                        setIncidentInput("");
                        setInputError("");
                      }
                    }}
                    placeholder="INC-XXXX"
                    className="flex-1 bg-transparent text-sm text-foreground font-mono placeholder:text-muted-foreground/50 outline-none"
                  />
                  <button
                    onClick={handleSubmitId}
                    disabled={!incidentInput.trim()}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-primary-foreground disabled:opacity-30 transition-all"
                    style={{
                      background: incidentInput.trim()
                        ? "linear-gradient(135deg, hsl(158 72% 42%), hsl(175 65% 38%))"
                        : "hsl(160 12% 15%)",
                    }}
                  >
                    Найти
                  </button>
                </div>
                {inputError && (
                  <p className="text-xs text-destructive mt-1.5 px-2">{inputError}</p>
                )}
              </motion.div>
            ) : (
              <motion.button
                key="button"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 }}
                onClick={() => setShowInput(true)}
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.985 }}
                className="group w-full flex items-center gap-4 px-5 py-4 rounded-xl bg-surface-1/50 hover:bg-surface-1/80 backdrop-blur-sm border border-border/20 hover:border-border/40 transition-all text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-surface-2/60 flex items-center justify-center shrink-0 group-hover:bg-surface-2 transition-colors">
                  <Hash className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    Ввести ID инцидента
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Прямой переход по номеру INC-XXXX
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-foreground/60 group-hover:translate-x-1 transition-all shrink-0" />
              </motion.button>
            )}
          </AnimatePresence>

          {/* Browse list */}
          <motion.button
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65 }}
            onClick={onHighlightSidebar}
            whileHover={{ scale: 1.015 }}
            whileTap={{ scale: 0.985 }}
            className="group w-full flex items-center gap-4 px-5 py-4 rounded-xl bg-surface-1/50 hover:bg-surface-1/80 backdrop-blur-sm border border-border/20 hover:border-border/40 transition-all text-left"
          >
            <div className="w-10 h-10 rounded-lg bg-surface-2/60 flex items-center justify-center shrink-0 group-hover:bg-surface-2 transition-colors">
              <Search className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">
                Найти инцидент
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Поиск и фильтрация по всем инцидентам
              </p>
            </div>
            <kbd className="text-[10px] text-muted-foreground/60 bg-surface-2/50 px-1.5 py-0.5 rounded font-mono shrink-0 border border-border/20">
              ⌘K
            </kbd>
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default RCCommandCenter;
