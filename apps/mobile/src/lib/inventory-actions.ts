import { supabase } from "@/lib/supabase";
import * as ImageManipulator from "expo-image-manipulator";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type InventoryCategory =
  | "Arts"
  | "Crafts"
  | "Science"
  | "Math"
  | "Writing"
  | "Sensory"
  | "Outdoor"
  | "General";

export type InventoryStatus = "Full" | "Running Out" | "Low" | null;

export type HistoryActionType =
  | "taken"
  | "restocked"
  | "photo_added"
  | "note_added"
  | "status_changed"
  | "shopping_requested"
  | "created";

export type ShoppingRequestStatus = "pending" | "approved" | "purchased" | "denied";

export type InventoryPhoto = {
  id: string;
  url: string;
  storage_path: string;
  is_primary: boolean;
  uploaded_at: string;
  uploaded_by: string;
};

export type HistoryEvent = {
  id: string;
  action_type: HistoryActionType;
  performed_by: string;
  count_before: number | null;
  count_after: number | null;
  note: string | null;
  created_at: string;
};

export type ShoppingRequest = {
  id: string;
  item_id: string;
  requested_by: string;
  note: string;
  status: ShoppingRequestStatus;
  created_at: string;
  resolved_by?: string;
  resolved_at?: string;
  resolution_note?: string;
};

