interface AccessDeniedProps {
  message?: string;
}

const AccessDenied = ({ message }: AccessDeniedProps) => {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <section className="w-full max-w-md rounded-xl border border-border bg-card p-8 shadow-md">
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-destructive/30 bg-destructive/10 text-destructive">
            403
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Доступ запрещён</h1>
            <p className="text-sm leading-6 text-muted-foreground">
              {message || "У текущего пользователя нет прав для открытия приложения."}
            </p>
          </div>
        </div>
      </section>
    </main>
  );
};

export default AccessDenied;