import { Link } from "react-router-dom";
import { Compass } from "lucide-react";
import { Button } from "./ui/Button";

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-neutral-50 px-4 text-center dark:bg-neutral-950">
      <Compass className="h-12 w-12 text-neutral-300 dark:text-neutral-700" />
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">Page not found</h1>
        <p className="mt-1 text-sm text-neutral-500">The page you're looking for doesn't exist.</p>
      </div>
      <Link to="/">
        <Button variant="primary">Back to Study Tracker</Button>
      </Link>
    </div>
  );
}
