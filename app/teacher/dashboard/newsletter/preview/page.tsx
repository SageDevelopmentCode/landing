"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight, Newspaper, X } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface LocalImage {
  id: string;
  url: string;
  name: string;
}

interface SectionData {
  id: string;
  label: string;
  body: string;
  images: LocalImage[];
}

interface NewsletterData {
  title: string;
  weekLabel: string;
  viewMode: "traditional" | "slideshow";
  sections: SectionData[];
}

// ── Image grid helpers ────────────────────────────────────────────────────────

function TraditionalImageGrid({ images }: { images: LocalImage[] }) {
  if (images.length === 0) return null;

  if (images.length === 1) {
    return (
      <div className="mt-4">
        <img
          src={images[0].url}
          alt={images[0].name}
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
              src={img.url}
              alt={img.name}
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
            src={img.url}
            alt={img.name}
            className="w-full aspect-video object-cover rounded-2xl"
          />
        ))}
      </div>
      <p className="text-xs text-gray-400 font-body mt-1.5">{images.length} photos</p>
    </div>
  );
}

function SlideshowImageGrid({ images, sectionLabel }: { images: LocalImage[]; sectionLabel: string }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const imageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setActiveIdx(0);
  }, [images]);

  useEffect(() => {
    if (images.length <= 1) return;
    const container = containerRef.current;
    if (!container) return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = imageRefs.current.indexOf(entry.target as HTMLDivElement);
            if (idx !== -1) setActiveIdx(idx);
          }
        }
      },
      { root: container, threshold: 0.5 }
    );
    imageRefs.current.forEach((el) => el && obs.observe(el));
    return () => obs.disconnect();
  }, [images]);

  if (images.length === 0) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-[#4a7c59] to-[#3d6b4a] flex items-center justify-center">
        <h2 className="text-4xl font-heading font-bold text-white text-center px-8 leading-tight drop-shadow-sm">
          {sectionLabel}
        </h2>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex">
      {/* Main scrollable image column */}
      <div ref={containerRef} className="flex-1 overflow-y-auto bg-black flex flex-col gap-1 p-2">
        {images.map((img, i) => (
          <div key={img.id} ref={(el) => { imageRefs.current[i] = el; }}>
            <img src={img.url} alt={img.name} className="w-full object-contain rounded-lg" />
          </div>
        ))}
      </div>

      {/* Vertical thumbnail strip — only when 2+ images */}
      {images.length > 1 && (
        <div className="w-16 flex-shrink-0 overflow-y-auto flex flex-col gap-1.5 py-2 px-1 bg-black/80">
          {images.map((img, i) => (
            <button
              key={img.id}
              onClick={() => imageRefs.current[i]?.scrollIntoView({ behavior: "smooth", block: "start" })}
              className={`w-full aspect-square rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all ${
                activeIdx === i
                  ? "border-white/80 opacity-100"
                  : "border-white/20 opacity-50 hover:opacity-75"
              }`}
            >
              <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Traditional layout ────────────────────────────────────────────────────────

function TraditionalNewsletter({ data }: { data: NewsletterData }) {
  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-md overflow-hidden">
        {/* Header band */}
        <div className="bg-[#4a7c59] px-8 py-8 flex items-start justify-between">
          <div className="flex-1">
            <p className="text-[#c8dfcb] text-xs font-semibold uppercase tracking-widest font-body mb-2">
              Sage Field School
            </p>
            <h1 className="text-3xl font-bold font-heading text-white leading-tight">
              {data.title || "Weekly Newsletter"}
            </h1>
            <p className="text-[#c8dfcb] text-sm font-body mt-2">{data.weekLabel}</p>
          </div>
          <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 ml-6">
            <Newspaper className="w-7 h-7 text-white" />
          </div>
        </div>

        {/* Sections */}
        <div className="px-8 py-6 space-y-8">
          {data.sections.map((section, idx) => (
            <div key={section.id}>
              {/* Section heading */}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-1 h-6 rounded-full bg-[#4a7c59] flex-shrink-0" />
                <h2 className="text-lg font-bold font-heading text-gray-900">
                  {section.label || "Untitled Section"}
                </h2>
              </div>

              {/* Body */}
              {section.body ? (
                <p className="text-base font-body text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {section.body}
                </p>
              ) : (
                <p className="text-base font-body text-gray-400 italic">No content yet.</p>
              )}

              {/* Image grid */}
              <TraditionalImageGrid images={section.images} />

              {/* Divider between sections (not after last) */}
              {idx < data.sections.length - 1 && (
                <div className="mt-8 border-b border-gray-100" />
              )}
            </div>
          ))}
        </div>

        {/* Footer band */}
        <div className="bg-gray-50 border-t border-gray-100 px-8 py-5 flex items-center justify-between">
          <p className="text-xs text-gray-500 font-body">
            Sage Field School &middot; {data.weekLabel}
          </p>
          <p className="text-xs text-gray-400 font-body">school@sagefield.com</p>
        </div>
      </div>
    </div>
  );
}

// ── Slideshow layout ──────────────────────────────────────────────────────────

function SlideshowNewsletter({ data }: { data: NewsletterData }) {
  const [slideIdx, setSlideIdx] = useState(0);
  const total = data.sections.length;
  const slide = data.sections[slideIdx];

  const prev = useCallback(() => setSlideIdx((i) => (i - 1 + total) % total), [total]);
  const next = useCallback(() => setSlideIdx((i) => (i + 1) % total), [total]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prev, next]);

  if (!slide) return null;

  return (
    <div className="h-screen flex flex-row bg-black overflow-hidden select-none relative">
      {/* Left panel — photo grid (55%) */}
      <div className="relative overflow-hidden" style={{ width: "55%" }}>
        <SlideshowImageGrid images={slide.images} sectionLabel={slide.label} />
      </div>

      {/* Right panel — text content (45%) */}
      <div className="bg-white flex flex-col px-10 py-8 overflow-y-auto" style={{ width: "45%" }}>
        <h2 className="text-2xl font-bold font-heading text-gray-900 mb-4">
          {slide.label || "Untitled Section"}
        </h2>
        {slide.body ? (
          <p className="text-base font-body text-gray-600 leading-relaxed">
            {slide.body}
          </p>
        ) : (
          <p className="text-base font-body text-gray-400 italic">No content for this section.</p>
        )}
      </div>

      {/* Floating nav footer — bottom-right of the whole slide */}
      <div className="absolute bottom-6 right-6 z-10 flex items-center gap-3 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-2xl shadow-lg px-4 py-2.5">
        <button
          onClick={prev}
          className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-[#4a7c59] transition-colors rounded-lg hover:bg-gray-100"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-1.5">
          {data.sections.map((_, i) => (
            <button
              key={i}
              onClick={() => setSlideIdx(i)}
              className={`h-2 rounded-full transition-all ${
                i === slideIdx ? "w-5 bg-[#4a7c59]" : "w-2 bg-gray-300 hover:bg-gray-400"
              }`}
            />
          ))}
        </div>

        <span className="text-xs font-semibold font-body text-gray-400 min-w-[32px] text-center">
          {slideIdx + 1} / {total}
        </span>

        <button
          onClick={next}
          className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-[#4a7c59] transition-colors rounded-lg hover:bg-gray-100"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

// ── Preview banner ────────────────────────────────────────────────────────────

function PreviewBanner({
  viewMode,
  setViewMode,
}: {
  viewMode: "traditional" | "slideshow";
  setViewMode: (v: "traditional" | "slideshow") => void;
}) {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gray-900/90 backdrop-blur-sm text-white flex items-center gap-4 px-5 py-2.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-gray-400 font-body">
        Teacher Preview
      </span>

      <div className="flex rounded-lg overflow-hidden border border-gray-600 text-xs font-body ml-2">
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

      <p className="text-xs text-gray-500 font-body ml-1">
        This is how parents will see the newsletter
      </p>

      <button
        onClick={() => setVisible(false)}
        className="ml-auto p-1 text-gray-400 hover:text-white transition-colors"
        title="Dismiss banner"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function NewsletterPreviewPage() {
  const [data, setData] = useState<NewsletterData | null>(null);
  const [viewMode, setViewMode] = useState<"traditional" | "slideshow">("traditional");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("newsletter-preview");
      if (raw) {
        const parsed: NewsletterData = JSON.parse(raw);
        setData(parsed);
        setViewMode(parsed.viewMode ?? "traditional");
      }
    } catch {
      // malformed data — show empty state
    }
    setLoaded(true);
  }, []);

  if (!loaded) return null;

  if (!data || data.sections.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-xs">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Newspaper className="w-7 h-7 text-gray-400" />
          </div>
          <p className="text-gray-700 font-semibold font-heading mb-1">No newsletter data</p>
          <p className="text-sm text-gray-400 font-body">
            Open preview from the Publish tab in the newsletter editor.
          </p>
        </div>
      </div>
    );
  }

  const BANNER_HEIGHT = 44;

  return (
    <>
      <PreviewBanner viewMode={viewMode} setViewMode={setViewMode} />

      <div style={{ paddingTop: BANNER_HEIGHT }}>
        {viewMode === "traditional" ? (
          <TraditionalNewsletter data={{ ...data, viewMode }} />
        ) : (
          <div style={{ height: `calc(100vh - ${BANNER_HEIGHT}px)`, position: "relative" }}>
            <SlideshowNewsletter data={{ ...data, viewMode }} />
          </div>
        )}
      </div>
    </>
  );
}
