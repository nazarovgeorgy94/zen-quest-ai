import AiWidget from "@/components/AiWidget";

/**
 * Standalone embed page — renders the AI widget inline, filling the entire viewport.
 * Use via iframe: <iframe src="https://your-domain.com/embed" />
 */
const Embed = () => {
  return (
    <div className="w-screen h-screen bg-background overflow-hidden">
      <AiWidget embedded />
    </div>
  );
};

export default Embed;
