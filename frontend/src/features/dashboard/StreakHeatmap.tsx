import { useState } from "react";
import { useHeatmapStats, useHeatmapYears } from "../../hooks/useStats";
import { Select } from "../../components/ui/Select";
import "./chart-theme.css";

const HEAT_LEVELS = ["var(--heat-0)", "var(--heat-1)", "var(--heat-2)", "var(--heat-3)", "var(--heat-4)"];
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];

function levelFor(minutes: number): number {
  if (minutes <= 0) return 0;
  if (minutes < 15) return 1;
  if (minutes < 30) return 2;
  if (minutes < 60) return 3;
  return 4;
}

export function StreakHeatmap() {
  const { data: years } = useHeatmapYears();
  const [year, setYear] = useState<number | undefined>(undefined);
  const { data, isLoading } = useHeatmapStats(year);

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
  const selectedYear = year ?? new Date().getFullYear();

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
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          <span className="font-mono font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">{totalMinutes} min</span> studied
          over <span className="font-mono font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">{activeDays}</span> active day
          {activeDays === 1 ? "" : "s"} in {selectedYear}
        </p>
        {years && years.length > 1 && (
          <Select
            className="py-1 text-xs"
            value={selectedYear}
            onChange={(e) => setYear(Number(e.target.value))}
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </Select>
        )}
      </div>
      <div className="flex w-full">
        <div className="mr-1 flex flex-col justify-between pt-4 pb-[2px]">
          {WEEKDAY_LABELS.map((label, i) => (
            <span key={i} className="text-[10px] leading-none text-neutral-400 dark:text-neutral-500">
              {label}
            </span>
          ))}
        </div>
        <div className="flex-1">
          <div className="mb-1 flex gap-1">
            {weeks.map((_, wi) => (
              <span
                key={wi}
                className="flex-1 text-[10px] leading-none text-neutral-400 dark:text-neutral-500"
              >
                {monthLabels[wi] ?? ""}
              </span>
            ))}
          </div>
          <div className="flex gap-1">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-1 flex-col gap-1">
                {week.map((cell, di) =>
                  cell ? (
                    <div
                      key={di}
                      title={`${cell.date}: ${cell.minutes} min`}
                      className="aspect-square w-full rounded-sm"
                      style={{ backgroundColor: HEAT_LEVELS[levelFor(cell.minutes)] }}
                    />
                  ) : (
                    <div key={di} className="aspect-square w-full" />
                  )
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-end gap-1 text-xs text-neutral-500">
        <span>Less</span>
        {HEAT_LEVELS.map((color, i) => (
          <div key={i} className="h-3 w-3 rounded-sm" style={{ backgroundColor: color }} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
