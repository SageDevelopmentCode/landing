'use server'

import { createServerSupabaseClient, createAdminClient } from '@/app/lib/supabase-server'
import type {
  InventoryItem,
  InventoryPhoto,
  HistoryEvent,
  ShoppingRequest,
  InventoryCategory,
  InventoryStatus,
  HistoryActionType,
} from '@/app/teacher/dashboard/inventory/inventoryData'

type InventoryPhotoSelect = {
  id: string
  storage_path: string
  caption: string | null
  is_primary: boolean
  uploaded_by: string
  created_at: string
  is_deleted?: boolean
}

type InventoryHistoryEventSelect = {
  id: string
  action_type: string
  performed_by: string
  count_before: number | null
  count_after: number | null
  note: string | null
  created_at: string
}

type InventoryShoppingRequestSelect = {
  id: string
  item_id: string
  requested_by: string
  note: string | null
  status: string
  created_at: string
  resolved_by: string | null
  resolved_at: string | null
  resolution_note: string | null
  is_deleted?: boolean
}

type InventoryItemRow = {
  id: string
  title: string
  category: string
  status: string | null
  count: number | null
  notes: string | null
  classroom: string | null
  added_by: string
  created_at: string
  updated_at: string
  photos: InventoryPhotoSelect[] | null
  history_log: InventoryHistoryEventSelect[] | null
  shopping_requests: InventoryShoppingRequestSelect[] | null
}

// ─── Read ──────────────────────────────────────────────────────────────────────

export async function getInventoryItems(): Promise<InventoryItem[]> {
  const adminClient = createAdminClient()

  const { data: rows, error } = await adminClient
    .schema('inventory')
    .from('items')
    .select(`
      id, title, category, status, count, notes, classroom, added_by, created_at, updated_at,
      photos:photos(id, storage_path, caption, is_primary, uploaded_by, created_at),
      history_log:history_events(id, action_type, performed_by, count_before, count_after, note, created_at),
      shopping_requests:shopping_requests(id, item_id, requested_by, note, status, created_at, resolved_by, resolved_at, resolution_note)
    `)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('getInventoryItems error:', error)
    return []
  }

  if (!rows || rows.length === 0) return []

  const typedRows = rows as InventoryItemRow[]

  // Collect all user UUIDs to resolve to display names in one batch query
  const userIds = new Set<string>()
  for (const row of typedRows) {
    userIds.add(row.added_by)
    for (const p of row.photos ?? []) userIds.add(p.uploaded_by)
    for (const h of row.history_log ?? []) userIds.add(h.performed_by)
    for (const s of row.shopping_requests ?? []) {
      userIds.add(s.requested_by)
      if (s.resolved_by) userIds.add(s.resolved_by)
    }
  }

  const { data: users } = await adminClient
    .schema('admin')
    .from('users')
    .select('id, full_name')
    .in('id', [...userIds])

  const nameMap = new Map((users ?? []).map((u) => [u.id, u.full_name ?? 'Unknown']))

  // Generate signed URLs for all photos in parallel
  const signedUrlCache = new Map<string, string | null>()
  const allPaths = typedRows.flatMap((r) => (r.photos ?? []).map((p) => p.storage_path))
  await Promise.all(
    allPaths.map(async (path) => {
      const { data } = await adminClient.storage
        .from('inventory-photos')
        .createSignedUrl(path, 3600)
      signedUrlCache.set(path, data?.signedUrl ?? null)
    })
  )

  return typedRows.map((row): InventoryItem => {
    const photos: InventoryPhoto[] = (row.photos ?? [])
      .filter((p) => !p.is_deleted)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .map((p) => ({
        id: p.id,
        url: signedUrlCache.get(p.storage_path) ?? null,
        uploaded_at: p.created_at,
        uploaded_by: nameMap.get(p.uploaded_by) ?? 'Unknown',
        is_primary: p.is_primary,
      }))

    const history_log: HistoryEvent[] = (row.history_log ?? [])
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .map((h) => ({
        id: h.id,
        action_type: h.action_type as HistoryActionType,
        teacher_name: nameMap.get(h.performed_by) ?? 'Unknown',
        count_before: h.count_before,
        count_after: h.count_after,
        timestamp: h.created_at,
        note: h.note,
      }))

    const shopping_requests: ShoppingRequest[] = (row.shopping_requests ?? [])
      .filter((s) => !s.is_deleted)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .map((s) => ({
        id: s.id,
        item_id: s.item_id,
        requested_by: nameMap.get(s.requested_by) ?? 'Unknown',
        note: s.note ?? '',
        status: s.status as ShoppingRequest['status'],
        created_at: s.created_at,
        resolved_by: s.resolved_by ? (nameMap.get(s.resolved_by) ?? 'Unknown') : null,
        resolved_at: s.resolved_at,
        resolution_note: s.resolution_note,
      }))

    return {
      id: row.id,
      title: row.title,
      category: row.category as InventoryCategory,
      status: (row.status as InventoryStatus) ?? null,
      count: row.count,
      notes: row.notes,
      photos,
      history_log,
      shopping_requests,
    }
  })
}

