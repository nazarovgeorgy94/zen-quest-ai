import { motion } from "framer-motion";
import { FileText, Clock, ChevronRight } from "lucide-react";

interface Source {
  id: number;
  title: string;
  relevance: number;
  lastUpdated: string;
  type: string;
}

interface SourceCardProps {
  sources: Source[];
  onSourceClick?: (source: Source) => void;
}

const typeColors: Record<string, string> = {
  Rule: "bg-primary/15 text-primary",
  Wiki: "bg-accent/15 text-accent-foreground",
  Report: "bg-muted text-muted-foreground",
};

const SourceCard = ({ sources, onSourceClick }: SourceCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="pl-8"
    >
      <div className="flex items-center gap-1.5 mb-2 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
        <FileText className="w-3 h-3" />
        <span>{sources.length} источника</span>
      </div>
      
      {/* Horizontal scrollable source chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
        {sources.map((source, i) => (
          <motion.button
            key={source.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08, duration: 0.3 }}
            onClick={() => onSourceClick?.(source)}
            className="shrink-0 flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-card border border-border/60 hover:border-primary/25 transition-all duration-200 group max-w-[200px]"
          >
            <span className="citation-tag shrink-0 text-[10px] w-5 h-5 flex items-center justify-center">{source.id}</span>
            <div className="text-left min-w-0">
              <p className="text-[12px] font-medium text-foreground/90 truncate group-hover:text-primary transition-colors duration-200">
                {source.title}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-medium ${typeColors[source.type] || typeColors.Report}`}>
                  {source.type}
                </span>
                <span className="text-[10px] text-primary/60 font-medium">{source.relevance}%</span>
              </div>
            </div>
            <ChevronRight className="w-3 h-3 text-muted-foreground/40 group-hover:text-primary/60 transition-colors shrink-0" />
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};

export default SourceCard;
