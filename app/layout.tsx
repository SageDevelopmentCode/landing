import type { Metadata } from "next";
import { Inter, Open_Sans, Merriweather } from "next/font/google";
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
    "Sage Field: A homeschool learning community and enrichment program for lower‑elementary aged children",
  description:
    "A homeschool learning community and enrichment program for lower‑elementary aged children offering intentional outdoor and movement first enrichment through co-creation with homeschool families. Personalised, hands-on learning that fosters curiosity, confidence, and wisdom.",

  // Open Graph metadata for Facebook, LinkedIn, WhatsApp, etc.
  openGraph: {
    title: "Sage Field: A homeschool learning community and enrichment program",
    description:
      "A homeschool learning community and enrichment program for lower‑elementary aged children offering intentional outdoor and movement first enrichment through co-creation with homeschool families. Personalised, hands-on learning that fosters curiosity, confidence, and wisdom.",
    url: "https://sagefield.co", //
    siteName: "Sage Field",
    images: [
      {
        url: "/assets/social-preview.jpg", // 1200x630px recommended
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
      "A homeschool learning community and enrichment program for lower‑elementary aged children offering intentional outdoor and movement first enrichment through co-creation with homeschool families.",
    images: ["/assets/social-preview.jpg"], // 1200x630px recommended
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${openSans.variable} ${merriweather.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
