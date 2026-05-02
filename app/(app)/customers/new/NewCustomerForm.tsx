"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCreateCustomer } from "@/lib/queries/customers";
import { useToast } from "@/components/common/Toast";
import { useT } from "@/lib/i18n/useT";

export function NewCustomerForm() {
  const router = useRouter();
  const create = useCreateCustomer();
  const toast = useToast();
  const { t } = useT();
  const [form, setForm] = useState({
    name: "",
    phone: "",
    village: "",
    notes: "",
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    try {
      const c = await create.mutateAsync(form);
      toast.push(t("customer.added", { name: c.name }), "success");
      router.push(`/customers/${c.id}`);
    } catch (err) {
      toast.push(err instanceof Error ? err.message : t("common.couldNotSave"), "error");
    }
  }

  return (
    <form onSubmit={onSubmit} className="card p-5 space-y-4">
      <Field label={t("customer.name")} required>
        <input
          required
          autoFocus
          autoComplete="off"
          className="input"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
      </Field>
      <Field label={t("customer.phone")}>
        <input
          inputMode="tel"
          autoComplete="tel"
          className="input"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />
      </Field>
      <Field label={t("customer.village")}>
        <input
          autoComplete="address-level2"
          className="input"
          value={form.village}
          onChange={(e) => setForm({ ...form, village: e.target.value })}
        />
      </Field>
      <Field label={t("customer.notes")}>
        <textarea
          rows={3}
          className="input h-auto py-2.5 resize-none"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
        />
      </Field>
      <button
        type="submit"
        disabled={create.isPending || !form.name.trim()}
        className="btn-primary w-full"
      >
        {create.isPending ? t("common.saving") : t("customer.saveCustomer")}
      </button>
      {!form.name.trim() && !create.isPending && (
        <p role="status" className="text-xs text-ink-muted text-center">
          {t("hint.enterCustomerName")}
        </p>
      )}
    </form>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="label">
        {label}
        {required && <span className="text-danger ml-0.5">*</span>}
      </span>
      {children}
    </label>
  );
}
