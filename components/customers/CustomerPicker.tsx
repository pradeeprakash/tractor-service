"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, UserPlus, X, Check } from "lucide-react";
import {
  useCustomers,
  useCreateCustomer,
  useOwingCustomers,
} from "@/lib/queries/customers";
import { useToast } from "@/components/common/Toast";
import type { Customer, UUID } from "@/lib/domain/types";
import { cn } from "@/lib/cn";
import { formatPhone } from "@/lib/format";
import { useT } from "@/lib/i18n/useT";
import { BalancePill } from "@/components/customers/BalancePill";

type PickerRow = {
  id: UUID;
  name: string;
  phone: string | null;
  village: string | null;
  balance_paise?: number;
};

type Props = {
  value: UUID | null;
  onChange: (id: UUID, customer: Customer) => void;
  autoFocus?: boolean;
  // "owing" lists only customers with balance > 0 and disables inline-add.
  filter?: "all" | "owing";
};

export function CustomerPicker({ value, onChange, autoFocus, filter = "all" }: Props) {
  const { t } = useT();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const all = useCustomers(filter === "all" ? query : "");
  const owing = useOwingCustomers(filter === "owing" ? query : "");
  const isLoading = filter === "owing" ? owing.isLoading : all.isLoading;

  const rows: PickerRow[] = useMemo(() => {
    if (filter === "owing") {
      return (owing.data ?? []).map((b) => ({
        id: b.customer_id,
        name: b.name,
        phone: b.phone,
        village: b.village,
        balance_paise: b.balance_paise,
      }));
    }
    return (all.data ?? []).map((c) => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      village: c.village,
    }));
  }, [filter, all.data, owing.data]);

  const create = useCreateCustomer();
  const toast = useToast();

  const selected = useMemo(
    () => rows.find((c) => c.id === value) ?? null,
    [rows, value]
  );

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  async function addNewCustomer() {
    const name = query.trim();
    if (!name) {
      inputRef.current?.focus();
      return;
    }
    setAdding(true);
    try {
      const created = await create.mutateAsync({ name });
      toast.push(t("customer.added", { name: created.name }), "success");
      onChange(created.id, created);
      setQuery(created.name);
      setOpen(false);
    } catch (err) {
      toast.push(err instanceof Error ? err.message : t("common.couldNotAdd"), "error");
    } finally {
      setAdding(false);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <label className="label" htmlFor="customer-picker">
        {t("nav.customers")}
      </label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-muted pointer-events-none" />
        <input
          id="customer-picker"
          ref={inputRef}
          type="text"
          autoComplete="off"
          inputMode="search"
          placeholder={t("customer.searchOrAdd")}
          value={selected && !open ? selected.name : query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          className="input pl-10 pr-10"
        />
        {(query || selected) && (
          <button
            type="button"
            aria-label={t("common.clear")}
            onClick={() => {
              setQuery("");
              setOpen(true);
              inputRef.current?.focus();
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full hover:bg-bg flex items-center justify-center text-ink-muted"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute z-20 mt-1 w-full max-h-72 overflow-y-auto card p-1 animate-fade-in">
          {isLoading && (
            <div className="px-3 py-2 text-sm text-ink-muted">{t("customer.searching")}</div>
          )}
          {!isLoading && rows.length === 0 && (
            <div className="px-3 py-3 text-sm text-ink-muted">
              {filter === "owing" ? t("customer.noneOwing") : t("customer.noneMatch")}
            </div>
          )}
          <ul role="listbox">
            {rows.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(c.id, rowToCustomer(c));
                    setQuery("");
                    setOpen(false);
                  }}
                  className={cn(
                    "w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-2 hover:bg-bg",
                    selected?.id === c.id && "bg-bg"
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-ink truncate">{c.name}</p>
                    <p className="text-xs text-ink-muted truncate">
                      {[c.village, formatPhone(c.phone)].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  {filter === "owing" && c.balance_paise !== undefined && (
                    <BalancePill balancePaise={c.balance_paise} size="sm" />
                  )}
                  {selected?.id === c.id && <Check className="w-4 h-4 text-primary" />}
                </button>
              </li>
            ))}
          </ul>
          {filter !== "owing" && (
            <button
              type="button"
              disabled={adding || !query.trim()}
              onClick={addNewCustomer}
              className="w-full mt-1 px-3 py-2.5 rounded-lg flex items-center gap-2 hover:bg-primary/10 text-primary font-medium disabled:opacity-50"
            >
              <UserPlus className="w-4 h-4" />
              {query.trim()
                ? t("customer.addInline", { name: query.trim() })
                : t("customer.typeToAdd")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// The owing-mode picker reads from the customer_balances view, which doesn't carry
// owner_id/notes/created_at. Callers only use id/name/phone/village from this object,
// so we synthesize a Customer-shaped record for the onChange contract.
function rowToCustomer(r: PickerRow): Customer {
  return {
    id: r.id,
    owner_id: "",
    name: r.name,
    phone: r.phone,
    village: r.village,
    notes: null,
    created_at: "",
  };
}
