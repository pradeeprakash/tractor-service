"use client";

import { cn } from "@/lib/cn";
import { Money } from "@/components/common/Money";
import type { Tool, UUID } from "@/lib/domain/types";
import { useT } from "@/lib/i18n/useT";

type Props = {
  tools: Tool[];
  value: UUID | null;
  onChange: (id: UUID, tool: Tool) => void;
};

export function ToolPicker({ tools, value, onChange }: Props) {
  const { t } = useT();
  return (
    <div className="space-y-1.5">
      <span className="label">{t("service.tool")}</span>
      <div className="grid grid-cols-2 gap-2">
        {tools.map((it) => {
          const active = it.id === value;
          return (
            <button
              key={it.id}
              type="button"
              onClick={() => onChange(it.id, it)}
              className={cn(
                "h-14 rounded-2xl border px-4 text-left transition-colors active:scale-[0.99]",
                active
                  ? "border-primary bg-primary/5 text-ink"
                  : "border-border bg-surface text-ink hover:bg-bg"
              )}
              aria-pressed={active}
            >
              <p className="font-semibold leading-none">{it.name}</p>
              <p className="text-xs text-ink-muted mt-1 tabular-nums">
                <Money paise={it.rate_paise_per_hour} />
                {t("tool.perHourShort")}
              </p>
            </button>
          );
        })}
      </div>
      {tools.length === 0 && (
        <p className="text-sm text-ink-muted">{t("service.noActiveTools")}</p>
      )}
    </div>
  );
}
