import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import RCSidebar from "@/components/root-cause/RCSidebar";
import RCChat from "@/components/root-cause/RCChat";
import RCCommandCenter from "@/components/root-cause/RCCommandCenter";
import RCDiscovery from "@/components/root-cause/RCDiscovery";
import RCSearchModal from "@/components/root-cause/RCSearchModal";
import { mockIncidents } from "@/lib/mockIncidents";

type AppMode = "empty" | "discovery" | "diagnosis";

const RootCause = () => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mode, setMode] = useState<AppMode>("empty");
  const [lastScanTime, setLastScanTime] = useState<Date | null>(null);
  const [scanComplete, setScanComplete] = useState(false);

  const selectedIncident =
    mockIncidents.find((i) => i.id === selectedId) || null;

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
      <div className="fixed inset-0 pointer-events-none z-0">
        <div
          className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full blur-[120px]"
          style={{
            background:
              "conic-gradient(from 180deg, hsl(var(--primary) / 0.05), hsl(var(--accent) / 0.04), hsl(var(--cyan-pop) / 0.03), hsl(var(--primary) / 0.05))",
          }}
        />
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-teal-accent/[0.02] blur-[100px]" />
      </div>

      <div className="relative z-10 flex w-full">
        <RCSidebar
          incidents={mockIncidents}
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
              className="flex-1"
            >
              <RCChat
                incident={selectedIncident}
                onStartScan={handleStartScan}
                onSelectIncident={handleSelectIncident}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <RCSearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        incidents={mockIncidents}
        onSelect={handleSelectIncident}
      />
    </div>
  );
};

export default RootCause;
