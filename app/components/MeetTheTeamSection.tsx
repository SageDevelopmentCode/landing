"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { X } from "lucide-react";

const TEAM_MEMBERS = [
  {
    name: "Paige Wood",
    role: "Primary Lead Teacher",
    image: "/assets/team/Paige.webp",
    description:
      "Ms. Paige is the Lead Primary Teacher at Sage Field Private School. She has a passion for outdoor-based learning and creating environments where young children feel safe, curious, and inspired. With experience in Montessori-style education and outdoor learning, she brings creativity and intentionality to every lesson.",
  },
  {
    name: "Zelinda Melo",
    role: "Teacher Aide",
    image: "/assets/team/Zelinda.webp",
    description:
      "Hello, Sage Field families!! My name is Zelinda and I am so excited to be a part of this incredible team. I have a deep love for children and a heart for nurturing their growth in a safe and encouraging environment. I look forward to supporting each child's learning journey and being a positive presence in their day.",
  },
  {
    name: "Nicole Elias",
    role: "Summer Program Coordinator",
    image: "/assets/team/Nicole.jpg",
    description:
      "My name is Nicole, and I am a teacher with a passion for hands-on, experiential learning. I believe every child deserves an education that sparks curiosity and joy. I am excited to bring creative, nature-inspired curriculum to our summer program and help children discover the world around them.",
  },
  {
    name: "Taylor Elias",
    role: "Summer Program Coordinator",
    image: "/assets/team/Taylor.jpg",
    description:
      "My name is Taylor, and I recently completed my education studies with a focus on child development and outdoor learning. I am passionate about creating meaningful experiences for children that connect them to nature and inspire a love of learning. I am thrilled to join the Sage Field team this summer.",
  },
  {
    name: "Julius Cecilia",
    role: "Director of Operations & Technology",
    image: "/assets/team/JuliusC.jpg",
    description:
      "Julius Cecilia, a University of Washington graduate, is a software engineer and startup builder with experience across early-stage startups and established tech companies like Adobe. He previously co-founded a sports social platform and continues to build software at the intersection of technology and schools.",
  },
];

export default function MeetTheTeamSection() {
  const [selectedMember, setSelectedMember] = useState<
    (typeof TEAM_MEMBERS)[0] | null
  >(null);

  return (
    <section className="bg-welcome-bg py-16 px-8 sm:px-12 lg:px-16 min-h-[80vh] flex items-center">
      <div className="max-w-7xl mx-auto w-full">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          className="inline-block mb-8"
        >
          <div className="bg-badge-bg px-6 py-2 rounded-full">
            <span className="text-sm font-semibold text-text-gray font-body">
              The Team
            </span>
          </div>
        </motion.div>

        {/* Title */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          className="text-4xl md:text-5xl font-bold mb-16 text-text-gray font-heading"
        >
          Meet the Team
        </motion.h2>

        {/* Featured: Sabrina — Two-column layout */}
        <div className="flex flex-col lg:flex-row lg:justify-between items-center gap-16 mb-20">
          {/* Left: Headshot Image */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
            className="w-full lg:w-1/2"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
              className="relative h-[50vh] sm:h-[55vh] rounded-2xl overflow-hidden shadow-lg"
            >
              <Image
                src="/assets/Headshot.jpeg"
                alt="Sabrina Grace Obnamia - Lead Teacher & Director"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
            </motion.div>
          </motion.div>

          {/* Right: Team Text Content */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
            className="w-full lg:w-1/2 space-y-8"
          >
            {/* Lead Tutor */}
            <div className="space-y-4">
              <h3 className="text-2xl md:text-3xl font-semibold text-primary font-heading">
                Lead Teacher & Director
              </h3>
              <p className="text-xl md:text-2xl font-semibold text-text-gray font-heading">
                Sabrina Grace Obnamia
              </p>
              <p className="text-base md:text-lg text-text-gray leading-relaxed font-body">
                Ms. Sabrina brings a wealth of experience to SageField. She
                holds a Bachelor&apos;s degree in Elementary Education with a
                concentration in Early Childhood Development from Biola
                University and a Teaching Credential. Her background includes
                working with children in a wide range of roles both in the U.S.
                and internationally—spanning special education, preschool,
                homeschooling, tutoring, coaching, traditional schooling, nature
                school guide, and more. She values movement, outdoor learning,
                and most importantly, the joy of slowing down to be present,
                intentional, and thankful.
              </p>
            </div>

            {/* Description */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
              className="p-6 bg-primary/10 rounded-lg border-l-4 border-primary"
            >
              <p className="text-base md:text-lg text-text-gray leading-relaxed font-body">
                Together, we bring warmth, creativity, and experience to every
                student&apos;s learning experience. We are committed to
                continuing the supportive atmosphere families have come to
                trust.
              </p>
            </motion.div>
          </motion.div>
        </div>

        {/* Team Grid: 4 members in 2×2 */}
        <div className="flex overflow-x-auto gap-4 pb-4 sm:grid sm:grid-cols-2 sm:gap-8 sm:overflow-visible sm:pb-0">
          {TEAM_MEMBERS.map((member, i) => (
            <motion.div
              key={member.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 * i, ease: "easeOut" }}
              className="w-[68vw] shrink-0 sm:w-auto sm:shrink bg-white rounded-2xl shadow-md overflow-hidden"
            >
              <div className="relative w-full aspect-[4/3] sm:aspect-[4/5]">
                <Image
                  src={member.image}
                  alt={member.name}
                  fill
                  className="object-cover object-[center_20%]"
                  sizes="(max-width: 640px) 68vw, 50vw"
                />
              </div>
              <div className="p-6 space-y-3">
                <p className="text-xl font-semibold text-text-gray font-heading">
                  {member.name}
                </p>
                <span className="inline-block bg-primary/10 text-primary text-xs font-semibold px-3 py-1 rounded-full">
                  {member.role}
                </span>
                {/* Description: hidden on mobile, visible on sm+ */}
                <p className="hidden sm:block text-sm text-text-gray leading-relaxed font-body">
                  {member.description}
                </p>
                {/* "View Bio" button: own row, mobile only */}
                <div className="sm:hidden">
                  <button
                    onClick={() => setSelectedMember(member)}
                    className="w-full py-2 rounded-lg text-xs font-semibold border border-primary text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                  >
                    View Bio
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {selectedMember && (
              <>
                {/* Backdrop */}
                <motion.div
                  className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setSelectedMember(null)}
                />

                {/* Bottom Sheet */}
                <motion.div
                  className="fixed z-[70] bg-white rounded-t-2xl shadow-2xl bottom-0 left-0 right-0 max-h-[80vh] overflow-y-auto"
                  initial={{ y: "100%", opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: "100%", opacity: 0 }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-xl font-semibold text-text-gray font-heading">
                          {selectedMember.name}
                        </p>
                        <span className="inline-block bg-primary/10 text-primary text-xs font-semibold px-3 py-1 rounded-full mt-2">
                          {selectedMember.role}
                        </span>
                      </div>
                      <button
                        onClick={() => setSelectedMember(null)}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0 cursor-pointer"
                        aria-label="Close"
                      >
                        <X className="w-5 h-5 text-gray-500" />
                      </button>
                    </div>

                    {/* Bio */}
                    <p className="text-sm text-text-gray leading-relaxed font-body">
                      {selectedMember.description}
                    </p>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </section>
  );
}
