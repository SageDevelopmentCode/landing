'use server'

import { createAdminClient } from '@/app/lib/supabase-server'
import { buildSummerTuitionConfirmationEmail, sendZohoEmail } from '../lib/zoho'

export async function sendSummerTuitionConfirmationEmail(opts: {
  parentId: string
  applicationId: string
  g1FullName: string
  childLegalName: string
  email: string
}): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient()

  const { data: transactions } = await supabase
    .schema('billing')
    .from('stripe_transactions')
    .select('metadata, amount_cents, intended_amount_cents')
    .eq('parent_id', opts.parentId)
    .eq('payment_type', 'summer_tuition')
    .order('created_at', { ascending: false })
    .limit(1)

  const tx = transactions?.[0]
  if (!tx) return { success: false, error: 'No summer tuition payment found for this application' }

  const meta = tx.metadata ?? {}
  const planType: 'weekly' | 'full' = meta.plan_type === 'full' ? 'full' : 'weekly'
  const weeksStr: string = meta.weeks ?? ''
  const weeks = weeksStr ? weeksStr.split(',').map(Number).filter((n: number) => !isNaN(n)) : []
  const amountCents = tx.intended_amount_cents ?? tx.amount_cents ?? 0
  const amountDollars = (amountCents / 100).toFixed(2)

  type SiblingEmailData = { childLegalName: string; planType: 'weekly' | 'full'; weeks?: number[] }
  const emailSiblings: SiblingEmailData[] = []

  if (meta.sibling_student_ids) {
    const sibStudentIds: string[] = (meta.sibling_student_ids as string).split(',').filter(Boolean)
    const sibAppIds: string[] = (meta.sibling_application_ids as string | undefined)?.split(',') ?? []
    const sibPlanTypes: string[] = (meta.sibling_plan_types as string | undefined)?.split(',') ?? []
    const sibWeeksArr: string[] = (meta.sibling_weeks as string | undefined)?.split(',') ?? []

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

      emailSiblings.push({
        childLegalName: sibName,
        planType: sibPlanType,
        weeks: sibWeeks.length > 0 ? sibWeeks : undefined,
      })
    }
  }

  const { subject, content } = await buildSummerTuitionConfirmationEmail({
    g1FullName: opts.g1FullName,
    childLegalName: opts.childLegalName,
    planType,
    amountDollars,
    weeks: weeks.length > 0 ? weeks : undefined,
    siblings: emailSiblings.length > 0 ? emailSiblings : undefined,
  })

  return sendZohoEmail({ toAddress: opts.email, subject, content })
}
