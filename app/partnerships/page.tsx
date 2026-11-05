"use client";

import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import FloatingSMSButton from "../components/FloatingSMSButton";
import ContactUsSection from "../components/ContactUsSection";
import { ExternalLink } from "lucide-react";
import { ENCLAVE_HREF, PARTNERS } from "@/app/lib/partnerships-data";

const PARTNER_BODIES: Record<string, React.ReactNode> = {
  "The Enclave at Round Rock Senior Living": (
    <>
      <p className="mb-4">
        We&apos;re partnering with{" "}
        <a
          href={ENCLAVE_HREF}
          target="_blank"
          rel="noopener noreferrer"
          className="font-bold text-primary hover:underline"
        >
          The Enclave at Round Rock Senior Living
        </a>
        , operated by Spectrum Retirement Communities, to connect our students
        with residents through shared activities and conversation across
        generations — from sewing days and creative making to time together on
        campus.
      </p>
      <p>
        For us, community isn&apos;t just a topic. It&apos;s something we want
        our students to participate in. 🌱
      </p>
    </>
  ),
  "Ally Medical ER": (
    <>
      We&apos;re so grateful to have a partnership with{" "}
      <a
        href="https://www.allymedical.com/locations/round-rock-emergency-room/"
        target="_blank"
        rel="noopener noreferrer"
        className="font-bold text-primary hover:underline"
      >
        Ally Medical ER Round Rock
      </a>
      , just 6 minutes from our school, who generously gifted us two fully
      stocked first aid kits and additional supplies to help keep our students
      prepared, protected, and cared for. It truly takes a village, and
      we&apos;re thankful to have community partners who support adventurous
      childhoods as much as we do. 🌿🩹💚
    </>
  ),
  "VELA Education Fund": (
    <>
      <p className="mb-4">
        Sage Field is a VELA Microgrant Recipient and part of the VELA Founder
        Network, a national community of founders building small, human-centered
        learning environments outside the traditional school system.
      </p>
      <p>
        <a
          href="https://vela.org/"
          target="_blank"
          rel="noopener noreferrer"
          className="font-bold text-primary hover:underline"
        >
          VELA Education Fund
        </a>{" "}
        is a national nonprofit that invests in &ldquo;indie&rdquo; education
        models — microschools, homeschool co&#8209;ops, after&#8209;school
        programs, and more — through flexible grants, technology, and a growing
        network of peers. Their support helps us expand our outdoor-based,
        small-group programs and reach more families who are looking for a
        different kind of school experience.
      </p>
    </>
  ),
};

export default function PartnershipsPage() {
  return (
    <div className="min-h-screen bg-welcome-bg">
      <Navbar />

      {/* Header */}
      <section className="pt-32 pb-16 px-8 sm:px-12 lg:px-16">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            className="flex justify-center mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <span className="inline-block px-6 py-2 bg-badge-bg text-black text-sm font-semibold rounded-full">
              🤝 Community Partnerships
            </span>
          </motion.div>

          <motion.h1
            className="text-4xl md:text-5xl font-bold text-center mb-6 font-heading text-gray-800"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          >
            Our Partners
          </motion.h1>

          <motion.p
            className="text-lg md:text-xl text-center text-gray-600 font-body max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          >
            It takes a village. We&apos;re grateful for the local businesses and
            organizations who believe in adventurous, community-rooted childhood
            education.
          </motion.p>
        </div>
      </section>

      {/* Partner Cards */}
      <section className="pb-24 px-8 sm:px-12 lg:px-16">
        <div className="max-w-6xl mx-auto flex flex-col gap-16">
          {PARTNERS.map((partner, i) => {
            const reversed = i % 2 !== 0;
            return (
              <motion.div
                key={partner.name}
                className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-100"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1, ease: "easeOut" }}
              >
                {/* Facebook post embed */}
                <div
                  className={`w-full overflow-hidden flex items-center justify-center bg-gray-50 ${reversed ? "lg:order-2" : "lg:order-1"}`}
                  style={{ minHeight: partner.fbHeight }}
                >
                  <iframe
                    src={partner.fbEmbed}
                    width="500"
                    height={partner.fbHeight}
                    style={{ border: "none", overflow: "hidden" }}
                    scrolling="no"
                    allowFullScreen
                    allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                    title={`${partner.name} Facebook post`}
                  />
                </div>

                {/* Content */}
                <div
                  className={`p-8 sm:p-10 flex flex-col justify-center ${reversed ? "lg:order-1" : "lg:order-2"}`}
                >
                  {/* Logo */}
                  <div
                    className={
                      partner.logoClassName ?? "relative h-14 w-44 mb-6"
                    }
                  >
                    <Image
                      src={partner.logo}
                      alt={`${partner.name} logo`}
                      fill
                      className="object-contain object-left"
                      unoptimized={partner.logo.endsWith(".svg")}
                    />
                  </div>

                  {/* Name */}
                  <h2 className="text-xl font-bold text-gray-800 font-heading mb-6">
                    {partner.name}
                  </h2>

                  {/* Pull quote */}
                  <motion.blockquote
                    className="mb-6 p-5 bg-primary/10 border-l-4 border-primary rounded-r-xl text-sm md:text-base font-semibold italic text-gray-700 font-body"
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{
                      duration: 0.5,
                      delay: 0.15,
                      ease: "easeOut",
                    }}
                  >
                    &ldquo;{partner.pullQuote}&rdquo;
                  </motion.blockquote>

                  {/* Body */}
                  <div className="text-gray-600 font-body text-sm md:text-base leading-relaxed mb-8">
                    {PARTNER_BODIES[partner.name]}
                  </div>

                  {/* CTA */}
                  <a
                    href={partner.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white font-semibold px-6 py-3 rounded-lg transition-colors duration-200 shadow-sm self-start"
                  >
                    {partner.ctaLabel}
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      <ContactUsSection />
      <Footer />
      <FloatingSMSButton />
    </div>
  );
}
