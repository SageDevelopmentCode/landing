import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Interest Form - Sage Field | Summer & School Year Programs",
  description:
    "Share your interest in Sage Field Private School's Summer 2026 or School Year 2026–2027 programs. An outdoor-based private microschool for children ages 4-11 in Round Rock, Texas.",
  keywords: [
    "Sage Field interest form",
    "private school waitlist Round Rock",
    "microschool inquiry Texas",
    "enroll in Sage Field",
    "summer camp interest Round Rock",
    "school year 2026 enrollment",
    "alternative school admissions",
    "nature-based school application",
  ],
  openGraph: {
    title: "Interest Form - Sage Field | Summer & School Year Programs",
    description:
      "Tell us about your family and connect with Sage Field in Round Rock, Texas. Summer 2026 and School Year 2026–2027.",
    url: "https://sagefield.co/interest",
    siteName: "Sage Field Private School",
    images: [
      {
        url: "/assets/social-preview.jpg",
        width: 1200,
        height: 630,
        alt: "Interest form - Sage Field Private School - Round Rock Texas Microschool",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Interest Form - Sage Field | Summer & School Year Programs",
    description:
      "Share your interest in Sage Field's Summer 2026 or School Year 2026–2027 programs in Round Rock, Texas.",
    images: ["/assets/social-preview.jpg"],
  },
  alternates: {
    canonical: "/interest",
  },
};

export default function InterestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
