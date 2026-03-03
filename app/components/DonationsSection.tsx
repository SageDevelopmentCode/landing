"use client";

import { motion } from "framer-motion";
import { Calendar, Clock, PartyPopper } from "lucide-react";
import Image from "next/image";

const DonationsSection = () => {
  return (
    <section className="relative bg-welcome-bg py-16 px-8 sm:px-12 lg:px-16 min-h-[80vh] flex items-center justify-center overflow-hidden">
      <div className="max-w-7xl mx-auto w-full">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mb-8"
        >
          <span className="inline-block px-6 py-2 bg-badge-bg text-black text-sm font-semibold rounded-full">
            TUITION & COMMITMENT
          </span>
        </motion.div>

        {/* Main Content */}
        <div className="w-full">
          {/* Heading */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
            className="text-4xl md:text-5xl font-bold text-black mb-4 font-heading text-center"
          >
            Tuition & Membership
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            className="text-base md:text-lg text-text-gray leading-relaxed mb-12 font-body text-center max-w-3xl mx-auto"
          >
            We offer flexible membership options designed to support your
            family&apos;s needs and schedule.
          </motion.p>

          {/* Featured Core Membership */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
            className="mb-12 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl border-2 border-primary shadow-lg overflow-hidden"
          >
            {/* Image */}
            <div className="relative h-[40vh] md:h-[50vh]">
              <Image
                src="/assets/ImageTen.jpg"
                alt="All Access Membership"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 1200px"
              />
            </div>

            {/* Content */}
            <div className="p-8 md:p-10">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                {/* Icon */}
                <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-10 h-10 text-white" />
                </div>

                {/* Content */}
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-2xl md:text-3xl font-bold text-black mb-3 font-heading">
                    All Access Membership
                  </h3>
                  <p className="text-lg md:text-xl text-text-gray mb-4 font-body">
                    Monday - Thursday, 9:00am - 3:00pm
                  </p>
                  <div className="inline-block px-6 py-3 bg-white rounded-lg shadow-md">
                    <p className="text-3xl md:text-4xl font-bold text-primary font-heading">
                      $1,095
                      <span className="text-xl text-text-gray font-normal">
                        /month
                      </span>
                    </p>
                  </div>
                  <p className="text-xs text-text-gray mt-4 italic font-body">
                    For drop-in options instead of the full 4-day membership,
                    please email us at{" "}
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

          {/* Package Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* After Care Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
              whileHover={{ scale: 1.02 }}
              className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-200 overflow-hidden"
            >
              {/* Image */}
              <div className="relative h-[30vh] md:h-[35vh]">
                <Image
                  src="/assets/ImageSeven.jpg"
                  alt="After Care Program"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>

              {/* Content */}
              <div className="p-8">
                {/* Icon */}
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-6">
                  <Clock className="w-8 h-8 text-primary" />
                </div>

                {/* Title */}
                <h3 className="text-2xl font-bold text-black mb-2 font-heading">
                  After Care
                </h3>
                <p className="text-base text-text-gray mb-6 font-body">
                  3:00pm - 6:00pm
                </p>

                {/* Pricing Options */}
                <div className="space-y-4">
                  {/* Drop-in */}
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

                  {/* Member Monthly */}
                  <div className="p-4 bg-welcome-bg rounded-lg border-l-4 border-primary">
                    <p className="text-sm font-semibold text-black mb-1 font-heading">
                      Monthly (Member)
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

                  {/* Non-Member Monthly */}
                  <div className="p-4 bg-welcome-bg rounded-lg border-l-4 border-primary">
                    <p className="text-sm font-semibold text-black mb-1 font-heading">
                      Monthly (Non-Member)
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

            {/* Fun Friday Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
              whileHover={{ scale: 1.02 }}
              className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-200 overflow-hidden"
            >
              {/* Image */}
              <div className="relative h-[30vh] md:h-[35vh]">
                <Image
                  src="/assets/ImageEight.jpg"
                  alt="Fun Friday Activities"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>

              {/* Content */}
              <div className="p-8">
                {/* Icon */}
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-6">
                  <PartyPopper className="w-8 h-8 text-primary" />
                </div>

                {/* Title */}
                <h3 className="text-2xl font-bold text-black mb-2 font-heading">
                  Fun Friday
                </h3>
                <p className="text-base text-text-gray mb-6 font-body">
                  9:00am - 1:00pm
                </p>

                {/* Pricing Options */}
                <div className="space-y-4">
                  {/* Package of 4 */}
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

                  {/* Drop-in */}
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
          </div>
        </div>
      </div>
    </section>
  );
};

export default DonationsSection;
