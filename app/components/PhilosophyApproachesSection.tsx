"use client";

import { motion } from "framer-motion";

type ApproachId = "montessori" | "waldorf" | "reggio";

type Approach = {
  id: ApproachId;
  label: string;
  tagline: string;
  accentBar: string;
  dotColor: string;
  principles: string[];
};

const APPROACHES: Approach[] = [
  {
    id: "montessori",
    label: "Montessori-Inspired",
    tagline: "Child-led, hands-on, self-paced learning",
    accentBar: "bg-primary",
    dotColor: "bg-primary",
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
  },
  {
    id: "waldorf",
    label: "Waldorf-Inspired",
    tagline: "Rhythm, nature, and whole-child development",
    accentBar: "bg-sage-600",
    dotColor: "bg-sage-600",
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
  },
  {
    id: "reggio",
    label: "Reggio Emilia-Inspired",
    tagline: "Projects driven by curiosity and collaboration",
    accentBar: "bg-sky-blue",
    dotColor: "bg-sky-blue",
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
  },
];

function ApproachCard({
  approach,
  index,
}: {
  approach: Approach;
  index: number;
}) {
  const headingId = `approach-heading-${approach.id}`;

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: 0.1 + index * 0.1 }}
      aria-labelledby={headingId}
      className="flex flex-col h-full bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
    >
      <div className={`h-1 w-full ${approach.accentBar}`} aria-hidden="true" />

      <div className="flex flex-col flex-1 p-6 lg:p-7">
        <h3
          id={headingId}
          className="text-xl font-bold text-black font-heading mb-2"
        >
          {approach.label}
        </h3>
        <p className="text-sm text-text-gray font-body mb-6 leading-relaxed">
          {approach.tagline}
        </p>

        <ul className="space-y-2.5 flex-1">
          {approach.principles.map((principle, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <span
                className={`w-1.5 h-1.5 rounded-full shrink-0 mt-2 ${approach.dotColor}`}
                aria-hidden="true"
              />
              <span className="text-sm text-text-gray font-body leading-relaxed">
                {principle}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </motion.article>
  );
}

export default function PhilosophyApproachesSection() {
  return (
    <section
      id="three-inspirations"
      className="bg-welcome-bg py-16 px-8 sm:px-12 lg:px-16"
    >
      <div className="max-w-7xl mx-auto w-full">
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
          className="text-4xl md:text-5xl font-bold text-black font-heading mb-6 leading-tight"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          Inspired by Montessori, Waldorf & Reggio Emilia
        </motion.h2>

        <motion.p
          className="text-base md:text-lg text-text-gray leading-relaxed font-body max-w-3xl mb-10"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.15 }}
        >
          We draw from Montessori, Waldorf, and Reggio Emilia based on what each
          moment calls for — grounded in{" "}
          <span className="text-primary font-semibold">TEKS-aligned academics</span>
          .
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-center border-b border-gray-100 pb-8 mb-8"
        >
          <p className="text-sm font-semibold font-heading text-gray-400">
            <span className="text-primary">Montessori</span>
            <span className="mx-2">·</span>
            <span className="text-sage-600">Waldorf</span>
            <span className="mx-2">·</span>
            <span className="text-sky-blue">Reggio Emilia</span>
            <span className="mx-3 text-gray-300">→</span>
            <span className="text-primary">Sage Field</span>
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
          {APPROACHES.map((approach, index) => (
            <ApproachCard key={approach.id} approach={approach} index={index} />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-12 bg-primary/10 border-l-4 border-primary rounded-r-lg p-6 md:p-8"
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
