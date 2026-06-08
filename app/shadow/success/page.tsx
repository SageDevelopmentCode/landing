"use client";

import { CheckCircle } from "lucide-react";
import Link from "next/link";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

export default function ShadowDaySuccessPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar darkStyle={true} />
      <div className="flex-1 flex items-center justify-center px-8 py-24">
        <div className="max-w-md w-full bg-white rounded-3xl p-10 shadow-sm border border-gray-100 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="font-heading font-bold text-2xl text-gray-800 mb-2">
            You&apos;re booked!
          </h1>
          <p className="text-gray-500 font-body mb-2 leading-relaxed">
            Your shadow day at Sage Field is confirmed. We&apos;ll reach out
            shortly to confirm your date and share everything you need to know.
          </p>
          <p className="text-sm text-primary font-semibold font-body mt-4 mb-8">
            Check your email — a confirmation with details is on its way.
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
