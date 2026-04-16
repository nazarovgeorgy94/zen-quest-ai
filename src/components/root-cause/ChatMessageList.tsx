import { motion } from "framer-motion";
import { Shield, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { useState, useCallback } from "react";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

interface ChatMessageListProps {
  messages: Message[];
  isTyping: boolean;
}

function CopyButton({ content }: { content: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [content]);

  return (
    <button
      onClick={handleCopy}
      className="opacity-0 group-hover/msg:opacity-100 transition-opacity p-1 rounded-md hover:bg-surface-2/60 text-muted-foreground hover:text-foreground"
      title="Копировать"
    >
      {copied ? (
        <Check className="w-3.5 h-3.5 text-success" />
      ) : (
        <Copy className="w-3.5 h-3.5" />
      )}
    </button>
  );
}

const ChatMessageList = ({ messages, isTyping }: ChatMessageListProps) => {
  return (
    <>
      {messages.map((msg) => (
        <motion.div
          key={msg.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ease: [0.16, 1, 0.3, 1] }}
          className={cn("flex gap-3 group/msg", msg.role === "user" ? "justify-end" : "justify-start")}
        >
          {msg.role === "assistant" && (
            <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/15 flex items-center justify-center shrink-0 mt-1">
              <Shield className="w-3.5 h-3.5 text-primary" />
            </div>
          )}
          <div className="max-w-[78%] space-y-1">
            <div
              className={cn(
                "rounded-2xl px-4 py-3 text-sm",
                msg.role === "user"
                  ? "bg-gradient-to-br from-primary/80 to-teal-accent/60 text-primary-foreground rounded-br-md"
                  : "bg-surface-1/80 backdrop-blur-sm border border-border/20 text-foreground rounded-bl-md"
              )}
            >
              {msg.role === "assistant" ? (
                <div className="prose prose-sm prose-invert max-w-none [&_table]:text-xs [&_th]:px-2 [&_td]:px-2 [&_th]:py-1 [&_td]:py-1 [&_p]:leading-relaxed [&_li]:leading-relaxed">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                  {msg.isStreaming && (
                    <motion.span
                      className="inline-block w-[3px] h-[14px] bg-primary/70 ml-0.5 align-middle rounded-full"
                      animate={{ opacity: [1, 0, 1] }}
                      transition={{ duration: 0.6, repeat: Infinity }}
                    />
                  )}
                </div>
              ) : (
                msg.content
              )}
            </div>
            <div className={cn("flex items-center gap-1 px-1", msg.role === "user" ? "justify-end" : "justify-start")}>
              <p className="text-[9px] text-muted-foreground/50">
                {msg.timestamp.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
              </p>
              {msg.role === "assistant" && !msg.isStreaming && msg.content && (
                <CopyButton content={msg.content} />
              )}
            </div>
          </div>
        </motion.div>
      ))}

      {/* Typing indicator */}
      {isTyping && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 pl-1">
          <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/15 flex items-center justify-center shrink-0">
            <Shield className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="flex items-center gap-1 px-4 py-3 rounded-2xl bg-surface-1/80 backdrop-blur-sm border border-border/20 rounded-bl-md">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-primary/60"
                animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
              />
            ))}
          </div>
        </motion.div>
      )}
    </>
  );
};

export default ChatMessageList;
