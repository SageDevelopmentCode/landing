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
import type { StudentSignatureMap, SignatureMap } from '@/app/types/enrollment-signatures'
import {
  ENROLLMENT_CHECKLIST_ITEMS,
  ENROLLMENT_CHECKLIST_TOTAL_COUNT,
  computeIsEnrollmentComplete,
  isChecklistItemComplete,
} from '@/app/lib/enrollment-checklist'
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

const CHECKLIST_ICONS: Record<
  number,
  { icon: React.ReactNode; iconBg: string; iconColor: string }
> = {
  1: { icon: <FileText className="w-4 h-4" />, iconBg: 'bg-blue-50', iconColor: 'text-blue-500' },
  2: { icon: <Users className="w-4 h-4" />, iconBg: 'bg-purple-50', iconColor: 'text-purple-500' },
  3: { icon: <Heart className="w-4 h-4" />, iconBg: 'bg-rose-50', iconColor: 'text-rose-500' },
  4: { icon: <Pill className="w-4 h-4" />, iconBg: 'bg-orange-50', iconColor: 'text-orange-500' },
  5: { icon: <ShieldCheck className="w-4 h-4" />, iconBg: 'bg-green-50', iconColor: 'text-green-600' },
  6: { icon: <Camera className="w-4 h-4" />, iconBg: 'bg-sky-50', iconColor: 'text-sky-500' },
  7: { icon: <AlertTriangle className="w-4 h-4" />, iconBg: 'bg-amber-50', iconColor: 'text-amber-500' },
  8: { icon: <UserPlus className="w-4 h-4" />, iconBg: 'bg-indigo-50', iconColor: 'text-indigo-500' },
  9: { icon: <CreditCard className="w-4 h-4" />, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
  10: { icon: <ClipboardList className="w-4 h-4" />, iconBg: 'bg-teal-50', iconColor: 'text-teal-500' },
}

const checklistItems = ENROLLMENT_CHECKLIST_ITEMS
const totalCount = ENROLLMENT_CHECKLIST_TOTAL_COUNT

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
  const completedCount = checklistItems.filter((item) =>
    isChecklistItemComplete(item, signatureMap, immunizationFileCount, registrationFeePaid)
  ).length

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
              <h3 className="text-base font-bold font-body text-emerald-800 mb-0.5">
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
          <h2 className="text-base font-semibold font-body text-gray-800 mb-0.5">
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
          const isComplete = isChecklistItemComplete(
            item,
            signatureMap,
            immunizationFileCount,
            registrationFeePaid
          )
          const iconMeta = CHECKLIST_ICONS[item.id]

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
                    : `${iconMeta.iconBg} ${iconMeta.iconColor}`
                }`}
              >
                {isComplete ? <CheckCircle className="w-4 h-4" /> : iconMeta.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-semibold font-body truncate ${isComplete ? 'text-emerald-800' : 'text-gray-800'}`}
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
                className={`px-4 py-1.5 rounded-xl text-sm font-semibold font-body transition-colors cursor-pointer flex items-center gap-1.5 ${
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
