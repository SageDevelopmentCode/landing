"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
  Check,
  CheckCircle,
  ChevronDown,
  Users,
  Leaf,
  Heart,
  Shield,
  Gift,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import FloatingSMSButton from "../components/FloatingSMSButton";
import WeekRecapPreview from "../components/WeekRecapPreview";
import { formatPhone } from "../utils/formatPhone";

// ─── Gallery images ───────────────────────────────────────────────────────────

const GALLERY_IMAGES = [
  "/assets/Stock1.jpg",
  "/assets/Stock2.jpg",
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

// ─── Gift cards ───────────────────────────────────────────────────────────────

const GIFT_CARDS = [
  { label: "Amazon", logo: "https://upload.wikimedia.org/wikipedia/commons/d/de/Amazon_icon.png" },
  { label: "Target", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Target_logo.svg/1920px-Target_logo.svg.png" },
  { label: "Visa", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Visa_Inc._logo_%282021%E2%80%93present%29.svg/3840px-Visa_Inc._logo_%282021%E2%80%93present%29.svg.png" },
  { label: "Home Depot", logo: "https://corporate.homedepot.com/sites/default/files/image_gallery/THD_logo.jpg" },
  { label: "Starbucks", logo: "https://upload.wikimedia.org/wikipedia/sco/thumb/d/d3/Starbucks_Corporation_Logo_2011.svg/3840px-Starbucks_Corporation_Logo_2011.svg.png" },
  { label: "Best Buy", logo: "https://logodownload.org/wp-content/uploads/2020/05/best-buy-logo.png" },
  { label: "Sephora", logo: "https://logodownload.org/wp-content/uploads/2021/06/sephora-logo-0.png" },
  { label: "Nike", logo: "https://cdn.freebiesupply.com/logos/large/2x/nike-4-logo-png-transparent.png" },
];

// ─── FAQs ─────────────────────────────────────────────────────────────────────

const FAQS = [
  {
    q: "Who can I refer?",
    a: "Any family you know who has a child between ages 4–11 and would thrive in a small, hands-on learning environment. They don't need to live in Round Rock — families commute from all over the Austin area.",
  },
  {
    q: "When do I get my gift card?",
    a: "Both you and the referred family will receive your $250 gift card within 5–7 business days after their enrollment fee is successfully processed.",
  },
  {
    q: "What gift card options are available?",
    a: "You can choose from Amazon, Target, Visa prepaid, Walmart, and more. We'll reach out to confirm your preference once the referral is complete.",
  },
  {
    q: "Is there a limit to how many families I can refer?",
    a: "No limit. Each successful referral earns both parties a $250 gift card. The more families you share Sage Field with, the more rewards for everyone.",
  },
  {
    q: "What if the family was already interested in Sage Field?",
    a: "The referral reward applies when we receive your submission before the family begins the enrollment process. If they haven't officially applied yet, your referral counts.",
  },
  {
    q: "How will I know if my referral enrolled?",
    a: "We'll email you once your referred family completes enrollment and payment. Gift card instructions arrive at the same time.",
  },
];

// ─── Shared styles ────────────────────────────────────────────────────────────

const inputClass =
  "w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none transition-colors font-body text-gray-900 placeholder:text-gray-500 bg-white";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-6 mb-3 font-body">
      {children}
    </p>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ReferPage() {
  const galleryRef = useRef<HTMLDivElement>(null);
  const giftCardRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const giftCardRafRef = useRef<number | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    yourName: "",
    yourEmail: "",
    yourPhone: "",
    theirName: "",
    theirEmail: "",
    theirPhone: "",
    childAge: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  useEffect(() => {
    const el = galleryRef.current;
    if (!el) return;
    el.scrollLeft = 0;
    let pos = 0;
    const tick = () => {
      if (el) {
        pos += 0.6;
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

  useEffect(() => {
    const el = giftCardRef.current;
    if (!el) return;
    el.scrollLeft = 0;
    let pos = 0;
    const tick = () => {
      if (el) {
        pos += 0.5;
        el.scrollLeft = Math.round(pos);
        if (el.scrollLeft >= el.scrollWidth / 2) {
          pos = 0;
          el.scrollLeft = 0;
        }
      }
      giftCardRafRef.current = requestAnimationFrame(tick);
    };
    giftCardRafRef.current = requestAnimationFrame(tick);
    return () => {
      if (giftCardRafRef.current) cancelAnimationFrame(giftCardRafRef.current);
    };
  }, []);

  const scrollToForm = () =>
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name.toLowerCase().includes("phone") ? formatPhone(value) : value,
    }));
  };

  const isFormValid =
    !!formData.yourName.trim() &&
    !!formData.yourEmail.trim() &&
    !!formData.theirName.trim() &&
    !!formData.theirEmail.trim();

  const handleSubmit = async () => {
    if (!isFormValid || submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    await new Promise((r) => setTimeout(r, 1100));
    try {
      const { default: confetti } = await import("canvas-confetti");
      confetti({ particleCount: 140, spread: 75, origin: { y: 0.6 } });
    } catch {
      // confetti is a nice-to-have
    }
    setSubmitted(true);
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar darkStyle={true} />

      {/* ── Hero ── */}
      <section className="bg-sage-50 pt-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 lg:px-16 py-10 lg:py-20 flex flex-col lg:flex-row items-center gap-6 lg:gap-16">
          {/* Left — content */}
          <motion.div
            className="flex-1 text-center lg:text-left"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
          >
            <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold font-heading text-gray-800 leading-tight mb-4">
              Know a Family Who&apos;d{" "}
              <span className="text-primary">Thrive Here?</span>
            </h1>

            <p className="text-lg text-gray-500 font-body leading-relaxed mb-6 max-w-lg mx-auto lg:mx-0">
              Refer a family to Sage Field. When they enroll and pay their
              enrollment fee — we send{" "}
              <span className="font-semibold text-gray-700">
                both of you a $250 gift card
              </span>{" "}
              of your choice.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <button
                onClick={scrollToForm}
                className="w-full sm:w-auto whitespace-nowrap px-6 py-3.5 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-colors duration-200 shadow-md hover:shadow-lg font-body cursor-pointer text-sm"
              >
                Refer a Family →
              </button>
              <Link
                href="/about"
                className="w-full sm:w-auto whitespace-nowrap text-center px-6 py-3.5 border-2 border-sage-300 text-gray-600 font-semibold rounded-lg hover:border-primary hover:text-primary transition-colors duration-200 font-body text-sm"
              >
                Learn About Us
              </Link>
            </div>

            {/* Reward teaser callout */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.4 }}
              className="flex justify-center lg:justify-start mt-5"
            >
              <div className="inline-flex items-center gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 shadow-sm">
                <span className="text-base">💰</span>
                <p className="text-xs text-amber-800 font-body leading-snug">
                  Both families receive{" "}
                  <span className="font-bold text-amber-900">
                    a $250 gift card
                  </span>{" "}
                  once the referred family pays their enrollment fee.
                </p>
              </div>
            </motion.div>
          </motion.div>

          {/* Right — photo mosaic (desktop only) */}
          <motion.div
            className="hidden lg:block lg:flex-1"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <div className="grid grid-cols-2 gap-2">
              <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-md">
                <Image
                  src="/assets/Stock5.jpg"
                  alt="Students at Sage Field"
                  fill
                  className="object-cover"
                  sizes="300px"
                  priority
                />
              </div>
              <div className="flex flex-col gap-2">
                <div className="relative aspect-square rounded-2xl overflow-hidden shadow-md">
                  <Image
                    src="/assets/Stock3.jpg"
                    alt="Students at Sage Field"
                    fill
                    className="object-cover"
                    sizes="200px"
                    priority
                  />
                </div>
                <div className="relative aspect-square rounded-2xl overflow-hidden shadow-md">
                  <Image
                    src="/assets/Stock7.jpg"
                    alt="Students at Sage Field"
                    fill
                    className="object-cover"
                    sizes="200px"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Photo strip carousel ── */}
      <div className="bg-sage-50">
        <div
          ref={galleryRef}
          className="overflow-x-auto flex gap-0 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]"
        >
          {[...GALLERY_IMAGES, ...GALLERY_IMAGES].map((src, i) => (
            <div
              key={i}
              className="relative w-52 sm:w-64 lg:w-72 shrink-0 aspect-[4/3] overflow-hidden"
            >
              <Image
                src={src}
                alt="Students at Sage Field"
                fill
                className="object-cover"
                sizes="288px"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </div>

      {/* ── How It Works ── */}
      <section className="py-12 px-4 sm:py-16 sm:px-8 lg:px-16 bg-white">
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="mb-10"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-block px-5 py-1.5 bg-badge-bg text-black text-sm font-semibold rounded-full mb-4 font-body">
              How It Works
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 font-heading mb-2">
              Three Steps. Two Gift Cards.
            </h2>
            <p className="text-base text-gray-500 font-body leading-relaxed max-w-xl">
              The whole process takes about two minutes on your end. We handle
              everything else.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              {
                emoji: "📨",
                step: "Step 1",
                title: "Share",
                desc: "Fill out the form below with your info and the family you'd like to refer. Takes under 2 minutes.",
              },
              {
                emoji: "🌱",
                step: "Step 2",
                title: "We Reach Out",
                desc: "Sabrina personally contacts the referred family, answers questions, and walks them through enrollment.",
              },
              {
                emoji: "🎁",
                step: "Step 3",
                title: "You Both Win",
                desc: "Once they pay their enrollment fee, we send both families a $250 gift card of their choice.",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="bg-sage-50 border border-sage-200 rounded-2xl p-6 hover:shadow-md transition-shadow duration-200"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-2xl">
                  {item.emoji}
                </div>
                <span className="text-[10px] font-bold text-primary uppercase tracking-wide font-body">
                  {item.step}
                </span>
                <h3 className="text-base font-bold font-heading text-gray-800 mt-1 mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-600 font-body leading-relaxed">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why Sage Field ── */}
      <section className="py-12 px-4 sm:py-16 sm:px-8 lg:px-16 bg-sage-50">
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-block px-5 py-2 bg-badge-bg text-black text-sm font-semibold rounded-full mb-4 font-body">
              Why Sage Field
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold font-heading text-gray-800 mb-3">
              What You&apos;re Referring Them To
            </h2>
            <p className="text-base text-gray-500 font-body">
              When you refer a family, you&apos;re giving them something
              genuinely different.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[
              {
                icon: Users,
                headline: "Tiny classes — every child is truly known",
                body: "We cap every class at 10–12 students. With mixed ages and real relationships with every teacher, no child gets lost in the crowd.",
              },
              {
                icon: Leaf,
                headline: "Outdoor, hands-on learning every day",
                body: "Montessori, Waldorf, and Reggio-inspired methods meet TEKS-aligned academics. Mornings are structured learning; afternoons are nature, cooking, and art.",
              },
              {
                icon: Shield,
                headline: "Licensed educators who treat kids like family",
                body: "Our team is experienced, credentialed, and deeply invested in each child's growth. Not a daycare — a real academic program.",
              },
              {
                icon: Heart,
                headline: "Ages 4–11 in Round Rock, TX",
                body: "Serving the greater Austin area. Pre-K through elementary, ability-grouped — not grade-grouped — so every child works at their actual level.",
              },
            ].map(({ icon: Icon, headline, body }, i) => (
              <motion.div
                key={headline}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="bg-white border border-sage-200 rounded-2xl p-6 hover:shadow-md transition-shadow duration-200"
              >
                <div className="w-12 h-12 bg-sage-50 rounded-xl border border-sage-200 flex items-center justify-center mb-4 shadow-sm">
                  <Icon className="w-5 h-5 text-sage-600" />
                </div>
                <h4 className="text-base font-bold font-heading text-gray-800 mb-2">
                  {headline}
                </h4>
                <p className="text-sm text-gray-600 font-body leading-relaxed">
                  {body}
                </p>
              </motion.div>
            ))}
          </div>

          <div className="flex justify-center mt-8">
            <Link
              href="/about"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-700 font-semibold rounded-lg border border-sage-200 hover:bg-sage-50 transition-colors duration-200 shadow-sm font-body text-sm"
            >
              Read our full story →
            </Link>
          </div>
        </div>
      </section>

      {/* ── The Reward ── */}
      <section className="py-12 px-4 sm:py-20 sm:px-8 lg:px-16 bg-white">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 32, scale: 0.97 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 180, damping: 20 }}
            className="relative bg-white rounded-3xl shadow-xl border-2 border-sage-200 overflow-hidden"
          >
            {/* Left accent stripe */}
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-primary to-sage-500" />

            <div className="grid grid-cols-1 md:grid-cols-5">
              {/* Left panel */}
              <div className="md:col-span-3 p-5 sm:p-8 md:p-10 pl-7 sm:pl-10 md:pl-12">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-8 h-8 bg-sage-50 border border-sage-200 rounded-lg flex items-center justify-center">
                    <Gift className="w-4 h-4 text-sage-600" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wide text-sage-600 font-body">
                    The Reward
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl md:text-3xl font-bold font-heading text-gray-800 leading-tight mb-5">
                  $250 Gift Card — For Each of You.
                </h3>
                <p className="text-base text-gray-600 font-body leading-relaxed mb-6">
                  When your referred family pays their enrollment fee, we send
                  both of you a $250 gift card. Amazon, Target, Visa prepaid —
                  your choice. No codes, no forms. We just send it.
                </p>
                <div className="flex items-start gap-3 bg-sage-50 border border-sage-200 rounded-xl p-4">
                  <Shield className="w-4 h-4 text-sage-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-gray-600 font-body leading-relaxed">
                    Gift cards are sent within 5–7 business days after the
                    referred family&apos;s enrollment fee clears. No referral
                    limit.
                  </p>
                </div>
              </div>

              {/* Right panel */}
              <div className="md:col-span-2 bg-sage-50 border-t-2 md:border-t-0 md:border-l-2 border-sage-200 p-5 sm:p-8 md:p-10 flex flex-col justify-center gap-6">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-400 font-body mb-3">
                    Gift Card Options
                  </p>
                  <div
                    ref={giftCardRef}
                    className="flex gap-3 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                  >
                    {[...GIFT_CARDS, ...GIFT_CARDS].map((c, i) => (
                      <div
                        key={`${c.label}-${i}`}
                        className="w-20 flex-shrink-0 flex flex-col items-center gap-1.5 bg-white border border-gray-200 rounded-xl p-2 shadow-sm"
                      >
                        <div className="relative w-10 h-10">
                          <Image
                            src={c.logo}
                            alt={c.label}
                            fill
                            unoptimized
                            className="object-contain"
                          />
                        </div>
                        <span className="text-[10px] font-semibold text-gray-500 font-body text-center">
                          {c.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-sage-200 p-4">
                  <div className="flex items-start justify-between gap-1">
                    {[
                      { num: "1", label: "You Refer", sub: "2 min form" },
                      { num: "2", label: "They Enroll", sub: "we handle it" },
                      { num: "3", label: "$250 Each", sub: "gift card sent", highlight: true },
                    ].map((step, i) => (
                      <React.Fragment key={step.num}>
                        <div
                          className="flex flex-col items-center text-center gap-1.5 flex-1"
                        >
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                              step.highlight
                                ? "bg-primary shadow-sm"
                                : "bg-sage-100 border border-sage-300"
                            }`}
                          >
                            <span
                              className={`text-xs font-bold font-body ${
                                step.highlight ? "text-white" : "text-sage-700"
                              }`}
                            >
                              {step.num}
                            </span>
                          </div>
                          <p
                            className={`text-xs font-bold font-body leading-tight ${
                              step.highlight ? "text-primary" : "text-gray-800"
                            }`}
                          >
                            {step.label}
                          </p>
                          <p className="text-[10px] text-gray-400 font-body">
                            {step.sub}
                          </p>
                        </div>
                        {i < 2 && (
                          <div className="flex items-center pt-2 flex-shrink-0">
                            <span className="text-sage-300 text-sm">›</span>
                          </div>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Referral Form ── */}
      <section className="py-12 px-4 sm:py-16 sm:px-8 lg:px-16 bg-sage-50">
        <div ref={formRef} className="max-w-2xl mx-auto">
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-block px-5 py-1.5 bg-primary/10 text-primary text-sm font-semibold rounded-full mb-4 font-body">
              Submit a Referral
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 font-heading mb-2">
              Spread the Word. Share the Reward.
            </h2>
            <p className="text-gray-500 font-body text-base">
              Takes 60 seconds. We handle the rest.
            </p>
          </motion.div>

          <AnimatePresence>
            {submitted ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl p-10 shadow-sm border border-gray-100 text-center"
              >
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="font-heading font-bold text-2xl text-gray-800 mb-2">
                  Referral submitted!
                </h3>
                <p className="text-gray-500 font-body mb-2">
                  We&apos;ll reach out to the family you referred soon. Keep an
                  eye out for your $250 gift card once they enroll.
                </p>
                <p className="text-sm text-primary font-semibold font-body mt-4">
                  Thank you for sharing Sage Field. 🌿
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 sm:p-8"
              >
                <SectionLabel>Your Info</SectionLabel>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-body">
                      Your name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      name="yourName"
                      value={formData.yourName}
                      onChange={handleChange}
                      placeholder="Your full name"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-body">
                      Your email <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="email"
                      name="yourEmail"
                      value={formData.yourEmail}
                      onChange={handleChange}
                      placeholder="you@email.com"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-body">
                      Your phone
                    </label>
                    <input
                      type="tel"
                      name="yourPhone"
                      value={formData.yourPhone}
                      onChange={handleChange}
                      placeholder="(512) 000-0000"
                      className={inputClass}
                    />
                  </div>
                </div>

                <SectionLabel>Who You&apos;re Referring</SectionLabel>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-body">
                      Their name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      name="theirName"
                      value={formData.theirName}
                      onChange={handleChange}
                      placeholder="Parent or guardian's full name"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-body">
                      Their email <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="email"
                      name="theirEmail"
                      value={formData.theirEmail}
                      onChange={handleChange}
                      placeholder="their@email.com"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-body">
                      Their phone
                    </label>
                    <input
                      type="tel"
                      name="theirPhone"
                      value={formData.theirPhone}
                      onChange={handleChange}
                      placeholder="(512) 000-0000"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-body">
                      Child&apos;s age
                    </label>
                    <select
                      name="childAge"
                      value={formData.childAge}
                      onChange={handleChange}
                      className={`${inputClass} cursor-pointer`}
                    >
                      <option value="">Select age (optional)</option>
                      {[4, 5, 6, 7, 8, 9, 10, 11].map((age) => (
                        <option key={age} value={age}>
                          {age} years old
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <SectionLabel>Anything else?</SectionLabel>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Why do you think they'd be a great fit? (optional)"
                  className={`${inputClass} resize-none`}
                />

                {submitError && (
                  <p className="mt-3 text-sm text-red-500 font-body text-center">
                    {submitError}
                  </p>
                )}

                <div className="mt-6 space-y-3">
                  <p className="text-xs text-gray-400 font-body leading-relaxed text-center">
                    By submitting, you confirm you have the referred
                    family&apos;s permission to share their contact info with
                    Sage Field.
                  </p>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!isFormValid || submitting}
                    className="w-full px-6 py-4 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-all duration-200 font-body cursor-pointer shadow-md hover:shadow-lg text-base disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                  >
                    {submitting ? "Submitting…" : "Submit Referral →"}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-12 px-4 sm:py-20 sm:px-8 lg:px-16 bg-white">
        <div className="max-w-3xl mx-auto">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-block px-5 py-2 bg-sage-50 border border-sage-200 text-sage-700 text-sm font-semibold rounded-full mb-4 font-body">
              Common Questions
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold font-heading text-gray-800 mb-3">
              Before You Refer
            </h2>
            <p className="text-gray-500 font-body">
              Everything families ask about the referral program.
            </p>
          </motion.div>

          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.06 }}
                className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100"
              >
                <button
                  onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left cursor-pointer focus:outline-none"
                >
                  <span className="text-sm font-semibold text-gray-800 font-body pr-4">
                    {faq.q}
                  </span>
                  <motion.span
                    animate={{ rotate: faqOpen === i ? 180 : 0 }}
                    transition={{ duration: 0.25 }}
                    className="flex-shrink-0"
                  >
                    <ChevronDown className="w-4 h-4 text-primary" />
                  </motion.span>
                </button>
                <AnimatePresence>
                  {faqOpen === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.28, ease: "easeInOut" as const }}
                      className="overflow-hidden"
                    >
                      <p className="px-5 pb-5 text-sm text-gray-600 font-body leading-relaxed">
                        {faq.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="py-12 px-4 sm:py-20 sm:px-8 lg:px-16 bg-sage-50">
        <div className="max-w-2xl mx-auto">
          <motion.div
            className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-gray-100 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-block px-5 py-1.5 bg-badge-bg text-black text-sm font-semibold rounded-full mb-4 font-body">
              Referral Program
            </span>
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-gray-800 mb-3">
              Ready to share something special?
            </h2>
            <p className="text-gray-500 font-body mb-8 leading-relaxed">
              Your referral could change a child&apos;s educational journey —
              and put $250 in both your pockets. No limit on referrals.
            </p>
            <button
              onClick={scrollToForm}
              className="px-10 py-4 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-all duration-200 shadow-md hover:shadow-lg font-body text-base cursor-pointer"
            >
              Refer a Family →
            </button>
            <p className="text-xs text-gray-400 font-body mt-4">
              $250 gift card for each family · sent within 5–7 days of
              enrollment payment
            </p>
          </motion.div>
        </div>
      </section>

      <WeekRecapPreview className="bg-welcome-bg" />

      <Footer />

      {/* ── Mobile sticky bottom bar ── */}
      <motion.div
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 pt-2"
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.4, ease: "easeOut" as const }}
      >
        <div className="bg-primary rounded-2xl shadow-xl flex items-center justify-between px-5 py-3 gap-3">
          <div>
            <p className="text-white font-heading font-bold text-sm leading-tight">
              Referral Program · $250 Each
            </p>
            <p className="text-white/80 font-body text-xs">
              Refer a family, both get rewarded
            </p>
          </div>
          <button
            onClick={scrollToForm}
            className="flex-shrink-0 bg-white text-primary font-semibold text-sm font-body px-4 py-2 rounded-xl hover:bg-welcome-bg transition-colors duration-200 cursor-pointer"
          >
            Refer Now →
          </button>
        </div>
      </motion.div>

      <div className="hidden lg:block">
        <FloatingSMSButton />
      </div>
    </div>
  );
}
