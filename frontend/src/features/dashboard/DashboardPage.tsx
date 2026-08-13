import { Card } from "../../components/Card";
import { ErrorBanner } from "../../components/ErrorBanner";
import { useOverviewStats, useStreakStats } from "../../hooks/useStats";
import { StatTile } from "./StatTile";
import { CompletionChart } from "./CompletionChart";
import { TimeSpentChart } from "./TimeSpentChart";
import { OverdueWidget } from "./OverdueWidget";

export function DashboardPage() {
  const { data: overview, isError, error, refetch } = useOverviewStats();
  const { data: streaks } = useStreakStats();

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Dashboard</h1>

      {isError && <ErrorBanner message={error.message} onRetry={() => refetch()} />}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Subjects" value={String(overview?.total_subjects ?? "—")} />
        <StatTile
          label="Topics done"
          value={`${overview?.topics_done ?? 0}/${overview?.total_topics ?? 0}`}
          sub={overview ? `${overview.completion_pct}% complete` : undefined}
        />
        <StatTile label="Total time studied" value={`${overview?.total_minutes ?? 0} min`} />
        <StatTile
          label="Current streak"
          value={`${streaks?.current_streak ?? 0} day${streaks?.current_streak === 1 ? "" : "s"}`}
          sub={streaks ? `Longest: ${streaks.longest_streak}` : undefined}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <h2 className="mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">Completion by subject</h2>
          <CompletionChart />
        </Card>
        <Card>
          <h2 className="mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">Time spent per day</h2>
          <TimeSpentChart />
        </Card>
      </div>

      <Card>
        <h2 className="mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">Overdue</h2>
        <OverdueWidget />
      </Card>
    </div>
  );
}
