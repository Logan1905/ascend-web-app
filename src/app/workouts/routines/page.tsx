"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Check,
  Moon,
  Trash2,
  Pencil,
  GripVertical,
  AlertCircle,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import { useAuth } from "@/components/providers/auth-provider";
import {
  deleteRoutine,
  fetchRoutines,
  setActiveRoutine,
  updateRoutineOrder,
} from "@/lib/supabase/routines";
import { withRetry } from "@/lib/utils/retry";
import { DAYS_OF_WEEK, type Routine } from "@/types/routine";

// --- Modal ---

interface UnsavedModalProps {
  message: string;
  saving: boolean;
  onSave: () => void;
  onDiscard: () => void;
}

function UnsavedModal({
  message,
  saving,
  onSave,
  onDiscard,
}: UnsavedModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="bg-background/80 absolute inset-0 backdrop-blur-sm" />
      <div className="border-border bg-card relative w-full max-w-sm rounded-xl border p-6 shadow-lg">
        <div className="mb-4 flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
            <AlertCircle className="size-5 text-orange-500" />
          </div>
          <div>
            <h2 className="text-base font-semibold">Unsaved Changes</h2>
            <p className="text-muted-foreground mt-1 text-sm">{message}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onDiscard}
            disabled={saving}
          >
            Discard
          </Button>
          <Button className="flex-1" onClick={onSave} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// --- Sortable card ---

interface SortableRoutineCardProps {
  routine: Routine;
  pendingActiveId: string | null;
  busyId: string | null;
  onSelect: (id: string) => void;
  onDelete: (routine: Routine) => void;
}

