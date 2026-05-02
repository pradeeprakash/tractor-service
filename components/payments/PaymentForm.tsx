"use client";

import { useMemo, useState } from "react";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import { CustomerPicker } from "@/components/customers/CustomerPicker";
import { Money } from "@/components/common/Money";
import { useCreatePayment, useUnpaidServices } from "@/lib/queries/payments";
import { useToast } from "@/components/common/Toast";
import { formatDate, formatHours, paise as toPaise } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { PaymentMethod, UUID } from "@/lib/domain/types";
import { useT } from "@/lib/i18n/useT";

type Props = {
  initialCustomerId?: UUID;
};

// Per-service edited amount; null means "unticked".
type SelectionMap = Record<UUID, string | null>;

export function PaymentForm({ initialCustomerId }: Props) {
  const router = useRouter();
  const create = useCreatePayment();
  const toast = useToast();
  const { t } = useT();

  const [customerId, setCustomerId] = useState<UUID | null>(initialCustomerId ?? null);
  const [selections, setSelections] = useState<SelectionMap>({});
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [paymentDate, setPaymentDate] = useState<string>(dayjs().format("YYYY-MM-DD"));
  const [notes, setNotes] = useState<string>("");

  const { data: services = [], isLoading: loadingServices } = useUnpaidServices(
    customerId ?? undefined
  );

  const tickedIds = useMemo(
    () => Object.keys(selections).filter((id) => selections[id] != null),
    [selections]
  );

  // Build the live payload + totals from current selections. A ticked row with
  // an empty string falls back to the service's full billed total.
  const { allocations, billedTotal, paidTotal, hasInvalid } = useMemo(() => {
    let billedTotal = 0;
    let paidTotal = 0;
    let hasInvalid = false;
    const allocations: { service_id: UUID; allocated_paise: number; total_paise: number }[] = [];
    for (const s of services) {
      const raw = selections[s.id];
      if (raw == null) continue;
      const parsed = raw.trim() === "" ? s.total_paise / 100 : Number(raw);
      const allocPaise = Number.isFinite(parsed) ? toPaise(parsed) : 0;
      if (allocPaise <= 0 || allocPaise > s.total_paise) hasInvalid = true;
      allocations.push({ service_id: s.id, allocated_paise: allocPaise, total_paise: s.total_paise });
      billedTotal += s.total_paise;
      paidTotal += allocPaise;
    }
    return { allocations, billedTotal, paidTotal, hasInvalid };
  }, [services, selections]);

  const discountTotal = Math.max(0, billedTotal - paidTotal);
  const canSave = customerId && allocations.length > 0 && !hasInvalid && !create.isPending;

  function toggle(serviceId: UUID, fullPaise: number) {
    setSelections((prev) => {
      const next = { ...prev };
      if (next[serviceId] == null) {
        next[serviceId] = String(fullPaise / 100);
      } else {
        next[serviceId] = null;
      }
      return next;
    });
  }

  function setAmount(serviceId: UUID, value: string) {
    setSelections((prev) => ({
      ...prev,
      [serviceId]: value.replace(/[^0-9.]/g, ""),
    }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSave || !customerId) return;
    try {
      await create.mutateAsync({
        customer_id: customerId,
        method,
        payment_date: paymentDate,
        notes: notes || undefined,
        allocations: allocations.map(({ service_id, allocated_paise }) => ({
          service_id,
          allocated_paise,
        })),
      });
      toast.push(t("payment.recorded"), "success");
      router.push(`/customers/${customerId}`);
    } catch (err) {
      toast.push(err instanceof Error ? err.message : t("common.couldNotSave"), "error");
    }
  }

  const showServices = customerId !== null;
  const showDetails = tickedIds.length > 0;

  return (
    <form onSubmit={onSubmit} className="space-y-4 pb-32">
      <div className="card p-4 space-y-4">
        <CustomerPicker
          value={customerId}
          onChange={(id) => {
            setCustomerId(id);
            setSelections({});
          }}
          autoFocus={!initialCustomerId}
          filter={initialCustomerId ? "all" : "owing"}
        />
        {!customerId && (
          <p className="text-sm text-ink-muted">{t("hint.pickCustomerOwing")}</p>
        )}
      </div>

      {showServices && (
        <div className="card p-4 space-y-3">
          <h2 className="text-sm font-medium text-ink-muted">
            {t("payment.unpaidServices")}
          </h2>
          {loadingServices && (
            <p className="text-sm text-ink-muted">{t("common.loading")}</p>
          )}
          {!loadingServices && services.length === 0 && (
            <p className="text-sm text-ink-muted">{t("payment.noUnpaidServices")}</p>
          )}
          <ul className="space-y-2">
            {services.map((s) => {
              const ticked = selections[s.id] != null;
              const raw = selections[s.id] ?? "";
              const enteredRupees = raw.trim() === "" ? s.total_paise / 100 : Number(raw);
              const enteredPaise = Number.isFinite(enteredRupees) ? toPaise(enteredRupees) : 0;
              const overTotal = ticked && enteredPaise > s.total_paise;
              const zero = ticked && enteredPaise <= 0;
              const discount = ticked && enteredPaise < s.total_paise && enteredPaise > 0
                ? s.total_paise - enteredPaise
                : 0;
              return (
                <li
                  key={s.id}
                  className={cn(
                    "rounded-lg border px-3 py-2.5 transition-colors",
                    ticked ? "bg-primary/5 border-primary/40" : "bg-bg border-border"
                  )}
                >
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={ticked}
                      onChange={() => toggle(s.id, s.total_paise)}
                      className="w-5 h-5 accent-primary"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-ink truncate">{s.tool_name}</p>
                      <p className="text-xs text-ink-muted">
                        {formatDate(s.service_date, "D MMM YYYY")} ·{" "}
                        {formatHours(s.hours_x2)}
                      </p>
                    </div>
                    <Money paise={s.total_paise} className="font-semibold tabular-nums" />
                  </label>
                  {ticked && (
                    <div className="mt-2 pl-8 space-y-1">
                      <label className="block">
                        <span className="text-xs text-ink-muted">
                          {t("payment.amountPaid")}
                        </span>
                        <input
                          inputMode="decimal"
                          value={raw}
                          onChange={(e) => setAmount(s.id, e.target.value)}
                          className={cn(
                            "input h-10 tabular-nums",
                            (overTotal || zero) && "border-danger"
                          )}
                          placeholder={String(s.total_paise / 100)}
                          autoComplete="off"
                        />
                      </label>
                      {discount > 0 && (
                        <p className="text-xs text-ink-muted">
                          {t("payment.discountGiven")}{" "}
                          <Money paise={discount} className="font-medium" />
                        </p>
                      )}
                      {overTotal && (
                        <p className="text-xs text-danger">
                          {t("payment.amountExceedsTotal")}
                        </p>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {showDetails && (
        <div className="card p-4 space-y-4">
          <div>
            <span className="label">{t("payment.method")}</span>
            <div className="grid grid-cols-2 gap-2" role="radiogroup">
              <MethodChip
                active={method === "cash"}
                onClick={() => setMethod("cash")}
                label={t("payment.cash")}
              />
              <MethodChip
                active={method === "upi"}
                onClick={() => setMethod("upi")}
                label={t("payment.upi")}
              />
            </div>
          </div>

          <label className="block">
            <span className="label">{t("service.date")}</span>
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="input"
              max={dayjs().format("YYYY-MM-DD")}
            />
          </label>

          <label className="block">
            <span className="label">{t("service.notesOptional")}</span>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input"
            />
          </label>
        </div>
      )}

      <div className="fixed left-0 right-0 bottom-16 md:bottom-0 md:left-64 z-20 px-4 pb-3 md:pb-5 pt-3 bg-bg/95 backdrop-blur border-t border-border">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-ink-muted">{t("payment.receiving")}</p>
              <Money
                paise={paidTotal}
                className="text-3xl font-semibold tabular-nums text-success"
              />
              {discountTotal > 0 && (
                <p className="text-xs text-ink-muted mt-0.5">
                  {t("payment.discountGiven")}{" "}
                  <Money paise={discountTotal} className="font-medium" />
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={!canSave}
              className="btn-primary px-6 h-12 min-w-[140px]"
            >
              {create.isPending ? t("common.saving") : t("payment.save")}
            </button>
          </div>
          {!canSave && !create.isPending && (
            <p role="status" className="mt-1 text-xs text-ink-muted">
              {!customerId
                ? t("hint.pickCustomerOwing")
                : tickedIds.length === 0
                  ? t("hint.tickAtLeastOne")
                  : hasInvalid
                    ? t("hint.fixAmounts")
                    : ""}
            </p>
          )}
        </div>
      </div>
    </form>
  );
}

function MethodChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      role="radio"
      aria-checked={active}
      className={cn(
        "h-12 rounded-xl border font-medium transition-colors",
        active
          ? "bg-primary text-primary-ink border-primary"
          : "bg-surface text-ink border-border hover:bg-bg"
      )}
    >
      {label}
    </button>
  );
}
