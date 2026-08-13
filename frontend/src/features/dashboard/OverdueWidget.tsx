import { Link } from "react-router-dom";
import { useOverdueStats } from "../../hooks/useStats";

export function OverdueWidget() {
  const { data, isLoading } = useOverdueStats();

  if (isLoading) return <p className="text-sm text-neutral-500">Loading…</p>;
  if (!data) return null;

  const nothingOverdue = data.overdue_goals.length === 0 && data.due_reviews_count === 0;
  if (nothingOverdue) {
    return <p className="text-sm text-emerald-600 dark:text-emerald-400">Nothing overdue. Nice work.</p>;
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
        <p key={g.id} className="text-red-600 dark:text-red-400">
          Overdue: {g.title} (was due {g.target_date})
        </p>
      ))}
    </div>
  );
}
