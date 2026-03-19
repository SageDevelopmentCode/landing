import { createAdminClient } from '@/app/lib/supabase-server'
import { MarketingClient } from './MarketingClient'

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
  const { data: rsvps } = await supabase
    .schema('marketing')
    .from('open_house_rsvps')
    .select('*')
    .order('created_at', { ascending: false })

  return <MarketingClient rsvps={(rsvps as OpenHouseRsvp[]) ?? []} />
}
