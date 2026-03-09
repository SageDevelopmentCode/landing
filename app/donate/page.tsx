"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  Heart,
  TreePine,
  Users,
  X,
  Loader2,
  Sprout,
  Bird,
  Waves,
  Fence,
  ChefHat,
  Hammer,
} from "lucide-react";
import { useState } from "react";
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
      "With your support, we can expand our capacity to serve more families and build a thriving private microschool community in Central Texas.",
  },
];

const PIE_SEGMENTS = [
  { label: "Garden Beds", amount: 2000, color: "#BAFFC9" },
  { label: "Chicken Coop", amount: 2000, color: "#FFFFBA" },
  { label: "Pond & Aquatic", amount: 1500, color: "#BAE1FF" },
  { label: "Farm Infrastructure", amount: 1500, color: "#E0BBE4" },
  { label: "Mud Kitchen", amount: 700, color: "#FFB3BA" },
  { label: "Misc. Improvements", amount: 2300, color: "#f29a8f" },
];
const TOTAL = 10000;
const amountRaised = 0;

const propertyAreas = [
  {
    icon: Sprout,
    title: "Raised Garden Beds",
    description:
      "Children will plant, tend, and harvest their own vegetables and herbs — learning nutrition and life cycles hands-on.",
    amount: "$2,000",
    color: "#BAFFC9",
  },
  {
    icon: Bird,
    title: "Chicken Coop",
    description:
      "A small flock of chickens gives children daily responsibility, empathy, and a connection to where food comes from.",
    amount: "$2,000",
    color: "#FFFFBA",
  },
  {
    icon: Waves,
    title: "Pond & Aquatic Area",
    description:
      "A small pond with native plants and aquatic life creates a living science lab right in our backyard.",
    amount: "$1,500",
    color: "#BAE1FF",
  },
  {
    icon: Fence,
    title: "Farm Infrastructure",
    description:
      "Fencing, pathways, and safety structures to make the entire farm property safe and fully accessible.",
    amount: "$1,500",
    color: "#E0BBE4",
  },
  {
    icon: ChefHat,
    title: "Mud Kitchen",
    description:
      "An outdoor mud kitchen sparks imaginative play and sensory exploration — a Montessori staple in nature education.",
    amount: "$700",
    color: "#FFB3BA",
  },
  {
    icon: Hammer,
    title: "Misc. Improvements",
    description:
      "Shade structures, tool storage, signage, and finishing touches to make the space fully functional and beautiful.",
    amount: "$2,300",
    color: "#f29a8f",
  },
];

const PIE_RADIUS = 80;
const PIE_CIRC = 2 * Math.PI * PIE_RADIUS;

const PIE_SLICES = (() => {
  let cumulative = 0;
  return PIE_SEGMENTS.map((seg) => {
    const pct = seg.amount / TOTAL;
    const dashLen = pct * PIE_CIRC;
    const offset = PIE_CIRC - cumulative - PIE_CIRC / 4;
    cumulative += dashLen;
    return { ...seg, pct, dashLen, offset };
  });
})();

const PRESET_AMOUNTS = [25, 50, 100, 250];

