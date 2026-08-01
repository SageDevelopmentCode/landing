import { supabase } from "@/lib/supabase";
import * as ImageManipulator from "expo-image-manipulator";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ActivityIngredientImage = {
  id: string;
  storage_path: string;
  signed_url: string;
};

export type ActivityFoodImage = {
  id: string;
  storage_path: string;
  signed_url: string;
};

export type ActivityImage = {
  id: string;
  storage_path: string;
  signed_url: string;
};

export type ActivityIngredient = {
  id: string;
  name: string;
  sort_order: number;
  images: ActivityIngredientImage[];
};

export type ActivityFood = {
  id: string;
  name: string;
  sort_order: number;
  allergens: string | null;
  images: ActivityFoodImage[];
  ingredients: ActivityIngredient[];
};

export type ActivityChangeLogEntry = {
  id: string;
  activity_id: string;
  teacher_id: string;
  teacher_name: string | null;
  teacher_profile_image_url: string | null;
  summary: string[];
  created_at: string;
};

export type Activity = {
  id: string;
  title: string;
  description: string | null;
  includes_food: boolean;
  status: "draft" | "published";
  visibility: "public" | "private";
  created_by: string;
  created_at: string;
  images: ActivityImage[];
  foods: ActivityFood[];
  change_log: ActivityChangeLogEntry[];
};

export type IngredientPayload = {
  name: string;
  sort_order: number;
  imageUri?: string | null;
};

export type FoodPayload = {
  name: string;
  sort_order: number;
  allergens?: string | null;
  imageUris: string[];
  ingredients: IngredientPayload[];
};

export type ActivityUpsertPayload = {
  title: string;
  description: string | null;
  includes_food: boolean;
  status: "draft" | "published";
  visibility: "public" | "private";
  newImageUris: string[];
  existingImagePaths: string[];
  foods: FoodPayload[];
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getSignedUrls(paths: string[]): Promise<Record<string, string>> {
  if (paths.length === 0) return {};
  const { data } = await supabase.storage
    .from("activity-images")
    .createSignedUrls(paths, 3600);
  const map: Record<string, string> = {};
  (data ?? []).forEach((item) => {
    if (item.signedUrl) map[item.path] = item.signedUrl;
  });
  return map;
}

async function uploadActivityImage(uri: string, storagePath: string): Promise<void> {
  const compressed = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 1920 } }],
    { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
  );
  const fileRes = await fetch(compressed.uri);
  const blob = await fileRes.blob();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const uploadRes = await fetch(
    `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/activity-images/${storagePath}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session?.access_token}`,
        "Content-Type": "image/jpeg",
        "x-upsert": "true",
      },
      body: blob,
    }
  );
  if (!uploadRes.ok) {
    const msg = await uploadRes.text();
    throw new Error(`Image upload failed: ${msg}`);
  }
}

async function getProfileMap(
  rows: any[]
): Promise<Record<string, { full_name: string | null; profile_image_url: string | null }>> {
  const ids = [
    ...new Set(
      rows.flatMap((a: any) => (a.change_log ?? []).map((cl: any) => cl.teacher_id as string))
    ),
  ];
  if (ids.length === 0) return {};
  const { data } = await supabase
    .schema("admin")
    .from("users")
    .select("id, full_name, profile_image_url")
    .in("id", ids);
  const map: Record<string, { full_name: string | null; profile_image_url: string | null }> = {};
  (data ?? []).forEach((p: any) => {
    map[p.id] = { full_name: p.full_name ?? null, profile_image_url: p.profile_image_url ?? null };
  });
  return map;
}

function collectAllPaths(activities: any[]): string[] {
  const paths: string[] = [];
  for (const a of activities) {
    for (const img of a.images ?? []) paths.push(img.storage_path);
    for (const food of a.foods ?? []) {
      for (const fi of food.images ?? []) paths.push(fi.storage_path);
      for (const ing of food.ingredients ?? []) {
        for (const ii of ing.images ?? []) paths.push(ii.storage_path);
      }
    }
  }
  return paths;
}

