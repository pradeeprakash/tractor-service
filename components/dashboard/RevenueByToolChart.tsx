import { Money } from "@/components/common/Money";

type Row = { tool: string; paise: number; count: number };

export function RevenueByToolChart({ rows }: { rows: Row[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-ink-muted">No services yet.</p>;
  }
  const max = Math.max(...rows.map((r) => r.paise), 1);
  return (
    <div className="space-y-2.5">
      {rows.map((r) => {
        const pct = Math.round((r.paise / max) * 100);
        return (
          <div key={r.tool}>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="font-medium">{r.tool}</span>
              <span className="text-ink-muted tabular-nums">
                {r.count} svc · <Money paise={r.paise} className="text-ink font-medium" />
              </span>
            </div>
            <div className="h-2 rounded-full bg-bg overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${Math.max(4, pct)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
