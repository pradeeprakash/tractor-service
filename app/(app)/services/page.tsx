import { PageHeader } from "@/components/common/PageHeader";
import { RecentServicesClient } from "./RecentServicesClient";
import { getServerT } from "@/lib/i18n/server";

export default async function ServicesPage() {
  const { t } = await getServerT();
  return (
    <>
      <PageHeader title={t("service.recent")} />
      <div className="p-4">
        <RecentServicesClient />
      </div>
    </>
  );
}
