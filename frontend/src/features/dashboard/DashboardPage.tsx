import { useState } from "react";
import { BookOpen, CheckSquare, Clock, Flame } from "lucide-react";
import { Card } from "../../components/Card";
import { ErrorBanner } from "../../components/ErrorBanner";
import { TimerWidget } from "../../components/TimerWidget";
import { Button } from "../../components/ui/Button";
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
      {isError && <ErrorBanner message={error.message} onRetry={() => refetch()} />}

      <TimerWidget />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile icon={BookOpen} label="Subjects" value={String(overview?.total_subjects ?? "—")} />
        <StatTile
          icon={CheckSquare}
          label="Topics done"
          value={`${overview?.topics_done ?? 0}/${overview?.total_topics ?? 0}`}
          sub={overview ? `${overview.completion_pct}% complete` : undefined}
        />
        <StatTile icon={Clock} label="Total time studied" value={`${overview?.total_minutes ?? 0} min`} />
        <StatTile
          icon={Flame}
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
            <div className="flex gap-1">
              {(["day", "week"] as const).map((opt) => (
                <Button
                  key={opt}
                  size="sm"
                  variant={timeSpentGroupBy === opt ? "primary" : "secondary"}
                  onClick={() => setTimeSpentGroupBy(opt)}
                >
                  {opt === "day" ? "Day" : "Week"}
                </Button>
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
