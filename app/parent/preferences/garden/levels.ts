import { LEVEL_OPTIONS, type ParticipationLevel } from "@/shared/parent/activity-preferences";

export type { ParticipationLevel };

/** The three participation levels (same copy as before), shaped for RadioCardGroup. */
export const LEVEL_CARDS = LEVEL_OPTIONS.map((o) => ({ value: o.level, emoji: o.emoji, title: o.label }));

export function levelLabel(level: ParticipationLevel): string {
  return LEVEL_OPTIONS.find((o) => o.level === level)?.label ?? level;
}

/** Short names for toasts ("Auto-fill set · Okay for everything · Ava"). */
export const LEVEL_TOAST_LABEL: Record<ParticipationLevel, string> = {
  watch: "Just watch",
  cook_no_eat: "Cook, don't eat",
  full: "Okay for everything",
};
