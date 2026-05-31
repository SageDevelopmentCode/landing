"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Newspaper, X, ChevronDown } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import type { DBNewsletter, DBSectionImage, DBTeacherUpdate } from "@/app/actions/newsletter";

const markdownComponents = {
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="text-base font-body text-gray-700 leading-relaxed mb-2 last:mb-0">{children}</p>
  ),
  strong: ({ children }: { children?: React.ReactNode }) => (
    <strong className="font-semibold text-gray-900">{children}</strong>
  ),
  em: ({ children }: { children?: React.ReactNode }) => (
    <em className="italic">{children}</em>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="list-disc pl-5 my-2 space-y-1 text-base font-body text-gray-700">{children}</ul>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <ol className="list-decimal pl-5 my-2 space-y-1 text-base font-body text-gray-700">{children}</ol>
  ),
  li: ({ children }: { children?: React.ReactNode }) => (
    <li className="leading-relaxed">{children}</li>
  ),
  a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-[#4a7c59] underline hover:text-[#3d6b4a]">{children}</a>
  ),
  br: () => <br />,
  hr: () => <hr className="my-4 border-t border-gray-200" />,
};

const markdownComponentsDark = {
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="text-sm md:text-base font-body text-white/65 leading-relaxed mb-2 last:mb-0">{children}</p>
  ),
  strong: ({ children }: { children?: React.ReactNode }) => (
    <strong className="font-semibold text-white/90">{children}</strong>
  ),
  em: ({ children }: { children?: React.ReactNode }) => (
    <em className="italic">{children}</em>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="list-disc pl-5 my-2 space-y-1 text-sm md:text-base font-body text-white/65">{children}</ul>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <ol className="list-decimal pl-5 my-2 space-y-1 text-sm md:text-base font-body text-white/65">{children}</ol>
  ),
  li: ({ children }: { children?: React.ReactNode }) => (
    <li className="leading-relaxed">{children}</li>
  ),
  a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-[#7ec89a] underline hover:text-[#a8dbb8]">{children}</a>
  ),
  br: () => <br />,
  hr: () => <hr className="my-4 border-t border-white/20" />,
};

// ── Image grid helpers ────────────────────────────────────────────────────────

function NewsletterImageLightbox({
  images,
  initialIndex,
  onClose,
}: {
  images: DBSectionImage[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(initialIndex);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") setIdx((i) => Math.max(0, i - 1));
      if (e.key === "ArrowRight") setIdx((i) => Math.min(images.length - 1, i + 1));
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, images.length]);

  const image = images[idx];

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/90 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 text-white/70 hover:text-white transition-colors"
      >
        <X className="w-5 h-5" />
      </button>

      <button
        onClick={() => setIdx((i) => Math.max(0, i - 1))}
        disabled={idx === 0}
        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 text-white/70 hover:text-white disabled:opacity-20 disabled:cursor-default transition-colors"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      <button
        onClick={() => setIdx((i) => Math.min(images.length - 1, i + 1))}
        disabled={idx === images.length - 1}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-white/70 hover:text-white disabled:opacity-20 disabled:cursor-default transition-colors"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {image.signed_url && (
        <img
          key={image.id}
          src={image.signed_url}
          alt=""
          className="max-h-[90vh] max-w-[80vw] object-contain"
        />
      )}

      {images.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm text-white/80 text-xs font-body font-semibold px-2.5 py-1 rounded-full pointer-events-none">
          {idx + 1} / {images.length}
        </div>
      )}
    </div>
  );
}

