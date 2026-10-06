import type { SupabaseClient } from '@supabase/supabase-js'
import { sendDiscordNotification, createErrorEmbed } from '@/app/lib/discord'
import type { AuthorizedPickupPayload } from '@/app/actions/saveAuthorizedPickup'

type ErrorContext = {
  context: string
  userId?: string
  userEmail?: string | null
}

export async function persistAuthorizedPickup(
  adminClient: SupabaseClient,
  parentId: string,
  payload: AuthorizedPickupPayload,
  errorContext: ErrorContext
): Promise<{ data?: unknown; error?: string }> {
  const notifyError = async (context: string, error: string) => {
    let parentName = 'N/A'
    let childName = 'N/A'
    try {
      const [{ data: u }, { data: s }] = await Promise.all([
        adminClient.schema('admin').from('users').select('full_name').eq('id', parentId).single(),
        adminClient.schema('admin').from('students').select('child_legal_name').eq('id', payload.studentId).single(),
      ])
      parentName = u?.full_name ?? 'N/A'
      childName = s?.child_legal_name ?? 'N/A'
    } catch {
      /* ignore */
    }
    await sendDiscordNotification(
      createErrorEmbed({
        context,
        error,
        details: {
          Parent: parentName,
          Email: errorContext.userEmail ?? 'N/A',
          Child: childName,
          'Student ID': payload.studentId,
        },
      })
    )
  }

  const { data, error: planError } = await adminClient
    .schema('parent_app')
    .from('student_authorized_pickup_plan')
    .upsert(
      {
        parent_id: parentId,
        student_id: payload.studentId,
        date_of_request: payload.dateOfRequest || null,
        effective_until: payload.effectiveUntil || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'parent_id,student_id' }
    )
    .select()
    .single()

  if (planError) {
    void notifyError(`${errorContext.context} – Upsert Plan`, planError.message).catch(() => {})
    return { error: planError.message }
  }

  const { error: deleteError } = await adminClient
    .schema('parent_app')
    .from('student_authorized_pickup_persons')
    .delete()
    .eq('parent_id', parentId)
    .eq('student_id', payload.studentId)

  if (deleteError) {
    void notifyError(`${errorContext.context} – Delete Old Persons`, deleteError.message).catch(() => {})
    return { error: deleteError.message }
  }

  if (payload.persons.length > 0) {
    const rows = payload.persons.map((p, i) => ({
      parent_id: parentId,
      student_id: payload.studentId,
      sort_order: i,
      full_name: p.fullName,
      relationship: p.relationship || null,
      phone: p.phone || null,
      email: p.email || null,
      dl_state_id_number: p.dlStateIdNumber || null,
      vehicle_info: p.vehicleInfo || null,
      license_plate_state: p.licensePlateState || null,
    }))

    const { error: insertError } = await adminClient
      .schema('parent_app')
      .from('student_authorized_pickup_persons')
      .insert(rows)

    if (insertError) {
      void notifyError(`${errorContext.context} – Insert Persons`, insertError.message).catch(() => {})
      return { error: insertError.message }
    }
  }

  return { data }
}
