// Garden feedback for Tuition: toasts, haptics and confetti that react to
// useParentTuition's results. Stripe itself stays inside the billing sheets.
import type { ConfettiHandle } from "@/components/garden";
import { haptic, READ_ONLY_TOAST, useToast } from "@/components/garden";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ParentTuition } from "../useParentTuition";

export function useTuitionFeedback(c: ParentTuition) {
  const toast = useToast();
  const confettiRef = useRef<ConfettiHandle>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const refreshRef = useRef<(() => Promise<void>) | null>(null);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    const r = await c.reload();
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
  }, [c, toast]);

  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);

  const retryLoad = useCallback(async () => {
    setRetrying(true);
    const r = await c.retryLoad();
    setRetrying(false);
    if (r.ok) haptic.success();
  }, [c]);

  /** Fix: preview used to block payments silently — now it says why. */
  const guardPayment = useCallback(
    (fn: () => void) => () => {
      if (c.isReadOnlyPreview) {
        toast.show(READ_ONLY_TOAST);
        return;
      }
      fn();
    },
    [c.isReadOnlyPreview, toast],
  );

  const selectChild = useCallback(
    (id: string) => {
      if (id === c.activeChildId) return;
      haptic.select();
      c.setActiveChildId(id);
    },
    [c],
  );

  /** Every billing sheet calls this after Stripe reports success. */
  const onPaymentSuccess = useCallback(async () => {
    haptic.success();
    confettiRef.current?.fire();
    toast.show({
      tone: "success",
      title: "Payment received 🎉",
      message: "It'll show up in your payment history.",
    });
    await c.reload();
  }, [c, toast]);

  return {
    toast,
    confettiRef,
    refreshing,
    retrying,
    refresh,
    retryLoad,
    guardPayment,
    selectChild,
    onPaymentSuccess,
  };
}

export type TuitionFeedback = ReturnType<typeof useTuitionFeedback>;
