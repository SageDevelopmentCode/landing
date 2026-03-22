'use client'

import { useState, useEffect } from 'react'
import {
  User,
  Phone,
  NotebookPen,
  CalendarCheck,
  FolderOpen,
  TrendingUp,
  MessageCircle,
  CarFront,
} from 'lucide-react'
import { type StudentRow } from '../MyStudentsSection'
import { SidebarField, SidebarSection } from '@/app/components/SidebarPrimitives'
import { getTeacherStudentDetail } from '@/app/actions/getTeacherStudentDetail'

const PROGRAM_LABELS: Record<string, string> = {
  summer_26: 'Summer 2026',
  school_year_26_27: 'School Year 2026–2027',
  homeschool_drop_in: 'Homeschool Drop-In',
}

const PROGRAM_ORDER = ['summer_26', 'school_year_26_27', 'homeschool_drop_in']

const TABS = [
  { id: 'student-info',         label: 'Student Info',         icon: User },
  { id: 'emergency-contacts',   label: 'Emergency Contacts',   icon: Phone },
  { id: 'teacher-notes',        label: 'Teacher Notes',        icon: NotebookPen },
  { id: 'attendance',           label: 'Attendance',           icon: CalendarCheck },
  { id: 'portfolio',            label: 'Portfolio',            icon: FolderOpen },
  { id: 'progress',             label: 'Progress',             icon: TrendingUp },
  { id: 'parent-communication', label: 'Parent Communication', icon: MessageCircle },
  { id: 'pickup',               label: 'Pickup',               icon: CarFront },
]

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

function PlaceholderCard({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="mb-4 bg-white border border-gray-100 rounded-2xl px-5 py-4 shadow-sm">
      {title && (
        <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 font-body mb-3 pb-2 border-b border-gray-100">
          {title}
        </h3>
      )}
      {children}
    </div>
  )
}

function EmergencyContactsTab() {
  return (
    <>
      <PlaceholderCard title="Primary Contact">
        <SidebarField label="Name" value="Margaret Johnson" />
        <SidebarField label="Relationship" value="Mother" />
        <SidebarField label="Phone" value="(512) 555-0182" />
        <SidebarField label="Email" value="m.johnson@email.com" />
      </PlaceholderCard>
      <PlaceholderCard title="Secondary Contact">
        <SidebarField label="Name" value="Robert Johnson" />
        <SidebarField label="Relationship" value="Father" />
        <SidebarField label="Phone" value="(512) 555-0247" />
        <SidebarField label="Email" value="r.johnson@email.com" />
      </PlaceholderCard>
    </>
  )
}

function TeacherNotesTab() {
  const notes = [
    { date: 'Mar 14, 2026', text: 'Had a great day during outdoor free play. Engaged well with peers during the nature walk activity.' },
    { date: 'Mar 10, 2026', text: 'Needed extra support during transitions today. Used breathing exercises — responded well.' },
    { date: 'Mar 5, 2026',  text: 'Showed strong focus during art project. Completed independently without prompting.' },
    { date: 'Feb 28, 2026', text: 'Parent communication sent regarding reading progress. Follow-up scheduled for next week.' },
  ]
  return (
    <PlaceholderCard title="Teacher Notes">
      <div className="space-y-4">
        {notes.map((n, i) => (
          <div key={i} className="border-b border-gray-50 last:border-0 pb-3 last:pb-0">
            <p className="text-xs text-gray-400 font-body mb-1">{n.date}</p>
            <p className="text-sm text-gray-700">{n.text}</p>
          </div>
        ))}
      </div>
    </PlaceholderCard>
  )
}

