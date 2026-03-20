import { motion, AnimatePresence } from "framer-motion";
import { Clock, MessageSquare, Trash2, X } from "lucide-react";

export interface ChatSession {
  id: string;
  title: string;
  preview: string;
  messageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface ChatHistoryProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  isOpen: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

const formatRelativeTime = (date: Date) => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "только что";
  if (minutes < 60) return `${minutes} мин назад`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ч назад`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "вчера";
  if (days < 7) return `${days} дн назад`;
  return date.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
};

const ChatHistory = ({ sessions, activeSessionId, isOpen, onSelect, onDelete, onClose }: ChatHistoryProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: "-100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "-100%", opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 35 }}
          className="absolute inset-0 z-20 flex flex-col bg-background/90 backdrop-blur-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-primary/15">
            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">История чатов</h3>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors duration-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Sessions list */}
          <div className="flex-1 overflow-y-auto widget-scrollbar p-2.5 space-y-1">
            {sessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-6 gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-primary/50" />
                </div>
                <p className="text-sm text-muted-foreground/70">Нет сохранённых чатов</p>
                <p className="text-xs text-muted-foreground/50">Начните диалог — он появится здесь</p>
              </div>
            ) : (
              sessions.map((session, i) => (
                <motion.button
                  key={session.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  onClick={() => onSelect(session.id)}
                  className={`group w-full text-left px-3 py-2.5 rounded-xl transition-all duration-200 relative ${
                    activeSessionId === session.id
                      ? "bg-primary/12 border border-primary/20"
                      : "hover:bg-secondary/60 border border-transparent"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className={`text-[13px] font-medium truncate ${
                        activeSessionId === session.id ? "text-primary" : "text-foreground/90"
                      }`}>
                        {session.title}
                      </p>
                      <p className="text-[11px] text-muted-foreground/60 truncate mt-0.5">
                        {session.preview}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[10px] text-muted-foreground/50">
                          {formatRelativeTime(session.updatedAt)}
                        </span>
                        <span className="text-[10px] text-muted-foreground/40">
                          · {session.messageCount} сообщ.
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDelete(session.id); }}
                      className="shrink-0 w-6 h-6 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-all duration-200 mt-0.5"
                      title="Удалить"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </motion.button>
              ))
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ChatHistory;
