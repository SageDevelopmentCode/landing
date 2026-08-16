import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Community Garden Day | Sage Field Private School",
  description:
    "Join Sage Field families and friends for Community Garden Day — Thursday, August 27, 2026 · 5:30–7:00 PM. Plant, paint, connect, and help grow our community garden in Round Rock, TX.",
  keywords: [
    "Sage Field community event",
    "community garden Round Rock",
    "family event Round Rock TX",
    "school community garden",
    "Sage Field garden day",
    "Round Rock family event",
  ],
  openGraph: {
    title: "Community Garden Day | Sage Field Private School",
    description:
      "A cozy evening of planting, painting, and connecting — Thursday, August 27, 2026 · 5:30–7:00 PM in Round Rock, TX.",
    url: "https://sagefield.co/community",
    siteName: "Sage Field Private School",
    images: [
      {
        url: "/assets/social-preview.jpg",
        width: 1200,
        height: 630,
        alt: "Sage Field Community Garden Day",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Community Garden Day | Sage Field Private School",
    description:
      "Plant, paint, connect — help our community garden bloom. Thursday, August 27, 2026 · 5:30–7:00 PM.",
    images: ["/assets/social-preview.jpg"],
  },
  alternates: {
    canonical: "/community",
  },
};

export default function CommunityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: "Sage Field Community Garden Day",
    description:
      "A cozy evening of planting, painting, connecting, and creating a garden built with love by Sage Field families.",
    startDate: "2026-08-27T17:30:00-05:00",
    endDate: "2026-08-27T19:00:00-05:00",
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
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
    organizer: {
      "@type": "EducationalOrganization",
      name: "Sage Field Private School",
      url: "https://sagefield.co",
    },
    isAccessibleForFree: true,
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
