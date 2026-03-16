'use client'

import {
  FileText,
  Users,
  Heart,
  Pill,
  ShieldCheck,
  Camera,
  AlertTriangle,
  UserPlus,
  CreditCard,
  CheckCircle,
  Upload,
  PenLine,
  ClipboardList,
} from 'lucide-react'
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
import type { StudentSignatureMap, SignatureMap } from '@/app/types/enrollment-signatures'
import { useState } from 'react'

export type ApprovedApplication = {
  id: string
  user_id: string
  student_id: string
  child_legal_name: string | null
  preferred_name: string | null
  registration_fee_paid: boolean | null
}

export interface EnrollmentProgressCardProps {
  apps: ApprovedApplication[]
  signaturesByStudent: StudentSignatureMap
  immunizationFileCountByStudent: Record<string, number>
  registrationFeePaidByStudent: Record<string, boolean>
  initialActiveStudentId?: string
  onItemClick?: (itemId: number, studentId: string) => void
}

interface ChecklistItem {
  id: number
  title: string
  subtitle: string
  icon: React.ReactNode
  iconBg: string
  iconColor: string
  required: boolean
  isContract: boolean
  contractId?: number
  contractSections?: number
}

const checklistItems: ChecklistItem[] = [
  {
    id: 1,
    title: 'Program Description, Parent Responsibilities, and Key Policies',
    subtitle: 'Review and sign the program contract',
    icon: <FileText className="w-4 h-4" />,
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-500',
    required: true,
    isContract: true,
    contractId: CONTRACT_1_ID,
    contractSections: CONTRACT_1_TOTAL_SECTIONS,
  },
  {
    id: 2,
    title: 'Community Agreement for Families and Staff',
    subtitle: 'Review and sign the community agreement',
    icon: <Users className="w-4 h-4" />,
    iconBg: 'bg-purple-50',
    iconColor: 'text-purple-500',
    required: true,
    isContract: true,
    contractId: CONTRACT_2_ID,
    contractSections: CONTRACT_2_TOTAL_SECTIONS,
  },
  {
    id: 3,
    title: 'Emergency Contact, Health, and Immunization Form',
    subtitle: 'Complete and sign the health and emergency form',
    icon: <Heart className="w-4 h-4" />,
    iconBg: 'bg-rose-50',
    iconColor: 'text-rose-500',
    required: true,
    isContract: true,
    contractId: CONTRACT_3_ID,
    contractSections: CONTRACT_3_TOTAL_SECTIONS,
  },
  {
    id: 4,
    title: 'Emergency Medication Plan on File',
    subtitle: 'Submit if your child requires emergency medication',
    icon: <Pill className="w-4 h-4" />,
    iconBg: 'bg-orange-50',
    iconColor: 'text-orange-500',
    required: false,
    isContract: true,
    contractId: CONTRACT_4_ID,
    contractSections: CONTRACT_4_TOTAL_SECTIONS,
  },
  {
    id: 5,
    title: 'Submit Proof of Immunizations',
    subtitle: 'Upload current immunization records',
    icon: <ShieldCheck className="w-4 h-4" />,
    iconBg: 'bg-green-50',
    iconColor: 'text-green-600',
    required: true,
    isContract: false,
  },
  {
    id: 10,
    title: 'Health Information Form',
    subtitle: 'Complete and sign the health information statement',
    icon: <ClipboardList className="w-4 h-4" />,
    iconBg: 'bg-teal-50',
    iconColor: 'text-teal-500',
    required: true,
    isContract: true,
    contractId: CONTRACT_8_ID,
    contractSections: CONTRACT_8_TOTAL_SECTIONS,
  },
  {
    id: 6,
    title: 'Photo Release Form',
    subtitle: 'Review and sign the photo and media release',
    icon: <Camera className="w-4 h-4" />,
    iconBg: 'bg-sky-50',
    iconColor: 'text-sky-500',
    required: true,
    isContract: true,
    contractId: CONTRACT_5_ID,
    contractSections: CONTRACT_5_TOTAL_SECTIONS,
  },
  {
    id: 7,
    title: 'Assumption of Risk and Liability Release',
    subtitle: 'Review and sign the liability release',
    icon: <AlertTriangle className="w-4 h-4" />,
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-500',
    required: true,
    isContract: true,
    contractId: CONTRACT_6_ID,
    contractSections: CONTRACT_6_TOTAL_SECTIONS,
  },
  {
    id: 8,
    title: 'Additional Authorized Pickup Person',
    subtitle: 'Add authorized pickup contacts and sign',
    icon: <UserPlus className="w-4 h-4" />,
    iconBg: 'bg-indigo-50',
    iconColor: 'text-indigo-500',
    required: false,
    isContract: true,
    contractId: CONTRACT_7_ID,
    contractSections: CONTRACT_7_TOTAL_SECTIONS,
  },
  {
    id: 9,
    title: 'Pay Registration Fee',
    subtitle: 'Submit the registration fee to complete enrollment',
    icon: <CreditCard className="w-4 h-4" />,
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    required: true,
    isContract: false,
  },
]

