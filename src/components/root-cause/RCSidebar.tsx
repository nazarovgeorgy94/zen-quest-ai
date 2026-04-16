import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, Zap, Clock, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Incident,
  getSeverityColor,
  getRelativeTime,
  getStatusLabel,
} from "@/lib/mockIncidents";
import { useState } from "react";

interface RCSidebarProps {
  incidents: Incident[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  onOpenSearch: () => void;
}

const RCSidebar = ({
  incidents,
  selectedId,
  onSelect,
  onNewChat,
  onOpenSearch,
}: RCSidebarProps) => {
  const [showResolved, setShowResolved] = useState(false);

  const active = incidents.filter((i) => i.status !== "resolved");
  const resolved = incidents.filter((i) => i.status === "resolved");

  return (
    <motion.aside
      initial={{ opacity: 0, x: -24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="w-72 shrink-0 h-screen bg-surface-0 border-r border-border flex flex-col"
    >
      {/* Logo */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
            <Zap className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-foreground tracking-tight">
              Root Cause Agent
            </h1>
            <p className="text-[10px] text-muted-foreground">
              Incident Diagnostics
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-3 space-y-2">
        <button
          onClick={onNewChat}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Новый инцидент
        </button>
        <button
          onClick={onOpenSearch}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-surface-1 hover:bg-surface-2 text-muted-foreground hover:text-foreground text-sm transition-colors"
        >
          <Search className="w-4 h-4" />
          <span className="flex-1 text-left">Поиск инцидентов</span>
          <kbd className="text-[10px] text-muted-foreground bg-surface-2 px-1.5 py-0.5 rounded font-mono">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Quick Stats */}
      <div className="px-3 pt-3 pb-1">
        <div className="flex items-center gap-2 px-2 py-2 rounded-lg bg-surface-1 border border-border/30">
          <div className="flex-1 text-center">
            <p className="text-lg font-semibold text-foreground font-mono">{active.length}</p>
            <p className="text-[9px] text-muted-foreground uppercase">Активных</p>
          </div>
          <div className="w-px h-8 bg-border/50" />
          <div className="flex-1 text-center">
            <p className="text-lg font-semibold text-red-400 font-mono">
              {incidents.filter((i) => i.severity === "critical" && i.status !== "resolved").length}
            </p>
            <p className="text-[9px] text-muted-foreground uppercase">Critical</p>
          </div>
          <div className="w-px h-8 bg-border/50" />
          <div className="flex-1 text-center">
            <p className="text-lg font-semibold text-foreground font-mono">{resolved.length}</p>
            <p className="text-[9px] text-muted-foreground uppercase">Решено</p>
          </div>
        </div>
      </div>

      {/* Active incidents */}
      <div className="flex-1 overflow-y-auto px-3 pb-3">
        <p className="px-2 pt-3 pb-2 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
          Активные ({active.length})
        </p>
        <div className="space-y-1">
          {active.map((inc) => (
            <IncidentItem
              key={inc.id}
              incident={inc}
              isSelected={selectedId === inc.id}
              onClick={() => onSelect(inc.id)}
            />
          ))}
        </div>

        {/* Resolved */}
        <button
          onClick={() => setShowResolved(!showResolved)}
          className="w-full flex items-center gap-2 px-2 pt-4 pb-2 text-[11px] font-medium text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
        >
          <ChevronDown
            className={cn(
              "w-3 h-3 transition-transform",
              showResolved && "rotate-180"
            )}
          />
          Решённые ({resolved.length})
        </button>
        <AnimatePresence>
          {showResolved && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="space-y-1 overflow-hidden"
            >
              {resolved.map((inc) => (
                <IncidentItem
                  key={inc.id}
                  incident={inc}
                  isSelected={selectedId === inc.id}
                  onClick={() => onSelect(inc.id)}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.aside>
  );
};

function IncidentItem({
  incident,
  isSelected,
  onClick,
}: {
  incident: Incident;
  isSelected: boolean;
  onClick: () => void;
}) {
  const colors = getSeverityColor(incident.severity);

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left px-3 py-2.5 rounded-lg transition-all duration-200 group",
        isSelected
          ? "bg-primary/10 border border-primary/20"
          : "hover:bg-surface-1 border border-transparent"
      )}
    >
      <div className="flex items-start gap-2.5">
        <div className="mt-1.5 relative">
          <div className={cn("w-2 h-2 rounded-full", colors.dot)} />
          {incident.status === "active" && (
            <div
              className={cn(
                "absolute inset-0 w-2 h-2 rounded-full animate-ping opacity-75",
                colors.dot
              )}
            />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-muted-foreground">
              {incident.id}
            </span>
            <span
              className={cn(
                "text-[9px] font-medium uppercase px-1.5 py-0.5 rounded-full",
                colors.bg,
                colors.text
              )}
            >
              {incident.severity}
            </span>
          </div>
          <p
            className={cn(
              "text-sm mt-0.5 truncate",
              isSelected ? "text-foreground font-medium" : "text-foreground/80"
            )}
          >
            {incident.title}
          </p>
          <div className="flex items-center gap-1.5 mt-1">
            <Clock className="w-3 h-3 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">
              {getRelativeTime(incident.createdAt)}
            </span>
            <span className="text-[10px] text-muted-foreground">
              · {incident.service}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

export default RCSidebar;
