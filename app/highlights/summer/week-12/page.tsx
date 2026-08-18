"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import dynamic from "next/dynamic";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import FloatingSMSButton from "@/app/components/FloatingSMSButton";

const ImageLightbox = dynamic(() => import("@/app/components/ImageLightbox"), {
  ssr: false,
});

const WEEK_IMAGES: { src: string; caption: string }[] = [
  {
    src: "/assets/highlights/summer_week_twelve/8C3B1791-0B49-4B7E-B069-C746C7CF6F65.JPG",
    caption: "Hands in the air with Miss Joy — friendship, feelings, and a brand-new classroom corner",
  },
  {
    src: "/assets/highlights/summer_week_twelve/D3FA9EEC-F140-4CE7-9B2F-65B3BAE014E0.JPG",
    caption: "Story time under the neon rainbow — our cozy new reading nook",
  },
  {
    src: "/assets/highlights/summer_week_twelve/44B158CD-2668-4877-85F0-A45D4F56F958.JPG",
    caption: "Students helped design, decorate, and decide how our classroom should feel",
  },
  {
    src: "/assets/highlights/summer_week_twelve/9CB7AFC5-A7A7-49C1-8417-5C17358D88AF.JPG",
    caption: "Crafting together — a collaborative space the children helped create",
  },
  {
    src: "/assets/highlights/summer_week_twelve/7FC17749-C35E-47DB-8B80-2BC59AFB8E19.JPG",
    caption: "Up in the branches — outdoor adventure on the last week of camp",
  },
  {
    src: "/assets/highlights/summer_week_twelve/1B51CC5A-BF15-4969-8188-2D923C9489E5.JPG",
    caption: "Picnic under the trees — slowing down and appreciating the friendships we've built",
  },
  {
    src: "/assets/highlights/summer_week_twelve/C87A6102-AD14-40A3-A0DE-8474C4FD0026.JPG",
    caption: "Handprint summer shirts — a colorful keepsake from our last week together",
  },
  {
    src: "/assets/highlights/summer_week_twelve/A22E4DCE-642F-4D57-8567-408B39236290.JPG",
    caption: "Number tracing on the floor — one last review of the skills we strengthened all summer",
  },
  {
    src: "/assets/highlights/summer_week_twelve/322D2DEF-050E-470D-8E31-7A830D86521A.JPG",
    caption: "Foam, water blasters, and a bounce house — racing down slides one more time",
  },
  {
    src: "/assets/highlights/summer_week_twelve/67752A12-DD09-421C-BC3E-EA2452FC8748.JPG",
    caption: "Side-by-side picnic lunch — new friendships, including welcoming Miss Joy",
  },
  {
    src: "/assets/highlights/summer_week_twelve/83D2FB1A-C506-4BC1-B5A1-8C4DBD31DA58.JPG",
    caption: "Mud kitchen to the end — pouring, mixing, and playing in the dirt",
  },
  {
    src: "/assets/highlights/summer_week_twelve/C43549C9-FFE3-4AB0-A135-8E2746809626.JPG",
    caption: "Circle time on the picnic mat — connecting before the school year begins",
  },
  {
    src: "/assets/highlights/summer_week_twelve/D9FAB2B8-9EBC-4EF4-9A1A-F99DB6B427AE.JPG",
    caption: "Watering the garden beds — growing something together right to the last day",
  },
  {
    src: "/assets/highlights/summer_week_eleven/CF99A61C-FBCF-4EE2-B919-333DF0619A6F.JPG",
    caption: "UNO on the checkered blanket — friendship building in the backyard",
  },
  {
    src: "/assets/highlights/summer_week_eleven/611930E7-1ADF-49A7-A2C0-C081221BD854.JPG",
    caption: "Opinion writing — 'our next class pet should have a parrot!'",
  },
  {
    src: "/assets/highlights/summer_week_eleven/9E086650-1583-4069-8953-C11529996D16.JPG",
    caption: "A huddle in the grass — costumes, stuffed animals, and a shared discovery",
  },
  {
    src: "/assets/highlights/summer_week_eleven/5C59AB4B-B437-4900-8F87-AC9ACD900DED.JPG",
    caption: "Data analysis with connecting cubes — building bar graphs by color",
  },
  {
    src: "/assets/highlights/summer_week_eleven/IMG_0754.jpg",
    caption: "Stormtrooper in the kitchen — chopping potatoes in the coolest costume",
  },
  {
    src: "/assets/highlights/summer_week_eleven/IMG_0801.jpg",
    caption: "Favorite-word writing — spelling, grammar, and a stuffed-animal writing partner",
  },
  {
    src: "/assets/highlights/summer_week_eleven/IMG_0812.jpg",
    caption: "Zipline swings and open grass — 12 weeks of outdoor play coming to a close",
  },
  {
    src: "/assets/highlights/summer_week_eleven/023D8975-A8F3-4363-A03B-9B33D13CCC92.JPG",
    caption: "Picnic-table perch — summer joy, start to finish",
  },
  {
    src: "/assets/highlights/summer_week_eleven/14D193F9-531A-49CB-B26F-848C879C0FC0.JPG",
    caption: "Lined-paper focus — one last ELA review before the school year",
  },
  {
    src: "/assets/highlights/summer_week_eleven/19757EE4-381F-4ADD-B6D5-1735915562F8.JPG",
    caption: "Checkered-blanket picnic with Miss Joy — lunch boxes, shade, and new friends",
  },
  {
    src: "/assets/highlights/summer_week_eleven/42756484-192D-4F31-B65A-397C0DD18AC6.JPG",
    caption: "Addition review in a dry-erase sleeve — strengthening skills, not introducing new ones",
  },
  {
    src: "/assets/highlights/summer_week_eleven/4C092707-8925-4F04-A27E-DB164364E8BF.JPG",
    caption: "Circle on the rug — learning how to communicate and express how we're feeling",
  },
  {
    src: "/assets/highlights/summer_week_eleven/5A3AF327-F0A7-43BF-9B1B-D79EC07F2D98.JPG",
    caption: "Painting clay sculptures at the picnic table — side-by-side creativity",
  },
  {
    src: "/assets/highlights/summer_week_eleven/5C4777E0-34AF-463F-8B4D-F166DEFB5F5C.JPG",
    caption: "Writing prompts and addition sheets — fiction, nonfiction, and math in one sitting",
  },
  {
    src: "/assets/highlights/summer_week_eleven/5D55FD03-B5FE-4D08-A1ED-AF3A71061450.JPG",
    caption: "Tic-tac-toe with a Kirby pal — play that still builds connection",
  },
  {
    src: "/assets/highlights/summer_week_eleven/5D8FDA30-00DF-4E4B-82D1-9AEBBD2F8E4E.JPG",
    caption: "Rainbow painting around the table — Miss Joy cheering the whole group on",
  },
  {
    src: "/assets/highlights/summer_week_eleven/71F6051C-9FE1-4EE5-B36D-01F87A23398D.JPG",
    caption: "Loaded-potato prep — costumes on, safety knives out, kitchen confidence growing",
  },
  {
    src: "/assets/highlights/summer_week_eleven/7892E368-C227-4499-B5FD-0E6CEBAAE5FD.JPG",
    caption: "Snap-cube graphs — counting, comparing, and data analysis by hand",
  },
  {
    src: "/assets/highlights/summer_week_eleven/7A9CC1BE-BE47-4DDD-B413-F8A012DADBDF.JPG",
    caption: "Two friends on the picnic blanket — a beautiful way to end our summer",
  },
  {
    src: "/assets/highlights/summer_week_eleven/7C7B4561-A878-42EB-8D52-281C607B9562.JPG",
    caption: "Paper-plate painting on baking trays — focused, colorful, and collaborative",
  },
  {
    src: "/assets/highlights/summer_week_eleven/86334E46-E95A-4381-9DA4-1E01CEA619E7.JPG",
    caption: "Water slide and splash pad — racing down slides one last summer stretch",
  },
  {
    src: "/assets/highlights/summer_week_eleven/86D37C4D-6D74-492D-9C29-FC9529679A7C.JPG",
    caption: "UNO in a circle — meaningful friendships, one card at a time",
  },
  {
    src: "/assets/highlights/summer_week_eleven/9C77B765-A833-49D4-8719-7D1D6E979922.JPG",
    caption: "Two climbers in the canopy — outdoor courage and connection",
  },
  {
    src: "/assets/highlights/summer_week_eleven/A8F848C9-ADDA-49D4-BD5D-A9D274495A4B.JPG",
    caption: "Climbing holds on the tree trunk — taking turns, cheering each other on",
  },
  {
    src: "/assets/highlights/summer_week_eleven/B2641E90-3CBA-4775-B307-B24C1D73CF47.JPG",
    caption: "Spider-Man landing — the coolest costumes of the summer",
  },
  {
    src: "/assets/highlights/summer_week_eleven/D5914D9F-067C-4D58-A69E-5E67E00D12B9.JPG",
    caption: "Magna-Tiles under the umbrella — cooperative play at the picnic table",
  },
  {
    src: "/assets/highlights/summer_week_eleven/F4D4E35B-C7CD-49BD-B022-1DD4AC79F982.JPG",
    caption: "One-on-one lunch under the umbrella — slowing down and connecting",
  },
  {
    src: "/assets/highlights/summer_week_eleven/FAA98C1D-4882-447C-BF27-2EEA07C5453F.JPG",
    caption: "Another round of UNO — 12 weeks of play, rain, mud, and new friends",
  },
];

