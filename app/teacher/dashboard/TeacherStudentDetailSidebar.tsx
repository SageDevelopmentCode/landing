'use client'
import { useState, useEffect } from 'react'
import { DetailSidebar } from '@/app/admin/components/DetailSidebar'
import { SidebarField, SidebarSection } from '@/app/components/SidebarPrimitives'
import { getTeacherStudentDetail } from '@/app/actions/getTeacherStudentDetail'
import { type StudentRow } from './MyStudentsSection'

const PROGRAM_LABELS: Record<string, string> = {
  summer_26: 'Summer 2026',
  school_year_26_27: 'School Year 2026–2027',
  homeschool_drop_in: 'Homeschool Drop-In',
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
        <SkeletonBlock className="h-4 w-1/2" />
      </div>
      <div className="bg-white border border-gray-200 rounded-2xl px-5 py-4 shadow-sm space-y-3">
        <SkeletonBlock className="h-3 w-24" />
        <SkeletonBlock className="h-4 w-full" />
        <SkeletonBlock className="h-4 w-2/3" />
      </div>
    </div>
  )
}

export function TeacherStudentDetailSidebar({
  student,
  onClose,
}: {
  student: StudentRow | null
  onClose: () => void
}) {
  const [detail, setDetail] = useState<Awaited<ReturnType<typeof getTeacherStudentDetail>>>(null)
  const [loading, setLoading] = useState(!!student)

  useEffect(() => {
    if (!student) return
    let cancelled = false
    getTeacherStudentDetail(student.student_id).then((d) => {
      if (cancelled) return
      setDetail(d)
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [student?.student_id])

  const dob =
    detail?.dob_month && detail?.dob_day && detail?.dob_year
      ? `${detail.dob_month}/${detail.dob_day}/${detail.dob_year}`
      : null

  return (
    <DetailSidebar isOpen={!!student} onClose={onClose} title={student?.name ?? 'Student'}>
      {loading ? (
        <LoadingSkeleton />
      ) : (
        <div className="space-y-4">
          <SidebarSection title="Student Info">
            <SidebarField label="Full Name" value={detail?.child_legal_name} />
            <SidebarField label="Grade" value={detail?.child_grade} />
            <SidebarField label="Date of Birth" value={dob} />
            <SidebarField label="Program" value={PROGRAM_LABELS[student?.program ?? ''] ?? student?.program} />
            <SidebarField label="Classroom" value={student?.classroom} />
            <SidebarField label="Special Interests" value={detail?.special_interests} />
          </SidebarSection>
          <SidebarSection title="Learning Profile">
            <SidebarField label="Learning Style" value={detail?.learning_style} />
            <SidebarField label="Strengths & Interests" value={detail?.strengths_interests} />
            <SidebarField label="Current Challenges" value={detail?.current_challenges} />
            <SidebarField label="Dysregulation Response" value={detail?.dysregulation_response} />
            <SidebarField label="Regulation Strategies" value={detail?.regulation_strategies} />
            <SidebarField label="Activities to Avoid" value={detail?.activities_to_avoid} />
          </SidebarSection>
          <SidebarSection title="Health Notes">
            <SidebarField label="Has Medical Conditions" value={detail?.has_medical_conditions} />
            <SidebarField label="Medical Description" value={detail?.medical_conditions_description} />
            <SidebarField label="Has Allergies" value={detail?.has_allergies} />
            <SidebarField label="Allergies Description" value={detail?.allergies_description} />
            <SidebarField label="Emergency Medications" value={detail?.has_emergency_medications} />
            <SidebarField label="Emergency Medications Description" value={detail?.emergency_medications_description} />
            <SidebarField label="Needs Aide" value={detail?.needs_aide} />
            <SidebarField label="Aide Description" value={detail?.needs_aide_description} />
          </SidebarSection>
          <SidebarSection title="History">
            <SidebarField label="History Flags" value={detail?.history_flags} />
            <SidebarField label="History Explanation" value={detail?.history_explanation} />
          </SidebarSection>
        </div>
      )}
    </DetailSidebar>
  )
}
