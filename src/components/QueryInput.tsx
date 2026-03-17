import { useState } from "react";
import { Search, ArrowUp } from "lucide-react";
import { motion } from "framer-motion";

interface QueryInputProps {
  onSubmit: (query: string) => void;
  isProcessing?: boolean;
}

const QueryInput = ({ onSubmit, isProcessing }: QueryInputProps) => {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isProcessing) {
      onSubmit(query.trim());
      setQuery("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-[800px] mx-auto"
    >
      <form onSubmit={handleSubmit} className="relative">
        <div className="input-glow rounded-xl backdrop-blur-xl shadow-forest">
          <div className="flex items-center gap-3 px-5 py-4">
            <Search className="w-5 h-5 text-muted-foreground shrink-0" />
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="What would you like to extract from the collective intelligence?"
              className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground resize-none outline-none text-[15px] leading-relaxed max-h-32 min-h-[24px]"
              rows={1}
              disabled={isProcessing}
            />
            <button
              type="submit"
              disabled={!query.trim() || isProcessing}
              className="shrink-0 w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground disabled:opacity-30 transition-opacity duration-200 hover:opacity-90"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
        </div>
      </form>
    </motion.div>
  );
};

export default QueryInput;
