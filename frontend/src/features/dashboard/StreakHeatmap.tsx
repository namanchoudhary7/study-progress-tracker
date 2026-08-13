import { useHeatmapStats } from "../../hooks/useStats";
import "./chart-theme.css";

const HEAT_LEVELS = ["var(--heat-0)", "var(--heat-1)", "var(--heat-2)", "var(--heat-3)", "var(--heat-4)"];
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];
const CELL = 11;
const GAP = 3;

function levelFor(minutes: number): number {
  if (minutes <= 0) return 0;
  if (minutes < 15) return 1;
  if (minutes < 30) return 2;
  if (minutes < 60) return 3;
  return 4;
}

export function StreakHeatmap() {
  const { data, isLoading } = useHeatmapStats(182);

  if (isLoading) return <p className="text-sm text-neutral-500">Loading…</p>;
  if (!data || data.length === 0) return <p className="text-sm text-neutral-500">No study sessions logged yet.</p>;

  // Pad the front so the grid starts on a Sunday, then chunk into weeks of 7.
  const firstDay = new Date(data[0].date).getDay();
  const padded = [...Array(firstDay).fill(null), ...data];
  const weeks: (typeof data[number] | null)[][] = [];
  for (let i = 0; i < padded.length; i += 7) {
    weeks.push(padded.slice(i, i + 7));
  }

  const activeDays = data.filter((d) => d.minutes > 0).length;
  const totalMinutes = data.reduce((sum, d) => sum + d.minutes, 0);

  let lastMonth = -1;
  const monthLabels = weeks.map((week) => {
    const firstCell = week.find((c) => c !== null);
    if (!firstCell) return null;
    const month = new Date(firstCell.date).getMonth();
    if (month !== lastMonth) {
      lastMonth = month;
      return MONTH_NAMES[month];
    }
    return null;
  });

  return (
    <div className="viz-root">
      <p className="mb-3 text-sm text-neutral-600 dark:text-neutral-400">
        <span className="font-semibold text-neutral-900 dark:text-neutral-100">{totalMinutes} min</span> studied over{" "}
        <span className="font-semibold text-neutral-900 dark:text-neutral-100">{activeDays}</span> active day
        {activeDays === 1 ? "" : "s"} in the last 6 months
      </p>
      <div className="overflow-x-auto pb-1">
        <div className="flex">
          <div className="mr-1 flex flex-col justify-between pt-4" style={{ height: 7 * CELL + 6 * GAP }}>
            {WEEKDAY_LABELS.map((label, i) => (
              <span key={i} className="text-[10px] leading-none text-neutral-400 dark:text-neutral-500">
                {label}
              </span>
            ))}
          </div>
          <div>
            <div className="mb-1 flex" style={{ gap: GAP }}>
              {weeks.map((_, wi) => (
                <span
                  key={wi}
                  className="text-[10px] leading-none text-neutral-400 dark:text-neutral-500"
                  style={{ width: CELL }}
                >
                  {monthLabels[wi] ?? ""}
                </span>
              ))}
            </div>
            <div className="flex" style={{ gap: GAP }}>
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col" style={{ gap: GAP }}>
                  {week.map((cell, di) =>
                    cell ? (
                      <div
                        key={di}
                        title={`${cell.date}: ${cell.minutes} min`}
                        className="rounded-sm"
                        style={{ width: CELL, height: CELL, backgroundColor: HEAT_LEVELS[levelFor(cell.minutes)] }}
                      />
                    ) : (
                      <div key={di} style={{ width: CELL, height: CELL }} />
                    )
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-end gap-1 text-xs text-neutral-500">
        <span>Less</span>
        {HEAT_LEVELS.map((color, i) => (
          <div key={i} className="h-[11px] w-[11px] rounded-sm" style={{ backgroundColor: color }} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
