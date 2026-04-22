import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Radar, Hash, ArrowRight, Search, Clock, Sparkles, Activity, Command } from "lucide-react";
import { cn } from "@/lib/utils";
import { mockIncidents, getSeverityColor, getRelativeTime } from "@/lib/mockIncidents";

interface RCCommandCenterProps {
  onStartScan: () => void;
  onSelectIncident: (id: string) => void;
  onHighlightSidebar: () => void;
}

/* ── Hero Orb ── */
function HeroOrb({ isHovered }: { isHovered: boolean }) {
  return (
    <div className="relative h-32 w-32 mx-auto sm:h-36 sm:w-36">
      {/* Outer glow */}
      <motion.div
        className="absolute inset-[-32px] rounded-full blur-[64px]"
        style={{
          background:
            "radial-gradient(circle, hsl(var(--primary) / 0.22), hsl(var(--accent) / 0.12), transparent 72%)",
        }}
        animate={{
          scale: isHovered ? 1.18 : [1, 1.08, 1],
          opacity: isHovered ? 0.95 : [0.45, 0.72, 0.45],
        }}
        transition={isHovered ? { duration: 0.5 } : { duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        className="absolute inset-[-14px] rounded-full"
        style={{
          border: "1px solid hsl(var(--primary) / 0.14)",
          background:
            "radial-gradient(circle at 50% 50%, hsl(var(--surface-2) / 0.12), transparent 72%)",
        }}
        animate={{ rotate: isHovered ? 8 : 0, scale: isHovered ? 1.02 : 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      />

      {/* Ring */}
      <motion.div
        className="absolute inset-[-10px]"
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

      <div
        className="absolute inset-[14px] rounded-full"
        style={{
          border: "1px solid hsl(var(--border) / 0.45)",
          background:
            "linear-gradient(180deg, hsl(var(--surface-2) / 0.65), hsl(var(--surface-1) / 0.08))",
        }}
      />

      {/* Glass shell — без backdrop-blur (дорого над анимированным фоном) */}
      <div
        className="absolute inset-[6px] rounded-full"
        style={{
          background:
            "radial-gradient(circle at 35% 30%, hsl(var(--primary) / 0.22), hsl(var(--accent) / 0.12), hsl(var(--surface-1)) 78%)",
          border: "1px solid hsl(var(--primary) / 0.18)",
          boxShadow: "inset 0 1px 0 hsl(var(--foreground) / 0.06), 0 14px 48px hsl(var(--background) / 0.45)",
        }}
      />

      <div
        className="absolute inset-[10px] rounded-full"
        style={{
          background:
            "radial-gradient(circle at 32% 26%, hsl(var(--foreground) / 0.12), transparent 28%), radial-gradient(circle at 65% 70%, hsl(var(--primary) / 0.08), transparent 34%)",
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

function CommandCenterStatus() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25, duration: 0.45 }}
      className="mx-auto flex w-full max-w-[32rem] flex-wrap items-center justify-center gap-2 rounded-full border px-3 py-2 text-[11px]"
      style={{
        borderColor: "hsl(var(--border) / 0.5)",
        background:
          "linear-gradient(180deg, hsl(var(--surface-1) / 0.72), hsl(var(--surface-0) / 0.92))",
        boxShadow: "0 14px 36px hsl(var(--background) / 0.28)",
      }}
    >
      <span className="inline-flex items-center gap-2 rounded-full px-2.5 py-1"
        style={{ background: "hsl(var(--primary) / 0.08)" }}>
        <span className="relative flex h-2 w-2">
          <span
            className="absolute inline-flex h-full w-full animate-ping rounded-full"
            style={{ background: "hsl(var(--primary) / 0.45)" }}
          />
          <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: "hsl(var(--primary))" }} />
        </span>
        <span className="font-medium text-foreground">Live readiness</span>
      </span>

      <span className="inline-flex items-center gap-1.5 px-1.5 text-muted-foreground">
        <Activity className="h-3.5 w-3.5 text-primary" />
        Скан, триаж и быстрый вход в диагноз
      </span>

      <span
        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-muted-foreground"
        style={{ background: "hsl(var(--surface-2) / 0.55)" }}
      >
        <Command className="h-3.5 w-3.5" />
        ⌘K поиск
      </span>
    </motion.div>
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
            !s.danger && !s.accent && "text-foreground/60"
          )}
            style={s.danger ? { color: "hsl(0 68% 52%)" } : undefined}>
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

      <div className="relative z-10 w-full px-6 max-w-lg text-center xl:max-w-2xl 2xl:max-w-[52rem] [@media(min-width:2400px)]:max-w-5xl">
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="mb-6"
        >
          <motion.div variants={fadeUp} className="mb-3 flex justify-center">
            <div
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-muted-foreground"
              style={{
                borderColor: "hsl(var(--border) / 0.45)",
                background: "hsl(var(--surface-1) / 0.55)",
              }}
            >
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Diagnostic Station
            </div>
          </motion.div>

          <motion.div
            variants={fadeUp}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            onMouseEnter={() => setOrbHovered(true)}
            onMouseLeave={() => setOrbHovered(false)}
            className="cursor-pointer"
          >
            <div
              className="relative mx-auto mb-6 flex max-w-[34rem] items-center justify-center rounded-[2rem] border px-5 py-6 sm:px-8 sm:py-7"
              style={{
                borderColor: "hsl(var(--border) / 0.42)",
                background:
                  "linear-gradient(180deg, hsl(var(--surface-1) / 0.9), hsl(var(--surface-0) / 0.86))",
                boxShadow: "0 28px 80px hsl(var(--background) / 0.42)",
              }}
            >
              <div
                className="absolute inset-x-10 top-0 h-px"
                style={{ background: "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.45), transparent)" }}
              />
              <div
                className="absolute inset-0 rounded-[2rem]"
                style={{
                  background:
                    "radial-gradient(circle at 50% 24%, hsl(var(--primary) / 0.08), transparent 40%), radial-gradient(circle at 70% 76%, hsl(var(--accent) / 0.06), transparent 36%)",
                }}
              />
              <div className="relative w-full">
                <HeroOrb isHovered={orbHovered} />
                <div className="mt-4 flex items-center justify-center gap-5 text-[10px] uppercase tracking-[0.22em] text-muted-foreground/80">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Threat scan
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                    Live triage
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Root-cause entry
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.h2 variants={fadeUp}
            className="text-[1.75rem] font-bold tracking-tight text-foreground sm:text-[2.1rem]">
            Root Cause Agent
          </motion.h2>
          <motion.p variants={fadeUp}
            className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
            Запускай форензик-скан, переходи к конкретному инциденту или открывай очередь — стартовый экран теперь работает как оперативная станция, а не просто меню.
          </motion.p>

          <motion.div variants={fadeUp} className="mt-4">
            <CommandCenterStatus />
          </motion.div>

          <motion.div variants={fadeUp} className="mt-5">
            <QuickStats />
          </motion.div>
        </motion.div>

        {/* Action cards */}
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="space-y-2.5"
        >
          {/* Scan System — primary CTA */}
          <motion.button variants={fadeUp}
            onClick={onStartScan}
            className="group relative w-full overflow-hidden rounded-2xl text-left transition-transform duration-200 hover:-translate-y-0.5 active:scale-[0.99]"
          >
            <div className="absolute inset-0 rounded-2xl opacity-70 transition-opacity duration-500 group-hover:opacity-100"
              style={{
                background: "linear-gradient(135deg, hsl(var(--primary) / 0.34), hsl(var(--accent) / 0.18), hsl(var(--cyan-pop) / 0.22))",
              }} />
            <div className="absolute inset-[1px] rounded-[15px] transition-colors duration-300 group-hover:bg-surface-0/88"
              style={{ background: "linear-gradient(180deg, hsl(var(--surface-0) / 0.92), hsl(var(--surface-1) / 0.9))" }} />
            <div className="absolute inset-x-12 top-0 h-px" style={{ background: "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.5), transparent)" }} />
            <div className="relative flex items-center gap-4 px-5 py-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-colors duration-300 group-hover:border-primary/40"
                style={{
                  borderColor: "hsl(var(--primary) / 0.22)",
                  background: "linear-gradient(135deg, hsl(var(--primary) / 0.15), hsl(var(--accent) / 0.08))",
                }}>
                <Radar className="w-4.5 h-4.5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-foreground">Сканировать систему</p>
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-medium text-primary"
                    style={{ background: "hsl(var(--primary) / 0.1)" }}>
                    Primary
                  </span>
                </div>
                <p className="mt-0.5 text-[11px] text-muted-foreground">Глубокий проход по сервисам, корреляциям и свежим отклонениям</p>
              </div>
              <ArrowRight className="w-4 h-4 text-primary/40 group-hover:text-primary group-hover:translate-x-1 transition-all duration-300 shrink-0" />
            </div>
          </motion.button>

          {/* Enter Incident ID */}
          <motion.div variants={fadeUp}
            className="w-full overflow-hidden rounded-2xl border bg-surface-1/40 backdrop-blur-sm transition-all duration-200 hover:border-border/30"
            style={{ borderColor: "hsl(var(--border) / 0.22)" }}
          >
            {showInput ? (
              <div className="flex items-center gap-2 px-4 py-3.5">
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
                className="group flex w-full items-center gap-4 px-5 py-4 text-left"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface-2/60 transition-colors duration-200 group-hover:bg-surface-2">
                  <Hash className="w-4.5 h-4.5 text-muted-foreground group-hover:text-foreground transition-colors duration-200" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">Ввести ID инцидента</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">Мгновенный вход в диагноз по номеру INC-XXXX</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-foreground/60 group-hover:translate-x-1 transition-all duration-200 shrink-0" />
              </button>
            )}
            {inputError && <p className="text-xs text-destructive px-5 pb-2">{inputError}</p>}
          </motion.div>

          {/* Browse */}
          <motion.button variants={fadeUp}
            onClick={onHighlightSidebar}
            className="group flex w-full items-center gap-4 rounded-2xl border bg-surface-1/40 px-5 py-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:bg-surface-1/60 hover:border-border/30 active:scale-[0.99]"
            style={{ borderColor: "hsl(var(--border) / 0.22)" }}
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface-2/60 transition-colors duration-300 group-hover:bg-surface-2">
              <Search className="w-4.5 h-4.5 text-muted-foreground group-hover:text-foreground transition-colors duration-300" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">Найти инцидент</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">Открыть очередь и быстро отфильтровать текущие кейсы</p>
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
