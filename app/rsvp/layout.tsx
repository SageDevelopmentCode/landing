import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Open House – April 25, 2026 | Sage Field Private School",
  description:
    "Join us for an open house at Sage Field Private School on April 25, 2026 from 2–4 PM. Tour our outdoor space, meet our educators, and learn about enrollment for Summer 2026 and School Year 2026-2027.",
  openGraph: {
    title: "Open House – April 25, 2026 | Sage Field Private School",
    description:
      "Tour the space, meet our educators, and learn about enrollment. April 25, 2026 · 2:00–4:00 PM · Round Rock, TX.",
    type: "website",
  },
};

export default function OpenHouseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
