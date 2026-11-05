"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { PARTNERS } from "@/app/lib/partnerships-data";

export default function PartnershipsPreviewSection() {
  return (
    <motion.section
      className="mb-10 border-t border-gray-100 pt-10"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease: "easeOut" as const }}
    >
      <h2 className="text-2xl md:text-3xl font-bold text-black font-heading mb-3">
        Our Partners
      </h2>
      <p className="text-base text-text-gray mb-8 leading-relaxed font-body max-w-2xl">
        We&apos;re grateful for local businesses and organizations who believe
        in adventurous, community-rooted childhood education.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {PARTNERS.map((partner, index) => (
          <motion.a
            key={partner.name}
            href={partner.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center text-center bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-primary/30 transition-all duration-200"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{
              duration: 0.5,
              delay: 0.1 + index * 0.08,
              ease: "easeOut" as const,
            }}
          >
            <div
              className={`mb-4 ${
                partner.previewLogoClassName ??
                "relative h-12 w-36 mx-auto"
              }`}
            >
              <Image
                src={partner.logo}
                alt={`${partner.name} logo`}
                fill
                className="object-contain"
                unoptimized={partner.logo.endsWith(".svg")}
              />
            </div>
            <p className="text-sm font-semibold text-gray-800 font-heading leading-snug">
              {partner.name}
            </p>
          </motion.a>
        ))}
      </div>

      <p className="mt-8">
        <Link
          href="/partnerships"
          className="text-sm font-semibold text-primary font-body hover:underline"
        >
          Learn more about our partnerships →
        </Link>
      </p>
    </motion.section>
  );
}
