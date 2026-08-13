import { useHeatmapStats } from "../../hooks/useStats";
import "./chart-theme.css";

const HEAT_LEVELS = ["var(--heat-0)", "var(--heat-1)", "var(--heat-2)", "var(--heat-3)", "var(--heat-4)"];

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

  return (
    <div className="viz-root">
      <div className="flex gap-[3px] overflow-x-auto pb-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {week.map((cell, di) =>
              cell ? (
                <div
                  key={di}
                  title={`${cell.date}: ${cell.minutes} min`}
                  className="h-[11px] w-[11px] rounded-sm"
                  style={{ backgroundColor: HEAT_LEVELS[levelFor(cell.minutes)] }}
                />
              ) : (
                <div key={di} className="h-[11px] w-[11px]" />
              )
            )}
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-1 text-xs text-neutral-500">
        <span>Less</span>
        {HEAT_LEVELS.map((color, i) => (
          <div key={i} className="h-[11px] w-[11px] rounded-sm" style={{ backgroundColor: color }} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
