"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X, Loader2, CheckCircle, AlertCircle, Heart } from "lucide-react";
import { submitVolunteerInterest } from "@/app/actions/volunteer";

interface VolunteerDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const HELP_AREAS = [
  "Classroom assistance",
  "Outdoor building & maintenance",
  "Gardening",
  "Childcare & supervision",
  "Event planning & setup",
  "Fundraising",
  "Administrative support",
  "Other",
];

const AVAILABILITY_OPTIONS = [
  "Weekday mornings",
  "Weekday afternoons",
  "Weekends",
  "Flexible / as needed",
];

export default function VolunteerDialog({ isOpen, onClose }: VolunteerDialogProps) {
  const [skills, setSkills] = useState("");
  const [helpAreas, setHelpAreas] = useState<string[]>([]);
  const [availability, setAvailability] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  const toggleCheckbox = (
    value: string,
    current: string[],
    setter: (v: string[]) => void,
  ) => {
    setter(
      current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value],
    );
  };

  const resetForm = () => {
    setSkills("");
    setHelpAreas([]);
    setAvailability([]);
    setNotes("");
    setSubmitStatus({ type: null, message: "" });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: "" });

    try {
      const result = await submitVolunteerInterest({
        skills,
        helpAreas,
        availability,
        notes: notes || undefined,
      });

      if (result.success) {
        setSubmitStatus({ type: "success", message: result.message });
        setTimeout(() => {
          handleClose();
        }, 2000);
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

  if (typeof document === "undefined") return null;

  return createPortal(
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

          {/* Side panel — slides in from right */}
          <motion.div
            className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-[70] overflow-y-auto"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 md:p-8">
              {/* Header */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Heart className="w-5 h-5 text-[#4a7c59]" />
                    <h2 className="text-2xl font-heading font-semibold text-gray-800">
                      Volunteer Interest
                    </h2>
                  </div>
                  <p className="text-sm text-gray-500 font-body">
                    Tell us how you&apos;d like to get involved.
                  </p>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0 cursor-pointer"
                  aria-label="Close"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <form className="space-y-6" onSubmit={handleSubmit}>
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

                {/* Skills & Experience */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 font-body">
                    Skills &amp; Experience <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    rows={4}
                    required
                    disabled={isSubmitting}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg
                             focus:border-[#4a7c59] focus:outline-none transition-colors
                             font-body resize-none text-gray-900 placeholder:text-gray-400
                             disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="Describe any relevant skills or experience you have"
                  />
                </div>

                {/* How You'd Like to Help */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3 font-body">
                    How You&apos;d Like to Help <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-2">
                    {HELP_AREAS.map((area) => (
                      <label
                        key={area}
                        className="flex items-center gap-3 cursor-pointer group"
                      >
                        <input
                          type="checkbox"
                          checked={helpAreas.includes(area)}
                          onChange={() =>
                            toggleCheckbox(area, helpAreas, setHelpAreas)
                          }
                          disabled={isSubmitting}
                          className="w-4 h-4 accent-[#4a7c59] disabled:cursor-not-allowed"
                        />
                        <span className="text-sm text-gray-700 font-body group-hover:text-gray-900">
                          {area}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Time Availability */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3 font-body">
                    Time Availability <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-2">
                    {AVAILABILITY_OPTIONS.map((option) => (
                      <label
                        key={option}
                        className="flex items-center gap-3 cursor-pointer group"
                      >
                        <input
                          type="checkbox"
                          checked={availability.includes(option)}
                          onChange={() =>
                            toggleCheckbox(option, availability, setAvailability)
                          }
                          disabled={isSubmitting}
                          className="w-4 h-4 accent-[#4a7c59] disabled:cursor-not-allowed"
                        />
                        <span className="text-sm text-gray-700 font-body group-hover:text-gray-900">
                          {option}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Additional Notes */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 font-body">
                    Additional Notes
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    disabled={isSubmitting}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg
                             focus:border-[#4a7c59] focus:outline-none transition-colors
                             font-body resize-none text-gray-900 placeholder:text-gray-400
                             disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="Anything else you'd like us to know?"
                  />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full px-6 py-3 bg-[#4a7c59] text-white font-semibold
                           rounded-lg hover:bg-[#3d6b4a] transition-all duration-200
                           font-body cursor-pointer flex items-center justify-center gap-2
                           disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting…
                    </>
                  ) : (
                    "Submit Interest"
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
