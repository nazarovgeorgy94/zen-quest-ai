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
      {/* Living background — noise + animated mesh + vignette */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Noise texture */}
        <div
          className="absolute inset-0 opacity-[0.025] mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundSize: "256px 256px",
          }}
        />
        {/* Animated mesh gradient orbs */}
        <motion.div
          className="absolute rounded-full blur-[150px]"
          style={{
            width: "clamp(500px, 45vw, 1100px)",
            height: "clamp(500px, 45vw, 1100px)",
            background: "conic-gradient(from 180deg, hsl(var(--primary) / 0.04), hsl(var(--accent) / 0.03), hsl(var(--cyan-pop) / 0.025), hsl(var(--primary) / 0.04))",
            top: "-25%", right: "-15%",
          }}
          animate={{
            rotate: [0, 360],
            scale: [1, 1.05, 0.98, 1],
          }}
          transition={{
            rotate: { duration: 60, repeat: Infinity, ease: "linear" },
            scale: { duration: 20, repeat: Infinity, ease: "easeInOut" },
          }}
        />
        <motion.div
          className="absolute rounded-full blur-[120px]"
          style={{
            width: "clamp(400px, 35vw, 850px)",
            height: "clamp(400px, 35vw, 850px)",
            background: "radial-gradient(circle, hsl(var(--accent) / 0.03), hsl(var(--primary) / 0.015), transparent 70%)",
            bottom: "-20%", left: "-10%",
          }}
          animate={{
            x: [0, 30, -20, 0],
            y: [0, -20, 15, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Vignette */}
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse at 50% 50%, transparent 40%, hsl(var(--background) / 0.6) 100%)",
          }}
        />
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
