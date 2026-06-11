"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gift, Coffee, Check, Copy, X, ChevronRight } from "lucide-react";
import { submitTestimonial } from "@/app/actions/submitTestimonial";
import type { RewardsReferral } from "./page";

interface Props {
  referrals: RewardsReferral[];
  hasSubmittedTestimonial: boolean;
  userId: string;
  studentFirstName: string;
}

export default function RewardsClient({
  referrals,
  hasSubmittedTestimonial,
  userId,
  studentFirstName,
}: Props) {
  const [referralPopupOpen, setReferralPopupOpen] = useState(false);
  const [testimonialOpen, setTestimonialOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [testimonialText, setTestimonialText] = useState("");
  const [testimonialSubmitting, setTestimonialSubmitting] = useState(false);
  const [testimonialSubmitted, setTestimonialSubmitted] = useState(hasSubmittedTestimonial);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 1024);
  }, []);

  const refCode = userId.replace(/-/g, "").slice(0, 8).toUpperCase();
  const referralLink = `https://sagefield.co/apply?ref=${refCode}`;
  const referralCount = referrals.length;
  const enrolledCount = referrals.filter(
    (r) => r.status === "enrolled" || r.status === "rewarded"
  ).length;
  const earnedDollars = referrals.filter((r) => r.status === "rewarded").length * 500;

  function copyReferralLink() {
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  async function handleSubmitTestimonial() {
    if (!testimonialText.trim() || testimonialSubmitting) return;
    setTestimonialSubmitting(true);
    const res = await submitTestimonial({
      testimonial: testimonialText.trim(),
      childName: studentFirstName,
    });
    setTestimonialSubmitting(false);
    if (res.success) setTestimonialSubmitted(true);
  }

  return (
    <>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold font-heading text-gray-800">Rewards</h1>
        <p className="text-sm font-body text-gray-500 -mt-2">
          Earn rewards by referring families and sharing your experience.
        </p>

        {/* Refer a Family card */}
        <section
          className="rounded-2xl p-5 shadow-sm border border-[#c2ddc8]"
          style={{ background: "linear-gradient(135deg, #eef5ef 0%, #ddeede 100%)" }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-7 h-7 rounded-full bg-[#4a7c59]/15 flex items-center justify-center shrink-0">
                  <Gift className="w-3.5 h-3.5 text-[#4a7c59]" strokeWidth={1.5} />
                </div>
                <h2 className="text-sm font-heading font-semibold text-gray-800">
                  Refer a Family
                </h2>
                <span className="bg-[#4a7c59] text-white text-xs font-body px-2 py-0.5 rounded-full font-medium">
                  $500 gift card
                </span>
              </div>
              <p className="text-xs font-body text-gray-600 leading-relaxed">
                Share your referral link — earn a $500 gift card when a family enrolls.
              </p>

              {/* Mini stats */}
              <div className="grid grid-cols-3 gap-2 mt-3 max-w-[240px]">
                {[
                  { value: String(referralCount), label: "Referred" },
                  { value: String(enrolledCount), label: "Enrolled" },
                  { value: `$${earnedDollars}`, label: "Earned" },
                ].map(({ value, label }) => (
                  <div
                    key={label}
                    className="text-center bg-white/70 rounded-xl py-2 px-1 border border-[#c2ddc8]"
                  >
                    <p className="text-sm font-semibold font-heading text-gray-800">{value}</p>
                    <p className="text-[10px] font-body text-gray-500">{label}</p>
                  </div>
                ))}
              </div>

              <div className="mt-2 text-[10px] font-body text-gray-400 truncate">
                {referralLink}
              </div>
            </div>

            <button
              onClick={() => setReferralPopupOpen(true)}
              className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold font-body bg-[#4a7c59] text-white hover:bg-[#3d6b4a] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              View Details
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </section>

        {/* Share Your Experience card */}
        <section
          className="rounded-2xl p-5 shadow-sm border border-[#d6c9b8]"
          style={{ background: "linear-gradient(135deg, #fdf8f3 0%, #f5ede0 100%)" }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-7 h-7 rounded-full bg-[#a0784a]/15 flex items-center justify-center shrink-0">
                  <Coffee className="w-3.5 h-3.5 text-[#a0784a]" strokeWidth={1.5} />
                </div>
                <h2 className="text-sm font-heading font-semibold text-gray-800">
                  Share Your Experience
                </h2>
                <span className="bg-[#a0784a] text-white text-xs font-body px-2 py-0.5 rounded-full font-medium">
                  $15 Starbucks
                </span>
              </div>
              <p className="text-xs font-body text-gray-600 leading-relaxed">
                Share a short testimonial and we&apos;ll send you a $15 Starbucks gift card — coffee on us.
              </p>
            </div>

            {testimonialSubmitted ? (
              <div className="flex items-center gap-1.5 text-sm font-body text-[#a0784a] font-medium shrink-0">
                <Check className="w-4 h-4" />
                Submitted
              </div>
            ) : (
              <button
                onClick={() => setTestimonialOpen(true)}
                className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold font-body bg-[#a0784a] text-white hover:bg-[#8a6640] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                View Details
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </section>
      </div>

      {/* Referral Popup */}
      <AnimatePresence>
        {referralPopupOpen &&
          (isMobile ? (
            <>
              <motion.div
                className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setReferralPopupOpen(false)}
              />
              <motion.div
                className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl overflow-hidden"
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", stiffness: 280, damping: 30 }}
              >
                <div className="w-10 h-1 rounded-full bg-gray-200 mx-auto mt-3" />
                <div className="relative h-36 w-full overflow-hidden mt-3">
                  <img
                    src="/assets/Kid1.png"
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                </div>
                <div className="p-6 pb-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-[#4a7c59]/10 flex items-center justify-center flex-shrink-0">
                      <Gift className="w-5 h-5 text-[#4a7c59]" strokeWidth={1.5} />
                    </div>
                    <h2 className="text-lg font-heading font-semibold text-gray-900">
                      Refer a Family
                    </h2>
                    <span className="bg-[#4a7c59] text-white text-xs font-body px-2.5 py-1 rounded-full font-medium">
                      $500 gift card
                    </span>
                  </div>
                  <p className="text-sm font-body text-gray-600 leading-relaxed mb-6">
                    Know a family who&apos;d be a great fit for Sage Field? Share your link
                    — when they enroll and pay their registration fee, you&apos;ll receive a{" "}
                    <strong className="text-gray-800">$500 gift card</strong> of your choice.
                    If sharing the link isn&apos;t convenient, just let them know to{" "}
                    <strong className="text-gray-800">mention your name when they apply!</strong>
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 min-w-0 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5">
                      <p className="text-sm font-body text-gray-500 truncate">{referralLink}</p>
                    </div>
                    <button
                      onClick={copyReferralLink}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold font-body transition-colors whitespace-nowrap cursor-pointer ${
                        copied
                          ? "bg-green-600 text-white"
                          : "bg-[#4a7c59] text-white hover:bg-[#3d6b4a]"
                      }`}
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copy link
                        </>
                      )}
                    </button>
                  </div>
                  <button
                    onClick={() => setReferralPopupOpen(false)}
                    className="mt-5 w-full text-center text-xs font-body text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                  >
                    Maybe later
                  </button>
                </div>
              </motion.div>
            </>
          ) : (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setReferralPopupOpen(false)}
            >
              <motion.div
                className="relative w-full max-w-lg rounded-2xl shadow-2xl bg-white overflow-hidden"
                initial={{ opacity: 0, scale: 0.92, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 8 }}
                transition={{ type: "spring", damping: 26, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="relative h-40 w-full overflow-hidden">
                  <img
                    src="/assets/Kid1.png"
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                </div>
                <button
                  onClick={() => setReferralPopupOpen(false)}
                  className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-[#4a7c59]/10 flex items-center justify-center flex-shrink-0">
                      <Gift className="w-5 h-5 text-[#4a7c59]" strokeWidth={1.5} />
                    </div>
                    <h2 className="text-lg font-heading font-semibold text-gray-900">
                      Refer a Family
                    </h2>
                    <span className="bg-[#4a7c59] text-white text-xs font-body px-2.5 py-1 rounded-full font-medium">
                      $500 gift card
                    </span>
                  </div>
                  <p className="text-sm font-body text-gray-600 leading-relaxed mb-6">
                    Know a family who&apos;d be a great fit for Sage Field? Share your link
                    — when they enroll and pay their registration fee, you&apos;ll receive a{" "}
                    <strong className="text-gray-800">$500 gift card</strong> of your choice.
                    If sharing the link isn&apos;t convenient, just let them know to{" "}
                    <strong className="text-gray-800">mention your name when they apply!</strong>
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 min-w-0 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5">
                      <p className="text-sm font-body text-gray-500 truncate">{referralLink}</p>
                    </div>
                    <button
                      onClick={copyReferralLink}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold font-body transition-colors whitespace-nowrap cursor-pointer ${
                        copied
                          ? "bg-green-600 text-white"
                          : "bg-[#4a7c59] text-white hover:bg-[#3d6b4a]"
                      }`}
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copy link
                        </>
                      )}
                    </button>
                  </div>
                  <button
                    onClick={() => setReferralPopupOpen(false)}
                    className="mt-5 w-full text-center text-xs font-body text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                  >
                    Maybe later
                  </button>
                </div>
              </motion.div>
            </motion.div>
          ))}
      </AnimatePresence>

      {/* Testimonial Popup */}
      <AnimatePresence>
        {testimonialOpen &&
          (isMobile ? (
            <>
              <motion.div
                className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => !testimonialSubmitting && setTestimonialOpen(false)}
              />
              <motion.div
                className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl overflow-hidden"
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", stiffness: 280, damping: 30 }}
              >
                <div className="w-10 h-1 rounded-full bg-gray-200 mx-auto mt-3" />
                <div className="p-6 pb-10">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="w-10 h-10 rounded-full bg-[#a0784a]/10 flex items-center justify-center shrink-0">
                      <Coffee className="w-5 h-5 text-[#a0784a]" strokeWidth={1.5} />
                    </div>
                    <div>
                      <h2 className="text-lg font-heading font-semibold text-gray-900 leading-tight">
                        Share Your Experience
                      </h2>
                      <p className="text-xs font-body text-[#a0784a] font-medium">
                        $15 Starbucks gift card — coffee on us
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-body text-gray-500 leading-relaxed mt-4 mb-4">
                    A few honest sentences from the heart is more than enough. Here are some
                    prompts to get you started:
                  </p>
                  <ul className="space-y-1.5 mb-5">
                    {[
                      `What has ${studentFirstName} enjoyed most at Sage Field?`,
                      "How has the program impacted your family?",
                      "Is there a moment or experience that stood out?",
                      "Would you recommend Sage Field to another family?",
                    ].map((prompt) => (
                      <li
                        key={prompt}
                        className="flex items-start gap-2 text-xs font-body text-gray-500"
                      >
                        <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-[#a0784a]/50 shrink-0" />
                        {prompt}
                      </li>
                    ))}
                  </ul>
                  {testimonialSubmitted ? (
                    <div className="flex flex-col items-center gap-2 py-6">
                      <div className="w-12 h-12 rounded-full bg-[#a0784a]/10 flex items-center justify-center">
                        <Check className="w-6 h-6 text-[#a0784a]" />
                      </div>
                      <p className="text-sm font-body font-medium text-gray-800">Thank you so much!</p>
                      <p className="text-xs font-body text-gray-500 text-center">
                        We&apos;ll be in touch about your gift card soon.
                      </p>
                      <button
                        onClick={() => setTestimonialOpen(false)}
                        className="mt-3 text-xs font-body text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  ) : (
                    <>
                      <textarea
                        value={testimonialText}
                        onChange={(e) => setTestimonialText(e.target.value)}
                        placeholder="Share your experience here…"
                        rows={4}
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-body text-gray-800 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-[#a0784a]/30 focus:border-[#a0784a]/50 transition"
                      />
                      <button
                        onClick={handleSubmitTestimonial}
                        disabled={!testimonialText.trim() || testimonialSubmitting}
                        className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold font-body bg-[#a0784a] text-white hover:bg-[#8a6640] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Coffee className="w-4 h-4" />
                        {testimonialSubmitting ? "Submitting…" : "Submit testimonial"}
                      </button>
                      <button
                        onClick={() => setTestimonialOpen(false)}
                        className="mt-4 w-full text-center text-xs font-body text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                      >
                        Maybe later
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            </>
          ) : (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => !testimonialSubmitting && setTestimonialOpen(false)}
            >
              <motion.div
                className="relative w-full max-w-lg rounded-2xl shadow-2xl bg-white overflow-hidden"
                initial={{ opacity: 0, scale: 0.92, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 8 }}
                transition={{ type: "spring", damping: 26, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => !testimonialSubmitting && setTestimonialOpen(false)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer z-10"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="w-10 h-10 rounded-full bg-[#a0784a]/10 flex items-center justify-center shrink-0">
                      <Coffee className="w-5 h-5 text-[#a0784a]" strokeWidth={1.5} />
                    </div>
                    <div>
                      <h2 className="text-lg font-heading font-semibold text-gray-900 leading-tight">
                        Share Your Experience
                      </h2>
                      <p className="text-xs font-body text-[#a0784a] font-medium">
                        $15 Starbucks gift card — coffee on us
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-body text-gray-500 leading-relaxed mt-4 mb-3">
                    A few honest sentences from the heart is more than enough. Here are some
                    prompts to get you started:
                  </p>
                  <ul className="space-y-1.5 mb-5">
                    {[
                      `What has ${studentFirstName} enjoyed most at Sage Field?`,
                      "How has the program impacted your family?",
                      "Is there a moment or experience that stood out?",
                      "Would you recommend Sage Field to another family?",
                    ].map((prompt) => (
                      <li
                        key={prompt}
                        className="flex items-start gap-2 text-xs font-body text-gray-500"
                      >
                        <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-[#a0784a]/50 shrink-0" />
                        {prompt}
                      </li>
                    ))}
                  </ul>
                  {testimonialSubmitted ? (
                    <div className="flex flex-col items-center gap-2 py-4">
                      <div className="w-12 h-12 rounded-full bg-[#a0784a]/10 flex items-center justify-center">
                        <Check className="w-6 h-6 text-[#a0784a]" />
                      </div>
                      <p className="text-sm font-body font-medium text-gray-800">Thank you so much!</p>
                      <p className="text-xs font-body text-gray-500 text-center">
                        We&apos;ll be in touch about your gift card soon.
                      </p>
                      <button
                        onClick={() => setTestimonialOpen(false)}
                        className="mt-3 text-xs font-body text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                      >
                        Close
                      </button>
                    </div>
                  ) : (
                    <>
                      <textarea
                        value={testimonialText}
                        onChange={(e) => setTestimonialText(e.target.value)}
                        placeholder="Share your experience here…"
                        rows={4}
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-body text-gray-800 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-[#a0784a]/30 focus:border-[#a0784a]/50 transition"
                      />
                      <button
                        onClick={handleSubmitTestimonial}
                        disabled={!testimonialText.trim() || testimonialSubmitting}
                        className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold font-body bg-[#a0784a] text-white hover:bg-[#8a6640] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Coffee className="w-4 h-4" />
                        {testimonialSubmitting ? "Submitting…" : "Submit testimonial"}
                      </button>
                      <button
                        onClick={() => setTestimonialOpen(false)}
                        className="mt-4 w-full text-center text-xs font-body text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                      >
                        Maybe later
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            </motion.div>
          ))}
      </AnimatePresence>
    </>
  );
}
