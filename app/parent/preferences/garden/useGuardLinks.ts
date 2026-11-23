"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * `beforeunload` only covers reloads and leaving the site. Client-side navigation (header nav,
 * any internal <a>) skips it, so while `dirty` we catch same-origin link clicks and route them
 * through `confirm` ("Discard changes?") first.
 */
export function useGuardLinks(dirty: boolean, confirm: (action: () => void) => void) {
  const router = useRouter();
  useEffect(() => {
    if (!dirty) return;
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || (a.target && a.target !== "_self") || a.hasAttribute("download")) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      e.preventDefault();
      e.stopPropagation();
      confirm(() => router.push(url.pathname + url.search + url.hash));
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [dirty, confirm, router]);
}