const CAROUSEL_COUNT = 8;

const EARLY_LEARNER_HIGHLIGHTS = [
  { emoji: "💛", label: "Meet Miss Joy", desc: "The children got to meet a very special friend this week — Miss Joy — and it was filled with so much joy, literally" },
  { emoji: "🤝", label: "Friendship Building", desc: "Learning how to build meaningful friendships, communicate with one another, and express how we're feeling — then slowing down to appreciate the relationships we've built" },
  { emoji: "🏡", label: "Classroom Redesign", desc: "Students helped design, decorate, and share ideas about how they wanted our space to feel — a collaborative classroom they have a real voice in" },
  { emoji: "📸", label: "Family Photos", desc: "Families are invited to bring a family photo so the classroom feels warm, cozy, and connected to home — a comfort for children who need extra support during the day" },
  { emoji: "🌅", label: "A Joyful Close", desc: "Watching the children learn, laugh, grow, and connect has been a beautiful way to end our summer together" },
];

const ELEMENTARY_HIGHLIGHTS = [
  { emoji: "☀️", label: "12 Weeks in Review", desc: "Mud, pouring rain, sandpit castles, water slides, costumes, every popsicle flavor we could invent — and new friendships, including welcoming Miss Joy" },
  { emoji: "🧮", label: "Math Review", desc: "Place value, long addition and subtraction, multi-step word problems, data analysis, fractions, telling time, and multiplication — strengthening skills, not introducing new ones" },
  { emoji: "📚", label: "ELA Review", desc: "Fiction vs nonfiction, reading comprehension, spelling, grammar, writing, and comparing and contrasting — one last pass at everything we covered this summer" },
  { emoji: "🍪", label: "Chocolate Chip Cookies", desc: "Last cooking activity of the summer — kids measured and made their own little batch of dough, mixed it as a whole, and baked their own personal cookie" },
  { emoji: "☕", label: "First Day of School", desc: "Looking forward to celebrating with a coffee bar and photo booth as the school year begins" },
];

