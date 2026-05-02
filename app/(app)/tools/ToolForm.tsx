"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCreateTool, useTool, useUpdateTool } from "@/lib/queries/tools";
import { useToast } from "@/components/common/Toast";
import { paise as toPaise, rupees as toRupees } from "@/lib/format";
import { useT } from "@/lib/i18n/useT";

export function ToolForm({ toolId }: { toolId?: string }) {
  const router = useRouter();
  const create = useCreateTool();
  const update = useUpdateTool();
  const toast = useToast();
  const { t } = useT();
  const { data: existing } = useTool(toolId);

  const [name, setName] = useState("");
  const [rateRupees, setRateRupees] = useState<string>("");
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (existing) {
      setName(existing.name);
      setRateRupees(String(toRupees(existing.rate_paise_per_hour)));
      setActive(existing.active);
    }
  }, [existing]);

  const ratePaise = Math.max(0, Math.round(Number(rateRupees) * 100));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || ratePaise <= 0) return;
    try {
      if (toolId) {
        await update.mutateAsync({
          id: toolId,
          name: name.trim(),
          rate_paise_per_hour: ratePaise,
          active,
        });
        toast.push(t("tool.updated"), "success");
      } else {
        await create.mutateAsync({ name: name.trim(), rate_paise_per_hour: ratePaise, active });
        toast.push(t("tool.added"), "success");
      }
      router.push("/tools");
    } catch (err) {
      toast.push(err instanceof Error ? err.message : t("common.couldNotSave"), "error");
    }
  }

  const pending = create.isPending || update.isPending;

  return (
    <form onSubmit={onSubmit} className="card p-5 space-y-4">
      <label className="block">
        <span className="label">{t("tool.name")}</span>
        <input
          autoFocus={!toolId}
          required
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("tool.placeholder")}
        />
      </label>
      <label className="block">
        <span className="label">{t("tool.hourlyRate")}</span>
        <input
          required
          inputMode="decimal"
          className="input tabular-nums"
          value={rateRupees}
          onChange={(e) => setRateRupees(e.target.value.replace(/[^0-9.]/g, ""))}
          placeholder={t("tool.ratePlaceholder")}
        />
      </label>
      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={active}
          onChange={(e) => setActive(e.target.checked)}
          className="w-5 h-5 accent-[rgb(var(--primary))]"
        />
        <span className="text-sm">{t("tool.active")}</span>
      </label>
      <button
        type="submit"
        disabled={pending || !name.trim() || ratePaise <= 0}
        className="btn-primary w-full"
      >
        {pending ? t("common.saving") : toolId ? t("tool.updateTool") : t("tool.saveTool")}
      </button>
      {!pending && (!name.trim() || ratePaise <= 0) && (
        <p role="status" className="text-xs text-ink-muted text-center">
          {t("hint.enterToolDetails")}
        </p>
      )}
      {ratePaise > 0 && (
        <p className="text-xs text-ink-muted">
          {t("tool.paiseHint", {
            n: toPaise(Number(rateRupees) || 0).toLocaleString("en-IN"),
          })}
        </p>
      )}
    </form>
  );
}
