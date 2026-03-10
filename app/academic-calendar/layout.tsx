import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Academic Calendar 2026-2027 - Sage Field Private School | Texas Microschool",
  description:
    "View the 2026-2027 academic calendar for Sage Field Private School in Round Rock, Texas. Key dates, holiday schedule, summer program, and important school year information for our nature-based microschool.",
  openGraph: {
    title: "Academic Calendar 2026-2027 - Sage Field Private School",
    description:
      "2026-2027 school year calendar for Sage Field Private School in Round Rock, Texas. Includes key dates, holidays, summer program, and more.",
    url: "https://sagefield.co/academic-calendar",
    siteName: "Sage Field Private School",
    images: [
      {
        url: "/assets/social-preview.jpg",
        width: 1200,
        height: 630,
        alt: "Sage Field Private School Academic Calendar - Round Rock Texas",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Academic Calendar 2026-2027 - Sage Field Private School",
    description:
      "2026-2027 school year calendar for Sage Field Private School in Round Rock, Texas.",
    images: ["/assets/social-preview.jpg"],
  },
  alternates: {
    canonical: "/academic-calendar",
  },
};

export default function AcademicCalendarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
