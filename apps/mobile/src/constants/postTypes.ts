export interface PostTypeConfig {
  label: string;
  value: string;
  color: string;
  textColor: string;
  emoji: string;
}

export const POST_TYPES: PostTypeConfig[] = [
  { label: "Announcement", value: "announcement", color: "#3B82F6", textColor: "#fff", emoji: "📢" },
  { label: "Field Friday",  value: "field_friday",  color: "#16A34A", textColor: "#fff", emoji: "🌿" },
  { label: "Aftercare",    value: "aftercare",     color: "#9333EA", textColor: "#fff", emoji: "🌙" },
  { label: "Event",        value: "event",         color: "#F97316", textColor: "#fff", emoji: "🎉" },
  { label: "Reminder",     value: "reminder",      color: "#D97706", textColor: "#fff", emoji: "🔔" },
  { label: "Newsletter",   value: "newsletter",    color: "#0D9488", textColor: "#fff", emoji: "📰" },
  { label: "Update",       value: "update",        color: "#EC4899", textColor: "#fff", emoji: "📝" },
  { label: "Activity",     value: "activity",      color: "#EF4444", textColor: "#fff", emoji: "🎨" },
  { label: "Primary",      value: "primary",       color: "#F59E0B", textColor: "#fff", emoji: "⭐" },
  { label: "Upper School", value: "upper_school",  color: "#6366F1", textColor: "#fff", emoji: "📚" },
  { label: "General",      value: "general",       color: "#6B7280", textColor: "#fff", emoji: "💬" },
];

export function getPostType(value: string | null | undefined): PostTypeConfig | undefined {
  return POST_TYPES.find((t) => t.value === value);
}
