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
  title:
    "Sage Field - Round Rock TX Homeschool Learning Community & Enrichment Program",
  description:
    "A homeschool learning community and enrichment program for lower-elementary aged children in Round Rock, Texas offering intentional outdoor and movement-first enrichment through co-creation with homeschool families. Personalised, hands-on learning that fosters curiosity, confidence, and wisdom.",
  keywords: [
    "homeschool co-op Round Rock Texas",
    "homeschool pod Round Rock TX",
    "alternative school Round Rock",
    "learning group community",
    "homeschool enrichment program",
    "outdoor learning Round Rock",
    "elementary homeschool",
    "home school group Texas",
    "alternative learning Round Rock",
    "K-3 homeschool",
    "nature-based learning",
    "homeschool community Round Rock",
    "homeschool Cedar Park",
    "lower elementary homeschool",
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
    title: "Sage Field: A homeschool learning community and enrichment program",
    description:
      "A homeschool learning community and enrichment program for lower-elementary aged children offering intentional outdoor and movement-first enrichment through co-creation with homeschool families. Personalised, hands-on learning that fosters curiosity, confidence, and wisdom.",
    url: "https://sagefield.co",
    siteName: "Sage Field",
    images: [
      {
        url: "/assets/social-preview.jpg",
        width: 1200,
        height: 630,
        alt: "Sage Field - A homeschool learning community and enrichment program",
      },
    ],
    locale: "en_US",
    type: "website",
  },

  // Twitter Card metadata
  twitter: {
    card: "summary_large_image",
    title: "Sage Field: A homeschool learning community and enrichment program",
    description:
      "A homeschool learning community and enrichment program for lower-elementary aged children offering intentional outdoor and movement-first enrichment through co-creation with homeschool families.",
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
        name: "Sage Field",
        alternateName: "Sage Field Homeschool Co-op",
        url: "https://sagefield.co",
        email: "sabrina@sagefield.co",
        address: {
          "@type": "PostalAddress",
          addressLocality: "Round Rock",
          addressRegion: "TX",
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
          "A homeschool learning community and enrichment program for lower-elementary aged children (K-3) offering intentional outdoor and movement-first enrichment through co-creation with homeschool families in Round Rock, Texas.",
        knowsAbout: [
          "Homeschool Education",
          "Alternative Learning",
          "Outdoor Education",
          "Elementary Education",
          "Co-op Learning",
          "Nature-based Learning",
        ],
        educationalCredentialAwarded: "Homeschool Enrichment Certificate",
      },
      {
        "@type": "WebSite",
        "@id": "https://sagefield.co/#website",
        url: "https://sagefield.co",
        name: "Sage Field",
        description:
          "Round Rock Texas homeschool co-op and alternative learning community for K-3 students",
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
