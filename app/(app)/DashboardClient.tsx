"use client";

import dayjs from "dayjs";
import { useMemo } from "react";
import Link from "next/link";
import { ArrowDownToLine, ArrowUpToLine, Coins, Receipt, Tractor, Wallet } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { StatTile } from "@/components/dashboard/StatTile";
import { RevenueByToolChart } from "@/components/dashboard/RevenueByToolChart";
import { Money } from "@/components/common/Money";
import { useRecentServices } from "@/lib/queries/services";
import { useRecentPayments } from "@/lib/queries/payments";
import { useExpenses } from "@/lib/queries/expenses";
import { useCustomerBalances } from "@/lib/queries/customers";
import { collectionRate } from "@/lib/domain/balance";
import { formatDate, formatINR, formatRelative } from "@/lib/format";
import { useT } from "@/lib/i18n/useT";

export function DashboardClient() {
  const { t, locale } = useT();
  const { data: services = [] } = useRecentServices(500);
  const { data: payments = [] } = useRecentPayments(500);
  const { data: expenses = [] } = useExpenses(500);
  const { data: balances = [] } = useCustomerBalances();

  const monthStart = dayjs().startOf("month");
  const monthEnd = dayjs().endOf("month");

  const stats = useMemo(() => {
    const inMonth = (d: string) => {
      const x = dayjs(d);
      return x.isAfter(monthStart.subtract(1, "day")) && x.isBefore(monthEnd.add(1, "day"));
    };

    const monthServices = services.filter((s) => inMonth(s.service_date));
    const monthPayments = payments.filter((p) => inMonth(p.payment_date));
    const monthExpenses = expenses.filter((e) => inMonth(e.expense_date));

    const monthBilled = monthServices.reduce((s, x) => s + x.total_paise, 0);
    const monthCollected = monthPayments.reduce((s, x) => s + x.amount_paise, 0);
    const monthExpense = monthExpenses.reduce((s, x) => s + x.amount_paise, 0);
    const netProfitPaise = monthCollected - monthExpense;

    const totalBilled = services.reduce((s, x) => s + x.total_paise, 0);
    const totalCollected = payments.reduce((s, x) => s + x.amount_paise, 0);
    const collection = collectionRate(totalBilled, totalCollected);

    const pending = balances.reduce((s, r) => s + Math.max(0, r.balance_paise), 0);

    const byTool = new Map<string, { paise: number; count: number }>();
    for (const s of monthServices) {
      const cur = byTool.get(s.tool_name) ?? { paise: 0, count: 0 };
      cur.paise += s.total_paise;
      cur.count += 1;
      byTool.set(s.tool_name, cur);
    }
    const revenueByTool = Array.from(byTool.entries())
      .map(([tool, v]) => ({ tool, ...v }))
      .sort((a, b) => b.paise - a.paise);

    return {
      monthBilled,
      monthCollected,
      monthExpense,
      netProfitPaise,
      collection,
      pending,
      monthServiceCount: monthServices.length,
      revenueByTool,
    };
  }, [services, payments, expenses, balances, monthStart, monthEnd]);

  const today = dayjs().format("YYYY-MM-DD");
  const todaysServices = services.filter((s) => s.service_date === today);

  return (
    <>
      <PageHeader title={t("dashboard.title")} subtitle={formatDate(new Date(), "dddd, D MMM")} />
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <StatTile
            label={t("dashboard.thisMonth")}
            value={<Money paise={stats.monthBilled} />}
            hint={t("dashboard.servicesCount", { n: stats.monthServiceCount })}
            icon={<Receipt className="w-4 h-4" />}
          />
          <StatTile
            label={t("dashboard.pending")}
            value={<Money paise={stats.pending} />}
            hint={t("dashboard.acrossAll")}
            tone={stats.pending > 0 ? "danger" : "default"}
            icon={<Coins className="w-4 h-4" />}
          />
          <StatTile
            label={t("dashboard.collectedMo")}
            value={<Money paise={stats.monthCollected} />}
            tone="success"
            icon={<ArrowDownToLine className="w-4 h-4" />}
          />
          <StatTile
            label={t("dashboard.netProfitMo")}
            value={<Money paise={stats.netProfitPaise} signed />}
            hint={t("dashboard.monthlyExpenseHint", {
              amount: formatINR(stats.monthExpense),
            })}
            tone={stats.netProfitPaise >= 0 ? "primary" : "danger"}
            icon={<Wallet className="w-4 h-4" />}
          />
          <StatTile
            label={t("dashboard.collectionRate")}
            value={`${Math.round(stats.collection * 100)}%`}
            hint={t("dashboard.allTime")}
            icon={<Tractor className="w-4 h-4" />}
          />
          <StatTile
            label={t("dashboard.today")}
            value={`${todaysServices.length}`}
            hint={
              todaysServices.length > 0 ? (
                <Money paise={todaysServices.reduce((s, x) => s + x.total_paise, 0)} />
              ) : (
                t("dashboard.noServiceToday")
              )
            }
            icon={<ArrowUpToLine className="w-4 h-4" />}
          />
        </div>

        <section className="card p-4">
          <h2 className="font-semibold mb-3">
            {t("dashboard.revenueByTool", { month: dayjs().format("MMM YYYY") })}
          </h2>
          <RevenueByToolChart rows={stats.revenueByTool} />
        </section>

        <section className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">{t("dashboard.todaysServices")}</h2>
            <Link href="/services" className="text-sm text-primary font-medium">
              {t("dashboard.seeAll")}
            </Link>
          </div>
          {todaysServices.length === 0 ? (
            <p className="text-sm text-ink-muted">{t("dashboard.nothingToday")}</p>
          ) : (
            <ul className="space-y-2">
              {todaysServices.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/customers/${s.customer_id}`}
                    className="flex items-center justify-between rounded-xl bg-bg px-3 py-2.5 hover:bg-bg/70"
                  >
                    <div className="min-w-0">
                      <p className="font-medium truncate">{s.customer_name}</p>
                      <p className="text-xs text-ink-muted truncate">
                        {s.tool_name} · {formatRelative(s.created_at, locale)}
                      </p>
                    </div>
                    <Money paise={s.total_paise} className="font-semibold tabular-nums" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
