import type { Metadata } from "next";
import { Bricolage_Grotesque, Nunito, Gochi_Hand } from "next/font/google";
import "./home3.css";

const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-h3-display" });
const body = Nunito({ subsets: ["latin"], variable: "--font-h3-body" });
const hand = Gochi_Hand({ subsets: ["latin"], weight: "400", variable: "--font-h3-hand" });

export const metadata: Metadata = {
  title: "Sage Field — Home Preview 3 (Garden)",
  robots: { index: false, follow: false },
};

export default function Home3Layout({ children }: { children: React.ReactNode }) {
  return <div className={`${display.variable} ${body.variable} ${hand.variable} h3-root`}>{children}</div>;
}
