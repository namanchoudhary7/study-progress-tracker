import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card } from "../../components/Card";
import { ErrorBanner } from "../../components/ErrorBanner";
import { useAuth } from "../../context/AuthContext";
import { authApi } from "../../api/auth";

export function SignupPage() {
  const { signup, signupError } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await signup(email, password);
      navigate("/");
    } catch {
      // error surfaced via signupError
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto mt-16 max-w-sm px-4">
      <Card>
        <h1 className="mb-4 text-lg font-semibold">Create an account</h1>
        {signupError && <div className="mb-3"><ErrorBanner message={signupError} /></div>}
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            required
            className="w-full rounded border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            required
            minLength={8}
            className="w-full rounded border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            placeholder="Password (min 8 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            Sign up
          </button>
        </form>
        <a
          href={authApi.googleLoginUrl}
          className="mt-3 block w-full rounded border border-neutral-300 px-3 py-1.5 text-center text-sm hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
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
