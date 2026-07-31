import { redirect } from 'next/navigation'

export default function ParentFeedbackPage() {
  redirect('/admin/marketing?tab=parent-feedback')
}
