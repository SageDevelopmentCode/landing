import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Our Story - Sage Field Private School",
  description:
    "Discover how Sage Field Private School began — a personal origin story about two parents who believed children deserved more than a traditional classroom.",
  openGraph: {
    title: "Our Story - Sage Field Private School",
    description:
      "Discover how Sage Field Private School began — a personal origin story about two parents who believed children deserved more.",
    url: "https://sagefield.co/our-story",
    siteName: "Sage Field Private School",
    images: [
      {
        url: "/assets/social-preview.jpg",
        width: 1200,
        height: 630,
        alt: "Our Story - Sage Field Private School",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Our Story - Sage Field Private School",
    description:
      "Discover how Sage Field Private School began — a personal origin story about two parents who believed children deserved more.",
    images: ["/assets/social-preview.jpg"],
  },
  alternates: {
    canonical: "/our-story",
  },
};

export default function OurStoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
