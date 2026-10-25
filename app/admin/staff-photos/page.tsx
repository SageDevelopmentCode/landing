import { createAdminClient } from '@/app/lib/supabase-server'
import { cssColors as colors } from '../design-system'
import { Poppins } from 'next/font/google'
import { StaffPhotosClient, type StaffMember } from './StaffPhotosClient'

const poppins = Poppins({
  weight: ['300', '400', '700', '900'],
  subsets: ['latin'],
})

async function getStaff(): Promise<StaffMember[]> {
  const adminClient = createAdminClient()
  const { data } = await adminClient
    .schema('admin')
    .from('users')
    .select('id, full_name, email, role, profile_image_url')
    .in('role', ['teacher', 'super_admin', 'teacher_aide'])
    .eq('is_deleted', false)
    .order('full_name')

  return (data ?? []) as StaffMember[]
}

export default async function StaffPhotosPage() {
  const staff = await getStaff()
  const withPhoto = staff.filter((s) => s.profile_image_url).length

  return (
    <div className="space-y-6 pt-6">
      <div>
        <h1
          className={`text-2xl font-bold ${poppins.className}`}
          style={{ color: colors.mistyForest }}
        >
          Staff photos
        </h1>
        <p className="mt-1 text-sm" style={{ color: colors.textSecondary }}>
          App avatars for messages, feed, and teacher profiles. {staff.length} staff ·{' '}
          {withPhoto} with a photo
        </p>
      </div>

      <StaffPhotosClient staff={staff} />
    </div>
  )
}
