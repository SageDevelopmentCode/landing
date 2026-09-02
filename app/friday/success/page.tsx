"use client";

import { CheckCircle } from "lucide-react";
import Link from "next/link";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

export default function WildWestSuccessPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar darkStyle={true} />
      <div className="flex-1 flex items-center justify-center px-8 py-24">
        <div className="max-w-md w-full bg-white rounded-3xl p-10 shadow-sm border border-[#f5e6c8] text-center">
          <div className="w-16 h-16 bg-[#f5e6c8] rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="w-8 h-8 text-[#8b3a1a]" />
          </div>
          <h1 className="font-heading font-bold text-2xl text-slate-800 mb-2">
            You&apos;re registered!
          </h1>
          <p className="text-slate-500 font-body mb-2 leading-relaxed">
            We&apos;ll see you Friday, September 4th for Wild West at Sage
            Field. Get ready for wanted posters, sheriff badges,
            stick horses, and The Great Robbery!
          </p>
          <p className="text-sm text-primary font-semibold font-body mt-4 mb-8">
            👢 Boots or closed-toe shoes · 🤠 Bandana · 💧 Water canteen — check your email for
            the full packing list.
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-colors duration-200 font-body text-sm shadow-sm"
          >
            Back to Home
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}