const totalCount = checklistItems.length

function computeIsEnrollmentComplete(
  signatureMap: SignatureMap,
  immunizationFileCount: number,
  registrationFeePaid: boolean
): boolean {
  const requiredItems = checklistItems.filter((i) => i.required)
  return requiredItems.every((item) => {
    if (item.id === 5) return immunizationFileCount > 0
    if (item.id === 9) return registrationFeePaid
    if (item.contractId && item.contractSections)
      return isContractComplete(signatureMap, item.contractId, item.contractSections)
    return false
  })
}

function StudentChecklist({
  signatureMap,
  immunizationFileCount,
  registrationFeePaid,
  studentId,
  onItemClick,
}: {
  signatureMap: SignatureMap
  immunizationFileCount: number
  registrationFeePaid: boolean
  studentId: string
  onItemClick?: (itemId: number, studentId: string) => void
}) {
  const completedCount = checklistItems.filter((item) => {
    if (item.id === 5) return immunizationFileCount > 0
    if (item.id === 9) return registrationFeePaid
    if (item.contractId && item.contractSections) {
      return isContractComplete(signatureMap, item.contractId, item.contractSections)
    }
    return false
  }).length

  const isEnrollmentComplete = computeIsEnrollmentComplete(
    signatureMap,
    immunizationFileCount,
    registrationFeePaid
  )

  const progressPercent = Math.round((completedCount / totalCount) * 100)

  return (
    <div>
      {isEnrollmentComplete && (
        <div className="mb-5 bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-5 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="text-2xl leading-none mt-0.5">🎉</span>
            <div>
              <h3 className="text-base font-bold font-heading text-emerald-800 mb-0.5">
                Enrollment Confirmed!
              </h3>
              <p className="text-sm font-body text-emerald-700/90">
                All required enrollment steps have been completed.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mb-5 bg-white border border-gray-200 rounded-2xl px-5 py-4 shadow-sm">
        <div className="mb-3">
          <h2 className="text-base font-semibold font-heading text-gray-800 mb-0.5">
            Enrollment Checklist
          </h2>
          <p className="text-xs text-gray-400 font-body mt-0.5">
            {completedCount} of {totalCount} steps completed
          </p>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div
            className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-gray-400 font-body">
          {isEnrollmentComplete
            ? 'All steps complete — enrollment is finalized!'
            : `${totalCount - completedCount} step${totalCount - completedCount !== 1 ? 's' : ''} remaining`}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {checklistItems.map((item) => {
          const isImmunization = item.id === 5
          const isRegistrationFee = item.id === 9
          const isComplete = isImmunization
            ? immunizationFileCount > 0
            : isRegistrationFee
              ? registrationFeePaid
              : item.contractId && item.contractSections
                ? isContractComplete(signatureMap, item.contractId, item.contractSections)
                : false

          const signedCount =
            item.contractId && item.contractSections
              ? Object.keys(signatureMap).filter((k) =>
                  k.startsWith(`${item.contractId}-`)
                ).length
              : 0

          const isInProgress =
            item.isContract && item.contractId != null && signedCount > 0 && !isComplete

          const clickable = !!onItemClick
          return (
            <div
              key={item.id}
              onClick={clickable ? () => onItemClick(item.id, studentId) : undefined}
              role={clickable ? 'button' : undefined}
              tabIndex={clickable ? 0 : undefined}
              onKeyDown={clickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') onItemClick(item.id, studentId) } : undefined}
              className={`rounded-2xl px-5 py-4 shadow-sm flex items-center gap-4 border transition-colors ${
                isComplete
                  ? `bg-emerald-50 border-emerald-200${clickable ? ' hover:bg-emerald-100 cursor-pointer' : ''}`
                  : `bg-white border-gray-200${clickable ? ' hover:bg-gray-50 cursor-pointer' : ''}`
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  isComplete
                    ? 'bg-emerald-100 text-emerald-600'
                    : `${item.iconBg} ${item.iconColor}`
                }`}
              >
                {isComplete ? <CheckCircle className="w-4 h-4" /> : item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-semibold font-heading truncate ${isComplete ? 'text-emerald-800' : 'text-gray-800'}`}
                >
                  {item.title}
                </p>
                <p
                  className={`text-xs font-body truncate ${isComplete ? 'text-emerald-600/70' : 'text-gray-400'}`}
                >
                  {item.subtitle}
                </p>
              </div>
              <div className="flex-shrink-0 flex items-center gap-2">
                {isRegistrationFee ? (
                  isComplete ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border bg-emerald-100 text-emerald-700 border-emerald-300">
                      <CheckCircle className="w-3 h-3" />
                      Paid
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border bg-gray-100 text-gray-500 border-gray-200">
                      <CreditCard className="w-3 h-3" />
                      Unpaid
                    </span>
                  )
                ) : isImmunization ? (
                  isComplete ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border bg-emerald-100 text-emerald-700 border-emerald-300">
                      <CheckCircle className="w-3 h-3" />
                      Uploaded
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border bg-gray-100 text-gray-500 border-gray-200">
                      <Upload className="w-3 h-3" />
                      Not uploaded
                    </span>
                  )
                ) : item.isContract ? (
                  isComplete ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border bg-emerald-100 text-emerald-700 border-emerald-300">
                      <CheckCircle className="w-3 h-3" />
                      Complete
                    </span>
                  ) : isInProgress ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border bg-blue-50 text-blue-700 border-blue-200">
                      <PenLine className="w-3 h-3" />
                      {signedCount} / {item.contractSections} signed
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border bg-gray-100 text-gray-500 border-gray-200">
                      <PenLine className="w-3 h-3" />
                      Not started
                    </span>
                  )
                ) : null}
                {!item.required && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border bg-gray-100 text-gray-500 border-gray-200">
                    Optional
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function EnrollmentProgressCard({
  apps,
  signaturesByStudent,
  immunizationFileCountByStudent,
  registrationFeePaidByStudent,
  initialActiveStudentId,
  onItemClick,
}: EnrollmentProgressCardProps) {
  const initialIndex = initialActiveStudentId
    ? Math.max(apps.findIndex((a) => a.student_id === initialActiveStudentId), 0)
    : 0
  const [activeIndex, setActiveIndex] = useState(initialIndex)

  if (apps.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl px-5 py-5 shadow-sm">
        <p className="text-xs text-gray-400 font-body">No enrolled students found.</p>
      </div>
    )
  }

  const activeApp = apps[activeIndex] ?? apps[0]
  const activeStudentId = activeApp.student_id

  const signatureMap = signaturesByStudent[activeStudentId] ?? {}
  const immunizationFileCount = immunizationFileCountByStudent[activeStudentId] ?? 0
  const registrationFeePaid = registrationFeePaidByStudent[activeStudentId] ?? false

  return (
    <div>
      {apps.length > 1 && (
        <div className="flex gap-2 mb-6 flex-wrap">
          {apps.map((app, index) => {
            const label = app.preferred_name ?? app.child_legal_name ?? 'Student'
            const isActive = index === activeIndex
            const sid = app.student_id
            const isComplete = computeIsEnrollmentComplete(
              signaturesByStudent[sid] ?? {},
              immunizationFileCountByStudent[sid] ?? 0,
              registrationFeePaidByStudent[sid] ?? false
            )
            return (
              <button
                key={app.id}
                onClick={() => setActiveIndex(index)}
                className={`px-4 py-1.5 rounded-xl text-sm font-semibold font-heading transition-colors cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? isComplete
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-800 text-white'
                    : isComplete
                      ? 'bg-emerald-50 border border-emerald-300 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-400'
                      : 'bg-white border border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {isComplete && <CheckCircle className="w-3.5 h-3.5" />}
                {label}
              </button>
            )
          })}
        </div>
      )}

      <StudentChecklist
        signatureMap={signatureMap}
        immunizationFileCount={immunizationFileCount}
        registrationFeePaid={registrationFeePaid}
        studentId={activeStudentId}
        onItemClick={onItemClick}
      />
    </div>
  )
}