function SortableRoutineCard({
  routine,
  pendingActiveId,
  busyId,
  onSelect,
  onDelete,
}: SortableRoutineCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: routine.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isSelected =
    pendingActiveId === routine.id ||
    (pendingActiveId === null && routine.isActive);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-card rounded-xl border p-4 transition-colors ${isSelected ? "border-primary" : "border-border"}`}
    >
      <div className="mb-3 flex items-center gap-2">
        <button
          {...attributes}
          {...listeners}
          className="text-muted-foreground hover:bg-accent hover:text-foreground cursor-grab touch-none rounded-md p-1 active:cursor-grabbing"
          aria-label="Drag to reorder"
        >
          <GripVertical className="size-4" />
        </button>

        <button
          onClick={() => onSelect(routine.id)}
          disabled={busyId === routine.id}
          className={`flex size-6 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
            isSelected
              ? "border-primary bg-primary text-primary-foreground"
              : "border-muted-foreground/40 hover:border-primary"
          }`}
          aria-label={
            isSelected ? "Selected routine" : `Select ${routine.name}`
          }
        >
          {isSelected && <Check className="size-4" />}
        </button>

        <h2 className="flex-1 text-base font-semibold">{routine.name}</h2>

        <Link
          href={`/workouts/routines/edit?id=${routine.id}`}
          className="text-muted-foreground hover:bg-accent hover:text-foreground rounded-md p-1.5 transition-colors"
          aria-label={`Edit ${routine.name}`}
        >
          <Pencil className="size-4" />
        </Link>

        <button
          onClick={() => onDelete(routine)}
          disabled={busyId === routine.id}
          className="text-destructive hover:bg-destructive/10 rounded-md p-1.5 transition-colors disabled:opacity-50"
          aria-label={`Delete ${routine.name}`}
        >
          <Trash2 className="size-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {DAYS_OF_WEEK.map(({ value, short }) => {
          const day = routine.days.find((d) => d.dayOfWeek === value);
          return (
            <div
              key={value}
              className="bg-muted/50 flex flex-col items-center rounded-lg px-1 py-2"
            >
              <span className="text-muted-foreground text-[10px] font-medium uppercase sm:text-xs">
                {short}
              </span>
              {day?.isRestDay ? (
                <Moon className="text-muted-foreground mt-1 size-3.5 sm:size-4" />
              ) : (
                <span className="mt-1 text-center text-[10px] leading-tight font-medium sm:text-xs">
                  {day?.label || "—"}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- Main page ---

export default function RoutinesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Unsaved selection
  const [pendingActiveId, setPendingActiveId] = useState<string | null>(null);

  // Unsaved order — track the original order IDs to detect changes
  const originalOrderRef = useRef<string[]>([]);
  const [orderChanged, setOrderChanged] = useState(false);

  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Routine | null>(null);

  const currentActiveId = routines.find((r) => r.isActive)?.id ?? null;
  const hasUnsavedSelection =
    pendingActiveId !== null && pendingActiveId !== currentActiveId;
  const hasUnsavedChanges = hasUnsavedSelection || orderChanged;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    }),
  );

  useEffect(() => {
    if (authLoading || !user) return;

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await withRetry(() => fetchRoutines());
        if (!cancelled) {
          setRoutines(data);
          originalOrderRef.current = data.map((r) => r.id);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load routines.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, user]);

  function handleSelect(routineId: string) {
    if (routineId === currentActiveId) {
      setPendingActiveId(null);
    } else {
      setPendingActiveId(routineId);
    }
  }

  async function handleSaveAll() {
    setSaving(true);
    setError(null);
    try {
      // Save active routine change
      if (hasUnsavedSelection && pendingActiveId) {
        await setActiveRoutine(pendingActiveId);
        setRoutines((prev) =>
          prev.map((r) => ({ ...r, isActive: r.id === pendingActiveId })),
        );
        setPendingActiveId(null);
      }
      // Save order change
      if (orderChanged) {
        await updateRoutineOrder(routines.map((r) => r.id));
        originalOrderRef.current = routines.map((r) => r.id);
        setOrderChanged(false);
      }
      setShowModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save changes.");
    } finally {
      setSaving(false);
    }
  }

  function handleDiscardAll() {
    // Revert selection
    setPendingActiveId(null);
    // Revert order
    if (orderChanged) {
      const original = originalOrderRef.current;
      setRoutines((prev) => {
        const map = new Map(prev.map((r) => [r.id, r]));
        return original.map((id) => map.get(id)!).filter(Boolean);
      });
      setOrderChanged(false);
    }
    setShowModal(false);
  }

  async function handleDelete(routine: Routine) {
    setDeleteTarget(routine);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setBusyId(deleteTarget.id);
    setError(null);
    try {
      await deleteRoutine(deleteTarget.id);
      if (pendingActiveId === deleteTarget.id) setPendingActiveId(null);
      setRoutines((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      originalOrderRef.current = originalOrderRef.current.filter(
        (id) => id !== deleteTarget.id,
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not delete the routine.",
      );
    } finally {
      setBusyId(null);
      setDeleteTarget(null);
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setRoutines((prev) => {
      const oldIndex = prev.findIndex((r) => r.id === active.id);
      const newIndex = prev.findIndex((r) => r.id === over.id);
      const reordered = arrayMove(prev, oldIndex, newIndex);

      // Check if order differs from original
      const currentIds = reordered.map((r) => r.id);
      const changed = currentIds.some(
        (id, i) => id !== originalOrderRef.current[i],
      );
      setOrderChanged(changed);

      return reordered;
    });
  }

  function handleBack() {
    if (hasUnsavedChanges) {
      setShowModal(true);
    } else {
      router.push("/workouts");
    }
  }

  // Build modal message
  function getModalMessage(): string {
    if (hasUnsavedSelection && orderChanged) {
      const name =
        routines.find((r) => r.id === pendingActiveId)?.name ?? "a routine";
      return `You selected "${name}" and reordered your routines. Save your changes?`;
    }
    if (hasUnsavedSelection) {
      const name =
        routines.find((r) => r.id === pendingActiveId)?.name ?? "a routine";
      return `You selected "${name}" as your active routine. Save?`;
    }
    return "You reordered your routines. Save the new order?";
  }

  return (
    <>
      {showModal && (
        <UnsavedModal
          message={getModalMessage()}
          saving={saving}
          onSave={handleSaveAll}
          onDiscard={handleDiscardAll}
        />
      )}

      <ConfirmModal
        open={!!deleteTarget}
        title="Delete Routine"
        message={`Are you sure you want to delete "${deleteTarget?.name ?? ""}"? This cannot be undone.`}
        confirmLabel="Delete"
        destructive
        loading={busyId === deleteTarget?.id}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-6 sm:px-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              className="text-muted-foreground hover:bg-accent hover:text-foreground rounded-md p-1.5 transition-colors"
              aria-label="Back to workouts"
            >
              <ArrowLeft className="size-5" />
            </button>
            <h1 className="text-2xl font-bold tracking-tight">My Routines</h1>
          </div>

          <div className="flex items-center gap-2">
            {hasUnsavedChanges && (
              <Button
                size="sm"
                className="shrink-0 gap-1.5"
                onClick={handleSaveAll}
                disabled={saving}
              >
                <Check className="size-4" />
                {saving ? "Saving…" : "Save"}
              </Button>
            )}

            {user && (
              <Link href="/workouts/routines/new">
                <Button
                  size="sm"
                  variant={hasUnsavedChanges ? "outline" : "default"}
                  className="shrink-0 gap-1.5"
                >
                  <Plus className="size-4" />
                  Add Routine
                </Button>
              </Link>
            )}
          </div>
        </div>

        {error && (
          <div className="border-destructive/30 bg-destructive/10 text-destructive rounded-lg border px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {!authLoading && !user && (
          <div className="border-border flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-16 text-center">
            <p className="text-muted-foreground">
              Sign in to create and save your routines.
            </p>
            <Link href="/profile">
              <Button size="sm">Go to Sign In</Button>
            </Link>
          </div>
        )}

        {(authLoading || (user && loading)) && (
          <p className="text-muted-foreground text-sm">Loading routines…</p>
        )}

        {user && !loading && routines.length === 0 && !error && (
          <div className="border-border flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-16 text-center">
            <p className="text-muted-foreground">
              No routines yet. Create one to get started!
            </p>
            <Link href="/workouts/routines/new">
              <Button size="sm" className="gap-1.5">
                <Plus className="size-4" />
                Add Routine
              </Button>
            </Link>
          </div>
        )}

        {user && !loading && routines.length > 0 && (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={routines.map((r) => r.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-4">
                {routines.map((routine) => (
                  <SortableRoutineCard
                    key={routine.id}
                    routine={routine}
                    pendingActiveId={pendingActiveId}
                    busyId={busyId}
                    onSelect={handleSelect}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </>
  );
}
