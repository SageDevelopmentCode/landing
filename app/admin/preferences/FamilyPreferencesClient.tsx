'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, UtensilsCrossed } from 'lucide-react'
import type { Activity } from '@/app/actions/activities'
import type { PreferenceEntry } from '@/app/actions/preferences'
import {
  adminSaveActivityPreferences,
  adminSaveSchoolDayFoodPreferences,
  adminSetStudentDefaultPreference,
} from '@/app/actions/adminPreferences'
import type {
  EmergencySnackPreference,
  SharedFoodPreference,
} from '@/app/actions/schoolDayFoodPreferences'
import {
  EMERGENCY_SNACK_OPTIONS,
  SHARED_FOOD_OPTIONS,
} from '@/app/parent/preferences/SchoolDayFoodPreferencesSheet'
import { cssColors as colors, cssShadows as shadows } from '../design-system'
import type {
  FamilyPreferenceData,
  PreferenceChild,
  SchoolDayFoodPreference,
  StudentDefaultPreference,
} from './loadFamilyPreferenceData'

type ParticipationLevel = 'watch' | 'cook_no_eat' | 'full'

type ActivityPreference = {
  level: ParticipationLevel | null
  notes: string
}

type AllPreferences = Record<string, Record<string, ActivityPreference>>

const LEVEL_STYLES: Record<ParticipationLevel, { bg: string; color: string; label: string }> = {
  watch: { bg: 'rgba(100,116,139,0.15)', color: '#64748B', label: 'Watch only' },
  cook_no_eat: { bg: 'rgba(245,158,11,0.15)', color: '#D97706', label: "Cook, don't eat" },
  full: { bg: 'rgba(34,197,94,0.15)', color: '#16A34A', label: 'Full participation' },
}

const LEVELS: { value: ParticipationLevel; label: string }[] = [
  { value: 'watch', label: 'Watch only' },
  { value: 'cook_no_eat', label: "Cook, don't eat" },
  { value: 'full', label: 'Full participation' },
]

function buildInitialPreferences(
  children: PreferenceChild[],
  activities: Activity[],
  savedPreferences: FamilyPreferenceData['savedPreferences'],
  studentDefaults: StudentDefaultPreference[],
): AllPreferences {
  const init: AllPreferences = {}
  for (const child of children) {
    init[child.id] = {}
    const defaultLevel =
      studentDefaults.find((d) => d.student_id === child.id)?.participation_level ?? null
    for (const activity of activities) {
      const saved = savedPreferences.find(
        (s) => s.student_id === child.id && s.activity_id === activity.id,
      )
      init[child.id][activity.id] = saved
        ? { level: saved.participation_level, notes: saved.notes }
        : { level: defaultLevel, notes: '' }
    }
  }
  return init
}

function getVisibleActivities(
  activities: Activity[],
  studentId: string,
  paidDatesByStudent: Record<string, string[]>,
): Activity[] {
  const today = new Date().toISOString().slice(0, 10)
  const paidDates = paidDatesByStudent[studentId] ?? []
  return activities.filter(
    (a) =>
      (!a.activity_date || paidDates.includes(a.activity_date)) &&
      (!a.activity_date || a.activity_date >= today),
  )
}

type Props = {
  effectiveParentId: string
  parentName: string | null
  parentEmail: string | null
  isSharedAccess: boolean
  ownerName: string | null
  data: FamilyPreferenceData
}

