"use client";

import { useState } from "react";
import {
  signInWithEmail,
  signInWithMagicLink,
  signInWithGoogle,
} from "@/app/actions/auth";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Merriweather } from "next/font/google";

const merriweather = Merriweather({
  weight: ["300", "400", "700", "900"],
  subsets: ["latin"],
});

export default function LoginPage() {
  const [authMode, setAuthMode] = useState<"password" | "magic-link">(
    "password",
  );
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{
        background: `linear-gradient(135deg, #FBFAF7 0%, #F6F1E8 50%, #E8DFD0 100%)`,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="max-w-md w-full space-y-8 bg-white p-8"
        style={{
          borderRadius: "16px",
          boxShadow: "0 8px 24px rgba(94, 124, 104, 0.15)",
          border: "1px solid #E8E4DF",
        }}
      >
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <Image
              src="/assets/Logo.png"
              alt="Sagefield School Logo"
              width={64}
              height={64}
              priority
            />
          </div>
          <h2
            className={`text-3xl font-bold ${merriweather.className}`}
            style={{ color: "#5E7C68" }}
          >
            Sign In
          </h2>
          <p className="mt-2 text-sm" style={{ color: "#6B6B6B" }}>
            Access your Sagefield School account
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-4 py-3"
            style={{
              backgroundColor: "#F2C6C6",
              border: "1px solid #E6B7B2",
              color: "#A55858",
              borderRadius: "12px",
            }}
          >
            {error}
          </motion.div>
        )}

        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-4 py-3"
            style={{
              backgroundColor: "#CDE8D0",
              border: "1px solid #BFD8C0",
              color: "#4A7C59",
              borderRadius: "12px",
            }}
          >
            {message}
          </motion.div>
        )}

        <div
          className="flex gap-2 p-1.5"
          style={{
            backgroundColor: "#F6F1E8",
            borderRadius: "12px",
          }}
        >
          <motion.button
            type="button"
            onClick={() => setAuthMode("password")}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 py-3 px-4 font-medium transition-all duration-200"
            style={{
              backgroundColor:
                authMode === "password" ? "white" : "transparent",
              color: authMode === "password" ? "#5E7C68" : "#6B6B6B",
              borderRadius: "12px",
              boxShadow:
                authMode === "password"
                  ? "0 2px 8px rgba(94, 124, 104, 0.08)"
                  : "none",
            }}
          >
            Password
          </motion.button>
          <motion.button
            type="button"
            onClick={() => setAuthMode("magic-link")}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 py-3 px-4 font-medium transition-all duration-200"
            style={{
              backgroundColor:
                authMode === "magic-link" ? "white" : "transparent",
              color: authMode === "magic-link" ? "#5E7C68" : "#6B6B6B",
              borderRadius: "12px",
              boxShadow:
                authMode === "magic-link"
                  ? "0 2px 8px rgba(94, 124, 104, 0.08)"
                  : "none",
            }}
          >
            Magic Link
          </motion.button>
        </div>

        {authMode === "password" ? (
          <form action={handleEmailPasswordSubmit} className="mt-8 space-y-6">
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium mb-2"
                  style={{ color: "#3D3D3D" }}
                >
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="block w-full px-4 py-3 shadow-sm focus:outline-none transition-all duration-200"
                  style={{
                    border: "1px solid #E8E4DF",
                    borderRadius: "12px",
                    color: "#3D3D3D",
                  }}
                  placeholder="you@example.com"
                  onFocus={(e) => (e.target.style.border = "1px solid #BFD8C0")}
                  onBlur={(e) => (e.target.style.border = "1px solid #E8E4DF")}
                />
              </div>
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium mb-2"
                  style={{ color: "#3D3D3D" }}
                >
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="block w-full px-4 py-3 shadow-sm focus:outline-none transition-all duration-200"
                  style={{
                    border: "1px solid #E8E4DF",
                    borderRadius: "12px",
                    color: "#3D3D3D",
                  }}
                  placeholder="Enter your password"
                  onFocus={(e) => (e.target.style.border = "1px solid #BFD8C0")}
                  onBlur={(e) => (e.target.style.border = "1px solid #E8E4DF")}
                />
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              className="w-full flex justify-center py-4 px-4 text-base font-medium text-white focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              style={{
                backgroundColor: "#5E7C68",
                borderRadius: "16px",
                boxShadow: "0 2px 8px rgba(94, 124, 104, 0.15)",
                border: "none",
              }}
            >
              {loading ? "Signing in..." : "Sign in with Email"}
            </motion.button>
          </form>
        ) : (
          <form action={handleMagicLinkSubmit} className="mt-8 space-y-6">
            <div>
              <label
                htmlFor="email-magic"
                className="block text-sm font-medium mb-2"
                style={{ color: "#3D3D3D" }}
              >
                Email address
              </label>
              <input
                id="email-magic"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="block w-full px-4 py-3 shadow-sm focus:outline-none transition-all duration-200"
                style={{
                  border: "1px solid #E8E4DF",
                  borderRadius: "12px",
                  color: "#3D3D3D",
                }}
                placeholder="you@example.com"
                onFocus={(e) => (e.target.style.border = "1px solid #BFD8C0")}
                onBlur={(e) => (e.target.style.border = "1px solid #E8E4DF")}
              />
              <p className="mt-2 text-xs" style={{ color: "#9B9B9B" }}>
                We&apos;ll send you a magic link to sign in without a password
              </p>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              className="w-full flex justify-center py-4 px-4 text-base font-medium text-white focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              style={{
                backgroundColor: "#5E7C68",
                borderRadius: "16px",
                boxShadow: "0 2px 8px rgba(94, 124, 104, 0.15)",
                border: "none",
              }}
            >
              {loading ? "Sending..." : "Send Magic Link"}
            </motion.button>
          </form>
        )}

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div
                className="w-full"
                style={{ borderTop: `1px solid #E8E4DF` }}
              />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white" style={{ color: "#9B9B9B" }}>
                Or continue with
              </span>
            </div>
          </div>

          <div className="mt-6">
            <motion.button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              className="w-full flex items-center justify-center gap-3 py-4 px-4 bg-white text-base font-medium focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              style={{
                border: "1px solid #E8E4DF",
                borderRadius: "16px",
                color: "#3D3D3D",
                boxShadow: "0 2px 8px rgba(94, 124, 104, 0.08)",
              }}
            >
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
              {loading ? "Connecting..." : "Sign in with Google"}
            </motion.button>
          </div>
        </div>

        <div className="text-center mt-4">
          <Link
            href="/"
            className="text-sm font-medium transition-colors duration-200"
            style={{ color: "#5E7C68" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#4A6654")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#5E7C68")}
          >
            Back to home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
