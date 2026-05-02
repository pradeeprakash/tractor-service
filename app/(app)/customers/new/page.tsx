import { PageHeader } from "@/components/common/PageHeader";
import { NewCustomerForm } from "./NewCustomerForm";
import { getServerT } from "@/lib/i18n/server";

export default async function NewCustomerPage() {
  const { t } = await getServerT();
  return (
    <>
      <PageHeader title={t("customer.add")} back="/customers" />
      <div className="p-4">
        <NewCustomerForm />
      </div>
    </>
  );
}
