import { useState, useRef, useEffect } from "react";
import { ArrowUp, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface QueryInputProps {
  onSubmit: (query: string) => void;
  isProcessing?: boolean;
}

const QueryInput = ({ onSubmit, isProcessing }: QueryInputProps) => {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "0";
      el.style.height = Math.min(el.scrollHeight, 120) + "px";
    }
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isProcessing) {
      onSubmit(query.trim());
      setQuery("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const canSubmit = query.trim().length > 0 && !isProcessing;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="w-full"
    >
      <form onSubmit={handleSubmit} className="relative">
        <div
          className={`rounded-xl frosted-input ${
            focused ? "!border-primary/30 !shadow-[0_0_0_3px_hsl(160_60%_45%/0.08),0_0_20px_-5px_hsl(160_60%_45%/0.15)]" : ""
          }`}
        >
          <div className="flex items-end gap-2 px-3.5 py-2.5">
            <textarea
              ref={textareaRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="Спросите что-нибудь..."
              className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground/60 resize-none outline-none text-[14px] leading-relaxed min-h-[22px] py-1"
              rows={1}
              disabled={isProcessing}
            />
            <button
              type="submit"
              disabled={!canSubmit}
              className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${
                canSubmit
                  ? "bg-primary text-primary-foreground shadow-sm hover:shadow-md hover:scale-105"
                  : "bg-secondary text-muted-foreground/40"
              }`}
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ArrowUp className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground/50 text-center mt-2">
          AI может допускать ошибки. Проверяйте важную информацию.
        </p>
      </form>
    </motion.div>
  );
};

export default QueryInput;
