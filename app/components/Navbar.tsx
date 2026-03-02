"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import Link from "next/link";
import ContactDialog from "./ContactDialog";
import WaitlistDialog from "./WaitlistDialog";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [waitlistDialogOpen, setWaitlistDialogOpen] = useState(false);
  const pathname = usePathname();
  const isFAQPage = pathname === "/faq";

  const menuItems = [
    { label: "What We Offer", href: "#what-we-offer" },
    { label: "Educational Philosophy", href: "#educational-philosophy" },
    { label: "About Us", href: "/about" },
    { label: "FAQ", href: "/faq" },
  ];

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    // Only handle anchor links (starting with #) on the home page
    if (href.startsWith("#") && pathname === "/") {
      e.preventDefault();
      const targetId = href.substring(1);
      const targetElement = document.getElementById(targetId);

      if (targetElement) {
        const navbarHeight = 80; // Height of the navbar in pixels
        const targetPosition = targetElement.offsetTop - navbarHeight;

        window.scrollTo({
          top: targetPosition,
          behavior: "smooth"
        });

        // Close mobile menu if open
        setMobileMenuOpen(false);
      }
    }
  };

  return (
    <motion.nav
      className="absolute top-0 left-0 right-0 z-50"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="px-12 mx-auto">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <motion.div
            className="flex-shrink-0"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          >
            <Link href="/">
              <img src="/assets/Logo.png" alt="SageField logo" className="h-12 cursor-pointer" />
            </Link>
          </motion.div>

          {/* Desktop Menu Items - Center */}
          <div className="hidden lg:flex items-center space-x-8 flex-1 justify-center">
            {menuItems.map((item, index) => (
              <motion.a
                key={item.label}
                href={item.href}
                onClick={(e) => handleSmoothScroll(e, item.href)}
                className={`${
                  isFAQPage
                    ? "text-gray-800/90 hover:text-gray-800"
                    : "text-white/90 hover:text-white"
                } font-semibold transition-colors duration-200`}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 + index * 0.1, ease: "easeOut" }}
              >
                {item.label}
              </motion.a>
            ))}
          </div>

          {/* Action Buttons */}
          <motion.div
            className="hidden lg:flex items-center gap-3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
          >
            {/* Contact Us Button - Secondary */}
            <button
              onClick={() => setContactDialogOpen(true)}
              className="border-2 border-white bg-transparent hover:bg-white/10 text-white font-semibold px-6 py-2 rounded-lg transition-all duration-250 cursor-pointer"
            >
              Contact Us
            </button>

            {/* Enrollment Button - Primary */}
            <button
              onClick={() => setWaitlistDialogOpen(true)}
              className="border-2 border-white bg-primary hover:bg-primary-hover text-white font-semibold px-6 py-2 rounded-lg transition-all duration-250 cursor-pointer shadow-lg"
            >
              Now Open for Enrollment
            </button>
          </motion.div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`${
                isFAQPage ? "text-gray-800" : "text-white"
              } focus:outline-none cursor-pointer`}
              aria-label="Toggle menu"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {mobileMenuOpen ? (
                  <path d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className={`lg:hidden ${
              isFAQPage ? "bg-white/95" : "bg-black/80"
            } backdrop-blur-md`}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <motion.div
              className="px-5 py-3 space-y-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, delay: 0.1 }}
            >
              {menuItems.map((item, index) => (
                <motion.a
                  key={item.label}
                  href={item.href}
                  className={`block ${
                    isFAQPage
                      ? "text-gray-800/90 hover:text-gray-800"
                      : "text-white/90 hover:text-white"
                  } font-semibold py-2 transition-colors duration-200`}
                  onClick={(e) => handleSmoothScroll(e, item.href)}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  {item.label}
                </motion.a>
              ))}

              {/* Mobile Enrollment Button - Primary */}
              <motion.button
                onClick={() => {
                  setWaitlistDialogOpen(true);
                  setMobileMenuOpen(false);
                }}
                className="w-full border-2 border-white bg-primary hover:bg-primary-hover text-white font-semibold px-6 py-3 rounded-lg shadow-sm hover:shadow-md transition-all duration-250 cursor-pointer"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.3, delay: 0.3 }}
              >
                Now Open for Enrollment
              </motion.button>

              {/* Mobile Contact Button - Secondary */}
              <motion.button
                onClick={() => {
                  setContactDialogOpen(true);
                  setMobileMenuOpen(false);
                }}
                className="w-full border-2 border-white bg-transparent hover:bg-white/10 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-250 cursor-pointer"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.3, delay: 0.4 }}
              >
                Contact Us
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contact Dialog */}
      <ContactDialog isOpen={contactDialogOpen} onClose={() => setContactDialogOpen(false)} />

      {/* Waitlist Dialog */}
      <WaitlistDialog isOpen={waitlistDialogOpen} onClose={() => setWaitlistDialogOpen(false)} />
    </motion.nav>
  );
}
