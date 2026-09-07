import { NextResponse } from "next/server";

export type MercuryAccountBalance = {
  id: string;
  name: string;
  kind: string;
  accountNumber: string;
  availableBalance: number;
  currentBalance: number;
  status: string;
};

function toNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function isCreditAccount(kind: string): boolean {
  return kind.toLowerCase().includes("credit");
}

export async function GET() {
  const token = process.env.MERCURY_API_TOKEN?.trim();
  if (!token) {
    return NextResponse.json(
      { error: "MERCURY_API_TOKEN not configured" },
      { status: 500 },
    );
  }

  const headers = new Headers();
  headers.set("Authorization", `Bearer ${token}`);
  headers.set("Content-Type", "application/json");

  try {
    const accountsRes = await fetch("https://api.mercury.com/api/v1/accounts", {
      headers,
      cache: "no-store",
    });

    if (!accountsRes.ok) {
      const errBody = await accountsRes.text();
      return NextResponse.json(
        {
          error: `Mercury accounts API error: ${accountsRes.status}`,
          detail: errBody,
        },
        { status: accountsRes.status },
      );
    }

    const accountsData = await accountsRes.json();
    const rawAccounts: Array<Record<string, unknown>> =
      accountsData.accounts ?? [];

    const accounts: MercuryAccountBalance[] = rawAccounts
      .filter((account) => account.status !== "deleted")
      .map((account) => ({
        id: String(account.id ?? ""),
        name: String(account.name ?? "Account"),
        kind: String(account.kind ?? account.type ?? "unknown"),
        accountNumber: String(account.accountNumber ?? ""),
        availableBalance: toNumber(account.availableBalance),
        currentBalance: toNumber(account.currentBalance),
        status: String(account.status ?? "active"),
      }));

    let totalCashAvailable = 0;
    let totalCashCurrent = 0;
    let totalLiabilities = 0;

    for (const account of accounts) {
      if (isCreditAccount(account.kind)) {
        totalLiabilities += Math.abs(account.availableBalance);
      } else {
        totalCashAvailable += account.availableBalance;
        totalCashCurrent += account.currentBalance;
      }
    }

    return NextResponse.json({
      accounts,
      fetchedAt: new Date().toISOString(),
      totalCashAvailable,
      totalCashCurrent,
      totalLiabilities,
      netCashPosition: totalCashAvailable - totalLiabilities,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}
