import { createServerSupabaseClient, createAdminClient } from '@/app/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import ProfileDropdown from '@/app/apply/dashboard/ProfileDropdown'
import Footer from '@/app/components/Footer'
import TeacherNav from './TeacherNav'
import MyStudentsSection, { type StudentRow } from './MyStudentsSection'
import DashboardHomeClient, { type CalendarEvent } from './DashboardHomeClient'
import { getTeacherSessions } from '@/app/actions/teacherHours'

export default async function TeacherDashboard() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const adminClient = createAdminClient()
  const todayISO = new Date().toISOString().slice(0, 10)

  const [
    { data: adminUser },
    { data: teacherStudentRows },
    initialSessions,
    { data: upcomingEventsRaw },
  ] = await Promise.all([
    adminClient.schema('admin').from('users').select('full_name, profile_image_url').eq('id', user.id).single(),
    adminClient
      .schema('teachers')
      .from('teacher_students')
      .select('id, student_id, program, classroom')
      .eq('teacher_id', user.id)
      .eq('is_deleted', false),
    getTeacherSessions(),
    adminClient
      .schema('calendar')
      .from('events')
      .select('id, title, event_date, is_all_day, start_time, end_time, color, category, description, location, attachment_links')
      .or(`shared_with.cs.{"Teachers"},created_by.eq.${user.id}`)
      .gte('event_date', todayISO)
      .order('event_date', { ascending: true })
      .limit(3),
  ])

  const fullName = adminUser?.full_name ?? null
  const profileImageUrl = adminUser?.profile_image_url ?? null

  const upcomingEvents: CalendarEvent[] = (upcomingEventsRaw ?? []).map((e) => ({
    id: e.id,
    title: e.title,
    event_date: e.event_date,
    is_all_day: e.is_all_day ?? false,
    start_time: e.start_time ?? null,
    end_time: e.end_time ?? null,
    color: e.color ?? null,
    category: e.category ?? null,
    description: e.description ?? null,
    location: e.location ?? null,
    attachment_links: e.attachment_links ?? null,
  }))

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

    const { data: todayCheckins } = await adminClient
      .schema('attendance')
      .from('check_ins')
      .select('student_id, checked_out_at')
      .in('student_id', studentIds)
      .gte('checked_in_at', todayISO + 'T00:00:00')
      .lte('checked_in_at', todayISO + 'T23:59:59')
      .eq('is_deleted', false)

    const checkinMap = new Map<string, 'checked_in' | 'checked_out'>()
    for (const c of todayCheckins ?? []) {
      checkinMap.set(c.student_id, c.checked_out_at ? 'checked_out' : 'checked_in')
    }

    myStudents = teacherStudentRows.map((r) => ({
      id: r.id,
      student_id: r.student_id,
      name: studentMap.get(r.student_id)?.name ?? null,
      grade: studentMap.get(r.student_id)?.grade ?? null,
      program: r.program,
      classroom: r.classroom,
      profile_image_url: studentMap.get(r.student_id)?.profile_image_url ?? null,
      attendance_status: checkinMap.get(r.student_id) ?? 'absent',
    }))
  }

  return (
    <div className="bg-welcome-bg">
      <div className="min-h-screen flex flex-col">
        {/* Header */}
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
              <ProfileDropdown
                email={user.email}
                fullName={fullName}
                userId={user.id}
                profileImageUrl={profileImageUrl}
              />
            )}
          </div>
        </header>

        <main className="flex-1 px-6 py-10">
          <div className="max-w-5xl mx-auto flex flex-col gap-8">
            <DashboardHomeClient
              fullName={fullName}
              initialSessions={initialSessions}
              upcomingEvents={upcomingEvents}
            />
            <MyStudentsSection students={myStudents} />
          </div>
        </main>
      </div>
      <Footer />
    </div>
  )
}
