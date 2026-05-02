import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Props = {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({ icon, title, description, action, className }: Props) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center py-16 px-6 gap-3",
        className
      )}
    >
      {icon && (
        <div className="w-14 h-14 rounded-full bg-bg flex items-center justify-center text-ink-muted">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-ink">{title}</h3>
      {description && <p className="text-ink-muted max-w-sm">{description}</p>}
      {action && <div className="mt-2 relative z-10">{action}</div>}
    </div>
  );
}
