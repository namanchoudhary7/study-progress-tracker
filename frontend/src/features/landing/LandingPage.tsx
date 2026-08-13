import { Navigate, Link } from "react-router-dom";
import { BarChart3, BookOpen, Flame, GraduationCap, RotateCcw, Target } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { useAuth } from "../../context/AuthContext";

const FEATURES = [
  {
    icon: BookOpen,
    title: "Track your curriculum",
    description: "Break subjects into topics and mark them todo, in progress, or done.",
  },
  {
    icon: BarChart3,
    title: "See your progress",
    description: "Completion charts, time-spent trends, and a full year of study activity at a glance.",
  },
  {
    icon: RotateCcw,
    title: "Spaced repetition",
    description: "Finished topics come back for review right before you'd otherwise forget them.",
  },
  {
    icon: Target,
    title: "Goals & deadlines",
    description: "Set target dates for a subject or topic, and see what's overdue without checking dates yourself.",
  },
];

export function LandingPage() {
  const { isAuthenticated, isLoading } = useAuth();

  if (!isLoading && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="border-b border-neutral-200 dark:border-neutral-800">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2 text-neutral-900 dark:text-neutral-100">
            <GraduationCap className="h-6 w-6" />
            <span className="text-lg font-semibold">Study Tracker</span>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/login">
              <Button variant="ghost">Sign in</Button>
            </Link>
            <Link to="/signup">
              <Button variant="primary">Sign up</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-20 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
          <Flame className="h-4 w-4" /> Built for people who study on their own
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl dark:text-neutral-100">
          Know exactly where your studying stands.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-neutral-600 dark:text-neutral-400">
          Track subjects and topics, log study sessions, and let spaced repetition tell you what to revisit —
          all in one simple dashboard.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link to="/signup">
            <Button variant="primary" size="md" className="px-6 py-2.5 text-base">
              Get started free
            </Button>
          </Link>
          <Link to="/login">
            <Button variant="secondary" size="md" className="px-6 py-2.5 text-base">
              Sign in
            </Button>
          </Link>
        </div>
      </main>

      <section className="mx-auto max-w-5xl px-4 pb-24">
        <div className="grid gap-6 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-lg border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900"
            >
              <div className="mb-3 inline-flex rounded-lg bg-blue-50 p-2 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                <f.icon className="h-5 w-5" />
              </div>
              <h2 className="font-semibold text-neutral-900 dark:text-neutral-100">{f.title}</h2>
              <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{f.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
