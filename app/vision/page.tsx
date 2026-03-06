"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  CheckCircle,
  Instagram,
  Facebook,
  Mail,
  MapPin,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import DonationsSection from "../components/DonationsSection";

const formatPhoneNumber = (value: string) => {
  const phoneNumber = value.replace(/\D/g, "");
  if (phoneNumber.length === 0) return "";
  if (phoneNumber.length <= 3) return `(${phoneNumber}`;
  if (phoneNumber.length <= 6)
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
  return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
};

const milestones = [
  {
    title: "LLC Secured",
    description:
      "Sage Field is officially a registered LLC, laying the legal foundation for the school.",
  },
  {
    title: "Property Negotiations",
    description:
      "We are in active negotiations for a property in Round Rock, TX — the future home of Sage Field.",
  },
  {
    title: "Enrollment Open",
    description:
      "We're already enrolling families for Summer 2026 and School Year 2026–2027.",
  },
];

const beforeImages = [
  { src: "/assets/Before1.jpg", alt: "Property before — view 1" },
  { src: "/assets/Before2.jpg", alt: "Property before — view 2" },
  { src: "/assets/Before3.jpg", alt: "Property before — view 3" },
];

const afterImages = [
  { src: "/assets/After1.png", alt: "Property after — rendering 1" },
  { src: "/assets/After2.png", alt: "Property after — rendering 2" },
  { src: "/assets/After3.png", alt: "Property after — rendering 3" },
];

