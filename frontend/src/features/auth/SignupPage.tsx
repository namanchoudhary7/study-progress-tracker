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

export function SignupPage() {
  const { signup, signupError } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [mismatchError, setMismatchError] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMismatchError(true);
      return;
    }
    setMismatchError(false);
    setSubmitting(true);
    try {
      await signup(email, username, password);
      navigate("/dashboard");
    } catch {
      // error surfaced via signupError
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
        <h1 className="mb-4 text-lg font-semibold">Create an account</h1>
        {signupError && <div className="mb-3"><ErrorBanner message={signupError} /></div>}
        {mismatchError && <div className="mb-3"><ErrorBanner message="Passwords do not match" /></div>}
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            type="email"
            required
            className="w-full"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            type="text"
            required
            minLength={3}
            maxLength={30}
            pattern="[a-z0-9_]+"
            title="Lowercase letters, numbers, and underscores only"
            className="w-full"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase())}
          />
          <Input
            type="password"
            required
            minLength={8}
            className="w-full"
            placeholder="Password (min 8 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Input
            type="password"
            required
            minLength={8}
            className="w-full"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <Button type="submit" variant="primary" disabled={submitting} className="w-full">
            Sign up
          </Button>
        </form>
        <a
          href={authApi.googleLoginUrl}
          className="mt-3 block w-full rounded-lg border border-neutral-300 px-3 py-1.5 text-center text-sm text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
        >
          Sign up with Google
        </a>
        <p className="mt-4 text-center text-sm text-neutral-500">
          Already have an account? <Link to="/login" className="text-blue-600 hover:underline dark:text-blue-400">Sign in</Link>
        </p>
      </Card>
    </div>
  );
}
