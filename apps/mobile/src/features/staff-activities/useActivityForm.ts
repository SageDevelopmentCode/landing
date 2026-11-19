// New / Edit Activity form: state, validation, dirty tracking and save.
// - Edit never falls back to "create" when the load fails — the screen shows
//   Retry instead.
// - Kept photos (activity, food, ingredient) carry their storage path, so a
//   save re-links them instead of re-uploading.
// - If a new activity's row was created but a later step failed, the id is
//   kept so Save retries as an update (no duplicate activity).
import { useStaffRole } from "@/features/staff-shared/useStaffRole";
import {
  ActivityPartialSaveError,
  createActivity,
  getActivity,
  updateActivity,
  type Activity,
  type ActivityUpsertPayload,
  type ImageRef,
} from "@/lib/activities-actions";
import { notifyError } from "@/lib/discord";
import * as ImagePicker from "expo-image-picker";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type ImgItem = ImageRef & { key: string };
export type IngredientDraft = { localId: string; name: string; image: ImgItem | null };
export type FoodDraft = {
  localId: string;
  name: string;
  allergens: string;
  images: ImgItem[];
  ingredients: IngredientDraft[];
};

export type FormErrors = {
  title?: string;
  noFoods?: string;
  foodName: Record<string, string>;
  ingredientName: Record<string, string>;
};

export type SaveResult =
  | { ok: true; activity: Activity; created: boolean }
  | { ok: false; reason: "invalid"; firstError: string }
  | { ok: false; reason: "error"; error: string; partial?: boolean };

let seq = 0;
const genId = () => `l${Date.now().toString(36)}${(seq++).toString(36)}`;

const MAX_PHOTOS = 10;

function fromActivity(a: Activity) {
  return {
    title: a.title,
    description: a.description ?? "",
    activityDate: a.activity_date ?? "",
    status: a.status,
    visibility: a.visibility,
    includesFood: a.includes_food,
    images: a.images.map<ImgItem>((img) => ({ key: img.id, uri: img.signed_url, storagePath: img.storage_path })),
    foods: a.foods.map<FoodDraft>((f) => ({
      localId: f.id,
      name: f.name,
      allergens: f.allergens ?? "",
      images: f.images.map((fi) => ({ key: fi.id, uri: fi.signed_url, storagePath: fi.storage_path })),
      ingredients: f.ingredients.map((ing) => ({
        localId: ing.id,
        name: ing.name,
        image: ing.images[0]
          ? { key: ing.images[0].id, uri: ing.images[0].signed_url, storagePath: ing.images[0].storage_path }
          : null,
      })),
    })),
  };
}

type Snapshot = ReturnType<typeof fromActivity>;

const EMPTY: Snapshot = {
  title: "",
  description: "",
  activityDate: "",
  status: "draft",
  visibility: "private",
  includesFood: false,
  images: [],
  foods: [],
};

/** A comparable fingerprint (ignores signed URLs, which change per load). */
function fingerprint(s: Snapshot) {
  const img = (i: ImgItem | null) => (i ? i.storagePath ?? i.uri : null);
  return JSON.stringify({
    ...s,
    title: s.title.trim(),
    description: s.description.trim(),
    images: s.images.map(img),
    foods: s.foods.map((f) => ({
      n: f.name,
      a: f.allergens,
      i: f.images.map(img),
      g: f.ingredients.map((g) => [g.name, img(g.image)]),
    })),
  });
}

