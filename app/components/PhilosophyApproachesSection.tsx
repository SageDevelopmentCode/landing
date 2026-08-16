"use client";

import { motion } from "framer-motion";
import { useCallback, useState } from "react";

type ApproachId = "montessori" | "waldorf" | "reggio";

type Approach = {
  id: ApproachId;
  label: string;
  shortLabel: string;
  icon: string;
  accentColor: string;
  inactiveBg: string;
  inactiveText: string;
  borderColor: string;
  checkColor: string;
  position: React.CSSProperties;
  principles: string[];
  atSageField: string;
};

const APPROACHES: Approach[] = [
  {
    id: "montessori",
    label: "Montessori-Inspired",
    shortLabel: "Montessori",
    icon: "🧩",
    accentColor: "#f29a8f",
    inactiveBg: "bg-primary/20",
    inactiveText: "text-black",
    borderColor: "border-primary",
    checkColor: "text-primary",
    position: { top: "0%", left: "50%", transform: "translateX(-50%)" },
    principles: [
      "Child-led, self-paced learning",
      "Hands-on, concrete materials before abstract concepts",
      "Mixed-age classrooms that encourage peer learning",
      "Independence and responsibility",
      "Practical life skills (cooking, cleaning, gardening)",
      "Freedom within clear limits",
      "Prepared learning environments",
      "Observation-based teaching instead of constant direct instruction",
      "Real-world experiences over worksheets",
      "Respect for each child's individual developmental timeline",
    ],
    atSageField:
      "Morning work cycles where students choose phonics, math, or life skills at their own pace.",
  },
  {
    id: "waldorf",
    label: "Waldorf-Inspired",
    shortLabel: "Waldorf",
    icon: "🌿",
    accentColor: "#6B9474",
    inactiveBg: "bg-sage-200",
    inactiveText: "text-black",
    borderColor: "border-sage-600",
    checkColor: "text-sage-600",
    position: { bottom: "0%", left: "5%", transform: "translateX(-50%)" },
    principles: [
      "Daily connection with nature",
      "Large amounts of outdoor play and exploration",
      "Storytelling to introduce concepts",
      "Rhythm and predictable daily routines",
      "Seasonal celebrations and nature-based traditions",
      "Handcrafts, cooking, gardening, and meaningful work",
      "Limited screen exposure during the school day",
      "Emphasis on imagination and creative play",
      "Natural materials throughout the learning environment",
      "Whole-child development—head, heart, and hands",
    ],
    atSageField:
      "Seasonal celebrations, storytelling circles, and rhythm woven through the school day.",
  },
  {
    id: "reggio",
    label: "Reggio Emilia-Inspired",
    shortLabel: "Reggio Emilia",
    icon: "🎨",
    accentColor: "#7AB8E0",
    inactiveBg: "bg-sky-blue/60",
    inactiveText: "text-black",
    borderColor: "border-sky-blue",
    checkColor: "text-sky-blue",
    position: { bottom: "0%", left: "95%", transform: "translateX(-50%)" },
    principles: [
      "Project-based investigations driven by children's interests",
      "Learning through collaboration and discussion",
      'The environment as the "third teacher"',
      "Open-ended materials that encourage creativity",
      "Documentation of children's thinking and learning",
      "Teachers act as co-learners and guides",
      "Inquiry-based questions rather than giving answers",
      "Strong family partnerships",
      "Creativity integrated into every subject",
      "Flexible curriculum that evolves with students' interests",
    ],
    atSageField:
      "Projects that grow from children's questions — the garden, a bug found on the trail, a story they want to tell.",
  },
];

const APPROACH_ORDER: ApproachId[] = ["montessori", "waldorf", "reggio"];

function getApproach(id: ApproachId): Approach {
  return APPROACHES.find((a) => a.id === id)!;
}

