import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  sendDiscordNotification,
  createMercuryTransactionEmbed,
  createMercuryAccountBalanceEmbed,
} from "@/app/lib/discord";

function verifyMercurySignature(
  body: string,
  header: string,
  secret: string,
): boolean {
  const parts = header.split(",");
  const timestamp = parts[0]?.split("=")[1];
  const signature = parts[1]?.split("=")[1];

  if (!timestamp || !signature) return false;

  // Reject webhooks older than 5 minutes
  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (age > 300) return false;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${body}`)
    .digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected),
    );
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signatureHeader = request.headers.get("Mercury-Signature");
  const secret = process.env.MERCURY_WEBHOOK_SECRET;

  // No secret configured yet (e.g. Mercury's "Verify endpoint" ping during initial setup)
  if (!secret) {
    return NextResponse.json({ received: true });
  }

  if (!signatureHeader || !verifyMercurySignature(body, signatureHeader, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    const event = JSON.parse(body) as {
      id: string;
      resourceType: string;
      resourceId: string;
      operationType: string;
      occurredAt: string;
      changedPaths: string[];
      mergePatch: Record<string, unknown>;
      previousValues: Record<string, unknown>;
    };

    const webhookUrl = process.env.DISCORD_MERCURY_WEBHOOK_URL;

    if (event.resourceType === "transaction") {
      const title =
        event.operationType === "create"
          ? "💸 New Transaction"
          : "🔄 Transaction Updated";
      const embed = createMercuryTransactionEmbed({
        title,
        resourceId: event.resourceId,
        occurredAt: event.occurredAt,
        changedPaths: event.changedPaths,
        mergePatch: event.mergePatch,
        previousValues: event.previousValues,
      });
      await sendDiscordNotification(embed, webhookUrl);
    } else if (event.resourceType.endsWith("Account")) {
      const embed = createMercuryAccountBalanceEmbed({
        resourceType: event.resourceType,
        resourceId: event.resourceId,
        occurredAt: event.occurredAt,
        mergePatch: event.mergePatch,
        previousValues: event.previousValues,
      });
      await sendDiscordNotification(embed, webhookUrl);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error processing Mercury webhook:", error);
    return NextResponse.json(
      {
        error: "Failed to process webhook",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
