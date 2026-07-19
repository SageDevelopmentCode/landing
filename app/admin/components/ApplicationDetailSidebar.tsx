'use client'

import { DetailSidebar } from './DetailSidebar'
import { SidebarField, SidebarSection } from '../../components/SidebarPrimitives'
import { approveApplication } from '../../actions/approveApplication'
import { denyApplication } from '../../actions/denyApplication'
import { deactivateApplication } from '../../actions/deactivateApplication'
import { getApplicationNotes } from '../../actions/getApplicationNotes'
import { addApplicationNote } from '../../actions/addApplicationNote'
import { useState, useEffect, useRef } from 'react'
import type { FileObject } from '@supabase/storage-js'
import { listHealthInfoForms } from '../../actions/listHealthInfoForms'
import { uploadHealthInfoForm } from '../../actions/uploadHealthInfoForm'
import { deleteHealthInfoForm } from '../../actions/deleteHealthInfoForm'
import { getHealthInfoFormUrl } from '../../actions/getHealthInfoFormUrl'
import { createBrowserClient } from '@supabase/ssr'
import { getAdminEnrollmentData, type AdminEnrollmentData } from '../../actions/getAdminEnrollmentData'
import { EnrollmentProgressCard, type ApprovedApplication } from './EnrollmentProgressCard'
import { EmailThread } from './EmailThread'
import { sendEnrollmentReminderEmail } from '../../actions/sendEnrollmentReminderEmail'
import { sendEnrollmentReminder2Email } from '../../actions/sendEnrollmentReminder2Email'
import { sendEnrollmentReminder3Email } from '../../actions/sendEnrollmentReminder3Email'
import { sendEnrollmentConfirmationEmail } from '../../actions/sendEnrollmentConfirmationEmail'
import { sendInfoSessionInviteEmail } from '../../actions/sendInfoSessionInviteEmail'
import { sendOpenHouseEnrollmentEmail } from '../../actions/sendOpenHouseEnrollmentEmail'
import { sendPaySummerTuitionEmail } from '../../actions/sendPaySummerTuitionEmail'
import { sendPaySummerTuitionEmail2 } from '../../actions/sendPaySummerTuitionEmail2'
import { sendSummerWelcomeEmail } from '../../actions/sendSummerWelcomeEmail'
import { sendSummerTuitionDueDateReminderEmail } from '../../actions/sendSummerTuitionDueDateReminderEmail'
import { sendSummerTuitionDueDateTodayReminderEmail } from '../../actions/sendSummerTuitionDueDateTodayReminderEmail'
import { sendRegistrationFeeConfirmationEmail } from '../../actions/sendRegistrationFeeConfirmationEmail'
import { sendHomeschoolDropInConfirmationEmail } from '../../actions/sendHomeschoolDropInConfirmationEmail'
import { sendSummerStartingEmail } from '../../actions/sendSummerStartingEmail'
import { sendSummerFirstDayEmail } from '../../actions/sendSummerFirstDayEmail'
import { sendSummerWeekOneNewsletterEmail } from '../../actions/sendSummerWeekOneNewsletterEmail'
import { sendSummerWeekTwoNewsletterEmail } from '../../actions/sendSummerWeekTwoNewsletterEmail'
import { sendSummerWeekThreeNewsletterEmail } from '../../actions/sendSummerWeekThreeNewsletterEmail'
import { sendSummerWeekFourNewsletterEmail } from '../../actions/sendSummerWeekFourNewsletterEmail'
import { sendSummerWeekFiveNewsletterEmail } from '../../actions/sendSummerWeekFiveNewsletterEmail'
import { sendSummerWeekSixNewsletterEmail } from '../../actions/sendSummerWeekSixNewsletterEmail'
import { sendSummerWeekSevenNewsletterEmail } from '../../actions/sendSummerWeekSevenNewsletterEmail'
import { sendSchoolYearCommitmentEmail } from '../../actions/sendSchoolYearCommitmentEmail'
import { sendFreeFridayAnnouncementEmail } from '../../actions/sendFreeFridayAnnouncementEmail'
import { sendGoogleReviewIncentiveEmail } from '../../actions/sendGoogleReviewIncentiveEmail'
import { sendMeetTheTeacherJoyEmail } from '../../actions/sendMeetTheTeacherJoyEmail'
import { sendMeetTheTeacherJoyReminderEmail } from '../../actions/sendMeetTheTeacherJoyReminderEmail'
import { sendFunFridayConfirmationEmail } from '../../actions/sendFunFridayConfirmationEmail'
import { sendSummerTuitionConfirmationEmail } from '../../actions/sendSummerTuitionConfirmationEmail'
import { sendSchoolYearTuitionInfoEmail } from '../../actions/sendSchoolYearTuitionInfoEmail'
import { sendSchoolYearTuitionClarificationEmail } from '../../actions/sendSchoolYearTuitionClarificationEmail'
import { enrollApplication } from '../../actions/enrollApplication'
import { PaymentHistory } from './PaymentHistory'
import { updateApplicationProgram } from '../../actions/updateApplicationProgram'
import { updateApplicationTags } from '../../actions/updateApplicationTags'
import { updateApplicationDropInProgram } from '../../actions/updateApplicationDropInProgram'
import { PRESET_TAGS } from '../constants/applicationTags'

export type CachedEnrollmentData = AdminEnrollmentData & {
  registrationFeePaidByStudent: Record<string, boolean>
  siblingApps: ApprovedApplication[]
}
const enrollmentCache = new Map<string, CachedEnrollmentData>()

const PROGRAM_LABELS: Record<string, string> = {
  summer_26: 'Summer 2026',
  school_year_26_27: 'School Year 2026-2027',
  both: 'Both',
  homeschool_drop_in: 'Homeschool Drop-In',
}

const PROGRAM_FEES: Record<string, string> = {
  summer_26: '$75',
  school_year_26_27: '$500',
  both: '$575',
  homeschool_drop_in: 'varies',
}

function formatProgram(value: string | null): string {
  if (!value) return '—'
  return PROGRAM_LABELS[value] ?? value
}

type Application = {
  id: string
  user_id: string
  child_legal_name: string | null
  preferred_name: string | null
  dob_month: string | null
  dob_day: string | null
  dob_year: string | null
  child_age: number | null
  child_grade: string | null
  program: string | null
  drop_in_program: string | null
  registration_fee_paid?: boolean | null
  address_street: string | null
  address_city: string | null
  address_state: string | null
  address_zip: string | null
  is_homeschooled: string | null
  homeschool_explanation: string | null
  previous_schools: string | null
  previous_schools_list: string | null
  special_interests: string | null
  has_allergies: boolean | null
  allergies_description: string | null
  has_medical_conditions: boolean | null
  medical_conditions_description: string | null
  has_emergency_medications: boolean | null
  emergency_medications_description: string | null
  activities_to_avoid: string | null
  dysregulation_response: string | null
  regulation_strategies: string | null
  needs_aide: boolean | null
  needs_aide_description: string | null
  history_flags: string | null
  history_explanation: string | null
  has_custody_orders: boolean | null
  custody_orders_description: string | null
  learning_style: string | null
  strengths_interests: string | null
  current_challenges: string | null
  g1_full_name: string | null
  g1_relationship: string | null
  g1_cell_phone: string | null
  g1_work_phone: string | null
  g1_email: string | null
  g1_has_custody: boolean | null
  g1_lives_with_child: boolean | null
  g1_preferred_contact: boolean | null
  g2_full_name: string | null
  g2_relationship: string | null
  g2_cell_phone: string | null
  g2_work_phone: string | null
  g2_email: string | null
  g2_has_custody: boolean | null
  g2_lives_with_child: boolean | null
  g2_preferred_contact: boolean | null
  student_id: string | null
  admin_notes: string | null
  admin_tags: string[] | null
  status: string
  approved: boolean
  approved_at: string | null
  denied: boolean
  denied_at: string | null
  denied_reason: string | null
  created_at: string | null
  is_active: boolean | null
  [key: string]: unknown
}

interface ApplicationDetailSidebarProps {
  application: Application | null
  onClose: () => void
  onApproved: (id: string) => void
  onDenied: (id: string, reason: string) => void
  onDeactivated: (id: string) => void
  onItemClick: (itemId: number, studentId: string, data: CachedEnrollmentData | null) => void
  onEnrolled: (id: string) => void
  onProgramChanged?: (id: string, program: string) => void
  onDropInChanged?: (id: string, dropInProgram: string) => void
  onTagsChanged?: (id: string, tags: string[]) => void
}