function assembleActivities(
  rows: any[],
  urlMap: Record<string, string>,
  profileMap: Record<string, { full_name: string | null; profile_image_url: string | null }> = {}
): Activity[] {
  return (rows ?? []).map((a) => ({
    id: a.id,
    title: a.title,
    description: a.description ?? null,
    includes_food: a.includes_food ?? false,
    status: a.status,
    visibility: a.visibility,
    created_by: a.created_by,
    created_at: a.created_at,
    images: (a.images ?? []).map((img: any) => ({
      id: img.id,
      storage_path: img.storage_path,
      signed_url: urlMap[img.storage_path] ?? "",
    })),
    foods: (a.foods ?? [])
      .slice()
      .sort((x: any, y: any) => x.sort_order - y.sort_order)
      .map((food: any) => ({
        id: food.id,
        name: food.name,
        sort_order: food.sort_order,
        allergens: food.allergens ?? null,
        images: (food.images ?? []).map((fi: any) => ({
          id: fi.id,
          storage_path: fi.storage_path,
          signed_url: urlMap[fi.storage_path] ?? "",
        })),
        ingredients: (food.ingredients ?? [])
          .slice()
          .sort((x: any, y: any) => x.sort_order - y.sort_order)
          .map((ing: any) => ({
            id: ing.id,
            name: ing.name,
            sort_order: ing.sort_order,
            images: (ing.images ?? []).map((ii: any) => ({
              id: ii.id,
              storage_path: ii.storage_path,
              signed_url: urlMap[ii.storage_path] ?? "",
            })),
          })),
      })),
    change_log: (a.change_log ?? [])
      .slice()
      .sort(
        (x: any, y: any) =>
          new Date(y.created_at).getTime() - new Date(x.created_at).getTime()
      )
      .map((cl: any) => ({
        id: cl.id,
        activity_id: cl.activity_id,
        teacher_id: cl.teacher_id,
        teacher_name: profileMap[cl.teacher_id]?.full_name ?? null,
        teacher_profile_image_url: profileMap[cl.teacher_id]?.profile_image_url ?? null,
        summary: cl.summary ?? [],
        created_at: cl.created_at,
      })),
  }));
}

const NESTED_SELECT = `
  id, title, description, includes_food, status, visibility, created_by, created_at,
  images:activity_images(id, storage_path),
  foods:activity_foods(
    id, name, sort_order, allergens,
    images:activity_food_images(id, storage_path),
    ingredients:activity_ingredients(
      id, name, sort_order,
      images:activity_ingredient_images(id, storage_path)
    )
  ),
  change_log:activity_change_log(id, activity_id, teacher_id, summary, created_at)
`.trim();

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function getActivities(): Promise<Activity[]> {
  const { data, error } = await supabase
    .schema("teachers")
    .from("activities")
    .select(NESTED_SELECT)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const rows = data ?? [];
  const paths = collectAllPaths(rows);
  const [urlMap, profileMap] = await Promise.all([getSignedUrls(paths), getProfileMap(rows)]);
  return assembleActivities(rows, urlMap, profileMap);
}

