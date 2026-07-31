import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, content-type",
      },
    });
  }

  // 1. Verify JWT
  const anonClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    {
      global: { headers: { Authorization: req.headers.get("Authorization")! } },
    },
  );
  const { data: { user }, error: authError } = await anonClient.auth.getUser();
  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const adminClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // 2. Soft-delete the profile row — marks account as deleted for RLS and app logic
  const { error: softDeleteError } = await adminClient
    .schema("admin")
    .from("users")
    .update({ is_deleted: true })
    .eq("id", user.id);

  if (softDeleteError) {
    return new Response(JSON.stringify({ error: softDeleteError.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 3. Ban the auth user permanently — prevents OTP re-login without cascading deletes.
  //    Hard-deleting auth would cascade through admin.users → admin.students and wipe
  //    all student health/enrollment records, which the school must retain (FERPA).
  //    To unban: dashboard Auth → Users → three-dot menu → "Remove ban", or:
  //    adminClient.auth.admin.updateUserById(userId, { ban_duration: "none" })
  const { error: banError } = await adminClient.auth.admin.updateUserById(
    user.id,
    { ban_duration: "876000h" }
  );

  if (banError) {
    // Roll back soft-delete so the account is not left in a broken half-state
    await adminClient
      .schema("admin")
      .from("users")
      .update({ is_deleted: false })
      .eq("id", user.id);

    return new Response(JSON.stringify({ error: banError.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
});
