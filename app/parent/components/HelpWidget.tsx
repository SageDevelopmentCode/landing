"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X, HelpCircle, Paperclip, Send, Loader2 } from "lucide-react";
import { submitHelpRequest } from "@/app/actions/submitHelpRequest";

export default function HelpWidget() {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(() => {
      setDescription("");
      setAttachedFiles([]);
      setSubmitted(false);
      setError(null);
    }, 300);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachedFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const fd = new FormData();
    fd.append("description", description.trim());
    fd.append("pageUrl", window.location.href);
    for (const file of attachedFiles) {
      fd.append("files", file);
    }

    startTransition(async () => {
      const result = await submitHelpRequest(fd);
      if ("error" in result) {
        setError(result.error);
      } else {
        setSubmitted(true);
        setTimeout(() => handleClose(), 2500);
      }
    });
  };

  if (!mounted) return null;

  return (
    <>
      {/* Floating trigger button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2
                   px-4 py-3 rounded-full bg-primary text-white
                   shadow-lg font-body font-semibold text-sm
                   hover:bg-primary-hover transition-colors cursor-pointer
                   focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
        aria-label="Open help widget"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 20, stiffness: 300, delay: 0.4 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <HelpCircle className="w-4 h-4 flex-shrink-0" />
        Need Help?
      </motion.button>

      {/* Modal portal */}
      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={handleClose}
              />

              {/* Modal panel */}
              <motion.div
                className="fixed z-[70] bg-white rounded-t-2xl md:rounded-2xl shadow-2xl
                           bottom-0 left-0 right-0
                           md:bottom-auto md:left-1/2 md:top-1/2
                           md:-translate-x-1/2 md:-translate-y-1/2
                           md:w-full md:max-w-md
                           max-h-[90vh] overflow-y-auto"
                initial={{ y: "100%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: "100%", opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6 md:p-8">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <HelpCircle className="w-4 h-4 text-primary" />
                        </div>
                        <h2 className="text-xl font-heading font-semibold text-text-gray">
                          Need Help?
                        </h2>
                      </div>
                      <p className="text-sm text-gray-500 font-body mt-1">
                        Describe your issue and we&apos;ll get back to you.
                      </p>
                    </div>
                    <button
                      onClick={handleClose}
                      disabled={isPending}
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors
                                 flex-shrink-0 cursor-pointer disabled:opacity-50"
                      aria-label="Close"
                    >
                      <X className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>

                  {/* Success state */}
                  {submitted ? (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-col items-center justify-center gap-3 py-10"
                    >
                      <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center">
                        <Send className="w-5 h-5 text-green-600" />
                      </div>
                      <p className="text-base font-semibold font-heading text-gray-800">
                        Message sent!
                      </p>
                      <p className="text-sm text-gray-500 font-body text-center">
                        We&apos;ll review your request and reach out soon.
                      </p>
                    </motion.div>
                  ) : (
                    <form className="space-y-5" onSubmit={handleSubmit}>
                      {/* Textarea */}
                      <div>
                        <label className="block text-sm font-semibold text-text-gray mb-2 font-body">
                          What&apos;s the issue?{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          rows={5}
                          required
                          disabled={isPending}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg
                                     focus:border-primary focus:outline-none transition-colors
                                     font-body resize-none text-gray-900 placeholder:text-gray-400
                                     disabled:opacity-60"
                          placeholder="Describe what you're experiencing or what you need help with..."
                        />
                      </div>

                      {/* File attachment */}
                      <div>
                        <label className="block text-sm font-semibold text-text-gray mb-2 font-body">
                          Attach files or screenshots{" "}
                          <span className="ml-1 text-xs font-normal text-gray-400">
                            (optional)
                          </span>
                        </label>

                        <div
                          onClick={() => !isPending && fileInputRef.current?.click()}
                          className="border-2 border-dashed border-gray-200 rounded-xl px-5 py-6
                                     flex flex-col items-center gap-2 cursor-pointer
                                     hover:border-primary/50 hover:bg-primary/5 transition-colors
                                     aria-disabled:opacity-60"
                        >
                          <Paperclip className="w-5 h-5 text-gray-400" />
                          <p className="text-sm font-semibold text-gray-600 font-heading">
                            Click to attach files
                          </p>
                          <p className="text-xs text-gray-400 font-body">
                            PNG, JPG, PDF supported
                          </p>
                          <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept=".png,.jpg,.jpeg,.pdf"
                            className="hidden"
                            onChange={handleFileChange}
                            disabled={isPending}
                          />
                        </div>

                        {/* Attached file pills */}
                        {attachedFiles.length > 0 && (
                          <ul className="mt-3 space-y-1.5">
                            {attachedFiles.map((file, i) => (
                              <li
                                key={i}
                                className="flex items-center gap-2 px-3 py-2 bg-gray-50
                                           border border-gray-200 rounded-lg text-sm font-body
                                           text-gray-700"
                              >
                                <Paperclip className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                <span className="truncate">{file.name}</span>
                                <button
                                  type="button"
                                  disabled={isPending}
                                  onClick={() =>
                                    setAttachedFiles((prev) =>
                                      prev.filter((_, idx) => idx !== i)
                                    )
                                  }
                                  className="ml-auto p-0.5 text-gray-400 hover:text-red-500
                                             transition-colors cursor-pointer disabled:opacity-50"
                                  aria-label={`Remove ${file.name}`}
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      {/* Error message */}
                      {error && (
                        <p className="text-sm text-red-600 font-body">{error}</p>
                      )}

                      {/* Footer buttons */}
                      <div className="flex items-center gap-3 pt-1">
                        <button
                          type="button"
                          onClick={handleClose}
                          disabled={isPending}
                          className="flex-1 px-4 py-2.5 rounded-lg border-2 border-gray-200
                                     text-sm font-semibold font-body text-gray-600
                                     hover:bg-gray-50 transition-colors cursor-pointer
                                     disabled:opacity-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isPending}
                          className="flex-1 px-4 py-2.5 rounded-lg bg-primary text-white
                                     text-sm font-semibold font-body
                                     hover:bg-primary-hover transition-colors cursor-pointer
                                     flex items-center justify-center gap-2
                                     disabled:opacity-70"
                        >
                          {isPending ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Send className="w-3.5 h-3.5" />
                          )}
                          {isPending ? "Sending..." : "Send Request"}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
