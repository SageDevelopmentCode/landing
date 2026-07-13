import { createAdminClient } from '@/app/lib/supabase-server'
import { cssColors as colors } from '../../design-system'
import { Poppins } from 'next/font/google'
import { FeedbackView } from './FeedbackView'

const poppins = Poppins({
  weight: ['300', '400', '700', '900'],
  subsets: ['latin'],
})

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

export default async function ParentFeedbackPage() {
  const client = createAdminClient()

  const { data: rows } = await client
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
    .order('created_at', { ascending: false })

  const feedback: ParentFeedback[] = (rows ?? []).map((row: any) => ({
    id: row.id,
    parent_id: row.parent_id,
    parent_name: row.users?.full_name ?? null,
    parent_email: row.users?.email ?? null,
    rating: row.rating,
    categories: row.categories ?? [],
    message: row.message,
    allow_follow_up: row.allow_follow_up,
    created_at: row.created_at,
  }))

  return (
    <div className="space-y-6 pt-6">
      <div>
        <h1
          className={`text-2xl font-bold ${poppins.className}`}
          style={{ color: colors.mistyForest }}
        >
          Parent Feedback
        </h1>
        <p className="mt-2" style={{ color: colors.textSecondary }}>
          {feedback.length} submission{feedback.length !== 1 ? 's' : ''}
        </p>
      </div>

      <FeedbackView feedback={feedback} />
    </div>
  )
}
