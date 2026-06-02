"use client";

import React from "react";
import { motion } from "framer-motion";
import { Instagram, Facebook } from "lucide-react";
import Script from "next/script";

const BEHOLD_FEED_ID = "g1vEDJecOPczj84RYrJF";

export default function SocialMediaSection() {

  return (
    <section className="bg-welcome-bg py-16 px-8 sm:px-12 lg:px-16 min-h-[80vh] flex items-center justify-center">
      <div className="max-w-7xl mx-auto w-full">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-6"
        >
          <span className="inline-block px-6 py-2 bg-badge-bg text-black text-sm font-semibold rounded-full font-body">
            Follow Us
          </span>
        </motion.div>

        {/* Title */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl md:text-5xl font-bold text-black font-heading mb-6 text-center"
        >
          Follow Us on Social Media
        </motion.h2>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-base md:text-lg text-text-gray leading-relaxed font-body mb-8 text-center max-w-3xl mx-auto"
        >
          Join our community and stay connected! Follow us to see behind-the-scenes moments,
          educational insights, and the joyful learning experiences at Sage Field.
        </motion.p>

        {/* Instagram Feed */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-10"
        >
          <Script
            src="https://w.behold.so/widget.js"
            type="module"
            strategy="lazyOnload"
          />
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {(React as any).createElement("behold-widget", {
            "feed-id": BEHOLD_FEED_ID,
          })}
        </motion.div>

        {/* Social Media Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex items-center justify-center gap-4 mt-8"
        >
          <a
            href="https://www.instagram.com/sagefield.co"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-6 py-3 text-white font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg font-body"
            style={{ backgroundColor: '#E4405F' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#D62D4F'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#E4405F'}
          >
            <Instagram className="w-5 h-5" />
            <span>Instagram</span>
          </a>
          <a
            href="https://www.facebook.com/sagefield.co"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-6 py-3 text-white font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg font-body"
            style={{ backgroundColor: '#1877F2' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0E63D6'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1877F2'}
          >
            <Facebook className="w-5 h-5" />
            <span>Facebook</span>
          </a>
        </motion.div>
      </div>
    </section>
  );
}
