import { PageHeader } from "@/components/common/PageHeader";
import { ServiceForm } from "@/components/services/ServiceForm";
import { getServerT } from "@/lib/i18n/server";

export default async function NewServicePage({
  searchParams,
}: {
  searchParams: Promise<{ customer?: string }>;
}) {
  const { customer } = await searchParams;
  const { t } = await getServerT();
  return (
    <>
      <PageHeader title={t("service.title")} back="/" />
      <div className="p-4">
        <ServiceForm key={customer ?? "no-customer"} initialCustomerId={customer} />
      </div>
    </>
  );
}
