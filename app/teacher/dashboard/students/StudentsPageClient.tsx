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

function EmergencyContactsTab({ primary, secondary }: { primary: EmergencyContact; secondary: EmergencyContact }) {
  return (
    <>
      <PlaceholderCard title="In-State Contact">
        <SidebarField label="Name" value={primary.name} />
        <SidebarField label="Relationship" value={primary.relation} />
        <SidebarField label="Phone" value={primary.phone} />
      </PlaceholderCard>
      <PlaceholderCard title="Out-of-State Contact">
        <SidebarField label="Name" value={secondary.name} />
        <SidebarField label="Relationship" value={secondary.relation} />
        <SidebarField label="Phone" value={secondary.phone} />
      </PlaceholderCard>
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
              {activeTab === 'emergency-contacts' && (
                <EmergencyContactsTab
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
