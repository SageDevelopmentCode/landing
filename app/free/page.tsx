"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Check, CheckCircle, PenLine, X } from "lucide-react";
import { Dancing_Script } from "next/font/google";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import FloatingSMSButton from "../components/FloatingSMSButton";
import { formatPhone } from "../utils/formatPhone";

const dancingScript = Dancing_Script({
  subsets: ["latin"],
  variable: "--font-dancing-script",
});

type Track = "enrolled" | "new";

const WEEK1_PREVIEW_IMAGES = [
  "/assets/highlights/summer_week_one/C8EAD2FA-0FB2-4D59-A079-493C09298ABF.JPG",
  "/assets/highlights/summer_week_one/79C28EF4-D1A6-4874-AA73-CCA66F04BDEF.JPG",
  "/assets/highlights/summer_week_one/2B9964FA-0047-4590-880C-095C315B7DE8.JPG",
  "/assets/highlights/summer_week_one/AB176A40-3DE2-4856-8E87-2D169FB3F41A.JPG",
  "/assets/highlights/summer_week_one/341400BF-486B-43A0-912E-84623B6299D6.JPG",
  "/assets/highlights/summer_week_one/DDDA3AA2-CDF9-42CF-B8FF-AD61CED60065 2.JPG",
  "/assets/highlights/summer_week_one/1D2BF4A6-5081-4D51-B1E8-F6E0E3D820B3.JPG",
  "/assets/highlights/summer_week_one/B10368B0-5344-4D70-8C0C-C091A086D6B2.JPG",
];

const WEEK1_EARLY_HIGHLIGHTS = [
  { emoji: "📖", label: "Letter Sounds & CVC Reading", desc: "Building phonics foundations through hands-on practice" },
  { emoji: "✏️", label: "Handwriting & Number Sense", desc: "Fine motor skills and early numeracy side by side" },
  { emoji: "➕", label: "Early Addition", desc: "Introducing addition concepts through play and manipulatives" },
  { emoji: "💧", label: "Water Cycle & Filtration", desc: "Science exploration that sparked curiosity all week" },
  { emoji: "🎨", label: "Art Creation", desc: "Self-expression through color, texture, and imagination" },
  { emoji: "🐥", label: "Caring for Our Chicks", desc: "Responsibility and empathy through animal care" },
  { emoji: "🎵", label: "Rhythm & Note Recognition", desc: "Music foundations woven into every morning" },
];

const WEEK1_ELEM_HIGHLIGHTS = [
  { emoji: "🔢", label: "Place Value Mastery", desc: "Expanded, word, and model forms — plus comparing numbers" },
  { emoji: "🎲", label: "Collaborative Math Game", desc: "Wrapped up the week by applying what we learned together" },
  { emoji: "📚", label: "SWBST Comprehension", desc: "Somebody, Wanted, But, So, Then — a framework for deep reading" },
  { emoji: "✍️", label: "Vocabulary & Sentence Structure", desc: "Building strong writing skills from the ground up" },
  { emoji: "🔄", label: "Synonyms & Antonyms", desc: "Expanding word knowledge through exploration" },
  { emoji: "📝", label: "Recipe Card Writing", desc: "Real experiences turned into structured, creative writing" },
];

const FRIDAY_DETAILS = [
  { icon: "📅", label: "Date", value: "Friday, June 5, 2026" },
  { icon: "🕗", label: "Drop-off", value: "8:15 – 9:00 AM" },
  { icon: "🕒", label: "Pick-up", value: "1:00 PM" },
  { icon: "📍", label: "Location", value: "2760 Gattis School Rd, Round Rock TX" },
  { icon: "👧", label: "Ages", value: "4–11 years" },
  { icon: "💰", label: "Cost", value: "Completely Free" },
];

const PACKING_LIST = [
  { emoji: "🧴", item: "Sunscreen (applied before drop-off)" },
  { emoji: "🩱", item: "Swimsuit + towel" },
  { emoji: "👕", item: "Change of clothes" },
  { emoji: "💧", item: "Water bottle, labeled" },
  { emoji: "🦟", item: "Bug spray" },
  { emoji: "🥪", item: "Snack + lunch from home" },
];

const ACTIVITIES = [
  "Climbing trees, logs, rocks, play structures, and natural features",
  "Running, balancing, jumping, hiking, and exploring uneven terrain",
  "Outdoor games and physical activities",
  "Gardening and nature-based activities",
  "Interaction with insects, wildlife, plants, and natural materials",
  "Cooking and food preparation activities",
  "Use of age-appropriate tools, utensils, and equipment under supervision",
  "Water play activities",
  "Animal interactions",
  "Arts, crafts, building projects, and other hands-on learning experiences",
];

const RISKS = [
  "Slips, trips, falls, and collisions",
  "Cuts, scrapes, bruises, splinters, burns, and minor injuries",
  "Sprains, fractures, and other physical injuries",
  "Exposure to weather conditions including heat, cold, rain, wind, and sun",
  "Exposure to insects, including bees, wasps, mosquitoes, ants, ticks, and chiggers",
  "Contact with plants, soil, mud, and natural environments",
  "Allergic reactions",
  "Risks associated with cooking activities and use of cooking equipment",
  "Risks associated with supervised use of tools and equipment",
  "Risks associated with interactions with animals",
  "Risks arising from participation in active outdoor play and exploration",
];

