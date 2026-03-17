import { motion } from "framer-motion";
import SourceCard from "./SourceCard";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  sources?: { id: number; title: string; relevance: number; lastUpdated: string; type: string }[];
  isStreaming?: boolean;
  statusText?: string;
}

const ChatMessage = ({ role, content, sources, isStreaming, statusText }: ChatMessageProps) => {
  if (role === "user") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-[65ch] ml-auto"
      >
        <p className="text-[15px] text-foreground/90 font-medium text-right">{content}</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="space-y-4"
    >
      {/* Status indicator */}
      {isStreaming && statusText && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 text-xs text-primary/80 font-medium"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-emerald" />
          {statusText}
        </motion.div>
      )}

      {/* Sources */}
      {sources && sources.length > 0 && <SourceCard sources={sources} />}

      {/* AI Response — document style, no bubbles */}
      <motion.div
        initial={{ opacity: 0, filter: "blur(4px)" }}
        animate={{ opacity: 1, filter: "blur(0px)" }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        className="prose-ai"
        dangerouslySetInnerHTML={{ __html: content }}
      />

      {/* Streaming cursor */}
      {isStreaming && (
        <span className="inline-block w-0.5 h-5 bg-primary/60 animate-pulse-emerald ml-0.5 align-text-bottom" />
      )}
    </motion.div>
  );
};

export default ChatMessage;
