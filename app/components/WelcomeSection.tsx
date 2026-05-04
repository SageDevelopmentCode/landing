"use client";

import Card from "./Card";
import { motion } from "framer-motion";

export default function WelcomeSection() {
  const cards = [
    {
      title: "Family Partnership",
      description:
        "We stay in close communication with families and invite parents to support the learning journey at home — while Sage Field handles the full in-school program.",
      icon: "🤝",
      image: "/assets/foto-dial-mrTd-QXJqK0-unsplash.jpg",
    },
    {
      title: "Hands-on Learning",
      description:
        "Hands-on outdoor and movement-based experiences that connect children to the world around them and foster real-world wisdom.",
      icon: "🌿",
      image: "/assets/ImageEleven.jpg",
    },
    {
      title: "Small Groups",
      description:
        "Personalized attention in intimate learning environments designed for learning and growth.",
      icon: "👥",
      image: "/assets/ImageFive.jpg",
    },
    {
      title: "Wisdom Focus",
      description:
        "Beyond memorization - transforming knowledge into living wisdom through curiosity, reflection, and experience.",
      icon: "💡",
      image: "/assets/ImageSeven.jpg",
    },
  ];

  return (
    <section className="bg-welcome-bg min-h-[80vh] py-16 flex items-center justify-center overflow-hidden">
      <div className="max-w-7xl mx-auto w-full px-8 sm:px-12 lg:px-16">
        {/* Welcome Badge */}
        <motion.div
          className="flex justify-start mb-8"
          initial={{ opacity: 0, y: -10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: "easeOut" as const }}
        >
          <span className="inline-block px-6 py-2 bg-badge-bg text-black text-sm font-semibold rounded-full">
            Welcome
          </span>
        </motion.div>

        {/* Text Block */}
        <div className="text-left max-w-2xl mb-12">
          {/* Title */}
          <motion.h2
            className="text-4xl md:text-5xl font-bold text-black font-heading mb-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" as const }}
          >
            What is Sage Field?
          </motion.h2>

          {/* Introduction Paragraph */}
          <motion.p
            className="text-base md:text-lg text-text-gray leading-relaxed font-body"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" as const }}
          >
            Sage Field Private School is an outdoor-focused private microschool
            in Round Rock, Texas for children ages 4-11. Sage Field operates as
            a private microschool, not a child-care or daycare center.We offer
            small-group, outdoor-centered education that fosters curiosity,
            confidence, and wisdom through personalised, hands-on learning.
          </motion.p>
        </div>

        {/* Horizontal Scroll Row */}
        <motion.div
          className="overflow-x-auto flex snap-x snap-mandatory gap-4 [&::-webkit-scrollbar]:hidden [scrollbar-width:none] lg:overflow-visible lg:grid lg:grid-cols-2"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" as const }}
        >
          {cards.map((card, index) => (
            <div
              key={index}
              className="w-[80%] flex-shrink-0 snap-start h-full lg:w-full"
            >
              <Card
                title={card.title}
                description={card.description}
                iconPlaceholder={card.icon}
                image={card.image}
              />
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
