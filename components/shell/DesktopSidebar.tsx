"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Users,
  Plus,
  Wallet,
  Wrench,
  Receipt,
  LogOut,
  Tractor,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useT, type TKey } from "@/lib/i18n/useT";

type Item = {
  href: string;
  labelKey: TKey;
  icon: typeof Home;
  exact?: boolean;
};

const ITEMS: Item[] = [
  { href: "/", labelKey: "nav.dashboard", icon: Home, exact: true },
  { href: "/customers", labelKey: "nav.customers", icon: Users },
  { href: "/services", labelKey: "nav.services", icon: Receipt },
  { href: "/payments/new", labelKey: "nav.recordPayment", icon: Wallet },
  { href: "/expenses", labelKey: "nav.expenses", icon: Wallet },
  { href: "/tools", labelKey: "nav.tools", icon: Wrench },
];

export function DesktopSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useT();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="hidden md:flex md:flex-col fixed inset-y-0 left-0 w-64 border-r border-border bg-surface px-4 py-5">
      <div className="flex items-center gap-2 px-2 mb-6">
        <div className="w-9 h-9 rounded-xl bg-primary text-primary-ink flex items-center justify-center">
          <Tractor className="w-5 h-5" />
        </div>
        <div className="leading-tight">
          <p className="font-semibold">{t("nav.brand")}</p>
          <p className="text-xs text-ink-muted">{t("nav.brandSubtitle")}</p>
        </div>
      </div>

      <Link href="/services/new" className="btn-primary w-full mb-4">
        <Plus className="w-5 h-5" /> {t("nav.newService")}
      </Link>

      <ul className="flex-1 space-y-1">
        {ITEMS.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 h-11 rounded-xl text-sm font-medium",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-ink-muted hover:bg-bg hover:text-ink"
                )}
              >
                <Icon className="w-5 h-5" />
                {t(item.labelKey)}
              </Link>
            </li>
          );
        })}
      </ul>

      <button
        onClick={signOut}
        className="flex items-center gap-3 px-3 h-11 rounded-xl text-sm font-medium text-ink-muted hover:bg-bg hover:text-ink"
      >
        <LogOut className="w-5 h-5" /> {t("nav.signOut")}
      </button>
    </aside>
  );
}
