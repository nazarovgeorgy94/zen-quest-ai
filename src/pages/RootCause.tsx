import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import RCSidebar from "@/components/root-cause/RCSidebar";
import RCChat from "@/components/root-cause/RCChat";
import RCCommandCenter from "@/components/root-cause/RCCommandCenter";
import RCDiscovery from "@/components/root-cause/RCDiscovery";
import RCSearchModal from "@/components/root-cause/RCSearchModal";
import { mockIncidents } from "@/lib/mockIncidents";

type AppMode = "empty" | "discovery" | "diagnosis";

const INITIATION_DURATION_MS = 1350;

function AnalysisInitiationOverlay({ visible }: { visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="pointer-events-none absolute inset-0 z-30 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 50% 42%, hsl(var(--primary) / 0.12), transparent 30%), linear-gradient(180deg, hsl(var(--background) / 0.14), hsl(var(--background) / 0.68))",
            }}
            initial={{ opacity: 0.2 }}
            animate={{ opacity: [0.28, 0.72, 0.56] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          />

          <motion.div
            className="absolute inset-0 opacity-[0.16]"
            style={{
              backgroundImage:
                "linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)",
              backgroundSize: "56px 56px",
              maskImage: "radial-gradient(circle at center, black 35%, transparent 85%)",
            }}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: [0, 0.16, 0.08], scale: [0.96, 1, 1.02] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          />

          {Array.from({ length: 7 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute left-1/2 top-1/2 h-px origin-left"
              style={{
                width: `${150 + i * 42}px`,
                background:
                  i % 2 === 0
                    ? "linear-gradient(90deg, hsl(var(--primary) / 0.8), transparent)"
                    : "linear-gradient(90deg, hsl(var(--accent) / 0.55), transparent)",
                rotate: `${-48 + i * 16}deg`,
              }}
              initial={{ opacity: 0, scaleX: 0, x: -12, y: -1 }}
              animate={{ opacity: [0, 0.9, 0.18], scaleX: [0, 1, 1.04], x: [0, 4, 10] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, delay: 0.08 + i * 0.04, ease: [0.16, 1, 0.3, 1] }}
            />
          ))}

          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative flex h-40 w-40 items-center justify-center">
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  background:
                    "radial-gradient(circle, hsl(var(--primary) / 0.22), hsl(var(--accent) / 0.08), transparent 72%)",
                  filter: "blur(18px)",
                }}
                initial={{ opacity: 0, scale: 0.72 }}
                animate={{ opacity: [0.18, 0.95, 0.45], scale: [0.72, 1.12, 1.02] }}
                exit={{ opacity: 0, scale: 1.08 }}
                transition={{ duration: 1.05, ease: [0.16, 1, 0.3, 1] }}
              />
              <motion.div
                className="absolute inset-[24px] rounded-full"
                style={{
                  border: "1px solid hsl(var(--primary) / 0.35)",
                  background:
                    "radial-gradient(circle at 50% 50%, hsl(var(--primary) / 0.16), hsl(var(--surface-1) / 0.3) 58%, transparent 100%)",
                }}
                initial={{ opacity: 0, scale: 0.86, rotate: -16 }}
                animate={{ opacity: [0, 1, 0.7], scale: [0.86, 1.04, 1], rotate: [ -16, 0, 8 ] }}
                exit={{ opacity: 0, scale: 1.08 }}
                transition={{ duration: 0.95, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              />
              <motion.div
                className="absolute h-20 w-20 rounded-full"
                style={{ background: "hsl(var(--primary))", boxShadow: "0 0 24px hsl(var(--primary) / 0.45)" }}
                initial={{ opacity: 0, scale: 0.2 }}
                animate={{ opacity: [0, 1, 0.85], scale: [0.2, 0.38, 0.32] }}
                exit={{ opacity: 0, scale: 0.44 }}
                transition={{ duration: 0.65, delay: 0.16, ease: [0.34, 1.56, 0.64, 1] }}
              />
              <motion.div
                className="absolute h-3 w-3 rounded-full"
                style={{ background: "hsl(var(--background))" }}
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 1] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.28, delay: 0.32 }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const RootCause = () => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mode, setMode] = useState<AppMode>("empty");
  const [lastScanTime, setLastScanTime] = useState<Date | null>(null);
  const [scanComplete, setScanComplete] = useState(false);
  const [isInitiatingScan, setIsInitiatingScan] = useState(false);

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

  useEffect(() => {
    if (!isInitiatingScan) return;

    const timer = window.setTimeout(() => {
      setIsInitiatingScan(false);
    }, INITIATION_DURATION_MS);

    return () => window.clearTimeout(timer);
  }, [isInitiatingScan]);

  const handleStartScan = () => {
    setSelectedId(null);
    setScanComplete(false);
    setIsInitiatingScan(true);
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
          incidents={mockIncidents}
          selectedId={selectedId}
          onSelect={handleSelectIncident}
          onNewChat={handleNewChat}
          onOpenSearch={() => setSearchOpen(true)}
          lastScanTime={lastScanTime}
          isScanning={mode === "discovery" && !scanComplete}
          isInitiating={isInitiatingScan}
        />

        <div className="relative flex-1 overflow-hidden">
          <AnalysisInitiationOverlay visible={isInitiatingScan} />
          <AnimatePresence mode="wait">
          {mode === "empty" && (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02, filter: "blur(6px)" }}
              transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
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
              initial={{ opacity: 0, x: 18, scale: 0.985 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.55, delay: isInitiatingScan ? 0.2 : 0, ease: [0.16, 1, 0.3, 1] }}
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
