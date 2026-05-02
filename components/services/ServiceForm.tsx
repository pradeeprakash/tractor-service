"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import { CheckCircle2 } from "lucide-react";
import { CustomerPicker } from "@/components/customers/CustomerPicker";
import { HoursStepper } from "./HoursStepper";
import { ToolPicker } from "./ToolPicker";
import { Money } from "@/components/common/Money";
import { useTools } from "@/lib/queries/tools";
import { useCustomerBalance } from "@/lib/queries/customers";
import { useCreateService } from "@/lib/queries/services";
import { useToast } from "@/components/common/Toast";
import { calcServiceTotalPaise } from "@/lib/domain/pricing";
import type { Customer, UUID } from "@/lib/domain/types";
import { useT } from "@/lib/i18n/useT";

const LAST_TOOL_KEY = "tsms:lastToolId";

type Props = {
  initialCustomerId?: UUID;
};

export function ServiceForm({ initialCustomerId }: Props) {
  const { t } = useT();
  const router = useRouter();
  const { data: tools = [] } = useTools({ onlyActive: true });
  const create = useCreateService();
  const toast = useToast();

  const [customerId, setCustomerId] = useState<UUID | null>(initialCustomerId ?? null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [toolId, setToolId] = useState<UUID | null>(null);
  const [hours, setHours] = useState<number>(1);
  const [serviceDate, setServiceDate] = useState<string>(dayjs().format("YYYY-MM-DD"));
  const [notes, setNotes] = useState<string>("");
  const [justSaved, setJustSaved] = useState(false);

  const { data: balance } = useCustomerBalance(customerId ?? undefined);

  useEffect(() => {
    if (toolId || tools.length === 0) return;
    const last = typeof window !== "undefined" ? window.localStorage.getItem(LAST_TOOL_KEY) : null;
    const fromLast = last && tools.find((tool) => tool.id === last);
    setToolId(fromLast ? fromLast.id : tools[0].id);
  }, [tools, toolId]);

  const tool = useMemo(() => tools.find((tool) => tool.id === toolId) ?? null, [tools, toolId]);

  const totalPaise = useMemo(() => {
    if (!tool) return 0;
    try {
      return calcServiceTotalPaise(tool.rate_paise_per_hour, hours);
    } catch {
      return 0;
    }
  }, [tool, hours]);

  const canSave = customerId && toolId && tool && hours > 0 && !create.isPending;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSave || !customerId || !toolId || !tool) return;
    try {
      await create.mutateAsync({
        customer_id: customerId,
        tool_id: toolId,
        hours,
        rate_paise_per_hour: tool.rate_paise_per_hour,
        service_date: serviceDate,
        notes: notes || undefined,
      });
      if (typeof window !== "undefined") {
        window.localStorage.setItem(LAST_TOOL_KEY, toolId);
      }
      const name = customer?.name ?? "";
      toast.push(t("service.savedFor", { name }), "success");
      setJustSaved(true);
      setCustomerId(null);
      setCustomer(null);
      setHours(1);
      setNotes("");
      setServiceDate(dayjs().format("YYYY-MM-DD"));
      // Drop any ?customer=... so the next entry starts on a clean URL.
      if (initialCustomerId) router.replace("/services/new");
      setTimeout(() => setJustSaved(false), 1200);
    } catch (err) {
      toast.push(err instanceof Error ? err.message : t("common.couldNotSave"), "error");
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 pb-28">
      <div className="card p-4 space-y-4">
        <CustomerPicker
          value={customerId}
          onChange={(id, c) => {
            setCustomerId(id);
            setCustomer(c);
          }}
          autoFocus={!initialCustomerId}
        />
        {balance && customerId && (
          <p className="-mt-2 text-xs text-ink-muted">
            {t("customer.currentBalance")}:{" "}
            <Money paise={balance.balance_paise} signed className="font-medium text-ink" />
          </p>
        )}

        <ToolPicker tools={tools} value={toolId} onChange={(id) => setToolId(id)} />

        <HoursStepper value={hours} onChange={setHours} />

        <label className="block">
          <span className="label">{t("service.date")}</span>
          <input
            type="date"
            value={serviceDate}
            onChange={(e) => setServiceDate(e.target.value)}
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
            placeholder={t("service.notesPlaceholder")}
          />
        </label>
      </div>

      <div className="fixed left-0 right-0 bottom-16 md:bottom-0 md:left-64 z-20 px-4 pb-3 md:pb-5 pt-3 bg-bg/95 backdrop-blur border-t border-border">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-ink-muted">{t("service.total")}</p>
              <Money paise={totalPaise} className="text-3xl font-semibold tabular-nums" />
            </div>
            <button
              type="submit"
              disabled={!canSave}
              className="btn-primary px-6 h-12 min-w-[140px]"
            >
              {create.isPending ? (
                t("service.saving")
              ) : justSaved ? (
                <span className="inline-flex items-center gap-2 animate-pop">
                  <CheckCircle2 className="w-5 h-5" /> {t("service.saved")}
                </span>
              ) : (
                t("service.save")
              )}
            </button>
          </div>
          {!canSave && !create.isPending && !justSaved && (
            <p role="status" className="mt-1 text-xs text-ink-muted">
              {t("hint.pickCustomer")}
            </p>
          )}
        </div>
      </div>
    </form>
  );
}
