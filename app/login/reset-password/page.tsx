"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { updatePassword } from "@/app/actions/auth";
import { Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const password = formData.get("password") as string;
    const confirm = formData.get("confirm") as string;

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    const result = await updatePassword(password);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push("/login");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-welcome-bg flex items-center justify-center">
        <img
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
    <div className="min-h-screen bg-welcome-bg flex flex-col items-center justify-center px-6 py-12">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" as const }}
      >
        <div className="flex justify-center mb-8">
          <Image
            src="/assets/Logo.png"
            alt="Sage Field School Logo"
            width={64}
            height={64}
            priority
          />
        </div>

        <h1 className="text-3xl font-bold font-heading text-gray-800 mb-8">
          Set new password
        </h1>

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

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-semibold text-gray-700 font-body mb-1.5"
            >
              New password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                placeholder="Enter new password"
                className="w-full px-4 py-3 pr-11 rounded-lg border border-gray-200 font-body text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:border-primary transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="confirm"
              className="block text-sm font-semibold text-gray-700 font-body mb-1.5"
            >
              Confirm password
            </label>
            <div className="relative">
              <input
                id="confirm"
                name="confirm"
                type={showConfirm ? "text" : "password"}
                autoComplete="new-password"
                required
                placeholder="Confirm new password"
                className="w-full px-4 py-3 pr-11 rounded-lg border border-gray-200 font-body text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:border-primary transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label={showConfirm ? "Hide password" : "Show password"}
              >
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center gap-2 py-4 px-4 bg-primary text-white font-semibold font-body rounded-lg hover:bg-primary-hover transition-colors duration-200 shadow-md hover:shadow-lg cursor-pointer mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading && <Spinner />}
            {loading ? "Updating..." : "Update password"}
          </button>
        </form>
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