export default function VisionPage() {
  const [formData, setFormData] = useState({
    parentName: "",
    email: "",
    phone: "",
    childName: "",
    childAge: "",
    howCanYouHelp: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    if (name === "phone") {
      setFormData((prev) => ({ ...prev, phone: formatPhoneNumber(value) }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-welcome-bg">
      <Navbar />

      {/* 1. Hero Header */}
      <section className="relative h-screen w-full overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center scale-105"
          style={{ backgroundImage: "url(/assets/After2.png)" }}
        />
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/35" />

        {/* Content */}
        <div className="relative h-full w-full flex items-end pb-16 px-8 sm:px-12 lg:px-16">
          <div className="flex flex-col gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
            >
              <span className="inline-block px-6 py-2 bg-white/20 backdrop-blur-sm text-white text-sm font-semibold rounded-full border border-white/30">
                Our Vision
              </span>
            </motion.div>

            <motion.h1
              className="text-4xl md:text-6xl font-bold text-white drop-shadow-lg font-heading"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
            >
              Building Something Beautiful
            </motion.h1>

            <motion.p
              className="text-lg md:text-xl text-white/80 font-body max-w-xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7, ease: "easeOut" }}
            >
              We&apos;ve secured our LLC and are in active negotiations for a
              property in Round Rock, TX. Here&apos;s a glimpse of what&apos;s
              coming.
            </motion.p>
          </div>
        </div>
      </section>

      {/* 2. Milestones */}
      <section className="py-16 px-8 sm:px-12 lg:px-16 bg-white">
        <div className="max-w-5xl mx-auto">
          <motion.div
            className="flex justify-center mb-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <span className="inline-block px-6 py-2 bg-badge-bg text-black text-sm font-semibold rounded-full">
              Where We Are
            </span>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {milestones.map((milestone, index) => (
              <motion.div
                key={milestone.title}
                className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.6,
                  delay: index * 0.1,
                  ease: "easeOut",
                }}
              >
                <CheckCircle2 className="w-8 h-8 text-primary mb-4" />
                <h3 className="text-lg font-bold font-heading text-gray-800 mb-2">
                  {milestone.title}
                </h3>
                <p className="text-gray-600 font-body text-sm leading-relaxed">
                  {milestone.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Before & After Property */}
      <section className="py-16 px-8 sm:px-12 lg:px-16 bg-welcome-bg">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="flex justify-center mb-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <span className="inline-block px-6 py-2 bg-badge-bg text-black text-sm font-semibold rounded-full">
              The Property
            </span>
          </motion.div>

          <motion.h2
            className="text-3xl md:text-4xl font-bold text-center mb-4 font-heading text-gray-800"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          >
            From Here to There
          </motion.h2>

          <motion.p
            className="text-lg text-center text-gray-600 mb-8 font-body"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          >
            Take a look at the space we&apos;re transforming into Sage Field.
          </motion.p>

          {/* Before & After side by side */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
          >
            {/* Before Column */}
            <div className="flex flex-col gap-4">
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide font-body">
                Before
              </p>
              {beforeImages.map((image) => (
                <div
                  key={image.src}
                  className="aspect-[4/3] rounded-2xl overflow-hidden shadow-lg"
                >
                  <img
                    src={image.src}
                    alt={image.alt}
                    className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-500"
                  />
                </div>
              ))}
            </div>

            {/* After Column */}
            <div className="flex flex-col gap-4">
              <p className="text-sm font-semibold text-primary uppercase tracking-wide font-body">
                After
              </p>
              {afterImages.map((image) => (
                <div
                  key={image.src}
                  className="aspect-[4/3] rounded-2xl overflow-hidden shadow-lg"
                >
                  <img
                    src={image.src}
                    alt={image.alt}
                    className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-500"
                  />
                </div>
              ))}
            </div>
          </motion.div>

          <motion.p
            className="text-center text-sm text-gray-500 mt-4 font-body italic"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
          >
            Renderings of what Sage Field could look like
          </motion.p>
        </div>
      </section>

      {/* 3.5 Visual Banner — After3 */}
      <motion.div
        className="w-full h-64 md:h-80 lg:h-[420px] overflow-hidden relative"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <img
          src="/assets/After3.png"
          alt="Sage Field yard with sandbox, garden, and pergola"
          className="w-full h-full object-cover"
        />
        <span className="absolute bottom-4 right-4 px-3 py-1.5 bg-black/40 text-white text-sm italic rounded-full backdrop-blur-sm">
          A glimpse of what Sage Field could look like
        </span>
      </motion.div>

      {/* 4. Tuition Section */}
      <DonationsSection />

      {/* 5. "I'm Committed" CTA Form */}
      <section className="py-16 px-8 sm:px-12 lg:px-16 bg-welcome-bg">
        <div className="max-w-5xl mx-auto">
          <motion.div
            className="flex justify-center mb-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <span className="inline-block px-6 py-2 bg-badge-bg text-black text-sm font-semibold rounded-full">
              Join the Movement
            </span>
          </motion.div>

          <motion.h2
            className="text-3xl md:text-4xl font-bold text-center mb-4 font-heading text-gray-800"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          >
            I&apos;m Committed to Sage Field
          </motion.h2>

          <motion.p
            className="text-lg text-center text-gray-600 mb-10 font-body"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          >
            Whether you want to enroll your child, donate, volunteer, or help
            with the property — we&apos;d love to hear from you.
          </motion.p>

          <div className="flex flex-col md:flex-row gap-8 items-stretch">
            {/* Left: Image */}
            <motion.div
              className="hidden md:block md:w-1/2"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <img
                src="/assets/Interior.png"
                alt="Covered outdoor classroom with shelves and tables"
                className="rounded-2xl object-cover w-full h-full min-h-[600px]"
              />
            </motion.div>

            {/* Right: Form */}
            <div className="w-full md:w-1/2">
              <motion.div
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
              >
                {submitted ? (
                  <motion.div
                    className="flex flex-col items-center gap-4 py-8 text-center"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  >
                    <CheckCircle className="w-12 h-12 text-green-500" />
                    <p className="text-xl font-bold font-heading text-gray-800">
                      Thank you!
                    </p>
                    <p className="text-gray-600 font-body">
                      We&apos;ll be in touch soon.
                    </p>
                  </motion.div>
                ) : (
                  <form className="space-y-5" onSubmit={handleSubmit}>
                    {/* Parent/Guardian Name */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2 font-body">
                        Parent/Guardian Name{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="parentName"
                        value={formData.parentName}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none transition-colors font-body text-gray-900 placeholder:text-gray-500"
                        placeholder="Your full name"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2 font-body">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none transition-colors font-body text-gray-900 placeholder:text-gray-500"
                        placeholder="your@email.com"
                      />
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2 font-body">
                        Phone (Optional)
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none transition-colors font-body text-gray-900 placeholder:text-gray-500"
                        placeholder="(123) 456-7890"
                      />
                    </div>

                    {/* Child's Name & Age - side by side */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2 font-body">
                          Child&apos;s Name (Optional)
                        </label>
                        <input
                          type="text"
                          name="childName"
                          value={formData.childName}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none transition-colors font-body text-gray-900 placeholder:text-gray-500"
                          placeholder="First and last name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2 font-body">
                          Child&apos;s Age (Optional)
                        </label>
                        <input
                          type="number"
                          name="childAge"
                          value={formData.childAge}
                          onChange={handleChange}
                          min="1"
                          max="18"
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none transition-colors font-body text-gray-900 placeholder:text-gray-500"
                          placeholder="e.g., 7"
                        />
                      </div>
                    </div>

                    {/* How can you help */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2 font-body">
                        Special Interests & Learning Needs
                      </label>
                      <textarea
                        name="howCanYouHelp"
                        value={formData.howCanYouHelp}
                        onChange={handleChange}
                        rows={4}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none transition-colors font-body resize-none text-gray-900 placeholder:text-gray-500"
                        placeholder="e.g. I'd like to enroll my child, donate, help with property setup, volunteer my skills..."
                      />
                    </div>

                    {/* Submit */}
                    <button
                      type="submit"
                      className="w-full px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-all duration-200 font-body cursor-pointer"
                    >
                      I&apos;m Committed
                    </button>
                  </form>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Social Media & Info */}
      <section className="py-16 px-8 sm:px-12 lg:px-16 bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            className="flex justify-center mb-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <span className="inline-block px-6 py-2 bg-badge-bg text-black text-sm font-semibold rounded-full">
              Stay Connected
            </span>
          </motion.div>

          <motion.p
            className="text-gray-600 font-body mb-8 text-lg"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          >
            Sage Field is a homeschool learning community for ages 6–10 in
            Central Texas, built on hands-on, wisdom-focused education.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-6 text-gray-600 font-body"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          >
            <a
              href="https://www.instagram.com/sagefield.co"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:text-primary transition-colors"
              aria-label="Follow us on Instagram"
            >
              <Instagram className="w-5 h-5" />
              <span>@sagefield.co</span>
            </a>
            <a
              href="https://www.facebook.com/sagefield.co"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:text-primary transition-colors"
              aria-label="Follow us on Facebook"
            >
              <Facebook className="w-5 h-5" />
              <span>sagefield.co</span>
            </a>
            <a
              href="mailto:sabrina@sagefield.co"
              className="flex items-center gap-2 hover:text-primary transition-colors"
            >
              <Mail className="w-5 h-5" />
              <span>sabrina@sagefield.co</span>
            </a>
            <div className="flex items-center gap-2 text-gray-500">
              <MapPin className="w-5 h-5" />
              <span>Round Rock, TX (upcoming)</span>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
