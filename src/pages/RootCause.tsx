import { useState, useEffect } from "react";
import RCSidebar from "@/components/root-cause/RCSidebar";
import RCChat from "@/components/root-cause/RCChat";
import RCSearchModal from "@/components/root-cause/RCSearchModal";
import { mockIncidents } from "@/lib/mockIncidents";

const RootCause = () => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);

  const selectedIncident =
    mockIncidents.find((i) => i.id === selectedId) || null;

  // Cmd+K shortcut
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

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Ambient background */}
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
          onSelect={setSelectedId}
          onNewChat={() => setSelectedId(null)}
          onOpenSearch={() => setSearchOpen(true)}
        />
        <RCChat incident={selectedIncident} />
      </div>

      <RCSearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        incidents={mockIncidents}
        onSelect={setSelectedId}
      />
    </div>
  );
};

export default RootCause;
