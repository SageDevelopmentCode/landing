import type { ReactNode } from "react";
import { gardenFontVariables } from "./fonts";
import "./garden.css";

/**
 * Opts a page (or a layout's subtree) into the Garden design system:
 * loads the Garden fonts and applies the `.sf-garden` tokens + base styles.
 * Server component — use it in a page.tsx or layout.tsx.
 */
export default function GardenRoot({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`${gardenFontVariables} sf-garden ${className}`}>{children}</div>;
}
