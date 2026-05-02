import { PageHeader } from "@/components/common/PageHeader";
import { ExpenseForm } from "./ExpenseForm";
import { getServerT } from "@/lib/i18n/server";

export default async function NewExpensePage() {
  const { t } = await getServerT();
  return (
    <>
      <PageHeader title={t("expense.add")} back="/expenses" />
      <div className="p-4">
        <ExpenseForm />
      </div>
    </>
  );
}
