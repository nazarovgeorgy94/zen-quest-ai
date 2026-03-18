import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Minimize2, RotateCcw, ArrowDown } from "lucide-react";
import QueryInput from "./QueryInput";
import EmptyState from "./EmptyState";
import ChatMessage from "./ChatMessage";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: { id: number; title: string; relevance: number; lastUpdated: string; type: string }[];
  isStreaming?: boolean;
  statusText?: string;
}

const mockSources = [
  { id: 1, title: "Policy Rule: velocity_check_24h", relevance: 96, lastUpdated: "10 марта 2026", type: "Rule" },
  { id: 2, title: "Fraud Detection Playbook — Section 3.1", relevance: 89, lastUpdated: "2 февраля 2026", type: "Wiki" },
  { id: 3, title: "Incident Report: Card-Not-Present Spike Q4", relevance: 74, lastUpdated: "15 января 2026", type: "Report" },
];

const mockResponse = `<p>Правило <strong>velocity_check_24h</strong> <span class="citation-tag">1</span> отслеживает количество транзакций с одного устройства или карты за скользящее окно в 24 часа. При превышении порога в 15 транзакций правило присваивает score +35 и генерирует алерт уровня <strong>HIGH</strong>.</p>

<h3>Условия срабатывания</h3>

<p>Согласно <strong>Fraud Detection Playbook</strong> <span class="citation-tag">2</span>, правило активируется при выполнении любого из условий:</p>
<p>• Более 15 транзакций с одного device_fingerprint за 24ч<br/>
• Более 5 уникальных получателей с одного аккаунта за 1ч<br/>
• Сумма транзакций превышает 500 000 ₽ за 6ч</p>

<p>По данным инцидент-репорта <span class="citation-tag">3</span>, после калибровки порогов в Q4 2025 false positive rate снизился с 12% до 4.3%, при этом detection rate вырос до 94%.</p>`;

const AiWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevMsgCountRef = useRef(0);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, []);

  const checkScrollState = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const hasOverflow = scrollHeight > clientHeight + 10;
    const atBottom = scrollHeight - scrollTop - clientHeight < 60;
    setShowScrollBtn(hasOverflow && !atBottom);
    if (atBottom) setUnreadCount(0);
  }, []);

  // Auto-scroll when new messages arrive and user is at bottom
  useEffect(() => {
    const newCount = messages.length;
    const added = newCount - prevMsgCountRef.current;
    prevMsgCountRef.current = newCount;

    if (added > 0) {
      if (isAtBottom) {
        scrollToBottom();
      } else {
        setUnreadCount((prev) => prev + added);
      }
    }
  }, [messages, isAtBottom, scrollToBottom]);

  const handleQuery = (query: string) => {
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: query };
    setMessages((prev) => [...prev, userMsg]);
    setIsProcessing(true);

    setTimeout(() => {
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "",
        sources: mockSources,
        isStreaming: true,
        statusText: "Анализ 3 источников...",
      };
      setMessages((prev) => [...prev, assistantMsg]);

      setTimeout(() => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsg.id
              ? { ...m, content: mockResponse, isStreaming: false, statusText: undefined }
              : m
          )
        );
        setIsProcessing(false);
      }, 1500);
    }, 800);
  };

  const isEmpty = messages.length === 0;

  return (
    <>
      {/* Floating trigger button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <div className="relative w-[60px] h-[60px] group cursor-pointer" onClick={() => setIsOpen(true)}>
              {/* Rotating conic gradient border */}
              <div className="absolute inset-0 rounded-full ai-btn-ring opacity-80 group-hover:opacity-100 transition-opacity duration-300" />
              
              {/* Glow effect */}
              <div className="absolute inset-[-4px] rounded-full bg-primary/20 blur-xl opacity-50 group-hover:opacity-80 transition-opacity duration-500" />
              
              {/* Inner button */}
              <button className="absolute inset-[2.5px] rounded-full bg-card flex items-center justify-center transition-all duration-300 group-hover:bg-card/90">
                <Sparkles className="w-[22px] h-[22px] text-primary transition-all duration-500 group-hover:rotate-90 group-hover:scale-110" />
              </button>
              
              {/* Pulse ring */}
              <span className="absolute inset-[-3px] rounded-full border border-primary/25 animate-ping pointer-events-none" style={{ animationDuration: "3s" }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Widget panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
              className="fixed bottom-6 right-6 z-50 w-[480px] h-[700px] max-h-[calc(100vh-3rem)] rounded-2xl bg-background border border-border/80 shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Gradient top accent line */}
              <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/60 bg-card/40 backdrop-blur-xl">
                <div className="flex items-center gap-3">
                  <div className="relative w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 ai-btn-ring opacity-30" />
                    <Sparkles className="w-[18px] h-[18px] text-primary relative z-10" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-foreground tracking-tight-custom leading-tight">Antifraud Assistant</h2>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                      <p className="text-[11px] text-muted-foreground">Knowledge Base AI</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={() => { setMessages([]); }}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors duration-200"
                    title="Новый чат"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors duration-200"
                    title="Свернуть"
                  >
                    <Minimize2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => { setIsOpen(false); setMessages([]); }}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors duration-200"
                    title="Закрыть"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Messages area */}
              <div className="relative flex-1">
                <div ref={scrollRef} onScroll={handleScroll} className="absolute inset-0 overflow-y-auto widget-scrollbar">
                  {isEmpty ? (
                    <div className="flex items-center justify-center px-5 py-6 min-h-full">
                      <EmptyState onQuerySelect={handleQuery} />
                    </div>
                  ) : (
                    <div className="space-y-5 px-5 py-5 pb-4">
                      {messages.map((msg) => (
                        <ChatMessage
                          key={msg.id}
                          role={msg.role}
                          content={msg.content}
                          sources={msg.sources}
                          isStreaming={msg.isStreaming}
                          statusText={msg.statusText}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Scroll to bottom button */}
                <AnimatePresence>
                  {!isAtBottom && !isEmpty && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8, y: 8 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.8, y: 8 }}
                      transition={{ duration: 0.2 }}
                      onClick={() => { scrollToBottom(); setUnreadCount(0); }}
                      className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card border border-border/60 shadow-lg hover:bg-secondary/80 transition-colors duration-200 group"
                    >
                      <ArrowDown className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
                      {unreadCount > 0 && (
                        <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                          {unreadCount}
                        </span>
                      )}
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>

              {/* Input */}
              <div className="px-4 pb-4 pt-2 border-t border-border/50 bg-gradient-to-t from-card/60 to-transparent backdrop-blur-xl">
                <QueryInput onSubmit={handleQuery} isProcessing={isProcessing} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default AiWidget;
