import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Visit Sage Field | Campus Tour & Shadow Day",
  description:
    "We'd love to show you around Sage Field Private School in Round Rock, Texas. Choose a free campus tour or book a shadow day so your child can experience a real school day outdoors.",
  keywords: [
    "Sage Field campus tour",
    "shadow day Round Rock",
    "private school visit Texas",
    "microschool tour",
    "Sage Field shadow day",
    "outdoor school visit",
  ],
  openGraph: {
    title: "Visit Sage Field | Campus Tour & Shadow Day",
    description:
      "Two ways to visit Sage Field in Round Rock — schedule a free campus tour or book a shadow day for your child.",
    url: "https://sagefield.co/visit",
    siteName: "Sage Field Private School",
    images: [
      {
        url: "/assets/social-preview.jpg",
        width: 1200,
        height: 630,
        alt: "Visit Sage Field Private School — campus tour and shadow day",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Visit Sage Field | Campus Tour & Shadow Day",
    description:
      "Schedule a free campus tour or book a shadow day at Sage Field Private School in Round Rock, Texas.",
    images: ["/assets/social-preview.jpg"],
  },
  alternates: {
    canonical: "/visit",
  },
};

export default function VisitLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
