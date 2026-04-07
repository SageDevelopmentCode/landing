"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string | React.ReactNode;
}

interface FAQAccordionProps {
  items: FAQItem[];
  searchQuery?: string;
}

export default function FAQAccordion({ items, searchQuery = "" }: FAQAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const filteredItems = items.filter(
    (item) =>
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (typeof item.answer === 'string' && item.answer.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  if (filteredItems.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">
          No FAQs found matching your search.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {filteredItems.map((item, index) => (
        <motion.div
          key={index}
          className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: index * 0.05 }}
        >
          <button
            onClick={() => toggleAccordion(index)}
            className="w-full flex items-center justify-between p-6 text-left focus:outline-none group cursor-pointer"
            aria-expanded={openIndex === index}
          >
            <h3 className="text-lg md:text-xl font-semibold text-gray-800 font-heading pr-4">
              {item.question}
            </h3>
            <motion.div
              animate={{ rotate: openIndex === index ? 180 : 0 }}
              transition={{ duration: 0.3 }}
              className="flex-shrink-0"
            >
              <ChevronDown className="w-5 h-5 text-primary group-hover:text-primary-hover transition-colors" />
            </motion.div>
          </button>

          <AnimatePresence>
            {openIndex === index && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" as const }}
                className="overflow-hidden"
              >
                <div className="px-6 pb-6 text-gray-600 text-base md:text-lg leading-relaxed font-body">
                  {item.answer}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}
    </div>
  );
}
