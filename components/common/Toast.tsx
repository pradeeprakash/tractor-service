"use client";

import { CheckCircle2, AlertCircle, X } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/cn";

type ToastVariant = "success" | "error" | "info";

type Toast = {
  id: number;
  message: string;
  variant: ToastVariant;
};

type ToastCtx = {
  push: (message: string, variant?: ToastVariant) => void;
};

const Ctx = createContext<ToastCtx | null>(null);

let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((message: string, variant: ToastVariant = "info") => {
    const id = nextId++;
    setToasts((t) => [...t, { id, message, variant }]);
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 2800);
  }, []);

  return (
    <Ctx.Provider value={{ push }}>
      {children}
      <div className="fixed top-4 left-0 right-0 z-50 flex flex-col items-center gap-2 px-4 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={cn(
              "pointer-events-auto flex items-center gap-2 rounded-full px-4 h-11 shadow-soft animate-fade-in",
              "max-w-md w-fit",
              t.variant === "success" && "bg-success text-white",
              t.variant === "error" && "bg-danger text-white",
              t.variant === "info" && "bg-ink text-white"
            )}
          >
            {t.variant === "success" && <CheckCircle2 className="w-5 h-5" />}
            {t.variant === "error" && <AlertCircle className="w-5 h-5" />}
            <span className="text-sm font-medium">{t.message}</span>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

export function ToastClose({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} aria-label="Dismiss" className="opacity-80 hover:opacity-100">
      <X className="w-4 h-4" />
    </button>
  );
}
