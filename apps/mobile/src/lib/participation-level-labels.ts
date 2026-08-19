export type ParticipationLevel = "watch" | "cook_no_eat" | "full";

export const LEVEL_LABELS: Record<
  ParticipationLevel,
  { emoji: string; label: string; bg: string; color: string }
> = {
  watch: { emoji: "👀", label: "Watch only", bg: "#f3f4f6", color: "#374151" },
  cook_no_eat: {
    emoji: "🧑‍🍳",
    label: "Cook, don't consume",
    bg: "#fef9c3",
    color: "#854d0e",
  },
  full: {
    emoji: "✅",
    label: "Full participation",
    bg: "#dcfce7",
    color: "#166534",
  },
};
