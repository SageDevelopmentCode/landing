export const PARENT_CALENDAR_EVENT_COLOR = "#6B8F9C";

export const PARENT_CALENDAR_EVENT_SHARED_WITH = ["Parents"] as const;

export type ParentCalendarAddEventStepId =
  | "title"
  | "date"
  | "time"
  | "details";

export type ParentCalendarAddEventStep = {
  id: ParentCalendarAddEventStepId;
  question: string;
  hint?: string;
};

export const PARENT_CALENDAR_ADD_EVENT_STEPS: ParentCalendarAddEventStep[] = [
  {
    id: "title",
    question: "What's happening?",
    hint: "Give your event a short name parents will recognize.",
  },
  {
    id: "date",
    question: "When is it?",
    hint: "Pick the date this takes place.",
  },
  {
    id: "time",
    question: "What time?",
    hint: "All day works great for reminders without a specific time.",
  },
  {
    id: "details",
    question: "Anything else to share?",
    hint: "Location and notes are optional — you can skip this step.",
  },
];

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
