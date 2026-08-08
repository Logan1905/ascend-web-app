"use client";

import { useMemo, useState } from "react";
import { ArrowRight, ArrowLeft, Sparkles } from "lucide-react";

import { ConfirmModal } from "@/components/shared/confirm-modal";
import { parseWeightInput } from "@/schemas/profile";
import {
  FREQUENCY_OPTIONS,
  GOAL_OPTIONS,
  TRACK_WORKOUTS_OPTIONS,
  goalNeedsTargetWeight,
  toLbs,
  type FitnessGoal,
  type UserProfileDraft,
  type WeightUnit,
  type WorkoutFrequency,
} from "@/types/profile";

/**
 * Friendly onboarding questionnaire that gates the Progress tab.
 *
 * Answers live in one state object so they survive Previous/Next navigation.
 * The progress bar starts partly filled on purpose so the user feels they have
 * already made headway.
 */

/** Progress bar starts here so step one never feels like square zero. */
const BASELINE_PROGRESS = 15;

type StepId = "weight" | "goal" | "goalWeight" | "frequency" | "trackWorkouts";

interface Answers {
  currentWeight: string;
  unit: WeightUnit;
  goal: FitnessGoal | null;
  goalCustom: string;
  goalWeight: string;
  goalWeightUnit: WeightUnit;
  frequency: WorkoutFrequency | null;
  trackWorkouts: boolean | null;
}

const initialAnswers: Answers = {
  currentWeight: "",
  unit: "lbs",
  goal: null,
  goalCustom: "",
  goalWeight: "",
  goalWeightUnit: "lbs",
  frequency: null,
  trackWorkouts: null,
};

