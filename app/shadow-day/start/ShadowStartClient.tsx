"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { loginParent } from "@/app/actions/loginParent";
import {
  sendPasswordResetEmail,
  sendEmailOtp,
  sendSignupOtp,
  verifyEmailOtp,
} from "@/app/actions/auth";
import { verifyShadowDayOtp } from "@/app/actions/verifyShadowDayOtp";

type Mode = "create" | "login";

interface BookingData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  childName: string;
  childGrade: string;
  referralSource: string;
  notes: string;
  shadowDate: string;
}

const slides = [
  "/assets/Hero.jpg",
  "/assets/ImageOne.jpg",
  "/assets/After1.png",
  "/assets/Interior.png",
  "/assets/After2.png",
  "/assets/ImageTwo.jpg",
];

export default function ShadowStartClient({ initialData }: { initialData: BookingData }) {
  const [mode, setMode] = useState<Mode>("create");
  const [sharedEmail, setSharedEmail] = useState("");
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelect = (i: number) => {
    setActiveSlide(i);
    startInterval();
  };

  const handleSwitchToLogin = (email: string) => {
    setSharedEmail(email);
    setMode("login");
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-white overflow-hidden">
      {/* ── Left Brand Panel ── */}
      <motion.div
        className="relative lg:w-1/2 h-64 sm:h-80 lg:h-screen flex-shrink-0 overflow-hidden"
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" as const }}
      >
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
        <div className="absolute inset-0 bg-gradient-to-br from-black/50 via-black/20 to-black/10" />

        <motion.div
          className="absolute top-6 left-6 z-20"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <Link
            href="/shadow-tour"
            className="flex items-center gap-2 text-white/80 hover:text-white text-sm font-body transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Shadow Tour
          </Link>
        </motion.div>

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

        <div className="hidden lg:flex absolute bottom-0 left-0 right-0 z-20 flex-col p-10 gap-6">
          <motion.span
            className="inline-block self-start px-4 py-1.5 bg-white/20 backdrop-blur-sm text-white text-xs font-semibold rounded-full"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            Shadow Day Booking
          </motion.span>
          <motion.h2
            className="text-3xl font-bold font-heading text-white leading-snug"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            One day can change everything.
          </motion.h2>
          <motion.p
            className="text-white/75 font-body text-sm leading-relaxed max-w-xs"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65, duration: 0.5 }}
          >
            Create your account to hold your child&apos;s shadow day at Sage Field.
            Takes under a minute.
          </motion.p>
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
                <img src={src} alt="Sage Field" className="w-full h-full object-cover" />
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
        transition={{ delay: 0.35, duration: 0.6, ease: "easeOut" as const }}
      >
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait">
            {mode === "create" && (
              <CreateMode
                key="create"
                initialData={initialData}
                onSwitchToLogin={handleSwitchToLogin}
              />
            )}
            {mode === "login" && (
              <LoginMode
                key={`login-${sharedEmail}`}
                defaultEmail={sharedEmail}
                onSwitchToCreate={() => setMode("create")}
              />
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

/* ── Create Mode ── */
type CreateView = "otp-email" | "otp-code";

function CreateMode({
  initialData,
  onSwitchToLogin,
}: {
  initialData: BookingData;
  onSwitchToLogin: (email: string) => void;
}) {
  const router = useRouter();
  const [view, setView] = useState<CreateView>("otp-email");
  const [fullName, setFullName] = useState(
    [initialData.firstName, initialData.lastName].filter(Boolean).join(" "),
  );
  const [email, setEmail] = useState(initialData.email);
  const [otpEmail, setOtpEmail] = useState("");
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(6).fill(""));
  const otpRefs = useRef<(HTMLInputElement | null)[]>(Array(6).fill(null));
  const otpFormRef = useRef<HTMLFormElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleOtpChange(index: number, value: string) {
    if (value && !/^\d$/.test(value)) return;
    const next = [...otpDigits];
    next[index] = value;
    setOtpDigits(next);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }

  function handleOtpPaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const next = [...otpDigits];
    for (let i = 0; i < 6; i++) next[i] = pasted[i] || "";
    setOtpDigits(next);
    if (pasted.length === 6) setTimeout(() => otpFormRef.current?.requestSubmit(), 0);
    else otpRefs.current[Math.min(pasted.length, 5)]?.focus();
  }

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData();
    fd.set("email", email);
    const result = await sendSignupOtp(fd);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      setOtpEmail(email);
      setView("otp-code");
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpDigits.some((d) => !d)) {
      setError("Please enter all 6 digits");
      return;
    }
    setLoading(true);
    setError(null);
    const fd = new FormData();
    fd.set("email", otpEmail);
    fd.set("token", otpDigits.join(""));
    fd.set("fullName", fullName);
    fd.set("firstName", initialData.firstName);
    fd.set("lastName", initialData.lastName);
    fd.set("phone", initialData.phone);
    fd.set("childName", initialData.childName);
    fd.set("childGrade", initialData.childGrade);
    fd.set("referralSource", initialData.referralSource);
    fd.set("notes", initialData.notes);
    fd.set("shadowDate", initialData.shadowDate);
    const result = await verifyShadowDayOtp(fd);
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
      {view === "otp-code" && (
        <button
          onClick={() => {
            setView("otp-email");
            setOtpDigits(Array(6).fill(""));
            setError(null);
          }}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 font-body mb-6 cursor-pointer transition-colors"
        >
          <ArrowLeft size={14} />
          Back
        </button>
      )}

      <span className="inline-block px-4 py-1.5 bg-badge-bg text-black text-xs font-semibold rounded-full mb-4 font-body">
        Create Account
      </span>
      <h1 className="text-3xl font-bold font-heading text-gray-800 mb-8">
        {view === "otp-email" ? "Hold your shadow day spot" : "Check your inbox"}
      </h1>

      {error && (
        <p
          className="px-4 py-3 mb-6 rounded-xl text-sm font-body"
          style={{ backgroundColor: "#F2C6C6", border: "1px solid #E6B7B2", color: "#A55858" }}
        >
          {error}
        </p>
      )}

      {view === "otp-email" ? (
        <form className="flex flex-col gap-4 mb-6" onSubmit={handleSendOtp}>
          <p className="text-sm font-body text-gray-500 -mt-4">
            We&apos;ll send a 6-digit code to verify your email — no password needed.
          </p>
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
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center gap-2 px-8 py-4 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-colors duration-200 shadow-md hover:shadow-lg font-body cursor-pointer mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading && <Spinner />}
            {loading ? "Sending…" : "Send verification code"}
          </button>
        </form>
      ) : (
        <form ref={otpFormRef} className="flex flex-col gap-4 mb-6" onSubmit={handleVerifyOtp}>
          <p className="text-sm font-body text-gray-500 -mt-4">
            We sent a 6-digit code to{" "}
            <span className="font-semibold text-gray-700">{otpEmail}</span>.
            Check your inbox and enter it below.
          </p>
          <div>
            <label className="block text-sm font-semibold text-gray-700 font-body mb-3">
              Verification code
            </label>
            <div className="flex justify-center gap-2.5">
              {otpDigits.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { otpRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  autoComplete={i === 0 ? "one-time-code" : "off"}
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  onPaste={i === 0 ? handleOtpPaste : undefined}
                  className="w-11 h-13 text-center text-lg font-semibold font-body rounded-lg border border-gray-200 text-gray-800 outline-none focus:border-primary transition-colors"
                />
              ))}
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center gap-2 px-8 py-4 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-colors duration-200 shadow-md hover:shadow-lg font-body cursor-pointer mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading && <Spinner />}
            {loading ? "Verifying…" : "Verify & Hold My Spot"}
          </button>
        </form>
      )}

      <p className="text-sm text-center font-body text-gray-500">
        Already have an account?{" "}
        <button
          onClick={() => onSwitchToLogin(email)}
          className="text-primary hover:underline cursor-pointer font-semibold"
        >
          Log in
        </button>
      </p>
    </motion.div>
  );
}

