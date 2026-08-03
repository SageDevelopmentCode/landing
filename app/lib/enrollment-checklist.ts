import {
  CONTRACT_1_ID,
  CONTRACT_1_TOTAL_SECTIONS,
  CONTRACT_2_ID,
  CONTRACT_2_TOTAL_SECTIONS,
  CONTRACT_3_ID,
  CONTRACT_3_TOTAL_SECTIONS,
  CONTRACT_4_ID,
  CONTRACT_4_TOTAL_SECTIONS,
  CONTRACT_5_ID,
  CONTRACT_5_TOTAL_SECTIONS,
  CONTRACT_6_ID,
  CONTRACT_6_TOTAL_SECTIONS,
  CONTRACT_7_ID,
  CONTRACT_7_TOTAL_SECTIONS,
  CONTRACT_8_ID,
  CONTRACT_8_TOTAL_SECTIONS,
  isContractComplete,
} from '@/app/types/enrollment-signatures'
import type { SignatureMap } from '@/app/types/enrollment-signatures'

export type EnrollmentChecklistItemMeta = {
  id: number
  title: string
  subtitle: string
  required: boolean
  isContract: boolean
  contractId?: number
  contractSections?: number
}

export const ENROLLMENT_CHECKLIST_ITEMS: EnrollmentChecklistItemMeta[] = [
  {
    id: 1,
    title: 'Program Description, Parent Responsibilities, and Key Policies',
    subtitle: 'Review and sign the program contract',
    required: true,
    isContract: true,
    contractId: CONTRACT_1_ID,
    contractSections: CONTRACT_1_TOTAL_SECTIONS,
  },
  {
    id: 2,
    title: 'Community Agreement for Families and Staff',
    subtitle: 'Review and sign the community agreement',
    required: true,
    isContract: true,
    contractId: CONTRACT_2_ID,
    contractSections: CONTRACT_2_TOTAL_SECTIONS,
  },
  {
    id: 3,
    title: 'Emergency Contact, Health, and Immunization Form',
    subtitle: 'Complete and sign the health and emergency form',
    required: true,
    isContract: true,
    contractId: CONTRACT_3_ID,
    contractSections: CONTRACT_3_TOTAL_SECTIONS,
  },
  {
    id: 4,
    title: 'Emergency Medication Plan on File',
    subtitle: 'Submit if your child requires emergency medication',
    required: false,
    isContract: true,
    contractId: CONTRACT_4_ID,
    contractSections: CONTRACT_4_TOTAL_SECTIONS,
  },
  {
    id: 5,
    title: 'Submit Proof of Immunizations',
    subtitle: 'Upload current immunization records',
    required: true,
    isContract: false,
  },
  {
    id: 10,
    title: 'Health Information Form',
    subtitle: 'Complete and sign the health information statement',
    required: true,
    isContract: true,
    contractId: CONTRACT_8_ID,
    contractSections: CONTRACT_8_TOTAL_SECTIONS,
  },
  {
    id: 6,
    title: 'Photo Release Form',
    subtitle: 'Review and sign the photo and media release',
    required: true,
    isContract: true,
    contractId: CONTRACT_5_ID,
    contractSections: CONTRACT_5_TOTAL_SECTIONS,
  },
  {
    id: 7,
    title: 'Assumption of Risk and Liability Release',
    subtitle: 'Review and sign the liability release',
    required: true,
    isContract: true,
    contractId: CONTRACT_6_ID,
    contractSections: CONTRACT_6_TOTAL_SECTIONS,
  },
  {
    id: 8,
    title: 'Additional Authorized Pickup Person',
    subtitle: 'Add authorized pickup contacts and sign',
    required: false,
    isContract: true,
    contractId: CONTRACT_7_ID,
    contractSections: CONTRACT_7_TOTAL_SECTIONS,
  },
  {
    id: 9,
    title: 'Pay Registration Fee',
    subtitle: 'Submit the registration fee to complete enrollment',
    required: true,
    isContract: false,
  },
]

export const ENROLLMENT_CHECKLIST_TOTAL_COUNT = ENROLLMENT_CHECKLIST_ITEMS.length

export const ENROLLMENT_ITEM_TITLES: Record<number, string> = Object.fromEntries(
  ENROLLMENT_CHECKLIST_ITEMS.map((item) => [item.id, item.title])
)

export function isChecklistItemComplete(
  item: EnrollmentChecklistItemMeta,
  signatureMap: SignatureMap,
  immunizationFileCount: number,
  registrationFeePaid: boolean
): boolean {
  if (item.id === 5) return immunizationFileCount > 0
  if (item.id === 9) return registrationFeePaid
  if (item.contractId && item.contractSections) {
    return isContractComplete(signatureMap, item.contractId, item.contractSections)
  }
  return false
}

export function computeIsEnrollmentComplete(
  signatureMap: SignatureMap,
  immunizationFileCount: number,
  registrationFeePaid: boolean
): boolean {
  const requiredItems = ENROLLMENT_CHECKLIST_ITEMS.filter((i) => i.required)
  return requiredItems.every((item) =>
    isChecklistItemComplete(item, signatureMap, immunizationFileCount, registrationFeePaid)
  )
}

export function getChecklistCompletionStatus(
  signatureMap: SignatureMap,
  immunizationFileCount: number,
  registrationFeePaid: boolean
) {
  const items = ENROLLMENT_CHECKLIST_ITEMS.map((item) => ({
    ...item,
    complete: isChecklistItemComplete(
      item,
      signatureMap,
      immunizationFileCount,
      registrationFeePaid
    ),
  }))
  const completedCount = items.filter((i) => i.complete).length
  return {
    items,
    completedCount,
    totalCount: ENROLLMENT_CHECKLIST_TOTAL_COUNT,
    isEnrollmentComplete: computeIsEnrollmentComplete(
      signatureMap,
      immunizationFileCount,
      registrationFeePaid
    ),
  }
}
