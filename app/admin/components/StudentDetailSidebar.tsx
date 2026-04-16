'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { DetailSidebar } from './DetailSidebar'
import { deleteStudent } from '../../actions/deleteStudent'
import { getAdminEnrollmentData } from '../../actions/getAdminEnrollmentData'
import { getAdminImmunizationFiles } from '../../actions/getAdminImmunizationFiles'
import { getAdminImmunizationDownloadUrl } from '../../actions/getAdminImmunizationDownloadUrl'
import { adminUploadImmunizationRecord } from '../../actions/adminUploadImmunizationRecord'
import { adminDeleteImmunizationRecord } from '../../actions/adminDeleteImmunizationRecord'
import {
  ShieldCheck,
  Pill,
  Users,
  ChevronDown,
  ChevronUp,
  Trash2,
  ExternalLink,
  Clock,
  Car,
} from 'lucide-react'
import type { FileObject } from '@supabase/storage-js'
import type { StudentAuthorizedPickupPerson } from '../../actions/getAdminEnrollmentData'

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

interface StudentDetailSidebarProps {
  student: Student | null
  loading: boolean
  onClose: () => void
  onStudentDeleted?: (studentId: string) => void
}

type ActivePanel = 'immunizations' | 'medications' | 'pickup' | null

function getInitials(name: string | null | undefined): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '?'
  return ((parts[0][0] ?? '') + (parts[parts.length - 1][0] ?? '')).toUpperCase()
}

function ProfileAvatar({ name, imageUrl, size = 72 }: { name: string | null | undefined; imageUrl?: string | null; size?: number }) {
  const initials = getInitials(name)
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name ?? 'Student'}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', border: '2px solid #4A6354', flexShrink: 0 }}
      />
    )
  }
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #374B3F 0%, #4A6354 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        border: '2px solid #4A6354',
        color: '#FFFFFF',
        fontSize: size * 0.33,
        fontWeight: 700,
        letterSpacing: '0.02em',
      }}
    >
      {initials}
    </div>
  )
}

function Chip({ label, color }: { label: string; color: 'red' | 'amber' | 'orange' | 'blue' | 'sage' }) {
  const styles: Record<string, { bg: string; border: string; text: string }> = {
    red:    { bg: '#FEF2F2', border: '#FECACA', text: '#DC2626' },
    amber:  { bg: '#FFFBEB', border: '#FDE68A', text: '#D97706' },
    orange: { bg: '#FFF7ED', border: '#FED7AA', text: '#EA580C' },
    blue:   { bg: '#EFF6FF', border: '#BFDBFE', text: '#2563EB' },
    sage:   { bg: '#F0F5F1', border: '#C6D9C8', text: '#4A6354' },
  }
  const s = styles[color]
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 10px',
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 600,
        backgroundColor: s.bg,
        border: `1px solid ${s.border}`,
        color: s.text,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  )
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: '14px 16px', marginBottom: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#94A3B8', marginBottom: 10 }}>
        {title}
      </p>
      {children}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (value == null || value === '') return null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 8 }}>
      <span style={{ fontSize: 11, color: '#94A3B8' }}>{label}</span>
      <span style={{ fontSize: 13, color: '#1E293B', lineHeight: 1.5 }}>{String(value)}</span>
    </div>
  )
}

function SkeletonBlock({ w = '100%', h = 14 }: { w?: string | number; h?: number }) {
  return (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: 6,
        backgroundColor: '#F1F5F9',
        animation: 'pulse 1.5s ease-in-out infinite',
      }}
    />
  )
}

