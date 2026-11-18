// Read-only preview guard (an admin viewing the app as a parent).
import { useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "./GardenToast";

export const READ_ONLY_TOAST = {
  tone: "info" as const,
  title: "Preview mode",
  message: "Changes are turned off while viewing as a parent.",
};

/**
 * Returns `blocked()` — call it at the top of any write. It shows the
 * "Preview mode" toast and returns true when the write must be skipped.
 */
export function useWriteGuard() {
  const { isReadOnlyPreview } = useAuth();
  const toast = useToast();
  const blocked = useCallback(() => {
    if (!isReadOnlyPreview) return false;
    toast.show(READ_ONLY_TOAST);
    return true;
  }, [isReadOnlyPreview, toast]);
  return { isReadOnlyPreview, blocked };
}
