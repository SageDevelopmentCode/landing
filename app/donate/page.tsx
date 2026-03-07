"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Heart, TreePine, Users } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const impactCards = [
  {
    icon: Heart,
    title: "Create a Safe Space",
    description:
      "Your generosity helps us build a warm, nurturing environment where every child feels safe to learn, grow, and thrive at their own pace.",
  },
  {
    icon: TreePine,
    title: "Outdoor Learning",
    description:
      "Help us create nature-based spaces — gardens, trails, and outdoor classrooms — that spark curiosity and connect children to the world around them.",
  },
  {
    icon: Users,
    title: "Community Growth",
    description:
      "With your support, we can expand our capacity to serve more families and build a stronger homeschool learning community in Central Texas.",
  },
];

export default function DonatePage() {
  return (
    <div className="min-h-screen bg-welcome-bg">
      <Navbar />

      {/* 1. Hero Section */}
      <section className="bg-welcome-bg py-16 px-8 sm:px-12 lg:px-16 pt-36">
        <div className="max-w-7xl mx-auto w-full text-center">
          <motion.div
            className="flex justify-center mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <span className="inline-block px-6 py-2 bg-badge-bg text-black text-sm font-semibold rounded-full">
              SUPPORT US
            </span>
          </motion.div>

          <motion.h1
            className="text-4xl md:text-5xl font-bold text-black font-heading mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          >
            Help Us Build Our Dream Property
          </motion.h1>

          <motion.p
            className="text-base md:text-lg text-text-gray leading-relaxed font-body max-w-2xl mx-auto mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          >
            Sage Field is more than a co-op — it&apos;s a community-built dream.
            We&apos;re raising funds to secure and transform our property in
            Central Texas into a thriving outdoor learning environment for
            children. Every contribution, big or small, brings us one step
            closer to opening our doors.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
          >
            <button className="cursor-pointer px-8 py-4 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-colors duration-200 shadow-md hover:shadow-lg font-body">
              Donate Now
            </button>
          </motion.div>
        </div>
      </section>

      {/* 2. Property Image Gallery */}
      <section className="bg-white py-16 px-8 sm:px-12 lg:px-16">
        <div className="max-w-7xl mx-auto w-full">
          <motion.div
            className="flex justify-center mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <span className="inline-block px-6 py-2 bg-badge-bg text-black text-sm font-semibold rounded-full">
              OUR PROPERTY
            </span>
          </motion.div>

          <motion.h2
            className="text-4xl md:text-5xl font-bold text-black font-heading text-center mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          >
            A Glimpse of What&apos;s Coming
          </motion.h2>

          <motion.p
            className="text-base md:text-lg text-text-gray leading-relaxed font-body text-center max-w-2xl mx-auto mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          >
            We envision a property with outdoor classrooms, lush gardens, and
            warm interior spaces that inspire wonder and hands-on learning every
            single day.
          </motion.p>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 gap-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
          >
            <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-lg relative">
              <Image
                src="/assets/After1.png"
                alt="Sage Field exterior rendering 1"
                fill
                className="object-cover hover:scale-[1.02] transition-transform duration-500"
              />
            </div>
            <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-lg relative">
              <Image
                src="/assets/After2.png"
                alt="Sage Field exterior rendering 2"
                fill
                className="object-cover hover:scale-[1.02] transition-transform duration-500"
              />
            </div>
            <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-lg relative">
              <Image
                src="/assets/After3.png"
                alt="Sage Field exterior rendering 3"
                fill
                className="object-cover hover:scale-[1.02] transition-transform duration-500"
              />
            </div>
            <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-lg relative">
              <Image
                src="/assets/Interior.png"
                alt="Sage Field interior learning space"
                fill
                className="object-cover hover:scale-[1.02] transition-transform duration-500"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* 3. Why Donate Section */}
      <section className="bg-welcome-bg py-16 px-8 sm:px-12 lg:px-16">
        <div className="max-w-7xl mx-auto w-full">
          <motion.div
            className="flex justify-center mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <span className="inline-block px-6 py-2 bg-badge-bg text-black text-sm font-semibold rounded-full">
              YOUR IMPACT
            </span>
          </motion.div>

          <motion.h2
            className="text-4xl md:text-5xl font-bold text-black font-heading text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          >
            Why Your Support Matters
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-14">
            {impactCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <motion.div
                  key={card.title}
                  className="bg-white rounded-xl shadow-md p-8 flex flex-col items-center text-center"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{
                    duration: 0.6,
                    delay: index * 0.15,
                    ease: "easeOut",
                  }}
                >
                  <div className="w-14 h-14 rounded-full bg-badge-bg flex items-center justify-center mb-5">
                    <Icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold font-heading text-black mb-3">
                    {card.title}
                  </h3>
                  <p className="text-base text-text-gray leading-relaxed font-body">
                    {card.description}
                  </p>
                </motion.div>
              );
            })}
          </div>

          <motion.div
            className="flex justify-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
          >
            <button className="px-8 py-4 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-colors duration-200 shadow-md hover:shadow-lg font-body">
              Donate Now
            </button>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
