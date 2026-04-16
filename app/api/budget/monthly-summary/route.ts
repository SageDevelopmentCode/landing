import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/app/lib/supabase-server";
import { sendDiscordNotification, createBudgetSummaryEmbed } from "@/app/lib/discord";

const CATEGORIES = [
  "Tuition",
  "Donations",
  "Teacher Pay",
  "Staff Pay",
  "Contractor / 1099",
  "Payroll Taxes",
  "Rent",
  "Utilities",
  "Maintenance & Repairs",
  "Furniture & Equipment",
  "Supplies & Materials",
  "Curriculum",
  "Field Trips",
  "Technology & Software",
  "Insurance",
  "Marketing",
  "Professional Services",
  "Administrative",
  "Savings",
  "Other",
];

export async function GET(request: NextRequest) {
  try {
    // Vercel Cron sends CRON_SECRET as a Bearer token
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = createAdminClient();

    // Allow Vercel Cron requests authenticated via CRON_SECRET
    const isCron =
      process.env.CRON_SECRET && token === process.env.CRON_SECRET;

    if (!isCron) {
      const {
        data: { user },
      } = await db.auth.getUser(token);

      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-indexed
    const firstOfMonth = new Date(year, month, 1).toISOString().split("T")[0];
    const firstOfNextMonth = new Date(year, month + 1, 1).toISOString().split("T")[0];

    const [liRes, expRes] = await Promise.all([
      db.schema("budget").from("line_items").select("category, planned_amount"),
      db
        .schema("budget")
        .from("expenses")
        .select("category, amount")
        .eq("is_deleted", false)
        .gte("expense_date", firstOfMonth)
        .lt("expense_date", firstOfNextMonth),
    ]);

    if (liRes.error) throw new Error(liRes.error.message);
    if (expRes.error) throw new Error(expRes.error.message);

    const plannedByCategory = (liRes.data ?? []).reduce<Record<string, number>>(
      (acc, i) => {
        acc[i.category] = (acc[i.category] ?? 0) + Number(i.planned_amount);
        return acc;
      },
      {},
    );

    const actualByCategory = (expRes.data ?? []).reduce<Record<string, number>>(
      (acc, e) => {
        const cat = e.category ?? "Other";
        acc[cat] = (acc[cat] ?? 0) + Number(e.amount);
        return acc;
      },
      {},
    );

    const categories = CATEGORIES.map((cat) => {
      const planned = plannedByCategory[cat] ?? 0;
      const actual = actualByCategory[cat] ?? 0;
      const remaining = planned - actual;
      const pct = planned > 0 ? Math.round((actual / planned) * 100) : null;
      return { category: cat, planned, actual, remaining, pct };
    }).filter((r) => r.planned > 0 || r.actual > 0);

    const totalPlanned = categories.reduce((s, r) => s + r.planned, 0);
    const totalActual = categories.reduce((s, r) => s + r.actual, 0);
    const totalRemaining = totalPlanned - totalActual;

    const summary = {
      month: now.toLocaleString("en-US", { month: "long" }),
      year,
      categories,
      totals: { totalPlanned, totalActual, totalRemaining },
    };

    const notify = request.nextUrl.searchParams.get("notify") === "true";
    if (notify) {
      const embed = createBudgetSummaryEmbed(summary);
      await sendDiscordNotification(embed, process.env.DISCORD_BUDGET_WEBHOOK_URL);
    }

    return NextResponse.json(summary);
  } catch (error) {
    console.error("Error fetching budget summary:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch budget summary",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
