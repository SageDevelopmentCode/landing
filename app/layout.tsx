import type { Metadata } from "next";
import { Inter, Open_Sans, Merriweather } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  weight: ["400", "600", "700"],
  subsets: ["latin"],
});

const openSans = Open_Sans({
  variable: "--font-open-sans",
  weight: ["400", "600", "700"],
  subsets: ["latin"],
});

const merriweather = Merriweather({
  variable: "--font-merriweather",
  weight: ["300", "400", "700", "900"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sage Field Private School - Nature-Based Microschool | Round Rock TX",
  description:
    "Children are not meant to rot in classrooms. Choose outdoor learning. Sage Field Private School is an outdoor-focused private microschool in Round Rock, Texas. We are a small-group, outdoor-centered education that fosters curiosity, confidence, and wisdom — a structured drop-off program without the rigidity of traditional school.",
  keywords: [
    "private microschool Round Rock Texas",
    "nature-based school Round Rock TX",
    "alternative school Round Rock",
    "private school Round Rock",
    "microschool Texas",
    "outdoor learning Round Rock",
    "elementary private school",
    "small group school Texas",
    "alternative learning Round Rock",
    "private school ages 4-11",
    "nature-based learning",
    "private school Cedar Park",
    "lower elementary private school",
  ],
  authors: [{ name: "Sage Field" }],
  creator: "Sage Field",
  publisher: "Sage Field",
  metadataBase: new URL("https://sagefield.co"),
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Add your verification codes when you set up Google Search Console, Bing, etc.
    google: "AZFCLITCLhYfgrPAnl0fiw1geTwMScgM-sFKNeEJ-AM",
    // bing: 'your-bing-verification-code',
  },

  // Open Graph metadata for Facebook, LinkedIn, WhatsApp, etc.
  openGraph: {
    title:
      "Sage Field Private School: Nature-Based Microschool in Round Rock TX",
    description:
      "Sage Field Private School is an outdoor-focused private microschool in Round Rock, Texas. We are a small-group, outdoor-centered education that fosters curiosity, confidence, and wisdom — a structured drop-off program without the rigidity of traditional school.",
    url: "https://sagefield.co",
    siteName: "Sage Field Private School",
    images: [
      {
        url: "/assets/social-preview.jpg",
        width: 1200,
        height: 630,
        alt: "Sage Field Private School - Nature-Based Microschool in Round Rock TX",
      },
    ],
    locale: "en_US",
    type: "website",
  },

  // Twitter Card metadata
  twitter: {
    card: "summary_large_image",
    title:
      "Sage Field Private School: Nature-Based Microschool in Round Rock TX",
    description:
      "Sage Field Private School is an outdoor-focused private microschool in Round Rock, Texas. We are a small-group, outdoor-centered education that fosters curiosity, confidence, and wisdom — a structured drop-off program without the rigidity of traditional school.",
    images: ["/assets/social-preview.jpg"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "EducationalOrganization",
        "@id": "https://sagefield.co/#organization",
        name: "Sage Field Private School",
        alternateName: "Sage Field",
        url: "https://sagefield.co",
        email: "sabrina@sagefield.co",
        address: {
          "@type": "PostalAddress",
          streetAddress: "2760 Gattis School Rd",
          addressLocality: "Round Rock",
          addressRegion: "TX",
          postalCode: "78664",
          addressCountry: "US",
        },
        areaServed: [
          {
            "@type": "City",
            name: "Round Rock",
            "@id": "https://en.wikipedia.org/wiki/Round_Rock,_Texas",
          },
          {
            "@type": "City",
            name: "Austin",
          },
          {
            "@type": "City",
            name: "Cedar Park",
          },
          {
            "@type": "City",
            name: "Leander",
          },
        ],
        description:
          "A nature-based private microschool for lower-elementary aged children (ages 4-11) in Round Rock, Texas. Small-group, outdoor-centered education that fosters curiosity, confidence, and wisdom.",
        knowsAbout: [
          "Private School Education",
          "Microschool",
          "Outdoor Education",
          "Elementary Education",
          "Nature-based Learning",
          "Alternative Education",
        ],
        educationalCredentialAwarded: "Private School Enrollment",
      },
      {
        "@type": "WebSite",
        "@id": "https://sagefield.co/#website",
        url: "https://sagefield.co",
        name: "Sage Field Private School",
        description:
          "Nature-based private microschool in Round Rock, Texas for lower-elementary children ages 4-11",
        publisher: {
          "@id": "https://sagefield.co/#organization",
        },
        inLanguage: "en-US",
      },
    ],
  };

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body
        className={`${inter.variable} ${openSans.variable} ${merriweather.variable} antialiased`}
      >
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
