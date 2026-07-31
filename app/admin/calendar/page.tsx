import { redirect } from 'next/navigation'

export default function CalendarPage() {
  redirect('/admin/archive?tab=calendar')
}
