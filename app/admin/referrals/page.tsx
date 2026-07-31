import { redirect } from 'next/navigation'

export default function ReferralsPage() {
  redirect('/admin/marketing?tab=referrals')
}
