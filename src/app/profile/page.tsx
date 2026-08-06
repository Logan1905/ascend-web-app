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
  Calendar,
  TrendingDown,
  Check,
  X,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";

// --- Static profile data ---

const profileData = {
  name: "Logan Villarreal",
  email: "loganv@gmail.com",
  age: 22,
  sex: "Male" as const,
  birthday: "June 19, 2003",
  goal: "Build Muscle" as const,
  startingWeight: 165,
  currentWeight: 172,
};

const weightProgress = [
  { week: "W1", weight: 165 },
  { week: "W2", weight: 165.8 },
  { week: "W3", weight: 166.5 },
  { week: "W4", weight: 167.2 },
  { week: "W5", weight: 168.0 },
  { week: "W6", weight: 169.1 },
  { week: "W7", weight: 170.5 },
  { week: "W8", weight: 171.0 },
  { week: "W9", weight: 172.0 },
];

// Calendar data: days with green (hit goals) or red (missed)
const calendarData: Record<number, "green" | "red"> = {
  1: "green",
  2: "green",
  3: "red",
  4: "green",
  5: "green",
  6: "green",
  7: "red",
  8: "green",
  9: "green",
  10: "green",
  11: "red",
  12: "green",
  13: "green",
  14: "green",
  15: "green",
  16: "red",
  17: "green",
  18: "green",
  19: "green",
  20: "green",
  21: "green",
  22: "green",
  23: "red",
  24: "green",
  25: "green",
  26: "green",
  27: "green",
  28: "green",
  29: "green",
  30: "green",
  31: "green",
};

const today = new Date();
const currentDay = today.getDate();
const currentMonth = today.toLocaleString("default", { month: "long" });
const currentYear = today.getFullYear();
const daysInMonth = new Date(currentYear, today.getMonth() + 1, 0).getDate();
const firstDayOfWeek = new Date(currentYear, today.getMonth(), 1).getDay();

const totalActiveDays = Object.keys(calendarData).length;
const greenDays = Object.values(calendarData).filter(
  (v) => v === "green",
).length;
const monthWeightChange =
  profileData.currentWeight - profileData.startingWeight;

// --- Custom Tooltip ---
interface TooltipPayload {
  value: number;
}
interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
  unit?: string;
}
function CustomTooltip({ active, payload, label, unit }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="border-border bg-popover rounded-lg border px-3 py-2 text-sm shadow-md">
      <p className="font-medium">{label}</p>
      <p className="text-muted-foreground">
        {payload[0].value} {unit ?? ""}
      </p>
    </div>
  );
}

