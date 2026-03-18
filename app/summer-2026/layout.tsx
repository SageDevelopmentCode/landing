import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Summer 2026 Program | Sage Field Private School",
  description:
    "Join our Summer 2026 program at Sage Field Private School in Round Rock, TX. A 12-week immersive outdoor experience for curious learners ages 4–11. May 26 – Aug 13, 2026.",
  keywords: [
    "summer camp Round Rock",
    "summer program Round Rock TX",
    "outdoor summer camp Texas",
    "nature-based summer program",
    "outdoor-based summer program",
    "outdoor-based summer camp",
    "kids summer camp ages 4-11",
    "Sage Field summer",
    "educational summer camp",
  ],
  openGraph: {
    title: "Summer 2026 Program | Sage Field Private School",
    description:
      "A 12-week immersive outdoor experience for curious learners ages 4–11 in Round Rock, TX.",
    url: "https://sagefield.co/summer-2026",
    siteName: "Sage Field Private School",
    images: [
      {
        url: "/assets/social-preview.jpg",
        width: 1200,
        height: 630,
        alt: "Sage Field Summer 2026 Program",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Summer 2026 Program | Sage Field Private School",
    description:
      "A 12-week immersive outdoor experience for curious learners ages 4–11 in Round Rock, TX.",
    images: ["/assets/social-preview.jpg"],
  },
  alternates: {
    canonical: "/summer-2026",
  },
};

export default function Summer2026Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: "Sage Field Summer 2026 Program",
    description:
      "A 12-week immersive outdoor learning experience for children ages 4-11, blending hands-on projects, nature exploration, and academic support.",
    provider: {
      "@type": "EducationalOrganization",
      name: "Sage Field Private School",
      sameAs: "https://sagefield.co",
    },
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "Onsite",
      startDate: "2026-05-26",
      endDate: "2026-08-13",
      location: {
        "@type": "Place",
        name: "Sage Field Private School",
        address: {
          "@type": "PostalAddress",
          streetAddress: "2760 Gattis School Rd",
          addressLocality: "Round Rock",
          addressRegion: "TX",
          postalCode: "78664",
          addressCountry: "US",
        },
      },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      {children}
    </>
  );
}
