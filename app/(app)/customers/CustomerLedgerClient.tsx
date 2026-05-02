"use client";

import { useMemo, useState } from "react";
import { Search, Users } from "lucide-react";
import Link from "next/link";
import { useCustomerBalances } from "@/lib/queries/customers";
import { CustomerLedgerCard } from "@/components/customers/CustomerLedgerCard";
import { EmptyState } from "@/components/common/EmptyState";
import { ListSkeleton } from "@/components/common/Skeleton";
import { Money } from "@/components/common/Money";
import { cn } from "@/lib/cn";
import { useT } from "@/lib/i18n/useT";

type SortKey = "balance" | "name";

export function CustomerLedgerClient() {
  const { t } = useT();
  const { data: rows = [], isLoading } = useCustomerBalances();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("balance");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let r = rows;
    if (q) {
      r = r.filter(
        (x) =>
          x.name.toLowerCase().includes(q) ||
          (x.village ?? "").toLowerCase().includes(q) ||
          (x.phone ?? "").toLowerCase().includes(q)
      );
    }
    if (sort === "balance") {
      const groupOf = (n: number) => (n > 0 ? 0 : n === 0 ? 1 : 2);
      return [...r].sort((a, b) => {
        const g = groupOf(a.balance_paise) - groupOf(b.balance_paise);
        if (g !== 0) return g;
        return Math.abs(b.balance_paise) - Math.abs(a.balance_paise);
      });
    }
    return [...r].sort((a, b) => a.name.localeCompare(b.name));
  }, [rows, search, sort]);

  const totalOutstanding = useMemo(
    () => rows.reduce((sum, r) => sum + Math.max(0, r.balance_paise), 0),
    [rows]
  );

  return (
    <div className="space-y-3">
      <div className="card p-4">
        <p className="text-sm text-ink-muted">{t("customer.totalOutstanding")}</p>
        <Money paise={totalOutstanding} className="text-2xl font-semibold text-danger" />
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-muted pointer-events-none" />
        <input
          type="search"
          inputMode="search"
          placeholder={t("customer.search")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input pl-10"
          aria-label={t("customer.searchAria")}
        />
      </div>

      <div className="flex gap-2" role="tablist" aria-label={t("customer.sortLabel")}>
        <SortChip active={sort === "balance"} onClick={() => setSort("balance")}>
          {t("customer.sortOwes")}
        </SortChip>
        <SortChip active={sort === "name"} onClick={() => setSort("name")}>
          {t("customer.sortAlpha")}
        </SortChip>
      </div>

      {isLoading && <ListSkeleton rows={5} />}

      {!isLoading && filtered.length === 0 && (
        <EmptyState
          icon={<Users className="w-6 h-6" />}
          title={t("customer.noneYet")}
          description={t("customer.noneYetDesc")}
          action={
            <Link href="/customers/new" className="btn-primary">
              {t("customer.add")}
            </Link>
          }
        />
      )}

      <div className="space-y-2">
        {filtered.map((row) => (
          <CustomerLedgerCard key={row.customer_id} row={row} />
        ))}
      </div>
    </div>
  );
}

function SortChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "h-9 px-3 rounded-full text-sm font-medium border",
        active
          ? "bg-primary text-primary-ink border-primary"
          : "bg-surface text-ink-muted border-border hover:bg-bg"
      )}
    >
      {children}
    </button>
  );
}
