import type { Metadata } from "next";
import DownloadPageClient from "./DownloadPageClient";

export const metadata: Metadata = {
  title: "Download the App — Sage Field Private School",
  description: "Get the Sage Field app on the App Store, or request the Android beta.",
};

export default function DownloadPage() {
  return <DownloadPageClient />;
}
