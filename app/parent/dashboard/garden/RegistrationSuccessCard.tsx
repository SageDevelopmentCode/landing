"use client";


import Link from "next/link";
import type { ReactNode } from "react";
import GardenIsland from "@/app/_garden/GardenIsland";
import { Arrow, btnSageSm } from "@/app/parent/_garden/ui";

/** Garden "You're registered!" card for the registration-fee Stripe success route. */
export default function RegistrationSuccessCard({ amount, children }: { amount: string; children: ReactNode }) {
  return (
    <GardenIsland className="min-h-screen bg-[var(--sf-cream)] text-[var(--sf-ink)]">
      <main className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-6 py-20">
        <div className="relative w-full rounded-[32px] bg-white px-7 pb-8 pt-10 text-center shadow-[0_30px_60px_-35px_rgba(43,42,38,0.55)] ring-1 ring-[var(--sf-ink)]/[0.06]">
          <span
            className="absolute -top-3 left-1/2 h-6 w-24 -translate-x-1/2 -rotate-3 rounded-sm bg-[var(--sf-butter)]/90"
            aria-hidden="true"
          />
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--sf-mint)] text-3xl" aria-hidden="true">
            🌻
          </span>
          <h1 className="sf-display mt-5 text-4xl leading-tight">You&apos;re registered!</h1>
          {amount ? <p className="sf-display mt-4 text-2xl text-[var(--sf-coral-deep)]">{amount} received</p> : null}
          <div className="mt-4 text-sm font-semibold leading-relaxed text-[var(--sf-soft)]">{children}</div>
          {amount ? <p className="mt-2 text-sm font-semibold text-[var(--sf-soft)]">A receipt has been sent to your email.</p> : null}
          <Link href="/parent/dashboard" className={`${btnSageSm} mt-7 w-full`}>
            Back to Dashboard <Arrow />
          </Link>
        </div>
      </main>
    </GardenIsland>
  );
}
