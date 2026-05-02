"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";
import { useT } from "@/lib/i18n/useT";

type Props = {
  title: string;
  subtitle?: string;
  back?: string;
  actions?: ReactNode;
};

export function PageHeader({ title, subtitle, back, actions }: Props) {
  const { t } = useT();
  return (
    <header className="sticky top-0 z-10 bg-bg/85 backdrop-blur border-b border-border">
      <div className="mx-auto max-w-3xl px-4 py-3 flex items-center gap-2">
        {back && (
          <Link
            href={back}
            aria-label={t("common.back")}
            className="-ml-2 w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface text-ink"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-semibold leading-tight text-ink truncate">{title}</h1>
          {subtitle && <p className="text-sm text-ink-muted truncate">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}
