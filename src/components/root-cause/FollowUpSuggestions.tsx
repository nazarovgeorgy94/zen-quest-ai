import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface FollowUpSuggestionsProps {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
}

const FollowUpSuggestions = ({ suggestions, onSelect }: FollowUpSuggestionsProps) => {
  if (!suggestions.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
      className="rounded-xl border border-border/25 bg-surface-1/30 px-3 py-3"
    >
      <div className="mb-2 flex items-center gap-2">
        <div className="flex h-5 w-5 items-center justify-center rounded-md bg-primary/10">
          <Sparkles className="h-3 w-3 text-primary/70" />
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Next probes</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((s, i) => (
          <motion.button
            key={i}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 + i * 0.08, duration: 0.3 }}
            onClick={() => onSelect(s)}
            className={cn(
              "group relative overflow-hidden rounded-md border border-border/25 bg-surface-1/55 px-3 py-2 text-[11px] font-medium text-foreground/72 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:text-foreground"
            )}
            style={{ boxShadow: "0 6px 18px -14px hsl(var(--background) / 0.7)" }}
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
          >
            <div
              className="absolute inset-0 rounded-md opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              style={{
                background: "linear-gradient(135deg, hsl(var(--primary) / 0.08), hsl(var(--accent) / 0.05))",
              }}
            />
            <span className="relative z-10 flex items-center gap-1.5">
              <span>{s}</span>
              <span className="text-primary opacity-0 transition-opacity duration-200 group-hover:opacity-70">↗</span>
            </span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};

export default FollowUpSuggestions;
