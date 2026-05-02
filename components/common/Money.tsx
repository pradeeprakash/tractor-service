import { formatINR } from "@/lib/format";
import { cn } from "@/lib/cn";

type Props = {
  paise: number;
  className?: string;
  showPaise?: boolean;
  signed?: boolean;
};

export function Money({ paise, className, showPaise, signed }: Props) {
  const formatted = formatINR(Math.abs(paise), { showPaise });
  const sign = signed ? (paise < 0 ? "−" : paise > 0 ? "+" : "") : "";
  return (
    <span className={cn("tabular-nums", className)}>
      {sign}
      {formatted}
    </span>
  );
}
