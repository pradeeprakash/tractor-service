import { PageHeader } from "@/components/common/PageHeader";
import { ToolForm } from "../ToolForm";
import { getServerT } from "@/lib/i18n/server";

export default async function NewToolPage() {
  const { t } = await getServerT();
  return (
    <>
      <PageHeader title={t("tool.add")} back="/tools" />
      <div className="p-4">
        <ToolForm />
      </div>
    </>
  );
}
