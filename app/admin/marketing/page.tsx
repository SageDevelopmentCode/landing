import { createAdminClient } from '@/app/lib/supabase-server'
import { MarketingClient } from './MarketingClient'
import type { TourUnavailability } from '@/app/actions/tourUnavailability'

export type OpenHouseRsvp = {
  id: string
  created_at: string
  name: string
  email: string
  phone: string | null
  adults_attending: number
  children_attending: number
  notes: string | null
}

export type TourBooking = {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string | null
  child_name: string
  child_grade: string
  num_children: number
  tour_date: string
  tour_time: string
  how_did_you_hear: string
  accommodations: string | null
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show'
  is_deleted: boolean
  created_at: string
  updated_at: string
}

export type InfoSessionRsvp = {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string | null
  children: { name: string; age: string }[] | null
  programs: string[] | null
  hear_about_us: string | null
  questions: string | null
  status: string | null
  is_deleted: boolean
  created_at: string
  updated_at: string
}

export default async function MarketingPage() {
  const supabase = createAdminClient()

  const [{ data: rsvps }, { data: tourUnavailability }, { data: tourBookings }, { data: enrolledApps }, { data: infoSessionRsvps }] = await Promise.all([
    supabase
      .schema('marketing')
      .from('open_house_rsvps')
      .select('*')
      .order('created_at', { ascending: false }),
    supabase
      .schema('marketing')
      .from('tour_unavailability')
      .select('*')
      .order('unavailable_date', { ascending: true }),
    supabase
      .schema('marketing')
      .from('tour_bookings')
      .select('*')
      .eq('is_deleted', false)
      .order('tour_date', { ascending: true }),
    supabase
      .schema('parent_app')
      .from('applications')
      .select('g1_email, g2_email, status')
      .in('status', ['enrolled', 'enrolling']),
    supabase
      .schema('marketing')
      .from('info_session_rsvps')
      .select('*')
      .eq('is_deleted', false)
      .order('created_at', { ascending: false }),
  ])

  const enrolledEmailsArr: { email: string; status: string }[] = (enrolledApps ?? []).flatMap((app) => {
    const entries: { email: string; status: string }[] = []
    if (app.g1_email) entries.push({ email: app.g1_email.toLowerCase(), status: app.status })
    if (app.g2_email) entries.push({ email: app.g2_email.toLowerCase(), status: app.status })
    return entries
  })

  return (
    <MarketingClient
      rsvps={(rsvps as OpenHouseRsvp[]) ?? []}
      tourUnavailability={(tourUnavailability as TourUnavailability[]) ?? []}
      tourBookings={(tourBookings as TourBooking[]) ?? []}
      enrolledEmailsArr={enrolledEmailsArr}
      infoSessionRsvps={(infoSessionRsvps as InfoSessionRsvp[]) ?? []}
    />
  )
}
