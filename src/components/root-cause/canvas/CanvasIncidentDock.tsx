import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Plus, Search, Activity, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Incident } from "@/lib/rootCauseData";
import { getRelativeTime, getSeverityColor, getStatusLabel } from "@/lib/mockIncidents";

interface OverviewAction {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
}

interface Props {
  incidents: Incident[];
  selectedId: string | null;
  collapsed: boolean;
  onSelect: (id: string) => void;
  onToggleCollapse: () => void;
  onOpenSearch: () => void;
  overview?: OverviewAction;
}

export default function CanvasIncidentDock({
  incidents, selectedId, collapsed, onSelect, onToggleCollapse, onOpenSearch, overview,
}: Props) {
  const grouped = {
    active: incidents.filter((i) => i.status === "active"),
    investigating: incidents.filter((i) => i.status === "investigating"),
    resolved: incidents.filter((i) => i.status === "resolved"),
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 56 : 288 }}
      transition={{ type: "spring", stiffness: 300, damping: 32 }}
      className="relative z-30 h-screen shrink-0 border-r border-border/40 bg-surface-0/70 backdrop-blur-2xl flex flex-col"
    >
      {/* Header */}
      <div className="shrink-0 px-3 pt-16 pb-3 flex items-center gap-2">
        {!collapsed && (
          <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">
            Incidents · {incidents.length}
          </span>
        )}
        <button
          onClick={onToggleCollapse}
          className="ml-auto w-6 h-6 rounded-md hover:bg-surface-2/60 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className={cn("w-3.5 h-3.5 transition-transform", collapsed && "rotate-180")} />
        </button>
      </div>

      {/* Actions */}
      <div className="shrink-0 px-2 space-y-1.5 mb-3">
        <button
          onClick={onOpenSearch}
          className={cn(
            "w-full flex items-center gap-2 rounded-xl border border-border/40 bg-surface-1/60 hover:bg-surface-2/60 hover:border-primary/40 px-2.5 py-2 text-xs text-muted-foreground hover:text-foreground transition-all group",
            collapsed && "justify-center px-0"
          )}
        >
          <Search className="w-3.5 h-3.5 shrink-0 group-hover:text-primary" />
          {!collapsed && (
            <>
              <span className="truncate">Найти / создать</span>
              <kbd className="ml-auto text-[9px] font-mono text-muted-foreground/70 border border-border/40 rounded px-1 py-px">⌘K</kbd>
            </>
          )}
        </button>
        {overview && (
          <button
            onClick={overview.onClick}
            className={cn(
              "w-full flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 hover:bg-primary/15 px-2.5 py-2 text-xs text-primary transition-all",
              collapsed && "justify-center px-0"
            )}
          >
            <overview.icon className="w-3.5 h-3.5 shrink-0" />
            {!collapsed && <span>{overview.label}</span>}
          </button>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-4 scrollbar-thin">
        {(["active", "investigating", "resolved"] as const).map((bucket) => {
          const items = grouped[bucket];
          if (items.length === 0) return null;
          return (
            <div key={bucket}>
              {!collapsed && (
                <div className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground/60 px-2 mb-1.5">
                  {getStatusLabel(bucket)} · {items.length}
                </div>
              )}
              <div className="space-y-1">
                {items.map((inc) => {
                  const c = getSeverityColor(inc.severity);
                  const active = inc.id === selectedId;
                  return (
                    <button
                      key={inc.id}
                      onClick={() => onSelect(inc.id)}
                      className={cn(
                        "relative w-full text-left rounded-xl border transition-all overflow-hidden group",
                        active
                          ? "border-primary/50 bg-primary/10 shadow-[0_0_18px_hsl(var(--primary)/0.25)]"
                          : "border-transparent hover:border-border/50 hover:bg-surface-1/60"
                      )}
                    >
                      {active && (
                        <motion.div
                          layoutId="dock-active"
                          className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-gradient-to-b from-primary to-accent"
                        />
                      )}
                      <div className={cn("flex items-center gap-2.5 p-2", collapsed && "justify-center")}>
                        <div className="relative shrink-0">
                          <span className={cn("block w-2.5 h-2.5 rounded-full", c.dot)} />
                          {inc.status === "active" && (
                            <span className={cn("absolute inset-[-3px] rounded-full animate-ping opacity-40", c.dot)} />
                          )}
                        </div>
                        {!collapsed && (
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-[10px] text-muted-foreground">{inc.id}</span>
                              <span className={cn("text-[8px] uppercase tracking-wider px-1 py-0.5 rounded-sm", c.bg, c.text)}>
                                {inc.severity}
                              </span>
                            </div>
                            <div className={cn("text-xs font-medium truncate mt-0.5", active ? "text-foreground" : "text-foreground/85")}>
                              {inc.title}
                            </div>
                            <div className="text-[10px] text-muted-foreground mt-0.5 font-mono truncate">
                              {inc.service} · {getRelativeTime(inc.createdAt)}
                            </div>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </motion.aside>
  );
}
