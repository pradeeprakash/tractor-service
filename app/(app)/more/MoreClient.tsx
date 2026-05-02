"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, LogOut, Wallet, Wrench, ArrowDownToLine } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { LanguageToggle } from "./LanguageToggle";
import { useT } from "@/lib/i18n/useT";

export function MoreClient() {
  const router = useRouter();
  const { t } = useT();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const items = [
    { href: "/payments/new", label: t("nav.recordPayment"), icon: ArrowDownToLine },
    { href: "/expenses", label: t("nav.expenses"), icon: Wallet },
    { href: "/tools", label: t("nav.tools"), icon: Wrench },
  ];

  return (
    <div className="space-y-2">
      <LanguageToggle />

      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className="card p-4 flex items-center gap-3 hover:bg-bg/60"
          >
            <div className="w-10 h-10 rounded-full bg-bg flex items-center justify-center text-ink">
              <Icon className="w-5 h-5" />
            </div>
            <span className="flex-1 font-medium">{item.label}</span>
            <ChevronRight className="w-4 h-4 text-ink-muted" />
          </Link>
        );
      })}

      <button
        onClick={signOut}
        className="card w-full p-4 flex items-center gap-3 text-left hover:bg-bg/60"
      >
        <div className="w-10 h-10 rounded-full bg-bg flex items-center justify-center text-ink">
          <LogOut className="w-5 h-5" />
        </div>
        <span className="flex-1 font-medium">{t("nav.signOut")}</span>
        <ChevronRight className="w-4 h-4 text-ink-muted" />
      </button>
    </div>
  );
}