export function FamilyPreferencesClient({
  effectiveParentId,
  parentName,
  parentEmail,
  isSharedAccess,
  ownerName,
  data,
}: Props) {
  const {
    children,
    activities,
    paidDatesByStudent,
    savedPreferences,
    studentDefaults: initialStudentDefaults,
    schoolDayFoodPreferences: initialSchoolDayFoodPrefs,
  } = data

  const [selectedChildId, setSelectedChildId] = useState(children[0]?.id ?? '')
  const [defaults, setDefaults] = useState<StudentDefaultPreference[]>(initialStudentDefaults)
  const [schoolDayFoodPrefs, setSchoolDayFoodPrefs] = useState<SchoolDayFoodPreference[]>(
    initialSchoolDayFoodPrefs,
  )
  const [preferences, setPreferences] = useState<AllPreferences>(() =>
    buildInitialPreferences(children, activities, savedPreferences, initialStudentDefaults),
  )
  const [savingDefault, setSavingDefault] = useState(false)
  const [savingFood, setSavingFood] = useState(false)
  const [foodError, setFoodError] = useState<string | null>(null)
  const [savingActivities, setSavingActivities] = useState(false)
  const [activitySaveStatus, setActivitySaveStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const [emergencySnack, setEmergencySnack] = useState<EmergencySnackPreference | ''>('')
  const [sharedFood, setSharedFood] = useState<SharedFoodPreference | ''>('')

  const selectedChild = children.find((c) => c.id === selectedChildId)

  const visibleActivities = useMemo(
    () => getVisibleActivities(activities, selectedChildId, paidDatesByStudent),
    [activities, selectedChildId, paidDatesByStudent],
  )

  const savedActivityIds = useMemo(
    () =>
      new Set(
        savedPreferences
          .filter((s) => s.student_id === selectedChildId)
          .map((s) => s.activity_id),
      ),
    [savedPreferences, selectedChildId],
  )

  function handleSelectChild(childId: string) {
    setSelectedChildId(childId)
    setActivitySaveStatus('idle')
    setFoodError(null)
  }

  useEffect(() => {
    const pref = schoolDayFoodPrefs.find((p) => p.student_id === selectedChildId)
    setEmergencySnack(pref?.emergency_snack_preference ?? '')
    setSharedFood(pref?.shared_food_preference ?? '')
  }, [selectedChildId, schoolDayFoodPrefs])

  async function handleSetDefault(level: ParticipationLevel | null) {
    setSavingDefault(true)
    const result = await adminSetStudentDefaultPreference(
      effectiveParentId,
      selectedChildId,
      level,
    )
    if (!result.error) {
      setDefaults((prev) => {
        const without = prev.filter((d) => d.student_id !== selectedChildId)
        return level !== null
          ? [...without, { student_id: selectedChildId, participation_level: level }]
          : without
      })
      setPreferences((prev) => {
        const updated = { ...prev[selectedChildId] }
        for (const activityId of Object.keys(updated)) {
          if (!savedActivityIds.has(activityId)) {
            updated[activityId] = { ...updated[activityId], level }
          }
        }
        return { ...prev, [selectedChildId]: updated }
      })
    }
    setSavingDefault(false)
  }

  function updatePreference(
    childId: string,
    activityId: string,
    patch: Partial<ActivityPreference>,
  ) {
    setPreferences((prev) => ({
      ...prev,
      [childId]: {
        ...prev[childId],
        [activityId]: {
          ...prev[childId][activityId],
          ...patch,
        },
      },
    }))
    setActivitySaveStatus('idle')
  }

  async function handleSaveFood() {
    if (!emergencySnack || !sharedFood) {
      setFoodError('Select both preferences before saving')
      return
    }
    setSavingFood(true)
    setFoodError(null)
    const result = await adminSaveSchoolDayFoodPreferences(
      effectiveParentId,
      selectedChildId,
      { emergencySnack, sharedFood },
    )
    setSavingFood(false)
    if (result.error) {
      setFoodError(result.error)
      return
    }
    const saved: SchoolDayFoodPreference = {
      student_id: selectedChildId,
      emergency_snack_preference: emergencySnack,
      shared_food_preference: sharedFood,
    }
    setSchoolDayFoodPrefs((prev) => {
      const without = prev.filter((p) => p.student_id !== selectedChildId)
      return [...without, saved]
    })
  }

  async function handleSaveActivities() {
    setSavingActivities(true)
    setActivitySaveStatus('idle')
    const childPrefs = preferences[selectedChildId] ?? {}
    const entries: PreferenceEntry[] = visibleActivities.map((a) => ({
      activityId: a.id,
      level: childPrefs[a.id]?.level ?? null,
      notes: childPrefs[a.id]?.notes ?? '',
    }))
    const result = await adminSaveActivityPreferences(
      effectiveParentId,
      selectedChildId,
      entries,
    )
    setSavingActivities(false)
    setActivitySaveStatus(result.error ? 'error' : 'success')
  }

  const currentDefault = defaults.find((d) => d.student_id === selectedChildId)

  if (children.length === 0) {
    return (
      <div className="rounded-xl p-8 text-center" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
        <p className="text-sm" style={{ color: colors.textTertiary }}>
          No children found for this family.
        </p>
        <Link
          href="/admin/preferences"
          className="inline-flex items-center gap-1.5 text-sm mt-4"
          style={{ color: colors.accent }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to families
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Link
        href="/admin/preferences"
        className="inline-flex items-center gap-1.5 text-sm transition-colors"
        style={{ color: colors.textSecondary }}
      >
        <ArrowLeft className="w-4 h-4" />
        All families
      </Link>

      <div>
        <h1 className="text-xl font-semibold" style={{ color: colors.textPrimary }}>
          {parentName ?? 'Unnamed parent'}
        </h1>
        {parentEmail && (
          <p className="text-sm mt-0.5" style={{ color: colors.textTertiary }}>
            {parentEmail}
          </p>
        )}
        {isSharedAccess && ownerName && (
          <p className="text-xs mt-1" style={{ color: colors.textTertiary }}>
            Shared access · data for {ownerName}
          </p>
        )}
      </div>

      {/* Child tabs */}
      <div className="flex flex-wrap gap-2">
        {children.map((child) => {
          const isActive = child.id === selectedChildId
          return (
            <button
              key={child.id}
              type="button"
              onClick={() => handleSelectChild(child.id)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors"
              style={{
                backgroundColor: isActive ? colors.accentLight : colors.elevated,
                color: isActive ? colors.accent : colors.textSecondary,
                border: `1px solid ${isActive ? colors.accent : colors.border}`,
              }}
            >
              {child.profile_image_url ? (
                <Image
                  src={child.profile_image_url}
                  alt={child.child_legal_name}
                  width={24}
                  height={24}
                  className="rounded-full object-cover"
                />
              ) : (
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold"
                  style={{ backgroundColor: colors.accent, color: '#fff' }}
                >
                  {child.child_legal_name.charAt(0)}
                </span>
              )}
              {child.child_legal_name}
            </button>
          )
        })}
      </div>

      {selectedChild && (
        <div className="space-y-5">
          {/* Auto-fill */}
          <section
            className="rounded-xl p-5"
            style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}`, boxShadow: shadows.soft }}
          >
            <h2 className="text-sm font-semibold mb-1" style={{ color: colors.textPrimary }}>
              Auto-fill default
            </h2>
            <p className="text-xs mb-4" style={{ color: colors.textTertiary }}>
              Pre-selects participation level for new activities for {selectedChild.child_legal_name}.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={currentDefault?.participation_level ?? ''}
                onChange={async (e) => {
                  const val = e.target.value
                  const level = val === '' ? null : (val as ParticipationLevel)
                  await handleSetDefault(level)
                }}
                disabled={savingDefault}
                className="text-xs rounded-lg px-2 py-1.5 outline-none"
                style={{
                  backgroundColor: colors.elevated,
                  border: `1px solid ${colors.border}`,
                  color: colors.textPrimary,
                  minWidth: '180px',
                }}
              >
                <option value="">— Not set —</option>
                {LEVELS.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </select>
              {currentDefault && (
                <span
                  className="inline-flex items-center font-medium rounded-full text-[11px] px-2.5 py-1"
                  style={{
                    backgroundColor: LEVEL_STYLES[currentDefault.participation_level].bg,
                    color: LEVEL_STYLES[currentDefault.participation_level].color,
                  }}
                >
                  Active
                </span>
              )}
            </div>
          </section>

          {/* School day food */}
          <section
            className="rounded-xl p-5"
            style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}`, boxShadow: shadows.soft }}
          >
            <div className="flex items-center gap-2 mb-1">
              <UtensilsCrossed className="w-4 h-4" style={{ color: colors.textSecondary }} />
              <h2 className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
                School day food preferences
              </h2>
            </div>
            <p className="text-xs mb-4" style={{ color: colors.textTertiary }}>
              Backup snacks and shared food during the school day.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: colors.textSecondary }}>
                  Emergency / backup snacks
                </label>
                <select
                  value={emergencySnack}
                  onChange={(e) =>
                    setEmergencySnack(e.target.value as EmergencySnackPreference)
                  }
                  className="w-full text-xs rounded-lg px-2 py-2 outline-none"
                  style={{
                    backgroundColor: colors.elevated,
                    border: `1px solid ${colors.border}`,
                    color: colors.textPrimary,
                  }}
                >
                  <option value="">Select…</option>
                  {EMERGENCY_SNACK_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: colors.textSecondary }}>
                  Shared food from families
                </label>
                <select
                  value={sharedFood}
                  onChange={(e) => setSharedFood(e.target.value as SharedFoodPreference)}
                  className="w-full text-xs rounded-lg px-2 py-2 outline-none"
                  style={{
                    backgroundColor: colors.elevated,
                    border: `1px solid ${colors.border}`,
                    color: colors.textPrimary,
                  }}
                >
                  <option value="">Select…</option>
                  {SHARED_FOOD_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {foodError && (
              <p className="text-xs mt-2" style={{ color: '#EF4444' }}>
                {foodError}
              </p>
            )}
            <button
              type="button"
              onClick={handleSaveFood}
              disabled={savingFood}
              className="mt-4 text-xs font-semibold px-4 py-2 rounded-lg transition-opacity disabled:opacity-50"
              style={{ backgroundColor: colors.accent, color: '#fff' }}
            >
              {savingFood ? 'Saving…' : 'Save school day food'}
            </button>
          </section>

          {/* Activity preferences */}
          <section
            className="rounded-xl p-5"
            style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}`, boxShadow: shadows.soft }}
          >
            <h2 className="text-sm font-semibold mb-1" style={{ color: colors.textPrimary }}>
              Activity preferences
            </h2>
            <p className="text-xs mb-4" style={{ color: colors.textTertiary }}>
              Upcoming activities on days {selectedChild.child_legal_name} is enrolled.
            </p>

            {visibleActivities.length === 0 ? (
              <p className="text-sm py-6 text-center" style={{ color: colors.textTertiary }}>
                No upcoming activities for this child&apos;s scheduled days.
              </p>
            ) : (
              <div className="space-y-4">
                {visibleActivities.map((activity) => {
                  const pref = preferences[selectedChildId]?.[activity.id] ?? {
                    level: null,
                    notes: '',
                  }
                  return (
                    <div
                      key={activity.id}
                      className="rounded-lg p-4"
                      style={{ backgroundColor: colors.elevated, border: `1px solid ${colors.border}` }}
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                            {activity.title}
                          </p>
                          {activity.activity_date && (
                            <p className="text-xs mt-0.5" style={{ color: colors.textTertiary }}>
                              {activity.activity_date}
                            </p>
                          )}
                        </div>
                        {pref.level && (
                          <span
                            className="text-[10px] font-medium rounded-full px-2 py-0.5 shrink-0"
                            style={{
                              backgroundColor: LEVEL_STYLES[pref.level].bg,
                              color: LEVEL_STYLES[pref.level].color,
                            }}
                          >
                            {LEVEL_STYLES[pref.level].label}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {LEVELS.map((l) => {
                          const isActive = pref.level === l.value
                          return (
                            <button
                              key={l.value}
                              type="button"
                              onClick={() =>
                                updatePreference(selectedChildId, activity.id, {
                                  level: isActive ? null : l.value,
                                })
                              }
                              className="text-xs px-3 py-1.5 rounded-lg transition-colors"
                              style={{
                                backgroundColor: isActive ? colors.accentLight : colors.surface,
                                color: isActive ? colors.accent : colors.textSecondary,
                                border: `1px solid ${isActive ? colors.accent : colors.border}`,
                              }}
                            >
                              {l.label}
                            </button>
                          )
                        })}
                      </div>
                      {pref.level !== null && (
                        <textarea
                          value={pref.notes}
                          onChange={(e) =>
                            updatePreference(selectedChildId, activity.id, {
                              notes: e.target.value,
                            })
                          }
                          placeholder="Notes (optional)"
                          rows={2}
                          className="w-full text-xs rounded-lg px-3 py-2 outline-none resize-none"
                          style={{
                            backgroundColor: colors.surface,
                            border: `1px solid ${colors.border}`,
                            color: colors.textPrimary,
                          }}
                        />
                      )}
                    </div>
                  )
                })}

                <div className="flex items-center justify-between pt-2">
                  <div>
                    {activitySaveStatus === 'success' && (
                      <p className="text-xs font-medium" style={{ color: '#16A34A' }}>
                        Activity preferences saved
                      </p>
                    )}
                    {activitySaveStatus === 'error' && (
                      <p className="text-xs" style={{ color: '#EF4444' }}>
                        Failed to save. Try again.
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveActivities}
                    disabled={savingActivities}
                    className="text-xs font-semibold px-4 py-2 rounded-lg transition-opacity disabled:opacity-50"
                    style={{ backgroundColor: colors.accent, color: '#fff' }}
                  >
                    {savingActivities ? 'Saving…' : 'Save activity preferences'}
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
