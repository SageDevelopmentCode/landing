"use client";

import { useEffect, useRef, type MutableRefObject } from "react";

export type NavigateAwayTarget =
  | { kind: "link"; href: string }
  | { kind: "back" };

function isModifiedClick(e: MouseEvent): boolean {
  return e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0;
}

export function useInAppNavigationGuard(
  enabled: boolean,
  onNavigateAway: (target: NavigateAwayTarget) => void,
  suppressHistoryRestoreRef?: MutableRefObject<boolean>
) {
  const onNavigateAwayRef = useRef(onNavigateAway);

  useEffect(() => {
    onNavigateAwayRef.current = onNavigateAway;
  }, [onNavigateAway]);

  const guardPushedRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    function handleClick(e: MouseEvent) {
      if (isModifiedClick(e)) return;

      const anchor = (e.target as HTMLElement | null)?.closest("a[href]");
      if (!anchor) return;

      const hrefAttr = anchor.getAttribute("href");
      if (!hrefAttr || hrefAttr.startsWith("#")) return;
      if (hrefAttr.startsWith("mailto:") || hrefAttr.startsWith("tel:")) return;
      if (anchor.hasAttribute("download")) return;
      if (anchor.getAttribute("target") === "_blank") return;

      let url: URL;
      try {
        url = new URL(hrefAttr, window.location.origin);
      } catch {
        return;
      }

      if (url.origin !== window.location.origin) return;
      const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      const target = `${url.pathname}${url.search}${url.hash}`;
      if (target === current) return;

      e.preventDefault();
      e.stopPropagation();
      onNavigateAwayRef.current({ kind: "link", href: target });
    }

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      if (guardPushedRef.current) {
        guardPushedRef.current = false;
        window.history.back();
      }
      return;
    }

    const url = window.location.href;
    window.history.pushState({ activityFormGuard: true }, "", url);
    guardPushedRef.current = true;

    function handlePopState() {
      window.history.pushState({ activityFormGuard: true }, "", url);
      onNavigateAwayRef.current({ kind: "back" });
    }

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
      if (guardPushedRef.current) {
        guardPushedRef.current = false;
        if (!suppressHistoryRestoreRef?.current) {
          window.history.back();
        } else if (suppressHistoryRestoreRef) {
          suppressHistoryRestoreRef.current = false;
        }
      }
    };
  }, [enabled, suppressHistoryRestoreRef]);
}

export function useBeforeUnloadGuard(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [enabled]);
}
