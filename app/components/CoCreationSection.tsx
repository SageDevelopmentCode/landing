"use client";

import { motion } from "framer-motion";
import { useState } from "react";

export default function CoCreationSection() {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const nodes = [
    {
      id: "school",
      label: "School",
      icon: "🏫",
      position: { top: "0%", left: "30%", transform: "translateX(-50%)" },
      description: "Expert Guidance",
    },
    {
      id: "student",
      label: "Student",
      icon: "🌱",
      position: { bottom: "0%", left: "0%", transform: "translateX(-50%)" },
      description: "Growth & Curiosity",
    },
    {
      id: "family",
      label: "Family",
      icon: "🏠",
      position: { bottom: "0%", left: "60%", transform: "translateX(-50%)" },
      description: "Home Extension",
    },
  ];

  const isConnectionActive = (connection: { from: string; to: string }) => {
    return (
      hoveredNode === connection.from ||
      hoveredNode === connection.to ||
      hoveredNode === null
    );
  };

  return (
    <section className="relative py-16 px-8 sm:px-12 lg:px-16 bg-welcome-bg min-h-[80vh] flex items-center">
      <div className="max-w-7xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <span className="inline-block px-6 py-2 bg-badge-bg text-black text-sm font-semibold rounded-full mb-8">
            Co-Creation
          </span>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Interactive Visual - Left Column */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="relative h-[500px] order-2 lg:order-1"
          >
            {/* SVG for connection lines */}
            <svg
              className="absolute inset-0 w-full h-full"
              style={{ zIndex: 0 }}
            >
              <defs>
                <linearGradient
                  id="lineGradient"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="0%"
                >
                  <stop
                    offset="0%"
                    style={{ stopColor: "#F29A8F", stopOpacity: 0.3 }}
                  />
                  <stop
                    offset="50%"
                    style={{ stopColor: "#F29A8F", stopOpacity: 0.8 }}
                  />
                  <stop
                    offset="100%"
                    style={{ stopColor: "#F29A8F", stopOpacity: 0.3 }}
                  />
                </linearGradient>
              </defs>

              {/* Triangle connections */}
              <motion.line
                x1="40%"
                y1="13%"
                x2="10%"
                y2="87%"
                stroke="url(#lineGradient)"
                strokeWidth={
                  hoveredNode === "school" || hoveredNode === "student" ? 4 : 2
                }
                opacity={
                  isConnectionActive({ from: "school", to: "student" })
                    ? 1
                    : 0.3
                }
                className="transition-all duration-300"
                strokeDasharray="5,5"
              >
                {hoveredNode && (
                  <animate
                    attributeName="stroke-dashoffset"
                    from="0"
                    to="10"
                    dur="0.5s"
                    repeatCount="indefinite"
                  />
                )}
              </motion.line>

              <motion.line
                x1="40%"
                y1="13%"
                x2="70%"
                y2="87%"
                stroke="url(#lineGradient)"
                strokeWidth={
                  hoveredNode === "school" || hoveredNode === "family" ? 4 : 2
                }
                opacity={
                  isConnectionActive({ from: "school", to: "family" }) ? 1 : 0.3
                }
                className="transition-all duration-300"
                strokeDasharray="5,5"
              >
                {hoveredNode && (
                  <animate
                    attributeName="stroke-dashoffset"
                    from="0"
                    to="10"
                    dur="0.5s"
                    repeatCount="indefinite"
                  />
                )}
              </motion.line>

              <motion.line
                x1="10%"
                y1="93%"
                x2="70%"
                y2="93%"
                stroke="url(#lineGradient)"
                strokeWidth={
                  hoveredNode === "student" || hoveredNode === "family" ? 4 : 2
                }
                opacity={
                  isConnectionActive({ from: "student", to: "family" })
                    ? 1
                    : 0.3
                }
                className="transition-all duration-300"
                strokeDasharray="5,5"
              >
                {hoveredNode && (
                  <animate
                    attributeName="stroke-dashoffset"
                    from="0"
                    to="10"
                    dur="0.5s"
                    repeatCount="indefinite"
                  />
                )}
              </motion.line>
            </svg>

            {/* Interactive Nodes */}
            {nodes.map((node, index) => (
              <motion.div
                key={node.id}
                initial={{ opacity: 0, scale: 0 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.4 + index * 0.2 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.1 }}
                className="absolute cursor-pointer"
                style={node.position}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
              >
                <div className="relative">
                  {/* Glow effect when hovered */}
                  {hoveredNode === node.id && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute inset-0 bg-primary rounded-full blur-xl"
                      style={{ scale: 1.5, zIndex: -1 }}
                    />
                  )}

                  {/* Node circle */}
                  <div
                    className={`w-32 h-32 rounded-full flex flex-col items-center justify-center transition-all duration-300 ${
                      hoveredNode === node.id
                        ? "bg-primary shadow-2xl"
                        : "bg-primary/20 shadow-lg"
                    }`}
                  >
                    <div className="text-4xl mb-2">{node.icon}</div>
                    <div
                      className={`text-sm font-semibold font-heading transition-colors duration-300 ${
                        hoveredNode === node.id ? "text-white" : "text-black"
                      }`}
                    >
                      {node.label}
                    </div>
                  </div>

                  {/* Description tag */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{
                      opacity: hoveredNode === node.id ? 1 : 0,
                      y: hoveredNode === node.id ? 0 : 10,
                    }}
                    className="absolute top-full mt-4 left-1/2 transform -translate-x-1/2 whitespace-nowrap bg-white px-4 py-2 rounded-lg shadow-lg border-2 border-primary"
                  >
                    <div className="text-sm font-semibold text-primary font-body">
                      {node.description}
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            ))}

            {/* Center connecting text */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 1 }}
              viewport={{ once: true }}
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center"
            >
              <div className="bg-white/90 backdrop-blur-sm px-6 py-3 rounded-full border-2 border-primary/30">
                <span className="text-lg font-bold text-primary font-heading">
                  Partnership
                </span>
              </div>
            </motion.div>
          </motion.div>

          {/* Text Content - Right Column */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
            className="space-y-6 order-1 lg:order-2"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-black font-heading leading-tight">
              Learning in Partnership
            </h2>

            <p className="text-base md:text-lg text-text-gray leading-relaxed font-body">
              Collecting projects and pieces of work are used to track student
              growth while nurturing each child&apos;s curiosity and confidence.
            </p>

            <div className="bg-welcome-bg border-l-4 border-primary p-6 rounded-r-lg">
              <p className="text-lg font-semibold text-black font-heading mb-3">
                At Sage Field, we call our approach Co-Creation.
              </p>
              <p className="text-base text-text-gray leading-relaxed font-body">
                We know there are only so many hours in the day, and learning
                doesn&apos;t stop when tutoring ends. We require parents to take
                ownership in their child&apos;s journey — extending curiosity,
                practice, and mindfulness into the home. Together, we co-create
                an educational rhythm that works for each family&apos;s unique
                needs and pace.
              </p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              viewport={{ once: true }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4"
            >
              <div className="text-center p-4 bg-white rounded-lg shadow-sm border border-primary/10 hover:shadow-md transition-shadow duration-200">
                <div className="text-3xl mb-2">📚</div>
                <div className="text-sm font-semibold text-black font-heading">
                  Track Progress
                </div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg shadow-sm border border-primary/10 hover:shadow-md transition-shadow duration-200">
                <div className="text-3xl mb-2">🤝</div>
                <div className="text-sm font-semibold text-black font-heading">
                  Collaborate Daily
                </div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg shadow-sm border border-primary/10 hover:shadow-md transition-shadow duration-200">
                <div className="text-3xl mb-2">🌟</div>
                <div className="text-sm font-semibold text-black font-heading">
                  Grow Together
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
