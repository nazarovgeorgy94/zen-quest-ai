import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Zap,
  Activity,
  CheckCircle2,
  Loader2,
  Lightbulb,
  ArrowRight,
  Radar,
  Shield,
  Clock,
  Server,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import {
  Incident,
  Hypothesis,
  getSeverityColor,
  mockDiagnosisSteps,
  mockHypotheses,
  getMockAIResponse,
  mockIncidents,
  getRelativeTime,
} from "@/lib/mockIncidents";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

interface RCChatProps {
  incident: Incident | null;
  onStartScan: () => void;
  onSelectIncident: (id: string) => void;
}

// Severity → ambient CSS gradient
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const prevIncidentRef = useRef<string | null>(null);
  const streamingRef = useRef(false);

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

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }, 100);
  };

  // Stream text character-by-character into a message
  const streamMessage = async (fullContent: string, msgId: string) => {
    streamingRef.current = true;
    const chars = [...fullContent];
    let shown = "";

    for (let c = 0; c < chars.length; c++) {
      if (!streamingRef.current) break;
      shown += chars[c];
      const partial = shown;
      setMessages((prev) =>
        prev.map((m) => (m.id === msgId ? { ...m, content: partial } : m))
      );
      // Faster for markdown headers/symbols, slower for regular text
      const ch = chars[c];
      const delay = ch === "\n" ? 30 : ch === "#" || ch === "*" || ch === "|" ? 8 : 12 + Math.random() * 14;
      await new Promise((r) => setTimeout(r, delay));
      if (c % 20 === 0) scrollToBottom();
    }

    // Mark as done streaming
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, isStreaming: false } : m))
    );
    streamingRef.current = false;
    scrollToBottom();
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

    // Sort hypotheses by confidence descending
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

    // Reveal hypotheses one by one
    for (let i = 0; i < hyps.length; i++) {
      setRevealedHypCount(i + 1);
      scrollToBottom();
      await new Promise((r) => setTimeout(r, 600));
    }

    await new Promise((r) => setTimeout(r, 300));

    // Stream the summary message
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
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
            {/* Severity indicator with glow */}
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

            {/* Info */}
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

            {/* Metrics as mini glassmorphic cards */}
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
          {/* Gradient border effect */}
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
                  ? "text-red-400"
                  : incident.severity === "high"
                  ? "text-orange-400"
                  : "text-primary"
              )}
            />
            <p className="text-sm text-foreground/80 leading-relaxed">{incident.description}</p>
          </div>
        </motion.div>

        {/* Diagnosis timeline */}
        {(isDiagnosing || hypotheses.length > 0) && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative">
            {/* Timeline header */}
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
                <Activity className="w-3.5 h-3.5 text-primary" />
              </div>
              <span className="text-xs font-semibold text-primary">Диагностика</span>
              {isDiagnosing && (
                <motion.span
                  className="text-[10px] text-muted-foreground ml-auto font-mono"
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  в процессе...
                </motion.span>
              )}
            </div>

            {/* Timeline with vertical line */}
            <div className="relative pl-[19px]">
              {/* Vertical line */}
              <div className="absolute left-[7px] top-0 bottom-0 w-px bg-border/50" />
              {isDiagnosing && (
                <motion.div
                  className="absolute left-[7px] top-0 w-px bg-primary/60"
                  initial={{ height: 0 }}
                  animate={{
                    height: `${((diagnosisStep + 1) / mockDiagnosisSteps.length) * 100}%`,
                  }}
                  transition={{ duration: 0.5 }}
                />
              )}
              {!isDiagnosing && hypotheses.length > 0 && (
                <div className="absolute left-[7px] top-0 bottom-0 w-px bg-primary/40" />
              )}

              <div className="space-y-4">
                {mockDiagnosisSteps.map((step, i) => {
                  const isActive = isDiagnosing && diagnosisStep === i;
                  const isDone = !isDiagnosing || (isDiagnosing && diagnosisStep > i);
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{
                        opacity: isDone || isActive ? 1 : 0.35,
                        x: 0,
                      }}
                      transition={{ duration: 0.4, delay: isDone ? 0 : 0.1 }}
                      className="flex items-start gap-3 relative"
                    >
                      {/* Dot on timeline */}
                      <div className="absolute left-[-19px] top-[3px]">
                        {isDone ? (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}>
                            <CheckCircle2 className="w-[15px] h-[15px] text-primary" />
                          </motion.div>
                        ) : isActive ? (
                          <div className="relative">
                            <Loader2 className="w-[15px] h-[15px] text-primary animate-spin" />
                            <div className="absolute inset-[-4px] rounded-full bg-primary/20 animate-ping" />
                          </div>
                        ) : (
                          <div className="w-[15px] h-[15px] rounded-full border-2 border-border/50 bg-surface-0" />
                        )}
                      </div>
                      <div>
                        <p className={cn("text-sm font-medium", isDone || isActive ? "text-foreground" : "text-muted-foreground")}>
                          {step.label}
                        </p>
                        <AnimatePresence>
                          {(isActive || isDone) && (
                            <motion.p
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              className="text-[11px] text-muted-foreground mt-0.5"
                            >
                              {step.detail}
                            </motion.p>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
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
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.3 + i * 0.15, ease: [0.16, 1, 0.3, 1] }}
                  className="relative rounded-xl overflow-hidden"
                >
                  {/* Gradient border for top hypothesis */}
                  <div
                    className={cn(
                      "absolute inset-0 rounded-xl",
                      i === 0 ? "opacity-100" : "opacity-0"
                    )}
                    style={{
                      background: "linear-gradient(135deg, hsl(158 72% 42% / 0.25), hsl(175 65% 38% / 0.15), transparent)",
                    }}
                  />
                  <div className={cn("absolute inset-[1px] rounded-[11px]", i === 0 ? "bg-surface-0/90" : "bg-surface-1")}>
                  </div>

                  <div className="relative p-4">
                    <div className="flex items-start gap-3">
                      {/* Confidence ring */}
                      <div className="relative w-12 h-12 shrink-0">
                        <svg viewBox="0 0 48 48" className="w-12 h-12 -rotate-90">
                          <circle cx="24" cy="24" r="20" fill="none" stroke="hsl(160 12% 15%)" strokeWidth="3" />
                          <motion.circle
                            cx="24"
                            cy="24"
                            r="20"
                            fill="none"
                            stroke={
                              hyp.confidence >= 80
                                ? "hsl(158 72% 42%)"
                                : hyp.confidence >= 50
                                ? "hsl(45 80% 55%)"
                                : "hsl(160 10% 40%)"
                            }
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeDasharray={`${2 * Math.PI * 20}`}
                            initial={{ strokeDashoffset: 2 * Math.PI * 20 }}
                            animate={{
                              strokeDashoffset: 2 * Math.PI * 20 * (1 - hyp.confidence / 100),
                            }}
                            transition={{ duration: 1.2, delay: 0.4 + i * 0.15, ease: "easeOut" }}
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span
                            className={cn(
                              "text-[11px] font-mono font-bold",
                              hyp.confidence >= 80
                                ? "text-primary"
                                : hyp.confidence >= 50
                                ? "text-yellow-400"
                                : "text-muted-foreground"
                            )}
                          >
                            {hyp.confidence}%
                          </span>
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Lightbulb
                            className={cn("w-3.5 h-3.5", i === 0 ? "text-primary" : "text-muted-foreground")}
                          />
                          <h3 className="text-sm font-semibold text-foreground">{hyp.title}</h3>
                          {i === 0 && (
                            <span className="text-[9px] uppercase px-1.5 py-0.5 rounded-full bg-primary/15 text-primary font-semibold">
                              Top
                            </span>
                          )}
                        </div>
                        <p className="text-[13px] text-foreground/65 mt-1.5 leading-relaxed">{hyp.explanation}</p>

                        {/* Recommendation */}
                        <div className="mt-3 flex items-start gap-2 p-2.5 rounded-lg bg-primary/[0.04] border border-primary/10">
                          <ArrowRight className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                          <p className="text-xs text-foreground/75 leading-relaxed">{hyp.recommendation}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat messages */}
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ease: [0.16, 1, 0.3, 1] }}
            className={cn("flex gap-3", msg.role === "user" ? "justify-end" : "justify-start")}
          >
            {msg.role === "assistant" && (
              <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/15 flex items-center justify-center shrink-0 mt-1">
                <Shield className="w-3.5 h-3.5 text-primary" />
              </div>
            )}
            <div className="max-w-[78%] space-y-1">
              <div
                className={cn(
                  "rounded-2xl px-4 py-3 text-sm",
                  msg.role === "user"
                    ? "bg-gradient-to-br from-primary/80 to-teal-accent/60 text-primary-foreground rounded-br-md"
                    : "bg-surface-1/80 backdrop-blur-sm border border-border/20 text-foreground rounded-bl-md"
                )}
              >
                {msg.role === "assistant" ? (
                  <div className="prose prose-sm prose-invert max-w-none [&_table]:text-xs [&_th]:px-2 [&_td]:px-2 [&_th]:py-1 [&_td]:py-1 [&_p]:leading-relaxed [&_li]:leading-relaxed">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                    {msg.isStreaming && (
                      <motion.span
                        className="inline-block w-[3px] h-[14px] bg-primary/70 ml-0.5 align-middle rounded-full"
                        animate={{ opacity: [1, 0, 1] }}
                        transition={{ duration: 0.6, repeat: Infinity }}
                      />
                    )}
                  </div>
                ) : (
                  msg.content
                )}
              </div>
              <p className={cn("text-[9px] text-muted-foreground/50 px-1", msg.role === "user" ? "text-right" : "text-left")}>
                {msg.timestamp.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </motion.div>
        ))}

        {/* Typing indicator — bouncing dots */}
        {isTyping && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 pl-1">
            <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/15 flex items-center justify-center shrink-0">
              <Shield className="w-3.5 h-3.5 text-primary" />
            </div>
            <div className="flex items-center gap-1 px-4 py-3 rounded-2xl bg-surface-1/80 backdrop-blur-sm border border-border/20 rounded-bl-md">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-primary/60"
                  animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Input area */}
      <div className="shrink-0 border-t border-border/50 bg-surface-0/60 backdrop-blur-md px-6 py-4 relative z-10">
        <AnimatePresence>
          {incidentSuggestion && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="mb-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/8 border border-primary/15 text-sm"
            >
              <Zap className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="text-foreground/80">
                Открыть инцидент{" "}
                <span className="font-mono font-semibold text-primary">{incidentSuggestion}</span>?
              </span>
              <span className="text-[10px] text-muted-foreground ml-auto">Enter</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-end gap-3">
          <button
            onClick={onStartScan}
            className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center bg-surface-1/60 backdrop-blur-sm border border-border/30 text-muted-foreground hover:text-primary hover:border-primary/20 hover:bg-primary/5 transition-all"
            title="Сканировать систему"
          >
            <Radar className="w-4 h-4" />
          </button>

          <div className="flex-1 relative group">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isDiagnosing ? "Дождитесь завершения диагностики..." : streamingRef.current ? "Агент печатает ответ..." : "Задайте вопрос или введите INC-XXXX..."}
              disabled={isDiagnosing || streamingRef.current}
              rows={1}
              className="w-full resize-none rounded-xl bg-surface-1/60 backdrop-blur-sm border border-border/40 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary/30 focus:ring-1 focus:ring-primary/15 transition-all disabled:opacity-40"
            />
            {/* Focus gradient underline */}
            <div className="absolute bottom-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-primary/0 to-transparent group-focus-within:via-primary/40 transition-all duration-500" />
          </div>

          <motion.button
            onClick={handleSend}
            disabled={!input.trim() || isDiagnosing}
            whileHover={input.trim() && !isDiagnosing ? { scale: 1.05 } : {}}
            whileTap={input.trim() && !isDiagnosing ? { scale: 0.95 } : {}}
            className={cn(
              "shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all",
              input.trim() && !isDiagnosing
                ? "text-primary-foreground shadow-lg"
                : "bg-surface-2/60 text-muted-foreground/40 cursor-not-allowed"
            )}
            style={
              input.trim() && !isDiagnosing
                ? {
                    background: "linear-gradient(135deg, hsl(158 72% 42%), hsl(175 65% 38%))",
                    boxShadow: "0 4px 15px -3px hsl(158 72% 42% / 0.35)",
                  }
                : undefined
            }
          >
            <Send className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default RCChat;
