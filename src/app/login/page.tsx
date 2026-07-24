"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Login failed.";
      if (message.includes("invalid-credential") || message.includes("wrong-password")) {
        setError("Invalid email or password.");
      } else if (message.includes("user-not-found")) {
        setError("No account found with this email.");
      } else {
        setError(message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-dvh flex items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm">
        <div className="bg-surface rounded-2px p-8 border border-border">
          <h1 className="font-heading font-bold text-2xl text-ink text-center mb-2">
            Borcello Store
          </h1>
          <p className="text-ink-muted text-sm text-center mb-8">
            Sign in to your account
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-ink mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full h-12 px-3 rounded-2px border border-border bg-surface text-ink text-[17px] placeholder:text-ink-muted"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-ink mb-1.5">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full h-12 px-3 rounded-2px border border-border bg-surface text-ink text-[17px] placeholder:text-ink-muted"
                placeholder="Enter your password"
              />
            </div>

            {error && (
              <p className="text-danger text-sm">{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="h-12 rounded-2px bg-purple text-white font-semibold text-[17px] hover:bg-purple-pressed disabled:opacity-50 transition-opacity"
            >
              {submitting ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
