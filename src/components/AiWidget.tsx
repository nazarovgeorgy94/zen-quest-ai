import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Minimize2 } from "lucide-react";
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
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages]);

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
            {/* Rotating gradient border ring */}
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full ai-btn-ring" />
              <button
                onClick={() => setIsOpen(true)}
                className="absolute inset-[2px] rounded-full bg-card flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 group"
              >
                <Sparkles className="w-6 h-6 text-primary transition-transform duration-500 group-hover:rotate-90 group-hover:scale-110" />
              </button>
              {/* Pulse ring */}
              <span className="absolute inset-0 rounded-full border-2 border-primary/30 animate-ping pointer-events-none" style={{ animationDuration: "2.5s" }} />
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
              className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
              className="fixed bottom-6 right-6 z-50 w-[460px] h-[680px] max-h-[calc(100vh-3rem)] rounded-2xl bg-background border border-border shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-card/50 backdrop-blur-xl">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-foreground tracking-tight-custom">Antifraud Assistant</h2>
                    <p className="text-xs text-muted-foreground">Knowledge Base AI</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setIsOpen(false)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors duration-200"
                  >
                    <Minimize2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => { setIsOpen(false); setMessages([]); }}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors duration-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Messages area */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-5">
                {isEmpty ? (
                  <div className="flex items-center justify-center min-h-[300px]">
                    <EmptyState onQuerySelect={handleQuery} />
                  </div>
                ) : (
                  <div className="space-y-6 pb-4">
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

              {/* Input */}
              <div className="px-4 pb-4 pt-2 border-t border-border bg-card/30 backdrop-blur-xl">
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
