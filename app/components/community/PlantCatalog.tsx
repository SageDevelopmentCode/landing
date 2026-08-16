"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";

export type PlantCategory = {
  id: string;
  label: string;
  plants: string[];
};

type PlantCatalogProps = {
  categories: PlantCategory[];
  pickedPlants: Set<string>;
  onTogglePlant: (plant: string) => void;
  onSaveTheDate: () => void;
  prefersReducedMotion: boolean;
};

export default function PlantCatalog({
  categories,
  pickedPlants,
  onTogglePlant,
  onSaveTheDate,
  prefersReducedMotion,
}: PlantCatalogProps) {
  return (
    <section className="py-20 px-8 sm:px-12 lg:px-16 bg-white">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-12 max-w-2xl"
        >
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-sage-600 font-body mb-3">
            What to Bring
          </p>
          <h2 className="text-3xl md:text-4xl font-bold font-heading text-gray-900 leading-tight">
            Help Our Garden Grow
          </h2>
          <p className="text-base text-gray-500 font-body mt-3 leading-relaxed">
            Bring at least one plant per family — and if you&apos;d like to bring
            more, we&apos;d be incredibly grateful! Every contribution, big or
            small, helps make our garden a little more beautiful.
          </p>
        </motion.div>

        <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
          {categories.map((category, rowIndex) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.4,
                delay: prefersReducedMotion ? 0 : rowIndex * 0.06,
              }}
              className={`flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-8 px-5 py-6 sm:px-8 sm:py-7 ${
                rowIndex < categories.length - 1
                  ? "border-b border-gray-100"
                  : ""
              }`}
            >
              <div className="w-full sm:w-36 shrink-0">
                <p className="text-xs font-bold tracking-[0.15em] uppercase text-gray-900 font-heading">
                  {category.label}
                </p>
                <p className="text-xs text-gray-400 font-body mt-1">
                  {category.plants.length} options
                </p>
              </div>
              <div className="flex flex-wrap gap-2 flex-1 min-w-0">
                {category.plants.map((plant) => {
                  const picked = pickedPlants.has(plant);
                  return (
                    <button
                      key={plant}
                      type="button"
                      onClick={() => onTogglePlant(plant)}
                      className={`inline-flex items-center gap-1.5 border rounded-lg px-3 py-2 text-sm font-body transition-all duration-200 cursor-pointer ${
                        picked
                          ? "border-sage-600 bg-sage-50 text-sage-900"
                          : "border-gray-200 bg-white text-gray-700 hover:border-sage-400"
                      }`}
                    >
                      {picked && (
                        <Check
                          className="w-3.5 h-3.5 text-sage-700 shrink-0"
                          strokeWidth={2.5}
                        />
                      )}
                      {plant}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="mt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border border-gray-200 rounded-xl px-6 py-5 sm:px-8 sm:py-6 bg-welcome-bg"
        >
          <div>
            <p className="font-semibold text-gray-900 font-heading">
              Bring at least one plant per family
            </p>
            <p className="text-sm text-gray-500 font-body mt-1">
              Jot your pick in RSVP notes when registration opens.
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onSaveTheDate}
            className="shrink-0 bg-primary hover:bg-primary-hover text-white font-semibold px-7 py-3.5 rounded-xl text-sm font-body shadow-md transition-colors cursor-pointer"
          >
            Save the Date →
          </motion.button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-sm text-gray-500 font-body mt-8 leading-relaxed max-w-2xl"
        >
          So bring a plant (or a few!), stay awhile, share a snack, meet another
          family, and help us grow something truly special together. We can&apos;t
          wait to see our garden and our community bloom.
        </motion.p>
      </div>
    </section>
  );
}
