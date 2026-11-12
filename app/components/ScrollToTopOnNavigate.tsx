"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/** Resets window scroll on client-side route changes (pages without Lenis / GardenShell). */
export default function ScrollToTopOnNavigate() {
  const pathname = usePathname();
  const prevPathnameRef = useRef<string | null>(null);

  useEffect(() => {
    if (prevPathnameRef.current === null) {
      prevPathnameRef.current = pathname;
      return;
    }
    if (prevPathnameRef.current === pathname) return;
    prevPathnameRef.current = pathname;

    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
