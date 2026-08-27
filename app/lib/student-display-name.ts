export function getStudentDisplayName(
  preferredName: string | null | undefined,
  legalName: string | null | undefined,
  fallback = "Student",
): string {
  const preferred = preferredName?.trim();
  if (preferred) return preferred;
  return legalName?.trim() || fallback;
}
