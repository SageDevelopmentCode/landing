import { createServerSupabaseClient, createAdminClient } from '@/app/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import ProfileDropdown from '@/app/apply/dashboard/ProfileDropdown'
import TeacherNav from '../TeacherNav'
import { type StudentRow } from '../MyStudentsSection'
import StudentsPageClient from './StudentsPageClient'

export default async function StudentsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const adminClient = createAdminClient()

  const [{ data: adminUser }, { data: teacherStudentRows }] = await Promise.all([
    adminClient.schema('admin').from('users').select('full_name, profile_image_url').eq('id', user.id).single(),
    adminClient
      .schema('teachers')
      .from('teacher_students')
      .select('id, student_id, program, classroom')
      .eq('teacher_id', user.id)
      .eq('is_deleted', false),
  ])

  const fullName = adminUser?.full_name ?? null
  const profileImageUrl = adminUser?.profile_image_url ?? null

  let myStudents: StudentRow[] = []

  if (teacherStudentRows && teacherStudentRows.length > 0) {
    const studentIds = [...new Set(teacherStudentRows.map((r) => r.student_id))]
    const { data: studentRecords } = await adminClient
      .schema('admin')
      .from('students')
      .select('id, child_legal_name, child_grade, profile_image_url')
      .in('id', studentIds)

    const studentMap = new Map(
      (studentRecords ?? []).map((s) => [s.id, { name: s.child_legal_name, grade: s.child_grade, profile_image_url: s.profile_image_url ?? null }])
    )

    myStudents = teacherStudentRows.map((r) => ({
      id: r.id,
      student_id: r.student_id,
      name: studentMap.get(r.student_id)?.name ?? null,
      grade: studentMap.get(r.student_id)?.grade ?? null,
      program: r.program,
      classroom: r.classroom,
      profile_image_url: studentMap.get(r.student_id)?.profile_image_url ?? null,
    }))
  }

  return (
    <div className="bg-white min-h-screen flex flex-col">
      <header className="bg-white border-b border-gray-100 px-5 py-3 grid grid-cols-[auto_1fr_auto] items-center">
        <div className="flex items-center">
          <Link href="/">
            <Image
              src="/assets/Logo.png"
              alt="Sage Field"
              width={50}
              height={24}
              className="object-contain"
            />
          </Link>
        </div>
        <div className="flex items-center justify-center">
          <TeacherNav />
        </div>
        <div className="flex items-center justify-end">
          {user?.email && (
            <ProfileDropdown email={user.email} fullName={fullName} userId={user.id} profileImageUrl={profileImageUrl} />
          )}
        </div>
      </header>

      <main className="flex-1 flex flex-col overflow-hidden">
        <StudentsPageClient students={myStudents} teacherId={user.id} />
      </main>
    </div>
  )
}
