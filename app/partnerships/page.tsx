"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import FloatingSMSButton from "../components/FloatingSMSButton";
import ContactUsSection from "../components/ContactUsSection";
import { ExternalLink } from "lucide-react";

const PARTNERS = [
  {
    name: "Ally Medical ER",
    location: "Round Rock, TX",
    logo: "/assets/AllyLogo.jpg",
    href: "https://www.allymedical.com/locations/round-rock-emergency-room/",
    fbEmbed:
      "https://www.facebook.com/plugins/post.php?href=https%3A%2F%2Fwww.facebook.com%2Fsagefield.co%2Fposts%2Fpfbid0kU7sghZ3iWpHtxsbvcvP2ZMBwmWrkdSQ3nx1GfM4T3mwiwpvuCGzX7nrdJaxEwx2l&show_text=true&width=500",
    pullQuote:
      "Sending your children to an outdoor-focused school where they are encouraged to try \"dangerous things safely\" — climbing trees, testing their balance, building confidence, and racing down slip n' slides — comes with a big responsibility: keeping them safe while they explore.",
  },
];

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
          {PARTNERS.map((partner, i) => (
            <motion.div
              key={partner.name}
              className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-100"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1, ease: "easeOut" }}
            >
              {/* Left — Facebook post embed */}
              <div className="min-h-[776px] w-full overflow-hidden flex items-center justify-center bg-gray-50">
                <iframe
                  src={partner.fbEmbed}
                  width="500"
                  height="776"
                  style={{ border: "none", overflow: "hidden" }}
                  scrolling="no"
                  frameBorder={0}
                  allowFullScreen
                  allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                  title={`${partner.name} Facebook post`}
                />
              </div>

              {/* Right — Content */}
              <div className="p-8 sm:p-10 flex flex-col justify-center">
                {/* Logo */}
                <div className="relative h-14 w-44 mb-6">
                  <Image
                    src={partner.logo}
                    alt={`${partner.name} logo`}
                    fill
                    className="object-contain object-left"
                  />
                </div>

                {/* Name + location chips */}
                <div className="flex flex-wrap items-center gap-3 mb-6">
                  <span className="px-4 py-1.5 bg-emerald-50 text-emerald-700 text-sm font-semibold rounded-full">
                    {partner.name}
                  </span>
                  <span className="px-4 py-1.5 bg-gray-100 text-gray-600 text-sm font-medium rounded-full">
                    📍 {partner.location}
                  </span>
                </div>

                {/* Pull quote */}
                <motion.blockquote
                  className="mb-6 p-5 bg-primary/10 border-l-4 border-primary rounded-r-xl text-sm md:text-base font-semibold italic text-gray-700 font-body"
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
                >
                  &ldquo;{partner.pullQuote}&rdquo;
                </motion.blockquote>

                {/* Body */}
                <p className="text-gray-600 font-body text-sm md:text-base leading-relaxed mb-8">
                  We&apos;re so grateful to have a partnership with{" "}
                  <a
                    href={partner.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-primary hover:underline"
                  >
                    Ally Medical ER Round Rock
                  </a>
                  , just 6 minutes from our school, who generously gifted us two
                  fully stocked first aid kits and additional supplies to help
                  keep our students prepared, protected, and cared for. It truly
                  takes a village, and we&apos;re thankful to have community
                  partners who support adventurous childhoods as much as we do.
                  🌿🩹💚
                </p>

                {/* CTA */}
                <a
                  href={partner.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white font-semibold px-6 py-3 rounded-lg transition-colors duration-200 shadow-sm self-start"
                >
                  Visit Ally Medical ER
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <ContactUsSection />
      <Footer />
      <FloatingSMSButton />
    </div>
  );
}
