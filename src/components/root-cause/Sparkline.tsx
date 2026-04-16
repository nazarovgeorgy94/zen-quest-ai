import { motion } from "framer-motion";
import { useMemo } from "react";

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  showDot?: boolean;
}

const Sparkline = ({ data, width = 60, height = 20, color = "hsl(var(--primary))", showDot = true }: SparklineProps) => {
  const { path, lastPoint, areaPath } = useMemo(() => {
    if (data.length < 2) return { path: "", lastPoint: { x: 0, y: 0 }, areaPath: "" };

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const padY = 3;

    const points = data.map((v, i) => ({
      x: (i / (data.length - 1)) * width,
      y: padY + ((max - v) / range) * (height - padY * 2),
    }));

    // Smooth curve using catmull-rom → cubic bezier approximation
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(0, i - 1)];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(points.length - 1, i + 2)];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }

    const last = points[points.length - 1];
    const area = `${d} L ${width} ${height} L 0 ${height} Z`;

    return { path: d, lastPoint: last, areaPath: area };
  }, [data, width, height]);

  if (data.length < 2) return null;

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={`sparkGrad-${color.replace(/[^a-z0-9]/gi, '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.2} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>

      {/* Area fill */}
      <motion.path
        d={areaPath}
        fill={`url(#sparkGrad-${color.replace(/[^a-z0-9]/gi, '')})`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      />

      {/* Line */}
      <motion.path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      />

      {/* Last point dot */}
      {showDot && (
        <motion.circle
          cx={lastPoint.x}
          cy={lastPoint.y}
          r={2}
          fill={color}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 1.0, duration: 0.3, type: "spring" }}
        />
      )}

      {/* Pulse on last point */}
      {showDot && (
        <motion.circle
          cx={lastPoint.x}
          cy={lastPoint.y}
          r={2}
          fill="none"
          stroke={color}
          strokeWidth={1}
          initial={{ scale: 1, opacity: 0.6 }}
          animate={{ scale: [1, 2.5, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 2, repeat: Infinity, delay: 1.2 }}
        />
      )}
    </svg>
  );
};

export default Sparkline;
