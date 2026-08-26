"use client";

import { CheckCircle } from "lucide-react";
import Link from "next/link";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

export default function ConstructionZoneSuccessPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar darkStyle={true} />
      <div className="flex-1 flex items-center justify-center px-8 py-24">
        <div className="max-w-md w-full bg-white rounded-3xl p-10 shadow-sm border border-yellow-100 text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="w-8 h-8 text-yellow-600" />
          </div>
          <h1 className="font-heading font-bold text-2xl text-slate-800 mb-2">
            You&apos;re registered!
          </h1>
          <p className="text-slate-500 font-body mb-2 leading-relaxed">
            We&apos;ll see you Friday, August 28th for Construction Zone at Sage
            Field. Get ready for tower building, excavator digs, brick-by-brick
            challenges, and hard hat decorating!
          </p>
          <p className="text-sm text-primary font-semibold font-body mt-4 mb-8">
            👟 Closed-toe shoes · 👕 Old clothes · 💧 Water bottle — check your email for
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
