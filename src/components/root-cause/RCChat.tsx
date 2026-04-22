import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  Server,
  TrendingUp,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Incident,
  Hypothesis,
  getSeverityColor,
  mockDiagnosisSteps,
  mockHypotheses,
  mockFollowUpSuggestions,
  getMockAIResponse,
  mockIncidents,
  getRelativeTime,
} from "@/lib/mockIncidents";
import DiagnosisTimeline from "./DiagnosisTimeline";
import HypothesisCard from "./HypothesisCard";
import ChatMessageList, { Message } from "./ChatMessageList";
import ChatInput from "./ChatInput";
import FollowUpSuggestions from "./FollowUpSuggestions";
import Sparkline from "./Sparkline";
import IncidentCorrelation from "./IncidentCorrelation";

interface RCChatProps {
  incident: Incident | null;
  onStartScan: () => void;
  onSelectIncident: (id: string) => void;
}

function severityAmbient(severity: string) {
  switch (severity) {
    case "critical":
      return "radial-gradient(ellipse at 50% 0%, hsl(0 72% 52% / 0.18) 0%, transparent 58%), radial-gradient(circle at 50% 18%, hsl(8 78% 48% / 0.08) 0%, transparent 42%)";
    case "high":
      return "radial-gradient(ellipse at 50% 0%, hsl(25 84% 56% / 0.16) 0%, transparent 60%), radial-gradient(circle at 50% 20%, hsl(35 90% 52% / 0.06) 0%, transparent 40%)";
    case "medium":
      return "radial-gradient(ellipse at 50% 0%, hsl(45 82% 56% / 0.13) 0%, transparent 62%), radial-gradient(circle at 50% 18%, hsl(52 88% 52% / 0.05) 0%, transparent 38%)";
    default:
      return "radial-gradient(ellipse at 50% 0%, hsl(210 72% 55% / 0.11) 0%, transparent 62%), radial-gradient(circle at 50% 18%, hsl(200 76% 52% / 0.04) 0%, transparent 38%)";
  }
}

