"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, AlertCircle, Loader2, Trash2, ShieldCheck, Clock } from "lucide-react";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import { submitDeleteAccountRequest } from "@/app/actions/deleteAccountRequest";

export default function DeleteAccountPage() {
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    reason: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: "" });

    try {
      const result = await submitDeleteAccountRequest({
        full_name: formData.full_name,
        email: formData.email,
        reason: formData.reason || undefined,
      });

      if (result.success) {
        setSubmitted(true);
        setSubmitStatus({ type: "success", message: result.message });
      } else {
        setSubmitStatus({ type: "error", message: result.message });
      }
    } catch {
      setSubmitStatus({
        type: "error",
        message: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-welcome-bg flex flex-col">
      <Navbar />

      <main className="flex-1 py-16 px-8 sm:px-12 lg:px-16 pt-32">
        <div className="max-w-3xl mx-auto w-full">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
            className="inline-block mb-8"
          >
            <div className="bg-badge-bg px-6 py-2 rounded-full">
              <span className="text-sm font-semibold text-text-gray font-body">
                Sage Field Private School
              </span>
            </div>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            className="text-4xl md:text-5xl font-bold mb-4 text-text-gray font-heading"
          >
            Request Account Deletion
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
            className="text-lg text-gray-600 font-body mb-12"
          >
            You can use this page to request the deletion of your Sage Field
            Private School account and associated personal data from our
            systems.
          </motion.p>

          {/* Steps */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35, ease: "easeOut" }}
            className="bg-white rounded-2xl p-8 shadow-sm mb-8"
          >
            <h2 className="text-xl font-heading font-semibold text-text-gray mb-6">
              How to Request Account Deletion
            </h2>
            <ol className="space-y-4">
              {[
                "Fill out the form below with your full name and the email address associated with your Sage Field account.",
                "Submit the form. You'll see a confirmation message on this page once it's received.",
                "Our team will process your request within 30 days and send a confirmation email once your account has been deleted.",
              ].map((step, i) => (
                <li key={i} className="flex gap-4 items-start">
                  <span className="w-7 h-7 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center flex-shrink-0 font-heading">
                    {i + 1}
                  </span>
                  <p className="text-gray-700 font-body leading-relaxed">{step}</p>
                </li>
              ))}
            </ol>
          </motion.div>

          {/* Data info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
            className="grid sm:grid-cols-3 gap-4 mb-12"
          >
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Trash2 className="w-5 h-5 text-red-500" />
                <h3 className="font-heading font-semibold text-text-gray text-sm">
                  Deleted Immediately
                </h3>
              </div>
              <ul className="text-sm text-gray-600 font-body space-y-1.5">
                <li>Account credentials</li>
                <li>Child profiles</li>
                <li>Emergency contacts</li>
                <li>Payment method tokens</li>
                <li>Enrollment records</li>
                <li>Messages</li>
              </ul>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-5 h-5 text-amber-500" />
                <h3 className="font-heading font-semibold text-text-gray text-sm">
                  Retained 30 Days
                </h3>
              </div>
              <ul className="text-sm text-gray-600 font-body space-y-1.5">
                <li>Submitted application documents</li>
                <li className="text-gray-400 text-xs italic">
                  Kept temporarily in case of disputes
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck className="w-5 h-5 text-primary" />
                <h3 className="font-heading font-semibold text-text-gray text-sm">
                  Retained Per Law
                </h3>
              </div>
              <ul className="text-sm text-gray-600 font-body space-y-1.5">
                <li>Financial transaction records</li>
                <li className="text-gray-400 text-xs italic">
                  7 years per IRS requirements
                </li>
              </ul>
            </div>
          </motion.div>

          {/* Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45, ease: "easeOut" }}
            className="bg-white rounded-2xl p-8 shadow-sm"
          >
            <h2 className="text-xl font-heading font-semibold text-text-gray mb-2">
              Deletion Request Form
            </h2>
            <p className="text-sm text-gray-500 font-body mb-6">
              Please use the email address associated with your Sage Field
              account.
            </p>

            {submitted ? (
              <div className="flex items-start gap-3 p-5 rounded-xl bg-green-50 border border-green-200">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-green-800 font-heading mb-1">
                    Request Received
                  </p>
                  <p className="text-sm text-green-700 font-body">
                    {submitStatus.message}
                  </p>
                </div>
              </div>
            ) : (
              <form className="space-y-5" onSubmit={handleSubmit}>
                {submitStatus.type === "error" && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 p-4 rounded-lg bg-red-50 text-red-800 border border-red-200"
                  >
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p className="text-sm font-body">{submitStatus.message}</p>
                  </motion.div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-text-gray mb-2 font-body">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    required
                    disabled={isSubmitting}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none transition-colors font-body text-gray-900 placeholder:text-gray-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="Your full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-text-gray mb-2 font-body">
                    Account Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    disabled={isSubmitting}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none transition-colors font-body text-gray-900 placeholder:text-gray-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="your@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-text-gray mb-2 font-body">
                    Reason for Deletion{" "}
                    <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <textarea
                    name="reason"
                    value={formData.reason}
                    onChange={handleChange}
                    rows={4}
                    disabled={isSubmitting}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none transition-colors font-body resize-none text-gray-900 placeholder:text-gray-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="Let us know why you'd like to delete your account (optional)"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-all duration-200 font-body cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Deletion Request"
                  )}
                </button>
              </form>
            )}
          </motion.div>

          {/* Contact note */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
            className="text-center text-sm text-gray-500 font-body mt-8"
          >
            Questions? Email us at{" "}
            <a
              href="mailto:sabrina@sagefield.co"
              className="text-primary hover:underline"
            >
              sabrina@sagefield.co
            </a>{" "}
            or call{" "}
            <a href="tel:+15126775872" className="text-primary hover:underline">
              (512) 677-5872
            </a>
            .
          </motion.p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