// ─── Create item ───────────────────────────────────────────────────────────────

export async function createInventoryItem(formData: FormData): Promise<{ error?: string; item?: InventoryItem }> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const adminClient = createAdminClient()

  const title = (formData.get('title') as string | null)?.trim()
  const category = formData.get('category') as InventoryCategory
  const status = (formData.get('status') as InventoryStatus | null) || null
  const countRaw = formData.get('count') as string | null
  const count = countRaw ? parseInt(countRaw, 10) : null
  const notes = (formData.get('notes') as string | null)?.trim() || null
  const classroom = (formData.get('classroom') as string | null)?.trim() || null
  const photoFile = formData.get('photo') as File | null

  if (!title) return { error: 'Title is required' }

  // Insert item
  const { data: item, error: itemError } = await adminClient
    .schema('inventory')
    .from('items')
    .insert({ title, category, status, count, notes, classroom, added_by: user.id })
    .select('id')
    .single()

  if (itemError || !item) {
    console.error('createInventoryItem insert error:', itemError)
    return { error: itemError?.message ?? 'Failed to create item' }
  }

  const itemId = item.id
  let photoStoragePath: string | null = null

  // Upload photo if provided
  if (photoFile && photoFile.size > 0) {
    const ext = photoFile.name.split('.').pop() ?? 'jpg'
    const path = `${itemId}/${Date.now()}.${ext}`
    const { error: uploadError } = await adminClient.storage
      .from('inventory-photos')
      .upload(path, photoFile, { contentType: photoFile.type, upsert: false })

    if (!uploadError) {
      photoStoragePath = path
      await adminClient.schema('inventory').from('photos').insert({
        item_id: itemId,
        storage_path: path,
        is_primary: true,
        uploaded_by: user.id,
      })
    }
  }

  // Insert created history event
  await adminClient.schema('inventory').from('history_events').insert({
    item_id: itemId,
    action_type: 'created',
    performed_by: user.id,
    count_before: null,
    count_after: count,
    note: null,
  })

  // Optionally insert photo_added history event
  if (photoStoragePath) {
    await adminClient.schema('inventory').from('history_events').insert({
      item_id: itemId,
      action_type: 'photo_added',
      performed_by: user.id,
      note: null,
    })
  }

  // Return fresh full item
  const items = await getInventoryItems()
  const newItem = items.find((i) => i.id === itemId)
  return newItem ? { item: newItem } : { error: 'Item created but could not be fetched' }
}

// ─── Update item fields ────────────────────────────────────────────────────────

export async function updateInventoryItem(formData: FormData): Promise<{ error?: string }> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const adminClient = createAdminClient()

  const itemId = formData.get('item_id') as string
  const title = (formData.get('title') as string | null)?.trim()
  const category = formData.get('category') as InventoryCategory | null
  const newStatus = (formData.get('status') as string | null) || null
  const countRaw = formData.get('count') as string | null
  const count = countRaw !== null && countRaw !== '' ? parseInt(countRaw, 10) : null
  const notes = (formData.get('notes') as string | null)?.trim() || null
  const classroom = (formData.get('classroom') as string | null)?.trim() || null

  if (!itemId) return { error: 'item_id required' }

  // Fetch current status to detect changes for history events
  const { data: current } = await adminClient
    .schema('inventory')
    .from('items')
    .select('status, notes')
    .eq('id', itemId)
    .single()

  const updates: Record<string, unknown> = {}
  if (title) updates.title = title
  if (category) updates.category = category
  if (newStatus !== undefined) updates.status = newStatus
  if (count !== null) updates.count = count
  if (notes !== undefined) updates.notes = notes
  if (classroom !== undefined) updates.classroom = classroom

  const { error } = await adminClient
    .schema('inventory')
    .from('items')
    .update(updates)
    .eq('id', itemId)

  if (error) {
    console.error('updateInventoryItem error:', error)
    return { error: error.message }
  }

  // Auto-insert history events for meaningful changes
  if (current?.status !== newStatus) {
    await adminClient.schema('inventory').from('history_events').insert({
      item_id: itemId,
      action_type: 'status_changed',
      performed_by: user.id,
      note: `Status changed to ${newStatus ?? 'none'}`,
    })
  } else if (notes && current?.notes !== notes) {
    await adminClient.schema('inventory').from('history_events').insert({
      item_id: itemId,
      action_type: 'note_added',
      performed_by: user.id,
      note: notes,
    })
  }

  return {}
}