export default function SummerWeekTwelvePage() {
  const router = useRouter();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const [activeSlide, setActiveSlide] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startInterval = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setActiveSlide((s) => (s + 1) % CAROUSEL_COUNT);
    }, 5000);
  }, []);

  useEffect(() => {
    startInterval();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [startInterval]);

  const goToSlide = (index: number) => {
    setActiveSlide(index);
    startInterval();
  };

  const goPrev = () => goToSlide((activeSlide - 1 + CAROUSEL_COUNT) % CAROUSEL_COUNT);
  const goNext = () => goToSlide((activeSlide + 1) % CAROUSEL_COUNT);

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

  const lightboxImages = WEEK_IMAGES.map((img) => ({
    src: img.src,
    alt: img.caption,
  }));

  return (
    <div className="min-h-screen bg-welcome-bg">
      <Navbar />

      {/* ── Desktop Hero Carousel ── (hidden on mobile) */}
      <div className="hidden sm:block relative w-full h-[75vh] min-h-[560px] overflow-hidden">
        <AnimatePresence mode="sync">
          <motion.div
            key={activeSlide}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: "easeInOut" }}
          >
            <Image
              src={WEEK_IMAGES[activeSlide].src}
              alt={WEEK_IMAGES[activeSlide].caption}
              fill
              className="object-cover"
              sizes="100vw"
              priority={activeSlide === 0}
            />
          </motion.div>
        </AnimatePresence>

        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />

        <div className="absolute bottom-0 left-0 right-0 px-12 lg:px-16 pb-12">
          <motion.span
            key={`badge-${activeSlide}`}
            className="inline-block px-4 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-semibold rounded-full mb-3 font-body"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            Summer 2026 · Week 12
          </motion.span>
          <motion.h1
            key={`heading-${activeSlide}`}
            className="text-4xl md:text-5xl font-bold font-heading text-white mb-2 drop-shadow-md"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
          >
            Week 12 Highlights ☀️
          </motion.h1>
          <motion.p
            key={`date-${activeSlide}`}
            className="text-white/80 font-body text-sm font-semibold"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            Aug 10–13, 2026
          </motion.p>
        </div>

        <button
          onClick={goPrev}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-black/30 hover:bg-black/50 text-white transition-colors"
          aria-label="Previous photo"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={goNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-black/30 hover:bg-black/50 text-white transition-colors"
          aria-label="Next photo"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        <div className="absolute bottom-5 right-12 lg:right-16 flex gap-1.5">
          {Array.from({ length: CAROUSEL_COUNT }).map((_, i) => (
            <button
              key={i}
              onClick={() => goToSlide(i)}
              className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                i === activeSlide ? "bg-white" : "bg-white/40"
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* ── Mobile hero gallery ── (hidden on sm+) */}
      <div className="sm:hidden pt-20">
        <div
          ref={galleryRef}
          className="overflow-x-auto flex gap-0 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]"
          onTouchStart={handleGalleryInteractionStart}
          onTouchEnd={handleGalleryInteractionEnd}
          onMouseDown={handleGalleryInteractionStart}
          onMouseUp={handleGalleryInteractionEnd}
        >
          {[...WEEK_IMAGES, ...WEEK_IMAGES].map((img, i) => (
            <div
              key={i}
              className="relative w-[88%] flex-shrink-0 aspect-square overflow-hidden"
            >
              <Image
                src={img.src}
                alt={img.caption}
                fill
                className="object-cover"
                sizes="88vw"
                priority={i === 0}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Intro text */}
      <section className="pt-8 sm:pt-10 pb-10 px-8 sm:px-12 lg:px-16">
        <div className="max-w-4xl mx-auto">
          <div className="sm:hidden mb-4">
            <span className="inline-block px-5 py-1.5 bg-badge-bg text-black text-sm font-semibold rounded-full mb-3 font-body">
              Summer 2026 · Week 12
            </span>
            <h1 className="text-3xl font-bold font-heading text-gray-800 mb-1">
              Week 12 Highlights ☀️
            </h1>
            <p className="text-sm font-semibold text-primary font-body mb-4">
              Aug 10–13, 2026
            </p>
          </div>

          <motion.p
            className="text-lg text-gray-600 font-body leading-relaxed max-w-3xl"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            The last week of camp — bittersweet, and filled with so much joy. Literally. Primary students met a very special friend, Miss Joy, then slowed down to practice friendship, communication, and sharing how they feel. Together they redesigned the classroom so it feels like a home away from home. Elementary students wrapped a 12-week summer of mud, rain, sandcastles, water slides, costumes, and popsicles with a full math and ELA review, then baked their own chocolate chip cookies. What a beautiful way to end our summer together.
          </motion.p>
        </div>
      </section>

      {/* What We Learned */}
      <section className="pb-16 px-8 sm:px-12 lg:px-16">
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-block px-5 py-1.5 bg-badge-bg text-black text-sm font-semibold rounded-full mb-4 font-body">
              What We Learned
            </span>
            <h2 className="text-2xl md:text-3xl font-bold font-heading text-gray-800 mb-2">
              A Beautiful Way to End Summer
            </h2>
            <p className="text-base text-gray-500 font-body">
              Both our primary and elementary groups closed camp with connection, review, and celebration.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            {/* Primary card */}
            <motion.div
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">🌱</span>
                </div>
                <h3 className="text-lg font-bold font-heading text-gray-800">Primary</h3>
              </div>
              <ul className="space-y-3">
                {EARLY_LEARNER_HIGHLIGHTS.map((item) => (
                  <li key={item.label} className="flex items-start gap-3">
                    <span className="text-xl leading-none mt-0.5 flex-shrink-0">{item.emoji}</span>
                    <div>
                      <p className="text-sm font-semibold text-gray-800 font-body leading-tight">{item.label}</p>
                      <p className="text-xs text-gray-500 font-body mt-0.5">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Elementary card */}
            <motion.div
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-sage-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">📐</span>
                </div>
                <h3 className="text-lg font-bold font-heading text-gray-800">Elementary</h3>
              </div>
              <ul className="space-y-3">
                {ELEMENTARY_HIGHLIGHTS.map((item) => (
                  <li key={item.label} className="flex items-start gap-3">
                    <span className="text-xl leading-none mt-0.5 flex-shrink-0">{item.emoji}</span>
                    <div>
                      <p className="text-sm font-semibold text-gray-800 font-body leading-tight">{item.label}</p>
                      <p className="text-xs text-gray-500 font-body mt-0.5">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>

          {/* Beyond Academics strip */}
          <motion.div
            className="bg-primary/5 rounded-2xl p-6 border border-primary/15 mb-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <p className="text-sm font-bold text-gray-500 font-body uppercase tracking-wide mb-4">
              Beyond Academics
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  emoji: "💛",
                  title: "Welcoming Miss Joy",
                  desc: "A very special new friend joined us this week — and the children learned, laughed, and connected right alongside her.",
                },
                {
                  emoji: "🏡",
                  title: "Classroom as a Home",
                  desc: "Students designed and decorated our space together so it feels warm, cozy, and like a home away from home.",
                },
                {
                  emoji: "🍪",
                  title: "Cookies to Close Summer",
                  desc: "Our last cooking activity — personal batches of chocolate chip cookie dough, mixed as a class, baked one cookie at a time.",
                },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-3">
                  <span className="text-2xl leading-none flex-shrink-0">{item.emoji}</span>
                  <div>
                    <p className="text-sm font-bold text-gray-800 font-body leading-tight mb-1">{item.title}</p>
                    <p className="text-xs text-gray-600 font-body leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Family photo callout */}
          <motion.div
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.35 }}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-badge-bg rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">📸</span>
              </div>
              <div>
                <p className="text-sm font-bold text-gray-500 font-body uppercase tracking-wide mb-1">
                  For Families
                </p>
                <h3 className="text-lg font-bold font-heading text-gray-800 mb-2">
                  Bring a family photo for our classroom
                </h3>
                <p className="text-sm text-gray-600 font-body leading-relaxed">
                  As we begin the school year, Miss Joy would love each family to bring in a family photo. We&apos;ll use them to make our classroom feel a little more warm, cozy, and connected to home. If a child is feeling overwhelmed, missing home, or needs a moment to re-regulate, a familiar picture nearby can help them feel safe, grounded, and seen.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Photo Highlights */}
      <section className="pb-16 px-8 sm:px-12 lg:px-16">
        <div className="max-w-5xl mx-auto">
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-block px-5 py-1.5 bg-badge-bg text-black text-sm font-semibold rounded-full mb-4 font-body">
              Photo Highlights
            </span>
            <h2 className="text-2xl md:text-3xl font-bold font-heading text-gray-800 mb-2">
              Moments from the Finale
            </h2>
            <p className="text-sm text-gray-500 font-body">
              Click any photo to open the full gallery.
            </p>
          </motion.div>

          {/* Mobile: horizontal snap scroll */}
          <div className="sm:hidden overflow-x-auto flex snap-x snap-mandatory gap-3 pb-4 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
            {WEEK_IMAGES.map((img, i) => (
              <motion.button
                key={i}
                className="relative w-[78%] flex-shrink-0 snap-start aspect-[4/3] rounded-xl overflow-hidden shadow-md cursor-pointer"
                onClick={() => setLightboxIndex(i)}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.03 }}
              >
                <Image
                  src={img.src}
                  alt={img.caption}
                  fill
                  className="object-cover"
                  sizes="78vw"
                />
                <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/65 to-transparent" />
                <p className="absolute bottom-2 left-3 right-3 text-white text-xs font-semibold font-body leading-tight line-clamp-2">
                  {img.caption}
                </p>
              </motion.button>
            ))}
          </div>

          {/* Desktop: 3-column grid */}
          <div className="hidden sm:grid grid-cols-3 gap-3">
            {WEEK_IMAGES.map((img, i) => (
              <motion.button
                key={i}
                className="relative aspect-[4/3] rounded-xl overflow-hidden shadow-md cursor-pointer group"
                onClick={() => setLightboxIndex(i)}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: (i % 3) * 0.08 }}
              >
                <Image
                  src={img.src}
                  alt={img.caption}
                  fill
                  className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
                  sizes="(max-width: 1280px) 33vw, 400px"
                />
                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/65 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <p className="absolute bottom-2 left-3 right-3 text-white text-xs font-semibold font-body leading-tight line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  {img.caption}
                </p>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="pb-16 px-8 sm:px-12 lg:px-16">
        <div className="max-w-3xl mx-auto">
          <motion.div
            className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-block px-5 py-1.5 bg-badge-bg text-black text-sm font-semibold rounded-full mb-4 font-body">
              Join Us
            </span>
            <h2 className="text-2xl font-bold font-heading text-gray-800 mb-2">
              Want to join us this school year?
            </h2>
            <p className="text-gray-500 font-body text-sm mb-7 max-w-md mx-auto">
              Summer camp is wrapped — and enrollment is open for School Year 2026–2027. Come see the campus for yourself. We&apos;d love to meet your family.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => router.push("/apply")}
                className="px-8 py-4 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-colors duration-200 shadow-md hover:shadow-lg font-body cursor-pointer"
              >
                Enroll Now →
              </button>
              <button
                onClick={() => router.push("/tour")}
                className="px-8 py-4 border-2 border-gray-200 text-gray-600 font-semibold rounded-lg hover:border-primary hover:text-primary transition-colors duration-200 font-body cursor-pointer"
              >
                🏡 Tour the Campus
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />

      <div className="hidden lg:block">
        <FloatingSMSButton />
      </div>

      {lightboxIndex !== null && (
        <ImageLightbox
          images={lightboxImages}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  );
}
