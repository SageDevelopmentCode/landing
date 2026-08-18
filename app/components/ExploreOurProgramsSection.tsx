"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

const programs = [
  {
    badge: "School Year",
    badgeColor: "bg-primary/10",
    title: "School Year 2026–2027",
    dates: "August 17, 2026 – March 2027",
    details: [
      "Ages 4–11",
      "Mon-Thu",
      "6-month commitment",
      "~10 children per class",
      "Field Fridays",
      "Aftercare",
    ],
    description:
      "A full school-year microschool experience blending Montessori, Waldorf, and Reggio-inspired methods with TEKS-aligned academics.",
    href: "/school-year-2026-2027",
    image: "/assets/ImageTwo.jpg",
    dateBg: "bg-lavender/40",
    dateText: "text-purple-700",
    ctaHref: "/apply?tab=school-year",
  },
  {
    badge: "Homeschool",
    badgeColor: "bg-emerald-100",
    title: "Homeschool Drop-In",
    dates: "Available for Both Programs",
    details: [
      "Ages 4–11",
      "1–3 Days/Week",
      "Field Fridays",
      "Flexible Scheduling",
    ],
    description:
      "Flexible drop-in program for homeschool families — choose 1 to 3 days per week with ability-based learning, enrichments, and Friday Field Days.",
    href: "/homeschool",
    image: "/assets/After1.png",
    dateBg: "bg-emerald-50",
    dateText: "text-emerald-700",
    ctaHref: "/apply?tab=homeschool",
  },
];

interface ExploreOurProgramsSectionProps {
  embedded?: boolean;
  className?: string;
  containerClassName?: string;
}

function ProgramsContent() {
  return (
    <>
      <motion.div
        className="flex justify-start mb-4"
        initial={{ opacity: 0, y: -10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, ease: "easeOut" as const }}
      >
        <span className="inline-block px-6 py-2 bg-badge-bg text-black text-sm font-semibold rounded-full">
          Our Programs
        </span>
      </motion.div>

      <motion.h2
        className="text-3xl md:text-4xl font-bold text-black font-heading mb-10"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" as const }}
      >
        Explore Our Programs
      </motion.h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
        {programs.map((program, index) => (
          <motion.div
            key={program.href}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{
              duration: 0.6,
              delay: 0.1 + index * 0.15,
              ease: "easeOut" as const,
            }}
          >
            <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 h-full flex flex-col">
              <div className="relative h-48 w-full">
                <Image
                  src={program.image}
                  alt={program.title}
                  fill
                  className="object-cover"
                />
              </div>

              <div className="p-6 flex flex-col flex-1">
                <Link
                  href="/apply"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full self-start mb-3 hover:bg-green-200 transition-colors"
                >
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                  Enrollment is now open
                  <span>→</span>
                </Link>

                <h3 className="text-xl font-bold text-black font-heading mb-3">
                  {program.title}
                </h3>

                <div
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full ${program.dateBg} ${program.dateText} text-xs font-semibold mb-4 self-start`}
                >
                  📅 {program.dates}
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {program.details.map((detail) => (
                    <span
                      key={detail}
                      className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full"
                    >
                      {detail}
                    </span>
                  ))}
                </div>

                <p className="text-sm text-text-gray font-body leading-relaxed mb-4 flex-1">
                  {program.description}
                </p>

                <div className="flex items-center gap-4">
                  <Link
                    href={program.href}
                    className="text-primary font-semibold text-sm hover:underline"
                  >
                    Learn More
                  </Link>
                  <Link
                    href={program.ctaHref ?? "/apply"}
                    className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Enroll Now
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </>
  );
}

export default function ExploreOurProgramsSection({
  embedded = false,
  className = "bg-white py-16 px-8 sm:px-12 lg:px-16",
  containerClassName = "max-w-7xl mx-auto",
}: ExploreOurProgramsSectionProps) {
  if (embedded) {
    return <ProgramsContent />;
  }

  return (
    <section className={className}>
      <div className={containerClassName}>
        <ProgramsContent />
      </div>
    </section>
  );
}
