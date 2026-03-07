import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Sage Field - Round Rock TX Homeschool Learning Community",
  description:
    "Learn about Sage Field, a homeschool learning community and enrichment program for lower-elementary aged children in Round Rock, Texas. Discover our philosophy of outdoor, movement-first education through co-creation with homeschool families.",
  openGraph: {
    title: "About Sage Field - Round Rock TX Homeschool Learning Community",
    description:
      "Learn about Sage Field, a homeschool learning community and enrichment program for lower-elementary aged children in Round Rock, Texas.",
    url: "https://sagefield.co/about",
    siteName: "Sage Field",
    images: [
      {
        url: "/assets/social-preview.jpg",
        width: 1200,
        height: 630,
        alt: "About Sage Field - Round Rock Texas Homeschool Learning Community",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "About Sage Field - Round Rock TX Homeschool Learning Community",
    description:
      "Learn about our homeschool learning community in Round Rock, Texas offering outdoor, movement-first enrichment for lower-elementary children.",
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
