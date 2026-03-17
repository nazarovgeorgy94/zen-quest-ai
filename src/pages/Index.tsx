import AiWidget from "@/components/AiWidget";

const Index = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      {/* Demo host page — represents your antifraud platform */}
      <div className="text-center space-y-3">
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
