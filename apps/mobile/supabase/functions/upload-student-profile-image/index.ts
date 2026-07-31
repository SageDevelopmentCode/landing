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

  // 2. Parse file + studentId
  const formData = await req.formData();
  const file = formData.get("file") as File;
  const studentId = formData.get("studentId") as string;
  if (!file || !studentId) {
    return new Response(JSON.stringify({ error: "Missing fields" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const adminClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // 3. Ownership check — student must belong to this parent
  const { data: student } = await adminClient
    .schema("admin")
    .from("students")
    .select("id")
    .eq("id", studentId)
    .eq("parent_id", user.id)
    .single();

  if (!student) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 4. Upload to storage
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `students/${studentId}/profile.${ext}`;

  const { error: uploadError } = await adminClient.storage
    .from("profile-images")
    .upload(path, file, { contentType: file.type, upsert: true });

  if (uploadError) {
    return new Response(JSON.stringify({ error: uploadError.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 5. Get public URL and persist to admin.students
  const { data: { publicUrl } } = adminClient.storage
    .from("profile-images")
    .getPublicUrl(path);

  const { error: dbError } = await adminClient
    .schema("admin")
    .from("students")
    .update({ profile_image_url: publicUrl })
    .eq("id", studentId);

  if (dbError) {
    return new Response(JSON.stringify({ error: dbError.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ url: publicUrl }), {
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
});
