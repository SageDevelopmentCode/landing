"use client";

import { usePathname } from "next/navigation";
import HelpWidget from "./HelpWidget";

export default function HelpWidgetWrapper() {
  const pathname = usePathname();
  return <HelpWidget hideFloatingButton={pathname === "/parent/messages"} />;
}