export function useActivityForm(activityId: string | undefined) {
  const { userId } = useStaffRole();
  const isEdit = !!activityId;
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error" | "notFound" | "forbidden">(
    isEdit ? "loading" : "ready",
  );
  const [original, setOriginal] = useState<Activity | null>(null);
  const [baseline, setBaseline] = useState<string>(() => fingerprint(EMPTY));
  const [form, setForm] = useState<Snapshot>(EMPTY);
  const [errors, setErrors] = useState<FormErrors>({ foodName: {}, ingredientName: {} });
  const [saving, setSaving] = useState(false);
  /** Set after a partial create: later saves update this row. */
  const [createdId, setCreatedId] = useState<string | null>(null);
  const lock = useRef(false);

  const load = useCallback(async () => {
    if (!activityId) return;
    setLoadState("loading");
    try {
      const a = await getActivity(activityId);
      if (!a) return setLoadState("notFound");
      if (!userId || a.created_by !== userId) return setLoadState("forbidden");
      const snap = fromActivity(a);
      setOriginal(a);
      setForm(snap);
      setBaseline(fingerprint(snap));
      setLoadState("ready");
    } catch (e) {
      notifyError("staff-activity-form-load", e);
      setLoadState("error");
    }
  }, [activityId, userId]);

  useEffect(() => {
    void load();
  }, [load]);

  const dirty = useMemo(() => fingerprint(form) !== baseline, [form, baseline]);

  // ── Field setters ──────────────────────────────────────────────────────────
  const set = useCallback(<K extends keyof Snapshot>(k: K, v: Snapshot[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (k === "title") setErrors((e) => ({ ...e, title: undefined }));
  }, []);

  const setStatus = useCallback((v: "draft" | "published") => {
    // Drafts are never public.
    setForm((f) => ({ ...f, status: v, visibility: v === "draft" ? "private" : f.visibility }));
  }, []);

  const pick = useCallback(async (multiple: boolean, limit: number): Promise<string[]> => {
    if (limit <= 0) return [];
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: multiple,
      selectionLimit: multiple ? limit : 1,
      quality: 0.85,
    });
    return r.canceled ? [] : r.assets.map((a) => a.uri);
  }, []);

  const addPhotos = useCallback(async () => {
    const uris = await pick(true, MAX_PHOTOS - form.images.length);
    if (uris.length)
      setForm((f) => ({
        ...f,
        images: [...f.images, ...uris.map((uri) => ({ key: genId(), uri }))].slice(0, MAX_PHOTOS),
      }));
    return uris.length;
  }, [pick, form.images.length]);

  const removePhoto = useCallback((key: string) => {
    setForm((f) => ({ ...f, images: f.images.filter((i) => i.key !== key) }));
  }, []);

  const addFood = useCallback(() => {
    const localId = genId();
    setForm((f) => ({
      ...f,
      foods: [...f.foods, { localId, name: "", allergens: "", images: [], ingredients: [] }],
    }));
    setErrors((e) => ({ ...e, noFoods: undefined }));
    return localId;
  }, []);

  const updateFood = useCallback((localId: string, patch: Partial<Omit<FoodDraft, "localId">>) => {
    setForm((f) => ({ ...f, foods: f.foods.map((x) => (x.localId === localId ? { ...x, ...patch } : x)) }));
    if (patch.name !== undefined)
      setErrors((e) => {
        const { [localId]: _, ...rest } = e.foodName;
        return { ...e, foodName: rest };
      });
  }, []);

  const removeFood = useCallback((localId: string) => {
    setForm((f) => ({ ...f, foods: f.foods.filter((x) => x.localId !== localId) }));
  }, []);

  const addFoodPhoto = useCallback(
    async (localId: string) => {
      const [uri] = await pick(false, 1);
      if (!uri) return false;
      setForm((f) => ({
        ...f,
        foods: f.foods.map((x) => (x.localId === localId ? { ...x, images: [...x.images, { key: genId(), uri }] } : x)),
      }));
      return true;
    },
    [pick],
  );

  const removeFoodPhoto = useCallback((localId: string, key: string) => {
    setForm((f) => ({
      ...f,
      foods: f.foods.map((x) => (x.localId === localId ? { ...x, images: x.images.filter((i) => i.key !== key) } : x)),
    }));
  }, []);

  const addIngredient = useCallback((foodId: string) => {
    const localId = genId();
    setForm((f) => ({
      ...f,
      foods: f.foods.map((x) =>
        x.localId === foodId ? { ...x, ingredients: [...x.ingredients, { localId, name: "", image: null }] } : x,
      ),
    }));
    return localId;
  }, []);

  const updateIngredient = useCallback((foodId: string, ingId: string, patch: Partial<IngredientDraft>) => {
    setForm((f) => ({
      ...f,
      foods: f.foods.map((x) =>
        x.localId === foodId
          ? { ...x, ingredients: x.ingredients.map((g) => (g.localId === ingId ? { ...g, ...patch } : g)) }
          : x,
      ),
    }));
    if (patch.name !== undefined)
      setErrors((e) => {
        const { [ingId]: _, ...rest } = e.ingredientName;
        return { ...e, ingredientName: rest };
      });
  }, []);

  const removeIngredient = useCallback((foodId: string, ingId: string) => {
    setForm((f) => ({
      ...f,
      foods: f.foods.map((x) =>
        x.localId === foodId ? { ...x, ingredients: x.ingredients.filter((g) => g.localId !== ingId) } : x,
      ),
    }));
  }, []);

  const pickIngredientPhoto = useCallback(
    async (foodId: string, ingId: string) => {
      const [uri] = await pick(false, 1);
      if (!uri) return false;
      updateIngredient(foodId, ingId, { image: { key: genId(), uri } });
      return true;
    },
    [pick, updateIngredient],
  );

  // ── Validation ─────────────────────────────────────────────────────────────
  const validate = useCallback((): { errors: FormErrors; first: string | null } => {
    const e: FormErrors = { foodName: {}, ingredientName: {} };
    let first: string | null = null;
    const note = (msg: string) => (first ??= msg);
    if (!form.title.trim()) e.title = note("Title is required.");
    if (form.includesFood) {
      if (form.foods.length === 0) e.noFoods = note("Add at least one food, or turn off Includes Food.");
      form.foods.forEach((f, i) => {
        if (!f.name.trim()) e.foodName[f.localId] = note(`Food ${i + 1} needs a name.`);
        f.ingredients.forEach((g) => {
          if (!g.name.trim()) e.ingredientName[g.localId] = note(`An ingredient in ${f.name.trim() || `Food ${i + 1}`} needs a name.`);
        });
      });
    }
    return { errors: e, first };
  }, [form]);

  // ── Save ───────────────────────────────────────────────────────────────────
  const save = useCallback(async (): Promise<SaveResult> => {
    const v = validate();
    setErrors(v.errors);
    if (v.first) return { ok: false, reason: "invalid", firstError: v.first };
    if (lock.current) return { ok: false, reason: "error", error: "Already saving." };
    if (!userId) return { ok: false, reason: "error", error: "Not authenticated" };
    lock.current = true;
    setSaving(true);
    try {
      const payload: ActivityUpsertPayload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        includes_food: form.includesFood,
        activity_date: form.activityDate.trim() || null,
        status: form.status,
        visibility: form.visibility,
        newImageUris: form.images.filter((i) => !i.storagePath).map((i) => i.uri),
        existingImagePaths: form.images.filter((i) => !!i.storagePath).map((i) => i.storagePath!),
        foods: form.includesFood
          ? form.foods.map((f, fi) => ({
              name: f.name.trim(),
              sort_order: fi,
              allergens: f.allergens.trim() || null,
              images: f.images.map(({ uri, storagePath }) => ({ uri, storagePath })),
              ingredients: f.ingredients.map((g, gi) => ({
                name: g.name.trim(),
                sort_order: gi,
                image: g.image ? { uri: g.image.uri, storagePath: g.image.storagePath } : null,
              })),
            }))
          : [],
      };

      let saved: Activity;
      let created = false;
      const targetId = activityId ?? createdId;
      if (targetId) {
        const base = original ?? (await getActivity(targetId));
        if (!base) throw new Error("This activity no longer exists.");
        saved = await updateActivity(targetId, payload, base, userId);
      } else {
        saved = await createActivity(payload, userId);
        created = true;
      }

      if (saved.status === "published" && saved.visibility === "public") {
        const { syncActivityFeedPost } = await import("@/lib/feed-auto-actions");
        syncActivityFeedPost(saved.id).catch((e) => notifyError("staff-activity-feed-sync", e));
      }

      const snap = fromActivity(saved);
      setOriginal(saved);
      setForm(snap);
      setBaseline(fingerprint(snap));
      return { ok: true, activity: saved, created };
    } catch (e) {
      notifyError("staff-activity-save", e);
      if (e instanceof ActivityPartialSaveError) {
        setCreatedId(e.activityId);
        try {
          const partial = await getActivity(e.activityId);
          if (partial) setOriginal(partial);
        } catch {
          // The retry will fetch it again.
        }
        return { ok: false, reason: "error", error: e.message, partial: true };
      }
      return { ok: false, reason: "error", error: e instanceof Error ? e.message : "Something went wrong" };
    } finally {
      lock.current = false;
      setSaving(false);
    }
  }, [validate, userId, form, activityId, createdId, original]);

  return {
    isEdit,
    loadState,
    retryLoad: load,
    form,
    set,
    setStatus,
    errors,
    dirty,
    saving,
    save,
    createdId,
    photoLimit: MAX_PHOTOS,
    addPhotos,
    removePhoto,
    addFood,
    updateFood,
    removeFood,
    addFoodPhoto,
    removeFoodPhoto,
    addIngredient,
    updateIngredient,
    removeIngredient,
    pickIngredientPhoto,
  };
}

export type ActivityForm = ReturnType<typeof useActivityForm>;
