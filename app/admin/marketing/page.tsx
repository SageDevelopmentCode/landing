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

export default async function MarketingPage() {
  const supabase = createAdminClient()

  const [{ data: rsvps }, { data: tourUnavailability }] = await Promise.all([
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
  ])

  return (
    <MarketingClient
      rsvps={(rsvps as OpenHouseRsvp[]) ?? []}
      tourUnavailability={(tourUnavailability as TourUnavailability[]) ?? []}
    />
  )
}
