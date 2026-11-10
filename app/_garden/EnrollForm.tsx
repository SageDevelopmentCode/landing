"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { submitWaitlist } from "@/app/actions/waitlist";
import { formatPhone } from "@/app/utils/formatPhone";
/** Must match the programInterest enum in app/actions/waitlist.ts. */
export const PROGRAM_OPTIONS = [
  { value: "school-year-2026", label: "School Year 2026-2027" },
  { value: "homeschool_drop_in", label: "Homeschool Drop-in" },
  { value: "summer-2027", label: "Summer 2027" },
  { value: "school-year-2027-2028", label: "School Year 2027-2028" },
] as const;

type ProgramValue = (typeof PROGRAM_OPTIONS)[number]["value"];

const EMPTY = {
  parentName: "",
  email: "",
  phone: "",
  childName: "",
  childAge: "",
  programInterest: "",
  specialInterests: "",
};

export type EnrollFormTheme = {
  label: string;
  input: string;
  button: string;
  success: string;
  error: string;
  required?: string;
};

/**
 * The Sage Field interest form: same fields, validation and server action
 * (submitWaitlist) as the original EnrollmentCTASection, styled through `theme`.
 */
export default function EnrollForm({
  theme,
  onSuccess,
  className = "",
}: {
  theme: EnrollFormTheme;
  onSuccess?: () => void;
  className?: string;
}) {
  const [formData, setFormData] = useState(EMPTY);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error" | null; message: string }>({
    type: null,
    message: "",
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus({ type: null, message: "" });
    try {
      const result = await submitWaitlist({
        parentName: formData.parentName,
        email: formData.email,
        phone: formData.phone || undefined,
        childName: formData.childName,
        childAge: parseInt(formData.childAge),
        programInterest: formData.programInterest as ProgramValue,
        specialInterests: formData.specialInterests || undefined,
      });
      if (result.success) {
        setStatus({ type: "success", message: result.message });
        setFormData(EMPTY);
        onSuccess?.();
      } else {
        setStatus({ type: "error", message: result.message });
      }
    } catch {
      setStatus({ type: "error", message: "An unexpected error occurred. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: name === "phone" ? formatPhone(value) : value }));
  };

  const req = <span className={theme.required ?? "text-primary"}>*</span>;

  return (
    <form className={`space-y-5 ${className}`} onSubmit={handleSubmit}>
      {status.type && (
        <div
          role="status"
          className={`flex items-center gap-2 p-4 rounded-xl ${status.type === "success" ? theme.success : theme.error}`}
        >
          {status.type === "success" ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <p className="text-sm">{status.message}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <label className="block">
          <span className={theme.label}>Parent/Guardian Name {req}</span>
          <input type="text" name="parentName" required disabled={isSubmitting} value={formData.parentName} onChange={handleChange} className={theme.input} placeholder="Your full name" />
        </label>
        <label className="block">
          <span className={theme.label}>Email {req}</span>
          <input type="email" name="email" required disabled={isSubmitting} value={formData.email} onChange={handleChange} className={theme.input} placeholder="your@email.com" />
        </label>
        <label className="block">
          <span className={theme.label}>Phone (Optional)</span>
          <input type="tel" name="phone" disabled={isSubmitting} value={formData.phone} onChange={handleChange} className={theme.input} placeholder="(123) 456-7890" />
        </label>
        <label className="block">
          <span className={theme.label}>Child&apos;s Name {req}</span>
          <input type="text" name="childName" required disabled={isSubmitting} value={formData.childName} onChange={handleChange} className={theme.input} placeholder="First and last name" />
        </label>
        <label className="block">
          <span className={theme.label}>Child&apos;s Age {req}</span>
          <input type="number" name="childAge" min="1" max="18" required disabled={isSubmitting} value={formData.childAge} onChange={handleChange} className={theme.input} placeholder="e.g., 7" />
        </label>
        <label className="block">
          <span className={theme.label}>Program Interest {req}</span>
          <select name="programInterest" required disabled={isSubmitting} value={formData.programInterest} onChange={handleChange} className={theme.input}>
            <option value="">Select a program...</option>
            {PROGRAM_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="block">
        <span className={theme.label}>Special Interests & Learning Needs</span>
        <textarea
          name="specialInterests"
          rows={3}
          maxLength={500}
          disabled={isSubmitting}
          value={formData.specialInterests}
          onChange={handleChange}
          className={`${theme.input} resize-none`}
          placeholder="Tell us about your child's interests, learning style, or any special considerations..."
        />
      </label>
      <button type="submit" disabled={isSubmitting} className={theme.button}>
        {isSubmitting ? (
          <span className="inline-flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            Submitting...
          </span>
        ) : (
          "Submit Interest Form"
        )}
      </button>
    </form>
  );
}
