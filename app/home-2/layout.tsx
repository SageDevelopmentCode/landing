import type { Metadata } from "next";
import { Instrument_Serif, Manrope } from "next/font/google";
import "./home2.css";

const display = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-h2-display",
});
const body = Manrope({ subsets: ["latin"], variable: "--font-h2-body" });

export const metadata: Metadata = {
  title: "Sage Field — Home Preview 2 (Seasons)",
  robots: { index: false, follow: false },
};

export default function Home2Layout({ children }: { children: React.ReactNode }) {
  return <div className={`${display.variable} ${body.variable} h2-root`}>{children}</div>;
}
