import AiWidget from "@/components/AiWidget";

const Index = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
      {/* Subtle ambient aurora on host page */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-primary/[0.04] blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-teal-accent/[0.03] blur-[100px]" />
      </div>

      {/* Demo host page */}
      <div className="text-center space-y-3 relative z-10">
        <h1 className="text-2xl font-semibold text-foreground tracking-tight-custom">
          Antifraud Platform
        </h1>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          Нажмите на кнопку <span className="text-primary font-medium">AI Intelligence</span> в правом нижнем углу, чтобы открыть ассистента по базе знаний.
        </p>
      </div>

      <AiWidget />
    </div>
  );
};

export default Index;