function TraditionalImageGrid({ images }: { images: DBSectionImage[] }) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  if (images.length === 0) return null;

  if (images.length === 1) {
    return (
      <div className="mt-4">
        <img
          src={images[0].signed_url ?? ""}
          alt=""
          className="w-full h-56 object-cover cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => setLightboxIdx(0)}
        />
        <p className="text-xs text-gray-400 font-body mt-1.5">1 photo</p>
        {lightboxIdx !== null && (
          <NewsletterImageLightbox images={images} initialIndex={lightboxIdx} onClose={() => setLightboxIdx(null)} />
        )}
      </div>
    );
  }

  if (images.length === 2) {
    return (
      <div className="mt-4">
        <div className="grid grid-cols-2 gap-0.5">
          {images.map((img, i) => (
            <img
              key={img.id}
              src={img.signed_url ?? ""}
              alt=""
              className="w-full h-56 object-cover cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => setLightboxIdx(i)}
            />
          ))}
        </div>
        <p className="text-xs text-gray-400 font-body mt-1.5">2 photos</p>
        {lightboxIdx !== null && (
          <NewsletterImageLightbox images={images} initialIndex={lightboxIdx} onClose={() => setLightboxIdx(null)} />
        )}
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div className="grid grid-cols-3 gap-0.5">
        {images.map((img, i) => (
          <img
            key={img.id}
            src={img.signed_url ?? ""}
            alt=""
            className="w-full h-56 object-cover cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => setLightboxIdx(i)}
          />
        ))}
      </div>
      <p className="text-xs text-gray-400 font-body mt-1.5">{images.length} photos</p>
      {lightboxIdx !== null && (
        <NewsletterImageLightbox images={images} initialIndex={lightboxIdx} onClose={() => setLightboxIdx(null)} />
      )}
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
  isClassUpdates: boolean;
  teacherUpdates: DBTeacherUpdate[];
}

// ── Week parsing + calendar helpers ──────────────────────────────────────────

const MONTH_MAP: Record<string, number> = {
  january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
  july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
  jan: 0, feb: 1, mar: 2, apr: 3, jun: 5, jul: 6, aug: 7,
  sep: 8, oct: 9, nov: 10, dec: 11,
};

const DAY_ABBRS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

function parseWeekDays(week_range: string): Array<{ abbr: string; day: number; date: Date }> {
  // e.g. "May 26 – May 30" or "May 26 - May 30"
  const parts = week_range.split(/[–—-]/).map((s) => s.trim());
  if (parts.length < 2) return [];

  function parseDatePart(s: string): Date | null {
    const tokens = s.split(/\s+/);
    if (tokens.length < 2) return null;
    const monthStr = tokens[0].toLowerCase().replace(/[.,]/, "");
    const dayNum = parseInt(tokens[1], 10);
    const monthIdx = MONTH_MAP[monthStr];
    if (monthIdx === undefined || isNaN(dayNum)) return null;
    const year = new Date().getFullYear();
    return new Date(year, monthIdx, dayNum);
  }

  const startDate = parseDatePart(parts[0]);
  const endDate = parseDatePart(parts[1]);
  if (!startDate || !endDate) return [];

  const days: Array<{ abbr: string; day: number; date: Date }> = [];
  const cur = new Date(startDate);
  while (cur <= endDate && days.length < 7) {
    days.push({
      abbr: DAY_ABBRS[cur.getDay()],
      day: cur.getDate(),
      date: new Date(cur),
    });
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

const PLACEHOLDER_EVENTS: string[][] = [
  ["Morning Circle", "Reading Groups"],
  ["Art & Craft", "Outdoor Exploration"],
  ["Field Trip", "Story Time"],
  ["Science Lab", "Music & Movement"],
  ["Show & Tell", "Garden Club"],
  ["Nature Walk", "Free Play"],
  ["Journaling", "Drama Club"],
];

const EVENT_COLORS = [
  { bg: "bg-[#4a7c59]/80", text: "text-white" },
  { bg: "bg-[#d4882a]/80", text: "text-white" },
  { bg: "bg-[#5b7fa6]/80", text: "text-white" },
  { bg: "bg-[#7a5c9e]/80", text: "text-white" },
  { bg: "bg-[#c04a3e]/80", text: "text-white" },
];

function WeekCalendarStrip({ days }: { days: ReturnType<typeof parseWeekDays> }) {
  if (days.length === 0) return null;

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;

  return (
    <div className="mt-5 rounded-2xl overflow-hidden" style={{ background: "rgba(0,0,0,0.22)" }}>
      <div className="flex divide-x divide-white/10">
        {days.map((d, i) => {
          const isToday =
            `${d.date.getFullYear()}-${d.date.getMonth()}-${d.date.getDate()}` === todayStr;
          const events = PLACEHOLDER_EVENTS[i % PLACEHOLDER_EVENTS.length];
          return (
            <div
              key={i}
              className={`flex-1 flex flex-col items-center px-1 py-3 min-w-0 ${isToday ? "bg-white/10" : ""}`}
            >
              <span className="text-[9px] font-body font-bold uppercase tracking-widest text-white/45 mb-1">
                {d.abbr}
              </span>
              <div
                className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-heading font-bold mb-2 ${
                  isToday
                    ? "bg-white text-[#2d5a3d] ring-2 ring-white/60 ring-offset-1 ring-offset-transparent"
                    : "text-white"
                }`}
              >
                {d.day}
              </div>
              <div className="flex flex-col gap-1 w-full px-1">
                {events.map((ev, j) => {
                  const color = EVENT_COLORS[(i + j) % EVENT_COLORS.length];
                  return (
                    <span
                      key={j}
                      className={`text-[9px] font-body font-semibold leading-tight rounded-md px-1.5 py-0.5 truncate text-center ${color.bg} ${color.text}`}
                    >
                      {ev}
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Traditional layout ────────────────────────────────────────────────────────

function TraditionalNewsletter({ newsletter, sections }: { newsletter: DBNewsletter; sections: RenderSection[] }) {
  const weekDays = parseWeekDays(newsletter.week_range);

  return (
    <div className="min-h-screen bg-[#f0f4f1] py-10 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-lg overflow-hidden">

        {/* ── Hero Banner ── */}
        <div
          className="relative px-8 pt-8 pb-7 overflow-hidden"
          style={{
            background: "linear-gradient(140deg, #1e4a2e 0%, #2d5a3d 45%, #3d7a52 100%)",
          }}
        >
          {/* Subtle radial glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "radial-gradient(ellipse 80% 60% at 30% 40%, rgba(100,180,120,0.13) 0%, transparent 70%)",
            }}
          />

          {/* Decorative leaf SVG — top right */}
          <svg
            className="absolute top-0 right-0 opacity-[0.07] pointer-events-none"
            width="200"
            height="180"
            viewBox="0 0 200 180"
            fill="none"
          >
            <ellipse cx="140" cy="40" rx="80" ry="50" fill="white" transform="rotate(-30 140 40)" />
            <ellipse cx="160" cy="120" rx="70" ry="45" fill="white" transform="rotate(20 160 120)" />
            <ellipse cx="60" cy="130" rx="90" ry="40" fill="white" transform="rotate(-15 60 130)" />
          </svg>

          {/* Top row: logo + school name + week badge */}
          <div className="relative flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 relative flex-shrink-0" style={{ filter: "brightness(0) invert(1) opacity(0.9)" }}>
                <Image
                  src="/assets/Logo.png"
                  alt="Sage Field School"
                  width={36}
                  height={36}
                  className="object-contain"
                />
              </div>
              <p className="text-white/70 text-[11px] font-semibold uppercase tracking-[0.18em] font-body">
                Sage Field School
              </p>
            </div>
            <div className="flex-shrink-0">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-body font-semibold bg-white/15 text-white/80 border border-white/20 backdrop-blur-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-[#7ec89a] inline-block" />
                {newsletter.status === "published" ? "Published" : "Draft"}
              </span>
            </div>
          </div>

          {/* Title + date */}
          <div className="relative mb-5">
            <h1
              className="text-[2rem] font-bold font-heading text-white leading-tight"
              style={{ textShadow: "0 2px 12px rgba(0,0,0,0.25)" }}
            >
              {newsletter.title || "Weekly Newsletter"}
            </h1>
            <p className="text-[#a8d4b4] text-sm font-body mt-1.5 flex items-center gap-2">
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" className="flex-shrink-0 opacity-70">
                <rect x="1" y="2" width="11" height="10" rx="2" stroke="currentColor" strokeWidth="1.2" />
                <path d="M4 1v2M9 1v2M1 5h11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
              {newsletter.week_range}
            </p>
          </div>

          {/* Weekly calendar strip */}
          <div className="relative">
            <WeekCalendarStrip days={weekDays} />
          </div>
        </div>

        {/* ── Sections ── */}
        <div className="px-8 py-6 space-y-8">
          {sections.map((section, idx) => (
            <div key={section.id}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-1 h-6 rounded-full bg-[#4a7c59] flex-shrink-0" />
                <h2 className="text-lg font-bold font-heading text-gray-900">
                  {section.label || "Untitled Section"}
                </h2>
              </div>
              {section.isClassUpdates ? (
                section.teacherUpdates.some((tu) => tu.body?.trim()) ? (
                  <div className="space-y-4">
                    {section.teacherUpdates
                      .filter((tu) => tu.body?.trim())
                      .map((tu) => (
                        <div key={tu.teacher_id} className="flex gap-3">
                          {tu.teacher_avatar ? (
                            <img src={tu.teacher_avatar} className="w-8 h-8 rounded-full object-cover flex-shrink-0" alt="" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-[#4a7c59]/20 flex-shrink-0 flex items-center justify-center text-[#4a7c59] text-xs font-bold">
                              {tu.teacher_name?.[0] ?? "?"}
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-semibold text-gray-700 font-heading mb-1">{tu.teacher_name ?? "Teacher"}</p>
                            <ReactMarkdown components={markdownComponents} remarkPlugins={[remarkBreaks]}>{tu.body}</ReactMarkdown>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-base font-body text-gray-400 italic">No content yet.</p>
                )
              ) : section.body ? (
                <ReactMarkdown components={markdownComponents} remarkPlugins={[remarkBreaks]}>{section.body}</ReactMarkdown>
              ) : (
                <p className="text-base font-body text-gray-400 italic">No content yet.</p>
              )}
              <TraditionalImageGrid images={section.images} />
              {idx < sections.length - 1 && <div className="mt-8 border-b border-gray-100" />}
            </div>
          ))}
        </div>

        {/* ── Footer ── */}
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
          {slide.isClassUpdates ? (
            slide.teacherUpdates.some((tu) => tu.body?.trim()) ? (
              <div className="flex-1 space-y-4">
                {slide.teacherUpdates
                  .filter((tu) => tu.body?.trim())
                  .map((tu) => (
                    <div key={tu.teacher_id} className="flex gap-3">
                      {tu.teacher_avatar ? (
                        <img src={tu.teacher_avatar} className="w-8 h-8 rounded-full object-cover flex-shrink-0" alt="" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-[#4a7c59]/30 flex-shrink-0 flex items-center justify-center text-[#7ec89a] text-xs font-bold">
                          {tu.teacher_name?.[0] ?? "?"}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-semibold text-white/80 font-heading mb-1">{tu.teacher_name ?? "Teacher"}</p>
                        <ReactMarkdown components={markdownComponentsDark} remarkPlugins={[remarkBreaks]}>{tu.body}</ReactMarkdown>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-base font-body text-white/30 italic flex-1">No content for this section.</p>
            )
          ) : slide.body ? (
            <div className="flex-1">
              <ReactMarkdown components={markdownComponentsDark} remarkPlugins={[remarkBreaks]}>{slide.body}</ReactMarkdown>
            </div>
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
      isClassUpdates: s.is_class_updates,
      teacherUpdates: s.teacher_updates ?? [],
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
