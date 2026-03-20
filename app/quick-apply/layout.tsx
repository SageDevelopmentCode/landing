import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quick Apply - Sage Field | Summer & School Year Programs",
  description:
    "Quickly apply to Sage Field Private School's programs. An outdoor-based private microschool for children ages 4-11 in Round Rock, Texas.",
  alternates: {
    canonical: "/quick-apply",
  },
};

export default function QuickApplyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
