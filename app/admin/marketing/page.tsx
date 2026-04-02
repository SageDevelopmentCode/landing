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

export default async function MarketingPage() {
  const supabase = createAdminClient()

  const [{ data: rsvps }, { data: tourUnavailability }, { data: tourBookings }] = await Promise.all([
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
  ])

  return (
    <MarketingClient
      rsvps={(rsvps as OpenHouseRsvp[]) ?? []}
      tourUnavailability={(tourUnavailability as TourUnavailability[]) ?? []}
      tourBookings={(tourBookings as TourBooking[]) ?? []}
    />
  )
}
