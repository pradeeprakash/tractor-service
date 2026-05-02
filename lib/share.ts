import { formatINR, formatDate, formatHours } from "@/lib/format";
import type { Service, Payment } from "@/lib/domain/types";
import type { TFn } from "@/lib/i18n/I18nProvider";

type StatementInput = {
  t: TFn;
  businessName: string;
  customerName: string;
  asOf: Date;
  services: Array<Service & { tool_name: string }>;
  payments: Payment[];
  totalBilledPaise: number;
  totalPaidPaise: number;
  balancePaise: number;
};

export function buildStatementText(input: StatementInput): string {
  const {
    t,
    businessName,
    customerName,
    asOf,
    services,
    payments,
    totalBilledPaise,
    totalPaidPaise,
    balancePaise,
  } = input;

  const lines: string[] = [];
  lines.push(`*${businessName}*`);
  lines.push(t("report.waForCustomer", { name: customerName }));
  lines.push(t("report.waAsOf", { date: formatDate(asOf) }));
  lines.push("");

  if (services.length > 0) {
    lines.push(`*${t("report.waServices")}*`);
    for (const s of services) {
      lines.push(
        `• ${formatDate(s.service_date, "D MMM")} — ${s.tool_name} ${formatHours(s.hours_x2)} → ${formatINR(s.total_paise)}`
      );
    }
    lines.push("");
  }

  if (payments.length > 0) {
    lines.push(`*${t("report.waPayments")}*`);
    for (const p of payments) {
      lines.push(
        `• ${formatDate(p.payment_date, "D MMM")} — ${formatINR(p.amount_paise)} (${p.method.toUpperCase()})`
      );
    }
    lines.push("");
  }

  lines.push(t("report.waTotalBilled", { amount: formatINR(totalBilledPaise) }));
  lines.push(t("report.waTotalPaid", { amount: formatINR(totalPaidPaise) }));
  lines.push("");
  if (balancePaise > 0) {
    lines.push(`*${t("report.waBalanceDue", { amount: formatINR(balancePaise) })}*`);
  } else if (balancePaise < 0) {
    lines.push(`*${t("report.waAdvance", { amount: formatINR(-balancePaise) })}*`);
  } else {
    lines.push(`*${t("report.waSettled")}*`);
  }
  lines.push("");
  lines.push(t("report.waThanks"));
  return lines.join("\n");
}

export function whatsappLink(phone: string | null, text: string): string {
  const digits = (phone ?? "").replace(/\D/g, "");
  const encoded = encodeURIComponent(text);
  return digits ? `https://wa.me/${digits}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
}

export function tryWebShare(text: string, title: string): boolean {
  if (typeof navigator === "undefined") return false;
  const nav = navigator as Navigator & { share?: (data: ShareData) => Promise<void> };
  if (typeof nav.share === "function") {
    nav.share({ title, text }).catch(() => undefined);
    return true;
  }
  return false;
}

declare global {
  interface ShareData {
    title?: string;
    text?: string;
    url?: string;
  }
}
