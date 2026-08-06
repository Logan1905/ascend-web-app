"use client";

import { AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div
        className="bg-background/60 absolute inset-0 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="border-border bg-card relative w-full max-w-sm rounded-xl border p-6 shadow-lg">
        <div className="mb-4 flex items-start gap-3">
          <div className="bg-destructive/10 flex size-9 shrink-0 items-center justify-center rounded-full">
            <AlertCircle className="text-destructive size-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold">{title}</h2>
            <p className="text-muted-foreground mt-1 text-sm">{message}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
              destructive
                ? "bg-destructive hover:bg-destructive/90 text-white"
                : "bg-primary text-primary-foreground hover:bg-primary/80"
            }`}
          >
            {loading ? "Please wait…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
