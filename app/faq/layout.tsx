import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ - Sage Field Private School | Texas Microschool",
  description:
    "Frequently asked questions about Sage Field Private School, a outdoor-based private microschool in Round Rock, Texas. Learn about our program, enrollment, and approach to small-group, outdoor-centered education for children ages 4-11.",
  openGraph: {
    title: "FAQ - Sage Field Private School | Texas Microschool",
    description:
      "Get answers to common questions about Sage Field Private School in Round Rock, Texas. Learn about our microschool model, enrollment process, and outdoor-based education approach.",
    url: "https://sagefield.co/faq",
    siteName: "Sage Field Private School",
    images: [
      {
        url: "/assets/social-preview.jpg",
        width: 1200,
        height: 630,
        alt: "Sage Field Private School FAQ - Round Rock Texas Microschool",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FAQ - Sage Field Private School | Texas Microschool",
    description:
      "Common questions about Sage Field Private School in Round Rock, Texas. Learn about enrollment, program details, and our outdoor-based microschool approach.",
    images: ["/assets/social-preview.jpg"],
  },
  alternates: {
    canonical: "/faq",
  },
};

export default function FAQLayout({ children }: { children: React.ReactNode }) {
  // Structured data for FAQ page - helps with rich results in search engines
  const faqStructuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What is Sage Field?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Sage Field Private School is an outdoor-focused private microschool in Round Rock, Texas. Sage Field operates as a private microschool, not a child-care or daycare center. We are a small-group, outdoor-centered education that fosters curiosity, confidence, and wisdom — a structured drop-off program without the rigidity of traditional school.",
        },
      },
      {
        "@type": "Question",
        name: "What is a microschool?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "A microschool is a small, independent private school — typically serving no more than 10 - 12 students per class — that offers a more personalized, flexible alternative to traditional schooling. Microschools prioritize small class sizes, individualized pacing, and innovative approaches to learning.",
        },
      },
      {
        "@type": "Question",
        name: "What ages do you serve and how big are the groups?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "We serve children ages 4-11, with flexibility based on developmental fit. Students learn together in mixed-age groups so children can move at their own pace. We intentionally keep our groups small — typically no more than 10–12 children per class — so that our adults can stay closely attuned to each child's needs.",
        },
      },
      {
        "@type": "Question",
        name: "Are you a school? Will Sage Field keep grades or transcripts?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes — Sage Field Private School is a private microschool operating under Texas private school law. We are not a traditional accredited school and do not issue grades, report cards, or transcripts in the conventional sense. Instead, we provide descriptive, portfolio-based feedback on each child's growth and progress.",
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
      />
      {children}
    </>
  );
}
