import { useState } from "react";
import { Card } from "../../components/Card";
import { ErrorBanner } from "../../components/ErrorBanner";
import { useOverviewStats, useStreakStats } from "../../hooks/useStats";
import { StatTile } from "./StatTile";
import { CompletionChart } from "./CompletionChart";
import { TimeSpentChart } from "./TimeSpentChart";
import { OverdueWidget } from "./OverdueWidget";
import { StreakHeatmap } from "./StreakHeatmap";

export function DashboardPage() {
  const { data: overview, isError, error, refetch } = useOverviewStats();
  const { data: streaks } = useStreakStats();
  const [timeSpentGroupBy, setTimeSpentGroupBy] = useState<"day" | "week">("day");

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
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Time spent</h2>
            <div className="flex overflow-hidden rounded border border-neutral-300 text-xs dark:border-neutral-700">
              {(["day", "week"] as const).map((opt) => (
                <button
                  key={opt}
                  onClick={() => setTimeSpentGroupBy(opt)}
                  className={
                    timeSpentGroupBy === opt
                      ? "bg-blue-600 px-2 py-0.5 text-white"
                      : "px-2 py-0.5 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  }
                >
                  {opt === "day" ? "Day" : "Week"}
                </button>
              ))}
            </div>
          </div>
          <TimeSpentChart groupBy={timeSpentGroupBy} />
        </Card>
      </div>

      <Card>
        <h2 className="mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">Study activity</h2>
        <StreakHeatmap />
      </Card>

      <Card>
        <h2 className="mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">Overdue</h2>
        <OverdueWidget />
      </Card>
    </div>
  );
}
