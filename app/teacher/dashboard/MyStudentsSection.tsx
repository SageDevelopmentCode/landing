'use client'

import { useState } from 'react'
import Image from 'next/image'
import { TeacherStudentDetailSidebar } from './TeacherStudentDetailSidebar'

function StudentAvatar({ name, imageUrl }: { name: string | null; imageUrl: string | null }) {
  const initials = name
    ? name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('')
    : '?'

  if (imageUrl) {
    return (
      <div className="relative w-9 h-9 rounded-full overflow-hidden shrink-0 border border-gray-100">
        <Image src={imageUrl} alt={name ?? ''} fill className="object-cover" />
      </div>
    )
  }

  return (
    <div className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center bg-[#d4e6d0] text-[#4a7c59] text-xs font-semibold font-body select-none">
      {initials}
    </div>
  )
}

export type StudentRow = {
  id: string
  student_id: string
  name: string | null
  grade: string | null
  program: string
  classroom: string | null
  profile_image_url: string | null
  attendance_status: 'checked_in' | 'checked_out' | 'absent'
}

const PROGRAM_LABELS: Record<string, string> = {
  summer_26: 'Summer 2026',
  school_year_26_27: 'School Year 2026–2027',
  homeschool_drop_in: 'Homeschool Drop-In',
}

const PROGRAM_ORDER = ['summer_26', 'school_year_26_27', 'homeschool_drop_in']

export default function MyStudentsSection({ students }: { students: StudentRow[] }) {
  const programs = PROGRAM_ORDER.filter((p) => students.some((s) => s.program === p))

  const [activeProgram, setActiveProgram] = useState<string>(programs[0] ?? '')
  const [selectedStudent, setSelectedStudent] = useState<StudentRow | null>(null)

  if (programs.length === 0) {
    return (
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-2">My Students</h2>
        <p className="text-sm text-gray-400">No students assigned yet.</p>
      </section>
    )
  }

  const filtered = students.filter((s) => s.program === activeProgram)

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold text-gray-700">My Students</h2>

        {/* Program tabs */}
        <div className="flex gap-2 flex-wrap justify-end">
          {programs.map((p) => (
            <button
              key={p}
              onClick={() => setActiveProgram(p)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeProgram === p
                  ? 'bg-sage-700 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {PROGRAM_LABELS[p] ?? p}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-gray-400">No students for this program.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((s) => (
            <div
              key={s.id}
              onClick={() => setSelectedStudent(s)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 hover:bg-gray-100 hover:border-gray-200 cursor-pointer transition-all"
            >
              <StudentAvatar name={s.name} imageUrl={s.profile_image_url} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800">{s.name ?? '—'}</p>
                <p className="text-xs text-gray-400 mt-0.5">Grade: {s.grade ?? '—'}</p>
              </div>
              {s.classroom && (
                <span className="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full shrink-0">
                  {s.classroom}
                </span>
              )}
              {s.attendance_status === 'checked_in' && (
                <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-[#4a7c59]/10 text-[#4a7c59] shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4a7c59] animate-pulse" />
                  Checked In
                </span>
              )}
              {s.attendance_status === 'checked_out' && (
                <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-400 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                  Checked Out
                </span>
              )}
              {s.attendance_status === 'absent' && (
                <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-500 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  Not Checked In
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      <TeacherStudentDetailSidebar
        student={selectedStudent}
        onClose={() => setSelectedStudent(null)}
      />
    </section>
  )
}
