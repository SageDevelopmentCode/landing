// Keep in sync with shared/parent/parentCalendarAddEvent.ts

export const PARENT_CALENDAR_ADD_EVENT_STEPS = [
  {
    id: "title" as const,
    question: "What's happening?",
    hint: "Give your event a short name parents will recognize.",
  },
  {
    id: "date" as const,
    question: "When is it?",
    hint: "Pick the date this takes place.",
  },
  {
    id: "time" as const,
    question: "What time?",
    hint: "All day works great for reminders without a specific time.",
  },
  {
    id: "details" as const,
    question: "Anything else to share?",
    hint: "Location and notes are optional — you can skip this step.",
  },
];

export type ParentCalendarAddEventStepId =
  (typeof PARENT_CALENDAR_ADD_EVENT_STEPS)[number]["id"];

export type ParentCalendarEventFormValues = {
  title: string;
  event_date: string;
  is_all_day: boolean;
  start_time: string;
  end_time: string;
  location: string;
  description: string;
};

export function defaultParentCalendarEventFormValues(
  initialDate?: string,
): ParentCalendarEventFormValues {
  return {
    title: "",
    event_date: initialDate ?? "",
    is_all_day: true,
    start_time: "09:00",
    end_time: "10:00",
    location: "",
    description: "",
  };
}
