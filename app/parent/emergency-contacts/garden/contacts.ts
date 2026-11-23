import type { ParentEmergencyContactsRecord } from "@/app/lib/get-emergency-contacts";
import type { HomeTint } from "@/app/parent/_garden/ui";

export type CardKey = "g1" | "g2" | "in_state" | "out_of_state";

export type FieldKey = "full_name" | "relationship" | "email" | "cell_phone" | "work_phone" | "phone";

export type Draft = Partial<Record<FieldKey, string>>;

export type CardMeta = {
  title: string;
  emoji: string;
  tint: HomeTint;
  fields: { key: FieldKey; label: string; kind: "text" | "email" | "phone" }[];
};

export const CARD_ORDER: CardKey[] = ["g1", "g2", "in_state", "out_of_state"];

const GUARDIAN_FIELDS: CardMeta["fields"] = [
  { key: "full_name", label: "Full Name", kind: "text" },
  { key: "relationship", label: "Relationship", kind: "text" },
  { key: "email", label: "Email", kind: "email" },
  { key: "cell_phone", label: "Cell Phone", kind: "phone" },
  { key: "work_phone", label: "Work Phone", kind: "phone" },
];

const CONTACT_FIELDS: CardMeta["fields"] = [
  { key: "full_name", label: "Name", kind: "text" },
  { key: "relationship", label: "Relationship", kind: "text" },
  { key: "phone", label: "Phone", kind: "phone" },
];

export const CARD_META: Record<CardKey, CardMeta> = {
  g1: { title: "Guardian 1", emoji: "🧡", tint: "peach", fields: GUARDIAN_FIELDS },
  g2: { title: "Guardian 2", emoji: "💙", tint: "sky", fields: GUARDIAN_FIELDS },
  in_state: { title: "In-State Contact", emoji: "🏡", tint: "mint", fields: CONTACT_FIELDS },
  out_of_state: { title: "Out-of-State Contact", emoji: "✈️", tint: "lav", fields: CONTACT_FIELDS },
};

/** Current saved values for one card, in the draft shape. */
export function draftFor(c: ParentEmergencyContactsRecord, card: CardKey): Draft {
  switch (card) {
    case "g1":
      return {
        full_name: c.g1_full_name ?? "",
        relationship: c.g1_relationship ?? "",
        email: c.g1_email ?? "",
        cell_phone: c.g1_cell_phone ?? "",
        work_phone: c.g1_work_phone ?? "",
      };
    case "g2":
      return {
        full_name: c.g2_full_name ?? "",
        relationship: c.g2_relationship ?? "",
        email: c.g2_email ?? "",
        cell_phone: c.g2_cell_phone ?? "",
        work_phone: c.g2_work_phone ?? "",
      };
    case "in_state":
      return {
        full_name: c.in_state_contact_name ?? "",
        relationship: c.in_state_contact_relation ?? "",
        phone: c.in_state_contact_phone ?? "",
      };
    case "out_of_state":
      return {
        full_name: c.out_of_state_contact_name ?? "",
        relationship: c.out_of_state_contact_relation ?? "",
        phone: c.out_of_state_contact_phone ?? "",
      };
  }
}

/** Apply a saved draft back onto the record (empty strings become null, as the server stores them). */
export function applyDraft(c: ParentEmergencyContactsRecord, card: CardKey, d: Draft): ParentEmergencyContactsRecord {
  const v = (k: FieldKey) => d[k] || null;
  switch (card) {
    case "g1":
    case "g2":
      return {
        ...c,
        [`${card}_full_name`]: v("full_name"),
        [`${card}_relationship`]: v("relationship"),
        [`${card}_email`]: v("email"),
        [`${card}_cell_phone`]: v("cell_phone"),
        [`${card}_work_phone`]: v("work_phone"),
      };
    case "in_state":
      return {
        ...c,
        in_state_contact_name: v("full_name"),
        in_state_contact_relation: v("relationship"),
        in_state_contact_phone: v("phone"),
      };
    case "out_of_state":
      return {
        ...c,
        out_of_state_contact_name: v("full_name"),
        out_of_state_contact_relation: v("relationship"),
        out_of_state_contact_phone: v("phone"),
      };
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Inline validation. Only fields the parent changed are checked, so legacy values never block a save. */
export function validate(meta: CardMeta, draft: Draft, original: Draft): Partial<Record<FieldKey, string>> {
  const errors: Partial<Record<FieldKey, string>> = {};
  for (const f of meta.fields) {
    const value = (draft[f.key] ?? "").trim();
    if (!value || value === (original[f.key] ?? "").trim()) continue;
    if (f.kind === "email" && !EMAIL_RE.test(value)) errors[f.key] = "Enter a valid email address, like name@example.com";
    if (f.kind === "phone" && value.replace(/\D/g, "").length !== 10) errors[f.key] = "Enter a 10-digit phone number";
  }
  return errors;
}

export function isDirty(meta: CardMeta, draft: Draft, original: Draft) {
  return meta.fields.some((f) => (draft[f.key] ?? "").trim() !== (original[f.key] ?? "").trim());
}
