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
      <div className="rounded-lg bg-blue-50 p-2 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm text-neutral-500">{label}</p>
        <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
        {sub && <p className="mt-1 text-xs text-neutral-500">{sub}</p>}
      </div>
    </Card>
  );
}
