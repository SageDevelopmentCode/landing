import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ - Sage Field Private School | Texas Microschool",
  description:
    "Frequently asked questions about Sage Field Private School, a nature-based private microschool in Round Rock, Texas. Learn about our program, enrollment, and approach to small-group, outdoor-centered education for lower-elementary children.",
  openGraph: {
    title: "FAQ - Sage Field Private School | Texas Microschool",
    description:
      "Get answers to common questions about Sage Field Private School in Round Rock, Texas. Learn about our microschool model, enrollment process, and nature-based education approach.",
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
      "Common questions about Sage Field Private School in Round Rock, Texas. Learn about enrollment, program details, and our nature-based microschool approach.",
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
          text: "Sage Field Private School is a nature-based private microschool for lower-elementary children ages 6–10. We are a small, intentional learning community where outdoor exploration, hands-on academics, and child-led inquiry come together in a structured drop-off program. We operate under Texas private school law as an independent private school.",
        },
      },
      {
        "@type": "Question",
        name: "What is a microschool?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "A microschool is a small, independent private school — typically serving fewer than 15–20 students — that offers a more personalized, flexible alternative to traditional schooling. Microschools prioritize small class sizes, individualized pacing, and innovative approaches to learning. Sage Field fits this model: we are a licensed private school with intentional, nature-based education at our core.",
        },
      },
      {
        "@type": "Question",
        name: "What ages do you serve and how big are the groups?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "We serve lower-elementary aged children, about 6–10 years with flexibility based on developmental fit. We intentionally keep our groups small — typically no more than 10–12 children per class.",
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
      {
        "@type": "Question",
        name: "How often can my child attend?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Sage Field is open up to four days per week for approximately six hours each day. You choose the schedule option that best fits your family's rhythm.",
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
