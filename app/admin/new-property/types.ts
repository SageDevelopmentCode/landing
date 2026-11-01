export type Scenario = "favorable" | "working" | "difficult";

export type PriorityCode = "A" | "B" | "C" | "D";

export type ItemStatus = "not_started" | "in_progress" | "done" | "deferred";

export type BudgetItem = {
  id: string;
  code: string;
  category: string;
  scope: string;
  favorableUsd: number;
  workingUsd: number;
  difficultUsd: number;
  priorityCode: PriorityCode;
  startWeek: number;
  endWeek: number;
  activities: string | null;
  completionGate: string | null;
  dependencies: string | null;
  exclusions: string | null;
  notes: string | null;
  deferralRule: string | null;
  status: ItemStatus;
  actualSpentUsd: number;
  includedInBudget: boolean;
  sortOrder: number;
};

export type TimelinePhase = {
  id: string;
  code: string;
  name: string;
  startWeek: number;
  endWeek: number;
  activities: string | null;
  completionGate: string | null;
  dependencies: string | null;
  sortOrder: number;
};

export type ProjectSettings = {
  projectStartDate: string;
  contingency: Record<Scenario, number>;
  repairReserveLowUsd: number;
  repairReserveHighUsd: number;
  assumptions: string | null;
  exclusions: string | null;
};

export type BudgetItemPatch = Partial<
  Omit<BudgetItem, "id" | "code" | "sortOrder">
>;

export type TimelinePhasePatch = Partial<
  Pick<
    TimelinePhase,
    | "name"
    | "startWeek"
    | "endWeek"
    | "activities"
    | "completionGate"
    | "dependencies"
  >
>;

export type ProjectSettingsPatch = Partial<
  Pick<ProjectSettings, "projectStartDate">
>;

export type ActionResult = { ok: true } | { ok: false; error: string };
