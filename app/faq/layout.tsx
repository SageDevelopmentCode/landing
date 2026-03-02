import type { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "FAQ - Sage Field Homeschool Co-op Georgetown TX | Common Questions",
  description:
    "Frequently asked questions about Sage Field, a homeschool learning community and enrichment program in Georgetown, Texas. Learn about our co-op model, enrollment, program details, and alternative learning approach for K-3 students.",
  openGraph: {
    title: "FAQ - Sage Field Homeschool Co-op Georgetown TX",
    description:
      "Get answers to common questions about Sage Field homeschool learning community in Georgetown, Texas. Learn about our program, enrollment, and co-creation approach.",
    url: "https://sagefield.co/faq",
    siteName: "Sage Field",
    images: [
      {
        url: "/assets/social-preview.jpg",
        width: 1200,
        height: 630,
        alt: "Sage Field FAQ - Georgetown Texas Homeschool Learning Community",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FAQ - Sage Field Homeschool Co-op Georgetown TX",
    description:
      "Common questions about our homeschool learning community in Georgetown, Texas. Learn about enrollment, program details, and our approach.",
    images: ["/assets/social-preview.jpg"],
  },
  alternates: {
    canonical: "/faq",
  },
};

export default function FAQLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
          text: "Sage Field is a homeschool learning community for roughly ages 6–10 where children come together to learn, play, and grow in a small, mixed-age group. We exist to support homeschooling families with rich, hands-on experiences, not to replace your homeschool.",
        },
      },
      {
        "@type": "Question",
        name: "What ages do you serve and how big are the groups?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "We focus on lower-elementary ages, about 6–10 years with flexibility based on developmental fit. We intentionally keep our groups small with typically no more than about 10–12 children per class.",
        },
      },
      {
        "@type": "Question",
        name: "Are you a school? Will Sage Field keep grades or transcripts?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No. Sage Field is not a traditional school, is not accredited, and does not function as a child's school of record. We do not issue grades, report cards, official assessments, or transcripts.",
        },
      },
      {
        "@type": "Question",
        name: "What is 'Co-Creation' at Sage Field?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Co-Creation is our way of describing a true partnership between Sage Field and homeschooling families. We weave together what happens here with what you're doing at home so your child experiences one coherent learning life.",
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
