"use client";

import Link from "next/link";
import { ChevronRight, MapPin, Phone } from "lucide-react";
import { Money } from "@/components/common/Money";
import { BalancePill } from "./BalancePill";
import type { CustomerBalance } from "@/lib/domain/types";
import { formatPhone } from "@/lib/format";
import { useT } from "@/lib/i18n/useT";

export function CustomerLedgerCard({ row }: { row: CustomerBalance }) {
  const { t } = useT();
  return (
    <Link
      href={`/customers/${row.customer_id}`}
      className="card p-4 flex items-center gap-3 hover:bg-bg/60 active:bg-bg transition-colors"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-semibold text-ink truncate">{row.name}</h3>
          <BalancePill balancePaise={row.balance_paise} size="sm" />
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-ink-muted">
          {row.village && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {row.village}
            </span>
          )}
          {row.phone && (
            <span className="inline-flex items-center gap-1">
              <Phone className="w-3.5 h-3.5" />
              {formatPhone(row.phone)}
            </span>
          )}
        </div>
        <div className="mt-2 flex items-center gap-4 text-sm">
          <span className="text-ink-muted">
            {t("customer.billed")}{" "}
            <Money paise={row.total_billed_paise} className="text-ink font-medium" />
          </span>
          <span className="text-ink-muted">
            {t("customer.paid")}{" "}
            <Money paise={row.total_paid_paise} className="text-ink font-medium" />
          </span>
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-ink-muted shrink-0" />
    </Link>
  );
}
