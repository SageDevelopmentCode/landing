"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";

export default function ContinuitySection() {
  const [hoveredRoot, setHoveredRoot] = useState<string | null>(null);

  const roots = [
    {
      id: "structure",
      icon: "🏫",
      image: "/assets/juliane-liebermann-hGNMJB7A33Q-unsplash.jpg",
      title: "Familiar Structure",
      description: "Same daily rhythm & routines",
      outcome: "lower-stress",
    },
    {
      id: "friendships",
      icon: "👥",
      image: "/assets/serap-butun-QpWDK7D2Q4Q-unsplash.jpg",
      title: "Consistent Friendships",
      description: "Same peer community",
      outcome: "social-bonds",
    },
    {
      id: "educators",
      icon: "👨‍🏫",
      image: "/assets/team/Paige.webp",
      title: "Trusted Educators",
      description: "Same caring teachers",
      outcome: "emotional-safety",
    },
    {
      id: "rhythm",
      icon: "📚",
      image: "/assets/vitolda-klein-OD1_HupXwxI-unsplash.jpg",
      title: "Same Learning Flow",
      description: "Familiar learning approach",
      outcome: "confidence",
    },
  ];

  const outcomes = [
    {
      id: "lower-stress",
      label: "Lower Stress & Anxiety",
      color: "bg-primary/50",
      hoverColor: "bg-primary/70",
    },
    {
      id: "social-bonds",
      label: "Healthy Social Bonds",
      color: "bg-mint-cream/80",
      hoverColor: "bg-mint-cream",
    },
    {
      id: "emotional-safety",
      label: "Emotional Safety",
      color: "bg-sky-blue/80",
      hoverColor: "bg-sky-blue",
    },
    {
      id: "confidence",
      label: "Greater Confidence",
      color: "bg-lavender/80",
      hoverColor: "bg-lavender",
    },
  ];

  return (
    <section className="bg-welcome-bg min-h-[80vh] py-16 px-8 sm:px-12 lg:px-16 flex items-center justify-center">
      <div className="max-w-7xl mx-auto w-full">
        {/* Badge */}
        <motion.div
          className="flex justify-start mb-8"
          initial={{ opacity: 0, y: -10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <span className="inline-block px-6 py-2 bg-badge-bg text-black text-sm font-semibold rounded-full">
            Community Continuity
          </span>
        </motion.div>

        {/* Two Column Layout - Tree LEFT, Text RIGHT */}
        <div className="flex flex-col lg:flex-row lg:justify-between items-start gap-16 w-full">
          {/* Left Column: Interactive Tree Diagram */}
          <div className="w-full lg:w-1/2 flex flex-col items-center">
            {/* Growth Outcomes (Top) */}
            <div className="mb-12 w-full">
              <motion.div
                className="grid grid-cols-2 gap-4 mb-8"
                initial={{ opacity: 0, y: -20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
              >
                {outcomes.map((outcome, index) => (
                  <motion.div
                    key={outcome.id}
                    className={`px-4 py-3 rounded-lg text-center text-sm font-bold text-black transition-all duration-300 ${
                      hoveredRoot &&
                      roots.find((r) => r.outcome === outcome.id)?.id ===
                        hoveredRoot
                        ? outcome.hoverColor + " scale-105 shadow-md"
                        : outcome.color
                    }`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.2 + index * 0.1, ease: "easeOut" }}
                  >
                    {outcome.label}
                  </motion.div>
                ))}
              </motion.div>

              {/* Visual Stems/Connections */}
              <div className="relative h-16 mb-4">
                <svg
                  className="w-full h-full"
                  viewBox="0 0 400 60"
                  preserveAspectRatio="none"
                >
                  {/* Lines from roots to outcomes */}
                  {roots.map((root, index) => {
                    const isHovered = hoveredRoot === root.id;
                    const x1 = (index % 2) * 200 + 100;
                    const x2 = (index % 2) * 200 + 100;
                    const y1 = 60;
                    const y2 = 0;

                    return (
                      <line
                        key={root.id}
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke={isHovered ? "#f29a8f" : "#f29a8f80"}
                        strokeWidth={isHovered ? "3" : "2"}
                        className="transition-all duration-300"
                      />
                    );
                  })}
                </svg>
              </div>
            </div>

            {/* Root Cards (Bottom) */}
            <div className="w-full">
              <div className="overflow-x-auto flex snap-x snap-mandatory gap-4 pb-4 [&::-webkit-scrollbar]:hidden [scrollbar-width:none] lg:overflow-visible lg:grid lg:grid-cols-2">
                {roots.map((root, index) => (
                  <motion.div
                    key={root.id}
                    onMouseEnter={() => setHoveredRoot(root.id)}
                    onMouseLeave={() => setHoveredRoot(null)}
                    className={`w-[80%] flex-shrink-0 snap-start lg:w-full bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105 cursor-pointer group overflow-hidden ${
                      hoveredRoot === root.id ? "ring-2 ring-primary" : ""
                    }`}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.4 + index * 0.1, ease: "easeOut" }}
                  >
                    {/* Image Header */}
                    <div className="relative w-full h-40 overflow-hidden">
                      <Image src={root.image} alt={root.title} fill className="object-cover" />
                    </div>

                    {/* Card Body */}
                    <div className="p-6">
                      {/* Title */}
                      <h3 className="text-lg font-bold text-black mb-2 font-heading">
                        {root.title}
                      </h3>

                      {/* Description */}
                      <p className="text-sm text-gray-700 font-body font-medium">
                        {root.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Text Content */}
          <div className="w-full lg:w-1/2 text-left">
            {/* Title */}
            <motion.h2
              className="text-4xl md:text-5xl font-bold text-black font-heading mb-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
            >
              Keeping Our Community Together
            </motion.h2>

            {/* Subtitle */}
            <motion.p
              className="text-2xl md:text-3xl font-semibold text-primary font-heading mb-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            >
              Maintaining Continuity and Stability
            </motion.p>

            {/* Description Paragraphs */}
            <motion.p
              className="text-base md:text-lg text-text-gray mb-6 leading-relaxed font-body"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
            >
              Sage Field was created to maintain the{" "}
              <span className="text-primary font-semibold">friendships</span>,{" "}
              <span className="text-primary font-semibold">routines</span>, and{" "}
              <span className="text-primary font-semibold">environment</span>{" "}
              that families and children already love. By keeping the same
              rhythm and structure as their previous school, students experience
              lower stress, smoother transitions, and greater emotional
              security.
            </motion.p>

            {/* Why It Matters Callout */}
            <motion.div
              className="mt-8 p-4 bg-primary/10 rounded-lg border-l-4 border-primary"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
            >
              <h3 className="text-lg font-semibold text-black mb-3 font-heading">
                Why It Matters
              </h3>
              <ul className="space-y-2 text-base md:text-lg text-text-gray font-body">
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  <span>
                    <span className="text-primary font-semibold">
                      Familiar structure
                    </span>{" "}
                    = lower cortisol and anxiety
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  <span>
                    <span className="text-primary font-semibold">
                      Consistent friendships
                    </span>{" "}
                    = healthy social bonds
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  <span>
                    <span className="text-primary font-semibold">
                      Trusted educators
                    </span>{" "}
                    = emotional safety and confidence
                  </span>
                </li>
              </ul>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
