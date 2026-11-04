import type {
  BudgetItem,
  ItemStatus,
  PriorityCode,
  ProjectSettings,
  Scenario,
  TimelinePhase,
} from "./types";

export const SCENARIOS: { id: Scenario; label: string }[] = [
  { id: "favorable", label: "Favorable" },
  { id: "working", label: "Working" },
  { id: "difficult", label: "Difficult" },
];

export const PRIORITIES: Record<
  PriorityCode,
  { label: string; description: string; color: string }
> = {
  A: {
    label: "Resolve first",
    description: "Before construction commitment",
    color: "#6366F1",
  },
  B: {
    label: "Opening-critical",
    description: "Before students occupy",
    color: "#5E7C68",
  },
  C: {
    label: "Conditional / phased",
    description: "Before opening only if essential",
    color: "#F59E0B",
  },
  D: {
    label: "Later / optional",
    description: "After opening",
    color: "#94A3B8",
  },
};

export const PRIORITY_CODES: PriorityCode[] = ["A", "B", "C", "D"];

export const STATUSES: Record<ItemStatus, { label: string; color: string }> = {
  not_started: { label: "Not started", color: "#94A3B8" },
  in_progress: { label: "In progress", color: "#0EA5E9" },
  done: { label: "Done", color: "#22C55E" },
  deferred: { label: "Deferred", color: "#F59E0B" },
};

export const STATUS_ORDER: ItemStatus[] = [
  "not_started",
  "in_progress",
  "done",
  "deferred",
];

const CATEGORY_COLORS: Record<string, string> = {
  Planning: "#6366F1",
  "Fire/building": "#EF4444",
  Accessibility: "#0EA5E9",
  Classroom: "#8B5CF6",
  Infrastructure: "#A16207",
  Fences: "#64748B",
  Outdoor: "#22C55E",
  Setup: "#EC4899",
};

const FALLBACK_COLORS = ["#5E7C68", "#F59E0B", "#14B8A6", "#F97316"];

export function categoryColor(category: string): string {
  if (CATEGORY_COLORS[category]) return CATEGORY_COLORS[category];
  let hash = 0;
  for (const ch of category) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return FALLBACK_COLORS[hash % FALLBACK_COLORS.length];
}

export const SCHEDULE_SCENARIOS = [
  {
    id: "fast",
    label: "Fast case",
    startWeek: 10,
    endWeek: 14,
    note: "Straightforward scope, approvals and contractor availability",
  },
  {
    id: "working",
    label: "Working case",
    startWeek: 14,
    endWeek: 20,
    note: "Moderate conversion with overlapping tasks",
  },
  {
    id: "delayed",
    label: "Delayed case",
    startWeek: 20,
    endWeek: 28,
    note: "28 weeks is not a cap; redesign or major infrastructure can take longer",
  },
] as const;

export const POWERED_GATES_UPGRADE_USD = 6000;

const OPENING_PLUS_CODES = ["S13", "S14", "S17", "S20", "S21"];
const GARAGE_CODE = "S10";
const OPENING_PHASE_CODE = "P07";
const DEFAULT_OPENING_WEEK = 20;

export function itemsInBudget(items: BudgetItem[]): BudgetItem[] {
  return items.filter((item) => item.includedInBudget);
}

export function itemAmount(item: BudgetItem, scenario: Scenario): number {
  if (scenario === "favorable") return item.favorableUsd;
  if (scenario === "difficult") return item.difficultUsd;
  return item.workingUsd;
}

export function sumItems(items: BudgetItem[], scenario: Scenario): number {
  return itemsInBudget(items).reduce(
    (sum, item) => sum + itemAmount(item, scenario),
    0,
  );
}

export function sumSpent(items: BudgetItem[]): number {
  return itemsInBudget(items).reduce(
    (sum, item) => sum + item.actualSpentUsd,
    0,
  );
}

export function withContingency(
  subtotal: number,
  settings: ProjectSettings,
  scenario: Scenario,
) {
  const rate = settings.contingency[scenario];
  const contingency = Math.round(subtotal * rate);
  return { subtotal, rate, contingency, total: subtotal + contingency };
}

export function scenarioTotals(
  items: BudgetItem[],
  settings: ProjectSettings,
  scenario: Scenario,
) {
  return withContingency(sumItems(items, scenario), settings, scenario);
}

export type CategorySummary = {
  category: string;
  amount: number;
  favorable: number;
  difficult: number;
  spent: number;
  count: number;
  color: string;
};

