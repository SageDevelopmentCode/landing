"use client";

import { useState } from "react";
import {
  blankPickupPerson,
  validatePickupPersonEntry,
  type EditablePickupPerson,
} from "@/app/components/authorized-pickup/PickupPersonForm";
import type { PickupPersonEntry } from "@/app/actions/saveAuthorizedPickup";
import { formatPhone } from "@/app/utils/formatPhone";
import GardenSheet from "@/app/parent/_garden/sheet";
import ConfirmDialog from "@/app/parent/_garden/ConfirmDialog";
import { EmptyState } from "@/app/parent/_garden/states";
import { KidAvatar, StepLabel, btnSageSm } from "@/app/parent/_garden/ui";
import type { AuthorizedPickupPlan } from "./childrenData";
import { IconButton, InfoRow, InlineError, PencilIcon, SectionCard, SheetSaveFooter, TextField, TrashIcon } from "./fields";
import type { SaveOutcome } from "./LearningTab";

export type PickupState = {
  plan: AuthorizedPickupPlan | null;
  persons: EditablePickupPerson[];
};

function PlusIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" aria-hidden="true">
      <path d="M10 4.5v11M4.5 10h11" />
    </svg>
  );
}

function PersonSheet({
  draft,
  mode,
  onClose,
  onSave,
}: {
  draft: EditablePickupPerson | null;
  mode: "add" | "edit";
  onClose: () => void;
  onSave: (p: EditablePickupPerson) => Promise<SaveOutcome>;
}) {
  const [local, setLocal] = useState<EditablePickupPerson | null>(draft);
  const [seed, setSeed] = useState<EditablePickupPerson | null>(draft);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (draft !== seed) {
    setSeed(draft);
    if (draft) {
      setLocal(draft);
      setError(null);
    }
  }

  const set = (field: keyof PickupPersonEntry) => (value: string) =>
    setLocal((p) => (p ? { ...p, [field]: field === "phone" ? formatPhone(value) : value } : p));

  const dirty =
    !!local && !!draft && (Object.keys(local) as (keyof EditablePickupPerson)[]).some((k) => local[k] !== draft[k]);
  const step1Done = !!local && !!local.fullName.trim() && !!local.relationship.trim() && !!local.phone.trim();

  async function submit() {
    if (!local || busy) return;
    const err = validatePickupPersonEntry(local);
    if (err) {
      setError(err);
      return;
    }
    setBusy(true);
    setError(null);
    const r = await onSave(local);
    setBusy(false);
    if (r.ok) onClose();
    else if (r.error) setError(r.error);
  }

  return (
    <GardenSheet
      open={!!draft}
      onClose={() => {
        if (!busy) onClose();
      }}
      icon="🚗"
      title={mode === "edit" ? "Edit Person" : "Add Person"}
      note={mode === "edit" ? local?.fullName || undefined : "someone you trust for pickup"}
      footer={
        <SheetSaveFooter
          label={mode === "edit" ? "Save Changes" : "Add Person"}
          busy={busy}
          disabled={mode === "edit" ? !dirty : !step1Done}
          onClick={() => void submit()}
          status={mode === "edit" ? (dirty ? "Unsaved changes" : "No changes yet") : step1Done ? "Ready to add" : "Name, relationship and phone are required"}
        />
      }
    >
      {local ? (
        <form
          className="flex flex-col gap-7 pt-2"
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <div>
            <StepLabel n={1} done={step1Done}>
              Who is picking up?
            </StepLabel>
            <div className="grid grid-cols-1 gap-3">
              <TextField data-autofocus label="Full Name" required value={local.fullName} onChange={set("fullName")} placeholder="Jane Smith" autoComplete="name" />
              <TextField label="Relationship" required value={local.relationship} onChange={set("relationship")} placeholder="Aunt" />
              <TextField label="Phone" required value={local.phone} onChange={set("phone")} placeholder="(555) 000-0000" type="tel" inputMode="tel" autoComplete="tel" />
            </div>
          </div>
          <div>
            <StepLabel n={2} done={!!local.email.trim() || !!local.dlStateIdNumber.trim()}>
              Contact &amp; ID
            </StepLabel>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <TextField label="Email" value={local.email} onChange={set("email")} placeholder="optional" type="email" autoComplete="email" />
              <TextField label="DL / State ID" value={local.dlStateIdNumber} onChange={set("dlStateIdNumber")} placeholder="optional" />
            </div>
          </div>
          <div>
            <StepLabel n={3} done={!!local.vehicleInfo.trim() || !!local.licensePlateState.trim()}>
              Vehicle
            </StepLabel>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <TextField label="Vehicle Info" value={local.vehicleInfo} onChange={set("vehicleInfo")} placeholder="optional" />
              <TextField label="License Plate State" value={local.licensePlateState} onChange={set("licensePlateState")} placeholder="optional" />
            </div>
          </div>
          <InlineError>{error}</InlineError>
          {/* Enter in any field submits. */}
          <button type="submit" className="hidden" tabIndex={-1} aria-hidden="true" />
        </form>
      ) : null}
    </GardenSheet>
  );
}

