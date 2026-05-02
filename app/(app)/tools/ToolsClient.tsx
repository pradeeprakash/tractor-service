"use client";

import Link from "next/link";
import { useState } from "react";
import { Wrench } from "lucide-react";
import { useTools, useUpdateTool } from "@/lib/queries/tools";
import { Money } from "@/components/common/Money";
import { EmptyState } from "@/components/common/EmptyState";
import { ListSkeleton } from "@/components/common/Skeleton";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { useToast } from "@/components/common/Toast";
import { useT } from "@/lib/i18n/useT";
import type { Tool } from "@/lib/domain/types";

export function ToolsClient() {
  const { t } = useT();
  const { data: tools = [], isLoading } = useTools();
  const update = useUpdateTool();
  const toast = useToast();
  const [confirmTarget, setConfirmTarget] = useState<Tool | null>(null);

  async function commitToggle(target: Tool) {
    try {
      await update.mutateAsync({ id: target.id, active: !target.active });
      toast.push(target.active ? t("tool.deactivated") : t("tool.activated"), "success");
    } catch (err) {
      toast.push(err instanceof Error ? err.message : t("common.couldNotUpdate"), "error");
    } finally {
      setConfirmTarget(null);
    }
  }

  if (isLoading) return <ListSkeleton rows={4} />;

  if (tools.length === 0) {
    return (
      <EmptyState
        icon={<Wrench className="w-6 h-6" />}
        title={t("tool.noneYet")}
        description={t("tool.noneYetDesc")}
        action={
          <Link href="/tools/new" className="btn-primary">
            {t("tool.add")}
          </Link>
        }
      />
    );
  }

  return (
    <>
      <ul className="space-y-2">
        {tools.map((it) => (
          <li key={it.id} className="card p-4 flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="font-semibold truncate">{it.name}</p>
                {!it.active && (
                  <span className="pill bg-ink/5 text-ink-muted text-xs">
                    {t("tool.inactive")}
                  </span>
                )}
              </div>
              <p className="text-sm text-ink-muted">
                <Money paise={it.rate_paise_per_hour} className="font-medium text-ink" />{" "}
                {t("tool.perHour")}
              </p>
            </div>
            <Link href={`/tools/${it.id}/edit`} className="btn-ghost h-10 px-3 text-sm">
              {t("common.edit")}
            </Link>
            <button
              onClick={() => {
                if (it.active) {
                  setConfirmTarget(it); // ask before deactivating
                } else {
                  void commitToggle(it); // reactivation is safe, no confirm
                }
              }}
              className="btn-ghost h-10 px-3 text-sm"
            >
              {it.active ? t("tool.deactivate") : t("tool.activate")}
            </button>
          </li>
        ))}
      </ul>

      <ConfirmDialog
        open={confirmTarget !== null}
        title={
          confirmTarget
            ? t("confirm.deactivateToolTitle", { name: confirmTarget.name })
            : ""
        }
        body={t("confirm.deactivateToolBody")}
        confirmLabel={t("confirm.deactivateToolAction")}
        destructive
        busy={update.isPending}
        onCancel={() => setConfirmTarget(null)}
        onConfirm={() => confirmTarget && commitToggle(confirmTarget)}
      />
    </>
  );
}
