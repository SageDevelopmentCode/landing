"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import { Calendar } from "lucide-react";

interface FullEnrollmentCardProps {
  onQuestionsClick: () => void;
}

export default function FullEnrollmentCard({
  onQuestionsClick,
}: FullEnrollmentCardProps) {
  const router = useRouter();
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" as const }}
      className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl border-2 border-primary shadow-lg overflow-hidden"
    >
      <div className="relative h-[40vh] md:h-[50vh]">
        <Image
          src="/assets/ImageTen.jpg"
          alt="Full Enrollment"
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 1200px"
        />
      </div>
      <div className="p-8 md:p-10">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-8">
          <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
            <Calendar className="w-10 h-10 text-white" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl md:text-3xl font-bold text-black mb-3 font-heading">
              Full Enrollment
            </h2>
            <p className="text-lg md:text-xl text-text-gray mb-6 font-body">
              Monday – Thursday, 9:00am – 3:00pm
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="px-6 py-4 bg-white rounded-lg shadow-md">
                <p className="text-sm font-semibold text-text-gray font-body mb-1">
                  2nd – 4th Grade
                </p>
                <p className="text-3xl font-bold text-primary font-heading">
                  $1,095
                  <span className="text-lg text-text-gray font-normal">
                    /mo
                  </span>
                </p>
                <p className="text-xs text-text-gray mt-1 font-body">
                  School year
                </p>
              </div>
              <div className="px-6 py-4 bg-white rounded-lg shadow-md">
                <p className="text-sm font-semibold text-text-gray font-body mb-1">
                  Pre-K–1st Grade
                </p>
                <p className="text-3xl font-bold text-primary font-heading">
                  $1,195
                  <span className="text-lg text-text-gray font-normal">
                    /mo
                  </span>
                </p>
                <p className="text-xs text-text-gray mt-1 font-body">
                  School year
                </p>
              </div>
            </div>
            <p className="text-xs text-text-gray font-body mb-4">
              <span className="font-semibold text-black">Enrollment fees:</span>{" "}
              First-time registration $500 · Re-registration $300 · Annual
              supply fee $300
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => router.push("/apply")}
                className="px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-colors duration-200 font-body cursor-pointer text-sm"
              >
                Interested in joining?
              </button>
              <button
                onClick={onQuestionsClick}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:border-primary hover:text-primary transition-colors duration-200 font-body cursor-pointer text-sm"
              >
                Have any questions?
              </button>
            </div>
            <p className="text-xs text-text-gray italic font-body mt-3">
              For drop-in options, please email us at{" "}
              <a
                href="mailto:sabrina@sagefield.co"
                className="text-primary hover:underline"
              >
                sabrina@sagefield.co
              </a>
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
