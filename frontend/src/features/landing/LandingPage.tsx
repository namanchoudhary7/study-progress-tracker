import { Navigate, Link } from "react-router-dom";
import { BarChart3, BookOpen, Flame, RotateCcw, Target } from "lucide-react";
import { BrandLogo } from "../../components/BrandLogo";
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
    <div className="min-h-screen">
      <header className="border-b border-neutral-200 bg-white/70 backdrop-blur-sm dark:border-neutral-800 dark:bg-neutral-950/60">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <BrandLogo />
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
        <div className="mb-5 inline-flex items-center gap-2 rounded border border-accent-500/40 bg-accent-500/10 px-3 py-1 font-mono text-xs uppercase tracking-wider text-accent-700 dark:text-accent-300">
          <Flame className="h-3.5 w-3.5" /> built for people who study on their own
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

        <div className="mx-auto mt-14 max-w-lg overflow-hidden rounded-md border border-neutral-200 bg-neutral-950 text-left shadow-xl dark:border-neutral-800">
          <div className="flex items-center gap-1.5 border-b border-white/10 bg-neutral-900 px-3 py-2">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" />
            <span className="ml-2 font-mono text-xs text-neutral-500">~/study-tracker</span>
          </div>
          <div className="space-y-1.5 px-4 py-4 font-mono text-sm text-neutral-300">
            <p>
              <span className="text-accent-400">$</span> study-tracker status
            </p>
            <p className="text-neutral-500">
              subjects <span className="text-neutral-300">6</span> · topics done{" "}
              <span className="text-emerald-400">42/58</span> · streak{" "}
              <span className="text-amber-400">12d</span>
            </p>
            <p>
              <span className="text-accent-400">$</span> <span className="animate-pulse">_</span>
            </p>
          </div>
        </div>
      </main>

      <section className="mx-auto max-w-5xl px-4 pb-24">
        <div className="grid gap-6 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="relative rounded-md border border-neutral-200 bg-white p-5 before:absolute before:inset-x-0 before:top-0 before:h-px before:rounded-t-md before:bg-gradient-to-r before:from-transparent before:via-accent-500/50 before:to-transparent dark:border-neutral-800 dark:bg-neutral-900"
            >
              <div className="mb-3 inline-flex rounded-md border border-accent-500/30 bg-accent-500/10 p-2 text-accent-600 dark:text-accent-400">
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
