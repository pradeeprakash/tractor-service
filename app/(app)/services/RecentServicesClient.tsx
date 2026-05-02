"use client";

import Link from "next/link";
import { Receipt } from "lucide-react";
import { useMemo } from "react";
import { useRecentServices } from "@/lib/queries/services";
import { Money } from "@/components/common/Money";
import { EmptyState } from "@/components/common/EmptyState";
import { ListSkeleton } from "@/components/common/Skeleton";
import { formatDate, formatHours, formatRelative } from "@/lib/format";
import { useT } from "@/lib/i18n/useT";

export function RecentServicesClient() {
  const { t, locale } = useT();
  const { data: services = [], isLoading } = useRecentServices(100);

  const groups = useMemo(() => {
    const map = new Map<string, typeof services>();
    for (const s of services) {
      const key = s.service_date;
      const arr = map.get(key) ?? [];
      arr.push(s);
      map.set(key, arr);
    }
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [services]);

  if (isLoading) return <ListSkeleton rows={6} />;

  if (services.length === 0) {
    return (
      <EmptyState
        icon={<Receipt className="w-6 h-6" />}
        title={t("service.noneYet")}
        description={t("service.noneYetDesc")}
        action={
          <Link href="/services/new" className="btn-primary">
            {t("service.newService")}
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-5">
      {groups.map(([date, items]) => {
        const total = items.reduce((s, x) => s + x.total_paise, 0);
        return (
          <section key={date}>
            <div className="flex items-center justify-between px-1 mb-2">
              <h2 className="text-sm font-medium text-ink-muted">
                {formatRelative(date, locale)} · {formatDate(date, "D MMM")}
              </h2>
              <span className="text-sm tabular-nums text-ink-muted">
                {items.length} · <Money paise={total} className="text-ink font-medium" />
              </span>
            </div>
            <ul className="space-y-2">
              {items.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/customers/${s.customer_id}`}
                    className="card p-3 flex items-center gap-3 hover:bg-bg/60"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{s.customer_name}</p>
                      <p className="text-sm text-ink-muted truncate">
                        {s.tool_name} · {formatHours(s.hours_x2)}
                      </p>
                    </div>
                    <Money paise={s.total_paise} className="font-semibold" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
