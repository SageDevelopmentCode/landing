"use client";

import { useMemo, useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { cssColors as colors, radius } from "../design-system";
import {
  updatePropertyBudgetItem,
  updatePropertyProjectSettings,
  updatePropertyTimelinePhase,
} from "./actions";
import { SCENARIOS, formatUsd } from "./budget-math";
import { CategoryBreakdown } from "./components/CategoryBreakdown";
import { EditItemDrawer, type EditTarget } from "./components/EditItemDrawer";
import { LineItemsTable } from "./components/LineItemsTable";
import { PriorityBreakdown } from "./components/PriorityBreakdown";
import { ProjectTimeline } from "./components/ProjectTimeline";
import { SummaryCards } from "./components/SummaryCards";
import { Card } from "./components/ui";
import type {
  BudgetItem,
  BudgetItemPatch,
  ProjectSettings,
  Scenario,
  TimelinePhase,
  TimelinePhasePatch,
} from "./types";

export function PropertyBudgetClient({
  address,
  initialItems,
  initialPhases,
  initialSettings,
}: {
  address: string;
  initialItems: BudgetItem[];
  initialPhases: TimelinePhase[];
  initialSettings: ProjectSettings;
}) {
  const [items, setItems] = useState(initialItems);
  const [phases, setPhases] = useState(initialPhases);
  const [settings, setSettings] = useState(initialSettings);
  const [startDateDraft, setStartDateDraft] = useState(
    initialSettings.projectStartDate,
  );
  const [scenario, setScenario] = useState<Scenario>("working");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showNotes, setShowNotes] = useState(false);

  const categories = useMemo(
    () => Array.from(new Set(items.map((item) => item.category))),
    [items],
  );

  async function saveItem(id: string, patch: BudgetItemPatch) {
    const previous = items.find((item) => item.id === id);
    if (!previous) return false;
    setSaveError(null);
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
    const result = await updatePropertyBudgetItem(id, patch);
    if (!result.ok) {
      setItems((current) =>
        current.map((item) => (item.id === id ? previous : item)),
      );
      setSaveError(`${previous.code}: ${result.error}`);
      return false;
    }
    return true;
  }

  async function savePhase(id: string, patch: TimelinePhasePatch) {
    const previous = phases.find((phase) => phase.id === id);
    if (!previous) return false;
    setSaveError(null);
    setPhases((current) =>
      current.map((phase) => (phase.id === id ? { ...phase, ...patch } : phase)),
    );
    const result = await updatePropertyTimelinePhase(id, patch);
    if (!result.ok) {
      setPhases((current) =>
        current.map((phase) => (phase.id === id ? previous : phase)),
      );
      setSaveError(`${previous.name}: ${result.error}`);
      return false;
    }
    return true;
  }

  async function saveStartDate(projectStartDate: string) {
    const previous = settings.projectStartDate;
    setSaveError(null);
    setSettings((current) => ({ ...current, projectStartDate }));
    const result = await updatePropertyProjectSettings({ projectStartDate });
    if (!result.ok) {
      setSettings((current) => ({ ...current, projectStartDate: previous }));
      setStartDateDraft(previous);
      setSaveError(`Start date: ${result.error}`);
    }
  }

  const editingItem =
    editTarget?.kind === "item"
      ? items.find((item) => item.id === editTarget.id) ?? null
      : null;
  const editingPhase =
    editTarget?.kind === "phase"
      ? phases.find((phase) => phase.id === editTarget.id) ?? null
      : null;

  const excludedCount = items.filter((item) => !item.includedInBudget).length;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1
            className="text-xl font-semibold"
            style={{ color: colors.textPrimary }}
          >
            New Property · Budget & Timeline
          </h1>
          <p className="text-sm mt-1" style={{ color: colors.textTertiary }}>
            {address} · conversion plan for opening the Hutto campus
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1">
            <span
              className="text-[11px] font-semibold uppercase tracking-wider"
              style={{ color: colors.textTertiary }}
            >
              Week 1 starts
            </span>
            <input
              type="date"
              value={startDateDraft}
              onChange={(e) => setStartDateDraft(e.target.value)}
              onBlur={() => {
                if (
                  /^20\d{2}-\d{2}-\d{2}$/.test(startDateDraft) &&
                  startDateDraft !== settings.projectStartDate
                ) {
                  saveStartDate(startDateDraft);
                } else {
                  setStartDateDraft(settings.projectStartDate);
                }
              }}
              className="text-sm px-3 py-1.5 outline-none"
              style={{
                backgroundColor: colors.surface,
                border: `1px solid ${colors.border}`,
                borderRadius: radius.md,
                color: colors.textPrimary,
              }}
            />
          </label>

          <div className="flex flex-col gap-1">
            <span
              className="text-[11px] font-semibold uppercase tracking-wider"
              style={{ color: colors.textTertiary }}
            >
              Cost scenario
            </span>
            <div
              className="flex p-0.5"
              role="radiogroup"
              aria-label="Cost scenario"
              style={{
                backgroundColor: colors.elevated,
                border: `1px solid ${colors.border}`,
                borderRadius: radius.md,
              }}
            >
              {SCENARIOS.map((option) => {
                const active = option.id === scenario;
                return (
                  <button
                    key={option.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setScenario(option.id)}
                    className="px-3 py-1 text-sm font-medium transition-colors cursor-pointer"
                    style={{
                      borderRadius: radius.sm,
                      backgroundColor: active ? colors.surface : "transparent",
                      color: active ? colors.accent : colors.textSecondary,
                      boxShadow: active ? "0 1px 2px rgba(0,0,0,0.08)" : "none",
                    }}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </header>

      {excludedCount > 0 && (
        <p className="text-sm -mt-2" style={{ color: colors.textSecondary }}>
          {excludedCount} item{excludedCount === 1 ? "" : "s"} excluded · totals
          below reflect your active plan only
        </p>
      )}

      {saveError && (
        <div
          className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm rounded-lg"
          style={{
            backgroundColor: colors.errorBg,
            border: `1px solid ${colors.errorBorder}`,
            color: colors.error,
          }}
        >
          <span>Couldn&apos;t save. {saveError}</span>
          <button
            type="button"
            onClick={() => setSaveError(null)}
            aria-label="Dismiss"
            className="cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <SummaryCards
        items={items}
        phases={phases}
        settings={settings}
        scenario={scenario}
      />

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <div className="xl:col-span-3">
          <CategoryBreakdown
            items={items}
            scenario={scenario}
            selected={categoryFilter}
            onSelect={setCategoryFilter}
          />
        </div>
        <div className="xl:col-span-2">
          <PriorityBreakdown
            items={items}
            settings={settings}
            scenario={scenario}
          />
        </div>
      </div>

      <ProjectTimeline
        items={items}
        phases={phases}
        projectStartDate={settings.projectStartDate}
        categoryFilter={categoryFilter}
        onEdit={setEditTarget}
      />

      <LineItemsTable
        items={items}
        categories={categories}
        scenario={scenario}
        projectStartDate={settings.projectStartDate}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
        onEdit={(id) => setEditTarget({ kind: "item", id })}
        onStatusChange={(id, status) => saveItem(id, { status })}
        onIncludedChange={(id, includedInBudget) =>
          saveItem(id, { includedInBudget })
        }
      />

      <Card>
        <button
          type="button"
          onClick={() => setShowNotes((v) => !v)}
          className="flex w-full items-center justify-between cursor-pointer"
        >
          <span
            className="text-sm font-semibold"
            style={{ color: colors.textPrimary }}
          >
            Assumptions & exclusions
          </span>
          <ChevronDown
            className="w-4 h-4 transition-transform"
            style={{
              color: colors.textTertiary,
              transform: showNotes ? "rotate(180deg)" : "none",
            }}
          />
        </button>
        {showNotes && (
          <div
            className="mt-4 grid gap-4 md:grid-cols-3 text-sm leading-relaxed"
            style={{ color: colors.textSecondary }}
          >
            <div>
              <h3
                className="text-[11px] font-semibold uppercase tracking-wider mb-1.5"
                style={{ color: colors.textTertiary }}
              >
                Assumptions
              </h3>
              <p>{settings.assumptions ?? "—"}</p>
            </div>
            <div>
              <h3
                className="text-[11px] font-semibold uppercase tracking-wider mb-1.5"
                style={{ color: colors.textTertiary }}
              >
                Not in this budget
              </h3>
              <ul className="list-disc pl-4 space-y-0.5">
                {(settings.exclusions ?? "")
                  .split(";")
                  .map((s) => s.trim())
                  .filter(Boolean)
                  .map((s) => (
                    <li key={s}>{s}</li>
                  ))}
              </ul>
            </div>
            <div>
              <h3
                className="text-[11px] font-semibold uppercase tracking-wider mb-1.5"
                style={{ color: colors.textTertiary }}
              >
                Separate repair reserve
              </h3>
              <p>
                Set aside {formatUsd(settings.repairReserveLowUsd)}–
                {formatUsd(settings.repairReserveHighUsd)} for repairs to the
                existing building. This is outside the conversion total and
                should be reassessed after inspection.
              </p>
            </div>
          </div>
        )}
      </Card>

      <EditItemDrawer
        item={editingItem}
        phase={editingPhase}
        categories={categories}
        projectStartDate={settings.projectStartDate}
        onClose={() => setEditTarget(null)}
        onSaveItem={saveItem}
        onSavePhase={savePhase}
      />
    </div>
  );
}
