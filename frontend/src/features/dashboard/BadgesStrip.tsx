import { CheckSquare, Clock, Flame, RotateCcw, Target, type LucideIcon } from "lucide-react";
import { useBadges } from "../../hooks/useStats";

const ICONS: Record<string, LucideIcon> = {
  CheckSquare,
  Flame,
  Target,
  RotateCcw,
  Clock,
};

export function BadgesStrip() {
  const { data: badges } = useBadges();
  if (!badges || badges.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-3">
      {badges.map((badge) => {
        const Icon = ICONS[badge.icon] ?? CheckSquare;
        return (
          <div
            key={badge.key}
            title={`${badge.description} (${badge.current}/${badge.target})`}
            className={`flex flex-col items-center gap-1 rounded-md border px-3 py-2 text-center ${
              badge.earned
                ? "border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/40"
                : "border-neutral-200 bg-neutral-50 opacity-50 dark:border-neutral-800 dark:bg-neutral-900"
            }`}
          >
            <Icon
              className={`h-6 w-6 ${badge.earned ? "text-amber-500" : "text-neutral-400 dark:text-neutral-600"}`}
            />
            <span className="text-xs font-medium">{badge.label}</span>
            {!badge.earned && (
              <span className="font-mono text-[10px] tabular-nums text-neutral-500">
                {badge.current}/{badge.target}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