function AttendanceTab() {
  const records = [
    { date: 'Mar 14, 2026', status: 'Present' },
    { date: 'Mar 13, 2026', status: 'Present' },
    { date: 'Mar 12, 2026', status: 'Late' },
    { date: 'Mar 11, 2026', status: 'Absent' },
    { date: 'Mar 10, 2026', status: 'Present' },
    { date: 'Mar 7, 2026',  status: 'Present' },
  ]
  const badgeClass = (status: string) => {
    if (status === 'Present') return 'bg-green-100 text-green-700'
    if (status === 'Absent')  return 'bg-red-100 text-red-600'
    return 'bg-yellow-100 text-yellow-700'
  }
  return (
    <PlaceholderCard title="Attendance">
      <div className="space-y-2">
        {records.map((r, i) => (
          <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
            <p className="text-sm text-gray-700">{r.date}</p>
            <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${badgeClass(r.status)}`}>
              {r.status}
            </span>
          </div>
        ))}
      </div>
    </PlaceholderCard>
  )
}

function PortfolioTab() {
  const projects = [
    { title: 'Nature Journal',      subject: 'Science' },
    { title: 'Self-Portrait',       subject: 'Art' },
    { title: 'Story About My Pet',  subject: 'Writing' },
    { title: 'Counting Gardens',    subject: 'Math' },
    { title: 'Community Map',       subject: 'Social Studies' },
    { title: 'Leaf Rubbings',       subject: 'Art' },
  ]
  const subjectColor: Record<string, string> = {
    Science: 'bg-blue-100 text-blue-700',
    Art: 'bg-purple-100 text-purple-700',
    Writing: 'bg-orange-100 text-orange-700',
    Math: 'bg-green-100 text-green-700',
    'Social Studies': 'bg-yellow-100 text-yellow-700',
  }
  return (
    <PlaceholderCard title="Portfolio">
      <div className="grid grid-cols-2 gap-3">
        {projects.map((p, i) => (
          <div key={i} className="border border-gray-100 rounded-xl px-3 py-3 bg-gray-50">
            <p className="text-sm font-medium text-gray-800 mb-1.5">{p.title}</p>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${subjectColor[p.subject] ?? 'bg-gray-100 text-gray-500'}`}>
              {p.subject}
            </span>
          </div>
        ))}
      </div>
    </PlaceholderCard>
  )
}