/* ── Login Mode ── */
type LoginView = "otp-email" | "otp-code" | "password" | "forgot";

function LoginMode({
  defaultEmail = "",
  onSwitchToCreate,
}: {
  defaultEmail?: string;
  onSwitchToCreate: () => void;
}) {
  const router = useRouter();
  const [view, setView] = useState<LoginView>("otp-email");
  const [email, setEmail] = useState(defaultEmail);
  const [otpEmail, setOtpEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(6).fill(""));
  const otpRefs = useRef<(HTMLInputElement | null)[]>(Array(6).fill(null));
  const otpFormRef = useRef<HTMLFormElement | null>(null);

  function handleOtpChange(index: number, value: string) {
    if (value && !/^\d$/.test(value)) return;
    const next = [...otpDigits];
    next[index] = value;
    setOtpDigits(next);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }

  function handleOtpPaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const next = [...otpDigits];
    for (let i = 0; i < 6; i++) next[i] = pasted[i] || "";
    setOtpDigits(next);
    if (pasted.length === 6) setTimeout(() => otpFormRef.current?.requestSubmit(), 0);
    else otpRefs.current[Math.min(pasted.length, 5)]?.focus();
  }

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    const fd = new FormData();
    fd.set("email", email);
    const result = await sendEmailOtp(fd);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      setOtpEmail(email);
      setView("otp-code");
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpDigits.some((d) => !d)) {
      setError("Please enter all 6 digits");
      return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);
    const fd = new FormData();
    fd.set("email", otpEmail);
    fd.set("token", otpDigits.join(""));
    const result = await verifyEmailOtp(fd);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push("/shadow-day/dashboard");
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await loginParent(email, password);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push("/shadow-day/dashboard");
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    const result = await sendPasswordResetEmail(email);
    if (result?.error) setError(result.error);
    else if (result?.message) setMessage(result.message);
    setLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
    >
      <button
        onClick={onSwitchToCreate}
        className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 font-body mb-6 cursor-pointer transition-colors"
      >
        <ArrowLeft size={14} />
        Back
      </button>

      <span className="inline-block px-4 py-1.5 bg-badge-bg text-black text-xs font-semibold rounded-full mb-4 font-body">
        {view === "forgot" ? "Reset Password" : "Welcome Back"}
      </span>
      <h1 className="text-3xl font-bold font-heading text-gray-800 mb-8">
        {view === "otp-email" || view === "otp-code"
          ? "Log in to continue"
          : view === "password"
            ? "Sign in with password"
            : "Reset your password"}
      </h1>

      {error && (
        <p
          className="px-4 py-3 mb-6 rounded-xl text-sm font-body"
          style={{ backgroundColor: "#F2C6C6", border: "1px solid #E6B7B2", color: "#A55858" }}
        >
          {error}
        </p>
      )}
      {message && (
        <p
          className="px-4 py-3 mb-6 rounded-xl text-sm font-body"
          style={{ backgroundColor: "#CDE8D0", border: "1px solid #BFD8C0", color: "#4A7C59" }}
        >
          {message}
        </p>
      )}

      {view === "otp-email" ? (
        <form className="flex flex-col gap-4 mb-6" onSubmit={handleSendOtp}>
          <p className="text-sm font-body text-gray-500 -mt-4">
            Enter your email and we&apos;ll send a 6-digit code — no password needed.
          </p>
          <div>
            <label className="block text-sm font-semibold text-gray-700 font-body mb-1.5">
              Email address
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
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center gap-2 px-8 py-4 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-colors duration-200 shadow-md hover:shadow-lg font-body cursor-pointer mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading && <Spinner />}
            {loading ? "Sending…" : "Send code"}
          </button>
          <button
            type="button"
            onClick={() => { setView("password"); setError(null); setMessage(null); }}
            className="cursor-pointer text-xs font-body text-gray-400 hover:text-gray-600 transition-colors text-center"
          >
            Sign in with password instead
          </button>
        </form>
      ) : view === "otp-code" ? (
        <form ref={otpFormRef} className="flex flex-col gap-4 mb-6" onSubmit={handleVerifyOtp}>
          <p className="text-sm font-body text-gray-500 -mt-4">
            We sent a 6-digit code to{" "}
            <span className="font-semibold text-gray-700">{otpEmail}</span>.
          </p>
          <div>
            <label className="block text-sm font-semibold text-gray-700 font-body mb-3">
              Verification code
            </label>
            <div className="flex justify-center gap-2.5">
              {otpDigits.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { otpRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  autoComplete={i === 0 ? "one-time-code" : "off"}
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  onPaste={i === 0 ? handleOtpPaste : undefined}
                  className="w-11 h-13 text-center text-lg font-semibold font-body rounded-lg border border-gray-200 text-gray-800 outline-none focus:border-primary transition-colors"
                />
              ))}
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center gap-2 px-8 py-4 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-colors duration-200 shadow-md hover:shadow-lg font-body cursor-pointer mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading && <Spinner />}
            {loading ? "Verifying…" : "Verify & Save My Booking"}
          </button>
          <button
            type="button"
            onClick={() => { setView("otp-email"); setOtpDigits(Array(6).fill("")); setError(null); setMessage(null); }}
            className="inline-flex items-center gap-1.5 text-sm font-medium font-body text-primary hover:text-primary-hover transition-colors justify-center"
          >
            <ArrowLeft size={14} />
            Use a different email
          </button>
        </form>
      ) : view === "password" ? (
        <form className="flex flex-col gap-4 mb-6" onSubmit={handlePasswordLogin}>
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
            <button
              type="button"
              onClick={() => { setView("forgot"); setError(null); setMessage(null); }}
              className="cursor-pointer mt-1.5 text-xs font-body text-primary hover:text-primary-hover transition-colors"
            >
              Forgot password?
            </button>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full px-8 py-4 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-colors duration-200 shadow-md hover:shadow-lg font-body cursor-pointer mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Logging in…" : "Log In & Save Booking"}
          </button>
          <button
            type="button"
            onClick={() => { setView("otp-email"); setError(null); setMessage(null); }}
            className="cursor-pointer text-xs font-body text-gray-400 hover:text-gray-600 transition-colors text-center"
          >
            Sign in without password
          </button>
        </form>
      ) : (
        <form className="flex flex-col gap-4 mb-6" onSubmit={handleForgotSubmit}>
          <div>
            <label className="block text-sm font-semibold text-gray-700 font-body mb-1.5">
              Email address
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
          <button
            type="submit"
            disabled={loading}
            className="w-full px-8 py-4 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-colors duration-200 shadow-md hover:shadow-lg font-body cursor-pointer mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Sending…" : "Send reset link"}
          </button>
          <button
            type="button"
            onClick={() => { setView("otp-email"); setError(null); setMessage(null); }}
            className="inline-flex items-center gap-1.5 text-sm font-medium font-body text-primary hover:text-primary-hover transition-colors justify-center"
          >
            <ArrowLeft size={14} />
            Back to sign in
          </button>
        </form>
      )}

      {(view === "otp-email" || view === "password") && (
        <p className="text-sm text-center font-body text-gray-500">
          Don&apos;t have an account?{" "}
          <button
            onClick={onSwitchToCreate}
            className="text-primary hover:underline cursor-pointer font-semibold"
          >
            Create one
          </button>
        </p>
      )}
    </motion.div>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}
