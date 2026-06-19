"use client";

import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { type ReelPost } from "@/app/teacher/feed/reelActions";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `Today at ${date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function ClientTimestamp({ iso }: { iso: string }) {
  const [label, setLabel] = useState("");
  useEffect(() => { setLabel(formatTimestamp(iso)); }, [iso]);
  return <span>{label}</span>;
}

function getInitials(name: string): string {
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

const AVATAR_COLORS = ["bg-[#4a7c59]", "bg-[#5a6b8a]", "bg-[#8a5a6b]", "bg-[#7c6b4a]", "bg-[#6b7c4a]"];

function avatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function AuthorAvatar({
  initials,
  color,
  imageUrl,
}: {
  initials: string;
  color: string;
  imageUrl?: string | null;
}) {
  if (imageUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={imageUrl} alt={initials} className="w-7 h-7 rounded-full object-cover flex-shrink-0" />;
  }
  return (
    <div className={`w-7 h-7 text-xs ${color} rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0`}>
      {initials}
    </div>
  );
}

// ─── ReelCard ─────────────────────────────────────────────────────────────────

function ReelCard({
  reel,
  index,
  activeIndex,
  isMuted,
  onBecomeActive,
  onToggleMute,
}: {
  reel: ReelPost;
  index: number;
  activeIndex: number;
  isMuted: boolean;
  onBecomeActive: (index: number) => void;
  onToggleMute: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const shouldLoad = index <= activeIndex + 2;
  const isActive = index === activeIndex;

  // Observe visibility to report active index to parent
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) onBecomeActive(index); },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  // Play/pause based on whether this card is active
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !shouldLoad) return;
    v.muted = isMuted;
    if (isActive) {
      v.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      v.pause();
      setIsPlaying(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, shouldLoad]);

  // Sync global mute state to this video's element
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = isMuted;
  }, [isMuted]);

  function togglePlay(e: React.MouseEvent) {
    e.stopPropagation();
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); setIsPlaying(true); }
    else { v.pause(); setIsPlaying(false); }
  }

  function handleToggleMute(e: React.MouseEvent) {
    e.stopPropagation();
    const v = videoRef.current;
    if (v) v.muted = !isMuted;
    onToggleMute();
  }

  return (
    // Mobile: full-bleed black. Desktop: neutral bg, centered 9:16 pillarbox.
    <div
      ref={containerRef}
      className="relative h-screen w-full snap-start flex-shrink-0 bg-black md:bg-[#f5f3ef] md:flex md:items-center md:justify-center md:py-4"
      onClick={togglePlay}
    >
      {/* Inner video column — mobile: fills screen; desktop: 9:16 centered box */}
      <div className="absolute inset-0 bg-black md:static md:inset-auto md:rounded-2xl md:overflow-hidden md:shadow-xl md:h-full md:aspect-[9/16]">
        {/* Video */}
        <video
          ref={videoRef}
          src={shouldLoad ? (reel.storage_url ?? undefined) : undefined}
          loop
          playsInline
          preload={isActive ? "auto" : "metadata"}
          className="w-full h-full object-cover"
        />

        {/* Play overlay */}
        <AnimatePresence>
          {!isPlaying && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <div className="w-16 h-16 rounded-full bg-black/40 flex items-center justify-center">
                <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom gradient + author + caption */}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-8 pt-24 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none">
          <div className="flex items-center gap-2 mb-2">
            <AuthorAvatar
              initials={getInitials(reel.teacher_name)}
              color={avatarColor(reel.teacher_id)}
              imageUrl={reel.teacher_profile_image_url}
            />
            <div>
              <p className="text-sm font-semibold text-white drop-shadow leading-tight">{reel.teacher_name}</p>
              <p className="text-xs text-white/70 drop-shadow"><ClientTimestamp iso={reel.created_at} /></p>
            </div>
          </div>
          {reel.caption && (
            <p className="text-sm text-white/90 leading-snug drop-shadow">{reel.caption}</p>
          )}
        </div>

        {/* Mute toggle — top right */}
        <button
          onClick={handleToggleMute}
          className="absolute top-4 right-4 p-2.5 rounded-full bg-black/40 text-white active:bg-black/60 transition-colors"
        >
          {isMuted ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M16.5 12A4.5 4.5 0 0 0 14 7.97V10.18l2.45 2.45c.04-.2.05-.42.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.796 8.796 0 0 0 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06A8.99 8.99 0 0 0 17.73 18L19 19.27 20.27 18 5.27 3 4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05A4.5 4.5 0 0 0 16.5 12zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function ReelsPageClient({ initialReels }: { initialReels: ReelPost[] }) {
  const [reels] = useState<ReelPost[]>(initialReels);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);

  if (reels.length === 0) {
    return (
      <div className="h-screen w-full bg-black flex items-center justify-center">
        <p className="text-white/50 text-sm">No reels yet.</p>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full overflow-hidden bg-black">
      <div className="h-full w-full overflow-y-auto snap-y snap-mandatory">
        {reels.map((reel, i) => (
          <ReelCard
            key={reel.id}
            reel={reel}
            index={i}
            activeIndex={activeIndex}
            isMuted={isMuted}
            onBecomeActive={setActiveIndex}
            onToggleMute={() => setIsMuted((v) => !v)}
          />
        ))}
      </div>
    </div>
  );
}
