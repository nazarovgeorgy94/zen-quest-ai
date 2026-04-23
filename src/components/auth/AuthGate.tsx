import { ReactNode, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import AccessDenied from "@/pages/AccessDenied";

type AccessState = "checking" | "granted" | "denied";

interface AccessResponse {
  access?: boolean;
  message?: string;
}

interface AuthGateProps {
  children: ReactNode;
}

const AuthGate = ({ children }: AuthGateProps) => {
  const [status, setStatus] = useState<AccessState>("checking");
  const [message, setMessage] = useState<string | undefined>();

  useEffect(() => {
    const controller = new AbortController();

    const checkAccess = async () => {
      try {
        const response = await fetch("/api/user/self", {
          method: "GET",
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
          signal: controller.signal,
        });

        if (!response.ok) {
          if (response.status === 404) {
            setStatus("granted");
            return;
          }

          setStatus("denied");
          setMessage("Не удалось подтвердить доступ.");
          return;
        }

        const data = (await response.json()) as AccessResponse;

        if (data.access) {
          setStatus("granted");
          return;
        }

        setStatus("denied");
        setMessage(data.message || "У вас нет прав для доступа к приложению.");
      } catch (error) {
        if (controller.signal.aborted) return;

        setStatus("granted");
      }
    };

    checkAccess();

    return () => controller.abort();
  }, []);

  if (status === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-border bg-card shadow-sm">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">Проверяем доступ</p>
            <p className="text-xs text-muted-foreground">Запрашиваем права для текущего пользователя</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === "denied") {
    return <AccessDenied message={message} />;
  }

  return <>{children}</>;
};

export default AuthGate;