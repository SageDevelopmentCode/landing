'use client';

import { motion } from 'framer-motion';
import { Heart, Sparkles, BookOpen, Users } from 'lucide-react';

const DonationsSection = () => {
  const impactAreas = [
    {
      icon: <Sparkles className="w-8 h-8 text-primary" />,
      title: 'Program Enrichment',
      description: 'Supporting diverse learning experiences and special activities',
    },
    {
      icon: <Users className="w-8 h-8 text-primary" />,
      title: 'Community Growth',
      description: 'Building a thriving, supportive educational community',
    },
    {
      icon: <BookOpen className="w-8 h-8 text-primary" />,
      title: 'Educational Materials',
      description: 'Providing quality resources and learning tools',
    },
    {
      icon: <Heart className="w-8 h-8 text-primary" />,
      title: 'Facility Support',
      description: 'Maintaining a nurturing and inspiring environment',
    },
  ];

  return (
    <section className="relative bg-welcome-bg py-16 px-8 sm:px-12 lg:px-16 min-h-[80vh] flex items-center justify-center overflow-hidden">
      <div className="max-w-7xl w-full">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mb-8"
        >
          <span className="inline-block px-6 py-2 bg-badge-bg text-black text-sm font-semibold rounded-full">
            SECTION 6: DONATIONS & COMMITMENT
          </span>
        </motion.div>

        {/* Main Content Grid */}
        <div className="flex flex-col lg:flex-row lg:justify-between items-start gap-16 w-full">
          {/* Left Column - Text Content */}
          <div className="w-full lg:w-1/2 text-left">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
              className="text-4xl md:text-5xl font-bold text-black mb-6 font-heading"
            >
              Contribution Model
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
              className="text-base md:text-lg text-text-gray leading-relaxed mb-6 font-body"
            >
              Participation at Sage Field is based on a{' '}
              <span className="text-primary font-semibold">minimum donation</span>, not official
              tuition. Families commit to a one-semester contract to ensure consistency and support
              for our program.
            </motion.p>

            {/* Callout Box */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
              className="mt-8 p-6 bg-primary/10 rounded-lg border-l-4 border-primary"
            >
              <h3 className="text-lg font-semibold text-black mb-4 font-heading">
                Key Details
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <span className="text-primary mr-2 text-xl">•</span>
                  <span className="text-base text-text-gray font-body">
                    <span className="font-semibold text-black">Minimum Donation:</span> Approx. $850/month (TBD based on number of students)
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2 text-xl">•</span>
                  <span className="text-base text-text-gray font-body">
                    <span className="font-semibold text-black">Payment Options:</span> Semester or
                    monthly installments
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2 text-xl">•</span>
                  <span className="text-base text-text-gray font-body">
                    <span className="font-semibold text-black">Commitment:</span> One-semester
                    contract for program consistency
                  </span>
                </li>
              </ul>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4, ease: 'easeOut' }}
              className="text-base md:text-lg text-text-gray leading-relaxed mt-6 mb-8 font-body"
            >
              Your contributions make this community possible — supporting continued growth and
              enrichment for every child.
            </motion.p>

            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.5, ease: 'easeOut' }}
            >
              <button className="px-8 py-4 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-colors duration-200 shadow-md hover:shadow-lg font-body cursor-pointer">
                Support Sage Field
              </button>
            </motion.div>
          </div>

          {/* Right Column - Interactive Impact Cards */}
          <div className="w-full lg:w-1/2">
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-6"
            >
              {impactAreas.map((area, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{
                    duration: 0.5,
                    delay: 0.2 + index * 0.1,
                    ease: 'easeOut',
                  }}
                  whileHover={{ scale: 1.05 }}
                  className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group"
                >
                  {/* Icon Container */}
                  <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-4 group-hover:bg-primary/30 transition-colors duration-200">
                    {area.icon}
                  </div>

                  {/* Card Content */}
                  <h3 className="text-lg font-semibold text-black mb-2 font-heading">
                    {area.title}
                  </h3>
                  <p className="text-sm text-text-gray font-body">{area.description}</p>
                </motion.div>
              ))}
            </motion.div>

            {/* Supporting Text */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="mt-8 p-6 bg-white rounded-lg shadow-sm border border-primary/10"
            >
              <p className="text-base text-text-gray leading-relaxed font-body text-center">
                <span className="text-primary font-semibold">Every contribution</span> helps us
                create a nurturing environment where children can thrive and grow together.
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DonationsSection;
