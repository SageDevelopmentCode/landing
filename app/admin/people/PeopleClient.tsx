'use client'

import { useState } from 'react'
import { ParentsClient } from '../parents/ParentsClient'
import { StudentsClient } from '../students/StudentsClient'
import type { TeacherAssignment } from '../../actions/teacherAssignments'

type Parent = {
  id: string
  email: string | null
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
  child_grade: string | null
  parent_name?: string | null
  profile_image_url?: string | null
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
    drop_in_program: string | null
    status: string
    approved: boolean
    approved_at: string | null
    updated_at: string | null
  }[]
}

interface PeopleClientProps {
  parents: Parent[]
  students: Student[]
  fetchParentDetail: (parentId: string) => Promise<ParentDetail>
  fetchStudentDetail: (studentId: string) => Promise<Student>
  assignmentsByStudentId: Record<string, TeacherAssignment[]>
  tagsByStudentId: Record<string, string[]>
}

type Tab = 'parents' | 'students'

export function PeopleClient({
  parents,
  students,
  fetchParentDetail,
  fetchStudentDetail,
  assignmentsByStudentId,
  tagsByStudentId,
}: PeopleClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>('parents')

  return (
    <div>
      <div className="flex items-center gap-1 p-1 rounded-xl w-fit mb-6" style={{ backgroundColor: '#F5F0E8', border: '1px solid #E8E0D0' }}>
        {(['parents', 'students'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="text-xs font-semibold rounded-lg transition-all duration-150"
            style={{
              padding: '5px 14px',
              backgroundColor: activeTab === tab ? '#fff' : 'transparent',
              color: activeTab === tab ? '#3D5A42' : '#9B8E80',
              border: activeTab === tab ? '1px solid #E8E0D0' : '1px solid transparent',
              boxShadow: activeTab === tab ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'parents' ? (
        <ParentsClient parents={parents} fetchParentDetail={fetchParentDetail} />
      ) : (
        <StudentsClient
          students={students}
          fetchStudentDetail={fetchStudentDetail}
          assignmentsByStudentId={assignmentsByStudentId}
          tagsByStudentId={tagsByStudentId}
        />
      )}
    </div>
  )
}
