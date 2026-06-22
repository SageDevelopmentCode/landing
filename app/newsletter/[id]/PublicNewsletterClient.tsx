"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X, Smile, Users, CalendarDays, Bell, Images, FileText, Lock, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import { verifyNewsletterPassword } from "@/app/actions/newsletter";
import type { DBNewsletter, DBSectionImage, DBTeacherUpdate } from "@/app/actions/newsletter";

// ── Markdown ──────────────────────────────────────────────────────────────────

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

// ── Image helpers ─────────────────────────────────────────────────────────────

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
      className="fixed inset-0 z-[70] bg-black/90 flex items-center justify-center md:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <button onClick={onClose} className="absolute top-4 right-4 p-2 text-white/70 hover:text-white transition-colors">
        <X className="w-5 h-5" />
      </button>

      {/* Desktop side arrows */}
      <button
        onClick={() => setIdx((i) => Math.max(0, i - 1))}
        disabled={idx === 0}
        className="hidden md:block absolute left-4 top-1/2 -translate-y-1/2 p-2 text-white/70 hover:text-white disabled:opacity-20 disabled:cursor-default transition-colors"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button
        onClick={() => setIdx((i) => Math.min(images.length - 1, i + 1))}
        disabled={idx === images.length - 1}
        className="hidden md:block absolute right-4 top-1/2 -translate-y-1/2 p-2 text-white/70 hover:text-white disabled:opacity-20 disabled:cursor-default transition-colors"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {image.signed_url && (
        <img key={image.id} src={image.signed_url} alt="" className="max-h-[80vh] max-w-[96vw] md:max-w-[80vw] object-contain" />
      )}

      {/* Counter + mobile bottom nav */}
      {images.length > 1 && (
        <div className="absolute bottom-6 left-0 right-0 flex items-center justify-center gap-4">
          {/* Mobile prev/next buttons */}
          <button
            onClick={() => setIdx((i) => Math.max(0, i - 1))}
            disabled={idx === 0}
            className="md:hidden w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white/80 hover:text-white disabled:opacity-20 disabled:cursor-default transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="bg-black/50 backdrop-blur-sm text-white/80 text-xs font-body font-semibold px-2.5 py-1 rounded-full pointer-events-none">
            {idx + 1} / {images.length}
          </div>

          <button
            onClick={() => setIdx((i) => Math.min(images.length - 1, i + 1))}
            disabled={idx === images.length - 1}
            className="md:hidden w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white/80 hover:text-white disabled:opacity-20 disabled:cursor-default transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}

function SkeletonImage({ src, className, onClick }: { src: string; className: string; onClick: () => void }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className={`relative overflow-hidden cursor-pointer hover:opacity-90 transition-opacity ${className}`} onClick={onClick}>
      {!loaded && <div className="absolute inset-0 bg-[#e8ede9] animate-pulse" />}
      <img
        src={src}
        alt=""
        loading="lazy"
        onLoad={() => setLoaded(true)}
        className={`w-full h-full object-cover transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
      />
    </div>
  );
}

function TraditionalImageGrid({ images }: { images: DBSectionImage[] }) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  if (images.length === 0) return null;

  if (images.length === 1) {
    return (
      <div className="mt-4">
        <div className="relative overflow-hidden cursor-pointer hover:opacity-90 transition-opacity" onClick={() => setLightboxIdx(0)}>
          <img src={images[0].signed_url ?? ""} alt="" loading="lazy" className="w-full h-auto object-contain" />
        </div>
        <p className="text-xs text-gray-400 font-body mt-1.5">1 photo</p>
        {lightboxIdx !== null && <NewsletterImageLightbox images={images} initialIndex={lightboxIdx} onClose={() => setLightboxIdx(null)} />}
      </div>
    );
  }

  if (images.length === 2) {
    return (
      <div className="mt-4">
        <div className="grid grid-cols-2 gap-0.5">
          {images.map((img, i) => (
            <SkeletonImage key={img.id} src={img.signed_url ?? ""} className="w-full h-52" onClick={() => setLightboxIdx(i)} />
          ))}
        </div>
        <p className="text-xs text-gray-400 font-body mt-1.5">2 photos</p>
        {lightboxIdx !== null && <NewsletterImageLightbox images={images} initialIndex={lightboxIdx} onClose={() => setLightboxIdx(null)} />}
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div className="grid grid-cols-3 gap-0.5">
        {images.map((img, i) => (
          <SkeletonImage key={img.id} src={img.signed_url ?? ""} className="w-full h-40" onClick={() => setLightboxIdx(i)} />
        ))}
      </div>
      <p className="text-xs text-gray-400 font-body mt-1.5">{images.length} photos</p>
      {lightboxIdx !== null && <NewsletterImageLightbox images={images} initialIndex={lightboxIdx} onClose={() => setLightboxIdx(null)} />}
    </div>
  );
}

function SectionIcon({ label }: { label: string }) {
  const l = label.toLowerCase();
  if (l.includes("welcome")) return <Smile className="w-4 h-4 text-[#4a7c59]" />;
  if (l.includes("class") || l.includes("update")) return <Users className="w-4 h-4 text-[#4a7c59]" />;
  if (l.includes("event") || l.includes("upcoming")) return <CalendarDays className="w-4 h-4 text-[#4a7c59]" />;
  if (l.includes("remind")) return <Bell className="w-4 h-4 text-[#4a7c59]" />;
  if (l.includes("photo") || l.includes("gallery")) return <Images className="w-4 h-4 text-[#4a7c59]" />;
  return <FileText className="w-4 h-4 text-[#4a7c59]" />;
}

interface RenderSection {
  id: string;
  label: string;
  body: string;
  images: DBSectionImage[];
  isClassUpdates: boolean;
  teacherUpdates: DBTeacherUpdate[];
}

// ── Collapsible teacher update (mobile) ──────────────────────────────────────

function CollapsibleTeacherUpdate({ tu }: { tu: DBTeacherUpdate }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="flex gap-3">
      {tu.teacher_avatar ? (
        <img src={tu.teacher_avatar} className="w-8 h-8 rounded-full object-cover flex-shrink-0" alt="" />
      ) : (
        <div className="w-8 h-8 rounded-full bg-[#4a7c59]/20 flex-shrink-0 flex items-center justify-center text-[#4a7c59] text-xs font-bold">
          {tu.teacher_name?.[0] ?? "?"}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-700 font-heading mb-1">{tu.teacher_name ?? "Teacher"}</p>
        <div className={!expanded ? "line-clamp-3 md:line-clamp-none" : ""}>
          <ReactMarkdown components={markdownComponents} remarkPlugins={[remarkBreaks]}>{tu.body}</ReactMarkdown>
        </div>
        <button
          onClick={() => setExpanded((v) => !v)}
          className="md:hidden mt-1.5 text-xs font-semibold text-[#4a7c59] font-body"
        >
          {expanded ? "Collapse" : "Read more"}
        </button>
      </div>
    </div>
  );
}

// ── Newsletter view ───────────────────────────────────────────────────────────

function NewsletterView({ newsletter }: { newsletter: DBNewsletter }) {
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

  return (
    <div className="min-h-screen bg-white md:bg-[#f0f4f1] md:py-12 md:px-4">
      <div className="md:max-w-2xl md:mx-auto md:bg-white md:rounded-xl md:shadow-xl overflow-hidden">

        {/* Hero Banner */}
        <div className="relative h-64 md:h-80 overflow-hidden">
          <Image src={newsletter.cover_image_signed_url ?? "/assets/NewsletterWeek1.jpg"} alt="Newsletter banner" fill className="object-cover object-center" priority />
          <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.38) 0%, transparent 42%)" }} />
          <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(to top, rgba(10,30,18,0.82) 0%, rgba(10,30,18,0.32) 50%, transparent 100%)" }} />

          <div className="absolute top-0 left-0 right-0 flex items-center px-6 pt-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 relative flex-shrink-0">
                <Image src="/assets/Logo.png" alt="Sage Field Private Microschool" width={32} height={32} className="object-contain" />
              </div>
              <p className="text-white/80 text-[11px] font-semibold uppercase tracking-[0.18em] font-body drop-shadow-sm">
                Sage Field Private Microschool
              </p>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 px-6 pb-5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-body font-semibold bg-[#4a7c59]/80 text-white backdrop-blur-sm mb-2.5">
              <svg width="11" height="11" viewBox="0 0 13 13" fill="none" className="opacity-80 flex-shrink-0">
                <rect x="1" y="2" width="11" height="10" rx="2" stroke="currentColor" strokeWidth="1.3" />
                <path d="M4 1v2M9 1v2M1 5h11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
              Week of {newsletter.week_range}
            </span>
            <h1 className="text-3xl md:text-4xl font-bold font-heading text-white leading-tight drop-shadow-lg" style={{ textShadow: "0 2px 16px rgba(0,0,0,0.45)" }}>
              {newsletter.title || "Weekly Newsletter"}
            </h1>
            <p className="text-white/65 text-sm font-body mt-1 drop-shadow-sm">Sage Field School · Family Newsletter</p>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: "linear-gradient(to right, #4a7c59, #7ec89a, #4a7c59)" }} />
        </div>

        {/* Sections */}
        <div className="px-4 py-5 md:px-6">
          {visibleSections.map((section, idx) => (
            <div key={section.id} className={idx < visibleSections.length - 1 ? "pb-6 mb-6 border-b border-gray-100" : "pb-5"}>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-7 h-7 rounded-lg bg-[#4a7c59]/10 flex items-center justify-center flex-shrink-0">
                  <SectionIcon label={section.label} />
                </div>
                <h2 className="text-lg font-bold font-heading text-gray-900">{section.label || "Untitled Section"}</h2>
              </div>

              {section.isClassUpdates ? (
                section.teacherUpdates.some((tu) => tu.body?.trim()) ? (
                  <div className="space-y-4">
                    {section.teacherUpdates.filter((tu) => tu.body?.trim()).map((tu) => (
                      <CollapsibleTeacherUpdate key={tu.teacher_id} tu={tu} />
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
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="bg-[#f8faf8] border-t-2 border-[#4a7c59]/15 px-4 md:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-5 h-5 relative opacity-60">
              <Image src="/assets/Logo.png" alt="" width={20} height={20} className="object-contain" />
            </div>
            <p className="text-sm font-semibold text-[#4a7c59] font-heading">Sage Field Private Microschool</p>
          </div>
          <p className="text-xs text-gray-400 font-body text-center sm:text-right">
            sabrina@sagefield.co &middot; {newsletter.week_range}
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Password gate ─────────────────────────────────────────────────────────────

function PasswordGate({ id, title, weekRange, coverImageUrl, onUnlocked }: { id: string; title: string; weekRange: string; coverImageUrl?: string | null; onUnlocked: (nl: DBNewsletter) => void }) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [heroLoaded, setHeroLoaded] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password.trim()) return;
    setLoading(true);
    setError(null);
    const result = await verifyNewsletterPassword(id, password.trim());
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else if (result.data) {
      onUnlocked(result.data);
    }
  }

  return (
    <div className="min-h-screen bg-[#f0f4f1] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Hero strip */}
          <div className="relative h-36 overflow-hidden">
            {!heroLoaded && <div className="absolute inset-0 bg-[#e8ede9] animate-pulse z-10" />}
            <Image src={coverImageUrl ?? "/assets/NewsletterWeek1.jpg"} alt="" fill className="object-cover object-center" onLoad={() => setHeroLoaded(true)} />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(10,30,18,0.85) 0%, rgba(10,30,18,0.3) 100%)" }} />
            <div className="absolute bottom-0 left-0 right-0 px-5 pb-4">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-6 h-6 relative flex-shrink-0">
                  <Image src="/assets/Logo.png" alt="" width={24} height={24} className="object-contain" />
                </div>
                <p className="text-white/75 text-[10px] font-semibold uppercase tracking-[0.18em] font-body">Sage Field Private Microschool</p>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-body font-semibold bg-[#4a7c59]/80 text-white backdrop-blur-sm">
                <svg width="9" height="9" viewBox="0 0 13 13" fill="none" className="opacity-80 flex-shrink-0">
                  <rect x="1" y="2" width="11" height="10" rx="2" stroke="currentColor" strokeWidth="1.3" />
                  <path d="M4 1v2M9 1v2M1 5h11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                </svg>
                Week of {weekRange}
              </span>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: "linear-gradient(to right, #4a7c59, #7ec89a, #4a7c59)" }} />
          </div>

          {/* Form */}
          <div className="px-6 py-6">
            <h1 className="text-xl font-bold font-heading text-gray-900 mb-0.5 truncate">{title || "Weekly Newsletter"}</h1>
            <p className="text-sm text-gray-400 font-body mb-5">Enter the family password to read this newsletter.</p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div className="relative">
                <input
                  type="text"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(null); }}
                  placeholder="Family password"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-body text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#4a7c59] focus:ring-1 focus:ring-[#4a7c59]/30 transition-colors"
                  autoFocus
                  autoComplete="off"
                />
              </div>

              {error && (
                <p className="text-sm text-red-500 font-body">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading || !password.trim()}
                className="flex items-center justify-center gap-2 py-3 bg-[#4a7c59] text-white text-sm font-semibold font-body rounded-xl hover:bg-[#3d6b4a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Lock className="w-4 h-4" />
                )}
                {loading ? "Checking…" : "View Newsletter"}
              </button>
            </form>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 font-body mt-4">
          Sage Field Private Microschool · Family Newsletter
        </p>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function PublicNewsletterClient({ id, title, weekRange, coverImageUrl }: { id: string; title: string; weekRange: string; coverImageUrl?: string | null }) {
  const [newsletter, setNewsletter] = useState<DBNewsletter | null>(null);

  if (newsletter) {
    return <NewsletterView newsletter={newsletter} />;
  }

  return <PasswordGate id={id} title={title} weekRange={weekRange} coverImageUrl={coverImageUrl} onUnlocked={setNewsletter} />;
}
