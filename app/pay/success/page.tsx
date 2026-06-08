import Link from "next/link";
import { CheckCircle } from "lucide-react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

export default function PaySuccessPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar darkStyle={true} />

      <div className="flex-1 flex items-center justify-center px-4 py-24">
        <div className="max-w-md w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="w-8 h-8 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold font-heading text-gray-800 mb-2">
            Payment Received
          </h1>
          <p className="text-base text-gray-500 font-body leading-relaxed mb-8">
            Thank you — your payment was successfully processed. You&apos;ll
            receive a confirmation receipt at the email you provided.
          </p>
          <Link
            href="/"
            className="inline-block px-8 py-3.5 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-colors duration-200 shadow-md hover:shadow-lg font-body text-sm"
          >
            Back to Home
          </Link>
          <p className="text-xs text-gray-400 font-body mt-5">
            Questions? Text or call us: (512) 677-5872
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
}
