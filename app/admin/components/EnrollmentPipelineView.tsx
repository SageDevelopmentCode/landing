'use client'

import { useState, useEffect } from 'react'
import { Merriweather } from 'next/font/google'
import { getAdminEnrollmentDataBulk } from '../../actions/getAdminEnrollmentDataBulk'
import type { AdminEnrollmentData } from '../../actions/getAdminEnrollmentData'
import {
  isContractComplete,
  CONTRACT_1_ID, CONTRACT_1_TOTAL_SECTIONS,
  CONTRACT_2_ID, CONTRACT_2_TOTAL_SECTIONS,
  CONTRACT_3_ID, CONTRACT_3_TOTAL_SECTIONS,
  CONTRACT_5_ID, CONTRACT_5_TOTAL_SECTIONS,
  CONTRACT_6_ID, CONTRACT_6_TOTAL_SECTIONS,
  CONTRACT_8_ID, CONTRACT_8_TOTAL_SECTIONS,
} from '@/app/types/enrollment-signatures'
import type { SignatureMap } from '@/app/types/enrollment-signatures'

const merriweather = Merriweather({
  weight: ['700'],
  subsets: ['latin'],
})

type PipelineApplication = {
  id: string
  user_id: string
  student_id: string | null
  child_legal_name: string | null
  preferred_name: string | null
  g1_full_name: string | null
  program: string | null
  status: string
  [key: string]: unknown
}

interface EnrollmentPipelineViewProps {
  applications: PipelineApplication[]
  setSelectedApp: (app: PipelineApplication) => void
}

// The 8 required items and how to compute their completion
const REQUIRED_ITEMS: Array<{
  id: number
  label: string
  contractId: number | null
  contractSections: number | null
}> = [
  { id: 1,  label: 'Program Contract',       contractId: CONTRACT_1_ID, contractSections: CONTRACT_1_TOTAL_SECTIONS },
  { id: 2,  label: 'Community Agreement',     contractId: CONTRACT_2_ID, contractSections: CONTRACT_2_TOTAL_SECTIONS },
  { id: 3,  label: 'Health & Emergency Form', contractId: CONTRACT_3_ID, contractSections: CONTRACT_3_TOTAL_SECTIONS },
  { id: 5,  label: 'Immunization Records',    contractId: null,          contractSections: null },
  { id: 10, label: 'Health Info Form',        contractId: CONTRACT_8_ID, contractSections: CONTRACT_8_TOTAL_SECTIONS },
  { id: 6,  label: 'Photo Release',           contractId: CONTRACT_5_ID, contractSections: CONTRACT_5_TOTAL_SECTIONS },
  { id: 7,  label: 'Liability Release',       contractId: CONTRACT_6_ID, contractSections: CONTRACT_6_TOTAL_SECTIONS },
  { id: 9,  label: 'Registration Fee',        contractId: null,          contractSections: null },
]

function computeRequiredCompletion(
  signatureMap: SignatureMap,
  immunizationFileCount: number,
  registrationFeePaid: boolean
): { completedCount: number; completionMap: Record<number, boolean> } {
  const completionMap: Record<number, boolean> = {}
  for (const item of REQUIRED_ITEMS) {
    if (item.id === 5) {
      completionMap[5] = immunizationFileCount > 0
    } else if (item.id === 9) {
      completionMap[9] = registrationFeePaid
    } else if (item.contractId != null && item.contractSections != null) {
      completionMap[item.id] = isContractComplete(signatureMap, item.contractId, item.contractSections)
    } else {
      completionMap[item.id] = false
    }
  }
  const completedCount = Object.values(completionMap).filter(Boolean).length
  return { completedCount, completionMap }
}

const PIPELINE_STAGES = [
  { label: 'Not Started', accent: '#9ca3af', test: (n: number) => n === 0 },
  { label: 'In Progress', accent: '#f59e0b', test: (n: number) => n >= 1 && n <= 6 },
  { label: 'Almost Done', accent: '#3b82f6', test: (n: number) => n === 7 },
]

