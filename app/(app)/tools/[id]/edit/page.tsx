import { PageHeader } from "@/components/common/PageHeader";
import { ToolForm } from "../../ToolForm";
import { getServerT } from "@/lib/i18n/server";

export default async function EditToolPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { t } = await getServerT();
  return (
    <>
      <PageHeader title={t("tool.edit")} back="/tools" />
      <div className="p-4">
        <ToolForm toolId={id} />
      </div>
    </>
  );
}
