import { createAdminClient } from '@/app/lib/supabase-server'
import { Poppins } from 'next/font/google'
import { cssColors as colors } from '../design-system'
import { ManualPaymentClient } from './ManualPaymentClient'

const poppins = Poppins({ weight: ['300', '400', '700', '900'], subsets: ['latin'] })

export type EnrolledStudentOption = {
  studentId: string
  studentName: string
  profileImageUrl: string | null
  parentId: string
  parentName: string | null
  parentEmail: string | null
  programs: StudentProgram[]
}

export type StudentProgram = {
  applicationId: string
  paymentType: 'summer_tuition' | 'aftercare_tuition' | 'fun_friday_tuition' | 'homeschool_dropin' | 'school_year'
  programLabel: string
  program: string
  dropInProgram: string | null
  childGrade: string | null
}

export type ExistingPayments = {
  paidWeeks: number[]
  paidAftercareMonths: string[]
  paidAftercareDays: string[]
  paidFunFridayMonths: string[]
  paidFridays: string[]
  paidHomeschoolSummerWeekDays: Record<number, string[]>
  paidHomeschoolSchoolYearMonthDays: Record<number, string[]>
  paidSupplyFee: boolean
  paidSchoolYearMonths: number[]
}

export default async function ManualPaymentsPage() {
  const client = createAdminClient()

  const { data: appsData } = await client
    .schema('parent_app')
    .from('applications')
    .select('id, student_id, user_id, program, drop_in_program, child_grade, child_legal_name')
    .eq('status', 'enrolled')
    .eq('approved', true)
    .in('program', ['summer_26', 'both', 'homeschool_drop_in', 'school_year_26_27', 'aftercare', 'field_friday'])

  const apps = (appsData ?? []).filter((a) => !!a.student_id && !!a.user_id)

  const studentIds = [...new Set(apps.map((a) => a.student_id as string))]
  const parentIds = [...new Set(apps.map((a) => a.user_id as string))]

  const [{ data: studentsData }, { data: parentsData }, { data: txData }] = await Promise.all([
    studentIds.length > 0
      ? client.schema('admin').from('students').select('id, child_legal_name, profile_image_url').in('id', studentIds)
      : Promise.resolve({ data: [] }),
    parentIds.length > 0
      ? client.schema('admin').from('users').select('id, full_name, email').in('id', parentIds)
      : Promise.resolve({ data: [] }),
    studentIds.length > 0
      ? client
          .schema('billing')
          .from('stripe_transactions')
          .select('*')
          .in('student_id', studentIds)
          .eq('status', 'completed')
          .eq('is_deleted', false)
          .in('payment_type', ['summer_tuition', 'aftercare_tuition', 'fun_friday_tuition', 'homeschool_dropin', 'supply_fee', 'school_year_tuition'])
      : Promise.resolve({ data: [] }),
  ])

  const studentInfoMap: Record<string, { name: string; profileImageUrl: string | null }> = {}
  for (const s of studentsData ?? []) {
    if (s.id) studentInfoMap[s.id] = { name: s.child_legal_name ?? s.id, profileImageUrl: s.profile_image_url ?? null }
  }

  const parentInfoMap: Record<string, { name: string | null; email: string | null }> = {}
  for (const p of parentsData ?? []) {
    if (p.id) parentInfoMap[p.id] = { name: p.full_name ?? null, email: p.email ?? null }
  }

  // Group applications by student_id, building one EnrolledStudentOption per student
  const studentMap = new Map<string, EnrolledStudentOption>()

  for (const app of apps) {
    const sid = app.student_id as string
    const uid = app.user_id as string
    const prog = app.program as string

    if (!studentMap.has(sid)) {
      const info = studentInfoMap[sid]
      const parentInfo = parentInfoMap[uid]
      studentMap.set(sid, {
        studentId: sid,
        studentName: info?.name ?? app.child_legal_name ?? sid,
        profileImageUrl: info?.profileImageUrl ?? null,
        parentId: uid,
        parentName: parentInfo?.name ?? null,
        parentEmail: parentInfo?.email ?? null,
        programs: [],
      })
    }

    const option = studentMap.get(sid)!
    const programsToAdd: StudentProgram[] = []

    if (prog === 'summer_26' || prog === 'both') {
      programsToAdd.push({
        applicationId: app.id,
        paymentType: 'summer_tuition',
        programLabel: 'Summer 2026',
        program: prog,
        dropInProgram: null,
        childGrade: app.child_grade ?? null,
      })
    }
    if (prog === 'school_year_26_27' || prog === 'both') {
      programsToAdd.push({
        applicationId: app.id,
        paymentType: 'school_year',
        programLabel: 'School Year 26–27',
        program: 'school_year_26_27',
        dropInProgram: null,
        childGrade: app.child_grade ?? null,
      })
    }
    if (prog === 'homeschool_drop_in') {
      const dropIn = app.drop_in_program as string | null
      const subPrograms = dropIn === 'both'
        ? ['summer_26', 'school_year_26_27']
        : dropIn
        ? [dropIn]
        : ['summer_26']
      for (const sub of subPrograms) {
        programsToAdd.push({
          applicationId: app.id,
          paymentType: 'homeschool_dropin',
          programLabel: `Homeschool Drop-In (${sub === 'summer_26' ? 'Summer 2026' : 'School Year 26–27'})`,
          program: 'homeschool_drop_in',
          dropInProgram: sub,
          childGrade: app.child_grade ?? null,
        })
      }
    }

    for (const p of programsToAdd) {
      const alreadyHas = option.programs.some(
        (ep) => ep.paymentType === p.paymentType && ep.dropInProgram === p.dropInProgram
      )
      if (!alreadyHas) option.programs.push(p)
    }
  }

  // All enrolled students can have aftercare and fun friday added manually
  // Add them for any student not already having those program entries
  for (const option of studentMap.values()) {
    if (!option.programs.some((p) => p.paymentType === 'aftercare_tuition')) {
      option.programs.push({
        applicationId: '',
        paymentType: 'aftercare_tuition',
        programLabel: 'Aftercare',
        program: 'aftercare',
        dropInProgram: null,
        childGrade: null,
      })
    }
    if (!option.programs.some((p) => p.paymentType === 'fun_friday_tuition')) {
      option.programs.push({
        applicationId: '',
        paymentType: 'fun_friday_tuition',
        programLabel: 'Field Fun Fridays',
        program: 'field_friday',
        dropInProgram: null,
        childGrade: null,
      })
    }
  }

  const enrolledStudents = Array.from(studentMap.values()).sort((a, b) =>
    a.studentName.localeCompare(b.studentName)
  )

  // Build existingPaymentsByStudent from transactions
  const existingPaymentsByStudent: Record<string, ExistingPayments> = {}

  const ensureEntry = (sid: string): ExistingPayments => {
    if (!existingPaymentsByStudent[sid]) {
      existingPaymentsByStudent[sid] = {
        paidWeeks: [],
        paidAftercareMonths: [],
        paidAftercareDays: [],
        paidFunFridayMonths: [],
        paidFridays: [],
        paidHomeschoolSummerWeekDays: {},
        paidHomeschoolSchoolYearMonthDays: {},
        paidSupplyFee: false,
        paidSchoolYearMonths: [],
      }
    }
    return existingPaymentsByStudent[sid]
  }

  function mergeHomeschoolWeekDays(
    target: Record<number, string[]>,
    week: number,
    days: string[],
  ) {
    const existing = target[week] ?? []
    target[week] = [...new Set([...existing, ...days])]
  }

  for (const tx of txData ?? []) {
    if (!tx.student_id) continue
    const entry = ensureEntry(tx.student_id)
    const meta = (tx.metadata ?? {}) as Record<string, string>

    if (tx.payment_type === 'summer_tuition') {
      if (meta.plan_type === 'full') {
        entry.paidWeeks = Array.from({ length: 12 }, (_, i) => i + 1)
      } else {
        const weeks = (meta.weeks ?? '').split(',').map(Number).filter(Boolean)
        entry.paidWeeks = [...new Set([...entry.paidWeeks, ...weeks])]
      }
    }

    if (tx.payment_type === 'aftercare_tuition') {
      const months = (meta.selected_months ?? '').split(',').filter(Boolean)
      const days = (meta.selected_days ?? '').split(',').filter(Boolean)
      entry.paidAftercareMonths = [...new Set([...entry.paidAftercareMonths, ...months])]
      entry.paidAftercareDays = [...new Set([...entry.paidAftercareDays, ...days])]
    }

    if (tx.payment_type === 'fun_friday_tuition') {
      const months = (meta.selected_months ?? '').split(',').filter(Boolean)
      const fridays = (meta.selected_fridays ?? '').split(',').filter(Boolean)
      entry.paidFunFridayMonths = [...new Set([...entry.paidFunFridayMonths, ...months])]
      entry.paidFridays = [...new Set([...entry.paidFridays, ...fridays])]
    }

    if (tx.payment_type === 'homeschool_dropin') {
      const program = meta.program ?? 'summer_26'
      const paidMap =
        program === 'school_year_26_27'
          ? entry.paidHomeschoolSchoolYearMonthDays
          : entry.paidHomeschoolSummerWeekDays

      if (meta.week_selections) {
        try {
          const parsed: { week: number; days: string[] }[] = JSON.parse(meta.week_selections)
          for (const { week, days } of parsed) {
            mergeHomeschoolWeekDays(paidMap, week, days)
          }
        } catch { /* ignore malformed */ }
      } else {
        const weeks = (meta.selected_weeks ?? '').split(',').map(Number).filter(Boolean)
        const days = (meta.selected_days ?? '').split(',').filter(Boolean)
        for (const w of weeks) {
          mergeHomeschoolWeekDays(paidMap, w, days)
        }
      }
    }

    if (tx.payment_type === 'supply_fee') {
      entry.paidSupplyFee = true
    }

    if (tx.payment_type === 'school_year_tuition') {
      const months = (meta.selected_months ?? '').split(',').map(Number).filter(Boolean)
      entry.paidSchoolYearMonths = [...new Set([...entry.paidSchoolYearMonths, ...months])]
    }
  }

  return (
    <div className={poppins.className}>
      <div
        className="px-6 pt-6 pb-2"
        style={{ borderBottom: `1px solid ${colors.border}` }}
      >
        <h1 className="text-xl font-bold" style={{ color: colors.textPrimary }}>
          Manual Payments
        </h1>
        <p className="text-sm mt-0.5" style={{ color: colors.textTertiary }}>
          Record check or cash payments for enrolled students.
        </p>
      </div>
      <div className="p-6">
        <ManualPaymentClient
          enrolledStudents={enrolledStudents}
          existingPaymentsByStudent={existingPaymentsByStudent}
        />
      </div>
    </div>
  )
}
