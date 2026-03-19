"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { submitWaitlist } from "@/app/actions/waitlist";
import { formatPhone } from "@/app/utils/formatPhone";

export default function EnrollmentCTASection() {
  const [formData, setFormData] = useState({
    parentName: "",
    email: "",
    phone: "",
    childName: "",
    childAge: "",
    programInterest: "",
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
        parentName: formData.parentName,
        email: formData.email,
        phone: formData.phone || undefined,
        childName: formData.childName,
        childAge: parseInt(formData.childAge),
        programInterest: formData.programInterest as
          | "summer-2026"
          | "school-year-2026"
          | "both",
        specialInterests: formData.specialInterests || undefined,
      });

      if (result.success) {
        setSubmitStatus({ type: "success", message: result.message });
        setFormData({
          parentName: "",
          email: "",
          phone: "",
          childName: "",
          childAge: "",
          programInterest: "",
          specialInterests: "",
        });
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

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;

    if (name === "phone") {
      const formatted = formatPhone(value);
      setFormData((prev) => ({ ...prev, phone: formatted }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  return (
    <section className="bg-welcome-bg min-h-[80vh] py-16 px-8 sm:px-12 lg:px-16 flex items-center justify-center">
      <div className="max-w-7xl mx-auto w-full text-center">
        {/* Badge */}
        <motion.div
          className="flex justify-center mb-8"
          initial={{ opacity: 0, y: -10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <span className="inline-block px-6 py-2 bg-badge-bg text-black text-sm font-semibold rounded-full">
            Enrollment Open
          </span>
        </motion.div>

        {/* Title */}
        <motion.h2
          className="text-4xl md:text-5xl font-bold text-black font-heading mb-6"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
        >
          Enrollment is Now Open!
        </motion.h2>

        {/* Description */}
        <motion.p
          className="text-base md:text-lg text-text-gray leading-relaxed font-body mb-8 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
        >
          Join our community and give your child the gift of hands-on,
          wisdom-focused learning in a nurturing environment. We&apos;re excited
          to welcome new families to Sage Field.
        </motion.p>

        {/* Inline form */}
        <motion.div
          className="text-left max-w-lg mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
        >
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

            {/* Parent/Guardian Name */}
            <div>
              <label className="block text-sm font-semibold text-text-gray mb-2 font-body">
                Parent/Guardian Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="parentName"
                value={formData.parentName}
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
                disabled={isSubmitting}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg
                         focus:border-primary focus:outline-none transition-colors
                         font-body text-gray-900 placeholder:text-gray-500
                         disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="(123) 456-7890"
              />
            </div>

            {/* Child's Name */}
            <div>
              <label className="block text-sm font-semibold text-text-gray mb-2 font-body">
                Child&apos;s Name <span className="text-red-500">*</span>
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

            {/* Child's Age */}
            <div>
              <label className="block text-sm font-semibold text-text-gray mb-2 font-body">
                Child&apos;s Age <span className="text-red-500">*</span>
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

            {/* Program Interest */}
            <div>
              <label className="block text-sm font-semibold text-text-gray mb-2 font-body">
                Program Interest <span className="text-red-500">*</span>
              </label>
              <select
                name="programInterest"
                value={formData.programInterest}
                onChange={handleChange}
                required
                disabled={isSubmitting}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg
                         focus:border-primary focus:outline-none transition-colors
                         font-body text-gray-900
                         disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">Select a program...</option>
                <option value="summer-2026">Summer 2026</option>
                <option value="school-year-2026">School Year 2026-2027</option>
                <option value="both">Both Programs</option>
              </select>
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
                "Submit Interest Form"
              )}
            </button>
          </form>
        </motion.div>

      </div>
    </section>
  );
}
