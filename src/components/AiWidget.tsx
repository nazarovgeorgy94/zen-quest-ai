import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Maximize2, Minimize2, ArrowDown, Plus, Sun, Moon, History, GripVertical } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { findBestMatch } from "@/lib/mockKnowledgeBase";
import { streamRAGResponse, isRAGAvailable } from "@/lib/ragService";
import QueryInput from "./QueryInput";
import EmptyState from "./EmptyState";
import ChatMessage from "./ChatMessage";
import ChatHistory, { type ChatSession } from "./ChatHistory";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: { id: number; title: string; relevance: number; lastUpdated: string; type: string }[];
  isStreaming?: boolean;
  statusText?: string;
  timestamp: Date;
  thinkingSteps?: string[];
  thinkingRevealed?: number;
  thinkingComplete?: boolean;
}

interface StoredSession {
  id: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

const generateSessionTitle = (messages: Message[]): string => {
  const firstUser = messages.find((m) => m.role === "user");
  if (!firstUser) return "Новый чат";
  const text = firstUser.content;
  return text.length > 40 ? text.slice(0, 40) + "…" : text;
};

const generateSessionPreview = (messages: Message[]): string => {
  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant" && m.content);
  if (!lastAssistant) return "Нет ответа";
  const stripped = lastAssistant.content.replace(/<[^>]*>/g, "").trim();
  return stripped.length > 60 ? stripped.slice(0, 60) + "…" : stripped;
};

interface AiWidgetProps {
  /** When true, widget fills its container — no FAB, no backdrop, no close button */
  embedded?: boolean;
}

const AiWidget = ({ embedded = false }: AiWidgetProps) => {
  const { theme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(embedded);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [widgetSize, setWidgetSize] = useState({ w: 480, h: 700 });
  const isResizing = useRef(false);
  const resizeStart = useRef({ x: 0, y: 0, w: 480, h: 700 });

  // Session management
  const [sessions, setSessions] = useState<StoredSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const prevMsgCountRef = useRef(0);

  // Save current messages into the active session
  const saveCurrentSession = useCallback(() => {
    if (!activeSessionId || messages.length === 0) return;
    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSessionId
          ? { ...s, messages: [...messages], updatedAt: new Date() }
          : s
      )
    );
  }, [activeSessionId, messages]);

  // Auto-save when messages change
  useEffect(() => {
    if (activeSessionId && messages.length > 0) {
      saveCurrentSession();
    }
  }, [messages, activeSessionId, saveCurrentSession]);

  const startNewChat = useCallback(() => {
    // Save current before starting new
    saveCurrentSession();
    const newId = Date.now().toString();
    const newSession: StoredSession = {
      id: newId,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newId);
    setMessages([]);
    setShowHistory(false);
  }, [saveCurrentSession]);

  const selectSession = useCallback((id: string) => {
    saveCurrentSession();
    const session = sessions.find((s) => s.id === id);
    if (session) {
      setActiveSessionId(id);
      setMessages([...session.messages]);
      setShowHistory(false);
    }
  }, [sessions, saveCurrentSession]);

