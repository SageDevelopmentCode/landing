import type { Metadata } from "next";
import HelpWidget from "@/app/parent/components/HelpWidget";

export const metadata: Metadata = {
  title: "Apply - Sage Field | Summer & School Year Programs",
  description:
    "Apply to Sage Field Private School's Summer 2026 or School Year 2026–2027 programs. An outdoor-based private microschool for children ages 4-11 in Round Rock, Texas. Small groups, hands-on learning, and a structured drop-off program.",
  keywords: [
    "apply to private school Round Rock",
    "microschool application Texas",
    "enroll in Sage Field",
    "summer camp application Round Rock",
    "school year 2026 enrollment",
    "alternative school admissions",
    "nature-based school application",
    "outdoor-based school application",
  ],
  openGraph: {
    title: "Apply - Sage Field | Summer & School Year Programs",
    description:
      "Start your application to Sage Field in Round Rock, Texas. Enrolling now for Summer 2026 and School Year 2026–2027.",
    url: "https://sagefield.co/apply",
    siteName: "Sage Field Private School",
    images: [
      {
        url: "/assets/social-preview.jpg",
        width: 1200,
        height: 630,
        alt: "Apply to Sage Field Private School - Round Rock Texas Microschool",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Apply - Sage Field | Summer & School Year Programs",
    description:
      "Start your application to Sage Field's Summer 2026 or School Year 2026–2027 programs in Round Rock, Texas.",
    images: ["/assets/social-preview.jpg"],
  },
  alternates: {
    canonical: "/apply",
  },
};

export default function ApplyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <HelpWidget />
    </>
  );
}
