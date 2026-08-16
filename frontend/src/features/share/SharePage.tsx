import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { BookOpen, CheckSquare, Clock, Flame, RotateCcw, Target, type LucideIcon } from "lucide-react";
import { Card } from "../../components/Card";
import { publicApi, type PublicProfile } from "../../api/public";

const ICONS: Record<string, LucideIcon> = {
  CheckSquare,
  Flame,
  Target,
  RotateCcw,
  Clock,
};

export function SharePage() {
  const { token } = useParams();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [status, setStatus] = useState<"loading" | "ok" | "not-found">("loading");

  useEffect(() => {
    if (!token) return;
    publicApi
      .profile(token)
      .then((data) => {
        setProfile(data);
        setStatus("ok");
      })
      .catch(() => setStatus("not-found"));
  }, [token]);

  if (status === "loading") {
    return <div className="flex min-h-screen items-center justify-center text-sm text-neutral-500">Loading…</div>;
  }

  if (status === "not-found" || !profile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 text-center">
        <p className="font-medium">This share link isn't valid.</p>
        <p className="text-sm text-neutral-500">It may have been revoked or never existed.</p>
      </div>
    );
  }

  const name = profile.display_name || profile.username;

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-10">
      <div className="flex items-center gap-2">
        <BookOpen className="h-6 w-6 text-accent-600" />
        <h1 className="text-xl font-semibold">{name}'s study progress</h1>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="text-center">
          <p className="font-mono text-2xl font-semibold tabular-nums">{profile.overview.total_subjects}</p>
          <p className="text-xs text-neutral-500">Subjects</p>
        </Card>
        <Card className="text-center">
          <p className="font-mono text-2xl font-semibold tabular-nums">
            {profile.overview.topics_done}/{profile.overview.total_topics}
          </p>
          <p className="text-xs text-neutral-500">{profile.overview.completion_pct}% complete</p>
        </Card>
        <Card className="text-center">
          <p className="font-mono text-2xl font-semibold tabular-nums">{profile.overview.total_minutes}</p>
          <p className="text-xs text-neutral-500">Minutes studied</p>
        </Card>
        <Card className="text-center">
          <p className="font-mono text-2xl font-semibold tabular-nums">{profile.streaks.current_streak}</p>
          <p className="text-xs text-neutral-500">Day streak (best {profile.streaks.longest_streak})</p>
        </Card>
      </div>

      <Card>
        <h2 className="mb-2 font-mono-label text-neutral-500 dark:text-neutral-400">Badges</h2>
        <div className="flex flex-wrap gap-3">
          {profile.badges.map((badge) => {
            const Icon = ICONS[badge.icon] ?? CheckSquare;
            return (
              <div
                key={badge.key}
                title={badge.description}
                className={`flex flex-col items-center gap-1 rounded-md border px-3 py-2 text-center ${
                  badge.earned
                    ? "border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/40"
                    : "border-neutral-200 bg-neutral-50 opacity-50 dark:border-neutral-800 dark:bg-neutral-900"
                }`}
              >
                <Icon className={`h-6 w-6 ${badge.earned ? "text-amber-500" : "text-neutral-400 dark:text-neutral-600"}`} />
                <span className="text-xs font-medium">{badge.label}</span>
              </div>
            );
          })}
        </div>
      </Card>

      <p className="text-center text-xs text-neutral-400">Shared read-only via Study Progress Tracker</p>
    </div>
  );
}
