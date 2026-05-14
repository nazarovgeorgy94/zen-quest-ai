import { motion } from "framer-motion";
import { X, BookOpen, Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Incident } from "@/lib/rootCauseData";
import { getRelativeTime, getSeverityColor, getStatusLabel } from "@/lib/mockIncidents";

interface Props {
  incidents: Incident[];
  onSelect: (id: string) => void;
  onClose: () => void;
}

export default function PlaybookLibrary({ incidents, onSelect, onClose }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 bg-background/95 backdrop-blur-2xl overflow-y-auto"
    >
      <button
        onClick={onClose}
        className="fixed top-4 right-4 z-10 w-10 h-10 rounded-full border border-border/40 bg-surface-1/70 backdrop-blur-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="max-w-6xl mx-auto px-8 py-20">
        <motion.div
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-10 text-center"
        >
          <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Investigation Library</div>
          <h1 className="mt-2 text-4xl font-bold text-foreground">Полка расследований</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {incidents.length} плейбуков · выберите расследование, чтобы открыть его как книгу
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {incidents.map((inc, idx) => {
            const c = getSeverityColor(inc.severity);
            return (
              <motion.button
                key={inc.id}
                initial={{ y: 28, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: idx * 0.04, type: "spring", stiffness: 240, damping: 24 }}
                whileHover={{ y: -8, rotateX: 2, rotateY: -2 }}
                onClick={() => onSelect(inc.id)}
                className="group relative text-left"
                style={{ perspective: 800 }}
              >
                {/* Book cover */}
                <div
                  className="relative aspect-[3/4] rounded-r-xl rounded-l-md overflow-hidden border border-border/40 shadow-2xl shadow-black/40 group-hover:shadow-[0_20px_60px_rgba(0,0,0,0.5)] transition-shadow"
                  style={{
                    background: `
                      linear-gradient(135deg, hsl(var(--surface-1)) 0%, hsl(var(--surface-2)) 100%),
                      radial-gradient(ellipse at 30% 20%, ${c.stripe}33, transparent 60%)
                    `,
                  }}
                >
                  {/* Spine shadow */}
                  <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-r from-black/50 to-transparent" />

                  {/* Severity glow */}
                  <div
                    className="absolute inset-0 opacity-50"
                    style={{
                      background: `radial-gradient(ellipse at 70% 100%, ${c.stripe}55, transparent 60%)`,
                    }}
                  />

                  {/* Severity stripe */}
                  <div
                    className="absolute top-0 right-0 h-1 w-1/2"
                    style={{ background: c.stripe }}
                  />

                  {/* Content */}
                  <div className="relative h-full flex flex-col p-4">
                    <div className="flex items-center justify-between">
                      <span className={cn("text-[8px] uppercase tracking-[0.2em] px-1.5 py-0.5 rounded-sm font-bold", c.bg, c.text)}>
                        {inc.severity}
                      </span>
                      <span className="font-mono text-[9px] text-muted-foreground">{inc.id}</span>
                    </div>

                    <div className="flex-1 flex items-center justify-center my-4">
                      <BookOpen className="w-8 h-8 text-foreground/20 group-hover:text-primary/40 transition-colors" />
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-foreground line-clamp-3 leading-tight">
                        {inc.title}
                      </h3>
                      <div className="mt-2 pt-2 border-t border-border/30 flex items-center justify-between text-[10px] text-muted-foreground">
                        <span className="font-mono truncate">{inc.service}</span>
                        <span className="shrink-0">{getRelativeTime(inc.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Hover bookmark */}
                  <motion.div
                    className="absolute top-0 right-3 opacity-0 group-hover:opacity-100"
                    initial={false}
                    animate={{ y: 0 }}
                    whileHover={{ y: 4 }}
                  >
                    <div className="w-4 h-8" style={{ background: c.stripe, clipPath: "polygon(0 0, 100% 0, 100% 100%, 50% 75%, 0 100%)" }} />
                  </motion.div>
                </div>

                <div className="mt-3 flex items-center justify-between text-[10px] text-muted-foreground/70">
                  <span>{getStatusLabel(inc.status)}</span>
                  <span className="font-mono opacity-0 group-hover:opacity-100 transition-opacity text-primary">открыть →</span>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
