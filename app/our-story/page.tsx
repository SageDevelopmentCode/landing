"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Navbar from "../components/Navbar";
import ContactUsSection from "../components/ContactUsSection";
import Footer from "../components/Footer";
import FloatingSMSButton from "../components/FloatingSMSButton";

const FOUNDERS = [
  {
    name: "Sabrina Grace Obnamia",
    role: "Lead Teacher & Director",
    image: "/assets/Headshot.jpeg",
    description:
      "Ms. Sabrina brings a wealth of experience to SageField. She holds a Bachelor's degree in Elementary Education with a concentration in Early Childhood Development from Biola University and a Teaching Credential. Her background includes working with children in a wide range of roles both in the U.S. and internationally—spanning special education, preschool, homeschooling, tutoring, coaching, traditional schooling, nature school guide, and more. She values movement, outdoor learning, and most importantly, the joy of slowing down to be present, intentional, and thankful.",
  },
  // {
  //   name: "Julius Cecilia",
  //   role: "Director of Operations & Technology",
  //   image: "/assets/team/JuliusC.jpg",
  //   description:
  //     "Julius Cecilia, a University of Washington graduate, is a software engineer and startup builder with experience across early-stage startups and established tech companies like Adobe. He previously co-founded a sports social platform and continues to build software at the intersection of technology and schools.",
  // },
];

export default function OurStoryPage() {
  return (
    <div className="min-h-screen bg-welcome-bg">
      <Navbar />

      {/* Header Section */}
      <section className="pt-32 pb-16 px-8 sm:px-12 lg:px-16">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            className="flex justify-center mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" as const }}
          >
            <span className="inline-block px-6 py-2 bg-badge-bg text-black text-sm font-semibold rounded-full">
              Our Story
            </span>
          </motion.div>

          <motion.h1
            className="text-4xl md:text-5xl font-bold text-center mb-6 font-heading text-gray-800"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" as const }}
          >
            Why We Started Sage Field
          </motion.h1>

          <motion.p
            className="text-lg md:text-xl text-center text-gray-600 font-body"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" as const }}
          >
            In Sabrina&apos;s own words — the story behind why Sage Field
            exists.
          </motion.p>
        </div>
      </section>

      {/* Story Section */}
      <section className="pb-20 px-8 lg:px-16">
        <motion.div
          className="max-w-3xl mx-auto space-y-6 font-body text-gray-700 leading-relaxed text-base md:text-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" as const }}
        >
          <p>
            When I was growing up, people often told me I was immature. Too
            playful. Too kid-like. Too hyperactive. Sometimes even a little
            weird.
          </p>

          <p>
            I liked playing, being outside, and was constantly running around.
            While others seemed ready to grow up quickly, I never really
            understood that.
          </p>

          <p>
            For a long time, I wondered if something about me needed to change.
          </p>

          {/* Pull quote */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: "easeOut" as const }}
            className="my-10 p-6 bg-primary/10 rounded-xl border-l-4 border-primary"
          >
            <p className="text-lg md:text-xl font-semibold text-gray-800 italic leading-relaxed font-heading">
              &ldquo;But over the years, I realized that the qualities people
              called &lsquo;immature&rsquo; were actually the same qualities
              that make children incredible learners — through curiosity,
              imagination, movement, exploration, and joy.&rdquo;
            </p>
          </motion.div>

          <p>
            So instead of repeating that cycle and teaching my students the same
            thing I experienced, I am breaking that pattern!
          </p>

          <p>
            Sage Field is an outdoor focused school where children are allowed
            to be children. A place where learning happens through movement,
            hands-on discovery, and time spent outside. A place where curiosity
            is encouraged, questions are celebrated, and the small joys of
            childhood are protected.
          </p>

          <p>
            What once felt like something I needed to change about myself is now
            the very thing shaping the kind of school I believe children
            deserve.
          </p>
        </motion.div>
      </section>

      {/* Founders Section */}
      <section className="py-16 px-8 sm:px-12 lg:px-16 bg-white/40">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: "easeOut" as const }}
            className="mb-12"
          >
            <div className="inline-block bg-badge-bg px-6 py-2 rounded-full mb-6">
              <span className="text-sm font-semibold text-text-gray font-body">
                The Founders
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-text-gray font-heading">
              Meet the Founders
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {FOUNDERS.map((founder, i) => (
              <motion.div
                key={founder.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.6,
                  delay: 0.1 * i,
                  ease: "easeOut" as const,
                }}
                className="bg-white rounded-2xl shadow-md overflow-hidden"
              >
                <div className="relative w-full aspect-[4/5]">
                  <Image
                    src={founder.image}
                    alt={founder.name}
                    fill
                    className="object-cover object-top"
                    sizes="(max-width: 640px) 100vw, 50vw"
                  />
                </div>
                <div className="p-6 space-y-3">
                  <p className="text-xl font-semibold text-text-gray font-heading">
                    {founder.name}
                  </p>
                  <span className="inline-block bg-primary/10 text-primary text-xs font-semibold px-3 py-1 rounded-full">
                    {founder.role}
                  </span>
                  <p className="text-sm text-text-gray leading-relaxed font-body">
                    {founder.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <ContactUsSection />
      <Footer />
      <FloatingSMSButton />
    </div>
  );
}
