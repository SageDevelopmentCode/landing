"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import {
  cssColors as colors,
  cssShadows as shadows,
  radius,
} from "../../design-system";
import {
  PRIORITIES,
  PRIORITY_CODES,
  STATUSES,
  STATUS_ORDER,
  formatWeekRange,
} from "../budget-math";
import type {
  BudgetItem,
  BudgetItemPatch,
  ItemStatus,
  PriorityCode,
  TimelinePhase,
  TimelinePhasePatch,
} from "../types";

export type EditTarget = { kind: "item" | "phase"; id: string };

const inputStyle = {
  backgroundColor: colors.surface,
  border: `1px solid ${colors.border}`,
  borderRadius: radius.md,
  color: colors.textPrimary,
} as const;

const inputClass = "w-full text-sm px-3 py-2 outline-none";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span
        className="block text-[11px] font-semibold uppercase tracking-wider mb-1"
        style={{ color: colors.textTertiary }}
      >
        {label}
      </span>
      {children}
      {hint && (
        <span
          className="block text-[11px] mt-1"
          style={{ color: colors.textTertiary }}
        >
          {hint}
        </span>
      )}
    </label>
  );
}

function TextArea({
  value,
  onChange,
  rows = 2,
}: {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      className={`${inputClass} resize-y`}
      style={inputStyle}
    />
  );
}

function parseUsd(value: string): number | null {
  const n = Number(value.replace(/[$,\s]/g, ""));
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function parseWeek(value: string): number | null {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= 260 ? n : null;
}

function WeekFields({
  projectStartDate,
  startWeek,
  endWeek,
  onStart,
  onEnd,
}: {
  projectStartDate: string;
  startWeek: string;
  endWeek: string;
  onStart: (v: string) => void;
  onEnd: (v: string) => void;
}) {
  const s = parseWeek(startWeek);
  const e = parseWeek(endWeek);
  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Start week">
          <input
            type="number"
            min={1}
            value={startWeek}
            onChange={(ev) => onStart(ev.target.value)}
            className={inputClass}
            style={inputStyle}
          />
        </Field>
        <Field label="End week">
          <input
            type="number"
            min={1}
            value={endWeek}
            onChange={(ev) => onEnd(ev.target.value)}
            className={inputClass}
            style={inputStyle}
          />
        </Field>
      </div>
      <p className="text-xs mt-1.5" style={{ color: colors.textSecondary }}>
        {s && e && e >= s
          ? formatWeekRange(projectStartDate, s, e, true)
          : "End week must be on or after start week"}
      </p>
    </div>
  );
}

