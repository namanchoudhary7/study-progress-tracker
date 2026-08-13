import { Link } from "react-router-dom";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { useOverdueStats } from "../../hooks/useStats";

export function OverdueWidget() {
  const { data, isLoading } = useOverdueStats();

  if (isLoading) return <p className="text-sm text-neutral-500">Loading…</p>;
  if (!data) return null;

  const nothingOverdue = data.overdue_goals.length === 0 && data.due_reviews_count === 0;
  if (nothingOverdue) {
    return (
      <p className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
        <CheckCircle2 className="h-4 w-4" /> Nothing overdue. Nice work.
      </p>
    );
  }

  return (
    <div className="space-y-2 text-sm">
      {data.due_reviews_count > 0 && (
        <p>
          <Link to="/review" className="font-medium text-blue-600 hover:underline dark:text-blue-400">
            {data.due_reviews_count} topic{data.due_reviews_count === 1 ? "" : "s"} due for review
          </Link>
        </p>
      )}
      {data.overdue_goals.map((g) => (
        <p key={g.id} className="flex items-center gap-2 text-red-600 dark:text-red-400">
          <AlertTriangle className="h-4 w-4 shrink-0" /> Overdue: {g.title} (was due {g.target_date})
        </p>
      ))}
    </div>
  );
}