interface OnboardingWizardProps {
  onComplete: (draft: UserProfileDraft) => Promise<void>;
}

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const [started, setStarted] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>(initialAnswers);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Q3 is skipped for goals that have no target weight.
  const steps = useMemo<StepId[]>(() => {
    const base: StepId[] = ["weight", "goal"];
    if (goalNeedsTargetWeight(answers.goal)) base.push("goalWeight");
    base.push("frequency", "trackWorkouts");
    return base;
  }, [answers.goal]);

  // Clamp in case the step list shrank after the goal answer changed.
  const safeIndex = Math.min(stepIndex, steps.length - 1);
  const step = steps[safeIndex];
  const isLastStep = safeIndex === steps.length - 1;

  const progress =
    BASELINE_PROGRESS +
    Math.round(((safeIndex + 1) / steps.length) * (100 - BASELINE_PROGRESS));

  function update(patch: Partial<Answers>) {
    setAnswers((prev) => ({ ...prev, ...patch }));
  }

  const canContinue = (() => {
    switch (step) {
      case "weight":
        return parseWeightInput(answers.currentWeight) !== null;
      case "goal":
        return (
          answers.goal !== null &&
          (answers.goal !== "other" || answers.goalCustom.trim().length > 0)
        );
      case "goalWeight":
        return parseWeightInput(answers.goalWeight) !== null;
      case "frequency":
        return answers.frequency !== null;
      case "trackWorkouts":
        return answers.trackWorkouts !== null;
    }
  })();

  function handleNext() {
    if (!canContinue) return;
    if (isLastStep) {
      setShowConfirm(true);
      return;
    }
    setStepIndex(safeIndex + 1);
  }

  function handlePrevious() {
    if (safeIndex === 0) {
      setStarted(false);
      return;
    }
    setStepIndex(safeIndex - 1);
  }

  async function handleSave() {
    const currentWeight = parseWeightInput(answers.currentWeight);
    if (
      currentWeight === null ||
      !answers.goal ||
      !answers.frequency ||
      answers.trackWorkouts === null
    ) {
      setShowConfirm(false);
      setError("Something's missing. Please check your answers.");
      return;
    }

    const needsTarget = goalNeedsTargetWeight(answers.goal);
    const goalWeight = needsTarget
      ? parseWeightInput(answers.goalWeight)
      : null;

    setSaving(true);
    setError(null);

    try {
      await onComplete({
        currentWeight: toLbs(currentWeight, answers.unit),
        goalWeight:
          goalWeight === null
            ? null
            : toLbs(goalWeight, answers.goalWeightUnit),
        weightUnit: answers.unit,
        goal: answers.goal,
        goalCustom: answers.goal === "other" ? answers.goalCustom.trim() : null,
        workoutFrequency: answers.frequency,
        trackWorkouts: answers.trackWorkouts,
      });
      setShowConfirm(false);
    } catch (err) {
      setShowConfirm(false);
      setError(
        err instanceof Error ? err.message : "Could not save. Try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  // --- Intro screen ---

  if (!started) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6">
        <div className="border-border bg-card rounded-xl border p-6 sm:p-8">
          <div className="bg-primary/10 mb-4 flex size-11 items-center justify-center rounded-full">
            <Sparkles className="text-primary size-5" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Let&apos;s set up your progress
          </h1>
          <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
            A few quick questions so we can track your progress properly. Your
            answers shape your charts, your goal, and everything you see here.
            It takes less than a minute, and you can change any of it later in
            settings.
          </p>
          <button
            onClick={() => setStarted(true)}
            aria-label="Start the questions"
            className="bg-primary text-primary-foreground hover:bg-primary/80 mt-6 flex size-12 items-center justify-center rounded-full transition-colors"
          >
            <ArrowRight className="size-5" />
          </button>
        </div>
      </div>
    );
  }

  // --- Question screens ---

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6">
      <div className="border-border bg-card rounded-xl border p-5 sm:p-6">
        {/* Progress bar */}
        <div className="mb-6">
          <div className="text-muted-foreground mb-1.5 flex items-center justify-between text-xs font-medium">
            <span>
              Question {safeIndex + 1} of {steps.length}
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

        {step === "weight" && (
          <Question title="What is your current weight?">
            <WeightField
              value={answers.currentWeight}
              unit={answers.unit}
              onValueChange={(currentWeight) => update({ currentWeight })}
              onUnitChange={(unit) => update({ unit, goalWeightUnit: unit })}
            />
          </Question>
        )}

        {step === "goal" && (
          <Question title="What is your main fitness goal?">
            <div className="grid gap-2 sm:grid-cols-2">
              {GOAL_OPTIONS.map((option) => (
                <OptionButton
                  key={option.value}
                  label={option.label}
                  selected={answers.goal === option.value}
                  onClick={() => update({ goal: option.value })}
                />
              ))}
            </div>
            {answers.goal === "other" && (
              <input
                type="text"
                value={answers.goalCustom}
                onChange={(e) => update({ goalCustom: e.target.value })}
                maxLength={100}
                placeholder="Tell us your goal"
                className="border-input bg-background placeholder:text-muted-foreground focus:border-ring focus:ring-ring/20 mt-3 h-11 w-full rounded-lg border px-4 text-sm transition-colors outline-none focus:ring-2"
              />
            )}
          </Question>
        )}

        {step === "goalWeight" && (
          <Question title="What is your goal weight?">
            <WeightField
              value={answers.goalWeight}
              unit={answers.goalWeightUnit}
              onValueChange={(goalWeight) => update({ goalWeight })}
              onUnitChange={(goalWeightUnit) => update({ goalWeightUnit })}
            />
          </Question>
        )}

        {step === "frequency" && (
          <Question title="How often do you work out?">
            <div className="grid gap-2 sm:grid-cols-2">
              {FREQUENCY_OPTIONS.map((option) => (
                <OptionButton
                  key={option.value}
                  label={option.label}
                  selected={answers.frequency === option.value}
                  onClick={() => update({ frequency: option.value })}
                />
              ))}
            </div>
          </Question>
        )}

        {step === "trackWorkouts" && (
          <Question title="Track your workouts?">
            <p className="text-muted-foreground -mt-2 mb-4 text-sm">
              Log your sets and reps as you train. You can turn this on or off
              later in settings.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {TRACK_WORKOUTS_OPTIONS.map((option) => (
                <OptionButton
                  key={option.label}
                  label={option.label}
                  selected={answers.trackWorkouts === option.value}
                  onClick={() => update({ trackWorkouts: option.value })}
                />
              ))}
            </div>
          </Question>
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
            disabled={!canContinue}
            className="bg-primary text-primary-foreground hover:bg-primary/80 flex flex-1 items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
          >
            {isLastStep ? "Save" : "Next"}
            {!isLastStep && <ArrowRight className="size-4" />}
          </button>
        </div>
      </div>

      <ConfirmModal
        open={showConfirm}
        title="Save your answers?"
        message="You can change any of this later in settings."
        cancelLabel="No"
        confirmLabel="Yes"
        loading={saving}
        onCancel={() => setShowConfirm(false)}
        onConfirm={handleSave}
      />
    </div>
  );
}

// --- Small building blocks ---

function Question({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="text-lg font-semibold sm:text-xl">{title}</h2>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function OptionButton({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={selected}
      className={`rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${
        selected
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border hover:bg-accent"
      }`}
    >
      {label}
    </button>
  );
}

function WeightField({
  value,
  unit,
  onValueChange,
  onUnitChange,
}: {
  value: string;
  unit: WeightUnit;
  onValueChange: (value: string) => void;
  onUnitChange: (unit: WeightUnit) => void;
}) {
  return (
    <div className="flex gap-2">
      <input
        type="number"
        step="0.1"
        inputMode="decimal"
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        placeholder={unit === "lbs" ? "170.0" : "77.0"}
        aria-label={`Weight in ${unit}`}
        className="border-input bg-background placeholder:text-muted-foreground focus:border-ring focus:ring-ring/20 h-12 flex-1 rounded-lg border px-4 text-lg font-medium transition-colors outline-none focus:ring-2"
      />
      <div className="border-border flex overflow-hidden rounded-lg border text-sm font-medium">
        {(["lbs", "kg"] as const).map((u) => (
          <button
            key={u}
            onClick={() => onUnitChange(u)}
            className={`px-3 transition-colors ${
              unit === u
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent"
            }`}
          >
            {u}
          </button>
        ))}
      </div>
    </div>
  );
}
