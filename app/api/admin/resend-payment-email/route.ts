import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import {
  sendZohoEmail,
  buildOneTimePaymentConfirmationEmail,
  buildDonationConfirmationEmail,
  buildRegistrationFeeConfirmationEmail,
  buildSummerTuitionConfirmationEmail,
  buildAftercareConfirmationEmail,
  buildFunFridayConfirmationEmail,
  buildHomeschoolDropInConfirmationEmail,
  buildShadowDayPaymentConfirmationEmail,
  buildBeachBashConfirmationEmail,
  buildCustomTuitionConfirmationEmail,
  buildSchoolYearTuitionConfirmationEmail,
} from '@/app/lib/zoho'

export async function POST(request: NextRequest) {
  try {
    const { transactionId, overrideEmail } = await request.json()
    if (!transactionId) {
      return NextResponse.json({ error: 'transactionId is required' }, { status: 400 })
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          },
        },
      }
    )

    const { data: tx, error: txError } = await supabase
      .schema('billing')
      .from('stripe_transactions')
      .select('*')
      .eq('id', transactionId)
      .single()

    if (txError || !tx) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    const toAddress: string = (overrideEmail?.trim()) || tx.payer_email || (tx.metadata as Record<string, string> | null)?.payer_email || (tx.metadata as Record<string, string> | null)?.parent_email || (tx.metadata as Record<string, string> | null)?.donor_email || ''
    if (!toAddress) {
      return NextResponse.json({ error: 'No email address on file for this transaction.' }, { status: 400 })
    }

    const meta = (tx.metadata ?? {}) as Record<string, string>
    const amountDollars = (tx.amount_cents / 100).toFixed(2)
    const paymentType: string = tx.payment_type

    let subject: string
    let content: string
    let template: string
    let applicationId: string | null = tx.application_id ?? null

    if (paymentType === 'one_time_payment') {
      const result = await buildOneTimePaymentConfirmationEmail({
        payerName: tx.payer_name ?? meta.payer_name ?? 'there',
        amountDollars,
        memo: meta.memo ?? undefined,
      })
      subject = result.subject
      content = result.content
      template = 'one_time_payment_confirmation'

    } else if (paymentType === 'donation') {
      const result = await buildDonationConfirmationEmail({
        donorName: meta.donor_name ?? tx.payer_name ?? undefined,
        donorEmail: toAddress,
        amountDollars,
        message: meta.message ?? undefined,
      })
      subject = result.subject
      content = result.content
      template = 'donation_confirmation'

    } else if (paymentType === 'registration_fee') {
      const appId = applicationId ?? meta.application_id ?? null
      let g1FullName = 'Parent'
      let childLegalName = 'your child'
      let program = 'all enrolled programs'

      if (appId) {
        const { data: app } = await supabase
          .schema('parent_app')
          .from('applications')
          .select('g1_full_name, child_legal_name, program')
          .eq('id', appId)
          .single()
        if (app) {
          g1FullName = app.g1_full_name ?? g1FullName
          childLegalName = app.child_legal_name ?? childLegalName
          const programMap: Record<string, string> = {
            summer_26: 'Summer 2026',
            school_year_26_27: 'School Year 2026-27',
            both: 'Summer 2026 & School Year 2026-27',
            homeschool_drop_in: 'Homeschool Drop-In',
          }
          program = programMap[meta.program ?? ''] ?? app.program ?? program
        }
      }

      const result = await buildRegistrationFeeConfirmationEmail({ g1FullName, childLegalName, program, amountDollars })
      subject = result.subject
      content = result.content
      template = 'registration_fee_confirmation'
      applicationId = appId

    } else if (paymentType === 'summer_tuition') {
      const appId = applicationId ?? meta.application_id ?? null
      let g1FullName = 'Parent'
      let childLegalName = 'your child'

      if (appId) {
        const { data: app } = await supabase
          .schema('parent_app')
          .from('applications')
          .select('g1_full_name, child_legal_name')
          .eq('id', appId)
          .single()
        if (app) {
          g1FullName = app.g1_full_name ?? g1FullName
          childLegalName = app.child_legal_name ?? childLegalName
        }
      }

      const planType = (meta.plan_type ?? 'full') as 'weekly' | 'full'
      const weeks = meta.weeks
        ? meta.weeks.split(',').map(Number).filter((n) => !isNaN(n))
        : []

      const emailSiblings: Array<{ childLegalName: string; planType: 'weekly' | 'full'; weeks?: number[] }> = []
      if (meta.sibling_student_ids) {
        const sibStudentIds = meta.sibling_student_ids.split(',').filter(Boolean)
        const sibAppIds = meta.sibling_application_ids?.split(',') ?? []
        const sibPlanTypes = meta.sibling_plan_types?.split(',') ?? []
        const sibWeeksArr = meta.sibling_weeks?.split(',') ?? []

        for (let i = 0; i < sibStudentIds.length; i++) {
          const sibWeeks = (sibWeeksArr[i] ?? '').split(';').map(Number).filter((n) => !isNaN(n) && n > 0)
          const sibPlanType: 'weekly' | 'full' = sibPlanTypes[i] === 'full' ? 'full' : 'weekly'
          let sibName = 'your child'
          const sibAppId = sibAppIds[i]
          if (sibAppId) {
            const { data: sibApp } = await supabase
              .schema('parent_app')
              .from('applications')
              .select('child_legal_name')
              .eq('id', sibAppId)
              .single()
            if (sibApp?.child_legal_name) sibName = sibApp.child_legal_name
          }
          if (sibName === 'your child') {
            const { data: sibStudent } = await supabase
              .schema('admin')
              .from('students')
              .select('child_legal_name')
              .eq('id', sibStudentIds[i])
              .single()
            if (sibStudent?.child_legal_name) sibName = sibStudent.child_legal_name
          }
          emailSiblings.push({ childLegalName: sibName, planType: sibPlanType, weeks: sibWeeks.length > 0 ? sibWeeks : undefined })
        }
      }

      const result = await buildSummerTuitionConfirmationEmail({
        g1FullName,
        childLegalName,
        planType,
        amountDollars,
        weeks: weeks.length > 0 ? weeks : undefined,
        siblings: emailSiblings.length > 0 ? emailSiblings : undefined,
      })
      subject = result.subject
      content = result.content
      template = 'summer_tuition_confirmation'
      applicationId = appId

    } else if (paymentType === 'aftercare_tuition') {
      const appId = applicationId ?? meta.application_id ?? null
      const studentId = meta.student_id ?? tx.parent_id ?? null
      let g1FullName = 'Parent'
      let childLegalName = 'your child'

      if (appId) {
        const { data: app } = await supabase
          .schema('parent_app')
          .from('applications')
          .select('g1_full_name, child_legal_name')
          .eq('id', appId)
          .single()
        if (app) {
          g1FullName = app.g1_full_name ?? g1FullName
          childLegalName = app.child_legal_name ?? childLegalName
        }
      } else if (studentId) {
        const { data: student } = await supabase
          .schema('admin')
          .from('students')
          .select('child_legal_name')
          .eq('id', studentId)
          .single()
        if (student) childLegalName = student.child_legal_name ?? childLegalName
      }

      const planType = (meta.plan_type ?? 'monthly') as 'monthly' | 'daily'
      const selectedMonths = meta.selected_months ? meta.selected_months.split(',').filter(Boolean) : []
      const selectedDays = meta.selected_days ? meta.selected_days.split(',').filter(Boolean) : []

      const result = await buildAftercareConfirmationEmail({ g1FullName, childLegalName, planType, selectedMonths, selectedDays, amountDollars })
      subject = result.subject
      content = result.content
      template = 'aftercare_tuition_confirmation'
      applicationId = appId

    } else if (paymentType === 'fun_friday_tuition') {
      const appId = applicationId ?? meta.application_id ?? null
      const studentId = meta.student_id ?? null
      let g1FullName = 'Parent'
      let childLegalName = 'your child'

      if (appId) {
        const { data: app } = await supabase
          .schema('parent_app')
          .from('applications')
          .select('g1_full_name, child_legal_name')
          .eq('id', appId)
          .single()
        if (app) {
          g1FullName = app.g1_full_name ?? g1FullName
          childLegalName = app.child_legal_name ?? childLegalName
        }
      } else if (studentId) {
        const { data: student } = await supabase
          .schema('admin')
          .from('students')
          .select('child_legal_name')
          .eq('id', studentId)
          .single()
        if (student) childLegalName = student.child_legal_name ?? childLegalName
      }

      const planType = (meta.plan_type ?? 'monthly') as 'monthly' | 'dropin'
      const selectedMonths = meta.selected_months ? meta.selected_months.split(',').filter(Boolean) : []
      const selectedFridays = meta.selected_fridays ? meta.selected_fridays.split(',').filter(Boolean) : []

      const result = await buildFunFridayConfirmationEmail({ g1FullName, childLegalName, planType, selectedMonths, selectedFridays, amountDollars })
      subject = result.subject
      content = result.content
      template = 'fun_friday_tuition_confirmation'
      applicationId = appId

    } else if (paymentType === 'homeschool_dropin') {
      const appId = applicationId ?? meta.application_id ?? null
      const studentId = meta.student_id ?? null
      let g1FullName = 'Parent'
      let childLegalName = 'your child'

      if (appId) {
        const { data: app } = await supabase
          .schema('parent_app')
          .from('applications')
          .select('g1_full_name, child_legal_name')
          .eq('id', appId)
          .single()
        if (app) {
          g1FullName = app.g1_full_name ?? g1FullName
          childLegalName = app.child_legal_name ?? childLegalName
        }
      } else if (studentId) {
        const { data: student } = await supabase
          .schema('admin')
          .from('students')
          .select('child_legal_name')
          .eq('id', studentId)
          .single()
        if (student) childLegalName = student.child_legal_name ?? childLegalName
      }

      const program = meta.program ?? 'summer_26'
      const tier = meta.tier ?? 'dropin'
      const selectedDays = meta.selected_days ? meta.selected_days.split(',').filter(Boolean) : []
      const selectedWeeks = meta.selected_weeks ? meta.selected_weeks.split(',').map(Number).filter(Boolean) : []

      const result = await buildHomeschoolDropInConfirmationEmail({ g1FullName, childLegalName, program, tier, selectedDays, selectedWeeks, amountDollars })
      subject = result.subject
      content = result.content
      template = 'homeschool_dropin_confirmation'
      applicationId = appId

    } else if (paymentType === 'shadow_day_fee') {
      const bookingId = meta.booking_id ?? null
      let parentName = tx.payer_name ?? 'Parent'
      let childName = 'your child'
      let shadowDate = 'N/A'

      if (bookingId) {
        const { data: booking } = await supabase
          .schema('marketing')
          .from('shadow_day_bookings')
          .select('first_name, last_name, email, child_name, shadow_date')
          .eq('id', bookingId)
          .single()
        if (booking) {
          parentName = `${booking.first_name ?? ''} ${booking.last_name ?? ''}`.trim() || parentName
          childName = booking.child_name ?? childName
          shadowDate = booking.shadow_date ?? shadowDate
        }
      }

      const result = await buildShadowDayPaymentConfirmationEmail({ parentName, childName, shadowDate, amountDollars })
      subject = result.subject
      content = result.content
      template = 'shadow_day_fee_confirmation'

    } else if (paymentType === 'beach_bash_fee') {
      const registrationId = meta.registration_id ?? null
      let parentName = meta.parent_name ?? tx.payer_name ?? 'Parent'
      let childNames = meta.child_names ?? 'your child'
      let childCount = parseInt(meta.child_count ?? '1', 10)

      if (registrationId) {
        const { data: reg } = await supabase
          .schema('marketing')
          .from('beach_bash_registrations')
          .select('parent_name, email, children, child_count')
          .eq('id', registrationId)
          .single()
        if (reg) {
          parentName = reg.parent_name ?? parentName
          childCount = reg.child_count ?? childCount
          const kids = reg.children as Array<{ name: string; age: number }> | null
          if (kids && kids.length > 0) childNames = kids.map((c) => c.name).join(', ')
        }
      }

      const result = await buildBeachBashConfirmationEmail({ parentName, childNames, childCount, amountDollars })
      subject = result.subject
      content = result.content
      template = 'beach_bash_fee_confirmation'

    } else if (paymentType === 'custom_tuition') {
      const parentId = tx.parent_id ?? meta.parent_id ?? null
      const studentId = meta.student_id ?? null
      const label = meta.label ?? 'Custom Tuition'
      let g1FullName = tx.payer_name ?? 'Parent'

      if (parentId) {
        const { data: userRow } = await supabase
          .schema('admin')
          .from('users')
          .select('full_name')
          .eq('id', parentId)
          .single()
        if (userRow) g1FullName = userRow.full_name ?? g1FullName
      }

      const result = await buildCustomTuitionConfirmationEmail({ g1FullName, label, amountDollars })
      subject = result.subject
      content = result.content
      template = 'custom_tuition_confirmation'

    } else if (paymentType === 'school_year_tuition') {
      const parentId = tx.parent_id ?? meta.parent_id ?? null
      const studentId = meta.student_id ?? null
      let g1FullName = tx.payer_name ?? 'Parent'
      let childName = 'your child'

      if (parentId) {
        const { data: userRow } = await supabase
          .schema('admin').from('users').select('full_name').eq('id', parentId).single()
        if (userRow) g1FullName = userRow.full_name ?? g1FullName
      }
      if (studentId) {
        const { data: student } = await supabase
          .schema('admin').from('students').select('child_legal_name').eq('id', studentId).single()
        if (student) childName = student.child_legal_name ?? childName
      }

      const selectedMonths = meta.selected_months
        ? meta.selected_months.split(',').map(Number).filter((n) => !isNaN(n) && n > 0)
        : []

      const result = await buildSchoolYearTuitionConfirmationEmail({
        g1FullName,
        childName,
        amountDollars,
        selectedMonths: selectedMonths.length > 0 ? selectedMonths : undefined,
      })
      subject = result.subject
      content = result.content
      template = 'school_year_tuition_confirmation'

    } else {
      return NextResponse.json({ error: `Unsupported payment type: ${paymentType}` }, { status: 400 })
    }

    const emailResult = await sendZohoEmail({ toAddress, subject, content })
    if (!emailResult.success) {
      return NextResponse.json({ error: emailResult.error ?? 'Email send failed' }, { status: 500 })
    }

    await supabase.schema('email_logs').from('sends').insert({
      to_address: toAddress,
      subject,
      template,
      application_id: applicationId ?? null,
      status: 'success',
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('resend-payment-email error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
