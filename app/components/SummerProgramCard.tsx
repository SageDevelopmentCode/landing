"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import { Sun } from "lucide-react";

interface SummerProgramCardProps {
  onQuestionsClick: () => void;
}

export default function SummerProgramCard({ onQuestionsClick }: SummerProgramCardProps) {
  const router = useRouter();
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
      className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl border-2 border-primary shadow-lg overflow-hidden"
    >
      <div className="relative h-[40vh] md:h-[50vh]">
        <Image
          src="/assets/ImageNine.jpg"
          alt="Summer Program"
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 1200px"
        />
      </div>
      <div className="p-8 md:p-10">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
            <Sun className="w-10 h-10 text-white" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl md:text-3xl font-bold text-black mb-3 font-heading">
              Summer Program
            </h2>
            <p className="text-lg md:text-xl text-text-gray mb-6 font-body">
              Monday – Thursday, 9:00am – 3:00pm · Priced per week
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div className="px-6 py-4 bg-white rounded-lg shadow-md">
                <p className="text-xs font-semibold uppercase tracking-wide text-text-gray font-body mb-3">
                  Weekly
                </p>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-text-gray font-body">
                      2nd – 4th Grade
                    </p>
                    <p className="text-2xl font-bold text-primary font-heading">
                      $350
                      <span className="text-sm text-text-gray font-normal">
                        /wk
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-text-gray font-body">
                      Primary (Pre-K – 1st Grade)
                    </p>
                    <p className="text-2xl font-bold text-primary font-heading">
                      $375
                      <span className="text-sm text-text-gray font-normal">
                        /wk
                      </span>
                    </p>
                  </div>
                </div>
              </div>
              <div className="relative px-6 py-4 bg-primary rounded-lg shadow-md overflow-hidden">
                <div className="absolute top-3 right-3 bg-white text-primary text-xs font-bold px-2 py-1 rounded-full font-body">
                  Save 10%
                </div>
                <p className="text-xs font-semibold uppercase tracking-wide text-white/80 font-body mb-3">
                  Full Summer · 12 Weeks
                </p>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-white/70 font-body">
                      2nd – 4th Grade
                    </p>
                    <p className="text-2xl font-bold text-white font-heading">
                      $3,780
                    </p>
                    <p className="text-xs text-white/60 font-body">
                      <span className="line-through">$4,200</span>
                      <span className="ml-1 text-white/80">
                        · $420 off
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-white/70 font-body">
                      Primary (Pre-K – 1st Grade)
                    </p>
                    <p className="text-2xl font-bold text-white font-heading">
                      $4,050
                    </p>
                    <p className="text-xs text-white/60 font-body">
                      <span className="line-through">$4,500</span>
                      <span className="ml-1 text-white/80">
                        · $450 off
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-xs text-text-gray font-body mb-4">
              <span className="font-semibold text-black">
                Registration fee:
              </span>{" "}
              Summer school registration $75 · One-time fee
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
          </div>
        </div>
      </div>
    </motion.div>
  );
}
