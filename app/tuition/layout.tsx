import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tuition & Enrollment - Sage Field Private School",
  description:
    "Explore tuition rates and enrollment options at Sage Field Private School — Summer Program, Full Enrollment, After Care, and Field Day Friday.",
  openGraph: {
    title: "Tuition & Enrollment - Sage Field Private School",
    description:
      "Explore tuition rates and enrollment options at Sage Field Private School — Summer Program, Full Enrollment, After Care, and Field Day Friday.",
    url: "https://sagefield.co/tuition",
    siteName: "Sage Field Private School",
    images: [
      {
        url: "/assets/social-preview.jpg",
        width: 1200,
        height: 630,
        alt: "Tuition & Enrollment - Sage Field Private School",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tuition & Enrollment - Sage Field Private School",
    description:
      "Explore tuition rates and enrollment options at Sage Field Private School — Summer Program, Full Enrollment, After Care, and Field Day Friday.",
    images: ["/assets/social-preview.jpg"],
  },
  alternates: {
    canonical: "/tuition",
  },
};

export default function TuitionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
