export type PostTypeDisplay = {
  labelUpper: string;
  bg: string;
  text: string;
};

const SOFT_BY_VALUE: Record<string, PostTypeDisplay> = {
  announcement: { labelUpper: "SCHOOL NEWS", bg: "#E8F3EC", text: "#3D5C4A" },
  newsletter: { labelUpper: "SCHOOL NEWS", bg: "#E8F3EC", text: "#3D5C4A" },
  event: { labelUpper: "UPCOMING EVENT", bg: "#FCE8D8", text: "#9A5B3C" },
  reminder: { labelUpper: "REMINDER", bg: "#FEF3C7", text: "#92400E" },
  field_friday: { labelUpper: "FIELD FRIDAY", bg: "#DCFCE7", text: "#166534" },
  aftercare: { labelUpper: "AFTERCARE", bg: "#EDE9FE", text: "#5B21B6" },
  activity: { labelUpper: "TOMORROW'S ACTIVITY", bg: "#FCE8D8", text: "#9A5B3C" },
  photos: { labelUpper: "NEW PHOTOS", bg: "#E0F2FE", text: "#0369A1" },
  community: { labelUpper: "COMMUNITY", bg: "#E8F3EC", text: "#3D5C4A" },
  update: { labelUpper: "FAMILY NOTE", bg: "#E8F3EC", text: "#3D5C4A" },
  general: { labelUpper: "FAMILY NOTE", bg: "#E8F3EC", text: "#3D5C4A" },
  primary: { labelUpper: "PRIMARY", bg: "#FEF3C7", text: "#92400E" },
  upper_school: { labelUpper: "UPPER SCHOOL", bg: "#E0E7FF", text: "#3730A3" },
};

const DEFAULT_DISPLAY: PostTypeDisplay = {
  labelUpper: "UPDATE",
  bg: "#E8F3EC",
  text: "#3D5C4A",
};

export function getPostTypeDisplay(value: string | null | undefined): PostTypeDisplay | null {
  if (!value) return null;
  const soft = SOFT_BY_VALUE[value];
  if (soft) return soft;
  const label = value.replace(/_/g, " ");
  return {
    labelUpper: label.toUpperCase(),
    bg: "#F3F4F6",
    text: "#4B5563",
  };
}
