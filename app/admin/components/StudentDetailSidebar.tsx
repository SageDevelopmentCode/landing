'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { DetailSidebar } from './DetailSidebar'
import { SidebarField, SidebarSection } from '../../components/SidebarPrimitives'
import { deleteStudent } from '../../actions/deleteStudent'

type Student = {
  id: string
  parent_id: string
  child_legal_name: string | null
  dob_month: string | null
  dob_day: string | null
  dob_year: string | null
  special_interests: string | null
  has_medical_conditions: string | null
  medical_conditions_description: string | null
  has_allergies: string | null
  allergies_description: string | null
  has_emergency_medications: string | null
  emergency_medications_description: string | null
  history_flags: string | null
  history_explanation: string | null
  needs_aide: string | null
  needs_aide_description: string | null
  learning_style: string | null
  strengths_interests: string | null
  current_challenges: string | null
  dysregulation_response: string | null
  regulation_strategies: string | null
  activities_to_avoid: string | null
  parent_name?: string | null
}

interface StudentDetailSidebarProps {
  student: Student | null
  loading: boolean
  onClose: () => void
  onStudentDeleted?: (studentId: string) => void
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

export function StudentDetailSidebar({ student, loading, onClose, onStudentDeleted }: StudentDetailSidebarProps) {
  const dob =
    student?.dob_month && student?.dob_day && student?.dob_year
      ? `${student.dob_month}/${student.dob_day}/${student.dob_year}`
      : null

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const handleDelete = async () => {
    if (!student || isDeleting) return
    setIsDeleting(true)
    setDeleteError(null)

    const result = await deleteStudent(student.id)

    setIsDeleting(false)

    if (result.success) {
      setShowDeleteConfirm(false)
      if (onStudentDeleted) onStudentDeleted(student.id)
      onClose()
    } else {
      setDeleteError(result.error ?? 'Failed to delete student')
    }
  }

  const footer = (
    <div className="flex items-center gap-3">
      <button
        onClick={() => setShowDeleteConfirm(true)}
        className="px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors hover:bg-red-50"
        style={{
          backgroundColor: 'transparent',
          border: '1px solid #FECACA',
          color: '#DC2626',
          borderRadius: '8px',
          cursor: 'pointer',
        }}
      >
        Delete Student
      </button>
    </div>
  )

  return (
    <>
      {showDeleteConfirm && createPortal(
        <div
          className="fixed inset-0 flex items-center justify-center"
          style={{ zIndex: 60, backgroundColor: 'rgba(0,0,0,0.4)' }}
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className="p-6 w-80"
            style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              border: '1px solid #E5E7EB',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-base font-semibold mb-2 text-gray-800">
              Delete this student?
            </h2>
            <p className="text-sm mb-5 text-gray-500">
              This student will be hidden from the admin panel. The record is preserved and can be recovered from the database if needed.
            </p>
            {deleteError && (
              <p className="text-sm mb-3 text-red-600">{deleteError}</p>
            )}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1.5 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                style={{
                  border: '1px solid #E5E7EB',
                  color: '#374151',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  borderRadius: '8px',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-3 py-1.5 text-sm font-semibold text-white rounded-lg transition-colors hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: '#DC2626',
                  border: 'none',
                  borderRadius: '8px',
                }}
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>,
      document.body
      )}
      <DetailSidebar
        isOpen={!!student}
        onClose={onClose}
        title={student?.child_legal_name ?? 'Student'}
        footer={footer}
      >
        {loading ? (
          <LoadingSkeleton />
        ) : (
          <div className="space-y-4">
            <SidebarSection title="Student Info">
              <SidebarField label="Full Name" value={student?.child_legal_name} />
              <SidebarField label="Date of Birth" value={dob} />
              <SidebarField label="Parent" value={student?.parent_name} />
              <SidebarField label="Special Interests" value={student?.special_interests} />
            </SidebarSection>

            <SidebarSection title="Medical">
              <SidebarField label="Has Medical Conditions" value={student?.has_medical_conditions} />
              <SidebarField label="Medical Description" value={student?.medical_conditions_description} />
              <SidebarField label="Has Allergies" value={student?.has_allergies} />
              <SidebarField label="Allergies Description" value={student?.allergies_description} />
              <SidebarField label="Has Emergency Medications" value={student?.has_emergency_medications} />
              <SidebarField label="Emergency Medications Description" value={student?.emergency_medications_description} />
            </SidebarSection>

            <SidebarSection title="Support Needs">
              <SidebarField label="Needs Aide" value={student?.needs_aide} />
              <SidebarField label="Aide Description" value={student?.needs_aide_description} />
              <SidebarField label="History Flags" value={student?.history_flags} />
              <SidebarField label="History Explanation" value={student?.history_explanation} />
            </SidebarSection>

            <SidebarSection title="Learning Profile">
              <SidebarField label="Learning Style" value={student?.learning_style} />
              <SidebarField label="Strengths & Interests" value={student?.strengths_interests} />
              <SidebarField label="Current Challenges" value={student?.current_challenges} />
              <SidebarField label="Dysregulation Response" value={student?.dysregulation_response} />
              <SidebarField label="Regulation Strategies" value={student?.regulation_strategies} />
              <SidebarField label="Activities to Avoid" value={student?.activities_to_avoid} />
            </SidebarSection>
          </div>
        )}
      </DetailSidebar>
    </>
  )
}
