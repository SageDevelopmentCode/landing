// Pull to refresh + error-card Retry feedback for any data hook that returns
// { ok } from a quiet reload. Same behaviour as useFormsFeedback.
import { useCallback, useEffect, useRef, useState } from "react";
import { haptic } from "./haptics";
import { useToast } from "./GardenToast";

type Reload = () => Promise<{ ok: boolean; error?: string }>;

/** @param retryFn what the error card's Retry runs (defaults to reload). */
export function useRefreshFeedback(reload: Reload, retryFn: Reload = reload) {
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

  return { toast, refreshing, retrying, refresh, retry };
}

export type RefreshFeedback = ReturnType<typeof useRefreshFeedback>;
