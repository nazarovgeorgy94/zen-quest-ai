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
      return "radial-gradient(ellipse at 50% 0%, hsl(0 70% 50% / 0.14) 0%, transparent 65%)";
    case "high":
      return "radial-gradient(ellipse at 50% 0%, hsl(25 80% 55% / 0.12) 0%, transparent 65%)";
    case "medium":
      return "radial-gradient(ellipse at 50% 0%, hsl(45 80% 55% / 0.10) 0%, transparent 65%)";
    default:
      return "radial-gradient(ellipse at 50% 0%, hsl(210 70% 55% / 0.08) 0%, transparent 65%)";
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
      <div className="shrink-0 border-b border-border/60 bg-surface-0/80 backdrop-blur-md relative z-10 overflow-hidden">
        <div className={cn("h-[2px] w-full shimmer-line", isDiagnosing && "shimmer-active")} />
        <div
          className="absolute inset-0 opacity-90"
          style={{
            background: `linear-gradient(90deg, ${colors.ambient} 0%, transparent 38%, transparent 62%, ${colors.ambient} 100%)`,
          }}
        />
        <div className="absolute inset-x-0 bottom-0 h-px bg-border/40" />

        <div className="relative px-6 py-3">
          <div className="grid gap-3 xl:grid-cols-[minmax(0,1.6fr)_minmax(24rem,0.9fr)] xl:items-stretch">
            <div
              className="relative overflow-hidden rounded-2xl border border-border/40 bg-surface-1/70"
              style={{ boxShadow: `inset 0 1px 0 hsl(var(--border) / 0.1), 0 0 0 1px hsl(var(--background) / 0.3)` }}
            >
              <div
                className="absolute inset-0 opacity-80"
                style={{
                  background: `linear-gradient(135deg, ${colors.ambient} 0%, transparent 48%), radial-gradient(circle at 0% 50%, ${colors.ambient} 0%, transparent 45%)`,
                }}
              />
              <div className="absolute left-0 top-0 h-full w-px bg-border/60" />
              <div className="relative p-3.5 lg:p-4">
                <div className="flex flex-wrap items-start gap-3">
                  <div className="relative mt-0.5 shrink-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/40 bg-surface-2/80">
                      <div className="relative">
                        <div className={cn("h-3 w-3 rounded-full", colors.dot)} />
                        {incident.status === "active" && (
                          <div className={cn("absolute inset-[-4px] rounded-full animate-ping opacity-25", colors.dot)} />
                        )}
                      </div>
                    </div>
                    <div
                      className="absolute inset-[-14px] rounded-[1.35rem] opacity-70"
                      style={{ background: `radial-gradient(circle, ${colors.ambient} 0%, transparent 72%)` }}
                    />
                  </div>

                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                      <span className="text-primary/90">Active Incident</span>
                      <span className="text-border">•</span>
                      <span className="font-mono text-foreground/80">{incident.id}</span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base font-semibold leading-tight text-foreground lg:text-lg xl:text-[1.35rem]">
                          {incident.title}
                        </h2>
                        <span className={cn("rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.18em]", colors.bg, colors.text)}>
                          {incident.severity}
                        </span>
                      </div>
                      <p className="max-w-4xl text-xs leading-relaxed text-foreground/78 line-clamp-2 lg:text-[13px]">
                        {incident.description}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
                      <div className="flex items-center gap-1.5 rounded-full border border-border/30 bg-surface-2/70 px-2 py-1">
                        <Clock className="h-3 w-3" />
                        <span>{getRelativeTime(incident.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 rounded-full border border-border/30 bg-surface-2/70 px-2 py-1">
                        <Server className="h-3 w-3" />
                        <span className="font-mono text-foreground/80">{incident.service}</span>
                      </div>
                      <div className="flex items-center gap-1.5 rounded-full border border-border/30 bg-surface-2/70 px-2 py-1">
                        <TrendingUp className="h-3 w-3 text-primary" />
                        <span>{incident.metrics?.length ? `${incident.metrics.length} live metrics` : "Monitoring active"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-3 space-y-1.5">
                  <div className="flex items-center justify-between text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
                    <span>Anomaly Signal</span>
                    <span>{isDiagnosing ? "Analysis in progress" : "Incident context locked"}</span>
                  </div>
                  <div className="relative h-1.5 overflow-hidden rounded-full bg-surface-3/80">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full"
                      style={{
                        width: incident.severity === "critical" ? "88%" : incident.severity === "high" ? "74%" : incident.severity === "medium" ? "56%" : "34%",
                        background: `linear-gradient(90deg, hsl(var(--primary) / 0.35), ${colors.stripe})`,
                      }}
                    />
                    <div
                      className="absolute inset-y-0 w-24 opacity-80"
                      style={{
                        left: incident.severity === "critical" ? "72%" : incident.severity === "high" ? "60%" : incident.severity === "medium" ? "42%" : "22%",
                        background: "linear-gradient(90deg, transparent, hsl(var(--foreground) / 0.22), transparent)",
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {incident.metrics && incident.metrics.length > 0 && (
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-3">
                {incident.metrics.map((m) => (
                  <div
                    key={m.label}
                    className="relative overflow-hidden rounded-xl border border-border/40 bg-surface-1/70 px-3 py-2.5"
                  >
                    <div
                      className="absolute inset-0 opacity-70"
                      style={{ background: `linear-gradient(135deg, ${colors.ambient} 0%, transparent 55%)` }}
                    />
                    <div className="relative flex items-center gap-2.5">
                      <div className="min-w-0 flex-1">
                        <p className="text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
                          {m.label}
                        </p>
                        <p className="mt-0.5 text-lg font-bold font-mono leading-none text-foreground">
                          {m.value}
                        </p>
                      </div>
                      {m.sparkline && (
                        <div className="rounded-lg border border-border/30 bg-surface-2/60 px-2 py-1.5">
                          <Sparkline
                            data={m.sparkline}
                            width={64}
                            height={18}
                            color={m.color || "hsl(var(--primary))"}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
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