  const deleteSession = useCallback((id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (activeSessionId === id) {
      setActiveSessionId(null);
      setMessages([]);
    }
  }, [activeSessionId]);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, []);

  const isAtBottomRef = useRef(true);
  const userScrolledAwayRef = useRef(false);
  const programmaticScrollRef = useRef(false);

  const checkScrollState = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const hasOverflow = scrollHeight > clientHeight + 10;
    const atBottom = scrollHeight - scrollTop - clientHeight < 60;
    isAtBottomRef.current = atBottom;
    setShowScrollBtn(hasOverflow && !atBottom);
    if (atBottom) {
      setUnreadCount(0);
      userScrolledAwayRef.current = false;
    }
    // If not at bottom and this wasn't a programmatic scroll, user scrolled away
    if (!atBottom && !programmaticScrollRef.current) {
      userScrolledAwayRef.current = true;
    }
    programmaticScrollRef.current = false;
  }, []);

  const scrollToBottomAuto = useCallback(() => {
    if (scrollRef.current) {
      programmaticScrollRef.current = true;
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "auto" });
    }
  }, []);

  // Auto-scroll when new messages are added
  useEffect(() => {
    const newCount = messages.length;
    const added = newCount - prevMsgCountRef.current;
    prevMsgCountRef.current = newCount;
    if (added > 0) {
      if (!userScrolledAwayRef.current) {
        scrollToBottomAuto();
      } else {
        setUnreadCount((prev) => prev + added);
      }
    }
    requestAnimationFrame(checkScrollState);
  }, [messages.length, scrollToBottomAuto, checkScrollState]);

  // Auto-scroll during streaming when user hasn't scrolled away
  useEffect(() => {
    if (!userScrolledAwayRef.current) {
      requestAnimationFrame(scrollToBottomAuto);
    }
  }, [messages, scrollToBottomAuto]);

  const handleQuery = (query: string) => {
    // Auto-create session if none active
    let currentSessionId = activeSessionId;
    if (!currentSessionId) {
      const newId = Date.now().toString();
      const newSession: StoredSession = {
        id: newId,
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setSessions((prev) => [newSession, ...prev]);
      setActiveSessionId(newId);
      currentSessionId = newId;
    }

    const now = new Date();
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: query, timestamp: now };
    const assistantId = (Date.now() + 1).toString();

    const assistantMsg: Message = {
      id: assistantId,
      role: "assistant",
      content: "",
      sources: undefined,
      isStreaming: true,
      statusText: "Анализирую запрос...",
      timestamp: new Date(now.getTime() + 1000),
      thinkingSteps: [
        "Генерация эмбеддинга запроса",
        "Поиск релевантных документов в базе знаний",
        "Формирование контекста для LLM",
      ],
      thinkingRevealed: 0,
      thinkingComplete: false,
    };
    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setIsProcessing(true);

    // Animate thinking steps
    const stepDelay = 600;
    [1, 2, 3].forEach((i) => {
      setTimeout(() => {
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, thinkingRevealed: i } : m))
        );
      }, stepDelay * i);
    });

    // Try RAG, fallback to mock
    if (isRAGAvailable()) {
      handleRAGQuery(query, assistantId, stepDelay);
    } else {
      handleMockQuery(query, assistantId, stepDelay);
    }
  };

  // Drip buffer for typing effect
  const dripBuffer = useRef<string>("");
  const dripTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const startDrip = useCallback((assistantId: string) => {
    if (dripTimer.current) return;
    dripTimer.current = setInterval(() => {
      if (dripBuffer.current.length === 0) return;
      const chunkSize = 3 + Math.floor(Math.random() * 6);
      const chunk = dripBuffer.current.slice(0, chunkSize);
      dripBuffer.current = dripBuffer.current.slice(chunkSize);
      setMessages((prev) =>
        prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + chunk } : m))
      );
    }, 20);
  }, []);

  const stopDrip = useCallback((assistantId: string) => {
    if (dripTimer.current) {
      clearInterval(dripTimer.current);
      dripTimer.current = null;
    }
    if (dripBuffer.current.length > 0) {
      const remaining = dripBuffer.current;
      dripBuffer.current = "";
      setMessages((prev) =>
        prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + remaining } : m))
      );
    }
  }, []);

  const handleRAGQuery = (query: string, assistantId: string, thinkingDelay: number) => {
    const thinkingDuration = thinkingDelay * 4;

    const history = messages
      .filter((m) => m.content)
      .slice(-6)
      .map((m) => ({ role: m.role, content: m.content.replace(/<[^>]*>/g, "") }));

    setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) => (m.id === assistantId ? { ...m, thinkingComplete: true, statusText: "Генерирую ответ..." } : m))
      );

      dripBuffer.current = "";
      startDrip(assistantId);

      streamRAGResponse(query, history, {
        onSources: (sources) => {
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, sources } : m))
          );
        },
        onDelta: (text) => {
          dripBuffer.current += text;
        },
        onDone: () => {
          const checkDrain = setInterval(() => {
            if (dripBuffer.current.length === 0) {
              clearInterval(checkDrain);
              stopDrip(assistantId);
              setMessages((prev) =>
                prev.map((m) => (m.id === assistantId ? { ...m, isStreaming: false, statusText: undefined } : m))
              );
              setIsProcessing(false);
            }
          }, 50);
        },
        onError: (error) => {
          console.warn("RAG failed, falling back to mock:", error);
          stopDrip(assistantId);
          handleMockQuery(query, assistantId, 0);
        },
      });
    }, thinkingDuration);
  };

  const handleMockQuery = (query: string, assistantId: string, thinkingDelay: number) => {
    const match = findBestMatch(query);
    const thinkingDuration = thinkingDelay * 4;

    setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, thinkingComplete: true, sources: match.sources, statusText: match.sourceText }
            : m
        )
      );
    }, thinkingDuration);

    // Simulate streaming
    const fullHtml = match.response;
    const chunkSize = 12;
    const totalChunks = Math.ceil(fullHtml.length / chunkSize);
    const startDelay = thinkingDuration + 600 + Math.random() * 400;

    setTimeout(() => {
      let currentChunk = 0;
      const interval = setInterval(() => {
        currentChunk++;
        let endIdx = Math.min(currentChunk * chunkSize, fullHtml.length);
        const partial = fullHtml.slice(0, endIdx);
        const openBrackets = (partial.match(/</g) || []).length;
        const closeBrackets = (partial.match(/>/g) || []).length;
        if (openBrackets > closeBrackets) {
          const nextClose = fullHtml.indexOf(">", endIdx);
          if (nextClose !== -1) endIdx = nextClose + 1;
        }
        const chunk = fullHtml.slice(0, endIdx);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: chunk, statusText: currentChunk >= totalChunks ? undefined : match.sourceText }
              : m
          )
        );
        if (endIdx >= fullHtml.length) {
          clearInterval(interval);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: fullHtml, isStreaming: false, statusText: undefined }
                : m
            )
          );
          setIsProcessing(false);
        }
      }, 30 + Math.random() * 20);
    }, startDelay);
  };

  // ── Resize handlers ──
  const handleResizeStart = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    isResizing.current = true;
    resizeStart.current = { x: e.clientX, y: e.clientY, w: widgetSize.w, h: widgetSize.h };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [widgetSize]);

  const handleResizeMove = useCallback((e: React.PointerEvent) => {
    if (!isResizing.current) return;
    const dx = resizeStart.current.x - e.clientX; // drag left = grow width
    const dy = resizeStart.current.y - e.clientY; // drag up = grow height
    setWidgetSize({
      w: Math.min(Math.max(resizeStart.current.w + dx, 360), window.innerWidth - 48),
      h: Math.min(Math.max(resizeStart.current.h + dy, 400), window.innerHeight - 48),
    });
  }, []);

  const handleResizeEnd = useCallback(() => {
    isResizing.current = false;
  }, []);

  const isEmpty = messages.length === 0;

  // Build ChatSession list for the history panel
  const chatSessions: ChatSession[] = sessions
    .filter((s) => s.messages.length > 0 || s.id === activeSessionId)
    .map((s) => {
      const msgs = s.id === activeSessionId ? messages : s.messages;
      return {
        id: s.id,
        title: generateSessionTitle(msgs),
        preview: generateSessionPreview(msgs),
        messageCount: msgs.length,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      };
    })
    .filter((s) => s.messageCount > 0);

  return (
    <>
      {/* Floating trigger button — hidden in embedded mode */}
      <AnimatePresence>
        {!isOpen && !embedded && (
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
              <div className="absolute inset-0 rounded-full ai-btn-ring opacity-80 group-hover:opacity-100 transition-opacity duration-300" />
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
              <button className="absolute inset-[2.5px] rounded-full bg-card/90 flex items-center justify-center transition-all duration-300 group-hover:bg-card/80 backdrop-blur-sm">
                <motion.div
                  animate={{ rotate: [0, 12, -12, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Sparkles className="w-[22px] h-[22px] text-primary transition-all duration-500 group-hover:rotate-90 group-hover:scale-110" />
                </motion.div>
              </button>
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
            {/* Backdrop — hidden in embedded mode */}
            {!embedded && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
                onClick={() => setIsOpen(false)}
              />
            )}

            <motion.div
              initial={embedded ? false : { opacity: 0, y: 30, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={embedded ? { opacity: 0 } : { opacity: 0, y: 30, scale: 0.96 }}
              transition={embedded ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 32 }}
              style={!embedded && !isFullscreen ? { width: widgetSize.w, height: widgetSize.h } : undefined}
              className={`bg-background/80 backdrop-blur-2xl border border-border/60 shadow-2xl flex flex-col overflow-hidden iridescent-border ${
                embedded
                  ? "w-full h-full rounded-none border-0"
                  : isFullscreen
                    ? "fixed z-50 inset-3 rounded-2xl transition-[inset] duration-300"
                    : "fixed z-50 bottom-6 right-6 max-h-[calc(100vh-3rem)] rounded-2xl"
              }`}
            >
              {/* Resize handle — top-left corner */}
              {!embedded && !isFullscreen && (
                  onPointerDown={handleResizeStart}
                  onPointerMove={handleResizeMove}
                  onPointerUp={handleResizeEnd}
                  onPointerCancel={handleResizeEnd}
                  className="absolute top-0 left-0 z-[60] w-8 h-8 flex items-center justify-center cursor-nwse-resize group touch-none"
                  title="Изменить размер"
                >
                  <GripVertical className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-muted-foreground/70 transition-colors duration-200 -rotate-45" />
                </div>
              )}
              <div className="aurora-mesh" />
              <div className="aurora-mesh-extra" />
              <div className="absolute inset-0 noise-overlay pointer-events-none" />
              <div className={`h-[2px] w-full shimmer-line relative z-10 ${isProcessing ? "shimmer-active" : ""}`} />

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
                    onClick={() => setShowHistory((v) => !v)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-200 ${
                      showHistory
                        ? "text-primary bg-primary/10"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                    }`}
                    title="История чатов"
                  >
                    <History className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={toggleTheme}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors duration-200"
                    title={theme === "dark" ? "Светлая тема" : "Тёмная тема"}
                  >
                    {theme === "dark" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={startNewChat}
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
                          thinkingSteps={msg.thinkingSteps}
                          thinkingRevealed={msg.thinkingRevealed}
                          thinkingComplete={msg.thinkingComplete}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <AnimatePresence>
                  {showScrollBtn && !isEmpty && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8, y: 8 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.8, y: 8 }}
                      transition={{ duration: 0.2 }}
                      onClick={() => { scrollToBottom(); setUnreadCount(0); }}
                      className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card/90 border border-primary/20 shadow-lg shadow-primary/10 hover:bg-primary/20 hover:border-primary/40 hover:shadow-primary/20 transition-all duration-200 group"
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

                {/* Chat history overlay */}
                <ChatHistory
                  sessions={chatSessions}
                  activeSessionId={activeSessionId}
                  isOpen={showHistory}
                  onSelect={selectSession}
                  onDelete={deleteSession}
                  onClose={() => setShowHistory(false)}
                />
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
