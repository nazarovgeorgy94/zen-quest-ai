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
} from "@/lib/mockIncidents";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface RCChatProps {
  incident: Incident | null;
  onStartScan: () => void;
  onSelectIncident: (id: string) => void;
}

const RCChat = ({ incident, onStartScan, onSelectIncident }: RCChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [diagnosisStep, setDiagnosisStep] = useState(-1);
  const [hypotheses, setHypotheses] = useState<Hypothesis[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [incidentSuggestion, setIncidentSuggestion] = useState<string | null>(
    null
  );
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const prevIncidentRef = useRef<string | null>(null);

  // Reset on incident change & auto-diagnose
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

  // Smart input: detect INC-XXXX pattern
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
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }, 100);
  };

  const startDiagnosis = async (inc: Incident) => {
    setIsDiagnosing(true);
    setMessages([]);
    setHypotheses([]);

    for (let i = 0; i < mockDiagnosisSteps.length; i++) {
      setDiagnosisStep(i);
      scrollToBottom();
      await new Promise((r) => setTimeout(r, mockDiagnosisSteps[i].duration));
    }

    const hyps = mockHypotheses[inc.id] || [
      {
        title: "Resource Constraint",
        confidence: 72,
        explanation:
          "Анализ указывает на ресурсное ограничение в одном из компонентов системы.",
        recommendation:
          "Проверить потребление ресурсов и масштабировать при необходимости.",
      },
    ];
    setHypotheses(hyps);
    setIsDiagnosing(false);
    setDiagnosisStep(-1);

    const summaryMsg: Message = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: `## Диагностика ${inc.id} завершена\n\nОбнаружено **${hyps.length} гипотез(ы)** возможной причины. Основная гипотеза: **${hyps[0].title}** с уверенностью ${hyps[0].confidence}%.\n\nЗадайте вопросы для более детального анализа.`,
    };
    setMessages([summaryMsg]);
    scrollToBottom();
  };

  const handleSend = async () => {
    // If user typed an incident ID, select it
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
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    scrollToBottom();

    setIsTyping(true);
    await new Promise((r) => setTimeout(r, 1500 + Math.random() * 2000));

    const aiContent = getMockAIResponse(incident.id, userMsg.content);
    const aiMsg: Message = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: aiContent,
    };
    setMessages((prev) => [...prev, aiMsg]);
    setIsTyping(false);
    scrollToBottom();
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
    <div className="flex-1 flex flex-col h-screen">
      {/* Header */}
      <div className="shrink-0 border-b border-border bg-surface-0/80 backdrop-blur-sm">
        <div
          className={cn(
            "h-[2px] w-full shimmer-line",
            isDiagnosing && "shimmer-active"
          )}
        />
        <div className="px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className={cn("w-3 h-3 rounded-full", colors.dot)} />
              {incident.status === "active" && (
                <div
                  className={cn(
                    "absolute inset-0 w-3 h-3 rounded-full animate-ping opacity-50",
                    colors.dot
                  )}
                />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-foreground">
                  {incident.id}
                </h2>
                <span
                  className={cn(
                    "text-[10px] font-medium uppercase px-2 py-0.5 rounded-full",
                    colors.bg,
                    colors.text
                  )}
                >
                  {incident.severity}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {incident.title}
              </p>
            </div>
            {incident.metrics && (
              <div className="ml-auto flex items-center gap-4">
                {incident.metrics.map((m) => (
                  <div key={m.label} className="text-right">
                    <p className="text-[10px] text-muted-foreground">
                      {m.label}
                    </p>
                    <p className="text-sm font-mono font-semibold text-foreground">
                      {m.value}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chat area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-6 py-6 space-y-4"
      >
        {/* Incident description card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-surface-1 border border-border/50"
        >
          <p className="text-sm text-foreground/80">{incident.description}</p>
        </motion.div>

        {/* Diagnosis steps */}
        {(isDiagnosing || hypotheses.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-surface-1/50 border border-border/30 space-y-3"
          >
            <div className="flex items-center gap-2 text-xs font-medium text-primary">
              <Activity className="w-3.5 h-3.5" />
              Диагностика
            </div>
            {mockDiagnosisSteps.map((step, i) => {
              const isActive = isDiagnosing && diagnosisStep === i;
              const isDone =
                !isDiagnosing || (isDiagnosing && diagnosisStep > i);
              return (
                <div key={i} className="flex items-center gap-3 pl-1">
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                  ) : isActive ? (
                    <Loader2 className="w-4 h-4 text-primary shrink-0 animate-spin" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-border shrink-0" />
                  )}
                  <div>
                    <p
                      className={cn(
                        "text-sm",
                        isDone || isActive
                          ? "text-foreground"
                          : "text-muted-foreground"
                      )}
                    >
                      {step.label}
                    </p>
                    {(isActive || isDone) && (
                      <p className="text-[11px] text-muted-foreground">
                        {step.detail}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}

        {/* Hypotheses cards */}
        <AnimatePresence>
          {hypotheses.map((hyp, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15 }}
              className={cn(
                "p-4 rounded-xl border",
                i === 0
                  ? "bg-primary/5 border-primary/20"
                  : "bg-surface-1 border-border/50"
              )}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                    i === 0 ? "bg-primary/15" : "bg-surface-2"
                  )}
                >
                  <Lightbulb
                    className={cn(
                      "w-4 h-4",
                      i === 0 ? "text-primary" : "text-muted-foreground"
                    )}
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-foreground">
                      {hyp.title}
                    </h3>
                    {/* Animated confidence bar */}
                    <div className="flex items-center gap-2 ml-auto">
                      <div className="w-16 h-1.5 rounded-full bg-surface-2 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${hyp.confidence}%` }}
                          transition={{ duration: 1, delay: i * 0.15 + 0.3 }}
                          className={cn(
                            "h-full rounded-full",
                            hyp.confidence >= 80
                              ? "bg-primary"
                              : hyp.confidence >= 50
                              ? "bg-yellow-500"
                              : "bg-muted-foreground"
                          )}
                        />
                      </div>
                      <span
                        className={cn(
                          "text-xs font-mono",
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
                  <p className="text-sm text-foreground/70 mt-1.5">
                    {hyp.explanation}
                  </p>
                  <div className="mt-3 flex items-start gap-2 p-2.5 rounded-lg bg-surface-0/60">
                    <ArrowRight className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                    <p className="text-xs text-foreground/80">
                      {hyp.recommendation}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Chat messages */}
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "flex",
              msg.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            <div
              className={cn(
                "max-w-[80%] rounded-2xl px-4 py-3 text-sm",
                msg.role === "user"
                  ? "bg-gradient-to-br from-primary/80 to-teal-accent/60 text-primary-foreground"
                  : "bg-surface-1 border border-border/30 text-foreground"
              )}
            >
              {msg.role === "assistant" ? (
                <div className="prose prose-sm prose-invert max-w-none [&_table]:text-xs [&_th]:px-2 [&_td]:px-2 [&_th]:py-1 [&_td]:py-1">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                msg.content
              )}
            </div>
          </motion.div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 text-muted-foreground text-sm pl-1"
          >
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Анализирую...
          </motion.div>
        )}
      </div>

      {/* Smart Input */}
      <div className="shrink-0 border-t border-border bg-surface-0/80 backdrop-blur-sm px-6 py-4">
        {/* Incident ID suggestion */}
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
                <span className="font-mono font-semibold text-primary">
                  {incidentSuggestion}
                </span>
                ?
              </span>
              <span className="text-[10px] text-muted-foreground ml-auto">
                Enter для подтверждения
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-end gap-3">
          {/* Scan button */}
          <button
            onClick={onStartScan}
            className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center bg-surface-1 border border-border/30 text-muted-foreground hover:text-primary hover:border-primary/20 hover:bg-primary/5 transition-all"
            title="Сканировать систему"
          >
            <Radar className="w-4 h-4" />
          </button>

          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isDiagnosing
                  ? "Дождитесь завершения диагностики..."
                  : "Задайте вопрос или введите INC-XXXX..."
              }
              disabled={isDiagnosing}
              rows={1}
              className="w-full resize-none rounded-xl bg-surface-1 border border-border/50 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/30 focus:ring-1 focus:ring-primary/20 transition-all disabled:opacity-50"
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim() || isDiagnosing}
            className={cn(
              "shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all",
              input.trim() && !isDiagnosing
                ? incidentSuggestion
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-surface-2 text-muted-foreground cursor-not-allowed"
            )}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default RCChat;
