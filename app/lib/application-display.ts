const PROGRAM_LABELS: Record<string, string> = {
  summer_26: 'Summer 2026',
  school_year_26_27: 'School Year 2026-2027',
  both: 'Both',
  homeschool_drop_in: 'Homeschool Drop-In',
}

export function formatProgram(value: string | null | undefined): string {
  if (!value) return '—'
  return PROGRAM_LABELS[value] ?? value
}

export function formatDob(
  month: string | null | undefined,
  day: string | null | undefined,
  year: string | null | undefined
): string {
  if (!month || !day || !year) return '—'
  return `${month}/${day}/${year}`
}

export function formatAddress(parts: {
  street?: string | null
  city?: string | null
  state?: string | null
  zip?: string | null
}): string {
  const line = [parts.street, parts.city, parts.state, parts.zip].filter(Boolean).join(', ')
  return line || '—'
}

export function formatBoolean(value: boolean | null | undefined): string {
  if (value === null || value === undefined) return '—'
  return value ? 'Yes' : 'No'
}

export function formatFieldValue(
  value: string | number | boolean | null | undefined
): string {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'boolean') return formatBoolean(value)
  return String(value)
}

export type ApplicationSummaryFields = {
  child_legal_name: string | null
  preferred_name: string | null
  dob_month: string | null
  dob_day: string | null
  dob_year: string | null
  child_age: number | null
  child_grade: string | null
  program: string | null
  drop_in_program?: string | null
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
}

export function getChildDisplayName(app: {
  preferred_name: string | null
  child_legal_name: string | null
}): string {
  return app.preferred_name ?? app.child_legal_name ?? 'Student'
}
