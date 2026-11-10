"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { FaqGroup } from "./types";

export type FaqTheme = {
  group: string;
  groupTitle: string;
  item: string;
  question: string;
  answer: string;
  icon: string;
  empty: string;
};

/** Same matching rule as FAQAccordion: question text, or answer when it is a string. */
export function filterFaqs(groups: FaqGroup[], query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return groups;
  return groups
    .map((g) => ({
      ...g,
      items: g.items.filter(
        (it) =>
          it.question.toLowerCase().includes(q) ||
          (typeof it.answer === "string" && it.answer.toLowerCase().includes(q)),
      ),
    }))
    .filter((g) => g.items.length > 0);
}

export const groupId = (prefix: string, title: string) =>
  `${prefix}-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

export default function FaqList({
  groups,
  query,
  theme,
  idPrefix,
}: {
  groups: FaqGroup[];
  query: string;
  theme: FaqTheme;
  idPrefix: string;
}) {
  const [open, setOpen] = useState<string | null>(null);
  const visible = filterFaqs(groups, query);

  if (!visible.length) {
    return <p className={theme.empty}>No FAQs found matching your search.</p>;
  }

  return (
    <div className="space-y-14">
      {visible.map((g) => (
        <div key={g.title} id={groupId(idPrefix, g.title)} className={`scroll-mt-32 ${theme.group}`}>
          <h3 className={theme.groupTitle}>{g.title}</h3>
          <div>
            {g.items.map((it) => {
              const key = `${g.title}::${it.question}`;
              const isOpen = open === key;
              const panelId = `faq-${key.replace(/[^a-z0-9]+/gi, "-")}`;
              return (
                <div key={key} className={theme.item}>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => setOpen(isOpen ? null : key)}
                    className="flex w-full items-start justify-between gap-6 py-6 text-left cursor-pointer"
                  >
                    <span className={theme.question}>{it.question}</span>
                    <span
                      aria-hidden="true"
                      className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-transform duration-500 ${theme.icon} ${isOpen ? "rotate-45" : ""}`}
                    >
                      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M8 2v12M2 8h12" strokeLinecap="round" />
                      </svg>
                    </span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        id={panelId}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                      >
                        <div className={`pb-7 pr-12 ${theme.answer}`}>{it.answer}</div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
