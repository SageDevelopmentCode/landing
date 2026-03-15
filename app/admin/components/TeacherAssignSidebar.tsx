'use client'
import { useState, useEffect } from 'react'
import { DetailSidebar } from './DetailSidebar'
import { SidebarSection } from '../../components/SidebarPrimitives'
import {
  getStudentAssignments,
  getTeachersForAssignment,
  assignTeacher,
  removeAssignment,
  type TeacherAssignment,
} from '../../actions/teacherAssignments'

type TeacherOption = { id: string; full_name: string | null; role: string | null }

const PROGRAM_LABELS: Record<string, string> = {
  summer_26: 'Summer 2026',
  school_year_26_27: 'School Year 2026–2027',
}
const CLASSROOM_LABELS: Record<string, string> = {
  prek_1st: 'Pre-K – 1st',
  '2nd_4th': '2nd – 4th',
}

const colors = {
  error: '#DC2626',
  mistyForest: '#4B6A4F',
  textTertiary: '#9CA3AF',
}

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`bg-gray-100 rounded animate-pulse ${className ?? 'h-4 w-full'}`} />
}

function getInitials(name: string | null): string {
  if (!name) return '?'
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('')
}

interface TeacherAssignSidebarProps {
  student: { id: string; child_legal_name: string | null } | null
  onClose: () => void
  onAssigned?: () => void
}

