"use client";

import { cn } from "@/lib/cn";
import { balanceState } from "@/lib/domain/balance";
import { formatINR } from "@/lib/format";
import { useT } from "@/lib/i18n/useT";

type Props = {
  balancePaise: number;
  className?: string;
  size?: "sm" | "md";
};

export function BalancePill({ balancePaise, className, size = "md" }: Props) {
  const { t } = useT();
  const state = balanceState(balancePaise);
  const isSmall = size === "sm";

  if (state === "settled") {
    return (
      <span
        className={cn(
          "pill bg-success/10 text-success",
          isSmall && "h-6 px-2.5 text-xs",
          className
        )}
      >
        {t("balance.settled")}
      </span>
    );
  }

  if (state === "advance") {
    return (
      <span
        className={cn(
          "pill bg-primary/10 text-primary tabular-nums",
          isSmall && "h-6 px-2.5 text-xs",
          className
        )}
      >
        {t("balance.advance", { amount: formatINR(-balancePaise) })}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "pill bg-danger/10 text-danger tabular-nums font-semibold",
        isSmall && "h-6 px-2.5 text-xs",
        className
      )}
    >
      {t("balance.owes", { amount: formatINR(balancePaise) })}
    </span>
  );
}
