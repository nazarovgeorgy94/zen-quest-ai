import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, Brain, Square } from "lucide-react";

const QUICK = ["Объясни ведущую гипотезу", "Какие альтернативы?", "Как проверить безопасно?"];

interface Props {
  isThinking: boolean;
  liveThought: string | null;
  followUps?: string[];
  onSend: (text: string) => void;
  onStop: () => void;
}

export default function PlaybookAskBar({ isThinking, liveThought, followUps = [], onSend, onStop }: Props) {
  const [value, setValue] = useState("");
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        ref.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const submit = () => {
    if (!value.trim()) return;
    onSend(value.trim());
    setValue("");
  };

  const chips = followUps.length ? followUps.slice(0, 3) : QUICK;

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 w-[min(720px,calc(100vw-340px))]">
      <AnimatePresence>
        {(liveThought || isThinking) && (
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 10, opacity: 0 }}
            className="mb-2 rounded-xl border border-primary/30 bg-surface-1/80 backdrop-blur-xl px-3 py-2 flex items-center gap-2 shadow-lg"
          >
            <div className="relative shrink-0">
              <Brain className="w-3.5 h-3.5 text-primary" />
              {isThinking && (
                <span className="absolute inset-0 animate-ping">
                  <Brain className="w-3.5 h-3.5 text-primary opacity-40" />
                </span>
              )}
            </div>
            <span className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground shrink-0">
              {isThinking ? "thinking" : "thought"}
            </span>
            <AnimatePresence mode="wait">
              <motion.span
                key={liveThought || "..."}
                initial={{ y: 6, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -6, opacity: 0 }}
                className="text-xs text-foreground/90 font-mono truncate"
              >
                {liveThought || "обрабатываю запрос…"}
              </motion.span>
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {!isThinking && !value && (
        <div className="mb-2 flex flex-wrap gap-1.5 justify-center">
          {chips.map((q, i) => (
            <motion.button
              key={q}
              initial={{ y: 6, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => onSend(q)}
              className="rounded-full border border-border/40 bg-surface-1/70 backdrop-blur-md hover:border-primary/40 hover:bg-primary/10 hover:text-primary px-3 py-1.5 text-[11px] text-foreground/80 transition-all"
            >
              <Sparkles className="inline w-3 h-3 mr-1 -mt-px" />
              {q}
            </motion.button>
          ))}
        </div>
      )}

      <div className="rounded-2xl border border-border/50 bg-surface-1/85 backdrop-blur-2xl shadow-[0_12px_40px_rgba(0,0,0,0.45)] focus-within:border-primary/50 focus-within:shadow-[0_0_30px_hsl(var(--primary)/0.25)] transition-all">
        <div className="flex items-center gap-2 px-3 py-2.5">
          <Sparkles className="w-4 h-4 text-primary shrink-0" />
          <input
            ref={ref}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="Спросите агента — ответ станет новой главой…"
            className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground/60"
          />
          {isThinking ? (
            <button
              onClick={onStop}
              className="w-8 h-8 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 flex items-center justify-center text-red-400 transition-colors"
            >
              <Square className="w-3 h-3 fill-current" />
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={!value.trim()}
              className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-[0_0_18px_hsl(var(--primary)/0.5)] transition-all"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
