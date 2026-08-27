import type { HouseholdComposeRow, ParentWithChildren } from "./actions";

export type ComposeTarget =
  | { kind: "parent"; section: "mine" | "all"; parent: ParentWithChildren }
  | { kind: "household"; household: HouseholdComposeRow };

export function composeTargetKey(target: ComposeTarget): string {
  return target.kind === "household"
    ? `household:${target.household.studentId}`
    : `parent:${target.parent.id}`;
}

export function composeTargetLabel(target: ComposeTarget): string {
  return target.kind === "household"
    ? target.household.studentName
    : target.parent.full_name;
}
