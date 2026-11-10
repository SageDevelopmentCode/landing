import type { MercuryStatementType } from "@/app/lib/mercury/combinedStatementTypes";

const MINUS = "−";

export function formatMercuryAmount(amount: number): string {
  const abs = Math.abs(amount).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  if (amount < 0) return `${MINUS}$${abs}`;
  return `$${abs}`;
}

export function formatMercuryDateUtc(dateUtc: string): string {
  const d = new Date(`${dateUtc}T00:00:00Z`);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    timeZone: "UTC",
  });
}

export function formatAddressBlock(address: {
  address1: string;
  city: string;
  region: string;
  postalCode: string;
}): string[] {
  const lines = [address.address1];
  if (address.city || address.region || address.postalCode) {
    lines.push(
      `${address.city}, ${address.region} ${address.postalCode}`.trim(),
    );
  }
  return lines.filter(Boolean);
}

export function typeIconKind(
  type: MercuryStatementType,
): "transfer" | "payment" | "default" {
  if (type === "Transfer In" || type === "Transfer Out") return "transfer";
  if (type === "Real-Time Payment") return "payment";
  return "default";
}