const inputClass =
  "w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none transition-colors font-body text-gray-900 placeholder:text-gray-500 bg-white";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-6 mb-3 font-body">
      {children}
    </p>
  );
}

function AgreementSectionHeader({ title }: { title: string }) {
  return (
    <h3 className="text-sm font-bold font-heading text-gray-800 pb-2 border-b border-gray-100">
      {title}
    </h3>
  );
}

export default function FreeFridayPage() {
  const [track, setTrack] = useState<Track>("new");
  const [submitted, setSubmitted] = useState(false);
  const [agreementOpen, setAgreementOpen] = useState(false);
  const [agreementSigned, setAgreementSigned] = useState(false);
  const [sigPrintedName, setSigPrintedName] = useState("");
  const [sigValue, setSigValue] = useState("");

  const [formData, setFormData] = useState({
    // Track A
    enrolledParentName: "",
    enrolledChildName: "",
    friendChildName: "",
    friendChildAge: "",
    friendParentName: "",
    friendParentEmail: "",
    friendParentPhone: "",
    trackAEmergencyName: "",
    trackAEmergencyPhone: "",
    trackANotes: "",
    trackAPhotoConsent: false,
    // Track B
    parentName: "",
    email: "",
    phone: "",
    childName: "",
    childAge: "",
    referralSource: "",
    notes: "",
    emergencyName: "",
    emergencyPhone: "",
    consentOutdoor: false,
    consentPhoto: false,
    interestedInEnrollment: false,
  });

  const galleryRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

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
    if (agreementOpen) {
      document.body.style.overflow = "hidden";
      const prefill =
        track === "enrolled" ? formData.friendParentName : formData.parentName;
      if (prefill && !sigPrintedName) setSigPrintedName(prefill);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agreementOpen]);

  const scrollToForm = () =>
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : name.toLowerCase().includes("phone")
          ? formatPhone(value)
          : value,
    }));
  };

  const isFormValidA =
    !!formData.enrolledParentName.trim() &&
    !!formData.enrolledChildName.trim() &&
    !!formData.friendChildName.trim() &&
    !!formData.friendChildAge &&
    !!formData.friendParentName.trim() &&
    !!formData.friendParentEmail.trim();

  const isFormValidB =
    !!formData.parentName.trim() &&
    !!formData.email.trim() &&
    !!formData.childName.trim() &&
    !!formData.childAge &&
    formData.consentOutdoor;

  const isFormValid = track === "enrolled" ? isFormValidA : isFormValidB;

  const handleSaveSignature = () => {
    if (!sigPrintedName.trim() || !sigValue.trim()) return;
    setAgreementSigned(true);
    setAgreementOpen(false);
  };

  const studentName =
    track === "enrolled" ? formData.friendChildName : formData.childName;
  const guardianName =
    track === "enrolled" ? formData.friendParentName : formData.parentName;
  const notesForAgreement =
    track === "enrolled" ? formData.trackANotes : formData.notes;
  const photoConsent =
    track === "enrolled" ? formData.trackAPhotoConsent : formData.consentPhoto;
  const emergencyName =
    track === "enrolled" ? formData.trackAEmergencyName : formData.emergencyName;
  const emergencyPhone =
    track === "enrolled" ? formData.trackAEmergencyPhone : formData.emergencyPhone;

  return (
    <div className="min-h-screen bg-white">
      <Navbar darkStyle={true} />

      {/* Hero — two-column split on sage-50 */}
      <section className="bg-sage-50 pt-20">
        <div className="max-w-6xl mx-auto px-8 sm:px-12 lg:px-16 py-14 lg:py-20 flex flex-col lg:flex-row items-center gap-10 lg:gap-16">

          {/* Left — content */}
          <motion.div
            className="flex-1 text-center lg:text-left"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
          >
            <span className="inline-block px-5 py-1.5 bg-white/80 text-gray-700 text-xs font-semibold rounded-full mb-5 font-body border border-sage-200 shadow-sm">
              Free · This Friday Only · June 5, 2026
            </span>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-heading text-gray-800 leading-tight mb-4">
              Bring a Friend for{" "}
              <span className="text-primary">Free.</span>
            </h1>

            <p className="text-lg text-gray-500 font-body leading-relaxed mb-6 max-w-lg mx-auto lg:mx-0">
              Your child&apos;s friend gets a full day at Sage Field — no cost, no commitment.
              Just a real, joyful Friday of learning, play, and community.
            </p>

            {/* Quick-detail pills */}
            <div className="flex flex-wrap gap-2 justify-center lg:justify-start mb-8">
              {[
                { icon: "📅", text: "Jun 5, 2026" },
                { icon: "🕗", text: "Drop-off 8:15 AM" },
                { icon: "🕒", text: "Pick-up 1:00 PM" },
                { icon: "👧", text: "Ages 4–11" },
                { icon: "💰", text: "Completely Free" },
              ].map((pill) => (
                <span
                  key={pill.text}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/70 border border-sage-200 rounded-full text-xs font-semibold text-gray-700 font-body shadow-sm"
                >
                  {pill.icon} {pill.text}
                </span>
              ))}
            </div>

            <div className="flex flex-row gap-3 justify-center lg:justify-start flex-wrap">
              <button
                onClick={scrollToForm}
                className="whitespace-nowrap px-6 py-3.5 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-colors duration-200 shadow-md hover:shadow-lg font-body cursor-pointer text-sm"
              >
                Reserve Your Free Spot →
              </button>
              <a
                href="#what-we-do"
                className="whitespace-nowrap px-6 py-3.5 border-2 border-sage-300 text-gray-600 font-semibold rounded-lg hover:border-primary hover:text-primary transition-colors duration-200 font-body text-sm"
              >
                See What We Do
              </a>
            </div>
          </motion.div>

          {/* Right — photo mosaic */}
          <motion.div
            className="w-full lg:w-auto lg:flex-1 max-w-sm sm:max-w-md lg:max-w-none"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <div className="grid grid-cols-2 gap-2">
              <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-md">
                <Image
                  src={WEEK1_PREVIEW_IMAGES[1]}
                  alt="Students at Sage Field"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 50vw, 300px"
                  priority
                />
              </div>
              <div className="flex flex-col gap-2">
                <div className="relative aspect-square rounded-2xl overflow-hidden shadow-md">
                  <Image
                    src={WEEK1_PREVIEW_IMAGES[3]}
                    alt="Students at Sage Field"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 50vw, 200px"
                    priority
                  />
                </div>
                <div className="relative aspect-square rounded-2xl overflow-hidden shadow-md">
                  <Image
                    src={WEEK1_PREVIEW_IMAGES[5]}
                    alt="Students at Sage Field"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 50vw, 200px"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Photo strip carousel — full-bleed, flows from sage-50 */}
      <div className="bg-sage-50">
        <div
          ref={galleryRef}
          className="overflow-x-auto flex gap-0 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]"
        >
          {[...WEEK1_PREVIEW_IMAGES, ...WEEK1_PREVIEW_IMAGES].map((src, i) => (
            <div
              key={i}
              className="relative w-72 flex-shrink-0 aspect-[4/3] overflow-hidden"
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

      {/* Week 1 Highlights */}
      <section id="what-we-do" className="py-16 px-8 sm:px-12 lg:px-16 bg-white">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <span className="inline-block px-5 py-1.5 bg-badge-bg text-black text-sm font-semibold rounded-full mb-4 font-body">
              Week 1 Recap
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 font-heading mb-2">
              A Peek at What Kids Do Here
            </h2>
            <p className="text-base text-gray-500 font-body leading-relaxed">
              Students spent the week learning by doing — building foundations in literacy and math,
              exploring science, expressing themselves through art, and growing into a real community
              together. They cooked pizzas, made strawberry ice cream, and were already using Spanish
              in daily conversations by Friday.
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm">🌱</span>
                </div>
                <h4 className="text-sm font-bold font-heading text-gray-800">Early Learners</h4>
              </div>
              <ul className="space-y-1.5">
                {WEEK1_EARLY_HIGHLIGHTS.map((item) => (
                  <li key={item.label} className="flex items-start gap-2">
                    <span className="text-base leading-none mt-0.5 flex-shrink-0">{item.emoji}</span>
                    <div>
                      <p className="text-xs font-bold text-gray-800 font-body leading-tight">{item.label}</p>
                      <p className="text-[11px] text-gray-400 font-body">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-sage-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm">📐</span>
                </div>
                <h4 className="text-sm font-bold font-heading text-gray-800">Elementary</h4>
              </div>
              <ul className="space-y-1.5">
                {WEEK1_ELEM_HIGHLIGHTS.map((item) => (
                  <li key={item.label} className="flex items-start gap-2">
                    <span className="text-base leading-none mt-0.5 flex-shrink-0">{item.emoji}</span>
                    <div>
                      <p className="text-xs font-bold text-gray-800 font-body leading-tight">{item.label}</p>
                      <p className="text-[11px] text-gray-400 font-body">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>

          <div className="flex justify-center mt-7">
            <Link
              href="/highlights/summer/week-1"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-colors duration-200 shadow-md hover:shadow-lg font-body text-sm"
            >
              View Full Week 1 Recap →
            </Link>
          </div>
        </div>
      </section>

      {/* Registration Form */}
      <section id="reserve" className="py-16 px-8 sm:px-12 lg:px-16 bg-sage-50">
        <div ref={formRef} className="max-w-2xl mx-auto">
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-block px-5 py-1.5 bg-primary/10 text-primary text-sm font-semibold rounded-full mb-4 font-body">
              Reserve Your Spot
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 font-heading mb-2">
              Claim Your Free Spot for June 5th
            </h2>
            <p className="text-gray-500 font-body text-base">
              Takes 60 seconds. No payment. No commitment.
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
                  You&apos;re on the list!
                </h3>
                <p className="text-gray-500 font-body mb-2">
                  We&apos;ll see you Friday, June 5th. Check your email for details.
                </p>
                <p className="text-sm text-primary font-semibold font-body mt-4">
                  Bring a water bottle and wear comfortable clothes.
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="sm:bg-white sm:rounded-2xl sm:p-8 sm:shadow-sm sm:border sm:border-gray-100"
              >
                {/* Track Selector */}
                <p className="text-sm font-semibold text-gray-600 font-body mb-4">
                  Who&apos;s signing up?
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <button
                    type="button"
                    onClick={() => setTrack("new")}
                    className={`text-left p-5 rounded-2xl border-2 transition-all duration-200 cursor-pointer ${
                      track === "new"
                        ? "border-primary bg-primary/5 shadow-md "
                        : "border-gray-200 bg-white hover:border-primary/50"
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-sage-100 flex items-center justify-center mb-3">
                      <span className="text-xl">🌱</span>
                    </div>
                    <h3 className="font-heading font-bold text-gray-800 mb-1 text-sm">
                      We&apos;re new to Sage Field
                    </h3>
                    <p className="text-xs text-gray-500 font-body leading-snug">
                      I heard about Friday and want to bring my child to visit.
                    </p>
                    {track === "new" && (
                      <div className="mt-3 flex items-center gap-1.5 text-primary text-xs font-semibold font-body">
                        <CheckCircle className="w-3.5 h-3.5" /> Selected
                      </div>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setTrack("enrolled")}
                    className={`text-left p-5 rounded-2xl border-2 transition-all duration-200 cursor-pointer ${
                      track === "enrolled"
                        ? "border-primary bg-primary/5 shadow-md "
                        : "border-gray-200 bg-white hover:border-primary/50"
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                      <span className="text-xl">🤝</span>
                    </div>
                    <h3 className="font-heading font-bold text-gray-800 mb-1 text-sm">
                      We&apos;re already enrolled
                    </h3>
                    <p className="text-xs text-gray-500 font-body leading-snug">
                      I&apos;m bringing a friend&apos;s child to try Sage Field for free.
                    </p>
                    {track === "enrolled" && (
                      <div className="mt-3 flex items-center gap-1.5 text-primary text-xs font-semibold font-body">
                        <CheckCircle className="w-3.5 h-3.5" /> Selected
                      </div>
                    )}
                  </button>
                </div>

                {/* Form Body */}
                <AnimatePresence mode="wait">
                  {track === "enrolled" && (
                    <motion.div
                      key="track-enrolled"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                    >
                      <SectionLabel>Your Info (Enrolled Family)</SectionLabel>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-body">
                            Your name <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="text"
                            name="enrolledParentName"
                            value={formData.enrolledParentName}
                            onChange={handleChange}
                            placeholder="Your full name"
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-body">
                            Your child&apos;s name at Sage Field <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="text"
                            name="enrolledChildName"
                            value={formData.enrolledChildName}
                            onChange={handleChange}
                            placeholder="So we can match your registration"
                            className={inputClass}
                          />
                        </div>
                      </div>

                      <SectionLabel>Your Friend&apos;s Child</SectionLabel>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-body">
                            Friend&apos;s child name <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="text"
                            name="friendChildName"
                            value={formData.friendChildName}
                            onChange={handleChange}
                            placeholder="Child's first and last name"
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-body">
                            Child&apos;s age <span className="text-red-400">*</span>
                          </label>
                          <select
                            name="friendChildAge"
                            value={formData.friendChildAge}
                            onChange={handleChange}
                            className={`${inputClass} cursor-pointer`}
                          >
                            <option value="">Select age</option>
                            {[4, 5, 6, 7, 8, 9, 10, 11].map((age) => (
                              <option key={age} value={age}>{age} years old</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <SectionLabel>Friend&apos;s Parent Info</SectionLabel>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-body">
                            Friend&apos;s parent name <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="text"
                            name="friendParentName"
                            value={formData.friendParentName}
                            onChange={handleChange}
                            placeholder="Parent or guardian's full name"
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-body">
                            Friend&apos;s parent email <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="email"
                            name="friendParentEmail"
                            value={formData.friendParentEmail}
                            onChange={handleChange}
                            placeholder="parent@email.com"
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-body">
                            Friend&apos;s parent phone
                          </label>
                          <input
                            type="tel"
                            name="friendParentPhone"
                            value={formData.friendParentPhone}
                            onChange={handleChange}
                            placeholder="(512) 000-0000"
                            className={inputClass}
                          />
                        </div>
                      </div>

                      <SectionLabel>Emergency Contact</SectionLabel>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-body">
                            Emergency contact name
                          </label>
                          <input
                            type="text"
                            name="trackAEmergencyName"
                            value={formData.trackAEmergencyName}
                            onChange={handleChange}
                            placeholder="Name if parent can't be reached"
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-body">
                            Emergency contact phone
                          </label>
                          <input
                            type="tel"
                            name="trackAEmergencyPhone"
                            value={formData.trackAEmergencyPhone}
                            onChange={handleChange}
                            placeholder="(512) 000-0000"
                            className={inputClass}
                          />
                        </div>
                      </div>

                      <SectionLabel>Before We Meet</SectionLabel>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-body">
                            Anything we should know about their child?
                          </label>
                          <textarea
                            name="trackANotes"
                            value={formData.trackANotes}
                            onChange={handleChange}
                            rows={3}
                            placeholder="Allergies, sensitivities, medical conditions, or anything that helps us take great care of their child"
                            className={`${inputClass} resize-none`}
                          />
                        </div>
                        <label className="flex items-start gap-3 cursor-pointer group">
                          <div
                            className={`w-5 h-5 flex-shrink-0 rounded border-2 mt-0.5 flex items-center justify-center transition-colors ${
                              formData.trackAPhotoConsent
                                ? "bg-primary border-primary"
                                : "border-gray-300 group-hover:border-primary/50"
                            }`}
                          >
                            {formData.trackAPhotoConsent && (
                              <CheckCircle className="w-3 h-3 text-white" />
                            )}
                          </div>
                          <input
                            type="checkbox"
                            name="trackAPhotoConsent"
                            checked={formData.trackAPhotoConsent}
                            onChange={handleChange}
                            className="sr-only"
                          />
                          <span className="text-sm text-gray-600 font-body leading-snug">
                            The friend&apos;s family is okay with photos of their child being taken and
                            shared on Sage Field&apos;s social media
                          </span>
                        </label>
                      </div>
                    </motion.div>
                  )}

                  {track === "new" && (
                    <motion.div
                      key="track-new"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                    >
                      <SectionLabel>Your Info</SectionLabel>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-body">
                            Parent / guardian name <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="text"
                            name="parentName"
                            value={formData.parentName}
                            onChange={handleChange}
                            placeholder="Your full name"
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-body">
                            Email <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="you@email.com"
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-body">
                            Phone
                          </label>
                          <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="(512) 000-0000"
                            className={inputClass}
                          />
                        </div>
                      </div>

                      <SectionLabel>Your Child</SectionLabel>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-body">
                            Child&apos;s name <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="text"
                            name="childName"
                            value={formData.childName}
                            onChange={handleChange}
                            placeholder="First and last name"
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-body">
                            Child&apos;s age <span className="text-red-400">*</span>
                          </label>
                          <select
                            name="childAge"
                            value={formData.childAge}
                            onChange={handleChange}
                            className={`${inputClass} cursor-pointer`}
                          >
                            <option value="">Select age</option>
                            {[4, 5, 6, 7, 8, 9, 10, 11].map((age) => (
                              <option key={age} value={age}>{age} years old</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <SectionLabel>A Bit More</SectionLabel>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-body">
                            How did you hear about us?
                          </label>
                          <select
                            name="referralSource"
                            value={formData.referralSource}
                            onChange={handleChange}
                            className={`${inputClass} cursor-pointer`}
                          >
                            <option value="">Select one</option>
                            <option value="friend">Friend / Word of Mouth</option>
                            <option value="instagram">Instagram</option>
                            <option value="facebook">Facebook</option>
                            <option value="google">Google</option>
                            <option value="nextdoor">Nextdoor</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-body">
                            Anything we should know?
                          </label>
                          <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            rows={3}
                            placeholder="Allergies, medical needs, sensitivities, or anything that helps us take great care of your child"
                            className={`${inputClass} resize-none`}
                          />
                        </div>
                      </div>

                      <SectionLabel>Emergency Contact</SectionLabel>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-body">
                            Emergency contact name
                          </label>
                          <input
                            type="text"
                            name="emergencyName"
                            value={formData.emergencyName}
                            onChange={handleChange}
                            placeholder="Name if you can't be reached"
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-body">
                            Emergency contact phone
                          </label>
                          <input
                            type="tel"
                            name="emergencyPhone"
                            value={formData.emergencyPhone}
                            onChange={handleChange}
                            placeholder="(512) 000-0000"
                            className={inputClass}
                          />
                        </div>
                      </div>

                      <SectionLabel>Before we confirm your spot</SectionLabel>
                      <div className="space-y-3">
                        {[
                          { name: "consentOutdoor" as const, checked: formData.consentOutdoor, label: <>I give permission for my child to participate in outdoor activities and to have sunscreen applied if needed <span className="text-red-400">*</span></> },
                          { name: "consentPhoto" as const, checked: formData.consentPhoto, label: "I'm okay with photos of my child being taken and shared on Sage Field's social media" },
                          { name: "interestedInEnrollment" as const, checked: formData.interestedInEnrollment, label: "I'd love to learn more about joining Sage Field regularly" },
                        ].map(({ name, checked, label }) => (
                          <label key={name} className="flex items-start gap-3 cursor-pointer">
                            <div
                              className={`w-5 h-5 flex-shrink-0 rounded border-2 mt-0.5 flex items-center justify-center transition-colors ${
                                checked ? "bg-primary border-primary" : "border-gray-300 bg-white"
                              }`}
                            >
                              {checked && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                            </div>
                            <input type="checkbox" name={name} checked={checked} onChange={handleChange} className="sr-only" />
                            <span className="text-sm text-gray-600 font-body leading-snug">{label}</span>
                          </label>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Agreement + Submit */}
                {(
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    className="mt-6 space-y-3"
                  >
                    {/* Agreement status row */}
                    <div
                      className={`flex items-center justify-between p-4 rounded-xl border-2 transition-colors ${
                        agreementSigned
                          ? "border-emerald-200 bg-emerald-50"
                          : "border-dashed border-gray-200 bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {agreementSigned ? (
                          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                        ) : (
                          <PenLine className="w-5 h-5 text-amber-500 flex-shrink-0" />
                        )}
                        <div>
                          <p className="text-sm font-bold font-heading text-gray-800">
                            Shadow Day Agreement
                          </p>
                          <p className="text-xs text-gray-400 font-body">
                            {agreementSigned
                              ? "Signed — ready to submit"
                              : "Required before submitting"}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAgreementOpen(true)}
                        disabled={!isFormValid}
                        className="text-xs font-semibold text-primary font-body hover:underline cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 ml-2"
                      >
                        {agreementSigned ? "View" : "Review & Sign →"}
                      </button>
                    </div>
                    {!isFormValid && !agreementSigned && (
                      <p className="text-xs text-gray-400 font-body text-center">
                        Fill in required fields above to unlock the agreement
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={() => setSubmitted(true)}
                      disabled={!isFormValid || !agreementSigned}
                      className="w-full px-6 py-4 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-all duration-200 font-body cursor-pointer shadow-md hover:shadow-lg text-base disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                    >
                      Reserve My Free Spot for June 5 →
                    </button>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Packing List */}
      <section className="py-16 px-8 sm:px-12 lg:px-16 bg-sage-50/40">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <span className="inline-block px-5 py-1.5 bg-badge-bg text-black text-sm font-semibold rounded-full mb-4 font-body">
              Day-of Checklist
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 font-heading">
              What to Pack for Friday
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PACKING_LIST.map((item, i) => (
              <motion.div
                key={item.item}
                className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-100"
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.06 }}
              >
                <span className="text-xl flex-shrink-0">{item.emoji}</span>
                <span className="text-sm font-body text-gray-700 font-semibold">{item.item}</span>
              </motion.div>
            ))}
          </div>

          <p className="text-sm text-gray-400 font-body text-center mt-6">
            Questions? Text or call us: (512) 677-5872
          </p>
        </div>
      </section>

      {/* Bottom CTA Repeat */}
      <section className="py-20 px-8 sm:px-12 lg:px-16 bg-sage-50">
        <div className="max-w-2xl mx-auto">
          <motion.div
            className="bg-white rounded-3xl p-10 shadow-sm border border-gray-100 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-block px-5 py-1.5 bg-badge-bg text-black text-sm font-semibold rounded-full mb-4 font-body">
              This Friday Only
            </span>
            <h2 className="font-heading text-3xl font-bold text-gray-800 mb-3">
              Don&apos;t miss this Friday.
            </h2>
            <p className="text-gray-500 font-body mb-8 leading-relaxed">
              June 5 is one day. Spots are limited. Reserve your child&apos;s free visit now and
              see what all the excitement is about.
            </p>
            <button
              onClick={scrollToForm}
              className="px-10 py-4 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-all duration-200 shadow-md hover:shadow-lg font-body text-base cursor-pointer"
            >
              Reserve Free Spot →
            </button>
            <p className="text-xs text-gray-400 font-body mt-4">
              No cost. No commitment. Just a great day.
            </p>
          </motion.div>
        </div>
      </section>

      <Footer />

      {/* Mobile sticky bottom bar */}
      <motion.div
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 pt-2"
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.4, ease: "easeOut" as const }}
      >
        <div className="bg-primary rounded-2xl shadow-xl flex items-center justify-between px-5 py-3 gap-3">
          <div>
            <p className="text-white font-heading font-bold text-sm leading-tight">
              Free Friday · June 5
            </p>
            <p className="text-white/80 font-body text-xs">Limited spots — reserve yours</p>
          </div>
          <button
            onClick={scrollToForm}
            className="flex-shrink-0 bg-white text-primary font-semibold text-sm font-body px-4 py-2 rounded-xl hover:bg-welcome-bg transition-colors duration-200 cursor-pointer"
          >
            Reserve →
          </button>
        </div>
      </motion.div>

      <div className="hidden lg:block">
        <FloatingSMSButton />
      </div>

      {/* Shadow Day Agreement Drawer */}
      <AnimatePresence>
        {agreementOpen && (
          <div className={dancingScript.variable}>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/60 z-[60]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAgreementOpen(false)}
            />

            {/* Drawer */}
            <motion.div
              className="fixed inset-y-0 right-0 w-full max-w-3xl z-[70] bg-white flex flex-col shadow-2xl"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Sticky Header */}
              <div className="flex-shrink-0 sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
                <div>
                  <h2 className="text-base font-bold font-heading text-gray-800">
                    Shadow Day Participant Agreement
                  </h2>
                  <p className="text-xs text-gray-400 font-body mt-0.5">
                    {agreementSigned ? "1" : "0"} of 1 sections signed
                  </p>
                </div>
                <button
                  onClick={() => setAgreementOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0 cursor-pointer"
                  aria-label="Close"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="flex-1 overflow-y-auto px-6 py-6">
                <div className="flex flex-col gap-8">
                  {/* School info header */}
                  <div className="flex flex-col gap-0.5">
                    <p className="text-sm font-semibold font-heading text-gray-800">
                      Sage Field Private Microschool
                    </p>
                    <p className="text-xs text-gray-500 font-body">
                      Location: Round Rock, Texas · Shadow Day Date: Friday, June 5, 2026
                    </p>
                  </div>

                  {/* Pre-filled participant info */}
                  <div className="flex flex-col gap-3 bg-gray-50 rounded-xl px-5 py-4 border border-gray-100">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                      {[
                        { label: "Student Name", value: studentName || "—" },
                        { label: "Parent / Guardian", value: guardianName || "—" },
                        {
                          label: "Emergency Contact",
                          value: emergencyName ? `${emergencyName}${emergencyPhone ? ` · ${emergencyPhone}` : ""}` : "—",
                        },
                        {
                          label: "Photo Consent",
                          value: photoConsent ? "✓ Authorized" : "✗ Not authorized",
                        },
                      ].map((row) => (
                        <div key={row.label}>
                          <p className="text-xs font-semibold text-gray-400 font-body">{row.label}</p>
                          <p className="text-sm text-gray-800 font-body">{row.value}</p>
                        </div>
                      ))}
                    </div>
                    {notesForAgreement && (
                      <div className="border-t border-gray-200 pt-3 mt-1">
                        <p className="text-xs font-semibold text-gray-400 font-body mb-1">Medical / Notes</p>
                        <p className="text-sm text-gray-700 font-body leading-relaxed">{notesForAgreement}</p>
                      </div>
                    )}
                  </div>

                  {/* 1. Acknowledgment of Program Activities */}
                  <div className="flex flex-col gap-3">
                    <AgreementSectionHeader title="1. Acknowledgment of Program Activities" />
                    <p className="text-sm text-gray-600 font-body leading-relaxed">
                      I understand that my child is participating in a Shadow Day at an outdoor
                      education program where children learn through active exploration, hands-on
                      experiences, and supervised outdoor activities. Activities may include, but
                      are not limited to:
                    </p>
                    <ul className="flex flex-col gap-1.5">
                      {ACTIVITIES.map((a) => (
                        <li key={a} className="flex gap-2 text-sm text-gray-600 font-body">
                          <span className="text-primary mt-0.5 flex-shrink-0">•</span>
                          <span>{a}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="text-sm text-gray-600 font-body leading-relaxed">
                      I understand that these activities involve inherent risks that cannot be
                      completely eliminated while preserving the educational and developmental
                      benefits of participation.
                    </p>
                  </div>

                  {/* 2. Assumption of Risk */}
                  <div className="flex flex-col gap-3">
                    <AgreementSectionHeader title="2. Assumption of Risk" />
                    <p className="text-sm text-gray-600 font-body leading-relaxed">
                      I knowingly and voluntarily assume all risks associated with my child&apos;s
                      participation in the Shadow Day, including but not limited to:
                    </p>
                    <ul className="flex flex-col gap-1.5">
                      {RISKS.map((r) => (
                        <li key={r} className="flex gap-2 text-sm text-gray-600 font-body">
                          <span className="text-primary mt-0.5 flex-shrink-0">•</span>
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="text-sm text-gray-600 font-body leading-relaxed">
                      I understand that injury may occur despite reasonable supervision and safety
                      precautions.
                    </p>
                  </div>

                  {/* 3. Release of Liability */}
                  <div className="flex flex-col gap-3">
                    <AgreementSectionHeader title="3. Release of Liability" />
                    <p className="text-sm text-gray-600 font-body leading-relaxed">
                      In consideration of my child&apos;s participation in the Shadow Day, I release
                      and hold harmless the School, its owners, directors, employees, contractors,
                      volunteers, agents, and representatives from any claims, demands, causes of
                      action, damages, losses, costs, or expenses arising out of or related to my
                      child&apos;s participation.
                    </p>
                    <p className="text-sm text-gray-600 font-body leading-relaxed">
                      This release applies to all claims based upon ordinary negligence but does not
                      apply to claims arising from gross negligence, reckless conduct, or intentional
                      misconduct.
                    </p>
                  </div>

                  {/* 4. Medical Authorization */}
                  <div className="flex flex-col gap-3">
                    <AgreementSectionHeader title="4. Medical Authorization" />
                    <p className="text-sm text-gray-600 font-body leading-relaxed">
                      I authorize school personnel to obtain emergency medical treatment for my child
                      if I cannot be reached promptly. I understand that:
                    </p>
                    <ul className="flex flex-col gap-1.5">
                      {[
                        "Emergency medical services may be contacted when deemed necessary.",
                        "I am responsible for all medical expenses incurred on behalf of my child.",
                        "School personnel may administer basic first aid as appropriate.",
                      ].map((item) => (
                        <li key={item} className="flex gap-2 text-sm text-gray-600 font-body">
                          <span className="text-primary mt-0.5 flex-shrink-0">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                    {notesForAgreement && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                        <p className="text-xs font-semibold text-amber-700 font-body mb-1">
                          Allergies, Medical Conditions, or Special Notes
                        </p>
                        <p className="text-sm text-amber-800 font-body">{notesForAgreement}</p>
                      </div>
                    )}
                  </div>

                  {/* 5. Photography and Media Release */}
                  <div className="flex flex-col gap-3">
                    <AgreementSectionHeader title="5. Photography and Media Release" />
                    <div
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${
                        photoConsent
                          ? "bg-emerald-50 border-emerald-200"
                          : "bg-gray-50 border-gray-200"
                      }`}
                    >
                      <span className="text-lg">{photoConsent ? "✅" : "🚫"}</span>
                      <p className="text-sm font-body text-gray-700">
                        {photoConsent
                          ? "I authorize the School to photograph and/or record my child and use such images or recordings for educational, promotional, website, social media, and marketing purposes."
                          : "I do not authorize the School to use photographs or recordings of my child."}
                      </p>
                    </div>
                  </div>

                  {/* 6. Emergency Contact */}
                  <div className="flex flex-col gap-3">
                    <AgreementSectionHeader title="6. Emergency Contact Authorization" />
                    <p className="text-sm text-gray-600 font-body leading-relaxed">
                      If the parent or guardian cannot be reached, the following individual is
                      authorized to make emergency decisions regarding the child:
                    </p>
                    <div className="bg-gray-50 rounded-lg px-4 py-3 border border-gray-100">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs font-semibold text-gray-400 font-body">Name</p>
                          <p className="text-sm text-gray-800 font-body">{emergencyName || "—"}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-400 font-body">Phone</p>
                          <p className="text-sm text-gray-800 font-body">{emergencyPhone || "—"}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 7. Releasor Acknowledgment + Signature */}
                  <div className="flex flex-col gap-4">
                    <AgreementSectionHeader title="7. Parent Acknowledgment & Signature" />
                    <p className="text-sm text-gray-600 font-body leading-relaxed">
                      By signing below, I confirm that I have read this Agreement in its entirety and
                      understand its contents. I understand that participation in outdoor educational
                      activities involves inherent risks and that I am voluntarily permitting my child
                      to participate. I certify that I am the parent or legal guardian of the child
                      named above and have authority to execute this Agreement.
                    </p>

                    {agreementSigned ? (
                      <div className="mt-2 border border-emerald-200 bg-emerald-50 rounded-xl px-4 py-3 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          <p
                            className="text-2xl text-gray-700 truncate"
                            style={{ fontFamily: "var(--font-dancing-script)" }}
                          >
                            {sigValue}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setAgreementSigned(false);
                            setSigValue("");
                          }}
                          className="text-xs text-gray-400 hover:text-gray-600 font-body underline shrink-0 cursor-pointer"
                        >
                          Edit
                        </button>
                      </div>
                    ) : (
                      <div className="mt-2 border border-gray-200 rounded-xl px-4 py-4 flex flex-col gap-3 bg-gray-50">
                        <p className="text-xs font-semibold text-gray-500 font-body uppercase tracking-wide">
                          Sign this section
                        </p>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 font-body mb-1">
                            Full name <span className="font-normal text-gray-400">(print)</span>
                          </label>
                          <input
                            type="text"
                            value={sigPrintedName}
                            onChange={(e) => setSigPrintedName(e.target.value)}
                            placeholder="Your full legal name"
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 font-body text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:border-primary transition-colors bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 font-body mb-1">
                            Signature
                          </label>
                          {sigValue ? (
                            <div className="flex items-center gap-3 px-3 py-2 rounded-lg border border-dashed border-gray-200 bg-white">
                              <p
                                className="text-2xl text-gray-700 flex-1"
                                style={{ fontFamily: "var(--font-dancing-script)" }}
                              >
                                {sigValue}
                              </p>
                              <button
                                type="button"
                                onClick={() => setSigValue("")}
                                className="text-xs text-gray-400 hover:text-gray-600 font-body underline shrink-0 cursor-pointer"
                              >
                                Clear
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setSigValue(sigPrintedName)}
                              disabled={!sigPrintedName.trim()}
                              className="cursor-pointer w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm font-body text-primary hover:bg-primary/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-left"
                            >
                              Click to sign
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleSaveSignature}
                            disabled={!sigValue.trim()}
                            className="px-4 py-2 bg-primary text-white text-xs font-semibold font-body rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                          >
                            Save signature
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Sticky Footer */}
              <div
                className={`flex-shrink-0 border-t px-6 py-4 flex items-center justify-between ${
                  agreementSigned
                    ? "bg-emerald-50 border-emerald-200"
                    : "bg-white border-gray-100"
                }`}
              >
                {agreementSigned ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm font-semibold text-emerald-700 font-body">
                      Agreement signed — you&apos;re all set
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <PenLine className="w-4 h-4 text-amber-500" />
                    <span className="text-sm text-gray-500 font-body">
                      Signature required to continue
                    </span>
                  </div>
                )}
                <button
                  onClick={() => setAgreementOpen(false)}
                  className="px-4 py-2 text-xs font-semibold font-body text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