const PROGRAM_BADGES: Record<string, { label: string; className: string }> = {
  summer_26:          { label: 'Summer 2026',    className: 'bg-amber-50 text-amber-700 border-amber-200' },
  school_year_26_27:  { label: 'School Year',    className: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  both:               { label: 'Both Programs',  className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  homeschool_drop_in: { label: 'Drop-In',        className: 'bg-teal-50 text-teal-700 border-teal-200' },
}

function PipelineCard({
  app,
  enrollmentData,
  onClick,
}: {
  app: PipelineApplication
  enrollmentData: AdminEnrollmentData | null
  onClick: () => void
}) {
  const studentId = app.student_id ?? ''
  const signatureMap = enrollmentData?.signaturesByStudent[studentId] ?? {}
  const immunizationCount = enrollmentData?.immunizationFileCountByStudent[studentId] ?? 0
  const registrationFeePaid = (app.registration_fee_paid as boolean | null) ?? false
  const isLoaded = enrollmentData !== null

  const { completedCount, completionMap } = isLoaded
    ? computeRequiredCompletion(signatureMap, immunizationCount, registrationFeePaid)
    : { completedCount: 0, completionMap: {} }

  const programBadge = app.program ? PROGRAM_BADGES[app.program] : null

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl border border-gray-100 p-4 cursor-pointer hover:shadow-md transition-shadow"
    >
      <div className={`text-sm font-bold text-gray-900 leading-snug ${merriweather.className}`}>
        {app.child_legal_name ?? '—'}
      </div>
      {app.preferred_name && (
        <div className="text-xs text-gray-400 italic mt-0.5">"{app.preferred_name}"</div>
      )}

      {(programBadge || (isLoaded && registrationFeePaid)) && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {programBadge && (
            <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border ${programBadge.className}`}>
              {programBadge.label}
            </span>
          )}
          {isLoaded && registrationFeePaid && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              Paid
            </span>
          )}
        </div>
      )}

      {/* Dots row */}
      <div className="flex items-center gap-1 mt-3">
        {isLoaded ? (
          REQUIRED_ITEMS.map((item) => (
            <div
              key={item.id}
              title={item.label}
              className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                completionMap[item.id] ? 'bg-emerald-400' : 'bg-gray-200'
              }`}
            />
          ))
        ) : (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="w-2.5 h-2.5 rounded-full flex-shrink-0 bg-gray-100 animate-pulse" />
          ))
        )}
        <span className="ml-1 text-xs text-gray-400 flex-shrink-0">
          {isLoaded ? `${completedCount} / 8` : '— / 8'}
        </span>
      </div>

      {app.g1_full_name && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-1.5">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-gray-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
          </svg>
          <span className="text-xs text-gray-600 truncate">{app.g1_full_name}</span>
        </div>
      )}
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 animate-pulse">
      <div className="h-3.5 bg-gray-200 rounded w-3/4 mb-2" />
      <div className="h-2.5 bg-gray-100 rounded w-1/2 mb-3" />
      <div className="flex gap-1 mt-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="w-2.5 h-2.5 rounded-full bg-gray-100" />
        ))}
      </div>
    </div>
  )
}

export function EnrollmentPipelineView({ applications, setSelectedApp }: EnrollmentPipelineViewProps) {
  const [enrollmentData, setEnrollmentData] = useState<AdminEnrollmentData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const enrollingApps = applications.filter((a) => a.status === 'enrolling' && a.student_id != null)

  useEffect(() => {
    if (enrollingApps.length === 0) {
      setIsLoading(false)
      return
    }

    const pairs = enrollingApps.map((app) => ({
      parentId: app.user_id,
      studentId: app.student_id!,
    }))

    getAdminEnrollmentDataBulk(pairs).then((data) => {
      setEnrollmentData(data)
      setIsLoading(false)
    }).catch(() => {
      setIsLoading(false)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enrollingApps.length])

  if (enrollingApps.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm text-center">
        <p className="text-gray-500">No applications currently enrolling</p>
      </div>
    )
  }

  const getCompletedCount = (app: PipelineApplication): number => {
    if (!enrollmentData || !app.student_id) return 0
    const signatureMap = enrollmentData.signaturesByStudent[app.student_id] ?? {}
    const immunizationCount = enrollmentData.immunizationFileCountByStudent[app.student_id] ?? 0
    const registrationFeePaid = (app.registration_fee_paid as boolean | null) ?? false
    return computeRequiredCompletion(signatureMap, immunizationCount, registrationFeePaid).completedCount
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {PIPELINE_STAGES.map((stage) => {
        const stageApps = isLoading
          ? enrollingApps
          : enrollingApps.filter((app) => stage.test(getCompletedCount(app)))

        return (
          <div
            key={stage.label}
            className="flex-shrink-0 w-72 flex flex-col gap-3 bg-gray-50 rounded-2xl p-3 border border-gray-200"
          >
            <div
              className="flex items-center justify-between pl-3 py-1.5 mb-1"
              style={{ borderLeft: `3px solid ${stage.accent}` }}
            >
              <span className="text-sm font-semibold text-gray-700">{stage.label}</span>
              <span className="text-xs text-gray-400 font-medium">
                {isLoading ? '—' : stageApps.length}
              </span>
            </div>

            {isLoading ? (
              stage.label === 'In Progress'
                ? enrollingApps.slice(0, 3).map((app) => <SkeletonCard key={app.id} />)
                : <div className="text-xs text-gray-300 italic px-1 animate-pulse">Loading…</div>
            ) : stageApps.length === 0 ? (
              <div className="text-xs text-gray-400 italic px-1">No applications</div>
            ) : (
              stageApps.map((app) => (
                <PipelineCard
                  key={app.id}
                  app={app}
                  enrollmentData={enrollmentData}
                  onClick={() => setSelectedApp(app)}
                />
              ))
            )}
          </div>
        )
      })}
    </div>
  )
}
