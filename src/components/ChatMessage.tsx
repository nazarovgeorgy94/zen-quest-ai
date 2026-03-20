import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, ThumbsUp, ThumbsDown, Bot, ChevronDown, Layers, Lightbulb } from "lucide-react";
import SourceCard from "./SourceCard";
import ThinkingChain from "./ThinkingChain";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  sources?: { id: number; title: string; relevance: number; lastUpdated: string; type: string }[];
  isStreaming?: boolean;
  statusText?: string;
  timestamp?: Date;
  onAction?: (query: string) => void;
  thinkingSteps?: string[];
  thinkingRevealed?: number;
  thinkingComplete?: boolean;
}

const TypingDots = () => (
  <div className="flex items-center gap-1.5 py-2 pl-9">
    {[0, 1, 2].map((i) => (
      <motion.span
        key={i}
        className="w-2 h-2 rounded-full bg-primary/50"
        animate={{ opacity: [0.3, 1, 0.3], scale: [0.85, 1.1, 0.85] }}
        transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2, ease: "easeInOut" }}
      />
    ))}
  </div>
);

/* ── Animated AI orb avatar ── */
const AiOrb = () => (
  <div className="relative w-7 h-7 shrink-0">
    <div className="absolute inset-0 rounded-full ai-btn-ring opacity-40" />
    <div className="absolute inset-[1.5px] rounded-full bg-card flex items-center justify-center">
      <Bot className="w-3.5 h-3.5 text-primary" />
    </div>
    <div className="absolute inset-[-2px] rounded-full bg-primary/15 blur-md opacity-60" />
  </div>
);

const formatTime = (date?: Date) => {
  if (!date) return "";
  return date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
};

const COLLAPSE_THRESHOLD = 400; // characters

const ChatMessage = ({ role, content, sources, isStreaming, statusText, timestamp, onAction, thinkingSteps, thinkingRevealed, thinkingComplete }: ChatMessageProps) => {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);

  const handleCopy = () => {
    const text = content.replace(/<[^>]*>/g, "");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const plainTextLength = content.replace(/<[^>]*>/g, "").length;
  const isCollapsible = plainTextLength > COLLAPSE_THRESHOLD && !isStreaming;

  if (role === "user") {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col items-end gap-1"
      >
        <div className="max-w-[85%] px-4 py-2.5 rounded-2xl rounded-br-md user-bubble">
          <p className="text-[14px] text-foreground leading-relaxed">{content}</p>
        </div>
        {timestamp && (
          <span className="text-[10px] text-muted-foreground/50 pr-1">{formatTime(timestamp)}</span>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-2.5"
    >
      {/* AI avatar + status */}
      <div className="flex items-center gap-2">
        <AiOrb />
        <span className="text-[12px] font-medium text-foreground/70">Assistant</span>
        {isStreaming && statusText && (
          <motion.span
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-[11px] text-primary/70 font-medium"
          >
            • {statusText}
          </motion.span>
        )}
        {!isStreaming && timestamp && (
          <span className="text-[10px] text-muted-foreground/40 ml-auto">{formatTime(timestamp)}</span>
        )}
      </div>

      {/* Sources */}
      {sources && sources.length > 0 && <SourceCard sources={sources} />}

      {/* Streaming dots or content */}
      {isStreaming && !content ? (
        <TypingDots />
      ) : content ? (
        <div className="relative">
          <motion.div
            initial={{ opacity: 0, filter: "blur(3px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
            className={`prose-ai pl-9 ${isCollapsible && !isExpanded ? "max-h-[180px] overflow-hidden" : ""}`}
            dangerouslySetInnerHTML={{ __html: content }}
          />
          {/* Collapse gradient overlay */}
          {/* Expand/collapse toggle */}
          {isCollapsible && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="relative z-10 flex items-center gap-1 ml-9 mt-1.5 text-[12px] font-medium text-primary hover:text-primary/80 transition-colors duration-200"
            >
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`} />
              {isExpanded ? "Свернуть" : "Показать полностью"}
            </button>
          )}
        </div>
      ) : null}

      {/* Streaming cursor */}
      {isStreaming && content && (
        <span className="inline-block w-0.5 h-4 bg-primary/60 animate-pulse-emerald ml-9 align-text-bottom rounded-full" />
      )}

      {/* Actions bar */}
      {!isStreaming && content && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
          className="flex items-center gap-1 pl-9 pt-0.5 flex-wrap"
        >
          {/* Copy */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] text-muted-foreground hover:text-foreground hover:bg-secondary/70 transition-all duration-200"
          >
            {copied ? <Check className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3" />}
            {copied ? "Скопировано" : "Копировать"}
          </button>

          {/* Feedback */}
          <button
            onClick={() => setFeedback("up")}
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 ${
              feedback === "up" ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-secondary/70"
            }`}
          >
            <ThumbsUp className="w-3 h-3" />
          </button>
          <button
            onClick={() => setFeedback("down")}
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 ${
              feedback === "down" ? "text-destructive bg-destructive/10" : "text-muted-foreground hover:text-foreground hover:bg-secondary/70"
            }`}
          >
            <ThumbsDown className="w-3 h-3" />
          </button>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Context actions */}
          {onAction && (
            <div className="flex items-center gap-1">
              <motion.button
                onClick={() => onAction("Углуби предыдущий ответ, дай больше деталей")}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all duration-200 border border-transparent hover:border-primary/15"
              >
                <Layers className="w-3 h-3" />
                Углубить
              </motion.button>
              <motion.button
                onClick={() => onAction("Упрости предыдущий ответ, объясни проще")}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all duration-200 border border-transparent hover:border-primary/15"
              >
                <Lightbulb className="w-3 h-3" />
                Упростить
              </motion.button>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
};

export default ChatMessage;