// ─── Log taken / restocked ─────────────────────────────────────────────────────

export async function logInventoryAction(formData: FormData): Promise<{ error?: string }> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const adminClient = createAdminClient()

  const itemId = formData.get('item_id') as string
  const actionType = formData.get('action_type') as 'taken' | 'restocked'
  const quantityChange = parseInt(formData.get('quantity') as string, 10)
  const note = (formData.get('note') as string | null)?.trim() || null

  if (!itemId || !actionType || isNaN(quantityChange)) return { error: 'Missing fields' }

  const { data: current } = await adminClient
    .schema('inventory')
    .from('items')
    .select('count')
    .eq('id', itemId)
    .single()

  const countBefore = current?.count ?? 0
  const countAfter = actionType === 'taken'
    ? Math.max(0, countBefore - quantityChange)
    : countBefore + quantityChange

  const { error: updateError } = await adminClient
    .schema('inventory')
    .from('items')
    .update({ count: countAfter })
    .eq('id', itemId)

  if (updateError) return { error: updateError.message }

  await adminClient.schema('inventory').from('history_events').insert({
    item_id: itemId,
    action_type: actionType,
    performed_by: user.id,
    count_before: countBefore,
    count_after: countAfter,
    note,
  })

  return {}
}

// ─── Add photo to existing item ────────────────────────────────────────────────

export async function addInventoryPhoto(formData: FormData): Promise<{ error?: string }> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const adminClient = createAdminClient()

  const itemId = formData.get('item_id') as string
  const photoFile = formData.get('photo') as File | null
  const caption = (formData.get('caption') as string | null)?.trim() || null

  if (!itemId || !photoFile || photoFile.size === 0) return { error: 'Missing item_id or photo' }

  const ext = photoFile.name.split('.').pop() ?? 'jpg'
  const path = `${itemId}/${Date.now()}.${ext}`

  const { error: uploadError } = await adminClient.storage
    .from('inventory-photos')
    .upload(path, photoFile, { contentType: photoFile.type, upsert: false })

  if (uploadError) return { error: uploadError.message }

  await adminClient.schema('inventory').from('photos').insert({
    item_id: itemId,
    storage_path: path,
    caption,
    is_primary: false,
    uploaded_by: user.id,
  })

  await adminClient.schema('inventory').from('history_events').insert({
    item_id: itemId,
    action_type: 'photo_added',
    performed_by: user.id,
    note: caption,
  })

  return {}
}

// ─── Submit shopping request ───────────────────────────────────────────────────

export async function submitShoppingRequest(
  itemId: string,
  note: string
): Promise<{ error?: string; request?: ShoppingRequest }> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const adminClient = createAdminClient()

  const { data: request, error } = await adminClient
    .schema('inventory')
    .from('shopping_requests')
    .insert({ item_id: itemId, requested_by: user.id, note: note.trim() })
    .select('id, item_id, requested_by, note, status, created_at')
    .single()

  if (error || !request) {
    console.error('submitShoppingRequest error:', error)
    return { error: error?.message ?? 'Failed to submit request' }
  }

  await adminClient.schema('inventory').from('history_events').insert({
    item_id: itemId,
    action_type: 'shopping_requested',
    performed_by: user.id,
    note: note.trim(),
  })

  // Fetch requester name
  const { data: adminUser } = await adminClient
    .schema('admin')
    .from('users')
    .select('full_name')
    .eq('id', user.id)
    .single()

  return {
    request: {
      id: request.id,
      item_id: request.item_id,
      requested_by: adminUser?.full_name ?? 'You',
      note: request.note,
      status: request.status,
      created_at: request.created_at,
    },
  }
}

// ─── Update shopping request status (admin only) ───────────────────────────────

export async function updateShoppingRequestStatus(
  requestId: string,
  status: 'approved' | 'purchased' | 'denied',
  resolutionNote?: string
): Promise<{ error?: string }> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const adminClient = createAdminClient()

  const { data: adminUser } = await adminClient
    .schema('admin')
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (adminUser?.role !== 'super_admin') return { error: 'Unauthorized' }

  const { error } = await adminClient
    .schema('inventory')
    .from('shopping_requests')
    .update({
      status,
      resolved_by: user.id,
      resolved_at: new Date().toISOString(),
      resolution_note: resolutionNote?.trim() || null,
    })
    .eq('id', requestId)

  if (error) return { error: error.message }
  return {}
}

// ─── Soft delete item ──────────────────────────────────────────────────────────

export async function softDeleteInventoryItem(itemId: string): Promise<{ error?: string }> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const adminClient = createAdminClient()

  const { error } = await adminClient
    .schema('inventory')
    .from('items')
    .update({ is_deleted: true })
    .eq('id', itemId)

  if (error) return { error: error.message }
  return {}
}