function LoadingSkeleton() {
  return (
    <div style={{ padding: '16px 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', backgroundColor: '#F1F5F9' }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <SkeletonBlock w="60%" h={20} />
          <SkeletonBlock w="40%" h={14} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <SkeletonBlock w="33%" h={72} />
        <SkeletonBlock w="33%" h={72} />
        <SkeletonBlock w="33%" h={72} />
      </div>
      <SkeletonBlock w="100%" h={100} />
      <SkeletonBlock w="100%" h={100} />
    </div>
  )
}

function ImmunizationPanel({ student }: { student: Student }) {
  const [files, setFiles] = useState<FileObject[]>([])
  const [loadingFiles, setLoadingFiles] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [deletingPath, setDeletingPath] = useState<string | null>(null)
  const [openingPath, setOpeningPath] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const load = async () => {
    setLoadingFiles(true)
    const res = await getAdminImmunizationFiles(student.parent_id, student.id)
    if (res.error) setError(res.error)
    else setFiles(res.files as FileObject[])
    setLoadingFiles(false)
  }

  useEffect(() => { load() }, [student.id])

  const handleUpload = async (file: File) => {
    setError(null)
    const accepted = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic']
    if (!accepted.includes(file.type)) { setError('Unsupported file type. Use PDF, JPEG, PNG, WEBP, or HEIC.'); return }
    if (file.size > 10 * 1024 * 1024) { setError('File exceeds 10 MB.'); return }
    if (files.length >= 10) { setError('Maximum 10 files allowed.'); return }
    setUploading(true)
    const fd = new FormData()
    fd.append('parentId', student.parent_id)
    fd.append('studentId', student.id)
    fd.append('file', file)
    const result = await adminUploadImmunizationRecord(fd)
    if ('error' in result && result.error) setError(result.error)
    else await load()
    setUploading(false)
  }

  const handleDelete = async (path: string) => {
    setDeletingPath(path)
    const result = await adminDeleteImmunizationRecord(path)
    if ('error' in result && result.error) setError(result.error)
    else await load()
    setDeletingPath(null)
  }

  const handleOpen = async (path: string) => {
    setOpeningPath(path)
    const result = await getAdminImmunizationDownloadUrl(path)
    setOpeningPath(null)
    if ('error' in result) { setError(result.error ?? 'Failed to get URL'); return }
    if ('url' in result && result.url) window.open(result.url, '_blank')
  }

  if (loadingFiles) {
    return <p style={{ fontSize: 12, color: '#94A3B8', padding: '8px 0' }}>Loading files…</p>
  }

  return (
    <div style={{ paddingTop: 4 }}>
      {files.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
          {files.map((f) => {
            const path = `${student.parent_id}/${student.id}/${f.name}`
            return (
              <div key={f.name} style={{ display: 'flex', alignItems: 'center', gap: 8, backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '7px 10px' }}>
                <span style={{ flex: 1, fontSize: 12, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {f.name.replace(/^\d+-/, '')}
                </span>
                <button
                  onClick={() => handleOpen(path)}
                  disabled={openingPath === path}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4A6354', padding: 0, display: 'flex', alignItems: 'center', opacity: openingPath === path ? 0.4 : 1 }}
                  title="Open"
                >
                  <ExternalLink size={13} />
                </button>
                <button
                  onClick={() => handleDelete(path)}
                  disabled={deletingPath === path}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 0, display: 'flex', alignItems: 'center', opacity: deletingPath === path ? 0.4 : 1 }}
                  title="Delete"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {files.length === 0 && !uploading && (
        <p style={{ fontSize: 12, color: '#94A3B8', marginBottom: 8 }}>No immunization records on file.</p>
      )}

      {files.length < 10 && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleUpload(f) }}
          onClick={() => { if (!uploading) inputRef.current?.click() }}
          style={{
            border: `2px dashed ${dragging ? '#4A6354' : '#CBD5E1'}`,
            borderRadius: 8,
            padding: '10px 12px',
            textAlign: 'center',
            cursor: uploading ? 'not-allowed' : 'pointer',
            opacity: uploading ? 0.6 : 1,
            backgroundColor: dragging ? 'rgba(74,99,84,0.05)' : '#F8FAFC',
            transition: 'border-color 0.15s, background-color 0.15s',
          }}
        >
          <p style={{ fontSize: 12, color: '#64748B', margin: 0 }}>
            {uploading ? 'Uploading…' : 'Drop file or click to upload'}
          </p>
          <p style={{ fontSize: 11, color: '#94A3B8', margin: '2px 0 0' }}>PDF, JPEG, PNG, WEBP, HEIC · max 10 MB</p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.webp,.heic"
        style={{ display: 'none' }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = '' }}
      />

      {error && <p style={{ fontSize: 11, color: '#DC2626', marginTop: 6 }}>{error}</p>}
    </div>
  )
}

function MedicationsPanel({ medications, plan }: {
  medications: { name: string; condition: string; dosage: string; physician: string; physicianPhone: string; expiration: string; isDaily: boolean; isEmergencyOnly: boolean }[]
  plan: { emergency_procedure?: string | null; special_instructions?: string | null } | null
}) {
  if (medications.length === 0 && !plan?.emergency_procedure && !plan?.special_instructions) {
    return <p style={{ fontSize: 12, color: '#94A3B8', padding: '4px 0' }}>No medication plan on file.</p>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 4 }}>
      {medications.map((med, i) => (
        <div key={i} style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '10px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#1E293B' }}>{med.name}</span>
            <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
              {med.isDaily && <Chip label="Daily" color="sage" />}
              {med.isEmergencyOnly && <Chip label="Emergency" color="orange" />}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {med.condition && <span style={{ fontSize: 11, color: '#475569' }}>Condition: {med.condition}</span>}
            {med.dosage && <span style={{ fontSize: 11, color: '#475569' }}>Dosage: {med.dosage}</span>}
            {med.physician && <span style={{ fontSize: 11, color: '#475569' }}>Dr. {med.physician}{med.physicianPhone ? ` · ${med.physicianPhone}` : ''}</span>}
            {med.expiration && <span style={{ fontSize: 11, color: '#94A3B8' }}>Expires: {med.expiration}</span>}
          </div>
        </div>
      ))}
      {plan?.emergency_procedure && (
        <div>
          <p style={{ fontSize: 11, color: '#94A3B8', marginBottom: 3 }}>Emergency Procedure</p>
          <p style={{ fontSize: 12, color: '#475569', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{plan.emergency_procedure}</p>
        </div>
      )}
      {plan?.special_instructions && (
        <div>
          <p style={{ fontSize: 11, color: '#94A3B8', marginBottom: 3 }}>Special Instructions</p>
          <p style={{ fontSize: 12, color: '#475569', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{plan.special_instructions}</p>
        </div>
      )}
    </div>
  )
}

function AuthorizedPickupPanel({ persons, effectiveUntil }: {
  persons: StudentAuthorizedPickupPerson[]
  effectiveUntil?: string | null
}) {
  if (persons.length === 0) {
    return <p style={{ fontSize: 12, color: '#94A3B8', padding: '4px 0' }}>No authorized pickup persons on file.</p>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 4 }}>
      {effectiveUntil && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <Clock size={11} color="#94A3B8" />
          <span style={{ fontSize: 11, color: '#94A3B8' }}>Effective until: {effectiveUntil}</span>
        </div>
      )}
      {persons.map((p, i) => (
        <div key={i} style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '10px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#1E293B' }}>{p.full_name}</span>
            <span style={{ fontSize: 11, color: '#4A6354', fontWeight: 500 }}>{p.relationship}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {p.phone && <span style={{ fontSize: 11, color: '#475569' }}>{p.phone}</span>}
            {p.email && <span style={{ fontSize: 11, color: '#475569' }}>{p.email}</span>}
            {p.vehicle_info && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                <Car size={11} color="#94A3B8" />
                <span style={{ fontSize: 11, color: '#94A3B8' }}>
                  {p.vehicle_info}{p.license_plate_state ? ` · ${p.license_plate_state}` : ''}
                </span>
              </div>
            )}
          </div>
        </div>
      ))}
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
  const [activePanel, setActivePanel] = useState<ActivePanel>(null)

  // Enrollment data
  const [enrollmentLoading, setEnrollmentLoading] = useState(false)
  const [medications, setMedications] = useState<{ name: string; condition: string; dosage: string; physician: string; physicianPhone: string; expiration: string; isDaily: boolean; isEmergencyOnly: boolean }[]>([])
  const [medicationPlan, setMedicationPlan] = useState<{ emergency_procedure?: string | null; special_instructions?: string | null } | null>(null)
  const [pickupPersons, setPickupPersons] = useState<StudentAuthorizedPickupPerson[]>([])
  const [pickupEffectiveUntil, setPickupEffectiveUntil] = useState<string | null>(null)
  const [immunizationCount, setImmunizationCount] = useState<number | null>(null)

  useEffect(() => {
    setActivePanel(null)
    setMedications([])
    setMedicationPlan(null)
    setPickupPersons([])
    setPickupEffectiveUntil(null)
    setImmunizationCount(null)

    if (!student) return

    setEnrollmentLoading(true)
    getAdminEnrollmentData(student.parent_id, [student.id]).then((data) => {
      const medData = data.medicationPlanByStudent[student.id]
      if (medData) {
        setMedicationPlan(medData.plan)
        setMedications(
          (medData.medications ?? []).map((m) => ({
            name: m.medication_name ?? '',
            condition: m.condition_reason ?? '',
            dosage: m.dosage_frequency ?? '',
            physician: m.physician_name ?? '',
            physicianPhone: m.physician_phone ?? '',
            expiration: m.expiration_date ?? '',
            isDaily: m.is_daily ?? false,
            isEmergencyOnly: m.is_emergency_only ?? false,
          }))
        )
      }
      const pickupData = data.authorizedPickupByStudent[student.id]
      if (pickupData) {
        setPickupPersons(pickupData.persons ?? [])
        setPickupEffectiveUntil(pickupData.plan?.effective_until ?? null)
      }
      setImmunizationCount(data.immunizationFileCountByStudent[student.id] ?? 0)
      setEnrollmentLoading(false)
    }).catch(() => setEnrollmentLoading(false))
  }, [student?.id])

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

  const togglePanel = (panel: ActivePanel) => {
    setActivePanel((prev) => (prev === panel ? null : panel))
  }

  // Health flag chips
  const hasAllergies = student?.has_allergies === 'yes' || student?.has_allergies === 'true' || student?.has_allergies === 'Yes'
  const hasMedical = student?.has_medical_conditions === 'yes' || student?.has_medical_conditions === 'true' || student?.has_medical_conditions === 'Yes'
  const hasEmergencyMeds = student?.has_emergency_medications === 'yes' || student?.has_emergency_medications === 'true' || student?.has_emergency_medications === 'Yes'
  const needsAide = student?.needs_aide === 'yes' || student?.needs_aide === 'true' || student?.needs_aide === 'Yes'
  const hasHistoryFlags = !!student?.history_flags && student.history_flags !== 'no' && student.history_flags !== 'No' && student.history_flags !== 'false'

  const footer = (
    <div className="flex items-center gap-3">
      <button
        onClick={() => setShowDeleteConfirm(true)}
        style={{
          padding: '6px 12px',
          fontSize: 13,
          fontWeight: 600,
          backgroundColor: 'transparent',
          border: '1px solid #FECACA',
          color: '#DC2626',
          borderRadius: 8,
          cursor: 'pointer',
          transition: 'background 0.15s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#FEF2F2')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
      >
        Delete Student
      </button>
    </div>
  )

  return (
    <>
      {showDeleteConfirm && createPortal(
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 60, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 16, padding: 24, width: 320 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 8 }}>Delete this student?</h2>
            <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 20, lineHeight: 1.5 }}>
              This student will be hidden from the admin panel. The record is preserved and can be recovered from the database if needed.
            </p>
            {deleteError && <p style={{ fontSize: 12, color: '#DC2626', marginBottom: 12 }}>{deleteError}</p>}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                style={{ padding: '6px 14px', fontSize: 13, fontWeight: 500, backgroundColor: 'transparent', border: '1px solid #E5E7EB', color: '#374151', borderRadius: 8, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                style={{ padding: '6px 14px', fontSize: 13, fontWeight: 600, backgroundColor: '#DC2626', border: 'none', color: 'white', borderRadius: 8, cursor: isDeleting ? 'not-allowed' : 'pointer', opacity: isDeleting ? 0.6 : 1 }}
              >
                {isDeleting ? 'Deleting…' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      <DetailSidebar
        isOpen={!!student}
        onClose={onClose}
        title=""
        footer={footer}
      >
        {loading ? (
          <LoadingSkeleton />
        ) : student ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

            {/* Profile Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingBottom: 20, marginBottom: 20, borderBottom: '1px solid #E2E8F0' }}>
              <ProfileAvatar name={student.child_legal_name} imageUrl={student.profile_image_url} size={72} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0F172A', margin: 0, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {student.child_legal_name ?? 'Unknown Student'}
                </h2>
                {student.child_grade && (
                  <p style={{ fontSize: 13, color: '#4A6354', marginTop: 3, fontWeight: 500 }}>
                    Grade {student.child_grade}
                  </p>
                )}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                  {dob && (
                    <span style={{ fontSize: 11, color: '#475569', backgroundColor: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: 6, padding: '2px 8px' }}>
                      DOB {dob}
                    </span>
                  )}
                  {student.parent_name && (
                    <span style={{ fontSize: 11, color: '#475569', backgroundColor: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: 6, padding: '2px 8px' }}>
                      {student.parent_name}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Health Flag Chips */}
            {(hasAllergies || hasMedical || hasEmergencyMeds || needsAide || hasHistoryFlags) && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
                {hasAllergies && <Chip label="Allergies" color="amber" />}
                {hasMedical && <Chip label="Medical Conditions" color="red" />}
                {hasEmergencyMeds && <Chip label="Emergency Meds" color="orange" />}
                {needsAide && <Chip label="Needs Aide" color="blue" />}
                {hasHistoryFlags && <Chip label="History Flags" color="red" />}
              </div>
            )}

            {/* Quick Access Buttons */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              {/* Immunizations */}
              <button
                onClick={() => togglePanel('immunizations')}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 5,
                  padding: '10px 6px',
                  backgroundColor: activePanel === 'immunizations' ? '#F0F5F1' : '#F8FAFC',
                  border: `1px solid ${activePanel === 'immunizations' ? '#4A6354' : '#E2E8F0'}`,
                  borderRadius: 10,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  position: 'relative',
                }}
              >
                <ShieldCheck size={18} color={activePanel === 'immunizations' ? '#4A6354' : '#64748B'} />
                <span style={{ fontSize: 10, fontWeight: 600, color: activePanel === 'immunizations' ? '#4A6354' : '#64748B', textAlign: 'center', lineHeight: 1.2 }}>
                  Immunizations
                </span>
                {immunizationCount != null && immunizationCount > 0 && (
                  <span style={{ position: 'absolute', top: 5, right: 5, backgroundColor: '#4A6354', color: '#FFFFFF', fontSize: 9, fontWeight: 700, borderRadius: 999, width: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {immunizationCount}
                  </span>
                )}
                {activePanel === 'immunizations' ? <ChevronUp size={10} color="#4A6354" /> : <ChevronDown size={10} color="#94A3B8" />}
              </button>

              {/* Medications */}
              <button
                onClick={() => togglePanel('medications')}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 5,
                  padding: '10px 6px',
                  backgroundColor: activePanel === 'medications' ? '#FFF7ED' : '#F8FAFC',
                  border: `1px solid ${activePanel === 'medications' ? '#FED7AA' : '#E2E8F0'}`,
                  borderRadius: 10,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  position: 'relative',
                }}
              >
                <Pill size={18} color={activePanel === 'medications' ? '#EA580C' : '#64748B'} />
                <span style={{ fontSize: 10, fontWeight: 600, color: activePanel === 'medications' ? '#EA580C' : '#64748B', textAlign: 'center', lineHeight: 1.2 }}>
                  Medications
                </span>
                {medications.length > 0 && (
                  <span style={{ position: 'absolute', top: 5, right: 5, backgroundColor: '#EA580C', color: '#FFFFFF', fontSize: 9, fontWeight: 700, borderRadius: 999, width: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {medications.length}
                  </span>
                )}
                {activePanel === 'medications' ? <ChevronUp size={10} color="#EA580C" /> : <ChevronDown size={10} color="#94A3B8" />}
              </button>

              {/* Authorized Pickup */}
              <button
                onClick={() => togglePanel('pickup')}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 5,
                  padding: '10px 6px',
                  backgroundColor: activePanel === 'pickup' ? '#EFF6FF' : '#F8FAFC',
                  border: `1px solid ${activePanel === 'pickup' ? '#BFDBFE' : '#E2E8F0'}`,
                  borderRadius: 10,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  position: 'relative',
                }}
              >
                <Users size={18} color={activePanel === 'pickup' ? '#2563EB' : '#64748B'} />
                <span style={{ fontSize: 10, fontWeight: 600, color: activePanel === 'pickup' ? '#2563EB' : '#64748B', textAlign: 'center', lineHeight: 1.2 }}>
                  Auth. Pickup
                </span>
                {pickupPersons.length > 0 && (
                  <span style={{ position: 'absolute', top: 5, right: 5, backgroundColor: '#2563EB', color: '#FFFFFF', fontSize: 9, fontWeight: 700, borderRadius: 999, width: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {pickupPersons.length}
                  </span>
                )}
                {activePanel === 'pickup' ? <ChevronUp size={10} color="#2563EB" /> : <ChevronDown size={10} color="#94A3B8" />}
              </button>
            </div>

            {/* Enrollment loading indicator */}
            {enrollmentLoading && (
              <p style={{ fontSize: 11, color: '#94A3B8', textAlign: 'center', marginBottom: 12 }}>Loading records…</p>
            )}

            {/* Inline Panel: Immunizations */}
            {activePanel === 'immunizations' && (
              <div style={{ backgroundColor: '#F0F5F1', border: '1px solid #C6D9C8', borderRadius: 10, padding: '12px 14px', marginBottom: 20 }}>
                <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#4A6354', marginBottom: 10 }}>
                  Immunization Records
                </p>
                <ImmunizationPanel student={student} />
              </div>
            )}

            {/* Inline Panel: Medications */}
            {activePanel === 'medications' && (
              <div style={{ backgroundColor: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 10, padding: '12px 14px', marginBottom: 20 }}>
                <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#EA580C', marginBottom: 10 }}>
                  Medication Plan
                </p>
                <MedicationsPanel medications={medications} plan={medicationPlan} />
              </div>
            )}

            {/* Inline Panel: Authorized Pickup */}
            {activePanel === 'pickup' && (
              <div style={{ backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10, padding: '12px 14px', marginBottom: 20 }}>
                <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#2563EB', marginBottom: 10 }}>
                  Authorized Pickup Persons
                </p>
                <AuthorizedPickupPanel persons={pickupPersons} effectiveUntil={pickupEffectiveUntil} />
              </div>
            )}

            {/* Student Info */}
            <InfoCard title="Student Info">
              <InfoRow label="Full Name" value={student.child_legal_name} />
              <InfoRow label="Grade" value={student.child_grade} />
              <InfoRow label="Date of Birth" value={dob} />
              <InfoRow label="Parent / Guardian" value={student.parent_name} />
              {student.special_interests && (
                <div style={{ marginBottom: 2 }}>
                  <span style={{ fontSize: 11, color: '#94A3B8', display: 'block', marginBottom: 3 }}>Special Interests</span>
                  <p style={{ fontSize: 13, color: '#1E293B', lineHeight: 1.6, margin: 0 }}>{student.special_interests}</p>
                </div>
              )}
            </InfoCard>

            {/* Medical */}
            {(student.has_medical_conditions || student.has_allergies || student.has_emergency_medications) && (
              <InfoCard title="Medical">
                <InfoRow label="Has Medical Conditions" value={student.has_medical_conditions} />
                {student.medical_conditions_description && (
                  <div style={{ marginBottom: 8 }}>
                    <span style={{ fontSize: 11, color: '#94A3B8', display: 'block', marginBottom: 3 }}>Medical Details</span>
                    <p style={{ fontSize: 13, color: '#1E293B', lineHeight: 1.6, margin: 0 }}>{student.medical_conditions_description}</p>
                  </div>
                )}
                <InfoRow label="Has Allergies" value={student.has_allergies} />
                {student.allergies_description && (
                  <div style={{ marginBottom: 8 }}>
                    <span style={{ fontSize: 11, color: '#94A3B8', display: 'block', marginBottom: 3 }}>Allergy Details</span>
                    <p style={{ fontSize: 13, color: '#1E293B', lineHeight: 1.6, margin: 0 }}>{student.allergies_description}</p>
                  </div>
                )}
                <InfoRow label="Has Emergency Medications" value={student.has_emergency_medications} />
                {student.emergency_medications_description && (
                  <div style={{ marginBottom: 2 }}>
                    <span style={{ fontSize: 11, color: '#94A3B8', display: 'block', marginBottom: 3 }}>Emergency Medication Details</span>
                    <p style={{ fontSize: 13, color: '#1E293B', lineHeight: 1.6, margin: 0 }}>{student.emergency_medications_description}</p>
                  </div>
                )}
              </InfoCard>
            )}

            {/* Support Needs */}
            {(student.needs_aide || student.history_flags) && (
              <InfoCard title="Support Needs">
                <InfoRow label="Needs Aide" value={student.needs_aide} />
                {student.needs_aide_description && (
                  <div style={{ marginBottom: 8 }}>
                    <span style={{ fontSize: 11, color: '#94A3B8', display: 'block', marginBottom: 3 }}>Aide Details</span>
                    <p style={{ fontSize: 13, color: '#1E293B', lineHeight: 1.6, margin: 0 }}>{student.needs_aide_description}</p>
                  </div>
                )}
                <InfoRow label="History Flags" value={student.history_flags} />
                {student.history_explanation && (
                  <div style={{ marginBottom: 2 }}>
                    <span style={{ fontSize: 11, color: '#94A3B8', display: 'block', marginBottom: 3 }}>History Explanation</span>
                    <p style={{ fontSize: 13, color: '#1E293B', lineHeight: 1.6, margin: 0 }}>{student.history_explanation}</p>
                  </div>
                )}
              </InfoCard>
            )}

            {/* Learning Profile */}
            {(student.learning_style || student.strengths_interests || student.current_challenges || student.dysregulation_response || student.regulation_strategies || student.activities_to_avoid) && (
              <InfoCard title="Learning Profile">
                <InfoRow label="Learning Style" value={student.learning_style} />
                {student.strengths_interests && (
                  <div style={{ marginBottom: 8 }}>
                    <span style={{ fontSize: 11, color: '#94A3B8', display: 'block', marginBottom: 3 }}>Strengths & Interests</span>
                    <p style={{ fontSize: 13, color: '#1E293B', lineHeight: 1.6, margin: 0 }}>{student.strengths_interests}</p>
                  </div>
                )}
                {student.current_challenges && (
                  <div style={{ marginBottom: 8 }}>
                    <span style={{ fontSize: 11, color: '#94A3B8', display: 'block', marginBottom: 3 }}>Current Challenges</span>
                    <p style={{ fontSize: 13, color: '#1E293B', lineHeight: 1.6, margin: 0 }}>{student.current_challenges}</p>
                  </div>
                )}
                {student.dysregulation_response && (
                  <div style={{ marginBottom: 8 }}>
                    <span style={{ fontSize: 11, color: '#94A3B8', display: 'block', marginBottom: 3 }}>Dysregulation Response</span>
                    <p style={{ fontSize: 13, color: '#1E293B', lineHeight: 1.6, margin: 0 }}>{student.dysregulation_response}</p>
                  </div>
                )}
                {student.regulation_strategies && (
                  <div style={{ marginBottom: 8 }}>
                    <span style={{ fontSize: 11, color: '#94A3B8', display: 'block', marginBottom: 3 }}>Regulation Strategies</span>
                    <p style={{ fontSize: 13, color: '#1E293B', lineHeight: 1.6, margin: 0 }}>{student.regulation_strategies}</p>
                  </div>
                )}
                {student.activities_to_avoid && (
                  <div style={{ marginBottom: 2 }}>
                    <span style={{ fontSize: 11, color: '#94A3B8', display: 'block', marginBottom: 3 }}>Activities to Avoid</span>
                    <p style={{ fontSize: 13, color: '#1E293B', lineHeight: 1.6, margin: 0 }}>{student.activities_to_avoid}</p>
                  </div>
                )}
              </InfoCard>
            )}

          </div>
        ) : null}
      </DetailSidebar>
    </>
  )
}
