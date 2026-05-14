import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, MessageSquare, CheckCircle2, AlertTriangle, Database, Server, Brain, ExternalLink, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CanvasNode {
  id: string;
  kind: "incident" | "thought" | "hypothesis" | "evidence" | "service" | "user-thought";
  label: string;
  sub?: string;
  confidence?: number;
  meta?: Record<string, string>;
}

const KIND_META: Record<CanvasNode["kind"], { icon: any; tint: string; label: string }> = {
  incident: { icon: AlertTriangle, tint: "text-red-400", label: "Incident" },
  thought: { icon: Brain, tint: "text-primary", label: "Reasoning step" },
  hypothesis: { icon: Sparkles, tint: "text-accent", label: "Hypothesis" },
  evidence: { icon: Database, tint: "text-cyan-400", label: "Evidence" },
  service: { icon: Server, tint: "text-emerald-400", label: "Service" },
  "user-thought": { icon: MessageSquare, tint: "text-primary", label: "User query" },
};

interface Props {
  node: CanvasNode | null;
  onClose: () => void;
  onAsk: (q: string) => void;
}

export default function CanvasNodeInspector({ node, onClose, onAsk }: Props) {
  return (
    <AnimatePresence>
      {node && (
        <motion.aside
          initial={{ x: 420, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 420, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 32 }}
          className="absolute right-0 top-0 h-full w-[380px] z-40 border-l border-border/40 bg-surface-0/85 backdrop-blur-2xl shadow-[-12px_0_40px_rgba(0,0,0,0.4)] flex flex-col"
        >
          <InspectorBody node={node} onClose={onClose} onAsk={onAsk} />
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

function InspectorBody({ node, onClose, onAsk }: { node: CanvasNode; onClose: () => void; onAsk: (q: string) => void }) {
  const meta = KIND_META[node.kind];
  const Icon = meta.icon;

  const actionsByKind: Record<CanvasNode["kind"], { label: string; q: string; icon: any }[]> = {
    incident: [
      { label: "Объясни инцидент", q: `Объясни корневую причину ${node.label}`, icon: Brain },
      { label: "Найди похожие", q: `Найди инциденты, похожие на ${node.label}`, icon: Sparkles },
    ],
    thought: [
      { label: "Развернуть рассуждение", q: `Развёрни шаг: ${node.label}`, icon: Brain },
      { label: "Альтернативные пути", q: `Какие альтернативы шагу ${node.label}?`, icon: Sparkles },
    ],
    hypothesis: [
      { label: "Проверить гипотезу", q: `Как проверить «${node.label}»?`, icon: Zap },
      { label: "Применить фикс", q: `Применить рекомендацию по «${node.label}»`, icon: CheckCircle2 },
    ],
    evidence: [
      { label: "Показать источник", q: `Покажи источник для ${node.label}`, icon: ExternalLink },
      { label: "Связать с гипотезой", q: `С какой гипотезой связано ${node.label}?`, icon: Sparkles },
    ],
    service: [
      { label: "Проверить здоровье", q: `Текущее состояние сервиса ${node.label}`, icon: Zap },
      { label: "История инцидентов", q: `Инциденты сервиса ${node.label} за неделю`, icon: AlertTriangle },
    ],
    "user-thought": [
      { label: "Уточнить", q: `Уточни ответ на «${node.label}»`, icon: MessageSquare },
    ],
  };

  return (
    <>
      <div className="shrink-0 flex items-center justify-between px-4 pt-4 pb-3 border-b border-border/30">
        <div className="flex items-center gap-2 min-w-0">
          <div className={cn("w-9 h-9 rounded-xl bg-surface-2/60 flex items-center justify-center", meta.tint)}>
            <Icon className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{meta.label}</div>
            <div className="text-sm font-semibold text-foreground truncate">{node.label}</div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-md hover:bg-surface-2/60 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {node.sub && (
          <div className="rounded-xl border border-border/30 bg-surface-1/50 p-3">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Контекст</div>
            <p className="text-sm text-foreground/90 leading-relaxed">{node.sub}</p>
          </div>
        )}

        {node.confidence !== undefined && (
          <div className="rounded-xl border border-accent/30 bg-accent/5 p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Уверенность модели</span>
              <span className="font-mono text-lg font-bold text-accent">{node.confidence}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-surface-3/60 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${node.confidence}%` }}
                transition={{ duration: 0.8 }}
                className="h-full bg-gradient-to-r from-primary to-accent"
              />
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2 text-[10px]">
              <div><div className="text-muted-foreground">KB match</div><div className="font-mono text-foreground">0.91</div></div>
              <div><div className="text-muted-foreground">Корреляции</div><div className="font-mono text-foreground">3</div></div>
              <div><div className="text-muted-foreground">Источников</div><div className="font-mono text-foreground">7</div></div>
            </div>
          </div>
        )}

        {node.meta && Object.keys(node.meta).length > 0 && (
          <div className="rounded-xl border border-border/30 bg-surface-1/50 p-3 space-y-1.5">
            {Object.entries(node.meta).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{k}</span>
                <span className="font-mono text-foreground/90">{v}</span>
              </div>
            ))}
          </div>
        )}

        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Действия агента</div>
          <div className="space-y-1.5">
            {actionsByKind[node.kind].map((a, i) => {
              const AIcon = a.icon;
              return (
                <button
                  key={i}
                  onClick={() => onAsk(a.q)}
                  className="w-full flex items-center gap-2 rounded-xl border border-border/30 bg-surface-1/40 hover:bg-primary/10 hover:border-primary/40 px-3 py-2.5 text-xs text-foreground/90 hover:text-primary transition-all group"
                >
                  <AIcon className="w-3.5 h-3.5 shrink-0" />
                  <span className="text-left flex-1">{a.label}</span>
                  <span className="opacity-0 group-hover:opacity-100 text-[10px] text-primary transition-opacity">→</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
