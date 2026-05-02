import { CustomerLedgerClient } from "./CustomerLedgerClient";
import { PageHeader } from "@/components/common/PageHeader";
import Link from "next/link";
import { UserPlus } from "lucide-react";
import { getServerT } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const { t } = await getServerT();
  return (
    <>
      <PageHeader
        title={t("customer.title")}
        actions={
          <Link
            href="/customers/new"
            aria-label={t("customer.add")}
            className="btn-secondary h-10 px-3"
          >
            <UserPlus className="w-4 h-4" />
            <span className="hidden sm:inline">{t("customer.addShort")}</span>
          </Link>
        }
      />
      <div className="p-4">
        <CustomerLedgerClient />
      </div>
    </>
  );
}