function ItemForm({
  item,
  categories,
  projectStartDate,
  onSave,
  onClose,
}: {
  item: BudgetItem;
  categories: string[];
  projectStartDate: string;
  onSave: (id: string, patch: BudgetItemPatch) => Promise<boolean>;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState({
    category: item.category,
    scope: item.scope,
    favorableUsd: String(item.favorableUsd),
    workingUsd: String(item.workingUsd),
    difficultUsd: String(item.difficultUsd),
    priorityCode: item.priorityCode,
    startWeek: String(item.startWeek),
    endWeek: String(item.endWeek),
    status: item.status,
    actualSpentUsd: String(item.actualSpentUsd),
    includedInBudget: item.includedInBudget,
    activities: item.activities ?? "",
    completionGate: item.completionGate ?? "",
    dependencies: item.dependencies ?? "",
    exclusions: item.exclusions ?? "",
    notes: item.notes ?? "",
    deferralRule: item.deferralRule ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof typeof draft>(key: K, value: (typeof draft)[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  async function handleSave() {
    const favorableUsd = parseUsd(draft.favorableUsd);
    const workingUsd = parseUsd(draft.workingUsd);
    const difficultUsd = parseUsd(draft.difficultUsd);
    const actualSpentUsd = parseUsd(draft.actualSpentUsd || "0");
    const startWeek = parseWeek(draft.startWeek);
    const endWeek = parseWeek(draft.endWeek);

    if (!draft.scope.trim() || !draft.category.trim()) {
      return setError("Scope and category are required");
    }
    if (
      favorableUsd === null ||
      workingUsd === null ||
      difficultUsd === null ||
      actualSpentUsd === null
    ) {
      return setError("Dollar amounts must be zero or more");
    }
    if (startWeek === null || endWeek === null || endWeek < startWeek) {
      return setError("Check the start and end weeks");
    }

    setError(null);
    setSaving(true);
    const ok = await onSave(item.id, {
      category: draft.category.trim(),
      scope: draft.scope.trim(),
      favorableUsd,
      workingUsd,
      difficultUsd,
      priorityCode: draft.priorityCode,
      startWeek,
      endWeek,
      status: draft.status,
      actualSpentUsd,
      includedInBudget: draft.includedInBudget,
      activities: draft.activities.trim() || null,
      completionGate: draft.completionGate.trim() || null,
      dependencies: draft.dependencies.trim() || null,
      exclusions: draft.exclusions.trim() || null,
      notes: draft.notes.trim() || null,
      deferralRule: draft.deferralRule.trim() || null,
    });
    setSaving(false);
    if (ok) onClose();
    else setError("Couldn't save. Check the values and try again.");
  }

  return (
    <DrawerShell
      eyebrow={item.code}
      title={item.scope}
      error={error}
      saving={saving}
      onSave={handleSave}
      onClose={onClose}
    >
      <label
        className="flex items-start gap-3 rounded-lg p-3 cursor-pointer"
        style={{
          backgroundColor: colors.elevated,
          border: `1px solid ${colors.border}`,
        }}
      >
        <input
          type="checkbox"
          checked={draft.includedInBudget}
          onChange={(e) => set("includedInBudget", e.target.checked)}
          className="mt-0.5 h-4 w-4 cursor-pointer accent-[var(--admin-accent)]"
        />
        <span>
          <span
            className="block text-sm font-medium"
            style={{ color: colors.textPrimary }}
          >
            Include in budget totals
          </span>
          <span className="text-xs" style={{ color: colors.textSecondary }}>
            When off, this item stays on the timeline and in the list but does
            not count toward category totals, opening packages, or contingency.
          </span>
        </span>
      </label>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Status">
          <select
            value={draft.status}
            onChange={(e) => set("status", e.target.value as ItemStatus)}
            className={inputClass}
            style={inputStyle}
          >
            {STATUS_ORDER.map((value) => (
              <option key={value} value={value}>
                {STATUSES[value].label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Actual spent ($)">
          <input
            inputMode="decimal"
            value={draft.actualSpentUsd}
            onChange={(e) => set("actualSpentUsd", e.target.value)}
            className={inputClass}
            style={inputStyle}
          />
        </Field>
      </div>

      <Field label="Scope">
        <input
          value={draft.scope}
          onChange={(e) => set("scope", e.target.value)}
          className={inputClass}
          style={inputStyle}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Category">
          <input
            list="property-categories"
            value={draft.category}
            onChange={(e) => set("category", e.target.value)}
            className={inputClass}
            style={inputStyle}
          />
          <datalist id="property-categories">
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </Field>
        <Field label="Priority">
          <select
            value={draft.priorityCode}
            onChange={(e) => set("priorityCode", e.target.value as PriorityCode)}
            className={inputClass}
            style={inputStyle}
          >
            {PRIORITY_CODES.map((code) => (
              <option key={code} value={code}>
                {code} · {PRIORITIES[code].label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div>
        <span
          className="block text-[11px] font-semibold uppercase tracking-wider mb-1"
          style={{ color: colors.textTertiary }}
        >
          Estimate ($, before contingency)
        </span>
        <div className="grid grid-cols-3 gap-3">
          {(
            [
              ["favorableUsd", "Favorable"],
              ["workingUsd", "Working"],
              ["difficultUsd", "Difficult"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="block">
              <span
                className="block text-[11px] mb-1"
                style={{ color: colors.textSecondary }}
              >
                {label}
              </span>
              <input
                inputMode="decimal"
                value={draft[key]}
                onChange={(e) => set(key, e.target.value)}
                className={inputClass}
                style={inputStyle}
              />
            </label>
          ))}
        </div>
      </div>

      <WeekFields
        projectStartDate={projectStartDate}
        startWeek={draft.startWeek}
        endWeek={draft.endWeek}
        onStart={(v) => set("startWeek", v)}
        onEnd={(v) => set("endWeek", v)}
      />

      <Field label="Activities">
        <TextArea value={draft.activities} onChange={(v) => set("activities", v)} />
      </Field>
      <Field label="Done when">
        <TextArea
          value={draft.completionGate}
          onChange={(v) => set("completionGate", v)}
        />
      </Field>
      <Field label="Depends on">
        <TextArea
          value={draft.dependencies}
          onChange={(v) => set("dependencies", v)}
        />
      </Field>
      <Field label="Not included">
        <TextArea value={draft.exclusions} onChange={(v) => set("exclusions", v)} />
      </Field>
      <Field label="Notes">
        <TextArea value={draft.notes} onChange={(v) => set("notes", v)} rows={3} />
      </Field>
      <Field label="Deferral rule">
        <TextArea
          value={draft.deferralRule}
          onChange={(v) => set("deferralRule", v)}
        />
      </Field>
    </DrawerShell>
  );
}

function PhaseForm({
  phase,
  projectStartDate,
  onSave,
  onClose,
}: {
  phase: TimelinePhase;
  projectStartDate: string;
  onSave: (id: string, patch: TimelinePhasePatch) => Promise<boolean>;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState({
    name: phase.name,
    startWeek: String(phase.startWeek),
    endWeek: String(phase.endWeek),
    activities: phase.activities ?? "",
    completionGate: phase.completionGate ?? "",
    dependencies: phase.dependencies ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof typeof draft>(key: K, value: string) =>
    setDraft((d) => ({ ...d, [key]: value }));

  async function handleSave() {
    const startWeek = parseWeek(draft.startWeek);
    const endWeek = parseWeek(draft.endWeek);
    if (!draft.name.trim()) return setError("Name is required");
    if (startWeek === null || endWeek === null || endWeek < startWeek) {
      return setError("Check the start and end weeks");
    }
    setError(null);
    setSaving(true);
    const ok = await onSave(phase.id, {
      name: draft.name.trim(),
      startWeek,
      endWeek,
      activities: draft.activities.trim() || null,
      completionGate: draft.completionGate.trim() || null,
      dependencies: draft.dependencies.trim() || null,
    });
    setSaving(false);
    if (ok) onClose();
    else setError("Couldn't save. Check the values and try again.");
  }

  return (
    <DrawerShell
      eyebrow={`Phase ${phase.code}`}
      title={phase.name}
      error={error}
      saving={saving}
      onSave={handleSave}
      onClose={onClose}
    >
      <Field label="Name">
        <input
          value={draft.name}
          onChange={(e) => set("name", e.target.value)}
          className={inputClass}
          style={inputStyle}
        />
      </Field>
      <WeekFields
        projectStartDate={projectStartDate}
        startWeek={draft.startWeek}
        endWeek={draft.endWeek}
        onStart={(v) => set("startWeek", v)}
        onEnd={(v) => set("endWeek", v)}
      />
      <Field label="Activities">
        <TextArea
          value={draft.activities}
          onChange={(v) => set("activities", v)}
          rows={3}
        />
      </Field>
      <Field label="Done when">
        <TextArea
          value={draft.completionGate}
          onChange={(v) => set("completionGate", v)}
        />
      </Field>
      <Field label="Depends on">
        <TextArea
          value={draft.dependencies}
          onChange={(v) => set("dependencies", v)}
        />
      </Field>
    </DrawerShell>
  );
}

function DrawerShell({
  eyebrow,
  title,
  error,
  saving,
  onSave,
  onClose,
  children,
}: {
  eyebrow: string;
  title: string;
  error: string | null;
  saving: boolean;
  onSave: () => void;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="flex h-full flex-col">
      <div
        className="flex items-start justify-between gap-3 px-5 py-4"
        style={{ borderBottom: `1px solid ${colors.border}` }}
      >
        <div className="min-w-0">
          <div className="text-xs font-medium" style={{ color: colors.textTertiary }}>
            {eyebrow}
          </div>
          <h2
            className="text-base font-semibold leading-snug"
            style={{ color: colors.textPrimary }}
          >
            {title}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="p-1 rounded-md cursor-pointer"
          style={{ color: colors.textTertiary }}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <form
        className="flex-1 overflow-y-auto px-5 py-4 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          onSave();
        }}
        id="property-edit-form"
      >
        {children}
      </form>

      <div
        className="px-5 py-3 flex items-center justify-between gap-3"
        style={{ borderTop: `1px solid ${colors.border}` }}
      >
        <span className="text-xs" style={{ color: colors.error }}>
          {error}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-sm font-medium cursor-pointer"
            style={{
              borderRadius: radius.md,
              border: `1px solid ${colors.border}`,
              color: colors.textSecondary,
              backgroundColor: colors.surface,
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="property-edit-form"
            disabled={saving}
            className="px-4 py-1.5 text-sm font-medium text-white cursor-pointer disabled:opacity-60"
            style={{ borderRadius: radius.md, backgroundColor: colors.accent }}
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function EditItemDrawer({
  item,
  phase,
  categories,
  projectStartDate,
  onClose,
  onSaveItem,
  onSavePhase,
}: {
  item: BudgetItem | null;
  phase: TimelinePhase | null;
  categories: string[];
  projectStartDate: string;
  onClose: () => void;
  onSaveItem: (id: string, patch: BudgetItemPatch) => Promise<boolean>;
  onSavePhase: (id: string, patch: TimelinePhasePatch) => Promise<boolean>;
}) {
  const open = Boolean(item || phase);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="property-drawer-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-40 bg-black/25 backdrop-blur-[2px]"
            onClick={onClose}
          />
          <motion.aside
            key="property-drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 320 }}
            className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-md"
            style={{
              backgroundColor: colors.surface,
              borderLeft: `1px solid ${colors.border}`,
              boxShadow: shadows.large,
            }}
            role="dialog"
            aria-modal="true"
          >
            {item ? (
              <ItemForm
                key={item.id}
                item={item}
                categories={categories}
                projectStartDate={projectStartDate}
                onSave={onSaveItem}
                onClose={onClose}
              />
            ) : phase ? (
              <PhaseForm
                key={phase.id}
                phase={phase}
                projectStartDate={projectStartDate}
                onSave={onSavePhase}
                onClose={onClose}
              />
            ) : null}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
