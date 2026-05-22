"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Newspaper, X, ChevronDown } from "lucide-react";
import type { DBNewsletter, DBSectionImage } from "@/app/actions/newsletter";

// ── Image grid helpers ────────────────────────────────────────────────────────

function TraditionalImageGrid({ images }: { images: DBSectionImage[] }) {
  if (images.length === 0) return null;

  if (images.length === 1) {
    return (
      <div className="mt-4">
        <img
          src={images[0].signed_url ?? ""}
          alt=""
          className="w-full aspect-video object-cover rounded-2xl"
        />
        <p className="text-xs text-gray-400 font-body mt-1.5">1 photo</p>
      </div>
    );
  }

  if (images.length === 2) {
    return (
      <div className="mt-4">
        <div className="grid grid-cols-2 gap-2">
          {images.map((img) => (
            <img
              key={img.id}
              src={img.signed_url ?? ""}
              alt=""
              className="w-full aspect-video object-cover rounded-2xl"
            />
          ))}
        </div>
        <p className="text-xs text-gray-400 font-body mt-1.5">2 photos</p>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div className="grid grid-cols-3 gap-2">
        {images.map((img) => (
          <img
            key={img.id}
            src={img.signed_url ?? ""}
            alt=""
            className="w-full aspect-video object-cover rounded-2xl"
          />
        ))}
      </div>
      <p className="text-xs text-gray-400 font-body mt-1.5">{images.length} photos</p>
    </div>
  );
}

function ImageCarousel({
  images,
  sectionLabel,
  externalImgIdx,
  onImgIdxChange,
}: {
  images: DBSectionImage[];
  sectionLabel: string;
  externalImgIdx: number;
  onImgIdxChange: (idx: number) => void;
}) {
  const touchStartX = useRef<number | null>(null);

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < 40) return;
    if (delta < 0) onImgIdxChange(Math.min(externalImgIdx + 1, images.length - 1));
    else onImgIdxChange(Math.max(externalImgIdx - 1, 0));
  }

  if (images.length === 0) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-[#4a7c59] to-[#2e5240] flex items-center justify-center">
        <div className="text-center px-8">
          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
            <Newspaper className="w-6 h-6 text-white/60" />
          </div>
          <h2 className="text-3xl font-heading font-bold text-white leading-tight drop-shadow-sm">
            {sectionLabel}
          </h2>
        </div>
      </div>
    );
  }

  const current = images[externalImgIdx];

  return (
    <div className="relative w-full h-full overflow-hidden select-none" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      {/* blurred ambient background */}
      <div
        className="absolute inset-0 scale-110"
        style={{
          backgroundImage: `url(${current.signed_url ?? ""})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(24px) brightness(0.35) saturate(1.4)",
        }}
      />

      {/* main image */}
      <div className="relative w-full h-full flex items-center justify-center">
        <img
          key={current.id}
          src={current.signed_url ?? ""}
          alt=""
          className="max-w-full max-h-full object-contain"
          style={{ transition: "opacity 0.25s ease" }}
        />
      </div>

      {/* prev / next arrows */}
      {images.length > 1 && (
        <>
          <button
            onClick={() => onImgIdxChange(Math.max(externalImgIdx - 1, 0))}
            disabled={externalImgIdx === 0}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white/80 hover:bg-black/60 hover:text-white disabled:opacity-0 transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => onImgIdxChange(Math.min(externalImgIdx + 1, images.length - 1))}
            disabled={externalImgIdx === images.length - 1}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white/80 hover:bg-black/60 hover:text-white disabled:opacity-0 transition-all"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* image counter badge */}
      {images.length > 1 && (
        <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm text-white/80 text-xs font-body font-semibold px-2.5 py-1 rounded-full">
          {externalImgIdx + 1} / {images.length}
        </div>
      )}

      {/* dot indicators */}
      {images.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => onImgIdxChange(i)}
              className={`rounded-full transition-all duration-300 ${
                i === externalImgIdx
                  ? "w-5 h-1.5 bg-white"
                  : "w-1.5 h-1.5 bg-white/35 hover:bg-white/60"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Section shape for rendering ───────────────────────────────────────────────

interface RenderSection {
  id: string;
  label: string;
  body: string;
  images: DBSectionImage[];
}

// ── Traditional layout ────────────────────────────────────────────────────────

function TraditionalNewsletter({ newsletter, sections }: { newsletter: DBNewsletter; sections: RenderSection[] }) {
  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-md overflow-hidden">
        <div className="bg-[#4a7c59] px-8 py-8 flex items-start justify-between">
          <div className="flex-1">
            <p className="text-[#c8dfcb] text-xs font-semibold uppercase tracking-widest font-body mb-2">
              Sage Field School
            </p>
            <h1 className="text-3xl font-bold font-heading text-white leading-tight">
              {newsletter.title || "Weekly Newsletter"}
            </h1>
            <p className="text-[#c8dfcb] text-sm font-body mt-2">{newsletter.week_range}</p>
          </div>
          <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 ml-6">
            <Newspaper className="w-7 h-7 text-white" />
          </div>
        </div>

        <div className="px-8 py-6 space-y-8">
          {sections.map((section, idx) => (
            <div key={section.id}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-1 h-6 rounded-full bg-[#4a7c59] flex-shrink-0" />
                <h2 className="text-lg font-bold font-heading text-gray-900">
                  {section.label || "Untitled Section"}
                </h2>
              </div>
              {section.body ? (
                <p className="text-base font-body text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {section.body}
                </p>
              ) : (
                <p className="text-base font-body text-gray-400 italic">No content yet.</p>
              )}
              <TraditionalImageGrid images={section.images} />
              {idx < sections.length - 1 && <div className="mt-8 border-b border-gray-100" />}
            </div>
          ))}
        </div>

        <div className="bg-gray-50 border-t border-gray-100 px-8 py-5 flex items-center justify-between">
          <p className="text-xs text-gray-500 font-body">
            Sage Field School &middot; {newsletter.week_range}
          </p>
          <p className="text-xs text-gray-400 font-body">school@sagefield.com</p>
        </div>
      </div>
    </div>
  );
}

// ── Slideshow layout ──────────────────────────────────────────────────────────

function SlideshowNewsletter({ sections }: { sections: RenderSection[] }) {
  const [slideIdx, setSlideIdx] = useState(0);
  const [imgIdx, setImgIdx] = useState(0);
  const [visible, setVisible] = useState(true);
  const slideRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const total = sections.length;
  const slide = sections[slideIdx];

  const prev = useCallback(() => {
    setVisible(false);
    setTimeout(() => {
      setSlideIdx((i) => Math.max(i - 1, 0));
      setImgIdx(0);
      setVisible(true);
    }, 180);
  }, []);

  const next = useCallback(() => {
    setVisible(false);
    setTimeout(() => {
      setSlideIdx((i) => Math.min(i + 1, total - 1));
      setImgIdx(0);
      setVisible(true);
    }, 180);
  }, [total]);

  const goTo = useCallback((i: number) => {
    if (i === slideIdx) return;
    setVisible(false);
    setTimeout(() => {
      setSlideIdx(i);
      setImgIdx(0);
      setVisible(true);
    }, 180);
  }, [slideIdx]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowUp") setImgIdx((i) => Math.max(i - 1, 0));
      else if (e.key === "ArrowDown") setImgIdx((i) => Math.min(i + 1, (slide?.images.length ?? 1) - 1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prev, next, slide]);

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < 50) return;
    if (delta < 0) next();
    else prev();
  }

  if (!slide) return null;

  const progressPct = total > 1 ? (slideIdx / (total - 1)) * 100 : 100;

  return (
    <div
      className="h-full flex flex-col md:flex-row overflow-hidden select-none relative"
      style={{ background: "linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)" }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* ── Progress bar ── */}
      <div className="absolute top-0 left-0 right-0 h-[3px] z-20 bg-white/5">
        <div
          className="h-full bg-[#4a7c59] transition-all duration-500 ease-out"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* ── Top nav strip (mobile) ── */}
      <div className="md:hidden flex items-center gap-2 px-4 pt-5 pb-3 z-10">
        <button
          onClick={prev}
          disabled={slideIdx === 0}
          className="w-8 h-8 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white/70 hover:bg-white/20 disabled:opacity-20 transition-all flex-shrink-0"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 flex items-center justify-center gap-1.5">
          {sections.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`rounded-full transition-all duration-300 ${
                i === slideIdx ? "w-5 h-1.5 bg-[#4a7c59]" : "w-1.5 h-1.5 bg-white/25 hover:bg-white/50"
              }`}
            />
          ))}
        </div>
        <span className="text-xs font-body font-semibold text-white/30 flex-shrink-0 min-w-[32px] text-right">
          {slideIdx + 1} / {total}
        </span>
        <button
          onClick={next}
          disabled={slideIdx === total - 1}
          className="w-8 h-8 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white/70 hover:bg-white/20 disabled:opacity-20 transition-all flex-shrink-0"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* ── Image area ── */}
      <div
        ref={slideRef}
        className="w-full md:w-[60%] flex-shrink-0 md:h-full h-[55vw] min-h-[240px] max-h-[60vh] md:max-h-none relative"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateX(0)" : "translateX(-12px)",
          transition: "opacity 0.2s ease, transform 0.2s ease",
        }}
      >
        <ImageCarousel
          images={slide.images}
          sectionLabel={slide.label}
          externalImgIdx={imgIdx}
          onImgIdxChange={setImgIdx}
        />
      </div>

      {/* ── Text panel ── */}
      <div
        className="flex-1 flex flex-col md:h-full overflow-y-auto"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateX(0)" : "translateX(12px)",
          transition: "opacity 0.2s ease 0.04s, transform 0.2s ease 0.04s",
        }}
      >
        {/* Desktop nav strip */}
        <div className="hidden md:flex items-center gap-3 px-8 pt-6 pb-4 flex-shrink-0">
          <button
            onClick={prev}
            disabled={slideIdx === 0}
            className="w-9 h-9 rounded-full bg-white/8 border border-white/10 flex items-center justify-center text-white/60 hover:bg-white/15 hover:text-white disabled:opacity-20 transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-1.5">
            {sections.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`rounded-full transition-all duration-300 ${
                  i === slideIdx ? "w-5 h-1.5 bg-[#4a7c59]" : "w-1.5 h-1.5 bg-white/20 hover:bg-white/45"
                }`}
              />
            ))}
          </div>
          <span className="text-xs font-body font-semibold text-white/25 ml-1">
            {slideIdx + 1} / {total}
          </span>
          <button
            onClick={next}
            disabled={slideIdx === total - 1}
            className="w-9 h-9 rounded-full bg-white/8 border border-white/10 flex items-center justify-center text-white/60 hover:bg-white/15 hover:text-white disabled:opacity-20 transition-all ml-auto"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Section content */}
        <div className="flex-1 px-6 md:px-8 pb-6 md:pb-10 pt-4 md:pt-2 flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1 h-7 rounded-full bg-[#4a7c59] flex-shrink-0" />
            <h2 className="text-xl md:text-2xl font-bold font-heading text-white leading-tight">
              {slide.label || "Untitled Section"}
            </h2>
          </div>
          {slide.body ? (
            <p className="text-sm md:text-base font-body text-white/65 leading-relaxed whitespace-pre-wrap flex-1">
              {slide.body}
            </p>
          ) : (
            <p className="text-base font-body text-white/30 italic flex-1">No content for this section.</p>
          )}
        </div>

        {/* Mobile bottom nav */}
        <div className="md:hidden flex items-center gap-3 px-6 pb-6 pt-2 flex-shrink-0">
          <button
            onClick={prev}
            disabled={slideIdx === 0}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-2xl bg-white/8 border border-white/10 text-white/60 hover:bg-white/15 hover:text-white disabled:opacity-20 transition-all text-sm font-body font-semibold"
          >
            <ChevronLeft className="w-4 h-4" />
            Prev
          </button>
          <button
            onClick={next}
            disabled={slideIdx === total - 1}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-2xl bg-[#4a7c59]/80 border border-[#4a7c59]/40 text-white hover:bg-[#4a7c59] disabled:opacity-20 transition-all text-sm font-body font-semibold"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Preview banner ────────────────────────────────────────────────────────────

function PreviewBanner({
  newsletter,
  allNewsletters,
  viewMode,
  setViewMode,
}: {
  newsletter: DBNewsletter;
  allNewsletters: DBNewsletter[];
  viewMode: "traditional" | "slideshow";
  setViewMode: (v: "traditional" | "slideshow") => void;
}) {
  const router = useRouter();
  const [visible, setVisible] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gray-900/90 backdrop-blur-sm text-white flex items-center gap-4 px-5 py-2.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-gray-400 font-body flex-shrink-0">
        Teacher Preview
      </span>

      {/* Newsletter switcher */}
      <div className="relative flex-shrink-0" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen((o) => !o)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg text-xs font-body font-semibold text-white transition-colors max-w-[220px]"
        >
          <span className="truncate">{newsletter.title}</span>
          <ChevronDown className={`w-3.5 h-3.5 flex-shrink-0 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
        </button>

        {dropdownOpen && (
          <div className="absolute top-full left-0 mt-1.5 w-72 bg-gray-800 border border-gray-600 rounded-xl shadow-xl overflow-hidden z-50">
            {allNewsletters.length === 0 ? (
              <p className="px-3 py-3 text-xs text-gray-400 font-body">No newsletters</p>
            ) : (
              <ul className="max-h-72 overflow-y-auto py-1">
                {allNewsletters.map((nl) => (
                  <li key={nl.id}>
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        router.push(`/teacher/dashboard/newsletter/${nl.id}/preview`);
                      }}
                      className={`w-full text-left px-3 py-2.5 flex items-center justify-between gap-3 hover:bg-gray-700 transition-colors ${
                        nl.id === newsletter.id ? "bg-gray-700/60" : ""
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white font-body truncate">{nl.title}</p>
                        <p className="text-xs text-gray-400 font-body truncate">{nl.week_range}</p>
                      </div>
                      <span className={`text-xs font-semibold font-body flex-shrink-0 ${
                        nl.status === "published" ? "text-green-400" : "text-gray-400"
                      }`}>
                        {nl.status === "published" ? "Published" : "Draft"}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* View mode toggle */}
      <div className="flex rounded-lg overflow-hidden border border-gray-600 text-xs font-body">
        {(["traditional", "slideshow"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setViewMode(m)}
            className={`px-3 py-1.5 capitalize transition-colors ${
              viewMode === m ? "bg-[#4a7c59] text-white font-semibold" : "text-gray-300 hover:bg-gray-700"
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      <p className="text-xs text-gray-500 font-body ml-1 hidden sm:block">
        This is how parents will see the newsletter
      </p>

      <button
        onClick={() => setVisible(false)}
        className="ml-auto p-1 text-gray-400 hover:text-white transition-colors flex-shrink-0"
        title="Dismiss banner"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

interface PreviewClientProps {
  newsletter: DBNewsletter;
  allNewsletters: DBNewsletter[];
}

export default function PreviewClient({ newsletter, allNewsletters }: PreviewClientProps) {
  const [viewMode, setViewMode] = useState<"traditional" | "slideshow">(newsletter.view_mode);

  const visibleSections: RenderSection[] = newsletter.sections
    .filter((s) => s.visible)
    .map((s) => ({
      id: s.id,
      label: s.label,
      body: s.body,
      images: s.images,
    }));

  const BANNER_HEIGHT = 44;

  if (visibleSections.length === 0) {
    return (
      <>
        <PreviewBanner
          newsletter={newsletter}
          allNewsletters={allNewsletters}
          viewMode={viewMode}
          setViewMode={setViewMode}
        />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center" style={{ paddingTop: BANNER_HEIGHT }}>
          <div className="text-center max-w-xs">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Newspaper className="w-7 h-7 text-gray-400" />
            </div>
            <p className="text-gray-700 font-semibold font-heading mb-1">No visible sections</p>
            <p className="text-sm text-gray-400 font-body">
              All sections are hidden. Toggle visibility in the editor.
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PreviewBanner
        newsletter={newsletter}
        allNewsletters={allNewsletters}
        viewMode={viewMode}
        setViewMode={setViewMode}
      />
      <div style={{ paddingTop: BANNER_HEIGHT }}>
        {viewMode === "traditional" ? (
          <TraditionalNewsletter newsletter={newsletter} sections={visibleSections} />
        ) : (
          <div style={{ height: `calc(100vh - ${BANNER_HEIGHT}px)`, position: "relative" }}>
            <SlideshowNewsletter sections={visibleSections} />
          </div>
        )}
      </div>
    </>
  );
}
