import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

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
      className="flex flex-wrap gap-2 pl-10"
    >
      <Sparkles className="w-3 h-3 text-primary/50 mt-1.5 shrink-0" />
      {suggestions.map((s, i) => (
        <motion.button
          key={i}
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 + i * 0.08, duration: 0.3 }}
          onClick={() => onSelect(s)}
          className="group relative px-3 py-1.5 rounded-lg text-[11px] font-medium text-foreground/70 hover:text-foreground transition-all duration-200 overflow-hidden hover:-translate-y-0.5"
          style={{
            background: "hsl(var(--surface-1) / 0.6)",
            border: "1px solid hsl(var(--border) / 0.25)",
            boxShadow: "0 6px 18px -14px hsl(var(--background) / 0.7)",
          }}
          whileHover={{ scale: 1.03, y: -1 }}
          whileTap={{ scale: 0.97 }}
        >
          {/* Hover glow */}
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg"
            style={{
              background: "linear-gradient(135deg, hsl(var(--primary) / 0.08), hsl(var(--accent) / 0.05))",
            }}
          />
          <span className="relative z-10 flex items-center gap-1.5">
            <span>{s}</span>
            <span className="opacity-0 transition-opacity duration-200 group-hover:opacity-70 text-primary">↗</span>
          </span>
        </motion.button>
      ))}
    </motion.div>
  );
};

export default FollowUpSuggestions;
