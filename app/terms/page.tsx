"use client";

import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import FloatingSMSButton from "../components/FloatingSMSButton";
import { TERMS_SECTIONS } from "@/app/legal/terms-sections";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-welcome-bg">
      <Navbar />

      <section className="pt-32 pb-12 px-8 sm:px-12 lg:px-16">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            className="flex justify-center mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" as const }}
          >
            <span className="inline-block px-6 py-2 bg-badge-bg text-black text-sm font-semibold rounded-full">
              Terms of Use
            </span>
          </motion.div>

          <motion.h1
            className="text-4xl md:text-5xl font-bold mb-6 font-heading text-gray-800"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" as const }}
          >
            Terms of Use
          </motion.h1>

          <motion.p
            className="text-lg text-gray-600 font-body"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" as const }}
          >
            These terms govern your use of the Sage Field website, parent
            portal, and mobile app.
          </motion.p>

          <motion.p
            className="text-sm text-gray-400 font-body mt-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" as const }}
          >
            Last Updated: April 8, 2026
          </motion.p>
        </div>
      </section>

      <section className="pb-20 px-8 sm:px-12 lg:px-16">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-12">
            {TERMS_SECTIONS.map((section, index) => (
              <motion.div
                key={section.id}
                id={section.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.6,
                  delay: index < 3 ? index * 0.1 : 0,
                  ease: "easeOut" as const,
                }}
              >
                <h2 className="text-xl md:text-2xl font-bold mb-4 font-heading text-gray-800 border-b border-gray-200 pb-2">
                  {section.title}
                </h2>
                <div className="font-body text-gray-600 leading-relaxed">
                  {section.content}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
      <FloatingSMSButton />
    </div>
  );
}