import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useCompletionStats } from "../../hooks/useStats";
import "./chart-theme.css";

export function CompletionChart() {
  const { data, isLoading } = useCompletionStats();

  if (isLoading) return <p className="text-sm text-neutral-500">Loading…</p>;
  if (!data || data.length === 0) return <p className="text-sm text-neutral-500">No subjects yet.</p>;

  return (
    <div className="viz-root h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16, top: 8, bottom: 8 }}>
          <CartesianGrid horizontal={false} stroke="var(--grid)" />
          <XAxis type="number" domain={[0, 100]} tick={{ fill: "var(--ink-muted)", fontSize: 12 }} stroke="var(--axis)" />
          <YAxis
            type="category"
            dataKey="subject_name"
            width={100}
            tick={{ fill: "var(--ink-muted)", fontSize: 12 }}
            stroke="var(--axis)"
          />
          <Tooltip
            formatter={(value, _name, item) => [
              `${value}% (${item.payload.done_topics}/${item.payload.total_topics} topics)`,
              "Completion",
            ]}
            contentStyle={{ background: "var(--surface)", border: "1px solid var(--grid)", fontSize: 12 }}
          />
          <Bar dataKey="completion_pct" radius={[0, 4, 4, 0]} maxBarSize={20}>
            {data.map((entry) => (
              <Cell key={entry.subject_id} fill={entry.subject_color ?? "var(--series-1)"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
