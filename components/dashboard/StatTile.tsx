import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Props = {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: "default" | "danger" | "success" | "primary";
  icon?: ReactNode;
};

export function StatTile({ label, value, hint, tone = "default", icon }: Props) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-ink-muted uppercase tracking-wider">{label}</p>
        {icon && <span className="text-ink-muted">{icon}</span>}
      </div>
      <p
        className={cn(
          "mt-1 text-2xl font-semibold tabular-nums",
          tone === "danger" && "text-danger",
          tone === "success" && "text-success",
          tone === "primary" && "text-primary"
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-0.5 text-xs text-ink-muted">{hint}</p>}
    </div>
  );
}
