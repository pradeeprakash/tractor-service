import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { ExpensesClient } from "./ExpensesClient";
import { getServerT } from "@/lib/i18n/server";

export default async function ExpensesPage() {
  const { t } = await getServerT();
  return (
    <>
      <PageHeader
        title={t("expense.title")}
        back="/more"
        actions={
          <Link href="/expenses/new" className="btn-secondary h-10 px-3">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">{t("common.add")}</span>
          </Link>
        }
      />
      <div className="p-4">
        <ExpensesClient />
      </div>
    </>
  );
}
