import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, XCircle } from "lucide-react";
import { BrandLogo } from "../../components/BrandLogo";
import { Card } from "../../components/Card";
import { authApi } from "../../api/auth";

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      return;
    }
    authApi
      .verifyEmail(token)
      .then(() => setStatus("success"))
      .catch(() => setStatus("error"));
  }, [token]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-neutral-50 px-4 dark:bg-neutral-950">
      <BrandLogo />
      <Card className="w-full max-w-sm text-center">
        {status === "verifying" && <p className="text-sm text-neutral-500">Verifying your email…</p>}
        {status === "success" && (
          <div className="flex flex-col items-center gap-2">
            <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            <h1 className="text-lg font-semibold">Email verified</h1>
            <p className="text-sm text-neutral-500">Your email address has been verified.</p>
            <Link to="/dashboard" className="mt-2 text-sm text-blue-600 hover:underline dark:text-blue-400">
              Go to dashboard
            </Link>
          </div>
        )}
        {status === "error" && (
          <div className="flex flex-col items-center gap-2">
            <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
            <h1 className="text-lg font-semibold">Invalid or expired link</h1>
            <p className="text-sm text-neutral-500">Sign in and use "Resend email" to get a new link.</p>
            <Link to="/login" className="mt-2 text-sm text-blue-600 hover:underline dark:text-blue-400">
              Go to login
            </Link>
          </div>
        )}
      </Card>
    </div>
  );
}
