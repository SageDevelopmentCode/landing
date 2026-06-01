import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/app/lib/supabase-server";
import { sendDiscordNotification, createBudgetSummaryEmbed, createRentReminderEmbed, createRevenueReportEmbed, createDailyToursEmbed, createDailyHoursSummaryEmbed } from "@/app/lib/discord";

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

    const firstOfMonthTs = new Date(year, month, 1).toISOString();
    const firstOfNextMonthTs = new Date(year, month + 1, 1).toISOString();

    const [liRes, expRes, txRes] = await Promise.all([
      db.schema("budget").from("line_items").select("category, planned_amount"),
      db
        .schema("budget")
        .from("expenses")
        .select("category, amount")
        .eq("is_deleted", false)
        .gte("expense_date", firstOfMonth)
        .lt("expense_date", firstOfNextMonth),
      db
        .schema("billing")
        .from("stripe_transactions")
        .select("payment_type, amount_cents, intended_amount_cents, cover_fees, exclude_from_revenue, metadata")
        .eq("is_deleted", false)
        .gte("created_at", firstOfMonthTs)
        .lt("created_at", firstOfNextMonthTs),
    ]);

    if (liRes.error) throw new Error(liRes.error.message);
    if (expRes.error) throw new Error(expRes.error.message);
    if (txRes.error) throw new Error(txRes.error.message);

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

    const nonSavingsCategories = categories.filter((r) => r.category !== "Savings");
    const totalPlanned = nonSavingsCategories.reduce((s, r) => s + r.planned, 0);
    const totalActual = nonSavingsCategories.reduce((s, r) => s + r.actual, 0);
    const totalRemaining = totalPlanned - totalActual;

    const summary = {
      month: now.toLocaleString("en-US", { month: "long" }),
      year,
      categories,
      totals: { totalPlanned, totalActual, totalRemaining },
    };

    const stripeTransactions = txRes.data ?? [];
    const visibleTx = stripeTransactions.filter(
      (tx) => !tx.exclude_from_revenue &&
        (tx.metadata as Record<string, string> | null)?.is_sibling_split !== "true",
    );
    const txNet = (tx: typeof visibleTx[number]) =>
      ((tx.cover_fees ? (tx.intended_amount_cents ?? tx.amount_cents) : tx.amount_cents)) / 100;
    const totalRevenue = visibleTx.reduce((s, tx) => s + txNet(tx), 0);
    const totalExpensesForProfit = (expRes.data ?? [])
      .filter((e) => e.category !== "Savings")
      .reduce((s, e) => s + Number(e.amount), 0);
    const netProfit = totalRevenue - totalExpensesForProfit;
    const byTypeMap = visibleTx.reduce<Record<string, number>>((acc, tx) => {
      const t = tx.payment_type ?? "other";
      acc[t] = (acc[t] ?? 0) + txNet(tx);
      return acc;
    }, {});
    const byType = Object.entries(byTypeMap)
      .map(([type, amount]) => ({
        type,
        amount,
        pct: totalRevenue > 0 ? Math.round((amount / totalRevenue) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    const notify = request.nextUrl.searchParams.get("notify") === "true";
    if (notify) {
      const todayStr = now.toISOString().split("T")[0];
      const sevenDaysStr = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

      const tourRes = await db
        .schema("marketing")
        .from("tour_bookings")
        .select("first_name, last_name, tour_date, tour_time, child_name, child_grade, num_children, status")
        .eq("is_deleted", false)
        .neq("status", "cancelled")
        .gte("tour_date", todayStr)
        .lte("tour_date", sevenDaysStr)
        .order("tour_date", { ascending: true })
        .order("tour_time", { ascending: true });

      const tourRows = tourRes.data ?? [];
      const todaysTours = tourRows.filter((t) => t.tour_date === todayStr);
      const upcomingTours = tourRows.filter((t) => t.tour_date > todayStr);

      const nextDayUtcStr = new Date(todayStr + "T00:00:00.000Z");
      nextDayUtcStr.setUTCDate(nextDayUtcStr.getUTCDate() + 1);
      const nextDayStr = nextDayUtcStr.toISOString().slice(0, 10);

      const clockRes = await db
        .schema("teachers")
        .from("clock_sessions")
        .select("teacher_id, clock_in_at, clock_out_at")
        .gte("clock_in_at", `${todayStr}T00:00:00+00`)
        .lt("clock_in_at", `${nextDayStr}T00:00:00+00`);

      const clockRows = (clockRes.data ?? []) as Array<{
        teacher_id: string;
        clock_in_at: string;
        clock_out_at: string | null;
      }>;

      const employeeHoursMap: Record<string, { totalMinutes: number; sessions: number; hasActiveSession: boolean }> = {};
      for (const s of clockRows) {
        if (!employeeHoursMap[s.teacher_id]) {
          employeeHoursMap[s.teacher_id] = { totalMinutes: 0, sessions: 0, hasActiveSession: false };
        }
        if (s.clock_out_at) {
          const mins = Math.round((new Date(s.clock_out_at).getTime() - new Date(s.clock_in_at).getTime()) / 60000);
          employeeHoursMap[s.teacher_id].totalMinutes += mins;
          employeeHoursMap[s.teacher_id].sessions += 1;
        } else {
          employeeHoursMap[s.teacher_id].hasActiveSession = true;
        }
      }

      const teacherIds = Object.keys(employeeHoursMap);
      let nameMap: Record<string, string> = {};
      if (teacherIds.length > 0) {
        const { data: users } = await db
          .schema("admin")
          .from("users")
          .select("id, full_name")
          .in("id", teacherIds);
        for (const u of (users ?? []) as Array<{ id: string; full_name: string | null }>) {
          nameMap[u.id] = u.full_name ?? "Unknown";
        }
      }

      const employeeHours = Object.entries(employeeHoursMap)
        .map(([id, stats]) => ({ full_name: nameMap[id] ?? "Unknown", ...stats }))
        .sort((a, b) => b.totalMinutes - a.totalMinutes);

      const embed = createBudgetSummaryEmbed(summary);
      const { embed: rentEmbed, content: rentContent } = createRentReminderEmbed();
      const revenueEmbed = createRevenueReportEmbed({
        month: now.toLocaleString("en-US", { month: "long" }),
        year,
        totalRevenue,
        netProfit,
        byType,
      });
      const todayLabel = now.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
      const tourEmbed = createDailyToursEmbed({
        today: todayLabel,
        todays: todaysTours,
        upcoming: upcomingTours,
      });
      const hoursSummaryEmbed = createDailyHoursSummaryEmbed({
        date: todayLabel,
        employees: employeeHours,
      });
      await Promise.all([
        sendDiscordNotification(embed, process.env.DISCORD_BUDGET_WEBHOOK_URL),
        sendDiscordNotification(rentEmbed, process.env.DISCORD_BUDGET_WEBHOOK_URL, rentContent),
        sendDiscordNotification(revenueEmbed, process.env.DISCORD_BUDGET_WEBHOOK_URL),
        sendDiscordNotification(tourEmbed, process.env.DISCORD_WEBHOOK_URL),
        sendDiscordNotification(hoursSummaryEmbed, process.env.DISCORD_EMPLOYEE_WEBHOOK_URL),
      ]);
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
