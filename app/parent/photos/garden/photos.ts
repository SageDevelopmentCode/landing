import type { TeacherPhoto } from "@/app/actions/photos";

export type DateGroup = {
  date: string;
  label: string;
  shortLabel: string;
  photos: TeacherPhoto[];
};

/** Groups by `taken_on` (newest first), with undated photos last. */
export function groupPhotosByDate(photos: TeacherPhoto[]): DateGroup[] {
  const map = new Map<string, TeacherPhoto[]>();
  for (const p of photos) {
    const key = p.taken_on ?? "no-date";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(p);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => {
      if (a === "no-date") return 1;
      if (b === "no-date") return -1;
      return b.localeCompare(a);
    })
    .map(([date, groupPhotos]) => ({
      date,
      label:
        date === "no-date"
          ? "No date"
          : new Date(date + "T00:00:00").toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            }),
      shortLabel: date === "no-date" ? "No date" : formatShortDate(date),
      photos: groupPhotos,
    }));
}

export function formatShortDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function photoCountLabel(n: number): string {
  return `${n} photo${n !== 1 ? "s" : ""}`;
}

/** Accessible name for a photo: its caption, else "School photo, Nov 3, 2026". */
export function photoAlt(photo: TeacherPhoto): string {
  if (photo.caption) return photo.caption;
  return photo.taken_on ? `School photo, ${formatShortDate(photo.taken_on)}` : "School photo";
}
