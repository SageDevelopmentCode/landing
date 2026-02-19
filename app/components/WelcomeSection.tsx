"use client";

import Card from "./Card";
import { motion } from "framer-motion";

export default function WelcomeSection() {
  const cards = [
    {
      title: "Co-Creation",
      description:
        "Working alongside families to nurture curiosity and confidence through personalized learning experiences.",
      icon: "🤝",
    },
    {
      title: "Nature-Based Learning",
      description:
        "Hands-on outdoor experiences that connect children to the natural world and foster real-world wisdom.",
      icon: "🌿",
    },
    {
      title: "Small Groups",
      description:
        "Personalized attention for children ages 6-10 in intimate learning environments designed for growth.",
      icon: "👥",
    },
    {
      title: "Wisdom Focus",
      description:
        "Beyond memorization - transforming knowledge into living wisdom through curiosity, reflection, and experience.",
      icon: "💡",
    },
  ];

  return (
    <section className="bg-welcome-bg min-h-[80vh] py-16 px-8 sm:px-12 lg:px-16 flex flex-col">
      <div className="max-w-7xl w-full">
        {/* Welcome Badge */}
        <motion.div
          className="flex justify-start mb-8"
          initial={{ opacity: 0, y: -10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <span className="inline-block px-6 py-2 bg-badge-bg text-black text-sm font-semibold rounded-full">
            Welcome
          </span>
        </motion.div>
      </div>

      {/* Centered Content Container */}
      <div className="flex items-center w-full">
        {/* Two Column Layout */}
        <div className="flex flex-col lg:flex-row lg:justify-between items-center gap-64 w-full">
          {/* Left Column: Text Content */}
          <div className="text-left max-w-2xl">
            {/* Title */}
            <motion.h2
              className="text-4xl md:text-5xl font-bold text-black font-heading mb-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
            >
              Welcome to Sage Field!
            </motion.h2>

            {/* Subtitle */}
            <motion.p
              className="text-2xl md:text-3xl font-semibold text-primary font-heading mb-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            >
              Wisdom &gt; Knowledge
            </motion.p>

            {/* Introduction Paragraph */}
            <motion.p
              className="text-base md:text-lg text-text-gray mb-16 leading-relaxed font-body"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
            >
              Sage Field is a small-group learning community for children ages
              6–10, designed especially for homeschool families seeking a{" "}
              <span className="text-primary font-semibold">nature-based</span>{" "}
              enrichment experience. Rooted in the idea of{" "}
              <span className="text-primary font-semibold">co-creation</span>,
              we work alongside families to nurture{" "}
              <span className="text-primary font-semibold">curiosity</span>,{" "}
              <span className="text-primary font-semibold">confidence</span>,
              and <span className="text-primary font-semibold">wisdom</span>{" "}
              through{" "}
              <span className="text-primary font-semibold">personalized</span>,{" "}
              <span className="text-primary font-semibold">hands-on</span>{" "}
              learning.
            </motion.p>

            {/* Wisdom vs. Knowledge Section */}
            <motion.div
              className="mb-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
            >
              <h3 className="text-2xl md:text-3xl font-bold text-black font-heading mb-6">
                Wisdom vs. Knowledge
              </h3>
              <p className="text-base md:text-lg text-text-gray leading-relaxed font-body">
                At Sage Field, we see children as seeds of endless possibility.
                We believe{" "}
                <span className="text-primary font-semibold">wisdom</span> is
                what transforms learning into living, helping children connect
                ideas to real experiences and make thoughtful choices. Through
                our approach of{" "}
                <span className="text-primary font-semibold">co-creation</span>,
                families and mentors work together to nurture{" "}
                <span className="text-primary font-semibold">curiosity</span>{" "}
                and reflection both in and beyond the lesson.
              </p>
            </motion.div>

            {/* Call to Action Button */}
            <motion.button
              className="px-8 py-4 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-colors duration-200 shadow-md hover:shadow-lg font-body"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
            >
              Learn More About Our Program
            </motion.button>
          </div>

          {/* Right Column: 2x2 Cards Grid */}
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 gap-6"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          >
            {cards.map((card, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 + index * 0.1, ease: "easeOut" }}
              >
                <Card
                  title={card.title}
                  description={card.description}
                  iconPlaceholder={card.icon}
                />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
