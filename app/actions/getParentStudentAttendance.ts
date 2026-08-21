'use server'

import { createServerSupabaseClient, createAdminClient } from '@/app/lib/supabase-server'
import {
  ATTENDANCE_SOURCES,
  collectStaffIds,
  mapRowsToUnified,
  mergeAttendanceRecords,
  type AttendanceRecordRow,
  type AttendanceResult,
  type UserMap,
} from '@/shared/parent/student-attendance'

export type {
  AttendanceProgram,
  AttendanceFilter,
  UnifiedAttendanceRecord,
  UserProfile,
  UserMap,
  AttendanceResult,
  AttendanceStatus,
} from '@/shared/parent/student-attendance'

export {
  ATT_FILTER_TABS,
  filterAttendanceRecords,
  getAttendanceStatus,
  PROGRAM_CONFIG,
} from '@/shared/parent/student-attendance'

export async function getParentStudentAttendance(studentId: string): Promise<AttendanceResult> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { records: [], userMap: {} }

  const adminClient = createAdminClient()

  const { data: student } = await adminClient
    .schema('admin')
    .from('students')
    .select('id')
    .eq('id', studentId)
    .eq('parent_id', user.id)
    .eq('is_deleted', false)
    .limit(1)
    .maybeSingle()

  if (!student) return { records: [], userMap: {} }

  const results = await Promise.all(
    ATTENDANCE_SOURCES.map(({ table, program, selectCols }) =>
      adminClient
        .schema('attendance')
        .from(table)
        .select(selectCols)
        .eq('student_id', studentId)
        .order('date', { ascending: false })
        .then(({ data }) => mapRowsToUnified((data ?? []) as unknown as AttendanceRecordRow[], program)),
    ),
  )

  const merged = mergeAttendanceRecords(results)
  const staffIds = collectStaffIds(merged)

  const userMap: UserMap = {}
  if (staffIds.length > 0) {
    const { data: users } = await adminClient
      .schema('admin')
      .from('users')
      .select('id, full_name, profile_image_url')
      .in('id', staffIds)
    for (const u of users ?? []) {
      userMap[u.id] = { full_name: u.full_name, profile_image_url: u.profile_image_url }
    }
  }

  return { records: merged, userMap }
}
