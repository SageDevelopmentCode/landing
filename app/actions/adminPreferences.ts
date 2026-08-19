'use server'

import {
  createServerSupabaseClient,
  createAdminClient,
} from '@/app/lib/supabase-server'
import {
  sendDiscordNotification,
  createActivityPreferencesSavedEmbed,
  createSchoolDayFoodPreferencesSavedEmbed,
} from '@/app/lib/discord'
import type { PreferenceEntry } from '@/app/actions/preferences'
import type {
  EmergencySnackPreference,
  SharedFoodPreference,
} from '@/app/actions/schoolDayFoodPreferences'

type ParticipationLevel = 'watch' | 'cook_no_eat' | 'full'

const EMERGENCY_SNACK_VALUES: EmergencySnackPreference[] = [
  'always_allow',
  'ask_permission',
  'approved_only',
]

const SHARED_FOOD_VALUES: SharedFoodPreference[] = [
  'always_allow',
  'ask_each_time',
  'do_not_offer',
]

async function assertSuperAdmin() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, error: 'Not authenticated' }

  const adminClient = createAdminClient()
  const { data: adminUser } = await adminClient
    .schema('admin')
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (adminUser?.role !== 'super_admin') {
    return { ok: false as const, error: 'Forbidden' }
  }

  return { ok: true as const, adminClient, adminUserId: user.id }
}

export async function adminSetStudentDefaultPreference(
  parentId: string,
  studentId: string,
  level: ParticipationLevel | null
): Promise<{ error?: string }> {
  const auth = await assertSuperAdmin()
  if (!auth.ok) return { error: auth.error }

  const { adminClient } = auth

  const { data: student } = await adminClient
    .schema('admin')
    .from('students')
    .select('id')
    .eq('id', studentId)
    .eq('parent_id', parentId)
    .eq('is_deleted', false)
    .maybeSingle()

  if (!student) return { error: 'Student not found' }

  if (level !== null) {
    const { error } = await adminClient
      .schema('parent_app')
      .from('student_default_preferences')
      .upsert(
        { parent_id: parentId, student_id: studentId, participation_level: level },
        { onConflict: 'parent_id,student_id' }
      )
    if (error) return { error: error.message }
  } else {
    const { error } = await adminClient
      .schema('parent_app')
      .from('student_default_preferences')
      .delete()
      .eq('parent_id', parentId)
      .eq('student_id', studentId)
    if (error) return { error: error.message }
  }

  return {}
}

export async function adminSaveActivityPreferences(
  parentId: string,
  studentId: string,
  entries: PreferenceEntry[]
): Promise<{ error?: string }> {
  const auth = await assertSuperAdmin()
  if (!auth.ok) return { error: auth.error }

  const { adminClient } = auth

  const { data: student } = await adminClient
    .schema('admin')
    .from('students')
    .select('id')
    .eq('id', studentId)
    .eq('parent_id', parentId)
    .eq('is_deleted', false)
    .maybeSingle()

  if (!student) return { error: 'Student not found' }

  const toUpsert = entries
    .filter((e) => e.level !== null)
    .map((e) => ({
      parent_id: parentId,
      student_id: studentId,
      activity_id: e.activityId,
      participation_level: e.level!,
      notes: e.notes,
    }))

  const toDeleteIds = entries
    .filter((e) => e.level === null)
    .map((e) => e.activityId)

  if (toUpsert.length > 0) {
    const { error } = await adminClient
      .schema('parent_app')
      .from('activity_preferences')
      .upsert(toUpsert, { onConflict: 'student_id,activity_id' })
    if (error) {
      console.error('adminSaveActivityPreferences upsert:', error)
      return { error: error.message }
    }
  }

  if (toDeleteIds.length > 0) {
    const { error } = await adminClient
      .schema('parent_app')
      .from('activity_preferences')
      .delete()
      .eq('parent_id', parentId)
      .eq('student_id', studentId)
      .in('activity_id', toDeleteIds)
    if (error) {
      console.error('adminSaveActivityPreferences delete:', error)
      return { error: error.message }
    }
  }

  ;(async () => {
    const setEntries = entries.filter((e) => e.level !== null)
    if (setEntries.length === 0) return

    const [{ data: parentData }, { data: childData }, { data: activityRows }] =
      await Promise.all([
        adminClient
          .schema('admin')
          .from('users')
          .select('full_name, email')
          .eq('id', parentId)
          .single(),
        adminClient
          .schema('admin')
          .from('students')
          .select('child_legal_name')
          .eq('id', studentId)
          .single(),
        adminClient
          .schema('teachers')
          .from('activities')
          .select('id, title')
          .in('id', setEntries.map((e) => e.activityId)),
      ])

    const titleMap = Object.fromEntries(
      (activityRows ?? []).map((a) => [a.id, a.title])
    )
    const preferences = setEntries.map((e) => ({
      title: titleMap[e.activityId] ?? 'Unknown Activity',
      level: e.level!,
      notes: e.notes,
    }))

    await sendDiscordNotification(
      createActivityPreferencesSavedEmbed({
        parentName: parentData?.full_name ?? 'Unknown',
        parentEmail: (parentData?.email as string | null) ?? 'Unknown',
        childName: childData?.child_legal_name ?? 'Unknown',
        preferences,
      })
    )
  })().catch(() => {})

  return {}
}

export async function adminSaveSchoolDayFoodPreferences(
  parentId: string,
  studentId: string,
  prefs: {
    emergencySnack: EmergencySnackPreference
    sharedFood: SharedFoodPreference
  }
): Promise<{ error?: string }> {
  const auth = await assertSuperAdmin()
  if (!auth.ok) return { error: auth.error }

  if (
    !EMERGENCY_SNACK_VALUES.includes(prefs.emergencySnack) ||
    !SHARED_FOOD_VALUES.includes(prefs.sharedFood)
  ) {
    return { error: 'Invalid preference values' }
  }

  const { adminClient } = auth

  const { data: student } = await adminClient
    .schema('admin')
    .from('students')
    .select('id')
    .eq('id', studentId)
    .eq('parent_id', parentId)
    .eq('is_deleted', false)
    .maybeSingle()

  if (!student) return { error: 'Student not found' }

  const { error } = await adminClient
    .schema('parent_app')
    .from('student_school_day_food_preferences')
    .upsert(
      {
        parent_id: parentId,
        student_id: studentId,
        emergency_snack_preference: prefs.emergencySnack,
        shared_food_preference: prefs.sharedFood,
      },
      { onConflict: 'parent_id,student_id' }
    )

  if (error) {
    console.error('adminSaveSchoolDayFoodPreferences upsert:', error)
    return { error: error.message }
  }

  ;(async () => {
    const [{ data: parentData }, { data: childData }] = await Promise.all([
      adminClient
        .schema('admin')
        .from('users')
        .select('full_name, email')
        .eq('id', parentId)
        .single(),
      adminClient
        .schema('admin')
        .from('students')
        .select('child_legal_name')
        .eq('id', studentId)
        .single(),
    ])

    await sendDiscordNotification(
      createSchoolDayFoodPreferencesSavedEmbed({
        parentName: parentData?.full_name ?? 'Unknown',
        parentEmail: (parentData?.email as string | null) ?? 'Unknown',
        childName: childData?.child_legal_name ?? 'Unknown',
        emergencySnack: prefs.emergencySnack,
        sharedFood: prefs.sharedFood,
      })
    )
  })().catch(() => {})

  return {}
}
