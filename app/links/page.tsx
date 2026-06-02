"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Instagram, Facebook } from "lucide-react";

type LinkItem = {
  emoji?: string;
  lucideIcon?: "instagram" | "facebook";
  title: string;
  subtitle: string;
  href: string;
  featured?: boolean;
  color?: string;
  hoverColor?: string;
};

const LINK_GROUPS: { label: string; links: LinkItem[] }[] = [
  {
    label: "What's New",
    links: [
      {
        emoji: "📸",
        title: "Week 1 Highlights Are Live!",
        subtitle: "Summer 2026 · May 26–29 · See the recap",
        href: "/highlights/summer/week-1",
        featured: true,
      },
    ],
  },
  {
    label: "Enrollment",
    links: [
      {
        emoji: "📋",
        title: "Start Your Application",
        subtitle: "Apply for enrollment today",
        href: "/apply",
        featured: true,
      },
      {
        emoji: "☀️",
        title: "Ages 4–11 Summer Program",
        subtitle: "May 26 – Aug 13 · Outdoor & enrichment",
        href: "/summer-2026",
      },
      {
        emoji: "📚",
        title: "2026–2027 School Year",
        subtitle: "Full-year program starting Aug 17",
        href: "/school-year-2026-2027",
      },
      {
        emoji: "🏡",
        title: "Homeschool Drop-In Days",
        subtitle: "1–3 days/week · Flexible schedule",
        href: "/homeschool",
      },
    ],
  },
  {
    label: "Visit Us",
    links: [
      {
        emoji: "🗓️",
        title: "Schedule a Free Tour",
        subtitle: "Private · ~45 minutes · No pressure",
        href: "/tour",
        featured: true,
      },
      {
        emoji: "👀",
        title: "Try a Shadow Day",
        subtitle: "$95 · Full school day · Mon–Thu",
        href: "/shadow-tour",
      },
    ],
  },
  {
    label: "Learn More",
    links: [
      {
        emoji: "🏫",
        title: "Our Story & Mission",
        subtitle: "What makes Sage Field different",
        href: "/about",
      },
      {
        emoji: "💰",
        title: "Tuition & Program Costs",
        subtitle: "All programs and add-ons",
        href: "/tuition",
      },
      {
        emoji: "❓",
        title: "Frequently Asked Questions",
        subtitle: "Common questions answered",
        href: "/faq",
      },
      {
        emoji: "🌿",
        title: "Our Approach to Learning",
        subtitle: "Child-led, nature-based education",
        href: "/educational-philosophy",
      },
      {
        emoji: "📬",
        title: "Send Us a Message",
        subtitle: "Get in touch with our team",
        href: "/contact",
      },
      {
        emoji: "📞",
        title: "Call or Text Us",
        subtitle: "(512) 677-5872",
        href: "tel:+15126775872",
      },
    ],
  },
  {
    label: "Follow Us",
    links: [
      {
        lucideIcon: "instagram",
        title: "Instagram",
        subtitle: "@sagefield.co",
        href: "https://www.instagram.com/sagefield.co",
        color: "#E4405F",
        hoverColor: "#D62D4F",
      },
      {
        lucideIcon: "facebook",
        title: "Facebook",
        subtitle: "@sagefield.co",
        href: "https://www.facebook.com/sagefield.co",
        color: "#1877F2",
        hoverColor: "#0E63D6",
      },
    ],
  },
  {
    label: "Account",
    links: [
      {
        emoji: "🔑",
        title: "Parent & Teacher Login",
        subtitle: "Access your dashboard",
        href: "/login",
      },
    ],
  },
];

function SocialIcon({ type }: { type: "instagram" | "facebook" }) {
  if (type === "instagram") return <Instagram className="w-5 h-5" />;
  return <Facebook className="w-5 h-5" />;
}

