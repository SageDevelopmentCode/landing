import { Bricolage_Grotesque, Nunito, Gochi_Hand } from "next/font/google";

/** Chunky display type for headings, prices and big numbers. */
export const gardenDisplay = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-sf-display" });
/** Rounded, friendly body copy. */
export const gardenBody = Nunito({ subsets: ["latin"], variable: "--font-sf-body" });
/** Handwritten accents: subtitles, captions, little notes. Use sparingly. */
export const gardenHand = Gochi_Hand({ subsets: ["latin"], weight: "400", variable: "--font-sf-hand" });

export const gardenFontVariables = `${gardenDisplay.variable} ${gardenBody.variable} ${gardenHand.variable}`;
