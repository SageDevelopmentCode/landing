import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Apply - Sage Field | Summer & School Year Programs",
  description:
    "Apply to Sage Field's Summer 2026 or School Year 2026–2027 programs. A homeschool learning community for ages 6–10 in Round Rock, Texas. Small groups, hands-on learning, and a co-creation partnership with families.",
  openGraph: {
    title: "Apply - Sage Field | Summer & School Year Programs",
    description:
      "Start your application to Sage Field in Round Rock, Texas. Enrolling now for Summer 2026 and School Year 2026–2027.",
    url: "https://sagefield.co/apply",
    siteName: "Sage Field",
    images: [
      {
        url: "/assets/social-preview.jpg",
        width: 1200,
        height: 630,
        alt: "Apply to Sage Field - Round Rock Texas Homeschool Learning Community",
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
  return <>{children}</>;
}
