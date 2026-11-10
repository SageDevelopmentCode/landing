import type { Metadata } from "next";
import { Fraunces, Figtree, Mrs_Saint_Delafield } from "next/font/google";
import "./home1.css";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-h1-display",
  axes: ["SOFT", "opsz"],
  style: ["normal", "italic"],
});
const body = Figtree({ subsets: ["latin"], variable: "--font-h1-body" });
const script = Mrs_Saint_Delafield({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-h1-script",
});

export const metadata: Metadata = {
  title: "Sage Field — Home Preview 1 (Field Journal)",
  robots: { index: false, follow: false },
};

export default function Home1Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${display.variable} ${body.variable} ${script.variable} h1-root`}>
      {children}
    </div>
  );
}
