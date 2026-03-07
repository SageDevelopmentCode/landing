"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import ContactDialog from "./ContactDialog";

export default function ContactUsSection() {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);

  return (
    <section className="bg-welcome-bg py-16 px-8 sm:px-12 lg:px-16 min-h-[80vh] flex items-center">
      <div className="max-w-7xl mx-auto w-full">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          className="inline-block mb-8"
        >
          <div className="bg-badge-bg px-6 py-2 rounded-full">
            <span className="text-sm font-semibold text-text-gray font-body">
              Contact
            </span>
          </div>
        </motion.div>

        {/* Title */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          className="text-4xl md:text-5xl font-bold mb-16 text-text-gray font-heading"
        >
          Get in Touch
        </motion.h2>

        {/* Two-column layout: Text LEFT, Contact Card RIGHT */}
        <div className="flex flex-col lg:flex-row lg:justify-between items-start gap-16">
          {/* Left: Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
            className="w-full lg:w-1/2"
          >
            <p className="text-lg md:text-xl text-text-gray leading-relaxed font-body mb-8">
              Have questions or want to learn more about Sage Field? Reach out
              anytime — we&apos;d love to connect with you and your family.
            </p>

            <motion.button
              onClick={() => setContactDialogOpen(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="px-8 py-4 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-colors duration-200 shadow-md hover:shadow-lg font-body cursor-pointer"
            >
              Contact Us
            </motion.button>
          </motion.div>

          {/* Right: Contact Information Card */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
            className="w-full lg:w-1/2"
          >
            <div className="bg-white rounded-2xl p-8 shadow-lg space-y-6">
              {/* Email */}
              <motion.a
                href="mailto:sabrina@sagefield.co"
                onMouseEnter={() => setHoveredItem("email")}
                onMouseLeave={() => setHoveredItem(null)}
                whileHover={{ x: 5 }}
                transition={{ duration: 0.2 }}
                className="flex items-start gap-4 p-4 rounded-lg hover:bg-primary/5 transition-colors duration-200 cursor-pointer"
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl transition-all duration-200 ${
                    hoveredItem === "email"
                      ? "bg-primary/20 scale-110"
                      : "bg-primary/10"
                  }`}
                >
                  📧
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-primary mb-1 font-heading">
                    Email
                  </h4>
                  <p className="text-base text-text-gray font-body break-all">
                    sabrina@sagefield.co
                  </p>
                </div>
              </motion.a>

              {/* Location */}
              <motion.div
                onMouseEnter={() => setHoveredItem("location")}
                onMouseLeave={() => setHoveredItem(null)}
                whileHover={{ x: 5 }}
                transition={{ duration: 0.2 }}
                className="flex items-start gap-4 p-4 rounded-lg hover:bg-primary/5 transition-colors duration-200"
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl transition-all duration-200 ${
                    hoveredItem === "location"
                      ? "bg-primary/20 scale-110"
                      : "bg-primary/10"
                  }`}
                >
                  📍
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-primary mb-1 font-heading">
                    Location
                  </h4>
                  <p className="text-base text-text-gray font-body">
                    TBD - Round Rock, TX
                  </p>
                  <p className="text-xs text-text-gray mt-1 italic font-body">
                    For more information, please email us at{" "}
                    <a
                      href="mailto:sabrina@sagefield.co"
                      className="text-primary hover:underline"
                    >
                      sabrina@sagefield.co
                    </a>
                  </p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Contact Dialog */}
      <ContactDialog
        isOpen={contactDialogOpen}
        onClose={() => setContactDialogOpen(false)}
      />
    </section>
  );
}