function CheckIcon({ className }: { className: string }) {
  return (
    <svg
      className={`w-4 h-4 shrink-0 mt-0.5 ${className}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function ApproachDetailPanel({ approach }: { approach: Approach }) {
  return (
    <motion.div
      key={approach.id}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`bg-white rounded-xl shadow-sm border border-gray-100 border-l-4 ${approach.borderColor} p-6 md:p-8`}
      role="tabpanel"
      id={`panel-${approach.id}`}
      aria-labelledby={`tab-${approach.id}`}
    >
      <div className="flex items-center gap-3 mb-6">
        <span className="text-3xl" aria-hidden="true">
          {approach.icon}
        </span>
        <h3 className="text-2xl font-bold text-black font-heading">
          {approach.label}
        </h3>
      </div>

      <ul className="space-y-3 mb-8">
        {approach.principles.map((principle, i) => (
          <li key={i} className="flex items-start gap-3">
            <CheckIcon className={approach.checkColor} />
            <span className="text-sm md:text-base text-text-gray font-body leading-relaxed">
              {principle}
            </span>
          </li>
        ))}
      </ul>

      <div className="bg-welcome-bg rounded-lg p-4 border border-gray-100">
        <p className="text-sm font-semibold text-black font-heading mb-1">
          At Sage Field
        </p>
        <p className="text-sm md:text-base text-text-gray font-body leading-relaxed">
          {approach.atSageField}
        </p>
      </div>
    </motion.div>
  );
}

export default function PhilosophyApproachesSection() {
  const [activeId, setActiveId] = useState<ApproachId>("montessori");
  const activeApproach = getApproach(activeId);

  const cycleApproach = useCallback(
    (direction: 1 | -1) => {
      const currentIndex = APPROACH_ORDER.indexOf(activeId);
      const nextIndex =
        (currentIndex + direction + APPROACH_ORDER.length) %
        APPROACH_ORDER.length;
      setActiveId(APPROACH_ORDER[nextIndex]);
    },
    [activeId],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        cycleApproach(1);
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        cycleApproach(-1);
      } else if (e.key === "Home") {
        e.preventDefault();
        setActiveId(APPROACH_ORDER[0]);
      } else if (e.key === "End") {
        e.preventDefault();
        setActiveId(APPROACH_ORDER[APPROACH_ORDER.length - 1]);
      }
    },
    [cycleApproach],
  );

  return (
    <section
      id="three-inspirations"
      className="bg-welcome-bg py-16 px-8 sm:px-12 lg:px-16"
    >
      <div className="max-w-7xl mx-auto w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block px-6 py-2 bg-badge-bg text-black text-sm font-semibold rounded-full mb-8">
            Three Inspirations
          </span>
        </motion.div>

        <motion.h2
          className="text-4xl md:text-5xl font-bold text-black font-heading mb-4 leading-tight"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          Inspired by Montessori, Waldorf & Reggio Emilia
        </motion.h2>

        <motion.p
          className="text-2xl md:text-3xl font-semibold text-primary font-heading mb-6"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.15 }}
        >
          Three traditions, one intentional blend
        </motion.p>

        <motion.p
          className="text-base md:text-lg text-text-gray leading-relaxed font-body max-w-3xl mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          We draw from Montessori, Waldorf, and Reggio Emilia based on what each
          moment calls for — grounded in{" "}
          <span className="text-primary font-semibold">TEKS-aligned academics</span>
          . Explore each tradition below to see what inspires our approach.
        </motion.p>

        {/* Mobile pill tabs */}
        <div
          className="lg:hidden mb-6"
          role="tablist"
          aria-label="Educational approaches"
        >
          <div className="overflow-x-auto flex snap-x snap-mandatory gap-3 pb-2 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
            {APPROACHES.map((approach) => {
              const isActive = activeId === approach.id;
              return (
                <button
                  key={approach.id}
                  id={`tab-${approach.id}`}
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`panel-${approach.id}`}
                  tabIndex={isActive ? 0 : -1}
                  onClick={() => setActiveId(approach.id)}
                  onKeyDown={handleKeyDown}
                  className={`shrink-0 snap-start flex items-center gap-2 px-5 py-3 rounded-full text-sm font-semibold font-heading transition-all duration-200 border-2 ${
                    isActive
                      ? "bg-primary text-white border-primary shadow-md"
                      : "bg-white text-black border-gray-200 hover:border-primary/40"
                  }`}
                >
                  <span aria-hidden="true">{approach.icon}</span>
                  {approach.shortLabel}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          {/* Triangle diagram — desktop only */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="hidden lg:block relative h-125"
            aria-hidden="true"
          >
            <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 0 }}>
              <defs>
                <linearGradient
                  id="philosophyLineGradient"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop
                    offset="0%"
                    style={{ stopColor: "#f29a8f", stopOpacity: 0.4 }}
                  />
                  <stop
                    offset="50%"
                    style={{ stopColor: "#6B9474", stopOpacity: 0.6 }}
                  />
                  <stop
                    offset="100%"
                    style={{ stopColor: "#7AB8E0", stopOpacity: 0.4 }}
                  />
                </linearGradient>
              </defs>

              {/* Hub-and-spoke lines to center */}
              {[
                { x1: "50%", y1: "13%", approachId: "montessori" as ApproachId },
                { x1: "18%", y1: "87%", approachId: "waldorf" as ApproachId },
                { x1: "82%", y1: "87%", approachId: "reggio" as ApproachId },
              ].map((line) => (
                <line
                  key={line.approachId}
                  x1={line.x1}
                  y1={line.y1}
                  x2="50%"
                  y2="50%"
                  stroke="url(#philosophyLineGradient)"
                  strokeWidth={activeId === line.approachId ? 3 : 2}
                  opacity={activeId === line.approachId ? 1 : 0.4}
                  strokeDasharray="6,4"
                  className="transition-all duration-300"
                />
              ))}
            </svg>

            {/* Center label */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
              <div className="bg-white/90 backdrop-blur-sm px-6 py-3 rounded-full border-2 border-primary/30 text-center">
                <div className="text-lg font-bold text-primary font-heading">
                  Sage Field
                </div>
                <div className="text-xs text-text-gray font-body">Our Blend</div>
              </div>
            </div>

            {/* Triangle nodes */}
            {APPROACHES.map((approach, index) => {
              const isActive = activeId === approach.id;
              return (
                <motion.div
                  key={approach.id}
                  initial={{ opacity: 0, scale: 0 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.4 + index * 0.15 }}
                  viewport={{ once: true }}
                  className="absolute z-20"
                  style={approach.position}
                >
                  <button
                    type="button"
                    aria-pressed={isActive}
                    aria-label={`${approach.label} — click to view principles`}
                    onClick={() => setActiveId(approach.id)}
                    onMouseEnter={() => setActiveId(approach.id)}
                    onKeyDown={handleKeyDown}
                    className="relative focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-full"
                  >
                    {isActive && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 rounded-full blur-xl"
                        style={{
                          backgroundColor: approach.accentColor,
                          scale: 1.5,
                          zIndex: -1,
                        }}
                      />
                    )}

                    <div
                      className={`w-32 h-32 rounded-full flex flex-col items-center justify-center transition-all duration-300 ${
                        isActive
                          ? "shadow-2xl text-white"
                          : `${approach.inactiveBg} shadow-lg ${approach.inactiveText}`
                      }`}
                      style={
                        isActive
                          ? { backgroundColor: approach.accentColor }
                          : undefined
                      }
                    >
                      <span className="text-4xl mb-1">{approach.icon}</span>
                      <span className="text-xs font-semibold font-heading text-center px-2 leading-tight">
                        {approach.shortLabel}
                      </span>
                    </div>
                  </button>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Detail panel */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <ApproachDetailPanel approach={activeApproach} />
          </motion.div>
        </div>

        {/* Integration callout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 bg-primary/10 border-l-4 border-primary rounded-r-lg p-6 md:p-8"
        >
          <p className="text-lg font-semibold text-black font-heading mb-3">
            How we weave them together
          </p>
          <p className="text-base md:text-lg text-text-gray leading-relaxed font-body">
            We are not a pure Montessori school, a Waldorf school, or a Reggio
            school. We are Sage Field — drawing from each tradition what serves
            the child in front of us, with rigorous academics and a deep
            connection to nature. Montessori work cycles one day, a seasonal
            storytelling circle the next, a project born from a child&apos;s
            question the week after.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
