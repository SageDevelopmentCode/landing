'use client'

import { DetailSidebar } from './DetailSidebar'
import { SidebarField, SidebarSection } from '../../components/SidebarPrimitives'

const PROGRAM_LABELS: Record<string, string> = {
  summer_26: 'Summer 2026',
  school_year_26_27: 'School Year 2026-2027',
  both: 'Both',
}

function formatProgram(value: string | null): string {
  if (!value) return '—'
  return PROGRAM_LABELS[value] ?? value
}

type Parent = {
  id: string
  full_name: string | null
  g1_cell_phone: string | null
  g1_work_phone: string | null
  g1_preferred_contact: boolean | null
  g1_lives_with_child: boolean | null
  g1_has_custody: boolean | null
  g2_full_name: string | null
  g2_relationship: string | null
  g2_email: string | null
  g2_cell_phone: string | null
  g2_work_phone: string | null
  [key: string]: unknown
}

type ParentDetail = {
  children: {
    id: string
    child_legal_name: string | null
    dob_month: string | null
    dob_day: string | null
    dob_year: string | null
  }[]
  applications: {
    id: string
    child_legal_name: string | null
    program: string | null
    status: string
    approved: boolean
    approved_at: string | null
    updated_at: string | null
  }[]
}

interface ParentDetailSidebarProps {
  parent: Parent | null
  detail: ParentDetail | null
  loading: boolean
  onClose: () => void
}


function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`bg-gray-100 rounded animate-pulse ${className ?? 'h-4 w-full'}`} />
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-2xl px-5 py-4 shadow-sm space-y-3">
        <SkeletonBlock className="h-3 w-24" />
        <SkeletonBlock className="h-4 w-full" />
        <SkeletonBlock className="h-4 w-3/4" />
        <SkeletonBlock className="h-4 w-5/6" />
      </div>
      <div className="bg-white border border-gray-200 rounded-2xl px-5 py-4 shadow-sm space-y-3">
        <SkeletonBlock className="h-3 w-20" />
        <SkeletonBlock className="h-4 w-full" />
        <SkeletonBlock className="h-4 w-2/3" />
      </div>
      <div className="bg-white border border-gray-200 rounded-2xl px-5 py-4 shadow-sm space-y-3">
        <SkeletonBlock className="h-3 w-28" />
        <SkeletonBlock className="h-4 w-full" />
        <SkeletonBlock className="h-4 w-4/5" />
      </div>
    </div>
  )
}

export function ParentDetailSidebar({ parent, detail, loading, onClose }: ParentDetailSidebarProps) {
  return (
    <DetailSidebar
      isOpen={!!parent}
      onClose={onClose}
      title={parent?.full_name ?? 'Parent'}
    >
      {loading ? (
        <LoadingSkeleton />
      ) : (
        <div className="space-y-4">
          {/* Guardian 1 */}
          <SidebarSection title="Guardian 1">
            <SidebarField label="Cell Phone" value={parent?.g1_cell_phone} />
            <SidebarField label="Work Phone" value={parent?.g1_work_phone} />
            <SidebarField label="Preferred Contact" value={parent?.g1_preferred_contact} />
            <SidebarField label="Lives with Child" value={parent?.g1_lives_with_child} />
            <SidebarField label="Has Custody" value={parent?.g1_has_custody} />
          </SidebarSection>

          {/* Guardian 2 */}
          <SidebarSection title="Guardian 2">
            <SidebarField label="Full Name" value={parent?.g2_full_name} />
            <SidebarField label="Relationship" value={parent?.g2_relationship} />
            <SidebarField label="Email" value={parent?.g2_email} />
            <SidebarField label="Cell Phone" value={parent?.g2_cell_phone} />
            <SidebarField label="Work Phone" value={parent?.g2_work_phone} />
          </SidebarSection>

          {/* Children */}
          <div className="bg-white border border-gray-200 rounded-2xl px-5 py-4 shadow-sm">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 font-body border-b border-gray-100 pb-2 mb-3">
              Children
            </h3>
            {!detail || detail.children.length === 0 ? (
              <p className="text-sm text-gray-400 font-body italic">No children found</p>
            ) : (
              <div className="space-y-3">
                {detail.children.map((child) => (
                  <div key={child.id} className="bg-gray-50 rounded-lg px-3 py-2 space-y-1">
                    <p className="text-sm font-medium text-gray-800 font-body">
                      {child.child_legal_name ?? '—'}
                    </p>
                    <p className="text-xs text-gray-400 font-body">
                      DOB:{' '}
                      {child.dob_month && child.dob_day && child.dob_year
                        ? `${child.dob_month}/${child.dob_day}/${child.dob_year}`
                        : '—'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Applications */}
          <div className="bg-white border border-gray-200 rounded-2xl px-5 py-4 shadow-sm">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 font-body border-b border-gray-100 pb-2 mb-3">
              Applications
            </h3>
            {!detail || detail.applications.length === 0 ? (
              <p className="text-sm text-gray-400 font-body italic">No applications found</p>
            ) : (
              <div className="space-y-3">
                {detail.applications.map((app) => {
                  const dateLabel = app.approved
                    ? app.approved_at
                      ? `Approved on ${new Date(app.approved_at).toLocaleDateString()}`
                      : 'Approved'
                    : app.updated_at
                    ? `Last updated ${new Date(app.updated_at).toLocaleDateString()}`
                    : null

                  return (
                    <div key={app.id} className="bg-gray-50 rounded-lg px-3 py-2 space-y-2">
                      <p className="text-sm font-medium text-gray-800 font-body">
                        {app.child_legal_name ?? '—'}
                      </p>
                      <p className="text-xs text-gray-500 font-body">{formatProgram(app.program)}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                          {app.status}
                        </span>
                        {app.approved ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                            Approved
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500 border border-gray-200">
                            Pending
                          </span>
                        )}
                      </div>
                      {dateLabel && (
                        <p className="text-xs text-gray-400 font-body">{dateLabel}</p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </DetailSidebar>
  )
}
