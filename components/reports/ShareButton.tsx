"use client";

import { Printer, Send } from "lucide-react";
import { buildStatementText, whatsappLink, tryWebShare } from "@/lib/share";
import type { Customer, Payment, Service } from "@/lib/domain/types";
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

export function ShareButton(props: Props) {
  const { t } = useT();

  const text = buildStatementText({
    t,
    businessName: props.businessName,
    customerName: props.customer.name,
    asOf: props.asOf,
    services: props.services,
    payments: props.payments,
    totalBilledPaise: props.totalBilledPaise,
    totalPaidPaise: props.totalPaidPaise,
    balancePaise: props.balancePaise,
  });

  function onWhatsApp() {
    const url = whatsappLink(props.customer.phone, text);
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function onShare() {
    const shared = tryWebShare(text, t("report.statementOf", { name: props.customer.name }));
    if (!shared) onWhatsApp();
  }

  function onPrint() {
    window.print();
  }

  return (
    <div className="no-print flex flex-wrap gap-2">
      <button onClick={onShare} className="btn-primary">
        <Send className="w-4 h-4" />
        {t("report.shareWhatsApp")}
      </button>
      <button onClick={onPrint} className="btn-secondary">
        <Printer className="w-4 h-4" />
        {t("report.printPdf")}
      </button>
    </div>
  );
}