export default function LinksPage() {
  let cardIndex = 0;

  return (
    <div className="bg-welcome-bg min-h-screen flex flex-col items-center px-4 py-10 pb-16">
      {/* Content */}
      <div className="flex flex-col items-center w-full">
        {/* Header */}
        <motion.div
          className="flex flex-col items-center mb-8"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <Link href="/">
            <div className="w-20 h-20 relative mb-4">
              <Image
                src="/assets/Logo.png"
                alt="Sage Field Private School"
                fill
                className="object-contain"
                priority
              />
            </div>
          </Link>
          <h1 className="text-xl font-bold font-heading text-sage-900 text-center">
            Sage Field Private Microschool
          </h1>
          <p className="text-sm font-body text-sage-700 mt-1 text-center">
            Round Rock, TX · Ages 4–11
          </p>
          <p className="text-xs font-body text-sage-500 mt-0.5 text-center">
            2760 Gattis School Rd
          </p>
        </motion.div>

        {/* Link Groups */}
        <div className="w-full max-w-sm space-y-6">
          {LINK_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="text-xs font-semibold font-body text-sage-500 uppercase tracking-widest mb-2 px-1">
                {group.label}
              </p>
              <div className="space-y-2.5">
                {group.links.map((link) => {
                  const idx = cardIndex++;
                  const isTel = link.href.startsWith("tel:");
                  const isSocial = !!link.color;

                  return (
                    <motion.div
                      key={link.href}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.35,
                        delay: 0.15 + idx * 0.05,
                        ease: "easeOut",
                      }}
                    >
                      <a
                        href={link.href}
                        {...(!isTel && {
                          target: "_blank",
                          rel: "noopener noreferrer",
                        })}
                        className="block"
                      >
                        <div
                          className={`flex items-center justify-between px-5 py-4 rounded-2xl border transition-all duration-200 ${
                            isSocial
                              ? "text-white shadow-md hover:shadow-lg hover:scale-[1.01]"
                              : link.featured
                                ? "bg-sage-600 border-sage-600 text-white hover:bg-sage-700 hover:border-sage-700 shadow-md hover:shadow-lg"
                                : "bg-sage-100 border-sage-200 text-sage-900 hover:bg-sage-200 hover:border-sage-300 shadow-sm hover:shadow-md hover:scale-[1.01]"
                          }`}
                          style={
                            isSocial
                              ? {
                                  backgroundColor: link.color,
                                  borderColor: link.color,
                                }
                              : undefined
                          }
                          onMouseEnter={(e) => {
                            if (isSocial && link.hoverColor) {
                              (
                                e.currentTarget as HTMLDivElement
                              ).style.backgroundColor = link.hoverColor;
                              (
                                e.currentTarget as HTMLDivElement
                              ).style.borderColor = link.hoverColor;
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (isSocial && link.color) {
                              (
                                e.currentTarget as HTMLDivElement
                              ).style.backgroundColor = link.color;
                              (
                                e.currentTarget as HTMLDivElement
                              ).style.borderColor = link.color;
                            }
                          }}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="flex-shrink-0 text-xl">
                              {link.lucideIcon ? (
                                <SocialIcon type={link.lucideIcon} />
                              ) : (
                                link.emoji
                              )}
                            </span>
                            <div className="min-w-0">
                              <p
                                className={`text-sm font-semibold font-body leading-tight ${
                                  link.featured || isSocial
                                    ? "text-white"
                                    : "text-sage-900"
                                }`}
                              >
                                {link.title}
                              </p>
                              {link.subtitle && (
                                <p
                                  className={`text-xs font-body mt-0.5 truncate ${
                                    link.featured || isSocial
                                      ? "text-white/80"
                                      : "text-sage-600"
                                  }`}
                                >
                                  {link.subtitle}
                                </p>
                              )}
                            </div>
                          </div>
                          <ChevronRight
                            className={`w-4 h-4 flex-shrink-0 ml-2 ${
                              link.featured || isSocial
                                ? "text-white/80"
                                : "text-sage-400"
                            }`}
                          />
                        </div>
                      </a>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <motion.div
          className="mt-10 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.4 }}
        >
          <a
            href="mailto:sabrina@sagefield.co"
            className="text-sm font-semibold font-body text-primary hover:underline"
          >
            sabrina@sagefield.co
          </a>
          <p className="text-xs font-body text-sage-400 mt-1">
            © {new Date().getFullYear()} Sage Field Private School
          </p>
        </motion.div>
      </div>
    </div>
  );
}