// --- Profile View (shown when logged in) ---
function ProfileView({ onSignOut }: { onSignOut: () => void }) {
  const [weightUnit, setWeightUnit] = useState<"lbs" | "kg">("lbs");
  const [heightUnit, setHeightUnit] = useState<"ft" | "cm">("ft");

  const convert = (lbs: number) =>
    weightUnit === "kg" ? (lbs * 0.4536).toFixed(1) : lbs.toString();

  const heightDisplay = heightUnit === "ft" ? "5'10\"" : "178 cm";

  const weightChangeDisplay =
    weightUnit === "kg"
      ? `${monthWeightChange > 0 ? "+" : ""}${(monthWeightChange * 0.4536).toFixed(1)} kg`
      : `${monthWeightChange > 0 ? "+" : ""}${monthWeightChange.toFixed(1)} lbs`;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-6 sm:px-6">
      {/* User info card */}
      <div className="border-border bg-card rounded-xl border p-5">
        <div className="flex items-center gap-4">
          <div className="bg-accent flex size-16 shrink-0 items-center justify-center rounded-full">
            <User className="text-muted-foreground size-8" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold">{profileData.name}</h1>
            <p className="text-muted-foreground text-sm">{profileData.email}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={onSignOut}
          >
            <LogOut className="size-4" />
            Sign Out
          </Button>
        </div>

        {/* Stats grid */}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="bg-muted/50 rounded-lg px-3 py-2">
            <p className="text-muted-foreground text-xs">Age</p>
            <p className="text-sm font-medium">{profileData.age}</p>
          </div>
          <div className="bg-muted/50 rounded-lg px-3 py-2">
            <p className="text-muted-foreground text-xs">Height</p>
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium">{heightDisplay}</p>
              <div className="border-border flex overflow-hidden rounded border text-[10px] font-medium">
                <button
                  onClick={() => setHeightUnit("ft")}
                  className={`px-1.5 py-0.5 ${heightUnit === "ft" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                >
                  ft
                </button>
                <button
                  onClick={() => setHeightUnit("cm")}
                  className={`px-1.5 py-0.5 ${heightUnit === "cm" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                >
                  cm
                </button>
              </div>
            </div>
          </div>
          <div className="bg-muted/50 rounded-lg px-3 py-2">
            <p className="text-muted-foreground text-xs">Sex</p>
            <p className="text-sm font-medium">{profileData.sex}</p>
          </div>
          <div className="bg-muted/50 rounded-lg px-3 py-2">
            <p className="text-muted-foreground text-xs">Birthday</p>
            <p className="text-sm font-medium">{profileData.birthday}</p>
          </div>
          <div className="bg-muted/50 rounded-lg px-3 py-2">
            <p className="text-muted-foreground text-xs">Goal</p>
            <p className="text-sm font-medium">{profileData.goal}</p>
          </div>
          <div className="bg-muted/50 rounded-lg px-3 py-2">
            <p className="text-muted-foreground text-xs">Weight</p>
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium">
                {convert(profileData.currentWeight)} {weightUnit}
              </p>
              <div className="border-border flex overflow-hidden rounded border text-[10px] font-medium">
                <button
                  onClick={() => setWeightUnit("lbs")}
                  className={`px-1.5 py-0.5 ${weightUnit === "lbs" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                >
                  lbs
                </button>
                <button
                  onClick={() => setWeightUnit("kg")}
                  className={`px-1.5 py-0.5 ${weightUnit === "kg" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                >
                  kg
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Starting / Current weight */}
        <div className="mt-4 flex gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Starting: </span>
            <span className="font-medium">
              {convert(profileData.startingWeight)} {weightUnit}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Current: </span>
            <span className="font-medium">
              {convert(profileData.currentWeight)} {weightUnit}
            </span>
          </div>
        </div>
      </div>

      {/* Weight Progress Chart */}
      <div className="border-border bg-card rounded-xl border p-5">
        <div className="mb-4 flex items-center gap-2">
          <TrendingDown className="size-5 text-green-500" />
          <h2 className="text-base font-semibold">Weight Progress</h2>
        </div>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={weightProgress.map((d) => ({
                ...d,
                weight:
                  weightUnit === "kg"
                    ? +(d.weight * 0.4536).toFixed(1)
                    : d.weight,
              }))}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="week"
                tick={{ fontSize: 12 }}
                className="fill-muted-foreground"
              />
              <YAxis
                domain={["dataMin - 1", "dataMax + 1"]}
                tick={{ fontSize: 12 }}
                className="fill-muted-foreground"
              />
              <Tooltip
                content={<CustomTooltip unit={weightUnit} />}
                cursor={false}
              />
              <Area
                type="monotone"
                dataKey="weight"
                stroke="#22c55e"
                fill="#22c55e"
                fillOpacity={0.1}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Calendar */}
      <div className="border-border bg-card rounded-xl border p-5">
        <div className="mb-4 flex items-center gap-2">
          <Calendar className="text-muted-foreground size-5" />
          <h2 className="text-base font-semibold">
            {currentMonth} {currentYear}
          </h2>
        </div>

        {/* Day headers */}
        <div className="text-muted-foreground mb-1 grid grid-cols-7 text-center text-xs font-medium">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Empty cells for days before the 1st */}
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}
          {/* Day cells */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const isToday = day === currentDay;
            const status = calendarData[day];
            return (
              <div
                key={day}
                className={`flex aspect-square flex-col items-center justify-center gap-0.5 rounded-md text-xs font-medium ${
                  isToday
                    ? "bg-blue-500/20 text-blue-700 ring-2 ring-blue-500 dark:text-blue-300"
                    : status === "green"
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : status === "red"
                        ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        : "text-muted-foreground"
                }`}
              >
                <span className="text-[10px] leading-none">{day}</span>
                {status === "green" && <Check className="size-3" />}
                {status === "red" && <X className="size-3" />}
              </div>
            );
          })}
        </div>

        {/* Calendar stats */}
        <div className="mt-4 grid grid-cols-3 gap-3 text-center">
          <div className="bg-muted/50 rounded-lg px-2 py-2">
            <p className="text-lg font-bold">{totalActiveDays}</p>
            <p className="text-muted-foreground text-[10px]">Active Days</p>
          </div>
          <div className="bg-muted/50 rounded-lg px-2 py-2">
            <p className="text-lg font-bold text-green-600">
              {greenDays}/{daysInMonth}
            </p>
            <p className="text-muted-foreground text-[10px]">Green Days</p>
          </div>
          <div className="bg-muted/50 rounded-lg px-2 py-2">
            <p className="text-lg font-bold">{weightChangeDisplay}</p>
            <p className="text-muted-foreground text-[10px]">Weight</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Main Page Component ---
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
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-8">
        <p className="text-muted-foreground text-sm">Loading…</p>
      </div>
    );
  }

  // Recovery mode
  if (user && isRecovery) {
    return (
      <ResetPasswordForm
        onDone={clearRecovery}
        updatePassword={updatePassword}
        onSignInInstead={signOut}
      />
    );
  }

  // Logged in — show profile
  if (user) {
    return <ProfileView onSignOut={signOut} />;
  }

  // Forgot password view
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
            <div className="flex items-center gap-2 rounded-lg border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400">
              <CheckCircle2 className="size-4 shrink-0" />
              {success}
            </div>
          )}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="reset-email" className="text-sm font-medium">
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

  // Login / Register form
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm space-y-6">
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
        {error && (
          <div className="border-destructive/30 bg-destructive/10 text-destructive rounded-lg border px-4 py-3 text-sm">
            {error}
          </div>
        )}
        <div className="space-y-4">
          {mode === "register" && (
            <div className="space-y-1.5">
              <label htmlFor="name" className="text-sm font-medium">
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
            <label htmlFor="email" className="text-sm font-medium">
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
              <label htmlFor="password" className="text-sm font-medium">
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
              <label htmlFor="confirmPassword" className="text-sm font-medium">
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

// --- Reset Password Form ---
function ResetPasswordForm({
  onDone,
  updatePassword,
  onSignInInstead,
}: {
  onDone: () => void;
  updatePassword: (pw: string) => Promise<{ error: string | null }>;
  onSignInInstead: () => void;
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
            <label htmlFor="new-password" className="text-sm font-medium">
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
            <label htmlFor="confirm-new" className="text-sm font-medium">
              Confirm New Password
            </label>
            <div className="relative">
              <Lock className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <input
                id="confirm-new"
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
        <p className="text-muted-foreground text-center text-sm">
          <button
            type="button"
            onClick={onSignInInstead}
            className="text-primary font-medium hover:underline"
          >
            Sign in instead?
          </button>
        </p>
      </div>
    </div>
  );
}
