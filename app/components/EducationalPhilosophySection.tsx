"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export default function EducationalPhilosophySection() {
  const pillars = [
    {
      icon: "🌱",
      title: "Hands-on Learning",
      image: "/assets/ImageOne.jpg",
      description: "Experiential activities that engage curiosity",
    },
    {
      icon: "🧘",
      title: "Emotional Regulation",
      image: "/assets/kelly-sikkema-_4WVngcGz5Q-unsplash.jpg",
      description: "Mindfulness practices for students & educators",
    },
    {
      icon: "🎨",
      title: "Creative Expression",
      image: "/assets/ImageEleven.jpg",
      description: "Artistic and musical creativity flourish",
    },
    {
      icon: "🌳",
      title: "Movement & Nature",
      image: "/assets/ImageSeven.jpg",
      description: "Movement-based and outdoor education",
    },
  ];

  return (
    <section id="educational-philosophy" className="bg-welcome-bg min-h-[80vh] py-16 px-8 sm:px-12 lg:px-16 flex items-center justify-center">
      <div className="max-w-7xl mx-auto w-full">
        {/* How We Learn Badge */}
        <motion.div
          className="flex justify-start mb-8"
          initial={{ opacity: 0, y: -10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <span className="inline-block px-6 py-2 bg-badge-bg text-black text-sm font-semibold rounded-full">
            How We Learn
          </span>
        </motion.div>

        {/* Two Column Layout - Text on Left, Cards on Right */}
        <div className="flex flex-col lg:flex-row lg:justify-between items-start gap-16 w-full">
          {/* Left Column: Text Content */}
          <div className="w-full lg:w-1/2 text-left">
            {/* Title */}
            <motion.h2
              className="text-4xl md:text-5xl font-bold text-black font-heading mb-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
            >
              How We Learn
            </motion.h2>

            {/* Subtitle */}
            <motion.p
              className="text-2xl md:text-3xl font-semibold text-primary font-heading mb-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            >
              Educational Philosophy
            </motion.p>

            {/* Description Paragraphs */}
            <motion.p
              className="text-base md:text-lg text-text-gray mb-6 leading-relaxed font-body"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
            >
              Our approach integrates elements of{" "}
              <span className="text-primary font-semibold">Montessori</span>,{" "}
              <span className="text-primary font-semibold">Waldorf</span>, and{" "}
              <span className="text-primary font-semibold">
                Reggio Emilia
              </span>{" "}
              methods with{" "}
              <span className="text-primary font-semibold">
                TEKS-aligned academics
              </span>
              . We enrich learning with social-emotional education, arts, music,
              and creative problem-solving.
            </motion.p>

            <motion.p
              className="text-base md:text-lg text-text-gray mb-6 leading-relaxed font-body"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
            >
              We value{" "}
              <span className="text-primary font-semibold">
                emotional regulation
              </span>
              , both for students and educators. A calm, connected teacher
              creates a community where children thrive.
            </motion.p>
          </div>

          {/* Right Column: Interactive Pillar Cards */}
          <motion.div
            className="w-full lg:w-1/2"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          >
            <div className="overflow-x-auto flex snap-x snap-mandatory gap-4 pb-4 [&::-webkit-scrollbar]:hidden [scrollbar-width:none] lg:overflow-visible lg:grid lg:grid-cols-2">
              {pillars.map((pillar, index) => (
                <motion.div
                  key={index}
                  className="w-[80%] flex-shrink-0 snap-start lg:w-full bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105 cursor-pointer group overflow-hidden"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.3 + index * 0.1, ease: "easeOut" }}
                >
                  {/* Image */}
                  <div className="relative w-full h-40 rounded-t-lg overflow-hidden">
                    <Image
                      src={pillar.image}
                      alt={pillar.title}
                      fill
                      className="object-cover"
                    />
                  </div>

                  {/* Card Body */}
                  <div className="p-6">
                    {/* Title */}
                    <h3 className="text-lg font-semibold text-black mb-2 font-heading">
                      {pillar.title}
                    </h3>

                    {/* Description */}
                    <p className="text-sm text-text-gray font-body">
                      {pillar.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
