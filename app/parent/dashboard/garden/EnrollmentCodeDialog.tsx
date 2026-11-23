"use client";

import { useState, type FormEvent } from "react";
import { GardenDialog } from "@/app/parent/_garden/sheet";
import { TextField } from "@/app/parent/_garden/fields";
import { usePortalFeedback, celebrate } from "@/app/parent/_garden/feedback";
import { Spinner, btnGhostSm, btnSageSm, linkSoft } from "@/app/parent/_garden/ui";

/**
 * Garden version of the "Have an enrollment code?" link + dialog for pending applications.
 * Same endpoint (`/api/apply/redeem-code`) and copy as `app/apply/dashboard/EnrollmentCodeEntry`.
 */
export default function EnrollmentCodeDialog({
  applicationId,
  onSuccess,
  readOnlyPreview,
}: {
  applicationId: string;
  onSuccess: () => void;
  readOnlyPreview?: boolean;
}) {
  const { toast, blockedByPreview } = usePortalFeedback(readOnlyPreview);
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    if (loading) return;
    setOpen(false);
    setCode("");
    setError(null);
  };

  const submit = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!code.trim() || blockedByPreview()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/apply/redeem-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, applicationId }),
      });
      if (res.ok) {
        void celebrate();
        toast.show({ tone: "success", title: "Code accepted" });
        setOpen(false);
        setLoading(false);
        onSuccess();
        return;
      }
      setError("Invalid code. Please try again.");
    } catch {
      setError("Please check your connection and try again.");
      toast.show({ tone: "error", title: "Couldn't check your code", message: "Please check your connection and try again." });
    }
    setLoading(false);
  };

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={linkSoft}>
        Have an enrollment code?
      </button>
      <GardenDialog open={open} onClose={close} title="Have an enrollment code?">
        <p className="mt-1.5 text-[15px] font-semibold text-[var(--sf-soft)]">Enter the code you received to access your parent dashboard.</p>
        <form onSubmit={submit} className="mt-5 flex flex-col gap-4">
          <TextField
            label="Enrollment code"
            value={code}
            onChange={(v) => {
              setCode(v);
              if (error) setError(null);
            }}
            placeholder="Enter code…"
            disabled={loading}
            autoComplete="off"
            data-autofocus
            error={error}
          />
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={close} disabled={loading} className={btnGhostSm}>
              I don&apos;t have a code
            </button>
            <button type="submit" disabled={loading || !code.trim()} aria-busy={loading || undefined} className={btnSageSm}>
              {loading ? <Spinner /> : null}
              {loading ? "Checking…" : "Submit"}
            </button>
          </div>
        </form>
      </GardenDialog>
    </>
  );
}
