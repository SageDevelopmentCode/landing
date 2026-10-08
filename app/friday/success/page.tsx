"use client";

import { CheckCircle } from "lucide-react";
import Link from "next/link";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

export default function WizardAcademySuccessPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar darkStyle={true} />
      <div className="flex-1 flex items-center justify-center px-8 py-24">
        <div className="max-w-md w-full bg-white rounded-3xl p-10 shadow-sm border border-[#E8D9FF] text-center">
          <div className="w-16 h-16 bg-[#E8D9FF] rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="w-8 h-8 text-[#7B4BB0]" />
          </div>
          <h1 className="font-heading font-bold text-2xl text-slate-800 mb-2">
            You&apos;re registered!
          </h1>
          <p className="text-slate-500 font-body mb-2 leading-relaxed">
            We&apos;ll see you Friday, October 9th for Wizard Academy at Sage
            Field. Get ready to make your own wizard wand, mix potions in the
            potion lab, build your own potion, and make a wizard hat!
          </p>
          <p className="text-sm text-primary font-semibold font-body mt-4 mb-8">
            🧢 Sun hat · 👟 Closed-toe shoes · 💧 Water bottle — check your email for
            the full expedition checklist.
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
