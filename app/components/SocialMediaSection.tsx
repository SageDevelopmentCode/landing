"use client";

import { motion } from "framer-motion";
import { Instagram, Facebook } from "lucide-react";

export default function SocialMediaSection() {
  // const placeholders = [
  //   { id: 1, platform: "instagram" },
  //   { id: 2, platform: "facebook" },
  //   { id: 3, platform: "instagram" },
  //   { id: 4, platform: "facebook" },
  //   { id: 5, platform: "instagram" },
  //   { id: 6, platform: "facebook" },
  // ];

  return (
    <section className="bg-welcome-bg py-16 px-8 sm:px-12 lg:px-16 min-h-[80vh] flex items-center justify-center">
      <div className="max-w-7xl mx-auto w-full">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-6"
        >
          <span className="inline-block px-6 py-2 bg-badge-bg text-black text-sm font-semibold rounded-full font-body">
            Follow Us
          </span>
        </motion.div>

        {/* Title */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl md:text-5xl font-bold text-black font-heading mb-6 text-center"
        >
          Follow Us on Social Media
        </motion.h2>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-base md:text-lg text-text-gray leading-relaxed font-body mb-8 text-center max-w-3xl mx-auto"
        >
          Join our community and stay connected! Follow us to see behind-the-scenes moments,
          educational insights, and the joyful learning experiences at Sage Field.
        </motion.p>

        {/* Social Media Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex items-center justify-center gap-4"
        >
          <a
            href="https://www.instagram.com/sagefield.co"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-6 py-3 text-white font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg font-body"
            style={{ backgroundColor: '#E4405F' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#D62D4F'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#E4405F'}
          >
            <Instagram className="w-5 h-5" />
            <span>Instagram</span>
          </a>
          <a
            href="https://www.facebook.com/sagefield.co"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-6 py-3 text-white font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg font-body"
            style={{ backgroundColor: '#1877F2' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0E63D6'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1877F2'}
          >
            <Facebook className="w-5 h-5" />
            <span>Facebook</span>
          </a>
        </motion.div>

        {/* Placeholder Grid - Uncomment when ready to add posts */}
        {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {placeholders.map((placeholder, index) => (
            <motion.div
              key={placeholder.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 + index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-200 h-[300px] flex items-center justify-center"
            >
              <div className="text-center p-6">
                {placeholder.platform === "instagram" ? (
                  <Instagram className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                ) : (
                  <Facebook className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                )}
                <p className="text-gray-400 font-body text-sm">Coming Soon</p>
                <p className="text-gray-300 font-body text-xs mt-2">
                  {placeholder.platform === "instagram" ? "Instagram" : "Facebook"} Post
                </p>
              </div>
            </motion.div>
          ))}
        </div> */}
      </div>
    </section>
  );
}
