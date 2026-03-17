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
  { id: 1, title: "Политика удалённой работы 2026.pdf", relevance: 94, lastUpdated: "12 марта 2026", type: "PDF" },
  { id: 2, title: "HR Handbook — Раздел 4.2", relevance: 87, lastUpdated: "5 февраля 2026", type: "Wiki" },
  { id: 3, title: "Протокол совещания руководства Q1", relevance: 72, lastUpdated: "28 января 2026", type: "Doc" },
];

const mockResponse = `<p>Согласно актуальной <strong>Политике удалённой работы</strong> <span class="citation-tag">1</span>, сотрудники имеют право на гибридный формат — до 3 дней удалённой работы в неделю при согласовании с непосредственным руководителем.</p>

<h3>Ключевые положения</h3>

<p>Процедура оформления описана в <strong>HR Handbook</strong> <span class="citation-tag">2</span>: необходимо подать заявку через внутренний портал не позднее чем за 5 рабочих дней. Руководитель обязан рассмотреть заявку в течение 48 часов.</p>

<p>Важно учитывать, что по итогам совещания руководства <span class="citation-tag">3</span>, с апреля 2026 планируется расширение программы до 4 дней для сотрудников с рейтингом эффективности выше 85%.</p>`;

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
