// Shared parent Home constants + helpers (moved verbatim from (tabs)/home.tsx)
import type {
  CalendarEvent,
  HomeApplicationRow,
  PendingPaymentPreview,
} from "./types";

export function formatHomeCardStatus(names: string[], status: string): string {
  if (names.length === 0) return status;
  return `${names.join(", ")} · ${status}`;
}

export const HOME_CARD_IMAGES = {
  summer: require("../../../assets/images/stock/Stock1.webp"),
  aftercare: require("../../../assets/images/stock/Stock2.webp"),
  funFriday: require("../../../assets/images/stock/Stock3.webp"),
  schoolYear: require("../../../assets/images/stock/Stock4.webp"),
  homeschool: require("../../../assets/images/stock/Stock5.webp"),
};

export function getInitials(fullName: string) {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function buildDropInProgramByStudent(
  applications: HomeApplicationRow[],
): Record<string, string | null> {
  const result: Record<string, string | null> = {};
  for (const app of applications) {
    if (app.status === "enrolled" && app.program === "homeschool_drop_in") {
      result[app.student_id] = app.drop_in_program;
    }
  }
  return result;
}

export function toYMD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function fmt12(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${ampm}`;
}

export function formatEventTime(evt: CalendarEvent): string {
  if (evt.is_all_day) return "All day";
  if (evt.start_time && evt.end_time)
    return `${fmt12(evt.start_time)} – ${fmt12(evt.end_time)}`;
  if (evt.start_time) return fmt12(evt.start_time);
  return "All day";
}

export function formatFullDate(dateStr: string): string {
  const [y, mo, d] = dateStr.split("-").map(Number);
  return new Date(y, mo - 1, d).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export function formatShortDate(dateStr: string): string {
  const [y, mo, d] = dateStr.split("-").map(Number);
  return new Date(y, mo - 1, d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export const CHECKLIST_TASKS = [
  {
    id: "upload_photo",
    label: "Add your child's photo",
    desc: "Upload a profile photo for your child",
    icon: "camera-outline" as const,
    color: "#7c3aed",
  },
  {
    id: "view_teachers",
    label: "Meet your child's teachers",
    desc: "View the teachers assigned to your child",
    icon: "school-outline" as const,
    color: "#2563eb",
  },
  {
    id: "introduce_community",
    label: "Introduce yourself to the community",
    desc: "Say hello in the community chat",
    icon: "people-outline" as const,
    color: "#6366f1",
  },
  {
    id: "send_message",
    label: "Send your first message",
    desc: "Send a message to a teacher",
    icon: "chatbubble-outline" as const,
    color: "#0284c7",
  },
  {
    id: "setup_tuition",
    label: "Set up tuition",
    desc: "Review tuition details and payment options",
    icon: "card-outline" as const,
    color: "#059669",
  },
  {
    id: "react_post",
    label: "React to a post",
    desc: "Engage with a post on the classroom feed",
    icon: "happy-outline" as const,
    color: "#d97706",
  },
  {
    id: "check_events",
    label: "Check upcoming events",
    desc: "Browse the school calendar",
    icon: "calendar-outline" as const,
    color: "#e11d48",
  },
  {
    id: "add_pickup",
    label: "Add an authorized pickup",
    desc: "Add a person authorized to pick up your child",
    icon: "person-add-outline" as const,
    color: "#ea580c",
  },
] as const;

export const TOTAL_TASKS = 8;

export const DROP_OFF_SLOTS = [
  { label: "8:15 – 8:30", value: "8:15" },
  { label: "8:30 – 8:45", value: "8:30" },
  { label: "8:45 – 9:00", value: "8:45" },
] as const;

export const AVATAR_COLORS = [
  { bg: "#d4e6d0", text: "#4a7c59" },
  { bg: "#dce8f5", text: "#4a7394" },
  { bg: "#f5e8d4", text: "#946e3a" },
  { bg: "#f5d4e4", text: "#944a6e" },
  { bg: "#e4d4f5", text: "#6e4a94" },
  { bg: "#d4f5e4", text: "#3a9468" },
] as const;

export function avatarColor(name: string) {
  let n = 0;
  for (let i = 0; i < name.length; i++) n += name.charCodeAt(i);
  return AVATAR_COLORS[n % AVATAR_COLORS.length];
}

export function isSupplyFeePendingPayment(p: PendingPaymentPreview): boolean {
  if (p.payment_type === "supply_fee") return true;
  return /supply fee/i.test(p.label);
}

export function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export function formatProgram(program: string): string {
  const map: Record<string, string> = {
    summer_26: "Summer 2026",
    school_year_26_27: "School Year 2026–2027",
    both: "Summer 2026 & School Year 2026–2027",
    homeschool_drop_in: "Homeschool Drop-In",
  };
  return map[program] ?? program;
}

export function timeAgo(isoString: string): string {
  const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) {
    const m = Math.floor(diff / 60);
    return `${m} min ago`;
  }
  if (diff < 86400) {
    const h = Math.floor(diff / 3600);
    return `${h}h ago`;
  }
  const d = Math.floor(diff / 86400);
  return d === 1 ? "yesterday" : `${d} days ago`;
}
