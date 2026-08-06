"use client";

import { useEffect } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "info";

interface ToastModalProps {
  open: boolean;
  type?: ToastType;
  title: string;
  message?: string;
  /** Auto-close after this many ms. Set to 0 to disable. Default: 0 */
  autoClose?: number;
  onClose: () => void;
}

const iconMap = {
  success: <CheckCircle2 className="size-6 text-green-600" />,
  error: <AlertCircle className="text-destructive size-6" />,
  info: <Info className="size-6 text-blue-500" />,
};

const bgMap = {
  success: "bg-green-100 dark:bg-green-900/30",
  error: "bg-destructive/10",
  info: "bg-blue-100 dark:bg-blue-900/30",
};

export function ToastModal({
  open,
  type = "info",
  title,
  message,
  autoClose = 0,
  onClose,
}: ToastModalProps) {
  useEffect(() => {
    if (!open || !autoClose) return;
    const timer = setTimeout(onClose, autoClose);
    return () => clearTimeout(timer);
  }, [open, autoClose, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div
        className="bg-background/60 absolute inset-0 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="animate-in fade-in zoom-in-95 border-border bg-card relative w-full max-w-xs rounded-xl border p-5 shadow-lg">
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground absolute top-3 right-3 rounded-md p-1"
        >
          <X className="size-4" />
        </button>
        <div className="flex flex-col items-center text-center">
          <div
            className={`mb-3 flex size-12 items-center justify-center rounded-full ${bgMap[type]}`}
          >
            {iconMap[type]}
          </div>
          <h3 className="text-base font-semibold">{title}</h3>
          {message && (
            <p className="text-muted-foreground mt-1 text-sm">{message}</p>
          )}
        </div>
      </div>
    </div>
  );
}
