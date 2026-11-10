"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Mail, MapPin, Phone, Instagram, Facebook } from "lucide-react";
import { CONTACT, SOCIAL } from "@/app/_home/content";
import { gardenFontVariables } from "@/app/_garden/fonts";
import "@/app/_garden/garden.css";
import { useDialogs } from "@/app/_garden/GardenShell";
import { btnPop, Draw, Leaf } from "@/app/_garden/ui";
import ContactDialog from "./ContactDialog";
import WaitlistDialog from "./WaitlistDialog";

const navLinkClass =
  "rounded-sm text-sm font-semibold text-[var(--sf-cream)]/75 transition-colors hover:text-white focus-visible:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--sf-ink)]";

const btnOutlineOnInk =
  "inline-flex w-full items-center justify-center gap-2 rounded-full border-2 border-white/90 bg-transparent px-7 py-3.5 text-sm font-extrabold text-white shadow-[0_6px_0_0_rgba(255,255,255,0.2)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_0_0_rgba(255,255,255,0.25)] active:translate-y-1 active:shadow-[0_2px_0_0_rgba(255,255,255,0.15)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/40 cursor-pointer";

type NavAction =
  | { kind: "link"; href: string }
  | { kind: "smooth-scroll"; href: string }
  | { kind: "dialog"; target: "waitlist" | "contact" }
  | { kind: "disabled" };

interface NavLeaf {
  label: string;
  action: NavAction;
}

interface NavColumn {
  heading: string;
  items: NavLeaf[];
}

const FOOTER_COLUMNS: NavColumn[] = [
  {
    heading: "About Us",
    items: [
      { label: "About Us", action: { kind: "link", href: "/about" } },
      { label: "Our Team", action: { kind: "link", href: "/team" } },
      { label: "FAQ", action: { kind: "link", href: "/faq" } },
      {
        label: "What We Offer",
        action: { kind: "smooth-scroll", href: "/#what-we-offer" },
      },
      {
        label: "Educational Philosophy",
        action: { kind: "smooth-scroll", href: "/#educational-philosophy" },
      },
    ],
  },
  {
    heading: "Programs & Tuition",
    items: [
      {
        label: "School Year 2026-2027",
        action: { kind: "link", href: "/school-year-2026-2027" },
      },
      {
        label: "Homeschool Drop-In",
        action: { kind: "link", href: "/homeschool" },
      },
      { label: "Tuition", action: { kind: "link", href: "/tuition" } },
      { label: "Highlights", action: { kind: "link", href: "/highlights" } },
    ],
  },
  {
    heading: "Apply",
    items: [
      {
        label: "Apply for a Program",
        action: { kind: "link", href: "/apply" },
      },
      {
        label: "Interest Form",
        action: { kind: "dialog", target: "waitlist" },
      },
      {
        label: "Continue Application",
        action: { kind: "link", href: "/apply/start" },
      },
    ],
  },
  {
    heading: "Resources & Login",
    items: [
      { label: "Refer & Get $250", action: { kind: "link", href: "/refer" } },
      { label: "Blog", action: { kind: "link", href: "/blog" } },
      {
        label: "Academic Calendar",
        action: { kind: "link", href: "/academic-calendar" },
      },
      { label: "Tour", action: { kind: "link", href: "/tour" } },
      { label: "FAQ", action: { kind: "link", href: "/faq" } },
      { label: "Donate", action: { kind: "link", href: "/donate" } },
      { label: "Parent Login", action: { kind: "link", href: "/login" } },
      { label: "Teacher Login", action: { kind: "link", href: "/login" } },
    ],
  },
];

const CONTACT_ROWS: {
  Icon: typeof Mail;
  label: string;
  value: string;
  href: string;
  tint: string;
  external?: boolean;
}[] = [
  {
    Icon: Mail,
    label: "Email",
    value: CONTACT.email,
    href: `mailto:${CONTACT.email}`,
    tint: "bg-[var(--sf-butter)]",
  },
  {
    Icon: Phone,
    label: "Phone",
    value: CONTACT.phoneDisplay,
    href: CONTACT.phoneHref,
    tint: "bg-[var(--sf-mint)]",
  },
  {
    Icon: MapPin,
    label: "Location",
    value: CONTACT.address,
    href: CONTACT.mapsHref,
    tint: "bg-[var(--sf-sky)]",
    external: true,
  },
];

