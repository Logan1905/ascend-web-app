"use client";

import { useState } from "react";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogOut,
  CheckCircle2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/auth-provider";

export default function ProfilePage() {
  const { user, loading, signIn, signUp, signOut } = useAuth();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [showPassword, setShowPassword] = useState(false);

  // Form fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // UI state
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);

  function resetForm() {
    setFullName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Basic validation
    if (!email || !password) {
      setError("Please fill in all required fields.");
      return;
    }
    if (mode === "register") {
      if (password.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
      if (!fullName.trim()) {
        setError("Please enter your name.");
        return;
      }
    }

    setSubmitting(true);
    try {
      if (mode === "login") {
        const { error } = await signIn(email, password);
        if (error) setError(`Sign in failed: ${error}`);
      } else {
        const { error, needsConfirmation } = await signUp(
          email,
          password,
          fullName.trim(),
        );
        if (error) {
          setError(`Sign up failed: ${error}`);
        } else if (needsConfirmation) {
          setConfirmationSent(true);
        } else {
          // Signed up and auto-confirmed (no email confirmation required)
          setError(null);
        }
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred";
      setError(`Unexpected error: ${message}`);
    } finally {
      setSubmitting(false);
    }
  }

  // --- Loading state ---
  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-8">
        <p className="text-muted-foreground text-sm">Loading…</p>
      </div>
    );
  }

  // --- Logged-in view ---
  if (user) {
    const displayName =
      (user.user_metadata?.full_name as string | undefined) ??
      user.email ??
      "Athlete";

    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm space-y-6 text-center">
          <div className="bg-accent mx-auto flex size-16 items-center justify-center rounded-full">
            <User className="text-muted-foreground size-8" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {displayName}
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">{user.email}</p>
          </div>
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={() => signOut()}
          >
            <LogOut className="size-4" />
            Sign Out
          </Button>
        </div>
      </div>
    );
  }

  // --- Email confirmation sent ---
  if (confirmationSent) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm space-y-4 text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <CheckCircle2 className="size-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Check your email
          </h1>
          <p className="text-muted-foreground text-sm">
            We sent a confirmation link to{" "}
            <span className="text-foreground font-medium">{email}</span>.
            Confirm your email to finish creating your account.
          </p>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              setConfirmationSent(false);
              setMode("login");
              resetForm();
            }}
          >
            Back to Sign In
          </Button>
        </div>
      </div>
    );
  }

  // --- Auth form ---
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="bg-accent mx-auto mb-4 flex size-16 items-center justify-center rounded-full">
            <User className="text-muted-foreground size-8" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {mode === "login" ? "Welcome back" : "Create an account"}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {mode === "login"
              ? "Sign in to access your fitness data"
              : "Get started on your fitness journey"}
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="border-destructive/30 bg-destructive/10 text-destructive rounded-lg border px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Name field (register only) */}
          {mode === "register" && (
            <div className="space-y-1.5">
              <label
                htmlFor="name"
                className="text-foreground text-sm font-medium"
              >
                Full Name
              </label>
              <div className="relative">
                <User className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                <input
                  id="name"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  className="border-input bg-background focus:border-ring focus:ring-ring/20 h-10 w-full rounded-lg border pr-3 pl-10 text-sm transition-colors outline-none focus:ring-2"
                />
              </div>
            </div>
          )}

          {/* Email field */}
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="text-foreground text-sm font-medium"
            >
              Email
            </label>
            <div className="relative">
              <Mail className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="border-input bg-background focus:border-ring focus:ring-ring/20 h-10 w-full rounded-lg border pr-3 pl-10 text-sm transition-colors outline-none focus:ring-2"
              />
            </div>
          </div>

          {/* Password field */}
          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="text-foreground text-sm font-medium"
            >
              Password
            </label>
            <div className="relative">
              <Lock className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="border-input bg-background focus:border-ring focus:ring-ring/20 h-10 w-full rounded-lg border pr-10 pl-10 text-sm transition-colors outline-none focus:ring-2"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
          </div>

          {/* Confirm password (register only) */}
          {mode === "register" && (
            <div className="space-y-1.5">
              <label
                htmlFor="confirmPassword"
                className="text-foreground text-sm font-medium"
              >
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                <input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="border-input bg-background focus:border-ring focus:ring-ring/20 h-10 w-full rounded-lg border pr-3 pl-10 text-sm transition-colors outline-none focus:ring-2"
                />
              </div>
            </div>
          )}

          {/* Submit */}
          <Button className="w-full" size="lg" disabled={submitting}>
            {submitting
              ? "Please wait…"
              : mode === "login"
                ? "Sign In"
                : "Create Account"}
          </Button>
        </form>

        {/* Toggle mode */}
        <p className="text-muted-foreground text-center text-sm">
          {mode === "login" ? (
            <>
              Don&apos;t have an account?{" "}
              <button
                onClick={() => {
                  setMode("register");
                  resetForm();
                }}
                className="text-primary font-medium hover:underline"
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                onClick={() => {
                  setMode("login");
                  resetForm();
                }}
                className="text-primary font-medium hover:underline"
              >
                Sign in
              </button>
            </>
          )}
        </p>

        {/* Debug info — remove after confirming auth works */}
        <p className="text-muted-foreground/50 text-center text-[10px] break-all">
          Supabase: {process.env.NEXT_PUBLIC_SUPABASE_URL ?? "NOT SET"}
        </p>
      </div>
    </div>
  );
}
