import { Link, useLocation } from "react-router-dom";
import { MessageSquare, Network, BookOpen } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const MODES = [
  { path: "/root-cause", label: "Chat", icon: MessageSquare },
  { path: "/root-cause/canvas", label: "Canvas", icon: Network },
  { path: "/root-cause/playbook", label: "Playbook", icon: BookOpen },
];

export default function RCModeSwitcher() {
  const { pathname } = useLocation();
  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50">
      <div className="relative flex items-center gap-1 rounded-full border border-border/50 bg-surface-1/80 backdrop-blur-xl p-1 shadow-lg shadow-black/30">
        {MODES.map((m) => {
          const active = pathname === m.path;
          const Icon = m.icon;
          return (
            <Link
              key={m.path}
              to={m.path}
              className={cn(
                "relative flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider transition-colors",
                active ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {active && (
                <motion.span
                  layoutId="rc-mode-pill"
                  className="absolute inset-0 rounded-full bg-gradient-to-br from-primary to-primary/70 shadow-[0_0_18px_hsl(var(--primary)/0.45)]"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
              <span className="relative flex items-center gap-1.5">
                <Icon className="w-3 h-3" />
                {m.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
