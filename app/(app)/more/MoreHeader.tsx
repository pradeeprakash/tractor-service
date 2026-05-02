"use client";

import { PageHeader } from "@/components/common/PageHeader";
import { useT } from "@/lib/i18n/useT";

export function MoreHeader() {
  const { t } = useT();
  return <PageHeader title={t("nav.more")} />;
}
