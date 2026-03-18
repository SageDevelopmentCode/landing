import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Open House – April 25, 2026 | Sage Field Private School",
  description:
    "Join us for an open house at Sage Field Private School on April 25, 2026 from 2–4 PM. Tour our outdoor space, meet our educators, and learn about enrollment for Summer 2026 and School Year 2026-2027.",
  keywords: [
    "private school open house",
    "microschool tour Round Rock",
    "Sage Field open house",
    "school tour Texas",
    "nature-based school open house",
    "enrollment event Round Rock",
  ],
  openGraph: {
    title: "Open House – April 25, 2026 | Sage Field Private School",
    description:
      "Tour the space, meet our educators, and learn about enrollment. April 25, 2026 · 2:00–4:00 PM · Round Rock, TX.",
    url: "https://sagefield.co/rsvp",
    siteName: "Sage Field Private School",
    images: [
      {
        url: "/assets/social-preview.jpg",
        width: 1200,
        height: 630,
        alt: "Sage Field Open House Event",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Open House – April 25, 2026 | Sage Field Private School",
    description:
      "Tour the space, meet our educators, and learn about enrollment. April 25, 2026 · 2:00–4:00 PM · Round Rock, TX.",
    images: ["/assets/social-preview.jpg"],
  },
  alternates: {
    canonical: "/rsvp",
  },
};

export default function OpenHouseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: "Sage Field Private School Open House",
    description:
      "Tour our outdoor space, meet our educators, and discover what makes Sage Field different. Bring the whole family — we'd love to show you around.",
    startDate: "2026-04-25T14:00:00-05:00",
    endDate: "2026-04-25T16:00:00-05:00",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
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
    image: ["https://sagefield.co/assets/social-preview.jpg"],
    organizer: {
      "@type": "EducationalOrganization",
      name: "Sage Field Private School",
      url: "https://sagefield.co",
    },
    offers: {
      "@type": "Offer",
      url: "https://sagefield.co/rsvp",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      validFrom: "2026-03-01T00:00:00-05:00",
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
