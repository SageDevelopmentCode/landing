import { createAdminClient } from '@/app/lib/supabase-server'
import { colors } from '../design-system'
import { Merriweather } from 'next/font/google'
import { StudentsClient } from './StudentsClient'

const merriweather = Merriweather({
  weight: ['300', '400', '700', '900'],
  subsets: ['latin'],
})

type Student = {
  id: string
  parent_id: string
  child_legal_name: string | null
  dob_month: string | null
  dob_day: string | null
  dob_year: string | null
  special_interests: string | null
  has_medical_conditions: string | null
  medical_conditions_description: string | null
  has_allergies: string | null
  allergies_description: string | null
  has_emergency_medications: string | null
  emergency_medications_description: string | null
  history_flags: string | null
  history_explanation: string | null
  needs_aide: string | null
  needs_aide_description: string | null
  learning_style: string | null
  strengths_interests: string | null
  current_challenges: string | null
  dysregulation_response: string | null
  regulation_strategies: string | null
  activities_to_avoid: string | null
  parent_name?: string | null
}

async function fetchStudentDetail(studentId: string): Promise<Student> {
  'use server'
  const client = createAdminClient()

  const { data: student } = await client
    .schema('admin')
    .from('students')
    .select('*')
    .eq('id', studentId)
    .single()

  if (!student) {
    throw new Error('Student not found')
  }

  const { data: parent } = await client
    .schema('admin')
    .from('users')
    .select('full_name')
    .eq('id', student.parent_id)
    .single()

  return {
    ...(student as Student),
    parent_name: parent?.full_name ?? null,
  }
}

export default async function StudentsPage() {
  const client = createAdminClient()

  const { data: students } = await client
    .schema('admin')
    .from('students')
    .select('*')
    .eq('is_deleted', false)
    .order('child_legal_name')

  const rows = (students ?? []) as Student[]

  // Fetch parent names for all students
  const parentIds = [...new Set(rows.map((s) => s.parent_id).filter(Boolean))]
  let parentMap: Record<string, string> = {}

  if (parentIds.length > 0) {
    const { data: parents } = await client
      .schema('admin')
      .from('users')
      .select('id, full_name')
      .in('id', parentIds)

    if (parents) {
      parentMap = Object.fromEntries(
        parents.map((p: { id: string; full_name: string | null }) => [p.id, p.full_name ?? ''])
      )
    }
  }

  const rowsWithParents = rows.map((s) => ({
    ...s,
    parent_name: parentMap[s.parent_id] ?? null,
  }))

  return (
    <div className="space-y-6 pt-6">
      <div>
        <h1
          className={`text-2xl font-bold ${merriweather.className}`}
          style={{ color: colors.mistyForest }}
        >
          Students
        </h1>
        <p className="mt-2" style={{ color: colors.textSecondary }}>
          {rowsWithParents.length} student{rowsWithParents.length !== 1 ? 's' : ''}
        </p>
      </div>

      <StudentsClient students={rowsWithParents} fetchStudentDetail={fetchStudentDetail} />
    </div>
  )
}
