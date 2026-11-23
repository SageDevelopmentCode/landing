import type { EmergencySnackPreference, SharedFoodPreference } from "@/app/actions/schoolDayFoodPreferences";

export const EMERGENCY_SNACK_OPTIONS: {
  value: EmergencySnackPreference;
  emoji: string;
  label: string;
}[] = [
  {
    value: "always_allow",
    emoji: "✅",
    label: "Always allow a backup snack",
  },
  {
    value: "ask_permission",
    emoji: "📱",
    label: "Ask me first",
  },
  {
    value: "approved_only",
    emoji: "📋",
    label: "Approved foods only",
  },
];

export const SHARED_FOOD_OPTIONS: {
  value: SharedFoodPreference;
  emoji: string;
  label: string;
}[] = [
  {
    value: "always_allow",
    emoji: "✅",
    label: "Always allow",
  },
  {
    value: "ask_each_time",
    emoji: "📱",
    label: "Ask me each time",
  },
  {
    value: "do_not_offer",
    emoji: "🚫",
    label: "Do not offer",
  },
];

export function getEmergencySnackLabel(value: EmergencySnackPreference): string {
  const option = EMERGENCY_SNACK_OPTIONS.find((o) => o.value === value);
  return option ? `${option.emoji} ${option.label}` : value;
}

export function getSharedFoodLabel(value: SharedFoodPreference): string {
  const option = SHARED_FOOD_OPTIONS.find((o) => o.value === value);
  return option ? `${option.emoji} ${option.label}` : value;
}
