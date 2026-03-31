'use client'

import { useState, useEffect, useRef } from 'react'
import {
  User,
  Phone,
  NotebookPen,
  CalendarCheck,
  FolderOpen,
  TrendingUp,
  MessageCircle,
  CarFront,
  Plus,
  Lock,
  Users,
  Upload,
  X,
  FileText,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { type StudentRow } from '../MyStudentsSection'
import { SidebarField, SidebarSection } from '@/app/components/SidebarPrimitives'
import { getTeacherStudentDetail } from '@/app/actions/getTeacherStudentDetail'
import { getTeacherNotes, createTeacherNote, updateTeacherNote, deleteTeacherNote, type TeacherNoteRecord } from '@/app/actions/teacherNotes'
import { getStudentAttendance, type CheckInRecord } from '@/app/actions/getStudentAttendance'
import { getCheckInUser, type CheckInUser } from '@/app/actions/getCheckInUser'
import { DetailSidebar } from '@/app/admin/components/DetailSidebar'
import { getParentUsersByEmails, type ParentUserInfo } from '@/app/actions/getParentUsersByEmails'
import { getConversations, type ConversationWithMeta } from '@/app/parent/messages/actions'

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

type EmergencyContact = {
  name: string | null | undefined
  relation: string | null | undefined
  phone: string | null | undefined
}

type GuardianContact = {
  fullName:     string | null | undefined
  email:        string | null | undefined
  cellPhone:    string | null | undefined
  workPhone:    string | null | undefined
  relationship: string | null | undefined
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }
  return (
    <button
      onClick={handleCopy}
      title="Copy"
      className="ml-2 p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors flex-shrink-0"
    >
      {copied
        ? <svg className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
        : <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>
      }
    </button>
  )
}

function ContactRow({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode
  label: string
  value: string
  href?: string
}) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-gray-400 font-medium leading-none mb-0.5">{label}</p>
        {href
          ? <a href={href} className="text-sm text-[#3d6b4f] font-medium truncate hover:underline">{value}</a>
          : <p className="text-sm text-gray-800 font-medium truncate">{value}</p>
        }
      </div>
      <CopyButton value={value} />
    </div>
  )
}

