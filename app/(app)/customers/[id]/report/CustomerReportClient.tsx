"use client";

import { useMemo } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { CustomerStatement } from "@/components/reports/CustomerStatement";
import { ShareButton } from "@/components/reports/ShareButton";
import { useCustomer, useCustomerBalance } from "@/lib/queries/customers";
import { useCustomerServices } from "@/lib/queries/services";
import { useCustomerPayments } from "@/lib/queries/payments";
import { useT } from "@/lib/i18n/useT";

export function CustomerReportClient({ customerId }: { customerId: string }) {
  const { t } = useT();
  const { data: customer } = useCustomer(customerId);
  const { data: balance } = useCustomerBalance(customerId);
  const { data: services = [] } = useCustomerServices(customerId);
  const { data: payments = [] } = useCustomerPayments(customerId);

  const businessName =
    process.env.NEXT_PUBLIC_BUSINESS_NAME || "Prakash Tractor Service";

  const orderedServices = useMemo(
    () =>
      [...services].sort(
        (a, b) =>
          a.service_date.localeCompare(b.service_date) ||
          a.created_at.localeCompare(b.created_at)
      ),
    [services]
  );
  const orderedPayments = useMemo(
    () =>
      [...payments].sort(
        (a, b) =>
          a.payment_date.localeCompare(b.payment_date) ||
          a.created_at.localeCompare(b.created_at)
      ),
    [payments]
  );

  if (!customer) {
    return (
      <>
        <PageHeader title={t("report.statement")} back="/customers" />
        <div className="p-4 text-ink-muted">{t("common.loading")}</div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={t("report.statementOf", { name: customer.name })}
        back={`/customers/${customer.id}`}
      />
      <div className="p-4 space-y-4">
        <ShareButton
          businessName={businessName}
          customer={customer}
          asOf={new Date()}
          services={orderedServices}
          payments={orderedPayments}
          totalBilledPaise={balance?.total_billed_paise ?? 0}
          totalPaidPaise={balance?.total_paid_paise ?? 0}
          balancePaise={balance?.balance_paise ?? 0}
        />
        <CustomerStatement
          businessName={businessName}
          customer={customer}
          asOf={new Date()}
          services={orderedServices}
          payments={orderedPayments}
          totalBilledPaise={balance?.total_billed_paise ?? 0}
          totalPaidPaise={balance?.total_paid_paise ?? 0}
          balancePaise={balance?.balance_paise ?? 0}
        />
      </div>
    </>
  );
}
