import { motion } from "framer-motion";
import { MessageSquare, Clock, Settings, Sparkles } from "lucide-react";

const historyItems = [
  "velocity_check_24h",
  "Порог блокировки CNP",
  "AML-мониторинг правила",
];

const SideNav = () => {
  return (
    <motion.aside
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="w-16 lg:w-64 shrink-0 h-screen bg-sidebar border-r border-sidebar-border flex flex-col"
    >
      {/* Logo */}
      <div className="p-4 lg:px-5 lg:py-5 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <span className="hidden lg:block text-sm font-semibold text-sidebar-foreground tracking-tight-custom">
            Knowledge Base
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1">
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-sidebar-accent text-sidebar-accent-foreground text-sm">
          <MessageSquare className="w-4 h-4 shrink-0" />
          <span className="hidden lg:block truncate">Новый запрос</span>
        </button>

        {/* History */}
        <div className="mt-6 hidden lg:block">
          <p className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            История
          </p>
          {historyItems.map((item) => (
            <button
              key={item}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sm transition-colors duration-200"
            >
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{item}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t border-sidebar-border">
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sm transition-colors duration-200">
          <Settings className="w-4 h-4 shrink-0" />
          <span className="hidden lg:block">Настройки</span>
        </button>
      </div>
    </motion.aside>
  );
};

export default SideNav;
