import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, Brain, Zap, Activity, Square } from "lucide-react";
import { cn } from "@/lib/utils";

const SLASH_COMMANDS = [
  { cmd: "/explain", desc: "развернуть рассуждение по узлу", icon: Brain },
  { cmd: "/test", desc: "сымитировать проверку гипотезы", icon: Zap },
  { cmd: "/correlate", desc: "найти связанные инциденты", icon: Sparkles },
  { cmd: "/escalate", desc: "эскалировать команде on-call", icon: Activity },
];

interface Props {
  liveThought: string | null;
  isThinking: boolean;
  followUps: string[];
  onSend: (text: string) => void;
  onStop: () => void;
}

export default function CanvasAgentBar({ liveThought, isThinking, followUps, onSend, onStop }: Props) {
  const [value, setValue] = useState("");
  const [showSlash, setShowSlash] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setShowSlash(value.startsWith("/"));
  }, [value]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
        setValue("/");
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

  const filteredCmds = SLASH_COMMANDS.filter((c) => c.cmd.startsWith(value.toLowerCase()));

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 w-[min(820px,calc(100vw-340px))]">
      {/* Live thought ticker */}
      <AnimatePresence>
        {(liveThought || isThinking) && (
          <motion.div
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 12, opacity: 0 }}
            className="mb-2 rounded-xl border border-primary/30 bg-surface-1/80 backdrop-blur-xl px-3 py-2 shadow-lg flex items-center gap-2 overflow-hidden"
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
                key={liveThought || "thinking"}
                initial={{ y: 8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -8, opacity: 0 }}
                className="text-xs text-foreground/90 font-mono truncate"
              >
                {liveThought || "обрабатываю запрос…"}
              </motion.span>
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Follow-up chips */}
      {!isThinking && followUps.length > 0 && !value && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {followUps.slice(0, 3).map((f, i) => (
            <motion.button
              key={f}
              initial={{ y: 6, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => onSend(f)}
              className="rounded-full border border-border/40 bg-surface-1/70 backdrop-blur-md hover:border-primary/40 hover:bg-primary/10 hover:text-primary px-3 py-1.5 text-[11px] text-foreground/80 transition-all"
            >
              <Sparkles className="inline w-3 h-3 mr-1 -mt-px" />
              {f}
            </motion.button>
          ))}
        </div>
      )}

      {/* Slash menu */}
      <AnimatePresence>
        {showSlash && filteredCmds.length > 0 && (
          <motion.div
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 8, opacity: 0 }}
            className="mb-2 rounded-xl border border-border/40 bg-surface-1/90 backdrop-blur-xl shadow-2xl overflow-hidden"
          >
            {filteredCmds.map((c) => {
              const Icon = c.icon;
              return (
                <button
                  key={c.cmd}
                  onClick={() => { setValue(c.cmd + " "); inputRef.current?.focus(); }}
                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-primary/10 text-left transition-colors"
                >
                  <Icon className="w-3.5 h-3.5 text-primary" />
                  <span className="font-mono text-xs text-foreground">{c.cmd}</span>
                  <span className="text-[11px] text-muted-foreground ml-auto">{c.desc}</span>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <div className="relative rounded-2xl border border-border/50 bg-surface-1/85 backdrop-blur-2xl shadow-[0_12px_40px_rgba(0,0,0,0.45)] focus-within:border-primary/50 focus-within:shadow-[0_0_30px_hsl(var(--primary)/0.25)] transition-all">
        <div className="flex items-center gap-2 px-3 py-2.5">
          <Sparkles className="w-4 h-4 text-primary shrink-0" />
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
            placeholder="Спросите агента или нажмите / для команд…"
            className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground/60"
          />
          <kbd className="hidden sm:inline text-[9px] font-mono text-muted-foreground/60 border border-border/40 rounded px-1 py-px">Enter</kbd>
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
