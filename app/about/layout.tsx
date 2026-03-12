import type { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "About Sage Field Private School - Nature-Based Microschool Round Rock TX",
  description:
    "Learn about Sage Field Private School, a nature-based private microschool for children ages 4-11 in Round Rock, Texas. Discover our philosophy of outdoor, hands-on education and our small-group approach.",
  openGraph: {
    title:
      "About Sage Field Private School - Nature-Based Microschool Round Rock TX",
    description:
      "Learn about Sage Field Private School, a nature-based private microschool for children ages 4-11 in Round Rock, Texas.",
    url: "https://sagefield.co/about",
    siteName: "Sage Field Private School",
    images: [
      {
        url: "/assets/social-preview.jpg",
        width: 1200,
        height: 630,
        alt: "About Sage Field Private School - Round Rock Texas Microschool",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title:
      "About Sage Field Private School - Nature-Based Microschool Round Rock TX",
    description:
      "Learn about our nature-based private microschool in Round Rock, Texas offering outdoor, hands-on education for children ages 4-11.",
    images: ["/assets/social-preview.jpg"],
  },
  alternates: {
    canonical: "/about",
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
