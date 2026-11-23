"use client";

import { useEffect, useRef, type ComponentProps } from "react";
import GardenSheet from "@/app/parent/_garden/sheet";

type Props = ComponentProps<typeof GardenSheet>;

/**
 * GardenSheet plus a focus rescue for the enrollment sheets.
 *
 * Saving a signature, deleting a file or saving a form swaps or disables the button that
 * had focus, so focus falls back to <body>. The sheet's own Esc / Tab handling listens on
 * the panel, so from <body> Esc stopped closing the sheet and Tab walked the page behind it.
 * When that happens (and this sheet is the topmost dialog), Esc closes the sheet and Tab
 * moves focus back inside it.
 */
export default function EnrollmentSheet({ bodyRef, ...props }: Props) {
  const ownRef = useRef<HTMLDivElement>(null);
  const ref = bodyRef ?? ownRef;
  const { open, onClose } = props;
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape" && e.key !== "Tab") return;
      const active = document.activeElement;
      if (active && active !== document.body) return;
      const dialog = ref.current?.closest<HTMLElement>('[role="dialog"]');
      if (!dialog?.isConnected) return;
      const dialogs = document.querySelectorAll('[role="dialog"]');
      if (dialogs[dialogs.length - 1] !== dialog) return;
      if (e.key === "Escape") {
        e.preventDefault();
        onCloseRef.current();
      } else {
        // Focus the panel; the browser's own Tab then lands on its first control.
        dialog.focus({ preventScroll: true });
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, ref]);

  return <GardenSheet {...props} bodyRef={ref} />;
}
