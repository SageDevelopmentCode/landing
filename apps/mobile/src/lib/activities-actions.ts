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
  activity_date: string | null;
  status: "draft" | "published";
  visibility: "public" | "private";
  created_by: string;
  created_at: string;
  images: ActivityImage[];
  foods: ActivityFood[];
  change_log: ActivityChangeLogEntry[];
};

/**
 * An image in a form: a local file to upload, or one already in storage
 * (`storagePath` set) that is simply re-linked — never re-uploaded.
 */
export type ImageRef = { uri: string; storagePath?: string | null };

export type IngredientPayload = {
  name: string;
  sort_order: number;
  image?: ImageRef | null;
};

export type FoodPayload = {
  name: string;
  sort_order: number;
  allergens?: string | null;
  images: ImageRef[];
  ingredients: IngredientPayload[];
};

/**
 * Thrown when a new activity's row exists but a later step failed. The form
 * keeps `activityId` so Save retries as an update instead of a duplicate.
 */
export class ActivityPartialSaveError extends Error {
  activityId: string;
  constructor(message: string, activityId: string) {
    super(message);
    this.name = "ActivityPartialSaveError";
    this.activityId = activityId;
  }
}

export type ActivityUpsertPayload = {
  title: string;
  description: string | null;
  includes_food: boolean;
  activity_date: string | null;
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
    if (item.signedUrl && item.path) map[item.path] = item.signedUrl;
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
  if (!session) throw new Error("You're signed out. Sign in and try again.");
  const uploadRes = await fetch(
    `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/activity-images/${storagePath}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
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
    activity_date: a.activity_date ?? null,
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
  id, title, description, includes_food, activity_date, status, visibility, created_by, created_at,
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

export async function getActivity(activityId: string): Promise<Activity | null> {
  const { data, error } = await supabase
    .schema("teachers")
    .from("activities")
    .select(NESTED_SELECT)
    .eq("id", activityId)
    .eq("is_deleted", false)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const paths = collectAllPaths([data]);
  const [urlMap, profileMap] = await Promise.all([getSignedUrls(paths), getProfileMap([data])]);
  return assembleActivities([data], urlMap, profileMap)[0];
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

type ImgKind = "activity" | "food" | "ingredient";

function newPath(userId: string, activityId: string, kind: ImgKind) {
  return `${userId}/${activityId}/${kind}/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
}

type ResolvedFood = {
  name: string;
  sort_order: number;
  allergens: string | null;
  imagePaths: string[];
  ingredients: { name: string; sort_order: number; imagePath: string | null }[];
};

/**
 * Upload every new (local) image first and resolve every image to a storage
 * path, before any row is written. If an upload fails, the ones that already
 * went up are removed and nothing in the database has changed.
 */
async function resolveImages(
  payload: ActivityUpsertPayload,
  userId: string,
  activityId: string,
): Promise<{ activityPaths: string[]; foods: ResolvedFood[]; uploaded: string[] }> {
  const uploaded: string[] = [];
  const up = async (ref: ImageRef, kind: ImgKind) => {
    if (ref.storagePath) return ref.storagePath;
    const sp = newPath(userId, activityId, kind);
    await uploadActivityImage(ref.uri, sp);
    uploaded.push(sp);
    return sp;
  };
  try {
    const activityPaths = [...payload.existingImagePaths];
    for (const uri of payload.newImageUris) activityPaths.push(await up({ uri }, "activity"));
    const foods: ResolvedFood[] = [];
    for (const f of payload.foods) {
      const imagePaths: string[] = [];
      for (const ref of f.images) imagePaths.push(await up(ref, "food"));
      const ingredients = [];
      for (const ing of f.ingredients) {
        ingredients.push({
          name: ing.name,
          sort_order: ing.sort_order,
          imagePath: ing.image ? await up(ing.image, "ingredient") : null,
        });
      }
      foods.push({ name: f.name, sort_order: f.sort_order, allergens: f.allergens ?? null, imagePaths, ingredients });
    }
    return { activityPaths, foods, uploaded };
  } catch (e) {
    if (uploaded.length) void supabase.storage.from("activity-images").remove(uploaded);
    throw e;
  }
}

/** Insert a whole food tree. On any failure the foods it added are removed. */
async function insertFoods(activityId: string, foods: ResolvedFood[], userId: string): Promise<void> {
  const added: string[] = [];
  try {
    for (const food of foods) {
      const { data: foodRow, error: foodErr } = await supabase
        .schema("teachers")
        .from("activity_foods")
        .insert({ activity_id: activityId, name: food.name, sort_order: food.sort_order, allergens: food.allergens })
        .select("id")
        .single();
      if (foodErr) throw foodErr;
      const foodId = foodRow.id as string;
      added.push(foodId);

      if (food.imagePaths.length) {
        const { error } = await supabase
          .schema("teachers")
          .from("activity_food_images")
          .insert(food.imagePaths.map((sp) => ({ food_id: foodId, storage_path: sp, uploaded_by: userId })));
        if (error) throw error;
      }
      for (const ing of food.ingredients) {
        const { data: ingRow, error: ingErr } = await supabase
          .schema("teachers")
          .from("activity_ingredients")
          .insert({ food_id: foodId, name: ing.name, sort_order: ing.sort_order })
          .select("id")
          .single();
        if (ingErr) throw ingErr;
        if (ing.imagePath) {
          const { error } = await supabase
            .schema("teachers")
            .from("activity_ingredient_images")
            .insert({ ingredient_id: ingRow.id, storage_path: ing.imagePath, uploaded_by: userId });
          if (error) throw error;
        }
      }
    }
  } catch (e) {
    if (added.length) await supabase.schema("teachers").from("activity_foods").delete().in("id", added);
    throw e;
  }
}

async function refetchActivity(activityId: string): Promise<Activity> {
  const a = await getActivity(activityId);
  if (!a) throw new Error("Saved, but couldn't reload the activity.");
  return a;
}

function allPathsOf(a: { images: { storage_path: string }[]; foods: ActivityFood[] }): string[] {
  return [
    ...a.images.map((i) => i.storage_path),
    ...a.foods.flatMap((f) => [
      ...f.images.map((i) => i.storage_path),
      ...f.ingredients.flatMap((ing) => ing.images.map((i) => i.storage_path)),
    ]),
  ];
}

export async function createActivity(
  payload: ActivityUpsertPayload,
  userId: string
): Promise<Activity> {
  // Created as a private draft and switched to the chosen status at the very
  // end, so the "new activity" push to parents fires only once the photos and
  // foods are in place (the trigger fires on draft → published).
  const { data: actRow, error: actErr } = await supabase
    .schema("teachers")
    .from("activities")
    .insert({
      title: payload.title,
      description: payload.description,
      includes_food: payload.includes_food,
      activity_date: payload.activity_date?.trim() || null,
      status: "draft",
      visibility: "private",
      created_by: userId,
    })
    .select("id")
    .single();

  if (actErr) throw actErr;
  const activityId = actRow.id as string;

  try {
    const resolved = await resolveImages(payload, userId, activityId);
    if (resolved.activityPaths.length) {
      const { error } = await supabase
        .schema("teachers")
        .from("activity_images")
        .insert(resolved.activityPaths.map((sp) => ({ activity_id: activityId, storage_path: sp, uploaded_by: userId })));
      if (error) throw error;
    }
    await insertFoods(activityId, resolved.foods, userId);

    await supabase
      .schema("teachers")
      .from("activity_change_log")
      .insert({ activity_id: activityId, teacher_id: userId, summary: ["Created activity"] });

    if (payload.status !== "draft" || payload.visibility !== "private") {
      const { error } = await supabase
        .schema("teachers")
        .from("activities")
        .update({ status: payload.status, visibility: payload.visibility })
        .eq("id", activityId);
      if (error) throw error;
    }

    return refetchActivity(activityId);
  } catch (e) {
    throw new ActivityPartialSaveError(
      e instanceof Error ? e.message : "Some parts of the activity didn't save.",
      activityId,
    );
  }
}

export async function updateActivity(
  activityId: string,
  payload: ActivityUpsertPayload,
  original: Activity,
  userId: string
): Promise<Activity> {
  // 1. Every new file goes up first; nothing in the database changes if one fails.
  const resolved = await resolveImages(payload, userId, activityId);
  const keep = new Set(resolved.activityPaths);
  const dropIds = original.images.filter((img) => !keep.has(img.storage_path)).map((img) => img.id);
  const have = new Set(original.images.map((img) => img.storage_path));
  const addPaths = resolved.activityPaths.filter((sp) => !have.has(sp));
  try {
    // 2. The activity row. RLS only lets the creator update, and a blocked
    //    update returns no error — so check a row actually changed.
    const { count, error: updErr } = await supabase
      .schema("teachers")
      .from("activities")
      .update(
        {
          title: payload.title,
          description: payload.description,
          includes_food: payload.includes_food,
          activity_date: payload.activity_date?.trim() || null,
          status: payload.status,
          visibility: payload.visibility,
        },
        { count: "exact" },
      )
      .eq("id", activityId);
    if (updErr) throw updErr;
    if (count === 0) throw new Error("You can only edit activities you created.");

    // 3. Activity photos: drop the removed rows, add the new ones.
    if (addPaths.length) {
      const { error } = await supabase
        .schema("teachers")
        .from("activity_images")
        .insert(addPaths.map((sp) => ({ activity_id: activityId, storage_path: sp, uploaded_by: userId })));
      if (error) throw error;
    }
    if (dropIds.length) {
      const { error } = await supabase.schema("teachers").from("activity_images").delete().in("id", dropIds);
      if (error) throw error;
    }

    // 4. Foods: write the new tree first, then remove the old one, so a
    //    failure never leaves the activity with its foods wiped.
    await insertFoods(activityId, resolved.foods, userId);
    const oldFoodIds = original.foods.map((f) => f.id);
    if (oldFoodIds.length) {
      const { error } = await supabase.schema("teachers").from("activity_foods").delete().in("id", oldFoodIds);
      if (error) throw error;
    }
  } catch (e) {
    if (addPaths.length) {
      await supabase
        .schema("teachers")
        .from("activity_images")
        .delete()
        .eq("activity_id", activityId)
        .in("storage_path", addPaths);
    }
    if (resolved.uploaded.length) void supabase.storage.from("activity-images").remove(resolved.uploaded);
    throw e;
  }

  // 5. Change log (best effort — the save itself already succeeded).
  const summary: string[] = [];
  if (payload.title !== original.title) summary.push(`Updated title to "${payload.title}"`);
  if (payload.description !== original.description) summary.push("Updated description");
  if ((payload.activity_date ?? "") !== (original.activity_date ?? ""))
    summary.push(`Activity date set to ${payload.activity_date || "none"}`);
  if (payload.status !== original.status) summary.push(`Status changed to ${payload.status}`);
  if (payload.visibility !== original.visibility) summary.push(`Visibility changed to ${payload.visibility}`);
  if (payload.includes_food !== original.includes_food)
    summary.push(payload.includes_food ? "Added food section" : "Removed food section");
  const addedPhotos = payload.newImageUris.length;
  const removedPhotos = original.images.length - payload.existingImagePaths.length;
  if (addedPhotos > 0) summary.push(`Added ${addedPhotos} photo${addedPhotos === 1 ? "" : "s"}`);
  if (removedPhotos > 0) summary.push(`Removed ${removedPhotos} photo${removedPhotos === 1 ? "" : "s"}`);
  const foodSig = (fs: { name: string }[]) => fs.map((f) => f.name.trim()).join("|");
  if (payload.includes_food && payload.includes_food === original.includes_food && foodSig(payload.foods) !== foodSig(original.foods))
    summary.push("Updated foods");
  if (summary.length === 0) summary.push("Updated activity");
  await supabase
    .schema("teachers")
    .from("activity_change_log")
    .insert({ activity_id: activityId, teacher_id: userId, summary });

  // 6. Files nobody points at any more.
  const nowUsed = new Set([...resolved.activityPaths, ...resolved.foods.flatMap((f) => [...f.imagePaths, ...f.ingredients.map((i) => i.imagePath ?? "")])]);
  const orphaned = allPathsOf(original).filter((sp) => !nowUsed.has(sp));
  if (orphaned.length) void supabase.storage.from("activity-images").remove(orphaned);

  return refetchActivity(activityId);
}

export async function deleteActivity(activityId: string): Promise<void> {
  // RLS lets only the creator update; a blocked update affects 0 rows with no
  // error, so count the rows instead of assuming it worked. (No RETURNING: the
  // read policy hides deleted rows.)
  const { count, error } = await supabase
    .schema("teachers")
    .from("activities")
    .update({ is_deleted: true }, { count: "exact" })
    .eq("id", activityId);
  if (error) throw error;
  if (count === 0) throw new Error("You can only delete activities you created.");
}
