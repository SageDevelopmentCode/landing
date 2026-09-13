export interface WeekEntry {
  week: number;
  dates: string;
  theme: string;
  href?: string;
  coverImage?: string;
}

export const SCHOOL_YEAR_WEEKS: WeekEntry[] = [
  {
    week: 3,
    dates: "Aug 31–Sep 4",
    theme: "Making, Science & Wild West Friday",
    href: "/highlights/school-year/week-3",
    coverImage:
      "/assets/highlights/school_week_three/BC3C9DF3-4ECB-4F82-B635-FA1455F6A791.JPG",
  },
  {
    week: 2,
    dates: "Aug 24–28",
    theme: "Gardening, Growing & Construction Zone",
    href: "/highlights/school-year/week-2",
    coverImage:
      "/assets/highlights/school_week_two/C789A2F8-D5D0-48AE-9C6C-153410CB374F.JPG",
  },
  {
    week: 1,
    dates: "Aug 17–21",
    theme: "First Week of School",
    href: "/highlights/school-year/week-1",
    coverImage:
      "/assets/highlights/school_week_one/B5E9BAE4-8895-4A91-BE6A-E8D0232594E0 2.JPG",
  },
];

export const SUMMER_WEEKS: WeekEntry[] = [
  {
    week: 1,
    dates: "May 26–29",
    theme: "Welcome to Summer",
    href: "/highlights/summer/week-1",
    coverImage:
      "/assets/highlights/summer_week_one/C8EAD2FA-0FB2-4D59-A079-493C09298ABF.JPG",
  },
  {
    week: 2,
    dates: "Jun 1–4",
    theme: "Mystery Camp Escape Challenge",
    href: "/highlights/summer/week-2",
    coverImage: "/assets/highlights/summer_week_two/A0AA3C22-7657-4E63-A3FD-7AB6CD3B85E0.JPG",
  },
  {
    week: 3,
    dates: "Jun 9–13",
    theme: "Beach Day Bash",
    href: "/highlights/summer/week-3",
    coverImage: "/assets/highlights/summer_week_three/FE28F7EF-5568-4F11-9C62-E44AC6209D53.JPG",
  },
  {
    week: 4,
    dates: "Jun 16–20",
    theme: "STEM Adventure Friday & Strawberry Jam",
    href: "/highlights/summer/week-4",
    coverImage: "/assets/highlights/summer_week_four/C4EB78AE-3AE3-4DB4-BAF4-DA09B3A7E941 2.JPG",
  },
  {
    week: 5,
    dates: "Jun 22–25",
    theme: "Safari Adventure & Animal Architects",
    href: "/highlights/summer/week-5",
    coverImage: "/assets/highlights/summer_week_five/077864BA-405A-4468-8A16-0FB0AFBC8CB0.JPG",
  },
  {
    week: 6,
    dates: "Jun 29–Jul 2",
    theme: "Cooking, Word Problems & Halfway There",
    href: "/highlights/summer/week-6",
    coverImage: "/assets/highlights/summer_week_six/1A73BC70-CEC1-4979-8576-39585C31DB07.JPG",
  },
  { week: 7, dates: "Jul 6–9", theme: "Dino Hunt" },
  { week: 8, dates: "Jul 13–16", theme: "Pirate Adventure" },
  { week: 9, dates: "Jul 20–23", theme: "You are a Superhero!" },
  {
    week: 10,
    dates: "Jul 27–30",
    theme: "Space Explorers: Mission to the Stars",
  },
  { week: 11, dates: "Aug 3–6", theme: "Down on the Farm" },
  {
    week: 12,
    dates: "Aug 10–13",
    theme: "Finale of Camp",
    href: "/highlights/summer/week-12",
    coverImage:
      "/assets/highlights/summer_week_twelve/8C3B1791-0B49-4B7E-B069-C746C7CF6F65.JPG",
  },
];

export const LIVE_SUMMER_WEEKS = SUMMER_WEEKS.filter((entry) => !!entry.href);
