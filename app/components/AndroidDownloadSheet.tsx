"use client";

import { useEffect, useRef, useState } from "react";
import { submitAndroidDownloadRequest } from "@/app/actions/androidDownload";
import { GardenDialog } from "@/app/parent/_garden/sheet";
import { InlineError, TextField } from "@/app/parent/_garden/fields";
import { Spinner, btnSheetPrimary } from "@/app/parent/_garden/ui";
import { useToast } from "@/app/_garden/toast";

interface AndroidDownloadSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMAIL_MSG = "Please enter a valid email address.";

/**
 * "Download for Android" beta request as a Garden dialog. Must render inside a
 * `GardenToastProvider` (the /download page provides one). Same props as before.
 */
export default function AndroidDownloadSheet({ isOpen, onClose }: AndroidDownloadSheetProps) {
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const trimmed = email.trim();
  const valid = EMAIL_RE.test(trimmed);
  const fieldError = touched && trimmed !== "" && !valid ? EMAIL_MSG : null;

  function close() {
    if (isSubmitting) return;
    setServerError(null);
    setTouched(false);
    onClose();
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setTouched(true);
    if (!valid || isSubmitting) return;
    setIsSubmitting(true);
    setServerError(null);

    let result: { success: boolean; message: string };
    try {
      result = await submitAndroidDownloadRequest(trimmed);
    } catch {
      result = { success: false, message: "An unexpected error occurred. Please try again." };
    }
    if (!mounted.current) return;
    setIsSubmitting(false);

    if (result.success) {
      toast.show({ tone: "success", title: "Request sent", message: result.message });
      setEmail("");
      setTouched(false);
      onClose();
    } else {
      setServerError(result.message);
      toast.show({
        tone: "error",
        title: "Couldn't send the link",
        message: result.message,
        action: { label: "Try again", onClick: () => void handleSubmit() },
      });
    }
  };

  return (
    <GardenDialog open={isOpen} onClose={close} title="Download for Android">
      <p className="mt-2 text-[15px] font-semibold leading-relaxed text-[var(--sf-soft)]">
        Our Android app is currently in beta. Enter your email and we&apos;ll send you a direct download link.
      </p>
      <form className="mt-5 flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
        {serverError ? <InlineError>{serverError}</InlineError> : null}
        <TextField
          label="Email"
          required
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(v) => {
            setEmail(v);
            if (serverError) setServerError(null);
          }}
          onBlur={() => setTouched(true)}
          error={fieldError}
          disabled={isSubmitting}
          placeholder="your@email.com"
          data-autofocus
        />
        <button type="submit" className={btnSheetPrimary} disabled={isSubmitting || !valid} aria-busy={isSubmitting || undefined}>
          {isSubmitting ? <Spinner /> : null}
          {isSubmitting ? "Sending..." : "Send Me the Link"}
        </button>
      </form>
    </GardenDialog>
  );
}
