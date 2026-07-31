import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

Deno.serve(async (req) => {
  const jwt = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!jwt) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { title, body, count_only } = await req.json();
  if (!count_only && (!title || !body)) {
    return new Response(JSON.stringify({ error: "title and body required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const anon = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
  );
  const { data: { user }, error: authError } = await anon.auth.getUser(jwt);
  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Invalid token" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: caller } = await admin
    .schema("admin")
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!caller || (caller.role !== "teacher" && caller.role !== "super_admin")) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { data: parents } = await admin
    .schema("admin")
    .from("users")
    .select("push_token")
    .eq("role", "parent")
    .not("push_token", "is", null);
  if (!parents?.length || count_only) {
    return new Response(
      JSON.stringify({ ok: true, count: parents?.length ?? 0, sent: 0 }),
      { headers: { "Content-Type": "application/json" } },
    );
  }

  const messages = parents.map((p: { push_token: string }) => ({
    to: p.push_token,
    title,
    body,
    sound: "default",
    channelId: "messages",
  }));

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "Accept-Encoding": "gzip, deflate",
  };
  const expoToken = Deno.env.get("EXPO_ACCESS_TOKEN");
  if (expoToken) headers["Authorization"] = `Bearer ${expoToken}`;

  const res = await fetch(EXPO_PUSH_URL, {
    method: "POST",
    headers,
    body: JSON.stringify(messages),
  });

  return new Response(
    JSON.stringify({ ok: true, sent: messages.length, expo: await res.json() }),
    { headers: { "Content-Type": "application/json" } },
  );
});
