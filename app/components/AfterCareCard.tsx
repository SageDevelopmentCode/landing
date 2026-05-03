"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Clock } from "lucide-react";

export default function AfterCareCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" as const }}
      whileHover={{ scale: 1.02 }}
      className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-200 overflow-hidden"
    >
      <div className="relative h-[30vh] md:h-[35vh]">
        <Image
          src="/assets/ImageSeven.jpg"
          alt="Extended Learning Program"
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </div>
      <div className="p-8">
        <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-6">
          <Clock className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-2xl font-bold text-black mb-2 font-heading">
          Extended Learning
        </h3>
        <p className="text-base text-text-gray mb-6 font-body">
          3:30pm - 5:00pm
        </p>
        <div className="space-y-4">
          <div className="p-4 bg-welcome-bg rounded-lg border-l-4 border-primary">
            <p className="text-sm font-semibold text-black mb-1 font-heading">
              Drop-In
            </p>
            <p className="text-2xl font-bold text-primary font-heading">
              $35
              <span className="text-base text-text-gray font-normal">
                /daily
              </span>
            </p>
          </div>
          <div className="p-4 bg-welcome-bg rounded-lg border-l-4 border-primary">
            <p className="text-sm font-semibold text-black mb-1 font-heading">
              Monthly (Enrolled Student)
            </p>
            <p className="text-2xl font-bold text-primary font-heading">
              $375
              <span className="text-base text-text-gray font-normal">
                /month
              </span>
            </p>
            <p className="text-xs text-text-gray mt-1 font-body">
              $23 per day per student
            </p>
          </div>
          <div className="p-4 bg-welcome-bg rounded-lg border-l-4 border-primary">
            <p className="text-sm font-semibold text-black mb-1 font-heading">
              Monthly (Extended Learning Only)
            </p>
            <p className="text-2xl font-bold text-primary font-heading">
              $475
              <span className="text-base text-text-gray font-normal">
                /month
              </span>
            </p>
            <p className="text-xs text-text-gray mt-1 font-body">
              $10/hour - Cheaper than a babysitter!
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
