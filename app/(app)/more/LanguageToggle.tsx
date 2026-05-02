"use client";

import { Languages } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { useT, type Locale } from "@/lib/i18n/useT";

export function LanguageToggle() {
  const { locale, setLocale, t } = useT();
  const router = useRouter();

  function choose(l: Locale) {
    setLocale(l);
    // Server-rendered headers/titles read the cookie; refresh so they re-render.
    router.refresh();
  }

  return (
    <div className="card p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-bg flex items-center justify-center text-ink">
          <Languages className="w-5 h-5" />
        </div>
        <span className="font-medium">{t("settings.language")}</span>
      </div>
      <div
        role="radiogroup"
        aria-label={t("settings.language")}
        className="grid grid-cols-2 gap-2"
      >
        <Choice
          active={locale === "ta"}
          onClick={() => choose("ta")}
          label="தமிழ்"
        />
        <Choice
          active={locale === "en"}
          onClick={() => choose("en")}
          label="English"
        />
      </div>
    </div>
  );
}

function Choice({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={cn(
        "h-12 rounded-xl border font-medium transition-colors",
        active
          ? "bg-primary text-primary-ink border-primary"
          : "bg-surface text-ink border-border hover:bg-bg"
      )}
    >
      {label}
    </button>
  );
}
