import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Radar, Hash, List, ArrowRight, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { mockIncidents } from "@/lib/mockIncidents";

interface RCCommandCenterProps {
  onStartScan: () => void;
  onSelectIncident: (id: string) => void;
  onHighlightSidebar: () => void;
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

  return (
    <div className="flex-1 flex items-center justify-center h-screen relative">
      {/* Ambient background effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Concentric rings */}
        {[1, 2, 3].map((ring) => (
          <motion.div
            key={ring}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/[0.04]"
            style={{
              width: `${ring * 280}px`,
              height: `${ring * 280}px`,
            }}
            animate={{
              scale: [1, 1.05, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 4 + ring,
              repeat: Infinity,
              delay: ring * 0.8,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 text-center space-y-8 max-w-lg px-6"
      >
        {/* Orb */}
        <div className="relative w-28 h-28 mx-auto">
          <motion.div
            className="absolute inset-0 rounded-full blur-3xl"
            style={{
              background:
                "radial-gradient(circle, hsl(158 72% 42% / 0.25), hsl(175 65% 38% / 0.1), transparent)",
            }}
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-primary/15 to-teal-accent/10 border border-primary/15 flex items-center justify-center backdrop-blur-sm">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <Zap className="w-10 h-10 text-primary/70" />
            </motion.div>
          </div>
          {/* Scanning ring */}
          <motion.div
            className="absolute inset-[-4px] rounded-full border-2 border-transparent"
            style={{
              borderImage:
                "conic-gradient(from 0deg, transparent 0%, hsl(158 72% 42% / 0.4) 30%, transparent 60%) 1",
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
          />
        </div>

        {/* Title */}
        <div>
          <h2 className="text-xl font-semibold text-foreground tracking-tight">
            Root Cause Agent
          </h2>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            AI-агент для диагностики инцидентов, анализа причин и рекомендаций
          </p>
        </div>

        {/* Action cards */}
        <div className="grid grid-cols-1 gap-3">
          {/* Scan System */}
          <motion.button
            onClick={onStartScan}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="group w-full flex items-center gap-4 px-5 py-4 rounded-xl bg-primary/8 hover:bg-primary/12 border border-primary/15 hover:border-primary/30 transition-all text-left"
          >
            <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center shrink-0 group-hover:bg-primary/25 transition-colors">
              <Radar className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">
                Сканировать систему
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Обнаружение активных инцидентов в реальном времени
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-primary/50 group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
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
                <div className="flex items-center gap-2 px-5 py-3 rounded-xl bg-surface-1 border border-border/50">
                  <Hash className="w-4 h-4 text-muted-foreground shrink-0" />
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
                    className="flex-1 bg-transparent text-sm text-foreground font-mono placeholder:text-muted-foreground outline-none"
                  />
                  <button
                    onClick={handleSubmitId}
                    disabled={!incidentInput.trim()}
                    className="px-3 py-1.5 rounded-lg bg-primary/15 text-primary text-xs font-medium hover:bg-primary/25 transition-colors disabled:opacity-40"
                  >
                    Найти
                  </button>
                </div>
                {inputError && (
                  <p className="text-xs text-destructive mt-1.5 px-2">
                    {inputError}
                  </p>
                )}
              </motion.div>
            ) : (
              <motion.button
                key="button"
                onClick={() => setShowInput(true)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="group w-full flex items-center gap-4 px-5 py-4 rounded-xl bg-surface-1 hover:bg-surface-2 border border-border/30 hover:border-border/60 transition-all text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-surface-2 flex items-center justify-center shrink-0 group-hover:bg-surface-3 transition-colors">
                  <Hash className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    Ввести ID инцидента
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Если знаете номер — введите INC-XXXX
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-foreground group-hover:translate-x-1 transition-all shrink-0" />
              </motion.button>
            )}
          </AnimatePresence>

          {/* Browse list */}
          <motion.button
            onClick={onHighlightSidebar}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="group w-full flex items-center gap-4 px-5 py-4 rounded-xl bg-surface-1 hover:bg-surface-2 border border-border/30 hover:border-border/60 transition-all text-left"
          >
            <div className="w-10 h-10 rounded-lg bg-surface-2 flex items-center justify-center shrink-0 group-hover:bg-surface-3 transition-colors">
              <List className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">
                Выбрать из списка
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Просмотреть активные и завершённые инциденты
              </p>
            </div>
            <kbd className="text-[10px] text-muted-foreground bg-surface-2 px-1.5 py-0.5 rounded font-mono shrink-0">
              ⌘K
            </kbd>
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default RCCommandCenter;
