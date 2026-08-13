import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { BrandLogo } from "../../components/BrandLogo";
import { Card } from "../../components/Card";
import { ErrorBanner } from "../../components/ErrorBanner";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { useAuth } from "../../context/AuthContext";
import { authApi } from "../../api/auth";

export function LoginPage() {
  const { login, loginError } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(identifier, password);
      navigate("/dashboard");
    } catch {
      // error surfaced via loginError
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center gap-6 bg-neutral-50 px-4 dark:bg-neutral-950">
      <Link
        to="/"
        className="absolute left-4 top-4 flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>
      <BrandLogo />
      <Card className="w-full max-w-sm">
        <h1 className="mb-4 text-lg font-semibold">Sign in</h1>
        {loginError && <div className="mb-3"><ErrorBanner message={loginError} /></div>}
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            type="text"
            required
            className="w-full"
            placeholder="Email or username"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
          />
          <Input
            type="password"
            required
            className="w-full"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button type="submit" variant="primary" disabled={submitting} className="w-full">
            Sign in
          </Button>
        </form>
        <a
          href={authApi.googleLoginUrl}
          className="mt-3 block w-full rounded-lg border border-neutral-300 px-3 py-1.5 text-center text-sm text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
        >
          Sign in with Google
        </a>
        <p className="mt-4 text-center text-sm text-neutral-500">
          No account? <Link to="/signup" className="text-blue-600 hover:underline dark:text-blue-400">Sign up</Link>
        </p>
      </Card>
    </div>
  );
}