function ContactCard({
  title,
  badge,
  name,
  relationship,
  rows,
}: {
  title: string
  badge?: string
  name?: string | null
  relationship?: string | null
  rows: { icon: React.ReactNode; label: string; value: string; href?: string }[]
}) {
  const visibleRows = rows.filter(r => !!r.value)
  return (
    <div className="border-b border-gray-200 pb-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 font-body">{title}</h3>
        {badge && (
          <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full capitalize">{badge}</span>
        )}
      </div>
      {name && (
        <div className="flex items-center gap-3 pb-3 mb-1 border-b border-gray-100">
          <div className="w-9 h-9 rounded-full bg-[#3d6b4f]/10 flex items-center justify-center text-[#3d6b4f] font-semibold text-sm flex-shrink-0">
            {name.trim().charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800 leading-tight">{name}</p>
            {relationship && <p className="text-xs text-gray-400 capitalize">{relationship}</p>}
          </div>
        </div>
      )}
      {visibleRows.length > 0
        ? visibleRows.map((r, i) => (
            <ContactRow key={i} icon={r.icon} label={r.label} value={r.value} href={r.href} />
          ))
        : <p className="text-sm text-gray-400 py-2">No contact info available</p>
      }
    </div>
  )
}

function EmergencyContactsTab({
  primary,
  secondary,
  guardian1,
  guardian2,
}: {
  primary: EmergencyContact
  secondary: EmergencyContact
  guardian1?: GuardianContact
  guardian2?: GuardianContact
}) {
  const phoneIcon = <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
  const emailIcon = <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
  const workPhoneIcon = <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>

  return (
    <>
      <ContactCard
        title="Guardian 1"
        badge={guardian1?.relationship ?? undefined}
        name={guardian1?.fullName}
        relationship={guardian1?.relationship}
        rows={[
          { icon: emailIcon,     label: 'Email',       value: guardian1?.email     ?? '', href: guardian1?.email ? `mailto:${guardian1.email}` : undefined },
          { icon: phoneIcon,     label: 'Cell Phone',  value: guardian1?.cellPhone ?? '', href: guardian1?.cellPhone ? `tel:${guardian1.cellPhone}` : undefined },
          { icon: workPhoneIcon, label: 'Work Phone',  value: guardian1?.workPhone ?? '', href: guardian1?.workPhone ? `tel:${guardian1.workPhone}` : undefined },
        ]}
      />
      <ContactCard
        title="Guardian 2"
        badge={guardian2?.relationship ?? undefined}
        name={guardian2?.fullName}
        relationship={guardian2?.relationship}
        rows={[
          { icon: emailIcon,     label: 'Email',       value: guardian2?.email     ?? '', href: guardian2?.email ? `mailto:${guardian2.email}` : undefined },
          { icon: phoneIcon,     label: 'Cell Phone',  value: guardian2?.cellPhone ?? '', href: guardian2?.cellPhone ? `tel:${guardian2.cellPhone}` : undefined },
          { icon: workPhoneIcon, label: 'Work Phone',  value: guardian2?.workPhone ?? '', href: guardian2?.workPhone ? `tel:${guardian2.workPhone}` : undefined },
        ]}
      />
      <ContactCard
        title="In-State Contact"
        badge={primary.relation ?? undefined}
        name={primary.name}
        relationship={primary.relation}
        rows={[
          { icon: phoneIcon, label: 'Phone', value: primary.phone ?? '', href: primary.phone ? `tel:${primary.phone}` : undefined },
        ]}
      />
      <ContactCard
        title="Out-of-State Contact"
        badge={secondary.relation ?? undefined}
        name={secondary.name}
        relationship={secondary.relation}
        rows={[
          { icon: phoneIcon, label: 'Phone', value: secondary.phone ?? '', href: secondary.phone ? `tel:${secondary.phone}` : undefined },
        ]}
      />
    </>
  )
}

type NoteCategory = TeacherNoteRecord['category']

type PendingAttachment = {
  file: File
  previewUrl: string
  type: 'image' | 'file'
}

const NOTE_CATEGORIES: { id: NoteCategory; label: string }[] = [
  { id: 'general',    label: 'General' },
  { id: 'behavioral', label: 'Behavioral' },
  { id: 'academic',   label: 'Academic' },
  { id: 'social',     label: 'Social' },
  { id: 'health',     label: 'Health' },
]

const CATEGORY_BADGE: Record<NoteCategory, string> = {
  general:    'bg-gray-100 text-gray-600',
  behavioral: 'bg-orange-100 text-orange-700',
  academic:   'bg-blue-100 text-blue-700',
  social:     'bg-purple-100 text-purple-700',
  health:     'bg-red-100 text-red-600',
}

function TeacherNotesTab({ studentId }: { studentId: string }) {
  const [notes, setNotes] = useState<TeacherNoteRecord[]>([])
  const [loadingNotes, setLoadingNotes] = useState(true)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [noteText, setNoteText] = useState('')
  const [category, setCategory] = useState<NoteCategory>('general')
  const [isShared, setIsShared] = useState(false)
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setLoadingNotes(true)
    getTeacherNotes(studentId)
      .then(setNotes)
      .catch(() => setNotes([]))
      .finally(() => setLoadingNotes(false))
  }, [studentId])

  const closeDrawer = () => {
    setIsDrawerOpen(false)
    setNoteText('')
    setCategory('general')
    setIsShared(false)
    setPendingAttachments([])
    setSaveError(null)
  }

  const handleSave = async () => {
    if (!noteText.trim() || isSaving) return
    setIsSaving(true)
    setSaveError(null)

    const fd = new FormData()
    fd.append('studentId', studentId)
    fd.append('noteText', noteText.trim())
    fd.append('category', category)
    fd.append('isShared', String(isShared))
    for (const pa of pendingAttachments) fd.append('files', pa.file)

    const result = await createTeacherNote(fd)
    setIsSaving(false)

    if ('error' in result && result.error) {
      setSaveError(result.error)
      return
    }

    if (result.note) setNotes(prev => [result.note, ...prev])
    closeDrawer()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    const added: PendingAttachment[] = files.map(file => ({
      file,
      previewUrl: URL.createObjectURL(file),
      type: file.type.startsWith('image/') ? 'image' as const : 'file' as const,
    }))
    setPendingAttachments(prev => [...prev, ...added])
    e.target.value = ''
  }

  const removeAttachment = (index: number) => {
    setPendingAttachments(prev => prev.filter((_, i) => i !== index))
  }

  useEffect(() => {
    if (!isDrawerOpen) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') closeDrawer() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isDrawerOpen])

  // ── Note detail sidebar state ────────────────────────────────────────────
  const [selectedNote, setSelectedNote]   = useState<TeacherNoteRecord | null>(null)
  const [isDetailOpen, setIsDetailOpen]   = useState(false)
  const [isEditing, setIsEditing]         = useState(false)
  const [isConfirmDelete, setIsConfirmDelete] = useState(false)
  const [editText, setEditText]           = useState('')
  const [editCategory, setEditCategory]   = useState<NoteCategory>('general')
  const [editIsShared, setEditIsShared]   = useState(false)
  const [isUpdating, setIsUpdating]       = useState(false)
  const [isDeleting, setIsDeleting]       = useState(false)
  const [detailError, setDetailError]     = useState<string | null>(null)

  const openDetail = (note: TeacherNoteRecord) => {
    setSelectedNote(note)
    setIsEditing(false)
    setIsConfirmDelete(false)
    setDetailError(null)
    setIsDetailOpen(true)
  }

  const closeDetail = () => {
    setIsDetailOpen(false)
    setIsEditing(false)
    setIsConfirmDelete(false)
    setDetailError(null)
    setSelectedNote(null)
  }

  const startEdit = () => {
    if (!selectedNote) return
    setEditText(selectedNote.note_text)
    setEditCategory(selectedNote.category)
    setEditIsShared(selectedNote.is_shared)
    setDetailError(null)
    setIsEditing(true)
  }

  const handleUpdate = async () => {
    if (!selectedNote || !editText.trim() || isUpdating) return
    setIsUpdating(true)
    setDetailError(null)
    const fd = new FormData()
    fd.append('noteId', selectedNote.id)
    fd.append('noteText', editText.trim())
    fd.append('category', editCategory)
    fd.append('isShared', String(editIsShared))
    const result = await updateTeacherNote(fd)
    setIsUpdating(false)
    if ('error' in result && result.error) { setDetailError(result.error); return }
    if (result.note) {
      setNotes(prev => prev.map(n => n.id === result.note.id ? result.note : n))
      setSelectedNote(result.note)
    }
    setIsEditing(false)
  }

  const handleDelete = async () => {
    if (!selectedNote || isDeleting) return
    setIsDeleting(true)
    const result = await deleteTeacherNote(selectedNote.id)
    setIsDeleting(false)
    if ('error' in result) { setDetailError(result.error); return }
    setNotes(prev => prev.filter(n => n.id !== selectedNote.id))
    closeDetail()
  }

  useEffect(() => {
    if (!isDetailOpen) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') closeDetail() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isDetailOpen])

  useEffect(() => {
    const anyOpen = isDrawerOpen || isDetailOpen
    document.body.style.overflow = anyOpen ? 'hidden' : 'unset'
    return () => { document.body.style.overflow = 'unset' }
  }, [isDrawerOpen, isDetailOpen])

  return (
    <>
      {/* ── Full-width notes list ─────────────────────────────────────────── */}
      <div className="mb-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 font-body">
            Teacher Notes
          </h3>
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="flex items-center gap-1.5 text-xs font-semibold text-sage-700 hover:text-sage-800 bg-sage-50 hover:bg-sage-100 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Plus size={13} />
            Add Note
          </button>
        </div>

        {loadingNotes ? (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="border border-gray-100 rounded-2xl px-5 py-4 space-y-2 animate-pulse">
                <div className="flex justify-between">
                  <div className="h-3 w-20 bg-gray-100 rounded" />
                  <div className="h-3 w-24 bg-gray-100 rounded" />
                </div>
                <div className="h-4 w-full bg-gray-100 rounded" />
                <div className="h-4 w-2/3 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        ) : notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
              <NotebookPen size={20} className="text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-500">No notes yet</p>
            <p className="text-xs text-gray-400 mt-1">Add your first observation for this student</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notes.map((note) => {
              const dateLabel = new Date(note.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              return (
                <div
                  key={note.id}
                  onClick={() => openDetail(note)}
                  className="group border border-gray-100 hover:border-sage-200 bg-white hover:bg-sage-50/30 rounded-2xl px-5 py-4 cursor-pointer transition-all"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-gray-400 font-body">{dateLabel}</p>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${CATEGORY_BADGE[note.category]}`}>
                        {NOTE_CATEGORIES.find(c => c.id === note.category)?.label}
                      </span>
                      {note.is_shared ? (
                        <span className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                          <Users size={10} />
                          Shared
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                          <Lock size={10} />
                          Private
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 line-clamp-2">{note.note_text}</p>
                  {note.teacher_note_attachments.length > 0 && (
                    <div className="mt-2 flex items-center gap-1.5">
                      <FileText size={12} className="text-gray-400" />
                      <span className="text-xs text-gray-400">
                        {note.teacher_note_attachments.length} attachment{note.teacher_note_attachments.length > 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Note Detail Sidebar ───────────────────────────────────────────── */}
      <AnimatePresence>
        {isDetailOpen && selectedNote && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 h-[100dvh] bg-black/20 z-40 backdrop-blur-sm"
              onClick={closeDetail}
            />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 w-full sm:w-[520px] z-50 bg-white flex flex-col overflow-hidden shadow-xl"
            >
              {/* Header */}
              <div className="sticky top-0 z-10 px-6 py-5 flex items-center justify-between border-b border-gray-100 flex-shrink-0 bg-white">
                <h2 className="text-lg font-bold font-heading text-gray-800">
                  {isEditing ? 'Edit Note' : 'Note'}
                </h2>
                <button onClick={closeDetail} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                  <X size={18} className="text-gray-500" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto px-6 py-6">
                {isConfirmDelete ? (
                  <div className="flex flex-col items-center justify-center h-full text-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                      <FileText size={20} className="text-red-500" />
                    </div>
                    <div>
                      <p className="text-base font-semibold text-gray-800 mb-1">Delete this note?</p>
                      <p className="text-sm text-gray-500">This action cannot be undone.</p>
                    </div>
                    {detailError && <p className="text-xs text-red-500">{detailError}</p>}
                  </div>
                ) : isEditing ? (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-widest text-gray-400 font-body mb-2">
                        Note <span className="text-red-400">*</span>
                      </label>
                      <textarea
                        value={editText}
                        onChange={e => setEditText(e.target.value)}
                        rows={6}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-sage-700/20 focus:border-sage-700 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-widest text-gray-400 font-body mb-2">
                        Category
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {NOTE_CATEGORIES.map(cat => (
                          <button
                            key={cat.id}
                            onClick={() => setEditCategory(cat.id)}
                            className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                              editCategory === cat.id
                                ? 'bg-sage-700 text-white border-sage-700'
                                : 'bg-white text-gray-600 border-gray-200 hover:border-sage-700 hover:text-sage-700'
                            }`}
                          >
                            {cat.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-widest text-gray-400 font-body mb-2">
                        Visibility
                      </label>
                      <div className="flex rounded-xl border border-gray-200 overflow-hidden">
                        <button
                          onClick={() => setEditIsShared(false)}
                          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors ${
                            !editIsShared ? 'bg-sage-700 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          <Lock size={14} /> Private
                        </button>
                        <button
                          onClick={() => setEditIsShared(true)}
                          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors border-l border-gray-200 ${
                            editIsShared ? 'bg-sage-700 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          <Users size={14} /> Share with Parent
                        </button>
                      </div>
                    </div>
                    {/* Existing attachments (read-only in edit mode) */}
                    {selectedNote.teacher_note_attachments.length > 0 && (
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-widest text-gray-400 font-body mb-2">
                          Attachments
                        </label>
                        <div className="space-y-2">
                          {selectedNote.teacher_note_attachments.some(a => a.file_type === 'image') && (
                            <div className="grid grid-cols-3 gap-2">
                              {selectedNote.teacher_note_attachments.filter(a => a.file_type === 'image').map(att => (
                                <img key={att.id} src={att.url} alt={att.file_name} className="h-24 w-full object-cover rounded-lg border border-gray-100" />
                              ))}
                            </div>
                          )}
                          {selectedNote.teacher_note_attachments.filter(a => a.file_type === 'file').map(att => (
                            <div key={att.id} className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
                              <FileText size={14} className="text-gray-400 shrink-0" />
                              <span className="text-sm text-gray-700 truncate">{att.file_name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {detailError && <p className="text-xs text-red-500">{detailError}</p>}
                  </div>
                ) : (
                  <div className="space-y-5">
                    {/* Meta row */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-gray-400">
                        {new Date(selectedNote.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span className="text-gray-200">·</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${CATEGORY_BADGE[selectedNote.category]}`}>
                        {NOTE_CATEGORIES.find(c => c.id === selectedNote.category)?.label}
                      </span>
                      {selectedNote.is_shared ? (
                        <span className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                          <Users size={10} /> Shared with Parent
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                          <Lock size={10} /> Private
                        </span>
                      )}
                    </div>
                    {/* Note text */}
                    <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{selectedNote.note_text}</p>
                    {/* Attachments */}
                    {selectedNote.teacher_note_attachments.length > 0 && (
                      <div className="pt-2 border-t border-gray-100">
                        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 font-body mb-3">Attachments</p>
                        <div className="space-y-2">
                          {selectedNote.teacher_note_attachments.some(a => a.file_type === 'image') && (
                            <div className="grid grid-cols-2 gap-2">
                              {selectedNote.teacher_note_attachments.filter(a => a.file_type === 'image').map(att => (
                                <a key={att.id} href={att.url} target="_blank" rel="noopener noreferrer">
                                  <img src={att.url} alt={att.file_name} className="h-32 w-full object-cover rounded-xl border border-gray-100 hover:opacity-90 transition-opacity" />
                                </a>
                              ))}
                            </div>
                          )}
                          {selectedNote.teacher_note_attachments.filter(a => a.file_type === 'file').map(att => (
                            <a key={att.id} href={att.url} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-2 bg-gray-50 border border-gray-100 hover:border-sage-200 rounded-lg px-3 py-2 transition-colors"
                            >
                              <FileText size={14} className="text-gray-400 shrink-0" />
                              <span className="text-sm text-gray-700 truncate">{att.file_name}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex-shrink-0 px-6 py-4 bg-white border-t border-gray-100">
                {isConfirmDelete ? (
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setIsConfirmDelete(false)}
                      disabled={isDeleting}
                      className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="px-5 py-2 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 rounded-xl disabled:opacity-50 transition-colors"
                    >
                      {isDeleting ? 'Deleting…' : 'Delete Note'}
                    </button>
                  </div>
                ) : isEditing ? (
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => { setIsEditing(false); setDetailError(null) }}
                      disabled={isUpdating}
                      className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUpdate}
                      disabled={!editText.trim() || isUpdating}
                      className="px-5 py-2 text-sm font-semibold text-white bg-sage-700 hover:bg-sage-800 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      {isUpdating ? 'Saving…' : 'Save Changes'}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setIsConfirmDelete(true)}
                      className="px-4 py-2 text-sm font-medium text-red-500 border border-red-200 hover:bg-red-50 rounded-xl transition-colors"
                    >
                      Delete
                    </button>
                    <button
                      onClick={startEdit}
                      className="px-5 py-2 text-sm font-semibold text-white bg-sage-700 hover:bg-sage-800 rounded-xl transition-colors"
                    >
                      Edit
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Add Note Drawer */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 h-[100dvh] bg-black/20 z-40 backdrop-blur-sm"
              onClick={closeDrawer}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 w-full sm:w-[520px] z-50 bg-white flex flex-col overflow-hidden shadow-xl"
            >
              {/* Header */}
              <div className="sticky top-0 z-10 px-6 py-5 flex items-center justify-between border-b border-gray-100 flex-shrink-0 bg-white">
                <h2 className="text-lg font-bold font-heading text-gray-800">Add Note</h2>
                <button
                  onClick={closeDrawer}
                  className="p-2 rounded-full transition-colors hover:bg-gray-100"
                  aria-label="Close"
                >
                  <X size={18} className="text-gray-500" />
                </button>
              </div>

              {/* Form */}
              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                {/* Note text */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-gray-400 font-body mb-2">
                    Note <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    value={noteText}
                    onChange={e => setNoteText(e.target.value)}
                    placeholder="Write your observation..."
                    rows={5}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-sage-700/20 focus:border-sage-700 transition-colors"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-gray-400 font-body mb-2">
                    Category
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {NOTE_CATEGORIES.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => setCategory(cat.id)}
                        className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                          category === cat.id
                            ? 'bg-sage-700 text-white border-sage-700'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-sage-700 hover:text-sage-700'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Attachments */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-gray-400 font-body mb-2">
                    Attachments{' '}
                    <span className="text-gray-400 font-normal normal-case tracking-normal">(optional)</span>
                  </label>
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl py-6 cursor-pointer hover:border-sage-700 hover:bg-sage-50/30 transition-colors">
                    <Upload size={20} className="text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">Drag photos or files here</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      or <span className="text-sage-700 font-medium">browse files</span>
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*,.pdf,.doc,.docx"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </label>
                  {pendingAttachments.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {pendingAttachments.some(a => a.type === 'image') && (
                        <div className="grid grid-cols-3 gap-2">
                          {pendingAttachments.map((att, i) => att.type === 'image' && (
                            <div key={i} className="relative group">
                              <img src={att.previewUrl} alt={att.file.name} className="h-20 w-full object-cover rounded-lg border border-gray-100" />
                              <button
                                onClick={() => removeAttachment(i)}
                                className="absolute top-1 right-1 w-5 h-5 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X size={10} className="text-white" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      {pendingAttachments.map((att, i) => att.type === 'file' && (
                        <div key={i} className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
                          <div className="flex items-center gap-2">
                            <FileText size={14} className="text-gray-400 shrink-0" />
                            <span className="text-sm text-gray-700 truncate max-w-[300px]">{att.file.name}</span>
                          </div>
                          <button onClick={() => removeAttachment(i)} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
                            <X size={12} className="text-gray-500" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Visibility */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-gray-400 font-body mb-2">
                    Visibility
                  </label>
                  <div className="flex rounded-xl border border-gray-200 overflow-hidden">
                    <button
                      onClick={() => setIsShared(false)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors ${
                        !isShared ? 'bg-sage-700 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <Lock size={14} />
                      Private
                    </button>
                    <button
                      onClick={() => setIsShared(true)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors border-l border-gray-200 ${
                        isShared ? 'bg-sage-700 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <Users size={14} />
                      Share with Parent
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5">
                    {isShared
                      ? "This note will be visible to the student's parent."
                      : 'Only you can see this note.'}
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="flex-shrink-0 px-6 py-4 bg-white border-t border-gray-100">
                {saveError && (
                  <p className="text-xs text-red-500 mb-3">{saveError}</p>
                )}
                <div className="flex items-center justify-between">
                  <button
                    onClick={closeDrawer}
                    disabled={isSaving}
                    className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={!noteText.trim() || isSaving}
                    className="px-5 py-2 text-sm font-semibold text-white bg-sage-700 rounded-xl hover:bg-sage-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSaving ? 'Saving…' : 'Save Note'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

function AttendanceTab({ studentId }: { studentId: string }) {
  const [records, setRecords] = useState<CheckInRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRecord, setSelectedRecord] = useState<CheckInRecord | null>(null)
  const [sidebarUser, setSidebarUser] = useState<CheckInUser | null>(null)
  const [sidebarLoading, setSidebarLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    getStudentAttendance(studentId)
      .then(setRecords)
      .catch(() => setRecords([]))
      .finally(() => setLoading(false))
  }, [studentId])

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })

  const isPastDay = (iso: string) => {
    const d = new Date(iso)
    const today = new Date()
    return d.toDateString() !== today.toDateString() && d < today
  }

  const handleRowClick = async (r: CheckInRecord) => {
    setSelectedRecord(r)
    setSidebarUser(null)
    setSidebarLoading(true)
    const user = await getCheckInUser(r.checked_in_by).catch(() => null)
    setSidebarUser(user)
    setSidebarLoading(false)
  }

  return (
    <>
      {loading ? (
        <div className="space-y-0">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <div className="h-4 w-28 bg-gray-100 rounded animate-pulse" />
              <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
              <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
              <div className="h-5 w-24 bg-gray-100 rounded-full animate-pulse" />
            </div>
          ))}
        </div>
      ) : records.length === 0 ? (
        <p className="text-sm text-gray-400 px-4">No attendance records found.</p>
      ) : (
        <div>
          {/* Header */}
          <div className="grid grid-cols-4 px-4 py-2 border-b border-gray-100 bg-gray-50 rounded-t-xl">
            <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">Date</span>
            <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">Checked In</span>
            <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">Checked Out</span>
            <span className="text-xs font-semibold uppercase tracking-widest text-gray-400 text-right">Status</span>
          </div>
          {records.map((r, i) => {
            const notCheckedOut = !r.checked_out_at && isPastDay(r.checked_in_at)
            const isToday = !r.checked_out_at && !isPastDay(r.checked_in_at)
            return (
              <div
                key={r.id}
                onClick={() => handleRowClick(r)}
                className={`grid grid-cols-4 px-4 py-3 cursor-pointer transition-colors hover:bg-gray-50 ${
                  i < records.length - 1 ? 'border-b border-gray-100' : ''
                }`}
              >
                <span className="text-sm text-gray-700">{formatDate(r.checked_in_at)}</span>
                <span className="text-sm text-gray-600">{formatTime(r.checked_in_at)}</span>
                <span className="text-sm text-gray-600">
                  {r.checked_out_at ? formatTime(r.checked_out_at) : '—'}
                </span>
                <div className="flex justify-end">
                  {r.checked_out_at ? (
                    <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-green-100 text-green-700">
                      Checked Out
                    </span>
                  ) : notCheckedOut ? (
                    <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
                      Not Checked Out
                    </span>
                  ) : (
                    <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-500">
                      In Progress
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <DetailSidebar
        isOpen={!!selectedRecord}
        onClose={() => setSelectedRecord(null)}
        title="Check-In Details"
      >
        {selectedRecord && (
          <>
            <SidebarSection title="Check-In Record">
              <SidebarField label="Date" value={formatDate(selectedRecord.checked_in_at)} />
              <SidebarField label="Checked In" value={formatTime(selectedRecord.checked_in_at)} />
              <SidebarField
                label="Checked Out"
                value={selectedRecord.checked_out_at ? formatTime(selectedRecord.checked_out_at) : 'Not checked out'}
              />
              {selectedRecord.notes && (
                <SidebarField label="Notes" value={selectedRecord.notes} />
              )}
            </SidebarSection>

            {sidebarLoading ? (
              <div className="space-y-2 mt-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-4 bg-gray-100 rounded animate-pulse" />
                ))}
              </div>
            ) : sidebarUser ? (
              <>
                <SidebarSection title="Checked In By">
                  <SidebarField label="Name" value={sidebarUser.full_name} />
                  <SidebarField label="Email" value={sidebarUser.email} />
                  <SidebarField label="Cell Phone" value={sidebarUser.g1_cell_phone} />
                </SidebarSection>
                {sidebarUser.g2_full_name && (
                  <SidebarSection title="Guardian 2">
                    <SidebarField label="Name" value={sidebarUser.g2_full_name} />
                    <SidebarField label="Relationship" value={sidebarUser.g2_relationship} />
                    <SidebarField label="Email" value={sidebarUser.g2_email} />
                    <SidebarField label="Cell Phone" value={sidebarUser.g2_cell_phone} />
                  </SidebarSection>
                )}
              </>
            ) : null}
          </>
        )}
      </DetailSidebar>
    </>
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

type ParentEntry = {
  email: string
  nameFromApp: string
  userInfo: ParentUserInfo | null
  conversation: ConversationWithMeta | null
}

function ParentCommunicationTab({
  teacherId,
  detail,
}: {
  teacherId: string
  detail: Awaited<ReturnType<typeof getTeacherStudentDetail>>
}) {
  const [parents, setParents] = useState<ParentEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!detail) { setLoading(false); return }

    const rawParents: { email: string; nameFromApp: string }[] = []
    if (detail.g1_email) rawParents.push({ email: detail.g1_email, nameFromApp: detail.g1_full_name ?? detail.g1_email })
    if (detail.g2_email) rawParents.push({ email: detail.g2_email, nameFromApp: detail.g2_full_name ?? detail.g2_email })

    if (!rawParents.length) { setLoading(false); return }

    setLoading(true)
    const emails = rawParents.map((p) => p.email)

    Promise.all([getParentUsersByEmails(emails), getConversations(teacherId)])
      .then(([userMap, allConvos]) => {
        setParents(rawParents.map((p) => {
          const userInfo = userMap[p.email] ?? null
          const conversation = userInfo
            ? allConvos.find((c) => c.otherUser.id === userInfo.id) ?? null
            : null
          return { ...p, userInfo, conversation }
        }))
      })
      .catch(() => setParents([]))
      .finally(() => setLoading(false))
  }, [teacherId, detail])

  const openMessaging = (parentId: string, parentName: string) => {
    window.open(
      `/teacher/messages?recipientId=${encodeURIComponent(parentId)}&recipientName=${encodeURIComponent(parentName)}`,
      '_blank'
    )
  }

  const avatarColors = [
    'bg-[#4a7c59]', 'bg-[#7c6b4a]', 'bg-[#5a6b8a]',
    'bg-[#8a5a6b]', 'bg-[#6b7c4a]', 'bg-[#4a6b7c]',
  ]
  const colorForId = (id: string) => {
    let hash = 0
    for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash)
    return avatarColors[Math.abs(hash) % avatarColors.length]
  }
  const initialsFor = (name: string) =>
    name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('')

  const formatTime = (iso: string) => {
    const date = new Date(iso)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000)
    if (diffDays === 0) return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return date.toLocaleDateString([], { weekday: 'short' })
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }

  if (loading) {
    return (
      <div className="w-full">
        {[1, 2].map((i) => (
          <div key={i} className="flex items-start gap-3 px-4 py-3.5 border-b border-gray-100">
            <div className="w-10 h-10 rounded-full bg-gray-100 animate-pulse shrink-0" />
            <div className="flex-1 min-w-0 space-y-2">
              <div className="h-3 w-32 bg-gray-100 rounded animate-pulse" />
              <div className="h-3 w-full bg-gray-100 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!parents.length) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-sm text-gray-400 font-body">No guardian contact info available.</p>
      </div>
    )
  }

  return (
    <div className="w-full">
      {parents.map((p) => {
        const displayName = p.userInfo?.full_name ?? p.nameFromApp
        const canMessage = !!p.userInfo
        const avatarColor = p.userInfo ? colorForId(p.userInfo.id) : 'bg-gray-200'

        return (
          <button
            key={p.email}
            disabled={!canMessage}
            onClick={() => canMessage && openMessaging(p.userInfo!.id, displayName)}
            className={`w-full flex items-start gap-3 px-4 py-3.5 text-left border-b border-gray-100 last:border-0 transition-colors ${
              canMessage ? 'hover:bg-gray-50 cursor-pointer' : 'cursor-default'
            }`}
          >
            <div className={`${avatarColor} w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-semibold font-body shrink-0`}>
              {initialsFor(displayName)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold font-body text-gray-800 truncate">
                  {displayName}
                </span>
                {p.conversation?.lastMessage && (
                  <span className="text-[11px] text-gray-400 font-body shrink-0 ml-2">
                    {formatTime(p.conversation.lastMessage.created_at)}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-gray-400 font-body">Parent</p>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-xs text-gray-500 font-body truncate flex-1">
                  {p.conversation?.lastMessage
                    ? (p.conversation.lastMessage.sender_id === teacherId ? 'You: ' : '') + p.conversation.lastMessage.body
                    : canMessage ? 'No messages yet' : `No account found for ${p.email}`}
                </p>
                {(p.conversation?.unreadCount ?? 0) > 0 && (
                  <span className="bg-[#4a7c59] text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0">
                    {p.conversation!.unreadCount}
                  </span>
                )}
              </div>
            </div>
          </button>
        )
      })}
    </div>
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

export default function StudentsPageClient({ students, teacherId }: { students: StudentRow[]; teacherId: string }) {
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
        <div className={`flex-1 overflow-y-auto ${activeTab === 'parent-communication' ? '' : 'px-8 py-8'}`}>
          {!selectedStudent ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <p className="text-gray-400 text-sm">Select a student to view their profile.</p>
            </div>
          ) : loading ? (
            <div className="max-w-xl">
              <LoadingSkeleton />
            </div>
          ) : (
            <div className={['attendance', 'student-info', 'emergency-contacts', 'teacher-notes', 'parent-communication'].includes(activeTab) ? 'w-full' : 'max-w-xl'}>
              {activeTab !== 'parent-communication' && (
                <div className="mb-6">
                  <h2 className="text-xl font-bold font-heading text-gray-800">{selectedStudent.name ?? '—'}</h2>
                  <p className="text-sm text-gray-400 mt-0.5">
                    {PROGRAM_LABELS[selectedStudent.program] ?? selectedStudent.program}
                    {selectedStudent.classroom ? ` · ${selectedStudent.classroom}` : ''}
                  </p>
                </div>
              )}
              {activeTab === 'parent-communication' && (
                <div className="px-4 py-4 border-b border-gray-100">
                  <h2 className="text-base font-semibold font-heading text-gray-800">{selectedStudent.name ?? '—'}</h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {PROGRAM_LABELS[selectedStudent.program] ?? selectedStudent.program}
                    {selectedStudent.classroom ? ` · ${selectedStudent.classroom}` : ''}
                  </p>
                </div>
              )}

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
              {activeTab === 'emergency-contacts' && (
                <EmergencyContactsTab
                  guardian1={{
                    fullName:     detail?.g1_full_name,
                    email:        detail?.g1_email,
                    cellPhone:    detail?.g1_cell_phone,
                    workPhone:    detail?.g1_work_phone,
                    relationship: detail?.g1_relationship,
                  }}
                  guardian2={{
                    fullName:     detail?.g2_full_name,
                    email:        detail?.g2_email,
                    cellPhone:    detail?.g2_cell_phone,
                    workPhone:    detail?.g2_work_phone,
                    relationship: detail?.g2_relationship,
                  }}
                  primary={{
                    name: detail?.in_state_contact_name,
                    relation: detail?.in_state_contact_relation,
                    phone: detail?.in_state_contact_phone,
                  }}
                  secondary={{
                    name: detail?.out_of_state_contact_name,
                    relation: detail?.out_of_state_contact_relation,
                    phone: detail?.out_of_state_contact_phone,
                  }}
                />
              )}
              {activeTab === 'teacher-notes' && <TeacherNotesTab studentId={selectedStudent.student_id} />}
              {activeTab === 'attendance' && <AttendanceTab studentId={selectedStudent.student_id} />}
              {activeTab === 'portfolio' && <PortfolioTab />}
              {activeTab === 'progress' && <ProgressTab />}
              {activeTab === 'parent-communication' && (
                <ParentCommunicationTab teacherId={teacherId} detail={detail} />
              )}
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
