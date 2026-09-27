import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/app/lib/supabase-server";
import { authenticateApiRequest } from "@/app/lib/authenticate-api-request";
import {
  isEnrolledParentUser,
  parentCalendarEventDefaults,
  parentCalendarEventInputSchema,
  parentCalendarEventSelect,
} from "@/app/lib/parent-calendar-event";
import {
  removeCalendarEventFeedPost,
  syncCalendarEventFeedPost,
} from "@/app/lib/feed/syncCalendarEventFeed";

const updateSchema = parentCalendarEventInputSchema.extend({
  id: z.string().uuid(),
});

const deleteSchema = z.object({
  id: z.string().uuid(),
});

async function requireEnrolledParent(request: NextRequest) {
  const user = await authenticateApiRequest(request);
  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (!(await isEnrolledParentUser(user.id))) {
    return {
      error: NextResponse.json({ error: "Not enrolled" }, { status: 403 }),
    };
  }
  return { user };
}

export async function POST(request: NextRequest) {
  const auth = await requireEnrolledParent(request);
  if ("error" in auth && auth.error) return auth.error;
  const { user } = auth as { user: { id: string } };

  let validated: z.infer<typeof parentCalendarEventInputSchema>;
  try {
    validated = parentCalendarEventInputSchema.parse(await request.json());
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues[0]?.message ?? "Invalid request" },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const row = parentCalendarEventDefaults(validated, user.id);
  const { data: inserted, error } = await createAdminClient()
    .schema("calendar")
    .from("events")
    .insert(row)
    .select(parentCalendarEventSelect)
    .single();

  if (error) {
    console.error("API save parent calendar event:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (inserted) {
    syncCalendarEventFeedPost({
      id: inserted.id,
      title: inserted.title,
      event_date: inserted.event_date,
      shared_with: inserted.shared_with,
      created_by: inserted.created_by,
    }).catch((e) => console.error("syncCalendarEventFeedPost:", e));
  }

  return NextResponse.json({ success: true, event: inserted });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireEnrolledParent(request);
  if ("error" in auth && auth.error) return auth.error;
  const { user } = auth as { user: { id: string } };

  let validated: z.infer<typeof updateSchema>;
  try {
    validated = updateSchema.parse(await request.json());
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues[0]?.message ?? "Invalid request" },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: existing, error: fetchError } = await admin
    .schema("calendar")
    .from("events")
    .select("id, created_by")
    .eq("id", validated.id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  if (existing.created_by !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const row = parentCalendarEventDefaults(validated, user.id);
  const { data: updated, error } = await admin
    .schema("calendar")
    .from("events")
    .update(row)
    .eq("id", validated.id)
    .select(parentCalendarEventSelect)
    .single();

  if (error) {
    console.error("API update parent calendar event:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (updated) {
    syncCalendarEventFeedPost({
      id: updated.id,
      title: updated.title,
      event_date: updated.event_date,
      shared_with: updated.shared_with,
      created_by: updated.created_by,
    }).catch((e) => console.error("syncCalendarEventFeedPost:", e));
  }

  return NextResponse.json({ success: true, event: updated });
}

export async function DELETE(request: NextRequest) {
  const auth = await requireEnrolledParent(request);
  if ("error" in auth && auth.error) return auth.error;
  const { user } = auth as { user: { id: string } };

  let validated: z.infer<typeof deleteSchema>;
  try {
    validated = deleteSchema.parse(await request.json());
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues[0]?.message ?? "Invalid request" },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: existing, error: fetchError } = await admin
    .schema("calendar")
    .from("events")
    .select("id, created_by")
    .eq("id", validated.id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  if (existing.created_by !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await admin
    .schema("calendar")
    .from("events")
    .delete()
    .eq("id", validated.id);

  if (error) {
    console.error("API delete parent calendar event:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await removeCalendarEventFeedPost(validated.id);

  return NextResponse.json({ success: true });
}
