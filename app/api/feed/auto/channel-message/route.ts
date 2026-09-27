import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { syncChannelMessageFeedPost } from "@/app/lib/feed/syncChannelMessageFeed";

const bodySchema = z.object({
  messageId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  const secret = process.env.WEBHOOK_SECRET;
  const headerSecret = request.headers.get("x-webhook-secret");

  if (!secret || headerSecret !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let validated: z.infer<typeof bodySchema>;
  try {
    validated = bodySchema.parse(await request.json());
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues[0]?.message ?? "Invalid request" },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const result = await syncChannelMessageFeedPost(validated.messageId);

  if (!result.ok) {
    console.error("[feed/auto/channel-message]", result.error);
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
