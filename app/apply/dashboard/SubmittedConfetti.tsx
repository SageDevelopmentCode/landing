"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import confetti from "canvas-confetti";

export default function SubmittedConfetti() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (searchParams.get("submitted") !== "true") return;

    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.5 },
      colors: ["#2C5F2E", "#7FA888", "#D4E6D0", "#F5F9F5", "#ffffff"],
      scalar: 1.1,
    });

    const params = new URLSearchParams(searchParams.toString());
    params.delete("submitted");
    const newUrl = params.size > 0 ? `${pathname}?${params}` : pathname;
    router.replace(newUrl, { scroll: false });
  }, [searchParams, router, pathname]);

  return null;
}
