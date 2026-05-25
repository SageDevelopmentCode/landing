'use server'

import { createServerSupabaseClient, createAdminClient } from '@/app/lib/supabase-server'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ActivityIngredientImage = {
  id: string
  storage_path: string
  signed_url: string
}

export type ActivityIngredient = {
  id: string
  name: string
  sort_order: number
  images: ActivityIngredientImage[]
}

export type ActivityFoodImage = {
  id: string
  storage_path: string
  signed_url: string
}

export type ActivityFood = {
  id: string
  name: string
  sort_order: number
  allergens: string | null
  images: ActivityFoodImage[]
  ingredients: ActivityIngredient[]
}

export type ActivityImage = {
  id: string
  storage_path: string
  signed_url: string
}

export type ActivityChangeLogEntry = {
  id: string
  activity_id: string
  teacher_id: string
  teacher_name: string | null
  teacher_avatar: string | null
  summary: string[]
  created_at: string
}

export type Activity = {
  id: string
  title: string
  description: string | null
  includes_food: boolean
  status: 'draft' | 'published'
  visibility: 'public' | 'private'
  created_by: string
  created_at: string
  activity_date: string | null
  images: ActivityImage[]
  foods: ActivityFood[]
  change_log: ActivityChangeLogEntry[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

type RawActivityRow = {
  id: string
  title: string
  description: string | null
  includes_food: boolean
  status: string
  visibility: string
  created_by: string
  created_at: string
  activity_date: string | null
  images: { id: string; storage_path: string }[]
  foods: {
    id: string
    name: string
    sort_order: number
    allergens: string | null
    images: { id: string; storage_path: string }[]
    ingredients: {
      id: string
      name: string
      sort_order: number
      images: { id: string; storage_path: string }[]
    }[]
  }[]
  change_log: {
    id: string
    activity_id: string
    teacher_id: string
    summary: string[]
    created_at: string
  }[]
}

async function resolveAndAttach(
  adminClient: ReturnType<typeof createAdminClient>,
  activities: RawActivityRow[]
): Promise<Activity[]> {
  // Collect all image storage paths
  const allPaths: string[] = []
  for (const a of activities) {
    for (const img of a.images) allPaths.push(img.storage_path)
    for (const f of a.foods) {
      for (const img of f.images) allPaths.push(img.storage_path)
      for (const ing of f.ingredients) {
        for (const img of ing.images) allPaths.push(img.storage_path)
      }
    }
  }

  const signedMap = new Map<string, string>()
  if (allPaths.length > 0) {
    const { data } = await adminClient.storage
      .from('activity-images')
      .createSignedUrls(allPaths, 3600)
    for (const r of data ?? []) {
      if (r.signedUrl && r.path) signedMap.set(r.path, r.signedUrl)
    }
  }

  // Collect unique teacher IDs from change_log entries
  const teacherIds = new Set<string>()
  for (const a of activities) {
    for (const entry of a.change_log ?? []) teacherIds.add(entry.teacher_id)
  }

  const nameMap = new Map<string, { full_name: string | null; profile_image_url: string | null }>()
  if (teacherIds.size > 0) {
    const { data: users } = await adminClient
      .schema('admin')
      .from('users')
      .select('id, full_name, profile_image_url')
      .in('id', [...teacherIds])
    for (const u of users ?? []) {
      nameMap.set(u.id, { full_name: u.full_name, profile_image_url: u.profile_image_url })
    }
  }

  return activities.map((a) => ({
    id: a.id,
    title: a.title,
    description: a.description,
    includes_food: a.includes_food,
    status: (a.status === 'published' ? 'published' : 'draft') as 'draft' | 'published',
    visibility: (a.visibility === 'public' ? 'public' : 'private') as 'public' | 'private',
    created_by: a.created_by,
    created_at: a.created_at,
    activity_date: a.activity_date ?? null,
    images: a.images.map((img) => ({
      id: img.id,
      storage_path: img.storage_path,
      signed_url: signedMap.get(img.storage_path) ?? '',
    })),
    foods: a.foods.map((f) => ({
      id: f.id,
      name: f.name,
      sort_order: f.sort_order,
      allergens: f.allergens ?? null,
      images: f.images.map((img) => ({
        id: img.id,
        storage_path: img.storage_path,
        signed_url: signedMap.get(img.storage_path) ?? '',
      })),
      ingredients: f.ingredients.map((ing) => ({
        id: ing.id,
        name: ing.name,
        sort_order: ing.sort_order,
        images: ing.images.map((img) => ({
          id: img.id,
          storage_path: img.storage_path,
          signed_url: signedMap.get(img.storage_path) ?? '',
        })),
      })),
    })),
    change_log: (a.change_log ?? [])
      .sort((x, y) => new Date(x.created_at).getTime() - new Date(y.created_at).getTime())
      .map((entry) => {
        const u = nameMap.get(entry.teacher_id)
        return {
          id: entry.id,
          activity_id: entry.activity_id,
          teacher_id: entry.teacher_id,
          teacher_name: u?.full_name ?? null,
          teacher_avatar: u?.profile_image_url ?? null,
          summary: entry.summary,
          created_at: entry.created_at,
        }
      }),
  }))
}

const FULL_SELECT = `
  id, title, description, includes_food, status, visibility, created_by, created_at, activity_date,
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
`

async function insertChangeLog(
  adminClient: ReturnType<typeof createAdminClient>,
  activityId: string,
  teacherId: string,
  summary: string[]
) {
  if (!summary.length) return
  await adminClient
    .schema('teachers')
    .from('activity_change_log')
    .insert({ activity_id: activityId, teacher_id: teacherId, summary })
}

// ─── Shared food insert logic ─────────────────────────────────────────────────

async function insertFoods(
  adminClient: ReturnType<typeof createAdminClient>,
  formData: FormData,
  activityId: string,
  userId: string,
  foods: {
    name: string
    allergens: string
    ingredientNames: string[]
    ingredientImageCounts: number[]
    imageCount: number
    existingFoodImagePaths?: string[]
    existingIngredientImagePaths?: (string | null)[]
  }[]
) {
  for (let fi = 0; fi < foods.length; fi++) {
    const food = foods[fi]
    if (!food.name?.trim()) continue

    const allergens = food.allergens?.trim() || null
    const { data: foodRow, error: foodErr } = await adminClient
      .schema('teachers')
      .from('activity_foods')
      .insert({ activity_id: activityId, name: food.name.trim(), sort_order: fi, allergens })
      .select('id')
      .single()

    if (foodErr || !foodRow) { console.error('food insert error:', foodErr); continue }

    const foodId = foodRow.id

    // Re-insert existing food images (already in storage)
    for (const storagePath of food.existingFoodImagePaths ?? []) {
      await adminClient
        .schema('teachers')
        .from('activity_food_images')
        .insert({ food_id: foodId, storage_path: storagePath, uploaded_by: userId })
    }

    // Upload new food images
    for (let j = 0; j < food.imageCount; j++) {
      const file = formData.get(`food_${fi}_image_${j}`) as File | null
      if (!file) continue
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const storagePath = `${userId}/${activityId}/foods/${foodId}/${Date.now()}-${safeName}`
      const { error: uploadErr } = await adminClient.storage
        .from('activity-images')
        .upload(storagePath, file, { contentType: file.type, upsert: false })
      if (uploadErr) { console.error('food image upload error:', uploadErr); continue }
      await adminClient
        .schema('teachers')
        .from('activity_food_images')
        .insert({ food_id: foodId, storage_path: storagePath, uploaded_by: userId })
    }

    const validIngredients = food.ingredientNames
      .map((name, idx) => ({ name: name.trim(), idx }))
      .filter(({ name }) => name.length > 0)

    for (const { name, idx } of validIngredients) {
      const { data: ingRow, error: ingErr } = await adminClient
        .schema('teachers')
        .from('activity_ingredients')
        .insert({ food_id: foodId, name, sort_order: idx })
        .select('id')
        .single()

      if (ingErr || !ingRow) { console.error('ingredient insert error:', ingErr); continue }

      const ingredientId = ingRow.id
      const existingIngPath = food.existingIngredientImagePaths?.[idx] ?? null

      if (existingIngPath) {
        // Re-insert existing ingredient image
        await adminClient
          .schema('teachers')
          .from('activity_ingredient_images')
          .insert({ ingredient_id: ingredientId, storage_path: existingIngPath, uploaded_by: userId })
      } else {
        // Upload new ingredient image if provided
        const imgCount = food.ingredientImageCounts?.[idx] ?? 0
        for (let k = 0; k < imgCount; k++) {
          const file = formData.get(`food_${fi}_ing_${idx}_image_${k}`) as File | null
          if (!file) continue
          const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
          const storagePath = `${userId}/${activityId}/ingredients/${ingredientId}/${Date.now()}-${safeName}`
          const { error: uploadErr } = await adminClient.storage
            .from('activity-images')
            .upload(storagePath, file, { contentType: file.type, upsert: false })
          if (uploadErr) { console.error('ingredient image upload error:', uploadErr); continue }
          await adminClient
            .schema('teachers')
            .from('activity_ingredient_images')
            .insert({ ingredient_id: ingredientId, storage_path: storagePath, uploaded_by: userId })
        }
      }
    }
  }
}

// ─── Get Activities ───────────────────────────────────────────────────────────

export async function getActivities(): Promise<Activity[]> {
  const adminClient = createAdminClient()

  const { data: rows, error } = await adminClient
    .schema('teachers')
    .from('activities')
    .select(FULL_SELECT)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })

  if (error || !rows) {
    console.error('getActivities error:', error)
    return []
  }

  return resolveAndAttach(adminClient, rows as any)
}

