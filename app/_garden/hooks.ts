"use client";

import { useEffect, useState } from "react";

export interface LatestPost {
  title: string;
  slug: string;
  excerpt: string | null;
  author_name: string | null;
  published_at: string | null;
  cover_image_signed_url: string | null;
}

/** Same request as the live home page's blog preview. */
export function useLatestPost() {
  const [latestPost, setLatestPost] = useState<LatestPost | null>(null);
  useEffect(() => {
    let alive = true;
    fetch("/api/blog/latest")
      .then((r) => r.json())
      .then((data) => {
        if (alive && data?.title) setLatestPost(data as LatestPost);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);
  return latestPost;
}

/** True once the visitor scrolls past 80% of the first viewport (gates the SMS button). */
export function usePastHero(threshold = 0.8) {
  const [pastHero, setPastHero] = useState(false);
  useEffect(() => {
    const onScroll = () => setPastHero(window.scrollY > window.innerHeight * threshold);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);
  return pastHero;
}

export function formatPostDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
