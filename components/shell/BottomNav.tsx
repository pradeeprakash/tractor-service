"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, BarChart3, Plus, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/cn";
import { useT, type TKey } from "@/lib/i18n/useT";

type Tab = {
  href: string;
  labelKey: TKey;
  icon: typeof Home;
  match: (p: string) => boolean;
};

const TABS: Array<Tab | null> = [
  { href: "/", labelKey: "nav.home", icon: Home, match: (p) => p === "/" },
  {
    href: "/customers",
    labelKey: "nav.customers",
    icon: Users,
    match: (p) => p.startsWith("/customers"),
  },
  null, // FAB slot
  {
    href: "/services",
    labelKey: "nav.services",
    icon: BarChart3,
    match: (p) => p === "/services" || p.startsWith("/services/"),
  },
  {
    href: "/more",
    labelKey: "nav.more",
    icon: MoreHorizontal,
    match: (p) => p.startsWith("/more") || p.startsWith("/expenses") || p.startsWith("/tools"),
  },
];

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useT();

  return (
    <nav
      aria-label="Primary"
      className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-surface/95 backdrop-blur border-t border-border pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="grid grid-cols-5 h-16 items-center relative">
        {TABS.map((tab, idx) => {
          if (tab === null) {
            return (
              <li key="fab" className="flex justify-center relative">
                <Link
                  href="/services/new"
                  aria-label={t("nav.newService")}
                  className="absolute -top-7 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full bg-primary text-primary-ink shadow-fab flex items-center justify-center active:scale-95 transition-transform"
                >
                  <Plus className="w-7 h-7" strokeWidth={2.5} />
                </Link>
              </li>
            );
          }
          const Icon = tab.icon;
          const active = tab.match(pathname);
          return (
            <li key={tab.href} className="flex justify-center">
              <Link
                href={tab.href}
                className={cn(
                  "flex flex-col items-center justify-center w-full h-16 gap-0.5 text-xs font-medium",
                  active ? "text-primary" : "text-ink-muted"
                )}
              >
                <Icon className="w-5 h-5" />
                <span>{t(tab.labelKey)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
