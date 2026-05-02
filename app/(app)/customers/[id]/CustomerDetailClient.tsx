"use client";

import Link from "next/link";
import {
  ArrowDownToLine,
  ArrowUpToLine,
  FileText,
  Phone,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { BalancePill } from "@/components/customers/BalancePill";
import { Money } from "@/components/common/Money";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { useToast } from "@/components/common/Toast";
import { useCustomer, useCustomerBalance } from "@/lib/queries/customers";
import { useCustomerServices, useDeleteService } from "@/lib/queries/services";
import { useCustomerPayments, useDeletePayment } from "@/lib/queries/payments";
import { formatDate, formatHours, formatINR, formatPhone } from "@/lib/format";
import type { TimelineEntry } from "@/lib/domain/types";
import { useT } from "@/lib/i18n/useT";

type DeleteTarget =
  | { kind: "service"; id: string; customer_id: string; tool: string; hours_x2: number; total_paise: number }
  | { kind: "payment"; id: string; customer_id: string; amount_paise: number; method: string };

export function CustomerDetailClient({ customerId }: { customerId: string }) {
  const { t } = useT();
  const toast = useToast();
  const { data: customer, isLoading: cl } = useCustomer(customerId);
  const { data: balance } = useCustomerBalance(customerId);
  const { data: services = [] } = useCustomerServices(customerId);
  const { data: payments = [] } = useCustomerPayments(customerId);
  const deleteService = useDeleteService();
  const deletePayment = useDeletePayment();
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  const timeline = useMemo<TimelineEntry[]>(() => {
    const entries: TimelineEntry[] = [
      ...services.map((s) => ({ kind: "service" as const, ...s })),
      ...payments.map((p) => ({ kind: "payment" as const, ...p })),
    ];
    entries.sort((a, b) => {
      const da = a.kind === "service" ? a.service_date : a.payment_date;
      const db = b.kind === "service" ? b.service_date : b.payment_date;
      if (db !== da) return db.localeCompare(da);
      return b.created_at.localeCompare(a.created_at);
    });
    return entries;
  }, [services, payments]);

  const withRunning = useMemo(() => {
    const oldestFirst = [...timeline].reverse();
    let running = 0;
    const map = new Map<string, number>();
    for (const e of oldestFirst) {
      if (e.kind === "service") {
        running += e.total_paise;
      } else {
        // Service-linked payments settle the full billed amount (shortfall = discount),
        // so subtract the allocated services' billed total. Legacy customer-level
        // payments fall back to the literal amount_paise.
        running -= e.allocated_billed_paise ?? e.amount_paise;
      }
      map.set(e.id, running);
    }
    return timeline.map((e) => ({ entry: e, running: map.get(e.id) ?? 0 }));
  }, [timeline]);

  async function commitDelete() {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.kind === "service") {
        await deleteService.mutateAsync({
          id: deleteTarget.id,
          customer_id: deleteTarget.customer_id,
        });
      } else {
        await deletePayment.mutateAsync({
          id: deleteTarget.id,
          customer_id: deleteTarget.customer_id,
        });
      }
      toast.push(t("common.deleted"), "success");
    } catch (err) {
      toast.push(err instanceof Error ? err.message : t("common.couldNotDelete"), "error");
    } finally {
      setDeleteTarget(null);
    }
  }

  if (cl) {
    return (
      <>
        <PageHeader title={t("common.loading")} back="/customers" />
        <div className="p-4 text-ink-muted">{t("common.loading")}</div>
      </>
    );
  }

  if (!customer) {
    return (
      <>
        <PageHeader title={t("customer.notFound")} back="/customers" />
        <div className="p-4 text-ink-muted">{t("customer.notFoundDesc")}</div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={customer.name}
        subtitle={[customer.village, formatPhone(customer.phone)].filter(Boolean).join(" · ")}
        back="/customers"
        actions={
          customer.phone && (
            <a
              href={`tel:${customer.phone}`}
              aria-label={t("customer.callAria")}
              className="btn-secondary h-10 w-10 p-0"
            >
              <Phone className="w-4 h-4" />
            </a>
          )
        }
      />

      <div className="p-4 space-y-4">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-ink-muted">{t("balance.outstandingBalance")}</span>
            <BalancePill balancePaise={balance?.balance_paise ?? 0} size="sm" />
          </div>
          <Money
            paise={balance?.balance_paise ?? 0}
            className="mt-1 text-3xl font-semibold tabular-nums"
          />
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-ink-muted">{t("customer.billed")}</p>
              <Money paise={balance?.total_billed_paise ?? 0} className="font-medium" />
            </div>
            <div>
              <p className="text-ink-muted">{t("customer.paid")}</p>
              <Money paise={balance?.total_paid_paise ?? 0} className="font-medium" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Link
            href={`/services/new?customer=${customer.id}`}
            className="btn-primary h-12 px-2 text-sm"
          >
            <ArrowUpToLine className="w-4 h-4" /> {t("service.service")}
          </Link>
          <Link
            href={`/payments/new?customer=${customer.id}`}
            className="btn-secondary h-12 px-2 text-sm"
          >
            <ArrowDownToLine className="w-4 h-4" /> {t("payment.payment")}
          </Link>
          <Link
            href={`/customers/${customer.id}/report`}
            className="btn-secondary h-12 px-2 text-sm"
          >
            <FileText className="w-4 h-4" /> {t("report.statement")}
          </Link>
        </div>

        <section aria-label={t("customer.activity")}>
          <h2 className="text-sm font-medium text-ink-muted mb-2 px-1">
            {t("customer.activity")}
          </h2>
          {withRunning.length === 0 && (
            <div className="card p-6 text-center text-ink-muted text-sm">
              {t("customer.noActivity")}
            </div>
          )}
          <ol className="space-y-2">
            {withRunning.map(({ entry, running }) => (
              <li key={entry.id}>
                {entry.kind === "service" ? (
                  <ServiceRow
                    entry={entry}
                    running={running}
                    onDelete={() =>
                      setDeleteTarget({
                        kind: "service",
                        id: entry.id,
                        customer_id: entry.customer_id,
                        tool: entry.tool_name,
                        hours_x2: entry.hours_x2,
                        total_paise: entry.total_paise,
                      })
                    }
                  />
                ) : (
                  <PaymentRow
                    entry={entry}
                    running={running}
                    onDelete={() =>
                      setDeleteTarget({
                        kind: "payment",
                        id: entry.id,
                        customer_id: entry.customer_id,
                        amount_paise: entry.amount_paise,
                        method: entry.method,
                      })
                    }
                  />
                )}
              </li>
            ))}
          </ol>
        </section>
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        title={
          deleteTarget?.kind === "service"
            ? t("confirm.deleteServiceTitle")
            : deleteTarget?.kind === "payment"
              ? t("confirm.deletePaymentTitle")
              : ""
        }
        body={
          deleteTarget?.kind === "service"
            ? t("confirm.deleteServiceBody", {
                tool: deleteTarget.tool,
                hours: formatHours(deleteTarget.hours_x2),
                amount: formatINR(deleteTarget.total_paise),
              })
            : deleteTarget?.kind === "payment"
              ? t("confirm.deletePaymentBody", {
                  amount: formatINR(deleteTarget.amount_paise),
                  method: deleteTarget.method.toUpperCase(),
                })
              : ""
        }
        confirmLabel={t("confirm.deleteAction")}
        destructive
        busy={deleteService.isPending || deletePayment.isPending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={commitDelete}
      />
    </>
  );
}

function ServiceRow({
  entry,
  running,
  onDelete,
}: {
  entry: Extract<TimelineEntry, { kind: "service" }>;
  running: number;
  onDelete: () => void;
}) {
  const { t } = useT();
  const isPaid = entry.allocated_paise != null;
  const discount =
    isPaid && entry.allocated_paise != null
      ? entry.total_paise - entry.allocated_paise
      : 0;
  return (
    <div className="card p-3 flex items-center gap-3">
      <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
        <ArrowUpToLine className="w-4 h-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="font-medium truncate flex items-center gap-2">
            <span className="truncate">{entry.tool_name}</span>
            {isPaid && (
              <span className="text-[10px] uppercase tracking-wide font-semibold px-1.5 py-0.5 rounded bg-success/10 text-success shrink-0">
                {t("payment.paid")}
              </span>
            )}
          </p>
          <Money paise={entry.total_paise} className="font-semibold" />
        </div>
        <div className="flex items-center justify-between gap-2 text-xs text-ink-muted">
          <span>
            {formatDate(entry.service_date, "D MMM YYYY")} · {formatHours(entry.hours_x2)}
            {discount > 0 && (
              <>
                {" · "}
                {t("payment.discountGiven")}{" "}
                <Money paise={discount} className="font-medium" />
              </>
            )}
          </span>
          <span className="tabular-nums">
            {t("balance.balLabel")} <Money paise={running} signed />
          </span>
        </div>
      </div>
      <button
        type="button"
        onClick={onDelete}
        aria-label={t("common.delete")}
        className="w-9 h-9 rounded-full hover:bg-danger/10 text-ink-muted hover:text-danger flex items-center justify-center shrink-0 transition-colors"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

function PaymentRow({
  entry,
  running,
  onDelete,
}: {
  entry: Extract<TimelineEntry, { kind: "payment" }>;
  running: number;
  onDelete: () => void;
}) {
  const { t } = useT();
  return (
    <div className="card p-3 flex items-center gap-3">
      <div className="w-9 h-9 rounded-full bg-success/10 text-success flex items-center justify-center shrink-0">
        <ArrowDownToLine className="w-4 h-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="font-medium truncate">
            {t("payment.payment")}{" "}
            <span className="text-ink-muted font-normal">· {entry.method.toUpperCase()}</span>
          </p>
          <Money paise={entry.amount_paise} className="font-semibold text-success" />
        </div>
        <div className="flex items-center justify-between gap-2 text-xs text-ink-muted">
          <span>{formatDate(entry.payment_date, "D MMM YYYY")}</span>
          <span className="tabular-nums">
            {t("balance.balLabel")} <Money paise={running} signed />
          </span>
        </div>
      </div>
      <button
        type="button"
        onClick={onDelete}
        aria-label={t("common.delete")}
        className="w-9 h-9 rounded-full hover:bg-danger/10 text-ink-muted hover:text-danger flex items-center justify-center shrink-0 transition-colors"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
