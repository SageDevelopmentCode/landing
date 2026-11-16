"use client";

import type { ReactNode } from "react";
import { gardenFontVariables } from "./fonts";
import "./garden.css";

/**
 * Garden tokens and fonts for one section on a page that is not wrapped in GardenRoot.
 * The rest of the page keeps its own styles.
 */
export default function GardenIsland({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`${gardenFontVariables} sf-garden ${className}`}>{children}</div>;
}
