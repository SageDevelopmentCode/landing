"use client";

import { useState, useRef, useEffect } from "react";
import {
  signInWithEmail,
  signInWithMagicLink,
  signInWithGoogle,
} from "@/app/actions/auth";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft } from "lucide-react";

const slides = [
  "/assets/Hero.jpg",
  "/assets/ImageOne.jpg",
  "/assets/After1.png",
  "/assets/Interior.png",
  "/assets/After2.png",
  "/assets/ImageTwo.jpg",
];

export default function LoginPage() {
  const [authMode, setAuthMode] = useState<"password" | "magic-link">(
    "password",
  );
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

  async function handleEmailPasswordSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    setMessage(null);

    const result = await signInWithEmail(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  async function handleMagicLinkSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    setMessage(null);

    const result = await signInWithMagicLink(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else if (result?.message) {
      setMessage(result.message);
      setLoading(false);
    }
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

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-white overflow-hidden">
      {/* ── Left Form Panel ── */}
      <motion.div
        className="flex-1 flex flex-col items-center justify-center px-6 py-12 sm:px-12 bg-welcome-bg order-2 lg:order-1"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.6, ease: "easeOut" }}
      >
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <Image
              src="/assets/Logo.png"
              alt="Sagefield School Logo"
              width={64}
              height={64}
              priority
            />
          </div>

          <span className="inline-block px-4 py-1.5 bg-badge-bg text-black text-xs font-semibold rounded-full mb-4 font-body">
            Admin Access
          </span>
          <h1 className="text-3xl font-bold font-heading text-gray-800 mb-8">
            Welcome back
          </h1>

          {/* Error / Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-4 py-3 mb-6 rounded-xl text-sm font-body"
              style={{
                backgroundColor: "#F2C6C6",
                border: "1px solid #E6B7B2",
                color: "#A55858",
              }}
            >
              {error}
            </motion.div>
          )}

          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-4 py-3 mb-6 rounded-xl text-sm font-body"
              style={{
                backgroundColor: "#CDE8D0",
                border: "1px solid #BFD8C0",
                color: "#4A7C59",
              }}
            >
              {message}
            </motion.div>
          )}

          {/* Tab switcher */}
          <div
            className="flex gap-2 p-1.5 mb-6 rounded-xl"
            style={{ backgroundColor: "#F6F1E8" }}
          >
            <button
              type="button"
              onClick={() => setAuthMode("password")}
              className="flex-1 py-3 px-4 font-medium font-body transition-all duration-200 rounded-xl"
              style={{
                backgroundColor:
                  authMode === "password" ? "white" : "transparent",
                color: authMode === "password" ? "#5E7C68" : "#6B6B6B",
                boxShadow:
                  authMode === "password"
                    ? "0 2px 8px rgba(94, 124, 104, 0.08)"
                    : "none",
              }}
            >
              Password
            </button>
            <button
              type="button"
              onClick={() => setAuthMode("magic-link")}
              className="flex-1 py-3 px-4 font-medium font-body transition-all duration-200 rounded-xl"
              style={{
                backgroundColor:
                  authMode === "magic-link" ? "white" : "transparent",
                color: authMode === "magic-link" ? "#5E7C68" : "#6B6B6B",
                boxShadow:
                  authMode === "magic-link"
                    ? "0 2px 8px rgba(94, 124, 104, 0.08)"
                    : "none",
              }}
            >
              Magic Link
            </button>
          </div>

          {/* Forms */}
          <AnimatePresence mode="wait">
            {authMode === "password" ? (
              <motion.form
                key="password"
                action={handleEmailPasswordSubmit}
                className="flex flex-col gap-4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-semibold text-gray-700 font-body mb-1.5"
                  >
                    Email address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 font-body text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-semibold text-gray-700 font-body mb-1.5"
                  >
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    placeholder="Enter your password"
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 font-body text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:border-primary transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center items-center gap-2 py-4 px-4 bg-primary text-white font-semibold font-body rounded-lg hover:bg-primary-hover transition-colors duration-200 shadow-md hover:shadow-lg cursor-pointer mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading && <Spinner />}
                  {loading ? "Signing in..." : "Sign in with Email"}
                </button>
              </motion.form>
            ) : (
              <motion.form
                key="magic-link"
                action={handleMagicLinkSubmit}
                className="flex flex-col gap-4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
                <div>
                  <label
                    htmlFor="email-magic"
                    className="block text-sm font-semibold text-gray-700 font-body mb-1.5"
                  >
                    Email address
                  </label>
                  <input
                    id="email-magic"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 font-body text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:border-primary transition-colors"
                  />
                  <p className="mt-2 text-xs text-gray-400 font-body">
                    We&apos;ll send you a magic link to sign in without a
                    password
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center items-center gap-2 py-4 px-4 bg-primary text-white font-semibold font-body rounded-lg hover:bg-primary-hover transition-colors duration-200 shadow-md hover:shadow-lg cursor-pointer mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading && <Spinner />}
                  {loading ? "Sending..." : "Send Magic Link"}
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-welcome-bg text-gray-400 font-body">
                Or continue with
              </span>
            </div>
          </div>

          {/* Google */}
          <button
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
          </button>

          {/* Back to home */}
          <div className="text-center mt-8">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm font-medium font-body text-primary hover:text-primary-hover transition-colors"
            >
              <ArrowLeft size={14} />
              Back to home
            </Link>
          </div>
        </div>
      </motion.div>

      {/* ── Right Image Panel ── */}
      <motion.div
        className="relative lg:w-1/2 h-64 sm:h-80 lg:h-screen flex-shrink-0 overflow-hidden order-1 lg:order-2"
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        {/* Background slideshow */}
        <AnimatePresence mode="sync">
          <motion.img
            key={activeSlide}
            src={slides[activeSlide]}
            alt="Sage Field"
            className="absolute inset-0 w-full h-full object-cover"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          />
        </AnimatePresence>

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/50 via-black/20 to-black/10" />

        {/* Logo top-right */}
        <motion.div
          className="absolute top-6 right-6 z-20"
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
        <div className="hidden lg:flex absolute bottom-0 left-0 right-0 z-20 flex-col p-10 gap-6">
          <motion.span
            className="inline-block self-start px-4 py-1.5 bg-white/20 backdrop-blur-sm text-white text-xs font-semibold rounded-full"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            Enrolling Now
          </motion.span>

          <motion.h2
            className="text-3xl font-bold font-heading text-white leading-snug"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            A place where curiosity grows.
          </motion.h2>

          <motion.p
            className="text-white/75 font-body text-sm leading-relaxed max-w-xs"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65, duration: 0.5 }}
          >
            Small groups, rich learning, and a community built for homeschool
            families who want more.
          </motion.p>

          {/* Thumbnail row */}
          <motion.div
            className="flex items-center gap-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
          >
            {slides.map((src, i) => (
              <motion.button
                key={i}
                onClick={() => handleSelect(i)}
                whileHover={{ scale: 1.05 }}
                className={`w-12 h-12 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all ${
                  activeSlide === i
                    ? "scale-105 border-white/60"
                    : "opacity-60 border-white/30"
                }`}
              >
                <img
                  src={src}
                  alt="Sage Field"
                  className="w-full h-full object-cover"
                />
              </motion.button>
            ))}
          </motion.div>
        </div>
      </motion.div>
    </div>
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
