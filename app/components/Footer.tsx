"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, MapPin, Instagram, Facebook } from "lucide-react";
import ContactDialog from "./ContactDialog";
import WaitlistDialog from "./WaitlistDialog";

export default function Footer() {
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const [isWaitlistDialogOpen, setIsWaitlistDialogOpen] = useState(false);

  const handleSectionClick = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const navbarHeight = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition =
        elementPosition + window.pageYOffset - navbarHeight;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-8 sm:px-12 lg:px-16 py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Logo & Description */}
          <div className="lg:col-span-1">
            <Link href="/">
              <img
                src="/assets/Logo.png"
                alt="SageField logo"
                className="h-12 mb-4 cursor-pointer"
              />
            </Link>
            <p className="text-gray-400 text-sm font-body leading-relaxed">
              A nature-based private microschool for children ages 6–10, where
              hands-on experiences meet wisdom-focused education.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold font-heading mb-4">
              Quick Links
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/"
                  className="text-gray-400 hover:text-white transition-colors font-body text-sm"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-gray-400 hover:text-white transition-colors font-body text-sm"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/faq"
                  className="text-gray-400 hover:text-white transition-colors font-body text-sm"
                >
                  FAQ
                </Link>
              </li>
              <li>
                <Link
                  href="/vision"
                  className="text-gray-400 hover:text-white transition-colors font-body text-sm"
                >
                  Our Vision
                </Link>
              </li>
            </ul>
          </div>

          {/* Sections */}
          <div>
            <h3 className="text-lg font-semibold font-heading mb-4">Explore</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/#what-we-offer"
                  onClick={(e) => {
                    if (window.location.pathname === "/") {
                      e.preventDefault();
                      handleSectionClick("what-we-offer");
                    }
                  }}
                  className="text-gray-400 hover:text-white transition-colors font-body text-sm"
                >
                  What We Offer
                </Link>
              </li>
              <li>
                <Link
                  href="/#educational-philosophy"
                  onClick={(e) => {
                    if (window.location.pathname === "/") {
                      e.preventDefault();
                      handleSectionClick("educational-philosophy");
                    }
                  }}
                  className="text-gray-400 hover:text-white transition-colors font-body text-sm"
                >
                  Educational Philosophy
                </Link>
              </li>
            </ul>
          </div>

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
              <div className="flex items-center gap-2 text-gray-400 font-body text-sm">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span>Round Rock, TX</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="space-y-3">
              <button
                onClick={() => setIsWaitlistDialogOpen(true)}
                className="w-full px-4 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-colors duration-200 font-body cursor-pointer text-sm"
              >
                Enroll Now
              </button>
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
            <p className="text-gray-400 text-sm font-body text-center md:text-left">
              © 2026 Sage Field. All rights reserved.
            </p>

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

            <p className="text-gray-400 text-sm font-body text-center md:text-right">
              Round Rock, TX
            </p>
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
