import { useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Radar, Zap, Square } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  input: string;
  setInput: (v: string) => void;
  onSend: () => void;
  onStopGeneration: () => void;
  onStartScan: () => void;
  isDiagnosing: boolean;
  isStreaming: boolean;
  incidentSuggestion: string | null;
}

const ChatInput = ({
  input, setInput, onSend, onStopGeneration, onStartScan,
  isDiagnosing, isStreaming, incidentSuggestion,
}: ChatInputProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  const adjustHeight = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [input, adjustHeight]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="shrink-0 border-t border-border/50 bg-surface-0/60 backdrop-blur-md px-6 py-4 relative z-10">
      <AnimatePresence>
        {incidentSuggestion && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="mb-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/8 border border-primary/15 text-sm"
          >
            <Zap className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="text-foreground/80">
              Открыть инцидент{" "}
              <span className="font-mono font-semibold text-primary">{incidentSuggestion}</span>?
            </span>
            <span className="text-[10px] text-muted-foreground ml-auto">Enter</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-3">
        <button
          onClick={onStartScan}
          className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center bg-surface-1/60 backdrop-blur-sm border border-border/30 text-muted-foreground hover:text-primary hover:border-primary/20 hover:bg-primary/5 transition-all"
          title="Сканировать систему"
        >
          <Radar className="w-4 h-4" />
        </button>

        <div className="flex-1 relative group">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isDiagnosing ? "Дождитесь завершения диагностики..."
                : isStreaming ? "Агент печатает ответ..."
                : "Задайте вопрос или введите INC-XXXX..."
            }
            disabled={isDiagnosing}
            rows={1}
            className="w-full resize-none rounded-xl bg-surface-1/60 backdrop-blur-sm border border-border/40 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary/30 focus:ring-1 focus:ring-primary/15 transition-all disabled:opacity-40"
            style={{ maxHeight: 120 }}
          />
          <div className="absolute bottom-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-primary/0 to-transparent group-focus-within:via-primary/40 transition-all duration-500" />
        </div>

        {isStreaming ? (
          <motion.button
            onClick={onStopGeneration}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center bg-destructive/15 border border-destructive/30 text-destructive hover:bg-destructive/25 transition-all"
            title="Остановить генерацию"
          >
            <Square className="w-4 h-4 fill-current" />
          </motion.button>
        ) : (
          <motion.button
            onClick={onSend}
            disabled={!input.trim() || isDiagnosing}
            whileHover={input.trim() && !isDiagnosing ? { scale: 1.05 } : {}}
            whileTap={input.trim() && !isDiagnosing ? { scale: 0.95 } : {}}
            className={cn(
              "shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all",
              input.trim() && !isDiagnosing
                ? "text-primary-foreground shadow-lg"
                : "bg-surface-2/60 text-muted-foreground/40 cursor-not-allowed"
            )}
            style={
              input.trim() && !isDiagnosing
                ? {
                    background: "linear-gradient(135deg, hsl(158 72% 42%), hsl(175 65% 38%))",
                    boxShadow: "0 4px 15px -3px hsl(158 72% 42% / 0.35)",
                  }
                : undefined
            }
          >
            <Send className="w-4 h-4" />
          </motion.button>
        )}
      </div>
    </div>
  );
};

export default ChatInput;
