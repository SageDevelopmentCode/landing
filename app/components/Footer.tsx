"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, MapPin, Phone, Instagram, Facebook } from "lucide-react";
import ContactDialog from "./ContactDialog";
import WaitlistDialog from "./WaitlistDialog";

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
      { label: "Our Vision", action: { kind: "link", href: "/vision" } },
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
        label: "Summer Program 2026",
        action: { kind: "link", href: "/summer-2026" },
      },
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
      {
        label: "Community & Education Resources",
        action: { kind: "disabled" },
      },
      {
        label: "Academic Calendar",
        action: { kind: "link", href: "/academic-calendar" },
      },
      { label: "Tour", action: { kind: "link", href: "/tour" } },
      { label: "Info Session", action: { kind: "link", href: "/info" } },
      { label: "FAQ", action: { kind: "link", href: "/faq" } },
      { label: "Donate", action: { kind: "link", href: "/donate" } },
      { label: "Parent Login", action: { kind: "link", href: "/login" } },
      { label: "Teacher Login", action: { kind: "link", href: "/login" } },
    ],
  },
];

export default function Footer() {
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const [isWaitlistDialogOpen, setIsWaitlistDialogOpen] = useState(false);

  function renderItem(item: NavLeaf) {
    const base =
      "text-gray-400 hover:text-white transition-colors font-body text-sm";

    if (item.action.kind === "disabled") {
      return (
        <li key={item.label}>
          <span className="text-gray-600 font-body text-sm cursor-not-allowed select-none">
            {item.label}
          </span>
        </li>
      );
    }

    if (item.action.kind === "link" || item.action.kind === "smooth-scroll") {
      return (
        <li key={item.label}>
          <Link href={item.action.href} className={base}>
            {item.label}
          </Link>
        </li>
      );
    }

    // dialog
    const openDialog =
      item.action.target === "waitlist"
        ? () => setIsWaitlistDialogOpen(true)
        : () => setIsContactDialogOpen(true);

    return (
      <li key={item.label}>
        <button onClick={openDialog} className={`${base} cursor-pointer`}>
          {item.label}
        </button>
      </li>
    );
  }

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-screen-xl mx-auto px-6 sm:px-8 lg:px-12 py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-12 mb-12">
          {/* Logo & Description */}
          <div className="lg:col-span-1">
            <Link href="/">
              <img
                src="/assets/Logo.png"
                alt="SageField logo"
                className="h-12 mb-4 cursor-pointer"
              />
            </Link>
            {/* <p className="text-gray-400 text-sm font-body leading-relaxed italic">
              Children are not meant to rot in classrooms. Choose outdoor
              learning.
            </p> */}
          </div>

          {/* Nav Columns */}
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.heading}>
              <h3 className="text-lg font-semibold font-heading mb-4">
                {col.heading}
              </h3>
              <ul className="space-y-3">{col.items.map(renderItem)}</ul>
            </div>
          ))}

          {/* Contact & CTA */}
          <div>
            <h3 className="text-lg font-semibold font-heading mb-4">
              Get in Touch
            </h3>
            <div className="space-y-3 mb-6">
              <a
                href="mailto:sabrina@sagefield.co"
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors font-body text-sm"
              >
                <Mail className="w-4 h-4 flex-shrink-0" />
                <span>sabrina@sagefield.co</span>
              </a>
              <a
                href="tel:+15126775872"
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors font-body text-sm"
              >
                <Phone className="w-4 h-4 flex-shrink-0" />
                <span>(512) 677-5872</span>
              </a>
              <a
                href="https://www.google.com/maps/search/?api=1&query=2760+Gattis+School+Rd,+Round+Rock,+TX+78664"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors font-body text-sm"
              >
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span>2760 Gattis School Rd, Round Rock, TX 78664</span>
              </a>
            </div>

            {/* CTA Buttons */}
            <div className="space-y-3">
              <Link
                href="/apply"
                className="block w-full px-4 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-colors duration-200 font-body cursor-pointer text-sm text-center"
              >
                Enroll Now
              </Link>
              <button
                onClick={() => setIsContactDialogOpen(true)}
                className="w-full px-4 py-2 border-2 border-gray-600 bg-transparent hover:bg-gray-800 text-white font-semibold rounded-lg transition-colors duration-200 font-body cursor-pointer text-sm"
              >
                Contact Us
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gray-800">
          <div className="flex flex-col md:grid md:grid-cols-3 items-center gap-4">
            <div className="flex flex-col items-center md:items-start gap-1">
              <p className="text-gray-400 text-sm font-body">
                © 2026 Sage Field. All rights reserved.
              </p>
              <div className="flex items-center gap-x-3">
                <Link
                  href="/privacy"
                  className="text-gray-400 hover:text-white transition-colors font-body text-sm"
                >
                  Privacy Policy
                </Link>
                <span className="text-gray-600 text-sm">·</span>
                <Link
                  href="/terms"
                  className="text-gray-400 hover:text-white transition-colors font-body text-sm"
                >
                  Terms of Use
                </Link>
              </div>
            </div>

            {/* Social Media Links */}
            <div className="flex items-center justify-center gap-4">
              <a
                href="https://www.instagram.com/sagefield.co"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors duration-200"
                aria-label="Follow us on Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="https://www.facebook.com/sagefield.co"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors duration-200"
                aria-label="Follow us on Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
            </div>

            <a
              href="https://www.google.com/maps/search/?api=1&query=2760+Gattis+School+Rd,+Round+Rock,+TX+78664"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 text-sm font-body text-center md:text-right hover:text-white transition-colors"
            >
              2760 Gattis School Rd, Round Rock, TX 78664
            </a>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <ContactDialog
        isOpen={isContactDialogOpen}
        onClose={() => setIsContactDialogOpen(false)}
      />
      <WaitlistDialog
        isOpen={isWaitlistDialogOpen}
        onClose={() => setIsWaitlistDialogOpen(false)}
      />
    </footer>
  );
}