export default function PickupTab({
  pickup,
  canEdit,
  busyKey,
  onSavePerson,
  onRemovePerson,
  blockedByPreview,
}: {
  pickup: PickupState;
  canEdit: boolean;
  /** `_key` of the person being saved/removed (or "new"), for per-row spinners. */
  busyKey: string | null;
  onSavePerson: (p: EditablePickupPerson, mode: "add" | "edit") => Promise<SaveOutcome>;
  onRemovePerson: (p: EditablePickupPerson) => Promise<boolean>;
  blockedByPreview: () => boolean;
}) {
  const [draft, setDraft] = useState<EditablePickupPerson | null>(null);
  const [mode, setMode] = useState<"add" | "edit">("add");
  const [confirming, setConfirming] = useState<EditablePickupPerson | null>(null);
  const { persons, plan } = pickup;

  function openAdd() {
    if (blockedByPreview()) return;
    setMode("add");
    setDraft(blankPickupPerson());
  }
  function openEdit(p: EditablePickupPerson) {
    if (blockedByPreview()) return;
    setMode("edit");
    setDraft({ ...p });
  }
  function askRemove(p: EditablePickupPerson) {
    if (blockedByPreview()) return;
    setConfirming(p);
  }
  async function confirmRemove() {
    if (!confirming) return;
    // Close either way: a failure shows an error toast with "Try again".
    await onRemovePerson(confirming);
    setConfirming(null);
  }

  const anyBusy = busyKey !== null;

  return (
    <div className="flex flex-col gap-8">
      <section aria-labelledby="pickup-persons">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 id="pickup-persons" className="sf-display text-2xl leading-tight">
            Authorized Persons{persons.length > 0 ? ` (${persons.length})` : ""}
          </h3>
          {canEdit && persons.length > 0 ? (
            <button type="button" onClick={openAdd} className={btnSageSm} disabled={anyBusy}>
              <PlusIcon />
              Add person
            </button>
          ) : null}
        </div>

        {persons.length === 0 ? (
          <EmptyState
            emoji="🚗"
            tint="peach"
            title="No authorized pickup persons on file."
            action={
              canEdit ? (
                <button type="button" onClick={openAdd} className={btnSageSm} disabled={anyBusy}>
                  <PlusIcon />
                  Add person
                </button>
              ) : null
            }
          />
        ) : (
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {persons.map((p) => {
              const rowBusy = busyKey === p._key;
              const extra = [
                p.email ? { label: "Email", value: p.email } : null,
                p.dlStateIdNumber ? { label: "DL / State ID", value: p.dlStateIdNumber } : null,
                p.vehicleInfo ? { label: "Vehicle", value: p.vehicleInfo } : null,
                p.licensePlateState ? { label: "License Plate State", value: p.licensePlateState } : null,
              ].filter((x): x is { label: string; value: string } => !!x);
              return (
                <li
                  key={p._key}
                  className={`flex min-w-0 items-start gap-3 rounded-[24px] bg-white px-4 py-4 shadow-[0_12px_30px_-24px_rgba(43,42,38,0.55)] ring-1 ring-[var(--sf-ink)]/[0.06] transition-opacity ${rowBusy ? "opacity-60" : ""}`}
                >
                  <KidAvatar id={p._key} name={p.fullName || "?"} size="h-12 w-12 text-sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-extrabold leading-tight">{p.fullName}</p>
                    <p className="mt-0.5 truncate text-sm font-bold text-[var(--sf-soft)]">
                      {[p.relationship, p.phone].filter(Boolean).join(" · ")}
                    </p>
                    {extra.length > 0 ? (
                      <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-1 text-xs">
                        {extra.map((x) => (
                          <div key={x.label} className="flex min-w-0 gap-1.5">
                            <dt className="shrink-0 font-extrabold text-[var(--sf-soft)]/80">{x.label}:</dt>
                            <dd className="min-w-0 truncate font-bold text-[var(--sf-ink)]">{x.value}</dd>
                          </div>
                        ))}
                      </dl>
                    ) : null}
                  </div>
                  {canEdit ? (
                    <div className="-mr-1 -mt-1 flex shrink-0">
                      <IconButton label={`Edit ${p.fullName}`} onClick={() => openEdit(p)} disabled={anyBusy}>
                        <PencilIcon className="h-4 w-4" />
                      </IconButton>
                      <IconButton label={`Remove ${p.fullName}`} tone="coral" onClick={() => askRemove(p)} busy={rowBusy} disabled={anyBusy}>
                        <TrashIcon />
                      </IconButton>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {plan ? (
        <SectionCard emoji="🗓️" title="Pickup Plan">
          <dl>
            <InfoRow label="Date of Request" value={plan.date_of_request ?? null} />
            <InfoRow label="Effective Until" value={plan.effective_until ?? null} />
          </dl>
        </SectionCard>
      ) : null}

      <PersonSheet draft={draft} mode={mode} onClose={() => setDraft(null)} onSave={(p) => onSavePerson(p, mode)} />
      <ConfirmDialog
        open={!!confirming}
        onClose={() => setConfirming(null)}
        onConfirm={() => void confirmRemove()}
        title={confirming ? `Remove ${confirming.fullName}?` : "Remove this person?"}
        body="They'll be taken off the authorized pickup list."
        confirmLabel="Remove"
        busyLabel="Removing…"
        busy={!!confirming && busyKey === confirming._key}
      />
    </div>
  );
}
