'use server'

import { createServerSupabaseClient, createAdminClient } from '@/app/lib/supabase-server'

export type PaystubStatus = 'pending' | 'approved' | 'paid'

export type Paystub = {
  id: string
  teacher_id: string
  period_start: string
  period_end: string
  total_hours: number
  hourly_rate_snapshot: number
  gross_pay: number
  status: PaystubStatus
  submitted_at: string
  approved_at: string | null
  paid_at: string | null
  admin_note: string | null
}

export type PaystubWithTeacher = Paystub & {
  teacher_name: string | null
  teacher_email: string | null
}

// ─── Teacher Actions ─────────────────────────────────────────────────────────

export async function getMyPaystubs(): Promise<Paystub[]> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const adminClient = createAdminClient()
  const { data, error } = await adminClient
    .schema('teachers')
    .from('paystubs')
    .select('*')
    .eq('teacher_id', user.id)
    .order('period_start', { ascending: false })

  if (error || !data) return []
  return data as Paystub[]
}

export async function getMyHourlyRate(): Promise<number | null> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const adminClient = createAdminClient()
  const { data } = await adminClient
    .schema('admin')
    .from('users')
    .select('hourly_rate')
    .eq('id', user.id)
    .single()

  return data?.hourly_rate ?? null
}

export async function submitPaystub(
  periodStart: string,
  periodEnd: string,
): Promise<{ paystub: Paystub } | { error: string }> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const adminClient = createAdminClient()

  const { data: existing } = await adminClient
    .schema('teachers')
    .from('paystubs')
    .select('id')
    .eq('teacher_id', user.id)
    .eq('period_start', periodStart)
    .eq('period_end', periodEnd)
    .maybeSingle()

  if (existing) return { error: 'A paystub for this period has already been submitted.' }

  const periodStartISO = `${periodStart}T00:00:00`
  const periodEndISO   = `${periodEnd}T23:59:59`

  const { data: sessions, error: sessionsError } = await adminClient
    .schema('teachers')
    .from('clock_sessions')
    .select('clock_in_at, clock_out_at')
    .eq('teacher_id', user.id)
    .gte('clock_in_at', periodStartISO)
    .lte('clock_in_at', periodEndISO)
    .not('clock_out_at', 'is', null)

  if (sessionsError) return { error: sessionsError.message }

  const totalHours = Math.round(
    (sessions ?? []).reduce((acc, s) => {
      if (!s.clock_out_at) return acc
      const diff = new Date(s.clock_out_at).getTime() - new Date(s.clock_in_at).getTime()
      return acc + Math.max(0, diff / 1000 / 3600)
    }, 0) * 100
  ) / 100

  const { data: adminUser } = await adminClient
    .schema('admin')
    .from('users')
    .select('hourly_rate')
    .eq('id', user.id)
    .single()

  const hourlyRate = adminUser?.hourly_rate
  if (!hourlyRate || hourlyRate <= 0) {
    return { error: 'No hourly rate is set for your account. Contact admin.' }
  }

  const grossPay = Math.round(totalHours * hourlyRate * 100) / 100

  const { data: paystub, error: insertError } = await adminClient
    .schema('teachers')
    .from('paystubs')
    .insert({
      teacher_id:           user.id,
      period_start:         periodStart,
      period_end:           periodEnd,
      total_hours:          totalHours,
      hourly_rate_snapshot: hourlyRate,
      gross_pay:            grossPay,
    })
    .select('*')
    .single()

  if (insertError || !paystub) return { error: insertError?.message ?? 'Insert failed' }
  return { paystub: paystub as Paystub }
}

// ─── Admin Actions ────────────────────────────────────────────────────────────

export async function getAllPaystubs(): Promise<PaystubWithTeacher[]> {
  const adminClient = createAdminClient()

  const { data: stubs, error } = await adminClient
    .schema('teachers')
    .from('paystubs')
    .select('*')
    .order('submitted_at', { ascending: false })

  if (error || !stubs) return []

  const teacherIds = [...new Set(stubs.map((s: Paystub) => s.teacher_id))]
  const { data: users } = teacherIds.length > 0
    ? await adminClient
        .schema('admin')
        .from('users')
        .select('id, full_name, email')
        .in('id', teacherIds)
    : { data: [] }

  const userMap: Record<string, { full_name: string | null; email: string }> = {}
  for (const u of users ?? []) {
    userMap[u.id] = { full_name: u.full_name, email: u.email }
  }

  return (stubs as Paystub[]).map((s) => ({
    ...s,
    teacher_name:  userMap[s.teacher_id]?.full_name ?? null,
    teacher_email: userMap[s.teacher_id]?.email ?? null,
  }))
}

export async function approvePaystub(
  paystubId: string,
  adminNote?: string,
): Promise<{ error?: string }> {
  const adminClient = createAdminClient()
  const { error } = await adminClient
    .schema('teachers')
    .from('paystubs')
    .update({
      status:      'approved',
      approved_at: new Date().toISOString(),
      ...(adminNote !== undefined ? { admin_note: adminNote } : {}),
    })
    .eq('id', paystubId)
    .eq('status', 'pending')

  return error ? { error: error.message } : {}
}

export async function markPaystubPaid(
  paystubId: string,
  adminNote?: string,
): Promise<{ error?: string }> {
  const adminClient = createAdminClient()
  const { error } = await adminClient
    .schema('teachers')
    .from('paystubs')
    .update({
      status:  'paid',
      paid_at: new Date().toISOString(),
      ...(adminNote !== undefined ? { admin_note: adminNote } : {}),
    })
    .eq('id', paystubId)
    .eq('status', 'approved')

  return error ? { error: error.message } : {}
}

export async function updatePaystubNote(
  paystubId: string,
  adminNote: string,
): Promise<{ error?: string }> {
  const adminClient = createAdminClient()
  const { error } = await adminClient
    .schema('teachers')
    .from('paystubs')
    .update({ admin_note: adminNote })
    .eq('id', paystubId)

  return error ? { error: error.message } : {}
}

export async function setTeacherHourlyRate(
  teacherId: string,
  hourlyRate: number,
): Promise<{ error?: string }> {
  const adminClient = createAdminClient()
  const { error } = await adminClient
    .schema('admin')
    .from('users')
    .update({ hourly_rate: hourlyRate, updated_at: new Date().toISOString() })
    .eq('id', teacherId)

  return error ? { error: error.message } : {}
}
