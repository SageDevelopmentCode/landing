"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { submitWaitlist } from "@/app/actions/waitlist";

interface WaitlistDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WaitlistDialog({ isOpen, onClose }: WaitlistDialogProps) {
  const [formData, setFormData] = useState({
    email: "",
    childName: "",
    childAge: "",
    specialInterests: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: "" });

    try {
      const result = await submitWaitlist({
        email: formData.email,
        childName: formData.childName,
        childAge: parseInt(formData.childAge),
        specialInterests: formData.specialInterests || undefined,
      });

      if (result.success) {
        setSubmitStatus({ type: "success", message: result.message });
        // Clear form
        setFormData({
          email: "",
          childName: "",
          childAge: "",
          specialInterests: "",
        });
        // Auto-close after 2 seconds
        setTimeout(() => {
          onClose();
          setSubmitStatus({ type: null, message: "" });
        }, 2000);
      } else {
        setSubmitStatus({ type: "error", message: result.message });
      }
    } catch (error) {
      setSubmitStatus({
        type: "error",
        message: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal (centered on desktop) / Sheet (bottom on mobile) */}
          <motion.div
            className="fixed z-[70] bg-white rounded-t-2xl md:rounded-2xl shadow-2xl
                       bottom-0 left-0 right-0 md:bottom-auto md:left-1/2 md:top-1/2
                       md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-lg
                       max-h-[90vh] overflow-y-auto"
            initial={{
              y: "100%",
              opacity: 0
            }}
            animate={{
              y: 0,
              opacity: 1
            }}
            exit={{
              y: "100%",
              opacity: 0
            }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Content */}
            <div className="p-6 md:p-8">
              {/* Header with close button */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl md:text-3xl font-heading font-semibold text-text-gray">
                    Join Our Waitlist
                  </h2>
                  <p className="text-sm md:text-base text-gray-600 mt-2 font-body">
                    We'd love to learn more about your child and how Sage Field can support their learning journey.
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0 cursor-pointer"
                  aria-label="Close"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Form */}
              <form className="space-y-5" onSubmit={handleSubmit}>
                {/* Status Messages */}
                {submitStatus.type && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex items-center gap-2 p-4 rounded-lg ${
                      submitStatus.type === "success"
                        ? "bg-green-50 text-green-800 border border-green-200"
                        : "bg-red-50 text-red-800 border border-red-200"
                    }`}
                  >
                    {submitStatus.type === "success" ? (
                      <CheckCircle className="w-5 h-5 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    )}
                    <p className="text-sm font-body">{submitStatus.message}</p>
                  </motion.div>
                )}

                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold text-text-gray mb-2 font-body">
                    Parent/Guardian Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    disabled={isSubmitting}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg
                             focus:border-primary focus:outline-none transition-colors
                             font-body text-gray-900 placeholder:text-gray-500
                             disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="your@email.com"
                  />
                </div>

                {/* Child's Name */}
                <div>
                  <label className="block text-sm font-semibold text-text-gray mb-2 font-body">
                    Child's Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="childName"
                    value={formData.childName}
                    onChange={handleChange}
                    required
                    disabled={isSubmitting}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg
                             focus:border-primary focus:outline-none transition-colors
                             font-body text-gray-900 placeholder:text-gray-500
                             disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="First and last name"
                  />
                </div>

                {/* Age */}
                <div>
                  <label className="block text-sm font-semibold text-text-gray mb-2 font-body">
                    Child's Age <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="childAge"
                    value={formData.childAge}
                    onChange={handleChange}
                    min="1"
                    max="18"
                    required
                    disabled={isSubmitting}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg
                             focus:border-primary focus:outline-none transition-colors
                             font-body text-gray-900 placeholder:text-gray-500
                             disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="e.g., 7"
                  />
                </div>

                {/* Special Interests & Learning Needs */}
                <div>
                  <label className="block text-sm font-semibold text-text-gray mb-2 font-body">
                    Special Interests & Learning Needs
                  </label>
                  <textarea
                    name="specialInterests"
                    value={formData.specialInterests}
                    onChange={handleChange}
                    rows={4}
                    disabled={isSubmitting}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg
                             focus:border-primary focus:outline-none transition-colors
                             font-body resize-none text-gray-900 placeholder:text-gray-500
                             disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="Tell us about your child's interests, learning style, or any special considerations..."
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full px-6 py-3 bg-primary text-white font-semibold
                           rounded-lg hover:bg-primary-hover transition-all duration-200
                           font-body cursor-pointer disabled:bg-gray-400 disabled:cursor-not-allowed
                           flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Join Waitlist"
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
