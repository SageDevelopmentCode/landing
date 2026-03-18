import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Our Team - Sage Field Private School",
  description:
    "Meet the dedicated educators and staff behind Sage Field Private School, a outdoor-based private microschool in Round Rock, Texas.",
  openGraph: {
    title: "Our Team - Sage Field Private School",
    description:
      "Meet the dedicated educators and staff behind Sage Field Private School in Round Rock, Texas.",
    url: "https://sagefield.co/team",
    siteName: "Sage Field Private School",
    images: [
      {
        url: "/assets/social-preview.jpg",
        width: 1200,
        height: 630,
        alt: "Our Team - Sage Field Private School",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Our Team - Sage Field Private School",
    description:
      "Meet the dedicated educators and staff behind Sage Field Private School in Round Rock, Texas.",
    images: ["/assets/social-preview.jpg"],
  },
  alternates: {
    canonical: "/team",
  },
};

export default function TeamLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
