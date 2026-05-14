import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface AgentOrbProps {
  active: boolean;
  size?: number;
  intensity?: number; // 0..1
}

/**
 * Neural orb with EEG-style waveform showing the agent's "thinking intensity".
 * When active: pulsing rings + animated waveform + particle glow.
 */
export default function AgentOrb({ active, size = 56, intensity = 0.7 }: AgentOrbProps) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setTick((t) => t + 1), 80);
    return () => clearInterval(id);
  }, [active]);

  const points = Array.from({ length: 24 }).map((_, i) => {
    const phase = (i / 24) * Math.PI * 4 + tick * 0.18;
    const amp = active ? 6 + Math.sin(phase * 0.8) * 4 * intensity : 1;
    const y = size / 2 + Math.sin(phase) * amp;
    return `${(i / 23) * size},${y}`;
  });

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
    >
      {/* outer halo */}
      <motion.div
        className="absolute inset-[-6px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, hsl(var(--primary) / 0.35), transparent 65%)",
          filter: "blur(8px)",
        }}
        animate={{ opacity: active ? [0.5, 0.9, 0.5] : 0.35 }}
        transition={{ duration: 1.6, repeat: Infinity }}
      />
      {/* core */}
      <div
        className="absolute inset-0 rounded-full overflow-hidden"
        style={{
          background:
            "radial-gradient(circle at 30% 30%, hsl(var(--primary) / 0.9), hsl(var(--accent) / 0.6) 60%, hsl(var(--primary) / 0.2))",
          boxShadow:
            "inset 0 0 18px hsl(var(--primary) / 0.45), 0 0 28px hsl(var(--primary) / 0.35)",
        }}
      >
        {/* EEG line */}
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="absolute inset-0"
          preserveAspectRatio="none"
        >
          <polyline
            points={points.join(" ")}
            fill="none"
            stroke="hsl(var(--primary-foreground))"
            strokeOpacity={active ? 0.9 : 0.4}
            strokeWidth={1.2}
            strokeLinecap="round"
          />
        </svg>
        {/* highlight */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "radial-gradient(circle at 35% 25%, hsl(var(--primary-foreground) / 0.55), transparent 40%)",
          }}
        />
      </div>
      {/* pulse rings */}
      {active && (
        <>
          {[0, 1].map((i) => (
            <motion.span
              key={i}
              className="absolute inset-0 rounded-full border border-primary/50"
              animate={{ scale: [1, 1.6], opacity: [0.55, 0] }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                delay: i * 0.6,
                ease: "easeOut",
              }}
            />
          ))}
        </>
      )}
    </div>
  );
}
