// Garden feedback for staff Payroll / Pay History: pull-to-refresh + Retry,
// the confirm → success morph → "Paystub submitted" toast, and error toasts
// with Retry. Only reacts to the { ok } results the data hooks return.
import { haptic, useRefreshFeedback } from "@/components/garden";
import { useEffect, useRef, useState } from "react";
import { fmtHours, fmtMoney } from "../payrollUtils";
import type { Payroll, SubmitTarget } from "../usePayroll";
import type { PayrollHistory } from "../usePayrollHistory";

const RETRY_MSG = "Check your connection and try again.";
const SUCCESS_HOLD_MS = 900;

export function usePayrollFeedback(p: Payroll) {
  const { toast, refreshing, retrying, refresh, retry } = useRefreshFeedback(p.reload, p.retry);
  const [justSubmitted, setJustSubmitted] = useState(false);
  const latest = useRef<{ confirmSubmit?: (t: SubmitTarget) => Promise<void> }>({});
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const openPicker = () => {
    haptic.tap();
    p.openPicker();
  };

  const selectPeriod = (start: string) => {
    if (start !== p.selectedPeriod.start) haptic.select();
    p.selectPeriod(start);
  };

  const openConfirm = () => {
    if (!p.openConfirm()) return;
    setJustSubmitted(false);
    haptic.press();
  };

  const confirmSubmit = async (target: SubmitTarget) => {
    const r = await p.submit(target);
    if (r.skipped) return;
    if (r.ok) {
      haptic.success();
      setJustSubmitted(true);
      toast.show({
        tone: "success",
        title: "Paystub submitted",
        message: `${fmtHours(target.totalHours)} hrs · ${fmtMoney(target.grossPay)} for ${target.period.label}`,
      });
      // Let the ✓ morph land before the sheet slides away.
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        p.closeConfirm();
        setJustSubmitted(false);
      }, SUCCESS_HOLD_MS);
      return;
    }
    haptic.error();
    if (r.duplicate) {
      p.closeConfirm();
      toast.show({ tone: "error", title: "Already submitted", message: r.error });
      return;
    }
    // The sheet stays open so the teacher can try again right there.
    toast.show({
      tone: "error",
      title: "Paystub wasn't submitted",
      message: r.error ?? RETRY_MSG,
      action: { label: "Retry", onPress: () => void latest.current.confirmSubmit?.(target) },
    });
  };

  const openDetail = () => {
    haptic.tap();
    p.openDetail();
  };

  useEffect(() => {
    latest.current = { confirmSubmit };
  });

  return {
    toast,
    refreshing,
    retrying,
    refresh,
    retry,
    justSubmitted,
    openPicker,
    selectPeriod,
    openConfirm,
    confirmSubmit,
    openDetail,
  };
}

export type PayrollFeedback = ReturnType<typeof usePayrollFeedback>;

export function usePayrollHistoryFeedback(h: PayrollHistory) {
  const { refreshing, retrying, refresh, retry } = useRefreshFeedback(h.reload, h.retry);
  const toggle = (id: string) => {
    haptic.select();
    h.toggle(id);
  };
  return { refreshing, retrying, refresh, retry, toggle };
}

export type PayrollHistoryFeedback = ReturnType<typeof usePayrollHistoryFeedback>;
