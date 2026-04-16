import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, AlertTriangle, Clock, Server } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Incident,
  getSeverityColor,
  getRelativeTime,
  getStatusLabel,
} from "@/lib/mockIncidents";

interface RCSearchModalProps {
  open: boolean;
  onClose: () => void;
  incidents: Incident[];
  onSelect: (id: string) => void;
}

const RCSearchModal = ({ open, onClose, incidents, onSelect }: RCSearchModalProps) => {
  const [query, setQuery] = useState("");
  const [severity, setSeverity] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setSeverity(null);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (open) onClose();
      }
      if (e.key === "Escape" && open) onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const filtered = incidents.filter((inc) => {
    const matchesQuery =
      !query ||
      inc.title.toLowerCase().includes(query.toLowerCase()) ||
      inc.id.toLowerCase().includes(query.toLowerCase()) ||
      inc.service.toLowerCase().includes(query.toLowerCase());
    const matchesSeverity = !severity || inc.severity === severity;
    return matchesQuery && matchesSeverity;
  });

  const severities = ["critical", "high", "medium", "low"] as const;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-x-4 top-[15%] z-50 mx-auto max-w-2xl"
          >
            <div className="rounded-xl border border-border bg-surface-0 shadow-2xl shadow-black/30 overflow-hidden">
              {/* Search input */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
                <Search className="w-5 h-5 text-muted-foreground shrink-0" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Поиск по ID, названию или сервису..."
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                />
                <button
                  onClick={onClose}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Severity filters */}
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/50">
                <span className="text-[11px] text-muted-foreground mr-1">
                  Severity:
                </span>
                {severities.map((s) => {
                  const colors = getSeverityColor(s);
                  return (
                    <button
                      key={s}
                      onClick={() => setSeverity(severity === s ? null : s)}
                      className={cn(
                        "text-[11px] font-medium uppercase px-2 py-1 rounded-md transition-all",
                        severity === s
                          ? cn(colors.bg, colors.text, "ring-1 ring-current/30")
                          : "text-muted-foreground hover:text-foreground hover:bg-surface-1"
                      )}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>

              {/* Results */}
              <div className="max-h-[400px] overflow-y-auto">
                {filtered.length === 0 ? (
                  <div className="py-12 text-center text-sm text-muted-foreground">
                    Инциденты не найдены
                  </div>
                ) : (
                  <div className="p-2">
                    {filtered.map((inc) => {
                      const colors = getSeverityColor(inc.severity);
                      return (
                        <button
                          key={inc.id}
                          onClick={() => {
                            onSelect(inc.id);
                            onClose();
                          }}
                          className="w-full text-left px-3 py-3 rounded-lg hover:bg-surface-1 transition-colors group"
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-1">
                              <div
                                className={cn("w-2.5 h-2.5 rounded-full", colors.dot)}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-mono text-muted-foreground">
                                  {inc.id}
                                </span>
                                <span
                                  className={cn(
                                    "text-[9px] font-medium uppercase px-1.5 py-0.5 rounded-full",
                                    colors.bg,
                                    colors.text
                                  )}
                                >
                                  {inc.severity}
                                </span>
                                <span className="text-[10px] text-muted-foreground ml-auto">
                                  {getStatusLabel(inc.status)}
                                </span>
                              </div>
                              <p className="text-sm text-foreground mt-1 truncate">
                                {inc.title}
                              </p>
                              <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Server className="w-3 h-3" />
                                  {inc.service}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {getRelativeTime(inc.createdAt)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-4 py-2.5 border-t border-border/50 text-[10px] text-muted-foreground">
                <span>{filtered.length} инцидентов</span>
                <div className="flex items-center gap-3">
                  <span>
                    <kbd className="bg-surface-2 px-1 py-0.5 rounded font-mono">↑↓</kbd>{" "}
                    навигация
                  </span>
                  <span>
                    <kbd className="bg-surface-2 px-1 py-0.5 rounded font-mono">Enter</kbd>{" "}
                    выбрать
                  </span>
                  <span>
                    <kbd className="bg-surface-2 px-1 py-0.5 rounded font-mono">Esc</kbd>{" "}
                    закрыть
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default RCSearchModal;
