import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Maximize2, Minimize2, ArrowDown, Plus, Sun, Moon } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { findBestMatch } from "@/lib/mockKnowledgeBase";
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
  timestamp: Date;
}

const AiWidget = () => {
  const { theme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
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

  // Auto-scroll when new messages arrive
  useEffect(() => {
    const newCount = messages.length;
    const added = newCount - prevMsgCountRef.current;
    prevMsgCountRef.current = newCount;

    if (added > 0) {
      if (!showScrollBtn) {
        scrollToBottom();
      } else {
        setUnreadCount((prev) => prev + added);
      }
    }
    // Re-check after DOM update
    requestAnimationFrame(checkScrollState);
  }, [messages, showScrollBtn, scrollToBottom, checkScrollState]);

  const handleQuery = (query: string) => {
    const now = new Date();
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: query, timestamp: now };
    const assistantId = (Date.now() + 1).toString();
    const assistantMsg: Message = {
      id: assistantId,
      role: "assistant",
      content: "",
      sources: undefined,
      isStreaming: true,
      statusText: "Думаю...",
      timestamp: new Date(now.getTime() + 1000),
    };
    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setIsProcessing(true);

    // Simulate sources appearing
    setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, sources: mockSources, statusText: "Анализ 3 источников..." }
            : m
        )
      );
    }, 800);

    // Simulate response
    setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: mockResponse, isStreaming: false, statusText: undefined }
            : m
        )
      );
      setIsProcessing(false);
    }, 2000);
  };

  const isEmpty = messages.length === 0;

  return (
    <>
      {/* Floating trigger button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0, rotate: -180 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 0, opacity: 0, rotate: 180 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <motion.div
              className="relative w-[60px] h-[60px] group cursor-pointer"
              onClick={() => setIsOpen(true)}
              whileHover={{ scale: 1.12 }}
              whileTap={{ scale: 0.88 }}
              transition={{ type: "spring", stiffness: 500, damping: 15 }}
            >
              {/* Rotating conic gradient border */}
              <div className="absolute inset-0 rounded-full ai-btn-ring opacity-80 group-hover:opacity-100 transition-opacity duration-300" />

              {/* Multi-layer glow — enhanced */}
              <motion.div
                className="absolute inset-[-8px] rounded-full pointer-events-none"
                style={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.3), hsl(var(--teal-accent) / 0.15), transparent 70%)" }}
                animate={{ opacity: [0.4, 0.8, 0.4], scale: [1, 1.2, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                className="absolute inset-[-4px] rounded-full pointer-events-none blur-xl"
                style={{ background: "radial-gradient(circle, hsl(var(--cyan-pop) / 0.2), transparent 60%)" }}
                animate={{ opacity: [0.2, 0.5, 0.2], scale: [0.9, 1.1, 0.9] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              />

              {/* Inner button */}
              <button className="absolute inset-[2.5px] rounded-full bg-card/90 flex items-center justify-center transition-all duration-300 group-hover:bg-card/80 backdrop-blur-sm">
                <motion.div
                  animate={{ rotate: [0, 12, -12, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Sparkles className="w-[22px] h-[22px] text-primary transition-all duration-500 group-hover:rotate-90 group-hover:scale-110" />
                </motion.div>
              </button>

              {/* Pulse rings */}
              <motion.span
                className="absolute inset-[-4px] rounded-full border border-primary/20 pointer-events-none"
                animate={{ scale: [1, 1.5], opacity: [0.4, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut" }}
              />
              <motion.span
                className="absolute inset-[-4px] rounded-full border border-accent/15 pointer-events-none"
                animate={{ scale: [1, 1.7], opacity: [0.3, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeOut", delay: 1.2 }}
              />
            </motion.div>
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
              className={`fixed z-50 bg-background/80 backdrop-blur-2xl border border-border/60 shadow-2xl flex flex-col overflow-hidden iridescent-border ${
                isFullscreen
                  ? "inset-3 rounded-2xl transition-[inset] duration-300"
                  : "bottom-6 right-6 w-[480px] h-[700px] max-h-[calc(100vh-3rem)] rounded-2xl"
              }`}
            >
              {/* Aurora mesh background */}
              <div className="aurora-mesh" />
              <div className="aurora-mesh-extra" />

              {/* Noise texture */}
              <div className="absolute inset-0 noise-overlay pointer-events-none" />

              {/* Shimmer top accent line */}
              <div className="h-[2px] w-full shimmer-line relative z-10" />

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-primary/15 bg-surface-elevated/60 backdrop-blur-2xl relative z-10 refraction-highlight">
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
                <div className="flex items-center gap-1">
                  <button
                    onClick={toggleTheme}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors duration-200"
                    title={theme === "dark" ? "Светлая тема" : "Тёмная тема"}
                  >
                    {theme === "dark" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => setMessages([])}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors duration-200"
                    title="Новый чат"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setIsFullscreen((f) => !f)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors duration-200"
                    title={isFullscreen ? "Свернуть" : "На весь экран"}
                  >
                    {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => { setIsOpen(false); setIsFullscreen(false); }}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors duration-200"
                    title="Закрыть"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Messages area */}
              <div className="relative flex-1">
                <div ref={scrollRef} onScroll={checkScrollState} className="absolute inset-0 overflow-y-auto widget-scrollbar">
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
                          timestamp={msg.timestamp}
                          onAction={handleQuery}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Scroll to bottom button */}
                <AnimatePresence>
                  {showScrollBtn && !isEmpty && (
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
              <div className="px-4 pb-4 pt-2 border-t border-primary/15 bg-surface-elevated/60 backdrop-blur-2xl relative z-10">
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
