import { redirect } from 'next/navigation'

export default function WeekSwapPage() {
  redirect('/admin/archive?tab=week-swap')
}
