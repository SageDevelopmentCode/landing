'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';

interface ImageGridShowcaseProps {
  images: Array<{
    src: string;
    alt: string;
  }>;
}

export default function ImageGridShowcase({ images }: ImageGridShowcaseProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: 'easeOut',
      },
    },
  };

  return (
    <section className="bg-welcome-bg py-16 px-8 sm:px-12 lg:px-16">
      <motion.div
        className={`max-w-7xl mx-auto grid gap-6 sm:gap-8 ${
          images.length === 2
            ? 'grid-cols-1 md:grid-cols-2'
            : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
        }`}
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        {images.map((image, index) => (
          <motion.div
            key={index}
            variants={itemVariants}
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.3 }}
            className="relative h-[50vh] sm:h-[60vh] rounded-2xl overflow-hidden shadow-lg"
          >
            <Image
              src={image.src}
              alt={image.alt}
              fill
              className="object-cover"
              sizes={
                images.length === 2
                  ? '(max-width: 768px) 100vw, 50vw'
                  : '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw'
              }
            />
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
