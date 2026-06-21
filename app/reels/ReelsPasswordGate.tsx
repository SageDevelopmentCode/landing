"use client";

import { useActionState } from "react";
import { verifyReelsPassword } from "./actions";
import Image from "next/image";

export default function ReelsPasswordGate({
  bgVideoUrl,
}: {
  bgVideoUrl: string | null;
}) {
  const [state, formAction, isPending] = useActionState(
    verifyReelsPassword,
    undefined
  );

  return (
    <div className="relative h-screen w-full overflow-hidden bg-black flex items-center justify-center px-6">
      {bgVideoUrl && (
        <>
          <video
            src={bgVideoUrl}
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover blur-md scale-110"
          />
          <div className="absolute inset-0 bg-black/60" />
        </>
      )}
      <div className="relative z-10 w-full max-w-sm flex flex-col items-center gap-6">
        <Image
          src="/assets/Logo.png"
          alt="Sage Field"
          width={56}
          height={56}
          className="object-contain"
        />

        <div className="text-center">
          <h1 className="text-white font-heading font-bold text-2xl mb-1">
            Enter password
          </h1>
          <p className="text-white/50 text-sm font-body">
            This page is private.
          </p>
        </div>

        <form action={formAction} className="w-full flex flex-col gap-3">
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            autoFocus
            required
            placeholder="Password"
            className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 text-sm font-body outline-none focus:border-white/50 transition-colors"
          />

          {state?.error && (
            <p className="text-sm text-red-400 font-body text-center">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3 rounded-xl bg-[#4a7c59] text-white text-sm font-semibold font-body hover:bg-[#5e7c68] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isPending ? "Checking..." : "Enter"}
          </button>
        </form>
      </div>
    </div>
  );
}

