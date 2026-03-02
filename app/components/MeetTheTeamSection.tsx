"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export default function MeetTheTeamSection() {
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
              The Team
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
          Meet the Team
        </motion.h2>

        {/* Two-column layout: Image LEFT, Text RIGHT */}
        <div className="flex flex-col lg:flex-row lg:justify-between items-center gap-16">
          {/* Left: Headshot Image */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
            className="w-full lg:w-1/2"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
              className="relative h-[50vh] sm:h-[55vh] rounded-2xl overflow-hidden shadow-lg"
            >
              <Image
                src="/assets/Headshot.jpeg"
                alt="Sabrina Grace Obnamia - Lead Teacher & Director"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
            </motion.div>
          </motion.div>

          {/* Right: Team Text Content */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
            className="w-full lg:w-1/2 space-y-8"
          >
            {/* Lead Tutor */}
            <div className="space-y-4">
              <h3 className="text-2xl md:text-3xl font-semibold text-primary font-heading">
                Lead Teacher & Director
              </h3>
              <p className="text-xl md:text-2xl font-semibold text-text-gray font-heading">
                Sabrina Grace Obnamia
              </p>
              <p className="text-base md:text-lg text-text-gray leading-relaxed font-body">
                Ms. Sabrina brings a wealth of experience to SageField. She
                holds a Bachelor&apos;s degree in Elementary Education with a
                concentration in Early Childhood Development from Biola
                University and a Teaching Credential. Her background includes
                working with children in a wide range of roles both in the U.S.
                and internationally—spanning special education, preschool,
                homeschooling, tutoring, coaching, traditional schooling, nature
                school guide, and more. She values movement, outdoor learning,
                and most importantly, the joy of slowing down to be present,
                intentional, and thankful.
              </p>
            </div>

            {/* Assistant Tutor */}
            <div className="space-y-2">
              <h3 className="text-2xl md:text-3xl font-semibold text-primary font-heading">
                Assistant Teacher/Aide
              </h3>
              <p className="text-xl md:text-2xl font-semibold text-text-gray font-heading">
                TBD
              </p>
            </div>

            {/* Description */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
              className="p-6 bg-primary/10 rounded-lg border-l-4 border-primary"
            >
              <p className="text-base md:text-lg text-text-gray leading-relaxed font-body">
                Together, we bring warmth, creativity, and experience to every
                student&apos;s learning experience. We are committed to
                continuing the supportive atmosphere families have come to
                trust.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
