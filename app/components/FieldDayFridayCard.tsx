"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { PartyPopper } from "lucide-react";

export default function FieldDayFridayCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
      whileHover={{ scale: 1.02 }}
      className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-200 overflow-hidden"
    >
      <div className="relative h-[30vh] md:h-[35vh]">
        <Image
          src="/assets/ImageEight.jpg"
          alt="Fun Friday Activities"
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </div>
      <div className="p-8">
        <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-6">
          <PartyPopper className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-2xl font-bold text-black mb-2 font-heading">
          Field Day Friday
        </h3>
        <p className="text-base text-text-gray mb-6 font-body">
          9:00am - 1:00pm
        </p>
        <div className="space-y-4">
          <div className="p-4 bg-welcome-bg rounded-lg border-l-4 border-primary">
            <p className="text-sm font-semibold text-black mb-1 font-heading">
              Package of 4
            </p>
            <p className="text-2xl font-bold text-primary font-heading">
              $200
              <span className="text-base text-text-gray font-normal">
                /month
              </span>
            </p>
            <p className="text-xs text-text-gray mt-1 font-body">
              $50 per session • Expires monthly
            </p>
          </div>
          <div className="p-4 bg-welcome-bg rounded-lg border-l-4 border-primary">
            <p className="text-sm font-semibold text-black mb-1 font-heading">
              Drop-In
            </p>
            <p className="text-2xl font-bold text-primary font-heading">
              $60
              <span className="text-base text-text-gray font-normal">
                /session
              </span>
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
