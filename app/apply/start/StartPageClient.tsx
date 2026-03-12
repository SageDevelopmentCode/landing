"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, User, LogIn, Eye, EyeOff } from "lucide-react";
import { signUpParent } from "@/app/actions/signUpParent";
import { loginParent } from "@/app/actions/loginParent";

type Mode = "choose" | "create" | "login";

const slides = [
  "/assets/Hero.jpg",
  "/assets/ImageOne.jpg",
  "/assets/After1.png",
  "/assets/Interior.png",
  "/assets/After2.png",
  "/assets/ImageTwo.jpg",
];

export default function StartPageClient() {
  const [mode, setMode] = useState<Mode>("choose");
  const [sharedEmail, setSharedEmail] = useState("");

  const handleSwitchToLogin = (email: string) => {
    setSharedEmail(email);
    setMode("login");
  };
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

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-white overflow-hidden">
      {/* ── Left Brand Panel ── */}
      <motion.div
        className="relative lg:w-1/2 h-64 sm:h-80 lg:h-screen flex-shrink-0 overflow-hidden"
        initial={{ opacity: 0, x: -40 }}
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
            Small groups, rich learning, and a private microschool built for
            families who want something better.
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

      {/* ── Right Auth Panel ── */}
      <motion.div
        className="flex-1 flex flex-col items-center justify-center px-6 py-12 sm:px-12 bg-welcome-bg"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.6, ease: "easeOut" }}
      >
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait">
            {mode === "choose" && <ChooseMode key="choose" setMode={setMode} />}
            {mode === "create" && <CreateMode key="create" setMode={setMode} onSwitchToLogin={handleSwitchToLogin} />}
            {mode === "login" && <LoginMode key={`login-${sharedEmail}`} setMode={setMode} defaultEmail={sharedEmail} />}
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
            <p className="font-semibold font-body text-gray-800">
              Create an account
            </p>
            <p className="text-sm text-gray-500 font-body">
              New to Sage Field? Start here.
            </p>
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
            <p className="font-semibold font-body text-gray-800">
              Log in to continue
            </p>
            <p className="text-sm text-gray-500 font-body">
              Already started? Pick up where you left off.
            </p>
          </div>
        </motion.button>
      </div>
    </motion.div>
  );
}

/* ── Mode: Create ── */
function CreateMode({ setMode, onSwitchToLogin }: {
  setMode: (m: Mode) => void
  onSwitchToLogin: (email: string) => void
}) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailExists, setEmailExists] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setEmailExists(false);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    const result = await signUpParent(fullName, email, password);
    if (result?.error === 'EMAIL_EXISTS') {
      setEmailExists(true);
      setLoading(false);
    } else if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else if (result?.redirectTo) {
      router.push(result.redirectTo);
    }
  };

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

      <form className="flex flex-col gap-4 mb-6" onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm font-semibold text-gray-700 font-body mb-1.5">
            Full Name
          </label>
          <input
            type="text"
            placeholder="Jane Smith"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-lg border border-gray-200 font-body text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:border-primary transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 font-body mb-1.5">
            Email
          </label>
          <input
            type="email"
            placeholder="jane@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-lg border border-gray-200 font-body text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:border-primary transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 font-body mb-1.5">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 pr-11 rounded-lg border border-gray-200 font-body text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:border-primary transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 font-body mb-1.5">
            Confirm Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-4 py-3 pr-11 rounded-lg border border-gray-200 font-body text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:border-primary transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {emailExists && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 flex flex-col gap-2">
            <p className="text-sm text-amber-800 font-body font-semibold">An account with this email already exists.</p>
            <button
              type="button"
              onClick={() => onSwitchToLogin(email)}
              className="self-start text-sm text-primary font-semibold font-body hover:underline cursor-pointer"
            >
              Log in instead →
            </button>
          </div>
        )}

        {error && (
          <p className="text-sm text-red-600 font-body">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full px-8 py-4 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-colors duration-200 shadow-md hover:shadow-lg font-body cursor-pointer mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Creating account…" : "Create Account & Begin Application"}
        </button>
      </form>

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
function LoginMode({ setMode, defaultEmail = "" }: { setMode: (m: Mode) => void; defaultEmail?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await loginParent(email, password);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else if (result?.redirectTo) {
      router.push(result.redirectTo);
    }
  };

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

      <form className="flex flex-col gap-4 mb-6" onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm font-semibold text-gray-700 font-body mb-1.5">
            Email
          </label>
          <input
            type="email"
            placeholder="jane@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-lg border border-gray-200 font-body text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:border-primary transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 font-body mb-1.5">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 pr-11 rounded-lg border border-gray-200 font-body text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:border-primary transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600 font-body">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full px-8 py-4 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-colors duration-200 shadow-md hover:shadow-lg font-body cursor-pointer mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Logging in…" : "Log In & View Application"}
        </button>
      </form>

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
