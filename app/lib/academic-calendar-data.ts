export type AcademicSeason = "summer" | "fall" | "winter" | "spring";

export const ACADEMIC_YEAR_LABEL = "2026–2027";

export const KEY_DATES = {
  firstDay: {
    label: "First Day of School",
    monthDay: "August 17,",
    year: "2026",
  },
  lastDay: {
    label: "Last Day of School",
    monthDay: "May 27,",
    year: "2027",
  },
} as const;

export type AcademicHoliday = {
  name: string;
  dates: string;
  season: Exclude<AcademicSeason, "summer">;
  note: string;
};

export const HOLIDAYS: AcademicHoliday[] = [
  {
    name: "Labor Day",
    dates: "September 7, 2026",
    season: "fall",
    note: "School closed",
  },
  {
    name: "Student Holiday",
    dates: "October 12, 2026",
    season: "fall",
    note: "School closed",
  },
  {
    name: "Thanksgiving Break",
    dates: "November 23–27, 2026",
    season: "fall",
    note: "School closed",
  },
  {
    name: "Winter Break",
    dates: "December 18, 2026 – January 1, 2027",
    season: "winter",
    note: "School closed",
  },
  {
    name: "MLK Jr. Day",
    dates: "January 18, 2027",
    season: "winter",
    note: "School closed",
  },
  {
    name: "President's Day",
    dates: "February 15, 2027",
    season: "winter",
    note: "School closed",
  },
  {
    name: "Spring Break",
    dates: "March 15–19, 2027",
    season: "spring",
    note: "School closed",
  },
  {
    name: "Good Friday",
    dates: "March 26, 2027",
    season: "spring",
    note: "School closed",
  },
];

export const seasonStyles: Record<
  AcademicSeason,
  { bg: string; text: string; dot: string }
> = {
  summer: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-400" },
  fall: { bg: "bg-orange-50", text: "text-orange-700", dot: "bg-orange-400" },
  winter: { bg: "bg-sky-50", text: "text-sky-700", dot: "bg-sky-400" },
  spring: { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500" },
};
