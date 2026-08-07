"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogOut,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { ToastModal } from "@/components/shared/toast-modal";
import { createSignupProfile, fetchUserProfile } from "@/lib/supabase/profile";
import {
  formatBirthday,
  formatHeight,
  getAge,
  type Country,
  type HeightUnit,
  type Sex,
  type UserProfile,
  COUNTRY_OPTIONS,
} from "@/types/profile";

// --- Months/days/years for birthday selectors ---
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
function daysInMonth(month: number, year: number): number {
  return new Date(year, month, 0).getDate();
}
const currentYearNum = new Date().getFullYear();
const YEARS = Array.from({ length: 100 }, (_, i) => currentYearNum - i);

// --- Sign-up onboarding wizard types ---
type SignupStep =
  "birthday" | "height" | "sex" | "name" | "country" | "credentials";

interface SignupAnswers {
  birthMonth: number;
  birthDay: number;
  birthYear: number;
  heightFeet: string;
  heightInches: string;
  heightCm: string;
  heightUnit: HeightUnit;
  sex: Sex | null;
  fullName: string;
  country: Country | null;
  email: string;
  password: string;
  confirmPassword: string;
}

const INITIAL_ANSWERS: SignupAnswers = {
  birthMonth: 1,
  birthDay: 1,
  birthYear: 2000,
  heightFeet: "",
  heightInches: "",
  heightCm: "",
  heightUnit: "in",
  sex: null,
  fullName: "",
  country: null,
  email: "",
  password: "",
  confirmPassword: "",
};

const BASELINE_PROGRESS = 10;
const SIGNUP_STEPS: SignupStep[] = [
  "birthday",
  "height",
  "sex",
  "name",
  "country",
  "credentials",
];

