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
    setMode("discovery");
  };

  const handleScanComplete = () => {
    setLastScanTime(new Date());
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
              "conic-gradient(from 180deg, hsl(158 72% 42% / 0.05), hsl(175 65% 38% / 0.04), hsl(185 70% 45% / 0.03), hsl(158 72% 42% / 0.05))",
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
          isScanning={mode === "discovery"}
        />

        {mode === "empty" && (
          <RCCommandCenter
            onStartScan={handleStartScan}
            onSelectIncident={handleSelectIncident}
            onHighlightSidebar={() => setSearchOpen(true)}
          />
        )}
        {mode === "discovery" && (
          <RCDiscovery
            onSelectIncident={handleSelectIncident}
            onCancel={handleNewChat}
            onScanComplete={handleScanComplete}
          />
        )}
        {mode === "diagnosis" && (
          <RCChat
            incident={selectedIncident}
            onStartScan={handleStartScan}
            onSelectIncident={handleSelectIncident}
          />
        )}
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
