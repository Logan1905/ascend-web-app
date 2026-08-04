import { z } from "zod";

/**
 * Validation schemas for workout routines. These mirror the CHECK constraints
 * defined in the database migration so invalid data is caught before it is sent.
 */

export const routineExerciseSchema = z.object({
  id: z.string(),
  name: z
    .string()
    .trim()
    .min(1, "Exercise name is required.")
    .max(150, "Exercise name is too long."),
  sets: z
    .number()
    .int("Sets must be a whole number.")
    .min(1, "Sets must be at least 1.")
    .max(20, "Sets cannot exceed 20."),
  reps: z
    .string()
    .trim()
    .min(1, "Reps are required.")
    .max(20, "Reps value is too long."),
});

export const routineDaySchema = z
  .object({
    dayOfWeek: z.number().int().min(1).max(7),
    isRestDay: z.boolean(),
    label: z.string().trim().max(100, "Day label is too long."),
    restMinutes: z
      .number()
      .int("Rest time must be a whole number.")
      .min(0, "Rest time cannot be negative.")
      .max(60, "Rest time cannot exceed 60 minutes."),
    exercises: z.array(routineExerciseSchema),
  })
  .refine((day) => day.isRestDay || day.label.trim().length > 0, {
    message: "Give the day a label (e.g. Push) or mark it as a rest day.",
    path: ["label"],
  })
  .refine((day) => day.isRestDay || day.exercises.length > 0, {
    message: "Add at least one exercise or mark the day as a rest day.",
    path: ["exercises"],
  });

export const routineDraftSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Routine name is required.")
    .max(100, "Routine name is too long."),
  days: z.array(routineDaySchema).length(7, "A routine must cover all 7 days."),
});

export type RoutineDraftInput = z.infer<typeof routineDraftSchema>;
