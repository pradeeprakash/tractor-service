import Link from "next/link";
import { PageHeader } from "@/components/common/PageHeader";
import { ToolsClient } from "./ToolsClient";
import { Plus } from "lucide-react";
import { getServerT } from "@/lib/i18n/server";

export default async function ToolsPage() {
  const { t } = await getServerT();
  return (
    <>
      <PageHeader
        title={t("tool.title")}
        back="/more"
        actions={
          <Link href="/tools/new" className="btn-secondary h-10 px-3" aria-label={t("tool.addAria")}>
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">{t("common.add")}</span>
          </Link>
        }
      />
      <div className="p-4">
        <ToolsClient />
      </div>
    </>
  );
}