function DonationModal({ onClose }: { onClose: () => void }) {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(50);
  const [customAmount, setCustomAmount] = useState("");
  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [message, setMessage] = useState("");
  const [coverFees, setCoverFees] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const baseAmountDollars = selectedAmount ?? (parseFloat(customAmount) || 0);
  const baseAmountCents = Math.round(baseAmountDollars * 100);
  const feeAmountCents = coverFees
    ? Math.round((baseAmountCents + 30) / (1 - 0.029)) - baseAmountCents
    : 0;
  const totalCents = baseAmountCents + feeAmountCents;

  function formatCents(cents: number) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  }

  async function handleDonate() {
    setError("");

    if (baseAmountCents < 100) {
      setError("Minimum donation is $1.00");
      return;
    }
    if (!donorEmail) {
      setError("Email is required");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: baseAmountCents,
          donorName: donorName || undefined,
          donorEmail,
          message: message || undefined,
          coverFees,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }

      window.location.href = data.url;
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-badge-bg flex items-center justify-center">
              <Heart className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl font-bold font-heading text-black">
              Make a Donation
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Preset amounts */}
          <div>
            <label className="block text-sm font-semibold text-black font-body mb-2">
              Select Amount
            </label>
            <div className="grid grid-cols-4 gap-2 mb-3">
              {PRESET_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  onClick={() => {
                    setSelectedAmount(amt);
                    setCustomAmount("");
                  }}
                  className={`py-2.5 rounded-lg text-sm font-semibold font-body transition-colors border ${
                    selectedAmount === amt
                      ? "bg-primary text-white border-primary"
                      : "bg-white text-black border-gray-200 hover:border-primary hover:text-primary"
                  }`}
                >
                  ${amt}
                </button>
              ))}
            </div>
            <input
              type="number"
              min="1"
              placeholder="Custom amount"
              value={customAmount}
              onChange={(e) => {
                setCustomAmount(e.target.value);
                setSelectedAmount(null);
              }}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-body text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary placeholder:text-gray-400"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-black font-body mb-1.5">
              Email <span className="text-primary">*</span>
            </label>
            <input
              type="email"
              placeholder="your@email.com"
              value={donorEmail}
              onChange={(e) => setDonorEmail(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-body text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary placeholder:text-gray-400"
            />
          </div>

          {/* Name (optional) */}
          <div>
            <label className="block text-sm font-semibold text-black font-body mb-1.5">
              Name{" "}
              <span className="text-text-gray font-normal">(optional)</span>
            </label>
            <input
              type="text"
              placeholder="Your name"
              value={donorName}
              onChange={(e) => setDonorName(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-body text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary placeholder:text-gray-400"
            />
          </div>

          {/* Message (optional) */}
          <div>
            <label className="block text-sm font-semibold text-black font-body mb-1.5">
              Message{" "}
              <span className="text-text-gray font-normal">(optional)</span>
            </label>
            <textarea
              placeholder="Leave a note of encouragement..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              maxLength={500}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-body text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none placeholder:text-gray-400"
            />
          </div>

          {/* Cover fees */}
          {baseAmountCents >= 100 && (
            <label className="flex items-start gap-3 cursor-pointer p-3 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                checked={coverFees}
                onChange={(e) => setCoverFees(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-primary"
              />
              <span className="text-sm text-text-gray font-body leading-snug">
                Cover transaction fees ({formatCents(feeAmountCents)}) so 100%
                of your donation goes to Sage Field
              </span>
            </label>
          )}

          {/* Error */}
          {error && <p className="text-sm text-red-500 font-body">{error}</p>}

          {/* Total + CTA */}
          <div className="pt-1">
            {totalCents >= 100 && (
              <p className="text-center text-sm text-text-gray font-body mb-3">
                Total:{" "}
                <span className="font-semibold text-black">
                  {formatCents(totalCents)}
                </span>
              </p>
            )}
            <button
              onClick={handleDonate}
              disabled={loading || baseAmountCents < 100}
              className="w-full py-3.5 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-colors duration-200 shadow-md hover:shadow-lg font-body disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Redirecting to Stripe...
                </>
              ) : (
                "Donate Now"
              )}
            </button>
            <p className="text-xs text-center text-text-gray font-body mt-2">
              Secure payment powered by Stripe
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function DonatePage() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="min-h-screen bg-welcome-bg">
      <Navbar />

      <AnimatePresence>
        {showModal && <DonationModal onClose={() => setShowModal(false)} />}
      </AnimatePresence>

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
            Sage Field Private School is a community-built dream. We&apos;re
            raising funds to secure and transform our property in Central Texas
            into a thriving outdoor learning environment for children. Every
            contribution, big or small, brings us one step closer to opening our
            doors.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
          >
            <button
              onClick={() => setShowModal(true)}
              className="cursor-pointer px-8 py-4 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-colors duration-200 shadow-md hover:shadow-lg font-body"
            >
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

      {/* 3. Farm Vision Text */}
      <section className="bg-welcome-bg py-16 px-8 sm:px-12 lg:px-16">
        <div className="max-w-3xl mx-auto w-full text-center">
          <motion.div
            className="flex justify-center mb-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <span className="inline-block px-6 py-2 bg-badge-bg text-black text-sm font-semibold rounded-full">
              OUR VISION
            </span>
          </motion.div>

          <motion.h2
            className="text-4xl md:text-5xl font-bold text-black font-heading mb-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          >
            Developing Our Farm Property
          </motion.h2>

          <motion.p
            className="text-base md:text-lg text-text-gray leading-relaxed font-body mb-5"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          >
            At Sage Field, we believe that children learn best when they are
            connected to the living world. Our farm property will become an
            extension of the classroom — a place where kids can dig, plant, care
            for animals, and discover the rhythms of nature through direct,
            unhurried experience.
          </motion.p>

          <motion.p
            className="text-base md:text-lg text-text-gray leading-relaxed font-body"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
          >
            From raised garden beds to a chicken coop and an aquatic pond, every
            element of our farm is designed to spark curiosity, build
            responsibility, and cultivate a deep love for the natural world.
            Your donation helps us transform this vision from a dream into a
            thriving, daily reality for the children of Sage Field.
          </motion.p>
        </div>
      </section>

      {/* 4. Property Areas */}
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
              WHAT WE&apos;RE BUILDING
            </span>
          </motion.div>

          <motion.h2
            className="text-4xl md:text-5xl font-bold text-black font-heading text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          >
            Six Areas of the Farm
          </motion.h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {propertyAreas.map((area, index) => {
              const Icon = area.icon;
              return (
                <motion.div
                  key={area.title}
                  className="bg-white rounded-xl shadow-md p-8 flex flex-col items-start border border-gray-100"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{
                    duration: 0.6,
                    delay: index * 0.1,
                    ease: "easeOut",
                  }}
                >
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center mb-5"
                    style={{ backgroundColor: area.color }}
                  >
                    <Icon className="w-7 h-7 text-black/70" />
                  </div>
                  <h3 className="text-xl font-bold font-heading text-black mb-3">
                    {area.title}
                  </h3>
                  <p className="text-base text-text-gray leading-relaxed font-body mb-5 flex-1">
                    {area.description}
                  </p>
                  <span className="inline-block px-4 py-1.5 bg-badge-bg text-black text-sm font-semibold rounded-full">
                    {area.amount}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. Fundraising Goal + Pie Chart */}
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
              FUNDRAISING GOAL
            </span>
          </motion.div>

          <motion.h2
            className="text-4xl md:text-5xl font-bold text-black font-heading text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          >
            How Your Donations Are Used
          </motion.h2>

          <motion.div
            className="flex flex-col lg:flex-row gap-12 items-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          >
            {/* SVG Donut Chart */}
            <div className="flex-shrink-0">
              <svg width={220} height={220}>
                {/* Background ring */}
                <circle
                  cx={110}
                  cy={110}
                  r={PIE_RADIUS}
                  fill="none"
                  stroke="#f0e8e0"
                  strokeWidth={30}
                />
                {/* Colored segments */}
                {PIE_SLICES.map((slice, i) => (
                  <motion.circle
                    key={slice.label}
                    cx={110}
                    cy={110}
                    r={PIE_RADIUS}
                    fill="none"
                    stroke={slice.color}
                    strokeWidth={30}
                    strokeDasharray={`${slice.dashLen} ${PIE_CIRC}`}
                    strokeDashoffset={slice.offset}
                    initial={{ strokeDasharray: `0 ${PIE_CIRC}` }}
                    animate={{
                      strokeDasharray: `${slice.dashLen} ${PIE_CIRC}`,
                    }}
                    transition={{
                      duration: 0.6,
                      delay: i * 0.08,
                      ease: "easeOut",
                    }}
                  />
                ))}
                {/* Center hole */}
                <circle cx={110} cy={110} r={50} fill="white" />
                <text
                  x={110}
                  y={106}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="600"
                  fill="#333333"
                  fontFamily="sans-serif"
                >
                  GOAL
                </text>
                <text
                  x={110}
                  y={122}
                  textAnchor="middle"
                  fontSize="13"
                  fontWeight="700"
                  fill="#333333"
                  fontFamily="sans-serif"
                >
                  $10,000
                </text>
              </svg>
            </div>

            {/* Legend + Progress */}
            <div className="flex-1 w-full">
              {/* Legend */}
              <div className="space-y-3 mb-8">
                {PIE_SEGMENTS.map((seg) => (
                  <div
                    key={seg.label}
                    className="flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-sm flex-shrink-0"
                        style={{ backgroundColor: seg.color }}
                      />
                      <span className="text-sm font-body text-text-gray">
                        {seg.label}
                      </span>
                    </div>
                    <span className="text-sm font-semibold font-body text-black">
                      ${seg.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
                <div className="flex items-center justify-between gap-4 pt-3 border-t border-gray-200">
                  <span className="text-sm font-semibold font-body text-black">
                    Total Goal
                  </span>
                  <span className="text-sm font-bold font-body text-black">
                    ${TOTAL.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-semibold font-body text-black">
                    Amount Raised
                  </span>
                  <span className="text-sm font-semibold font-body text-black">
                    ${amountRaised.toLocaleString()} / ${TOTAL.toLocaleString()}
                  </span>
                </div>
                <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-primary rounded-full"
                    initial={{ width: "0%" }}
                    whileInView={{ width: `${(amountRaised / TOTAL) * 100}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.2, ease: "easeOut", delay: 0.4 }}
                  />
                </div>
                <p className="text-sm text-text-gray font-body mt-2">
                  Every contribution brings us closer — be the first to give!
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 6. Donor Community */}
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
              OUR COMMUNITY
            </span>
          </motion.div>

          <motion.h2
            className="text-4xl md:text-5xl font-bold text-black font-heading text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          >
            Families &amp; Friends Who Believe In Us
          </motion.h2>

          <motion.div
            className="flex flex-col items-center justify-center text-center py-16 px-8 bg-badge-bg rounded-2xl border border-dashed border-primary/30"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          >
            <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mb-5 shadow-sm">
              <Heart className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold font-heading text-black mb-3">
              Be the First to Give
            </h3>
            <p className="text-base text-text-gray font-body max-w-md leading-relaxed">
              Your name — or your business — could be right here. Every donor
              who helps bring Sage Field to life will be celebrated in this
              space. Make your contribution and join our founding community.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-8 px-8 py-3.5 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-colors duration-200 shadow-md hover:shadow-lg font-body"
            >
              Donate Now
            </button>
          </motion.div>
        </div>
      </section>

      {/* 7. Why Donate Section — renumbered from 3 */}
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
            <button
              onClick={() => setShowModal(true)}
              className="px-8 py-4 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-colors duration-200 shadow-md hover:shadow-lg font-body"
            >
              Donate Now
            </button>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
