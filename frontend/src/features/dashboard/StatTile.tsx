import type { LucideIcon } from "lucide-react";
import { Card } from "../../components/Card";

export function StatTile({
  label,
  value,
  sub,
  icon: Icon,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: LucideIcon;
}) {
  return (
    <Card className="flex items-start gap-3">
      <div className="rounded-md border border-accent-500/30 bg-accent-500/10 p-2 text-accent-600 dark:text-accent-400">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="font-mono-label text-xs text-neutral-500">{label}</p>
        <p className="mt-1 font-mono text-2xl font-semibold tabular-nums">{value}</p>
        {sub && <p className="mt-1 text-xs text-neutral-500">{sub}</p>}
      </div>
    </Card>
  );
}