export function ApplicationDetailSidebar({
  application,
  onClose,
  onApproved,
  onDenied,
  onDeactivated,
  onItemClick,
  onEnrolled,
  onProgramChanged,
  onDropInChanged,
  onTagsChanged,
}: ApplicationDetailSidebarProps) {
  const [notes, setNotes] = useState<{ id: string; content: string; created_at: string }[]>([])
  const [newNote, setNewNote] = useState('')
  const [isAddingNote, setIsAddingNote] = useState(false)
  const [addNoteError, setAddNoteError] = useState<string | null>(null)
  const [isApproving, setIsApproving] = useState(false)
  const [approveError, setApproveError] = useState<string | null>(null)
  const [isDenyingMode, setIsDenyingMode] = useState(false)
  const [denyReason, setDenyReason] = useState('')
  const [isDenying, setIsDenying] = useState(false)
  const [denyError, setDenyError] = useState<string | null>(null)
  const [isDeactivating, setIsDeactivating] = useState(false)
  const [reminderSending, setReminderSending] = useState(false)
  const [reminderSent, setReminderSent] = useState(false)
  const [reminderError, setReminderError] = useState<string | null>(null)
  const [reminder2Sending, setReminder2Sending] = useState(false)
  const [reminder2Sent, setReminder2Sent] = useState(false)
  const [reminder2Error, setReminder2Error] = useState<string | null>(null)
  const [reminder3Sending, setReminder3Sending] = useState(false)
  const [reminder3Sent, setReminder3Sent] = useState(false)
  const [reminder3Error, setReminder3Error] = useState<string | null>(null)
  const [confirmationSending, setConfirmationSending] = useState(false)
  const [confirmationSent, setConfirmationSent] = useState(false)
  const [confirmationError, setConfirmationError] = useState<string | null>(null)
  const [infoSessionSending, setInfoSessionSending] = useState(false)
  const [infoSessionSent, setInfoSessionSent] = useState(false)
  const [infoSessionError, setInfoSessionError] = useState<string | null>(null)
  const [openHouseSending, setOpenHouseSending] = useState(false)
  const [openHouseSent, setOpenHouseSent] = useState(false)
  const [openHouseError, setOpenHouseError] = useState<string | null>(null)
  const [summerTuitionSending, setSummerTuitionSending] = useState(false)
  const [summerTuitionSent, setSummerTuitionSent] = useState(false)
  const [summerTuitionError, setSummerTuitionError] = useState<string | null>(null)
  const [summerTuition2Sending, setSummerTuition2Sending] = useState(false)
  const [summerTuition2Sent, setSummerTuition2Sent] = useState(false)
  const [summerTuition2Error, setSummerTuition2Error] = useState<string | null>(null)
  const [summerWelcomeSending, setSummerWelcomeSending] = useState(false)
  const [summerWelcomeSent, setSummerWelcomeSent] = useState(false)
  const [summerWelcomeError, setSummerWelcomeError] = useState<string | null>(null)
  const [tuitionDueSending, setTuitionDueSending] = useState(false)
  const [tuitionDueSent, setTuitionDueSent] = useState(false)
  const [tuitionDueError, setTuitionDueError] = useState<string | null>(null)
  const [tuitionDueTodaySending, setTuitionDueTodaySending] = useState(false)
  const [tuitionDueTodaySent, setTuitionDueTodaySent] = useState(false)
  const [tuitionDueTodayError, setTuitionDueTodayError] = useState<string | null>(null)
  const [regFeeSending, setRegFeeSending] = useState(false)
  const [regFeeSent, setRegFeeSent] = useState(false)
  const [regFeeError, setRegFeeError] = useState<string | null>(null)
  const [dropInConfirmSending, setDropInConfirmSending] = useState(false)
  const [dropInConfirmSent, setDropInConfirmSent] = useState(false)
  const [dropInConfirmError, setDropInConfirmError] = useState<string | null>(null)
  const [summerStartingSending, setSummerStartingSending] = useState(false)
  const [summerStartingSent, setSummerStartingSent] = useState(false)
  const [summerStartingError, setSummerStartingError] = useState<string | null>(null)
  const [summerFirstDaySending, setSummerFirstDaySending] = useState(false)
  const [summerFirstDaySent, setSummerFirstDaySent] = useState(false)
  const [summerFirstDayError, setSummerFirstDayError] = useState<string | null>(null)
  const [weekOneNewsletterSending, setWeekOneNewsletterSending] = useState(false)
  const [weekOneNewsletterSent, setWeekOneNewsletterSent] = useState(false)
  const [weekOneNewsletterError, setWeekOneNewsletterError] = useState<string | null>(null)
  const [weekTwoNewsletterSending, setWeekTwoNewsletterSending] = useState(false)
  const [weekTwoNewsletterSent, setWeekTwoNewsletterSent] = useState(false)
  const [weekTwoNewsletterError, setWeekTwoNewsletterError] = useState<string | null>(null)
  const [weekThreeNewsletterSending, setWeekThreeNewsletterSending] = useState(false)
  const [weekThreeNewsletterSent, setWeekThreeNewsletterSent] = useState(false)
  const [weekThreeNewsletterError, setWeekThreeNewsletterError] = useState<string | null>(null)
  const [weekFourNewsletterSending, setWeekFourNewsletterSending] = useState(false)
  const [weekFourNewsletterSent, setWeekFourNewsletterSent] = useState(false)
  const [weekFourNewsletterError, setWeekFourNewsletterError] = useState<string | null>(null)
  const [weekFiveNewsletterSending, setWeekFiveNewsletterSending] = useState(false)
  const [weekFiveNewsletterSent, setWeekFiveNewsletterSent] = useState(false)
  const [weekFiveNewsletterError, setWeekFiveNewsletterError] = useState<string | null>(null)
  const [weekSixNewsletterSending, setWeekSixNewsletterSending] = useState(false)
  const [weekSixNewsletterSent, setWeekSixNewsletterSent] = useState(false)
  const [weekSixNewsletterError, setWeekSixNewsletterError] = useState<string | null>(null)
  const [weekSevenNewsletterSending, setWeekSevenNewsletterSending] = useState(false)
  const [weekSevenNewsletterSent, setWeekSevenNewsletterSent] = useState(false)
  const [weekSevenNewsletterError, setWeekSevenNewsletterError] = useState<string | null>(null)
  const [freeFridaySending, setFreeFridaySending] = useState(false)
  const [freeFridaySent, setFreeFridaySent] = useState(false)
  const [freeFridayError, setFreeFridayError] = useState<string | null>(null)
  const [googleReviewSending, setGoogleReviewSending] = useState(false)
  const [googleReviewSent, setGoogleReviewSent] = useState(false)
  const [googleReviewError, setGoogleReviewError] = useState<string | null>(null)
  const [meetJoySending, setMeetJoySending] = useState(false)
  const [meetJoySent, setMeetJoySent] = useState(false)
  const [meetJoyError, setMeetJoyError] = useState<string | null>(null)
  const [meetJoyReminderSending, setMeetJoyReminderSending] = useState(false)
  const [meetJoyReminderSent, setMeetJoyReminderSent] = useState(false)
  const [meetJoyReminderError, setMeetJoyReminderError] = useState<string | null>(null)
  const [summerTuitionConfirmSending, setSummerTuitionConfirmSending] = useState(false)
  const [summerTuitionConfirmSent, setSummerTuitionConfirmSent] = useState(false)
  const [summerTuitionConfirmError, setSummerTuitionConfirmError] = useState<string | null>(null)
  const [funFridayConfirmSending, setFunFridayConfirmSending] = useState(false)
  const [funFridayConfirmSent, setFunFridayConfirmSent] = useState(false)
  const [funFridayConfirmError, setFunFridayConfirmError] = useState<string | null>(null)
  const [schoolYearCommitmentSending, setSchoolYearCommitmentSending] = useState(false)
  const [schoolYearCommitmentSent, setSchoolYearCommitmentSent] = useState(false)
  const [schoolYearCommitmentError, setSchoolYearCommitmentError] = useState<string | null>(null)
  const [schoolYearTuitionInfoSending, setSchoolYearTuitionInfoSending] = useState(false)
  const [schoolYearTuitionInfoSent, setSchoolYearTuitionInfoSent] = useState(false)
  const [schoolYearTuitionInfoError, setSchoolYearTuitionInfoError] = useState<string | null>(null)
  const [schoolYearTuitionClarificationSending, setSchoolYearTuitionClarificationSending] = useState(false)
  const [schoolYearTuitionClarificationSent, setSchoolYearTuitionClarificationSent] = useState(false)
  const [schoolYearTuitionClarificationError, setSchoolYearTuitionClarificationError] = useState<string | null>(null)
  const [tagInput, setTagInput] = useState('')
  const [tagSaving, setTagSaving] = useState(false)
  const [tagError, setTagError] = useState<string | null>(null)
  const [enrollmentData, setEnrollmentData] = useState<AdminEnrollmentData & { registrationFeePaidByStudent: Record<string, boolean> } | null>(null)
  const [enrollmentLoading, setEnrollmentLoading] = useState(false)
  const [siblingApps, setSiblingApps] = useState<ApprovedApplication[]>([])
  const [isEnrolling, setIsEnrolling] = useState(false)
  const [enrollError, setEnrollError] = useState<string | null>(null)
  const [emailThreadKey, setEmailThreadKey] = useState(0)
  const [outreachTab, setOutreachTab] = useState<'enrollment' | 'summer' | 'newsletters' | 'other'>('enrollment')
  const [isEditingProgram, setIsEditingProgram] = useState(false)
  const [selectedProgram, setSelectedProgram] = useState<string>(application?.program ?? '')
  const [isUpdatingProgram, setIsUpdatingProgram] = useState(false)
  const [programUpdateError, setProgramUpdateError] = useState<string | null>(null)
  const [isEditingDropIn, setIsEditingDropIn] = useState(false)
  const [selectedDropIn, setSelectedDropIn] = useState<string>(application?.drop_in_program ?? '')
  const [isUpdatingDropIn, setIsUpdatingDropIn] = useState(false)
  const [dropInUpdateError, setDropInUpdateError] = useState<string | null>(null)

  const [healthForms, setHealthForms] = useState<FileObject[]>([])
  const [isLoadingHealthForms, setIsLoadingHealthForms] = useState(false)
  const [isUploadingHealthForm, setIsUploadingHealthForm] = useState(false)
  const [isDraggingHealthForm, setIsDraggingHealthForm] = useState(false)
  const [deletingHealthFormPath, setDeletingHealthFormPath] = useState<string | null>(null)
  const [healthFormError, setHealthFormError] = useState<string | null>(null)
  const [loadingHealthFormPreviewPath, setLoadingHealthFormPreviewPath] = useState<string | null>(null)
  const healthFormInputRef = useRef<HTMLInputElement>(null)
  const MAX_HEALTH_FORM_FILES = 10
  const HEALTH_FORM_MAX_FILE_SIZE = 10 * 1024 * 1024
  const HEALTH_FORM_ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic']

  useEffect(() => {
    if (!application?.approved) {
      setEnrollmentData(null)
      setSiblingApps([])
      return
    }

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const load = async () => {
      // Cache hit — use immediately, no loading state
      const cached = enrollmentCache.get(application.user_id)
      if (cached) {
        setSiblingApps(cached.siblingApps)
        setEnrollmentData(cached)
        return
      }

      setEnrollmentLoading(true)
      try {
        const { data: appRows } = await supabase
          .schema('parent_app')
          .from('applications')
          .select('id, user_id, student_id, child_legal_name, preferred_name, registration_fee_paid')
          .eq('user_id', application.user_id)
          .eq('approved', true)

        const validApps: ApprovedApplication[] = (appRows ?? []).filter(
          (a): a is ApprovedApplication => a.student_id != null
        )

        const studentIds = validApps.map((a) => a.student_id)

        if (studentIds.length === 0) {
          const result: CachedEnrollmentData = {
            signaturesByStudent: {},
            immunizationFileCountByStudent: {},
            religiousExemptionCountByStudent: {},
            healthInfoByStudent: {},
            medicationPlanByStudent: {},
            photoConsentByStudent: {},
            authorizedPickupByStudent: {},
            healthStatementByStudent: {},
            registrationFeePaidByStudent: {},
            siblingApps: validApps,
          }
          enrollmentCache.set(application.user_id, result)
          setSiblingApps(validApps)
          setEnrollmentData(result)
          setEnrollmentLoading(false)
          return
        }

        const registrationFeePaidByStudent: Record<string, boolean> = {}
        for (const a of validApps) {
          registrationFeePaidByStudent[a.student_id] = a.registration_fee_paid ?? false
        }

        const data = await getAdminEnrollmentData(application.user_id, studentIds)
        const result = { ...data, registrationFeePaidByStudent, siblingApps: validApps }
        enrollmentCache.set(application.user_id, result)
        setEnrollmentData(result)
        setSiblingApps(validApps)
      } catch (err) {
        console.error('Failed to load enrollment data', err)
        setEnrollmentData(null)
      } finally {
        setEnrollmentLoading(false)
      }
    }

    load()
  }, [application?.id, application?.approved, application?.user_id])

  useEffect(() => {
    setIsEditingProgram(false)
    setSelectedProgram(application?.program ?? '')
    setProgramUpdateError(null)
    setIsEditingDropIn(false)
    setSelectedDropIn(application?.drop_in_program ?? '')
    setDropInUpdateError(null)
  }, [application?.id])

  useEffect(() => {
    setNotes([])
    setNewNote('')
    if (application?.id) {
      getApplicationNotes(application.id).then((res) => {
        if (res.notes) setNotes(res.notes)
      })
    }
  }, [application?.id])

  useEffect(() => {
    setHealthForms([])
    setHealthFormError(null)
    if (!application?.approved || !application?.student_id) return
    const studentId = application.student_id
    setIsLoadingHealthForms(true)
    listHealthInfoForms(studentId).then((res) => {
      if (res.error) setHealthFormError(res.error)
      else setHealthForms(res.files as FileObject[])
      setIsLoadingHealthForms(false)
    })
  }, [application?.id])

  if (!application) return null

  const loadHealthForms = async () => {
    if (!application.student_id) return
    setIsLoadingHealthForms(true)
    const res = await listHealthInfoForms(application.student_id)
    if (res.error) setHealthFormError(res.error)
    else setHealthForms(res.files as FileObject[])
    setIsLoadingHealthForms(false)
  }

  const handleHealthFormUpload = async (file: File) => {
    if (!application.student_id) return
    if (!HEALTH_FORM_ACCEPTED_TYPES.includes(file.type)) {
      setHealthFormError('File type not supported. Use PDF, JPEG, PNG, WEBP, or HEIC.')
      return
    }
    if (file.size > HEALTH_FORM_MAX_FILE_SIZE) {
      setHealthFormError('File exceeds 10 MB limit.')
      return
    }
    if (healthForms.length >= MAX_HEALTH_FORM_FILES) {
      setHealthFormError(`Maximum ${MAX_HEALTH_FORM_FILES} files allowed.`)
      return
    }
    setHealthFormError(null)
    setIsUploadingHealthForm(true)
    const fd = new FormData()
    fd.append('studentId', application.student_id)
    fd.append('file', file)
    const result = await uploadHealthInfoForm(fd)
    if ('error' in result && result.error) setHealthFormError(result.error)
    else await loadHealthForms()
    setIsUploadingHealthForm(false)
  }

  const handleHealthFormDelete = async (path: string) => {
    setDeletingHealthFormPath(path)
    const result = await deleteHealthInfoForm(path)
    if ('error' in result && result.error) setHealthFormError(result.error)
    else await loadHealthForms()
    setDeletingHealthFormPath(null)
  }

  const handleHealthFormDownload = async (path: string) => {
    setLoadingHealthFormPreviewPath(path)
    const result = await getHealthInfoFormUrl(path)
    setLoadingHealthFormPreviewPath(null)
    if ('error' in result) {
      setHealthFormError(result.error ?? 'Unknown error')
      return
    }
    if ('url' in result && result.url) window.open(result.url, '_blank')
  }

  const isActioned = application.approved || application.denied

  const handleAddNote = async () => {
    if (!newNote.trim()) return
    setIsAddingNote(true)
    setAddNoteError(null)
    const result = await addApplicationNote(application.id, newNote.trim())
    setIsAddingNote(false)
    if (result.note) {
      setNotes((prev) => [result.note!, ...prev])
      setNewNote('')
    } else {
      setAddNoteError(result.error ?? 'Failed to add note')
    }
  }

  const handleApprove = async () => {
    if (isApproving || isActioned) return
    setIsApproving(true)
    setApproveError(null)
    const result = await approveApplication(application.id)
    setIsApproving(false)
    if (result.success) {
      onApproved(application.id)
    } else {
      setApproveError(result.error ?? 'Failed to approve')
    }
  }

  const handleDeactivate = async () => {
    if (isDeactivating) return
    setIsDeactivating(true)
    const result = await deactivateApplication(application.id)
    setIsDeactivating(false)
    if (result.success) {
      onDeactivated(application.id)
    }
  }

  const handleDenyConfirm = async () => {
    if (isDenying || !denyReason.trim()) return
    setIsDenying(true)
    setDenyError(null)
    const result = await denyApplication(application.id, denyReason.trim())
    setIsDenying(false)
    if (result.success) {
      onDenied(application.id, denyReason.trim())
      setIsDenyingMode(false)
      setDenyReason('')
    } else {
      setDenyError(result.error ?? 'Failed to deny')
    }
  }

  const handleEnroll = async () => {
    if (isEnrolling) return
    setIsEnrolling(true)
    setEnrollError(null)
    const result = await enrollApplication(application.id)
    setIsEnrolling(false)
    if (result.success) {
      onEnrolled(application.id)
    } else {
      setEnrollError(result.error ?? 'Failed to enroll')
    }
  }

  const handleProgramChange = async () => {
    if (!selectedProgram || selectedProgram === application.program) {
      setIsEditingProgram(false)
      return
    }
    setIsUpdatingProgram(true)
    setProgramUpdateError(null)
    const result = await updateApplicationProgram(
      application.id,
      selectedProgram as 'summer_26' | 'school_year_26_27' | 'both' | 'homeschool_drop_in'
    )
    setIsUpdatingProgram(false)
    if (result.success) {
      setIsEditingProgram(false)
      onProgramChanged?.(application.id, selectedProgram)
    } else {
      setProgramUpdateError(result.error ?? 'Failed to update program')
    }
  }

  const handleDropInChange = async () => {
    if (!selectedDropIn || selectedDropIn === application.drop_in_program) {
      setIsEditingDropIn(false)
      return
    }
    setIsUpdatingDropIn(true)
    setDropInUpdateError(null)
    const result = await updateApplicationDropInProgram(
      application.id,
      selectedDropIn as 'summer_26' | 'school_year_26_27' | 'both'
    )
    setIsUpdatingDropIn(false)
    if (result.success) {
      setIsEditingDropIn(false)
      onDropInChanged?.(application.id, selectedDropIn)
    } else {
      setDropInUpdateError(result.error ?? 'Failed to update drop-in program')
    }
  }

  const handleSendRegFeeConfirmation = async () => {
    if (regFeeSending || !application.g1_email) return
    setRegFeeSending(true)
    setRegFeeError(null)
    const feeStr = (PROGRAM_FEES[application.program ?? ''] ?? '$0').replace('$', '')
    const result = await sendRegistrationFeeConfirmationEmail({
      g1FullName: application.g1_full_name ?? '',
      childLegalName: application.child_legal_name ?? '',
      program: application.program,
      amountDollars: feeStr,
      email: application.g1_email,
    })
    setRegFeeSending(false)
    if (result.success) {
      setRegFeeSent(true)
      setEmailThreadKey(k => k + 1)
      setTimeout(() => setRegFeeSent(false), 3000)
    } else {
      setRegFeeError(result.error ?? 'Failed to send')
    }
  }

  const handleSendDropInConfirmation = async () => {
    if (dropInConfirmSending || !application.g1_email) return
    setDropInConfirmSending(true)
    setDropInConfirmError(null)
    const result = await sendHomeschoolDropInConfirmationEmail({
      g1FullName: application.g1_full_name ?? '',
      childLegalName: application.child_legal_name ?? '',
      email: application.g1_email,
      applicationId: application.id,
    })
    setDropInConfirmSending(false)
    if (result.success) {
      setDropInConfirmSent(true)
      setEmailThreadKey(k => k + 1)
      setTimeout(() => setDropInConfirmSent(false), 3000)
    } else {
      setDropInConfirmError(result.error ?? 'Failed to send')
    }
  }

  const handleSendEnrollmentConfirmation = async () => {
    if (confirmationSending || !application.g1_email) return
    setConfirmationSending(true)
    setConfirmationError(null)
    const result = await sendEnrollmentConfirmationEmail({
      g1FullName: application.g1_full_name ?? '',
      childLegalName: application.child_legal_name ?? '',
      program: application.program,
      email: application.g1_email,
    })
    setConfirmationSending(false)
    if (result.success) {
      setConfirmationSent(true)
      setEmailThreadKey(k => k + 1)
      setTimeout(() => setConfirmationSent(false), 3000)
    } else {
      setConfirmationError(result.error ?? 'Failed to send')
    }
  }

  const handleSendInfoSessionInvite = async () => {
    if (infoSessionSending || !application.g1_email) return
    setInfoSessionSending(true)
    setInfoSessionError(null)
    const result = await sendInfoSessionInviteEmail({
      name: application.g1_full_name ?? '',
      email: application.g1_email,
    })
    setInfoSessionSending(false)
    if (result.success) {
      setInfoSessionSent(true)
      setEmailThreadKey(k => k + 1)
      setTimeout(() => setInfoSessionSent(false), 3000)
    } else {
      setInfoSessionError(result.error ?? 'Failed to send')
    }
  }

  const handleSendEnrollmentReminder = async () => {
    if (reminderSending || !application.g1_email) return
    setReminderSending(true)
    setReminderError(null)
    const result = await sendEnrollmentReminderEmail({
      g1FullName: application.g1_full_name ?? '',
      childLegalName: application.child_legal_name ?? '',
      program: application.program,
      email: application.g1_email,
    })
    setReminderSending(false)
    if (result.success) {
      setReminderSent(true)
      setEmailThreadKey(k => k + 1)
      setTimeout(() => setReminderSent(false), 3000)
    } else {
      setReminderError(result.error ?? 'Failed to send')
    }
  }

  const handleSendEnrollmentReminder2 = async () => {
    if (reminder2Sending || !application.g1_email) return
    setReminder2Sending(true)
    setReminder2Error(null)
    const result = await sendEnrollmentReminder2Email({
      g1FullName: application.g1_full_name ?? '',
      childLegalName: application.child_legal_name ?? '',
      program: application.program,
      email: application.g1_email,
    })
    setReminder2Sending(false)
    if (result.success) {
      setReminder2Sent(true)
      setEmailThreadKey(k => k + 1)
      setTimeout(() => setReminder2Sent(false), 3000)
    } else {
      setReminder2Error(result.error ?? 'Failed to send')
    }
  }

  const handleSendEnrollmentReminder3 = async () => {
    if (reminder3Sending || !application.g1_email) return
    setReminder3Sending(true)
    setReminder3Error(null)
    const result = await sendEnrollmentReminder3Email({
      g1FullName: application.g1_full_name ?? '',
      childLegalName: application.child_legal_name ?? '',
      program: application.program,
      email: application.g1_email,
    })
    setReminder3Sending(false)
    if (result.success) {
      setReminder3Sent(true)
      setEmailThreadKey(k => k + 1)
      setTimeout(() => setReminder3Sent(false), 3000)
    } else {
      setReminder3Error(result.error ?? 'Failed to send')
    }
  }

  const handleSendPaySummerTuition = async () => {
    if (summerTuitionSending || !application.g1_email) return
    setSummerTuitionSending(true)
    setSummerTuitionError(null)
    const result = await sendPaySummerTuitionEmail({
      g1FullName: application.g1_full_name ?? '',
      childLegalName: application.child_legal_name ?? '',
      email: application.g1_email,
    })
    setSummerTuitionSending(false)
    if (result.success) {
      setSummerTuitionSent(true)
      setEmailThreadKey(k => k + 1)
      setTimeout(() => setSummerTuitionSent(false), 3000)
    } else {
      setSummerTuitionError(result.error ?? 'Failed to send')
    }
  }

  const handleSendPaySummerTuition2 = async () => {
    if (summerTuition2Sending || !application.g1_email) return
    setSummerTuition2Sending(true)
    setSummerTuition2Error(null)
    const result = await sendPaySummerTuitionEmail2({
      g1FullName: application.g1_full_name ?? '',
      childLegalName: application.child_legal_name ?? '',
      email: application.g1_email,
    })
    setSummerTuition2Sending(false)
    if (result.success) {
      setSummerTuition2Sent(true)
      setEmailThreadKey(k => k + 1)
      setTimeout(() => setSummerTuition2Sent(false), 3000)
    } else {
      setSummerTuition2Error(result.error ?? 'Failed to send')
    }
  }

  const handleSendSummerWelcome = async () => {
    if (summerWelcomeSending || !application.g1_email) return
    setSummerWelcomeSending(true)
    setSummerWelcomeError(null)
    const result = await sendSummerWelcomeEmail({
      g1FullName: application.g1_full_name ?? '',
      childLegalName: application.child_legal_name ?? '',
      email: application.g1_email,
    })
    setSummerWelcomeSending(false)
    if (result.success) {
      setSummerWelcomeSent(true)
      setEmailThreadKey(k => k + 1)
      setTimeout(() => setSummerWelcomeSent(false), 3000)
    } else {
      setSummerWelcomeError(result.error ?? 'Failed to send')
    }
  }

  const handleSendTuitionDueReminder = async () => {
    if (tuitionDueSending || !application.g1_email) return
    setTuitionDueSending(true)
    setTuitionDueError(null)
    const result = await sendSummerTuitionDueDateReminderEmail({
      g1FullName: application.g1_full_name ?? '',
      childLegalName: application.child_legal_name ?? '',
      email: application.g1_email,
    })
    setTuitionDueSending(false)
    if (result.success) {
      setTuitionDueSent(true)
      setEmailThreadKey(k => k + 1)
      setTimeout(() => setTuitionDueSent(false), 3000)
    } else {
      setTuitionDueError(result.error ?? 'Failed to send')
    }
  }

  const handleSendTuitionDueTodayReminder = async () => {
    if (tuitionDueTodaySending || !application.g1_email) return
    setTuitionDueTodaySending(true)
    setTuitionDueTodayError(null)
    const result = await sendSummerTuitionDueDateTodayReminderEmail({
      g1FullName: application.g1_full_name ?? '',
      childLegalName: application.child_legal_name ?? '',
      email: application.g1_email,
    })
    setTuitionDueTodaySending(false)
    if (result.success) {
      setTuitionDueTodaySent(true)
      setEmailThreadKey(k => k + 1)
      setTimeout(() => setTuitionDueTodaySent(false), 3000)
    } else {
      setTuitionDueTodayError(result.error ?? 'Failed to send')
    }
  }

  const handleSendSummerStarting = async () => {
    if (summerStartingSending || !application.g1_email) return
    setSummerStartingSending(true)
    setSummerStartingError(null)
    const result = await sendSummerStartingEmail({
      g1FullName: application.g1_full_name ?? '',
      childLegalName: application.child_legal_name ?? '',
      email: application.g1_email,
      program: application.program,
    })
    setSummerStartingSending(false)
    if (result.success) {
      setSummerStartingSent(true)
      setEmailThreadKey(k => k + 1)
      setTimeout(() => setSummerStartingSent(false), 3000)
    } else {
      setSummerStartingError(result.error ?? 'Failed to send')
    }
  }

  const handleSendSummerFirstDay = async () => {
    if (summerFirstDaySending || !application.g1_email) return
    setSummerFirstDaySending(true)
    setSummerFirstDayError(null)
    const result = await sendSummerFirstDayEmail({
      g1FullName: application.g1_full_name ?? '',
      childLegalName: application.child_legal_name ?? '',
      email: application.g1_email,
    })
    setSummerFirstDaySending(false)
    if (result.success) {
      setSummerFirstDaySent(true)
      setEmailThreadKey(k => k + 1)
      setTimeout(() => setSummerFirstDaySent(false), 3000)
    } else {
      setSummerFirstDayError(result.error ?? 'Failed to send')
    }
  }

  const handleSendFreeFriday = async () => {
    if (freeFridaySending || !application.g1_email) return
    setFreeFridaySending(true)
    setFreeFridayError(null)
    const result = await sendFreeFridayAnnouncementEmail({
      parentName: application.g1_full_name ?? '',
      childName: application.child_legal_name ?? '',
      email: application.g1_email,
    })
    setFreeFridaySending(false)
    if (result.success) {
      setFreeFridaySent(true)
      setEmailThreadKey(k => k + 1)
      setTimeout(() => setFreeFridaySent(false), 3000)
    } else {
      setFreeFridayError(result.error ?? 'Failed to send')
    }
  }

  const handleSendSummerTuitionConfirmation = async () => {
    if (summerTuitionConfirmSending || !application.g1_email) return
    setSummerTuitionConfirmSending(true)
    setSummerTuitionConfirmError(null)
    const result = await sendSummerTuitionConfirmationEmail({
      parentId: application.user_id,
      applicationId: application.id,
      g1FullName: application.g1_full_name ?? '',
      childLegalName: application.child_legal_name ?? '',
      email: application.g1_email,
    })
    setSummerTuitionConfirmSending(false)
    if (result.success) {
      setSummerTuitionConfirmSent(true)
      setEmailThreadKey(k => k + 1)
      setTimeout(() => setSummerTuitionConfirmSent(false), 3000)
    } else {
      setSummerTuitionConfirmError(result.error ?? 'Failed to send')
    }
  }

  const handleSendFunFridayConfirmation = async () => {
    if (funFridayConfirmSending || !application.g1_email) return
    setFunFridayConfirmSending(true)
    setFunFridayConfirmError(null)
    const result = await sendFunFridayConfirmationEmail({
      g1FullName: application.g1_full_name ?? '',
      childLegalName: application.child_legal_name ?? '',
      email: application.g1_email,
      applicationId: application.id,
    })
    setFunFridayConfirmSending(false)
    if (result.success) {
      setFunFridayConfirmSent(true)
      setEmailThreadKey(k => k + 1)
      setTimeout(() => setFunFridayConfirmSent(false), 3000)
    } else {
      setFunFridayConfirmError(result.error ?? 'Failed to send')
    }
  }

  const handleSendSchoolYearCommitment = async () => {
    if (schoolYearCommitmentSending || !application.g1_email) return
    setSchoolYearCommitmentSending(true)
    setSchoolYearCommitmentError(null)
    const result = await sendSchoolYearCommitmentEmail({
      g1FullName: application.g1_full_name ?? '',
      childLegalName: application.child_legal_name ?? '',
      email: application.g1_email,
    })
    setSchoolYearCommitmentSending(false)
    if (result.success) {
      setSchoolYearCommitmentSent(true)
      setEmailThreadKey(k => k + 1)
      setTimeout(() => setSchoolYearCommitmentSent(false), 3000)
    } else {
      setSchoolYearCommitmentError(result.error ?? 'Failed to send')
    }
  }

  const handleSendGoogleReviewIncentive = async () => {
    if (googleReviewSending || !application.g1_email) return
    setGoogleReviewSending(true)
    setGoogleReviewError(null)
    const result = await sendGoogleReviewIncentiveEmail({
      g1FullName: application.g1_full_name ?? '',
      childLegalName: application.child_legal_name ?? '',
      email: application.g1_email,
    })
    setGoogleReviewSending(false)
    if (result.success) {
      setGoogleReviewSent(true)
      setEmailThreadKey(k => k + 1)
      setTimeout(() => setGoogleReviewSent(false), 3000)
    } else {
      setGoogleReviewError(result.error ?? 'Failed to send')
    }
  }

  async function handleSendMeetJoy() {
    if (!application?.g1_email) return
    setMeetJoySending(true)
    setMeetJoyError(null)
    const result = await sendMeetTheTeacherJoyEmail({
      parentName: application.g1_full_name ?? '',
      email: application.g1_email,
    })
    setMeetJoySending(false)
    if (result.success) {
      setMeetJoySent(true)
      setEmailThreadKey(k => k + 1)
      setTimeout(() => setMeetJoySent(false), 3000)
    } else {
      setMeetJoyError(result.error ?? 'Failed to send')
    }
  }

  async function handleSendMeetJoyReminder() {
    if (!application?.g1_email) return
    setMeetJoyReminderSending(true)
    setMeetJoyReminderError(null)
    const result = await sendMeetTheTeacherJoyReminderEmail({
      parentName: application.g1_full_name ?? '',
      email: application.g1_email,
    })
    setMeetJoyReminderSending(false)
    if (result.success) {
      setMeetJoyReminderSent(true)
      setEmailThreadKey(k => k + 1)
      setTimeout(() => setMeetJoyReminderSent(false), 3000)
    } else {
      setMeetJoyReminderError(result.error ?? 'Failed to send')
    }
  }

  const handleSendSchoolYearTuitionInfo = async () => {
    if (schoolYearTuitionInfoSending || !application.g1_email) return
    setSchoolYearTuitionInfoSending(true)
    setSchoolYearTuitionInfoError(null)
    const result = await sendSchoolYearTuitionInfoEmail({
      g1FullName: application.g1_full_name ?? '',
      childLegalName: application.child_legal_name ?? '',
      email: application.g1_email,
    })
    setSchoolYearTuitionInfoSending(false)
    if (result.success) {
      setSchoolYearTuitionInfoSent(true)
      setEmailThreadKey(k => k + 1)
    } else {
      setSchoolYearTuitionInfoError(result.error ?? 'Failed to send')
    }
  }

  const handleSendSchoolYearTuitionClarification = async () => {
    if (schoolYearTuitionClarificationSending || !application.g1_email) return
    setSchoolYearTuitionClarificationSending(true)
    setSchoolYearTuitionClarificationError(null)
    const result = await sendSchoolYearTuitionClarificationEmail({
      g1FullName: application.g1_full_name ?? '',
      childLegalName: application.child_legal_name ?? '',
      email: application.g1_email,
    })
    setSchoolYearTuitionClarificationSending(false)
    if (result.success) {
      setSchoolYearTuitionClarificationSent(true)
      setEmailThreadKey(k => k + 1)
    } else {
      setSchoolYearTuitionClarificationError(result.error ?? 'Failed to send')
    }
  }

  const handleSendWeekOneNewsletter = async () => {
    if (weekOneNewsletterSending || !application.g1_email) return
    setWeekOneNewsletterSending(true)
    setWeekOneNewsletterError(null)
    const result = await sendSummerWeekOneNewsletterEmail({
      g1FullName: application.g1_full_name ?? '',
      childLegalName: application.child_legal_name ?? '',
      email: application.g1_email,
    })
    setWeekOneNewsletterSending(false)
    if (result.success) {
      setWeekOneNewsletterSent(true)
      setEmailThreadKey(k => k + 1)
      setTimeout(() => setWeekOneNewsletterSent(false), 3000)
    } else {
      setWeekOneNewsletterError(result.error ?? 'Failed to send')
    }
  }

  const handleSendWeekTwoNewsletter = async () => {
    if (weekTwoNewsletterSending || !application.g1_email) return
    setWeekTwoNewsletterSending(true)
    setWeekTwoNewsletterError(null)
    const result = await sendSummerWeekTwoNewsletterEmail({
      g1FullName: application.g1_full_name ?? '',
      childLegalName: application.child_legal_name ?? '',
      email: application.g1_email,
    })
    setWeekTwoNewsletterSending(false)
    if (result.success) {
      setWeekTwoNewsletterSent(true)
      setEmailThreadKey(k => k + 1)
      setTimeout(() => setWeekTwoNewsletterSent(false), 3000)
    } else {
      setWeekTwoNewsletterError(result.error ?? 'Failed to send')
    }
  }

  const handleSendWeekThreeNewsletter = async () => {
    if (weekThreeNewsletterSending || !application.g1_email) return
    setWeekThreeNewsletterSending(true)
    setWeekThreeNewsletterError(null)
    const result = await sendSummerWeekThreeNewsletterEmail({
      g1FullName: application.g1_full_name ?? '',
      childLegalName: application.child_legal_name ?? '',
      email: application.g1_email,
    })
    setWeekThreeNewsletterSending(false)
    if (result.success) {
      setWeekThreeNewsletterSent(true)
      setEmailThreadKey(k => k + 1)
      setTimeout(() => setWeekThreeNewsletterSent(false), 3000)
    } else {
      setWeekThreeNewsletterError(result.error ?? 'Failed to send')
    }
  }

  const handleSendWeekFourNewsletter = async () => {
    if (weekFourNewsletterSending || !application.g1_email) return
    setWeekFourNewsletterSending(true)
    setWeekFourNewsletterError(null)
    const result = await sendSummerWeekFourNewsletterEmail({
      g1FullName: application.g1_full_name ?? '',
      childLegalName: application.child_legal_name ?? '',
      email: application.g1_email,
    })
    setWeekFourNewsletterSending(false)
    if (result.success) {
      setWeekFourNewsletterSent(true)
      setEmailThreadKey(k => k + 1)
      setTimeout(() => setWeekFourNewsletterSent(false), 3000)
    } else {
      setWeekFourNewsletterError(result.error ?? 'Failed to send')
    }
  }

  const handleSendWeekFiveNewsletter = async () => {
    if (weekFiveNewsletterSending || !application.g1_email) return
    setWeekFiveNewsletterSending(true)
    setWeekFiveNewsletterError(null)
    const result = await sendSummerWeekFiveNewsletterEmail({
      g1FullName: application.g1_full_name ?? '',
      childLegalName: application.child_legal_name ?? '',
      email: application.g1_email,
    })
    setWeekFiveNewsletterSending(false)
    if (result.success) {
      setWeekFiveNewsletterSent(true)
      setEmailThreadKey(k => k + 1)
      setTimeout(() => setWeekFiveNewsletterSent(false), 3000)
    } else {
      setWeekFiveNewsletterError(result.error ?? 'Failed to send')
    }
  }

  const handleSendWeekSixNewsletter = async () => {
    if (weekSixNewsletterSending || !application.g1_email) return
    setWeekSixNewsletterSending(true)
    setWeekSixNewsletterError(null)
    const result = await sendSummerWeekSixNewsletterEmail({
      g1FullName: application.g1_full_name ?? '',
      childLegalName: application.child_legal_name ?? '',
      email: application.g1_email,
    })
    setWeekSixNewsletterSending(false)
    if (result.success) {
      setWeekSixNewsletterSent(true)
      setEmailThreadKey(k => k + 1)
      setTimeout(() => setWeekSixNewsletterSent(false), 3000)
    } else {
      setWeekSixNewsletterError(result.error ?? 'Failed to send')
    }
  }

  const handleSendWeekSevenNewsletter = async () => {
    if (weekSevenNewsletterSending || !application.g1_email) return
    setWeekSevenNewsletterSending(true)
    setWeekSevenNewsletterError(null)
    const result = await sendSummerWeekSevenNewsletterEmail({
      g1FullName: application.g1_full_name ?? '',
      childLegalName: application.child_legal_name ?? '',
      email: application.g1_email,
    })
    setWeekSevenNewsletterSending(false)
    if (result.success) {
      setWeekSevenNewsletterSent(true)
      setEmailThreadKey(k => k + 1)
      setTimeout(() => setWeekSevenNewsletterSent(false), 3000)
    } else {
      setWeekSevenNewsletterError(result.error ?? 'Failed to send')
    }
  }

  const handleSendOpenHouseEnrollment = async () => {
    if (openHouseSending || !application.g1_email) return
    setOpenHouseSending(true)
    setOpenHouseError(null)
    const result = await sendOpenHouseEnrollmentEmail({
      g1FullName: application.g1_full_name ?? '',
      childLegalName: application.child_legal_name ?? '',
      program: application.program,
      email: application.g1_email,
    })
    setOpenHouseSending(false)
    if (result.success) {
      setOpenHouseSent(true)
      setEmailThreadKey(k => k + 1)
      setTimeout(() => setOpenHouseSent(false), 3000)
    } else {
      setOpenHouseError(result.error ?? 'Failed to send')
    }
  }

  const currentTags = application?.admin_tags ?? []

  const handleAddTag = async (tag: string) => {
    if (!tag || currentTags.includes(tag)) { setTagInput(''); return }
    const next = [...currentTags, tag]
    setTagSaving(true)
    setTagError(null)
    const result = await updateApplicationTags(application!.id, next)
    setTagSaving(false)
    if (result.success) {
      onTagsChanged?.(application!.id, next)
      setTagInput('')
    } else {
      setTagError(result.error ?? 'Failed to save')
    }
  }

  const handleRemoveTag = async (tag: string) => {
    const next = currentTags.filter(t => t !== tag)
    setTagSaving(true)
    setTagError(null)
    const result = await updateApplicationTags(application!.id, next)
    setTagSaving(false)
    if (result.success) {
      onTagsChanged?.(application!.id, next)
    } else {
      setTagError(result.error ?? 'Failed to save')
    }
  }

  const footer = isDenyingMode ? (
    <div className="flex flex-col gap-3 w-full">
      <textarea
        value={denyReason}
        onChange={(e) => setDenyReason(e.target.value)}
        placeholder="Enter reason for denial..."
        rows={3}
        className="w-full text-sm resize-none border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#2C5F2E]/30 focus:border-[#2C5F2E] bg-gray-50"
      />
      {denyError && <span className="text-xs text-red-600">{denyError}</span>}
      <div className="flex gap-2 justify-end">
        <button
          onClick={() => { setIsDenyingMode(false); setDenyReason(''); setDenyError(null) }}
          className="border border-gray-200 text-gray-600 rounded-lg px-3 py-1.5 text-sm hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleDenyConfirm}
          disabled={isDenying || !denyReason.trim()}
          className="bg-red-600 text-white rounded-lg px-4 py-1.5 text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isDenying ? 'Denying...' : 'Confirm Deny'}
        </button>
      </div>
    </div>
  ) : (
    <div className="flex items-center gap-3 w-full">
      {application.is_active !== false && (
        <button
          onClick={handleDeactivate}
          disabled={isDeactivating}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 mr-auto"
        >
          {isDeactivating ? 'Marking inactive...' : 'Mark Inactive'}
        </button>
      )}
      <div className="flex items-center gap-3 ml-auto">
        <div className="text-sm">
          {approveError && <span className="text-red-600">{approveError}</span>}
          {application.denied && (
            <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full bg-red-50 text-red-600 border border-red-200">
              Denied {application.denied_at ? `on ${new Date(application.denied_at).toLocaleDateString()}` : ''}
            </span>
          )}
        </div>
        <button
          onClick={() => setIsDenyingMode(true)}
          disabled={isActioned}
          className="border border-red-200 text-red-600 rounded-lg px-3 py-1.5 text-sm font-semibold hover:bg-red-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {application.denied ? 'Denied' : 'Deny'}
        </button>
        <button
          onClick={handleApprove}
          disabled={isApproving || isActioned}
          className="bg-[#2C5F2E] text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-[#234d25] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isApproving ? 'Approving...' : 'Approve'}
        </button>
      </div>
    </div>
  )

  return (
    <DetailSidebar
      isOpen={true}
      onClose={onClose}
      title="Application Details"
      footer={footer}
    >
      <div className="space-y-4">
        <SidebarSection title="Parent Info">
          <SidebarField label="Full Name" value={application.g1_full_name} />
          <SidebarField label="Email" value={application.g1_email} />
        </SidebarSection>

        <SidebarSection title="Child Info">
          <SidebarField label="Legal Name" value={application.child_legal_name} />
          <SidebarField label="Preferred Name" value={application.preferred_name} />
          <SidebarField
            label="Date of Birth"
            value={
              application.dob_month && application.dob_day && application.dob_year
                ? `${application.dob_month}/${application.dob_day}/${application.dob_year}`
                : null
            }
          />
          <SidebarField label="Age" value={application.child_age} />
          <SidebarField label="Grade" value={application.child_grade} />
          <SidebarField label="Program" value={formatProgram(application.program)} />
          {application.program === 'homeschool_drop_in' && (
            <div className="flex flex-col gap-2">
              <SidebarField label="Drop-In Program" value={formatProgram(application.drop_in_program)} />
              {!isEditingDropIn ? (
                <button
                  onClick={() => { setSelectedDropIn(application.drop_in_program ?? ''); setIsEditingDropIn(true) }}
                  className="self-start text-xs text-[#2C5F2E] border border-[#2C5F2E]/30 rounded-lg px-2.5 py-1 hover:bg-[#2C5F2E]/5 transition-colors"
                >
                  Edit Drop-In Program
                </button>
              ) : (
                <div className="flex flex-col gap-2">
                  <select
                    value={selectedDropIn}
                    onChange={(e) => setSelectedDropIn(e.target.value)}
                    disabled={isUpdatingDropIn}
                    className="text-sm text-gray-900 border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#2C5F2E]/30 focus:border-[#2C5F2E] disabled:opacity-60"
                  >
                    <option value="">— select —</option>
                    {(['summer_26', 'school_year_26_27', 'both'] as const).map((value) => (
                      <option key={value} value={value}>
                        {PROGRAM_LABELS[value]}
                      </option>
                    ))}
                  </select>
                  {dropInUpdateError && <span className="text-xs text-red-600">{dropInUpdateError}</span>}
                  <div className="flex gap-2">
                    <button
                      onClick={handleDropInChange}
                      disabled={isUpdatingDropIn || !selectedDropIn || selectedDropIn === application.drop_in_program}
                      className="text-xs bg-[#2C5F2E] text-white rounded-lg px-3 py-1.5 hover:bg-[#234d25] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isUpdatingDropIn ? 'Saving…' : 'Confirm'}
                    </button>
                    <button
                      onClick={() => { setIsEditingDropIn(false); setSelectedDropIn(application.drop_in_program ?? ''); setDropInUpdateError(null) }}
                      disabled={isUpdatingDropIn}
                      className="text-xs border border-gray-200 text-gray-600 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          <div className="flex flex-col gap-2">
              {!isEditingProgram ? (
                <button
                  onClick={() => { setSelectedProgram(application.program ?? ''); setIsEditingProgram(true) }}
                  className="self-start text-xs text-[#2C5F2E] border border-[#2C5F2E]/30 rounded-lg px-2.5 py-1 hover:bg-[#2C5F2E]/5 transition-colors"
                >
                  Edit Program
                </button>
              ) : (
                <div className="flex flex-col gap-2">
                  <select
                    value={selectedProgram}
                    onChange={(e) => setSelectedProgram(e.target.value)}
                    disabled={isUpdatingProgram}
                    className="text-sm text-gray-900 border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#2C5F2E]/30 focus:border-[#2C5F2E] disabled:opacity-60"
                  >
                    {Object.entries(PROGRAM_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label} — {PROGRAM_FEES[value] ?? 'varies'}
                      </option>
                    ))}
                  </select>
                  {programUpdateError && <span className="text-xs text-red-600">{programUpdateError}</span>}
                  <div className="flex gap-2">
                    <button
                      onClick={handleProgramChange}
                      disabled={isUpdatingProgram || selectedProgram === application.program}
                      className="text-xs bg-[#2C5F2E] text-white rounded-lg px-3 py-1.5 hover:bg-[#234d25] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isUpdatingProgram ? 'Saving…' : 'Confirm'}
                    </button>
                    <button
                      onClick={() => { setIsEditingProgram(false); setSelectedProgram(application.program ?? ''); setProgramUpdateError(null) }}
                      disabled={isUpdatingProgram}
                      className="text-xs border border-gray-200 text-gray-600 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
        </SidebarSection>

        <SidebarSection title="Address">
          <SidebarField label="Street" value={application.address_street} />
          <SidebarField label="City" value={application.address_city} />
          <SidebarField label="State" value={application.address_state} />
          <SidebarField label="ZIP" value={application.address_zip} />
        </SidebarSection>

        <SidebarSection title="Health">
          <SidebarField label="Has Allergies" value={application.has_allergies} />
          <SidebarField label="Allergies Description" value={application.allergies_description} />
          <SidebarField label="Has Medical Conditions" value={application.has_medical_conditions} />
          <SidebarField label="Medical Conditions Description" value={application.medical_conditions_description} />
          <SidebarField label="Has Emergency Medications" value={application.has_emergency_medications} />
          <SidebarField label="Emergency Medications Description" value={application.emergency_medications_description} />
          <SidebarField label="Needs Aide" value={application.needs_aide} />
          <SidebarField label="Aide Description" value={application.needs_aide_description} />
          <SidebarField label="Activities to Avoid" value={application.activities_to_avoid} />
          <SidebarField label="Dysregulation Response" value={application.dysregulation_response} />
          <SidebarField label="Regulation Strategies" value={application.regulation_strategies} />
          <SidebarField label="History Flags" value={application.history_flags} />
          <SidebarField label="History Explanation" value={application.history_explanation} />
          <SidebarField label="Has Custody Orders" value={application.has_custody_orders} />
          <SidebarField label="Custody Orders Description" value={application.custody_orders_description} />
        </SidebarSection>

        <SidebarSection title="Background">
          <SidebarField label="Previously Homeschooled" value={application.is_homeschooled} />
          <SidebarField label="Homeschool Explanation" value={application.homeschool_explanation} />
          <SidebarField label="Previous Schools" value={application.previous_schools} />
          <SidebarField label="Previous Schools List" value={application.previous_schools_list} />
          <SidebarField label="Special Interests" value={application.special_interests} />
          <SidebarField label="Learning Style" value={application.learning_style} />
          <SidebarField label="Strengths & Interests" value={application.strengths_interests} />
          <SidebarField label="Current Challenges" value={application.current_challenges} />
        </SidebarSection>

        <SidebarSection title="Guardian 1">
          <SidebarField label="Name" value={application.g1_full_name} />
          <SidebarField label="Relationship" value={application.g1_relationship} />
          <SidebarField label="Cell Phone" value={application.g1_cell_phone} />
          <SidebarField label="Work Phone" value={application.g1_work_phone} />
          <SidebarField label="Email" value={application.g1_email} />
          <SidebarField label="Has Custody" value={application.g1_has_custody} />
          <SidebarField label="Lives with Child" value={application.g1_lives_with_child} />
          <SidebarField label="Preferred Contact" value={application.g1_preferred_contact} />
        </SidebarSection>

        <SidebarSection title="Guardian 2">
          <SidebarField label="Name" value={application.g2_full_name} />
          <SidebarField label="Relationship" value={application.g2_relationship} />
          <SidebarField label="Cell Phone" value={application.g2_cell_phone} />
          <SidebarField label="Work Phone" value={application.g2_work_phone} />
          <SidebarField label="Email" value={application.g2_email} />
          <SidebarField label="Has Custody" value={application.g2_has_custody} />
          <SidebarField label="Lives with Child" value={application.g2_lives_with_child} />
          <SidebarField label="Preferred Contact" value={application.g2_preferred_contact} />
        </SidebarSection>

        {application.approved && (
          enrollmentLoading ? (
            <div className="space-y-3">
              {/* Header card skeleton */}
              <div className="bg-white border border-gray-200 rounded-2xl px-5 py-4 shadow-sm animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-1/4 mb-3" />
                <div className="h-2 bg-gray-200 rounded-full w-full" />
              </div>
              {/* Checklist row skeletons — 5 rows */}
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-2xl px-5 py-4 shadow-sm animate-pulse flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-gray-200 rounded w-3/4" />
                    <div className="h-2.5 bg-gray-100 rounded w-1/2" />
                  </div>
                  <div className="h-5 w-16 bg-gray-200 rounded-full flex-shrink-0" />
                </div>
              ))}
            </div>
          ) : enrollmentData ? (
            <EnrollmentProgressCard
              apps={siblingApps}
              signaturesByStudent={enrollmentData.signaturesByStudent}
              immunizationFileCountByStudent={enrollmentData.immunizationFileCountByStudent}
              registrationFeePaidByStudent={enrollmentData.registrationFeePaidByStudent}
              initialActiveStudentId={application.student_id ?? undefined}
              onItemClick={(itemId, studentId) => {
                onItemClick(itemId, studentId, enrollmentData ? { ...enrollmentData, siblingApps } : null)
              }}
            />
          ) : null
        )}

        {application.approved && application.status !== 'enrolled' && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleEnroll}
              disabled={isEnrolling}
              className="text-xs text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {isEnrolling ? 'Enrolling…' : 'Mark as Enrolled'}
            </button>
            {enrollError && <span className="text-xs text-red-600">{enrollError}</span>}
          </div>
        )}

        {application.approved && application.student_id && (
          <SidebarSection title="Health Info Forms">
            {isLoadingHealthForms ? (
              <p className="text-xs text-gray-400">Loading…</p>
            ) : healthForms.length > 0 ? (
              <div className="flex flex-col gap-1.5 mb-3">
                {healthForms.map((f) => {
                  const filePath = `forms/${application.student_id}/${f.name}`
                  return (
                    <div key={f.name} className="flex items-center gap-2 px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg">
                      <span className="text-xs text-gray-700 flex-1 truncate min-w-0">
                        {f.name.replace(/^\d+-/, '')}
                      </span>
                      <button
                        onClick={() => handleHealthFormDownload(filePath)}
                        disabled={loadingHealthFormPreviewPath === filePath}
                        className="text-gray-400 hover:text-gray-600 disabled:opacity-40 flex-shrink-0 text-xs underline"
                        title="Open"
                      >
                        Open
                      </button>
                      <button
                        onClick={() => handleHealthFormDelete(filePath)}
                        disabled={deletingHealthFormPath === filePath}
                        className="text-gray-400 hover:text-red-500 disabled:opacity-40 flex-shrink-0 text-xs"
                        title="Delete"
                      >
                        {deletingHealthFormPath === filePath ? '…' : '✕'}
                      </button>
                    </div>
                  )
                })}
              </div>
            ) : null}

            {healthForms.length < MAX_HEALTH_FORM_FILES && (
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDraggingHealthForm(true) }}
                onDragLeave={() => setIsDraggingHealthForm(false)}
                onDrop={(e) => {
                  e.preventDefault()
                  setIsDraggingHealthForm(false)
                  const f = e.dataTransfer.files[0]
                  if (f) handleHealthFormUpload(f)
                }}
                onClick={() => { if (!isUploadingHealthForm) healthFormInputRef.current?.click() }}
                className={[
                  'border-2 border-dashed rounded-lg px-3 py-4 text-center transition-colors',
                  isDraggingHealthForm ? 'border-[#2C5F2E] bg-green-50' : 'border-gray-200 bg-gray-50 hover:border-[#2C5F2E]/50',
                  isUploadingHealthForm ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer',
                ].join(' ')}
              >
                <p className="text-xs text-gray-400">
                  {isUploadingHealthForm ? 'Uploading…' : 'Drop a file or click to upload'}
                </p>
                <p className="text-xs text-gray-300 mt-0.5">PDF, JPEG, PNG, WEBP, HEIC · max 10 MB</p>
              </div>
            )}

            <input
              ref={healthFormInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp,.heic"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) handleHealthFormUpload(f)
                e.target.value = ''
              }}
            />
            {healthFormError && <p className="text-xs text-red-500 mt-1">{healthFormError}</p>}
          </SidebarSection>
        )}

        <SidebarSection title="Tags">
          <div className="flex flex-wrap gap-1.5 mb-3">
            {PRESET_TAGS.map(tag => {
              const active = currentTags.includes(tag)
              return (
                <button
                  key={tag}
                  onClick={() => active ? handleRemoveTag(tag) : handleAddTag(tag)}
                  disabled={tagSaving}
                  className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full border transition-colors disabled:opacity-50 ${
                    active
                      ? 'bg-violet-600 text-white border-violet-600'
                      : 'bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100'
                  }`}
                >
                  {active ? '✓ ' : ''}{tag}
                </button>
              )
            })}
          </div>
          {currentTags.filter(t => !PRESET_TAGS.includes(t)).length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {currentTags.filter(t => !PRESET_TAGS.includes(t)).map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-violet-50 text-violet-700 border border-violet-200"
                >
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    disabled={tagSaving}
                    className="ml-0.5 text-violet-400 hover:text-violet-700 transition-colors disabled:opacity-50"
                    aria-label={`Remove tag ${tag}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(tagInput.trim()) } }}
              placeholder="Custom tag…"
              className="flex-1 text-xs border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400 bg-white text-gray-900 placeholder:text-gray-400"
            />
            <button
              onClick={() => handleAddTag(tagInput.trim())}
              disabled={tagSaving || !tagInput.trim()}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-violet-600 text-white hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {tagSaving ? '…' : 'Add'}
            </button>
          </div>
          {tagError && <p className="text-xs text-red-600 mt-1">{tagError}</p>}
        </SidebarSection>

        {application.approved && application.g1_email && (
          <SidebarSection title="Outreach">
            {/* Tab bar */}
            <div className="flex gap-1 mb-3 flex-wrap">
              {(['enrollment', 'summer', 'newsletters', 'other'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setOutreachTab(tab)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md capitalize transition-colors ${
                    outreachTab === tab
                      ? 'bg-[#2C5F2E] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {tab === 'enrollment' ? 'Enrollment' : tab === 'summer' ? 'Summer' : tab === 'newsletters' ? 'Newsletters' : 'Other'}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-3">
              {outreachTab === 'enrollment' && <>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleSendRegFeeConfirmation}
                    disabled={regFeeSending || regFeeSent}
                    className="px-3 py-1.5 text-sm font-semibold text-white rounded-lg transition-colors hover:bg-[#234d25] disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: '#2C5F2E', border: 'none', borderRadius: '8px' }}
                  >
                    {regFeeSending ? 'Sending…' : regFeeSent ? '✓ Sent!' : 'Send Reg Fee Confirmation'}
                  </button>
                  {regFeeError && <span className="text-xs text-red-600">{regFeeError}</span>}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleSendEnrollmentReminder}
                    disabled={reminderSending || reminderSent}
                    className="px-3 py-1.5 text-sm font-semibold text-white rounded-lg transition-colors hover:bg-[#234d25] disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: '#2C5F2E', border: 'none', borderRadius: '8px' }}
                  >
                    {reminderSending ? 'Sending…' : reminderSent ? '✓ Sent!' : 'Send Enrollment Reminder'}
                  </button>
                  {reminderError && <span className="text-xs text-red-600">{reminderError}</span>}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleSendEnrollmentReminder2}
                    disabled={reminder2Sending || reminder2Sent}
                    className="px-3 py-1.5 text-sm font-semibold text-white rounded-lg transition-colors hover:bg-[#234d25] disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: '#2C5F2E', border: 'none', borderRadius: '8px' }}
                  >
                    {reminder2Sending ? 'Sending…' : reminder2Sent ? '✓ Sent!' : 'Send Enrollment Reminder 2'}
                  </button>
                  {reminder2Error && <span className="text-xs text-red-600">{reminder2Error}</span>}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleSendEnrollmentReminder3}
                    disabled={reminder3Sending || reminder3Sent}
                    className="px-3 py-1.5 text-sm font-semibold text-white rounded-lg transition-colors hover:bg-[#234d25] disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: '#2C5F2E', border: 'none', borderRadius: '8px' }}
                  >
                    {reminder3Sending ? 'Sending…' : reminder3Sent ? '✓ Sent!' : 'Send Enrollment Reminder 3'}
                  </button>
                  {reminder3Error && <span className="text-xs text-red-600">{reminder3Error}</span>}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleSendEnrollmentConfirmation}
                    disabled={confirmationSending || confirmationSent}
                    className="px-3 py-1.5 text-sm font-semibold text-white rounded-lg transition-colors hover:bg-[#234d25] disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: '#2C5F2E', border: 'none', borderRadius: '8px' }}
                  >
                    {confirmationSending ? 'Sending…' : confirmationSent ? '✓ Sent!' : 'Send Enrollment Confirmation'}
                  </button>
                  {confirmationError && <span className="text-xs text-red-600">{confirmationError}</span>}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleSendInfoSessionInvite}
                    disabled={infoSessionSending || infoSessionSent}
                    className="px-3 py-1.5 text-sm font-semibold text-white rounded-lg transition-colors hover:bg-[#234d25] disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: '#2C5F2E', border: 'none', borderRadius: '8px' }}
                  >
                    {infoSessionSending ? 'Sending…' : infoSessionSent ? '✓ Sent!' : 'Send Info Session Invite'}
                  </button>
                  {infoSessionError && <span className="text-xs text-red-600">{infoSessionError}</span>}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleSendOpenHouseEnrollment}
                    disabled={openHouseSending || openHouseSent}
                    className="px-3 py-1.5 text-sm font-semibold text-white rounded-lg transition-colors hover:bg-[#234d25] disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: '#2C5F2E', border: 'none', borderRadius: '8px' }}
                  >
                    {openHouseSending ? 'Sending…' : openHouseSent ? '✓ Sent!' : 'Send Open House Follow-Up'}
                  </button>
                  {openHouseError && <span className="text-xs text-red-600">{openHouseError}</span>}
                </div>
                {application.program === 'homeschool_drop_in' && (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleSendDropInConfirmation}
                      disabled={dropInConfirmSending || dropInConfirmSent}
                      className="px-3 py-1.5 text-sm font-semibold text-white rounded-lg transition-colors hover:bg-[#234d25] disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ backgroundColor: '#2C5F2E', border: 'none', borderRadius: '8px' }}
                    >
                      {dropInConfirmSending ? 'Sending…' : dropInConfirmSent ? '✓ Sent!' : 'Send Drop-In Payment Confirmation'}
                    </button>
                    {dropInConfirmError && <span className="text-xs text-red-600">{dropInConfirmError}</span>}
                  </div>
                )}
              </>}

              {outreachTab === 'summer' && <>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleSendSchoolYearCommitment}
                    disabled={schoolYearCommitmentSending || schoolYearCommitmentSent}
                    className="px-3 py-1.5 text-sm font-semibold text-white rounded-lg transition-colors hover:bg-[#234d25] disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: '#2C5F2E', border: 'none', borderRadius: '8px' }}
                  >
                    {schoolYearCommitmentSending ? 'Sending…' : schoolYearCommitmentSent ? '✓ Sent!' : 'Send School Year Commitment Request'}
                  </button>
                  {schoolYearCommitmentError && (
                    <span className="text-xs text-red-600">{schoolYearCommitmentError}</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleSendPaySummerTuition}
                    disabled={summerTuitionSending || summerTuitionSent}
                    className="px-3 py-1.5 text-sm font-semibold text-white rounded-lg transition-colors hover:bg-[#234d25] disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: '#2C5F2E', border: 'none', borderRadius: '8px' }}
                  >
                    {summerTuitionSending ? 'Sending…' : summerTuitionSent ? '✓ Sent!' : 'Send Summer Week Selection'}
                  </button>
                  {summerTuitionError && <span className="text-xs text-red-600">{summerTuitionError}</span>}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleSendPaySummerTuition2}
                    disabled={summerTuition2Sending || summerTuition2Sent}
                    className="px-3 py-1.5 text-sm font-semibold text-white rounded-lg transition-colors hover:bg-[#234d25] disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: '#2C5F2E', border: 'none', borderRadius: '8px' }}
                  >
                    {summerTuition2Sending ? 'Sending…' : summerTuition2Sent ? '✓ Sent!' : 'Send Summer Week Selection 2'}
                  </button>
                  {summerTuition2Error && <span className="text-xs text-red-600">{summerTuition2Error}</span>}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleSendSummerWelcome}
                    disabled={summerWelcomeSending || summerWelcomeSent}
                    className="px-3 py-1.5 text-sm font-semibold text-white rounded-lg transition-colors hover:bg-[#234d25] disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: '#2C5F2E', border: 'none', borderRadius: '8px' }}
                  >
                    {summerWelcomeSending ? 'Sending…' : summerWelcomeSent ? '✓ Sent!' : 'Send Summer Welcome'}
                  </button>
                  {summerWelcomeError && <span className="text-xs text-red-600">{summerWelcomeError}</span>}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleSendSummerTuitionConfirmation}
                    disabled={summerTuitionConfirmSending || summerTuitionConfirmSent}
                    className="px-3 py-1.5 text-sm font-semibold text-white rounded-lg transition-colors hover:bg-[#234d25] disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: '#2C5F2E', border: 'none', borderRadius: '8px' }}
                  >
                    {summerTuitionConfirmSending ? 'Sending…' : summerTuitionConfirmSent ? '✓ Sent!' : 'Send Summer Tuition Confirmation'}
                  </button>
                  {summerTuitionConfirmError && <span className="text-xs text-red-600">{summerTuitionConfirmError}</span>}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleSendTuitionDueReminder}
                    disabled={tuitionDueSending || tuitionDueSent}
                    className="px-3 py-1.5 text-sm font-semibold text-white rounded-lg transition-colors hover:bg-[#234d25] disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: '#2C5F2E', border: 'none', borderRadius: '8px' }}
                  >
                    {tuitionDueSending ? 'Sending…' : tuitionDueSent ? '✓ Sent!' : 'Send Summer Tuition Due Date Reminder'}
                  </button>
                  {tuitionDueError && <span className="text-xs text-red-600">{tuitionDueError}</span>}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleSendTuitionDueTodayReminder}
                    disabled={tuitionDueTodaySending || tuitionDueTodaySent}
                    className="px-3 py-1.5 text-sm font-semibold text-white rounded-lg transition-colors hover:bg-[#234d25] disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: '#2C5F2E', border: 'none', borderRadius: '8px' }}
                  >
                    {tuitionDueTodaySending ? 'Sending…' : tuitionDueTodaySent ? '✓ Sent!' : 'Send Tuition Due Today Reminder'}
                  </button>
                  {tuitionDueTodayError && <span className="text-xs text-red-600">{tuitionDueTodayError}</span>}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleSendSummerStarting}
                    disabled={summerStartingSending || summerStartingSent}
                    className="px-3 py-1.5 text-sm font-semibold text-white rounded-lg transition-colors hover:bg-[#234d25] disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: '#2C5F2E', border: 'none', borderRadius: '8px' }}
                  >
                    {summerStartingSending ? 'Sending…' : summerStartingSent ? '✓ Sent!' : 'Send Summer Starting Soon'}
                  </button>
                  {summerStartingError && <span className="text-xs text-red-600">{summerStartingError}</span>}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleSendSummerFirstDay}
                    disabled={summerFirstDaySending || summerFirstDaySent}
                    className="px-3 py-1.5 text-sm font-semibold text-white rounded-lg transition-colors hover:bg-[#234d25] disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: '#2C5F2E', border: 'none', borderRadius: '8px' }}
                  >
                    {summerFirstDaySending ? 'Sending…' : summerFirstDaySent ? '✓ Sent!' : 'Send Summer First Day'}
                  </button>
                  {summerFirstDayError && <span className="text-xs text-red-600">{summerFirstDayError}</span>}
                </div>
              </>}

              {outreachTab === 'newsletters' && <>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleSendWeekOneNewsletter}
                    disabled={weekOneNewsletterSending || weekOneNewsletterSent}
                    className="px-3 py-1.5 text-sm font-semibold text-white rounded-lg transition-colors hover:bg-[#234d25] disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: '#2C5F2E', border: 'none', borderRadius: '8px' }}
                  >
                    {weekOneNewsletterSending ? 'Sending…' : weekOneNewsletterSent ? '✓ Sent!' : 'Send Week One Newsletter'}
                  </button>
                  {weekOneNewsletterError && <span className="text-xs text-red-600">{weekOneNewsletterError}</span>}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleSendWeekTwoNewsletter}
                    disabled={weekTwoNewsletterSending || weekTwoNewsletterSent}
                    className="px-3 py-1.5 text-sm font-semibold text-white rounded-lg transition-colors hover:bg-[#234d25] disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: '#2C5F2E', border: 'none', borderRadius: '8px' }}
                  >
                    {weekTwoNewsletterSending ? 'Sending…' : weekTwoNewsletterSent ? '✓ Sent!' : 'Send Week Two Newsletter'}
                  </button>
                  {weekTwoNewsletterError && <span className="text-xs text-red-600">{weekTwoNewsletterError}</span>}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleSendWeekThreeNewsletter}
                    disabled={weekThreeNewsletterSending || weekThreeNewsletterSent}
                    className="px-3 py-1.5 text-sm font-semibold text-white rounded-lg transition-colors hover:bg-[#234d25] disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: '#2C5F2E', border: 'none', borderRadius: '8px' }}
                  >
                    {weekThreeNewsletterSending ? 'Sending…' : weekThreeNewsletterSent ? '✓ Sent!' : 'Send Week Three Newsletter'}
                  </button>
                  {weekThreeNewsletterError && <span className="text-xs text-red-600">{weekThreeNewsletterError}</span>}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleSendWeekFourNewsletter}
                    disabled={weekFourNewsletterSending || weekFourNewsletterSent}
                    className="px-3 py-1.5 text-sm font-semibold text-white rounded-lg transition-colors hover:bg-[#234d25] disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: '#2C5F2E', border: 'none', borderRadius: '8px' }}
                  >
                    {weekFourNewsletterSending ? 'Sending…' : weekFourNewsletterSent ? '✓ Sent!' : 'Send Week Four Newsletter'}
                  </button>
                  {weekFourNewsletterError && <span className="text-xs text-red-600">{weekFourNewsletterError}</span>}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleSendWeekFiveNewsletter}
                    disabled={weekFiveNewsletterSending || weekFiveNewsletterSent}
                    className="px-3 py-1.5 text-sm font-semibold text-white rounded-lg transition-colors hover:bg-[#234d25] disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: '#2C5F2E', border: 'none', borderRadius: '8px' }}
                  >
                    {weekFiveNewsletterSending ? 'Sending…' : weekFiveNewsletterSent ? '✓ Sent!' : 'Send Week Five Newsletter'}
                  </button>
                  {weekFiveNewsletterError && <span className="text-xs text-red-600">{weekFiveNewsletterError}</span>}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleSendWeekSixNewsletter}
                    disabled={weekSixNewsletterSending || weekSixNewsletterSent}
                    className="px-3 py-1.5 text-sm font-semibold text-white rounded-lg transition-colors hover:bg-[#234d25] disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: '#2C5F2E', border: 'none', borderRadius: '8px' }}
                  >
                    {weekSixNewsletterSending ? 'Sending…' : weekSixNewsletterSent ? '✓ Sent!' : 'Send Week Six Newsletter'}
                  </button>
                  {weekSixNewsletterError && <span className="text-xs text-red-600">{weekSixNewsletterError}</span>}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleSendWeekSevenNewsletter}
                    disabled={weekSevenNewsletterSending || weekSevenNewsletterSent}
                    className="px-3 py-1.5 text-sm font-semibold text-white rounded-lg transition-colors hover:bg-[#234d25] disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: '#2C5F2E', border: 'none', borderRadius: '8px' }}
                  >
                    {weekSevenNewsletterSending ? 'Sending…' : weekSevenNewsletterSent ? '✓ Sent!' : 'Send Week Seven Newsletter'}
                  </button>
                  {weekSevenNewsletterError && <span className="text-xs text-red-600">{weekSevenNewsletterError}</span>}
                </div>
              </>}

              {outreachTab === 'other' && <>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleSendFreeFriday}
                    disabled={freeFridaySending || freeFridaySent}
                    className="px-3 py-1.5 text-sm font-semibold text-white rounded-lg transition-colors hover:bg-[#234d25] disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: '#2C5F2E', border: 'none', borderRadius: '8px' }}
                  >
                    {freeFridaySending ? 'Sending…' : freeFridaySent ? '✓ Sent!' : 'Send Free Friday Announcement'}
                  </button>
                  {freeFridayError && <span className="text-xs text-red-600">{freeFridayError}</span>}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleSendFunFridayConfirmation}
                    disabled={funFridayConfirmSending || funFridayConfirmSent}
                    className="px-3 py-1.5 text-sm font-semibold text-white rounded-lg transition-colors hover:bg-[#234d25] disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: '#2C5F2E', border: 'none', borderRadius: '8px' }}
                  >
                    {funFridayConfirmSending ? 'Sending…' : funFridayConfirmSent ? '✓ Sent!' : 'Send Fun Friday Confirmation'}
                  </button>
                  {funFridayConfirmError && <span className="text-xs text-red-600">{funFridayConfirmError}</span>}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleSendGoogleReviewIncentive}
                    disabled={googleReviewSending || googleReviewSent}
                    className="px-3 py-1.5 text-sm font-semibold text-white rounded-lg transition-colors hover:bg-[#234d25] disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: '#2C5F2E', border: 'none', borderRadius: '8px' }}
                  >
                    {googleReviewSending ? 'Sending…' : googleReviewSent ? '✓ Sent!' : 'Send Google Review Incentive'}
                  </button>
                  {googleReviewError && <span className="text-xs text-red-600">{googleReviewError}</span>}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleSendMeetJoy}
                    disabled={meetJoySending || meetJoySent}
                    className="px-3 py-1.5 text-sm font-semibold text-white rounded-lg transition-colors hover:bg-[#234d25] disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: '#2C5F2E', border: 'none', borderRadius: '8px' }}
                  >
                    {meetJoySending ? 'Sending…' : meetJoySent ? '✓ Sent!' : 'Send Meet Miss Joy Invite'}
                  </button>
                  {meetJoyError && <span className="text-xs text-red-600">{meetJoyError}</span>}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleSendMeetJoyReminder}
                    disabled={meetJoyReminderSending || meetJoyReminderSent}
                    className="px-3 py-1.5 text-sm font-semibold text-white rounded-lg transition-colors hover:bg-[#234d25] disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: '#2C5F2E', border: 'none', borderRadius: '8px' }}
                  >
                    {meetJoyReminderSending ? 'Sending…' : meetJoyReminderSent ? '✓ Sent!' : 'Send Meet Miss Joy Reminder'}
                  </button>
                  {meetJoyReminderError && <span className="text-xs text-red-600">{meetJoyReminderError}</span>}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleSendSchoolYearTuitionInfo}
                    disabled={schoolYearTuitionInfoSending || schoolYearTuitionInfoSent}
                    className="px-3 py-1.5 text-sm font-semibold text-white rounded-lg transition-colors hover:bg-[#234d25] disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: '#2C5F2E', border: 'none', borderRadius: '8px' }}
                  >
                    {schoolYearTuitionInfoSending ? 'Sending…' : schoolYearTuitionInfoSent ? '✓ Sent!' : 'Send School Year Tuition Info'}
                  </button>
                  {schoolYearTuitionInfoError && <span className="text-xs text-red-600">{schoolYearTuitionInfoError}</span>}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleSendSchoolYearTuitionClarification}
                    disabled={schoolYearTuitionClarificationSending || schoolYearTuitionClarificationSent}
                    className="px-3 py-1.5 text-sm font-semibold text-white rounded-lg transition-colors hover:bg-[#234d25] disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: '#2C5F2E', border: 'none', borderRadius: '8px' }}
                  >
                    {schoolYearTuitionClarificationSending ? 'Sending…' : schoolYearTuitionClarificationSent ? '✓ Sent!' : 'Send Tuition Clarification (2nd–4th Grade)'}
                  </button>
                  {schoolYearTuitionClarificationError && <span className="text-xs text-red-600">{schoolYearTuitionClarificationError}</span>}
                </div>
                <div className="flex items-center gap-3">
                  <a
                    href="https://sagefield.co/testimonial"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 text-sm font-semibold text-white rounded-lg transition-colors"
                    style={{ backgroundColor: '#d97706', border: 'none', borderRadius: '8px' }}
                  >
                    ☕ Share Testimonial (Earn $15 Gift Card)
                  </a>
                </div>
              </>}
            </div>
          </SidebarSection>
        )}

        <SidebarSection title="Admin Notes">
          {notes.length > 0 && (
            <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
              {notes.map((note) => (
                <div key={note.id} className="bg-gray-50 rounded-lg px-3 py-2 text-sm">
                  <p className="text-gray-900 whitespace-pre-wrap">{note.content}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(note.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
          <textarea
            value={newNote}
            onChange={(e) => { setNewNote(e.target.value); setAddNoteError(null) }}
            placeholder="Add a note..."
            rows={3}
            className="w-full text-sm resize-none border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2C5F2E]/30 focus:border-[#2C5F2E] bg-white text-gray-900 placeholder:text-gray-400"
          />
          <div className="flex items-center justify-between mt-2">
            {addNoteError
              ? <span className="text-xs text-red-600">{addNoteError}</span>
              : <span />}
            <button
              onClick={handleAddNote}
              disabled={isAddingNote || !newNote.trim()}
              className="bg-[#2C5F2E] text-white rounded-lg px-4 py-1.5 text-sm font-semibold hover:bg-[#234d25] transition-colors disabled:opacity-50"
            >
              {isAddingNote ? 'Adding...' : 'Add Note'}
            </button>
          </div>
        </SidebarSection>

        <SidebarSection title="Payment History">
          <PaymentHistory parentId={application.user_id} />
        </SidebarSection>

        {application.g1_email && (
          <SidebarSection title="Email History">
            <EmailThread key={emailThreadKey} emailAddress={application.g1_email} />
          </SidebarSection>
        )}

        <div className="pt-2 border-t border-gray-100">
          <p className="text-xs text-gray-400 font-body">
            Submitted on{' '}
            {application.created_at
              ? new Date(application.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '—'}
          </p>
        </div>
      </div>
    </DetailSidebar>
  )
}
