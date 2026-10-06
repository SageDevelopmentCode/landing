import type { PickupPersonEntry } from '@/app/actions/saveAuthorizedPickup'

export function validatePickupPersonEntry(p: PickupPersonEntry): string | null {
  if (!p.fullName.trim()) return 'Full name is required.'
  if (!p.relationship.trim()) return 'Relationship is required.'
  if (!p.phone.trim()) return 'Phone is required.'
  return null
}
