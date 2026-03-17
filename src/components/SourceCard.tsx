import { motion } from "framer-motion";
import { FileText, Clock, ExternalLink } from "lucide-react";

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

const SourceCard = ({ sources, onSourceClick }: SourceCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="border-glow rounded-xl bg-card p-4 space-y-3"
    >
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
        <FileText className="w-3.5 h-3.5" />
        <span>Источники ({sources.length})</span>
      </div>
      <div className="space-y-2">
        {sources.map((source) => (
          <button
            key={source.id}
            onClick={() => onSourceClick?.(source)}
            className="w-full text-left flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors duration-200 group"
          >
            <span className="citation-tag shrink-0">{source.id}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                {source.title}
              </p>
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {source.lastUpdated}
                </span>
                <span className="text-primary/70">{source.relevance}% релевантность</span>
              </div>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        ))}
      </div>
    </motion.div>
  );
};

export default SourceCard;
