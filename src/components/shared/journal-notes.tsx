"use client";

import { Check } from "lucide-react";

/**
 * The day's free-text journal.
 *
 * The save button only exists while there are unsaved changes, so a clean state
 * shows nothing but the heading and the text area.
 */

interface JournalNotesProps {
  value: string;
  onChange: (value: string) => void;
  /** True when `value` differs from what is stored. */
  dirty: boolean;
  saving: boolean;
  onSave: () => void;
}

export function JournalNotes({
  value,
  onChange,
  dirty,
  saving,
  onSave,
}: JournalNotesProps) {
  return (
    <div className="border-border bg-card rounded-xl border p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold">Journal</h2>

        {dirty && (
          <button
            onClick={onSave}
            disabled={saving}
            className="bg-primary text-primary-foreground hover:bg-primary/80 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50"
          >
            <Check className="size-3.5" />
            {saving ? "Saving…" : "Save"}
          </button>
        )}
      </div>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="How did today go? Anything worth remembering…"
        className="border-input bg-background placeholder:text-muted-foreground focus:border-ring focus:ring-ring/20 min-h-[180px] w-full resize-y rounded-lg border px-4 py-3 text-sm transition-colors outline-none focus:ring-2"
      />
    </div>
  );
}
