import { redirect } from 'next/navigation'

export default function DaySwapPage() {
  redirect('/admin/archive?tab=day-swap')
}