export async function getPublishedActivities(): Promise<Activity[]> {
  const adminClient = createAdminClient()

  const { data: rows, error } = await adminClient
    .schema('teachers')
    .from('activities')
    .select(FULL_SELECT)
    .eq('is_deleted', false)
    .eq('status', 'published')
    .eq('visibility', 'public')
    .order('created_at', { ascending: false })

  if (error || !rows) {
    console.error('getPublishedActivities error:', error)
    return []
  }

  return resolveAndAttach(adminClient, rows as any)
}

// ─── Create Activity ──────────────────────────────────────────────────────────

export async function createActivity(
  formData: FormData
): Promise<{ data?: Activity; error?: string }> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const adminClient = createAdminClient()

  const title = (formData.get('title') as string)?.trim()
  const description = (formData.get('description') as string)?.trim() || null
  const includesFood = formData.get('includesFood') === 'true'
  const activityImageCount = Number(formData.get('activityImageCount') ?? 0)
  const foodsJson = formData.get('foods') as string
  const foods: {
    name: string
    allergens: string
    ingredientNames: string[]
    ingredientImageCounts: number[]
    imageCount: number
  }[] = foodsJson ? JSON.parse(foodsJson) : []
  const status = formData.get('status') === 'published' ? 'published' : 'draft'
  const visibility = formData.get('visibility') === 'public' ? 'public' : 'private'
  const activityDate = (formData.get('activityDate') as string)?.trim() || null

  if (!title) return { error: 'Title is required' }

  const { data: activity, error: actErr } = await adminClient
    .schema('teachers')
    .from('activities')
    .insert({ title, description, includes_food: includesFood, status, visibility, created_by: user.id, activity_date: activityDate })
    .select('id')
    .single()

  if (actErr || !activity) {
    console.error('createActivity insert error:', actErr)
    return { error: actErr?.message ?? 'Failed to create activity' }
  }

  const activityId = activity.id

  for (let i = 0; i < activityImageCount; i++) {
    const file = formData.get(`activityImage_${i}`) as File | null
    if (!file) continue
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const storagePath = `${user.id}/${activityId}/${Date.now()}-${safeName}`
    const { error: uploadErr } = await adminClient.storage
      .from('activity-images')
      .upload(storagePath, file, { contentType: file.type, upsert: false })
    if (uploadErr) { console.error('activity image upload error:', uploadErr); continue }
    await adminClient
      .schema('teachers')
      .from('activity_images')
      .insert({ activity_id: activityId, storage_path: storagePath, uploaded_by: user.id })
  }

  await insertFoods(adminClient, formData, activityId, user.id, foods)

  const { data: refetched, error: refetchErr } = await adminClient
    .schema('teachers')
    .from('activities')
    .select(FULL_SELECT)
    .eq('id', activityId)
    .single()

  if (refetchErr || !refetched) {
    console.error('createActivity re-fetch error:', refetchErr)
    return { error: 'Activity saved but could not reload it' }
  }

  await insertChangeLog(adminClient, activityId, user.id, ['Created activity'])

  // Re-fetch again to include the log entry we just inserted
  const { data: final } = await adminClient
    .schema('teachers')
    .from('activities')
    .select(FULL_SELECT)
    .eq('id', activityId)
    .single()

  const [withUrls] = await resolveAndAttach(adminClient, [(final ?? refetched) as any])
  return { data: withUrls }
}

