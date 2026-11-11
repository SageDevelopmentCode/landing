/**
 * Copy for the Educational Philosophy page, carried over verbatim from the
 * previous app/educational-philosophy/page.tsx and
 * app/components/PhilosophyApproachesSection.tsx. The "How We Learn" section
 * reuses the home Philosophy section and its copy in app/_home/content.tsx.
 */
import { PHOTO_POOL } from "@/app/_home/content";
import type { Run } from "@/app/_garden/types";

export const PHILOSOPHY_HERO = {
  badge: "Educational Philosophy",
  headingBefore: "Our",
  headingHighlight: "Educational Philosophy",
  body: "Learn about the guiding principles and beliefs that shape how we teach and nurture every student at Sage Field.",
  /** Decorative polaroids under the heading. */
  photos: [PHOTO_POOL[3], PHOTO_POOL[6], PHOTO_POOL[10]],
};

export type Approach = {
  id: "montessori" | "waldorf" | "reggio";
  label: string;
  tagline: string;
  principles: string[];
};

export const INSPIRATIONS = {
  badge: "Three Inspirations",
  heading: "Inspired by Montessori, Waldorf & Reggio Emilia",
  intro: [
    { text: "We draw from Montessori, Waldorf, and Reggio Emilia based on what each moment calls for — grounded in " },
    { text: "TEKS-aligned academics", highlight: true },
    { text: "." },
  ] satisfies Run[],
  chain: ["Montessori", "Waldorf", "Reggio Emilia"],
  chainResult: "Sage Field",
  approaches: [
    {
      id: "montessori",
      label: "Montessori-Inspired",
      tagline: "Child-led, hands-on, self-paced learning",
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
  ] satisfies Approach[],
  weaveTitle: "How we weave them together",
  weaveBody:
    "We are not a pure Montessori school, a Waldorf school, or a Reggio school. We are Sage Field — drawing from each tradition what serves the child in front of us, with rigorous academics and a deep connection to nature. Montessori work cycles one day, a seasonal storytelling circle the next, a project born from a child's question the week after.",
};
