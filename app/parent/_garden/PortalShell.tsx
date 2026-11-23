"use client";

import { useState, type ReactNode } from "react";
import GardenIsland from "@/app/_garden/GardenIsland";
import { GardenToastProvider } from "@/app/_garden/toast";
import { SheetPortalProvider } from "./sheet";

/**
 * Wraps a parent portal page body in the Garden system:
 * Garden tokens + fonts, the toast host, and a portal container at the end of the
 * Garden scope that every GardenSheet / GardenDialog renders into.
 * The shared DashboardHeader stays outside it.
 */
export default function PortalShell({ children, className = "" }: { children: ReactNode; className?: string }) {
  const [portalEl, setPortalEl] = useState<HTMLDivElement | null>(null);
  return (
    <GardenIsland className={`min-h-full overflow-x-clip ${className}`}>
      <GardenToastProvider>
        <SheetPortalProvider value={portalEl}>
          {children}
          <div ref={setPortalEl} />
        </SheetPortalProvider>
      </GardenToastProvider>
    </GardenIsland>
  );
}
