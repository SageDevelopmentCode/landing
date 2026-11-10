import type { ReactNode } from "react";

/** A run of text, optionally emphasised (e.g. a highlighted phrase in a paragraph). */
export type Run = { text: string; highlight?: boolean };

export type FaqItem = { question: string; answer: string | ReactNode };
export type FaqGroup = { title: string; items: FaqItem[] };

export type TeamMember = {
  name: string;
  role: string;
  image: string;
  description: string;
};
