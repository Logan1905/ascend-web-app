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
import { createClient } from "@/lib/supabase/client";

export default function ProfilePage() {
  const {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    isRecovery,
    clearRecovery,
    updatePassword,
  } = useAuth();

  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const [showPassword, setShowPassword] = useState(false);

  // Form fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // UI state
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function resetForm() {
    setFullName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setError(null);
    setSuccess(null);
  }

  async function handleSignIn() {
    setError(null);
    if (!email || !password) {
      setError("Please fill in all required fields.");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await signIn(email, password);
      if (error) setError(`Sign in failed: ${error}`);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSignUp() {
    setError(null);
    if (!email || !password) {
      setError("Please fill in all required fields.");
      return;
    }
    if (!fullName.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await signUp(email, password, fullName.trim());
      if (error) setError(`Sign up failed: ${error}`);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleForgotPassword() {
    setError(null);
    setSuccess(null);
    if (!email) {
      setError("Please enter your email address.");
      return;
    }
    setSubmitting(true);
    try {
      const supabase = createClient();
      // Build the redirect URL including the basePath for GitHub Pages
      const origin = window.location.origin;
      const pathPrefix = window.location.pathname.startsWith("/ascend-web-app")
        ? "/ascend-web-app"
        : "";
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}${pathPrefix}/profile`,
      });
      if (error) {
        setError(error.message);
      } else {
        setSuccess("Password reset link sent! Check your email.");
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred.",
      );
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

  // --- Password recovery view ---
  if (user && isRecovery) {
    return (
      <ResetPasswordForm
        onDone={clearRecovery}
        updatePassword={updatePassword}
      />
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

  // --- Forgot password view ---
  if (mode === "forgot") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center">
            <div className="bg-accent mx-auto mb-4 flex size-16 items-center justify-center rounded-full">
              <Mail className="text-muted-foreground size-8" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Reset Password
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Enter your email and we&apos;ll send you a reset link.
            </p>
          </div>

          {error && (
            <div className="border-destructive/30 bg-destructive/10 text-destructive rounded-lg border px-4 py-3 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-lg border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-4 shrink-0" />
                {success}
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="reset-email"
                className="text-foreground text-sm font-medium"
              >
                Email
              </label>
              <div className="relative">
                <Mail className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                <input
                  id="reset-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="border-input bg-background focus:border-ring focus:ring-ring/20 h-10 w-full rounded-lg border pr-3 pl-10 text-sm transition-colors outline-none focus:ring-2"
                />
              </div>
            </div>

            <button
              type="button"
              disabled={submitting}
              onClick={handleForgotPassword}
              className="bg-primary text-primary-foreground hover:bg-primary/80 h-9 w-full rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {submitting ? "Sending…" : "Send Reset Link"}
            </button>
          </div>

          <p className="text-muted-foreground text-center text-sm">
            Remember your password?{" "}
            <button
              onClick={() => {
                setMode("login");
                resetForm();
              }}
              className="text-primary font-medium hover:underline"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    );
  }

  // --- Auth form (login / register) ---
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

        {/* Form fields */}
        <div className="space-y-4">
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

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="text-foreground text-sm font-medium"
              >
                Password
              </label>
              {mode === "login" && (
                <button
                  type="button"
                  onClick={() => {
                    setMode("forgot");
                    resetForm();
                    setEmail(email);
                  }}
                  className="text-primary text-xs font-medium hover:underline"
                >
                  Forgot password?
                </button>
              )}
            </div>
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

          {/* Submit button */}
          <button
            type="button"
            disabled={submitting}
            onClick={mode === "login" ? handleSignIn : handleSignUp}
            className="bg-primary text-primary-foreground hover:bg-primary/80 h-9 w-full rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {submitting
              ? "Please wait…"
              : mode === "login"
                ? "Sign In"
                : "Create Account"}
          </button>
        </div>

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
      </div>
    </div>
  );
}

// --- Reset Password Form (shown after clicking recovery link) ---

function ResetPasswordForm({
  onDone,
  updatePassword,
}: {
  onDone: () => void;
  updatePassword: (pw: string) => Promise<{ error: string | null }>;
}) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmNew, setConfirmNew] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleReset() {
    setError(null);
    if (!newPassword) {
      setError("Please enter a new password.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmNew) {
      setError("Passwords do not match.");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await updatePassword(newPassword);
      if (error) {
        setError(error);
      } else {
        setSuccess(true);
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm space-y-4 text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <CheckCircle2 className="size-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Password Updated
          </h1>
          <p className="text-muted-foreground text-sm">
            Your password has been changed successfully.
          </p>
          <button
            onClick={onDone}
            className="bg-primary text-primary-foreground hover:bg-primary/80 h-9 w-full rounded-lg text-sm font-medium transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="bg-accent mx-auto mb-4 flex size-16 items-center justify-center rounded-full">
            <Lock className="text-muted-foreground size-8" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Set New Password
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Enter your new password below.
          </p>
        </div>

        {error && (
          <div className="border-destructive/30 bg-destructive/10 text-destructive rounded-lg border px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="new-password"
              className="text-foreground text-sm font-medium"
            >
              New Password
            </label>
            <div className="relative">
              <Lock className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <input
                id="new-password"
                type={showPw ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="border-input bg-background focus:border-ring focus:ring-ring/20 h-10 w-full rounded-lg border pr-10 pl-10 text-sm transition-colors outline-none focus:ring-2"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
              >
                {showPw ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="confirm-new-password"
              className="text-foreground text-sm font-medium"
            >
              Confirm New Password
            </label>
            <div className="relative">
              <Lock className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <input
                id="confirm-new-password"
                type={showPw ? "text" : "password"}
                value={confirmNew}
                onChange={(e) => setConfirmNew(e.target.value)}
                placeholder="••••••••"
                className="border-input bg-background focus:border-ring focus:ring-ring/20 h-10 w-full rounded-lg border pr-3 pl-10 text-sm transition-colors outline-none focus:ring-2"
              />
            </div>
          </div>

          <button
            type="button"
            disabled={submitting}
            onClick={handleReset}
            className="bg-primary text-primary-foreground hover:bg-primary/80 h-9 w-full rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {submitting ? "Updating…" : "Update Password"}
          </button>
        </div>
      </div>
    </div>
  );
}
