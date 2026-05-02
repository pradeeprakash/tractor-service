"use client";

import { Money } from "@/components/common/Money";
import { formatDate, formatHours, formatPhone } from "@/lib/format";
import type { Customer, Payment, Service } from "@/lib/domain/types";
import { cn } from "@/lib/cn";
import { useT } from "@/lib/i18n/useT";

type Props = {
  businessName: string;
  customer: Customer;
  asOf: Date;
  services: Array<Service & { tool_name: string }>;
  payments: Payment[];
  totalBilledPaise: number;
  totalPaidPaise: number;
  balancePaise: number;
};

export function CustomerStatement({
  businessName,
  customer,
  asOf,
  services,
  payments,
  totalBilledPaise,
  totalPaidPaise,
  balancePaise,
}: Props) {
  const { t } = useT();
  const owes = balancePaise > 0;
  const advance = balancePaise < 0;

  return (
    <article className="print-area card p-6 md:p-8 space-y-6 text-ink">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-wider text-ink-muted">
            {t("report.statement")}
          </p>
          <h1 className="text-2xl font-semibold leading-tight">{businessName}</h1>
        </div>
        <div className="text-right text-sm text-ink-muted">
          <p>{t("report.generated", { date: formatDate(asOf, "D MMM YYYY") })}</p>
        </div>
      </header>

      <section className="rounded-xl bg-bg p-4 grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-ink-muted uppercase tracking-wider">
            {t("report.customerHeader")}
          </p>
          <p className="font-semibold text-lg">{customer.name}</p>
          {customer.village && <p className="text-sm text-ink-muted">{customer.village}</p>}
          {customer.phone && <p className="text-sm text-ink-muted">{formatPhone(customer.phone)}</p>}
        </div>
        <div className="text-right">
          <p className="text-xs text-ink-muted uppercase tracking-wider">
            {t("report.balanceHeader")}
          </p>
          <p
            className={cn(
              "text-3xl font-bold tabular-nums",
              owes && "text-danger",
              advance && "text-primary"
            )}
          >
            <Money paise={Math.abs(balancePaise)} />
          </p>
          <p className="text-sm text-ink-muted">
            {owes
              ? t("balance.amountDue")
              : advance
                ? t("balance.advanceBalance")
                : t("balance.settled")}
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold mb-2">{t("report.services")}</h2>
        {services.length === 0 ? (
          <p className="text-sm text-ink-muted">{t("report.noServicesRecorded")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border text-ink-muted text-left">
                  <th className="py-2 pr-2 font-medium">{t("report.tHeaderDate")}</th>
                  <th className="py-2 pr-2 font-medium">{t("report.tHeaderTool")}</th>
                  <th className="py-2 pr-2 font-medium num text-right">
                    {t("report.tHeaderHours")}
                  </th>
                  <th className="py-2 pr-2 font-medium num text-right">
                    {t("report.tHeaderRate")}
                  </th>
                  <th className="py-2 font-medium num text-right">{t("report.tHeaderAmount")}</th>
                </tr>
              </thead>
              <tbody>
                {services.map((s) => (
                  <tr key={s.id} className="border-b border-border/60">
                    <td className="py-2 pr-2 whitespace-nowrap">
                      {formatDate(s.service_date, "D MMM")}
                    </td>
                    <td className="py-2 pr-2">{s.tool_name}</td>
                    <td className="py-2 pr-2 num text-right">{formatHours(s.hours_x2)}</td>
                    <td className="py-2 pr-2 num text-right">
                      <Money paise={s.rate_paise_per_hour} />
                      {t("tool.perHourShort")}
                    </td>
                    <td className="py-2 num text-right font-medium">
                      <Money paise={s.total_paise} />
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={4} className="py-2 text-right text-ink-muted">
                    {t("report.totalBilled")}
                  </td>
                  <td className="py-2 num text-right font-semibold">
                    <Money paise={totalBilledPaise} />
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold mb-2">{t("report.payments")}</h2>
        {payments.length === 0 ? (
          <p className="text-sm text-ink-muted">{t("report.noPaymentsRecorded")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border text-ink-muted text-left">
                  <th className="py-2 pr-2 font-medium">{t("report.tHeaderDate")}</th>
                  <th className="py-2 pr-2 font-medium">{t("report.tHeaderMethod")}</th>
                  <th className="py-2 pr-2 font-medium">{t("report.tHeaderNotes")}</th>
                  <th className="py-2 font-medium num text-right">{t("report.tHeaderAmount")}</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b border-border/60">
                    <td className="py-2 pr-2 whitespace-nowrap">
                      {formatDate(p.payment_date, "D MMM")}
                    </td>
                    <td className="py-2 pr-2">{p.method.toUpperCase()}</td>
                    <td className="py-2 pr-2 text-ink-muted">{p.notes ?? ""}</td>
                    <td className="py-2 num text-right font-medium text-success">
                      <Money paise={p.amount_paise} />
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} className="py-2 text-right text-ink-muted">
                    {t("report.totalPaid")}
                  </td>
                  <td className="py-2 num text-right font-semibold text-success">
                    <Money paise={totalPaidPaise} />
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>

      <section
        className={cn(
          "rounded-xl p-5 border-2",
          owes && "border-danger bg-danger/5",
          advance && "border-primary bg-primary/5",
          !owes && !advance && "border-success bg-success/5"
        )}
      >
        <p className="text-sm font-medium uppercase tracking-wider text-ink-muted">
          {owes
            ? t("balance.outstandingBalance")
            : advance
              ? t("balance.advanceBalance")
              : t("balance.accountStatus")}
        </p>
        <p
          className={cn(
            "text-4xl font-bold tabular-nums mt-1",
            owes && "text-danger",
            advance && "text-primary",
            !owes && !advance && "text-success"
          )}
        >
          {owes || advance ? <Money paise={Math.abs(balancePaise)} /> : t("balance.settled")}
        </p>
      </section>

      <footer className="pt-4 border-t border-border text-xs text-ink-muted">
        <p>{t("report.footer")}</p>
      </footer>
    </article>
  );
}
