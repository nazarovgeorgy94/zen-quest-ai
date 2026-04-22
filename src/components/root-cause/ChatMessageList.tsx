import { motion } from "framer-motion";
import { Bot, Copy, Check, User } from "lucide-react";
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
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className={cn("flex gap-3 group/msg", msg.role === "user" ? "justify-end" : "justify-start")}
        >
          {msg.role === "assistant" && (
            <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/15 flex items-center justify-center shrink-0 mt-1">
              <Bot className="w-3.5 h-3.5 text-primary" />
            </div>
          )}
          <div className={cn("space-y-1", msg.role === "user" ? "max-w-[72%]" : "max-w-[80%]")}>
            <div
              className={cn(
                "relative overflow-hidden rounded-2xl text-sm",
                msg.role === "user"
                  ? "rounded-br-md px-4 py-2.5"
                  : "rounded-bl-md border border-border/15 bg-surface-1/60 px-4 py-3 text-foreground backdrop-blur-sm"
              )}
              style={
                msg.role === "user"
                  ? {
                      background:
                        "linear-gradient(135deg, hsl(var(--primary) / 0.18), hsl(var(--accent) / 0.12))",
                      border: "1px solid hsl(var(--primary) / 0.12)",
                    }
                  : undefined
              }
            >
              {msg.role === "assistant" ? (
                <div className="prose prose-sm prose-invert max-w-none [&_table]:text-xs [&_th]:px-2.5 [&_td]:px-2.5 [&_th]:py-1.5 [&_td]:py-1.5 [&_th]:border-b [&_th]:border-border/30 [&_th]:text-left [&_th]:font-semibold [&_th]:text-foreground/80 [&_td]:border-b [&_td]:border-border/10 [&_p]:leading-relaxed [&_li]:leading-relaxed [&_code]:text-primary [&_code]:bg-primary/8 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded-md [&_code]:text-xs [&_code]:font-mono [&_pre]:bg-surface-2/60 [&_pre]:border [&_pre]:border-border/20 [&_pre]:rounded-lg [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_h2]:text-sm [&_h2]:font-semibold [&_h2]:text-foreground [&_h2]:mt-3 [&_h2]:mb-1.5 [&_h3]:text-[13px] [&_h3]:font-semibold [&_h3]:text-foreground/90 [&_h3]:mt-2.5 [&_h3]:mb-1 [&_ul]:pl-4 [&_ol]:pl-4 [&_li]:text-foreground/75 [&_strong]:text-foreground/95">
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/35 to-transparent" />
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                  {msg.isStreaming && (
                    <motion.span
                      className="inline-block w-[2px] h-[14px] bg-primary ml-0.5 align-middle rounded-full"
                      animate={{ opacity: [1, 0.2, 1] }}
                      transition={{ duration: 0.7, repeat: Infinity }}
                    />
                  )}
                </div>
              ) : (
                <span className="text-foreground/90 leading-relaxed">{msg.content}</span>
              )}
            </div>
            <div className={cn("flex items-center gap-1 px-1", msg.role === "user" ? "justify-end" : "justify-start")}>
              <p className="text-[9px] text-muted-foreground/40">
                {msg.timestamp.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
              </p>
              {msg.role === "assistant" && !msg.isStreaming && msg.content && (
                <CopyButton content={msg.content} />
              )}
            </div>
          </div>
          {msg.role === "user" && (
            <div className="w-7 h-7 rounded-lg bg-surface-2/60 border border-border/20 flex items-center justify-center shrink-0 mt-1">
              <User className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
          )}
        </motion.div>
      ))}

      {/* Typing indicator */}
      {isTyping && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 pl-1">
          <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/15 flex items-center justify-center shrink-0">
            <Bot className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="flex items-center gap-1.5 px-4 py-3 rounded-2xl bg-surface-1/60 backdrop-blur-sm border border-border/15 rounded-bl-md">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-primary/50"
                animate={{ y: [0, -4, 0], opacity: [0.3, 1, 0.3] }}
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
