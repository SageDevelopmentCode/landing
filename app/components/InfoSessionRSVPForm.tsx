"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2 } from "lucide-react";

interface Child {
  name: string;
  age: string;
}

export default function InfoSessionRSVPForm() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    programs: [] as string[],
    hearAboutUs: "",
    questions: "",
  });

  const [children, setChildren] = useState<Child[]>([{ name: "", age: "" }]);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const isFormValid =
    formData.firstName.trim() !== "" &&
    formData.lastName.trim() !== "" &&
    formData.email.trim() !== "" &&
    formData.phone.trim() !== "" &&
    children.some((c) => c.name.trim() !== "" && c.age.trim() !== "") &&
    formData.programs.length > 0;

  const programOptions = [
    { id: "summer-2026", label: "Summer 2026 Camp" },
    { id: "school-year", label: "School Year 2026–2027" },
    { id: "homeschool", label: "Homeschool Drop-In" },
  ];

  const hearAboutUsOptions = [
    "Google / Web Search",
    "Instagram",
    "Facebook",
    "Word of Mouth / Friend",
    "Nextdoor",
    "Flyer / Poster",
    "Other",
  ];

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProgramToggle = (programId: string) => {
    setFormData((prev) => ({
      ...prev,
      programs: prev.programs.includes(programId)
        ? prev.programs.filter((p) => p !== programId)
        : [...prev.programs, programId],
    }));
  };

  const handleChildChange = (index: number, field: keyof Child, value: string) => {
    setChildren((prev) =>
      prev.map((child, i) => (i === index ? { ...child, [field]: value } : child))
    );
  };

  const addChild = () => {
    setChildren((prev) => [...prev, { name: "", age: "" }]);
  };

  const removeChild = (index: number) => {
    if (children.length === 1) return;
    setChildren((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/info-session/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, children }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error ?? "Something went wrong. Please try again.");
        setStatus("error");
        return;
      }

      setStatus("success");
    } catch {
      setErrorMsg("Something went wrong. Please try again.");
      setStatus("error");
    }
  };

  const inputClass =
    "w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none transition-colors font-body text-gray-900 placeholder:text-gray-400 bg-white";

  const labelClass = "block text-sm font-semibold text-gray-700 mb-2 font-body";

  return (
    <section id="rsvp" className="py-16 px-8 sm:px-12 lg:px-16">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-10"
        >
          <span className="inline-block px-6 py-2 bg-badge-bg text-black text-sm font-semibold rounded-full mb-6">
            Reserve Your Spot
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 font-heading mb-4">
            RSVP for the Info Session
          </h2>
          <p className="text-gray-500 font-body text-base">
            Fill out the form below to reserve your spot. The Google Meet link
            is included in your confirmation email.
          </p>
        </motion.div>

        {status === "success" ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center"
          >
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 font-heading mb-3">You&apos;re registered!</h3>
            <p className="text-gray-500 font-body text-base mb-2">
              A confirmation email is on its way to <span className="font-semibold text-gray-700">{formData.email}</span>.
            </p>
            <p className="text-gray-400 font-body text-sm">
              Join via Google Meet on April 18 · 10:00 AM CST
            </p>
            <p className="text-gray-400 font-body text-sm mt-1">
              <a href="https://meet.google.com/epm-ashp-tyf" className="text-primary hover:underline font-semibold">
                meet.google.com/epm-ashp-tyf
              </a>
            </p>
            <div className="mt-6">
              <a
                href="https://calendar.google.com/calendar/render?action=TEMPLATE&text=Sage+Field+Parent+Info+Session&dates=20260418T150000Z/20260418T160000Z&details=Join+us+on+Google+Meet%3A+https%3A%2F%2Fmeet.google.com%2Fepm-ashp-tyf&location=https%3A%2F%2Fmeet.google.com%2Fepm-ashp-tyf"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors font-body"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 4h-1V2h-2v2H8V2H6v2H5C3.9 4 3 4.9 3 6v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11zm0-13H5V6h14v1z"/>
                </svg>
                Add to Google Calendar
              </a>
            </div>
          </motion.div>
        ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>
                  First Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  placeholder="Jane"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>
                  Last Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  placeholder="Smith"
                  className={inputClass}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className={labelClass}>
                Email Address <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="jane@email.com"
                className={inputClass}
              />
            </div>

            {/* Phone */}
            <div>
              <label className={labelClass}>
                Phone Number <span className="text-red-400">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                placeholder="(512) 555-0100"
                className={inputClass}
              />
            </div>

            {/* Children */}
            <div>
              <label className={labelClass}>
                Children Attending / Interested in Enrolling{" "}
                <span className="text-red-400">*</span>
              </label>
              <div className="space-y-3">
                {children.map((child, index) => (
                  <div key={index} className="flex gap-3 items-center">
                    <input
                      type="text"
                      value={child.name}
                      onChange={(e) =>
                        handleChildChange(index, "name", e.target.value)
                      }
                      placeholder={`Child ${index + 1} name`}
                      className={`${inputClass} flex-1`}
                    />
                    <input
                      type="text"
                      value={child.age}
                      onChange={(e) =>
                        handleChildChange(index, "age", e.target.value)
                      }
                      placeholder="Age"
                      className="w-20 px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none transition-colors font-body text-gray-900 placeholder:text-gray-400 bg-white text-center"
                    />
                    {children.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeChild(index)}
                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        aria-label="Remove child"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addChild}
                className="mt-3 flex items-center gap-2 text-sm text-primary hover:text-primary-hover font-semibold font-body transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add another child
              </button>
            </div>

            {/* Programs interested in */}
            <div>
              <label className={labelClass}>
                Which program(s) are you interested in?{" "}
                <span className="text-red-400">*</span>
              </label>
              <div className="flex flex-col gap-3">
                {programOptions.map((option) => (
                  <label
                    key={option.id}
                    className="flex items-center gap-3 cursor-pointer group"
                  >
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
                        formData.programs.includes(option.id)
                          ? "bg-primary border-primary"
                          : "border-gray-300 group-hover:border-primary"
                      }`}
                      onClick={() => handleProgramToggle(option.id)}
                    >
                      {formData.programs.includes(option.id) && (
                        <svg
                          className="w-3 h-3 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                    <span
                      className="text-sm text-gray-700 font-body"
                      onClick={() => handleProgramToggle(option.id)}
                    >
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* How did you hear about us */}
            <div>
              <label className={labelClass}>How did you hear about us?</label>
              <select
                name="hearAboutUs"
                value={formData.hearAboutUs}
                onChange={handleChange}
                className={`${inputClass} appearance-none`}
              >
                <option value="" disabled>
                  Select an option
                </option>
                {hearAboutUsOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            {/* Questions / Topics */}
            <div>
              <label className={labelClass}>
                Any questions or topics you&apos;d like us to cover?
              </label>
              <textarea
                name="questions"
                value={formData.questions}
                onChange={handleChange}
                rows={4}
                placeholder="e.g. Curriculum details, daily schedule, pricing, enrollment process..."
                className={`${inputClass} resize-none`}
              />
            </div>

            {/* Error message */}
            {status === "error" && (
              <p className="text-sm text-red-500 font-body text-center">{errorMsg}</p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={!isFormValid || status === "loading"}
              className="w-full px-6 py-4 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-colors duration-200 shadow-md hover:shadow-lg font-body text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === "loading" ? "Submitting…" : "Reserve My Spot"}
            </button>

            <p className="text-xs text-gray-400 text-center font-body">
              The Google Meet link will be included in your confirmation email.
            </p>
          </form>
        </motion.div>
        )}
      </div>
    </section>
  );
}
