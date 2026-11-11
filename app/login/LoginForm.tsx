"use client";

import { useState, useRef, useEffect } from "react";
import {
  signInWithEmail,
  signInWithGoogle,
  sendPasswordResetEmail,
  sendEmailOtp,
  verifyEmailOtp,
} from "@/app/actions/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence, MotionConfig } from "framer-motion";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { btnPop, Pill, Draw, Squiggle, Sun } from "@/app/_garden/ui";

const slides = [
  "/assets/Hero.jpg",
  "/assets/ImageOne.jpg",
  "/assets/Stock1.jpg",
  "/assets/Stock3.jpg",
  "/assets/Stock4.jpg",
  "/assets/ImageTwo.jpg",
];

/* Garden form styles */
const labelCls = "mb-2 block text-sm font-extrabold text-[var(--sf-ink)]";
const inputCls =
  "w-full rounded-2xl border-2 border-[var(--sf-ink)]/15 bg-white px-4 py-3.5 text-base text-[var(--sf-ink)] placeholder:text-[var(--sf-ink)]/40 transition focus:border-[var(--sf-sage)] focus:outline-none focus:ring-4 focus:ring-[var(--sf-mint)]";
const submitCls = `${btnPop} mt-2 w-full disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0`;
const quietLinkCls =
  "cursor-pointer self-center rounded-full px-3 py-1 text-sm font-bold text-[var(--sf-soft)] underline decoration-[var(--sf-ink)]/20 decoration-2 underline-offset-4 transition-colors hover:text-[var(--sf-ink)] hover:decoration-[var(--sf-coral)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-coral)]/30";
const coralLinkCls =
  "inline-flex cursor-pointer items-center justify-center gap-1.5 self-center rounded-full px-3 py-1 text-sm font-extrabold text-[var(--sf-coral-deep)] transition-colors hover:text-[var(--sf-ink)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-coral)]/30";

/* Thumbnail polaroids: small tilts + washi tape colours */
const THUMB_TILT = [-4, 3, -2, 4, -3, 2];
const TAPE = [
  "bg-[var(--sf-butter)]/90",
  "bg-[var(--sf-mint)]/90",
  "bg-[var(--sf-sky)]/90",
  "bg-[var(--sf-peach)]/90",
  "bg-[var(--sf-lav)]/90",
  "bg-[var(--sf-coral)]/60",
];