const RCChat = ({ incident, onStartScan, onSelectIncident }: RCChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [diagnosisStep, setDiagnosisStep] = useState(-1);
  const [hypotheses, setHypotheses] = useState<Hypothesis[]>([]);
  const [revealedHypCount, setRevealedHypCount] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [incidentSuggestion, setIncidentSuggestion] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [showFollowUps, setShowFollowUps] = useState(false);
  const [currentFollowUps, setCurrentFollowUps] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevIncidentRef = useRef<string | null>(null);
  const streamingRef = useRef(false);

  // Track scroll position
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const threshold = 80;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
    setIsNearBottom(atBottom);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    if (incident && incident.id !== prevIncidentRef.current) {
      prevIncidentRef.current = incident.id;
      setMessages([]);
      setHypotheses([]);
      setDiagnosisStep(-1);
      setIncidentSuggestion(null);
      startDiagnosis(incident);
    }
  }, [incident]);

  useEffect(() => {
    const match = input.match(/^(INC-\d{3,6})$/i);
    if (match) {
      const id = match[1].toUpperCase();
      const found = mockIncidents.find((i) => i.id === id);
      setIncidentSuggestion(found ? id : null);
    } else {
      setIncidentSuggestion(null);
    }
  }, [input]);

  const scrollToBottom = useCallback((force = false) => {
    if (!force && !isNearBottom) return;
    requestAnimationFrame(() => {
      const el = scrollRef.current;
      if (!el) return;
      el.scrollTo({ top: el.scrollHeight, behavior: force ? "instant" : "smooth" });
    });
  }, [isNearBottom]);

  const forceScrollToBottom = useCallback(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    setIsNearBottom(true);
  }, []);

  const streamMessage = async (fullContent: string, msgId: string) => {
    streamingRef.current = true;
    setIsStreaming(true);
    const chars = [...fullContent];
    let shown = "";

    for (let c = 0; c < chars.length; c++) {
      if (!streamingRef.current) break;
      shown += chars[c];
      const partial = shown;
      setMessages((prev) =>
        prev.map((m) => (m.id === msgId ? { ...m, content: partial } : m))
      );
      const ch = chars[c];
      const delay = ch === "\n" ? 30 : ch === "#" || ch === "*" || ch === "|" ? 8 : 12 + Math.random() * 14;
      await new Promise((r) => setTimeout(r, delay));
      if (c % 20 === 0) scrollToBottom();
    }

    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, isStreaming: false } : m))
    );
    streamingRef.current = false;
    setIsStreaming(false);
    scrollToBottom();

    // Show follow-up suggestions after streaming completes
    if (incident) {
      const followUps = mockFollowUpSuggestions[incident.id] || mockFollowUpSuggestions.default;
      setCurrentFollowUps(followUps);
      setShowFollowUps(true);
    }
  };

  const handleStopGeneration = () => {
    streamingRef.current = false;
    setIsStreaming(false);
  };

  const startDiagnosis = async (inc: Incident) => {
    setIsDiagnosing(true);
    setMessages([]);
    setHypotheses([]);
    setRevealedHypCount(0);

    for (let i = 0; i < mockDiagnosisSteps.length; i++) {
      setDiagnosisStep(i);
      scrollToBottom();
      await new Promise((r) => setTimeout(r, mockDiagnosisSteps[i].duration));
    }

    const hyps = (mockHypotheses[inc.id] || [
      {
        title: "Resource Constraint",
        confidence: 72,
        explanation: "Анализ указывает на ресурсное ограничение в одном из компонентов системы.",
        recommendation: "Проверить потребление ресурсов и масштабировать при необходимости.",
      },
    ]).sort((a, b) => b.confidence - a.confidence);

    setHypotheses(hyps);
    setIsDiagnosing(false);
    setDiagnosisStep(-1);

    for (let i = 0; i < hyps.length; i++) {
      setRevealedHypCount(i + 1);
      scrollToBottom();
      await new Promise((r) => setTimeout(r, 600));
    }

    await new Promise((r) => setTimeout(r, 300));

    const fullContent = `## Диагностика ${inc.id} завершена\n\nОбнаружено **${hyps.length} гипотез(ы)** возможной причины. Основная гипотеза: **${hyps[0].title}** с уверенностью ${hyps[0].confidence}%.\n\nЗадайте вопросы для более детального анализа.`;
    const msgId = crypto.randomUUID();
    const summaryMsg: Message = {
      id: msgId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
      isStreaming: true,
    };
    setMessages([summaryMsg]);
    scrollToBottom();
    await streamMessage(fullContent, msgId);
  };

  const handleSend = async () => {
    if (incidentSuggestion) {
      onSelectIncident(incidentSuggestion);
      setInput("");
      setIncidentSuggestion(null);
      return;
    }
    if (!input.trim() || !incident) return;
    setShowFollowUps(false);

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    scrollToBottom();

    setIsTyping(true);
    await new Promise((r) => setTimeout(r, 800 + Math.random() * 800));
    setIsTyping(false);

    const aiContent = getMockAIResponse(incident.id, userMsg.content);
    const msgId = crypto.randomUUID();
    const aiMsg: Message = {
      id: msgId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
      isStreaming: true,
    };
    setMessages((prev) => [...prev, aiMsg]);
    scrollToBottom();
    await streamMessage(aiContent, msgId);
  };

  const handleFollowUpSelect = (suggestion: string) => {
    setInput(suggestion);
    setShowFollowUps(false);
    // Auto-send
    setTimeout(() => {
      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content: suggestion,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);
      scrollToBottom();
      setIsTyping(true);
      setTimeout(async () => {
        setIsTyping(false);
        const aiContent = getMockAIResponse(incident!.id, suggestion);
        const msgId = crypto.randomUUID();
        const aiMsg: Message = {
          id: msgId,
          role: "assistant",
          content: "",
          timestamp: new Date(),
          isStreaming: true,
        };
        setMessages((prev) => [...prev, aiMsg]);
        scrollToBottom();
        await streamMessage(aiContent, msgId);
      }, 800 + Math.random() * 800);
    }, 50);
  };

  if (!incident) return null;

  const colors = getSeverityColor(incident.severity);

  return (
    <div className="flex-1 flex flex-col h-screen relative">
      {/* Severity ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none z-0 transition-all duration-1000"
        style={{ background: severityAmbient(incident.severity) }}
      />

      {/* Hero Incident Strip */}
      <div className="shrink-0 border-b border-border bg-surface-0/80 backdrop-blur-sm relative z-10 overflow-hidden">
        <div className={cn("h-[2px] w-full shimmer-line", isDiagnosing && "shimmer-active")} />
        <div
          className="absolute inset-0 opacity-90"
          style={{
            background: `linear-gradient(90deg, ${colors.ambient} 0%, transparent 38%, transparent 62%, ${colors.ambient} 100%)`,
          }}
        />
        <div className="absolute inset-x-0 bottom-0 h-px bg-border/40" />

        <div className="relative px-3 py-2 sm:px-4 sm:py-2.5 lg:px-6 lg:py-3">
          <div className="flex min-w-0 items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="relative mt-0.5 shrink-0">
                  <span className={cn("block h-2.5 w-2.5 rounded-full", colors.dot)} />
                  {incident.status === "active" && (
                    <span className={cn("absolute inset-[-3px] rounded-full animate-ping opacity-25", colors.dot)} />
                  )}
                </div>
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-semibold text-foreground sm:text-[15px]">
                    {incident.title}
                  </h2>
                  <div className="mt-0.5 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-muted-foreground">
                    <span className="font-mono text-foreground/80">{incident.id}</span>
                    <span className={cn("rounded-full px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-[0.14em]", colors.bg, colors.text)}>
                      {incident.severity}
                    </span>
                    <span className="hidden sm:inline-flex items-center gap-1">
                      <Server className="h-3 w-3" />
                      <span className="font-mono text-foreground/80">{incident.service}</span>
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{getRelativeTime(incident.createdAt)}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {incident.metrics && incident.metrics[0] && (
              <div className="shrink-0 rounded-lg border border-border/35 bg-surface-1/65 px-2 py-1 text-right">
                <p className="text-[8px] uppercase tracking-[0.14em] text-muted-foreground">
                  {incident.metrics[0].label}
                </p>
                <p className="mt-0.5 text-xs font-bold font-mono leading-none text-foreground sm:text-[13px]">
                  {incident.metrics[0].value}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chat area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto relative z-10">
        <div className="w-full px-6 py-5 space-y-4">
        {/* Diagnosis timeline */}
        {(isDiagnosing || hypotheses.length > 0) && (
          <DiagnosisTimeline
            steps={mockDiagnosisSteps}
            currentStep={diagnosisStep}
            isDiagnosing={isDiagnosing}
          />
        )}

        {/* Hypotheses */}
        <AnimatePresence>
          {hypotheses.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="space-y-3 pt-1"
            >
              <div className="flex items-center gap-2 mt-2">
                <TrendingUp className="w-3.5 h-3.5 text-primary" />
                <span className="text-[11px] font-semibold text-primary uppercase tracking-wider">
                  Гипотезы ({hypotheses.length})
                </span>
                {hypotheses[0] && (
                  <span className="ml-auto text-[10px] text-muted-foreground">
                    Lead confidence <span className="font-mono text-foreground/80">{hypotheses[0].confidence}%</span>
                  </span>
                )}
              </div>
              {hypotheses.slice(0, revealedHypCount).map((hyp, i) => (
                <HypothesisCard key={i} hypothesis={hyp} index={i} isTop={i === 0} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Multi-Incident Correlation */}
        {hypotheses.length > 0 && !isDiagnosing && (
          <IncidentCorrelation
            currentIncidentId={incident.id}
            incidents={mockIncidents}
          />
        )}

        {/* Chat messages */}
        <ChatMessageList messages={messages} isTyping={isTyping} />

        {/* Follow-up suggestions */}
        <AnimatePresence>
          {showFollowUps && !isStreaming && !isTyping && currentFollowUps.length > 0 && (
            <FollowUpSuggestions
              suggestions={currentFollowUps}
              onSelect={handleFollowUpSelect}
            />
          )}
        </AnimatePresence>
        </div>
      </div>

      {/* Scroll to bottom button */}
      <AnimatePresence>
        {!isNearBottom && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            onClick={forceScrollToBottom}
            className="absolute bottom-24 right-8 z-20 w-9 h-9 rounded-full bg-surface-2/90 backdrop-blur-sm border border-border/40 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-surface-3 shadow-lg transition-colors"
          >
            <ChevronDown className="w-4 h-4" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Input area */}
      <ChatInput
        input={input}
        setInput={setInput}
        onSend={handleSend}
        onStopGeneration={handleStopGeneration}
        onStartScan={onStartScan}
        isDiagnosing={isDiagnosing}
        isStreaming={isStreaming}
        incidentSuggestion={incidentSuggestion}
      />
    </div>
  );
};

export default RCChat;
