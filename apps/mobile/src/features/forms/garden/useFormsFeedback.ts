// Garden feedback for the Forms & Docs viewers: pull to refresh with the quiet
// "You're up to date" toast, Retry on the error card, and opening links/files.
// Only reacts to { ok } results from the data hooks.
import { haptic, useToast } from "@/components/garden";
import { useCallback, useEffect, useRef, useState } from "react";
import { Linking } from "react-native";
import type { Result } from "../formsUtils";

/** @param retryFn what the error card's Retry runs (defaults to reload). */
export function useFormsFeedback(
  reload: () => Promise<Result>,
  retryFn: () => Promise<Result> = reload,
) {
  const toast = useToast();
  const [refreshing, setRefreshing] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const refreshRef = useRef<(() => Promise<void>) | null>(null);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    const r = await reload();
    setRefreshing(false);
    if (r.ok) {
      toast.show({ tone: "success", title: "You're up to date", duration: 1600, silent: true });
      haptic.tap();
    } else {
      toast.show({
        tone: "error",
        title: "Couldn't refresh",
        message: "Check your connection and try again.",
        action: { label: "Retry", onPress: () => void refreshRef.current?.() },
      });
    }
  }, [reload, toast]);

  const retry = useCallback(async () => {
    setRetrying(true);
    const r = await retryFn();
    setRetrying(false);
    if (r.ok) haptic.success();
    else haptic.error();
  }, [retryFn]);

  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);

  const openEmail = useCallback(
    async (email: string) => {
      try {
        await Linking.openURL(`mailto:${email}`);
      } catch {
        toast.show({
          tone: "error",
          title: "Couldn't open Mail",
          message: email,
        });
      }
    },
    [toast],
  );

  return { toast, refreshing, retrying, refresh, retry, openEmail };
}

export type FormsFeedback = ReturnType<typeof useFormsFeedback>;
