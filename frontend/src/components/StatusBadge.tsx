import type { TopicStatus, GoalStatus } from "../api/types";

const topicStyles: Record<TopicStatus, string> = {
  todo: "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
  in_progress: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  done: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
};

const goalStyles: Record<GoalStatus, string> = {
  open: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  completed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  missed: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
};

export function TopicStatusBadge({ status }: { status: TopicStatus }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${topicStyles[status]}`}>
      {status.replace("_", " ")}
    </span>
  );
}

export function GoalStatusBadge({ status }: { status: GoalStatus }) {
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${goalStyles[status]}`}>{status}</span>;
}