// ─── Update Activity ──────────────────────────────────────────────────────────

export async function updateActivity(
  formData: FormData
): Promise<{ data?: Activity; error?: string }> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const adminClient = createAdminClient()

  const activityId = (formData.get('activityId') as string)?.trim()
  if (!activityId) return { error: 'Activity ID is required' }

  const title = (formData.get('title') as string)?.trim()
  const description = (formData.get('description') as string)?.trim() || null
  const includesFood = formData.get('includesFood') === 'true'
  const activityImageCount = Number(formData.get('activityImageCount') ?? 0)
  const existingImagePathsJson = formData.get('existingImagePaths') as string
  const existingImagePaths: string[] = existingImagePathsJson ? JSON.parse(existingImagePathsJson) : []
  const foodsJson = formData.get('foods') as string
  const foods: {
    name: string
    allergens: string
    ingredientNames: string[]
    ingredientImageCounts: number[]
    imageCount: number
  }[] = foodsJson ? JSON.parse(foodsJson) : []
  const status = formData.get('status') === 'published' ? 'published' : 'draft'
  const visibility = formData.get('visibility') === 'public' ? 'public' : 'private'
  const activityDate = (formData.get('activityDate') as string)?.trim() || null
  const summaryJson = formData.get('summary') as string
  const summary: string[] = summaryJson ? JSON.parse(summaryJson) : ['Saved activity']

  if (!title) return { error: 'Title is required' }

  // 1. Update the activity row
  const { error: updateErr } = await adminClient
    .schema('teachers')
    .from('activities')
    .update({ title, description, includes_food: includesFood, status, visibility, activity_date: activityDate })
    .eq('id', activityId)
    .eq('created_by', user.id)

  if (updateErr) {
    console.error('updateActivity error:', updateErr)
    return { error: updateErr.message }
  }

  // 2. Replace activity-level images
  //    Delete existing DB rows (storage files orphaned — acceptable)
  await adminClient
    .schema('teachers')
    .from('activity_images')
    .delete()
    .eq('activity_id', activityId)

  //    Re-insert existing images (already in storage, just re-point the DB row)
  for (const storagePath of existingImagePaths) {
    await adminClient
      .schema('teachers')
      .from('activity_images')
      .insert({ activity_id: activityId, storage_path: storagePath, uploaded_by: user.id })
  }

  //    Upload new images
  for (let i = 0; i < activityImageCount; i++) {
    const file = formData.get(`activityImage_${i}`) as File | null
    if (!file) continue
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const storagePath = `${user.id}/${activityId}/${Date.now()}-${safeName}`
    const { error: uploadErr } = await adminClient.storage
      .from('activity-images')
      .upload(storagePath, file, { contentType: file.type, upsert: false })
    if (uploadErr) { console.error('activity image upload error:', uploadErr); continue }
    await adminClient
      .schema('teachers')
      .from('activity_images')
      .insert({ activity_id: activityId, storage_path: storagePath, uploaded_by: user.id })
  }

  // 3. Replace foods (cascade deletes food images, ingredients, ingredient images)
  await adminClient
    .schema('teachers')
    .from('activity_foods')
    .delete()
    .eq('activity_id', activityId)

  await insertFoods(adminClient, formData, activityId, user.id, foods)

  // 4. Insert change log entry
  await insertChangeLog(adminClient, activityId, user.id, summary)

  // 5. Re-fetch and return
  const { data: refetched, error: refetchErr } = await adminClient
    .schema('teachers')
    .from('activities')
    .select(FULL_SELECT)
    .eq('id', activityId)
    .single()

  if (refetchErr || !refetched) {
    console.error('updateActivity re-fetch error:', refetchErr)
    return { error: 'Activity saved but could not reload it' }
  }

  const [withUrls] = await resolveAndAttach(adminClient, [refetched as any])
  return { data: withUrls }
}

// ─── Delete Activity ──────────────────────────────────────────────────────────

export async function deleteActivity(
  activityId: string
): Promise<{ error?: string }> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const adminClient = createAdminClient()

  const { error } = await adminClient
    .schema('teachers')
    .from('activities')
    .update({ is_deleted: true })
    .eq('id', activityId)
    .eq('created_by', user.id)

  if (error) {
    console.error('deleteActivity error:', error)
    return { error: error.message }
  }

  return {}
}