function ProgressTab() {
  const subjects = [
    { label: 'Reading',        pct: 78 },
    { label: 'Writing',        pct: 65 },
    { label: 'Math',           pct: 82 },
    { label: 'Science',        pct: 90 },
    { label: 'Social Studies', pct: 74 },
    { label: 'Social Skills',  pct: 70 },
  ]
  return (
    <PlaceholderCard title="Progress">
      <div className="space-y-4">
        {subjects.map((s, i) => (
          <div key={i}>
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm text-gray-700">{s.label}</p>
              <p className="text-xs text-gray-400">{s.pct}%</p>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-sage-700 rounded-full"
                style={{ width: `${s.pct}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </PlaceholderCard>
  )
}

function ParentCommunicationTab() {
  const messages = [
    { date: 'Mar 13, 2026', sender: 'You → Margaret Johnson',   preview: 'Just wanted to share that Lena had a wonderful week…' },
    { date: 'Mar 10, 2026', sender: 'Margaret Johnson → You',   preview: 'Thank you for the update! She mentioned the nature walk…' },
    { date: 'Mar 5, 2026',  sender: 'You → Margaret Johnson',   preview: 'Following up on our last conversation about reading…' },
    { date: 'Feb 25, 2026', sender: 'Robert Johnson → You',     preview: 'Quick question about the upcoming field trip forms…' },
  ]
  return (
    <PlaceholderCard title="Parent Communication">
      <div className="space-y-4">
        {messages.map((m, i) => (
          <div key={i} className="border-b border-gray-50 last:border-0 pb-3 last:pb-0">
            <div className="flex items-center justify-between mb-0.5">
              <p className="text-xs font-medium text-gray-500">{m.sender}</p>
              <p className="text-xs text-gray-400">{m.date}</p>
            </div>
            <p className="text-sm text-gray-600 truncate">{m.preview}</p>
          </div>
        ))}
      </div>
    </PlaceholderCard>
  )
}

function PickupTab() {
  const persons = [
    { name: 'Margaret Johnson', relationship: 'Mother', phone: '(512) 555-0182' },
    { name: 'Robert Johnson',   relationship: 'Father', phone: '(512) 555-0247' },
    { name: 'Sandra Mills',     relationship: 'Grandmother', phone: '(512) 555-0391' },
  ]
  return (
    <PlaceholderCard title="Authorized Pickup">
      <div className="space-y-3">
        {persons.map((p, i) => (
          <div key={i} className="flex items-center justify-between border-b border-gray-50 last:border-0 pb-3 last:pb-0">
            <div>
              <p className="text-sm font-medium text-gray-800">{p.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">{p.relationship}</p>
            </div>
            <p className="text-sm text-gray-600">{p.phone}</p>
          </div>
        ))}
      </div>
    </PlaceholderCard>
  )
}

export default function StudentsPageClient({ students }: { students: StudentRow[] }) {
  const programs = PROGRAM_ORDER.filter((p) => students.some((s) => s.program === p))

  const [activeProgram, setActiveProgram] = useState<string>(programs[0] ?? '')
  const [selectedStudent, setSelectedStudent] = useState<StudentRow | null>(null)
  const [detail, setDetail] = useState<Awaited<ReturnType<typeof getTeacherStudentDetail>>>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('student-info')

  useEffect(() => {
    if (!selectedStudent) { setDetail(null); return }
    setActiveTab('student-info')
    setLoading(true)
    getTeacherStudentDetail(selectedStudent.student_id)
      .then((d) => { setDetail(d) })
      .catch(() => { setDetail(null) })
      .finally(() => { setLoading(false) })
  }, [selectedStudent?.student_id])

  const filtered = students.filter((s) => s.program === activeProgram)

  const dob =
    detail?.dob_month && detail?.dob_day && detail?.dob_year
      ? `${detail.dob_month}/${detail.dob_day}/${detail.dob_year}`
      : null

  return (
    <div className="flex flex-1 h-full overflow-hidden">
      {/* Left panel */}
      <div className="w-72 shrink-0 border-r border-gray-100 bg-white flex flex-col overflow-hidden">
        {/* Program tabs */}
        <div className="px-4 pt-5 pb-3 border-b border-gray-100">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 font-body mb-3">Program</p>
          {programs.length === 0 ? (
            <p className="text-sm text-gray-400">No programs found.</p>
          ) : (
            <div className="flex flex-col gap-1">
              {programs.map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    setActiveProgram(p)
                    setSelectedStudent(null)
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeProgram === p
                      ? 'bg-sage-700 text-white'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                  }`}
                >
                  {PROGRAM_LABELS[p] ?? p}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Student list */}
        <div className="flex-1 overflow-y-auto px-3 py-3">
          {programs.length === 0 ? null : filtered.length === 0 ? (
            <p className="text-sm text-gray-400 px-1">No students for this program.</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {filtered.map((s) => {
                const isSelected = selectedStudent?.id === s.id
                return (
                  <div
                    key={s.id}
                    onClick={() => setSelectedStudent(s)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-sage-700/10 border-sage-700'
                        : 'bg-gray-50 border-gray-100 hover:bg-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {s.name ?? '—'}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">Grade: {s.grade ?? '—'}</p>
                    </div>
                    {s.classroom && (
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                        {s.classroom}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right panel — split into content + vertical nav */}
      <div className="flex flex-1 h-full overflow-hidden bg-white">

        {/* Content area */}
        <div className="flex-1 overflow-y-auto px-8 py-8">
          {!selectedStudent ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <p className="text-gray-400 text-sm">Select a student to view their profile.</p>
            </div>
          ) : loading ? (
            <div className="max-w-xl">
              <LoadingSkeleton />
            </div>
          ) : (
            <div className="max-w-xl">
              <div className="mb-6">
                <h2 className="text-xl font-bold font-heading text-gray-800">{selectedStudent.name ?? '—'}</h2>
                <p className="text-sm text-gray-400 mt-0.5">
                  {PROGRAM_LABELS[selectedStudent.program] ?? selectedStudent.program}
                  {selectedStudent.classroom ? ` · ${selectedStudent.classroom}` : ''}
                </p>
              </div>

              {/* Tab content */}
              {activeTab === 'student-info' && (
                <>
                  <SidebarSection title="Student Info">
                    <SidebarField label="Full Name" value={detail?.child_legal_name} />
                    <SidebarField label="Grade" value={detail?.child_grade} />
                    <SidebarField label="Date of Birth" value={dob} />
                    <SidebarField label="Program" value={PROGRAM_LABELS[selectedStudent.program] ?? selectedStudent.program} />
                    <SidebarField label="Classroom" value={selectedStudent.classroom} />
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
                </>
              )}
              {activeTab === 'emergency-contacts' && <EmergencyContactsTab />}
              {activeTab === 'teacher-notes' && <TeacherNotesTab />}
              {activeTab === 'attendance' && <AttendanceTab />}
              {activeTab === 'portfolio' && <PortfolioTab />}
              {activeTab === 'progress' && <ProgressTab />}
              {activeTab === 'parent-communication' && <ParentCommunicationTab />}
              {activeTab === 'pickup' && <PickupTab />}
            </div>
          )}
        </div>

        {/* Vertical tab nav — only shown when a student is selected */}
        {selectedStudent && !loading && (
          <div className="w-44 shrink-0 border-l border-gray-100 py-6 px-3 flex flex-col gap-1 overflow-y-auto">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors font-body flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'bg-sage-700 text-white font-semibold'
                    : 'text-gray-500 hover:text-sage-700 hover:bg-gray-100'
                }`}
              >
                <tab.icon size={15} className="shrink-0" />
                {tab.label}
              </button>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
