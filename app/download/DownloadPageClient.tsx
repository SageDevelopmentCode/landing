"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import GardenIsland from "@/app/_garden/GardenIsland";
import { GardenToastProvider } from "@/app/_garden/toast";
import { SheetPortalProvider } from "@/app/parent/_garden/sheet";
import { Arrow } from "@/app/parent/_garden/ui";

const AndroidDownloadSheet = dynamic(() => import("../components/AndroidDownloadSheet"), { ssr: false });

const SLIDES = [
  "/assets/Stock1.jpg",
  "/assets/Stock2.jpg",
  "/assets/Stock3.jpg",
  "/assets/Stock4.jpg",
  "/assets/Stock5.jpg",
  "/assets/Stock6.jpg",
  "/assets/Stock7.jpg",
  "/assets/Stock8.jpg",
  "/assets/Stock9.jpg",
  "/assets/Stock10.jpg",
  "/assets/Stock11.jpg",
];

const badgeCls =
  "block rounded-[14px] transition-transform duration-200 hover:-translate-y-0.5 hover:scale-[1.02] focus-visible:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-sky)] active:translate-y-0 active:scale-[0.98] motion-reduce:transition-none cursor-pointer";

/** Public app download page in Garden: slideshow backdrop, store badges, Android beta dialog, Apply CTA. */
export default function DownloadPageClient() {
  const [current, setCurrent] = useState(0);
  const [androidSheetOpen, setAndroidSheetOpen] = useState(false);
  const [portalEl, setPortalEl] = useState<HTMLDivElement | null>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const t = setInterval(() => setCurrent((i) => (i + 1) % SLIDES.length), 6000);
    return () => clearInterval(t);
  }, []);

  return (
    <GardenIsland className="relative min-h-screen overflow-x-clip">
      <GardenToastProvider>
        <SheetPortalProvider value={portalEl}>
          <div className="relative flex min-h-screen flex-col items-center justify-center px-5 pb-36 pt-10">
            {/* Slideshow background */}
            <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
              <AnimatePresence mode="sync">
                <motion.div
                  key={current}
                  className="absolute inset-0"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: reduce ? 0 : 1 }}
                >
                  <Image src={SLIDES[current]} alt="" fill sizes="100vw" className="object-cover" priority={current === 0} />
                </motion.div>
              </AnimatePresence>
              <div className="absolute inset-0 bg-[var(--sf-ink)]/55" />
            </div>

            {/* Garden card */}
            <motion.main
              className="relative z-10 w-full max-w-sm"
              initial={reduce ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <div className="relative rounded-[36px] bg-[var(--sf-cream)] px-6 pb-7 pt-8 text-center text-[var(--sf-ink)] shadow-[0_30px_60px_-30px_rgba(0,0,0,0.7)]">
                <span
                  className="pointer-events-none absolute -right-3 -top-3 h-16 w-16 rotate-12 rounded-[18px] bg-[var(--sf-butter)]"
                  aria-hidden="true"
                />
                <span
                  className="pointer-events-none absolute -bottom-3 -left-3 h-12 w-12 -rotate-6 rounded-full bg-[var(--sf-mint)]"
                  aria-hidden="true"
                />
                <Link
                  href="/"
                  className="relative mx-auto mb-4 block h-20 w-20 rounded-[22px] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-sky)]"
                >
                  <Image src="/assets/Logo.png" alt="Sage Field Private School" fill sizes="80px" className="object-contain" priority />
                </Link>
                <h1 className="sf-display relative text-[1.9rem] leading-[1.05]">Sage Field Private Microschool</h1>
                <p className="sf-hand relative mt-1.5 text-xl leading-tight text-[var(--sf-sage-deep)]">Round Rock, TX · Ages 4–11</p>

                <div className="relative mt-6 rounded-[26px] border-2 border-dashed border-[var(--sf-ink)]/10 bg-white/70 px-4 pb-5 pt-4">
                  <h2 className="mb-3 text-sm font-extrabold text-[var(--sf-soft)]">Download the App</h2>
                  <div className="flex flex-col items-center gap-3">
                    <a href="https://apps.apple.com/us/app/sage-field/id6763985375" target="_blank" rel="noopener noreferrer" className={badgeCls}>
                      <Image src="/assets/AppStore.png" alt="Download on the App Store" width={200} height={60} className="shadow-[0_6px_0_0_rgba(43,42,38,0.18)] rounded-[12px]" />
                      <span className="sr-only"> (opens in a new tab)</span>
                    </a>
                    <button type="button" onClick={() => setAndroidSheetOpen(true)} className={badgeCls} aria-haspopup="dialog">
                      <Image src="/assets/GooglePlay.png" alt="Get it on Google Play" width={200} height={60} className="shadow-[0_6px_0_0_rgba(43,42,38,0.18)] rounded-[12px]" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.main>

            {/* Floating footer CTA */}
            <motion.aside
              aria-label="Apply"
              className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2"
              initial={reduce ? false : { y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.4, ease: "easeOut" }}
            >
              <div className="flex w-full items-center justify-between gap-3 rounded-[26px] bg-[var(--sf-ink)] px-5 py-3.5 text-[var(--sf-cream)] shadow-[0_20px_40px_-20px_rgba(0,0,0,0.8)] sm:max-w-sm">
                <div className="min-w-0">
                  <p className="sf-display text-lg leading-tight">Interested in Sage Field?</p>
                  <p className="text-xs font-bold text-[var(--sf-cream)]/75">Apply for a spot today</p>
                </div>
                <Link
                  href="/apply"
                  className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full bg-[var(--sf-butter)] px-4 text-sm font-extrabold text-[var(--sf-ink)] shadow-[0_4px_0_0_#c9a93a] transition hover:-translate-y-0.5 focus-visible:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-sky)] active:translate-y-0.5 active:shadow-[0_1px_0_0_#c9a93a]"
                >
                  Apply Now <Arrow />
                </Link>
              </div>
            </motion.aside>
          </div>

          <AndroidDownloadSheet isOpen={androidSheetOpen} onClose={() => setAndroidSheetOpen(false)} />
          <div ref={setPortalEl} />
        </SheetPortalProvider>
      </GardenToastProvider>
    </GardenIsland>
  );
}
