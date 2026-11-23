"use client";

import { useState } from "react";
import GardenSheet from "@/app/parent/_garden/sheet";
import { StepLabel, StepProgress } from "@/app/parent/_garden/ui";
import { CheckChipGroup, InlineError, SheetSaveFooter, TextArea } from "@/app/parent/_garden/fields";
import { celebrate, usePortalFeedback } from "@/app/parent/_garden/feedback";
import { useUnsavedGuard } from "@/app/parent/_garden/unsaved";
import { submitVolunteerInterest } from "@/app/actions/volunteer";

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

export const AVAILABILITY_OPTIONS = ["Weekday mornings", "Weekday afternoons", "Weekends", "Flexible / as needed"];

const MAX_TEXT = 2000;

/** Same messages as the server's zod schema (app/actions/volunteer.ts). */
const MSG = {
  skills: "Skills & experience is required",
  helpAreas: "Please select at least one area",
  availability: "Please select at least one time",
} as const;

type Touched = { skills: boolean; helpAreas: boolean; availability: boolean };
const UNTOUCHED: Touched = { skills: false, helpAreas: false, availability: false };

/**
 * "Express Interest in Volunteering" sheet, after the mobile VolunteerSheet:
 * four numbered steps that tick ✓ as they're filled, inline validation with the
 * server's own messages, and a submit that stays disabled until the form is valid.
 */
export default function VolunteerSheet({
  open,
  onClose,
  readOnlyPreview,
}: {
  open: boolean;
  onClose: () => void;
  readOnlyPreview?: boolean;
}) {
  const { runSave } = usePortalFeedback(readOnlyPreview);
  const [skills, setSkills] = useState("");
  const [helpAreas, setHelpAreas] = useState<string[]>([]);
  const [availability, setAvailability] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [touched, setTouched] = useState<Touched>(UNTOUCHED);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const done = [skills.trim().length > 0, helpAreas.length > 0, availability.length > 0];
  const valid = done.every(Boolean);
  const doneCount = done.filter(Boolean).length;
  const dirty = skills.trim() !== "" || helpAreas.length > 0 || availability.length > 0 || notes.trim() !== "";
  const guard = useUnsavedGuard(dirty && !submitting);

  const errors = {
    skills: touched.skills && !done[0] ? MSG.skills : null,
    helpAreas: touched.helpAreas && !done[1] ? MSG.helpAreas : null,
    availability: touched.availability && !done[2] ? MSG.availability : null,
  };
  const missing = [
    !done[0] && "Skills & Experience",
    !done[1] && "How You'd Like to Help",
    !done[2] && "Time Availability",
  ].filter(Boolean) as string[];

  // The step the parent is on: first unfinished required step, then the optional notes.
  const current = done[0] ? (done[1] ? (done[2] ? 4 : 3) : 2) : 1;

  function reset() {
    setSkills("");
    setHelpAreas([]);
    setAvailability([]);
    setNotes("");
    setTouched(UNTOUCHED);
    setServerError(null);
  }

  function requestClose() {
    if (submitting) return;
    guard.confirm(() => {
      reset();
      onClose();
    });
  }

  async function submit() {
    if (!valid || submitting) {
      setTouched({ skills: true, helpAreas: true, availability: true });
      return;
    }
    setSubmitting(true);
    setServerError(null);
    let message = "";
    const ok = await runSave({
      successTitle: "Thank you!",
      successMessage: "Thank you for your interest! We'll be in touch soon.",
      errorTitle: "Couldn't send your interest",
      retry: () => void submit(),
      fn: async () => {
        const result = await submitVolunteerInterest({
          skills: skills.trim(),
          helpAreas,
          availability,
          notes: notes.trim() || undefined,
        });
        message = result.message;
        return { ok: result.success, error: result.message };
      },
    });
    setSubmitting(false);
    if (ok) {
      void celebrate();
      reset();
      onClose();
    } else if (message) {
      setServerError(message);
    }
  }

  return (
    <>
      <GardenSheet
        open={open}
        onClose={requestClose}
        title="Volunteer Interest"
        icon="🙋"
        note={`${doneCount} of 3 done`}
        toolbar={<StepProgress current={current} total={4} labels={["Skills", "Help", "Time", "Notes"]} />}
        footer={
          <SheetSaveFooter
            label="Submit Interest"
            busy={submitting}
            disabled={!valid}
            onClick={() => void submit()}
            status={valid ? "Ready to send" : `Missing: ${missing.join(", ")}`}
          />
        }
      >
        <p className="mb-5 text-sm font-semibold text-[var(--sf-soft)]">Tell us how you&apos;d like to get involved.</p>
        {serverError ? (
          <div className="mb-5">
            <InlineError>{serverError}</InlineError>
          </div>
        ) : null}
        <form
          className="flex flex-col gap-7"
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <fieldset disabled={submitting} className="contents">
            <section>
              <StepLabel n={1} done={done[0]}>
                Skills &amp; Experience
              </StepLabel>
              <div onBlur={() => setTouched((t) => ({ ...t, skills: true }))}>
                <TextArea
                  label={<span className="sr-only">Skills &amp; Experience</span>}
                  required
                  rows={4}
                  value={skills}
                  onChange={setSkills}
                  maxLength={MAX_TEXT}
                  error={errors.skills}
                  placeholder="Describe any relevant skills or experience you have"
                  disabled={submitting}
                />
              </div>
            </section>

            <section>
              <StepLabel n={2} done={done[1]}>
                How You&apos;d Like to Help
              </StepLabel>
              <CheckChipGroup
                legend={<span className="sr-only">How You&apos;d Like to Help</span>}
                required
                options={HELP_AREAS}
                value={helpAreas}
                onChange={(v) => {
                  setHelpAreas(v);
                  setTouched((t) => ({ ...t, helpAreas: true }));
                }}
                error={errors.helpAreas}
                disabled={submitting}
              />
            </section>

            <section>
              <StepLabel n={3} done={done[2]}>
                Time Availability
              </StepLabel>
              <CheckChipGroup
                legend={<span className="sr-only">Time Availability</span>}
                required
                options={AVAILABILITY_OPTIONS}
                value={availability}
                onChange={(v) => {
                  setAvailability(v);
                  setTouched((t) => ({ ...t, availability: true }));
                }}
                error={errors.availability}
                disabled={submitting}
              />
            </section>

            <section>
              <StepLabel n={4} done={notes.trim().length > 0}>
                Additional Notes <span className="font-bold text-[var(--sf-soft)]/80">(optional)</span>
              </StepLabel>
              <TextArea
                label={<span className="sr-only">Additional Notes</span>}
                optional
                rows={3}
                value={notes}
                onChange={setNotes}
                maxLength={MAX_TEXT}
                placeholder="Anything else you'd like us to know?"
                disabled={submitting}
              />
            </section>
          </fieldset>
        </form>
      </GardenSheet>
      {guard.dialog}
    </>
  );
}
