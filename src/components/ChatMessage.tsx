import { useState } from "react";
import { motion } from "framer-motion";
import { Copy, Check, ThumbsUp, ThumbsDown, Sparkles } from "lucide-react";
import SourceCard from "./SourceCard";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  sources?: { id: number; title: string; relevance: number; lastUpdated: string; type: string }[];
  isStreaming?: boolean;
  statusText?: string;
}

const TypingDots = () => (
  <div className="flex items-center gap-1.5 py-2">
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

const ChatMessage = ({ role, content, sources, isStreaming, statusText }: ChatMessageProps) => {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);

  const handleCopy = () => {
    const text = content.replace(/<[^>]*>/g, "");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (role === "user") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="flex justify-end"
      >
        <div className="max-w-[85%] px-4 py-2.5 rounded-2xl rounded-br-md bg-primary/15 border border-primary/10">
          <p className="text-[14px] text-foreground leading-relaxed">{content}</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="space-y-3"
    >
      {/* AI avatar + status */}
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Sparkles className="w-3 h-3 text-primary" />
        </div>
        {isStreaming && statusText && (
          <motion.span
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-[11px] text-primary/70 font-medium"
          >
            {statusText}
          </motion.span>
        )}
      </div>

      {/* Sources */}
      {sources && sources.length > 0 && <SourceCard sources={sources} />}

      {/* Streaming dots or content */}
      {isStreaming && !content ? (
        <TypingDots />
      ) : (
        <motion.div
          initial={{ opacity: 0, filter: "blur(3px)" }}
          animate={{ opacity: 1, filter: "blur(0px)" }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
          className="prose-ai pl-8"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      )}

      {/* Streaming cursor */}
      {isStreaming && content && (
        <span className="inline-block w-0.5 h-4 bg-primary/60 animate-pulse-emerald ml-8 align-text-bottom rounded-full" />
      )}

      {/* Actions bar */}
      {!isStreaming && content && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
          className="flex items-center gap-1 pl-8 pt-1"
        >
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] text-muted-foreground hover:text-foreground hover:bg-secondary/70 transition-all duration-200"
          >
            {copied ? <Check className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3" />}
            {copied ? "Скопировано" : "Копировать"}
          </button>
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
        </motion.div>
      )}
    </motion.div>
  );
};

export default ChatMessage;
