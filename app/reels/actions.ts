"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const REELS_COOKIE = "reels_auth";
const CORRECT_PASSWORD = "childhood";

export async function verifyReelsPassword(
  _prevState: { error?: string } | undefined,
  formData: FormData
): Promise<{ error: string }> {
  const entered = ((formData.get("password") as string) ?? "").trim();

  if (entered.toLowerCase() !== CORRECT_PASSWORD) {
    return { error: "Incorrect password. Please try again." };
  }

  const cookieStore = await cookies();
  cookieStore.set(REELS_COOKIE, "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/reels",
  });

  redirect("/reels");
}
