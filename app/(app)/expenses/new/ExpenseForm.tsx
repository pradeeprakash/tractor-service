"use client";

import { useState } from "react";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import { useCreateExpense } from "@/lib/queries/expenses";
import { useToast } from "@/components/common/Toast";
import type { ExpenseCategory } from "@/lib/domain/types";
import { cn } from "@/lib/cn";
import { useT, type TKey } from "@/lib/i18n/useT";

const CATEGORIES: Array<{ value: ExpenseCategory; key: TKey }> = [
  { value: "fuel", key: "expense.cat_fuel" },
  { value: "maintenance", key: "expense.cat_maintenance" },
  { value: "repair", key: "expense.cat_repair" },
  { value: "other", key: "expense.cat_other" },
];

export function ExpenseForm() {
  const router = useRouter();
  const create = useCreateExpense();
  const toast = useToast();
  const { t } = useT();

  const [category, setCategory] = useState<ExpenseCategory>("fuel");
  const [amountRupees, setAmountRupees] = useState<string>("");
  const [date, setDate] = useState<string>(dayjs().format("YYYY-MM-DD"));
  const [notes, setNotes] = useState<string>("");

  const amountPaise = Math.max(0, Math.round(Number(amountRupees) * 100));
  const canSave = amountPaise > 0 && !create.isPending;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSave) return;
    try {
      await create.mutateAsync({
        category,
        amount_paise: amountPaise,
        expense_date: date,
        notes: notes || undefined,
      });
      toast.push(t("expense.saved"), "success");
      router.push("/expenses");
    } catch (err) {
      toast.push(err instanceof Error ? err.message : t("common.couldNotSave"), "error");
    }
  }

  return (
    <form onSubmit={onSubmit} className="card p-5 space-y-4">
      <div>
        <span className="label">{t("expense.category")}</span>
        <div className="grid grid-cols-2 gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setCategory(c.value)}
              className={cn(
                "h-12 rounded-xl border font-medium text-sm",
                category === c.value
                  ? "bg-primary text-primary-ink border-primary"
                  : "bg-surface text-ink border-border hover:bg-bg"
              )}
            >
              {t(c.key)}
            </button>
          ))}
        </div>
      </div>

      <label className="block">
        <span className="label">{t("expense.amount")}</span>
        <input
          required
          inputMode="decimal"
          value={amountRupees}
          onChange={(e) => setAmountRupees(e.target.value.replace(/[^0-9.]/g, ""))}
          className="input text-2xl tabular-nums h-14 font-semibold"
          autoFocus
          autoComplete="off"
        />
      </label>

      <label className="block">
        <span className="label">{t("expense.date")}</span>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="input"
          max={dayjs().format("YYYY-MM-DD")}
        />
      </label>

      <label className="block">
        <span className="label">{t("service.notesOptional")}</span>
        <input value={notes} onChange={(e) => setNotes(e.target.value)} className="input" />
      </label>

      <button type="submit" disabled={!canSave} className="btn-primary w-full">
        {create.isPending ? t("common.saving") : t("expense.save")}
      </button>
      {!canSave && !create.isPending && (
        <p role="status" className="text-xs text-ink-muted text-center">
          {t("hint.enterAmount")}
        </p>
      )}
    </form>
  );
}
