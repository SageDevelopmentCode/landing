'use client'

import { useState } from 'react'
import { TeacherStudentDetailSidebar } from './TeacherStudentDetailSidebar'

export type StudentRow = {
  id: string
  student_id: string
  name: string | null
  grade: string | null
  program: string
  classroom: string | null
}

const PROGRAM_LABELS: Record<string, string> = {
  summer_26: 'Summer 2026',
  school_year_26_27: 'School Year 2026–2027',
}

const PROGRAM_ORDER = ['summer_26', 'school_year_26_27']

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
              className="flex items-center justify-between px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 hover:bg-gray-100 hover:border-gray-200 cursor-pointer transition-all"
            >
              <div>
                <p className="text-sm font-medium text-gray-800">{s.name ?? '—'}</p>
                <p className="text-xs text-gray-400 mt-0.5">Grade: {s.grade ?? '—'}</p>
              </div>
              {s.classroom && (
                <span className="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">
                  {s.classroom}
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
