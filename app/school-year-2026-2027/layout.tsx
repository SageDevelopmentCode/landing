import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "School Year 2026–2027 | Sage Field Private School",
  description:
    "Enroll in the School Year 2026–2027 program at Sage Field Private School in Round Rock, TX. A outdoor-based microschool for ages 4-11 offering personalized, outdoor-focused education.",
  keywords: [
    "private school enrollment Round Rock",
    "microschool enrollment Texas",
    "school year 2026-2027",
    "nature-based school admissions",
    "outdoor-based school admissions",
    "alternative elementary school Round Rock",
    "Sage Field enrollment",
  ],
  openGraph: {
    title: "School Year 2026–2027 | Sage Field Private School",
    description:
      "Enroll in the School Year 2026–2027 program at Sage Field Private School in Round Rock, TX. A outdoor-based microschool for ages 4-11.",
    url: "https://sagefield.co/school-year-2026-2027",
    siteName: "Sage Field Private School",
    images: [
      {
        url: "/assets/social-preview.jpg",
        width: 1200,
        height: 630,
        alt: "Sage Field School Year 2026-2027",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "School Year 2026–2027 | Sage Field Private School",
    description:
      "Enroll in the School Year 2026–2027 program at Sage Field Private School in Round Rock, TX.",
    images: ["/assets/social-preview.jpg"],
  },
  alternates: {
    canonical: "/school-year-2026-2027",
  },
};

export default function SchoolYearLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: "Sage Field School Year 2026-2027",
    description:
      "An outdoor-based microschool program for children ages 4-11, blending Montessori, Waldorf, and Reggio Emilia philosophies with TEKS-aligned academics.",
    provider: {
      "@type": "EducationalOrganization",
      name: "Sage Field Private School",
      sameAs: "https://sagefield.co",
    },
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "Onsite",
      startDate: "2026-08-17",
      endDate: "2027-05-31",
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
