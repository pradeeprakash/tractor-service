"use client";

import { Minus, Plus } from "lucide-react";
import { HOURS_STEP, MAX_HOURS, MIN_HOURS } from "@/lib/domain/pricing";
import { cn } from "@/lib/cn";
import { useT } from "@/lib/i18n/useT";

type Props = {
  value: number;
  onChange: (hours: number) => void;
  className?: string;
};

export function HoursStepper({ value, onChange, className }: Props) {
  const { t } = useT();
  const dec = () => onChange(Math.max(MIN_HOURS, +(value - HOURS_STEP).toFixed(1)));
  const inc = () => onChange(Math.min(MAX_HOURS, +(value + HOURS_STEP).toFixed(1)));

  return (
    <div className={cn("space-y-1.5", className)}>
      <span className="label">{t("service.hours")}</span>
      <div className="flex items-stretch gap-3">
        <button
          type="button"
          aria-label={t("service.decAria")}
          onClick={dec}
          disabled={value <= MIN_HOURS}
          className="w-14 h-14 rounded-2xl border border-border bg-surface flex items-center justify-center text-ink active:bg-bg disabled:opacity-40"
        >
          <Minus className="w-6 h-6" />
        </button>
        <div className="flex-1 h-14 rounded-2xl border border-border bg-surface flex items-center justify-center">
          <span className="text-3xl font-semibold tabular-nums">{value}</span>
          <span className="ml-2 text-ink-muted text-sm">{t("service.hr")}</span>
        </div>
        <button
          type="button"
          aria-label={t("service.incAria")}
          onClick={inc}
          disabled={value >= MAX_HOURS}
          className="w-14 h-14 rounded-2xl border border-border bg-surface flex items-center justify-center text-ink active:bg-bg disabled:opacity-40"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>
      <p className="text-xs text-ink-muted">{t("service.hoursHint")}</p>
    </div>
  );
}