// --- Profile View (shown when logged in) ---
function ProfileView({
  profile,
  onSignOut,
}: {
  profile: UserProfile | null;
  onSignOut: () => void;
}) {
  const { user } = useAuth();
  const [heightUnit, setHeightUnit] = useState<HeightUnit>(
    profile?.heightUnit ?? "in",
  );

  const displayName =
    (user?.user_metadata?.full_name as string | undefined) ?? "User";
  const displayEmail = user?.email ?? "";

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-6 sm:px-6">
      {/* User info card */}
      <div className="border-border bg-card rounded-xl border p-5">
        <div className="flex items-center gap-4">
          <div className="bg-accent flex size-16 shrink-0 items-center justify-center rounded-full">
            <User className="text-muted-foreground size-8" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold">{displayName}</h1>
            <p className="text-muted-foreground text-sm">{displayEmail}</p>
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
        {profile && (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {profile.birthday && (
              <div className="bg-muted/50 rounded-lg px-3 py-2">
                <p className="text-muted-foreground text-xs">Age</p>
                <p className="text-sm font-medium">
                  {getAge(profile.birthday)}
                </p>
              </div>
            )}
            {profile.heightCm && (
              <div className="bg-muted/50 rounded-lg px-3 py-2">
                <p className="text-muted-foreground text-xs">Height</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">
                    {formatHeight(profile.heightCm, heightUnit)}
                  </p>
                  <div className="border-border flex overflow-hidden rounded border text-[10px] font-medium">
                    <button
                      onClick={() => setHeightUnit("in")}
                      className={`px-1.5 py-0.5 ${heightUnit === "in" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                    >
                      in
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
            )}

            {profile.sex && (
              <div className="bg-muted/50 rounded-lg px-3 py-2">
                <p className="text-muted-foreground text-xs">Sex</p>
                <p className="text-sm font-medium capitalize">{profile.sex}</p>
              </div>
            )}
            {profile.birthday && (
              <div className="bg-muted/50 rounded-lg px-3 py-2">
                <p className="text-muted-foreground text-xs">Birthday</p>
                <p className="text-sm font-medium">
                  {formatBirthday(profile.birthday)}
                </p>
              </div>
            )}
            {profile.country && (
              <div className="bg-muted/50 rounded-lg px-3 py-2">
                <p className="text-muted-foreground text-xs">Country</p>
                <p className="text-sm font-medium">
                  {COUNTRY_OPTIONS.find((c) => c.value === profile.country)
                    ?.label ?? profile.country}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// --- Sign-up Onboarding Wizard ---
function SignupWizard({ onComplete }: { onComplete: () => void }) {
  const { signUp } = useAuth();
  const [started, setStarted] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<SignupAnswers>(INITIAL_ANSWERS);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const step = SIGNUP_STEPS[stepIndex];
  const isLastStep = stepIndex === SIGNUP_STEPS.length - 1;
  const progress =
    BASELINE_PROGRESS +
    Math.round(
      ((stepIndex + 1) / SIGNUP_STEPS.length) * (100 - BASELINE_PROGRESS),
    );

  function update(patch: Partial<SignupAnswers>) {
    setAnswers((prev) => ({ ...prev, ...patch }));
  }

  const maxDay = useMemo(
    () => daysInMonth(answers.birthMonth, answers.birthYear),
    [answers.birthMonth, answers.birthYear],
  );

  // Use the clamped value everywhere — the select onChange will write it back
  const effectiveBirthDay = Math.min(answers.birthDay, maxDay);

  const canContinue = (() => {
    switch (step) {
      case "birthday":
        return true; // always valid — defaults are set
      case "height":
        if (answers.heightUnit === "cm") {
          return (
            answers.heightCm.trim().length > 0 && Number(answers.heightCm) > 0
          );
        }
        return (
          answers.heightFeet.trim().length > 0 && Number(answers.heightFeet) > 0
        );
      case "sex":
        return answers.sex !== null;
      case "name":
        return answers.fullName.trim().length > 0;
      case "country":
        return answers.country !== null;
      case "credentials":
        return (
          answers.email.trim().length > 0 &&
          answers.password.length >= 6 &&
          answers.password === answers.confirmPassword
        );
    }
  })();

  async function handleNext() {
    if (!canContinue) return;
    setError(null);

    if (!isLastStep) {
      setStepIndex((i) => i + 1);
      return;
    }

    // Last step — create account
    setSubmitting(true);
    try {
      const { error: signUpErr } = await signUp(
        answers.email.trim(),
        answers.password,
        answers.fullName.trim(),
      );
      if (signUpErr) {
        setError(signUpErr);
        setSubmitting(false);
        return;
      }

      // Build birthday ISO string
      const month = String(answers.birthMonth).padStart(2, "0");
      const day = String(effectiveBirthDay).padStart(2, "0");
      const birthday = `${answers.birthYear}-${month}-${day}`;

      // Convert height to cm
      let heightCm: number;
      if (answers.heightUnit === "cm") {
        heightCm = Number(answers.heightCm);
      } else {
        const feet = Number(answers.heightFeet) || 0;
        const inches = Number(answers.heightInches) || 0;
        heightCm = (feet * 12 + inches) * 2.54;
      }

      await createSignupProfile({
        birthday,
        heightCm,
        heightUnit: answers.heightUnit,
        sex: answers.sex!,
        country: answers.country!,
      });

      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  function handlePrevious() {
    if (stepIndex === 0) {
      setStarted(false);
      return;
    }
    setStepIndex((i) => i - 1);
  }

  // --- Intro screen ---
  if (!started) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm">
          <div className="border-border bg-card rounded-xl border p-6">
            <div className="bg-primary/10 mb-4 flex size-11 items-center justify-center rounded-full">
              <Sparkles className="text-primary size-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              Your fitness journey starts here
            </h1>
            <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
              We&apos;ll personalize everything — your goals, your progress
              charts, and your insights — based on a few quick answers. Ready?
            </p>
            <button
              onClick={() => setStarted(true)}
              aria-label="Start"
              className="bg-primary text-primary-foreground hover:bg-primary/80 mt-6 flex size-12 items-center justify-center rounded-full transition-colors"
            >
              <ArrowRight className="size-5" />
            </button>
          </div>
          <p className="text-muted-foreground mt-4 text-center text-sm">
            Already have an account?{" "}
            <button
              onClick={onComplete}
              className="text-primary font-medium hover:underline"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    );
  }

  // --- Question screens ---
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="border-border bg-card rounded-xl border p-5">
          {/* Progress bar */}
          <div className="mb-6">
            <div className="text-muted-foreground mb-1.5 flex items-center justify-between text-xs font-medium">
              <span>
                Step {stepIndex + 1} of {SIGNUP_STEPS.length}
              </span>
              <span>{progress}%</span>
            </div>
            <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
              <div
                className="bg-primary h-full rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {step === "birthday" && (
            <div>
              <h2 className="text-lg font-semibold">When is your birthday?</h2>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <div>
                  <label className="text-muted-foreground mb-1 block text-xs">
                    Month
                  </label>
                  <select
                    value={answers.birthMonth}
                    onChange={(e) =>
                      update({ birthMonth: Number(e.target.value) })
                    }
                    className="border-input bg-background focus:border-ring focus:ring-ring/20 h-10 w-full rounded-lg border px-2 text-sm outline-none focus:ring-2"
                  >
                    {MONTHS.map((m, i) => (
                      <option key={m} value={i + 1}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-muted-foreground mb-1 block text-xs">
                    Day
                  </label>
                  <select
                    value={effectiveBirthDay}
                    onChange={(e) =>
                      update({ birthDay: Number(e.target.value) })
                    }
                    className="border-input bg-background focus:border-ring focus:ring-ring/20 h-10 w-full rounded-lg border px-2 text-sm outline-none focus:ring-2"
                  >
                    {Array.from({ length: maxDay }, (_, i) => i + 1).map(
                      (d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ),
                    )}
                  </select>
                </div>
                <div>
                  <label className="text-muted-foreground mb-1 block text-xs">
                    Year
                  </label>
                  <select
                    value={answers.birthYear}
                    onChange={(e) =>
                      update({ birthYear: Number(e.target.value) })
                    }
                    className="border-input bg-background focus:border-ring focus:ring-ring/20 h-10 w-full rounded-lg border px-2 text-sm outline-none focus:ring-2"
                  >
                    {YEARS.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === "height" && (
            <div>
              <h2 className="text-lg font-semibold">How tall are you?</h2>
              <div className="mt-4">
                {/* Unit toggle */}
                <div className="border-border mb-3 flex w-fit overflow-hidden rounded-lg border text-sm font-medium">
                  {(["in", "cm"] as const).map((u) => (
                    <button
                      key={u}
                      onClick={() => update({ heightUnit: u })}
                      className={`px-3 py-1.5 transition-colors ${
                        answers.heightUnit === u
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-accent"
                      }`}
                    >
                      {u === "in" ? "ft / in" : "cm"}
                    </button>
                  ))}
                </div>

                {answers.heightUnit === "in" ? (
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <label className="text-muted-foreground mb-1 block text-xs">
                        Feet
                      </label>
                      <input
                        type="number"
                        inputMode="numeric"
                        min="1"
                        max="8"
                        value={answers.heightFeet}
                        onChange={(e) => update({ heightFeet: e.target.value })}
                        placeholder="5"
                        className="border-input bg-background placeholder:text-muted-foreground focus:border-ring focus:ring-ring/20 h-12 w-full rounded-lg border px-4 text-lg font-medium outline-none focus:ring-2"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-muted-foreground mb-1 block text-xs">
                        Inches
                      </label>
                      <input
                        type="number"
                        inputMode="numeric"
                        min="0"
                        max="11"
                        value={answers.heightInches}
                        onChange={(e) =>
                          update({ heightInches: e.target.value })
                        }
                        placeholder="10"
                        className="border-input bg-background placeholder:text-muted-foreground focus:border-ring focus:ring-ring/20 h-12 w-full rounded-lg border px-4 text-lg font-medium outline-none focus:ring-2"
                      />
                    </div>
                  </div>
                ) : (
                  <input
                    type="number"
                    step="0.1"
                    inputMode="decimal"
                    value={answers.heightCm}
                    onChange={(e) => update({ heightCm: e.target.value })}
                    placeholder="178"
                    aria-label="Height in cm"
                    className="border-input bg-background placeholder:text-muted-foreground focus:border-ring focus:ring-ring/20 h-12 w-full rounded-lg border px-4 text-lg font-medium outline-none focus:ring-2"
                  />
                )}
              </div>
            </div>
          )}

          {step === "sex" && (
            <div>
              <h2 className="text-lg font-semibold">What is your sex?</h2>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {(["male", "female"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => update({ sex: s })}
                    aria-pressed={answers.sex === s}
                    className={`rounded-lg border px-4 py-3 text-sm font-medium capitalize transition-colors ${
                      answers.sex === s
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border hover:bg-accent"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === "name" && (
            <div>
              <h2 className="text-lg font-semibold">What&apos;s your name?</h2>
              <input
                type="text"
                value={answers.fullName}
                onChange={(e) => update({ fullName: e.target.value })}
                placeholder="John Doe"
                className="border-input bg-background placeholder:text-muted-foreground focus:border-ring focus:ring-ring/20 mt-4 h-12 w-full rounded-lg border px-4 text-lg font-medium outline-none focus:ring-2"
              />
            </div>
          )}

          {step === "country" && (
            <div>
              <h2 className="text-lg font-semibold">Where are you from?</h2>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {COUNTRY_OPTIONS.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => update({ country: c.value })}
                    aria-pressed={answers.country === c.value}
                    className={`rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${
                      answers.country === c.value
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border hover:bg-accent"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === "credentials" && (
            <div>
              <h2 className="text-lg font-semibold">Create your account</h2>
              <p className="text-muted-foreground mt-1 text-sm">
                Last step — pick an email and password.
              </p>
              <div className="mt-4 space-y-3">
                <div className="relative">
                  <Mail className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                  <input
                    type="email"
                    value={answers.email}
                    onChange={(e) => update({ email: e.target.value })}
                    placeholder="you@example.com"
                    className="border-input bg-background focus:border-ring focus:ring-ring/20 h-10 w-full rounded-lg border pr-3 pl-10 text-sm outline-none focus:ring-2"
                  />
                </div>

                <div className="relative">
                  <Lock className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={answers.password}
                    onChange={(e) => update({ password: e.target.value })}
                    placeholder="Password (min 6 chars)"
                    className="border-input bg-background focus:border-ring focus:ring-ring/20 h-10 w-full rounded-lg border pr-10 pl-10 text-sm outline-none focus:ring-2"
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
                <div className="relative">
                  <Lock className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={answers.confirmPassword}
                    onChange={(e) =>
                      update({ confirmPassword: e.target.value })
                    }
                    placeholder="Confirm password"
                    className="border-input bg-background focus:border-ring focus:ring-ring/20 h-10 w-full rounded-lg border pr-3 pl-10 text-sm outline-none focus:ring-2"
                  />
                </div>
              </div>
            </div>
          )}

          {error && <p className="text-destructive mt-4 text-sm">{error}</p>}

          {/* Navigation */}
          <div className="mt-6 flex gap-3">
            <button
              onClick={handlePrevious}
              className="border-border hover:bg-accent flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors"
            >
              <ArrowLeft className="size-4" />
              Previous
            </button>
            <button
              onClick={handleNext}
              disabled={!canContinue || submitting}
              className="bg-primary text-primary-foreground hover:bg-primary/80 flex flex-1 items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
            >
              {submitting
                ? "Creating…"
                : isLastStep
                  ? "Create Account"
                  : "Next"}
              {!isLastStep && !submitting && <ArrowRight className="size-4" />}
            </button>
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
    loading: authLoading,
    signIn,
    signOut,
    isRecovery,
    clearRecovery,
    updatePassword,
  } = useAuth();

  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showSignInToast, setShowSignInToast] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    try {
      const p = await fetchUserProfile();
      setProfile(p);
    } catch {
      // Not critical for the page to load
    } finally {
      setProfileLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;
    void (async () => {
      if (!user) {
        if (!cancelled) setProfileLoading(false);
        return;
      }
      await loadProfile();
    })();
    return () => {
      cancelled = true;
    };
  }, [user, authLoading, loadProfile]);

  function resetForm() {
    setEmail("");
    setPassword("");
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
      if (error) {
        setError(`Sign in failed: ${error}`);
      } else {
        setShowSignInToast(true);
      }
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

  if (authLoading || (user && profileLoading)) {
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
    return <ProfileView profile={profile} onSignOut={signOut} />;
  }

  // Sign-up wizard
  if (mode === "register") {
    return (
      <SignupWizard
        onComplete={() => {
          setMode("login");
        }}
      />
    );
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

  // Login form
  return (
    <>
      <ToastModal
        open={showSignInToast}
        type="success"
        title="Welcome back!"
        message="You have signed in successfully."
        autoClose={2000}
        onClose={() => setShowSignInToast(false)}
      />
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center">
            <div className="bg-accent mx-auto mb-4 flex size-16 items-center justify-center rounded-full">
              <User className="text-muted-foreground size-8" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Welcome back
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Sign in to access your fitness data
            </p>
          </div>
          {error && (
            <div className="border-destructive/30 bg-destructive/10 text-destructive rounded-lg border px-4 py-3 text-sm">
              {error}
            </div>
          )}
          <div className="space-y-4">
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
            <button
              type="button"
              disabled={submitting}
              onClick={handleSignIn}
              className="bg-primary text-primary-foreground hover:bg-primary/80 h-9 w-full rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {submitting ? "Please wait…" : "Sign In"}
            </button>
          </div>
          <p className="text-muted-foreground text-center text-sm">
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
          </p>
        </div>
      </div>
    </>
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
