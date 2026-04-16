import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  Server,
  TrendingUp,
  AlertCircle,
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

interface RCChatProps {
  incident: Incident | null;
  onStartScan: () => void;
  onSelectIncident: (id: string) => void;
}

function severityAmbient(severity: string) {
  switch (severity) {
    case "critical":
      return "radial-gradient(ellipse at 50% 0%, hsl(0 60% 45% / 0.06) 0%, transparent 60%)";
    case "high":
      return "radial-gradient(ellipse at 50% 0%, hsl(25 70% 50% / 0.05) 0%, transparent 60%)";
    case "medium":
      return "radial-gradient(ellipse at 50% 0%, hsl(45 70% 50% / 0.04) 0%, transparent 60%)";
    default:
      return "radial-gradient(ellipse at 50% 0%, hsl(210 60% 50% / 0.03) 0%, transparent 60%)";
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
    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }, 100);
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
      scrollToBottom(true);
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
      scrollToBottom(true);
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
    scrollToBottom(true);
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

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    scrollToBottom(true);

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

  if (!incident) return null;

  const colors = getSeverityColor(incident.severity);

  return (
    <div className="flex-1 flex flex-col h-screen relative">
      {/* Severity ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none z-0 transition-all duration-1000"
        style={{ background: severityAmbient(incident.severity) }}
      />

      {/* Header */}
      <div className="shrink-0 border-b border-border bg-surface-0/70 backdrop-blur-md relative z-10">
        <div className={cn("h-[2px] w-full shimmer-line", isDiagnosing && "shimmer-active")} />
        <div className="px-6 py-3">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className={cn("w-3 h-3 rounded-full", colors.dot)} />
              {incident.status === "active" && (
                <div className={cn("absolute inset-[-3px] rounded-full animate-ping opacity-30", colors.dot)} />
              )}
              <div
                className="absolute inset-[-8px] rounded-full blur-md opacity-40"
                style={{
                  backgroundColor:
                    incident.severity === "critical"
                      ? "hsl(0 60% 50%)"
                      : incident.severity === "high"
                      ? "hsl(25 70% 50%)"
                      : "transparent",
                }}
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-foreground font-mono">{incident.id}</h2>
                <span className={cn("text-[9px] font-medium uppercase px-2 py-0.5 rounded-full", colors.bg, colors.text)}>
                  {incident.severity}
                </span>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground ml-2">
                  <Clock className="w-3 h-3" />
                  {getRelativeTime(incident.createdAt)}
                </div>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Server className="w-3 h-3" />
                  {incident.service}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{incident.title}</p>
            </div>

            {incident.metrics && (
              <div className="flex items-center gap-2">
                {incident.metrics.map((m) => (
                  <div
                    key={m.label}
                    className="px-3 py-1.5 rounded-lg bg-surface-1/60 backdrop-blur-sm border border-border/20"
                  >
                    <p className="text-[9px] text-muted-foreground">{m.label}</p>
                    <p className="text-xs font-mono font-bold text-foreground">{m.value}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chat area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-5 space-y-4 relative z-10">
        {/* Incident brief card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative p-4 rounded-xl overflow-hidden"
        >
          <div
            className="absolute inset-0 rounded-xl opacity-60"
            style={{
              background: `linear-gradient(135deg, ${
                incident.severity === "critical"
                  ? "hsl(0 50% 40% / 0.15)"
                  : incident.severity === "high"
                  ? "hsl(25 60% 45% / 0.12)"
                  : "hsl(158 72% 42% / 0.08)"
              }, transparent)`,
            }}
          />
          <div className="absolute inset-[1px] rounded-[11px] bg-surface-1/90 backdrop-blur-sm" />
          <div className="relative flex items-start gap-3">
            <AlertCircle
              className={cn(
                "w-4 h-4 mt-0.5 shrink-0",
                incident.severity === "critical"
                  ? "text-destructive"
                  : incident.severity === "high"
                  ? "text-warning"
                  : "text-primary"
              )}
            />
            <p className="text-sm text-foreground/80 leading-relaxed">{incident.description}</p>
          </div>
        </motion.div>

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
              className="space-y-3"
            >
              <div className="flex items-center gap-2 mt-2">
                <TrendingUp className="w-3.5 h-3.5 text-primary" />
                <span className="text-[11px] font-semibold text-primary uppercase tracking-wider">
                  Гипотезы ({hypotheses.length})
                </span>
              </div>
              {hypotheses.slice(0, revealedHypCount).map((hyp, i) => (
                <HypothesisCard key={i} hypothesis={hyp} index={i} isTop={i === 0} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat messages */}
        <ChatMessageList messages={messages} isTyping={isTyping} />
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
