"use client";

import Link from "next/link";
import dayjs from "dayjs";
import { useMemo } from "react";
import { Wallet } from "lucide-react";
import { useExpenses } from "@/lib/queries/expenses";
import { Money } from "@/components/common/Money";
import { EmptyState } from "@/components/common/EmptyState";
import { ListSkeleton } from "@/components/common/Skeleton";
import { formatDate, formatRelative } from "@/lib/format";
import { useT, type TKey } from "@/lib/i18n/useT";
import type { ExpenseCategory } from "@/lib/domain/types";

const CATEGORY_KEY: Record<ExpenseCategory, TKey> = {
  fuel: "expense.cat_fuel",
  maintenance: "expense.cat_maintenance",
  repair: "expense.cat_repair",
  other: "expense.cat_other",
};

export function ExpensesClient() {
  const { t, locale } = useT();
  const { data: expenses = [], isLoading } = useExpenses(200);

  const monthTotal = useMemo(() => {
    const start = dayjs().startOf("month");
    const end = dayjs().endOf("month");
    return expenses
      .filter((e) => {
        const d = dayjs(e.expense_date);
        return d.isAfter(start.subtract(1, "day")) && d.isBefore(end.add(1, "day"));
      })
      .reduce((s, e) => s + e.amount_paise, 0);
  }, [expenses]);

  if (isLoading) return <ListSkeleton rows={5} />;

  if (expenses.length === 0) {
    return (
      <EmptyState
        icon={<Wallet className="w-6 h-6" />}
        title={t("expense.noneYet")}
        description={t("expense.noneYetDesc")}
        action={
          <Link href="/expenses/new" className="btn-primary">
            {t("expense.add")}
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="card p-4">
        <p className="text-sm text-ink-muted">{t("expense.thisMonth")}</p>
        <Money paise={monthTotal} className="text-2xl font-semibold" />
      </div>

      <ul className="space-y-2">
        {expenses.map((e) => (
          <li key={e.id} className="card p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-bg flex items-center justify-center text-ink-muted">
              <Wallet className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium truncate">{t(CATEGORY_KEY[e.category])}</p>
              <p className="text-xs text-ink-muted truncate">
                {formatRelative(e.expense_date, locale)} · {formatDate(e.expense_date, "D MMM")}
                {e.notes ? ` · ${e.notes}` : ""}
              </p>
            </div>
            <Money paise={e.amount_paise} className="font-semibold" />
          </li>
        ))}
      </ul>
    </div>
  );
}
