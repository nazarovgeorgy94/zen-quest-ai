import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import RCSidebar from "@/components/root-cause/RCSidebar";
import RCChat from "@/components/root-cause/RCChat";
import RCCommandCenter from "@/components/root-cause/RCCommandCenter";
import RCDiscovery from "@/components/root-cause/RCDiscovery";
import RCSearchModal from "@/components/root-cause/RCSearchModal";
import RCAgentWorkspace from "@/components/root-cause/RCAgentWorkspace";
import RCCausalCanvas from "@/components/root-cause/RCCausalCanvas";
import { mockIncidents } from "@/lib/mockIncidents";
import type { Incident } from "@/lib/rootCauseData";
import { MessageSquare, Network, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type AppMode = "empty" | "discovery" | "diagnosis";
type DiagnosisView = "chat" | "workspace" | "canvas";

const RootCause = () => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mode, setMode] = useState<AppMode>("empty");
  const [lastScanTime, setLastScanTime] = useState<Date | null>(null);
  const [scanComplete, setScanComplete] = useState(false);
  const [extraIncidents, setExtraIncidents] = useState<Incident[]>([]);
  const [diagnosisView, setDiagnosisView] = useState<DiagnosisView>("chat");

  const allIncidents = [...extraIncidents, ...mockIncidents];
  const selectedIncident =
    allIncidents.find((i) => i.id === selectedId) || null;

  useEffect(() => {
    if (selectedId) setMode("diagnosis");
  }, [selectedId]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleStartScan = () => {
    setSelectedId(null);
    setScanComplete(false);
    setMode("discovery");
  };

  const handleScanComplete = () => {
    setLastScanTime(new Date());
    setScanComplete(true);
  };

  const handleSelectIncident = (id: string) => {
    setSelectedId(id);
    setMode("diagnosis");
  };

  const handleNewChat = () => {
    setSelectedId(null);
    setMode("empty");
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Living background — статичные градиенты вместо blur+rotate (производительность) */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Noise texture */}
        <div
          className="absolute inset-0 opacity-[0.02] mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundSize: "256px 256px",
          }}
        />
        {/* Static aurora — без blur, без анимации, дёшево для GPU */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 80% 0%, hsl(var(--primary) / 0.06), transparent 70%), radial-gradient(ellipse 50% 40% at 10% 100%, hsl(var(--accent) / 0.05), transparent 70%)",
          }}
        />
        {/* Vignette */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 50% 50%, transparent 50%, hsl(var(--background) / 0.5) 100%)",
          }}
        />
      </div>

      <div className="relative z-10 flex w-full">
        <RCSidebar
          incidents={allIncidents}
          selectedId={selectedId}
          onSelect={handleSelectIncident}
          onNewChat={handleNewChat}
          onOpenSearch={() => setSearchOpen(true)}
          lastScanTime={lastScanTime}
          isScanning={mode === "discovery" && !scanComplete}
        />

        <AnimatePresence mode="wait">
          {mode === "empty" && (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="flex-1"
            >
              <RCCommandCenter
                onStartScan={handleStartScan}
                onSelectIncident={handleSelectIncident}
                onHighlightSidebar={() => setSearchOpen(true)}
              />
            </motion.div>
          )}
          {mode === "discovery" && (
            <motion.div
              key="discovery"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="flex-1"
            >
              <RCDiscovery
                onSelectIncident={handleSelectIncident}
                onCancel={handleNewChat}
                onScanComplete={handleScanComplete}
              />
            </motion.div>
          )}
          {mode === "diagnosis" && (
            <motion.div
              key="diagnosis"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="flex-1 relative"
            >
              {/* View switcher */}
              <div className="absolute top-2.5 right-3 z-30 flex items-center gap-1 rounded-full border border-border/50 bg-surface-1/80 backdrop-blur-md p-0.5 shadow-lg">
                {([
                  { id: "chat", icon: MessageSquare, label: "Chat" },
                  { id: "workspace", icon: Sparkles, label: "Agents" },
                  { id: "canvas", icon: Network, label: "Canvas" },
                ] as const).map((v) => {
                  const active = diagnosisView === v.id;
                  const Icon = v.icon;
                  return (
                    <button
                      key={v.id}
                      onClick={() => setDiagnosisView(v.id)}
                      className={cn(
                        "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all",
                        active
                          ? "bg-primary/20 text-primary"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                      title={v.label}
                    >
                      <Icon className="w-3 h-3" />
                      <span className="hidden sm:inline">{v.label}</span>
                    </button>
                  );
                })}
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={diagnosisView}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="h-full"
                >
                  {diagnosisView === "chat" && (
                    <RCChat
                      incident={selectedIncident}
                      onStartScan={handleStartScan}
                      onSelectIncident={handleSelectIncident}
                    />
                  )}
                  {diagnosisView === "workspace" && (
                    <RCAgentWorkspace incident={selectedIncident} />
                  )}
                  {diagnosisView === "canvas" && (
                    <RCCausalCanvas incident={selectedIncident} />
                  )}
                </motion.div>
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <RCSearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        incidents={allIncidents}
        onSelect={handleSelectIncident}
        onCreateIncident={(inc) => {
          setExtraIncidents((prev) =>
            prev.find((p) => p.id === inc.id) ? prev : [inc, ...prev]
          );
          setSelectedId(inc.id);
          setMode("diagnosis");
        }}
      />
    </div>
  );
};

export default RootCause;
