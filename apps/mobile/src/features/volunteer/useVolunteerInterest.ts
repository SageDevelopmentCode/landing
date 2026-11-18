// Data + form state for "Express Interest in Volunteering". The insert, the
// Discord notification and the error report are unchanged from the old screen.
import { notifyDiscord, notifyError } from "@/lib/discord";
import { supabase } from "@/lib/supabase";
import { useCallback, useState } from "react";

export type Result = { ok: boolean; error?: string };

export const HELP_AREAS = [
  "Classroom assistance",
  "Outdoor building & maintenance",
  "Gardening",
  "Childcare & supervision",
  "Event planning & setup",
  "Fundraising",
  "Administrative support",
  "Other",
];

export const AVAILABILITY_OPTIONS = [
  "Weekday mornings",
  "Weekday afternoons",
  "Weekends",
  "Flexible / as needed",
];

export const MAX_TEXT = 2000;

export type VolunteerErrors = Partial<Record<"skills" | "helpAreas" | "availability", string>>;

export function useVolunteerInterest() {
  const [skills, setSkillsRaw] = useState("");
  const [helpAreas, setHelpAreas] = useState<string[]>([]);
  const [availability, setAvailability] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<VolunteerErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const setSkills = useCallback((v: string) => {
    setSkillsRaw(v);
    setErrors((e) => (e.skills ? { ...e, skills: undefined } : e));
  }, []);

  const toggleHelpArea = useCallback((item: string) => {
    setHelpAreas((list) => (list.includes(item) ? list.filter((x) => x !== item) : [...list, item]));
    setErrors((e) => (e.helpAreas ? { ...e, helpAreas: undefined } : e));
  }, []);

  const toggleAvailability = useCallback((item: string) => {
    setAvailability((list) => (list.includes(item) ? list.filter((x) => x !== item) : [...list, item]));
    setErrors((e) => (e.availability ? { ...e, availability: undefined } : e));
  }, []);

  const reset = useCallback(() => {
    setSkillsRaw("");
    setHelpAreas([]);
    setAvailability([]);
    setNotes("");
    setErrors({});
    setSubmitError(null);
  }, []);

  const validate = useCallback((): VolunteerErrors => {
    const e: VolunteerErrors = {};
    if (!skills.trim()) e.skills = "Please describe your skills or experience.";
    if (helpAreas.length === 0) e.helpAreas = "Please select at least one area.";
    if (availability.length === 0) e.availability = "Please select at least one time slot.";
    return e;
  }, [skills, helpAreas, availability]);

  /** Validates, then inserts. Returns `invalid` when validation stopped it. */
  const submit = useCallback(async (): Promise<Result & { invalid?: VolunteerErrors }> => {
    const e = validate();
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return { ok: false, invalid: e };
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setErrors({});

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Session expired — please log in again.");

      const { error } = await supabase
        .schema("admin")
        .from("volunteer_interests")
        .insert({
          parent_id: session.user.id,
          skills: skills.trim(),
          help_areas: helpAreas,
          availability,
          notes: notes.trim() || null,
        });

      if (error) throw new Error(error.message);

      // Fetch parent name for Discord notification (non-fatal)
      const { data: profile } = await supabase
        .schema("admin")
        .from("users")
        .select("full_name")
        .eq("id", session.user.id)
        .single();

      notifyDiscord({
        type: "volunteer_interest",
        data: {
          parentName: profile?.full_name ?? session.user.email ?? "Unknown",
          skills: skills.trim(),
          helpAreas,
          availability,
          notes: notes.trim() || undefined,
        },
      });

      return { ok: true };
    } catch (err) {
      notifyError("volunteer-form-submit", err);
      const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setSubmitError(message);
      return { ok: false, error: message };
    } finally {
      setIsSubmitting(false);
    }
  }, [validate, skills, helpAreas, availability, notes]);

  const doneFlags = [skills.trim().length > 0, helpAreas.length > 0, availability.length > 0];

  return {
    skills,
    setSkills,
    helpAreas,
    toggleHelpArea,
    availability,
    toggleAvailability,
    notes,
    setNotes,
    isSubmitting,
    errors,
    submitError,
    doneFlags,
    reset,
    submit,
  };
}

export type VolunteerInterest = ReturnType<typeof useVolunteerInterest>;
