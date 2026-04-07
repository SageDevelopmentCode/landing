"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

const ctas = [
  {
    label: "Go Back Home",
    description: "Return to the Sage Field homepage.",
    href: "/",
    primary: false,
  },
  {
    label: "Apply for Summer 2026",
    description: "Join our 12-week summer program for ages 4–11.",
    href: "/apply/start",
    primary: true,
  },
  {
    label: "School Year 2026–2027",
    description: "Explore our full-year academic program.",
    href: "/school-year-2026-2027",
    primary: false,
  },
  {
    label: "Learn More About Us",
    description: "Discover our mission and teaching philosophy.",
    href: "/about",
    primary: false,
  },
];

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-welcome-bg flex flex-col">
      <Navbar darkStyle />

      {/* Hero */}
      <section className="min-h-screen flex items-center justify-center px-8 sm:px-12 lg:px-16">
        <div className="max-w-6xl mx-auto text-center">
            <motion.h1
              className="text-7xl md:text-9xl font-bold text-primary/30 font-heading mb-4 select-none"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" as const }}
            >
              404
            </motion.h1>

            <motion.h2
              className="text-3xl md:text-4xl font-bold text-gray-800 font-heading mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" as const }}
            >
              Page Not Found
            </motion.h2>

            <motion.p
              className="text-lg text-gray-500 font-body max-w-xl mx-auto mb-16"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" as const }}
            >
              Looks like this page took a wrong turn. Let&apos;s get you back to
              somewhere familiar.
            </motion.p>

            {/* CTA Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
              {ctas.map((cta, i) => (
                <motion.button
                  key={cta.href}
                  onClick={() => router.push(cta.href)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.6,
                    delay: 0.4 + i * 0.1,
                    ease: "easeOut" as const,
                  }}
                  className={`group flex flex-col items-start text-left p-6 rounded-2xl border transition-all duration-200 cursor-pointer ${
                    cta.primary
                      ? "bg-primary hover:bg-primary-hover text-white border-transparent"
                      : "bg-white hover:bg-gray-50 text-gray-800 border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <span
                    className={`text-base font-semibold font-heading mb-2 ${
                      cta.primary ? "text-white" : "text-gray-800"
                    }`}
                  >
                    {cta.label}
                  </span>
                  <span
                    className={`text-sm font-body ${
                      cta.primary ? "text-white/80" : "text-gray-500"
                    }`}
                  >
                    {cta.description}
                  </span>
                </motion.button>
              ))}
            </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