export function categoryBreakdown(
  items: BudgetItem[],
  scenario: Scenario,
): CategorySummary[] {
  const map = new Map<string, CategorySummary>();
  for (const item of itemsInBudget(items)) {
    const row = map.get(item.category) ?? {
      category: item.category,
      amount: 0,
      favorable: 0,
      difficult: 0,
      spent: 0,
      count: 0,
      color: categoryColor(item.category),
    };
    row.amount += itemAmount(item, scenario);
    row.favorable += item.favorableUsd;
    row.difficult += item.difficultUsd;
    row.spent += item.actualSpentUsd;
    row.count += 1;
    map.set(item.category, row);
  }
  return Array.from(map.values()).sort((a, b) => b.amount - a.amount);
}

export function priorityBreakdown(items: BudgetItem[], scenario: Scenario) {
  const active = itemsInBudget(items);
  return PRIORITY_CODES.map((code) => {
    const group = active.filter((item) => item.priorityCode === code);
    return {
      code,
      ...PRIORITIES[code],
      amount: sumItems(group, scenario),
      count: group.length,
    };
  });
}

export function openingPackages(
  items: BudgetItem[],
  settings: ProjectSettings,
  scenario: Scenario,
) {
  const active = itemsInBudget(items);
  const included = new Set(
    active
      .filter((item) => item.priorityCode === "A" || item.priorityCode === "B")
      .map((item) => item.code),
  );
  const steps: { label: string; detail: string; codes: Set<string> }[] = [];

  steps.push({
    label: "Opening minimum",
    detail: "Resolve-first + opening-critical (A+B)",
    codes: new Set(included),
  });
  OPENING_PLUS_CODES.forEach((code) => {
    if (active.some((item) => item.code === code)) included.add(code);
  });
  steps.push({
    label: "+ Fence, gates, pool cover, furniture, paint",
    detail: "Conditional items most likely needed to open",
    codes: new Set(included),
  });
  if (active.some((item) => item.code === GARAGE_CODE)) included.add(GARAGE_CODE);
  steps.push({
    label: "+ Garage classroom",
    detail: "If the main house can't serve enrollment",
    codes: new Set(included),
  });
  steps.push({
    label: "Full plan",
    detail: "Everything included in your active plan",
    codes: new Set(active.map((item) => item.code)),
  });

  return steps.map((step) => ({
    label: step.label,
    detail: step.detail,
    ...withContingency(
      sumItems(
        active.filter((item) => step.codes.has(item.code)),
        scenario,
      ),
      settings,
      scenario,
    ),
  }));
}

export function parseDateOnly(value: string): Date {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function toDateOnly(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function weekStartDate(projectStart: string, week: number): Date {
  return addDays(parseDateOnly(projectStart), (week - 1) * 7);
}

export function weekEndDate(projectStart: string, week: number): Date {
  return addDays(weekStartDate(projectStart, week), 6);
}

/** 1-based fractional week position of `date` (week 1 begins at 1.0). */
export function weekPosition(projectStart: string, date: Date): number {
  const start = parseDateOnly(projectStart);
  const days = (date.getTime() - start.getTime()) / 86_400_000;
  return days / 7 + 1;
}

export function formatShortDate(date: Date, withYear = false): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(withYear ? { year: "numeric" } : {}),
  });
}

export function formatWeekRange(
  projectStart: string,
  startWeek: number,
  endWeek: number,
  withYear = false,
): string {
  return `${formatShortDate(weekStartDate(projectStart, startWeek))} – ${formatShortDate(
    weekEndDate(projectStart, endWeek),
    withYear,
  )}`;
}

export function openingWeek(phases: TimelinePhase[]): number {
  return (
    phases.find((phase) => phase.code === OPENING_PHASE_CODE)?.endWeek ??
    DEFAULT_OPENING_WEEK
  );
}

export function timelineWeeks(
  items: BudgetItem[],
  phases: TimelinePhase[],
): number {
  const ends = [
    30,
    ...items.map((item) => item.endWeek),
    ...phases.map((phase) => phase.endWeek),
  ];
  return Math.max(...ends);
}

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function formatUsd(value: number): string {
  return usd.format(value);
}

export function formatUsdCompact(value: number): string {
  if (Math.abs(value) >= 1000) {
    const k = value / 1000;
    return `$${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}k`;
  }
  return usd.format(value);
}