export function TeacherAssignSidebar({ student, onClose, onAssigned }: TeacherAssignSidebarProps) {
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([])
  const [assignmentsLoading, setAssignmentsLoading] = useState(false)
  const [showAssignForm, setShowAssignForm] = useState(false)
  const [teachers, setTeachers] = useState<TeacherOption[]>([])
  const [teachersLoading, setTeachersLoading] = useState(false)
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<Set<string>>(new Set())
  const [selectedProgram, setSelectedProgram] = useState<string>('')
  const [selectedClassroom, setSelectedClassroom] = useState<string>('')
  const [assignSaving, setAssignSaving] = useState(false)
  const [assignError, setAssignError] = useState<string | null>(null)
  const [editingAssignment, setEditingAssignment] = useState<TeacherAssignment | null>(null)

  useEffect(() => {
    if (!student?.id) {
      setAssignments([])
      setShowAssignForm(false)
      return
    }
    setAssignmentsLoading(true)
    getStudentAssignments(student.id).then(data => {
      setAssignments(data)
      setAssignmentsLoading(false)
      if (data.length === 0) {
        setShowAssignForm(true)
        setSelectedTeacherIds(new Set())
        setSelectedProgram('')
        setSelectedClassroom('')
        setAssignError(null)
        setTeachersLoading(true)
        getTeachersForAssignment().then(t => { setTeachers(t); setTeachersLoading(false) })
      }
    })
  }, [student?.id])

  const handleShowAssignForm = async (editTarget?: TeacherAssignment) => {
    setShowAssignForm(true)
    setAssignError(null)
    if (editTarget) {
      setEditingAssignment(editTarget)
      setSelectedTeacherIds(new Set([editTarget.teacher_id]))
      setSelectedProgram(editTarget.program)
      setSelectedClassroom(editTarget.classroom ?? '')
    } else {
      setEditingAssignment(null)
      setSelectedTeacherIds(new Set())
      setSelectedProgram('')
      setSelectedClassroom('')
    }
    setTeachersLoading(true)
    const list = await getTeachersForAssignment()
    setTeachers(list)
    setTeachersLoading(false)
  }

  const handleSaveAssignment = async () => {
    if (!student || selectedTeacherIds.size === 0 || !selectedProgram || !selectedClassroom) return
    setAssignSaving(true)
    setAssignError(null)
    if (editingAssignment) {
      await removeAssignment(editingAssignment.id)
      setEditingAssignment(null)
    }
    for (const teacherId of selectedTeacherIds) {
      const result = await assignTeacher({
        teacherId,
        studentId: student.id,
        program: selectedProgram,
        classroom: selectedClassroom || null,
      })
      if (result.error) { setAssignError(result.error); setAssignSaving(false); return }
    }
    setAssignSaving(false)
    setShowAssignForm(false)
    const updated = await getStudentAssignments(student.id)
    setAssignments(updated)
    onAssigned?.()
  }

  const handleRemoveAssignment = async (assignmentId: string) => {
    await removeAssignment(assignmentId)
    setAssignments(prev => prev.filter(a => a.id !== assignmentId))
    onAssigned?.()
  }

  const title = student?.child_legal_name
    ? `Assign Teachers — ${student.child_legal_name}`
    : 'Assign Teachers'

  return (
    <DetailSidebar
      isOpen={!!student}
      onClose={onClose}
      title={title}
    >
      <div className="space-y-4">
        <SidebarSection title="Teacher Assignments">
          {assignmentsLoading ? <SkeletonBlock className="h-4 w-full" /> : (
            assignments.length === 0
              ? <p style={{ color: colors.textTertiary, fontSize: 13 }}>No teachers assigned</p>
              : assignments.map(a => (
                  <div key={a.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: '#F9FAFB', border: '1px solid #E5E7EB',
                    borderRadius: 10, padding: '10px 12px', marginBottom: 8,
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: colors.mistyForest, color: 'white',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, fontWeight: 700, flexShrink: 0,
                    }}>
                      {getInitials(a.teacher_name)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {a.teacher_name ?? '—'}
                      </div>
                      <div style={{ fontSize: 11, color: colors.textTertiary, marginTop: 1 }}>
                        {PROGRAM_LABELS[a.program] ?? a.program} · {CLASSROOM_LABELS[a.classroom ?? ''] ?? a.classroom ?? '—'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button
                        onClick={() => handleShowAssignForm(a)}
                        style={{ fontSize: 12, color: colors.mistyForest, background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px' }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleRemoveAssignment(a.id)}
                        style={{ fontSize: 12, color: colors.error, background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px' }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))
          )}
          {!showAssignForm && (
            <button
              onClick={handleShowAssignForm}
              style={{ marginTop: 8, fontSize: 13, color: colors.mistyForest, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              + Assign Teacher
            </button>
          )}
          {showAssignForm && (
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 20 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#111827' }}>
                {editingAssignment ? 'Edit Assignment' : 'Assign Teacher'}
              </p>
              {teachersLoading ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[0, 1, 2, 3].map(i => (
                    <div key={i} style={{ padding: 12, borderRadius: 12, border: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div className="bg-gray-100 rounded-full animate-pulse" style={{ width: 48, height: 48 }} />
                      <div className="bg-gray-100 rounded animate-pulse" style={{ height: 12, width: '70%' }} />
                      <div className="bg-gray-100 rounded animate-pulse" style={{ height: 10, width: '40%' }} />
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {teachers.map(t => {
                    const selected = selectedTeacherIds.has(t.id)
                    const initials = getInitials(t.full_name)
                    return (
                      <button
                        key={t.id}
                        onClick={() => setSelectedTeacherIds(prev => {
                          const next = new Set(prev)
                          if (next.has(t.id)) next.delete(t.id); else next.add(t.id)
                          return next
                        })}
                        style={{
                          padding: 12,
                          borderRadius: 12,
                          border: selected ? '2px solid #4B6A4F' : '1px solid #E5E7EB',
                          backgroundColor: selected ? '#EEF3EE' : 'white',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'flex-start',
                          gap: 8,
                          textAlign: 'left',
                          position: 'relative',
                        }}
                      >
                        <div style={{ position: 'relative', width: 48, height: 48 }}>
                          <div style={{
                            width: 48,
                            height: 48,
                            borderRadius: '50%',
                            backgroundColor: '#D1D9D2',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: 16,
                            fontWeight: 600,
                          }}>
                            {initials}
                          </div>
                          {selected && (
                            <div style={{
                              position: 'absolute',
                              bottom: 0,
                              right: 0,
                              width: 18,
                              height: 18,
                              borderRadius: '50%',
                              backgroundColor: '#4B6A4F',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontSize: 11,
                              fontWeight: 700,
                            }}>
                              ✓
                            </div>
                          )}
                        </div>
                        <div>
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: '#111827' }}>{t.full_name ?? t.id}</p>
                          <p style={{ margin: 0, fontSize: 11, color: '#9CA3AF' }}>{t.role === 'super_admin' ? 'Admin' : 'Teacher'}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
              <div>
                <p style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px' }}>Program</p>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {[
                    { value: 'summer_26', label: 'Summer 2026' },
                    { value: 'school_year_26_27', label: 'School Year 2026–2027' },
                  ].map(opt => {
                    const selected = selectedProgram === opt.value
                    return (
                      <button key={opt.value} onClick={() => setSelectedProgram(prev => prev === opt.value ? '' : opt.value)}
                        style={{
                          padding: '5px 12px', borderRadius: 20, fontSize: 13,
                          border: selected ? '2px solid #4B6A4F' : '1px solid #D1D5DB',
                          backgroundColor: selected ? '#EEF3EE' : 'white',
                          color: selected ? '#4B6A4F' : '#374151',
                          fontWeight: selected ? 600 : 400, cursor: 'pointer',
                        }}
                      >{opt.label}</button>
                    )
                  })}
                </div>
              </div>
              <div>
                <p style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px' }}>Classroom</p>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {[
                    { value: 'prek_1st', label: 'Pre-K – 1st' },
                    { value: '2nd_4th', label: '2nd – 4th' },
                  ].map(opt => {
                    const selected = selectedClassroom === opt.value
                    return (
                      <button key={opt.value} onClick={() => setSelectedClassroom(prev => prev === opt.value ? '' : opt.value)}
                        style={{
                          padding: '5px 12px', borderRadius: 20, fontSize: 13,
                          border: selected ? '2px solid #4B6A4F' : '1px solid #D1D5DB',
                          backgroundColor: selected ? '#EEF3EE' : 'white',
                          color: selected ? '#4B6A4F' : '#374151',
                          fontWeight: selected ? 600 : 400, cursor: 'pointer',
                        }}
                      >{opt.label}</button>
                    )
                  })}
                </div>
              </div>
              {assignError && <p style={{ color: colors.error, fontSize: 12, margin: 0 }}>{assignError}</p>}
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <button
                  onClick={handleSaveAssignment}
                  disabled={assignSaving || selectedTeacherIds.size === 0 || !selectedProgram || !selectedClassroom}
                  style={{
                    flex: 1,
                    padding: '12px 0',
                    fontSize: 14,
                    fontWeight: 600,
                    borderRadius: 8,
                    border: 'none',
                    backgroundColor: colors.mistyForest,
                    color: 'white',
                    cursor: assignSaving || selectedTeacherIds.size === 0 || !selectedProgram || !selectedClassroom ? 'not-allowed' : 'pointer',
                    opacity: assignSaving || selectedTeacherIds.size === 0 || !selectedProgram || !selectedClassroom ? 0.6 : 1,
                  }}
                >
                  {assignSaving ? 'Saving…' : 'Save'}
                </button>
                <button
                  onClick={() => { setShowAssignForm(false); setEditingAssignment(null) }}
                  style={{ flex: 1, padding: '12px 0', fontSize: 14, borderRadius: 8, border: '1px solid #D1D5DB', background: 'none', cursor: 'pointer', color: '#374151' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </SidebarSection>
      </div>
    </DetailSidebar>
  )
}
