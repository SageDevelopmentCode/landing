"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

interface Props {
  autoOpen?: boolean;
  applicationId?: string;
  onSuccess?: () => void;
}

export default function EnrollmentCodeEntry({
  autoOpen = false,
  applicationId,
  onSuccess,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!autoOpen) return;
    const t = setTimeout(() => setOpen(true), 1000);
    return () => clearTimeout(t);
  }, [autoOpen]);

  function close() {
    setOpen(false);
    setCode("");
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/apply/redeem-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, applicationId }),
    });

    if (res.ok) {
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/parent/dashboard");
      }
    } else {
      setError("Invalid code. Please try again.");
      setLoading(false);
    }
  }

  return (
    <>
      {/* Inline trigger link in the amber banner */}
      <button
        onClick={() => setOpen(true)}
        className="text-sm text-amber-800 underline underline-offset-2 hover:text-amber-900 font-body transition-colors cursor-pointer"
      >
        Have an enrollment code?
      </button>

      {/* Modal */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center"
            onClick={close}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.2, ease: "easeOut" as const }}
              className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold font-heading text-gray-800">
                  Have an enrollment code?
                </h2>
                <button
                  onClick={close}
                  className="text-gray-400 hover:text-gray-600 text-lg leading-none"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              <p className="text-sm text-gray-500 mt-1 mb-4 font-body">
                Enter the code you received to access your parent dashboard.
              </p>

              <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Enter code…"
                  disabled={loading}
                  autoFocus
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-xl text-sm text-gray-800 placeholder:text-gray-400 font-body focus:outline-none focus:ring-2 focus:ring-amber-300"
                />
                <button
                  type="submit"
                  disabled={loading || !code.trim()}
                  className="px-4 py-2 bg-amber-500 text-white rounded-xl text-sm font-semibold font-body hover:bg-amber-600 transition-colors disabled:opacity-50"
                >
                  {loading ? "Checking…" : "Submit"}
                </button>
              </form>

              {error && (
                <p className="text-red-500 text-xs font-body mt-2">{error}</p>
              )}

              <button
                onClick={close}
                className="mt-3 text-sm text-gray-400 hover:text-gray-500 font-body transition-colors"
              >
                I don&apos;t have a code
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
