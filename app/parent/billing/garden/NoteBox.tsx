"use client";

import { useId, useState } from "react";
import { Spinner, btnSageSm } from "@/app/parent/_garden/ui";
import { useSaveNote } from "./checkout";
import type { CheckoutRequest } from "./payloads";

/** "Planning to add more … later?" note with Save Note and success/error toasts. */
export default function NoteBox({
  title,
  body,
  placeholder,
  initialNote,
  readOnly,
  build,
}: {
  title: string;
  body: string;
  placeholder: string;
  initialNote: string;
  readOnly?: boolean;
  build: (text: string) => CheckoutRequest;
}) {
  const id = useId();
  const [text, setText] = useState(initialNote);
  const [savedText, setSavedText] = useState(initialNote);
  const { saving, save } = useSaveNote(readOnly);
  const unsaved = text.trim() !== savedText.trim();

  return (
    <div className="rounded-[24px] bg-[var(--sf-butter)]/45 p-4">
      <label htmlFor={id} className="block text-[15px] font-extrabold">
        {title}
      </label>
      <p className="mt-0.5 text-xs font-semibold text-[var(--sf-soft)]">{body}</p>
      <textarea
        id={id}
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        maxLength={2000}
        placeholder={placeholder}
        className="mt-3 w-full resize-none rounded-[18px] border-0 bg-white px-3 py-2.5 text-sm font-semibold ring-1 ring-[var(--sf-ink)]/10 placeholder:text-[var(--sf-soft)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--sf-sage)]"
      />
      <div className="mt-2 flex items-center justify-between gap-3">
        <span className="text-xs font-bold text-[var(--sf-soft)]" aria-live="polite">
          {unsaved && text.trim() ? "Unsaved changes" : savedText.trim() && !unsaved ? "✓ Saved" : ""}
        </span>
        <button
          type="button"
          disabled={saving || !text.trim()}
          onClick={async () => {
            if (!text.trim()) return;
            const ok = await save(() => build(text));
            if (ok) setSavedText(text);
          }}
          className={btnSageSm}
        >
          {saving ? (
            <>
              <Spinner /> Saving…
            </>
          ) : (
            "Save Note"
          )}
        </button>
      </div>
    </div>
  );
}
