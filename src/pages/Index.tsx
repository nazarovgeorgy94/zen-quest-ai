import { useState, useRef, useEffect } from "react";
import SideNav from "@/components/SideNav";
import QueryInput from "@/components/QueryInput";
import EmptyState from "@/components/EmptyState";
import ChatMessage from "@/components/ChatMessage";

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

const Index = () => {
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

    // Simulate scanning phase
    setTimeout(() => {
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "",
        sources: mockSources,
        isStreaming: true,
        statusText: "Синтез 3 документов...",
      };
      setMessages((prev) => [...prev, assistantMsg]);

      // Simulate streaming completion
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
    <div className="flex h-screen overflow-hidden bg-background">
      <SideNav />

      {/* Main area — The Forge */}
      <main className="flex-1 flex flex-col min-w-0">
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-6 lg:px-12 py-8"
        >
          <div className="max-w-[800px] mx-auto">
            {isEmpty ? (
              <div className="flex items-center justify-center min-h-[60vh]">
                <EmptyState onQuerySelect={handleQuery} />
              </div>
            ) : (
              <div className="space-y-8 pb-32">
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
        </div>

        {/* Floating input */}
        <div className="sticky bottom-0 px-6 lg:px-12 pb-6 pt-2 bg-gradient-to-t from-background via-background to-transparent">
          <QueryInput onSubmit={handleQuery} isProcessing={isProcessing} />
        </div>
      </main>
    </div>
  );
};

export default Index;
