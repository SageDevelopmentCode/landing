import type { Metadata } from "next";
import HelpWidget from "@/app/parent/components/HelpWidget";

export const metadata: Metadata = {
  title: "Book Your Shadow Day — Sage Field",
  description: "Create an account to hold your child's shadow day at Sage Field.",
};

export default function ShadowDayStartLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <HelpWidget />
    </>
  );
}