export default function Footer({
  useShellDialogs = false,
}: {
  useShellDialogs?: boolean;
}) {
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const [isWaitlistDialogOpen, setIsWaitlistDialogOpen] = useState(false);
  const shellDialogs = useDialogs();

  const openWaitlist = useShellDialogs
    ? shellDialogs.openWaitlist
    : () => setIsWaitlistDialogOpen(true);
  const openContact = useShellDialogs
    ? shellDialogs.openContact
    : () => setIsContactDialogOpen(true);

  function renderItem(item: NavLeaf) {
    if (item.action.kind === "disabled") {
      return (
        <li key={item.label}>
          <span className="cursor-not-allowed select-none text-sm font-semibold text-[var(--sf-cream)]/40">
            {item.label}
          </span>
        </li>
      );
    }

    if (item.action.kind === "link" || item.action.kind === "smooth-scroll") {
      return (
        <li key={item.label}>
          <Link href={item.action.href} className={navLinkClass}>
            {item.label}
          </Link>
        </li>
      );
    }

    const onDialog =
      item.action.target === "waitlist" ? openWaitlist : openContact;

    return (
      <li key={item.label}>
        <button type="button" onClick={onDialog} className={`${navLinkClass} cursor-pointer text-left`}>
          {item.label}
        </button>
      </li>
    );
  }

  return (
    <footer
      className={`${gardenFontVariables} sf-garden sf-garden-ink relative overflow-hidden`}
    >
      <Draw className="pointer-events-none absolute -right-4 bottom-24 opacity-20 lg:right-8">
        <Leaf className="h-24 w-24" color="var(--sf-sage)" />
      </Draw>

      <div className="relative mx-auto max-w-7xl px-6 sm:px-10 lg:px-16 py-16 lg:py-20">
        <div className="mb-12 grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-1">
            <Link href="/" className="inline-block rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50">
              <Image
                src="/assets/Logo.png"
                alt="SageField logo"
                width={160}
                height={48}
                className="h-12 w-auto object-contain"
                sizes="160px"
              />
            </Link>
          </div>

          {FOOTER_COLUMNS.map((col) => (
            <div key={col.heading}>
              <h3 className="sf-display mb-4 text-lg text-[var(--sf-cream)]">{col.heading}</h3>
              <ul className="space-y-3">{col.items.map(renderItem)}</ul>
            </div>
          ))}

          <div>
            <h3 className="sf-display mb-4 text-lg text-[var(--sf-cream)]">Get in Touch</h3>
            <div className="mb-6 space-y-3">
              {CONTACT_ROWS.map(({ Icon, label, value, href, tint, external }) => (
                <a
                  key={label}
                  href={href}
                  {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className="group flex items-center gap-3 rounded-3xl bg-white p-3 text-[var(--sf-ink)] shadow-[0_6px_0_0_rgba(0,0,0,0.12)] transition-transform hover:-translate-y-0.5 focus-visible:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-coral)]/40"
                >
                  <span
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${tint} transition-transform duration-300 group-hover:rotate-6`}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[10px] font-extrabold uppercase tracking-wide text-[var(--sf-soft)]">
                      {label}
                    </span>
                    <span className="block truncate text-sm font-extrabold">{value}</span>
                  </span>
                </a>
              ))}
            </div>

            <div className="flex flex-col gap-3">
              <Link href="/apply" className={`${btnPop} w-full py-3.5 text-sm text-center`}>
                Enroll Now
              </Link>
              <button type="button" onClick={openContact} className={btnOutlineOnInk}>
                Contact Us
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8">
            <div className="flex flex-col items-center gap-6 md:grid md:grid-cols-3 md:gap-4">
              <div className="flex flex-col items-center gap-1 md:items-start">
                <p className="text-sm text-[var(--sf-cream)]/75">© 2026 Sage Field. All rights reserved.</p>
                <div className="flex items-center gap-x-3">
                  <Link href="/privacy" className={navLinkClass}>
                    Privacy Policy
                  </Link>
                  <span className="text-sm text-[var(--sf-cream)]/35">·</span>
                  <Link href="/terms" className={navLinkClass}>
                    Terms of Use
                  </Link>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3">
                <a
                  href={SOCIAL.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-[#E4405F] px-5 py-2.5 text-sm font-extrabold text-white shadow-[0_5px_0_0_#b02d47] transition-transform hover:-translate-y-0.5 focus-visible:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#E4405F]/40"
                >
                  <Instagram className="h-4 w-4" aria-hidden="true" />
                  Instagram
                </a>
                <a
                  href={SOCIAL.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-[#1877F2] px-5 py-2.5 text-sm font-extrabold text-white shadow-[0_5px_0_0_#0f56b3] transition-transform hover:-translate-y-0.5 focus-visible:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#1877F2]/40"
                >
                  <Facebook className="h-4 w-4" aria-hidden="true" />
                  Facebook
                </a>
              </div>

              <a
                href={CONTACT.mapsHref}
                target="_blank"
                rel="noopener noreferrer"
                className={`${navLinkClass} text-center md:text-right`}
              >
                {CONTACT.address}
              </a>
            </div>
          </div>
      </div>

      {!useShellDialogs && (
        <>
          <ContactDialog
            isOpen={isContactDialogOpen}
            onClose={() => setIsContactDialogOpen(false)}
          />
          <WaitlistDialog
            isOpen={isWaitlistDialogOpen}
            onClose={() => setIsWaitlistDialogOpen(false)}
          />
        </>
      )}
    </footer>
  );
}
