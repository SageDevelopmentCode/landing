"use client";

import { useState } from "react";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menuItems = ["What We Offer", "Educational Philosophy", "About Us"];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      <div className="px-6 mx-auto">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex-shrink-0">
            <span className="text-2xl font-bold text-white">SageField</span>
          </div>

          {/* Desktop Menu Items - Center */}
          <div className="hidden lg:flex items-center space-x-8 flex-1 justify-center">
            {menuItems.map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
                className="text-white/90 hover:text-white font-semibold transition-colors duration-200"
              >
                {item}
              </a>
            ))}
          </div>

          {/* Contact Us Button */}
          <div className="hidden lg:block">
            <button className="bg-[#F29A8F] hover:bg-[#E88A7F] text-white font-semibold px-6 py-2 rounded-lg transition-all duration-250">
              Contact Us
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-white focus:outline-none"
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
      {mobileMenuOpen && (
        <div className="lg:hidden bg-black/80 backdrop-blur-md">
          <div className="px-5 py-3 space-y-3">
            {menuItems.map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
                className="block text-white/90 hover:text-white font-semibold py-2 transition-colors duration-200"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item}
              </a>
            ))}
            <button className="w-full bg-[#F29A8F] hover:bg-[#E88A7F] text-white font-semibold px-6 py-3 rounded-lg shadow-sm hover:shadow-md transition-all duration-250">
              Contact Us
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
