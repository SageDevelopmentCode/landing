"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Mail,
  Phone,
  MapPin,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import Image from "next/image";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import FloatingSMSButton from "@/app/components/FloatingSMSButton";
import { submitContact } from "@/app/actions/contact";
import { formatPhone } from "@/app/utils/formatPhone";

const galleryImages = [
  "/assets/Stock1.jpg",
  "/assets/Kid1.png",
  "/assets/Kid2.jpg",
  "/assets/Stock3.jpg",
  "/assets/Stock4.jpg",
  "/assets/Stock5.jpg",
  "/assets/Stock6.jpg",
  "/assets/Stock7.jpg",
  "/assets/Stock8.jpg",
  "/assets/Stock9.jpg",
  "/assets/Stock10.jpg",
  "/assets/Stock11.jpg",
];

export default function ContactPage() {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const galleryRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const isPausedRef = useRef(false);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const el = galleryRef.current;
    if (!el) return;
    el.scrollLeft = 0;

    let pos = el.scrollLeft;
    const tick = () => {
      if (!isPausedRef.current && el) {
        pos += 0.5;
        el.scrollLeft = Math.round(pos);
        if (el.scrollLeft >= el.scrollWidth / 2) {
          pos = 0;
          el.scrollLeft = 0;
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const handleGalleryInteractionStart = () => {
    isPausedRef.current = true;
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
  };

  const handleGalleryInteractionEnd = () => {
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => {
      isPausedRef.current = false;
    }, 2500);
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    if (name === "phone") {
      setFormData((prev) => ({ ...prev, phone: formatPhone(value) }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: "" });

    try {
      const result = await submitContact({
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
        subject: formData.subject,
        message: formData.message,
      });

      if (result.success) {
        setSubmitStatus({ type: "success", message: result.message });
        setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
      } else {
        setSubmitStatus({ type: "error", message: result.message });
      }
    } catch {
      setSubmitStatus({
        type: "error",
        message: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-welcome-bg flex flex-col">
      <Navbar />

      {/* Mobile hero gallery */}
      <div className="sm:hidden pt-20">
        <div
          ref={galleryRef}
          className="overflow-x-auto flex gap-0 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]"
          onTouchStart={handleGalleryInteractionStart}
          onTouchEnd={handleGalleryInteractionEnd}
          onMouseDown={handleGalleryInteractionStart}
          onMouseUp={handleGalleryInteractionEnd}
        >
          {[...galleryImages, ...galleryImages].map((src, i) => (
            <div
              key={i}
              className="relative w-[88%] flex-shrink-0 aspect-square overflow-hidden"
            >
              <Image
                src={src}
                alt="Sage Field photo"
                fill
                className="object-cover"
                sizes="88vw"
                priority={i === 0}
              />
            </div>
          ))}
        </div>
      </div>

      <main className="flex-1 py-8 sm:py-16 px-8 sm:px-12 lg:px-16">
        <div className="max-w-7xl mx-auto w-full">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
            className="inline-block mb-8"
          >
            <div className="bg-badge-bg px-6 py-2 rounded-full">
              <span className="text-sm font-semibold text-text-gray font-body">
                Contact
              </span>
            </div>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            className="text-4xl md:text-5xl font-bold mb-8 sm:mb-16 text-text-gray font-heading"
          >
            Get in Touch
          </motion.h1>

          {/* Two-column layout */}
          <div className="flex flex-col lg:flex-row lg:justify-between items-start gap-16">
            {/* Left: Info */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
              className="w-full lg:w-1/2 space-y-8 order-2 lg:order-1"
            >
              <p className="text-lg md:text-xl text-text-gray leading-relaxed font-body">
                Have questions or want to learn more about Sage Field? Reach out
                anytime — we&apos;d love to connect with you and your family.
              </p>

              <div className="bg-white rounded-2xl p-8 shadow-lg space-y-6">
                {/* Email */}
                <motion.a
                  href="mailto:sabrina@sagefield.co"
                  onMouseEnter={() => setHoveredItem("email")}
                  onMouseLeave={() => setHoveredItem(null)}
                  whileHover={{ x: 5 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-start gap-4 p-4 rounded-lg hover:bg-primary/5 transition-colors duration-200 cursor-pointer"
                >
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
                      hoveredItem === "email"
                        ? "bg-primary/20 scale-110"
                        : "bg-primary/10"
                    }`}
                  >
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-primary mb-1 font-heading">
                      Email
                    </h4>
                    <p className="text-base text-text-gray font-body break-all">
                      sabrina@sagefield.co
                    </p>
                  </div>
                </motion.a>

                {/* Phone */}
                <motion.a
                  href="tel:+15126775872"
                  onMouseEnter={() => setHoveredItem("phone")}
                  onMouseLeave={() => setHoveredItem(null)}
                  whileHover={{ x: 5 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-start gap-4 p-4 rounded-lg hover:bg-primary/5 transition-colors duration-200 cursor-pointer"
                >
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
                      hoveredItem === "phone"
                        ? "bg-primary/20 scale-110"
                        : "bg-primary/10"
                    }`}
                  >
                    <Phone className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-primary mb-1 font-heading">
                      Phone
                    </h4>
                    <p className="text-base text-text-gray font-body">
                      (512) 677-5872
                    </p>
                  </div>
                </motion.a>

                {/* Location */}
                <motion.div
                  onMouseEnter={() => setHoveredItem("location")}
                  onMouseLeave={() => setHoveredItem(null)}
                  whileHover={{ x: 5 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-start gap-4 p-4 rounded-lg hover:bg-primary/5 transition-colors duration-200"
                >
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
                      hoveredItem === "location"
                        ? "bg-primary/20 scale-110"
                        : "bg-primary/10"
                    }`}
                  >
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-primary mb-1 font-heading">
                      Location
                    </h4>
                    <a
                      href="https://www.google.com/maps/search/?api=1&query=2760+Gattis+School+Rd,+Round+Rock,+TX+78664"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-base text-text-gray font-body hover:text-primary transition-colors"
                    >
                      2760 Gattis School Rd, Round Rock, TX 78664
                    </a>
                    <p className="text-xs text-text-gray mt-1 italic font-body">
                      For more information, please email us at{" "}
                      <a
                        href="mailto:sabrina@sagefield.co"
                        className="text-primary hover:underline"
                      >
                        sabrina@sagefield.co
                      </a>
                    </p>
                  </div>
                </motion.div>
              </div>
            </motion.div>

            {/* Right: Inline Form */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
              className="w-full lg:w-1/2 order-1 lg:order-2"
            >
              <div className="lg:bg-white lg:rounded-2xl lg:p-8 lg:shadow-lg">
                <h2 className="text-2xl font-heading font-semibold text-text-gray mb-2">
                  Send Us a Message
                </h2>
                <p className="text-sm text-gray-600 font-body mb-6">
                  We&apos;d love to hear from you! Send us a message and
                  we&apos;ll get back to you soon.
                </p>

                <form className="space-y-5" onSubmit={handleSubmit}>
                  {/* Status */}
                  {submitStatus.type && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex items-center gap-2 p-4 rounded-lg ${
                        submitStatus.type === "success"
                          ? "bg-green-50 text-green-800 border border-green-200"
                          : "bg-red-50 text-red-800 border border-red-200"
                      }`}
                    >
                      {submitStatus.type === "success" ? (
                        <CheckCircle className="w-5 h-5 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                      )}
                      <p className="text-sm font-body">{submitStatus.message}</p>
                    </motion.div>
                  )}

                  {/* Name */}
                  <div>
                    <label className="block text-sm font-semibold text-text-gray mb-2 font-body">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      disabled={isSubmitting}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none transition-colors font-body text-gray-900 placeholder:text-gray-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      placeholder="Your full name"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-semibold text-text-gray mb-2 font-body">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      disabled={isSubmitting}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none transition-colors font-body text-gray-900 placeholder:text-gray-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      placeholder="your@email.com"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-semibold text-text-gray mb-2 font-body">
                      Phone (Optional)
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none transition-colors font-body text-gray-900 placeholder:text-gray-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      placeholder="(123) 456-7890"
                    />
                  </div>

                  {/* Subject */}
                  <div>
                    <label className="block text-sm font-semibold text-text-gray mb-2 font-body">
                      Subject <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      disabled={isSubmitting}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none transition-colors font-body text-gray-900 placeholder:text-gray-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      placeholder="What would you like to discuss?"
                    />
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-sm font-semibold text-text-gray mb-2 font-body">
                      Message <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      rows={5}
                      required
                      disabled={isSubmitting}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none transition-colors font-body resize-none text-gray-900 placeholder:text-gray-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      placeholder="Tell us how we can help you..."
                    />
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-all duration-200 font-body cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      "Send Message"
                    )}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      <Footer />
      <FloatingSMSButton />
    </div>
  );
}
