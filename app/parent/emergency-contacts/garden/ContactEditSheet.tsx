"use client";

import { useState } from "react";
import GardenSheet from "@/app/parent/_garden/sheet";
import { InlineError, PhoneField, SheetSaveFooter, TextField } from "@/app/parent/_garden/fields";
import { usePortalFeedback } from "@/app/parent/_garden/feedback";
import { useUnsavedGuard } from "@/app/parent/_garden/unsaved";
import { firstNameOf } from "@/app/parent/_garden/ui";
import type { ParentEmergencyContactsRecord } from "@/app/lib/get-emergency-contacts";
import { updateEmergencyContacts } from "@/app/actions/updateEmergencyContacts";
import { updateEmergencyContactsGuardian } from "@/app/actions/updateEmergencyContactsGuardian";
import { CARD_META, applyDraft, draftFor, isDirty, validate, type CardKey, type Draft, type FieldKey } from "./contacts";

export type EditTarget = { card: CardKey; record: ParentEmergencyContactsRecord };

/**
 * Edit one contact card in a sheet. Keeps both existing write actions:
 * guardians → updateEmergencyContactsGuardian; in-state / out-of-state →
 * updateEmergencyContacts, which always sends both contacts (the untouched one as saved).
 */
export default function ContactEditSheet({
  target,
  open,
  onClose,
  onSaved,
  readOnlyPreview,
}: {
  target: EditTarget | null;
  open: boolean;
  onClose: () => void;
  onSaved: (record: ParentEmergencyContactsRecord) => void;
  readOnlyPreview?: boolean;
}) {
  const { runSave } = usePortalFeedback(readOnlyPreview);
  const [draft, setDraft] = useState<Draft>({});
  const [loadedFor, setLoadedFor] = useState<EditTarget | null>(null);
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [showErrors, setShowErrors] = useState<Partial<Record<FieldKey, boolean>>>({});

  // Reset the draft whenever a new card is opened (adjust state during render, no effect).
  if (target && target !== loadedFor) {
    setLoadedFor(target);
    setDraft(draftFor(target.record, target.card));
    setServerError(null);
    setShowErrors({});
  }

  const meta = target ? CARD_META[target.card] : null;
  const original = target ? draftFor(target.record, target.card) : {};
  const dirty = meta ? isDirty(meta, draft, original) : false;
  const errors = meta ? validate(meta, draft, original) : {};
  const hasErrors = Object.keys(errors).length > 0;
  const guard = useUnsavedGuard(open && dirty && !saving);
  const childFirst = target?.record.studentName ? firstNameOf(target.record.studentName) : "your child";

  function requestClose() {
    if (saving) return;
    guard.confirm(onClose);
  }

  async function save() {
    if (!target || !meta || saving) return;
    if (hasErrors) {
      setShowErrors(Object.fromEntries(meta.fields.map((f) => [f.key, true])));
      return;
    }
    if (!dirty) return;
    const { card, record } = target;
    const clean = Object.fromEntries(Object.entries(draft).map(([k, v]) => [k, (v ?? "").trim()])) as Draft;
    setSaving(true);
    setServerError(null);
    let error: string | undefined;
    const ok = await runSave({
      successTitle: `${meta.title} updated · ${childFirst}`,
      errorTitle: `Couldn't save ${meta.title}`,
      retry: () => void save(),
      fn: async () => {
        let result: { error?: string };
        if (card === "g1" || card === "g2") {
          result = await updateEmergencyContactsGuardian({
            studentId: record.studentId,
            guardian: card,
            full_name: clean.full_name ?? "",
            email: clean.email ?? "",
            cell_phone: clean.cell_phone ?? "",
            work_phone: clean.work_phone ?? "",
            relationship: clean.relationship ?? "",
          });
        } else {
          const inState = card === "in_state" ? clean : draftFor(record, "in_state");
          const outOfState = card === "out_of_state" ? clean : draftFor(record, "out_of_state");
          result = await updateEmergencyContacts({
            studentId: record.studentId,
            inStateContactName: inState.full_name ?? "",
            inStateContactRelation: inState.relationship ?? "",
            inStateContactPhone: inState.phone ?? "",
            outOfStateContactName: outOfState.full_name ?? "",
            outOfStateContactRelation: outOfState.relationship ?? "",
            outOfStateContactPhone: outOfState.phone ?? "",
          });
        }
        error = result.error;
        return { ok: !result.error, error: result.error };
      },
    });
    setSaving(false);
    if (ok) {
      onSaved(applyDraft(record, card, clean));
      onClose();
    } else if (error) {
      setServerError(error);
    }
  }

  const status = !dirty ? "No changes yet" : hasErrors ? "Fix the highlighted fields to save" : "Unsaved changes";

  return (
    <>
      <GardenSheet
        open={open}
        onClose={requestClose}
        title={meta ? `Edit ${meta.title}` : "Edit"}
        icon={meta?.emoji}
        note={target?.record.studentName ? `for ${childFirst}` : undefined}
        footer={<SheetSaveFooter label="Save" busy={saving} disabled={!dirty || hasErrors} onClick={() => void save()} status={status} />}
      >
        {meta ? (
          <form
            className="flex flex-col gap-4"
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              void save();
            }}
          >
            {serverError ? <InlineError>{serverError}</InlineError> : null}
            <fieldset disabled={saving} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {meta.fields.map((f, i) => {
                const common = {
                  label: f.label,
                  value: draft[f.key] ?? "",
                  onChange: (v: string) => setDraft((d) => ({ ...d, [f.key]: v })),
                  onBlur: () => setShowErrors((s) => ({ ...s, [f.key]: true })),
                  error: showErrors[f.key] ? errors[f.key] : null,
                  className: undefined,
                  "data-autofocus": i === 0 ? true : undefined,
                };
                const wide = f.kind === "email";
                return (
                  <div key={f.key} className={wide ? "sm:col-span-2" : ""}>
                    {f.kind === "phone" ? (
                      <PhoneField {...common} />
                    ) : (
                      <TextField
                        {...common}
                        type={f.kind === "email" ? "email" : "text"}
                        inputMode={f.kind === "email" ? "email" : undefined}
                        autoComplete={f.kind === "email" ? "email" : f.key === "full_name" ? "name" : "off"}
                      />
                    )}
                  </div>
                );
              })}
            </fieldset>
            {/* Lets Enter submit from any field. */}
            <button type="submit" className="sr-only" tabIndex={-1} aria-hidden="true">
              Save
            </button>
          </form>
        ) : null}
      </GardenSheet>
      {guard.dialog}
    </>
  );
}
