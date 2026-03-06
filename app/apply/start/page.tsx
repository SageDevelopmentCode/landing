"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, User, LogIn, CheckCircle } from "lucide-react";

type Mode = "choose" | "create" | "login";

const trustBullets = [
  "No payment required",
  "Takes < 10 mins",
  "Limited spots",
];

export default function StartPage() {
  const [mode, setMode] = useState<Mode>("choose");

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-white overflow-hidden">
      {/* ── Left Brand Panel ── */}
      <motion.div
        className="relative lg:w-1/2 h-64 sm:h-80 lg:h-screen flex-shrink-0 overflow-hidden"
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        {/* Background image */}
        <Image
          src="/assets/Hero.jpg"
          alt="Sage Field"
          fill
          className="object-cover"
          priority
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/30 to-black/10" />

        {/* Back link */}
        <motion.div
          className="absolute top-6 left-6 z-20"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <Link
            href="/apply"
            className="flex items-center gap-2 text-white/80 hover:text-white text-sm font-body transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Apply
          </Link>
        </motion.div>

        {/* Logo */}
        <motion.div
          className="absolute top-6 left-1/2 -translate-x-1/2 z-20"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <Image
            src="/assets/Logo.png"
            alt="Sage Field"
            width={120}
            height={48}
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
            {["/assets/ImageOne.jpg", "/assets/After1.png", "/assets/Interior.png"].map(
              (src, i) => (
                <div
                  key={i}
                  className="w-12 h-12 rounded-xl overflow-hidden border-2 border-white/30 flex-shrink-0"
                >
                  <img
                    src={src}
                    alt="Sage Field"
                    className="w-full h-full object-cover"
                  />
                </div>
              )
            )}
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">+8</span>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* ── Right Auth Panel ── */}
      <motion.div
        className="flex-1 flex flex-col items-center justify-center px-6 py-12 sm:px-12 bg-welcome-bg"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.6, ease: "easeOut" }}
      >
        {/* Step progress dots */}
        <div className="flex items-center gap-3 mb-10">
          {[0, 1, 2].map((step) => (
            <div key={step} className="flex flex-col items-center gap-1">
              <div
                className={`w-3 h-3 rounded-full transition-colors ${
                  step === 0 ? "bg-primary" : "bg-gray-200"
                }`}
              />
              <span className="text-[10px] text-gray-400 font-body">{step}</span>
            </div>
          ))}
        </div>

        <div className="w-full max-w-md">
          <AnimatePresence mode="wait">
            {mode === "choose" && (
              <ChooseMode key="choose" setMode={setMode} />
            )}
            {mode === "create" && (
              <CreateMode key="create" setMode={setMode} />
            )}
            {mode === "login" && (
              <LoginMode key="login" setMode={setMode} />
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

/* ── Mode: Choose ── */
function ChooseMode({ setMode }: { setMode: (m: Mode) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
    >
      <span className="inline-block px-4 py-1.5 bg-badge-bg text-black text-xs font-semibold rounded-full mb-4 font-body">
        Get Started
      </span>
      <h1 className="text-3xl font-bold font-heading text-gray-800 mb-8">
        Begin your application
      </h1>

      <div className="flex flex-col gap-4 mb-10">
        <motion.button
          onClick={() => setMode("create")}
          whileHover={{ y: -2 }}
          className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-gray-200 shadow-sm hover:border-primary hover:shadow-md transition-all cursor-pointer text-left"
        >
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <User size={20} className="text-primary" />
          </div>
          <div>
            <p className="font-semibold font-body text-gray-800">Create an account</p>
            <p className="text-sm text-gray-500 font-body">New to Sage Field? Start here.</p>
          </div>
        </motion.button>

        <motion.button
          onClick={() => setMode("login")}
          whileHover={{ y: -2 }}
          className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-gray-200 shadow-sm hover:border-primary hover:shadow-md transition-all cursor-pointer text-left"
        >
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <LogIn size={20} className="text-primary" />
          </div>
          <div>
            <p className="font-semibold font-body text-gray-800">Log in to continue</p>
            <p className="text-sm text-gray-500 font-body">Already started? Pick up where you left off.</p>
          </div>
        </motion.button>
      </div>

      <div className="flex flex-col gap-2">
        {trustBullets.map((bullet, i) => (
          <motion.div
            key={bullet}
            className="flex items-center gap-2 text-sm text-gray-500 font-body"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 + i * 0.1, duration: 0.4 }}
          >
            <CheckCircle size={14} className="text-primary flex-shrink-0" />
            {bullet}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

/* ── Mode: Create ── */
function CreateMode({ setMode }: { setMode: (m: Mode) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
    >
      <button
        onClick={() => setMode("choose")}
        className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 font-body mb-6 cursor-pointer transition-colors"
      >
        <ArrowLeft size={14} />
        Back
      </button>

      <span className="inline-block px-4 py-1.5 bg-badge-bg text-black text-xs font-semibold rounded-full mb-4 font-body">
        Create Account
      </span>
      <h1 className="text-3xl font-bold font-heading text-gray-800 mb-8">
        Let&apos;s get you set up
      </h1>

      <form className="flex flex-col gap-4 mb-6" onSubmit={(e) => e.preventDefault()}>
        <div>
          <label className="block text-sm font-semibold text-gray-700 font-body mb-1.5">
            Full Name
          </label>
          <input
            type="text"
            placeholder="Jane Smith"
            className="w-full px-4 py-3 rounded-lg border border-gray-200 font-body text-sm outline-none focus:border-primary transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 font-body mb-1.5">
            Email
          </label>
          <input
            type="email"
            placeholder="jane@example.com"
            className="w-full px-4 py-3 rounded-lg border border-gray-200 font-body text-sm outline-none focus:border-primary transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 font-body mb-1.5">
            Password
          </label>
          <input
            type="password"
            placeholder="••••••••"
            className="w-full px-4 py-3 rounded-lg border border-gray-200 font-body text-sm outline-none focus:border-primary transition-colors"
          />
        </div>

        <button
          type="button"
          onClick={() => {}}
          className="w-full px-8 py-4 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-colors duration-200 shadow-md hover:shadow-lg font-body cursor-pointer mt-2"
        >
          Create Account &amp; Begin Application
        </button>
      </form>

      <p className="text-xs text-gray-400 font-body text-center mb-4">
        Account creation coming soon — we&apos;ll notify you when ready.
      </p>

      <p className="text-sm text-center font-body text-gray-500">
        Already have an account?{" "}
        <button
          onClick={() => setMode("login")}
          className="text-primary hover:underline cursor-pointer font-semibold"
        >
          Log in
        </button>
      </p>
    </motion.div>
  );
}

/* ── Mode: Login ── */
function LoginMode({ setMode }: { setMode: (m: Mode) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
    >
      <button
        onClick={() => setMode("choose")}
        className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 font-body mb-6 cursor-pointer transition-colors"
      >
        <ArrowLeft size={14} />
        Back
      </button>

      <span className="inline-block px-4 py-1.5 bg-badge-bg text-black text-xs font-semibold rounded-full mb-4 font-body">
        Welcome Back
      </span>
      <h1 className="text-3xl font-bold font-heading text-gray-800 mb-8">
        Continue your application
      </h1>

      <form className="flex flex-col gap-4 mb-6" onSubmit={(e) => e.preventDefault()}>
        <div>
          <label className="block text-sm font-semibold text-gray-700 font-body mb-1.5">
            Email
          </label>
          <input
            type="email"
            placeholder="jane@example.com"
            className="w-full px-4 py-3 rounded-lg border border-gray-200 font-body text-sm outline-none focus:border-primary transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 font-body mb-1.5">
            Password
          </label>
          <input
            type="password"
            placeholder="••••••••"
            className="w-full px-4 py-3 rounded-lg border border-gray-200 font-body text-sm outline-none focus:border-primary transition-colors"
          />
        </div>

        <button
          type="button"
          onClick={() => {}}
          className="w-full px-8 py-4 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-colors duration-200 shadow-md hover:shadow-lg font-body cursor-pointer mt-2"
        >
          Log In &amp; View Application
        </button>
      </form>

      <p className="text-xs text-gray-400 font-body text-center mb-4">
        Login portal coming soon — we&apos;ll notify you when ready.
      </p>

      <p className="text-sm text-center font-body text-gray-500">
        Don&apos;t have an account?{" "}
        <button
          onClick={() => setMode("create")}
          className="text-primary hover:underline cursor-pointer font-semibold"
        >
          Create one
        </button>
      </p>
    </motion.div>
  );
}