export default function LoginForm() {
  const router = useRouter();
  const [view, setView] = useState<
    "otp-email" | "otp-code" | "login" | "forgot"
  >("otp-email");
  const [otpEmail, setOtpEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(6).fill(""));
  const otpRefs = useRef<(HTMLInputElement | null)[]>(Array(6).fill(null));
  const otpFormRef = useRef<HTMLFormElement | null>(null);

  function handleOtpChange(index: number, value: string) {
    if (value && !/^\d$/.test(value)) return;
    const next = [...otpDigits];
    next[index] = value;
    setOtpDigits(next);
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  }

  function handleOtpKeyDown(
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }

  function handleOtpPaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (!pasted) return;
    const next = [...otpDigits];
    for (let i = 0; i < 6; i++) {
      next[i] = pasted[i] || "";
    }
    setOtpDigits(next);
    if (pasted.length === 6) {
      setTimeout(() => otpFormRef.current?.requestSubmit(), 0);
    } else {
      const focusIndex = Math.min(pasted.length, 5);
      otpRefs.current[focusIndex]?.focus();
    }
  }

  const [activeSlide, setActiveSlide] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startInterval = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 7000);
  };

  useEffect(() => {
    startInterval();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const handleSelect = (i: number) => {
    setActiveSlide(i);
    startInterval();
  };

  async function handleEmailPasswordSubmit(
    e: React.FormEvent<HTMLFormElement>,
  ) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    const formData = new FormData(e.currentTarget);
    const result = await signInWithEmail(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else if (result?.redirectTo) {
      router.push(result.redirectTo);
    }
  }

  async function handleForgotPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    const formData = new FormData(e.currentTarget);
    const email = formData.get("reset-email") as string;
    const result = await sendPasswordResetEmail(email);
    if (result?.error) {
      setError(result.error);
    } else if (result?.message) {
      setMessage(result.message);
    }
    setLoading(false);
  }

  async function handleGoogleSignIn() {
    setLoading(true);
    setError(null);
    setMessage(null);

    const result = await signInWithGoogle();

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  async function handleSendOtp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const result = await sendEmailOtp(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      setOtpEmail(email);
      setView("otp-code");
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (otpDigits.some((d) => !d)) {
      setError("Please enter all 6 digits");
      return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);
    const formData = new FormData(e.currentTarget);
    const result = await verifyEmailOtp(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else if (result?.redirectTo) {
      router.push(result.redirectTo);
    }
  }

  if (loading && view !== "otp-email" && view !== "otp-code") {
    return (
      <div className="min-h-screen bg-[var(--sf-cream)] flex items-center justify-center">
        <Image
          src="/assets/Logo.png"
          alt="Sage Field"
          width={80}
          height={80}
          className="object-contain animate-pulse"
        />
      </div>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex min-h-screen flex-col overflow-x-clip bg-[var(--sf-cream)] lg:flex-row">
        {/* ── Left Form Panel ── */}
        <motion.div
          className="relative order-2 flex flex-1 flex-col items-center justify-center bg-[var(--sf-cream)] px-6 py-12 sm:px-12 lg:order-1 lg:py-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.6, ease: "easeOut" as const }}
        >
          <Draw className="pointer-events-none absolute left-8 top-8 hidden w-16 lg:block xl:left-12 xl:top-10">
            <Sun className="w-full" />
          </Draw>

          <div className="relative w-full max-w-md">
            {/* Logo */}
            <div className="mb-8 flex justify-center">
              <Image
                src="/assets/Logo.png"
                alt="Sage Field School Logo"
                width={64}
                height={64}
                preload
              />
            </div>
            <h1 className="sf-display text-4xl leading-[1.05] text-[var(--sf-ink)] sm:text-5xl">
              {view === "otp-email" || view === "otp-code"
                ? "Welcome back"
                : view === "login"
                  ? "Sign in with password"
                  : "Reset your password"}
            </h1>
            <Draw className="mb-8 mt-2 block w-40">
              <Squiggle className="h-4 w-full" />
            </Draw>
            {/* Error / Message */}
            {error && (
              <motion.div
                role="alert"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 rounded-2xl border-2 border-[var(--sf-coral)]/50 bg-[var(--sf-coral)]/15 px-4 py-3 text-sm font-bold text-[var(--sf-ink)]"
              >
                {error}
              </motion.div>
            )}
            {message && (
              <motion.div
                role="status"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 rounded-2xl border-2 border-[var(--sf-sage)]/30 bg-[var(--sf-mint)] px-4 py-3 text-sm font-bold text-[var(--sf-sage-deep)]"
              >
                {message}
              </motion.div>
            )}
            {view === "otp-email" ? (
              /* ── OTP: enter email ── */
              <form onSubmit={handleSendOtp} className="flex flex-col gap-5">
                <p className="-mt-3 text-base leading-relaxed text-[var(--sf-soft)]">
                  Enter your email and we&apos;ll send a 6-digit code — no
                  password needed.
                </p>
                <div>
                  <label htmlFor="otp-email" className={labelCls}>
                    Email address
                  </label>
                  <input
                    id="otp-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="you@example.com"
                    className={inputCls}
                  />
                </div>

                <button type="submit" disabled={loading} className={submitCls}>
                  {loading && <Spinner />}
                  {loading ? "Sending..." : "Send code"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setView("login");
                    setError(null);
                    setMessage(null);
                  }}
                  className={quietLinkCls}
                >
                  Sign in with password instead
                </button>
              </form>
            ) : view === "otp-code" ? (
              /* ── OTP: enter code ── */
              <form
                ref={otpFormRef}
                onSubmit={handleVerifyOtp}
                className="flex flex-col gap-5"
              >
                <p className="-mt-3 text-base leading-relaxed text-[var(--sf-soft)]">
                  We sent a 6-digit code to{" "}
                  <span className="font-extrabold text-[var(--sf-ink)] bg-[linear-gradient(transparent_60%,var(--sf-butter)_60%)] break-all">
                    {otpEmail}
                  </span>
                  . Check your inbox and enter it below.
                </p>
                <input type="hidden" name="email" value={otpEmail} />
                <input type="hidden" name="token" value={otpDigits.join("")} />
                <div>
                  <label className={`${labelCls} mb-3`}>Verification code</label>
                  <div className="flex justify-center gap-2 sm:gap-2.5">
                    {otpDigits.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => {
                          otpRefs.current[i] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        autoComplete={i === 0 ? "one-time-code" : "off"}
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        onPaste={i === 0 ? handleOtpPaste : undefined}
                        className={`sf-display h-14 w-11 rounded-2xl border-2 text-center text-2xl text-[var(--sf-ink)] shadow-[0_4px_0_0_rgba(43,42,38,0.08)] transition focus:border-[var(--sf-sage)] focus:outline-none focus:ring-4 focus:ring-[var(--sf-mint)] sm:h-16 sm:w-13 ${
                          digit
                            ? "border-[var(--sf-sage)]/60 bg-[var(--sf-mint)]/50"
                            : "border-[var(--sf-ink)]/15 bg-white"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <button type="submit" disabled={loading} className={submitCls}>
                  {loading && <Spinner />}
                  {loading ? "Verifying..." : "Verify code"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setView("otp-email");
                    setOtpDigits(Array(6).fill(""));
                    setError(null);
                    setMessage(null);
                  }}
                  className={coralLinkCls}
                >
                  <ArrowLeft size={14} />
                  Use a different email
                </button>
              </form>
            ) : view === "login" ? (
              /* ── Password login form ── */
              <form
                onSubmit={handleEmailPasswordSubmit}
                className="flex flex-col gap-5"
              >
                <div>
                  <label htmlFor="email" className={labelCls}>
                    Email address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="you@example.com"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label htmlFor="password" className={labelCls}>
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      placeholder="Enter your password"
                      className={`${inputCls} pr-14`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-[var(--sf-soft)] transition-colors hover:bg-[var(--sf-mint)]/60 hover:text-[var(--sf-sage-deep)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-mint)]"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setView("forgot");
                      setError(null);
                      setMessage(null);
                    }}
                    className="mt-2 cursor-pointer rounded-full text-sm font-extrabold text-[var(--sf-coral-deep)] transition-colors hover:text-[var(--sf-ink)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-coral)]/30"
                  >
                    Forgot password?
                  </button>
                </div>

                <button type="submit" disabled={loading} className={submitCls}>
                  {loading && <Spinner />}
                  {loading ? "Signing in..." : "Sign in"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setView("otp-email");
                    setError(null);
                    setMessage(null);
                  }}
                  className={quietLinkCls}
                >
                  Sign in without password
                </button>
              </form>
            ) : (
              /* ── Forgot password form ── */
              <form
                onSubmit={handleForgotPassword}
                className="flex flex-col gap-5"
              >
                <div>
                  <label htmlFor="reset-email" className={labelCls}>
                    Email address
                  </label>
                  <input
                    id="reset-email"
                    name="reset-email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="you@example.com"
                    className={inputCls}
                  />
                </div>

                <button type="submit" disabled={loading} className={submitCls}>
                  {loading && <Spinner />}
                  {loading ? "Sending..." : "Send reset link"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setView("login");
                    setError(null);
                    setMessage(null);
                  }}
                  className={coralLinkCls}
                >
                  <ArrowLeft size={14} />
                  Back to sign in
                </button>
              </form>
            )}
            {/* Divider
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-welcome-bg text-gray-400 font-body">
                  Or continue with
                </span>
              </div>
            </div> */}
            {/* Google */}
            {/* <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-4 px-4 bg-white font-medium font-body text-gray-700 rounded-lg border border-gray-200 hover:border-primary transition-colors duration-200 shadow-sm hover:shadow-md cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Spinner />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    className="text-blue-500"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    className="text-green-500"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    className="text-yellow-500"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    className="text-red-500"
                  />
                </svg>
              )}
              {loading ? "Connecting..." : "Sign in with Google"}
            </button> */}
            {/* Back to home */}
            {(view === "otp-email" || view === "login") && (
              <div className="mt-8 text-center">
                <Link href="/" className={coralLinkCls}>
                  <ArrowLeft size={14} />
                  Back to home
                </Link>
              </div>
            )}
          </div>
        </motion.div>

        {/* ── Right Image Panel ── */}
        <motion.div
          className="relative order-1 h-64 flex-shrink-0 sm:h-80 lg:order-2 lg:sticky lg:top-0 lg:h-screen lg:w-1/2 lg:p-4"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" as const }}
        >
          <div className="relative h-full w-full overflow-hidden rounded-b-[40px] bg-[var(--sf-ink)] lg:rounded-[40px]">
            {/* Background slideshow */}
            <AnimatePresence mode="sync">
              <motion.div
                key={activeSlide}
                className="absolute inset-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8 }}
              >
                <Image
                  src={slides[activeSlide]}
                  alt="Sage Field"
                  fill
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-cover"
                  preload={activeSlide === 0}
                />
              </motion.div>
            </AnimatePresence>

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/10" />

            {/* Logo top-right */}
            <motion.div
              className="absolute right-6 top-6 z-20"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <Image
                src="/assets/Logo.png"
                alt="Sage Field"
                width={80}
                height={32}
                className="object-contain"
              />
            </motion.div>

            {/* Bottom content — hidden on mobile */}
            <div className="absolute bottom-0 left-0 right-0 z-20 hidden flex-col gap-5 p-10 lg:flex xl:p-12">
              <motion.div
                className="self-start"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                <Pill tint="butter" className="-rotate-2 shadow-[0_4px_0_0_rgba(0,0,0,0.15)]">
                  Enrolling Now
                </Pill>
              </motion.div>

              <motion.h2
                className="sf-display max-w-lg text-4xl leading-[1.05] text-white xl:text-5xl"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
              >
                A place where curiosity grows.
              </motion.h2>

              <motion.p
                className="max-w-sm text-base leading-relaxed text-white/85"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.65, duration: 0.5 }}
              >
                Small groups, rich learning, and a private microschool built for
                families who want something better.
              </motion.p>

              {/* Thumbnail row */}
              <motion.div
                className="mt-2 flex flex-wrap items-center gap-3 pt-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.5 }}
              >
                {slides.map((src, i) => {
                  const active = activeSlide === i;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSelect(i)}
                      aria-pressed={active}
                      style={{ rotate: active ? "0deg" : `${THUMB_TILT[i]}deg` }}
                      className={`relative flex-shrink-0 cursor-pointer rounded-[6px] bg-white p-1.5 pb-2.5 shadow-[0_10px_24px_-12px_rgba(0,0,0,0.6)] transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:!rotate-0 hover:-translate-y-1 focus-visible:!rotate-0 focus-visible:-translate-y-1 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-butter)] focus-visible:ring-offset-2 focus-visible:ring-offset-black/40 ${
                        active ? "-translate-y-1.5 scale-105" : "opacity-75 hover:opacity-100"
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none absolute -top-2 left-1/2 h-3.5 w-9 -translate-x-1/2 -rotate-6 rounded-[2px] ${TAPE[i % TAPE.length]}`}
                      />
                      <Image
                        src={src}
                        alt="Sage Field"
                        width={96}
                        height={96}
                        sizes="48px"
                        className="h-12 w-12 rounded-[3px] object-cover"
                      />
                    </button>
                  );
                })}
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </MotionConfig>
  );
}

function Spinner() {
  return (
    <svg
      className="animate-spin h-5 w-5"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}