export type InventoryItem = {
  id: string;
  title: string;
  category: InventoryCategory;
  status: InventoryStatus;
  count: number | null;
  notes: string | null;
  classroom: string | null;
  added_by: string;
  created_at: string;
  photos: InventoryPhoto[];
  history_log: HistoryEvent[];
  shopping_requests: ShoppingRequest[];
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getSignedUrl(storagePath: string): Promise<string> {
  const { data } = await supabase.storage
    .from("inventory-photos")
    .createSignedUrl(storagePath, 600);
  return data?.signedUrl ?? "";
}

async function uploadPhoto(photoUri: string, storagePath: string): Promise<void> {
  const compressed = await ImageManipulator.manipulateAsync(
    photoUri,
    [{ resize: { width: 1200 } }],
    { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
  );
  const fileRes = await fetch(compressed.uri);
  const blob = await fileRes.blob();
  // blob.arrayBuffer() is not available in the React Native runtime — use direct fetch instead
  const { data: { session } } = await supabase.auth.getSession();
  const uploadRes = await fetch(
    `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/inventory-photos/${storagePath}`,
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
    throw new Error(`Photo upload failed: ${msg}`);
  }
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function getInventoryItems(): Promise<InventoryItem[]> {
  const { data, error } = await supabase
    .schema("inventory")
    .from("items")
    .select(`*, photos(*), history_events(*), shopping_requests(*)`)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const items = await Promise.all(
    (data ?? []).map(async (row: any) => {
      const photos = await Promise.all(
        (row.photos ?? [])
          .filter((p: any) => !p.is_deleted)
          .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .map(async (p: any) => ({
            id: p.id,
            url: await getSignedUrl(p.storage_path),
            storage_path: p.storage_path,
            is_primary: p.is_primary,
            uploaded_at: p.created_at,
            uploaded_by: p.uploaded_by,
          }))
      );

      const history_log: HistoryEvent[] = (row.history_events ?? [])
        .slice()
        .sort(
          (a: any, b: any) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        .map((h: any) => ({
          id: h.id,
          action_type: h.action_type,
          performed_by: h.performed_by,
          count_before: h.count_before,
          count_after: h.count_after,
          note: h.note,
          created_at: h.created_at,
        }));

      const shopping_requests: ShoppingRequest[] = (row.shopping_requests ?? [])
        .filter((sr: any) => !sr.is_deleted)
        .map((sr: any) => ({
          id: sr.id,
          item_id: sr.item_id,
          requested_by: sr.requested_by,
          note: sr.note,
          status: sr.status,
          created_at: sr.created_at,
          resolved_by: sr.resolved_by,
          resolved_at: sr.resolved_at,
          resolution_note: sr.resolution_note,
        }));

      return {
        id: row.id,
        title: row.title,
        category: row.category,
        status: row.status,
        count: row.count,
        notes: row.notes,
        classroom: row.classroom,
        added_by: row.added_by,
        created_at: row.created_at,
        photos,
        history_log,
        shopping_requests,
      } as InventoryItem;
    })
  );

  return items;
}

export async function createInventoryItem(data: {
  title: string;
  category: InventoryCategory;
  status?: InventoryStatus;
  count?: number | null;
  notes?: string | null;
  userId: string;
  photoUri?: string | null;
}): Promise<InventoryItem> {
  const { data: item, error } = await supabase
    .schema("inventory")
    .from("items")
    .insert({
      title: data.title,
      category: data.category,
      status: data.status ?? null,
      count: data.count ?? null,
      notes: data.notes ?? null,
      added_by: data.userId,
    })
    .select()
    .single();

  if (error) throw error;

  await supabase
    .schema("inventory")
    .from("history_events")
    .insert({ item_id: item.id, action_type: "created", performed_by: data.userId });

  let photos: InventoryPhoto[] = [];

  if (data.photoUri) {
    const storagePath = `${item.id}/${Date.now()}.jpg`;
    await uploadPhoto(data.photoUri, storagePath);

    const { data: photoRow, error: photoErr } = await supabase
      .schema("inventory")
      .from("photos")
      .insert({
        item_id: item.id,
        storage_path: storagePath,
        is_primary: true,
        uploaded_by: data.userId,
      })
      .select()
      .single();

    if (photoErr) throw photoErr;

    await supabase
      .schema("inventory")
      .from("history_events")
      .insert({ item_id: item.id, action_type: "photo_added", performed_by: data.userId });

    const signedUrl = await getSignedUrl(storagePath);
    photos = [
      {
        id: photoRow.id,
        url: signedUrl,
        storage_path: storagePath,
        is_primary: true,
        uploaded_at: photoRow.created_at,
        uploaded_by: data.userId,
      },
    ];
  }

  return {
    id: item.id,
    title: item.title,
    category: item.category,
    status: item.status,
    count: item.count,
    notes: item.notes,
    classroom: item.classroom,
    added_by: item.added_by,
    created_at: item.created_at,
    photos,
    history_log: [{ id: "", action_type: "created", performed_by: data.userId, count_before: null, count_after: null, note: null, created_at: item.created_at }],
    shopping_requests: [],
  };
}

export async function updateInventoryItem(
  itemId: string,
  updates: Partial<Pick<InventoryItem, "title" | "category" | "status" | "count" | "notes">>,
  originalItem: InventoryItem,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .schema("inventory")
    .from("items")
    .update(updates)
    .eq("id", itemId);

  if (error) throw error;

  const historyInserts: any[] = [];

  if (updates.status !== undefined && updates.status !== originalItem.status) {
    historyInserts.push({ item_id: itemId, action_type: "status_changed", performed_by: userId, note: `Status changed to ${updates.status ?? "none"}` });
  }
  if (updates.notes !== undefined && updates.notes !== originalItem.notes) {
    historyInserts.push({ item_id: itemId, action_type: "note_added", performed_by: userId, note: updates.notes });
  }

  if (historyInserts.length > 0) {
    await supabase.schema("inventory").from("history_events").insert(historyInserts);
  }
}

export async function addInventoryPhoto(
  itemId: string,
  photoUri: string,
  userId: string,
  isFirst: boolean
): Promise<InventoryPhoto> {
  const storagePath = `${itemId}/${Date.now()}.jpg`;
  await uploadPhoto(photoUri, storagePath);

  const { data: photoRow, error } = await supabase
    .schema("inventory")
    .from("photos")
    .insert({
      item_id: itemId,
      storage_path: storagePath,
      is_primary: isFirst,
      uploaded_by: userId,
    })
    .select()
    .single();

  if (error) throw error;

  await supabase
    .schema("inventory")
    .from("history_events")
    .insert({ item_id: itemId, action_type: "photo_added", performed_by: userId });

  const signedUrl = await getSignedUrl(storagePath);
  return {
    id: photoRow.id,
    url: signedUrl,
    storage_path: storagePath,
    is_primary: isFirst,
    uploaded_at: photoRow.created_at,
    uploaded_by: userId,
  };
}

export async function deleteInventoryItem(itemId: string): Promise<void> {
  const { error } = await supabase
    .rpc("soft_delete_inventory_item", { item_id: itemId });
  if (error) throw error;
}

export async function submitShoppingRequest(
  itemId: string,
  note: string,
  userId: string
): Promise<ShoppingRequest> {
  const { data, error } = await supabase
    .schema("inventory")
    .from("shopping_requests")
    .insert({ item_id: itemId, requested_by: userId, note, status: "pending" })
    .select()
    .single();

  if (error) throw error;

  await supabase
    .schema("inventory")
    .from("history_events")
    .insert({ item_id: itemId, action_type: "shopping_requested", performed_by: userId, note });

  return {
    id: data.id,
    item_id: data.item_id,
    requested_by: data.requested_by,
    note: data.note,
    status: data.status,
    created_at: data.created_at,
  };
}
