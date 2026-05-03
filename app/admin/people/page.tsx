import { createAdminClient } from '@/app/lib/supabase-server'
import { cssColors as colors } from '../design-system'
import { Poppins } from 'next/font/google'
import { PeopleClient } from './PeopleClient'
import { getAllStudentAssignments } from '../../actions/teacherAssignments'

const poppins = Poppins({
  weight: ['300', '400', '700', '900'],
  subsets: ['latin'],
})

type Parent = {
  id: string
  email: string | null
  full_name: string | null
  g1_cell_phone: string | null
  g1_work_phone: string | null
  g1_preferred_contact: boolean | null
  g1_lives_with_child: boolean | null
  g1_has_custody: boolean | null
  g2_full_name: string | null
  g2_relationship: string | null
  g2_email: string | null
  g2_cell_phone: string | null
  g2_work_phone: string | null
  [key: string]: unknown
}

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
  child_grade: string | null
  parent_name?: string | null
  profile_image_url?: string | null
}

async function fetchParentDetail(parentId: string) {
  'use server'
  const client = createAdminClient()

  const [{ data: children }, { data: applications }] = await Promise.all([
    client
      .schema('admin')
      .from('students')
      .select('id, child_legal_name, dob_month, dob_day, dob_year')
      .eq('parent_id', parentId)
      .eq('is_deleted', false),
    client
      .schema('parent_app')
      .from('applications')
      .select('id, child_legal_name, program, drop_in_program, status, approved, approved_at, updated_at')
      .eq('user_id', parentId),
  ])

  return {
    children: (children ?? []) as {
      id: string
      child_legal_name: string | null
      dob_month: string | null
      dob_day: string | null
      dob_year: string | null
    }[],
    applications: (applications ?? []) as {
      id: string
      child_legal_name: string | null
      program: string | null
      drop_in_program: string | null
      status: string
      approved: boolean
      approved_at: string | null
      updated_at: string | null
    }[],
  }
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

export default async function PeoplePage() {
  const client = createAdminClient()

  const [
    { data: parents },
    { data: students },
    { data: enrolledApps },
    assignmentsByStudentId,
  ] = await Promise.all([
    client.schema('admin').from('users').select('*').eq('role', 'parent').eq('is_deleted', false).order('full_name'),
    client.schema('admin').from('students').select('*').eq('is_deleted', false).order('child_legal_name'),
    client.schema('parent_app').from('applications').select('student_id, admin_tags').eq('status', 'enrolled'),
    getAllStudentAssignments(),
  ])

  const enrolledStudentIds = new Set(
    (enrolledApps ?? []).map((a) => a.student_id).filter(Boolean)
  )

  const tagsByStudentId: Record<string, string[]> = {}
  for (const a of enrolledApps ?? []) {
    if (a.student_id && a.admin_tags?.length) {
      tagsByStudentId[a.student_id] = a.admin_tags
    }
  }

  const allStudents = (students ?? []) as Student[]
  const enrolledStudents = allStudents.filter((s) => enrolledStudentIds.has(s.id))

  const parentIds = [...new Set(enrolledStudents.map((s) => s.parent_id).filter(Boolean))]
  let parentMap: Record<string, string> = {}

  if (parentIds.length > 0) {
    const { data: parentRows } = await client
      .schema('admin')
      .from('users')
      .select('id, full_name')
      .in('id', parentIds)

    if (parentRows) {
      parentMap = Object.fromEntries(
        parentRows.map((p: { id: string; full_name: string | null }) => [p.id, p.full_name ?? ''])
      )
    }
  }

  const studentsWithParents = enrolledStudents.map((s) => ({
    ...s,
    parent_name: parentMap[s.parent_id] ?? null,
  }))

  const parentRows = (parents ?? []) as Parent[]

  return (
    <div className="space-y-6 pt-6">
      <div>
        <h1
          className={`text-2xl font-bold ${poppins.className}`}
          style={{ color: colors.mistyForest }}
        >
          People
        </h1>
        <p className="mt-2" style={{ color: colors.textSecondary }}>
          {parentRows.length} parent{parentRows.length !== 1 ? 's' : ''} · {studentsWithParents.length} student{studentsWithParents.length !== 1 ? 's' : ''}
        </p>
      </div>

      <PeopleClient
        parents={parentRows}
        students={studentsWithParents}
        fetchParentDetail={fetchParentDetail}
        fetchStudentDetail={fetchStudentDetail}
        assignmentsByStudentId={assignmentsByStudentId}
        tagsByStudentId={tagsByStudentId}
      />
    </div>
  )
}
