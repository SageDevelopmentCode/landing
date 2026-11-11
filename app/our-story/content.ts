/**
 * Copy for the Our Story page, carried over verbatim from the previous
 * app/our-story/page.tsx. Highlights only style existing words; the text of
 * every Run array joins back into the original paragraph.
 */
import { PHOTO_POOL } from "@/app/_home/content";
import type { Run, TeamMember } from "@/app/_garden/types";

export const STORY_HERO = {
  badge: "Our Story",
  headingBefore: "Why We Started",
  headingHighlight: "Sage Field",
  subtitle: "In Sabrina's own words — the story behind why Sage Field exists.",
  portrait: { src: "/assets/team/sabrina.jpg", alt: "Sabrina Grace Obnamia" },
  /** Decorative polaroids tucked behind the portrait. */
  photos: [PHOTO_POOL[2], PHOTO_POOL[9]],
};

export const STORY = {
  before: [
    "When I was growing up, people often told me I was immature. Too playful. Too kid-like. Too hyperactive. Sometimes even a little weird.",
    "I liked playing, being outside, and was constantly running around. While others seemed ready to grow up quickly, I never really understood that.",
    "For a long time, I wondered if something about me needed to change.",
  ],
  quote:
    "“But over the years, I realized that the qualities people called ‘immature’ were actually the same qualities that make children incredible learners — through curiosity, imagination, movement, exploration, and joy.”",
  after: [
    [
      { text: "So instead of repeating that cycle and teaching my students the same thing I experienced, I am " },
      { text: "breaking that pattern!", highlight: true },
    ],
    [
      { text: "Sage Field is an outdoor focused school where " },
      { text: "children are allowed to be children", highlight: true },
      {
        text: ". A place where learning happens through movement, hands-on discovery, and time spent outside. A place where curiosity is encouraged, questions are celebrated, and the small joys of childhood are protected.",
      },
    ],
    [
      {
        text: "What once felt like something I needed to change about myself is now the very thing shaping the kind of school I believe children deserve.",
      },
    ],
  ] satisfies Run[][],
};

export const FOUNDERS = {
  badge: "The Founders",
  heading: "Meet the Founders",
  members: [
    {
      name: "Sabrina Grace Obnamia",
      role: "Lead Teacher & Director",
      image: "/assets/team/sabrina.jpg",
      description:
        "Ms. Sabrina brings a wealth of experience to Sage Field. She holds a Bachelor's degree in Elementary Education with a concentration in Early Childhood Development from Biola University and a Teaching Credential. Her background includes working with children in a wide range of roles both in the U.S. and internationally—spanning special education, preschool, homeschooling, tutoring, coaching, traditional schooling, nature school guide, and more. She values movement, outdoor learning, and most importantly, the joy of slowing down to be present, intentional, and thankful.",
    },
    {
      name: "Julius Cecilia",
      role: "Director of Operations & Technology",
      image: "/assets/team/Julius.jpg",
      description:
        "Julius Cecilia, a University of Washington graduate, is a software engineer and startup builder with experience across early-stage startups and established tech companies like Adobe. He previously co-founded a sports social platform and continues to build software at the intersection of technology and schools.",
    },
  ] satisfies TeamMember[],
};
