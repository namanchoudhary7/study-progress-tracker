import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useTimeSpentStats } from "../../hooks/useStats";
import "./chart-theme.css";

export function TimeSpentChart() {
  const { data, isLoading } = useTimeSpentStats("day");

  if (isLoading) return <p className="text-sm text-neutral-500">Loading…</p>;
  if (!data || data.length === 0) return <p className="text-sm text-neutral-500">No study sessions logged yet.</p>;

  return (
    <div className="viz-root h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ left: 0, right: 16, top: 8, bottom: 8 }}>
          <CartesianGrid vertical={false} stroke="var(--grid)" />
          <XAxis dataKey="label" tick={{ fill: "var(--ink-muted)", fontSize: 12 }} stroke="var(--axis)" />
          <YAxis tick={{ fill: "var(--ink-muted)", fontSize: 12 }} stroke="var(--axis)" />
          <Tooltip
            formatter={(value) => [`${value} min`, "Time spent"]}
            contentStyle={{ background: "var(--surface)", border: "1px solid var(--grid)", fontSize: 12 }}
          />
          <Bar dataKey="minutes" fill="var(--series-1)" radius={[4, 4, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
