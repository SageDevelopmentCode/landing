"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  Mail,
  Phone,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { submitContact } from "@/app/actions/contact";
import { formatPhone } from "@/app/utils/formatPhone";

interface ContactDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ContactDialog({ isOpen, onClose }: ContactDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;

    // Apply phone formatting if it's the phone field
    if (name === "phone") {
      const formatted = formatPhone(value);
      setFormData((prev) => ({
        ...prev,
        phone: formatted,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: "" });

    try {
      const result = await submitContact({
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
        subject: formData.subject,
        message: formData.message,
      });

      if (result.success) {
        setSubmitStatus({ type: "success", message: result.message });
        // Clear form
        setFormData({
          name: "",
          email: "",
          phone: "",
          subject: "",
          message: "",
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
              opacity: 0,
            }}
            animate={{
              y: 0,
              opacity: 1,
            }}
            exit={{
              y: "100%",
              opacity: 0,
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
                    Contact Us
                  </h2>
                  <p className="text-sm md:text-base text-gray-600 mt-2 font-body">
                    We&apos;d love to hear from you! Send us a message and
                    we&apos;ll get back to you soon.
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

              {/* Direct Contact Information */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm font-semibold text-text-gray mb-3 font-body">
                  You can also reach us directly:
                </p>
                <div className="space-y-2">
                  <a
                    href="mailto:sabrina@sagefield.co"
                    className="flex items-center gap-2 text-sm text-primary hover:text-primary-hover transition-colors font-body"
                  >
                    <Mail className="w-4 h-4 flex-shrink-0" />
                    <span>sabrina@sagefield.co</span>
                  </a>
                </div>
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

                {/* Name */}
                <div>
                  <label className="block text-sm font-semibold text-text-gray mb-2 font-body">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    disabled={isSubmitting}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg
                             focus:border-primary focus:outline-none transition-colors
                             font-body text-gray-900 placeholder:text-gray-500
                             disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="Your full name"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold text-text-gray mb-2 font-body">
                    Email <span className="text-red-500">*</span>
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

                {/* Phone */}
                <div>
                  <label className="block text-sm font-semibold text-text-gray mb-2 font-body">
                    Phone (Optional)
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg
                             focus:border-primary focus:outline-none transition-colors
                             font-body text-gray-900 placeholder:text-gray-500"
                    placeholder="(123) 456-7890"
                  />
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-sm font-semibold text-text-gray mb-2 font-body">
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg
                             focus:border-primary focus:outline-none transition-colors
                             font-body text-gray-900 placeholder:text-gray-500"
                    placeholder="What would you like to discuss?"
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-semibold text-text-gray mb-2 font-body">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={5}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg
                             focus:border-primary focus:outline-none transition-colors
                             font-body resize-none text-gray-900 placeholder:text-gray-500"
                    placeholder="Tell us how we can help you..."
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full px-6 py-3 bg-primary text-white font-semibold
                           rounded-lg hover:bg-primary-hover transition-all duration-200
                           font-body cursor-pointer flex items-center justify-center gap-2"
                >
                  Send Message
                </button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