export async function createActivity(
  payload: ActivityUpsertPayload,
  userId: string
): Promise<Activity> {
  const { data: actRow, error: actErr } = await supabase
    .schema("teachers")
    .from("activities")
    .insert({
      title: payload.title,
      description: payload.description,
      includes_food: payload.includes_food,
      status: payload.status,
      visibility: payload.visibility,
      created_by: userId,
    })
    .select("id")
    .single();

  if (actErr) throw actErr;
  const activityId = actRow.id;

  // Upload + insert activity images
  for (const uri of payload.newImageUris) {
    const storagePath = `${userId}/${activityId}/activity/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
    await uploadActivityImage(uri, storagePath);
    await supabase
      .schema("teachers")
      .from("activity_images")
      .insert({ activity_id: activityId, storage_path: storagePath, uploaded_by: userId });
  }

  // Insert foods
  for (const food of payload.foods) {
    const { data: foodRow, error: foodErr } = await supabase
      .schema("teachers")
      .from("activity_foods")
      .insert({
        activity_id: activityId,
        name: food.name,
        sort_order: food.sort_order,
        allergens: food.allergens ?? null,
      })
      .select("id")
      .single();
    if (foodErr) throw foodErr;
    const foodId = foodRow.id;

    for (const uri of food.imageUris) {
      const sp = `${userId}/${activityId}/food/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
      await uploadActivityImage(uri, sp);
      await supabase
        .schema("teachers")
        .from("activity_food_images")
        .insert({ food_id: foodId, storage_path: sp, uploaded_by: userId });
    }

    for (const ing of food.ingredients) {
      const { data: ingRow, error: ingErr } = await supabase
        .schema("teachers")
        .from("activity_ingredients")
        .insert({ food_id: foodId, name: ing.name, sort_order: ing.sort_order })
        .select("id")
        .single();
      if (ingErr) throw ingErr;

      if (ing.imageUri) {
        const sp = `${userId}/${activityId}/ingredient/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
        await uploadActivityImage(ing.imageUri, sp);
        await supabase
          .schema("teachers")
          .from("activity_ingredient_images")
          .insert({ ingredient_id: ingRow.id, storage_path: sp, uploaded_by: userId });
      }
    }
  }

  // Change log
  await supabase
    .schema("teachers")
    .from("activity_change_log")
    .insert({ activity_id: activityId, teacher_id: userId, summary: ["Created activity"] });

  // Re-fetch
  const { data: refetch, error: refetchErr } = await supabase
    .schema("teachers")
    .from("activities")
    .select(NESTED_SELECT)
    .eq("id", activityId)
    .single();
  if (refetchErr) throw refetchErr;

  const paths = collectAllPaths([refetch]);
  const [urlMap, profileMap] = await Promise.all([getSignedUrls(paths), getProfileMap([refetch])]);
  return assembleActivities([refetch], urlMap, profileMap)[0];
}

export async function updateActivity(
  activityId: string,
  payload: ActivityUpsertPayload,
  original: Activity,
  userId: string
): Promise<Activity> {
  await supabase
    .schema("teachers")
    .from("activities")
    .update({
      title: payload.title,
      description: payload.description,
      includes_food: payload.includes_food,
      status: payload.status,
      visibility: payload.visibility,
    })
    .eq("id", activityId);

  // Replace activity images: delete all, re-insert kept + new
  await supabase
    .schema("teachers")
    .from("activity_images")
    .delete()
    .eq("activity_id", activityId);

  for (const sp of payload.existingImagePaths) {
    await supabase
      .schema("teachers")
      .from("activity_images")
      .insert({ activity_id: activityId, storage_path: sp, uploaded_by: userId });
  }
  for (const uri of payload.newImageUris) {
    const sp = `${userId}/${activityId}/activity/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
    await uploadActivityImage(uri, sp);
    await supabase
      .schema("teachers")
      .from("activity_images")
      .insert({ activity_id: activityId, storage_path: sp, uploaded_by: userId });
  }

  // Replace foods (delete all, cascades children, re-insert)
  await supabase
    .schema("teachers")
    .from("activity_foods")
    .delete()
    .eq("activity_id", activityId);

  for (const food of payload.foods) {
    const { data: foodRow, error: foodErr } = await supabase
      .schema("teachers")
      .from("activity_foods")
      .insert({
        activity_id: activityId,
        name: food.name,
        sort_order: food.sort_order,
        allergens: food.allergens ?? null,
      })
      .select("id")
      .single();
    if (foodErr) throw foodErr;
    const foodId = foodRow.id;

    for (const uri of food.imageUris) {
      const sp = `${userId}/${activityId}/food/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
      await uploadActivityImage(uri, sp);
      await supabase
        .schema("teachers")
        .from("activity_food_images")
        .insert({ food_id: foodId, storage_path: sp, uploaded_by: userId });
    }

    for (const ing of food.ingredients) {
      const { data: ingRow, error: ingErr } = await supabase
        .schema("teachers")
        .from("activity_ingredients")
        .insert({ food_id: foodId, name: ing.name, sort_order: ing.sort_order })
        .select("id")
        .single();
      if (ingErr) throw ingErr;

      if (ing.imageUri) {
        const sp = `${userId}/${activityId}/ingredient/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
        await uploadActivityImage(ing.imageUri, sp);
        await supabase
          .schema("teachers")
          .from("activity_ingredient_images")
          .insert({ ingredient_id: ingRow.id, storage_path: sp, uploaded_by: userId });
      }
    }
  }

  // Build change summary
  const summary: string[] = [];
  if (payload.title !== original.title) summary.push(`Updated title to "${payload.title}"`);
  if (payload.description !== original.description) summary.push("Updated description");
  if (payload.status !== original.status) summary.push(`Status changed to ${payload.status}`);
  if (payload.visibility !== original.visibility) summary.push(`Visibility changed to ${payload.visibility}`);
  if (payload.includes_food !== original.includes_food)
    summary.push(payload.includes_food ? "Added food section" : "Removed food section");
  if (summary.length === 0) summary.push("Updated activity");

  await supabase
    .schema("teachers")
    .from("activity_change_log")
    .insert({ activity_id: activityId, teacher_id: userId, summary });

  // Re-fetch
  const { data: refetch, error: refetchErr } = await supabase
    .schema("teachers")
    .from("activities")
    .select(NESTED_SELECT)
    .eq("id", activityId)
    .single();
  if (refetchErr) throw refetchErr;

  const paths = collectAllPaths([refetch]);
  const [urlMap, profileMap] = await Promise.all([getSignedUrls(paths), getProfileMap([refetch])]);
  return assembleActivities([refetch], urlMap, profileMap)[0];
}

export async function deleteActivity(activityId: string): Promise<void> {
  const { error } = await supabase
    .schema("teachers")
    .from("activities")
    .update({ is_deleted: true })
    .eq("id", activityId);
  if (error) throw error;
}
