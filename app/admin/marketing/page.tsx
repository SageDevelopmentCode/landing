import { createAdminClient } from '@/app/lib/supabase-server'
import { MarketingClient } from './MarketingClient'
import { updateReferralStatus } from './actions'
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

export type ShadowDayBooking = {
  id: string
  user_id: string
  shadow_date: string
  first_name: string
  last_name: string
  email: string
  phone: string | null
  child_name: string
  child_grade: string | null
  referral_source: string | null
  notes: string | null
  payment_status: 'pending' | 'paid'
  created_at: string
  updated_at: string
}

export type Testimonial = {
  id: string
  parent_id: string
  parent_name: string
  parent_email: string
  child_name: string
  testimonial: string
  status: 'pending' | 'approved' | 'featured' | 'declined'
  gift_card_sent: boolean
  admin_notes: string | null
  is_deleted: boolean
  created_at: string
  updated_at: string
}

export type MeetMissJoyRsvp = {
  id: string
  parent_name: string
  email: string
  phone: string | null
  child_name: string
  child_age: number
  adults_attending: string
  notes: string | null
  status: string
  is_deleted: boolean
  created_at: string
  updated_at: string
}

export type CommunityGardenDayRsvp = {
  id: string
  parent_name: string
  email: string
  phone: string | null
  adults_attending: string
  children_attending: string
  is_sage_field_family: string
  hear_about_us: string | null
  notes: string | null
  status: string
  is_deleted: boolean
  created_at: string
  updated_at: string
}

export type AdminReferral = {
  id: string
  referrer_id: string
  referred_email: string | null
  referred_user_id: string | null
  application_id: string | null
  status: string
  created_at: string
  updated_at: string
  referrer_name: string | null
  referrer_email: string | null
  referred_name: string | null
}

export type ParentFeedback = {
  id: string
  parent_id: string
  parent_name: string | null
  parent_email: string | null
  rating: number
  categories: string[]
  message: string | null
  allow_follow_up: boolean
  created_at: string
}

const VALID_TABS = [
  'open-house',
  'tour-unavailability',
  'shadow-day',
  'referrals',
  'parent-feedback',
  'info-session',
  'meet-miss-joy',
  'community-garden-day',
  'info-session-faq',
  'testimonials',
  'emails',
] as const

export type MarketingTab = (typeof VALID_TABS)[number]

export default async function MarketingPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab } = await searchParams
  const initialTab: MarketingTab = VALID_TABS.includes(tab as MarketingTab)
    ? (tab as MarketingTab)
    : 'open-house'

  const supabase = createAdminClient()

  const [
    { data: rsvps },
    { data: tourUnavailability },
    { data: tourBookings },
    { data: enrolledApps },
    { data: infoSessionRsvps },
    { data: shadowDayBookings },
    { data: testimonials },
    { data: meetMissJoyRsvps },
    { data: communityGardenDayRsvps },
    { data: referrals },
    { data: feedbackRows },
  ] = await Promise.all([
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
    supabase
      .schema('marketing')
      .from('shadow_day_bookings')
      .select('*')
      .order('shadow_date', { ascending: true }),
    supabase
      .schema('marketing')
      .from('testimonials')
      .select('*')
      .eq('is_deleted', false)
      .order('created_at', { ascending: false }),
    supabase
      .schema('marketing')
      .from('meet_miss_joy_rsvps')
      .select('*')
      .eq('is_deleted', false)
      .order('created_at', { ascending: false }),
    supabase
      .schema('marketing')
      .from('community_garden_day_rsvps')
      .select('*')
      .eq('is_deleted', false)
      .order('created_at', { ascending: false }),
    supabase
      .schema('parent_app')
      .from('referrals')
      .select('*')
      .order('created_at', { ascending: false }),
    supabase
      .schema('admin')
      .from('parent_feedback')
      .select(`
        id,
        parent_id,
        rating,
        categories,
        message,
        allow_follow_up,
        created_at,
        users!parent_id (
          full_name,
          email
        )
      `)
      .order('created_at', { ascending: false }),
  ])

  const enrolledEmailsArr: { email: string; status: string }[] = (enrolledApps ?? []).flatMap((app) => {
    const entries: { email: string; status: string }[] = []
    if (app.g1_email) entries.push({ email: app.g1_email.toLowerCase(), status: app.status })
    if (app.g2_email) entries.push({ email: app.g2_email.toLowerCase(), status: app.status })
    return entries
  })

  const referralRows = referrals ?? []
  const referrerIds = [...new Set(referralRows.map((r) => r.referrer_id).filter(Boolean))]
  const referredIds = [...new Set(referralRows.map((r) => r.referred_user_id).filter(Boolean))]
  const allIds = [...new Set([...referrerIds, ...referredIds])]

  const { data: users } = allIds.length > 0
    ? await supabase
        .schema('admin')
        .from('users')
        .select('id, full_name, email')
        .in('id', allIds)
    : { data: [] }

  const userMap: Record<string, { full_name: string | null; email: string | null }> = {}
  for (const u of users ?? []) {
    userMap[u.id] = { full_name: u.full_name, email: u.email }
  }

  const enrichedReferrals: AdminReferral[] = referralRows.map((r) => ({
    ...r,
    referrer_name: userMap[r.referrer_id]?.full_name ?? null,
    referrer_email: userMap[r.referrer_id]?.email ?? null,
    referred_name: r.referred_user_id ? (userMap[r.referred_user_id]?.full_name ?? null) : null,
  }))

  const feedback: ParentFeedback[] = (feedbackRows ?? []).map((row: {
    id: string
    parent_id: string
    rating: number
    categories: string[] | null
    message: string | null
    allow_follow_up: boolean
    created_at: string
    users: { full_name: string | null; email: string | null } | { full_name: string | null; email: string | null }[] | null
  }) => {
    const user = Array.isArray(row.users) ? row.users[0] : row.users
    return {
      id: row.id,
      parent_id: row.parent_id,
      parent_name: user?.full_name ?? null,
      parent_email: user?.email ?? null,
      rating: row.rating,
      categories: row.categories ?? [],
      message: row.message,
      allow_follow_up: row.allow_follow_up,
      created_at: row.created_at,
    }
  })

  return (
    <MarketingClient
      initialTab={initialTab}
      rsvps={(rsvps as OpenHouseRsvp[]) ?? []}
      tourUnavailability={(tourUnavailability as TourUnavailability[]) ?? []}
      tourBookings={(tourBookings as TourBooking[]) ?? []}
      enrolledEmailsArr={enrolledEmailsArr}
      infoSessionRsvps={(infoSessionRsvps as InfoSessionRsvp[]) ?? []}
      shadowDayBookings={(shadowDayBookings as ShadowDayBooking[]) ?? []}
      testimonials={(testimonials as Testimonial[]) ?? []}
      meetMissJoyRsvps={(meetMissJoyRsvps as MeetMissJoyRsvp[]) ?? []}
      communityGardenDayRsvps={
        (communityGardenDayRsvps as CommunityGardenDayRsvp[]) ?? []
      }
      referrals={enrichedReferrals}
      feedback={feedback}
      updateReferralStatus={updateReferralStatus}
    />
  )
}
