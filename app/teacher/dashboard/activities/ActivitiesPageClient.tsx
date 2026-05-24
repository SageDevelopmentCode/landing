"use client";

import { useState, useRef, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import {
  Plus,
  X,
  ActivitySquare,
  Utensils,
  Trash2,
  ImagePlus,
  Loader2,
  UtensilsCrossed,
  Lock,
  Globe,
  ShieldAlert,
  ClipboardList,
  Pencil,
  History,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { createActivity, deleteActivity, updateActivity } from "@/app/actions/activities";
import type { Activity, ActivityChangeLogEntry } from "@/app/actions/activities";

// ─── Types ────────────────────────────────────────────────────────────────────

// existingPath marks images seeded from the DB — no File to upload, just re-point the DB row
type LocalImage = {
  id: string;
  preview: string;
  compressedFile: File | null;
  existingPath?: string;
};
type Ingredient = { id: string; name: string; image: LocalImage | null };
type Food = { id: string; name: string; allergens: string; images: LocalImage[]; ingredients: Ingredient[] };
type ActivityDraft = {
  name: string;
  description: string;
  includesFood: boolean;
  status: "draft" | "published";
  visibility: "public" | "private";
  images: LocalImage[];
  foods: Food[];
};

function makeId() {
  return Math.random().toString(36).slice(2, 9);
}

function splitIngredients(raw: string): string[] {
  const result: string[] = [];
  let depth = 0;
  let current = "";
  for (const ch of raw) {
    if (ch === "(") { depth++; current += ch; }
    else if (ch === ")") { depth--; current += ch; }
    else if (ch === "," && depth === 0) {
      const t = current.trim();
      if (t) result.push(t);
      current = "";
    } else {
      current += ch;
    }
  }
  const last = current.trim().replace(/\.$/, "").trim();
  if (last) result.push(last);
  return result.filter(Boolean);
}

function relativeTime(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 5) return "just now";
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const EMPTY_DRAFT: ActivityDraft = {
  name: "",
  description: "",
  includesFood: false,
  status: "draft",
  visibility: "private",
  images: [],
  foods: [],
};

async function compress(file: File): Promise<File> {
  try {
    const { compressImage } = await import("@/app/utils/compressImage");
    return await compressImage(file);
  } catch {
    return file;
  }
}

async function makeLocalImage(file: File): Promise<LocalImage> {
  const compressedFile = await compress(file);
  return { id: makeId(), compressedFile, preview: URL.createObjectURL(compressedFile) };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Seed a draft from an existing persisted Activity
function activityToDraft(activity: Activity): ActivityDraft {
  return {
    name: activity.title,
    description: activity.description ?? "",
    includesFood: activity.includes_food,
    status: activity.status,
    visibility: activity.visibility,
    images: activity.images.map((img) => ({
      id: img.id,
      preview: img.signed_url,
      compressedFile: null,
      existingPath: img.storage_path,
    })),
    foods: activity.foods.map((f) => ({
      id: f.id,
      name: f.name,
      allergens: f.allergens ?? "",
      images: f.images.map((img) => ({
        id: img.id,
        preview: img.signed_url,
        compressedFile: null,
        existingPath: img.storage_path,
      })),
      ingredients: f.ingredients.map((ing) => ({
        id: ing.id,
        name: ing.name,
        image: ing.images[0]
          ? { id: ing.images[0].id, preview: ing.images[0].signed_url, compressedFile: null, existingPath: ing.images[0].storage_path }
          : null,
      })),
    })),
  };
}

// Build a human-readable summary of what changed between draft and original activity
function buildEditSummary(draft: ActivityDraft, original: Activity): string[] {
  const s: string[] = [];
  if (draft.name.trim() !== original.title) s.push(`Updated title to "${draft.name.trim()}"`);
  if (draft.description.trim() !== (original.description ?? "")) s.push("Updated description");
  if (draft.status !== original.status) s.push(`Status changed to ${draft.status}`);
  if (draft.visibility !== original.visibility) s.push(`Visibility changed to ${draft.visibility}`);
  if (draft.includesFood !== original.includes_food) s.push(`Includes food set to ${draft.includesFood}`);

  const imgAfter = draft.images.length;
  const imgBefore = original.images.length;
  if (imgAfter > imgBefore) s.push(`Added ${imgAfter - imgBefore} activity image(s)`);
  if (imgAfter < imgBefore) s.push(`Removed ${imgBefore - imgAfter} activity image(s)`);

  const foodsBefore = original.foods.map((f) => f.name).join(",");
  const foodsAfter = draft.foods.map((f) => f.name).join(",");
  if (foodsBefore !== foodsAfter) s.push("Updated foods list");

  const ingBefore = original.foods.reduce((n, f) => n + f.ingredients.length, 0);
  const ingAfter = draft.foods.reduce((n, f) => n + f.ingredients.length, 0);
  if (ingAfter !== ingBefore) s.push(`Ingredients count changed (${ingBefore} → ${ingAfter})`);

  return s.length ? s : ["Saved activity"];
}

// ─── Image Upload Strip (supports click + drag-and-drop) ─────────────────────

function ImageUploadStrip({
  images,
  onAdd,
  onRemove,
}: {
  images: LocalImage[];
  onAdd: (files: FileList) => void;
  onRemove: (id: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      onAdd(e.target.files);
      e.target.value = "";
    }
  }

  function handleDragOver(e: React.DragEvent) { e.preventDefault(); setIsDragging(true); }
  function handleDragLeave(e: React.DragEvent) {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragging(false);
  }
  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) onAdd(e.dataTransfer.files);
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex flex-wrap gap-2 rounded-xl p-1.5 transition-colors ${
        isDragging ? "bg-[#4a7c59]/8 ring-2 ring-[#4a7c59]/30" : ""
      }`}
    >
      {images.map((img) => (
        <div key={img.id} className="relative w-18 h-18 shrink-0">
          <Image
            src={img.preview}
            alt=""
            fill
            className="object-cover rounded-xl border border-gray-200"
            unoptimized
          />
          <button
            onClick={() => onRemove(img.id)}
            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-500 hover:text-red-500 hover:border-red-200 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}

      <button
        onClick={() => inputRef.current?.click()}
        className={`w-18 h-18 shrink-0 flex flex-col items-center justify-center gap-1 border-2 border-dashed rounded-xl transition-colors ${
          isDragging
            ? "border-[#4a7c59] text-[#4a7c59] bg-[#4a7c59]/5"
            : "border-gray-200 text-gray-400 hover:border-[#4a7c59] hover:text-[#4a7c59] hover:bg-[#4a7c59]/5"
        }`}
      >
        <ImagePlus className="w-4 h-4" />
        <span className="text-[10px] font-body font-semibold">{isDragging ? "Drop" : "Add"}</span>
      </button>

      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
    </div>
  );
}

// ─── Ingredient Image Slot ────────────────────────────────────────────────────

function IngredientImageSlot({
  image,
  onSet,
  onRemove,
}: {
  image: LocalImage | null;
  onSet: (file: File) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) { onSet(file); e.target.value = ""; }
  }
  function handleDragOver(e: React.DragEvent) { e.preventDefault(); setIsDragging(true); }
  function handleDragLeave(e: React.DragEvent) {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragging(false);
  }
  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) onSet(file);
  }

  if (image) {
    return (
      <div className="relative w-7 h-7 shrink-0">
        <Image src={image.preview} alt="" fill className="object-cover rounded-lg border border-gray-200" unoptimized />
        <button
          onClick={onRemove}
          className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors"
        >
          <X className="w-2 h-2" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => inputRef.current?.click()}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      title="Add ingredient photo"
      className={`w-7 h-7 shrink-0 flex items-center justify-center border border-dashed rounded-lg transition-colors ${
        isDragging
          ? "border-[#4a7c59] bg-[#4a7c59]/8 text-[#4a7c59]"
          : "border-gray-300 text-gray-400 hover:border-[#4a7c59] hover:text-[#4a7c59] hover:bg-[#4a7c59]/5"
      }`}
    >
      <ImagePlus className="w-3 h-3" />
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFiles} />
    </button>
  );
}

// ─── Food Card ────────────────────────────────────────────────────────────────

function FoodCard({
  food,
  onUpdate,
  onRemove,
  defaultCollapsed = false,
}: {
  food: Food;
  onUpdate: (updated: Food) => void;
  onRemove: () => void;
  defaultCollapsed?: boolean;
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");

  const ingredientSummary = food.ingredients
    .map((i) => i.name.trim())
    .filter(Boolean)
    .join(", ");

  function handleBulkAdd() {
    const parsed = splitIngredients(pasteText);
    if (!parsed.length) return;
    const newIngredients: Ingredient[] = parsed.map((name) => ({ id: makeId(), name, image: null }));
    onUpdate({ ...food, ingredients: [...food.ingredients, ...newIngredients] });
    setPasteText("");
    setPasteOpen(false);
  }

  async function addFoodImages(files: FileList) {
    const newImgs = await Promise.all(Array.from(files).map(makeLocalImage));
    onUpdate({ ...food, images: [...food.images, ...newImgs] });
  }

  function removeFoodImage(id: string) {
    const img = food.images.find((i) => i.id === id);
    if (img?.compressedFile) URL.revokeObjectURL(img.preview);
    onUpdate({ ...food, images: food.images.filter((i) => i.id !== id) });
  }

  function addIngredient() {
    onUpdate({ ...food, ingredients: [...food.ingredients, { id: makeId(), name: "", image: null }] });
  }

  function updateIngredient(id: string, name: string) {
    onUpdate({ ...food, ingredients: food.ingredients.map((ing) => (ing.id === id ? { ...ing, name } : ing)) });
  }

  async function setIngredientImage(id: string, file: File) {
    const localImg = await makeLocalImage(file);
    onUpdate({
      ...food,
      ingredients: food.ingredients.map((ing) => {
        if (ing.id !== id) return ing;
        if (ing.image?.compressedFile) URL.revokeObjectURL(ing.image.preview);
        return { ...ing, image: localImg };
      }),
    });
  }

  function removeIngredientImage(id: string) {
    onUpdate({
      ...food,
      ingredients: food.ingredients.map((ing) => {
        if (ing.id !== id) return ing;
        if (ing.image?.compressedFile) URL.revokeObjectURL(ing.image.preview);
        return { ...ing, image: null };
      }),
    });
  }

  function removeIngredient(id: string) {
    const ing = food.ingredients.find((i) => i.id === id);
    if (ing?.image?.compressedFile) URL.revokeObjectURL(ing.image.preview);
    onUpdate({ ...food, ingredients: food.ingredients.filter((i) => i.id !== id) });
  }

  if (collapsed) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Utensils className="w-4 h-4 text-[#4a7c59] shrink-0" />
          <span className="flex-1 text-sm font-semibold font-body text-gray-800 truncate">
            {food.name || <span className="text-gray-400 font-normal">Unnamed food</span>}
          </span>
          <button
            onClick={() => setCollapsed(false)}
            className="p-1 rounded-lg text-gray-400 hover:text-[#4a7c59] hover:bg-[#4a7c59]/8 transition-colors"
            title="Expand"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
          <button
            onClick={onRemove}
            className="p-1 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            title="Remove food"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
        {ingredientSummary && (
          <p className="pl-6 text-xs font-body text-gray-400 truncate">{ingredientSummary}</p>
        )}
      </div>
    );
  }

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 flex flex-col gap-3">
      {/* Food name row */}
      <div className="flex items-center gap-2">
        <Utensils className="w-4 h-4 text-[#4a7c59] shrink-0" />
        <input
          type="text"
          value={food.name}
          onChange={(e) => onUpdate({ ...food, name: e.target.value })}
          placeholder="Food name (e.g. Pasta)"
          className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm font-body text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/20 focus:border-[#4a7c59] transition-colors bg-white"
        />
        <button
          onClick={() => setCollapsed(true)}
          className="p-1 rounded-lg text-gray-400 hover:text-[#4a7c59] hover:bg-[#4a7c59]/8 transition-colors"
          title="Collapse"
        >
          <ChevronUp className="w-4 h-4" />
        </button>
        <button
          onClick={onRemove}
          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
          title="Remove food"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Food photos */}
      <div className="pl-6 flex flex-col gap-1.5">
        <p className="text-xs font-semibold text-gray-500 font-body uppercase tracking-wide">Photo</p>
        <ImageUploadStrip images={food.images} onAdd={addFoodImages} onRemove={removeFoodImage} />
      </div>

      {/* Ingredients */}
      <div className="pl-6 flex flex-col gap-2">
        <p className="text-xs font-semibold text-gray-500 font-body uppercase tracking-wide">Ingredients</p>
        {food.ingredients.length === 0 && (
          <p className="text-xs text-gray-400 font-body italic">No ingredients added yet.</p>
        )}
        {food.ingredients.map((ing) => (
          <div key={ing.id} className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0" />
            <input
              type="text"
              value={ing.name}
              onChange={(e) => updateIngredient(ing.id, e.target.value)}
              placeholder="Ingredient name"
              className="flex-1 border border-gray-200 rounded-xl px-3 py-1.5 text-sm font-body text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/20 focus:border-[#4a7c59] transition-colors bg-white"
            />
            <IngredientImageSlot
              image={ing.image}
              onSet={(file) => setIngredientImage(ing.id, file)}
              onRemove={() => removeIngredientImage(ing.id)}
            />
            <button
              onClick={() => removeIngredient(ing.id)}
              className="p-1 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        <div className="flex items-center gap-3 mt-1">
          <button
            onClick={addIngredient}
            className="flex items-center gap-1 text-xs font-semibold font-body text-[#4a7c59] hover:text-[#3d6b4f] transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Ingredient
          </button>
          <button
            onClick={() => { setPasteOpen((v) => !v); setPasteText(""); }}
            className="flex items-center gap-1 text-xs font-semibold font-body text-gray-400 hover:text-[#4a7c59] transition-colors"
          >
            <ClipboardList className="w-3.5 h-3.5" />
            Paste list
          </button>
        </div>
        {pasteOpen && (
          <div className="flex flex-col gap-2 mt-1">
            <textarea
              autoFocus
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="Paste ingredient list, e.g. Flour, Water, Salt, Baking Powder (Sodium Bicarbonate, Corn Starch)..."
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs font-body text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/20 focus:border-[#4a7c59] transition-colors bg-white resize-none"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => { setPasteOpen(false); setPasteText(""); }}
                className="px-3 py-1.5 text-xs font-semibold font-body text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkAdd}
                disabled={!pasteText.trim()}
                className="px-3 py-1.5 text-xs font-semibold font-body text-white bg-[#4a7c59] hover:bg-[#3d6b4f] rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Add Ingredients
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Allergens & safety warnings */}
      <div className="pl-6 flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <p className="text-xs font-semibold text-gray-500 font-body uppercase tracking-wide">
            Allergens & Safety Warnings
          </p>
        </div>
        <textarea
          value={food.allergens}
          onChange={(e) => onUpdate({ ...food, allergens: e.target.value })}
          placeholder="e.g. Contains: WHEAT. Manufactured in a facility that processes MILK, EGG, SOY..."
          rows={2}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs font-body text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/20 focus:border-[#4a7c59] transition-colors bg-white resize-none"
        />
      </div>
    </div>
  );
}

// ─── Activity Drawer (create + edit) ─────────────────────────────────────────

function ActivityDrawer({
  editingActivity,
  onClose,
  onSaved,
  onUpdated,
}: {
  editingActivity?: Activity;
  onClose: () => void;
  onSaved: (activity: Activity) => void;
  onUpdated: (activity: Activity) => void;
}) {
  const isEdit = !!editingActivity;
  const [draft, setDraft] = useState<ActivityDraft>(
    isEdit ? activityToDraft(editingActivity!) : EMPTY_DRAFT
  );
  const [isPending, startTransition] = useTransition();
  const [saveError, setSaveError] = useState<string | null>(null);

  const isDirty = !isEdit || JSON.stringify(draft) !== JSON.stringify(activityToDraft(editingActivity!));

  function set<K extends keyof ActivityDraft>(key: K, value: ActivityDraft[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  async function addActivityImages(files: FileList) {
    const newImgs = await Promise.all(Array.from(files).map(makeLocalImage));
    set("images", [...draft.images, ...newImgs]);
  }

  function removeActivityImage(id: string) {
    const img = draft.images.find((i) => i.id === id);
    if (img?.compressedFile) URL.revokeObjectURL(img.preview);
    set("images", draft.images.filter((i) => i.id !== id));
  }

  function addFood() {
    set("foods", [...draft.foods, { id: makeId(), name: "", allergens: "", images: [], ingredients: [] }]);
  }

  function updateFood(id: string, updated: Food) {
    set("foods", draft.foods.map((f) => (f.id === id ? updated : f)));
  }

  function removeFood(id: string) {
    set("foods", draft.foods.filter((f) => f.id !== id));
  }

  function handleClose() {
    // Only revoke ObjectURLs for images we created (not signed URLs from DB)
    draft.images.forEach((img) => { if (img.compressedFile) URL.revokeObjectURL(img.preview); });
    draft.foods.forEach((f) => {
      f.images.forEach((img) => { if (img.compressedFile) URL.revokeObjectURL(img.preview); });
      f.ingredients.forEach((ing) => {
        if (ing.image?.compressedFile) URL.revokeObjectURL(ing.image.preview);
      });
    });
    setSaveError(null);
    onClose();
  }

  function buildFormData(): FormData {
    const fd = new FormData();
    fd.append("title", draft.name.trim());
    fd.append("description", draft.description.trim());
    fd.append("includesFood", String(draft.includesFood));
    fd.append("status", draft.status);
    fd.append("visibility", draft.visibility);

    // Separate existing images (already in storage) from new uploads
    const existingPaths = draft.images
      .filter((img) => img.existingPath)
      .map((img) => img.existingPath!);
    const newImages = draft.images.filter((img) => img.compressedFile && !img.existingPath);

    fd.append("existingImagePaths", JSON.stringify(existingPaths));
    fd.append("activityImageCount", String(newImages.length));
    newImages.forEach((img, i) => fd.append(`activityImage_${i}`, img.compressedFile!));

    // Foods meta — re-index so server loop matches FormData keys
    const foodsMeta = draft.foods.map((f) => ({
      name: f.name,
      allergens: f.allergens,
      ingredientNames: f.ingredients.map((ing) => ing.name),
      ingredientImageCounts: f.ingredients.map((ing) => (ing.image ? 1 : 0)),
      imageCount: f.images.filter((img) => img.compressedFile && !img.existingPath).length,
      existingFoodImagePaths: f.images.filter((img) => img.existingPath).map((img) => img.existingPath!),
      existingIngredientImagePaths: f.ingredients
        .map((ing) => (ing.image?.existingPath ?? null)),
    }));
    fd.append("foods", JSON.stringify(foodsMeta));

    // Append new food images and ingredient images
    draft.foods.forEach((f, fi) => {
      let ji = 0;
      f.images.forEach((img) => {
        if (img.compressedFile && !img.existingPath) {
          fd.append(`food_${fi}_image_${ji}`, img.compressedFile);
          ji++;
        }
      });
      f.ingredients.forEach((ing, ii) => {
        if (ing.image?.compressedFile && !ing.image.existingPath) {
          fd.append(`food_${fi}_ing_${ii}_image_0`, ing.image.compressedFile);
        }
      });
    });

    return fd;
  }

  function handleSave() {
    setSaveError(null);
    startTransition(async () => {
      const fd = buildFormData();

      if (isEdit) {
        fd.append("activityId", editingActivity!.id);
        const summary = buildEditSummary(draft, editingActivity!);
        fd.append("summary", JSON.stringify(summary));
        const result = await updateActivity(fd);
        if (result.error) { setSaveError(result.error); return; }
        if (result.data) { onUpdated(result.data); handleClose(); }
      } else {
        const result = await createActivity(fd);
        if (result.error) { setSaveError(result.error); return; }
        if (result.data) { onSaved(result.data); handleClose(); }
      }
    });
  }

  return (
    <>
      <motion.div
        key="overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
        onClick={!isPending ? handleClose : undefined}
      />

      <motion.div
        key="drawer"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 280 }}
        className="fixed right-0 top-0 h-full w-135 bg-white shadow-xl z-50 flex flex-col"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <ActivitySquare className="w-5 h-5 text-[#4a7c59]" />
            <h2 className="text-base font-semibold font-heading text-gray-900">
              {isEdit ? "Edit Activity" : "New Activity"}
            </h2>
          </div>
          <button
            onClick={handleClose}
            disabled={isPending}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-40"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold font-body text-gray-600 uppercase tracking-wide">Activity Name</label>
            <input
              type="text"
              value={draft.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Cooking Class, Gardening, Art Project"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-body text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/20 focus:border-[#4a7c59] transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold font-body text-gray-600 uppercase tracking-wide">Description</label>
            <textarea
              value={draft.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Describe what students will do in this activity..."
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-body text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/20 focus:border-[#4a7c59] transition-colors resize-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold font-body text-gray-600 uppercase tracking-wide">Activity Images</label>
            <ImageUploadStrip images={draft.images} onAdd={addActivityImages} onRemove={removeActivityImage} />
          </div>

          {/* Status + Visibility */}
          <div className="border-t border-gray-100 pt-4 flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold font-body text-gray-600 uppercase tracking-wide">Status</label>
              <div className="flex gap-2">
                {(["draft", "published"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => { set("status", s); if (s === "draft") set("visibility", "private"); }}
                    className={`flex-1 py-2 rounded-xl text-sm font-semibold font-body border transition-colors ${
                      draft.status === s
                        ? s === "draft"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-[#4a7c59]/10 text-[#4a7c59] border-[#4a7c59]/30"
                        : "bg-white text-gray-400 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {s === "draft" ? "Draft" : "Published"}
                  </button>
                ))}
              </div>
            </div>

            {draft.status === "published" && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold font-body text-gray-600 uppercase tracking-wide">Visibility</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => set("visibility", "private")}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold font-body border transition-colors ${
                      draft.visibility === "private"
                        ? "bg-slate-100 text-slate-700 border-slate-200"
                        : "bg-white text-gray-400 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <Lock className="w-3.5 h-3.5" />
                    Private
                  </button>
                  <button
                    onClick={() => set("visibility", "public")}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold font-body border transition-colors ${
                      draft.visibility === "public"
                        ? "bg-[#4a7c59]/10 text-[#4a7c59] border-[#4a7c59]/30"
                        : "bg-white text-gray-400 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5" />
                    Public
                  </button>
                </div>
                {draft.visibility === "public" && (
                  <p className="text-[11px] font-body text-gray-400">Parents will be able to see this activity.</p>
                )}
              </div>
            )}
          </div>

          <div className="border-t border-gray-100 pt-4">
            <button
              onClick={() => set("includesFood", !draft.includesFood)}
              className="flex items-center justify-between w-full group"
            >
              <div className="flex items-center gap-2">
                <Utensils className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-semibold font-body text-gray-700">Includes Food?</span>
                <span className="text-xs font-body text-gray-400">(parents will be asked for permission & preferences)</span>
              </div>
              <div
                className={`w-10 h-5.5 rounded-full flex items-center px-0.5 transition-colors ${
                  draft.includesFood ? "bg-[#4a7c59]" : "bg-gray-200"
                }`}
              >
                <motion.div
                  layout
                  transition={{ type: "spring", damping: 20, stiffness: 300 }}
                  className={`w-4.5 h-4.5 rounded-full bg-white shadow-sm ${draft.includesFood ? "ml-auto" : ""}`}
                />
              </div>
            </button>
          </div>

          <AnimatePresence>
            {draft.includesFood && (
              <motion.div
                key="foods"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col gap-3"
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold font-body text-gray-600 uppercase tracking-wide">Foods in this Activity</p>
                  {draft.foods.length === 0 && (
                    <span className="text-xs text-gray-400 font-body">No foods added yet</span>
                  )}
                </div>

                {draft.foods.map((food) => (
                  <FoodCard
                    key={food.id}
                    food={food}
                    onUpdate={(updated) => updateFood(food.id, updated)}
                    onRemove={() => removeFood(food.id)}
                    defaultCollapsed={isEdit}
                  />
                ))}

                <button
                  onClick={addFood}
                  className="flex items-center justify-center gap-2 w-full py-2.5 border-2 border-dashed border-gray-200 rounded-2xl text-sm font-semibold font-body text-gray-500 hover:border-[#4a7c59] hover:text-[#4a7c59] hover:bg-[#4a7c59]/5 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Food
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex flex-col gap-2">
          {saveError && <p className="text-xs text-red-500 font-body text-right">{saveError}</p>}
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={handleClose}
              disabled={isPending}
              className="px-4 py-2 text-sm font-semibold font-body text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isPending || !draft.name.trim() || !isDirty}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold font-body text-white bg-[#4a7c59] hover:bg-[#3d6b4f] rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {isEdit ? "Save Changes" : "Save Activity"}
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}

// ─── Change Log Panel ─────────────────────────────────────────────────────────

function ChangeLogPanel({
  activity,
  onClose,
}: {
  activity: Activity;
  onClose: () => void;
}) {
  const entries = [...activity.change_log].reverse();

  return (
    <>
      <motion.div
        key="log-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      <motion.div
        key="log-panel"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 280 }}
        className="fixed right-0 top-0 h-full w-100 bg-white shadow-xl z-50 flex flex-col"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <History className="w-4.5 h-4.5 text-[#4a7c59]" />
            <div>
              <h2 className="text-sm font-semibold font-heading text-gray-900">Change History</h2>
              <p className="text-[11px] font-body text-gray-400 leading-tight line-clamp-1">{activity.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
          {entries.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
              <History className="w-8 h-8 text-gray-300 mb-3" />
              <p className="text-sm font-semibold font-heading text-gray-500">No history yet</p>
              <p className="text-xs font-body text-gray-400 mt-1">Changes will appear here after saving.</p>
            </div>
          ) : (
            entries.map((entry) => <ChangeLogEntry key={entry.id} entry={entry} />)
          )}
        </div>
      </motion.div>
    </>
  );
}

function ChangeLogEntry({ entry }: { entry: ActivityChangeLogEntry }) {
  const initials = entry.teacher_name
    ? entry.teacher_name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-col gap-2.5 shadow-sm">
      <div className="flex items-center gap-2.5">
        {entry.teacher_avatar ? (
          <Image
            src={entry.teacher_avatar}
            alt={entry.teacher_name ?? ""}
            width={28}
            height={28}
            className="rounded-full object-cover shrink-0"
            unoptimized
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-[#4a7c59]/15 flex items-center justify-center shrink-0">
            <span className="text-[10px] font-semibold font-body text-[#4a7c59]">{initials}</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold font-body text-gray-800 truncate">
            {entry.teacher_name ?? "Unknown"}
          </p>
          <p className="text-[10px] font-body text-gray-400">
            {relativeTime(new Date(entry.created_at))}
          </p>
        </div>
      </div>
      <ul className="flex flex-col gap-1 pl-1">
        {entry.summary.map((line, i) => (
          <li key={i} className="flex items-start gap-1.5 text-xs font-body text-gray-600">
            <span className="w-1 h-1 rounded-full bg-[#4a7c59] shrink-0 mt-1.5" />
            {line}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Activity Card ────────────────────────────────────────────────────────────

function ActivityCard({
  activity,
  onDelete,
  onEdit,
  onHistory,
}: {
  activity: Activity;
  onDelete: (id: string) => void;
  onEdit: (activity: Activity) => void;
  onHistory: (activity: Activity) => void;
}) {
  const [deleting, startDelete] = useTransition();
  const firstImage = activity.images[0];

  function handleDelete() {
    startDelete(async () => {
      onDelete(activity.id);
      await deleteActivity(activity.id);
    });
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col">
      {firstImage ? (
        <div className="relative h-36 w-full">
          <Image src={firstImage.signed_url} alt={activity.title} fill className="object-cover" unoptimized />
        </div>
      ) : (
        <div className="h-36 w-full bg-[#4a7c59]/8 flex items-center justify-center">
          <ActivitySquare className="w-10 h-10 text-[#4a7c59]/40" />
        </div>
      )}

      <div className="flex flex-col gap-1.5 p-4 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold font-heading text-gray-900 leading-snug line-clamp-2">
            {activity.title}
          </h3>
          <div className="flex items-center gap-0.5 shrink-0">
            <button
              onClick={() => onHistory(activity)}
              className="p-1 rounded-lg text-gray-400 hover:text-[#4a7c59] hover:bg-[#4a7c59]/8 transition-colors"
              title="Change history"
            >
              <History className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onEdit(activity)}
              className="p-1 rounded-lg text-gray-400 hover:text-[#4a7c59] hover:bg-[#4a7c59]/8 transition-colors"
              title="Edit activity"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="p-1 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
              title="Delete activity"
            >
              {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {activity.description && (
          <p className="text-xs font-body text-gray-500 line-clamp-2">{activity.description}</p>
        )}

        <div className="flex flex-wrap items-center gap-1.5 mt-auto pt-2">
          {activity.status === "draft" ? (
            <span className="text-[10px] font-semibold font-body text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">Draft</span>
          ) : (
            <span className="text-[10px] font-semibold font-body text-[#4a7c59] bg-[#4a7c59]/10 border border-[#4a7c59]/20 px-2 py-0.5 rounded-full">Published</span>
          )}
          {activity.visibility === "public" ? (
            <span className="flex items-center gap-0.5 text-[10px] font-semibold font-body text-[#4a7c59] bg-[#4a7c59]/10 border border-[#4a7c59]/20 px-2 py-0.5 rounded-full">
              <Globe className="w-2.5 h-2.5" />Public
            </span>
          ) : (
            <span className="flex items-center gap-0.5 text-[10px] font-semibold font-body text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
              <Lock className="w-2.5 h-2.5" />Private
            </span>
          )}
          {activity.includes_food && (
            <span className="flex items-center gap-1 text-[10px] font-semibold font-body text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">
              <UtensilsCrossed className="w-3 h-3" />Food
            </span>
          )}
          <span className="text-[10px] font-body text-gray-400 ml-auto">{formatDate(activity.created_at)}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props {
  initialActivities: Activity[];
  currentUserId: string;
}

type FilterTab = "all" | "published" | "draft";

export default function ActivitiesPageClient({ initialActivities }: Props) {
  const [activities, setActivities] = useState<Activity[]>(initialActivities);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [historyActivity, setHistoryActivity] = useState<Activity | null>(null);
  const [filter, setFilter] = useState<FilterTab>("all");

  function handleSaved(activity: Activity) {
    setActivities((prev) => [activity, ...prev]);
  }

  function handleUpdated(activity: Activity) {
    setActivities((prev) => prev.map((a) => (a.id === activity.id ? activity : a)));
  }

  function handleDelete(id: string) {
    setActivities((prev) => prev.filter((a) => a.id !== id));
  }

  const filtered = activities.filter((a) => {
    if (filter === "published") return a.status === "published";
    if (filter === "draft") return a.status === "draft";
    return true;
  });

  const counts = {
    all: activities.length,
    published: activities.filter((a) => a.status === "published").length,
    draft: activities.filter((a) => a.status === "draft").length,
  };

  return (
    <div className="flex-1 flex flex-col w-full px-8 py-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-gray-900">Activities</h1>
          <p className="text-sm font-body text-gray-500 mt-0.5">
            Create and manage classroom activities for your students.
          </p>
        </div>
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold font-body text-white bg-[#4a7c59] hover:bg-[#3d6b4f] rounded-xl transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          New Activity
        </button>
      </div>

      {activities.length > 0 && (
        <div className="flex items-center gap-1 mb-5 border-b border-gray-100 pb-0">
          {(["all", "published", "draft"] as FilterTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-semibold font-body border-b-2 -mb-px transition-colors ${
                filter === tab
                  ? "border-[#4a7c59] text-[#4a7c59]"
                  : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              {tab === "all" ? "All" : tab === "published" ? "Published" : "Drafts"}
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-body ${
                  filter === tab ? "bg-[#4a7c59]/10 text-[#4a7c59]" : "bg-gray-100 text-gray-400"
                }`}
              >
                {counts[tab]}
              </span>
            </button>
          ))}
        </div>
      )}

      {activities.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-[#4a7c59]/10 flex items-center justify-center mb-4">
            <ActivitySquare className="w-8 h-8 text-[#4a7c59]" />
          </div>
          <h2 className="text-lg font-semibold font-heading text-gray-800 mb-1">No activities yet</h2>
          <p className="text-sm font-body text-gray-500 max-w-xs">
            Create your first activity to get started. You can add foods and ingredients so parents can review and share preferences.
          </p>
          <button
            onClick={() => setDrawerOpen(true)}
            className="mt-5 flex items-center gap-2 px-4 py-2 text-sm font-semibold font-body text-[#4a7c59] border border-[#4a7c59]/30 rounded-xl hover:bg-[#4a7c59]/5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Activity
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-16">
          <p className="text-sm font-body text-gray-400">
            No {filter === "draft" ? "drafts" : "published activities"} yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((activity) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              onDelete={handleDelete}
              onEdit={setEditingActivity}
              onHistory={setHistoryActivity}
            />
          ))}
        </div>
      )}

      <AnimatePresence>
        {drawerOpen && (
          <ActivityDrawer
            key="new"
            onClose={() => setDrawerOpen(false)}
            onSaved={handleSaved}
            onUpdated={handleUpdated}
          />
        )}
        {editingActivity && (
          <ActivityDrawer
            key={`edit-${editingActivity.id}`}
            editingActivity={editingActivity}
            onClose={() => setEditingActivity(null)}
            onSaved={handleSaved}
            onUpdated={handleUpdated}
          />
        )}
        {historyActivity && (
          <ChangeLogPanel
            key={`log-${historyActivity.id}`}
            activity={historyActivity}
            onClose={() => setHistoryActivity(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
